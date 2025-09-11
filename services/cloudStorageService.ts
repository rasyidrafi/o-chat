import { User } from 'firebase/auth';
import { doc, collection, getDocs, writeBatch, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Provider } from '../types/providers';

export interface CloudSyncData {
  custom_providers?: Provider[];
  selected_server_models?: any[];
  selected_provider_models?: Record<string, any[]>;
  custom_models?: any[];
  last_updated: Date;
  [key: string]: any; // Allow dynamic keys for custom_models_{providerId}
}

export interface ConflictData {
  localData: CloudSyncData;
  cloudData: CloudSyncData;
  conflictType: 'providers' | 'models' | 'all';
}

export interface CloudStorageEvents {
  onDataConflict: (conflict: ConflictData) => Promise<'local' | 'cloud' | 'merge'>;
  onSyncStart: () => void;
  onSyncComplete: () => void;
  onSyncError: (error: Error) => void;
}

// New Firestore structure:
// /providers/{userId}/data/{providerId} - for custom providers  
// /models/{userId}/{collectionId}/{modelId} - for models (collectionId = providerId or 'system')

export class CloudStorageService {
  private static readonly PROVIDERS_COLLECTION = 'providers';
  private static readonly MODELS_COLLECTION = 'models';
  private static readonly DATA_SUBCOLLECTION = 'data';
  private static readonly SYSTEM_COLLECTION_ID = 'system';
  
  // Storage keys for different data types
  private static readonly STORAGE_KEYS = {
    CUSTOM_PROVIDERS: 'custom_api_providers',
    SELECTED_SERVER_MODELS: 'selected_server_models',
    CUSTOM_MODELS: 'custom_models',
    MODELS_PREFIX: 'models_',
  } as const;

  /**
   * Helper method to deduplicate models by ID
   */
  private static deduplicateModels(models: any[]): any[] {
    if (!models || !Array.isArray(models)) return [];
    const seen = new Set<string>();
    return models.filter(model => {
      if (!model?.id || seen.has(model.id)) {
        return false;
      }
      seen.add(model.id);
      return true;
    });
  }

