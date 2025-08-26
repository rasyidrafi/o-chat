import React, { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, ChevronDown, Paperclip, ArrowUp, Check, X } from "./Icons";
import LoadingIndicator from "./ui/LoadingIndicator";
import HorizontalRuleDefault from "./ui/HorizontalRuleDefault";
import ImageGenerationInput from "./ImageGenerationInput";
import {
  getSystemModels,
  getSystemModelsSync,
  getModelCapabilities,
} from "../services/modelService";
import { DEFAULT_SYSTEM_MODELS, DEFAULT_MODEL_ID } from "../constants/models";
import { ImageUploadService } from "../services/imageUploadService";
import { ImageGenerationService } from "../services/imageGenerationService";
import { MessageAttachment } from "../types/chat";
import { User } from "firebase/auth";

interface ModelOption {
  label: string;
  value: string;
  source: string;
  providerId?: string;
  supportedParameters?: string[];
}

interface ChatInputProps {
  onMessageSend?: (
    message: string,
    model: string,
    source: string,
    providerId?: string,
    attachments?: MessageAttachment[]
  ) => void;
  onImageGenerate?: (
    prompt: string,
    imageUrl: string,
    model: string,
    source: string,
    providerId?: string,
    params?: any
  ) => void;
  onModelSelect?: (model: string, source: string, providerId?: string) => void;
  disabled?: boolean;
  user?: User | null;
}

