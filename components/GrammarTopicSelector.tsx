import React from 'react';
import { GrammarTopic } from '../types';
import { GRAMMAR_TOPICS } from '../constants';

interface GrammarTopicSelectorProps {
  onSelect: (topic: GrammarTopic) => void;
}

const GrammarTopicSelector: React.FC<GrammarTopicSelectorProps> = ({ onSelect }) => {
  const colors = [
    'bg-red-400 hover:bg-red-500',
    'bg-yellow-400 hover:bg-yellow-500',
    'bg-green-400 hover:bg-green-500',
    'bg-teal-400 hover:bg-teal-500',
    'bg-blue-400 hover:bg-blue-500',
    'bg-indigo-400 hover:bg-indigo-500',
    'bg-purple-400 hover:bg-purple-500',
    'bg-pink-400 hover:bg-pink-500',
    'bg-orange-400 hover:bg-orange-500',
  ];
  
  return (
    <div className="flex flex-wrap justify-center gap-4 my-6">
      {GRAMMAR_TOPICS.map((topic, index) => (
        <button
          key={topic}
          onClick={() => onSelect(topic)}
          className={`px-5 py-3 text-white font-semibold rounded-lg shadow-md transform hover:-translate-y-1 transition-all duration-300 ease-in-out ${colors[index % colors.length]}`}
        >
          {topic}
        </button>
      ))}
    </div>
  );
};

export default GrammarTopicSelector;
