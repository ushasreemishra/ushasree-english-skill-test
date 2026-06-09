export enum Difficulty {
  EASY = 'Silver Zone (Easy)',
  MODERATE = 'Gold Zone (Moderate)',
  HARD = 'Diamond Zone (Difficult)',
}

export enum GameMode {
  JUMBLED_WORDS = 'Jumbled Words',
  GRAMMAR_CHALLENGE = 'Grammar Challenge',
}

export enum GrammarTopic {
  ARTICLE = 'Article',
  NOUN = 'Noun',
  PRONOUN = 'Pronoun',
  VERB = 'Verb',
  ADVERB = 'Adverb',
  ADJECTIVE = 'Adjective',
  PREPOSITION = 'Preposition',
  CONJUNCTION = 'Conjunction',
  INTERJECTION = 'Interjection',
}

export interface SentenceData {
  sentence: string;
  jumbledWords: string[];
  hint: string;
}

export interface GrammarChallengeData {
  sentenceWithError: string;
  options: string[];
  correctAnswer: string;
  justification: string;
}

export type FeedbackType = 'correct' | 'incorrect' | 'none';

export interface DraggedItem {
  word: string;
  index: number;
  source: 'available' | 'user';
}

export type Screen = 'zone' | 'mode' | 'topic' | 'game';
