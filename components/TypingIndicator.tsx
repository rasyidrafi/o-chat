import React from 'react';

interface TypingIndicatorProps {
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ className = "" }) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-zinc-500 dark:bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-zinc-500 dark:bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-zinc-500 dark:bg-zinc-400 rounded-full animate-bounce"></div>
      </div>
      <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">AI is typing...</span>
    </div>
  );
};

export default TypingIndicator;
