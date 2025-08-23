import React, { useState, useEffect, useMemo } from "react";
import CustomDropdown from "../../ui/CustomDropdown";
import ModelCard from "../ModelCard";
import { AppSettings } from "../../../App";
import { Provider, Model } from "../../../types/providers";
import {
  fetchModels,
  getModelCapabilities,
  fetchSystemModels,
} from "../../../services/modelService";
import { DEFAULT_SYSTEM_MODELS } from "../../../constants/models";
import { motion, AnimatePresence } from "framer-motion";

interface ModelsTabProps {
  settings: AppSettings;
}

// Helper functions for localStorage management
const getProviderModelsKey = (providerId: string): string => {
  return `models_${providerId}`;
};

const loadSelectedModelsFromStorage = (
  providerId: string
): Array<{ id: string; name: string }> => {
  if (!providerId) return [];

  try {
    const key = getProviderModelsKey(providerId);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error("Error loading selected models from localStorage:", error);
    return [];
  }
};

const saveSelectedModelsToStorage = (
  providerId: string,
  selectedModels: Array<{ id: string; name: string }>
) => {
  if (!providerId) return;

  try {
    const key = getProviderModelsKey(providerId);
    localStorage.setItem(key, JSON.stringify(selectedModels));

    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("localStorageChange", {
        detail: { key, value: selectedModels },
      })
    );
  } catch (error) {
    console.error("Error saving selected models to localStorage:", error);
  }
};

// Helper functions for server models localStorage management
const getServerModelsKey = (): string => {
  return 'selected_server_models';
};

const loadSelectedServerModelsFromStorage = (): Array<{ id: string; name: string }> => {
  try {
    const key = getServerModelsKey();
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error("Error loading selected server models from localStorage:", error);
    return [];
  }
};

const saveSelectedServerModelsToStorage = (
  selectedModels: Array<{ id: string; name: string }>
) => {
  try {
    const key = getServerModelsKey();
    localStorage.setItem(key, JSON.stringify(selectedModels));

    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("localStorageChange", {
        detail: { key, value: selectedModels },
      })
    );
  } catch (error) {
    console.error("Error saving selected server models to localStorage:", error);
  }
};

