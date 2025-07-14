// Clean Message component focused purely on rendering
import React from 'react';
import { ChatMessage } from '../types/chat';
import { User, Sparkles, X } from './Icons';
import { motion } from 'framer-motion';
import TypingIndicator from './TypingIndicator';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReasoningDisplay from './ReasoningDisplay';

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

  const renderContent = () => {
    if (isUser) {
      return (
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      );
    }

    // For AI responses, render reasoning first then content
    return (
      <div className="space-y-3">
        <ReasoningDisplay 
          reasoning={message.reasoning || ''}
          isReasoningComplete={message.isReasoningComplete || false}
          isStreaming={isStreaming}
        />
        
        <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              // @ts-ignore
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    // @ts-ignore
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-lg !bg-zinc-900 !m-0"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-zinc-200 dark:bg-zinc-700 px-1 py-0.5 rounded text-xs" {...props}>
                    {children}
                  </code>
                );
              },
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="mb-2 last:mb-0 pl-4">{children}</ul>,
              ol: ({ children }) => <ol className="mb-2 last:mb-0 pl-4">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              h1: ({ children }) => <h1 className="text-lg font-semibold mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold mb-2">{children}</h3>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 italic my-2">
                  {children}
                </blockquote>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    );
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
          {renderContent()}
          {isStreaming && !isUser && (
            <span className="inline-block w-0.5 h-4 bg-current opacity-75 animate-pulse ml-1" />
          )}
          
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