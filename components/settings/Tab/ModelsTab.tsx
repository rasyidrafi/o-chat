import React, { useState, useEffect, useMemo, useCallback } from "react";
import CustomDropdown from "../../ui/CustomDropdown";
import ModelCard from "../ModelCard";
import AdvancedFilter from "../../ui/AdvancedFilter";
import { LoadingOverlay } from "../../ui/LoadingOverlay";
import TabButtonGroup from "../../ui/TabButtonGroup";
import { AppSettings } from "../../../hooks/useSettings";
import { Provider } from "../../../types/providers";
import { useModelsManager } from "../../../hooks/useModelsManager";
import {
  usePagination,
  useSearchAndFilter,
} from "../../../hooks/usePagination";
import { useCloudStorage } from "../../../contexts/CloudStorageContext";
import { useSettingsContext } from "../../../contexts/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Plus, X, Edit } from "../../Icons";
import {
  FILTER_ID_MAPPING,
  REVERSE_FILTER_ID_MAPPING,
  MODEL_FILTER_CATEGORIES,
} from "../../../constants/modelFilters";
import { DEFAULT_MODEL_ID } from "../../../constants/models";
import CloudConflictModal from "../../ui/CloudConflictModal";
import { ConflictData } from "../../../services/cloudStorageService";
import CustomModelForm from "../CustomModelForm";
import { getModelCapabilities } from "../../../services/modelService";

interface ModelsTabProps {
  settings: AppSettings;
}

// Constants
const ITEMS_PER_PAGE = 6;