  /**
   * Generate a random UUID for unauthenticated users
   */
  private static generateUUID(): string {
    if (crypto?.randomUUID) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Get user identifier - use UID for authenticated users, generate random UUID for unauthenticated
   */
  private static getUserId(user: User | null): string {
    if (user && !user.isAnonymous) {
      return user.uid;
    }
    
    // For unauthenticated users, generate or retrieve stored UUID
    let anonymousId = localStorage.getItem('anonymous_user_id');
    if (!anonymousId) {
      anonymousId = this.generateUUID();
      localStorage.setItem('anonymous_user_id', anonymousId);
    }
    return anonymousId;
  }

    /**
   * Load data from localStorage
   */
  private static loadLocalData(): CloudSyncData {
    try {
      // Load custom providers
      const custom_providers = JSON.parse(
        localStorage.getItem(this.STORAGE_KEYS.CUSTOM_PROVIDERS) || '[]'
      );

      // Load custom models
      const custom_models = JSON.parse(
        localStorage.getItem(this.STORAGE_KEYS.CUSTOM_MODELS) || '[]'
      );

      // Load selected provider models
      const selected_provider_models: Record<string, any[]> = {};
      
      // Load provider-specific custom models
      const customModelsData: Record<string, any[]> = {};
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.STORAGE_KEYS.MODELS_PREFIX)) {
          const providerId = key.replace(this.STORAGE_KEYS.MODELS_PREFIX, '');
          try {
            const models = JSON.parse(localStorage.getItem(key) || '[]');
            selected_provider_models[providerId] = this.deduplicateModels(models);
          } catch (error) {
            console.error(`Error parsing models for provider ${providerId}:`, error);
          }
        } else if (key.startsWith('custom_models_')) {
          const providerId = key.replace('custom_models_', '');
          try {
            const models = JSON.parse(localStorage.getItem(key) || '[]');
            customModelsData[`custom_models_${providerId}`] = this.deduplicateModels(models);
          } catch (error) {
            console.error(`Error parsing custom models for provider ${providerId}:`, error);
          }
        }
      });

      const result = {
        custom_providers,
        selected_server_models: [], // Not persisted in localStorage anymore
        selected_provider_models,
        custom_models: this.deduplicateModels(custom_models),
        last_updated: new Date(),
        ...customModelsData, // Include all custom models data
      };
      
      return result;
    } catch (error) {
      console.error('Error loading local data:', error);
      return {
        custom_providers: [],
        selected_server_models: [], // Not persisted in localStorage anymore
        selected_provider_models: {},
        custom_models: [],
        last_updated: new Date(),
      };
    }
  }

  /**
   * Save data to localStorage
   */
  private static saveLocalData(data: Partial<CloudSyncData>): void {
    try {
      if (data.custom_providers !== undefined) {
        localStorage.setItem(
          this.STORAGE_KEYS.CUSTOM_PROVIDERS,
          JSON.stringify(data.custom_providers)
        );
      }

      if (data.selected_server_models !== undefined) {
        localStorage.setItem(
          this.STORAGE_KEYS.SELECTED_SERVER_MODELS,
          JSON.stringify(data.selected_server_models)
        );
      }

      if (data.custom_models !== undefined) {
        localStorage.setItem(
          this.STORAGE_KEYS.CUSTOM_MODELS,
          JSON.stringify(data.custom_models)
        );
      }

      if (data.selected_provider_models !== undefined) {
        Object.entries(data.selected_provider_models).forEach(([providerId, models]) => {
          localStorage.setItem(`${this.STORAGE_KEYS.MODELS_PREFIX}${providerId}`, JSON.stringify(models));
        });
      }

      // Handle provider-specific custom models data
      Object.keys(data).forEach(key => {
        if (key.startsWith('custom_models_')) {
          localStorage.setItem(key, JSON.stringify(data[key]));
        }
      });

      // Dispatch change event
      window.dispatchEvent(
        new CustomEvent('localStorageChange', {
          detail: { key: 'cloud_sync', value: data },
        })
      );
    } catch (error) {
      console.error('Error saving local data:', error);
      throw error;
    }
  }

  /**
   * Load custom providers from Firestore: /providers/{userId}/data/{providerId}
   */
  private static async loadProvidersFromCloud(user: User): Promise<Provider[]> {
    try {
      const userId = this.getUserId(user);
      const userProvidersRef = collection(db, this.PROVIDERS_COLLECTION, userId, this.DATA_SUBCOLLECTION);
      const querySnapshot = await getDocs(userProvidersRef);
      
      const providers: Provider[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        providers.push({
          id: doc.id, // Use document ID as provider ID
          label: data.label || '',
          value: data.value || '',
          base_url: data.base_url || '',
          disabled: data.disabled || false,
        });
      });
      
      return providers;
    } catch (error) {
      console.error('Error loading providers from cloud:', error);
      throw error;
    }
  }

  /**
   * Save custom providers to Firestore: /providers/{userId}/data/{providerId}
   */
  private static async saveProvidersToCloud(user: User, providers: Provider[]): Promise<void> {
    try {
      const userId = this.getUserId(user);
      const batch = writeBatch(db);

      // Get existing providers to know which ones to delete
      const userProvidersRef = collection(db, this.PROVIDERS_COLLECTION, userId, this.DATA_SUBCOLLECTION);
      const existingSnapshot = await getDocs(userProvidersRef);
      const existingProviderIds = new Set(existingSnapshot.docs.map(doc => doc.id));

      // Track which providers we're saving
      const updatedProviderIds = new Set<string>();

      // Save/update providers
      providers.forEach((provider) => {
        updatedProviderIds.add(provider.id);
        const providerDocRef = doc(db, this.PROVIDERS_COLLECTION, userId, this.DATA_SUBCOLLECTION, provider.id);
        batch.set(providerDocRef, {
          id: provider.id,
          label: provider.label,
          value: provider.value,
          base_url: provider.base_url,
          disabled: provider.disabled || false,
        });
      });

      // Delete providers that no longer exist
      existingProviderIds.forEach((providerId) => {
        if (!updatedProviderIds.has(providerId)) {
          const providerDocRef = doc(db, this.PROVIDERS_COLLECTION, userId, this.DATA_SUBCOLLECTION, providerId);
          batch.delete(providerDocRef);
        }
      });

      await batch.commit();
    } catch (error) {
      console.error('Error saving providers to cloud:', error);
      throw error;
    }
  }

  /**
   * Load models from Firestore: /models/{userId}/{collectionId}/{modelId}
   * collectionId is either a provider ID or 'system' for server models
   */
  private static async loadModelsFromCloud(user: User, collectionId: string): Promise<any[]> {
    try {
      const userId = this.getUserId(user);
      const modelsRef = collection(db, this.MODELS_COLLECTION, userId, collectionId);
      const querySnapshot = await getDocs(modelsRef);
      
      const models: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        models.push({
          id: decodeURIComponent(doc.id), // Decode document ID to get original model ID
          name: data.name || '',
          supported_parameters: data.supported_parameters || [],
          category: data.category || '',
          provider_id: data.provider_id || '',
          provider_name: data.provider_name || '',
          description: data.description || '',
          disabled: data.disabled || false,
          // Additional fields for custom models
          hasVision: data.hasVision || false,
          hasReasoning: data.hasReasoning || false,
          hasFunctionCalling: data.hasFunctionCalling || false,
          providerId: data.providerId || '',
        });
      });
      
      return models;
    } catch (error) {
      console.error(`Error loading models from cloud for collection ${collectionId}:`, error);
      throw error;
    }
  }

  /**
   * Save models to cloud storage
   */
  private static async saveModelsToCloud(user: User, collectionId: string, models: any[]): Promise<void> {
    try {
      
      // Add stack trace to see what's calling this
      if (models.length === 0 && collectionId.includes('custom_')) {
      }
      
      const userId = this.getUserId(user);
      const batch = writeBatch(db);

      // Get existing models to know which ones to delete
      const modelsRef = collection(db, this.MODELS_COLLECTION, userId, collectionId);
      const existingSnapshot = await getDocs(modelsRef);
      const existingEncodedModelIds = new Set(existingSnapshot.docs.map(doc => doc.id));

      // Track which models we're saving (encoded IDs)
      const updatedEncodedModelIds = new Set<string>();

      // Save/update models
      models.forEach((model) => {
        // Ensure we use the original model ID, not an already encoded version
        const originalModelId = model.id.includes('%') ? decodeURIComponent(model.id) : model.id;
        const encodedModelId = encodeURIComponent(originalModelId);
        updatedEncodedModelIds.add(encodedModelId);
        const modelDocRef = doc(db, this.MODELS_COLLECTION, userId, collectionId, encodedModelId);
        batch.set(modelDocRef, {
          id: originalModelId, // Store the original ID, not encoded
          name: model.name || '',
          supported_parameters: model.supported_parameters || [],
          category: model.category || '',
          provider_id: model.provider_id || '',
          provider_name: model.provider_name || '',
          description: model.description || '',
          disabled: model.disabled || false,
        });
      });

      // Delete models that no longer exist
      existingEncodedModelIds.forEach((encodedModelId) => {
        if (!updatedEncodedModelIds.has(encodedModelId)) {
          // Note: existingEncodedModelIds already contain encoded IDs from the existing snapshot
          const modelDocRef = doc(db, this.MODELS_COLLECTION, userId, collectionId, encodedModelId);
          batch.delete(modelDocRef);
        }
      });

      await batch.commit();
    } catch (error) {
      console.error(`Error saving models to cloud for collection ${collectionId}:`, error);
      throw error;
    }
  }

  /**
   * Load all data from cloud using new structure
   */
  private static async loadCloudData(user: User): Promise<CloudSyncData | null> {
    try {
      // Load custom providers
      const custom_providers = await this.loadProvidersFromCloud(user);
      
      // Load system/server models
      const selected_server_models = await this.loadModelsFromCloud(user, this.SYSTEM_COLLECTION_ID);
      
      // Load custom models (they are now in separate collections with custom_ prefix)
      const custom_models = await this.loadModelsFromCloud(user, this.SYSTEM_COLLECTION_ID)
        .then(models => models.filter(model => model.category === 'custom'))
        .catch(() => []); // fallback if custom models collection doesn't exist yet
      
      const serverModels = selected_server_models.filter(model => model.category !== 'custom');
      
      // Load provider models for all custom providers efficiently using batch operation
      const selected_provider_models: Record<string, any[]> = {};
      if (custom_providers.length > 0) {
        const providerIds = custom_providers.map(provider => provider.id);
        const batchedProviderModels = await this.loadAllProviderModels(user, providerIds);
        Object.assign(selected_provider_models, batchedProviderModels);
      }

      // Load custom models for each provider from their respective custom_ collections
      const customModelsData: Record<string, any[]> = {};
      
      if (custom_providers.length > 0) {
        await Promise.allSettled(
          custom_providers.map(async (provider) => {
            try {
              const customCollectionId = `custom_${provider.id}`;
              const providerCustomModels = await this.loadModelsFromCloud(user, customCollectionId);
              customModelsData[`custom_models_${provider.id}`] = providerCustomModels;
            } catch (error) {
              // Collection might not exist yet, that's fine
              customModelsData[`custom_models_${provider.id}`] = [];
            }
          })
        );
      }

      return {
        custom_providers,
        selected_server_models: serverModels,
        selected_provider_models,
        custom_models,
        last_updated: new Date(),
        ...customModelsData, // Include all provider-specific custom models
      };
    } catch (error) {
      console.error('Error loading cloud data:', error);
      throw error;
    }
  }

  /**
   * Save all data to cloud using new structure
   */
  private static async saveCloudData(user: User, data: CloudSyncData): Promise<void> {
    try {
      // Save custom providers
      if (data.custom_providers) {
        await this.saveProvidersToCloud(user, data.custom_providers);
      }

      // Save server models (excluding custom models as they go to separate collections now)
      const serverModels = (data.selected_server_models || []).filter((model: any) => model.category !== 'custom');
      if (serverModels.length > 0) {
        await this.saveModelsToCloud(user, this.SYSTEM_COLLECTION_ID, serverModels);
      }

      // Save provider models
      if (data.selected_provider_models) {
        for (const [providerId, models] of Object.entries(data.selected_provider_models)) {
          await this.saveModelsToCloud(user, providerId, models as any[]);
        }
      }

      // Save custom models for each provider to their respective custom_ collections
      for (const [key, models] of Object.entries(data)) {
        if (key.startsWith('custom_models_') && Array.isArray(models)) {
          const providerId = key.replace('custom_models_', '');
          const customCollectionId = `custom_${providerId}`;
          const modelsWithCategory = models.map(model => ({ ...model, category: 'custom', providerId }));
          await this.saveModelsToCloud(user, customCollectionId, modelsWithCategory);
        }
      }
    } catch (error) {
      console.error('Error saving cloud data:', error);
      throw error;
    }
  }

  /**
   * Special method to handle user login: merge localStorage data with cloud data
   * This ensures no API keys are lost when transitioning from anonymous to authenticated
   */
  static async handleUserLogin(user: User): Promise<CloudSyncData> {
    try {
      const localData = this.loadLocalData();
      const cloudData = await this.loadCloudData(user);
      
      let finalData: CloudSyncData;
      
      if (!cloudData) {
        // No cloud data exists, upload local data
        finalData = localData;
      } else {
        // Merge local and cloud data (NEVER delete API keys)
        finalData = this.mergeData(localData, cloudData);
      }
      
      // Save merged data to both local and cloud
      this.saveLocalData(finalData);
      await this.saveCloudData(user, finalData);
      
      return finalData;
    } catch (error) {
      console.error('Error handling user login:', error);
      // Return local data as fallback
      return this.loadLocalData();
    }
  }

  /**
   * Merge local and cloud data intelligently - NEVER DELETE API KEYS!
   */
  private static mergeData(localData: CloudSyncData, cloudData: CloudSyncData): CloudSyncData {
    // CRITICAL: NEVER DELETE API KEYS - Always merge/combine them
    
    // Merge providers - combine both local and cloud, avoiding duplicates by ID
    const mergedProviders = [...(cloudData.custom_providers || [])];
    
    (localData.custom_providers || []).forEach(localProvider => {
      // Only add if not already exists in cloud data
      const exists = mergedProviders.find(p => p.id === localProvider.id);
      if (!exists) {
        mergedProviders.push(localProvider);
      }
    });

    // Merge server models - combine both sets, avoiding duplicates
    const mergedServerModels = [...(cloudData.selected_server_models || [])];
    
    (localData.selected_server_models || []).forEach(localModel => {
      const exists = mergedServerModels.find(m => m.id === localModel.id);
      if (!exists) {
        mergedServerModels.push(localModel);
      }
    });

    // Merge custom models - combine both sets, avoiding duplicates
    const mergedCustomModels = [...(cloudData.custom_models || [])];
    
    (localData.custom_models || []).forEach(localModel => {
      const exists = mergedCustomModels.find(m => m.id === localModel.id);
      if (!exists) {
        mergedCustomModels.push(localModel);
      }
    });

    // Merge provider models - combine all provider models
    const mergedProviderModels = { ...(cloudData.selected_provider_models || {}) };
    
    Object.entries(localData.selected_provider_models || {}).forEach(([providerId, models]) => {
      if (!mergedProviderModels[providerId]) {
        mergedProviderModels[providerId] = models;
      } else {
        // Merge models for this provider, avoiding duplicates
        const existing = mergedProviderModels[providerId];
        const combined = [...existing];
        models.forEach(model => {
          const exists = combined.find(m => m.id === model.id);
          if (!exists) {
            combined.push(model);
          }
        });
        mergedProviderModels[providerId] = combined;
      }
    });

    // Merge provider-specific custom models
    const mergedData: CloudSyncData = {
      custom_providers: mergedProviders,
      selected_server_models: mergedServerModels,
      selected_provider_models: mergedProviderModels,
      custom_models: mergedCustomModels,
      last_updated: new Date(),
    };

    // Handle custom models for each provider
    const allKeys = new Set([...Object.keys(localData), ...Object.keys(cloudData)]);
    allKeys.forEach(key => {
      if (key.startsWith('custom_models_')) {
        const cloudCustomModels = (cloudData as any)[key] || [];
        const localCustomModels = (localData as any)[key] || [];
        
        // Merge custom models for this provider, avoiding duplicates
        const combined = [...cloudCustomModels];
        localCustomModels.forEach((model: any) => {
          const exists = combined.find((m: any) => m.id === model.id);
          if (!exists) {
            combined.push(model);
          }
        });
        
        (mergedData as any)[key] = combined;
      }
    });

    return mergedData;
  }

  /**
   * Sync data with cloud - main synchronization method
   * CRITICAL: NEVER DELETE API KEYS - Always merge them safely
   */
  static async syncWithCloud(
    user: User,
    events?: Partial<CloudStorageEvents>
  ): Promise<CloudSyncData> {
    try {
      events?.onSyncStart?.();

      const localData = this.loadLocalData();
      const cloudData = await this.loadCloudData(user);

      // If no cloud data exists, upload local data
      if (!cloudData) {
        await this.saveCloudData(user, localData);
        events?.onSyncComplete?.();
        return localData;
      }

      // ALWAYS merge data to preserve API keys from both sources
      const mergedData = this.mergeData(localData, cloudData);
      
      // Save merged data to both local and cloud
      this.saveLocalData(mergedData);
      await this.saveCloudData(user, mergedData);
      
      events?.onSyncComplete?.();
      return mergedData;
    } catch (error) {
      events?.onSyncError?.(error as Error);
      console.error('Error syncing with cloud:', error);
      throw error;
    }
  }

  /**
   * Save custom providers
   * For anonymous users: save to localStorage only
   * For authenticated users: save to both localStorage and cloud
   */
  static async saveCustomProviders(
    user: User | null,
    providers: Provider[]
  ): Promise<void> {
    try {
      if (user && !user.isAnonymous) {
        // Authenticated user - save to both localStorage and cloud
        this.saveLocalData({ custom_providers: providers });
        await this.saveProvidersToCloud(user, providers);
      } else {
        // Anonymous user - save to localStorage only
        this.saveLocalData({ custom_providers: providers });
      }
    } catch (error) {
      console.error('Error saving custom providers:', error);
      // Always fallback to localStorage to never lose data
      this.saveLocalData({ custom_providers: providers });
    }
  }

  /**
   * Load all provider models at once (efficient batch loading using Firestore batch reads)
   */
  static async loadAllProviderModels(user: User | null, providerIds: string[]): Promise<Record<string, any[]>> {
    const result: Record<string, any[]> = {};
    
    if (providerIds.length === 0) return result;
    
    // Initialize all provider results to empty arrays
    providerIds.forEach(providerId => {
      result[providerId] = [];
    });

    try {
      if (user && !user.isAnonymous) {
        // Authenticated user - batch load from cloud
        const userId = this.getUserId(user);
        
        // Create parallel queries for all provider collections
        const queries = providerIds.map(providerId => 
          getDocs(collection(db, this.MODELS_COLLECTION, userId, providerId))
        );
        
        // Execute all queries in parallel
        const queryResults = await Promise.all(queries);
        
        // Process results
        queryResults.forEach((querySnapshot, index) => {
          const providerId = providerIds[index];
          const models: any[] = [];
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            models.push({
              id: doc.id,
              name: data.name || doc.id,
              supported_parameters: data.supported_parameters || [],
              category: data.category || 'byok',
              provider_id: data.provider_id || providerId,
              provider_name: data.provider_name || '',
            });
          });
          
          // Apply deduplication to each provider's models
          result[providerId] = this.deduplicateModels(models);
        });
      } else {
        // Anonymous user - load from localStorage
        providerIds.forEach(providerId => {
          try {
            const stored = localStorage.getItem(`${this.STORAGE_KEYS.MODELS_PREFIX}${providerId}`);
            const models = stored ? JSON.parse(stored) : [];
            // Apply deduplication to localStorage models as well
            result[providerId] = this.deduplicateModels(models);
          } catch (error) {
            console.error(`Error loading models for provider ${providerId} from localStorage:`, error);
            result[providerId] = [];
          }
        });
      }

      return result;
    } catch (error) {
      console.error('Error loading provider models:', error);
      return result;
    }
  }

  /**
   * Load all user data at once (single operation for efficiency)
   */
  static async loadAllData(user: User | null): Promise<CloudSyncData> {
    try {
      if (user && !user.isAnonymous) {
        // Authenticated user - try to load from cloud, fallback to local
        try {
          const cloudData = await this.loadCloudData(user);
          return cloudData || this.loadLocalData();
        } catch (error) {
          console.error('Error loading from cloud, falling back to local:', error);
          return this.loadLocalData();
        }
      } else {
        // Anonymous user - load from localStorage only
        return this.loadLocalData();
      }
    } catch (error) {
      console.error('Error loading all data:', error);
      return this.loadLocalData();
    }
  }

  /**
   * Load custom providers
   */
  static async loadCustomProviders(user: User | null): Promise<Provider[]> {
    try {
      if (user && !user.isAnonymous) {
        try {
          return await this.loadProvidersFromCloud(user);
        } catch (error) {
          console.error('Error loading providers from cloud, falling back to local:', error);
          const localData = this.loadLocalData();
          return localData.custom_providers || [];
        }
      } else {
        const localData = this.loadLocalData();
        return localData.custom_providers || [];
      }
    } catch (error) {
      console.error('Error loading custom providers:', error);
      const localData = this.loadLocalData();
      return localData.custom_providers || [];
    }
  }

  /**
   * Save selected server models
   */
  static async saveSelectedServerModels(
    user: User | null,
    models: any[]
  ): Promise<void> {
    try {
      // Deduplicate models before saving
      const deduplicatedModels = this.deduplicateModels(models);
      
      if (user && !user.isAnonymous) {
        // For authenticated users, only save to cloud (no localStorage needed)
        await this.saveModelsToCloud(user, this.SYSTEM_COLLECTION_ID, deduplicatedModels);
      } else {
        // Anonymous users don't need to persist system model selections
        // They can reselect models each session since it's just UI state
        console.log('Anonymous user system model selection - keeping in memory only');
      }
    } catch (error) {
      console.error('Error saving selected server models:', error);
      // For authenticated users, we could fall back to keeping in memory only
      // No need to save to localStorage for system models
    }
  }

  /**
   * Load selected server models
   */
  static async loadSelectedServerModels(user: User | null): Promise<any[]> {
    try {
      if (user && !user.isAnonymous) {
        try {
          const models = await this.loadModelsFromCloud(user, this.SYSTEM_COLLECTION_ID);
          const serverModels = models.filter(model => model.category !== 'custom');
          return this.deduplicateModels(serverModels);
        } catch (error) {
          console.error('Error loading server models from cloud:', error);
          // Return empty array for authenticated users if cloud fails
          // No localStorage fallback needed for system models
          return [];
        }
      } else {
        // Anonymous users start with empty selection each session
        // No need to persist system model selections for anonymous users
        return [];
      }
    } catch (error) {
      console.error('Error loading selected server models:', error);
      return [];
    }
  }

  /**
   * Save selected models for a provider
   */
  static async saveSelectedModelsForProvider(
    user: User | null,
    providerId: string,
    models: any[]
  ): Promise<void> {
    try {
      // Deduplicate models before saving
      const deduplicatedModels = this.deduplicateModels(models);
      
      if (user && !user.isAnonymous) {
        // Save to localStorage first
        localStorage.setItem(`${this.STORAGE_KEYS.MODELS_PREFIX}${providerId}`, JSON.stringify(deduplicatedModels));
        // Then save to cloud
        await this.saveModelsToCloud(user, providerId, deduplicatedModels);
      } else {
        // Anonymous user - save to localStorage only
        localStorage.setItem(`${this.STORAGE_KEYS.MODELS_PREFIX}${providerId}`, JSON.stringify(deduplicatedModels));
      }
    } catch (error) {
      console.error('Error saving selected models for provider:', error);
      localStorage.setItem(`${this.STORAGE_KEYS.MODELS_PREFIX}${providerId}`, JSON.stringify(this.deduplicateModels(models)));
    }
  }

  /**
   * Load selected models for a provider
   */
  static async loadSelectedModelsForProvider(
    user: User | null,
    providerId: string
  ): Promise<any[]> {
    try {
      if (user && !user.isAnonymous) {
        try {
          const models = await this.loadModelsFromCloud(user, providerId);
          return this.deduplicateModels(models);
        } catch (error) {
          console.error(`Error loading models for provider ${providerId} from cloud, falling back to local:`, error);
          const stored = localStorage.getItem(`${this.STORAGE_KEYS.MODELS_PREFIX}${providerId}`);
          const localModels = stored ? JSON.parse(stored) : [];
          return this.deduplicateModels(localModels);
        }
      } else {
        const stored = localStorage.getItem(`${this.STORAGE_KEYS.MODELS_PREFIX}${providerId}`);
        const models = stored ? JSON.parse(stored) : [];
        return this.deduplicateModels(models);
      }
    } catch (error) {
      console.error('Error loading selected models for provider:', error);
      return [];
    }
  }

  /**
   * Save custom models
   */
  static async saveCustomModels(
    user: User | null,
    models: any[]
  ): Promise<void> {
    try {
      // Deduplicate models before saving
      const deduplicatedModels = this.deduplicateModels(models);
      
      if (user && !user.isAnonymous) {
        // Save to localStorage first
        this.saveLocalData({ custom_models: deduplicatedModels });
        // Then save to cloud (custom models go in system collection with category='custom')
        const modelsWithCategory = deduplicatedModels.map(model => ({ ...model, category: 'custom' }));
        await this.saveModelsToCloud(user, this.SYSTEM_COLLECTION_ID, modelsWithCategory);
      } else {
        // Anonymous user - save to localStorage only
        this.saveLocalData({ custom_models: deduplicatedModels });
      }
    } catch (error) {
      console.error('Error saving custom models:', error);
      this.saveLocalData({ custom_models: this.deduplicateModels(models) });
    }
  }

  /**
   * Load custom models
   */
  static async loadCustomModels(user: User | null): Promise<any[]> {
    try {
      if (user && !user.isAnonymous) {
        try {
          const models = await this.loadModelsFromCloud(user, this.SYSTEM_COLLECTION_ID);
          const customModels = models.filter(model => model.category === 'custom');
          return this.deduplicateModels(customModels);
        } catch (error) {
          console.error('Error loading custom models from cloud, falling back to local:', error);
          const localData = this.loadLocalData();
          return this.deduplicateModels(localData.custom_models || []);
        }
      } else {
        const localData = this.loadLocalData();
        return this.deduplicateModels(localData.custom_models || []);
      }
    } catch (error) {
      console.error('Error loading custom models:', error);
      const localData = this.loadLocalData();
      return this.deduplicateModels(localData.custom_models || []);
    }
  }

  /**
   * Save custom models for a specific provider
   */
  static async saveCustomModelsForProvider(
    user: User | null,
    providerId: string,
    models: any[]
  ): Promise<void> {
    try {
      const storageKey = `custom_models_${providerId}`;
      
      if (user && !user.isAnonymous) {
        // Save to localStorage first
        this.saveLocalData({ [storageKey]: models });
        // Then save to cloud (custom models go in custom_{providerId} collection)
        const customCollectionId = `custom_${providerId}`;
        const modelsWithCategory = models.map(model => ({ ...model, category: 'custom', providerId }));
        await this.saveModelsToCloud(user, customCollectionId, modelsWithCategory);
      } else {
        // Anonymous user - save to localStorage only
        this.saveLocalData({ [storageKey]: models });
      }
    } catch (error) {
      console.error('Error saving custom models for provider:', error);
      const storageKey = `custom_models_${providerId}`;
      this.saveLocalData({ [storageKey]: models });
    }
  }

  /**
   * Load custom models for a specific provider
   */
  static async loadCustomModelsForProvider(
    user: User | null,
    providerId: string
  ): Promise<any[]> {
    try {
      const storageKey = `custom_models_${providerId}`;
      
      if (user && !user.isAnonymous) {
        try {
          // Load from custom collection with custom_ prefix
          const customCollectionId = `custom_${providerId}`;
          const models = await this.loadModelsFromCloud(user, customCollectionId);
          // Filter by category only - if it's in the custom_{providerId} collection, it belongs to this provider
          const filteredModels = models.filter(model => model.category === 'custom');
          return this.deduplicateModels(filteredModels);
        } catch (error) {
          console.error('Error loading custom models from cloud for provider, falling back to local:', error);
          const localData = this.loadLocalData();
          return this.deduplicateModels(localData[storageKey] || []);
        }
      } else {
        const localData = this.loadLocalData();
        return this.deduplicateModels(localData[storageKey] || []);
      }
    } catch (error) {
      console.error('Error loading custom models for provider:', error);
      const localData = this.loadLocalData();
      const storageKey = `custom_models_${providerId}`;
      return this.deduplicateModels(localData[storageKey] || []);
    }
  }

  /**
   * Add a single custom model to a provider
   */
  static async addCustomModel(
    user: User | null,
    providerId: string,
    model: any
  ): Promise<void> {
    try {
      const storageKey = `custom_models_${providerId}`;
      
      if (user && !user.isAnonymous) {
        // Load existing models
        const existingModels = await this.loadCustomModelsForProvider(user, providerId);
        
        // Add new model (replace if ID exists)
        const updatedModels = [...existingModels.filter((m: any) => m.id !== model.id), model];
        
        // Save to localStorage first
        this.saveLocalData({ [storageKey]: updatedModels });
        
        // Save to Firestore using custom collection name with custom_ prefix
        const userId = this.getUserId(user);
        const customCollectionId = `custom_${providerId}`;
        const customCollectionRef = collection(db, this.MODELS_COLLECTION, userId, customCollectionId);
        // Ensure we use the original model ID, not an already encoded version
        const originalModelId = model.id.includes('%') ? decodeURIComponent(model.id) : model.id;
        const encodedModelId = encodeURIComponent(originalModelId);
        const modelDocRef = doc(customCollectionRef, encodedModelId);
        await setDoc(modelDocRef, {
          id: originalModelId, // Store the original ID, not encoded
          name: model.name || '',
          description: model.description || '',
          supported_parameters: model.supported_parameters || [],
          category: 'custom',
          provider_id: providerId,
          providerId: providerId,
          disabled: model.disabled || false,
          hasVision: model.hasVision || false,
          hasReasoning: model.hasReasoning || false,
          hasFunctionCalling: model.hasFunctionCalling || false,
        });
      } else {
        // Anonymous user - save to localStorage only
        const localData = this.loadLocalData();
        const existingModels = localData[storageKey] || [];
        const updatedModels = [...existingModels.filter((m: any) => m.id !== model.id), model];
        this.saveLocalData({ [storageKey]: updatedModels });
      }
    } catch (error) {
      console.error('Error adding custom model:', error);
      // Fallback to localStorage
      const storageKey = `custom_models_${providerId}`;
      const localData = this.loadLocalData();
      const existingModels = localData[storageKey] || [];
      const updatedModels = [...existingModels.filter((m: any) => m.id !== model.id), model];
      this.saveLocalData({ [storageKey]: updatedModels });
      throw error;
    }
  }

  /**
   * Clean up duplicate models from localStorage and cloud storage
   */
  static async cleanupAllDuplicateModels(user: User | null): Promise<void> {
    try {
      console.log('Starting cleanup of duplicate models...');
      
      // Load all data
      const allData = await this.loadAllData(user);
      
      // Clean up provider models
      const cleanedProviderModels: Record<string, any[]> = {};
      Object.keys(allData.selected_provider_models || {}).forEach(providerId => {
        const models = allData.selected_provider_models![providerId] || [];
        const deduplicatedModels = this.deduplicateModels(models);
        
        if (deduplicatedModels.length !== models.length) {
          console.log(`Removed ${models.length - deduplicatedModels.length} duplicate models for provider ${providerId}`);
          cleanedProviderModels[providerId] = deduplicatedModels;
        }
      });
      
      // Save cleaned provider models
      for (const [providerId, models] of Object.entries(cleanedProviderModels)) {
        await this.saveSelectedModelsForProvider(user, providerId, models);
      }
      
      // Skip custom model cleanup - they are now stored per-provider and handled differently
      
      // Clean up server models if needed
      const serverModels = allData.selected_server_models || [];
      const deduplicatedServerModels = this.deduplicateModels(serverModels);
      if (deduplicatedServerModels.length !== serverModels.length) {
        console.log(`Removed ${serverModels.length - deduplicatedServerModels.length} duplicate server models`);
        await this.saveSelectedServerModels(user, deduplicatedServerModels);
      }
      
      console.log('Cleanup of duplicate models completed');
    } catch (error) {
      console.error('Error during duplicate cleanup:', error);
    }
  }

  /**
   * Clean up duplicate custom models caused by multiple encoding
   */
  static async cleanupDuplicateCustomModels(
    user: User | null,
    providerId: string
  ): Promise<void> {
    if (!user || user.isAnonymous) return;

    try {
      const userId = this.getUserId(user);
      const customCollectionId = `custom_${providerId}`;
      const modelsRef = collection(db, this.MODELS_COLLECTION, userId, customCollectionId);
      const querySnapshot = await getDocs(modelsRef);
      
      const modelsByOriginalId = new Map<string, Array<{ docId: string; data: any }>>();
      
      // Group models by their original (decoded) ID
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const originalId = data.id || decodeURIComponent(doc.id);
        
        if (!modelsByOriginalId.has(originalId)) {
          modelsByOriginalId.set(originalId, []);
        }
        
        modelsByOriginalId.get(originalId)!.push({
          docId: doc.id,
          data: data
        });
      });
      
      const batch = writeBatch(db);
      let hasChanges = false;
      
      // For each group of models with the same original ID
      modelsByOriginalId.forEach((models, originalId) => {
        if (models.length > 1) {
          console.log(`Found ${models.length} duplicates for model: ${originalId}`);
          
          // Keep the model with the least encoded document ID (closest to original)
          const sortedModels = models.sort((a, b) => a.docId.length - b.docId.length);
          const keepModel = sortedModels[0];
          const duplicatesToDelete = sortedModels.slice(1);
          
          // Delete duplicates
          duplicatesToDelete.forEach(duplicate => {
            const docRef = doc(modelsRef, duplicate.docId);
            batch.delete(docRef);
            hasChanges = true;
          });
          
          // Update the kept model to ensure it has the correct data
          const correctEncodedId = encodeURIComponent(originalId);
          if (keepModel.docId !== correctEncodedId) {
            // Delete the old document and create a new one with correct encoding
            const oldDocRef = doc(modelsRef, keepModel.docId);
            const newDocRef = doc(modelsRef, correctEncodedId);
            batch.delete(oldDocRef);
            batch.set(newDocRef, {
              ...keepModel.data,
              id: originalId // Ensure the stored ID is the original
            });
            hasChanges = true;
          }
        }
      });
      
      if (hasChanges) {
        await batch.commit();
        console.log(`Cleaned up duplicate custom models for provider: ${providerId}`);
      }
    } catch (error) {
      console.error('Error cleaning up duplicate custom models:', error);
    }
  }

  /**
   * Remove a single custom model from a provider
   */
  static async removeCustomModel(
    user: User | null,
    providerId: string,
    modelId: string
  ): Promise<void> {
    try {
      const storageKey = `custom_models_${providerId}`;
      
      if (user && !user.isAnonymous) {
        // Load existing models
        const existingModels = await this.loadCustomModelsForProvider(user, providerId);
        
        // Remove model
        const updatedModels = existingModels.filter((m: any) => m.id !== modelId);
        
        // Save to localStorage first
        this.saveLocalData({ [storageKey]: updatedModels });
        
        // Remove from Firestore using custom collection with custom_ prefix
        const userId = this.getUserId(user);
        const customCollectionId = `custom_${providerId}`;
        const customCollectionRef = collection(db, this.MODELS_COLLECTION, userId, customCollectionId);
        // Ensure we use the original model ID, not an already encoded version
        const originalModelId = modelId.includes('%') ? decodeURIComponent(modelId) : modelId;
        const encodedModelId = encodeURIComponent(originalModelId);
        const modelDocRef = doc(customCollectionRef, encodedModelId);
        await deleteDoc(modelDocRef);
      } else {
        // Anonymous user - remove from localStorage only
        const localData = this.loadLocalData();
        const existingModels = localData[storageKey] || [];
        const updatedModels = existingModels.filter((m: any) => m.id !== modelId);
        this.saveLocalData({ [storageKey]: updatedModels });
      }
    } catch (error) {
      console.error('Error removing custom model:', error);
      // Fallback to localStorage
      const storageKey = `custom_models_${providerId}`;
      const localData = this.loadLocalData();
      const existingModels = localData[storageKey] || [];
      const updatedModels = existingModels.filter((m: any) => m.id !== modelId);
      this.saveLocalData({ [storageKey]: updatedModels });
      throw error;
    }
  }

  /**
   * Clear all data (ONLY on explicit logout - preserves data during session)
   */
  static clearAllData(): void {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear provider models
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.STORAGE_KEYS.MODELS_PREFIX)) {
          localStorage.removeItem(key);
        }
        // Clear custom models for providers
        if (key.startsWith('custom_models_')) {
          localStorage.removeItem(key);
        }
      });

      // Remove anonymous user ID and device ID as they're no longer used
      localStorage.removeItem('anonymous_user_id');
      localStorage.removeItem('device_id');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  /**
   * Get last sync timestamp
   */
  static async getLastSyncTimestamp(user: User): Promise<Date | null> {
    try {
      const cloudData = await this.loadCloudData(user);
      return cloudData?.last_updated || null;
    } catch (error) {
      console.error('Error getting last sync timestamp:', error);
      return null;
    }
  }
}
