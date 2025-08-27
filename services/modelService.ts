import { Provider, Model } from '../types/providers';
import { DEFAULT_SYSTEM_MODELS } from '../constants/models';
import { auth } from '../firebase';

/**
 * Determines model capabilities based on supported parameters
 * @param supportedParameters - Array of supported parameter strings
 * @returns Object with capability flags
 */
export const getModelCapabilities = (supportedParameters: string[]) => {
    const params = supportedParameters.map(p => p.toLowerCase());
    
    const capabilities = {
        hasTools: params.some(p => p.includes('tools') || p.includes('tool_choice')),
        hasReasoning: params.some(p => p.includes('reasoning') || p.includes('include_reasoning')),
        hasVision: params.some(p => p.includes('vision') || p.includes('image')),
        hasImageGeneration: params.some(p => p.includes('image_generation')),
        hasImageEditing: params.some(p => p.includes('image_editing')),
        hasImageGenerationJobs: params.some(p => p.includes('image_generation_jobs'))
    };
    
    return capabilities;
}

/**
 * Fetches system models from the Firebase function API
 * @returns Promise<Model[]> - Array of available system models
 */
export const fetchSystemModels = async (): Promise<Model[]> => {
    const baseURL = import.meta.env.VITE_FIREBASE_FUNC_BASE_API;
    
    // Use the shared constant for fallback models
    const fallbackModels = DEFAULT_SYSTEM_MODELS;

    if (!baseURL) {
        console.warn('VITE_FIREBASE_FUNC_BASE_API not configured, using fallback models');
        return fallbackModels;
    }

    try {
        // Get Firebase ID token for authentication
        let idToken: string | undefined;
        const currentUser = auth.currentUser;
        
        if (currentUser) {
            try {
                idToken = await currentUser.getIdToken();
            } catch (tokenError) {
                console.warn('Failed to get Firebase ID token:', tokenError);
                // Continue without token - the API will decide if auth is required
            }
        }

        // Prepare headers with authentication if available
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        
        if (idToken) {
            headers['Authorization'] = `Bearer ${idToken}`;
        }

        // Construct the API URLs
        const modelsUrl = `${baseURL.replace(/\/$/, '')}/models`;
        
        // Prepare fetch promises
        const fetchPromises = [
            fetch(modelsUrl, {
                method: 'GET',
                headers,
            })
        ];

        // Fetch both APIs in parallel
        const responses = await Promise.all(fetchPromises);
        
        // Check if models API response is ok
        if (!responses[0].ok) {
            throw new Error(`Failed to fetch system models: ${responses[0].status} ${responses[0].statusText}`);
        }
        
        // Parse models response
        const modelsData = await responses[0].json();
        
        // Extract models from response
        let fetchedModels: any[] = [];
        
        // Handle array response directly
        if (Array.isArray(modelsData)) {
            fetchedModels = modelsData;
        } else if (modelsData.data && Array.isArray(modelsData.data)) {
            // The API might return models in a 'data' array
            fetchedModels = modelsData.data;
        } else {
            console.warn('Unexpected response format from system models API, using fallback models');
            return fallbackModels;
        }
        
        // Merge models with descriptions
        const processedModels = fetchedModels.map((model: any) => {
            const modelId = model.id || model.model || '';
            const description = model?.description || "";
            const modelSupportedParameters = model.supported_parameters || [];

            return {
                id: modelId,
                name: model.name || modelId,
                description,
                supported_parameters: modelSupportedParameters || []
            };
        }) as Model[];
        
        // Ensure fallback models are always included
        const allModels = [...fallbackModels];
        processedModels.forEach(model => {
            if (!fallbackModels.find(fallback => fallback.id === model.id)) {
                allModels.push(model);
            }
        });
        
        return allModels;
        
    } catch (error) {
        console.error('Error fetching system models:', error);
        console.log('Using fallback models due to fetch error');
        return fallbackModels;
    }
};

export const fetchModels = async (provider: Provider): Promise<Model[]> => {
    // Check if it's a CustomProvider by checking for base_url property
    const isCustomProvider = 'base_url' in provider;
    provider = provider as Provider; // Ensure provider is treated as Provider type
    
    // For built-in providers, return empty array for now
    if (!isCustomProvider) {
        console.log(`Built-in provider ${provider.label} - models fetching not implemented yet`);
        return [];
    }
    
    // Handle CustomProvider
    const customProvider = provider as Provider;
    
    // Validate required fields
    if (!customProvider.base_url || !customProvider.value) {
        throw new Error('Custom provider must have base_url and API key (value)');
    }
    
    try {
        // Construct the models endpoint URL
        const modelsUrl = `${customProvider.base_url.replace(/\/$/, '')}/models`;
        
        // Make the API request
        const response = await fetch(modelsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${customProvider.value}`,
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Handle array response directly
        if (Array.isArray(data)) {
            return data as Model[];
        }
        
        // The OpenAI API returns models in a 'data' array, but we expect direct array
        if (data.data && Array.isArray(data.data)) {
            // Convert OpenAI format to our expected format
            return data.data.map((model: any) => ({
                id: model.id || model.model || '',
                name: model.name || model.id || model.model || '',
                description: model.description || '',
                supported_parameters: model.supported_parameters || []
            })) as Model[];
        }
        
        // If neither format matches, return empty array
        console.warn('Unexpected response format from models API:', data);
        return [];
        
    } catch (error) {
        console.error(`Error fetching models from ${customProvider.label}:`, error);
        throw error;
    }
};

/**
 * Gets available system models (cached or fetched)
 * This is used by components that need system models synchronously
 * @returns Promise<Model[]> - Array of available system models
 */
export const getSystemModels = async (): Promise<Model[]> => {
    // Try to get from cache first
    const cached = localStorage.getItem('system_models_cache');
    const cacheTimestamp = localStorage.getItem('system_models_cache_timestamp');
    
    // Cache for 5 minutes
    const CACHE_DURATION = 5 * 60 * 1000;
    
    if (cached && cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp);
        if (age < CACHE_DURATION) {
            return JSON.parse(cached);
        }
    }
    
    // Fetch fresh data
    try {
        const models = await fetchSystemModels();
        // Cache the result
        localStorage.setItem('system_models_cache', JSON.stringify(models));
        localStorage.setItem('system_models_cache_timestamp', Date.now().toString());
        return models;
    } catch (error) {
        // If fetch fails and we have cached data, use it
        if (cached) {
            console.warn('Using cached system models due to fetch error');
            return JSON.parse(cached);
        }
        // Otherwise, return fallback models
        console.warn('Using fallback models due to fetch error');
        return DEFAULT_SYSTEM_MODELS;
    }
};

// Add a new function to get system models synchronously (for immediate use)
export const getSystemModelsSync = (): Model[] => {
    // Try to get from cache first
    const cached = localStorage.getItem('system_models_cache');
    const cacheTimestamp = localStorage.getItem('system_models_cache_timestamp');
    
    // Cache for 5 minutes
    const CACHE_DURATION = 5 * 60 * 1000;
    
    if (cached && cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp);
        if (age < CACHE_DURATION) {
            return JSON.parse(cached);
        }
    }
    
    // If no valid cache, return fallback models
    return DEFAULT_SYSTEM_MODELS;
};

export default fetchModels;
