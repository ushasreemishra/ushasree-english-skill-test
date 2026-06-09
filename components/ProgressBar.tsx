import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between items-center mb-1">
        <span className="text-base font-bold text-green-800">Your Progress</span>
        <span className="text-sm font-semibold text-green-800 bg-green-100 px-2 py-1 rounded-full">
          {current} / {total} Completed
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner overflow-hidden">
        <div
          className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label="Challenge progress"
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;