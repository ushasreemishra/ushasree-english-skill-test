
import React from 'react';

interface WordChipProps {
  word: string;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragging?: boolean;
}

const WordChip: React.FC<WordChipProps> = ({ word, onDragStart, isDragging }) => {
  const colors = [
    'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-pink-400',
    'bg-indigo-400', 'bg-red-400', 'bg-purple-400', 'bg-teal-400'
  ];
  const color = React.useMemo(() => colors[Math.floor(Math.random() * colors.length)], []);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`px-4 py-2 ${color} text-white font-bold rounded-full shadow-lg cursor-grab active:cursor-grabbing transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      {word}
    </div>
  );
};

export default WordChip;
