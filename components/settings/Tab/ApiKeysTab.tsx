import React, { useState } from 'react';
import React, { useState, useEffect } from 'react';
import { Key, Plus, X } from '../../Icons';
import Button from '../../ui/Button';
import CustomDropdown from '../../ui/CustomDropdown';

// localStorage keys
const ANTHROPIC_API_KEY = 'anthropic_api_key';
const OPENAI_API_KEY = 'openai_api_key';
const OPENAI_COMPATIBLE_PROVIDERS = 'openai_compatible_providers';

const ApiProviderCard: React.FC<{
    title: string;
    models: string[];
    consoleUrl: string;
    placeholder: string;
    consoleName: string;
    storageKey: string;
}> = ({ title, models, consoleUrl, placeholder, consoleName, storageKey }) => {
    const [apiKey, setApiKey] = useState('');

    // Load API key from localStorage on mount
    useEffect(() => {
        const savedKey = localStorage.getItem(storageKey);
        if (savedKey) {
            setApiKey(savedKey);
        }
    }, [storageKey]);

    const handleSave = () => {
        if (apiKey.trim()) {
            localStorage.setItem(storageKey, apiKey.trim());
        } else {
            localStorage.removeItem(storageKey);
        }
        // Could add a toast notification here
    };

    return (
        <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <Key className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{title}</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">Used for the following models:</p>
            <div className="flex flex-wrap gap-2 mb-4">
                {models.map(model => (
                    <span key={model} className="text-xs font-medium bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-400 py-1 px-3 rounded-full">
                        {model}
                    </span>
                ))}
            </div>
            
            <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />

            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                <a href={consoleUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-500 hover:underline">
                    Get your API key from {consoleName}
                </a>
                <Button size="sm" onClick={handleSave}>Save</Button>
            </div>
        </div>
    );
};

interface OpenAICompatibleProvider {
    id: string;
    name: string;
    baseUrl: string;
    apiKey: string;
    model: string;
}

const OpenAICompatibleProviderCard: React.FC<{
    provider: OpenAICompatibleProvider;
    onUpdate: (provider: OpenAICompatibleProvider) => void;
    onDelete: (id: string) => void;
}> = ({ provider, onUpdate, onDelete }) => {
    const modelOptions = [
        'gpt-3.5-turbo',
        'gpt-4',
        'gpt-4-turbo',
        'claude-3-sonnet',
        'claude-3-opus',
        'llama-2-70b',
        'mistral-7b',
        'custom-model'
    ];

    const handleChange = (field: keyof OpenAICompatibleProvider, value: string) => {
        onUpdate({ ...provider, [field]: value });
    };

    return (
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                    <CustomDropdown
                        label="Model"
                        description=""
                        options={modelOptions}
                        selected={provider.model}
                        onSelect={(model) => handleChange('model', model)}
                        animationsDisabled={false}
                    />
                </div>
            </div>

            <div className="flex justify-end mt-4">
                <Button size="sm">Save Provider</Button>
            </div>
        </div>
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
            apiKey: '',
            model: 'gpt-3.5-turbo'
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
            provider.apiKey.trim() &&
            provider.model.trim()
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
                    models={['Claude 3.5 Sonnet', 'Claude 3.7 Sonnet', 'Claude 3.7 Sonnet (Reasoning)', 'Claude 4 Opus', 'Claude 4 Sonnet', 'Claude 4 Sonnet (Reasoning)']}
                    consoleUrl="https://console.anthropic.com/"
                    placeholder="sk-ant-..."
                    consoleName="Anthropic's Console"
                    storageKey={ANTHROPIC_API_KEY}
                />
                <ApiProviderCard 
                    title="OpenAI API Key"
                    models={['GPT-4.5', 'o3', 'o3 Pro']}
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