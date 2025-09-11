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
            console.warn(`Failed to parse models for provider ${providerId}:`, error);
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
          localStorage.setItem(
            `${this.STORAGE_KEYS.MODELS_PREFIX}${providerId}`,
            JSON.stringify(models)
          );
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
   * Load data from Firestore
   */
  private static async loadCloudData(user: User): Promise<CloudSyncData | null> {
    try {
      const userDocRef = doc(db, this.COLLECTION_NAME, user.uid);
      const syncDataRef = doc(userDocRef, 'data', this.DOC_ID);
      const docSnap = await getDoc(syncDataRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        const result = {
          customProviders: data.customProviders || [],
          selectedServerModels: data.selectedServerModels || [],
          selectedProviderModels: data.selectedProviderModels || {},
          customModels: data.customModels || [],
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        };
        
        return result;
      }

      return null;
    } catch (error) {
      console.error('Error loading cloud data:', error);
      throw error;
    }
  }

  /**
   * Save data to Firestore
   */
  private static async saveCloudData(user: User, data: CloudSyncData): Promise<void> {
    try {
      const userDocRef = doc(db, this.COLLECTION_NAME, user.uid);
      const syncDataRef = doc(userDocRef, 'data', this.DOC_ID);

      const cloudData = {
        customProviders: data.customProviders || [],
        selectedServerModels: data.selectedServerModels || [],
        selectedProviderModels: data.selectedProviderModels || {},
        customModels: data.customModels || [],
        lastUpdated: new Date(),
      };

      await setDoc(syncDataRef, cloudData, { merge: true });
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

  // Removed unused conflict detection methods since we always merge data

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
          if (!combined.find(m => m.id === model.id)) {
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
        // Authenticated user: merge with existing cloud data and save to both
        const currentCloudData = await this.loadCloudData(user);
        const currentLocalData = this.loadLocalData();
        
        // Create updated data with new providers
        const updatedData: CloudSyncData = {
          customProviders: providers,
          selectedServerModels: currentCloudData?.selectedServerModels || currentLocalData.selectedServerModels || [],
          selectedProviderModels: currentCloudData?.selectedProviderModels || currentLocalData.selectedProviderModels || {},
          lastUpdated: new Date(),
        };
        
        // Save to both cloud and local
        await this.saveCloudData(user, updatedData);
        this.saveLocalData({ customProviders: providers });
      } else {
        // Anonymous user: save to localStorage only
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
        if (modelArrays[index].length > 0) {
          result[providerId] = modelArrays[index];
        }
      });

      return result;
    } catch (error) {
      console.error('Error loading provider models:', error);
      return result;
    }
  }

  /**
   * Load all user data at once (single Firestore read)
   */
  static async loadAllData(user: User | null): Promise<CloudSyncData> {
    try {
      if (user && !user.isAnonymous) {
        const cloudData = await this.loadCloudData(user);
        return cloudData || {
          customProviders: [],
          selectedServerModels: [],
          selectedProviderModels: {},
          customModels: [],
          lastUpdated: new Date(),
        };
      } else {
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
        const cloudData = await this.loadCloudData(user);
        return cloudData?.customProviders || [];
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
        const currentData = await this.loadCloudData(user) || this.loadLocalData();
        const updatedData: CloudSyncData = {
          ...currentData,
          selectedServerModels: models,
          lastUpdated: new Date(),
        };
        
        await this.saveCloudData(user, updatedData);
        this.saveLocalData({ selectedServerModels: models });
      } else {
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
        const cloudData = await this.loadCloudData(user);
        return cloudData?.selectedServerModels || [];
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
        const currentData = await this.loadCloudData(user) || this.loadLocalData();
        const updatedProviderModels = {
          ...(currentData.selectedProviderModels || {}),
          [providerId]: models,
        };
        
        const updatedData: CloudSyncData = {
          ...currentData,
          selectedProviderModels: updatedProviderModels,
          lastUpdated: new Date(),
        };
        
        await this.saveCloudData(user, updatedData);
        this.saveLocalData({ selectedProviderModels: updatedProviderModels });
      } else {
        localStorage.setItem(`${this.STORAGE_KEYS.MODELS_PREFIX}${providerId}`, JSON.stringify(models));
        window.dispatchEvent(
          new CustomEvent('localStorageChange', {
            detail: { key: `models_${providerId}`, value: models },
          })
        );
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
        const cloudData = await this.loadCloudData(user);
        return cloudData?.selectedProviderModels?.[providerId] || [];
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
        const currentData = await this.loadCloudData(user) || this.loadLocalData();
        const updatedData: CloudSyncData = {
          ...currentData,
          customModels: models,
          lastUpdated: new Date(),
        };
        
        await this.saveCloudData(user, updatedData);
        this.saveLocalData({ customModels: models });
      } else {
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
        const cloudData = await this.loadCloudData(user);
        return cloudData?.customModels || [];
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

      // Remove device ID from localStorage as it's no longer used
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
