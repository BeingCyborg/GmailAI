import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeMap = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeMap[size]} rounded-full border-4 border-[#e0e2e0] border-t-[#0b57d0] animate-spin`} />
      {label && (
        <p className="text-sm text-[#444746] animate-pulse font-medium">
          {label}
        </p>
      )}
    </div>
  );
};
