import React from 'react';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'secondary' | 'white';
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  size = 'md', 
  className = '',
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    primary: 'border-pink-500',
    secondary: 'border-zinc-500',
    white: 'border-white'
  };

  return (
    <div className={`inline-block ${sizeClasses[size]} ${className}`}>
      <div 
        className={`${sizeClasses[size]} border-2 border-transparent border-t-current ${colorClasses[color]} rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingIndicator;