const ModelsTab: React.FC<ModelsTabProps> = ({ settings }) => {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [activeByokTab, setActiveByokTab] = useState<"selected" | "available">(
    "available"
  );
  const [availableProviders, setAvailableProviders] = useState<Array<Provider>>(
    []
  );
  const [fetchedModels, setFetchedModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  // System models states
  const [systemModels, setSystemModels] = useState<Model[]>([]);
  const [isLoadingSystemModels, setIsLoadingSystemModels] = useState(false);
  const [systemModelsError, setSystemModelsError] = useState<string | null>(null);

  // Pagination and search states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(6);
  
  // Server models pagination states
  const [serverCurrentPage, setServerCurrentPage] = useState<number>(1);
  const [serverSearchQuery, setServerSearchQuery] = useState<string>("");
  const [serverSelectedFeatures, setServerSelectedFeatures] = useState<string[]>([]);

  // Selected server models (all models except fallback ones can be toggled)
  const [selectedServerModels, setSelectedServerModels] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // All selected models for current provider stored in localStorage
  const [selectedModels, setSelectedModels] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Load selected models from localStorage when provider changes
  useEffect(() => {
    const loadedSelectedModels =
      loadSelectedModelsFromStorage(selectedProvider);
    setSelectedModels(loadedSelectedModels);
  }, [selectedProvider]);

  // Load selected server models from localStorage on component mount
  useEffect(() => {
    const loadedSelectedServerModels = loadSelectedServerModelsFromStorage();
    setSelectedServerModels(loadedSelectedServerModels);
  }, []);

  // Fetch system models on component mount
  useEffect(() => {
    const fetchSystemModelsData = async () => {
      setIsLoadingSystemModels(true);
      setSystemModelsError(null);
      
      try {
        const models = await fetchSystemModels();
        setSystemModels(models);
        
        // Clear any previous error if fetch succeeds
        setSystemModelsError(null);
      } catch (error) {
        console.error('Error fetching system models:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch system models';
        setSystemModelsError(errorMessage);
        // Set fallback models when fetch fails
        setSystemModels(DEFAULT_SYSTEM_MODELS);
      } finally {
        setIsLoadingSystemModels(false);
      }
    };

    fetchSystemModelsData();
  }, []);

  // Save selected models to localStorage whenever they change
  useEffect(() => {
    if (selectedProvider) {
      saveSelectedModelsToStorage(selectedProvider, selectedModels);
    }
  }, [selectedProvider, selectedModels]);

  // Save selected server models to localStorage whenever they change
  useEffect(() => {
    saveSelectedServerModelsToStorage(selectedServerModels);
  }, [selectedServerModels]);

  // Load providers from localStorage
  useEffect(() => {
    const loadProviders = () => {
      let providers: Array<Provider> = [];

      // Load built-in providers from localStorage
      try {
        const builtInProviders = localStorage.getItem("builtin_api_providers");
        if (builtInProviders) {
          const parsed = JSON.parse(builtInProviders);

          // Add All
          const allProvider = parsed.map((p: Provider) => ({
            ...p,
            disabled: !p.value?.trim(),
          }));

          providers = [...providers, ...allProvider];
        } else {
          // Default providers if not in localStorage
          providers.push(
            {
              label: "Anthropic",
              value: "anthropic",
              disabled: true,
              id: "anthropic",
              base_url: null,
            },
            {
              label: "OpenAI",
              value: "openai",
              disabled: true,
              id: "openai",
              base_url: null,
            }
          );
        }
      } catch (error) {
        console.error("Error loading built-in providers:", error);
        providers.push(
          {
            label: "Anthropic",
            value: "anthropic",
            disabled: true,
            id: "anthropic",
            base_url: null,
          },
          {
            label: "OpenAI",
            value: "openai",
            disabled: true,
            id: "openai",
            base_url: null,
          }
        );
      }

      // Load custom providers from localStorage
      try {
        const customProviders = localStorage.getItem("custom_api_providers");
        if (customProviders) {
          const parsed = JSON.parse(customProviders);
          parsed.forEach((provider: Provider) => {
            if (
              provider.label?.trim() &&
              provider.value?.trim() &&
              provider.base_url?.trim()
            ) {
              providers.push({
                label: provider.label,
                value: null, // prevent
                disabled: false,
                id: provider.id,
                base_url: null,
              });
            }
          });
        }
      } catch (error) {
        console.error("Error loading custom providers:", error);
      }

      setAvailableProviders(providers);
    };

    loadProviders();
  }, []);

  // Fetch models when a custom provider is selected
  useEffect(() => {
    const fetchModelsForProvider = async () => {
      if (!selectedProvider) {
        setFetchedModels([]);
        setModelsError(null);
        return;
      }

      // Check if it's a custom provider (UUID format)
      const isCustomProvider = selectedProvider.includes("-");

      if (!isCustomProvider) {
        // For built-in providers, clear fetched models for now
        setFetchedModels([]);
        setModelsError(null);
        return;
      }

      setIsLoadingModels(true);
      setModelsError(null);

      try {
        // Get the custom provider details
        const customProviders = localStorage.getItem("custom_api_providers");
        if (!customProviders) {
          throw new Error("No custom providers found");
        }

        const parsed = JSON.parse(customProviders);
        const provider = parsed.find(
          (p: Provider) => p.id === selectedProvider
        );

        if (!provider) {
          throw new Error("Selected provider not found");
        }

        const models = await fetchModels(provider);
        setFetchedModels(models);
      } catch (error) {
        console.error("Error fetching models:", error);
        setModelsError(
          error instanceof Error ? error.message : "Failed to fetch models"
        );
        setFetchedModels([]);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModelsForProvider();
  }, [selectedProvider]);

  // Reset pagination when search or provider changes
  useEffect(() => {
    setCurrentPage(1);
    setServerCurrentPage(1);
  }, [searchQuery, selectedProvider, selectedFeatures, activeByokTab, serverSearchQuery, serverSelectedFeatures]);

  // Convert system models to the format expected by the UI
  const availableModels = useMemo(() => {
    // If system models failed to load and we have an error, use fallback models
    const modelsToUse = systemModels.length === 0 && systemModelsError 
      ? DEFAULT_SYSTEM_MODELS 
      : systemModels;
      
    return modelsToUse.map(model => {
      const capabilities = getModelCapabilities(model.supported_parameters);
      return {
        name: model.name,
        description: model.description,
        features: [
          "Text Generation",
          ...(capabilities.hasTools ? ["Tool Calling"] : []),
          ...(capabilities.hasReasoning ? ["Reasoning"] : []),
          ...(capabilities.hasVision ? ["Vision"] : []),
        ],
        category: "server",
        id: model.id,
      };
    });
  }, [systemModels, systemModelsError]);

  // Filter and paginate server models
  const filteredAndPaginatedServerModels = useMemo(() => {
    let filteredServerModels = availableModels.filter(
      (model) => model.category === "server"
    );

    // Apply feature filtering for server models
    if (serverSelectedFeatures.length > 0) {
      filteredServerModels = filteredServerModels.filter((model) =>
        serverSelectedFeatures.every((feature) => model.features.includes(feature))
      );
    }

    // Apply search filtering for server models
    if (serverSearchQuery.trim()) {
      const query = serverSearchQuery.toLowerCase();
      filteredServerModels = filteredServerModels.filter(
        (model) =>
          model.name.toLowerCase().includes(query) ||
          model.description.toLowerCase().includes(query) ||
          model.features.some((feature: string) =>
            feature.toLowerCase().includes(query)
          )
      );
    }

    // Calculate pagination for server models
    const totalItems = filteredServerModels.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (serverCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedModels = filteredServerModels.slice(startIndex, endIndex);

    return {
      models: paginatedModels,
      totalItems,
      totalPages,
      currentPage: serverCurrentPage,
      hasNextPage: serverCurrentPage < totalPages,
      hasPreviousPage: serverCurrentPage > 1,
    };
  }, [availableModels, serverSelectedFeatures, serverSearchQuery, serverCurrentPage, itemsPerPage]);

  const featureOptions = ["Tool Calling", "Reasoning", "Vision"];

  // Filter and paginate models
  const filteredAndPaginatedModels = useMemo(() => {
    // Use paginated server models from the dedicated useMemo
    const serverModels = filteredAndPaginatedServerModels.models;

    // Handle BYOK models
    let byokModels: any[] = [];

    if (selectedProvider) {
      // Check if it's a custom provider (UUID format)
      const isCustomProvider = selectedProvider.includes("-");

      if (isCustomProvider) {
        // Use fetched models for custom providers
        byokModels = fetchedModels.map((model) => {
          const capabilities = getModelCapabilities(model.supported_parameters);
          return {
            name: model.name,
            description: model.description,
            features: [
              "Text Generation",
              ...(capabilities.hasTools ? ["Tool Calling"] : []),
              ...(capabilities.hasReasoning ? ["Reasoning"] : []),
              ...(capabilities.hasVision ? ["Vision"] : []),
            ],
            category: "byok",
            id: model.id,
            providerId: selectedProvider,
          };
        });
      } else {
        // Use static models for built-in providers
        byokModels = availableModels.filter(
          (model) => model.category === "byok"
        );
      }
    }

    // Apply feature filtering
    if (selectedFeatures.length > 0) {
      byokModels = byokModels.filter((model) =>
        selectedFeatures.every((feature) => model.features.includes(feature))
      );
    }

    // Apply search filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      byokModels = byokModels.filter(
        (model) =>
          model.name.toLowerCase().includes(query) ||
          model.description.toLowerCase().includes(query) ||
          model.features.some((feature: string) =>
            feature.toLowerCase().includes(query)
          )
      );
    }

    // Calculate pagination
    const totalItems = byokModels.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedModels = byokModels.slice(startIndex, endIndex);

    return {
      serverModels,
      byokModels: paginatedModels,
      totalItems,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }, [
    selectedProvider,
    selectedFeatures,
    searchQuery,
    currentPage,
    fetchedModels,
    itemsPerPage,
    availableModels,
  ]);

  // Calculate selected models separately
  const selectedByokModels = useMemo(() => {
    if (!selectedProvider) return [];

    // Check if it's a custom provider (UUID format)
    const isCustomProvider = selectedProvider.includes("-");

    let allByokModels: any[] = [];

    if (isCustomProvider) {
      // Use fetched models for custom providers
      allByokModels = fetchedModels.map((model) => {
        const capabilities = getModelCapabilities(model.supported_parameters);
        return {
          name: model.name,
          description: model.description,
          features: [
            "Text Generation",
            ...(capabilities.hasTools ? ["Tool Calling"] : []),
            ...(capabilities.hasReasoning ? ["Reasoning"] : []),
            ...(capabilities.hasVision ? ["Vision"] : []),
          ],
          category: "byok",
          id: model.id,
          providerId: selectedProvider,
        };
      });
    } else {
      // Use static models for built-in providers
      allByokModels = availableModels.filter(
        (model) => model.category === "byok"
      );
    }

    // Return only selected models
    return allByokModels.filter((model) =>
      selectedModels.some((selected) => selected.id === model.id)
    );
  }, [selectedProvider, fetchedModels, selectedModels, availableModels]);

  // Calculate pagination for selected models
  const selectedModelsPagination = useMemo(() => {
    const totalItems = selectedByokModels.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedModels = selectedByokModels.slice(startIndex, endIndex);

    return {
      models: paginatedModels,
      totalItems,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }, [selectedByokModels, currentPage, itemsPerPage]);

  const handleModelToggle = (
    modelId: string,
    modelName: string,
    enabled: boolean
  ) => {
    if (enabled) {
      setSelectedModels((prev) => [...prev, { id: modelId, name: modelName }]);
    } else {
      setSelectedModels((prev) => prev.filter((model) => model.id !== modelId));
    }
  };

  const handleUnselectAll = () => {
    // Clear all selected models for current provider
    setSelectedModels([]);
  };

  const handleFeatureSelect = (feature: string) => {
    setSelectedFeatures([feature]);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleServerPageChange = (page: number) => {
    setServerCurrentPage(page);
  };

  const handleServerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServerSearchQuery(e.target.value);
  };

  const handleServerFeatureSelect = (feature: string) => {
    setServerSelectedFeatures([feature]);
  };

  const handleServerModelToggle = (
    modelId: string,
    modelName: string,
    enabled: boolean
  ) => {
    // Don't allow toggling of fallback models
    const isFallbackModel = DEFAULT_SYSTEM_MODELS.some(model => model.id === modelId);
    if (isFallbackModel) {
      return; // Fallback models are always enabled
    }

    if (enabled) {
      setSelectedServerModels((prev) => [...prev, { id: modelId, name: modelName }]);
    } else {
      setSelectedServerModels((prev) => prev.filter((model) => model.id !== modelId));
    }
  };

  // Helper function to check if a server model is enabled
  const isServerModelEnabled = (modelId: string): boolean => {
    // Fallback models are always enabled
    const isFallbackModel = DEFAULT_SYSTEM_MODELS.some(model => model.id === modelId);
    if (isFallbackModel) {
      return true;
    }
    
    // Other models are enabled if they're in the selectedServerModels list
    return selectedServerModels.some(model => model.id === modelId);
  };

  // Helper function to check if a server model can be toggled
  const isServerModelToggleable = (modelId: string): boolean => {
    // Fallback models cannot be toggled (always enabled)
    return !DEFAULT_SYSTEM_MODELS.some(model => model.id === modelId);
  };

  const handleServerUnselectAll = () => {
    // Clear all selected server models (but keep fallback models always enabled)
    setSelectedServerModels([]);
  };

  const handleServerSelectAll = () => {
    // Select all available non-fallback server models
    const allToggleableModels = availableModels
      .filter(model => model.category === "server" && isServerModelToggleable(model.id))
      .map(model => ({ id: model.id, name: model.name }));
    setSelectedServerModels(allToggleableModels);
  };

  const renderPaginationButton = (page: number, isActive: boolean = false, handlePageChangeFunc: (page: number) => void) => (
    <button
      key={page}
      onClick={() => handlePageChangeFunc(page)}
      className={`
                px-3 py-2 text-sm font-medium rounded-lg min-w-[40px] border transition-colors
                ${
                  isActive
                    ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white border-transparent"
                    : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                }
            `}
    >
      {page}
    </button>
  );

  const renderPagination = (type: 'server' | 'byok' = 'byok') => {
    let paginationData;
    let handlePageChangeFunc;

    if (type === 'server') {
      paginationData = filteredAndPaginatedServerModels;
      handlePageChangeFunc = handleServerPageChange;
    } else {
      paginationData = activeByokTab === "selected"
        ? selectedModelsPagination
        : filteredAndPaginatedModels;
      handlePageChangeFunc = handlePageChange;
    }

    const { totalPages, currentPage, hasPreviousPage, hasNextPage } =
      paginationData;

    const pages = [];
    const maxVisiblePages = window.innerWidth < 640 ? 3 : 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(renderPaginationButton(i, i === currentPage, handlePageChangeFunc));
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 order-2 sm:order-1">
          Showing{" "}
          {Math.min(
            (currentPage - 1) * itemsPerPage + 1,
            paginationData.totalItems
          )}{" "}
          to {Math.min(currentPage * itemsPerPage, paginationData.totalItems)}{" "}
          of {paginationData.totalItems} models
        </div>

        <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
          <button
            onClick={() => handlePageChangeFunc(currentPage - 1)}
            disabled={!hasPreviousPage}
            className={`
                            px-3 py-2 text-sm font-medium rounded-lg border transition-colors
                            ${
                              hasPreviousPage
                                ? "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-700 cursor-not-allowed"
                            }
                        `}
          >
            Previous
          </button>

          {startPage > 1 && (
            <>
              {renderPaginationButton(1, false, handlePageChangeFunc)}
              {startPage > 2 && (
                <span className="px-2 text-zinc-400 text-sm">...</span>
              )}
            </>
          )}

          {pages}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="px-2 text-zinc-400 text-sm">...</span>
              )}
              {renderPaginationButton(totalPages, false, handlePageChangeFunc)}
            </>
          )}

          <button
            onClick={() => handlePageChangeFunc(currentPage + 1)}
            disabled={!hasNextPage}
            className={`
                            px-3 py-2 text-sm font-medium rounded-lg border transition-colors
                            ${
                              hasNextPage
                                ? "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-700 cursor-not-allowed"
                            }
                        `}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">
        Available Models
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        Choose which models appear in your model selector. This won't affect
        existing conversations.
      </p>

      <div className="space-y-8">
        {/* From Our Server Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              From Our Servers
            </h3>
            {systemModelsError && !isLoadingSystemModels && (
              <div className="text-sm text-amber-500 dark:text-amber-400">
                Using fallback models
              </div>
            )}
          </div>

          {/* Server Models Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
            <div className="w-full sm:w-64">
              <CustomDropdown
                label=""
                description=""
                options={["All Features", ...featureOptions]}
                selected={
                  serverSelectedFeatures.length === 0
                    ? "All Features"
                    : serverSelectedFeatures[0]
                }
                onSelect={(option) => {
                  if (option === "All Features") {
                    setServerSelectedFeatures([]);
                  } else {
                    handleServerFeatureSelect(option);
                  }
                }}
                animationsDisabled={settings.animationsDisabled}
              />
            </div>
          </div>

          {/* Server Models Search Bar */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search server models by name, description, or features..."
                  value={serverSearchQuery}
                  onChange={handleServerSearchChange}
                  className={`
                        w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-600 
                        rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                        placeholder-zinc-500 dark:placeholder-zinc-400 text-sm sm:text-base
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${
                          !settings.animationsDisabled
                            ? "transition-colors duration-200"
                            : ""
                        }
                    `}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleServerSelectAll}
                  className={`
                          w-full sm:w-auto px-4 py-2 text-sm font-medium text-white 
                          bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg 
                          hover:from-pink-700 hover:to-purple-700 whitespace-nowrap
                          ${
                            !settings.animationsDisabled
                              ? "transition-colors duration-200"
                              : ""
                          }
                      `}
                >
                  Select All
                </button>
                <button
                  onClick={handleServerUnselectAll}
                  className={`
                          w-full sm:w-auto px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 
                          hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800/50 
                          rounded-lg border border-zinc-300 dark:border-zinc-700 whitespace-nowrap
                          ${
                            !settings.animationsDisabled
                              ? "transition-colors duration-200"
                              : ""
                          }
                      `}
                >
                  Unselect All
                </button>
              </div>
            </div>
          </div>
          
          {/* Models Container with consistent styling */}
          <div className="flex flex-col flex-1 min-h-[200px]">
            <div
              className={`text-center py-2 text-zinc-500 dark:text-zinc-400 flex-1 flex flex-col items-center ${
                isLoadingSystemModels ? "justify-center" : ""
              }`}
            >
              {isLoadingSystemModels ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-lg">Loading System Models...</p>
                  </div>
                  <p className="text-sm">
                    Fetching available models from our servers.
                  </p>
                </>
              ) : filteredAndPaginatedServerModels.models.length === 0 ? (
                <>
                  <p className="text-lg mb-2">
                    {serverSearchQuery.trim() || serverSelectedFeatures.length > 0
                      ? "No Models Found"
                      : "No Models Available"}
                  </p>
                  <p className="text-sm">
                    {serverSearchQuery.trim() || serverSelectedFeatures.length > 0
                      ? "No server models match your search criteria. Try adjusting your search terms or filters."
                      : "No server models are available at this time."}
                  </p>
                </>
              ) : (
                <div className="space-y-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start w-full">
                  {filteredAndPaginatedServerModels.models.map((model) => (
                    <ModelCard
                      key={model.name}
                      name={model.name}
                      description={model.description}
                      features={model.features}
                      isEnabled={isServerModelEnabled(model.id)}
                      onToggle={isServerModelToggleable(model.id) ? (enabled) =>
                        handleServerModelToggle(model.id, model.name, enabled)
                      : () => {}} // No-op for fallback models
                      disabled={!isServerModelToggleable(model.id)} // Disable toggle for fallback models
                      hideScroll={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Server Models Pagination */}
          {!isLoadingSystemModels && filteredAndPaginatedServerModels.totalItems > 0 && (
            renderPagination('server')
          )}
        </div>

        {/* BYOK Models Section */}
        <div>
          {/* BYOK Models Title */}
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            BYOK Models
          </h3>

          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
            <div className="w-full sm:w-48">
              <CustomDropdown
                label=""
                description=""
                options={availableProviders.map((p) => p.label)}
                disabledOptions={availableProviders
                  .filter((p) => p.disabled)
                  .map((p) => p.label)}
                selected={
                  selectedProvider
                    ? availableProviders.find((p) => p.id === selectedProvider)
                        ?.label || "Select Provider"
                    : "Select Provider"
                }
                onSelect={(option) => {
                  const provider = availableProviders.find(
                    (p) => p.label === option
                  );
                  if (provider && !provider.disabled) {
                    setSelectedProvider(provider.id ?? "");
                  }
                }}
                animationsDisabled={settings.animationsDisabled}
              />
            </div>
            <div className="w-full sm:w-64">
              <CustomDropdown
                label=""
                description=""
                options={["All Features", ...featureOptions]}
                selected={
                  selectedFeatures.length === 0
                    ? "All Features"
                    : selectedFeatures[0]
                }
                onSelect={(option) => {
                  if (option === "All Features") {
                    setSelectedFeatures([]);
                  } else {
                    handleFeatureSelect(option);
                  }
                }}
                animationsDisabled={settings.animationsDisabled}
              />
            </div>
          </div>

          {/* BYOK Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6">
            <button
              onClick={() => setActiveByokTab("available")}
              className={`relative px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors focus:outline-none 
                ${
                  activeByokTab === "available"
                    ? "text-pink-500"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
            >
              Available
              {activeByokTab === "available" && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500"
                  transition={{
                    duration: settings.animationsDisabled ? 0 : 0.2,
                  }}
                />
              )}
            </button>
            <button
              onClick={() => selectedProvider && setActiveByokTab("selected")}
              className={`relative px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors focus:outline-none 
                ${
                  activeByokTab === "selected"
                    ? "text-pink-500"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
            >
              Selected {selectedProvider && `(${selectedModels.length})`}
              {activeByokTab === "selected" && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500"
                  transition={{
                    duration: settings.animationsDisabled ? 0 : 0.2,
                  }}
                />
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  disabled={!selectedProvider}
                  placeholder="Search models by name, description, or features..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className={`
                        w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-600 
                        rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                        placeholder-zinc-500 dark:placeholder-zinc-400 text-sm sm:text-base
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${
                          !settings.animationsDisabled
                            ? "transition-colors duration-200"
                            : ""
                        }
                    `}
                />
              </div>
              <button
                onClick={selectedProvider ? handleUnselectAll : () => {}}
                className={`
                        w-full sm:w-auto px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 
                        hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800/50 
                        rounded-lg border border-zinc-300 dark:border-zinc-700 whitespace-nowrap
                        ${
                          !settings.animationsDisabled
                            ? "transition-colors duration-200"
                            : ""
                        }
                    `}
              >
                Unselect All
              </button>
            </div>
          </div>
          {/* Models Container */}
          <div className={`flex flex-col flex-1 min-h-[300px]`}>
            {" "}
            {/* Added min-h to prevent layout jump */}
            <div
              className={`text-center py-2 text-zinc-500 dark:text-zinc-400 flex-1 flex flex-col items-center ${
                Boolean(modelsError || isLoadingModels || !selectedProvider)
                  ? "justify-center"
                  : ""
              }`}
            >
              {!selectedProvider ? (
                <>
                  <p className="text-lg mb-2">No Provider Selected</p>
                  <p className="text-sm">
                    Please select a provider from the dropdown above to view
                    available models.
                  </p>
                </>
              ) : (
                <>
                  {modelsError ? (
                    <>
                      <p className="text-lg mb-2 text-red-500 dark:text-red-400">
                        Error Loading Models
                      </p>
                      <p className="text-sm">{modelsError}</p>
                    </>
                  ) : isLoadingModels ? (
                    <>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div
                          className={`w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin`}
                        ></div>
                        <p className="text-lg">Loading Models...</p>
                      </div>
                      <p className="text-sm">
                        Fetching available models from the selected provider.
                      </p>
                    </>
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.div
                        // A unique key that changes with the page and tab is crucial
                        key={
                          activeByokTab === "selected"
                            ? `selected-${selectedModelsPagination.currentPage}`
                            : `available-${filteredAndPaginatedModels.currentPage}`
                        }
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ width: "100%" }}
                        transition={{ duration: 0.2 }}
                      >
                        {activeByokTab === "selected" ? (
                          selectedModelsPagination.models.length === 0 ? (
                            <>
                              <p className="text-lg mb-2">No Selected Models</p>
                              <p className="text-sm">
                                You haven't selected any models yet. Switch to
                                the Available tab to select models.
                              </p>
                            </>
                          ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                              {selectedModelsPagination.models.map((model) => (
                                <div
                                  key={model.id || model.name}
                                  className="h-full flex"
                                >
                                  <ModelCard
                                    name={model.name}
                                    description={model.description}
                                    features={model.features}
                                    isEnabled={true}
                                    onToggle={(enabled) =>
                                      handleModelToggle(
                                        model.id,
                                        model.name,
                                        enabled
                                      )
                                    }
                                  />
                                </div>
                              ))}
                            </div>
                          )
                        ) : filteredAndPaginatedModels.byokModels.length ===
                          0 ? (
                          <>
                            <p className="text-lg mb-2">
                              {searchQuery.trim()
                                ? "No Models Found"
                                : "No Models Available"}
                            </p>
                            <p className="text-sm">
                              {searchQuery.trim()
                                ? "No models match your search criteria. Try adjusting your search terms or filters."
                                : "No models match the selected provider and feature filters."}
                            </p>
                          </>
                        ) : (
                          <motion.div
                            className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start"
                            layout
                            transition={{
                              duration: settings.animationsDisabled ? 0 : 0.3,
                              ease: "easeInOut",
                            }}
                          >
                            {filteredAndPaginatedModels.byokModels.map(
                              (model) => (
                                <div
                                  key={model.id || model.name}
                                  className="h-full flex"
                                >
                                  <ModelCard
                                    name={model.name}
                                    description={model.description}
                                    features={model.features}
                                    isEnabled={selectedModels.some(
                                      (selected) => selected.id === model.id
                                    )}
                                    onToggle={(enabled) =>
                                      handleModelToggle(
                                        model.id,
                                        model.name,
                                        enabled
                                      )
                                    }
                                  />
                                </div>
                              )
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </>
              )}
            </div>
          </div>
          {renderPagination('byok')}
        </div>
      </div>
    </div>
  );
};

export default ModelsTab;
