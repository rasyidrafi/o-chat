import { useState, useCallback, useEffect } from 'react';
import { useCloudStorage } from '../contexts/CloudStorageContext';
import { DEFAULT_SYSTEM_MODELS } from '../constants/models';
import { getSystemModelsSync } from '../services/modelService';

interface ModelOption {
    label: string;
    value: string;
    source: "system" | "custom";
    providerId?: string;
    providerName?: string;
    supported_parameters?: string[];
}

export const useModelOptions = () => {
    const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
    const [isLoadingSystemModels, setIsLoadingSystemModels] = useState(false);

    const {
        custom_providers: cloudCustomProviders = [],
        selected_server_models: cloudSelectedServerModels = [],
        selected_provider_models: cloudSelectedProviderModels = {},
        custom_models: cloudCustomModels = [],
    } = useCloudStorage();

    // Load available models from localStorage only (no API calls)
    const loadAvailableModels = useCallback(() => {
        const options: ModelOption[] = [];

        try {
            setIsLoadingSystemModels(true);

            // Load selected server models from cloud storage
            const selectedServerModels = cloudSelectedServerModels;

            // Load cached system models synchronously (no API call)
            const syncSystemModels = getSystemModelsSync();

            // Filter sync system models and add to options immediately
            const filteredSyncSystemModels = syncSystemModels.filter((model: any) => {
                const isFallbackModel = DEFAULT_SYSTEM_MODELS.some(
                    (fallback) => fallback.id === model.id
                );
                if (isFallbackModel) {
                    return true;
                }
                // More flexible matching - check both id and name
                return selectedServerModels.some(
                    (selected: {
                        id: string;
                        name: string;
                        supported_parameters?: string[];
                        provider_id?: string;
                        provider_name?: string;
                    }) =>
                        selected.id === model.id ||
                        selected.name === model.name ||
                        selected.id === model.name
                );
            });

            const syncSystemModelOptions = filteredSyncSystemModels.map((model: any) => {
                // Use stored supported_parameters if available, otherwise fallback to model's parameters
                const storedModel = selectedServerModels.find(
                    (selected: {
                        id: string;
                        name: string;
                        supported_parameters?: string[];
                        provider_id?: string;
                        provider_name?: string;
                    }) =>
                        selected.id === model.id ||
                        selected.name === model.name ||
                        selected.id === model.name
                );
                const supported_parameters =
                    storedModel?.supported_parameters || model.supported_parameters || [];

                return {
                    label: model.name,
                    value: model.id,
                    source: "system" as const,
                    providerId: model.provider_id || "",
                    providerName: model.provider_name || "",
                    supported_parameters,
                };
            });
            options.push(...syncSystemModelOptions);

            // Add selected models directly from localStorage if they're not found in system models
            selectedServerModels.forEach(
                (selectedModel: {
                    id: string;
                    name: string;
                    supported_parameters?: string[];
                    provider_id?: string;
                    provider_name?: string;
                }) => {
                    // Check if this model is already in options
                    const existsInOptions = options.some(
                        (opt) =>
                            opt.value === selectedModel.id || opt.label === selectedModel.name
                    );

                    if (!existsInOptions) {
                        // Add the model directly from localStorage
                        options.push({
                            label: selectedModel.name,
                            value: selectedModel.id,
                            source: "system" as const,
                            providerId: selectedModel.provider_id || "",
                            providerName: selectedModel.provider_name || "",
                            supported_parameters: selectedModel.supported_parameters || [],
                        });
                    }
                }
            );

            // Load custom provider models from cloud storage
            try {
                if (cloudCustomProviders && cloudCustomProviders.length > 0) {
                    const customOptions: ModelOption[] = [];

                    cloudCustomProviders.forEach((provider: any) => {
                        if (
                            provider.label?.trim() &&
                            provider.value?.trim() &&
                            provider.base_url?.trim()
                        ) {
                            // Check if this provider has selected models in cloud storage
                            const providerModels = cloudSelectedProviderModels[provider.id] || [];

                            if (providerModels.length > 0) {
                                providerModels.forEach(
                                    (model: {
                                        id: string;
                                        name: string;
                                        supported_parameters?: string[];
                                        provider_id?: string;
                                        provider_name?: string;
                                    }) => {
                                        const modelOption = {
                                            label: `${provider.label} - ${model.name}`,
                                            value: model.id,
                                            source: "custom" as const,
                                            providerId: provider.id,
                                            providerName: provider.label,
                                            supported_parameters: model.supported_parameters || [],
                                        };
                                        customOptions.push(modelOption);
                                    }
                                );
                            }
                        }
                    });

                    options.push(...customOptions);
                }
            } catch (error) {
                console.error("Error loading custom providers:", error);
            }

            // Load custom models from cloud storage
            try {
                if (cloudCustomModels && cloudCustomModels.length > 0) {
                    const customModelOptions: ModelOption[] = cloudCustomModels.map((model: any) => {
                        // Try to determine the actual provider ID from the model's provider_id field
                        // If not available, fall back to checking against available custom providers
                        let actualProviderId = model.provider_id || "custom";
                        let providerName = "Custom";

                        // If we have a provider_id, try to find the corresponding provider name
                        if (model.provider_id && cloudCustomProviders) {
                            const matchingProvider = cloudCustomProviders.find((p: any) => p.id === model.provider_id);
                            if (matchingProvider) {
                                providerName = matchingProvider.label || matchingProvider.id || "Custom";
                                actualProviderId = matchingProvider.id;
                            }
                        }

                        const option = {
                            label: model.name,
                            value: model.id,
                            source: "custom" as const,
                            providerId: actualProviderId,
                            providerName: providerName,
                            supported_parameters: model.supported_parameters || [],
                        };
                        return option;
                    });

                    options.push(...customModelOptions);
                }
            } catch (error) {
                console.error("Error loading custom models:", error);
            }

            // Set final options with localStorage data only (sorted by source, provider, then by model name)
            // Custom models go to bottom after Other
            const sortedOptions = [...options].sort((a, b) => {
                // First separate by source: system models first, custom models last
                const aIsSystem = a.source === "system";
                const bIsSystem = b.source === "system";
                if (aIsSystem && !bIsSystem) return -1;
                if (!aIsSystem && bIsSystem) return 1;

                // Within same source, check if models have provider_id - those without go to bottom within their source
                const aHasProvider = Boolean(a.providerId && a.providerId.trim());
                const bHasProvider = Boolean(b.providerId && b.providerId.trim());

                if (aHasProvider && !bHasProvider) return -1; // a has provider, b doesn't - a comes first
                if (!aHasProvider && bHasProvider) return 1; // b has provider, a doesn't - b comes first
                if (!aHasProvider && !bHasProvider) {
                    // Both don't have providers - sort by model name
                    return a.label.localeCompare(b.label);
                }

                // Both have providers - sort by provider name first, then by model name
                const providerA = a.providerName || "";
                const providerB = b.providerName || "";

                if (providerA !== providerB) {
                    return providerA.localeCompare(providerB);
                }

                // If same provider (or both have no provider), sort by model name
                return a.label.localeCompare(b.label);
            });

            setModelOptions(sortedOptions);
        } catch (error) {
            console.error("Error loading models from localStorage:", error);
            // Use the shared constant for fallback models
            const fallbackSystemModels = DEFAULT_SYSTEM_MODELS.map((model) => ({
                label: model.name,
                value: model.id,
                source: "system" as const,
                providerId: model.provider_id || "",
                providerName: model.provider_name || "",
                supported_parameters: model.supported_parameters || [],
            }));

            const sortedFallbackModels = fallbackSystemModels.sort((a, b) => {
                // First separate by source: system models first, custom models last
                const aIsSystem = a.source === "system";
                const bIsSystem = b.source === "system";
                if (aIsSystem && !bIsSystem) return -1;
                if (!aIsSystem && bIsSystem) return 1;

                // Within same source, check if models have provider_id - those without go to bottom within their source
                const aHasProvider = Boolean(a.providerId && a.providerId.trim());
                const bHasProvider = Boolean(b.providerId && b.providerId.trim());

                if (aHasProvider && !bHasProvider) return -1; // a has provider, b doesn't - a comes first
                if (!aHasProvider && bHasProvider) return 1; // b has provider, a doesn't - b comes first
                if (!aHasProvider && !bHasProvider) {
                    // Both don't have providers - sort by model name
                    return a.label.localeCompare(b.label);
                }

                // Both have providers - sort by provider name first, then by model name
                const providerA = a.providerName || "";
                const providerB = b.providerName || "";

                if (providerA !== providerB) {
                    return providerA.localeCompare(providerB);
                }

                // If same provider (or both have no provider), sort by model name
                return a.label.localeCompare(b.label);
            });
            setModelOptions(sortedFallbackModels);
        } finally {
            setIsLoadingSystemModels(false);
        }
    }, [cloudSelectedServerModels, cloudSelectedProviderModels, cloudCustomProviders, cloudCustomModels]);

    // Load models on mount
    useEffect(() => {
        loadAvailableModels();
    }, [loadAvailableModels]);

    return {
        modelOptions,
        isLoadingSystemModels,
        loadAvailableModels,
    };
};