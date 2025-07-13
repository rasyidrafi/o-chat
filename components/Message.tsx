// Clean Message component focused purely on rendering
import React from 'react';
import { ChatMessage } from '../types/chat';
import { User, Sparkles, X } from './Icons';
import { motion } from 'framer-motion';
import TypingIndicator from './TypingIndicator';

interface MessageProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
  animationsDisabled: boolean;
}

const Message: React.FC<MessageProps> = ({ 
  message, 
  isStreaming = false, 
  onStopStreaming, 
  animationsDisabled 
}) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageStyles = () => {
    if (isUser) {
      return 'bg-gradient-to-r from-pink-600 to-purple-600 text-white';
    }
    if (message.isError) {
      return 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
    }
    return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100';
  };

  return (
    <motion.div
      initial={animationsDisabled ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animationsDisabled ? 0 : 0.3 }}
      className={`flex gap-4 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
      
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 ${getMessageStyles()}`}>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
            {isStreaming && !isUser && (
              <span className="inline-block w-0.5 h-4 bg-current opacity-75 animate-pulse ml-1" />
            )}
          </div>
          
          {isStreaming && !isUser && (
            <div className="mt-3 flex items-center justify-between">
              <TypingIndicator />
              {onStopStreaming && (
                <button
                  onClick={onStopStreaming}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                  aria-label="Stop generation"
                >
                  <X className="w-3 h-3" />
                  Stop
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className={`text-xs text-zinc-500 dark:text-zinc-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
          {message.model && isAssistant && (
            <span className="ml-2">• {message.model}</span>
          )}
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center">
            <User className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Message;