import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronDown,
  Paperclip,
  ArrowUp,
  X,
  Search,
  Eye,
  Edit,
  Gallery,
  FullScreen,
  Brain,
} from "./Icons";
import { motion, AnimatePresence } from "framer-motion";
// import HorizontalRuleDefault from "./ui/HorizontalRuleDefault";
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
import { useSettingsContext } from "@/contexts/SettingsContext";
import { useLocalStorageData } from "../hooks/useLocalStorageData";
import { themes } from "@/constants/themes";
import LoadingState from "./ui/LoadingState";

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
  currentConversation?: ChatConversation | null;
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
  const { saveLastSelectedModel, loadLastSelectedModel } = useLocalStorageData();
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [isLoadingSystemModels, setIsLoadingSystemModels] = useState(false);
  const [isLoadingModelFromConversation, setIsLoadingModelFromConversation] =
    useState(false);
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
  const { isMobile } = useSettingsContext();

  // Track if model selection should be automatic or manual
  const hasAutoSelectedModelRef = useRef(false);
  const userHasManuallySelectedModelRef = useRef(false);
  const lastProcessedConversationIdRef = useRef<string | null>(null);

  // Function to get the last message's model information from conversation
  const getLastMessageModel = useCallback(() => {
    if (
      !currentConversation ||
      !currentConversation.messages ||
      currentConversation.messages.length === 0
    ) {
      return null;
    }

    // Find the last assistant message that has model info
    for (let i = currentConversation.messages.length - 1; i >= 0; i--) {
      const message = currentConversation.messages[i];

      // Check assistant messages first
      if (message.role === "assistant" && message.model) {
        // Determine source and providerId based on available information
        let source = "system";
        let providerId = "";

        // Check if it has image generation params (which stores original source info)
        if (message.imageGenerationParams) {
          source = message.imageGenerationParams.originalSource || "system";
          providerId = message.imageGenerationParams.originalProviderId || "";
        } else {
          // For regular chat messages, use source field or deduce from model name
          if (message.source) {
            source = message.source === "server" ? "system" : "custom";
          }
          // If has modelName, it's likely a custom model
          if (message.modelName && message.modelName !== message.model) {
            source = "custom";
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
      if (message.role === "user" && message.imageGenerationParams) {
        const params = message.imageGenerationParams;
        if (params.originalSource) {
          // Get the model from the corresponding assistant message or conversation
          const assistantMessage = currentConversation.messages.find(
            (m) =>
              m.role === "assistant" &&
              m.messageType === "image_generation" &&
              m.imageGenerationParams?.prompt === params.prompt
          );

          return {
            model: assistantMessage?.model || currentConversation.model,
            source: params.originalSource,
            providerId: params.originalProviderId || "",
          };
        }
      }
    }

    // If no model info found in messages, check conversation model as fallback
    if (currentConversation.model) {
      return {
        model: currentConversation.model,
        source: currentConversation.source === "server" ? "system" : "custom",
        providerId: "",
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
        <div key="edit" title="Image Editing" className={`${themes.disabled.bg} rounded p-1`}>
          <Edit className="w-3 h-3" />
        </div>
      );
    }

    if (
      capabilities.hasImageGeneration ||
      capabilities.hasImageGenerationJobs
    ) {
      icons.push(
        <div key="generation" title="Image Generation" className={`${themes.disabled.bg} rounded p-1`}>
          <Gallery className="w-3 h-3" />
        </div>
      );
    }

    if (capabilities.hasVision) {
      icons.push(
        <div key="vision" title="Vision" className={`${themes.disabled.bg} rounded p-1`}>
          <Eye className="w-3 h-3" />
        </div>
      );
    }

    if (capabilities.hasReasoning) {
      icons.push(
        <div key="reasoning" title="Reasoning" className={`${themes.disabled.bg} rounded p-1`}>
          <Brain className="w-3 h-3" />
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

      // Set final options with localStorage data only (sorted alphabetically)
      const sortedOptions = [...options].sort((a, b) => a.label.localeCompare(b.label));
      setModelOptions(sortedOptions);

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

      const sortedFallbackModels = fallbackSystemModels.sort((a, b) => a.label.localeCompare(b.label));
      setModelOptions(sortedFallbackModels);
      checkCurrentModelCapabilities(sortedFallbackModels);
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
    const isNewConversation =
      lastProcessedConversationIdRef.current !== conversationId;

    const lastMessageModelInfo = getLastMessageModel();
    if (!lastMessageModelInfo) {
      // Update the processed conversation ID even if no model info found
      lastProcessedConversationIdRef.current = conversationId;
      return;
    }

    const { model, source, providerId } = lastMessageModelInfo;

    // Check if the model from the conversation is different from currently selected
    const isDifferentModel =
      selectedModel !== model || selectedProviderId !== (providerId || "");

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
      const modelExists = modelOptions.some((option) => {
        let found = true;
        if (selectedProviderId) {
          if (!option?.providerId) return false;
          found =
            found && (option.providerId || "") === (selectedProviderId || "");
        }

        found = found && option.value === model;
        return found;
      });

      // console.log('Model exists in options:', modelExists);

      if (modelExists) {
        // Model exists, select it
        setSelectedModel(model);
        setSelectedProviderId(providerId || "");

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
        setSelectedProviderId("");

        if (onModelSelect) {
          onModelSelect(fallbackModel, "system", "");
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
  }, [
    currentConversation,
    modelOptions,
    selectedModel,
    selectedProviderId,
    getLastMessageModel,
    onModelSelect,
  ]);

  // Effect to load last selected model for new chats only
  useEffect(() => {
    // Only load from localStorage for new chats (no current conversation)
    if (modelOptions.length === 0 || currentConversation) return;

    const savedModelData = loadLastSelectedModel();
    if (savedModelData) {
      const { model, source, providerId } = savedModelData;
      // Check if the saved model exists in current options
      const modelExists = modelOptions.some((opt) =>
        opt.value === model &&
        opt.source === source &&
        (opt.providerId || "") === (providerId || "")
      );
      if (modelExists) {
        setSelectedModel(model);
        setSelectedProviderId(providerId || "");
        // Don't mark as manually selected for localStorage loading
        // This allows conversations to override with their last message model
        // userHasManuallySelectedModelRef.current = true;

        // Notify parent component
        if (onModelSelect) {
          onModelSelect(model, source, providerId);
        }
      }
    }
  }, [modelOptions, currentConversation, loadLastSelectedModel, onModelSelect]);

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
            if (
              !capabilities ||
              (!capabilities.hasVision && !capabilities.hasImageEditing)
            ) {
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
    [
      inputMode,
      getCurrentModelCapabilities,
      handleImageUpload,
      handleImagePasteInGeneration,
    ]
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
    : modelOptions.find((model) => model.value === selectedModel)?.label ||
      "Gemini 1.5 Flash";

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

    // Save manually selected model to localStorage
    const modelData = {
      model: option.value,
      source: option.source,
      providerId: option.providerId || "",
    };
    saveLastSelectedModel(modelData);

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
      className={`${
        isMobile ? themes.chatview.inputBg : themes.chatview.inputBgTransparent
      } ${
        themes.chatview.border
      } md:backdrop-blur-md border-1 p-3 rounded-3xl w-full sm:rounded-3xl rounded-t-3xl rounded-b-none shadow-sm`}
    >
      {/* Image Preview Section */}
      {inputMode === "image_generation" && uploadedImageForEditing && (
        <div className="mb-2 flex overflow-x-auto gap-2 thin-scrollbar">
          <div
            className={`relative group inline-block rounded-lg max-w-24 ${themes.message.backdrop}`}
          >
            <img
              src={uploadedImageForEditing}
              alt="Image for editing"
              className="w-20 h-20 object-cover rounded-lg"
            />
            <button
              onClick={clearAllImages}
              className="cursor-pointer absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {inputMode === "chat" && attachments.length > 0 && (
        <div className="mb-2 flex overflow-x-auto gap-2 thin-scrollbar">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className={`relative group inline-block rounded-lg max-w-24 ${themes.message.backdrop}`}
            >
              <img
                src={attachment.url}
                alt={attachment.filename}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="cursor-pointer absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
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
          className={`w-full bg-transparent resize-none focus:outline-none px-2 py-1 text-sm max-h-32 overflow-y-auto thin-scrollbar min-h-12 ${
            themes.sidebar.fgHoverAsFg
          } ${themes.sidebar.fgRaw("placeholder:")}`}
          rows={1}
        />
      </div>

      {/* Controls Section */}
      <div className="flex items-stretch justify-between flex-wrap gap-2 mt-2">
        <div className="flex items-stretch flex-wrap gap-2">
          {/* Model Selector */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => {
                if (isLoadingSystemModels || isLoadingModelFromConversation)
                  return;
                setIsModelDropdownOpen(!isModelDropdownOpen);
              }}
              className={`flex items-center gap-2 p-2 rounded-lg bg-transparent transition-colors max-w-32 sm:max-w-48 text-sm cursor-pointer ${themes.sidebar.bgHover}`}
            >
              <span
                className={`${themes.sidebar.fgHoverAsFg} truncate flex-1 text-left`}
              >
                {selectedModelLabel}
              </span>
              {isLoadingSystemModels || isLoadingModelFromConversation ? (
                <LoadingState size="xs" message="" />
              ) : (
                <ChevronDown
                  className={`w-4 h-4 ${
                    themes.sidebar.fgHoverAsFg
                  } ${transitionClass} flex-shrink-0 ${
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
                  className={`absolute bottom-full mb-2 left-0 w-[calc(100vw-2rem)] sm:w-80 max-w-80 rounded-lg shadow-sm border overflow-hidden z-10 ${themes.chatview.inputBg} ${themes.chatview.border}`}
                >
                  {/* Search Input */}
                  <div
                    className={`p-3 border-b ${themes.chatview.border} ${themes.sidebar.fg}`}
                  >
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search models..."
                        value={modelSearchQuery}
                        onChange={(e) => setModelSearchQuery(e.target.value)}
                        className={`w-full ${themes.chatview.inputBg} border ${
                          themes.chatview.border
                        } ${themes.sidebar.fgRaw("placeholder:")} ${
                          themes.sidebar.fgHoverAsFg
                        } rounded-lg py-2 pl-10 pr-3 focus:outline-none transition-colors text-sm`}
                        autoFocus={!isMobile}
                      />
                    </div>
                  </div>

                  {/* Model Options */}
                  <div className="h-64 overflow-y-auto thin-scrollbar">
                    {isLoadingSystemModels &&
                      modelOptions.filter((opt) => opt.source === "system")
                        .length === 0 && (
                        <div
                          className={`px-3 py-2 ${themes.sidebar.fg} flex items-center gap-2 text-sm`}
                        >
                          <LoadingState />
                        </div>
                      )}
                    {modelOptions
                      .filter((option) =>
                        option.label
                          .toLowerCase()
                          .includes(modelSearchQuery.toLowerCase())
                      )
                      .map((option) => {
                        const isSelected =
                          selectedModel === option.value &&
                          selectedProviderId === (option.providerId || "");
                        return (
                          <button
                            key={`${option.value}-${
                              option.providerId || "system"
                            }`}
                            onClick={() => handleModelSelect(option)}
                            className={`cursor-pointer w-full text-left flex items-center justify-between px-3 py-2 transition-colors text-sm ${themes.sidebar.fgHoverAsFg} ${
                              isSelected
                                ? `${themes.sidebar.bgHoverAsBg}`
                                : `${themes.sidebar.bgHover}`
                            }`}
                            title={option.label}
                          >
                            <span className="truncate flex-1 mr-2">
                              {option.label}
                            </span>
                            <div className="flex items-center gap-2">
                              {getCapabilityIcons(option)}
                            </div>
                          </button>
                        );
                      })}
                    {modelOptions.filter((option) =>
                      option.label
                        .toLowerCase()
                        .includes(modelSearchQuery.toLowerCase())
                    ).length === 0 &&
                      modelSearchQuery && (
                        <div
                          className={`px-3 flex justify-center items-center text-sm text-center ${themes.sidebar.fg}`}
                          style={{ height: "inherit" }}
                        >
                          No results found
                        </div>
                      )}
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
              ((inputMode === "image_generation" &&
                capabilities.hasImageEditing) ||
                (inputMode === "chat" &&
                  capabilities.hasVision &&
                  !capabilities.hasImageEditing))
            );
          })() && (
            <div
              className={`cursor-pointer relative bg-transparent transition-colors rounded-lg flex items-center p-2 rounded-lg ${themes.sidebar.fgHoverAsFg} ${themes.sidebar.bgHover}`}
            >
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
                className="absolute inset-0 w-full h-full opacity-0 z-10"
                disabled={isUploadingImage}
              />
              <button
                className={`transition-colors relative flex items-center`}
                aria-label="Upload image"
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <LoadingState size="xs" message="" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          {/* Size Selector - only show in image generation mode */}
          {inputMode === "image_generation" && (
            <div ref={sizeDropdownRef} className="flex items-stretch relative">
              <button
                onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors min-w-[44px] sm:min-w-[120px] cursor-pointer text-sm ${themes.sidebar.fgHoverAsFg} ${themes.sidebar.bgHover} bg-transparent`}
                disabled={disabled || isImageGenerating}
                title={selectedImageSize}
              >
                <FullScreen className={`w-4 h-4 sm:hidden flex-shrink-0`} />
                <span className="truncate flex-1 text-left hidden sm:block">
                  {selectedImageSize}
                </span>
                <ChevronDown
                  className={`w-4 h-4 ${transitionClass} flex-shrink-0 ${
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
                    className={`absolute bottom-full mb-2 right-0 w-[calc(100vw-2rem)] max-w-[160px] sm:left-0 sm:w-40 sm:max-w-none ${themes.chatview.inputBg} rounded-lg shadow-sm border ${themes.chatview.border} overflow-hidden z-10`}
                  >
                    <div className="h-auto overflow-y-auto thin-scrollbar">
                      {ImageGenerationService.getImageSizeOptions().map(
                        (option) => {
                          const isSelected = selectedImageSize === option.value;
                          return (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSelectedImageSize(option.value);
                                setIsSizeDropdownOpen(false);
                              }}
                              className={`cursor-pointer w-full text-left px-2.5 py-2 text-sm transition-colors ${themes.sidebar.fgHoverAsFg} ${
                                themes.sidebar.bgHover
                              } ${
                                isSelected
                                  ? `${themes.sidebar.bgHoverAsBg}`
                                  : `${themes.chatview.inputBg}`
                              } $`}
                            >
                              {option.label}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Send/Generate Button */}
          <button
            onClick={handleSendMessage}
            className={`py-1.5 px-2.5 rounded-lg flex items-center transition-colors disabled:cursor-not-allowed cursor-pointer ${
              (() => {
                const capabilities = getCurrentModelCapabilities();
                if (inputMode === "image_generation") {
                  if (capabilities?.hasImageEditing) {
                    return (
                      prompt.trim() &&
                      uploadedImageForEditing &&
                      !disabled &&
                      !isImageGenerating
                    );
                  } else {
                    return prompt.trim() && !disabled && !isImageGenerating;
                  }
                } else {
                  if (capabilities?.hasVision) {
                    return (
                      (prompt.trim() || attachments.length > 0) &&
                      !disabled &&
                      !isUploadingImage
                    );
                  } else {
                    return prompt.trim() && !disabled && !isUploadingImage;
                  }
                }
              })()
                ? `${themes.special.bgGradient} ${themes.special.fg} ${themes.special.bgHover}`
                : `${themes.disabled.bg} ${themes.sidebar.fg} cursor-not-allowed`
            }`}
            disabled={(() => {
              const capabilities = getCurrentModelCapabilities();
              if (inputMode === "image_generation") {
                if (capabilities?.hasImageEditing) {
                  return (
                    !prompt.trim() ||
                    !uploadedImageForEditing ||
                    disabled ||
                    isImageGenerating
                  );
                } else {
                  return !prompt.trim() || disabled || isImageGenerating;
                }
              } else {
                if (capabilities?.hasVision) {
                  return (
                    (!prompt.trim() && attachments.length === 0) ||
                    disabled ||
                    isUploadingImage
                  );
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
