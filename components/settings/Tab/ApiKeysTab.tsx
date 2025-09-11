import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Key, Plus, X } from "../../Icons";
import Button from "../../ui/Button";
import { Provider } from "../../../types/providers";
import { useCloudStorage } from "../../../contexts/CloudStorageContext";
import CloudConflictModal from "../../ui/CloudConflictModal";
import { ConflictData } from "../../../services/cloudStorageService";

// Storage keys - moved to constants for better maintainability
const STORAGE_KEYS = {
  CUSTOM_PROVIDERS: "custom_api_providers",
} as const;

// Performance constants
const SAVE_ANIMATION_DURATION = 500; // ms

// Enhanced UUID generator with better randomness
const generateUUID = (): string => {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Memoized OpenAI Compatible Provider Card with validation
const OpenAICompatibleProviderCard = React.memo<{
  provider: Provider;
  onUpdate: (provider: Provider) => void;
  onDelete: (providerId: string) => void;
}>(({ provider, onUpdate, onDelete }) => {
  // Memoized change handler to prevent unnecessary re-renders
  const handleChange = useCallback((field: keyof Provider, value: string) => {
    const updatedProvider = { ...provider, [field]: value };
    onUpdate(updatedProvider);
  }, [provider, onUpdate]);

  // Memoized delete handler
  const handleDelete = useCallback(() => {
    onDelete(provider.id);
  }, [onDelete, provider.id]);

  return (
    <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-6 relative">
      <button
        onClick={handleDelete}
        className="absolute top-4 right-4 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
        aria-label="Delete provider"
        type="button"
      >
        <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
      </button>

      <div className="flex items-center gap-3 mb-4">
        <Key className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
          OpenAI Compatible Provider
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Provider Name
          </label>
          <input
            type="text"
            value={provider.label}
            onChange={(e) => handleChange("label", e.target.value)}
            placeholder="e.g., Local LLM, Custom API"
            className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            autoComplete="off"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Base URL
          </label>
          <input
            type="url"
            value={provider.base_url || ""}
            onChange={(e) => handleChange("base_url", e.target.value)}
            placeholder="https://api.example.com/v1"
            className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            autoComplete="url"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            API Key
          </label>
          <input
            type="password"
            value={provider.value ?? ""}
            onChange={(e) => handleChange("value", e.target.value)}
            placeholder="sk-..."
            className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            autoComplete="new-password"
          />
        </div>
      </div>
    </div>
  );
});

// Set display name for debugging
OpenAICompatibleProviderCard.displayName = 'OpenAICompatibleProviderCard';

const ApiKeysTab: React.FC = () => {
  // Use the cloud storage context
  const {
    customProviders,
    saveCustomProviders,
    isSyncing,
    syncError,
    clearSyncError,
    setConflictResolver
  } = useCloudStorage();

  // State management
  const [localProviders, setLocalProviders] = useState<Provider[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);
  
  // Refs for performance optimization
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize local providers from cloud storage
  useEffect(() => {
    setLocalProviders(customProviders);
  }, [customProviders]);

  // Set up conflict resolver
  useEffect(() => {
    const handleConflict = async (conflict: ConflictData): Promise<'local' | 'cloud' | 'merge'> => {
      return new Promise((resolve) => {
        setConflictData(conflict);
        setShowConflictModal(true);
        
        // Store resolver in a way that the modal can call it
        (window as any).resolveConflict = resolve;
      });
    };
    
    setConflictResolver(handleConflict);
  }, [setConflictResolver]);

  // Handle conflict resolution
  const handleConflictResolve = useCallback((resolution: 'local' | 'cloud' | 'merge') => {
    if ((window as any).resolveConflict) {
      (window as any).resolveConflict(resolution);
      delete (window as any).resolveConflict;
    }
    setShowConflictModal(false);
    setConflictData(null);
  }, []);

  // Memoized add new provider handler
  const addNewProvider = useCallback(() => {
    const newProvider: Provider = {
      id: generateUUID(),
      label: "",
      value: "",
      base_url: "",
    };
    setLocalProviders((prev) => [...prev, newProvider]);
    setHasChanges(true);
    setSaveError(null);
    clearSyncError();
  }, [clearSyncError]);

  // Memoized update provider handler
  const updateProvider = useCallback((updatedProvider: Provider) => {
    setLocalProviders((prev) =>
      prev.map((provider) =>
        provider.id === updatedProvider.id ? updatedProvider : provider
      )
    );
    setHasChanges(true);
    setSaveError(null);
    clearSyncError();
  }, [clearSyncError]);

  // Memoized delete provider handler
  const deleteProvider = useCallback((providerId: string) => {
    setLocalProviders((prev) =>
      prev.filter((provider) => provider.id !== providerId)
    );
    setHasChanges(true);
    setSaveError(null);
    clearSyncError();

    // Clean up associated model data
    const modelProviderKey = `models_${providerId}`;
    localStorage.removeItem(modelProviderKey);
  }, [clearSyncError]);

  // Enhanced validation function
  const validateCustomProviders = useCallback((providers: Provider[]): string | null => {
    const invalidProviders = providers.filter((p, index) => {
      const hasEmptyLabel = !p.label.trim();
      const hasEmptyUrl = !p.base_url?.trim();
      const hasEmptyValue = !p.value?.trim();
      
      if (hasEmptyLabel || hasEmptyUrl || hasEmptyValue) {
        return true;
      }
      
      // Check for duplicate names
      const duplicateName = providers.findIndex(
        (other, otherIndex) => 
          otherIndex !== index && 
          other.label.trim().toLowerCase() === p.label.trim().toLowerCase()
      ) !== -1;
      
      return duplicateName;
    });

    if (invalidProviders.length > 0) {
      return "Please fill in all fields and ensure unique provider names before saving.";
    }
    
    return null;
  }, []);

  // Enhanced save handler with better error handling
  const handleSaveAll = useCallback(async () => {
    if (isSaving || isSyncing) return; // Prevent double-saves

    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Validate custom providers
      const validationError = validateCustomProviders(localProviders);
      if (validationError) {
        setSaveError(validationError);
        return;
      }

      // Save using cloud storage
      await saveCustomProviders(localProviders);
      setHasChanges(false);

      // Brief delay to show saving state
      await new Promise((resolve) => setTimeout(resolve, SAVE_ANIMATION_DURATION));
    } catch (error) {
      console.error("Error saving providers:", error);
      setSaveError("Failed to save providers. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [
    localProviders, 
    isSaving, 
    isSyncing,
    saveCustomProviders,
    validateCustomProviders
  ]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Memoized computed values for better performance
  const canAddNewProvider = useMemo(() => {
    if (localProviders.length === 0) return true;
    
    const lastProvider = localProviders[localProviders.length - 1];
    return !!(
      lastProvider.label.trim() &&
      lastProvider.base_url?.trim() &&
      (lastProvider.value ?? "").trim()
    );
  }, [localProviders]);

  // Show current error (sync error takes precedence)
  const currentError = syncError || saveError;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">
        API Keys
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        Add OpenAI compatible API providers to bring your own models.
      </p>
      
      {/* Sync status indicator */}
      {isSyncing && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-blue-700 dark:text-blue-300">Syncing with cloud...</p>
          </div>
        </div>
      )}
      
      {/* Error display */}
      {currentError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-700 dark:text-red-400">{currentError}</p>
            {syncError && (
              <button
                onClick={clearSyncError}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-sm underline"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Add custom API endpoints that are compatible with OpenAI's API
              format.
            </p>
          </div>
          <Button
            onClick={addNewProvider}
            className="gap-3"
            disabled={!canAddNewProvider || isSyncing}
            title={
              !canAddNewProvider
                ? "Please complete the current provider before adding a new one"
                : isSyncing
                ? "Please wait for sync to complete"
                : ""
            }
          >
            <Plus className="w-4 h-4 hidden sm:block" />
            Add Provider
          </Button>
        </div>

        <div className="space-y-4">
          {localProviders.map((provider) => (
            <OpenAICompatibleProviderCard
              key={provider.id}
              provider={provider}
              onUpdate={updateProvider}
              onDelete={deleteProvider}
            />
          ))}

          {localProviders.length === 0 && (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              <p className="text-sm">No custom providers added yet.</p>
              <p className="text-xs mt-1">
                Click "Add Provider" to add your first OpenAI compatible API
                endpoint.
              </p>
            </div>
          )}
        </div>

        {/* Save All Button */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <div className="flex justify-end">
            <Button
              onClick={handleSaveAll}
              disabled={!hasChanges || isSaving || isSyncing}
              className={`gap-2 ${!hasChanges ? "opacity-50" : ""}`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                "Save All Changes"
              )}
            </Button>
          </div>
          {hasChanges && !isSyncing && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 text-right">
              You have unsaved changes
            </p>
          )}
        </div>
      </div>

      {/* Conflict Resolution Modal */}
      {showConflictModal && conflictData && (
        <CloudConflictModal
          isOpen={showConflictModal}
          onClose={() => {
            setShowConflictModal(false);
            setConflictData(null);
          }}
          conflictData={conflictData}
          onResolve={handleConflictResolve}
          animationsDisabled={false}
        />
      )}
    </div>
  );
};

export default ApiKeysTab;
