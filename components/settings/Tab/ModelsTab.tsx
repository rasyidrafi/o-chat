import React, { useState, useEffect, useMemo } from 'react';
import CustomDropdown from '../../ui/CustomDropdown';
import ModelCard from '../ModelCard';
import { AppSettings } from '../../../App';
import { Provider, Model } from '../../../types/providers';
import { fetchModels, getModelCapabilities } from '../../../services/modelService';

interface ModelsTabProps {
    settings: AppSettings;
}

// Helper functions for localStorage management
const getProviderModelsKey = (providerId: string): string => {
    return `models_${providerId}`;
};

const loadSelectedModelsFromStorage = (providerId: string): string[] => {
    if (!providerId) return [];
    
    try {
        const key = getProviderModelsKey(providerId);
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored);
        }
        return [];
    } catch (error) {
        console.error('Error loading selected models from localStorage:', error);
        return [];
    }
};

const saveSelectedModelsToStorage = (providerId: string, selectedModels: Array<{id: string, name: string}>) => {
    if (!providerId) return;
    
    try {
        const key = getProviderModelsKey(providerId);
        localStorage.setItem(key, JSON.stringify(selectedModels));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('localStorageChange', {
            detail: { key, value: selectedModels }
        }));
    } catch (error) {
        console.error('Error saving selected models to localStorage:', error);
    }
};

