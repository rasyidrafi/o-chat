import React from 'react';
import LoadingIndicator from './LoadingIndicator';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  centerContent?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...', 
  size = 'md',
  className = '',
  centerContent = true
}) => {
  const containerClasses = centerContent 
    ? 'flex flex-col items-center justify-center'
    : 'flex flex-col items-center';

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm', 
    lg: 'text-base'
  };

  const spacingClasses = {
    sm: 'mb-2',
    md: 'mb-3',
    lg: 'mb-4'
  };

  return (
    <div className={`${containerClasses} text-zinc-500 dark:text-zinc-400 ${className}`}>
      <LoadingIndicator 
        size={size} 
        color="primary" 
        className={spacingClasses[size]}
      />
      <div className={textSizeClasses[size]}>{message}</div>
    </div>
  );
};

export default LoadingState;
