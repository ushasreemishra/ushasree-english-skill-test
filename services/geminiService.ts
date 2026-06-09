
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Difficulty, type SentenceData, GrammarTopic, GrammarChallengeData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MAX_RETRIES = 5;
const INITIAL_DELAY_MS = 1000;

// Helper to check if the error is a rate limit error.
const isRateLimitError = (error: any): boolean => {
    // The Gemini API client might throw errors whose messages contain the status code.
    const message = error.toString();
    return message.includes('429') || message.includes('RESOURCE_EXHAUSTED');
};

// Wrapper to retry an async function with exponential backoff.
const generateWithRetry = async <T>(apiCall: () => Promise<T>): Promise<T> => {
    let attempts = 0;
    while (true) { // Loop until success or a non-retriable error.
        try {
            return await apiCall();
        } catch (error) {
            attempts++;
            if (isRateLimitError(error) && attempts < MAX_RETRIES) {
                const delay = INITIAL_DELAY_MS * Math.pow(2, attempts - 1);
                console.warn(`Rate limit exceeded. Retrying in ${delay}ms... (Attempt ${attempts}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // After max retries or for other errors, re-throw to be caught by the calling function.
                console.error(`API call failed after ${attempts} attempts.`, error);
                throw error; // Re-throw the last error.
            }
        }
    }
};


const getJumbledPrompt = (level: Difficulty, history: string[]): string => {
    let promptIntro = '';
    switch (level) {
        case Difficulty.EASY:
            promptIntro = 'Generate a very simple English sentence with 4-6 words suitable for a beginner student.';
            break;
        case Difficulty.MODERATE:
            promptIntro = 'Generate a moderately complex English sentence with 7-10 words suitable for an intermediate student.';
            break;
        case Difficulty.HARD:
            promptIntro = 'Generate a complex English sentence with 11-15 words, possibly including a subordinate clause, suitable for an advanced student.';
            break;
    }
    const historyConstraint = history.length > 0
        ? ` To ensure variety, please do not generate a sentence that is identical to any of the following previously used sentences: [${history.join('; ')}].`
        : '';
    return `${promptIntro} Provide the sentence, a jumbled array of its words, and a helpful hint for rearranging them. The hint should guide the user on grammar or sentence structure without giving away the answer directly. Ensure the jumbled words are truly shuffled.${historyConstraint}`;
};

export const generateSentenceData = async (level: Difficulty, history: string[]): Promise<SentenceData> => {
    try {
        // Fix: Explicitly type the response from the Gemini API call to prevent TypeScript from inferring it as 'unknown'.
        const response: GenerateContentResponse = await generateWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: getJumbledPrompt(level, history),
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        sentence: {
                            type: Type.STRING,
                            description: 'The correct, grammatically sound English sentence.'
                        },
                        jumbledWords: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                            },
                            description: 'An array of strings, where each string is a word from the sentence, in a random order.'
                        },
                        hint: {
                            type: Type.STRING,
                            description: 'A constructive hint to help the user form the correct sentence.'
                        }
                    },
                    required: ["sentence", "jumbledWords", "hint"]
                },
            },
        }));
        
        const text = response.text;
        if (!text) {
             throw new Error("Gemini API returned empty text.");
        }
        const jsonString = text.trim();
        const data = JSON.parse(jsonString);

        if (data.sentence && Array.isArray(data.jumbledWords) && data.hint) {
             return {
                sentence: data.sentence.trim(),
                jumbledWords: data.jumbledWords,
                hint: data.hint.trim()
             };
        } else {
            throw new Error("Invalid data structure from API");
        }
    } catch (error) {
        console.error("Error fetching sentence data from Gemini API:", error);
        if (isRateLimitError(error)) {
            throw new Error("The service is currently busy due to high demand. The app tried a few times but failed. Please wait a moment and try again.");
        }
        throw new Error("Failed to generate a new sentence puzzle. Please try again.");
    }
};

const getGrammarPrompt = (level: Difficulty, topic: GrammarTopic, history: string[]): string => {
    const difficultyMap = {
        [Difficulty.EASY]: 'an easy',
        [Difficulty.MODERATE]: 'a moderately difficult',
        [Difficulty.HARD]: 'a difficult',
    }
    const historyConstraint = history.length > 0
        ? ` To ensure variety, please do not generate a challenge sentence that is identical to any of the following previously used sentences: [${history.join('; ')}].`
        : '';

    return `Generate ${difficultyMap[level]} English grammar challenge for a student, focusing on the topic of '${topic}'. The challenge must be a single sentence containing one clear grammatical error related to '${topic}'.
    Provide the following in your response:
    1.  'sentenceWithError': The full sentence with the grammatical error.
    2.  'options': An array of four strings representing multiple-choice options. One of these must be the correct word/phrase to fix the error.
    3.  'correctAnswer': The string that is the correct answer from the options.
    4.  'justification': A brief, clear explanation for why the answer is correct, suitable for a student.${historyConstraint}`;
}

export const generateGrammarChallengeData = async (level: Difficulty, topic: GrammarTopic, history: string[]): Promise<GrammarChallengeData> => {
    try {
        // Fix: Explicitly type the response from the Gemini API call to prevent TypeScript from inferring it as 'unknown'.
        const response: GenerateContentResponse = await generateWithRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: getGrammarPrompt(level, topic, history),
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        sentenceWithError: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswer: { type: Type.STRING },
                        justification: { type: Type.STRING }
                    },
                    required: ["sentenceWithError", "options", "correctAnswer", "justification"]
                },
            },
        }));
        
        const text = response.text;
        if (!text) {
             throw new Error("Gemini API returned empty text.");
        }
        const jsonString = text.trim();
        const data = JSON.parse(jsonString);

        if (data.sentenceWithError && Array.isArray(data.options) && data.correctAnswer && data.justification) {
            return data;
        } else {
            throw new Error("Invalid data structure from API for grammar challenge.");
        }
    } catch (error) {
        console.error("Error fetching grammar data from Gemini API:", error);
         if (isRateLimitError(error)) {
            throw new Error("The service is currently busy due to high demand. The app tried a few times but failed. Please wait a moment and try again.");
        }
        throw new Error("Failed to generate a new grammar challenge. Please try again.");
    }
};
