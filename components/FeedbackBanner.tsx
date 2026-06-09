
import React from 'react';
import { FeedbackType } from '../types';

interface FeedbackBannerProps {
  type: FeedbackType;
  message: string;
}

const FeedbackBanner: React.FC<FeedbackBannerProps> = ({ type, message }) => {
  if (type === 'none') return null;

  const baseClasses = 'mt-4 p-4 rounded-lg text-white font-semibold text-center shadow-lg transition-all duration-500 ease-in-out transform';
  
  const typeClasses = {
    correct: 'bg-gradient-to-r from-green-400 to-teal-500',
    incorrect: 'bg-gradient-to-r from-red-400 to-orange-500',
    none: 'hidden'
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} animate-fade-in`}>
      <p>{message}</p>
    </div>
  );
};

export default FeedbackBanner;
