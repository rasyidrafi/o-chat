import React from 'react';
import { ChatMessage } from '../types/chat';
import { User, Sparkles, X } from './Icons';
import TypingIndicator from './TypingIndicator';
import LoadingIndicator from './ui/LoadingIndicator';

interface MessageComponentProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
  animationsDisabled?: boolean;
}

const MessageComponent: React.FC<MessageComponentProps> = ({ 
  message, 
  isStreaming = false, 
  onStopStreaming,
  animationsDisabled = false
}) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex gap-3 p-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={`max-w-[70%] ${isUser ? 'order-first' : ''}`}>
        <div className={`rounded-lg px-4 py-3 ${
          isUser 
            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white ml-auto' 
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200'
        }`}>
          {/* Message content */}
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
          
          {/* Streaming indicator for assistant messages */}
          {isAssistant && isStreaming && (
            <div className="mt-2 flex items-center justify-between">
              <TypingIndicator className="text-zinc-500 dark:text-zinc-400" />
              {onStopStreaming && (
                <button
                  onClick={onStopStreaming}
                  className="ml-3 p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  aria-label="Stop generation"
                >
                  <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Message metadata */}
        <div className={`text-xs text-zinc-500 dark:text-zinc-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString()}
          {message.model && !isUser && (
            <span className="ml-2 opacity-70">• {message.model}</span>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center">
          <User className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </div>
      )}
    </div>
  );
};

export default MessageComponent;
