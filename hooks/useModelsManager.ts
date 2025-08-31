import { useState, useEffect, useCallback, useMemo } from 'react';
import { Provider, Model } from '../types/providers';
import { fetchModels, fetchSystemModels, getModelCapabilities } from '../services/modelService';
import { DEFAULT_SYSTEM_MODELS } from '../constants/models';

// Type definitions
interface ModelsState {
  systemModels: Model[];
  isLoadingSystemModels: boolean;
  systemModelsError: string | null;
  fetchedModels: Model[];
  isLoadingModels: boolean;
  modelsError: string | null;
  isRefreshing: boolean; // Track if we're in the middle of a refresh
}

interface SelectedModelsState {
  selectedModels: Array<{ id: string; name: string; supported_parameters?: string[], category?: string; }>;
  selectedServerModels: Array<{ id: string; name: string; supported_parameters?: string[], category?: string; }>;
}

// Cache keys
const MODELS_CACHE_KEYS = {
  PROVIDER_MODELS: (providerId: string) => `models_${providerId}`,
  SERVER_MODELS: 'selected_server_models',
  SYSTEM_MODELS_CACHE: 'system_models_cache',
  SYSTEM_MODELS_CACHE_TIMESTAMP: 'system_models_cache_timestamp',
} as const;

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Custom hook for managing models state and localStorage operations
 * Provides optimized model management with caching and debouncing
 */
