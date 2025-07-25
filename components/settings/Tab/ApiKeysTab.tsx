import React, { useState, useEffect } from "react";
import { Key, Plus, X } from "../../Icons";
import Button from "../../ui/Button";
import { Provider } from "../../../types/providers";

// Storage keys
const BUILTIN_PROVIDERS_KEY = "builtin_api_providers";
const CUSTOM_PROVIDERS_KEY = "custom_api_providers";

// Default built-in providers
const DEFAULT_BUILTIN_PROVIDERS: Provider[] = [
  { label: "Anthropic", value: "", id: "anthropic", base_url: "" },
  { label: "OpenAI", value: "", id: "openai", base_url: "" },
];

// Helper functions for localStorage management
const loadBuiltInProvidersFromStorage = (): Provider[] => {
  try {
    const stored = localStorage.getItem(BUILTIN_PROVIDERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_BUILTIN_PROVIDERS;
  } catch (error) {
    console.error("Error loading built-in providers from localStorage:", error);
    return DEFAULT_BUILTIN_PROVIDERS;
  }
};

const loadCustomProvidersFromStorage = (): Provider[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_PROVIDERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error("Error loading custom providers from localStorage:", error);
    return [];
  }
};

const saveBuiltInProvidersToStorage = (providers: Provider[]) => {
  try {
    localStorage.setItem(BUILTIN_PROVIDERS_KEY, JSON.stringify(providers));

    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("localStorageChange", {
        detail: { key: BUILTIN_PROVIDERS_KEY, value: providers },
      })
    );
  } catch (error) {
    console.error("Error saving built-in providers to localStorage:", error);
  }
};

const saveCustomProvidersToStorage = (providers: Provider[]) => {
  try {
    localStorage.setItem(CUSTOM_PROVIDERS_KEY, JSON.stringify(providers));

    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("localStorageChange", {
        detail: { key: CUSTOM_PROVIDERS_KEY, value: providers },
      })
    );
  } catch (error) {
    console.error("Error saving custom providers to localStorage:", error);
  }
};

// Generate UUID for custom providers
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const ApiProviderCard: React.FC<{
  title: string;
  consoleUrl: string;
  placeholder: string;
  consoleName: string;
  providerKey: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ title, consoleUrl, placeholder, consoleName, value, onChange }) => {
  return (
    <>
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
    </>
  );
};

const OpenAICompatibleProviderCard: React.FC<{
  provider: Provider;
  onUpdate: (provider: Provider) => void;
  onDelete: (providerId: string) => void;
}> = ({ provider, onUpdate, onDelete }) => {
  const handleChange = (field: keyof Provider, value: string) => {
    const updatedProvider = { ...provider, [field]: value };
    onUpdate(updatedProvider);
  };

  return (
    <>
      <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-6 relative">
        <button
          onClick={() => onDelete(provider.id)}
          className="absolute top-4 right-4 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
          aria-label="Delete provider"
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
            />
          </div>
        </div>
      </div>
    </>
  );
};

const ApiKeysTab: React.FC = () => {
  const [builtInProviders, setBuiltInProviders] = useState<Provider[]>([]);
  const [customProviders, setCustomProviders] = useState<Provider[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load providers from localStorage on mount
  useEffect(() => {
    const loadedBuiltInProviders = loadBuiltInProvidersFromStorage();
    const loadedCustomProviders = loadCustomProvidersFromStorage();
    setBuiltInProviders(loadedBuiltInProviders);
    setCustomProviders(loadedCustomProviders);
  }, []);

  // Update individual built-in provider values
  const updateBuiltInProviderValue = (providerId: string, value: string) => {
    setBuiltInProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, value } : p))
    );
    setHasChanges(true);
  };

  const addNewProvider = () => {
    const newProvider: Provider = {
      id: generateUUID(),
      label: "",
      value: "",
      base_url: "",
    };
    setCustomProviders((prev) => [...prev, newProvider]);
    setHasChanges(true);
  };

  const updateProvider = (updatedProvider: Provider) => {
    setCustomProviders((prev) =>
      prev.map((provider) =>
        provider.id === updatedProvider.id ? updatedProvider : provider
      )
    );
    setHasChanges(true);
  };

  const deleteProvider = (providerId: string) => {
    setCustomProviders((prev) =>
      prev.filter((provider) => provider.id !== providerId)
    );
    setHasChanges(true);

    const modelProviderKey = `models_${providerId}`;
    localStorage.removeItem(modelProviderKey);
  };

  // Save all providers to localStorage
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Validate custom providers before saving
      const invalidCustomProviders = customProviders.filter(
        (p) => !p.label.trim() || !p.base_url?.trim() || !p.value?.trim()
      );

      if (invalidCustomProviders.length > 0) {
        alert("Please fill in all fields for custom providers before saving.");
        setIsSaving(false);
        return;
      }

      saveBuiltInProvidersToStorage(builtInProviders);
      saveCustomProvidersToStorage(customProviders);
      setHasChanges(false);

      // Brief delay to show saving state
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Error saving providers:", error);
      alert("Failed to save providers. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Check if we can add a new provider
  const canAddNewProvider =
    customProviders.length === 0 ||
    (customProviders[customProviders.length - 1].label.trim() &&
      customProviders[customProviders.length - 1].base_url?.trim() &&
      (customProviders[customProviders.length - 1].value ?? "").trim());

  // Get provider values for the built-in providers
  const anthropicProvider = builtInProviders.find((p) => p.id === "anthropic");
  const openaiProvider = builtInProviders.find((p) => p.id === "openai");

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">
        API Keys
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        This app offers free chats using Google's Gemini 1.5 Flash. For other
        models, like those from Anthropic or OpenAI, you will need to provide
        your own API key below. Your keys are stored securely on your device and
        are never sent to our servers.
      </p>
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
