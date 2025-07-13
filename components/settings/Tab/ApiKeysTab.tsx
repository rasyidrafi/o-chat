import React, { useState } from 'react';
import React, { useState, useEffect } from 'react';
import { Key, Plus, X } from '../../Icons';
import Button from '../../ui/Button';

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

// localStorage keys
const ANTHROPIC_API_KEY = 'anthropic_api_key';
const OPENAI_API_KEY = 'openai_api_key';
const OPENAI_COMPATIBLE_PROVIDERS = 'openai_compatible_providers';

const ApiProviderCard: React.FC<{
    title: string;
    consoleUrl: string;
    placeholder: string;
    consoleName: string;
    storageKey: string;
}> = ({ title, consoleUrl, placeholder, consoleName, storageKey }) => {
    const [apiKey, setApiKey] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // Load API key from localStorage on mount
    useEffect(() => {
        const savedKey = localStorage.getItem(storageKey);
        if (savedKey) {
            setApiKey(savedKey);
            setIsSaved(true);
        }
    }, [storageKey]);

    // Check if API key is valid (not empty and trimmed)
    const isValid = apiKey.trim().length > 0;

    const handleSave = () => {
        if (isValid) {
            localStorage.setItem(storageKey, apiKey.trim());
            setIsSaved(true);
            setShowToast(true);
        } else {
            localStorage.removeItem(storageKey);
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

interface OpenAICompatibleProvider {
    id: string;
    name: string;
    baseUrl: string;
    apiKey: string;
}

const OpenAICompatibleProviderCard: React.FC<{
    provider: OpenAICompatibleProvider;
    onUpdate: (provider: OpenAICompatibleProvider) => void;
    onDelete: (id: string) => void;
}> = ({ provider, onUpdate, onDelete }) => {
    const [isSaved, setIsSaved] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const handleChange = (field: keyof OpenAICompatibleProvider, value: string) => {
        onUpdate({ ...provider, [field]: value });
        setIsSaved(false);
    };

    const isValid = provider.name.trim() && provider.baseUrl.trim() && provider.apiKey.trim();

    const handleSave = () => {
        if (isValid) {
            setIsSaved(true);
            setShowToast(true);
            // Here you would typically save to localStorage or API
        }
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
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">OpenAI Compatible Provider</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Provider Name
                        </label>
                        <input
                            type="text"
                            value={provider.name}
                            onChange={(e) => handleChange('name', e.target.value)}
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
                            value={provider.baseUrl}
                            onChange={(e) => handleChange('baseUrl', e.target.value)}
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
                            value={provider.apiKey}
                            onChange={(e) => handleChange('apiKey', e.target.value)}
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
    const [openAIProviders, setOpenAIProviders] = useState<OpenAICompatibleProvider[]>([]);

    // Load OpenAI compatible providers from localStorage on mount
    useEffect(() => {
        const savedProviders = localStorage.getItem(OPENAI_COMPATIBLE_PROVIDERS);
        if (savedProviders) {
            try {
                const providers = JSON.parse(savedProviders);
                setOpenAIProviders(providers);
            } catch (error) {
                console.error('Error loading OpenAI compatible providers:', error);
            }
        }
    }, []);

    // Save OpenAI compatible providers to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem(OPENAI_COMPATIBLE_PROVIDERS, JSON.stringify(openAIProviders));
    }, [openAIProviders]);

    const addNewProvider = () => {
        // Check if the last provider is complete before adding a new one
        if (openAIProviders.length > 0) {
            const lastProvider = openAIProviders[openAIProviders.length - 1];
            if (!isProviderValid(lastProvider)) {
                return; // Don't add new provider if last one is incomplete
            }
        }

        const newProvider: OpenAICompatibleProvider = {
            id: Date.now().toString(),
            name: '',
            baseUrl: '',
            apiKey: ''
        };
        setOpenAIProviders(prev => [...prev, newProvider]);
    };

    const updateProvider = (updatedProvider: OpenAICompatibleProvider) => {
        setOpenAIProviders(prev => 
            prev.map(provider => 
                provider.id === updatedProvider.id ? updatedProvider : provider
            )
        );
    };

    const deleteProvider = (id: string) => {
        setOpenAIProviders(prev => prev.filter(provider => provider.id !== id));
    };

    // Validation function to check if a provider is complete and valid
    const isProviderValid = (provider: OpenAICompatibleProvider): boolean => {
        return !!(
            provider.name.trim() &&
            provider.baseUrl.trim() &&
            provider.apiKey.trim()
        );
    };

    // Check if we can add a new provider
    const canAddNewProvider = openAIProviders.length === 0 || 
        isProviderValid(openAIProviders[openAIProviders.length - 1]);

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
                    storageKey={ANTHROPIC_API_KEY}
                />
                <ApiProviderCard 
                    title="OpenAI API Key"
                    consoleUrl="https://platform.openai.com/api-keys"
                    placeholder="sk-..."
                    consoleName="OpenAI's Console"
                    storageKey={OPENAI_API_KEY}
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
                        {openAIProviders.map(provider => (
                            <OpenAICompatibleProviderCard
                                key={provider.id}
                                provider={provider}
                                onUpdate={updateProvider}
                                onDelete={deleteProvider}
                            />
                        ))}

                        {openAIProviders.length === 0 && (
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