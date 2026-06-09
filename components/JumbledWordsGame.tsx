
import React, { useState, useEffect, useCallback } from 'react';
import { Difficulty, type SentenceData, type DraggedItem, FeedbackType } from '../types';
import { generateSentenceData } from '../services/geminiService';
import { APPRECIATION_MESSAGES } from '../constants';
import WordChip from './WordChip';
import FeedbackBanner from './FeedbackBanner';

const DropZone: React.FC<{
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
  title: string;
  minHeight?: string;
  bgClass?: string;
}> = ({ onDrop, onDragOver, children, title, minHeight = 'min-h-[6rem]', bgClass = 'bg-gray-100/50' }) => (
  <div className="w-full">
    <h3 className="text-lg font-bold text-gray-600 mb-2 text-center">{title}</h3>
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      className={`p-4 border-2 border-dashed border-gray-300 rounded-2xl ${minHeight} flex flex-wrap justify-center items-center gap-3 transition-colors duration-300 ${bgClass}`}
    >
      {children}
    </div>
  </div>
);

interface JumbledWordsGameProps {
  level: Difficulty;
  onTaskComplete: () => void;
  history: string[];
  onNewChallengeFetched: (sentence: string) => void;
}

const JumbledWordsGame: React.FC<JumbledWordsGameProps> = ({ level, onTaskComplete, history, onNewChallengeFetched }) => {
  const [sentenceData, setSentenceData] = useState<SentenceData | null>(null);
  const [userSentence, setUserSentence] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: FeedbackType; message: string }>({ type: 'none', message: '' });
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const [answerRevealed, setAnswerRevealed] = useState<boolean>(false);

  const fetchNewSentence = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFeedback({ type: 'none', message: '' });
    setIsCorrect(false);
    setUserSentence([]);
    setWrongAttempts(0);
    setAnswerRevealed(false);

    try {
      const data = await generateSentenceData(level, history);
      setSentenceData(data);
      setAvailableWords(data.jumbledWords);
      onNewChallengeFetched(data.sentence);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [level, history, onNewChallengeFetched]);

  useEffect(() => {
    fetchNewSentence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCompleteAndNext = useCallback(() => {
    onTaskComplete();
    fetchNewSentence();
  }, [onTaskComplete, fetchNewSentence]);

  const handleSkip = useCallback(() => {
    fetchNewSentence();
  }, [fetchNewSentence]);

  const handleCheckAnswer = () => {
    if (!sentenceData) return;
    const userAnswer = userSentence.join(' ').trim();
    const correctAnswer = sentenceData.sentence.replace(/[.,?!]$/, '').trim();
    
    if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
      const randomAppreciation = APPRECIATION_MESSAGES[Math.floor(Math.random() * APPRECIATION_MESSAGES.length)];
      setFeedback({ type: 'correct', message: randomAppreciation });
      setIsCorrect(true);
    } else {
      const newAttemptCount = wrongAttempts + 1;
      setWrongAttempts(newAttemptCount);
      if (newAttemptCount >= 3) {
        setFeedback({ type: 'incorrect', message: `That was a tough one! The correct sentence is: "${sentenceData.sentence}"` });
        setAnswerRevealed(true);
        // Visually show the correct answer
        setUserSentence(sentenceData.sentence.split(' '));
        setAvailableWords([]);
      } else {
        setFeedback({ type: 'incorrect', message: `Not quite! Hint: ${sentenceData.hint} (${3 - newAttemptCount} attempts left)` });
      }
    }
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, word: string, index: number, source: 'available' | 'user') => {
      setDraggedItem({ word, index, source });
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetZone: 'available' | 'user') => {
    e.preventDefault();
    if (!draggedItem || answerRevealed) return;

    const { word, index: fromIndex, source: sourceZone } = draggedItem;

    // Find drop index within the target zone
    const dropZone = e.currentTarget;
    const children = Array.from(dropZone.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement && child.hasAttribute('draggable')
    );
    let toIndex = children.length;

    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const rect = child.getBoundingClientRect();
        if (e.clientX < rect.left + rect.width / 2) {
            toIndex = i;
            break;
        }
    }
    
    // REORDERING LOGIC
    if (sourceZone === targetZone) {
        if (sourceZone === 'user') {
            setUserSentence(prev => {
                const newArr = [...prev];
                const [removed] = newArr.splice(fromIndex, 1);
                newArr.splice(toIndex, 0, removed);
                return newArr;
            });
        } else { // sourceZone === 'available'
            setAvailableWords(prev => {
                const newArr = [...prev];
                const [removed] = newArr.splice(fromIndex, 1);
                newArr.splice(toIndex, 0, removed);
                return newArr;
            });
        }
    } 
    // MOVING BETWEEN ZONES LOGIC
    else {
        if (sourceZone === 'available' && targetZone === 'user') {
            setAvailableWords(prev => prev.filter((_, i) => i !== fromIndex));
            setUserSentence(prev => {
                const newArr = [...prev];
                newArr.splice(toIndex, 0, word);
                return newArr;
            });
        } else if (sourceZone === 'user' && targetZone === 'available') {
            setUserSentence(prev => prev.filter((_, i) => i !== fromIndex));
            setAvailableWords(prev => {
                const newArr = [...prev];
                newArr.splice(toIndex, 0, word);
                return newArr;
            });
        }
    }
    
    setDraggedItem(null);
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center my-10">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500"></div>
        <p className="ml-4 text-lg font-semibold text-gray-600">Generating a new puzzle...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center my-10 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <DropZone
        onDrop={(e) => handleDrop(e, 'user')}
        onDragOver={handleDragOver}
        title="Your Sentence"
        bgClass={isCorrect ? 'bg-green-100/70 border-green-400' : 'bg-blue-100/50 border-blue-300'}
      >
        {userSentence.length > 0 ? (
          userSentence.map((word, index) => (
            <WordChip 
              key={`${word}-${index}`} 
              word={word} 
              onDragStart={(e) => handleDragStart(e, word, index, 'user')} 
            />
          ))
        ) : (
          <span className="text-gray-400">Drag words here</span>
        )}
      </DropZone>

      <DropZone
        onDrop={(e) => handleDrop(e, 'available')}
        onDragOver={handleDragOver}
        title="Jumbled Words"
      >
        {availableWords.map((word, index) => (
          <WordChip 
            key={`${word}-${index}`} 
            word={word} 
            onDragStart={(e) => handleDragStart(e, word, index, 'available')} 
          />
        ))}
      </DropZone>
      
      <FeedbackBanner type={feedback.type} message={feedback.message} />

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-4">
        <button
          onClick={handleCheckAnswer}
          disabled={isCorrect || answerRevealed || userSentence.length === 0}
          className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-full shadow-lg hover:scale-105 transition-transform duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:scale-100"
        >
          Check Answer
        </button>
        {isCorrect ? (
           <button
             onClick={handleCompleteAndNext}
             className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-full shadow-lg hover:scale-105 transition-transform duration-300"
           >
             Next Challenge
           </button>
        ) : answerRevealed ? (
            <button
              onClick={fetchNewSentence}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-full shadow-lg hover:scale-105 transition-transform duration-300"
            >
              Next Challenge
            </button>
        ) : (
          <button
            onClick={handleSkip}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-full shadow-lg hover:scale-105 transition-transform duration-300"
          >
            Skip Question
          </button>
        )}
      </div>
    </div>
  );
};

export default JumbledWordsGame;
