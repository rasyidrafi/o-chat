import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Key, Plus, X } from "../../Icons";
import Button from "../../ui/Button";
import { Provider } from "../../../types/providers";
import { useLocalStorageData } from "../../../hooks/useLocalStorageData";

// Storage keys - moved to constants for better maintainability
const STORAGE_KEYS = {
  BUILTIN_PROVIDERS: "builtin_api_providers",
  CUSTOM_PROVIDERS: "custom_api_providers",
} as const;

// Default built-in providers - made immutable
const DEFAULT_BUILTIN_PROVIDERS: readonly Provider[] = [
  { label: "Anthropic", value: "", id: "anthropic", base_url: "" },
  { label: "OpenAI", value: "", id: "openai", base_url: "" },
] as const;

// Performance constants
const SAVE_ANIMATION_DURATION = 500; // ms

// Enhanced localStorage hook for providers
const useProvidersLocalStorage = () => {
  const { loadProvidersFromStorage, saveProvidersToStorage } = useLocalStorageData();
  
  return useMemo(() => {
    const loadBuiltInProviders = () => 
      loadProvidersFromStorage(STORAGE_KEYS.BUILTIN_PROVIDERS, [...DEFAULT_BUILTIN_PROVIDERS]);
    
    const loadCustomProviders = () => 
      loadProvidersFromStorage(STORAGE_KEYS.CUSTOM_PROVIDERS, []);
    
    const saveBuiltInProviders = (providers: Provider[]) =>
      saveProvidersToStorage(STORAGE_KEYS.BUILTIN_PROVIDERS, providers);
    
    const saveCustomProviders = (providers: Provider[]) =>
      saveProvidersToStorage(STORAGE_KEYS.CUSTOM_PROVIDERS, providers);

    return {
      loadBuiltInProviders,
      loadCustomProviders,
      saveBuiltInProviders,
      saveCustomProviders,
    };
  }, [loadProvidersFromStorage, saveProvidersToStorage]);
};

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

