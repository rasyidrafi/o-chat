import React, { useState } from 'react';
import React, { useState, useEffect } from 'react';
import { Key, Plus, X } from '../../Icons';
import Button from '../../ui/Button';

// Define the structure for API providers
interface ApiProvider {
    provider: string;
    value: string;
    custom: boolean;
    base_url?: string;
}

// Default providers structure
const DEFAULT_PROVIDERS: ApiProvider[] = [
    { provider: "anthropic", value: "", custom: false },
    { provider: "openai", value: "", custom: false },
    { provider: "openrouter", value: "", base_url: "", custom: true }
];

const API_PROVIDERS_KEY = 'api_providers';

// Simple toast notification component
const Toast: React.FC<{ message: string; isVisible: boolean; onClose: () => void }> = ({ message, isVisible, onClose }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-top-2 duration-300">
            {message}
        </div>
    );
};

// Helper functions for localStorage management
const loadProvidersFromStorage = (): ApiProvider[] => {
    try {
        const stored = localStorage.getItem(API_PROVIDERS_KEY);
        if (stored) {
            const providers = JSON.parse(stored);
            // Ensure we have all default providers
            const mergedProviders = [...DEFAULT_PROVIDERS];
            providers.forEach((storedProvider: ApiProvider) => {
                const existingIndex = mergedProviders.findIndex(p => p.provider === storedProvider.provider);
                if (existingIndex >= 0) {
                    mergedProviders[existingIndex] = storedProvider;
                } else if (storedProvider.custom) {
                    mergedProviders.push(storedProvider);
                }
            });
            return mergedProviders;
        }
        return DEFAULT_PROVIDERS;
    } catch (error) {
        console.error('Error loading providers from localStorage:', error);
        return DEFAULT_PROVIDERS;
    }
};

const saveProvidersToStorage = (providers: ApiProvider[]) => {
    try {
        localStorage.setItem(API_PROVIDERS_KEY, JSON.stringify(providers));
    } catch (error) {
        console.error('Error saving providers to localStorage:', error);
    }
};