const ModelsTab: React.FC<ModelsTabProps> = ({ settings }) => {
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [activeByokTab, setActiveByokTab] = useState<'selected' | 'available'>('available');
    const [availableProviders, setAvailableProviders] = useState<Array<Provider>>([]);
    const [fetchedModels, setFetchedModels] = useState<Model[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [modelsError, setModelsError] = useState<string | null>(null);
    const [isChangingPage, setIsChangingPage] = useState(false);
    
    // Pagination and search states
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(6);
    
    // Server models are always enabled - read only
    const [serverModelsEnabled] = useState<string[]>(['Gemini 1.5 Flash', 'Gemini 1.5 Flash 8B']);
    
    // All selected models for current provider stored in localStorage
    const [selectedModels, setSelectedModels] = useState<Array<{id: string, name: string}>>([]);

    // Load selected models from localStorage when provider changes
    useEffect(() => {
        const loadedSelectedModels = loadSelectedModelsFromStorage(selectedProvider);
        setSelectedModels(loadedSelectedModels);
    }, [selectedProvider]);

    // Save selected models to localStorage whenever they change
    useEffect(() => {
        if (selectedProvider) {
            saveSelectedModelsToStorage(selectedProvider, selectedModels);
        }
    }, [selectedProvider, selectedModels]);

    // Load providers from localStorage
    useEffect(() => {
        const loadProviders = () => {
            let providers: Array<Provider> = [];
            
            // Load built-in providers from localStorage
            try {
                const builtInProviders = localStorage.getItem('builtin_api_providers');
                if (builtInProviders) {
                    const parsed = JSON.parse(builtInProviders);
                    
                    // Add All
                    const allProvider = parsed.map((p: Provider) => ({
                        ...p,
                        disabled: !p.value?.trim()
                    }));

                    providers = [...providers, ...allProvider];
                } else {
                    // Default providers if not in localStorage
                    providers.push(
                        { label: 'Anthropic', value: 'anthropic', disabled: true, id: 'anthropic', base_url: null },
                        { label: 'OpenAI', value: 'openai', disabled: true, id: 'openai', base_url: null }
                    );
                }
            } catch (error) {
                console.error('Error loading built-in providers:', error);
                providers.push(
                    { label: 'Anthropic', value: 'anthropic', disabled: true, id: 'anthropic', base_url: null },
                    { label: 'OpenAI', value: 'openai', disabled: true, id: 'openai', base_url: null }
                );
            }
            
            // Load custom providers from localStorage
            try {
                const customProviders = localStorage.getItem('custom_api_providers');
                if (customProviders) {
                    const parsed = JSON.parse(customProviders);
                    parsed.forEach((provider: Provider) => {
                        if (provider.label?.trim() && provider.value?.trim() && provider.base_url?.trim()) {
                            providers.push({
                                label: provider.label,
                                value: null, // prevent
                                disabled: false,
                                id: provider.id,
                                base_url: null
                            });
                        }
                    });
                }
            } catch (error) {
                console.error('Error loading custom providers:', error);
            }
            
            setAvailableProviders(providers);
        };
        
        loadProviders();
    }, []);

    // Fetch models when a custom provider is selected
    useEffect(() => {
        const fetchModelsForProvider = async () => {
            if (!selectedProvider) {
                setFetchedModels([]);
                setModelsError(null);
                return;
            }

            // Check if it's a custom provider (UUID format)
            const isCustomProvider = selectedProvider.includes('-');
            
            if (!isCustomProvider) {
                // For built-in providers, clear fetched models for now
                setFetchedModels([]);
                setModelsError(null);
                return;
            }

            setIsLoadingModels(true);
            setModelsError(null);

            try {
                // Get the custom provider details
                const customProviders = localStorage.getItem('custom_api_providers');
                if (!customProviders) {
                    throw new Error('No custom providers found');
                }

                const parsed = JSON.parse(customProviders);
                const provider = parsed.find((p: Provider) => p.id === selectedProvider);
                
                if (!provider) {
                    throw new Error('Selected provider not found');
                }

                const models = await fetchModels(provider);
                setFetchedModels(models);
            } catch (error) {
                console.error('Error fetching models:', error);
                setModelsError(error instanceof Error ? error.message : 'Failed to fetch models');
                setFetchedModels([]);
            } finally {
                setIsLoadingModels(false);
            }
        };

        fetchModelsForProvider();
    }, [selectedProvider]);

    // Reset pagination when search or provider changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedProvider, selectedFeatures]);

    const availableModels = [
        {
            name: 'Gemini 1.5 Flash',
            description: "Google's fast and efficient model optimized for high-frequency tasks with multimodal capabilities.",
            features: ['Text Generation', 'Tool Calling'],
            category: 'server',
            logo: 'google'
        },
        {
            name: 'Gemini 1.5 Flash 8B',
            description: "A smaller, faster version of Gemini 1.5 Flash with 8 billion parameters for quick responses.",
            features: ['Text Generation', 'Tool Calling'],
            category: 'server',
            logo: 'google'
        }
    ];

    const featureOptions = ['Tool Calling', 'Reasoning', 'Vision'];

    // Filter and paginate models
    const filteredAndPaginatedModels = useMemo(() => {
        // Always show server models
        const serverModels = availableModels.filter(model => model.category === 'server');
        
        // Handle BYOK models
        let byokModels: any[] = [];
        
        if (selectedProvider) {
            // Check if it's a custom provider (UUID format)
            const isCustomProvider = selectedProvider.includes('-');
            
            if (isCustomProvider) {
                // Use fetched models for custom providers
                byokModels = fetchedModels.map(model => {
                    const capabilities = getModelCapabilities(model.supported_parameters);
                    return {
                        name: model.name,
                        description: model.description,
                        features: [
                            'Text Generation',
                            ...(capabilities.hasTools ? ['Tool Calling'] : []),
                            ...(capabilities.hasReasoning ? ['Reasoning'] : []),
                            ...(capabilities.hasVision ? ['Vision'] : [])
                        ],
                        category: 'byok',
                        id: model.id,
                        providerId: selectedProvider
                    };
                });
            } else {
                // Use static models for built-in providers
                byokModels = availableModels.filter(model => model.category === 'byok');
            }
        }
        
        // Filter by tab selection (Selected vs Available)
        if (activeByokTab === 'selected') {
            byokModels = byokModels.filter(model => selectedModels.some(selected => selected.id === model.id));
        }
        
        // Apply feature filtering
        if (selectedFeatures.length > 0) {
            byokModels = byokModels.filter(model => 
                selectedFeatures.every(feature => model.features.includes(feature))
            );
        }

        // Apply search filtering
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            byokModels = byokModels.filter(model => 
                model.name.toLowerCase().includes(query) ||
                model.description.toLowerCase().includes(query) ||
                model.features.some((feature: string) => feature.toLowerCase().includes(query))
            );
        }

        // Calculate pagination
        const totalItems = byokModels.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedModels = byokModels.slice(startIndex, endIndex);

        return {
            serverModels,
            byokModels: paginatedModels,
            totalItems,
            totalPages,
            currentPage,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1
        };
    }, [selectedProvider, selectedFeatures, searchQuery, currentPage, fetchedModels, itemsPerPage, activeByokTab, selectedModels]);

    const handleModelToggle = (modelId: string, modelName: string, enabled: boolean) => {
        if (enabled) {
            setSelectedModels(prev => [...prev, { id: modelId, name: modelName }]);
        } else {
            setSelectedModels(prev => prev.filter(model => model.id !== modelId));
        }
    };

    const handleUnselectAll = () => {
        // Clear all selected models for current provider
        setSelectedModels([]);
    };

    const handleFeatureSelect = (feature: string) => {
        setSelectedFeatures([feature]);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handlePageChange = (page: number) => {
        setIsChangingPage(true);
        // Small delay to show loading state, then change page
        setTimeout(() => {
            setCurrentPage(page);
            setIsChangingPage(false);
        }, 150);
    };

    const renderPaginationButton = (page: number, isActive: boolean = false) => (
        <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`
                px-3 py-2 text-sm font-medium rounded-lg min-w-[40px] border transition-colors
                ${isActive 
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-transparent' 
                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                }
            `}
        >
            {page}
        </button>
    );

    const renderPagination = () => {
        const { totalPages, currentPage, hasPreviousPage, hasNextPage } = filteredAndPaginatedModels;
        
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = window.innerWidth < 640 ? 3 : 5; // Fewer pages on mobile
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(renderPaginationButton(i, i === currentPage));
        }

        return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 order-2 sm:order-1">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndPaginatedModels.totalItems)} to {Math.min(currentPage * itemsPerPage, filteredAndPaginatedModels.totalItems)} of {filteredAndPaginatedModels.totalItems} models
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!hasPreviousPage}
                        className={`
                            px-3 py-2 text-sm font-medium rounded-lg border transition-colors
                            ${hasPreviousPage 
                                ? 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700' 
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-700 cursor-not-allowed'
                            }
                        `}
                    >
                        Previous
                    </button>
                    
                    {startPage > 1 && (
                        <>
                            {renderPaginationButton(1)}
                            {startPage > 2 && <span className="px-2 text-zinc-400 text-sm">...</span>}
                        </>
                    )}
                    
                    {pages}
                    
                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && <span className="px-2 text-zinc-400 text-sm">...</span>}
                            {renderPaginationButton(totalPages)}
                        </>
                    )}
                    
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!hasNextPage}
                        className={`
                            px-3 py-2 text-sm font-medium rounded-lg border transition-colors
                            ${hasNextPage 
                                ? 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700' 
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-700 cursor-not-allowed'
                            }
                        `}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">Available Models</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Choose which models appear in your model selector. This won't affect existing conversations.
            </p>

            <div className="space-y-8">
                {/* From Our Server Section */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">From Our Servers</h3>
                    </div>
                    <div className="space-y-4">
                        {filteredAndPaginatedModels.serverModels.map((model) => (
                            <ModelCard
                                key={model.name}
                                name={model.name}
                                description={model.description}
                                features={model.features}
                                isEnabled={serverModelsEnabled.includes(model.name)}
                                onToggle={() => {}} // No-op for server models
                                animationsDisabled={settings.animationsDisabled}
                                logo={model.logo}
                                disabled={true}
                            />
                        ))}
                    </div>
                </div>

                {/* BYOK Models Section */}
                <div>
                    {/* BYOK Models Title */}
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">BYOK Models</h3>
                    
                    {/* Controls Row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-full sm:w-48">
                            <CustomDropdown
                                label=""
                                description=""
                                options={availableProviders.map(p => p.label)}
                                disabledOptions={availableProviders.filter(p => p.disabled).map(p => p.label)}
                                selected={selectedProvider ? 
                                    availableProviders.find(p => p.label === selectedProvider)?.label || 'Select Provider' : 
                                    'Select Provider'
                                }
                                onSelect={(option) => {
                                    const provider = availableProviders.find(p => p.label === option);
                                    if (provider && !provider.disabled) {
                                        setSelectedProvider(provider.id ?? '');
                                    }
                                }}
                                animationsDisabled={settings.animationsDisabled}
                            />
                        </div>
                        <div className="w-full sm:w-64">
                            <CustomDropdown
                                label=""
                                description=""
                                options={['All Features', ...featureOptions]}
                                selected={selectedFeatures.length === 0 ? 'All Features' : selectedFeatures[0]}
                                onSelect={(option) => {
                                    if (option === 'All Features') {
                                        setSelectedFeatures([]);
                                    } else {
                                        handleFeatureSelect(option);
                                    }
                                }}
                                animationsDisabled={settings.animationsDisabled}
                            />
                        </div>
                    </div>

                    {/* BYOK Tabs */}
                    {selectedProvider && (
                        <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6">
                            <button
                                onClick={() => setActiveByokTab('available')}
                                className={`relative px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors focus:outline-none 
                                    ${activeByokTab === 'available' 
                                        ? 'text-pink-500' 
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                            >
                                Available
                                {activeByokTab === 'available' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveByokTab('selected')}
                                className={`relative px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors focus:outline-none 
                                    ${activeByokTab === 'selected' 
                                        ? 'text-pink-500' 
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                            >
                                Selected ({selectedModels.length})
                                {activeByokTab === 'selected' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
                                )}
                            </button>
                        </div>
                    )}

                    {/* Search Bar */}
                    {selectedProvider && (
                        <div className="mb-4 sm:mb-6">
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search models by name, description, or features..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className={`
                                            w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-600 
                                            rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                                            placeholder-zinc-500 dark:placeholder-zinc-400 text-sm sm:text-base
                                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                            ${!settings.animationsDisabled ? 'transition-colors duration-200' : ''}
                                        `}
                                    />
                                </div>
                                <button
                                    onClick={handleUnselectAll}
                                    className={`
                                        w-full sm:w-auto px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 
                                        hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800/50 
                                        rounded-lg border border-zinc-300 dark:border-zinc-700 whitespace-nowrap
                                        ${!settings.animationsDisabled ? 'transition-colors duration-200' : ''}
                                    `}
                                >
                                    Unselect All
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={`space-y-4 ${!settings.animationsDisabled ? 'transition-all duration-300' : ''}`}>
                        {!selectedProvider ? (
                            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                                <p className="text-lg mb-2">No Provider Selected</p>
                                <p className="text-sm">Please select a provider from the dropdown above to view available models.</p>
                            </div>
                        ) : isLoadingModels ? (
                            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <div className={`w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full ${!settings.animationsDisabled ? 'animate-spin' : ''}`}></div>
                                    <p className="text-lg">Loading Models...</p>
                                </div>
                                <p className="text-sm">Fetching available models from the selected provider.</p>
                            </div>
                        ) : modelsError ? (
                            <div className="text-center py-12 text-red-500 dark:text-red-400">
                                <p className="text-lg mb-2">Error Loading Models</p>
                                <p className="text-sm">{modelsError}</p>
                            </div>
                        ) : isChangingPage ? (
                            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <div className={`w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full ${!settings.animationsDisabled ? 'animate-spin' : ''}`}></div>
                                    <p className="text-lg">Loading Page...</p>
                                </div>
                            </div>
                        ) : filteredAndPaginatedModels.byokModels.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                                <p className="text-lg mb-2">
                                    {activeByokTab === 'selected' 
                                        ? 'No Selected Models' 
                                        : searchQuery.trim() ? 'No Models Found' : 'No Models Available'
                                    }
                                </p>
                                <p className="text-sm">
                                    {activeByokTab === 'selected'
                                        ? 'You haven\'t selected any models yet. Switch to the Available tab to select models.'
                                        : searchQuery.trim() 
                                            ? 'No models match your search criteria. Try adjusting your search terms or filters.'
                                            : 'No models match the selected provider and feature filters.'
                                    }
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                                    {filteredAndPaginatedModels.byokModels.map((model, index) => (
                                        <div 
                                            key={model.id || model.name}
                                            className={`
                                                h-full flex
                                                ${!settings.animationsDisabled ? 'animate-fadeIn' : ''}
                                            `}
                                            style={{
                                                animationDelay: !settings.animationsDisabled ? `${index * 100}ms` : undefined
                                            }}
                                        >
                                            <ModelCard
                                                name={model.name}
                                                description={model.description}
                                                features={model.features}
                                                isEnabled={selectedModels.some(selected => selected.id === model.id)}
                                                onToggle={(enabled) => handleModelToggle(model.id, model.name, enabled)}
                                                animationsDisabled={settings.animationsDisabled}
                                            />
                                        </div>
                                    ))}
                                </div>
                                {renderPagination()}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* CSS for animations */}
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ModelsTab;