// Memoized API Provider Card component for better performance
const ApiProviderCard = React.memo<{
  title: string;
  consoleUrl: string;
  placeholder: string;
  consoleName: string;
  providerKey: string;
  value: string;
  onChange: (value: string) => void;
}>(({ title, consoleUrl, placeholder, consoleName, value, onChange }) => {
  return (
    <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-6 space-y-4">
      {/* Title line */}
      <div className="flex items-center gap-3">
        <Key className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
          {title}
        </h3>
      </div>

      {/* Input line */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 min-w-[80px]">
          API Key:
        </label>
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
          autoComplete="new-password"
        />
      </div>

      {/* Console link line */}
      <div>
        <a
          href={consoleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-pink-500 hover:underline"
        >
          Get your API key from {consoleName}
        </a>
      </div>
    </div>
  );
});

// Set display name for debugging
ApiProviderCard.displayName = 'ApiProviderCard';

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
  // Use the enhanced localStorage hook
  const {
    loadBuiltInProviders,
    loadCustomProviders, 
    saveBuiltInProviders,
    saveCustomProviders
  } = useProvidersLocalStorage();

  // State management
  const [builtInProviders, setBuiltInProviders] = useState<Provider[]>([]);
  const [customProviders, setCustomProviders] = useState<Provider[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Refs for performance optimization
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load providers from localStorage on mount - memoized
  useEffect(() => {
    const loadedBuiltInProviders = loadBuiltInProviders();
    const loadedCustomProviders = loadCustomProviders();
    setBuiltInProviders(loadedBuiltInProviders);
    setCustomProviders(loadedCustomProviders);
  }, [loadBuiltInProviders, loadCustomProviders]);

  // Memoized built-in provider update handler
  const updateBuiltInProviderValue = useCallback((providerId: string, value: string) => {
    setBuiltInProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, value } : p))
    );
    setHasChanges(true);
    setSaveError(null); // Clear any previous errors
  }, []);

  // Memoized add new provider handler
  const addNewProvider = useCallback(() => {
    const newProvider: Provider = {
      id: generateUUID(),
      label: "",
      value: "",
      base_url: "",
    };
    setCustomProviders((prev) => [...prev, newProvider]);
    setHasChanges(true);
    setSaveError(null);
  }, []);

  // Memoized update provider handler
  const updateProvider = useCallback((updatedProvider: Provider) => {
    setCustomProviders((prev) =>
      prev.map((provider) =>
        provider.id === updatedProvider.id ? updatedProvider : provider
      )
    );
    setHasChanges(true);
    setSaveError(null);
  }, []);

  // Memoized delete provider handler
  const deleteProvider = useCallback((providerId: string) => {
    setCustomProviders((prev) =>
      prev.filter((provider) => provider.id !== providerId)
    );
    setHasChanges(true);
    setSaveError(null);

    // Clean up associated model data
    const modelProviderKey = `models_${providerId}`;
    localStorage.removeItem(modelProviderKey);
  }, []);

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
    if (isSaving) return; // Prevent double-saves

    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Validate custom providers
      const validationError = validateCustomProviders(customProviders);
      if (validationError) {
        setSaveError(validationError);
        return;
      }

      // Save to localStorage using the hook functions
      const builtInSaved = saveBuiltInProviders(builtInProviders);
      const customSaved = saveCustomProviders(customProviders);
      
      if (!builtInSaved || !customSaved) {
        throw new Error("Failed to save providers to localStorage");
      }
      
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
    builtInProviders, 
    customProviders, 
    isSaving, 
    saveBuiltInProviders, 
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
    if (customProviders.length === 0) return true;
    
    const lastProvider = customProviders[customProviders.length - 1];
    return !!(
      lastProvider.label.trim() &&
      lastProvider.base_url?.trim() &&
      (lastProvider.value ?? "").trim()
    );
  }, [customProviders]);

  // Memoized provider lookups
  const { anthropicProvider, openaiProvider } = useMemo(() => ({
    anthropicProvider: builtInProviders.find((p) => p.id === "anthropic"),
    openaiProvider: builtInProviders.find((p) => p.id === "openai"),
  }), [builtInProviders]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">
        API Keys
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        This app offers free chats using provided models. For other
        models, like those from Anthropic or OpenAI, you will need to provide
        your own API key below. Your keys are stored securely on your device and
        are never sent to our servers.
      </p>
      
      {/* Error display */}
      {saveError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{saveError}</p>
        </div>
      )}
      
      <div className="space-y-6">
        <ApiProviderCard
          title="Anthropic API Key"
          consoleUrl="https://console.anthropic.com/"
          placeholder="sk-ant-..."
          consoleName="Anthropic's Console"
          providerKey="anthropic"
          value={anthropicProvider?.value || ""}
          onChange={(value) => updateBuiltInProviderValue("anthropic", value)}
        />
        <ApiProviderCard
          title="OpenAI API Key"
          consoleUrl="https://platform.openai.com/api-keys"
          placeholder="sk-..."
          consoleName="OpenAI's Console"
          providerKey="openai"
          value={openaiProvider?.value || ""}
          onChange={(value) => updateBuiltInProviderValue("openai", value)}
        />

        {/* OpenAI Compatible Providers Section */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                OpenAI Compatible Providers
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Add custom API endpoints that are compatible with OpenAI's API
                format.
              </p>
            </div>
            <Button
              onClick={addNewProvider}
              className="gap-3"
              disabled={!canAddNewProvider}
              title={
                !canAddNewProvider
                  ? "Please complete the current provider before adding a new one"
                  : ""
              }
            >
              <Plus className="w-4 h-4 hidden sm:block" />
              Add Provider
            </Button>
          </div>

          <div className="space-y-4">
            {customProviders.map((provider) => (
              <OpenAICompatibleProviderCard
                key={provider.id}
                provider={provider}
                onUpdate={updateProvider}
                onDelete={deleteProvider}
              />
            ))}

            {customProviders.length === 0 && (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                <p className="text-sm">No custom providers added yet.</p>
                <p className="text-xs mt-1">
                  Click "Add Provider" to add your first OpenAI compatible API
                  endpoint.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Save All Button */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <div className="flex justify-end">
            <Button
              onClick={handleSaveAll}
              disabled={!hasChanges || isSaving}
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
          {hasChanges && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 text-right">
              You have unsaved changes
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiKeysTab;
