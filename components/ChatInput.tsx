import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronDown,
  Paperclip,
  ArrowUp,
  X,
  Search,
  Eye,
  Edit,
  Palette,
  FullScreen,
} from "./Icons";
import LoadingIndicator from "./ui/LoadingIndicator";
import { motion, AnimatePresence } from "framer-motion";
import HorizontalRuleDefault from "./ui/HorizontalRuleDefault";
import {
  getSystemModelsSync,
  getModelCapabilities,
} from "../services/modelService";
import { DEFAULT_SYSTEM_MODELS, DEFAULT_MODEL_ID } from "../constants/models";
import { ImageUploadService } from "../services/imageUploadService";
import { ImageGenerationService } from "../services/imageGenerationService";
import { ImageGenerationJobService } from "../services/imageGenerationJobService";
import { MessageAttachment, ChatConversation } from "../types/chat";
import { useAuth } from "../contexts/AuthContext";

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
  animationsDisabled?: boolean;
  currentConversation?: ChatConversation | null; // Conversation object to get last message model
}

const ChatInput = ({
  onMessageSend,
  onImageGenerate,
  onModelSelect,
  disabled = false,
  animationsDisabled = false,
  currentConversation,
}: ChatInputProps) => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [isLoadingSystemModels, setIsLoadingSystemModels] = useState(false);
  const [isLoadingModelFromConversation, setIsLoadingModelFromConversation] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [inputMode, setInputMode] = useState<"chat" | "image_generation">(
    "chat"
  );
  const [selectedImageSize, setSelectedImageSize] = useState("1024x1024");
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [uploadedImageForEditing, setUploadedImageForEditing] =
    useState<string>("");
  const [persistentUploadedImage, setPersistentUploadedImage] =
    useState<string>(""); // Persists across model switches
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentAttachmentsRef = useRef<MessageAttachment[]>(attachments);
  const isCheckingCapabilitiesRef = useRef(false);
  
  // Track if model selection should be automatic or manual
  const hasAutoSelectedModelRef = useRef(false);
  const userHasManuallySelectedModelRef = useRef(false);
  const lastProcessedConversationIdRef = useRef<string | null>(null);

  // Function to get the last message's model information from conversation
  const getLastMessageModel = useCallback(() => {
    if (!currentConversation || !currentConversation.messages || currentConversation.messages.length === 0) {
      return null;
    }

    // Find the last assistant message that has model info
    for (let i = currentConversation.messages.length - 1; i >= 0; i--) {
      const message = currentConversation.messages[i];
      
      // Check assistant messages first
      if (message.role === 'assistant' && message.model) {
        // Determine source and providerId based on available information
        let source = 'system';
        let providerId = '';
        
        // Check if it has image generation params (which stores original source info)
        if (message.imageGenerationParams) {
          source = message.imageGenerationParams.originalSource || 'system';
          providerId = message.imageGenerationParams.originalProviderId || '';
        } else {
          // For regular chat messages, use source field or deduce from model name
          if (message.source) {
            source = message.source === 'server' ? 'system' : 'custom';
          }
          // If has modelName, it's likely a custom model
          if (message.modelName && message.modelName !== message.model) {
            source = 'custom';
            providerId = message.modelName; // Use modelName as providerId for custom models
          }
        }
        
        return {
          model: message.model,
          source,
          providerId,
        };
      }
      
      // Check user messages for image generation params
      if (message.role === 'user' && message.imageGenerationParams) {
        const params = message.imageGenerationParams;
        if (params.originalSource) {
          // Get the model from the corresponding assistant message or conversation
          const assistantMessage = currentConversation.messages.find(m => 
            m.role === 'assistant' && 
            m.messageType === 'image_generation' &&
            m.imageGenerationParams?.prompt === params.prompt
          );
          
          return {
            model: assistantMessage?.model || currentConversation.model,
            source: params.originalSource,
            providerId: params.originalProviderId || '',
          };
        }
      }
    }

    // If no model info found in messages, check conversation model as fallback
    if (currentConversation.model) {
      return {
        model: currentConversation.model,
        source: currentConversation.source === 'server' ? 'system' : 'custom',
        providerId: '',
      };
    }

    return null;
  }, [currentConversation]);

  // Helper function to reset textarea to single line
  const resetTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      // Simply clear the inline height style and reset rows to 1
      textareaRef.current.style.height = "";
      textareaRef.current.rows = 1;
    }
  }, []);

  // Helper function to clear prompt and reset textarea
  const clearPrompt = useCallback(() => {
    setPrompt("");
    // Reset textarea height immediately
    resetTextareaHeight();
  }, [resetTextareaHeight]);

  // Helper function to manually clear all image data
  const clearAllImages = useCallback(() => {
    setPersistentUploadedImage("");
    setUploadedImageForEditing("");
    setAttachments([]);
  }, []);

  // Get current model capabilities
  const getCurrentModelCapabilities = useCallback(() => {
    const currentOption = modelOptions.find(
      (model) =>
        model.value === selectedModel &&
        (model.providerId || "") === selectedProviderId
    );

    if (currentOption && currentOption.supportedParameters) {
      return getModelCapabilities(currentOption.supportedParameters);
    }
    return null;
  }, [modelOptions, selectedModel, selectedProviderId]);

  // Get capability icons for a model (can return multiple icons)
  const getCapabilityIcons = useCallback((option: ModelOption) => {
    if (!option.supportedParameters) return [];

    const capabilities = getModelCapabilities(option.supportedParameters);
    const icons = [];

    if (capabilities.hasImageEditing) {
      icons.push(
        <div key="edit" title="Image Editing">
          <Edit className="w-4 h-4 text-blue-500" />
        </div>
      );
    }

    if (
      capabilities.hasImageGeneration ||
      capabilities.hasImageGenerationJobs
    ) {
      icons.push(
        <div key="generation" title="Image Generation">
          <Palette className="w-4 h-4 text-purple-500" />
        </div>
      );
    }

    if (capabilities.hasVision) {
      icons.push(
        <div key="vision" title="Vision">
          <Eye className="w-4 h-4 text-green-500" />
        </div>
      );
    }

    return icons;
  }, []);

  // Check if current model supports image generation
  const checkCurrentModelCapabilities = useCallback(
    (options: ModelOption[]) => {
      // Prevent concurrent calls
      if (isCheckingCapabilitiesRef.current) return;
      isCheckingCapabilitiesRef.current = true;

      try {
        const currentOption = options.find(
          (model) =>
            model.value === selectedModel &&
            (model.providerId || "") === selectedProviderId
        );

        if (currentOption && currentOption.supportedParameters) {
          const capabilities = getModelCapabilities(
            currentOption.supportedParameters
          );

          // Priority 1: If model has image editing, switch to image_generation mode
          if (capabilities.hasImageEditing) {
            setInputMode("image_generation");
            // Convert attachments to persistent image for image editing models
            if (
              currentAttachmentsRef.current.length > 0 &&
              !persistentUploadedImage
            ) {
              const firstAttachment = currentAttachmentsRef.current[0];
              setPersistentUploadedImage(firstAttachment.url);
              setUploadedImageForEditing(firstAttachment.url);
              // Clear attachments since we're switching to image editing mode
              setAttachments([]);
            }
            // If we already have a persistent image, make sure it's active for editing
            else if (persistentUploadedImage && !uploadedImageForEditing) {
              setUploadedImageForEditing(persistentUploadedImage);
            }
          }
          // Priority 2: If model has image generation (including jobs), switch to image_generation mode
          else if (
            capabilities.hasImageGeneration ||
            capabilities.hasImageGenerationJobs
          ) {
            setInputMode("image_generation");
            // Hide any uploaded images for generation-only models (they don't support image input)
            setUploadedImageForEditing("");
            // Clear attachments for generation mode but don't trigger dependency loop
            if (currentAttachmentsRef.current.length > 0) {
              setAttachments([]);
            }
          }
          // Priority 3: If model has vision, stay in chat mode
          else if (capabilities.hasVision) {
            setInputMode("chat");
            // Convert persistent image to attachments for vision models
            if (
              persistentUploadedImage &&
              currentAttachmentsRef.current.length === 0
            ) {
              const visionAttachment: MessageAttachment = {
                id: Date.now().toString(),
                url: persistentUploadedImage,
                filename: "uploaded_image",
                type: "image" as const,
                size: 0,
                mimeType: "image/png",
              };
              setAttachments([visionAttachment]);
              // Clear editing state since we're using vision mode
              setUploadedImageForEditing("");
            }
          }
          // Priority 4: For models without any image capabilities, stay in chat mode
          else {
            setInputMode("chat");
            // Clear all image data for non-image models
            setUploadedImageForEditing("");
            if (currentAttachmentsRef.current.length > 0) {
              setAttachments([]);
            }
            // Keep persistent image for when user switches back to capable model
          }
        } else {
          setInputMode("chat");
        }
      } finally {
        // Always reset the flag
        isCheckingCapabilitiesRef.current = false;
      }
    },
    [
      selectedModel,
      selectedProviderId,
      persistentUploadedImage,
      uploadedImageForEditing,
    ]
  );

  // Check capabilities when selected model changes - but debounce to avoid loops
  useEffect(() => {
    if (modelOptions.length > 0) {
      const timeoutId = setTimeout(() => {
        checkCurrentModelCapabilities(modelOptions);
      }, 0); // Use setTimeout to break potential synchronous loops

      return () => clearTimeout(timeoutId);
    }
  }, [
    selectedModel,
    selectedProviderId,
    modelOptions,
    checkCurrentModelCapabilities,
  ]);

  // Load available models from localStorage only (no API calls)
  const loadAvailableModels = useCallback(() => {
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

      // Load cached system models synchronously (no API call)
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

          options.push(...builtInOptions);
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

          options.push(...customOptions);
        }
      } catch (error) {
        console.error("Error loading custom providers:", error);
      }

      // Set final options with localStorage data only
      setModelOptions([...options]);

      // Check capabilities for loaded models
      checkCurrentModelCapabilities([...options]);
    } catch (error) {
      console.error("Error loading models from localStorage:", error);
      // Use the shared constant for fallback models
      const fallbackSystemModels = DEFAULT_SYSTEM_MODELS.map((model) => ({
        label: model.name,
        value: model.id,
        source: "system",
        supportedParameters: model.supported_parameters || [],
      }));

      setModelOptions(fallbackSystemModels);
      checkCurrentModelCapabilities(fallbackSystemModels);
    } finally {
      setIsLoadingSystemModels(false);
    }
  }, [checkCurrentModelCapabilities]);

  // Load models on mount
  useEffect(() => {
    loadAvailableModels();
  }, [loadAvailableModels]);

  // Effect to update model selection when conversation changes
  useEffect(() => {
    if (!currentConversation || modelOptions.length === 0) return;

    const conversationId = currentConversation.id;
    
    // Check if this is a new conversation or if we haven't auto-selected for this conversation yet
    const isNewConversation = lastProcessedConversationIdRef.current !== conversationId;
    
    // Only auto-select model if:
    // 1. It's a new conversation AND 
    // 2. User hasn't manually selected a model for this conversation yet
    if (!isNewConversation && userHasManuallySelectedModelRef.current) {
      // User has manually selected a model for this conversation, don't override
      return;
    }

    const lastMessageModelInfo = getLastMessageModel();
    if (!lastMessageModelInfo) {
      // Update the processed conversation ID even if no model info found
      lastProcessedConversationIdRef.current = conversationId;
      return;
    }

    const { model, source, providerId } = lastMessageModelInfo;
    
    // Check if the model from the conversation is different from currently selected
    const isDifferentModel = selectedModel !== model || 
                            selectedProviderId !== (providerId || '');

    // console.log('Model auto-selection check:', {
    //   conversation: conversationId,
    //   isNewConversation,
    //   userManuallySelected: userHasManuallySelectedModelRef.current,
    //   lastModel: { model, source, providerId },
    //   currentModel: { selectedModel, selectedProviderId },
    //   isDifferent: isDifferentModel
    // });

    if (isDifferentModel) {
      // Set loading state
      setIsLoadingModelFromConversation(true);

      // Check if the model exists in our available models
      const modelExists = modelOptions.some(option => 
        option.value === model && 
        (option.providerId || '') === (providerId || '') &&
        option.source === source
      );

      // console.log('Model exists in options:', modelExists);

      if (modelExists) {
        // Model exists, select it
        setSelectedModel(model);
        setSelectedProviderId(providerId || '');
        
        // Mark that we've auto-selected for this conversation
        hasAutoSelectedModelRef.current = true;
        
        // Notify parent component
        if (onModelSelect) {
          onModelSelect(model, source, providerId);
        }
      } else {
        // Model doesn't exist, fallback to default
        const fallbackModel = DEFAULT_MODEL_ID;
        // console.log('Model not found, falling back to:', fallbackModel);
        setSelectedModel(fallbackModel);
        setSelectedProviderId('');
        
        if (onModelSelect) {
          onModelSelect(fallbackModel, 'system', '');
        }
      }

      // Clear loading state
      setTimeout(() => {
        setIsLoadingModelFromConversation(false);
      }, 300); // Small delay to show loading state
    }

    // Update the processed conversation ID
    lastProcessedConversationIdRef.current = conversationId;
    
    // Reset manual selection flag for new conversations
    if (isNewConversation) {
      userHasManuallySelectedModelRef.current = false;
    }
  }, [currentConversation, modelOptions, selectedModel, selectedProviderId, getLastMessageModel, onModelSelect]);

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

        // Check current model capabilities
        const selectedModelOption = modelOptions.find(
          (model) =>
            model.value === selectedModel &&
            (model.providerId || "") === selectedProviderId
        );

        if (selectedModelOption && selectedModelOption.supportedParameters) {
          const capabilities = getModelCapabilities(
            selectedModelOption.supportedParameters
          );

          // Only allow image upload if model supports image input (vision or image editing)
          // Image generation only models don't support image input
          if (!capabilities.hasVision && !capabilities.hasImageEditing) {
            alert(
              "Selected model doesn't support image input. Please choose a model with vision or image editing capabilities."
            );
            return;
          }

          // Upload to Firebase Storage
          const attachment = await ImageUploadService.uploadImage(
            file,
            user?.uid || null,
            file.name
          );

          // Always save to persistent storage first
          setPersistentUploadedImage(attachment.url);

          // Then route based on current model capabilities
          // Priority 1: If model has image editing, store for editing (will be in image_generation mode)
          if (capabilities.hasImageEditing) {
            setUploadedImageForEditing(attachment.url);
            // Clear any existing attachments since we're using image editing mode
            setAttachments([]);
          }
          // Priority 2: If model has vision (but not image editing), add to attachments (chat mode)
          else if (capabilities.hasVision) {
            setAttachments((prev) => [...prev, attachment]);
            // Clear editing state since we're using vision mode
            setUploadedImageForEditing("");
          }
          // Note: Image generation only models are blocked above, so no need to handle them
        } else {
          // Fallback: add to attachments if no capability info available
          const attachment = await ImageUploadService.uploadImage(
            file,
            user?.uid || null,
            file.name
          );
          setAttachments((prev) => [...prev, attachment]);

          // Also store in persistent image in case user switches to image editing model later
          setPersistentUploadedImage(attachment.url);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image. Please try again.");
      } finally {
        setIsUploadingImage(false);
      }
    },
    [
      user,
      modelOptions,
      selectedModel,
      selectedProviderId,
      inputMode,
      persistentUploadedImage,
    ]
  );

  // Handle paste events for images in image generation mode
  const handleImagePasteInGeneration = useCallback(
    async (file: File) => {
      // Check current model capabilities before allowing paste
      const capabilities = getCurrentModelCapabilities();

      // Only allow paste for image editing models (generation-only models don't support image input)
      if (!capabilities || !capabilities.hasImageEditing) {
        // Don't show alert, just silently ignore paste for non-supported models
        return;
      }

      await handleImageUpload(file);
    },
    [handleImageUpload, getCurrentModelCapabilities]
  );

  // Unified paste handler for both modes
  const handleUnifiedPaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith("image/"));

      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          if (inputMode === "chat") {
            // Use chat mode logic
            const capabilities = getCurrentModelCapabilities();
            if (!capabilities || (!capabilities.hasVision && !capabilities.hasImageEditing)) {
              return; // Silently ignore
            }
            e.preventDefault();
            await handleImageUpload(file);
          } else {
            // Use image generation mode logic
            e.preventDefault();
            await handleImagePasteInGeneration(file);
          }
        }
      }
    },
    [inputMode, getCurrentModelCapabilities, handleImageUpload, handleImagePasteInGeneration]
  );

  // Handle image generation click
  const handleImageGenerateClick = useCallback(async () => {
    if (!prompt.trim() || disabled || isImageGenerating) return;

    const localImagePrompt = prompt.trim();

    try {
      setIsImageGenerating(true);

      const params = {
        prompt: localImagePrompt,
        model: selectedModel,
        size: selectedImageSize,
        watermark: false,
        ...(uploadedImageForEditing && { image: uploadedImageForEditing }), // Include uploaded image if available
      };

      const selectedModelOption = modelOptions.find(
        (m) => m.value === selectedModel
      );

      // Check if model supports job-based generation or editing
      const capabilities = getCurrentModelCapabilities();
      const useJobBasedGeneration =
        capabilities &&
        (capabilities.hasImageGenerationJobs ||
          (capabilities.hasImageEditing &&
            capabilities.hasImageGenerationJobs &&
            uploadedImageForEditing));

      // clear prompt input
      clearPrompt();

      try {
        if (useJobBasedGeneration) {
          // For job-based generation, show immediate loading first
          if (onImageGenerate) {
            onImageGenerate(
              localImagePrompt,
              "", // Empty URL for jobs
              selectedModel,
              selectedModelOption?.source || "system",
              selectedModelOption?.providerId,
              {
                ...params,
                isLoading: true,
                isAsyncJob: true,
                job: null, // No job data yet - will be added when created
              }
            );
          }

          // Then create the job asynchronously
          const job = await ImageGenerationJobService.createImageGenerationJob(
            params,
            selectedModelOption?.source || "system",
            selectedModelOption?.providerId,
            user
          );

          // Update with job data - this will trigger job polling
          if (onImageGenerate) {
            onImageGenerate(
              localImagePrompt,
              "", // Empty URL for jobs
              selectedModel,
              selectedModelOption?.source || "system",
              selectedModelOption?.providerId,
              {
                ...params,
                isLoading: true,
                isAsyncJob: true,
                job: job,
                isJobUpdate: true, // Flag to indicate this is a job update
              }
            );
          }
        } else {
          // Use regular image generation
          // First, show loading state
          if (onImageGenerate) {
            onImageGenerate(
              localImagePrompt,
              "", // Empty URL for loading
              selectedModel,
              selectedModelOption?.source || "system",
              selectedModelOption?.providerId,
              {
                ...params,
                isLoading: true,
                isAsyncJob: false,
              }
            );
          }

          // Then generate the image
          const imageUrl = await ImageGenerationService.generateImage(
            params,
            selectedModelOption?.source || "system",
            selectedModelOption?.providerId,
            user
          );

          // Download and upload the image to Firebase Storage
          const attachment =
            await ImageGenerationService.downloadAndUploadImage(
              imageUrl,
              localImagePrompt,
              user?.uid || null
            );

          // Call the parent callback again with the final image
          if (onImageGenerate) {
            onImageGenerate(
              localImagePrompt,
              attachment.url,
              selectedModel,
              selectedModelOption?.source || "system",
              selectedModelOption?.providerId,
              {
                ...params,
                attachment,
                isLoading: false,
                isAsyncJob: false,
              }
            );
          }
        }

        // Clear the prompt and images after successful generation/job creation
        clearPrompt();
        clearAllImages();
      } catch (generationError: any) {
        console.error("Image generation failed:", generationError);

        // Call the parent callback with error state
        if (onImageGenerate) {
          onImageGenerate(
            localImagePrompt,
            "",
            selectedModel,
            selectedModelOption?.source || "system",
            selectedModelOption?.providerId,
            {
              ...params,
              isLoading: false,
              isAsyncJob: useJobBasedGeneration,
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
    prompt,
    disabled,
    isImageGenerating,
    selectedModel,
    selectedImageSize,
    modelOptions,
    selectedProviderId,
    onImageGenerate,
    user,
    uploadedImageForEditing,
    getCurrentModelCapabilities,
  ]);

  // Remove attachment
  const removeAttachment = useCallback(
    (attachmentId: string) => {
      setAttachments((prev) => {
        const newAttachments = prev.filter((att) => att.id !== attachmentId);

        // If this was the last attachment and it matches our persistent image, clear everything
        const removedAttachment = prev.find((att) => att.id === attachmentId);
        if (
          removedAttachment &&
          removedAttachment.url === persistentUploadedImage &&
          newAttachments.length === 0
        ) {
          setPersistentUploadedImage("");
          setUploadedImageForEditing("");
        }

        return newAttachments;
      });
    },
    [persistentUploadedImage]
  );

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

  const selectedModelLabel = isLoadingModelFromConversation 
    ? "Loading model..."
    : (modelOptions.find((model) => model.value === selectedModel)?.label || "Gemini 1.5 Flash");

  // Animation transition class helper
  const transitionClass = animationsDisabled
    ? ""
    : "transition-transform duration-200";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsModelDropdownOpen(false);
        setModelSearchQuery(""); // Clear search when closing
      }
      if (
        sizeDropdownRef.current &&
        !sizeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSizeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // Initialize textarea to single line height on mount
  useEffect(() => {
    if (textareaRef.current) {
      resetTextareaHeight();
    }
  }, [resetTextareaHeight]);

  // Update ref when attachments change
  useEffect(() => {
    currentAttachmentsRef.current = attachments;
  }, [attachments]);

  const handleModelSelect = (option: ModelOption) => {
    setSelectedModel(option.value);
    setSelectedProviderId(option.providerId || "");
    setIsModelDropdownOpen(false);
    setModelSearchQuery(""); // Clear search when selecting

    // Mark that user has manually selected a model
    userHasManuallySelectedModelRef.current = true;

    // Check capabilities of the new model
    checkCurrentModelCapabilities(modelOptions);

    // Notify parent component of model selection
    if (onModelSelect) {
      onModelSelect(option.value, option.source, option.providerId);
    }
  };

  const handleSendMessage = async () => {
    const capabilities = getCurrentModelCapabilities();

    // Different send conditions based on mode and capabilities
    if (inputMode === "image_generation") {
      // For image generation mode
      if (capabilities?.hasImageEditing) {
        // Image editing models: need both prompt AND image
        if (!prompt.trim() || !persistentUploadedImage) return;
      } else {
        // Pure image generation models: only need prompt (no image support)
        if (!prompt.trim()) return;
      }
    } else {
      // For chat mode (vision models or regular chat)
      if (capabilities?.hasVision) {
        // Vision models: need prompt or attachments
        if (!prompt.trim() && attachments.length === 0) return;
      } else {
        // Regular chat: just need prompt
        if (!prompt.trim()) return;
      }
    }

    if (disabled) return;

    // Handle image generation mode
    if (inputMode === "image_generation") {
      await handleImageGenerateClick();
      return;
    }

    // Handle chat mode
    const currentMessage = prompt.trim();
    const currentModel = selectedModel;
    const currentAttachments = [...attachments];
    const currentImageForEditing = persistentUploadedImage;
    const selectedModelOption = modelOptions.find(
      (model) => model.value === currentModel
    );

    // Clear the input, attachments, and all image data immediately when sending
    clearPrompt();
    setAttachments([]);
    setPersistentUploadedImage(""); // Clear persistent storage when sending
    setUploadedImageForEditing(""); // Clear active editing image

    // Call the parent callback if provided
    if (onMessageSend) {
      // For image editing models in chat mode, pass the image URL as a special parameter
      if (capabilities?.hasImageEditing && currentImageForEditing) {
        // Create a special attachment-like object but with image editing flag
        const imageEditingData: MessageAttachment = {
          id: Date.now().toString(),
          url: currentImageForEditing,
          filename: "image_for_editing",
          type: "image" as const,
          size: 0,
          mimeType: "image/png", // Default mime type for uploaded images
          isForEditing: true, // Special flag to distinguish from regular attachments
        };

        onMessageSend(
          currentMessage,
          currentModel,
          selectedModelOption?.source || "system",
          selectedModelOption?.providerId,
          [imageEditingData] // Pass as single-item array with special flag
        );
      } else {
        // For vision models or models without image capabilities, use regular attachments
        onMessageSend(
          currentMessage,
          currentModel,
          selectedModelOption?.source || "system",
          selectedModelOption?.providerId,
          currentAttachments
        );
      }
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
      className="bg-zinc-200/80 dark:bg-zinc-800/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-3 rounded-3xl w-full
        sm:rounded-3xl
        rounded-t-3xl rounded-b-none
        shadow-[0_-8px_32px_-4px_rgba(0,0,0,0.12),0_-4px_16px_-2px_rgba(0,0,0,0.08)]
        dark:shadow-[0_-8px_32px_-4px_rgba(0,0,0,0.3),0_-4px_16px_-2px_rgba(0,0,0,0.2)]
      "
    >
      {/* Image Preview Section */}
      {inputMode === "image_generation" && uploadedImageForEditing && (
        <div className="mb-3">
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            <span>Image ready for editing:</span>
          </div>
          <div className="relative group inline-block">
            <img
              src={uploadedImageForEditing}
              alt="Image for editing"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
            />
            <button
              onClick={clearAllImages}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {inputMode === "chat" && attachments.length > 0 && (
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

      {inputMode === "chat" &&
        persistentUploadedImage &&
        attachments.length === 0 &&
        (() => {
          const capabilities = getCurrentModelCapabilities();
          return capabilities?.hasVision && !capabilities?.hasImageEditing;
        })() && (
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-1 w-full">
              <span>Image ready for vision analysis:</span>
            </div>
            <div className="relative group bg-zinc-100 dark:bg-zinc-800 rounded-lg p-2 max-w-24">
              <img
                src={persistentUploadedImage}
                alt="Image for vision"
                className="w-16 h-16 object-cover rounded"
              />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                <span className="text-[8px]">👁️</span>
              </div>
              <button
                onClick={clearAllImages}
                className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

      {/* Text Input */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={handleTextareaChange}
          onKeyPress={handleKeyPress}
          onPaste={handleUnifiedPaste}
          placeholder={
            inputMode === "image_generation"
              ? "Describe the image you want to generate..."
              : "Type your message here..."
          }
          className="w-full bg-transparent text-zinc-900 dark:text-zinc-200 placeholder-zinc-500 dark:placeholder-zinc-500 resize-none focus:outline-none pl-2 pr-2 pt-1 pb-1 text-sm max-h-32 overflow-y-auto thin-scrollbar"
          rows={1}
        />
      </div>

      <HorizontalRuleDefault />

      {/* Controls Section */}
      <div className="flex items-stretch justify-between flex-wrap gap-2 mt-2">
        <div className="flex items-stretch flex-wrap gap-2">
          {/* Model Selector */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => {
                if (isLoadingSystemModels || isLoadingModelFromConversation) return;
                setIsModelDropdownOpen(!isModelDropdownOpen);
              }}
              className={`flex items-center gap-2 text-sm py-2 px-2.5 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 transition-colors w-32 sm:w-48`}
            >
              <span className="text-zinc-900 dark:text-white truncate flex-1 text-left">
                {selectedModelLabel}
              </span>
              {isLoadingSystemModels || isLoadingModelFromConversation ? (
                <LoadingIndicator size="sm" color="primary" />
              ) : (
                <ChevronDown
                  className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 ${transitionClass} flex-shrink-0 ${
                    isModelDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>
            <AnimatePresence>
              {isModelDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: animationsDisabled ? 0 : 0.15 }}
                  className="absolute bottom-full mb-2 left-0 w-[calc(100vw-2rem)] sm:w-80 max-w-80 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden z-10"
                >
                  {/* Search Input */}
                  <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Search models..."
                        value={modelSearchQuery}
                        onChange={(e) => setModelSearchQuery(e.target.value)}
                        className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg py-2 pl-10 pr-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Model Options */}
                  <div
                    className="max-h-64 overflow-y-auto thin-scrollbar"
                    style={{
                      maskImage:
                        "linear-gradient(to bottom, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)",
                    }}
                  >
                    <div className="py-1">
                      {isLoadingSystemModels &&
                        modelOptions.filter((opt) => opt.source === "system").length === 0 && (
                          <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                            <LoadingIndicator size="sm" color="primary" />
                            Loading models...
                          </div>
                        )}
                      {modelOptions
                        .filter((option) =>
                          option.label.toLowerCase().includes(modelSearchQuery.toLowerCase())
                        )
                        .map((option) => {
                          const isSelected =
                            selectedModel === option.value &&
                            selectedProviderId === (option.providerId || "");
                          return (
                            <button
                              key={`${option.value}-${option.providerId || "system"}`}
                              onClick={() => handleModelSelect(option)}
                              className={`w-full text-left flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                                isSelected
                                  ? "bg-pink-100/80 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
                                  : "text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-700/80"
                              }`}
                              title={option.label}
                            >
                              <span className="truncate flex-1 mr-2">{option.label}</span>
                              <div className="flex items-center gap-2">
                                {getCapabilityIcons(option)}
                              </div>
                            </button>
                          );
                        })}
                      {modelOptions.filter((option) =>
                        option.label.toLowerCase().includes(modelSearchQuery.toLowerCase())
                      ).length === 0 &&
                        modelSearchQuery && (
                          <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 text-center">
                            No models found matching "{modelSearchQuery}"
                          </div>
                        )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-stretch gap-1">
          {/* Upload button - show for image editing in generation mode or vision in chat mode */}
          {(() => {
            const capabilities = getCurrentModelCapabilities();
            return (
              capabilities &&
              ((inputMode === "image_generation" && capabilities.hasImageEditing) ||
                (inputMode === "chat" && capabilities.hasVision && !capabilities.hasImageEditing))
            );
          })() && (
            <div className="relative hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 transition-colors rounded-lg flex items-center py-2 px-2.5 rounded-lg">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file);
                    e.target.value = "";
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isUploadingImage}
              />
              <button
                className="transition-colors relative flex items-center"
                aria-label="Upload image"
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <LoadingIndicator size="sm" color="primary" />
                ) : (
                  <Paperclip className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                )}
              </button>
            </div>
          )}

          {/* Size Selector - only show in image generation mode */}
          {inputMode === "image_generation" && (
            <div ref={sizeDropdownRef} className="flex items-stretch relative">
              <button
                onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                className="flex items-center gap-2 text-sm py-2 px-2.5 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 transition-colors min-w-[44px] sm:min-w-[120px]"
                disabled={disabled || isImageGenerating}
                title={selectedImageSize}
              >
                <FullScreen className="w-4 h-4 text-zinc-500 dark:text-zinc-400 sm:hidden flex-shrink-0" />
                <span className="text-zinc-900 dark:text-white truncate flex-1 text-left hidden sm:block">
                  {selectedImageSize}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 ${transitionClass} flex-shrink-0 ${
                    isSizeDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {isSizeDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: animationsDisabled ? 0 : 0.15 }}
                    className="absolute bottom-full mb-2 right-0 w-[calc(100vw-2rem)] max-w-[160px] sm:left-0 sm:w-40 sm:max-w-none bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden z-10"
                  >
                    <div className="py-1 max-h-48 overflow-y-auto thin-scrollbar">
                      {ImageGenerationService.getImageSizeOptions().map((option) => {
                        const isSelected = selectedImageSize === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSelectedImageSize(option.value);
                              setIsSizeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                              isSelected
                                ? "bg-pink-100/80 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
                                : "text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-700/80"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Send/Generate Button */}
          <button
            onClick={handleSendMessage}
            className={`py-1.5 px-2.5 rounded-lg flex items-center transition-colors ${
              (() => {
                const capabilities = getCurrentModelCapabilities();
                if (inputMode === "image_generation") {
                  if (capabilities?.hasImageEditing) {
                    return prompt.trim() && uploadedImageForEditing && !disabled && !isImageGenerating;
                  } else {
                    return prompt.trim() && !disabled && !isImageGenerating;
                  }
                } else {
                  if (capabilities?.hasVision) {
                    return (prompt.trim() || attachments.length > 0) && !disabled && !isUploadingImage;
                  } else {
                    return prompt.trim() && !disabled && !isUploadingImage;
                  }
                }
              })()
                ? inputMode === "image_generation"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                  : "bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700"
                : "bg-zinc-200/80 dark:bg-zinc-600/80 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
            }`}
            disabled={(() => {
              const capabilities = getCurrentModelCapabilities();
              if (inputMode === "image_generation") {
                if (capabilities?.hasImageEditing) {
                  return !prompt.trim() || !uploadedImageForEditing || disabled || isImageGenerating;
                } else {
                  return !prompt.trim() || disabled || isImageGenerating;
                }
              } else {
                if (capabilities?.hasVision) {
                  return (!prompt.trim() && attachments.length === 0) || disabled || isUploadingImage;
                } else {
                  return !prompt.trim() || disabled || isUploadingImage;
                }
              }
            })()}
            aria-label={
              inputMode === "image_generation"
                ? isImageGenerating
                  ? "Generating..."
                  : "Generate image"
                : disabled
                ? "Sending..."
                : "Send message"
            }
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
