// Types for API providers and models

// Define the structure for custom OpenAI compatible providers
export interface Provider {
    id: string;
    label: string;
    value: string|null;
    base_url: string|null;
    disabled?: boolean;
}

// Define the model structure returned by the API
export interface Model {
    id: string;
    name: string;
    description: string;
    supported_parameters: string[];
}

// Model capabilities based on supported parameters
export interface ModelCapabilities {
    hasTools: boolean;
    hasReasoning: boolean;
    hasVision: boolean;
}