const ChatInput = ({
  onMessageSend,
  onImageGenerate,
  onModelSelect,
  disabled = false,
  user = null,
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [isLoadingSystemModels, setIsLoadingSystemModels] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [inputMode, setInputMode] = useState<"chat" | "image_generation">(
    "chat"
  );
  const [imagePrompt, setImagePrompt] = useState("");
  const [selectedImageSize, setSelectedImageSize] = useState("1024x1024");
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check if current model supports image generation
  const checkCurrentModelCapabilities = useCallback(
    (options: ModelOption[]) => {
      const currentOption = options.find(
        (model) =>
          model.value === selectedModel &&
          (model.providerId || "") === selectedProviderId
      );

      if (currentOption && currentOption.supportedParameters) {
        const capabilities = getModelCapabilities(
          currentOption.supportedParameters
        );

        // Always switch to image generation mode if model supports it
        if (capabilities.hasImageGeneration) {
          setInputMode("image_generation");
        } else {
          // If model doesn't support image generation, switch back to chat mode
          setInputMode("chat");
        }
      } else {
        setInputMode("chat");
      }
    },
    [selectedModel, selectedProviderId]
  );

  // Check capabilities when selected model changes
  useEffect(() => {
    if (modelOptions.length > 0) {
      checkCurrentModelCapabilities(modelOptions);
    }
  }, [
    selectedModel,
    selectedProviderId,
    modelOptions,
    checkCurrentModelCapabilities,
  ]);

  // Load available models from localStorage
  const loadAvailableModels = useCallback(async () => {
    const options: ModelOption[] = [];

    try {
      setIsLoadingSystemModels(true);

      // Load selected server models from localStorage
      const selectedServerModels = (() => {
        try {
          const stored = localStorage.getItem("selected_server_models");
          return stored ? JSON.parse(stored) : [];
        } catch (error) {
          console.error("Error loading selected server models:", error);
          return [];
        }
      })();

      // First, load cached/fallback models synchronously for immediate display
      const syncSystemModels = getSystemModelsSync();

      // Filter sync system models and add to options immediately
      const filteredSyncSystemModels = syncSystemModels.filter((model) => {
        const isFallbackModel = DEFAULT_SYSTEM_MODELS.some(
          (fallback) => fallback.id === model.id
        );
        if (isFallbackModel) {
          return true;
        }
        // More flexible matching - check both id and name
        return selectedServerModels.some(
          (selected: {
            id: string;
            name: string;
            supported_parameters?: string[];
          }) =>
            selected.id === model.id ||
            selected.name === model.name ||
            selected.id === model.name
        );
      });

      const syncSystemModelOptions = filteredSyncSystemModels.map((model) => {
        // Use stored supported_parameters if available, otherwise fallback to model's parameters
        const storedModel = selectedServerModels.find(
          (selected: {
            id: string;
            name: string;
            supported_parameters?: string[];
          }) =>
            selected.id === model.id ||
            selected.name === model.name ||
            selected.id === model.name
        );
        const supportedParameters =
          storedModel?.supported_parameters || model.supported_parameters || [];

        return {
          label: model.name,
          value: model.id,
          source: "system",
          supportedParameters,
        };
      });
      options.push(...syncSystemModelOptions);

      // Add selected models directly from localStorage if they're not found in system models
      selectedServerModels.forEach(
        (selectedModel: {
          id: string;
          name: string;
          supported_parameters?: string[];
        }) => {
          // Check if this model is already in options
          const existsInOptions = options.some(
            (opt) =>
              opt.value === selectedModel.id || opt.label === selectedModel.name
          );

          if (!existsInOptions) {
            // Add the model directly from localStorage
            options.push({
              label: selectedModel.name,
              value: selectedModel.id,
              source: "system",
              supportedParameters: selectedModel.supported_parameters || [],
            });
          }
        }
      );

      // Set initial options with sync models
      setModelOptions([...options]);

      // Check capabilities for initial load
      checkCurrentModelCapabilities([...options]);

      // Now fetch fresh system models asynchronously
      const systemModels = await getSystemModels();

      // Filter system models to only include selected ones and fallback models
      const filteredSystemModels = systemModels.filter((model) => {
        const isFallbackModel = DEFAULT_SYSTEM_MODELS.some(
          (fallback) => fallback.id === model.id
        );
        if (isFallbackModel) {
          return true;
        }
        // More flexible matching
        return selectedServerModels.some(
          (selected: {
            id: string;
            name: string;
            supported_parameters?: string[];
          }) =>
            selected.id === model.id ||
            selected.name === model.name ||
            selected.id === model.name
        );
      });

      // Replace system models in options array
      const systemModelOptions = filteredSystemModels.map((model) => {
        // Use stored supported_parameters if available, otherwise use fresh model's parameters
        const storedModel = selectedServerModels.find(
          (selected: {
            id: string;
            name: string;
            supported_parameters?: string[];
          }) =>
            selected.id === model.id ||
            selected.name === model.name ||
            selected.id === model.name
        );
        const supportedParameters =
          storedModel?.supported_parameters || model.supported_parameters || [];

        return {
          label: model.name,
          value: model.id,
          source: "system",
          supportedParameters,
        };
      });

      // Clear existing system models and add fresh ones
      const nonSystemOptions = options.filter((opt) => opt.source !== "system");

      // Add fresh system models
      const updatedSystemOptions = [...systemModelOptions];

      // Add any selected models that weren't found in fresh system models
      selectedServerModels.forEach(
        (selectedModel: {
          id: string;
          name: string;
          supported_parameters?: string[];
        }) => {
          const existsInSystemOptions = updatedSystemOptions.some(
            (opt) =>
              opt.value === selectedModel.id || opt.label === selectedModel.name
          );

          if (!existsInSystemOptions) {
            updatedSystemOptions.push({
              label: selectedModel.name,
              value: selectedModel.id,
              source: "system",
              supportedParameters: selectedModel.supported_parameters || [],
            });
          }
        }
      );

      const updatedOptions = [...updatedSystemOptions, ...nonSystemOptions];

      setModelOptions(updatedOptions);

      // Check if current model supports image generation
      checkCurrentModelCapabilities(updatedOptions);
    } catch (error) {
      console.error("Error loading system models:", error);
      // Use the shared constant for fallback models
      const fallbackSystemModels = DEFAULT_SYSTEM_MODELS.map((model) => ({
        label: model.name,
        value: model.id,
        source: "system",
        supportedParameters: model.supported_parameters || [],
      }));

      // Only add fallback if no system models are already present
      const nonSystemOptions = options.filter((opt) => opt.source !== "system");
      const fallbackOptions = [...fallbackSystemModels, ...nonSystemOptions];
      setModelOptions(fallbackOptions);
      checkCurrentModelCapabilities(fallbackOptions);
    } finally {
      setIsLoadingSystemModels(false);
    }

    // Load built-in provider models
    try {
      const builtInProviders = localStorage.getItem("builtin_api_providers");
      if (builtInProviders) {
        const providers = JSON.parse(builtInProviders);
        const builtInOptions: ModelOption[] = [];

        providers.forEach((provider: any) => {
          if (provider.value?.trim()) {
            // Add static models for built-in providers
            if (provider.id === "openai") {
              builtInOptions.push(
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
              builtInOptions.push(
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

        setModelOptions((prev) => [...prev, ...builtInOptions]);
      }
    } catch (error) {
      console.error("Error loading built-in providers:", error);
    }

    // Load custom provider models
    try {
      const customProviders = localStorage.getItem("custom_api_providers");
      if (customProviders) {
        const providers = JSON.parse(customProviders);
        const customOptions: ModelOption[] = [];

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
                    ? models.map((id: string) => ({
                        id,
                        name: id,
                        supported_parameters: [],
                      }))
                    : models;

                modelArray.forEach(
                  (model: {
                    id: string;
                    name: string;
                    supported_parameters?: string[];
                  }) => {
                    customOptions.push({
                      label: `${provider.label} - ${model.name}`,
                      value: model.id,
                      source: "custom",
                      providerId: provider.id,
                      supportedParameters: model.supported_parameters || [],
                    });
                  }
                );
              } catch (error) {
                console.error("Error parsing selected models:", error);
              }
            }
          }
        });

        setModelOptions((prev) => [...prev, ...customOptions]);
      }
    } catch (error) {
      console.error("Error loading custom providers:", error);
    }
  }, [checkCurrentModelCapabilities]);

  // Load models on mount
  useEffect(() => {
    const loadModels = async () => {
      await loadAvailableModels();
    };
    loadModels();
  }, [loadAvailableModels]);

  // Handle image upload
  const handleImageUpload = useCallback(
    async (file: File) => {
      try {
        setIsUploadingImage(true);

        // Validate file
        const validation = ImageUploadService.validateImageFile(file);
        if (!validation.isValid) {
          alert(validation.error);
          return;
        }

        // Upload to Firebase Storage
        const attachment = await ImageUploadService.uploadImage(
          file,
          user?.uid || null
        );
        setAttachments((prev) => [...prev, attachment]);
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image. Please try again.");
      } finally {
        setIsUploadingImage(false);
      }
    },
    [user]
  );

  // Handle paste events for images
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith("image/"));

      if (imageItem) {
        e.preventDefault();
        const file = imageItem.getAsFile();
        if (file) {
          await handleImageUpload(file);
        }
      }
    },
    [handleImageUpload]
  );

  // Handle image generation click
  const handleImageGenerateClick = useCallback(async () => {
    if (!imagePrompt.trim() || disabled || isImageGenerating) return;

    try {
      setIsImageGenerating(true);

      const params = {
        prompt: imagePrompt.trim(),
        model: selectedModel,
        size: selectedImageSize,
        watermark: false,
      };

      const selectedModelOption = modelOptions.find(
        (m) => m.value === selectedModel
      );

      // First, call the parent callback to add loading message
      if (onImageGenerate) {
        onImageGenerate(
          imagePrompt.trim(),
          "", // Empty URL to indicate loading
          selectedModel,
          selectedModelOption?.source || "system",
          selectedModelOption?.providerId,
          {
            ...params,
            isLoading: true,
          }
        );
      }

      try {
        // Generate the image in the background
        const imageUrl = await ImageGenerationService.generateImage(
          params,
          selectedModelOption?.source || "system",
          selectedProviderId,
          user
        );

        // Download and upload the image to Firebase Storage
        const attachment = await ImageGenerationService.downloadAndUploadImage(
          imageUrl,
          imagePrompt.trim(),
          user?.uid || null
        );

        // Call the parent callback again with the final image
        if (onImageGenerate) {
          onImageGenerate(
            imagePrompt.trim(),
            attachment.url,
            selectedModel,
            selectedModelOption?.source || "system",
            selectedModelOption?.providerId,
            {
              ...params,
              attachment,
              isLoading: false,
            }
          );
        }

        // Clear the prompt after successful generation
        setImagePrompt("");
      } catch (generationError: any) {
        console.error("Image generation failed:", generationError);

        // Call the parent callback with error state
        if (onImageGenerate) {
          onImageGenerate(
            imagePrompt.trim(),
            "",
            selectedModel,
            selectedModelOption?.source || "system",
            selectedModelOption?.providerId,
            {
              ...params,
              isLoading: false,
              error: generationError.message || "Image generation failed",
            }
          );
        }

        // Show user-friendly error message
        alert(
          generationError.message ||
            "Failed to generate image. Please try again."
        );
      }
    } catch (error: any) {
      console.error("Error in image generation process:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsImageGenerating(false);
    }
  }, [
    imagePrompt,
    disabled,
    isImageGenerating,
    selectedModel,
    selectedImageSize,
    modelOptions,
    selectedProviderId,
    onImageGenerate,
    user,
  ]);

  // Remove attachment
  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
  }, []);

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
        event.key === "selected_server_models" ||
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
        event.detail.key === "selected_server_models" ||
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

  // Listen for image generation trigger event
  useEffect(() => {
    const handleImageGenerationTrigger = () => {
      if (inputMode === "image_generation") {
        handleImageGenerateClick();
      }
    };

    window.addEventListener(
      "triggerImageGeneration",
      handleImageGenerationTrigger
    );
    return () => {
      window.removeEventListener(
        "triggerImageGeneration",
        handleImageGenerationTrigger
      );
    };
  }, [inputMode, handleImageGenerateClick]);

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

    // Check capabilities of the new model
    checkCurrentModelCapabilities(modelOptions);

    // Notify parent component of model selection
    if (onModelSelect) {
      onModelSelect(option.value, option.source, option.providerId);
    }
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && attachments.length === 0) || disabled) return;

    const currentMessage = message.trim();
    const currentModel = selectedModel;
    const currentAttachments = [...attachments];
    const selectedModelOption = modelOptions.find(
      (model) => model.value === currentModel
    );

    // Clear the input and attachments immediately
    setMessage("");
    setAttachments([]);

    // Call the parent callback if provided
    if (onMessageSend) {
      onMessageSend(
        currentMessage,
        currentModel,
        selectedModelOption?.source || "system",
        selectedModelOption?.providerId,
        currentAttachments
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
      {inputMode === "image_generation" ? (
        <>
          <ImageGenerationInput
            isGenerating={isImageGenerating}
            prompt={imagePrompt}
            onPromptChange={setImagePrompt}
            disabled={disabled}
          />

          {/* Model selector row - exactly like chat mode layout */}
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
                  {isLoadingSystemModels ? (
                    <LoadingIndicator size="sm" color="primary" />
                  ) : (
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 transition-transform duration-200 flex-shrink-0 ${
                        isModelDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>
                {isModelDropdownOpen && (
                  <div className="absolute bottom-full mb-2 left-0 w-64 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md rounded-lg shadow-lg border border-zinc-200/50 dark:border-zinc-700/50 overflow-hidden z-10">
                    <div className="py-1 max-h-48 overflow-y-auto thin-scrollbar">
                      {isLoadingSystemModels &&
                        modelOptions.filter((opt) => opt.source === "system")
                          .length === 0 && (
                          <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                            <LoadingIndicator size="sm" color="primary" />
                            Loading models...
                          </div>
                        )}
                      {modelOptions.map((option) => (
                        <button
                          key={`${option.value}-${
                            option.providerId || "system"
                          }`}
                          onClick={() => handleModelSelect(option)}
                          className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-700/80"
                          title={option.label}
                        >
                          <span className="truncate flex-1 mr-2">
                            {option.label}
                          </span>
                          {selectedModel === option.value &&
                            selectedProviderId ===
                              (option.providerId || "") && (
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
              {/* Size Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                  className="flex items-center gap-2 text-sm py-2 px-3 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 transition-colors min-w-[120px]"
                  disabled={disabled || isImageGenerating}
                >
                  <span className="text-zinc-900 dark:text-white truncate flex-1 text-left">
                    {selectedImageSize}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 transition-transform duration-200 flex-shrink-0 ${
                      isSizeDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isSizeDropdownOpen && (
                  <div className="absolute bottom-full mb-2 left-0 w-48 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md rounded-lg shadow-lg border border-zinc-200/50 dark:border-zinc-700/50 overflow-hidden z-10">
                    <div className="py-1 max-h-48 overflow-y-auto thin-scrollbar">
                      {ImageGenerationService.getImageSizeOptions().map(
                        (option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSelectedImageSize(option.value);
                              setIsSizeDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-700/80"
                          >
                            {option.label}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Button - No loading indicator, just disabled state */}
              <button
                onClick={handleImageGenerateClick}
                className={`p-1.5 rounded-full transition-colors ${
                  imagePrompt.trim() && !disabled && !isImageGenerating
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                    : "bg-zinc-200/80 dark:bg-zinc-600/80 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                }`}
                disabled={!imagePrompt.trim() || disabled || isImageGenerating}
                aria-label={
                  isImageGenerating ? "Generating..." : "Generate image"
                }
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="relative">
            {/* Image attachments preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="relative group bg-zinc-100 dark:bg-zinc-800 rounded-lg p-2 max-w-24"
                  >
                    <img
                      src={attachment.url}
                      alt={attachment.filename}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              placeholder="Type your message here..."
              className="w-full bg-transparent text-zinc-900 dark:text-zinc-200 placeholder-zinc-500 dark:placeholder-zinc-500 resize-none focus:outline-none pl-2 pr-2 pt-1 pb-1 text-sm max-h-32 overflow-y-auto thin-scrollbar"
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
                  {isLoadingSystemModels ? (
                    <LoadingIndicator size="sm" color="primary" />
                  ) : (
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 transition-transform duration-200 flex-shrink-0 ${
                        isModelDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>
                {isModelDropdownOpen && (
                  <div className="absolute bottom-full mb-2 left-0 w-64 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md rounded-lg shadow-lg border border-zinc-200/50 dark:border-zinc-700/50 overflow-hidden z-10">
                    <div className="py-1 max-h-48 overflow-y-auto thin-scrollbar">
                      {isLoadingSystemModels &&
                        modelOptions.filter((opt) => opt.source === "system")
                          .length === 0 && (
                          <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                            <LoadingIndicator size="sm" color="primary" />
                            Loading models...
                          </div>
                        )}
                      {modelOptions.map((option) => (
                        <button
                          key={`${option.value}-${
                            option.providerId || "system"
                          }`}
                          onClick={() => handleModelSelect(option)}
                          className="w-full text-left flex items-center justify-between px-3 py-2 text-sm text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-700/80"
                          title={option.label}
                        >
                          <span className="truncate flex-1 mr-2">
                            {option.label}
                          </span>
                          {selectedModel === option.value &&
                            selectedProviderId ===
                              (option.providerId || "") && (
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
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                      e.target.value = ""; // Reset input
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isUploadingImage}
                />
                <button
                  className="p-1.5 rounded-lg hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-colors relative"
                  aria-label="Attach image"
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <LoadingIndicator size="sm" color="primary" />
                  ) : (
                    <Paperclip className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  )}
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                className={`p-1.5 rounded-full transition-colors ${
                  (message.trim() || attachments.length > 0) &&
                  !disabled &&
                  !isUploadingImage
                    ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700"
                    : "bg-zinc-200/80 dark:bg-zinc-600/80 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                }`}
                disabled={
                  (!message.trim() && attachments.length === 0) ||
                  disabled ||
                  isUploadingImage
                }
                aria-label={disabled ? "Sending..." : "Send message"}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatInput;
