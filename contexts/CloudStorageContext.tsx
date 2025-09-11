import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { CloudStorageService, ConflictData, CloudStorageEvents } from '../services/cloudStorageService';
import { Provider } from '../types/providers';

interface CloudStorageContextType {
  // Data state
  custom_providers: Provider[];
  selected_server_models: any[];
  selected_provider_models: Record<string, any[]>;
  custom_models: any[]; // This will be deprecated, keeping for backward compatibility
  
  // Sync state
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  
  // Methods
  saveCustomProviders: (providers: Provider[]) => Promise<void>;
  loadCustomProviders: () => Promise<Provider[]>;
  saveSelectedServerModels: (models: any[]) => Promise<void>;
  loadSelectedServerModels: () => Promise<any[]>;
  saveSelectedModelsForProvider: (providerId: string, models: any[]) => Promise<void>;
  loadSelectedModelsForProvider: (providerId: string) => Promise<any[]>;
  saveCustomModels: (models: any[]) => Promise<void>; // Deprecated, use saveCustomModelsForProvider
  loadCustomModels: () => Promise<any[]>; // Deprecated, use loadCustomModelsForProvider
  saveCustomModelsForProvider: (providerId: string, models: any[]) => Promise<void>;
  loadCustomModelsForProvider: (providerId: string) => Promise<any[]>;
  syncWithCloud: () => Promise<void>;
  clearSyncError: () => void;
  
  // Optimized individual model operations
  addServerModel: (model: any) => Promise<void>;
  removeServerModel: (modelId: string) => Promise<void>;
  addProviderModel: (providerId: string, model: any) => Promise<void>;
  removeProviderModel: (providerId: string, modelId: string) => Promise<void>;
  addCustomModel: (providerId: string, model: any) => Promise<void>;
  removeCustomModel: (providerId: string, modelId: string) => Promise<void>;
  cleanupDuplicateCustomModels: (providerId: string) => Promise<void>;
  
  // Cleanup operations
  cleanupAllDuplicateModels: () => Promise<void>;
  
  // Conflict resolution
  onDataConflict?: (conflict: ConflictData) => Promise<'local' | 'cloud' | 'merge'>;
  setConflictResolver: (resolver: (conflict: ConflictData) => Promise<'local' | 'cloud' | 'merge'>) => void;
}

const CloudStorageContext = createContext<CloudStorageContextType | undefined>(undefined);

export const useCloudStorage = () => {
  const context = useContext(CloudStorageContext);
  if (context === undefined) {
    throw new Error('useCloudStorage must be used within a CloudStorageProvider');
  }
  return context;
};

interface CloudStorageProviderProps {
  children: ReactNode;
  user: User | null;
}