const ModelsTab: React.FC<ModelsTabProps> = ({ settings }) => {
  // Get isMobile from SettingsContext
  const { isMobile } = useSettingsContext();

  // Get cloud storage context
  const {
    custom_providers: customProviders,
    selected_server_models: cloudSelectedServerModels,
    selected_provider_models: cloudSelectedProviderModels,
    saveSelectedServerModels: cloudSaveSelectedServerModels,
    saveSelectedModelsForProvider: cloudSaveSelectedModelsForProvider,
    loadCustomModelsForProvider: cloudLoadCustomModelsForProvider,
    addServerModel: cloudAddServerModel,
    removeServerModel: cloudRemoveServerModel,
    addProviderModel: cloudAddProviderModel,
    removeProviderModel: cloudRemoveProviderModel,
    addCustomModel: cloudAddCustomModel,
    removeCustomModel: cloudRemoveCustomModel,
    cleanupDuplicateCustomModels: cloudCleanupDuplicateCustomModels,
    setConflictResolver,
  } = useCloudStorage();

  // State management
  const [activeMainTab, setActiveMainTab] = useState<"system" | "byok">(
    "system"
  );
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [activeByokTab, setActiveByokTab] = useState<
    "selected" | "available" | "custom"
  >("available");
  const [availableProviders, setAvailableProviders] = useState<Array<Provider>>(
    []
  );
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);
  const [showCustomModelForm, setShowCustomModelForm] = useState(false);
  const [editingCustomModel, setEditingCustomModel] = useState<any | null>(
    null
  );

  // Provider-specific custom models state
  const [providerCustomModels, setProviderCustomModels] = useState<
    Record<string, any[]>
  >({});

  // Loading states for different save operations
  const [isSavingServerModels, setIsSavingServerModels] = useState(false);
  const [isSavingProviderModels, setIsSavingProviderModels] = useState(false);
  const [isSavingCustomModels, setIsSavingCustomModels] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Per-model loading states for more granular feedback
  const [savingModelIds, setSavingModelIds] = useState<Set<string>>(new Set());

  // Custom hooks
  const modelsManager = useModelsManager();

  // Pagination and filtering for BYOK models
  const byokPagination = usePagination<any>({ itemsPerPage: ITEMS_PER_PAGE });
  const byokFilter = useSearchAndFilter();

  // Pagination and filtering for custom models
  const customPagination = usePagination<any>({ itemsPerPage: ITEMS_PER_PAGE });
  const customFilter = useSearchAndFilter();

  // Pagination and filtering for server models
  const serverPagination = usePagination<any>({ itemsPerPage: ITEMS_PER_PAGE });
  const serverFilter = useSearchAndFilter();

  // Set up conflict resolver
  useEffect(() => {
    const handleConflict = async (
      conflict: ConflictData
    ): Promise<"local" | "cloud" | "merge"> => {
      return new Promise((resolve) => {
        setConflictData(conflict);
        setShowConflictModal(true);

        // Store resolver in a way that the modal can call it
        (window as any).resolveModelConflict = resolve;
      });
    };

    setConflictResolver(handleConflict);
  }, [setConflictResolver]);

  // Handle conflict resolution
  const handleConflictResolve = useCallback(
    (resolution: "local" | "cloud" | "merge") => {
      if ((window as any).resolveModelConflict) {
        (window as any).resolveModelConflict(resolution);
        delete (window as any).resolveModelConflict;
      }
      setShowConflictModal(false);
      setConflictData(null);
    },
    []
  );

  // Convert between old feature names and new filter IDs
  const convertFeaturesToFilterIds = useCallback(
    (features: string[]): string[] => {
      return features.map(
        (feature) =>
          FILTER_ID_MAPPING[feature] ||
          feature.toLowerCase().replace(/\s+/g, "-")
      );
    },
    []
  );

  // Handle advanced filter changes
  const handleServerFilterChange = useCallback(
    (filterId: string) => {
      const featureName = REVERSE_FILTER_ID_MAPPING[filterId];
      if (featureName) {
        serverFilter.handleFeatureToggle(featureName);
      }
    },
    [serverFilter]
  );

  const handleServerClearAllFilters = useCallback(() => {
    serverFilter.clearFilters();
  }, [serverFilter]);

  const handleByokFilterChange = useCallback(
    (filterId: string) => {
      const featureName = REVERSE_FILTER_ID_MAPPING[filterId];
      if (featureName) {
        byokFilter.handleFeatureToggle(featureName);
      }
    },
    [byokFilter]
  );

  const handleByokClearAllFilters = useCallback(() => {
    byokFilter.clearFilters();
  }, [byokFilter]);

  // Load providers on component mount
  useEffect(() => {
    const loadProviders = () => {
      let providers: Array<Provider> = [];

      // Load built-in providers (now empty since we removed built-in providers)
      const builtInProviders: Provider[] = []; // No built-in providers anymore

      providers = builtInProviders.map((p: Provider) => ({
        ...p,
        disabled: !p.value?.trim(),
      }));

      // Load custom providers from cloud storage
      providers = [...providers, ...(customProviders || [])];

      setAvailableProviders(providers);
    };

    loadProviders();
  }, [customProviders]);

  // Fetch models when provider changes
  useEffect(() => {
    if (selectedProvider) {
      const provider = availableProviders.find(
        (p) => p.id === selectedProvider
      );
      if (provider) {
        modelsManager.fetchProviderModels(provider);
      }
      modelsManager.loadSelectedModelsForProvider(selectedProvider);

      // Load custom models for this provider
      cloudLoadCustomModelsForProvider(selectedProvider)
        .then(async (customModels) => {
          setProviderCustomModels((prev) => ({
            ...prev,
            [selectedProvider]: customModels,
          }));

          // Clean up duplicates if any exist (run in background)
          if (customModels.length > 0) {
            try {
              await cloudCleanupDuplicateCustomModels(selectedProvider);
              // Reload custom models after cleanup to get the cleaned up list
              const cleanedModels = await cloudLoadCustomModelsForProvider(
                selectedProvider
              );
              setProviderCustomModels((prev) => ({
                ...prev,
                [selectedProvider]: cleanedModels,
              }));
            } catch (error) {
              console.warn("Could not cleanup duplicates:", error);
            }
          }
        })
        .catch((error) => {
          console.error("Error loading custom models for provider:", error);
        });
    }
  }, [
    selectedProvider,
    availableProviders,
    modelsManager.fetchProviderModels,
    modelsManager.loadSelectedModelsForProvider,
    cloudLoadCustomModelsForProvider,
  ]);

  // Reset pagination when search or filters change
  useEffect(() => {
    byokPagination.goToPage(1);
  }, [
    byokFilter.searchQuery,
    byokFilter.selectedFeatures,
    activeByokTab,
    selectedProvider,
  ]);

  useEffect(() => {
    customPagination.goToPage(1);
  }, [customFilter.searchQuery, customFilter.selectedFeatures, activeByokTab]);

  useEffect(() => {
    serverPagination.goToPage(1);
  }, [serverFilter.searchQuery, serverFilter.selectedFeatures]);

  // Reset BYOK tab to "available" when provider changes
  useEffect(() => {
    if (selectedProvider) {
      setActiveByokTab("available");
    }
  }, [selectedProvider]);

  // Reset pagination when switching between BYOK tabs
  useEffect(() => {
    byokPagination.goToPage(1);
  }, [activeByokTab]);

  // Memoized filtered and paginated models
  const filteredServerModels = useMemo(() => {
    const serverModels = modelsManager.availableModels.filter(
      (model) => model.category === "server"
    );

    const filtered = serverFilter.filterItems(
      serverModels,
      ["name"],
      "features"
    );
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [
    modelsManager.availableModels,
    serverFilter.searchQuery,
    serverFilter.selectedFeatures,
  ]);

  const paginatedServerModels = useMemo(() => {
    const paginatedItems =
      serverPagination.getPaginatedItems(filteredServerModels);
    const { totalPages } = serverPagination.getPaginationInfo(
      filteredServerModels.length
    );

    return {
      models: paginatedItems,
      totalItems: filteredServerModels.length,
      totalPages: totalPages || 1,
      currentPage: serverPagination.currentPage,
      hasNextPage: serverPagination.currentPage < (totalPages || 1),
      hasPreviousPage: serverPagination.currentPage > 1,
    };
  }, [filteredServerModels, serverPagination.currentPage]);

  const filteredByokModels = useMemo(() => {
    if (!selectedProvider) return [];

    let models: any[] = [];

    if (activeByokTab === "available") {
      // Only show fetched models if they exist and are not loading
      if (
        modelsManager.fetchedModels &&
        modelsManager.fetchedModels.length > 0
      ) {
        models = modelsManager.fetchedModels.map((model) => {
          const capabilities = getModelCapabilities(model);

          // Build features array dynamically based on capabilities
          let features: string[] = [];

          // Handle image generation models (including jobs) - ONLY Image Generation
          if (
            capabilities.hasImageGeneration ||
            capabilities.hasImageGenerationJobs
          ) {
            features = ["Image Generation"];

            // Only add other capabilities if they exist, but NOT text generation
            if (capabilities.hasImageEditing) features.push("Image Editing");
            if (capabilities.hasVision) features.push("Vision");
            if (capabilities.hasTools) features.push("Tool Calling");
            if (capabilities.hasAudioGeneration)
              features.push("Audio Generation");
          }

          // Handle image editing models - ONLY Image Editing (and other non-text capabilities)
          else if (capabilities.hasImageEditing) {
            features = ["Image Editing"];

            // Add other capabilities but NOT text generation
            if (capabilities.hasVision) features.push("Vision");
            if (capabilities.hasTools) features.push("Tool Calling");
            if (capabilities.hasAudioGeneration)
              features.push("Audio Generation");
          }

          // Regular models - build features array dynamically
          else {
            // Always add text generation if available
            if (capabilities.hasTextGeneration) {
              features.push("Text Generation");
            }

            // Add other capabilities
            if (capabilities.hasTools) features.push("Tool Calling");
            if (capabilities.hasReasoning) features.push("Reasoning");
            if (capabilities.hasVision) features.push("Vision");
            if (capabilities.hasAudioGeneration)
              features.push("Audio Generation");
          }

          // Ensure we always have at least "Text Generation" for fallback
          if (features.length === 0) {
            features.push("Text Generation");
          }

          return {
            name: model.name,
            description: model.description,
            features,
            category: "byok",
            id: model.id,
            supported_parameters: model.supported_parameters,
          };
        });
      }
    } else {
      // Show selected models from cloud storage state (more reliable than modelsManager)
      const selectedModelsForProvider =
        cloudSelectedProviderModels[selectedProvider] || [];
      if (selectedModelsForProvider.length > 0) {
        models = selectedModelsForProvider.map((model) => {
          const fullModel =
            modelsManager.fetchedModels.find((m) => m.id === model.id) ||
            modelsManager.availableModels.find((m) => m.id === model.id);

          const capabilities = fullModel
            ? getModelCapabilities(fullModel)
            : {
                hasTextGeneration: true,
                hasTools: false,
                hasReasoning: false,
                hasVision: false,
                hasImageGeneration: false,
                hasImageGenerationJobs: false,
                hasImageEditing: false,
                hasAudioGeneration: false,
                hasImageGenerationChat: false,
              }; // fallback

          // Build features array dynamically based on capabilities
          let features: string[] = [];

          // Handle image generation models (including jobs) - ONLY Image Generation
          if (
            capabilities.hasImageGeneration ||
            capabilities.hasImageGenerationJobs
          ) {
            features = ["Image Generation"];

            // Only add other capabilities if they exist, but NOT text generation
            if (capabilities.hasImageEditing) features.push("Image Editing");
            if (capabilities.hasVision) features.push("Vision");
            if (capabilities.hasTools) features.push("Tool Calling");
            if (capabilities.hasAudioGeneration)
              features.push("Audio Generation");
          }

          // Handle image editing models - ONLY Image Editing (and other non-text capabilities)
          else if (capabilities.hasImageEditing) {
            features = ["Image Editing"];

            // Add other capabilities but NOT text generation
            if (capabilities.hasVision) features.push("Vision");
            if (capabilities.hasTools) features.push("Tool Calling");
            if (capabilities.hasAudioGeneration)
              features.push("Audio Generation");
          }

          // Regular models - build features array dynamically
          else {
            // Always add text generation if available
            if (capabilities.hasTextGeneration) {
              features.push("Text Generation");
            }

            // Add other capabilities
            if (capabilities.hasTools) features.push("Tool Calling");
            if (capabilities.hasReasoning) features.push("Reasoning");
            if (capabilities.hasVision) features.push("Vision");
            if (capabilities.hasAudioGeneration)
              features.push("Audio Generation");
          }

          // Ensure we always have at least "Text Generation" for fallback
          if (features.length === 0) {
            features.push("Text Generation");
          }

          return {
            name: model.name,
            description: fullModel?.description || "",
            features,
            category: "byok",
            id: model.id,
            supported_parameters: model.supported_parameters || [],
          };
        });
      }
    }

    // Filter and sort models
    const filtered = byokFilter.filterItems(models, ["name"], "features");
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [
    selectedProvider,
    activeByokTab,
    modelsManager.fetchedModels,
    cloudSelectedProviderModels,
    modelsManager.availableModels,
    byokFilter.searchQuery,
    byokFilter.selectedFeatures,
  ]);

  const paginatedByokModels = useMemo(() => {
    const paginatedItems = byokPagination.getPaginatedItems(filteredByokModels);
    const { totalPages } = byokPagination.getPaginationInfo(
      filteredByokModels.length
    );

    return {
      models: paginatedItems,
      totalItems: filteredByokModels.length,
      totalPages: totalPages || 1,
      currentPage: byokPagination.currentPage,
      hasNextPage: byokPagination.currentPage < (totalPages || 1),
      hasPreviousPage: byokPagination.currentPage > 1,
    };
  }, [filteredByokModels, byokPagination.currentPage]);

  // Memoized filtered and paginated custom models
  const filteredCustomModels = useMemo(() => {
    if (!selectedProvider) return [];

    const models = (providerCustomModels[selectedProvider] || []).map(
      (model) => ({
        name: model.name,
        description: model.description || "",
        features: [
          "Text Generation",
          ...(model.hasVision ? ["Vision"] : []),
          ...(model.hasReasoning ? ["Reasoning"] : []),
          ...(model.hasFunctionCalling ? ["Function Calling"] : []),
        ],
        category: "custom",
        id: model.id,
        supported_parameters: model.supportedParameters || [],
      })
    );

    const filtered = customFilter.filterItems(models, ["name"], "features");
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [
    selectedProvider,
    providerCustomModels,
    customFilter.searchQuery,
    customFilter.selectedFeatures,
  ]);

  const paginatedCustomModels = useMemo(() => {
    const paginatedItems =
      customPagination.getPaginatedItems(filteredCustomModels);
    const { totalPages } = customPagination.getPaginationInfo(
      filteredCustomModels.length
    );

    return {
      models: paginatedItems,
      totalItems: filteredCustomModels.length,
      totalPages: totalPages || 1,
      currentPage: customPagination.currentPage,
      hasNextPage: customPagination.currentPage < (totalPages || 1),
      hasPreviousPage: customPagination.currentPage > 1,
    };
  }, [filteredCustomModels, customPagination.currentPage]);

  // Event handlers
  const handleModelToggle = useCallback(
    async (modelId: string, modelName: string, enabled: boolean) => {
      if (!selectedProvider) return;

      // Set per-model loading state only
      setSavingModelIds((prev) => new Set(prev).add(modelId));

      try {
        if (enabled) {
          // Add model using optimized operation
          const newModel = {
            id: modelId,
            name: modelName,
            supported_parameters:
              modelsManager.fetchedModels.find((m) => m.id === modelId)
                ?.supported_parameters || [],
            category: "byok",
          };
          await cloudAddProviderModel(selectedProvider, newModel);
        } else {
          // Remove model using optimized operation
          await cloudRemoveProviderModel(selectedProvider, modelId);
        }

        // No need to refresh modelsManager state since we're using cloudSelectedProviderModels directly
      } catch (error) {
        console.error("Error toggling provider model:", error);
      } finally {
        // Clear per-model loading state
        setSavingModelIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(modelId);
          return newSet;
        });
      }
    },
    [
      selectedProvider,
      cloudAddProviderModel,
      cloudRemoveProviderModel,
      modelsManager.fetchedModels,
    ]
  );

  const handleServerModelToggle = useCallback(
    async (modelId: string, modelName: string, enabled: boolean) => {
      if (modelId == DEFAULT_MODEL_ID) {
        return;
      }

      // Set per-model loading state only
      setSavingModelIds((prev) => new Set(prev).add(modelId));

      try {
        if (enabled) {
          // Add model using optimized operation
          const model = modelsManager.availableModels.find(
            (m) => m.id === modelId
          );
          const newModel = {
            id: modelId,
            name: modelName,
            supported_parameters: model?.supported_parameters || [],
            category: model?.category || "server",
            provider_id: model?.provider_id || "",
            provider_name: model?.provider_name || "",
          };
          await cloudAddServerModel(newModel);
        } else {
          // Remove model using optimized operation
          await cloudRemoveServerModel(modelId);
        }
      } catch (error) {
        console.error("Error toggling server model:", error);
      } finally {
        // Clear per-model loading state
        setSavingModelIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(modelId);
          return newSet;
        });
      }
    },
    [cloudAddServerModel, cloudRemoveServerModel, modelsManager.availableModels]
  );

  const handleUnselectAll = useCallback(async () => {
    if (selectedProvider) {
      setIsSavingProviderModels(true);
      try {
        await cloudSaveSelectedModelsForProvider(selectedProvider, []);
      } catch (error) {
        console.error("Error unselecting all provider models:", error);
      } finally {
        setIsSavingProviderModels(false);
      }
    }
  }, [selectedProvider, cloudSaveSelectedModelsForProvider]);

  const handleSelectAll = useCallback(async () => {
    if (selectedProvider) {
      setIsSavingProviderModels(true);
      try {
        const allModels = modelsManager.fetchedModels.map((model) => ({
          id: model.id,
          name: model.name,
          supported_parameters: model.supported_parameters,
          category: "byok",
        }));
        await cloudSaveSelectedModelsForProvider(selectedProvider, allModels);
        // Refresh the selected models state in modelsManager to update UI
        modelsManager.loadSelectedModelsForProvider(selectedProvider);
      } catch (error) {
        console.error("Error selecting all provider models:", error);
      } finally {
        setIsSavingProviderModels(false);
      }
    }
  }, [
    selectedProvider,
    cloudSaveSelectedModelsForProvider,
    modelsManager.fetchedModels,
    modelsManager.loadSelectedModelsForProvider,
  ]);

  const handleServerUnselectAll = useCallback(async () => {
    setIsSavingServerModels(true);
    try {
      await cloudSaveSelectedServerModels([]);
    } catch (error) {
      console.error("Error unselecting all server models:", error);
    } finally {
      setIsSavingServerModels(false);
    }
  }, [cloudSaveSelectedServerModels]);

  const handleServerSelectAll = useCallback(async () => {
    setIsSavingServerModels(true);
    try {
      const allSelectableModels = modelsManager.availableModels
        .filter((model) => model.category === "server")
        .map((model) => ({
          id: model.id,
          name: model.name,
          supported_parameters: model.supported_parameters || [],
          provider_id: model.provider_id || "",
          provider_name: model.provider_name || "",
        }));

      await cloudSaveSelectedServerModels(allSelectableModels);
    } catch (error) {
      console.error("Error selecting all server models:", error);
    } finally {
      setIsSavingServerModels(false);
    }
  }, [modelsManager, cloudSaveSelectedServerModels]);

  const handleRefreshServerModels = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await modelsManager.refreshSystemModels(true); // Force refresh to bypass cache
    } catch (error) {
      console.error("Error refreshing server models:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [modelsManager]);

  // Custom models handlers
  const handleCustomModelSave = useCallback(
    async (model: any) => {
      if (!selectedProvider) return;

      setIsSavingCustomModels(true);
      try {
        await cloudAddCustomModel(selectedProvider, model);

        // Reload custom models for this provider
        const updatedModels = await cloudLoadCustomModelsForProvider(
          selectedProvider
        );
        setProviderCustomModels((prev) => ({
          ...prev,
          [selectedProvider]: updatedModels,
        }));
      } catch (error) {
        console.error("Error saving custom model:", error);
      } finally {
        setIsSavingCustomModels(false);
      }
    },
    [selectedProvider, cloudAddCustomModel, cloudLoadCustomModelsForProvider]
  );

  const handleCustomModelDelete = useCallback(
    async (modelId: string) => {
      if (!selectedProvider) return;

      setIsSavingCustomModels(true);
      try {
        await cloudRemoveCustomModel(selectedProvider, modelId);

        // Reload custom models for this provider
        const updatedModels = await cloudLoadCustomModelsForProvider(
          selectedProvider
        );
        setProviderCustomModels((prev) => ({
          ...prev,
          [selectedProvider]: updatedModels,
        }));
      } catch (error) {
        console.error("Error deleting custom model:", error);
      } finally {
        setIsSavingCustomModels(false);
      }
    },
    [selectedProvider, cloudRemoveCustomModel, cloudLoadCustomModelsForProvider]
  );

  const handleCustomModelEdit = useCallback((model: any) => {
    setEditingCustomModel(model);
    setShowCustomModelForm(true);
  }, []);

  const handleAddCustomModel = useCallback(() => {
    setEditingCustomModel(null);
    setShowCustomModelForm(true);
  }, []);

  // Helper function to determine if any global loading operation is in progress
  // Excludes per-model loading states to allow individual model interactions
  // But includes bulk operations that affect multiple models
  const isAnyLoading = useMemo(() => {
    return (
      isSavingServerModels ||
      isSavingProviderModels ||
      isSavingCustomModels ||
      isRefreshing
    );
  }, [
    isSavingServerModels,
    isSavingProviderModels,
    isSavingCustomModels,
    isRefreshing,
  ]);

  // Handle model expansion toggle
  const toggleModelExpansion = useCallback((modelId: string) => {
    setExpandedModels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(modelId)) {
        newSet.delete(modelId);
      } else {
        newSet.add(modelId);
      }
      return newSet;
    });
  }, []);

  // Helper functions
  const isServerModelEnabled = useCallback(
    (modelId: string): boolean => {
      if (modelId === DEFAULT_MODEL_ID) return true;
      return (cloudSelectedServerModels || []).some((m) => m.id === modelId);
    },
    [cloudSelectedServerModels, DEFAULT_MODEL_ID]
  );

  const isModelSelected = useCallback(
    (modelId: string): boolean => {
      if (!selectedProvider) return false;
      const providerModels =
        cloudSelectedProviderModels[selectedProvider] || [];
      return providerModels.some((m) => m.id === modelId);
    },
    [cloudSelectedProviderModels, selectedProvider]
  );

  // Render pagination component
  const renderPagination = useCallback(
    (type: "server" | "byok" | "custom" = "byok") => {
      const paginationData =
        type === "server"
          ? paginatedServerModels
          : type === "custom"
          ? paginatedCustomModels
          : paginatedByokModels;
      const pagination =
        type === "server"
          ? serverPagination
          : type === "custom"
          ? customPagination
          : byokPagination;

      if (paginationData.totalPages <= 1) return null;

      const pageNumbers = [];
      // Mobile: show max 3 pages, Desktop: show max 5 pages
      const maxVisiblePages = isMobile ? 3 : 5;
      const startPage = Math.max(
        1,
        paginationData.currentPage - Math.floor(maxVisiblePages / 2)
      );
      const endPage = Math.min(
        paginationData.totalPages,
        startPage + maxVisiblePages - 1
      );

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      return (
        <div className="flex justify-center items-center gap-1 sm:gap-2 mt-6 px-2">
          <button
            onClick={() => pagination.goToPage(paginationData.currentPage - 1)}
            disabled={!paginationData.hasPreviousPage || isAnyLoading}
            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </button>

          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => pagination.goToPage(page)}
              disabled={isAnyLoading}
              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                page === paginationData.currentPage
                  ? "border-pink-500 bg-gradient-to-r from-pink-600 to-purple-600 text-white"
                  : "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              } ${
                isAnyLoading
                  ? "disabled:opacity-50 disabled:cursor-not-allowed"
                  : ""
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => pagination.goToPage(paginationData.currentPage + 1)}
            disabled={!paginationData.hasNextPage || isAnyLoading}
            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <span className="hidden sm:inline">Next</span>
            <span className="sm:hidden">Next</span>
          </button>
        </div>
      );
    },
    [
      paginatedServerModels,
      paginatedByokModels,
      paginatedCustomModels,
      serverPagination,
      byokPagination,
      customPagination,
      isMobile,
    ]
  );

  return (
    <div>
      {/* Main Tab Switcher */}
      <div>
        <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">
          Models Management
        </h2>
        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start pt-2">
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="font-medium text-zinc-900 dark:text-white">
                  Model Type
                </h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Choose between built-in system models or bring your own API
                  key models.
                </p>
              </div>
            </div>
            <div className="space-y-2 ml-auto">
              <TabButtonGroup
                options={[
                  { value: "system", label: "System Models" },
                  { value: "byok", label: "BYOK" },
                ]}
                value={activeMainTab}
                onChange={(activeMainTab: "system" | "byok") =>
                  setActiveMainTab(activeMainTab)
                }
                animationsDisabled={settings.animationsDisabled}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Based on Active Tab */}
      <div className="mt-8">
        {activeMainTab === "system" && (
          /* Server Models Section */
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                System Models
              </h2>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <button
                  onClick={handleRefreshServerModels}
                  disabled={
                    modelsManager.isLoadingSystemModels ||
                    isRefreshing ||
                    isAnyLoading
                  }
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                  title="Refresh server models"
                >
                  <RefreshCw
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${
                      modelsManager.isLoadingSystemModels || isRefreshing
                        ? "animate-spin"
                        : ""
                    }`}
                  />
                  <span className="hidden xs:inline">
                    {modelsManager.isLoadingSystemModels || isRefreshing
                      ? "Loading..."
                      : "Refresh"}
                  </span>
                </button>
                <button
                  onClick={handleServerSelectAll}
                  disabled={isSavingServerModels || isAnyLoading}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="sm:hidden">All</span>
                  <span className="hidden sm:inline">Select All</span>
                </button>
                <button
                  onClick={handleServerUnselectAll}
                  disabled={isSavingServerModels || isAnyLoading}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="sm:hidden">None</span>
                  <span className="hidden sm:inline">Unselect All</span>
                </button>
              </div>
            </div>

            {/* Server Models Filters */}
            <div
              className={`flex flex-col lg:flex-row gap-3 lg:gap-4 mb-6 transition-all duration-300 ${
                modelsManager.isLoadingSystemModels || isAnyLoading
                  ? "opacity-60 pointer-events-none"
                  : "opacity-100"
              }`}
            >
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search system models..."
                  value={serverFilter.searchQuery}
                  onChange={(e) =>
                    serverFilter.handleSearchChange(e.target.value)
                  }
                  disabled={modelsManager.isLoadingSystemModels || isAnyLoading}
                  className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2.5 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex-shrink-0 lg:w-80">
                <AdvancedFilter
                  categories={MODEL_FILTER_CATEGORIES}
                  selectedFilters={convertFeaturesToFilterIds(
                    serverFilter.selectedFeatures
                  )}
                  onFilterChange={handleServerFilterChange}
                  onClearAll={handleServerClearAllFilters}
                  placeholder="Filter by capabilities"
                  disabled={modelsManager.isLoadingSystemModels || isAnyLoading}
                />
              </div>
            </div>

            {/* Server Models Content Area */}
            <div className="relative min-h-[400px]">
              {/* Loading Overlay */}
              <LoadingOverlay
                isVisible={
                  modelsManager.isLoadingSystemModels || isSavingServerModels
                }
                title={
                  isSavingServerModels
                    ? "Saving changes..."
                    : "Loading system models..."
                }
                subtitle={
                  isSavingServerModels
                    ? "Please wait while we save your model selections"
                    : "Please wait while we fetch the latest models from our servers"
                }
              />

              {/* Error State */}
              {modelsManager.systemModelsError && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                        Failed to fetch system models
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                        {modelsManager.systemModelsError}
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                        Using fallback models. This might be due to:
                      </p>
                      <ul className="text-sm text-yellow-600 dark:text-yellow-400 mt-1 ml-4 list-disc">
                        <li>Network connectivity issues</li>
                        <li>Server maintenance</li>
                        <li>Missing Firebase configuration</li>
                      </ul>
                    </div>
                    <button
                      onClick={handleRefreshServerModels}
                      disabled={
                        modelsManager.isLoadingSystemModels ||
                        isRefreshing ||
                        isAnyLoading
                      }
                      className="ml-4 px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${
                          modelsManager.isLoadingSystemModels || isRefreshing
                            ? "animate-spin"
                            : ""
                        }`}
                      />
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Server Models List */}
              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 grid-auto-rows-fr items-stretch transition-all duration-300`}
              >
                <AnimatePresence mode="wait">
                  {paginatedServerModels.models.map((model, index) => (
                    <motion.div
                      key={model.id}
                      className="h-full"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        duration: settings.animationsDisabled ? 0 : 0.2,
                        delay: settings.animationsDisabled ? 0 : index * 0.05,
                      }}
                    >
                      <ModelCard
                        key={model.id}
                        name={model.name}
                        description={model.description}
                        features={model.features}
                        isEnabled={isServerModelEnabled(model.id)}
                        onToggle={(enabled) =>
                          handleServerModelToggle(model.id, model.name, enabled)
                        }
                        disabled={
                          modelsManager.isLoadingSystemModels ||
                          savingModelIds.has(model.id) ||
                          model.id === DEFAULT_MODEL_ID ||
                          isAnyLoading
                        }
                        isExpanded={expandedModels.has(model.id)}
                        onToggleExpansion={() => toggleModelExpansion(model.id)}
                        layout="row"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {renderPagination("server")}
          </section>
        )}

        {activeMainTab === "byok" && (
          /* BYOK Models Section */
          <section>
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                Bring Your Own Key (BYOK) Models
              </h2>
            </div>

            {/* Provider Selection */}
            <div
              className={`mb-6 transition-all duration-300 ${
                modelsManager.isLoadingModels || isAnyLoading
                  ? "opacity-60 pointer-events-none"
                  : "opacity-100"
              }`}
            >
              <div className="w-full sm:max-w-md">
                <CustomDropdown
                  label="Select API Provider"
                  description=""
                  options={availableProviders.map((p) => p.label)}
                  selected={
                    selectedProvider
                      ? availableProviders.find(
                          (p) => p.id === selectedProvider
                        )?.label || "Choose a provider..."
                      : "Choose a provider..."
                  }
                  onSelect={(option) => {
                    const provider = availableProviders.find(
                      (p) => p.label === option
                    );
                    if (provider) {
                      setSelectedProvider(provider.id);
                    }
                  }}
                  animationsDisabled={settings.animationsDisabled}
                  disabledOptions={availableProviders
                    .filter((p) => p.disabled)
                    .map((p) => p.label)}
                />
              </div>
            </div>

            {/* Action buttons for mobile - shown below provider dropdown */}
            {selectedProvider && (
              <div
                className={`sm:hidden mb-6 transition-all duration-300 ${
                  modelsManager.isLoadingModels || isAnyLoading
                    ? "opacity-60 pointer-events-none"
                    : "opacity-100"
                }`}
              >
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      const provider = availableProviders.find(
                        (p) => p.id === selectedProvider
                      );
                      if (provider) {
                        modelsManager.fetchProviderModels(provider);
                      }
                    }}
                    disabled={modelsManager.isLoadingModels || isAnyLoading}
                    className="px-2 py-1 text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                    title="Refresh BYOK models"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${
                        modelsManager.isLoadingModels ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </button>
                  <button
                    onClick={handleSelectAll}
                    disabled={isSavingProviderModels || isAnyLoading}
                    className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleUnselectAll}
                    disabled={isSavingProviderModels || isAnyLoading}
                    className="px-2 py-1 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Unselect All
                  </button>
                </div>
              </div>
            )}

            {selectedProvider && (
              <>
                {/* BYOK Tab Navigation */}
                <div
                  className={`flex justify-between items-center border-b border-zinc-200 dark:border-zinc-700 mb-6 transition-all duration-300 ${
                    modelsManager.isLoadingModels || isAnyLoading
                      ? "opacity-60 pointer-events-none"
                      : "opacity-100"
                  }`}
                >
                  <div className="flex">
                    <button
                      onClick={() => setActiveByokTab("available")}
                      disabled={isAnyLoading}
                      className={`cursor-pointer px-4 py-2 border-b-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        activeByokTab === "available"
                          ? "border-pink-500 text-pink-600 dark:text-pink-400"
                          : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                      }`}
                    >
                      Available Models
                    </button>
                    <button
                      onClick={() => setActiveByokTab("selected")}
                      disabled={isAnyLoading}
                      className={`cursor-pointer px-4 py-2 border-b-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        activeByokTab === "selected"
                          ? "border-pink-500 text-pink-600 dark:text-pink-400"
                          : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                      }`}
                    >
                      Selected Models (
                      {selectedProvider
                        ? (cloudSelectedProviderModels[selectedProvider] || [])
                            .length
                        : 0}
                      )
                    </button>
                    <button
                      onClick={() => setActiveByokTab("custom")}
                      disabled={isAnyLoading}
                      className={`cursor-pointer px-4 py-2 border-b-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        activeByokTab === "custom"
                          ? "border-pink-500 text-pink-600 dark:text-pink-400"
                          : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                      }`}
                    >
                      Custom Models (
                      {selectedProvider
                        ? (providerCustomModels[selectedProvider] || []).length
                        : 0}
                      )
                    </button>
                  </div>

                  {/* Action buttons for desktop - show different buttons based on active tab */}
                  {activeByokTab === "available" && (
                    <div className="hidden sm:flex gap-2 mb-2">
                      <button
                        onClick={() => {
                          const provider = availableProviders.find(
                            (p) => p.id === selectedProvider
                          );
                          if (provider) {
                            modelsManager.fetchProviderModels(provider);
                          }
                        }}
                        disabled={modelsManager.isLoadingModels || isAnyLoading}
                        className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                        title="Refresh BYOK models"
                      >
                        <RefreshCw
                          className={`w-3 h-3 sm:w-4 sm:h-4 ${
                            modelsManager.isLoadingModels ? "animate-spin" : ""
                          }`}
                        />
                        <span className="hidden xs:inline">
                          {modelsManager.isLoadingModels
                            ? "Loading..."
                            : "Refresh"}
                        </span>
                      </button>
                      <button
                        onClick={handleSelectAll}
                        disabled={isSavingProviderModels || isAnyLoading}
                        className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <span className="sm:hidden">All</span>
                        <span className="hidden sm:inline">Select All</span>
                      </button>
                      <button
                        onClick={handleUnselectAll}
                        disabled={isSavingProviderModels || isAnyLoading}
                        className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <span className="sm:hidden">None</span>
                        <span className="hidden sm:inline">Unselect All</span>
                      </button>
                    </div>
                  )}

                  {activeByokTab === "custom" && (
                    <div className="hidden sm:flex gap-2 mb-2">
                      <button
                        onClick={handleAddCustomModel}
                        disabled={isSavingCustomModels || isAnyLoading}
                        className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Add Model</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Models Filters - conditional based on active tab */}
                {(activeByokTab === "available" ||
                  activeByokTab === "selected") && (
                  <div
                    className={`flex flex-col lg:flex-row gap-3 lg:gap-4 mb-6 transition-all duration-300 ${
                      modelsManager.isLoadingModels || isAnyLoading
                        ? "opacity-60 pointer-events-none"
                        : "opacity-100"
                    }`}
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search BYOK models..."
                        value={byokFilter.searchQuery}
                        onChange={(e) =>
                          byokFilter.handleSearchChange(e.target.value)
                        }
                        disabled={modelsManager.isLoadingModels || isAnyLoading}
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2.5 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
                      <div className="flex-shrink-0 lg:w-80">
                        <AdvancedFilter
                          categories={MODEL_FILTER_CATEGORIES}
                          selectedFilters={convertFeaturesToFilterIds(
                            byokFilter.selectedFeatures
                          )}
                          onFilterChange={handleByokFilterChange}
                          onClearAll={handleByokClearAllFilters}
                          placeholder="Filter by capabilities"
                          disabled={
                            modelsManager.isLoadingModels || isAnyLoading
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeByokTab === "custom" && (
                  <div
                    className={`flex flex-col lg:flex-row gap-3 lg:gap-4 mb-6 transition-all duration-300 ${
                      isSavingCustomModels || isAnyLoading
                        ? "opacity-60 pointer-events-none"
                        : "opacity-100"
                    }`}
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search custom models..."
                        value={customFilter.searchQuery}
                        onChange={(e) =>
                          customFilter.handleSearchChange(e.target.value)
                        }
                        disabled={isSavingCustomModels || isAnyLoading}
                        className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2.5 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
                      <div className="flex-shrink-0 lg:w-80">
                        <AdvancedFilter
                          categories={MODEL_FILTER_CATEGORIES}
                          selectedFilters={convertFeaturesToFilterIds(
                            customFilter.selectedFeatures
                          )}
                          onFilterChange={(filterId: string) => {
                            const featureName =
                              REVERSE_FILTER_ID_MAPPING[filterId];
                            if (featureName) {
                              customFilter.handleFeatureToggle(featureName);
                            }
                          }}
                          onClearAll={() => customFilter.clearFilters()}
                          placeholder="Filter by capabilities"
                          disabled={false}
                        />
                      </div>
                    </div>
                    <div className="sm:hidden">
                      <button
                        onClick={handleAddCustomModel}
                        disabled={
                          !selectedProvider ||
                          isSavingCustomModels ||
                          isAnyLoading
                        }
                        className="w-full px-3 py-2 text-sm bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/40 cursor-pointer flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                        Add Custom Model
                      </button>
                    </div>
                  </div>
                )}

                {/* Models Content Area */}
                <div className="relative min-h-[400px]">
                  {/* Loading Overlay - only for BYOK tabs */}
                  {(activeByokTab === "available" ||
                    activeByokTab === "selected") && (
                    <LoadingOverlay
                      isVisible={
                        modelsManager.isLoadingModels || isSavingProviderModels
                      }
                      title={
                        isSavingProviderModels
                          ? "Saving changes..."
                          : "Loading models..."
                      }
                      subtitle={
                        isSavingProviderModels
                          ? "Please wait while we save your model selections"
                          : "Please wait while we fetch models from your selected provider"
                      }
                    />
                  )}

                  {/* Loading Overlay for Custom Models */}
                  {activeByokTab === "custom" && (
                    <LoadingOverlay
                      isVisible={isSavingCustomModels}
                      title="Saving changes..."
                      subtitle="Please wait while we save your custom model"
                    />
                  )}

                  {/* Error State - only for BYOK tabs */}
                  {(activeByokTab === "available" ||
                    activeByokTab === "selected") &&
                    modelsManager.modelsError && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                        <p className="text-red-800 dark:text-red-200">
                          {modelsManager.modelsError}
                        </p>
                      </div>
                    )}

                  {/* BYOK Models Content */}
                  {(activeByokTab === "available" ||
                    activeByokTab === "selected") && (
                    <>
                      {/* Empty State */}
                      {!modelsManager.isLoadingModels &&
                        !modelsManager.modelsError &&
                        paginatedByokModels.models.length === 0 && (
                          <div className="text-center py-12">
                            <p className="text-zinc-500 dark:text-zinc-400">
                              {activeByokTab === "selected"
                                ? "No models selected yet. Switch to 'Available Models' to select some."
                                : "No models found."}
                            </p>
                          </div>
                        )}

                      {/* BYOK Models List */}
                      {paginatedByokModels.models.length > 0 && (
                        <div
                          className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 grid-auto-rows-fr items-stretch transition-all duration-300`}
                        >
                          <AnimatePresence mode="wait">
                            {paginatedByokModels.models.map((model, index) => (
                              <motion.div
                                key={model.id}
                                className="h-full"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{
                                  duration: settings.animationsDisabled
                                    ? 0
                                    : 0.2,
                                  delay: settings.animationsDisabled
                                    ? 0
                                    : index * 0.05,
                                }}
                              >
                                <ModelCard
                                  name={model.name}
                                  description={model.description}
                                  features={model.features}
                                  isEnabled={isModelSelected(model.id)}
                                  onToggle={(enabled) =>
                                    handleModelToggle(
                                      model.id,
                                      model.name,
                                      enabled
                                    )
                                  }
                                  disabled={
                                    modelsManager.isLoadingModels ||
                                    savingModelIds.has(model.id) ||
                                    isAnyLoading
                                  }
                                  isExpanded={expandedModels.has(model.id)}
                                  onToggleExpansion={() =>
                                    toggleModelExpansion(model.id)
                                  }
                                  layout="row"
                                />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Pagination for BYOK */}
                      {paginatedByokModels.models.length > 0 &&
                        renderPagination("byok")}
                    </>
                  )}

                  {/* Custom Models Content */}
                  {activeByokTab === "custom" && (
                    <>
                      {/* Empty State */}
                      {paginatedCustomModels.models.length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                            No custom models found. Add your own models to get
                            started.
                          </p>
                          <button
                            onClick={handleAddCustomModel}
                            disabled={
                              !selectedProvider ||
                              isSavingCustomModels ||
                              isAnyLoading
                            }
                            className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-medium hover:from-pink-700 hover:to-purple-700 transition-all flex items-center gap-2 mx-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                            Add Custom Model
                          </button>
                        </div>
                      )}

                      {/* Custom Models List */}
                      {paginatedCustomModels.models.length > 0 && (
                        <div
                          className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 grid-auto-rows-fr items-stretch`}
                        >
                          <AnimatePresence mode="wait">
                            {paginatedCustomModels.models.map(
                              (model, index) => (
                                <motion.div
                                  key={model.id}
                                  className="h-full"
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                  transition={{
                                    duration: settings.animationsDisabled
                                      ? 0
                                      : 0.2,
                                    delay: settings.animationsDisabled
                                      ? 0
                                      : index * 0.05,
                                  }}
                                >
                                  <ModelCard
                                    name={model.name}
                                    description={model.description}
                                    features={model.features}
                                    isEnabled={false}
                                    onToggle={() => {}}
                                    disabled={true}
                                    isExpanded={expandedModels.has(model.id)}
                                    onToggleExpansion={() =>
                                      toggleModelExpansion(model.id)
                                    }
                                    layout="row"
                                    actionButtons={
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => {
                                            // Get the original model data from providerCustomModels
                                            const originalModel =
                                              selectedProvider
                                                ? (
                                                    providerCustomModels[
                                                      selectedProvider
                                                    ] || []
                                                  ).find(
                                                    (m) => m.id === model.id
                                                  )
                                                : null;
                                            handleCustomModelEdit(
                                              originalModel
                                            );
                                          }}
                                          disabled={
                                            isSavingCustomModels || isAnyLoading
                                          }
                                          className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                          title="Edit model"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleCustomModelDelete(model.id)
                                          }
                                          disabled={
                                            isSavingCustomModels || isAnyLoading
                                          }
                                          className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                          title="Delete model"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    }
                                  />
                                </motion.div>
                              )
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Pagination for Custom Models */}
                      {paginatedCustomModels.models.length > 0 &&
                        renderPagination("custom")}
                    </>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </div>

      {/* Custom Model Form */}
      <CustomModelForm
        isVisible={showCustomModelForm}
        onClose={() => {
          setShowCustomModelForm(false);
          setEditingCustomModel(null);
        }}
        onSave={handleCustomModelSave}
        editingModel={editingCustomModel}
      />

      {/* Conflict Resolution Modal */}
      {showConflictModal && conflictData && (
        <CloudConflictModal
          isOpen={showConflictModal}
          onClose={() => handleConflictResolve("local")}
          onResolve={handleConflictResolve}
          conflictData={conflictData}
        />
      )}
    </div>
  );
};

export default ModelsTab;
