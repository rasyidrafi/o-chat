import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { CloudStorageService, ConflictData, CloudStorageEvents } from '../services/cloudStorageService';
import { Provider } from '../types/providers';

interface CloudStorageContextType {
  // Data state
  customProviders: Provider[];
  selectedServerModels: any[];
  selectedProviderModels: Record<string, any[]>;
  
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
  syncWithCloud: () => Promise<void>;
  clearSyncError: () => void;
  
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
  const [customProviders, setCustomProviders] = useState<Provider[]>([]);
  const [selectedServerModels, setSelectedServerModels] = useState<any[]>([]);
  const [selectedProviderModels, setSelectedProviderModels] = useState<Record<string, any[]>>({});
  
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

  // Load data from appropriate source
  const loadData = useCallback(async () => {
    try {
      const [providers, serverModels] = await Promise.all([
        CloudStorageService.loadCustomProviders(user),
        CloudStorageService.loadSelectedServerModels(user),
      ]);
      
      setCustomProviders(providers);
      setSelectedServerModels(serverModels);

      // Load provider models if we have providers
      if (providers.length > 0) {
        const providerModelsMap: Record<string, any[]> = {};
        await Promise.all(
          providers.map(async (provider) => {
            const models = await CloudStorageService.loadSelectedModelsForProvider(user, provider.id);
            if (models.length > 0) {
              providerModelsMap[provider.id] = models;
            }
          })
        );
        setSelectedProviderModels(providerModelsMap);
      }
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
      setCustomProviders(syncedData.customProviders || []);
      setSelectedServerModels(syncedData.selectedServerModels || []);
      setSelectedProviderModels(syncedData.selectedProviderModels || {});
      
    } catch (error) {
      console.error('Error syncing with cloud:', error);
      setSyncError('Failed to sync with cloud');
      // Fallback to loading local data
      await loadData();
    }
  }, [user, createCloudStorageEvents, loadData]);

  // Save custom providers
  const saveCustomProviders = useCallback(async (providers: Provider[]) => {
    try {
      await CloudStorageService.saveCustomProviders(user, providers);
      setCustomProviders(providers);
    } catch (error) {
      console.error('Error saving custom providers:', error);
      throw error;
    }
  }, [user]);

  // Load custom providers
  const loadCustomProviders = useCallback(async (): Promise<Provider[]> => {
    try {
      const providers = await CloudStorageService.loadCustomProviders(user);
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
      const models = await CloudStorageService.loadSelectedServerModels(user);
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
      const models = await CloudStorageService.loadSelectedModelsForProvider(user, providerId);
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
            setCustomProviders(mergedData.customProviders || []);
            setSelectedServerModels(mergedData.selectedServerModels || []);
            setSelectedProviderModels(mergedData.selectedProviderModels || {});
          } catch (error) {
            console.error('Error during login merge:', error);
            loadData();
          }
        })();
      } else if (user && !user.isAnonymous) {
        // Regular authenticated user, sync with cloud
        syncWithCloud();
      } else {
        // Anonymous user, just load local data
        loadData();
      }
    }
  }, [user, syncWithCloud, loadData]);

  // Auto-sync periodically for authenticated users (less frequent to avoid loops)
  useEffect(() => {
    if (!user || user.isAnonymous) return;

    const syncInterval = setInterval(() => {
      syncWithCloud().catch(error => {
        console.error('Auto-sync failed:', error);
      });
    }, 15 * 60 * 1000); // Sync every 15 minutes (reduced from 5)

    return () => clearInterval(syncInterval);
  }, [user, syncWithCloud]);

  // Listen for localStorage changes to update state
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent | CustomEvent) => {
      if ('detail' in event) {
        // Custom event from our own code
        const { key } = event.detail;
        if (key === 'custom_api_providers' || key === 'cloud_sync') {
          loadData();
        }
      } else {
        // Native storage event
        if (event.key === 'custom_api_providers' || event.key === 'selectedServerModels') {
          loadData();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleStorageChange as EventListener);
    };
  }, [loadData]);

  // Clear data ONLY on explicit logout (not on every user change)
  useEffect(() => {
    // Only clear if user was previously authenticated and is now null (explicit logout)
    const prevUserWasAuthenticated = initialSyncPerformed.current && initialSyncPerformed.current !== 'anonymous';
    
    if (!user && prevUserWasAuthenticated) {
      CloudStorageService.clearAllData();
      setCustomProviders([]);
      setSelectedServerModels([]);
      setSelectedProviderModels({});
      setLastSyncTime(null);
      setSyncError(null);
      initialSyncPerformed.current = null;
    }
  }, [user]);

  const value: CloudStorageContextType = {
    // Data state
    customProviders,
    selectedServerModels,
    selectedProviderModels,
    
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
    syncWithCloud,
    clearSyncError,
    
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
