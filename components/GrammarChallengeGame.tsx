
import React, { useState, useEffect, useCallback } from 'react';
import { Difficulty, GrammarTopic, GrammarChallengeData, FeedbackType } from '../types';
import { generateGrammarChallengeData } from '../services/geminiService';
import { APPRECIATION_MESSAGES } from '../constants';
import FeedbackBanner from './FeedbackBanner';

interface GrammarChallengeGameProps {
  level: Difficulty;
  topic: GrammarTopic;
  onTaskComplete: () => void;
  history: string[];
  onNewChallengeFetched: (sentence: string) => void;
}

const GrammarChallengeGame: React.FC<GrammarChallengeGameProps> = ({ level, topic, onTaskComplete, history, onNewChallengeFetched }) => {
  const [challenge, setChallenge] = useState<GrammarChallengeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: FeedbackType; message: string }>({ type: 'none', message: '' });
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const [answerRevealed, setAnswerRevealed] = useState<boolean>(false);

  const fetchNewChallenge = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFeedback({ type: 'none', message: '' });
    setSelectedOption(null);
    setIsCorrect(false);
    setWrongAttempts(0);
    setAnswerRevealed(false);

    try {
      const data = await generateGrammarChallengeData(level, topic, history);
      setChallenge(data);
      onNewChallengeFetched(data.sentenceWithError);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [level, topic, history, onNewChallengeFetched]);

  useEffect(() => {
    fetchNewChallenge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNextChallenge = useCallback(() => {
    if (isCorrect) {
        onTaskComplete();
    }
    fetchNewChallenge();
  }, [isCorrect, onTaskComplete, fetchNewChallenge]);

  const handleSkip = useCallback(() => {
    fetchNewChallenge();
  }, [fetchNewChallenge]);

  const handleOptionClick = (option: string) => {
    if (isCorrect || answerRevealed || !challenge) return;

    setSelectedOption(option);
    if (option === challenge.correctAnswer) {
      const randomAppreciation = APPRECIATION_MESSAGES[Math.floor(Math.random() * APPRECIATION_MESSAGES.length)];
      setFeedback({ type: 'correct', message: `${randomAppreciation} Justification: ${challenge.justification}` });
      setIsCorrect(true);
    } else {
      const newAttemptCount = wrongAttempts + 1;
      setWrongAttempts(newAttemptCount);
      if (newAttemptCount >= 3) {
          setFeedback({ type: 'incorrect', message: `The correct answer is "${challenge.correctAnswer}". Justification: ${challenge.justification}` });
          setAnswerRevealed(true);
      } else {
        const encouragingMessages = [
            `That's not quite it, but you're on the right track! Think about the role of the ${topic} here.`,
            `Close! Take another look at how the ${topic} is used. You're nearly there.`,
            `Good try! Re-read the sentence carefully and focus on the ${topic}. You can do it!`
        ];
        const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
        setFeedback({ type: 'incorrect', message: `${randomMessage} (${3 - newAttemptCount} attempts left)` });
      }
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center my-10">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500"></div>
        <p className="ml-4 text-lg font-semibold text-gray-600">Crafting a grammar challenge...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center my-10 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  if (!challenge) return null;

  return (
    <div className="space-y-4 flex flex-col items-center">
      <div className="w-full p-6 bg-blue-100/50 border-2 border-blue-300 rounded-2xl shadow-md">
        <div className="text-center mb-4">
            <span className="inline-block bg-purple-200 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
              Topic: {topic}
            </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">Find and correct the mistake:</h3>
        <p className="text-center text-xl text-gray-800 italic">"{challenge.sentenceWithError}"</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {challenge.options.map(option => {
          const isSelected = selectedOption === option;
          const isTheCorrectAnswer = option === challenge.correctAnswer;
          
          let buttonClass = 'bg-white hover:bg-gray-100';

          if (answerRevealed) {
              if (isTheCorrectAnswer) {
                  buttonClass = 'bg-green-500 ring-green-300 text-white'; // Highlight correct answer
              } else {
                  buttonClass = 'bg-gray-300 text-gray-500'; // Dim incorrect options
              }
          } else if (isSelected) {
              buttonClass = isCorrect ? 'bg-green-500 ring-green-300 text-white' : 'bg-red-500 ring-red-300 text-white';
          }

          return (
            <button
              key={option}
              onClick={() => handleOptionClick(option)}
              disabled={isCorrect || answerRevealed}
              className={`w-full p-4 font-semibold rounded-lg shadow-md transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 ${buttonClass} disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-75`}
            >
              {option}
            </button>
          );
        })}
      </div>
      
      <FeedbackBanner type={feedback.type} message={feedback.message} />

      <div className="mt-2">
        {isCorrect || answerRevealed ? (
            <button
              onClick={handleNextChallenge}
              className={`px-8 py-3 bg-gradient-to-r ${isCorrect ? 'from-green-500 to-teal-500' : 'from-orange-500 to-amber-500'} text-white font-bold rounded-full shadow-lg hover:scale-105 transition-transform duration-300`}
            >
              Next Challenge
            </button>
        ) : (
            <button
              onClick={handleSkip}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-full shadow-lg hover:scale-105 transition-transform duration-300"
            >
              Skip Question
            </button>
        )}
      </div>
    </div>
  );
};

export default GrammarChallengeGame;
