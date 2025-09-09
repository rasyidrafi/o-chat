import { Provider, Model } from '../types/providers';
import { DEFAULT_SYSTEM_MODELS, PROVIDER_NAMES } from '../constants/models';
import { auth } from '../firebase';

/**
 * Determines model capabilities based on model object properties
 * @param modelOrParams - Model object containing various capability indicators, or array of supported parameters for backward compatibility
 * @returns Object with capability flags
 */
export const getModelCapabilities = (modelOrParams: any) => {
    // Handle backward compatibility - if it's an array, treat it as supported_parameters
    if (Array.isArray(modelOrParams)) {
        const params = modelOrParams.map((p: string) => p.toLowerCase());
        
        return {
            hasTools: params.some((p: string) => 
                p.includes('tools') || 
                p.includes('tool_choice') || 
                p.includes('function_calling')
            ),
            hasReasoning: params.some((p: string) => 
                p.includes('reasoning') || 
                p.includes('include_reasoning')
            ),
            hasVision: params.some((p: string) => 
                p.includes('vision') || 
                p.includes('multimodal') ||
                (p.includes('image') && !p.includes('image_generation') && !p.includes('image_editing'))
            ),
            hasImageGeneration: params.some((p: string) => 
                p.includes('image_generation')
            ),
            hasImageGenerationJobs: params.some((p: string) => 
                p.includes('image_generation_jobs')
            ),
            hasImageEditing: params.some((p: string) => 
                p.includes('image_editing')
            ),
            hasTextGeneration: params.some((p: string) => 
                p.includes('text_generation') || 
                p.includes('completion') ||
                p.includes('chat')
            ),
            hasAudioGeneration: false,
            hasImageGenerationChat: false
        };
    }
    
    // Handle model object
    const model = modelOrParams;
    
    // Extract supported parameters if they exist
    const supportedParameters = model.supported_parameters || [];
    const params = supportedParameters.map((p: string) => p.toLowerCase());
    
    // Check direct boolean properties
    const hasToolsDirect = model.tools === true;
    const hasVisionDirect = model.vision === true;
    const hasReasoningDirect = model.reasoning === true;
    
    // Check output modalities for audio generation
    const outputModalities = model.output_modalities || [];
    const hasAudioGeneration = outputModalities.some((modality: string) => 
        modality.toLowerCase().includes('audio')
    );
    
    // Check output modalities for image generation in chat responses  
    const hasImageGenerationChat = outputModalities.some((modality: string) => 
        modality.toLowerCase().includes('image')
    );
    
    // Check input modalities for vision support
    const inputModalities = model.input_modalities || [];
    const hasVisionFromInputModalities = inputModalities.some((modality: string) => 
        modality.toLowerCase().includes('image')
    );
    
    const capabilities = {
        hasTools: hasToolsDirect || params.some((p: string) => 
            p.includes('tools') || 
            p.includes('tool_choice') || 
            p.includes('function_calling')
        ),
        hasReasoning: hasReasoningDirect || params.some((p: string) => 
            p.includes('reasoning') || 
            p.includes('include_reasoning')
        ),
        hasVision: hasVisionDirect || hasVisionFromInputModalities || params.some((p: string) => 
            p.includes('vision') || 
            p.includes('multimodal') ||
            (p.includes('image') && !p.includes('image_generation') && !p.includes('image_editing'))
        ),
        hasImageGeneration: params.some((p: string) => 
            p.includes('image_generation')
        ),
        hasImageGenerationJobs: params.some((p: string) => 
            p.includes('image_generation_jobs')
        ),
        hasImageEditing: params.some((p: string) => 
            p.includes('image_editing')
        ),
        hasTextGeneration: params.some((p: string) => 
            p.includes('text_generation') || 
            p.includes('completion') ||
            p.includes('chat')
        ),
        hasAudioGeneration: hasAudioGeneration,
        hasImageGenerationChat: hasImageGenerationChat
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
        console.warn('⚠️ VITE_FIREBASE_FUNC_BASE_API not configured, using fallback models');
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
                console.warn('⚠️ Failed to get Firebase ID token:', tokenError);
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
            console.warn('⚠️ Unexpected response format from system models API, using fallback models');
            return fallbackModels;
        }
        
        // Merge models with descriptions
        const processedModels = fetchedModels.map((model: any) => {
            const modelId = model.id || model.model || '';
            const description = model?.description || "";
            const modelSupportedParameters = model.supported_parameters || [];
            const providerId = model.provider_id || '';
            const providerName = model.provider_name || PROVIDER_NAMES[providerId] || '';

            return {
                id: modelId,
                name: model.name || modelId,
                description,
                supported_parameters: modelSupportedParameters || [],
                provider_id: providerId,
                provider_name: providerName
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
        console.error('❌ Error fetching system models:', error);
        return fallbackModels;
    }
};

export const fetchModels = async (provider: Provider): Promise<Model[]> => {
    // Check if it's a CustomProvider by checking for base_url property
    const isCustomProvider = 'base_url' in provider;
    provider = provider as Provider; // Ensure provider is treated as Provider type
    
    // For built-in providers, return empty array for now
    if (!isCustomProvider) {
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
            // Transform the array response to ensure proper model format
            return data.map((model: any) => ({
                id: model.id || model.name || model.model || '',
                name: model.name || model.id || model.model || '',
                description: model.description || '',
                supported_parameters: model.supported_parameters || [],
                provider_id: model.provider_id || '',
                provider_name: model.provider_name || PROVIDER_NAMES[model.provider_id] || ''
            })) as Model[];
        }
        
        // The OpenAI API returns models in a 'data' array, but we expect direct array
        if (data.data && Array.isArray(data.data)) {
            // Convert OpenAI format to our expected format
            return data.data.map((model: any) => ({
                id: model.id || model.name || model.model || '',
                name: model.name || model.id || model.model || '',
                description: model.description || '',
                supported_parameters: model.supported_parameters || [],
                provider_id: model.provider_id || '',
                provider_name: model.provider_name || PROVIDER_NAMES[model.provider_id] || ''
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
