import React from 'react';
import { Difficulty } from '../types';

interface ZoneSelectorProps {
  currentLevel: Difficulty;
  onLevelChange: (level: Difficulty) => void;
  disabled: boolean;
}

const ZoneSelector: React.FC<ZoneSelectorProps> = ({ currentLevel, onLevelChange, disabled }) => {
  const levels = Object.values(Difficulty);

  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 my-6">
      {levels.map((level) => (
        <button
          key={level}
          onClick={() => onLevelChange(level)}
          disabled={disabled}
          className={`w-full sm:w-auto px-6 py-3 text-base font-semibold rounded-full transition-all duration-300 ease-in-out shadow-md transform focus:outline-none focus:ring-4 focus:ring-opacity-50 ${
            currentLevel === level
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white scale-110 ring-purple-400'
              : 'bg-white text-gray-700 hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed'
          }`}
        >
          {level}
        </button>
      ))}
    </div>
  );
};

export default ZoneSelector;