export const useModelsManager = () => {
  // Models state
  const [modelsState, setModelsState] = useState<ModelsState>({
    systemModels: [],
    isLoadingSystemModels: false,
    systemModelsError: null,
    fetchedModels: [],
    isLoadingModels: false,
    modelsError: null,
    isRefreshing: false,
  });

  // Selected models state
  const [selectedModelsState, setSelectedModelsState] = useState<SelectedModelsState>({
    selectedModels: [],
    selectedServerModels: [],
  });

  // Memoized localStorage operations
  const storageOperations = useMemo(() => ({
    loadSelectedModels: (providerId: string) => {
      if (!providerId) return [];
      try {
        const key = MODELS_CACHE_KEYS.PROVIDER_MODELS(providerId);
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error('Error loading selected models:', error);
        return [];
      }
    },

    saveSelectedModels: (providerId: string, models: any[]) => {
      if (!providerId) return;
      try {
        const key = MODELS_CACHE_KEYS.PROVIDER_MODELS(providerId);
        localStorage.setItem(key, JSON.stringify(models));
        
        // Dispatch event for cross-component communication
        window.dispatchEvent(
          new CustomEvent('localStorageChange', {
            detail: { key, value: models },
          })
        );
      } catch (error) {
        console.error('Error saving selected models:', error);
      }
    },

    loadSelectedServerModels: () => {
      try {
        const stored = localStorage.getItem(MODELS_CACHE_KEYS.SERVER_MODELS);
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error('Error loading selected server models:', error);
        return [];
      }
    },

    saveSelectedServerModels: (models: any[]) => {
      try {
        localStorage.setItem(MODELS_CACHE_KEYS.SERVER_MODELS, JSON.stringify(models));
        
        // Dispatch event for cross-component communication
        window.dispatchEvent(
          new CustomEvent('localStorageChange', {
            detail: { key: MODELS_CACHE_KEYS.SERVER_MODELS, value: models },
          })
        );
      } catch (error) {
        console.error('Error saving selected server models:', error);
      }
    },

    loadSystemModelsFromCache: () => {
      try {
        const cached = localStorage.getItem(MODELS_CACHE_KEYS.SYSTEM_MODELS_CACHE);
        const timestamp = localStorage.getItem(MODELS_CACHE_KEYS.SYSTEM_MODELS_CACHE_TIMESTAMP);
        
        if (cached && timestamp) {
          const age = Date.now() - parseInt(timestamp);
          if (age < CACHE_DURATION) {
            return JSON.parse(cached);
          }
        }
        return null;
      } catch (error) {
        console.error('Error loading system models from cache:', error);
        return null;
      }
    },

    saveSystemModelsToCache: (models: Model[]) => {
      try {
        localStorage.setItem(MODELS_CACHE_KEYS.SYSTEM_MODELS_CACHE, JSON.stringify(models));
        localStorage.setItem(MODELS_CACHE_KEYS.SYSTEM_MODELS_CACHE_TIMESTAMP, Date.now().toString());
      } catch (error) {
        console.error('Error saving system models to cache:', error);
      }
    },
  }), []);

  // Fetch system models with caching
  const fetchSystemModelsWithCache = useCallback(async (forceRefresh = false) => {
    // Prevent double fetching
    if (modelsState.isRefreshing) {
      return;
    }

    setModelsState(prev => ({ ...prev, isLoadingSystemModels: true, systemModelsError: null, isRefreshing: true }));

    try {
      // Skip cache if force refresh is requested
      if (!forceRefresh) {
        // Try cache first
        const cached = storageOperations.loadSystemModelsFromCache();
        if (cached) {
          setModelsState(prev => ({ ...prev, systemModels: cached, isLoadingSystemModels: false, isRefreshing: false }));
          return;
        }
      }

      // Fetch fresh data
      const models = await fetchSystemModels();
      setModelsState(prev => ({ ...prev, systemModels: models, systemModelsError: null }));
      
      // Cache the result
      storageOperations.saveSystemModelsToCache(models);
    } catch (error) {
      console.error('Error fetching system models:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch system models';
      setModelsState(prev => ({ 
        ...prev, 
        systemModelsError: errorMessage,
        systemModels: DEFAULT_SYSTEM_MODELS 
      }));
    } finally {
      setModelsState(prev => ({ ...prev, isLoadingSystemModels: false, isRefreshing: false }));
    }
  }, [storageOperations, modelsState.isRefreshing]);

  // Fetch provider models with error handling
  const fetchProviderModels = useCallback(async (provider: Provider) => {
    if (!provider) return;

    setModelsState(prev => ({ ...prev, isLoadingModels: true, modelsError: null }));

    try {
      const models = await fetchModels(provider);
      setModelsState(prev => ({ ...prev, fetchedModels: models, modelsError: null }));
    } catch (error) {
      console.error(`Error fetching models for provider ${provider.label}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch models';
      setModelsState(prev => ({ ...prev, modelsError: errorMessage, fetchedModels: [] }));
    } finally {
      setModelsState(prev => ({ ...prev, isLoadingModels: false }));
    }
  }, []);

  // Load selected models for a provider
  const loadSelectedModelsForProvider = useCallback((providerId: string) => {
    const models = storageOperations.loadSelectedModels(providerId);
    setSelectedModelsState(prev => ({ ...prev, selectedModels: models }));
  }, [storageOperations]);

  // Save selected models for a provider
  const saveSelectedModelsForProvider = useCallback((providerId: string, models: any[]) => {
    storageOperations.saveSelectedModels(providerId, models);
    setSelectedModelsState(prev => ({ ...prev, selectedModels: models }));
  }, [storageOperations]);

  // Load selected server models
  const loadSelectedServerModels = useCallback(() => {
    const models = storageOperations.loadSelectedServerModels();
    setSelectedModelsState(prev => ({ ...prev, selectedServerModels: models }));
  }, [storageOperations]);

  // Save selected server models
  const saveSelectedServerModels = useCallback((models: any[]) => {
    storageOperations.saveSelectedServerModels(models);
    setSelectedModelsState(prev => ({ ...prev, selectedServerModels: models }));
  }, [storageOperations]);

  // Initialize system models on mount
  useEffect(() => {
    fetchSystemModelsWithCache();
  }, [fetchSystemModelsWithCache]);

  // Initialize selected server models on mount
  useEffect(() => {
    loadSelectedServerModels();
  }, [loadSelectedServerModels]);

  // Create available models with capabilities
  const availableModels = useMemo(() => {
    const modelsToUse = modelsState.systemModels.length === 0 && modelsState.systemModelsError 
      ? DEFAULT_SYSTEM_MODELS 
      : modelsState.systemModels;
      
    return modelsToUse.map(model => {
      const capabilities = getModelCapabilities(model.supported_parameters || []);
      
      // Handle image generation models (including jobs) - ONLY Image Generation
      if (capabilities.hasImageGeneration || capabilities.hasImageGenerationJobs) {
        const features = ["Image Generation"];
        
        // Only add other capabilities if they exist, but NOT text generation
        if (capabilities.hasImageEditing) features.push("Image Editing");
        if (capabilities.hasVision) features.push("Vision");
        if (capabilities.hasTools) features.push("Tool Calling");
        
        return {
          name: model.name,
          description: model.description,
          features,
          category: "server" as const,
          id: model.id,
          supported_parameters: model.supported_parameters,
        };
      }
      
      // Handle image editing models - ONLY Image Editing (and other non-text capabilities)
      if (capabilities.hasImageEditing) {
        const features = ["Image Editing"];
        
        // Add other capabilities but NOT text generation
        if (capabilities.hasImageGeneration || capabilities.hasImageGenerationJobs) features.unshift("Image Generation");
        if (capabilities.hasVision) features.push("Vision");
        if (capabilities.hasTools) features.push("Tool Calling");
        
        return {
          name: model.name,
          description: model.description,
          features,
          category: "server" as const,
          id: model.id,
          supported_parameters: model.supported_parameters,
        };
      }
      
      // Regular models - build features array dynamically
      const features: string[] = [];
      
      // Always add text generation if available
      if (capabilities.hasTextGeneration) {
        features.push("Text Generation");
      }
      
      // Add other capabilities
      if (capabilities.hasTools) features.push("Tool Calling");
      if (capabilities.hasReasoning) features.push("Reasoning");
      if (capabilities.hasVision) features.push("Vision");
      
      // Ensure we always have at least "Text Generation" for fallback
      if (features.length === 0) {
        features.push("Text Generation");
      }
      
      return {
        name: model.name,
        description: model.description,
        features,
        category: "server" as const,
        id: model.id,
        supported_parameters: model.supported_parameters,
      };
    });
  }, [modelsState.systemModels, modelsState.systemModelsError]);

  return {
    // Models state
    ...modelsState,
    ...selectedModelsState,
    availableModels,
    
    // Actions
    fetchProviderModels,
    loadSelectedModelsForProvider,
    saveSelectedModelsForProvider,
    loadSelectedServerModels,
    saveSelectedServerModels,
    refreshSystemModels: (forceRefresh = false) => fetchSystemModelsWithCache(forceRefresh),
  };
};