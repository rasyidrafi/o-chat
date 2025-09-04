import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'rectangular' | 'text';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'default',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-zinc-200 dark:bg-zinc-700';
  
  const variantClasses = {
    default: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    text: 'rounded-sm'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-200 dark:from-zinc-700 dark:via-zinc-600 dark:to-zinc-700 bg-[length:200%_100%] animate-[wave_1.5s_ease-in-out_infinite]',
    none: ''
  };

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  lineHeight?: string;
  spacing?: string;
}> = ({ 
  lines = 1, 
  className = '', 
  lineHeight = 'h-4',
  spacing = 'space-y-2'
}) => (
  <div className={`${spacing} ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        variant="text"
        className={`${lineHeight} ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);

export const SkeletonAvatar: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 32, className = '' }) => (
  <Skeleton
    variant="circular"
    width={size}
    height={size}
    className={className}
  />
);

export const SkeletonCard: React.FC<{
  showAvatar?: boolean;
  lines?: number;
  className?: string;
}> = ({ 
  showAvatar = false, 
  lines = 2, 
  className = ''
}) => (
  <div className={`p-4 ${className}`}>
    <div className="flex items-start space-x-3">
      {showAvatar && <SkeletonAvatar size={40} />}
      <div className="flex-1">
        <SkeletonText lines={lines} />
      </div>
    </div>
  </div>
);

// Conversation list skeleton specifically for sidebar
export const SkeletonConversation: React.FC<{
  className?: string;
}> = ({ className = '' }) => (
  <div className={`p-2 ${className}`}>
    <div className="flex items-center">
      <div className="flex-1">
        <Skeleton className="h-4 w-full rounded-sm" />
      </div>
    </div>
  </div>
);

export const SkeletonConversationGroup: React.FC<{
  title?: string;
  count?: number;
  className?: string;
}> = ({ 
  title,
  count = 3, 
  className = ''
}) => (
  <div className={`mb-4 last:mb-0 ${className}`}>
    {title && (
      <div className="text-xs text-zinc-700 dark:text-zinc-300/50 mb-2 px-4">
        {title}
      </div>
    )}
    <div className="space-y-0 px-2">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonConversation 
          key={index} 
          className="rounded-lg transition-colors group"
        />
      ))}
    </div>
  </div>
);

export default Skeleton;
