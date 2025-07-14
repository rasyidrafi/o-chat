import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Brain } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface ReasoningDisplayProps {
  reasoning: string;
  isReasoningComplete: boolean;
  isStreaming: boolean;
}

const ReasoningDisplay: React.FC<ReasoningDisplayProps> = ({ 
  reasoning, 
  isReasoningComplete, 
  isStreaming 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!reasoning) return null;

  return (
    <div className="mb-3 border border-pink-200 dark:border-pink-800/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 p-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 hover:from-pink-100 hover:to-purple-100 dark:hover:from-pink-900/40 dark:hover:to-purple-900/40 transition-all text-left"
      >
        <Brain className="w-4 h-4 text-pink-600 dark:text-pink-400" />
        <span className="text-sm font-semibold text-pink-800 dark:text-pink-200">
          AI Reasoning
        </span>
        {!isReasoningComplete && isStreaming && (
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-pink-600 dark:bg-pink-400 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-1 bg-pink-600 dark:bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
        <div className="ml-auto">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          )}
        </div>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-auto thin-scrollbar"
            style={{ maxHeight: '300px' }}
          >
            <div className="p-3 bg-white dark:bg-zinc-900 border-t border-pink-200 dark:border-pink-800/50">
              <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {reasoning}
                {!isReasoningComplete && isStreaming && (
                  <span className="inline-block w-0.5 h-4 bg-gradient-to-r from-pink-600 to-purple-600 opacity-75 animate-pulse ml-1" />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReasoningDisplay;
