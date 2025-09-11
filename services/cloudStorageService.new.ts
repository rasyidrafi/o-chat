import { User } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Provider } from '../types/providers';

export interface CloudSyncData {
  customProviders?: Provider[];
  selectedServerModels?: any[];
  selectedProviderModels?: Record<string, any[]>;
  customModels?: any[];
  lastUpdated: Date;
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
    SELECTED_SERVER_MODELS: 'selectedServerModels',
    CUSTOM_MODELS: 'customModels',
    MODELS_PREFIX: 'models_',
  } as const;

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
   * Load local data from localStorage
   */
  private static loadLocalData(): CloudSyncData {
    try {
      // Load custom providers
      const customProviders = JSON.parse(
        localStorage.getItem(this.STORAGE_KEYS.CUSTOM_PROVIDERS) || '[]'
      );

      // Load selected server models
      const selectedServerModels = JSON.parse(
        localStorage.getItem(this.STORAGE_KEYS.SELECTED_SERVER_MODELS) || '[]'
      );

      // Load custom models
      const customModels = JSON.parse(
        localStorage.getItem(this.STORAGE_KEYS.CUSTOM_MODELS) || '[]'
      );

      // Load selected provider models
      const selectedProviderModels: Record<string, any[]> = {};
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.STORAGE_KEYS.MODELS_PREFIX)) {
          const providerId = key.replace(this.STORAGE_KEYS.MODELS_PREFIX, '');
          try {
            selectedProviderModels[providerId] = JSON.parse(localStorage.getItem(key) || '[]');
          } catch (error) {
            console.error(`Error parsing models for provider ${providerId}:`, error);
          }
        }
      });

      return {
        customProviders,
        selectedServerModels,
        selectedProviderModels,
        customModels,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error loading local data:', error);
      return {
        customProviders: [],
        selectedServerModels: [],
        selectedProviderModels: {},
        customModels: [],
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Save data to localStorage
   */
  private static saveLocalData(data: Partial<CloudSyncData>): void {
    try {
      if (data.customProviders !== undefined) {
        localStorage.setItem(
          this.STORAGE_KEYS.CUSTOM_PROVIDERS,
          JSON.stringify(data.customProviders)
        );
      }

      if (data.selectedServerModels !== undefined) {
        localStorage.setItem(
          this.STORAGE_KEYS.SELECTED_SERVER_MODELS,
          JSON.stringify(data.selectedServerModels)
        );
      }

      if (data.customModels !== undefined) {
        localStorage.setItem(
          this.STORAGE_KEYS.CUSTOM_MODELS,
          JSON.stringify(data.customModels)
        );
      }

      if (data.selectedProviderModels !== undefined) {
        Object.entries(data.selectedProviderModels).forEach(([providerId, models]) => {
          localStorage.setItem(`${this.STORAGE_KEYS.MODELS_PREFIX}${providerId}`, JSON.stringify(models));
        });
      }

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
          id: doc.id, // Use document ID as model ID
          name: data.name || '',
          supported_parameters: data.supported_parameters || [],
          category: data.category || '',
          provider_id: data.provider_id || '',
          provider_name: data.provider_name || '',
          description: data.description || '',
          disabled: data.disabled || false,
        });
      });
      
      return models;
    } catch (error) {
      console.error(`Error loading models from cloud for collection ${collectionId}:`, error);
      throw error;
    }
  }

  /**
   * Save models to Firestore: /models/{userId}/{collectionId}/{modelId}
   */
  private static async saveModelsToCloud(user: User, collectionId: string, models: any[]): Promise<void> {
    try {
      const userId = this.getUserId(user);
      const batch = writeBatch(db);

      // Get existing models to know which ones to delete
      const modelsRef = collection(db, this.MODELS_COLLECTION, userId, collectionId);
      const existingSnapshot = await getDocs(modelsRef);
      const existingModelIds = new Set(existingSnapshot.docs.map(doc => doc.id));

      // Track which models we're saving
      const updatedModelIds = new Set<string>();

      // Save/update models
      models.forEach((model) => {
        updatedModelIds.add(model.id);
        const modelDocRef = doc(db, this.MODELS_COLLECTION, userId, collectionId, model.id);
        batch.set(modelDocRef, {
          id: model.id,
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
      existingModelIds.forEach((modelId) => {
        if (!updatedModelIds.has(modelId)) {
          const modelDocRef = doc(db, this.MODELS_COLLECTION, userId, collectionId, modelId);
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
      const customProviders = await this.loadProvidersFromCloud(user);
      
      // Load system/server models
      const selectedServerModels = await this.loadModelsFromCloud(user, this.SYSTEM_COLLECTION_ID);
      
      // Load custom models (they go in system collection too, but with different category)
      const allSystemModels = selectedServerModels;
      const customModels = allSystemModels.filter(model => model.category === 'custom');
      const serverModels = allSystemModels.filter(model => model.category !== 'custom');
      
      // Load provider models for each custom provider
      const selectedProviderModels: Record<string, any[]> = {};
      for (const provider of customProviders) {
        try {
          const providerModels = await this.loadModelsFromCloud(user, provider.id);
          selectedProviderModels[provider.id] = providerModels;
        } catch (error) {
          console.error(`Error loading models for provider ${provider.id}:`, error);
          selectedProviderModels[provider.id] = [];
        }
      }

      return {
        customProviders,
        selectedServerModels: serverModels,
        selectedProviderModels,
        customModels,
        lastUpdated: new Date(),
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
      if (data.customProviders) {
        await this.saveProvidersToCloud(user, data.customProviders);
      }

      // Save server models and custom models to system collection
      const systemModels = [
        ...(data.selectedServerModels || []),
        ...(data.customModels || []).map(model => ({ ...model, category: 'custom' }))
      ];
      if (systemModels.length > 0) {
        await this.saveModelsToCloud(user, this.SYSTEM_COLLECTION_ID, systemModels);
      }

      // Save provider models
      if (data.selectedProviderModels) {
        for (const [providerId, models] of Object.entries(data.selectedProviderModels)) {
          await this.saveModelsToCloud(user, providerId, models);
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
    const mergedProviders = [...(cloudData.customProviders || [])];
    
    (localData.customProviders || []).forEach(localProvider => {
      // Only add if not already exists in cloud data
      const exists = mergedProviders.find(p => p.id === localProvider.id);
      if (!exists) {
        mergedProviders.push(localProvider);
      }
    });

    // Merge server models - combine both sets, avoiding duplicates
    const mergedServerModels = [...(cloudData.selectedServerModels || [])];
    
    (localData.selectedServerModels || []).forEach(localModel => {
      const exists = mergedServerModels.find(m => m.id === localModel.id);
      if (!exists) {
        mergedServerModels.push(localModel);
      }
    });

    // Merge custom models - combine both sets, avoiding duplicates
    const mergedCustomModels = [...(cloudData.customModels || [])];
    
    (localData.customModels || []).forEach(localModel => {
      const exists = mergedCustomModels.find(m => m.id === localModel.id);
      if (!exists) {
        mergedCustomModels.push(localModel);
      }
    });

    // Merge provider models - combine all provider models
    const mergedProviderModels = { ...(cloudData.selectedProviderModels || {}) };
    
    Object.entries(localData.selectedProviderModels || {}).forEach(([providerId, models]) => {
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

    return {
      customProviders: mergedProviders,
      selectedServerModels: mergedServerModels,
      selectedProviderModels: mergedProviderModels,
      customModels: mergedCustomModels,
      lastUpdated: new Date(),
    };
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
        this.saveLocalData({ customProviders: providers });
        await this.saveProvidersToCloud(user, providers);
      } else {
        // Anonymous user - save to localStorage only
        this.saveLocalData({ customProviders: providers });
      }
    } catch (error) {
      console.error('Error saving custom providers:', error);
      // Always fallback to localStorage to never lose data
      this.saveLocalData({ customProviders: providers });
    }
  }

  /**
   * Load all provider models at once (efficient batch loading)
   */
  static async loadAllProviderModels(user: User | null, providerIds: string[]): Promise<Record<string, any[]>> {
    const result: Record<string, any[]> = {};
    
    if (providerIds.length === 0) return result;

    try {
      // Load all provider models in parallel
      const modelArrays = await Promise.all(
        providerIds.map(providerId => this.loadSelectedModelsForProvider(user, providerId))
      );

      // Map results back to provider IDs
      providerIds.forEach((providerId, index) => {
        result[providerId] = modelArrays[index];
      });

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
          return localData.customProviders || [];
        }
      } else {
        const localData = this.loadLocalData();
        return localData.customProviders || [];
      }
    } catch (error) {
      console.error('Error loading custom providers:', error);
      const localData = this.loadLocalData();
      return localData.customProviders || [];
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
      if (user && !user.isAnonymous) {
        // Save to localStorage first
        this.saveLocalData({ selectedServerModels: models });
        // Then save to cloud
        await this.saveModelsToCloud(user, this.SYSTEM_COLLECTION_ID, models);
      } else {
        // Anonymous user - save to localStorage only
        this.saveLocalData({ selectedServerModels: models });
      }
    } catch (error) {
      console.error('Error saving selected server models:', error);
      this.saveLocalData({ selectedServerModels: models });
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
          return models.filter(model => model.category !== 'custom');
        } catch (error) {
          console.error('Error loading server models from cloud, falling back to local:', error);
          const localData = this.loadLocalData();
          return localData.selectedServerModels || [];
        }
      } else {
        const localData = this.loadLocalData();
        return localData.selectedServerModels || [];
      }
    } catch (error) {
      console.error('Error loading selected server models:', error);
      const localData = this.loadLocalData();
      return localData.selectedServerModels || [];
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
      if (user && !user.isAnonymous) {
        // Save to localStorage first
        localStorage.setItem(`${this.STORAGE_KEYS.MODELS_PREFIX}${providerId}`, JSON.stringify(models));
        // Then save to cloud
        await this.saveModelsToCloud(user, providerId, models);
      } else {
        // Anonymous user - save to localStorage only
        localStorage.setItem(`${this.STORAGE_KEYS.MODELS_PREFIX}${providerId}`, JSON.stringify(models));
      }
    } catch (error) {
      console.error('Error saving selected models for provider:', error);
      localStorage.setItem(`${this.STORAGE_KEYS.MODELS_PREFIX}${providerId}`, JSON.stringify(models));
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
          return await this.loadModelsFromCloud(user, providerId);
        } catch (error) {
          console.error(`Error loading models for provider ${providerId} from cloud, falling back to local:`, error);
          const stored = localStorage.getItem(`${this.STORAGE_KEYS.MODELS_PREFIX}${providerId}`);
          return stored ? JSON.parse(stored) : [];
        }
      } else {
        const stored = localStorage.getItem(`${this.STORAGE_KEYS.MODELS_PREFIX}${providerId}`);
        return stored ? JSON.parse(stored) : [];
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
      if (user && !user.isAnonymous) {
        // Save to localStorage first
        this.saveLocalData({ customModels: models });
        // Then save to cloud (custom models go in system collection with category='custom')
        const modelsWithCategory = models.map(model => ({ ...model, category: 'custom' }));
        await this.saveModelsToCloud(user, this.SYSTEM_COLLECTION_ID, modelsWithCategory);
      } else {
        // Anonymous user - save to localStorage only
        this.saveLocalData({ customModels: models });
      }
    } catch (error) {
      console.error('Error saving custom models:', error);
      this.saveLocalData({ customModels: models });
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
          return models.filter(model => model.category === 'custom');
        } catch (error) {
          console.error('Error loading custom models from cloud, falling back to local:', error);
          const localData = this.loadLocalData();
          return localData.customModels || [];
        }
      } else {
        const localData = this.loadLocalData();
        return localData.customModels || [];
      }
    } catch (error) {
      console.error('Error loading custom models:', error);
      const localData = this.loadLocalData();
      return localData.customModels || [];
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
      return cloudData?.lastUpdated || null;
    } catch (error) {
      console.error('Error getting last sync timestamp:', error);
      return null;
    }
  }
}