export const CloudStorageProvider: React.FC<CloudStorageProviderProps> = ({ 
  children, 
  user 
}) => {
  // Data state
  const [custom_providers, setCustomProviders] = useState<Provider[]>([]);
  const [selected_server_models, setSelectedServerModels] = useState<any[]>([]);
  const [selected_provider_models, setSelectedProviderModels] = useState<Record<string, any[]>>({});
  const [custom_models, setCustomModels] = useState<any[]>([]);
  
  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Conflict resolution
  const conflictResolverRef = useRef<((conflict: ConflictData) => Promise<'local' | 'cloud' | 'merge'>) | undefined>(undefined);
  
  // Track if we've performed initial sync for the current user
  const initialSyncPerformed = useRef<string | null>(null);

  // Set conflict resolver
  const setConflictResolver = useCallback((
    resolver: (conflict: ConflictData) => Promise<'local' | 'cloud' | 'merge'>
  ) => {
    conflictResolverRef.current = resolver;
  }, []);

  // Clear sync error
  const clearSyncError = useCallback(() => {
    setSyncError(null);
  }, []);

  // Create cloud storage events handler
  const createCloudStorageEvents = useCallback((): CloudStorageEvents => ({
    onSyncStart: () => {
      setIsSyncing(true);
      setSyncError(null);
    },
    onSyncComplete: () => {
      setIsSyncing(false);
      setLastSyncTime(new Date());
    },
    onSyncError: (error: Error) => {
      setIsSyncing(false);
      setSyncError(error.message);
      console.error('Cloud sync error:', error);
    },
    onDataConflict: async (conflict: ConflictData) => {
      if (conflictResolverRef.current) {
        return await conflictResolverRef.current(conflict);
      }
      // Default to merge if no resolver is set
      return 'merge';
    },
  }), []);

  // Helper function to deduplicate models by ID
  const deduplicateModels = (models: any[]): any[] => {
    const seen = new Set<string>();
    return models.filter(model => {
      if (seen.has(model.id)) {
        return false;
      }
      seen.add(model.id);
      return true;
    });
  };

  // Helper function to deduplicate provider models
  const deduplicateProviderModels = (providerModels: Record<string, any[]>): Record<string, any[]> => {
    const result: Record<string, any[]> = {};
    Object.keys(providerModels).forEach(providerId => {
      result[providerId] = deduplicateModels(providerModels[providerId] || []);
    });
    return result;
  };

  // Load data from appropriate source - SIMPLE, no automatic model loading
  const loadData = useCallback(async () => {
    try {
      const allData = await CloudStorageService.loadAllData(user);
      
      setCustomProviders(allData.custom_providers || []);
      setSelectedServerModels(deduplicateModels(allData.selected_server_models || []));
      
      // Aggregate all custom models from provider-specific keys
      const aggregatedCustomModels: any[] = [...(allData.custom_models || [])];
      
      // Add custom models from each provider, preserving provider_id
      Object.keys(allData).forEach(key => {
        if (key.startsWith('custom_models_') && Array.isArray(allData[key])) {
          const providerId = key.replace('custom_models_', '');
          const providerModels = allData[key].map((model: any) => ({
            ...model,
            provider_id: model.provider_id || providerId // Preserve existing provider_id or set from key
          }));
          aggregatedCustomModels.push(...providerModels);
        }
      });
      
      setCustomModels(deduplicateModels(aggregatedCustomModels));
      
      // DON'T automatically load provider models - let the models tab handle that when needed
      // But ensure we deduplicate any models that might have been duplicated during sync
      setSelectedProviderModels(deduplicateProviderModels(allData.selected_provider_models || {}));
    } catch (error) {
      console.error('Error loading data:', error);
      setSyncError('Failed to load data');
    }
  }, [user]);

  // Sync with cloud
  const syncWithCloud = useCallback(async () => {
    if (!user || user.isAnonymous) {
      await loadData(); // Just load local data for anonymous users
      return;
    }

    try {
      const events = createCloudStorageEvents();
      const syncedData = await CloudStorageService.syncWithCloud(user, events);
      
      // Update local state with synced data
      setCustomProviders(syncedData.custom_providers || []);
      setSelectedServerModels(deduplicateModels(syncedData.selected_server_models || []));
      setSelectedProviderModels(deduplicateProviderModels(syncedData.selected_provider_models || {}));
      
      // Aggregate all custom models from provider-specific keys
      const aggregatedCustomModels: any[] = [...(syncedData.custom_models || [])];
      
      // Add custom models from each provider, preserving provider_id
      Object.keys(syncedData).forEach(key => {
        if (key.startsWith('custom_models_') && Array.isArray(syncedData[key])) {
          const providerId = key.replace('custom_models_', '');
          const providerModels = syncedData[key].map((model: any) => ({
            ...model,
            provider_id: model.provider_id || providerId // Preserve existing provider_id or set from key
          }));
          aggregatedCustomModels.push(...providerModels);
        }
      });
      
      setCustomModels(deduplicateModels(aggregatedCustomModels));
      
    } catch (error) {
      console.error('Error syncing with cloud:', error);
      setSyncError('Failed to sync with cloud');
      // Fallback to loading local data
      await loadData();
    }
  }, [user, createCloudStorageEvents, loadData]);

  // Simple save custom providers - no bullshit listeners
  const saveCustomProviders = useCallback(async (providers: Provider[]) => {
    try {
      await CloudStorageService.saveCustomProviders(user, providers);
      // Just update the state directly, no reloading bullshit
      setCustomProviders(providers);
    } catch (error) {
      console.error('Error saving custom providers:', error);
      throw error;
    }
  }, [user]);

  // Load custom providers
  const loadCustomProviders = useCallback(async (): Promise<Provider[]> => {
    try {
      // Use the efficient batch loading method
      const allData = await CloudStorageService.loadAllData(user);
      const providers = allData.custom_providers || [];
      setCustomProviders(providers);
      return providers;
    } catch (error) {
      console.error('Error loading custom providers:', error);
      throw error;
    }
  }, [user]);

  // Save selected server models
  const saveSelectedServerModels = useCallback(async (models: any[]) => {
    try {
      await CloudStorageService.saveSelectedServerModels(user, models);
      setSelectedServerModels(models);
    } catch (error) {
      console.error('Error saving selected server models:', error);
      throw error;
    }
  }, [user]);

  // Load selected server models
  const loadSelectedServerModels = useCallback(async (): Promise<any[]> => {
    try {
      // Use the efficient batch loading method
      const allData = await CloudStorageService.loadAllData(user);
      const models = deduplicateModels(allData.selected_server_models || []);
      setSelectedServerModels(models);
      return models;
    } catch (error) {
      console.error('Error loading selected server models:', error);
      throw error;
    }
  }, [user]);

  // Save selected models for provider
  const saveSelectedModelsForProvider = useCallback(async (providerId: string, models: any[]) => {
    try {
      await CloudStorageService.saveSelectedModelsForProvider(user, providerId, models);
      setSelectedProviderModels(prev => ({
        ...prev,
        [providerId]: models,
      }));
    } catch (error) {
      console.error('Error saving selected models for provider:', error);
      throw error;
    }
  }, [user]);

  // Load selected models for provider
  const loadSelectedModelsForProvider = useCallback(async (providerId: string): Promise<any[]> => {
    try {
      // Use the efficient batch loading method
      const allData = await CloudStorageService.loadAllData(user);
      const models = deduplicateModels(allData.selected_provider_models?.[providerId] || []);
      setSelectedProviderModels(prev => ({
        ...prev,
        [providerId]: models,
      }));
      return models;
    } catch (error) {
      console.error('Error loading selected models for provider:', error);
      throw error;
    }
  }, [user]);

  // Save custom models
  const saveCustomModels = useCallback(async (models: any[]) => {
    try {
      await CloudStorageService.saveCustomModels(user, models);
      setCustomModels(models);
    } catch (error) {
      console.error('Error saving custom models:', error);
      throw error;
    }
  }, [user]);

  // Load custom models
  const loadCustomModels = useCallback(async (): Promise<any[]> => {
    try {
      // Use the efficient batch loading method
      const allData = await CloudStorageService.loadAllData(user);
      const models = deduplicateModels(allData.custom_models || []);
      setCustomModels(models);
      return models;
    } catch (error) {
      console.error('Error loading custom models:', error);
      throw error;
    }
  }, [user]);

  // Optimized individual model operations
  const addServerModel = useCallback(async (model: any) => {
    try {
      const currentModels = [...selected_server_models];
      const existingIndex = currentModels.findIndex(m => m.id === model.id);
      
      if (existingIndex === -1) {
        const updatedModels = [...currentModels, model];
        await CloudStorageService.saveSelectedServerModels(user, updatedModels);
        setSelectedServerModels(updatedModels);
      }
    } catch (error) {
      console.error('Error adding server model:', error);
      throw error;
    }
  }, [user, selected_server_models]);

  const removeServerModel = useCallback(async (modelId: string) => {
    try {
      const currentModels = [...selected_server_models];
      const updatedModels = currentModels.filter(m => m.id !== modelId);
      
      if (updatedModels.length !== currentModels.length) {
        await CloudStorageService.saveSelectedServerModels(user, updatedModels);
        setSelectedServerModels(updatedModels);
      }
    } catch (error) {
      console.error('Error removing server model:', error);
      throw error;
    }
  }, [user, selected_server_models]);

  const addProviderModel = useCallback(async (providerId: string, model: any) => {
    try {
      const currentModels = [...(selected_provider_models[providerId] || [])];
      const existingIndex = currentModels.findIndex(m => m.id === model.id);
      
      if (existingIndex === -1) {
        const updatedModels = [...currentModels, model];
        await CloudStorageService.saveSelectedModelsForProvider(user, providerId, updatedModels);
        setSelectedProviderModels(prev => ({
          ...prev,
          [providerId]: updatedModels,
        }));
      }
    } catch (error) {
      console.error('Error adding provider model:', error);
      throw error;
    }
  }, [user, selected_provider_models]);

  const removeProviderModel = useCallback(async (providerId: string, modelId: string) => {
    try {
      const currentModels = [...(selected_provider_models[providerId] || [])];
      const updatedModels = currentModels.filter(m => m.id !== modelId);
      
      if (updatedModels.length !== currentModels.length) {
        await CloudStorageService.saveSelectedModelsForProvider(user, providerId, updatedModels);
        setSelectedProviderModels(prev => ({
          ...prev,
          [providerId]: updatedModels,
        }));
      }
    } catch (error) {
      console.error('Error removing provider model:', error);
      throw error;
    }
  }, [user, selected_provider_models]);

  // Provider-specific custom model operations
  const saveCustomModelsForProvider = useCallback(async (providerId: string, models: any[]) => {
    try {
      await CloudStorageService.saveCustomModelsForProvider(user, providerId, models);
      // Reload all data to get updated custom models from all providers
      await loadData();
    } catch (error) {
      console.error('Error saving custom models for provider:', error);
      throw error;
    }
  }, [user, loadData]);

  const loadCustomModelsForProvider = useCallback(async (providerId: string): Promise<any[]> => {
    try {
      const models = await CloudStorageService.loadCustomModelsForProvider(user, providerId);
      return models;
    } catch (error) {
      console.error('Error loading custom models for provider:', error);
      throw error;
    }
  }, [user]);

  const addCustomModel = useCallback(async (providerId: string, model: any) => {
    try {
      await CloudStorageService.addCustomModel(user, providerId, model);
    } catch (error) {
      console.error('Error adding custom model:', error);
      throw error;
    }
  }, [user]);

  const removeCustomModel = useCallback(async (providerId: string, modelId: string) => {
    try {
      await CloudStorageService.removeCustomModel(user, providerId, modelId);
    } catch (error) {
      console.error('Error removing custom model:', error);
      throw error;
    }
  }, [user]);

  const cleanupDuplicateCustomModels = useCallback(async (providerId: string) => {
    try {
      await CloudStorageService.cleanupDuplicateCustomModels(user, providerId);
    } catch (error) {
      console.error('Error cleaning up duplicate custom models:', error);
      throw error;
    }
  }, [user]);

  const cleanupAllDuplicateModels = useCallback(async () => {
    try {
      await CloudStorageService.cleanupAllDuplicateModels(user);
      // Reload data to refresh the UI
      await loadData();
    } catch (error) {
      console.error('Error cleaning up all duplicate models:', error);
      throw error;
    }
  }, [user, loadData]);

  // Initial data load when user changes
  useEffect(() => {
    const userId = user?.uid || 'anonymous';
    const wasAnonymous = initialSyncPerformed.current === 'anonymous';
    const isNowAuthenticated = user && !user.isAnonymous;
    
    // Clean up any existing device IDs (no longer used)
    try {
      localStorage.removeItem('device_id');
    } catch (error) {
      console.warn('Could not remove device_id from localStorage:', error);
    }
    
    // Only perform initial sync once per user session
    if (initialSyncPerformed.current !== userId) {
      initialSyncPerformed.current = userId;
      
      if (isNowAuthenticated && wasAnonymous) {
        // Special case: user just logged in, merge localStorage with cloud
        (async () => {
          try {
            const mergedData = await CloudStorageService.handleUserLogin(user);
            setCustomProviders(mergedData.custom_providers || []);
            setSelectedServerModels(deduplicateModels(mergedData.selected_server_models || []));
            setSelectedProviderModels(deduplicateProviderModels(mergedData.selected_provider_models || {}));
            
            // Aggregate all custom models from the merged data
            const aggregatedCustomModels: any[] = [...(mergedData.custom_models || [])];
            
            // Add custom models from each provider in merged data
            Object.keys(mergedData).forEach(key => {
              if (key.startsWith('custom_models_') && Array.isArray(mergedData[key])) {
                aggregatedCustomModels.push(...mergedData[key]);
              }
            });
            
            setCustomModels(deduplicateModels(aggregatedCustomModels));
          } catch (error) {
            console.error('Error during login merge:', error);
            loadData();
          }
        })();
      } else if (user && !user.isAnonymous) {
        // Regular authenticated user, sync with cloud
        syncWithCloud().then(async () => {
          // After initial sync, run cleanup to remove any duplicates
          try {
            await CloudStorageService.cleanupAllDuplicateModels(user);
          } catch (error) {
            console.error('Error during initial duplicate cleanup:', error);
          }
        });
      } else {
        // Anonymous user, just load local data
        loadData();
      }
    }
  }, [user, syncWithCloud, loadData]);

  // Removed auto-sync - we don't need constant background syncing

  // Removed the stupid storage listener that was causing multiple API calls
  // We don't need real-time sync bullshit - just save and load when needed

  // Clear data ONLY on explicit logout (not on every user change)
  useEffect(() => {
    // Only clear if user was previously authenticated and is now null (explicit logout)
    const prevUserWasAuthenticated = initialSyncPerformed.current && initialSyncPerformed.current !== 'anonymous';
    
    if (!user && prevUserWasAuthenticated) {
      CloudStorageService.clearAllData();
      setCustomProviders([]);
      setSelectedServerModels([]);
      setSelectedProviderModels({});
      setCustomModels([]);
      setLastSyncTime(null);
      setSyncError(null);
      initialSyncPerformed.current = null;
    }
  }, [user]);

  const value: CloudStorageContextType = {
    // Data state
    custom_providers,
    selected_server_models,
    selected_provider_models,
    custom_models,
    
    // Sync state
    isSyncing,
    lastSyncTime,
    syncError,
    
    // Methods
    saveCustomProviders,
    loadCustomProviders,
    saveSelectedServerModels,
    loadSelectedServerModels,
    saveSelectedModelsForProvider,
    loadSelectedModelsForProvider,
    saveCustomModels,
    loadCustomModels,
    saveCustomModelsForProvider,
    loadCustomModelsForProvider,
    syncWithCloud,
    clearSyncError,
    
    // Optimized individual model operations
    addServerModel,
    removeServerModel,
    addProviderModel,
    removeProviderModel,
    addCustomModel,
    removeCustomModel,
    cleanupDuplicateCustomModels,
    
    // Cleanup operations
    cleanupAllDuplicateModels,
    
    // Conflict resolution
    onDataConflict: conflictResolverRef.current,
    setConflictResolver,
  };

  return (
    <CloudStorageContext.Provider value={value}>
      {children}
    </CloudStorageContext.Provider>
  );
};

export default CloudStorageProvider;
