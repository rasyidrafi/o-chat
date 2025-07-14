import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, ChevronDown, Globe, Paperclip, ArrowUp, Check } from './Icons';
import LoadingIndicator from './ui/LoadingIndicator';

interface ModelOption {
  label: string;
  value: string;
  source: string;
  providerId?: string;
}

interface ChatInputProps {
  onMessageSend?: (message: string, model: string, source: string, providerId?: string) => void;
  onModelSelect?: (model: string, source: string, providerId?: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onMessageSend, 
  onModelSelect,
  disabled = false
} = {}) => {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load available models from localStorage
  const loadAvailableModels = useCallback(() => {
    const options: ModelOption[] = [];

    // Always include system models (from our servers)
    const systemModels = [
      { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash', source: 'system' },
      { label: 'Gemini 1.5 Flash 8B', value: 'gemini-1.5-flash-8b', source: 'system' },
    ];
    options.push(...systemModels);

    // Load built-in provider models
    try {
      const builtInProviders = localStorage.getItem('builtin_api_providers');
      if (builtInProviders) {
        const providers = JSON.parse(builtInProviders);
        providers.forEach((provider: any) => {
          if (provider.value?.trim()) {
            // Add static models for built-in providers
            if (provider.id === 'openai') {
              options.push(
                { label: 'GPT-4', value: 'gpt-4', source: 'builtin', providerId: provider.id },
                { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo', source: 'builtin', providerId: provider.id }
              );
            } else if (provider.id === 'anthropic') {
              options.push(
                { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229', source: 'builtin', providerId: provider.id },
                { label: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307', source: 'builtin', providerId: provider.id }
              );
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading built-in providers:', error);
    }

    // Load custom provider models
    try {
      const customProviders = localStorage.getItem('custom_api_providers');
      if (customProviders) {
        const providers = JSON.parse(customProviders);
        providers.forEach((provider: any) => {
          if (provider.label?.trim() && provider.value?.trim() && provider.base_url?.trim()) {
            // Check if this provider has selected models
            const providerModelsKey = `models_${provider.id}`;
            const selectedModels = localStorage.getItem(providerModelsKey);
            if (selectedModels) {
              try {
                const modelIds = JSON.parse(selectedModels);
                // For now, add generic models - in a real app, you'd fetch these from the provider
                modelIds.forEach((modelId: string) => {
                  options.push({
                    label: `${provider.label} - ${modelId}`,
                    value: modelId,
                    source: 'custom',
                    providerId: provider.id
                  });
                });
              } catch (error) {
                console.error('Error parsing selected models:', error);
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading custom providers:', error);
    }

    setModelOptions(options);
  }, []);

  // Load models on mount
  useEffect(() => {
    loadAvailableModels();
  }, [loadAvailableModels]);

  // Notify parent of initial model selection
  useEffect(() => {
    if (modelOptions.length > 0 && onModelSelect) {
      const currentOption = modelOptions.find(model => model.value === selectedModel);
      if (currentOption) {
        onModelSelect(currentOption.value, currentOption.source, currentOption.providerId);
      }
    }
  }, [modelOptions, selectedModel, onModelSelect]);

  // Listen for localStorage changes to refresh models
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Check if the change is related to models or providers
      if (event.key === 'builtin_api_providers' || 
          event.key === 'custom_api_providers' || 
          event.key?.startsWith('models_')) {
        loadAvailableModels();
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Create a custom event for same-tab localStorage changes
    const handleCustomStorageChange = (event: CustomEvent) => {
      if (event.detail.key === 'builtin_api_providers' || 
          event.detail.key === 'custom_api_providers' || 
          event.detail.key?.startsWith('models_')) {
        loadAvailableModels();
      }
    };

    window.addEventListener('localStorageChange', handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange as EventListener);
    };
  }, [loadAvailableModels]);

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
    setSelectedProviderId(option.providerId || '');
    setIsModelDropdownOpen(false);
    
    // Notify parent component of model selection
    if (onModelSelect) {
      onModelSelect(option.value, option.source, option.providerId);
    }
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
      onMessageSend(
        currentMessage, 
        currentModel, 
        selectedModelOption?.source || 'system',
        selectedModelOption?.providerId
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-zinc-200 dark:bg-[#2a2a2a] rounded-t-xl p-2 shadow-lg">
      <div className="relative">
        <textarea
          value={message}
          onChange={handleTextareaChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          className="w-full bg-transparent text-zinc-900 dark:text-zinc-200 placeholder-zinc-500 dark:placeholder-zinc-500 resize-none focus:outline-none pl-2 pr-2 pt-2 pb-2 text-sm max-h-32 overflow-y-auto thin-scrollbar"
          rows={3}
          disabled={disabled}
        />
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2 mt-1.5 pt-1.5 border-t border-zinc-300 dark:border-zinc-700">
        <div className="flex items-center flex-wrap gap-2">
          <div ref={dropdownRef} className="relative">
            <button 
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-1.5 text-sm py-1.5 px-3 rounded-lg bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600 transition-colors w-48"
            >
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span className="text-zinc-900 dark:text-white truncate flex-1 text-left">{selectedModelLabel}</span>
              <ChevronDown className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 transition-transform duration-200 flex-shrink-0 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isModelDropdownOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden z-10">
                <div className="py-1 max-h-48 overflow-y-auto thin-scrollbar">
                  {modelOptions.map(option => (
                    <button
                      key={`${option.value}-${option.providerId || 'system'}`}
                      onClick={() => handleModelSelect(option)}
                      className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      title={option.label}
                    >
                      <span className="truncate flex-1 mr-2">{option.label}</span>
                      {selectedModel === option.value && selectedProviderId === (option.providerId || '') && <Check className="w-4 h-4 text-pink-500 flex-shrink-0" />}
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
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors" aria-label="Attach file">
            <Paperclip className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </button>
          <button 
            onClick={handleSendMessage}
            className={`p-1.5 rounded-full transition-colors ${
              message.trim() && !disabled 
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700' 
                : 'bg-zinc-300 dark:bg-zinc-600 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
            }`}
            disabled={!message.trim() || disabled}
            aria-label={disabled ? "Sending..." : "Send message"}
          >
            {disabled && message ? (
              <LoadingIndicator size="sm" color="white" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;