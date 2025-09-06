import React from 'react';
import { themes } from '@/constants/themes';

interface LoadingStateProps {
  message?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  centerContent?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...', 
  subtitle,
  size = 'md',
  className = '',
  centerContent = true
}) => {
  const containerClasses = centerContent 
    ? 'flex flex-col items-center justify-center'
    : 'flex flex-col items-center';

  const textSizeClasses = {
    sm: 'text-[.875rem]',
    md: 'text-[.875rem]', 
    lg: 'text-[.875rem]'
  };

  const spinnerSizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4'
  };

  const spacingClasses = {
    sm: 'mb-2',
    md: 'mb-3',
    lg: 'mb-4'
  };

  return (
    <div className={`${containerClasses} ${className}`}>
      {/* Loading spinner with pink theme colors */}
      <div className={spacingClasses[size]}>
        <div className={`animate-spin ${spinnerSizeClasses[size]} ${themes.special.bgLeftAsBorder} border-t-transparent rounded-full mx-auto`}></div>
      </div>

      {/* Text content */}
      <div className="space-y-1 text-center">
        <span className={`${textSizeClasses[size]} ${themes.sidebar.fgHoverAsFg}`}>
          {message}
        </span>
        {subtitle && (
          <p className={`${size === 'sm' ? 'text-xs' : 'text-sm'} ${themes.sidebar.fg} max-w-xs`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingState;
