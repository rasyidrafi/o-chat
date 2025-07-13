import React from 'react';
import LoadingIndicator from './ui/LoadingIndicator';

interface ChatLoadingProps {
  message?: string;
}

const ChatLoading: React.FC<ChatLoadingProps> = ({ 
  message = "Loading conversation..." 
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <LoadingIndicator size="lg" />
        <div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-200 mb-1">
            {message}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Please wait a moment
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatLoading;
