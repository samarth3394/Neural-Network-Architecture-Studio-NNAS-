import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle' | 'card' | 'table-row';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
  count = 1,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-3.5 w-full rounded bg-slate-800/80';
      case 'circle':
        return 'h-8 w-8 rounded-full bg-slate-800/80';
      case 'card':
        return 'h-28 w-full rounded-md border border-slate-800 bg-slate-900/50 p-4';
      case 'table-row':
        return 'h-10 w-full rounded border border-slate-800/60 bg-slate-900/30';
      case 'rect':
      default:
        return 'h-6 w-full rounded bg-slate-800/80';
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`animate-pulse ${getVariantClasses()} ${className}`}
        />
      ))}
    </>
  );
};
