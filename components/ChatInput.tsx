import React, { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, ChevronDown, Paperclip, ArrowUp, Check } from "./Icons";
import LoadingIndicator from "./ui/LoadingIndicator";
import HorizontalRuleDefault from "./ui/HorizontalRuleDefault";

interface ModelOption {
  label: string;
  value: string;
  source: string;
  providerId?: string;
}

interface ChatInputProps {
  onMessageSend?: (
    message: string,
    model: string,
    source: string,
    providerId?: string
  ) => void;
  onModelSelect?: (model: string, source: string, providerId?: string) => void;
  disabled?: boolean;
}

const ChatInput = ({
  onMessageSend,
  onModelSelect,
  disabled = false,
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] =
    useState<string>("gemini-1.5-flash");
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load available models from localStorage
  const loadAvailableModels = useCallback(() => {
    const options: ModelOption[] = [];

    // Always include system models (from our servers)
    const systemModels = [
      {
        label: "Gemini 1.5 Flash",
        value: "gemini-1.5-flash",
        source: "system",
      },
      {
        label: "Gemini 1.5 Flash 8B",
        value: "gemini-1.5-flash-8b",
        source: "system",
      },
    ];
    options.push(...systemModels);

    // Load built-in provider models
    try {
      const builtInProviders = localStorage.getItem("builtin_api_providers");
      if (builtInProviders) {
        const providers = JSON.parse(builtInProviders);
        providers.forEach((provider: any) => {
          if (provider.value?.trim()) {
            // Add static models for built-in providers
            if (provider.id === "openai") {
              options.push(
                {
                  label: "GPT-4",
                  value: "gpt-4",
                  source: "builtin",
                  providerId: provider.id,
                },
                {
                  label: "GPT-3.5 Turbo",
                  value: "gpt-3.5-turbo",
                  source: "builtin",
                  providerId: provider.id,
                }
              );
            } else if (provider.id === "anthropic") {
              options.push(
                {
                  label: "Claude 3 Sonnet",
                  value: "claude-3-sonnet-20240229",
                  source: "builtin",
                  providerId: provider.id,
                },
                {
                  label: "Claude 3 Haiku",
                  value: "claude-3-haiku-20240307",
                  source: "builtin",
                  providerId: provider.id,
                }
              );
            }
          }
        });
      }
    } catch (error) {
      console.error("Error loading built-in providers:", error);
    }

    // Load custom provider models
    try {
      const customProviders = localStorage.getItem("custom_api_providers");
      if (customProviders) {
        const providers = JSON.parse(customProviders);
        providers.forEach((provider: any) => {
          if (
            provider.label?.trim() &&
            provider.value?.trim() &&
            provider.base_url?.trim()
          ) {
            // Check if this provider has selected models
            const providerModelsKey = `models_${provider.id}`;
            const selectedModels = localStorage.getItem(providerModelsKey);
            if (selectedModels) {
              try {
                const models = JSON.parse(selectedModels);
                // Handle both legacy format (array of strings) and new format (array of objects)
                const modelArray =
                  models.length > 0 && typeof models[0] === "string"
                    ? models.map((id: string) => ({ id, name: id }))
                    : models;

                modelArray.forEach((model: { id: string; name: string }) => {
                  options.push({
                    label: `${provider.label} - ${model.name}`,
                    value: model.id,
                    source: "custom",
                    providerId: provider.id,
                  });
                });
              } catch (error) {
                console.error("Error parsing selected models:", error);
              }
            }
          }
        });
      }
    } catch (error) {
      console.error("Error loading custom providers:", error);
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
      const currentOption = modelOptions.find(
        (model) => model.value === selectedModel
      );
      if (currentOption) {
        onModelSelect(
          currentOption.value,
          currentOption.source,
          currentOption.providerId
        );
      }
    }
  }, [modelOptions, selectedModel, onModelSelect]);

  // Listen for localStorage changes to refresh models
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Check if the change is related to models or providers
      if (
        event.key === "builtin_api_providers" ||
        event.key === "custom_api_providers" ||
        event.key?.startsWith("models_")
      ) {
        loadAvailableModels();
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener("storage", handleStorageChange);

    // Create a custom event for same-tab localStorage changes
    const handleCustomStorageChange = (event: CustomEvent) => {
      if (
        event.detail.key === "builtin_api_providers" ||
        event.detail.key === "custom_api_providers" ||
        event.detail.key?.startsWith("models_")
      ) {
        loadAvailableModels();
      }
    };

    window.addEventListener(
      "localStorageChange",
      handleCustomStorageChange as EventListener
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "localStorageChange",
        handleCustomStorageChange as EventListener
      );
    };
  }, [loadAvailableModels]);

  const selectedModelLabel =
    modelOptions.find((model) => model.value === selectedModel)?.label ||
    "Gemini 1.5 Flash";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleModelSelect = (option: ModelOption) => {
    setSelectedModel(option.value);
    setSelectedProviderId(option.providerId || "");
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
    const selectedModelOption = modelOptions.find(
      (model) => model.value === currentModel
    );

    // Clear the input immediately
    setMessage("");

    // Call the parent callback if provided
    if (onMessageSend) {
      onMessageSend(
        currentMessage,
        currentModel,
        selectedModelOption?.source || "system",
        selectedModelOption?.providerId
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      className="bg-white/80 dark:bg-[#1c1c1c]/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-3 rounded-2xl w-full
        sm:rounded-2xl
        rounded-t-2xl rounded-b-none
        shadow-[0_-8px_32px_-4px_rgba(0,0,0,0.12),0_-4px_16px_-2px_rgba(0,0,0,0.08)]
        dark:shadow-[0_-8px_32px_-4px_rgba(0,0,0,0.3),0_-4px_16px_-2px_rgba(0,0,0,0.2)]
      "
    >
      <div className="relative">
        <textarea
          value={message}
          onChange={handleTextareaChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          className="w-full bg-transparent text-zinc-900 dark:text-zinc-200 placeholder-zinc-500 dark:placeholder-zinc-500 resize-none focus:outline-none pl-2 pr-2 pt-1 pb-1 text-sm max-h-24 overflow-y-auto thin-scrollbar"
          rows={1}
          disabled={disabled}
        />
      </div>
      <HorizontalRuleDefault />
      <div className="flex items-center justify-between flex-wrap gap-2 mt-2">
        <div className="flex items-center flex-wrap gap-2">
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-2 text-sm py-2 px-3 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 transition-colors w-48"
            >
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span className="text-zinc-900 dark:text-white truncate flex-1 text-left">
                {selectedModelLabel}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 transition-transform duration-200 flex-shrink-0 ${
                  isModelDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isModelDropdownOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-64 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md rounded-lg shadow-lg border border-zinc-200/50 dark:border-zinc-700/50 overflow-hidden z-10">
                <div className="py-1 max-h-48 overflow-y-auto thin-scrollbar overscroll-none">
                  {modelOptions.map((option) => (
                    <button
                      key={`${option.value}-${option.providerId || "system"}`}
                      onClick={() => handleModelSelect(option)}
                      className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-700/80"
                      title={option.label}
                    >
                      <span className="truncate flex-1 mr-2">
                        {option.label}
                      </span>
                      {selectedModel === option.value &&
                        selectedProviderId === (option.providerId || "") && (
                          <Check className="w-4 h-4 text-pink-500 flex-shrink-0" />
                        )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-1.5 rounded-lg hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-colors"
            aria-label="Attach file"
          >
            <Paperclip className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
          <button
            onClick={handleSendMessage}
            className={`p-1.5 rounded-full transition-colors ${
              message.trim() && !disabled
                ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700"
                : "bg-zinc-200/80 dark:bg-zinc-600/80 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
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
