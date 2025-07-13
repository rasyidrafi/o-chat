import React, { useState } from 'react';
import { Sparkles, ChevronDown, Globe, Paperclip, ArrowUp } from './Icons';

const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="bg-zinc-200 dark:bg-[#2a2a2a] rounded-xl p-3 shadow-lg">
      <div className="relative">
        <textarea
          value={message}
          onChange={handleTextareaChange}
          placeholder="Type your message here..."
          className="w-full bg-transparent text-zinc-900 dark:text-zinc-200 placeholder-zinc-500 dark:placeholder-zinc-500 resize-none focus:outline-none pl-2 pr-12 pt-2 pb-14 text-sm max-h-48 overflow-y-auto"
          rows={1}
        />
        <button 
          className={`absolute right-2 top-2 p-2 rounded-full transition-colors ${message ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 'bg-zinc-300 dark:bg-zinc-600 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'}`}
          disabled={!message}
          aria-label="Send message"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2 mt-2 pt-2 border-t border-zinc-300 dark:border-zinc-700">
        <div className="flex items-center flex-wrap gap-2">
          <button className="flex items-center gap-1.5 text-sm py-1.5 px-3 rounded-lg bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600 transition-colors">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-zinc-900 dark:text-white">Gemini 2.5 Flash</span>
            <ChevronDown className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
          <button className="flex items-center gap-1.5 text-sm py-1.5 px-3 rounded-lg bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600 transition-colors">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="text-zinc-900 dark:text-white">Search</span>
          </button>
        </div>
        <button className="p-2 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors" aria-label="Attach file">
          <Paperclip className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;