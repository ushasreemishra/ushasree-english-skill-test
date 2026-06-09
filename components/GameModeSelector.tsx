import React from 'react';
import { GameMode } from '../types';

interface GameModeSelectorProps {
  onSelect: (mode: GameMode) => void;
}

const GameModeSelector: React.FC<GameModeSelectorProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-6 my-8">
      <button
        onClick={() => onSelect(GameMode.JUMBLED_WORDS)}
        className="w-64 h-32 text-xl font-bold text-white bg-gradient-to-br from-blue-500 to-teal-400 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out focus:outline-none focus:ring-4 ring-blue-300"
      >
        {GameMode.JUMBLED_WORDS}
      </button>
      <button
        onClick={() => onSelect(GameMode.GRAMMAR_CHALLENGE)}
        className="w-64 h-32 text-xl font-bold text-white bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out focus:outline-none focus:ring-4 ring-pink-300"
      >
        {GameMode.GRAMMAR_CHALLENGE}
      </button>
    </div>
  );
};

export default GameModeSelector;
