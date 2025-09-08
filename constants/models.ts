import { Model } from '../types/providers';

/**
 * Provider ID to provider name mapping
 */
export const PROVIDER_NAMES: Record<string, string> = {
    'ai21': 'AI21 Labs',
    'anthropic': 'Anthropic',
    'bfl': 'Black Forest Labs',
    'bytedance': 'ByteDance',
    'cohere': 'Cohere',
    'deepseek': 'DeepSeek',
    'google': 'Google',
    'meta': 'Meta',
    'microsoft': 'Microsoft',
    'mistral': 'Mistral AI',
    'moonshotai': 'Moonshot AI',
    'openai': 'OpenAI',
    'qwen': 'Qwen',
    'stabillityai': 'Stability AI',
    'venice': 'Venice AI',
    'xai': 'xAI',
    'zai': 'ZAI',
};

/**
 * Default system models that serve as fallback when API fetch fails
 * These models cannot be deselected and are always available
 */
export const DEFAULT_SYSTEM_MODELS: Model[] = [
    {
        id: 'Gemini 1.5 Flash',
        name: 'Gemini 1.5 Flash',
        description: "Google's fast and efficient model optimized for high-frequency tasks with multimodal capabilities.",
        supported_parameters: ['tools', 'vision'],
        provider_id: "google",
        provider_name: "Google"
    }
];

/**
 * Default model ID to use when no other model is specified
 */
export const DEFAULT_MODEL_ID = DEFAULT_SYSTEM_MODELS[0].id;

/**
 * Names of default models (for backward compatibility checks)
 */
export const DEFAULT_MODEL_NAMES = DEFAULT_SYSTEM_MODELS.map(model => model.name);
