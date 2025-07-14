import { BuiltInProvider, CustomProvider, Model } from '../types/providers';

/**
 * Determines model capabilities based on supported parameters
 * @param supportedParameters - Array of supported parameter strings
 * @returns Object with capability flags
 */
export const getModelCapabilities = (supportedParameters: string[]) => {
    const params = supportedParameters.map(p => p.toLowerCase());
    
    return {
        hasTools: params.some(p => p.includes('tools') || p.includes('tool_choice')),
        hasReasoning: params.some(p => p.includes('reasoning') || p.includes('include_reasoning')),
        hasVision: params.some(p => p.includes('vision') || p.includes('image'))
    };
}

/**
 * Fetches available models from a provider
 * @param provider - Either a BuiltInProvider or CustomProvider
 * @returns Promise<Model[]> - Array of available models
 */
export const fetchModels = async (provider: BuiltInProvider | CustomProvider): Promise<Model[]> => {
    // Check if it's a CustomProvider by checking for base_url property
    const isCustomProvider = 'base_url' in provider;
    
    // For built-in providers, return empty array for now
    if (!isCustomProvider) {
        console.log(`Built-in provider ${provider.provider} - models fetching not implemented yet`);
        return [];
    }
    
    // Handle CustomProvider
    const customProvider = provider as CustomProvider;
    
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
        console.error(`Error fetching models from ${customProvider.provider}:`, error);
        throw error;
    }
};

export default fetchModels;
