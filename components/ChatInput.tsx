import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronDown, Globe, Paperclip, ArrowUp, Check } from './Icons';
import LoadingIndicator from './ui/LoadingIndicator';

interface ModelOption {
  label: string;
  value: string;
  source: string;
}

interface ChatInputProps {
  onMessageSend?: (message: string, model: string, source: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onMessageSend, 
  disabled = false
} = {}) => {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Available models
  const modelOptions: ModelOption[] = [
    { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash', source: 'system' },
    { label: 'Gemini 1.5 Flash 8B', value: 'gemini-1.5-flash-8b', source: 'system' },
  ];

  const selectedModelLabel = modelOptions.find(model => model.value === selectedModel)?.label || 'Gemini 1.5 Flash';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleModelSelect = (option: ModelOption) => {
    setSelectedModel(option.value);
    setIsModelDropdownOpen(false);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || disabled) return;

    const currentMessage = message.trim();
    const currentModel = selectedModel;
    const selectedModelOption = modelOptions.find(model => model.value === currentModel);

    // Clear the input immediately
    setMessage('');

    // Call the parent callback if provided
    if (onMessageSend) {
      onMessageSend(currentMessage, currentModel, selectedModelOption?.source || 'system');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-zinc-200 dark:bg-[#2a2a2a] rounded-xl p-2 shadow-lg">
      <div className="relative">
        <textarea
          value={message}
          onChange={handleTextareaChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          className="w-full bg-transparent text-zinc-900 dark:text-zinc-200 placeholder-zinc-500 dark:placeholder-zinc-500 resize-none focus:outline-none pl-2 pr-12 pt-1 pb-10 text-sm max-h-32 overflow-y-auto"
          rows={1}
          disabled={disabled}
        />
        <button 
          onClick={handleSendMessage}
          className={`absolute right-1 top-1 p-1.5 rounded-full transition-colors ${
            message && !disabled 
              ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700' 
              : 'bg-zinc-300 dark:bg-zinc-600 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
          }`}
          disabled={!message || disabled}
          aria-label={disabled ? "Sending..." : "Send message"}
        >
          {disabled && message ? (
            <LoadingIndicator size="sm" color="white" />
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
        </button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2 mt-1.5 pt-1.5 border-t border-zinc-300 dark:border-zinc-700">
        <div className="flex items-center flex-wrap gap-2">
          <div ref={dropdownRef} className="relative">
            <button 
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-1.5 text-sm py-1.5 px-3 rounded-lg bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-zinc-900 dark:text-white">{selectedModelLabel}</span>
              <ChevronDown className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isModelDropdownOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden z-10">
                <div className="py-1">
                  {modelOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleModelSelect(option)}
                      className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                      <span>{option.label}</span>
                      {selectedModel === option.value && <Check className="w-4 h-4 text-pink-500" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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