import React from 'react';
import LoadingState from './LoadingState';

interface CentralizedLoadingProps {
  isLoading: boolean;
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CentralizedLoading: React.FC<CentralizedLoadingProps> = ({
  isLoading,
  message = 'Loading...',
  className = '',
  size = 'sm'
}) => {
  if (!isLoading) return null;

  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className}`}>
      <LoadingState 
        message={message} 
        size={size} 
        centerContent={true}
      />
    </div>
  );
};

export default CentralizedLoading;