const ApiProviderCard: React.FC<{
    title: string;
    consoleUrl: string;
    placeholder: string;
    consoleName: string;
    providerKey: string;
    providers: ApiProvider[];
    onUpdateProviders: (providers: ApiProvider[]) => void;
}> = ({ title, consoleUrl, placeholder, consoleName, providerKey, providers, onUpdateProviders }) => {
    const [apiKey, setApiKey] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // Load API key from providers array on mount
    useEffect(() => {
        const provider = providers.find(p => p.provider === providerKey);
        if (provider && provider.value) {
            setApiKey(provider.value);
            setIsSaved(true);
        }
    }, [providers, providerKey]);

    // Check if API key is valid (not empty and trimmed)
    const isValid = apiKey.trim().length > 0;

    const handleSave = () => {
        if (isValid) {
            const updatedProviders = providers.map(p => 
                p.provider === providerKey 
                    ? { ...p, value: apiKey.trim() }
                    : p
            );
            onUpdateProviders(updatedProviders);
            setIsSaved(true);
            setShowToast(true);
        } else {
            const updatedProviders = providers.map(p => 
                p.provider === providerKey 
                    ? { ...p, value: "" }
                    : p
            );
            onUpdateProviders(updatedProviders);
            setIsSaved(false);
        }
    };

    const handleInputChange = (value: string) => {
        setApiKey(value);
        setIsSaved(false);
    };

    return (
        <>
            <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-6 space-y-4">
                {/* Title line */}
                <div className="flex items-center gap-3">
                    <Key className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{title}</h3>
                </div>
                
                {/* Input line */}
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 min-w-[80px]">
                        API Key:
                    </label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 bg-white dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <Button 
                        size="sm" 
                        onClick={handleSave}
                        disabled={!isValid}
                        className={isSaved && isValid ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                        {isSaved && isValid ? 'Saved' : 'Save'}
                    </Button>
                </div>
                
                {/* Console link line */}
                <div>
                    <a href={consoleUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-500 hover:underline">
                        Get your API key from {consoleName}
                    </a>
                </div>
            </div>
            <Toast 
                message="API key saved successfully!" 
                isVisible={showToast} 
                onClose={() => setShowToast(false)} 
            />
        </>
    );
};

const OpenAICompatibleProviderCard: React.FC<{
    provider: ApiProvider;
    onUpdate: (provider: ApiProvider) => void;
    onDelete: (providerKey: string) => void;
}> = ({ provider, onUpdate, onDelete }) => {
    const [isSaved, setIsSaved] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const handleChange = (field: keyof ApiProvider, value: string) => {
        onUpdate({ ...provider, [field]: value });
        setIsSaved(false);
    };

    const isValid = provider.provider.trim() && provider.base_url?.trim() && provider.value.trim();

    const handleSave = () => {
        if (isValid) {
            setIsSaved(true);
            setShowToast(true);
        }
    };

    return (
        <>
            <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-6 relative">
                <button
                    onClick={() => onDelete(provider.provider)}
                    className="absolute top-4 right-4 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
                    aria-label="Delete provider"
                >
                    <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <Key className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">OpenAI Compatible Provider</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Provider Name
                        </label>
                        <input
                            type="text"
                            value={provider.provider}
                            onChange={(e) => handleChange('provider', e.target.value)}
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
                            value={provider.base_url || ''}
                            onChange={(e) => handleChange('base_url', e.target.value)}
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
                            value={provider.value}
                            onChange={(e) => handleChange('value', e.target.value)}
                            placeholder="sk-..."
                            className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <Button 
                        size="sm" 
                        onClick={handleSave}
                        disabled={!isValid}
                        className={isSaved && isValid ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                        {isSaved && isValid ? 'Saved' : 'Save Provider'}
                    </Button>
                </div>
            </div>
            <Toast 
                message="Provider saved successfully!" 
                isVisible={showToast} 
                onClose={() => setShowToast(false)} 
            />
        </>
    );
};

const ApiKeysTab: React.FC = () => {
    const [providers, setProviders] = useState<ApiProvider[]>([]);

    // Load providers from localStorage on mount
    useEffect(() => {
        const loadedProviders = loadProvidersFromStorage();
        setProviders(loadedProviders);
    }, []);

    // Save providers to localStorage whenever they change
    useEffect(() => {
        if (providers.length > 0) {
            saveProvidersToStorage(providers);
        }
    }, [providers]);

    const updateProviders = (updatedProviders: ApiProvider[]) => {
        setProviders(updatedProviders);
    };

    // Get custom providers (where custom: true)
    const customProviders = providers.filter(p => p.custom);

    const addNewProvider = () => {
        // Check if the last provider is complete before adding a new one
        if (customProviders.length > 0) {
            const lastProvider = customProviders[customProviders.length - 1];
            if (!isProviderValid(lastProvider)) {
                return; // Don't add new provider if last one is incomplete
            }
        }

        const newProvider: ApiProvider = {
            provider: '',
            value: '',
            base_url: '',
            custom: true
        };
        setProviders(prev => [...prev, newProvider]);
    };

    const updateProvider = (updatedProvider: ApiProvider) => {
        setProviders(prev => 
            prev.map(provider => 
                provider.provider === updatedProvider.provider ? updatedProvider : provider
            )
        );
    };

    const deleteProvider = (providerKey: string) => {
        setProviders(prev => prev.filter(provider => provider.provider !== providerKey));
    };

    // Validation function to check if a provider is complete and valid
    const isProviderValid = (provider: ApiProvider): boolean => {
        return !!(
            provider.provider.trim() &&
            provider.base_url?.trim() &&
            provider.value.trim()
        );
    };

    // Check if we can add a new provider
    const canAddNewProvider = customProviders.length === 0 || 
        isProviderValid(customProviders[customProviders.length - 1]);</parameter>

    return (
        <div>
            <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">API Keys</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                This app offers free chats using Google's Gemini 1.5 Flash. For other models, like those from Anthropic or OpenAI, you will need to provide your own API key below. Your keys are stored securely on your device and are never sent to our servers.
            </p>
            <div className="space-y-6">
                <ApiProviderCard 
                    title="Anthropic API Key"
                    consoleUrl="https://console.anthropic.com/"
                    placeholder="sk-ant-..."
                    consoleName="Anthropic's Console"
                    providerKey="anthropic"
                    providers={providers}
                    onUpdateProviders={updateProviders}
                />
                <ApiProviderCard 
                    title="OpenAI API Key"
                    consoleUrl="https://platform.openai.com/api-keys"
                    placeholder="sk-..."
                    consoleName="OpenAI's Console"
                    providerKey="openai"
                    providers={providers}
                    onUpdateProviders={updateProviders}
                />

                {/* OpenAI Compatible Providers Section */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">OpenAI Compatible Providers</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                Add custom API endpoints that are compatible with OpenAI's API format.
                            </p>
                        </div>
                        <Button 
                            onClick={addNewProvider} 
                            className="gap-2"
                            disabled={!canAddNewProvider}
                            title={!canAddNewProvider ? "Please complete the current provider before adding a new one" : ""}
                        >
                            <Plus className="w-4 h-4" />
                            Add Provider
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {customProviders.map(provider => (
                            <OpenAICompatibleProviderCard
                                key={provider.provider}
                                provider={provider}
                                onUpdate={updateProvider}
                                onDelete={deleteProvider}
                            />
                        ))}

                        {customProviders.length === 0 && (
                            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                                <p className="text-sm">No custom providers added yet.</p>
                                <p className="text-xs mt-1">Click "Add Provider" to add your first OpenAI compatible API endpoint.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiKeysTab;