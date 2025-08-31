import React, { useState, useEffect, useMemo, useCallback } from "react";
import CustomDropdown from "../../ui/CustomDropdown";
import ModelCard from "../ModelCard";
import AdvancedFilter from "../../ui/AdvancedFilter";
import { LoadingOverlay } from "../../ui/LoadingOverlay";
import { AppSettings } from "../../../hooks/useSettings";
import { Provider } from "../../../types/providers";
import { useModelsManager } from "../../../hooks/useModelsManager";
import { usePagination, useSearchAndFilter } from "../../../hooks/usePagination";
import { useLocalStorageData } from "../../../hooks/useLocalStorageData";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "../../Icons";
import { MODEL_FILTER_CATEGORIES, FILTER_ID_MAPPING, REVERSE_FILTER_ID_MAPPING } from "../../../constants/modelFilters";
import { DEFAULT_MODEL_ID } from "../../../constants/models";

interface ModelsTabProps {
  settings: AppSettings;
}

// Constants
const ITEMS_PER_PAGE = 6;

const ModelsTab: React.FC<ModelsTabProps> = ({ settings }) => {
  // State management
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [activeByokTab, setActiveByokTab] = useState<"selected" | "available">("available");
  const [availableProviders, setAvailableProviders] = useState<Array<Provider>>([]);

  // Custom hooks
  const modelsManager = useModelsManager();
  const { loadProvidersFromStorage } = useLocalStorageData();

  // Pagination and filtering for BYOK models
  const byokPagination = usePagination<any>({ itemsPerPage: ITEMS_PER_PAGE });
  const byokFilter = useSearchAndFilter();

  // Pagination and filtering for server models
  const serverPagination = usePagination<any>({ itemsPerPage: ITEMS_PER_PAGE });
  const serverFilter = useSearchAndFilter();

  // Convert between old feature names and new filter IDs
  const convertFeaturesToFilterIds = useCallback((features: string[]): string[] => {
    return features.map(feature => FILTER_ID_MAPPING[feature] || feature.toLowerCase().replace(/\s+/g, '-'));
  }, []);

  // Handle advanced filter changes
  const handleServerFilterChange = useCallback((filterId: string) => {
    const featureName = REVERSE_FILTER_ID_MAPPING[filterId];
    if (featureName) {
      serverFilter.handleFeatureToggle(featureName);
    }
  }, [serverFilter]);

  const handleServerClearAllFilters = useCallback(() => {
    serverFilter.clearFilters();
  }, [serverFilter]);

  const handleByokFilterChange = useCallback((filterId: string) => {
    const featureName = REVERSE_FILTER_ID_MAPPING[filterId];
    if (featureName) {
      byokFilter.handleFeatureToggle(featureName);
    }
  }, [byokFilter]);

  const handleByokClearAllFilters = useCallback(() => {
    byokFilter.clearFilters();
  }, [byokFilter]);

  // Load providers on component mount
  useEffect(() => {
    const loadProviders = () => {
      let providers: Array<Provider> = [];

      // Load built-in providers
      const builtInProviders = loadProvidersFromStorage("builtin_api_providers", [
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
      ]);

      providers = builtInProviders.map((p: Provider) => ({
        ...p,
        disabled: !p.value?.trim(),
      }));

      // Load custom providers
      const customProviders = loadProvidersFromStorage("custom_api_providers", []);
      providers = [...providers, ...customProviders];

      setAvailableProviders(providers);
    };

    loadProviders();
  }, [loadProvidersFromStorage]);

  // Fetch models when provider changes
  useEffect(() => {
    if (selectedProvider) {
      const provider = availableProviders.find(p => p.id === selectedProvider);
      if (provider) {
        modelsManager.fetchProviderModels(provider);
      }
      modelsManager.loadSelectedModelsForProvider(selectedProvider);
    }
  }, [selectedProvider, availableProviders, modelsManager]);

  // Reset pagination when search or filters change
  useEffect(() => {
    byokPagination.goToPage(1);
  }, [byokFilter.searchQuery, byokFilter.selectedFeatures, activeByokTab, selectedProvider]);

  useEffect(() => {
    serverPagination.goToPage(1);
  }, [serverFilter.searchQuery, serverFilter.selectedFeatures]);

  // Memoized filtered and paginated models
  const filteredServerModels = useMemo(() => {
    const serverModels = modelsManager.availableModels.filter(
      (model) => model.category === "server"
    );

    return serverFilter.filterItems(serverModels, ['name'], 'features');
  }, [modelsManager.availableModels, serverFilter]);

  const paginatedServerModels = useMemo(() => {
    const paginatedItems = serverPagination.getPaginatedItems(filteredServerModels);
    const { totalPages } = serverPagination.getPaginationInfo(filteredServerModels.length);
    
    return {
      models: paginatedItems,
      totalItems: filteredServerModels.length,
      totalPages,
      currentPage: serverPagination.currentPage,
      hasNextPage: serverPagination.currentPage < totalPages,
      hasPreviousPage: serverPagination.hasPreviousPage,
    };
  }, [filteredServerModels, serverPagination]);

  const filteredByokModels = useMemo(() => {
    if (!selectedProvider) return [];

    let models: any[] = [];

    if (activeByokTab === "available") {
      models = modelsManager.fetchedModels.map(model => ({
        name: model.name,
        description: model.description,
        features: ["Text Generation"],
        category: "byok",
        id: model.id,
        supported_parameters: model.supported_parameters,
      }));
    } else {
      // Show selected models
      models = modelsManager.selectedModels.map(model => {
        const fullModel = modelsManager.fetchedModels.find(m => m.id === model.id) || 
                         modelsManager.availableModels.find(m => m.id === model.id);
        return {
          name: model.name,
          description: fullModel?.description || "",
          features: ["Text Generation"],
          category: "byok",
          id: model.id,
          supported_parameters: model.supported_parameters || [],
        };
      });
    }

    return byokFilter.filterItems(models, ['name'], 'features');
  }, [
    selectedProvider,
    activeByokTab,
    modelsManager.fetchedModels,
    modelsManager.selectedModels,
    modelsManager.availableModels,
    byokFilter
  ]);

  const paginatedByokModels = useMemo(() => {
    const paginatedItems = byokPagination.getPaginatedItems(filteredByokModels);
    const { totalPages } = byokPagination.getPaginationInfo(filteredByokModels.length);
    
    return {
      models: paginatedItems,
      totalItems: filteredByokModels.length,
      totalPages,
      currentPage: byokPagination.currentPage,
      hasNextPage: byokPagination.currentPage < totalPages,
      hasPreviousPage: byokPagination.hasPreviousPage,
    };
  }, [filteredByokModels, byokPagination]);

  // Event handlers
  const handleModelToggle = useCallback((modelId: string, modelName: string, enabled: boolean) => {
    if (!selectedProvider) return;

    const currentSelected = [...modelsManager.selectedModels];
    
    if (enabled) {
      // Add model if not already selected
      if (!currentSelected.find(m => m.id === modelId)) {
        currentSelected.push({
          id: modelId,
          name: modelName,
          supported_parameters: modelsManager.fetchedModels.find(m => m.id === modelId)?.supported_parameters || [],
          category: "byok",
        });
      }
    } else {
      // Remove model
      const filtered = currentSelected.filter(m => m.id !== modelId);
      modelsManager.saveSelectedModelsForProvider(selectedProvider, filtered);
      return;
    }

    modelsManager.saveSelectedModelsForProvider(selectedProvider, currentSelected);
  }, [selectedProvider, modelsManager]);

  const handleServerModelToggle = useCallback((modelId: string, modelName: string, enabled: boolean) => {
    if (modelId == DEFAULT_MODEL_ID) {
      return;
    }

    const currentSelected = [...modelsManager.selectedServerModels];
    
    if (enabled) {
      if (!currentSelected.find(m => m.id === modelId)) {
        const model = modelsManager.availableModels.find(m => m.id === modelId);
        currentSelected.push({
          id: modelId,
          name: modelName,
          supported_parameters: model?.supported_parameters || [],
          category: model?.category || "server",
        });
      }
    } else {
      const filtered = currentSelected.filter(m => m.id !== modelId);
      modelsManager.saveSelectedServerModels(filtered);
      return;
    }

    modelsManager.saveSelectedServerModels(currentSelected);
  }, [modelsManager]);

  const handleUnselectAll = useCallback(() => {
    if (selectedProvider) {
      modelsManager.saveSelectedModelsForProvider(selectedProvider, []);
    }
  }, [selectedProvider, modelsManager]);

  const handleServerUnselectAll = useCallback(() => {
    modelsManager.saveSelectedServerModels([]);
  }, [modelsManager]);

  const handleServerSelectAll = useCallback(() => {
    const allSelectableModels = modelsManager.availableModels
      .filter(model => model.category === "server")
      .map(model => ({
        id: model.id,
        name: model.name,
        supported_parameters: model.supported_parameters || []
      }));
    
    modelsManager.saveSelectedServerModels(allSelectableModels);
  }, [modelsManager]);

  const handleRefreshServerModels = useCallback(() => {
    modelsManager.refreshSystemModels(true); // Force refresh to bypass cache
  }, [modelsManager]);

  // Helper functions
  const isServerModelEnabled = useCallback((modelId: string): boolean => {
    if (modelId === DEFAULT_MODEL_ID) return true;
    return modelsManager.selectedServerModels.some(m => m.id === modelId);
  }, [modelsManager.selectedServerModels, DEFAULT_MODEL_ID]);

  const isModelSelected = useCallback((modelId: string): boolean => {
    return modelsManager.selectedModels.some(m => m.id === modelId);
  }, [modelsManager.selectedModels]);

  // Render pagination component
  const renderPagination = useCallback((type: 'server' | 'byok' = 'byok') => {
    const paginationData = type === 'server' ? paginatedServerModels : paginatedByokModels;
    const pagination = type === 'server' ? serverPagination : byokPagination;

    if (paginationData.totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, paginationData.currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(paginationData.totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => pagination.goToPage(paginationData.currentPage - 1)}
          disabled={!paginationData.hasPreviousPage}
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        
        {pageNumbers.map(page => (
          <button
            key={page}
            onClick={() => pagination.goToPage(page)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
              page === paginationData.currentPage
                ? 'border-pink-500 bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                : 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => pagination.goToPage(paginationData.currentPage + 1)}
          disabled={!paginationData.hasNextPage}
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    );
  }, [paginatedServerModels, paginatedByokModels, serverPagination, byokPagination]);

  return (
    <div className="space-y-8">
      {/* Server Models Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Server Models
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleRefreshServerModels}
              disabled={modelsManager.isLoadingSystemModels}
              className="px-3 py-1 text-sm bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              title="Refresh server models"
            >
              <RefreshCw className={`w-4 h-4 ${modelsManager.isLoadingSystemModels ? 'animate-spin' : ''}`} />
              {modelsManager.isLoadingSystemModels ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={handleServerSelectAll}
              className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40"
            >
              Select All
            </button>
            <button
              onClick={handleServerUnselectAll}
              className="px-3 py-1 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              Unselect All
            </button>
          </div>
        </div>

        {/* Server Models Filters */}
        <div className={`flex flex-col lg:flex-row gap-4 mb-6 transition-all duration-300 ${
          modelsManager.isLoadingSystemModels ? 'opacity-60 pointer-events-none' : 'opacity-100'
        }`}>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search server models..."
              value={serverFilter.searchQuery}
              onChange={(e) => serverFilter.handleSearchChange(e.target.value)}
              disabled={modelsManager.isLoadingSystemModels}
              className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2.5 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="flex-shrink-0 lg:w-80">
            <AdvancedFilter
              categories={MODEL_FILTER_CATEGORIES}
              selectedFilters={convertFeaturesToFilterIds(serverFilter.selectedFeatures)}
              onFilterChange={handleServerFilterChange}
              onClearAll={handleServerClearAllFilters}
              placeholder="Filter by capabilities"
              disabled={modelsManager.isLoadingSystemModels}
            />
          </div>
        </div>

        {/* Server Models Content Area */}
        <div className="relative min-h-[400px]">
          {/* Loading Overlay */}
          <LoadingOverlay
            isVisible={modelsManager.isLoadingSystemModels}
            title="Loading server models..."
            subtitle="Please wait while we fetch the latest models from our servers"
            className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md"
          />

          {/* Error State */}
          {modelsManager.systemModelsError && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Failed to fetch server models
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
                  disabled={modelsManager.isLoadingSystemModels}
                  className="ml-4 px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
                >

                  <RefreshCw className={`w-4 h-4 ${modelsManager.isLoadingSystemModels ? 'animate-spin' : ''}`} />
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Server Models Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 transition-all duration-300 ${
            modelsManager.isLoadingSystemModels ? 'opacity-50 blur-sm pointer-events-none' : 'opacity-100 blur-none'
          }`}>
            <AnimatePresence mode="wait">
              {paginatedServerModels.models.map((model, index) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    duration: settings.animationsDisabled ? 0 : 0.2, 
                    delay: settings.animationsDisabled ? 0 : index * 0.05 
                  }}
                >
                  <ModelCard
                    key={model.id}
                    name={model.name}
                    description={model.description}
                    features={model.features}
                    isEnabled={isServerModelEnabled(model.id)}
                    onToggle={(enabled) => handleServerModelToggle(model.id, model.name, enabled)}
                    disabled={modelsManager.isLoadingSystemModels || model.id === DEFAULT_MODEL_ID}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {renderPagination('server')}
      </section>

      {/* BYOK Models Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">
          Bring Your Own Key (BYOK) Models
        </h2>

        {/* Provider Selection */}
        <div className={`mb-6 transition-all duration-300 ${
          modelsManager.isLoadingModels ? 'opacity-60 pointer-events-none' : 'opacity-100'
        }`}>
          <CustomDropdown
            label="Select API Provider"
            description=""
            options={availableProviders.map(p => p.label)}
            selected={selectedProvider 
              ? availableProviders.find(p => p.id === selectedProvider)?.label || "Choose a provider..."
              : "Choose a provider..."
            }
            onSelect={(option) => {
              const provider = availableProviders.find(p => p.label === option);
              if (provider) {
                setSelectedProvider(provider.id);
              }
            }}
            animationsDisabled={settings.animationsDisabled}
            disabledOptions={availableProviders.filter(p => p.disabled).map(p => p.label)}
          />
        </div>

        {selectedProvider && (
          <>
            {/* BYOK Tab Navigation */}
            <div className={`flex border-b border-zinc-200 dark:border-zinc-700 mb-6 transition-all duration-300 ${
              modelsManager.isLoadingModels ? 'opacity-60 pointer-events-none' : 'opacity-100'
            }`}>
              <button
                onClick={() => setActiveByokTab("available")}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeByokTab === "available"
                    ? "border-pink-500 text-pink-600 dark:text-pink-400"
                    : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                Available Models
              </button>
              <button
                onClick={() => setActiveByokTab("selected")}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeByokTab === "selected"
                    ? "border-pink-500 text-pink-600 dark:text-pink-400"
                    : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                Selected Models ({modelsManager.selectedModels.length})
              </button>
            </div>

            {/* BYOK Models Filters */}
            <div className={`flex flex-col lg:flex-row gap-4 mb-6 transition-all duration-300 ${
              modelsManager.isLoadingModels ? 'opacity-60 pointer-events-none' : 'opacity-100'
            }`}>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search BYOK models..."
                  value={byokFilter.searchQuery}
                  onChange={(e) => byokFilter.handleSearchChange(e.target.value)}
                  disabled={modelsManager.isLoadingModels}
                  className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2.5 px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-shrink-0 lg:w-80">
                  <AdvancedFilter
                    categories={MODEL_FILTER_CATEGORIES}
                    selectedFilters={convertFeaturesToFilterIds(byokFilter.selectedFeatures)}
                    onFilterChange={handleByokFilterChange}
                    onClearAll={handleByokClearAllFilters}
                    placeholder="Filter by capabilities"
                    disabled={modelsManager.isLoadingModels}
                  />
                </div>
                {activeByokTab === "selected" && (
                  <button
                    onClick={handleUnselectAll}
                    className="px-3 py-1.5 text-sm font-medium bg-zinc-100 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 transition-colors whitespace-nowrap"
                  >
                    Unselect All
                  </button>
                )}
              </div>
            </div>

            {/* BYOK Models Content Area */}
            <div className="relative min-h-[400px]">
              {/* Loading Overlay */}
              <LoadingOverlay
                isVisible={modelsManager.isLoadingModels}
                title="Loading models..."
                subtitle="Please wait while we fetch models from your selected provider"
                className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md"
              />

              {/* Error State */}
              {modelsManager.modelsError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <p className="text-red-800 dark:text-red-200">
                    {modelsManager.modelsError}
                  </p>
                </div>
              )}

              {/* Empty State */}
              {!modelsManager.isLoadingModels && !modelsManager.modelsError && paginatedByokModels.models.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-zinc-500 dark:text-zinc-400">
                    {activeByokTab === "selected" 
                      ? "No models selected yet. Switch to 'Available Models' to select some."
                      : "No models found."
                    }
                  </p>
                </div>
              )}

              {/* BYOK Models Grid */}
              {paginatedByokModels.models.length > 0 && (
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 transition-all duration-300 ${
                  modelsManager.isLoadingModels ? 'opacity-50 blur-sm pointer-events-none' : 'opacity-100 blur-none'
                }`}>
                  <AnimatePresence mode="wait">
                    {paginatedByokModels.models.map((model, index) => (
                      <motion.div
                        key={model.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ 
                          duration: settings.animationsDisabled ? 0 : 0.2, 
                          delay: settings.animationsDisabled ? 0 : index * 0.05 
                        }}
                      >
                        <ModelCard
                          name={model.name}
                          description={model.description}
                          features={model.features}
                          isEnabled={isModelSelected(model.id)}
                          onToggle={(enabled) => handleModelToggle(model.id, model.name, enabled)}
                          disabled={modelsManager.isLoadingModels}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Pagination */}
              {paginatedByokModels.models.length > 0 && renderPagination('byok')}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default ModelsTab;
