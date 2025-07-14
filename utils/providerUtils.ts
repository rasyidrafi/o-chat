import { Provider } from '../types/providers';

export interface ModelOption {
  label: string;
  value: string;
  source: 'system' | 'builtin' | 'custom';
  providerId?: string;
}

export const getAvailableModels = (): ModelOption[] => {
  const options: ModelOption[] = [];

  // Always include system models (from our servers)
  const systemModels: ModelOption[] = [
    { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash', source: 'system' },
    { label: 'Gemini 1.5 Flash 8B', value: 'gemini-1.5-flash-8b', source: 'system' },
  ];
  options.push(...systemModels);

  // Load built-in provider models
  try {
    const builtInProviders = localStorage.getItem('builtin_api_providers');
    if (builtInProviders) {
      const providers = JSON.parse(builtInProviders);
      providers.forEach((provider: Provider) => {
        if (provider.value?.trim()) {
          // Add static models for built-in providers
          if (provider.id === 'openai') {
            options.push(
              { label: 'GPT-4', value: 'gpt-4', source: 'builtin', providerId: provider.id },
              { label: 'GPT-4 Turbo', value: 'gpt-4-turbo', source: 'builtin', providerId: provider.id },
              { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo', source: 'builtin', providerId: provider.id }
            );
          } else if (provider.id === 'anthropic') {
            options.push(
              { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229', source: 'builtin', providerId: provider.id },
              { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229', source: 'builtin', providerId: provider.id },
              { label: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307', source: 'builtin', providerId: provider.id }
            );
          }
        }
      });
    }
  } catch (error) {
    console.error('Error loading built-in providers:', error);
  }

  // Load custom provider models
  try {
    const customProviders = localStorage.getItem('custom_api_providers');
    if (customProviders) {
      const providers = JSON.parse(customProviders);
      providers.forEach((provider: Provider) => {
        if (provider.label?.trim() && provider.value?.trim() && provider.base_url?.trim()) {
          // Check if this provider has selected models
          const providerModelsKey = `models_${provider.id}`;
          const selectedModels = localStorage.getItem(providerModelsKey);
          if (selectedModels) {
            try {
              const modelIds = JSON.parse(selectedModels);
              modelIds.forEach((modelId: string) => {
                options.push({
                  label: `${provider.label} - ${modelId}`,
                  value: modelId,
                  source: 'custom',
                  providerId: provider.id
                });
              });
            } catch (error) {
              console.error('Error parsing selected models:', error);
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('Error loading custom providers:', error);
  }

  return options;
};

export const getProviderConfig = (source: string, providerId?: string) => {
  if (source === 'system') {
    return {
      baseURL: "https://api-3ujaavqala-uc.a.run.app",
      apiKey: "",
      requiresAuth: true
    };
  }

  if (source === 'builtin' && providerId) {
    try {
      const builtInProviders = localStorage.getItem('builtin_api_providers');
      if (builtInProviders) {
        const providers = JSON.parse(builtInProviders);
        const provider = providers.find((p: Provider) => p.id === providerId);
        if (provider && provider.value) {
          if (providerId === 'openai') {
            return {
              baseURL: "https://api.openai.com/v1",
              apiKey: provider.value,
              requiresAuth: false
            };
          } else if (providerId === 'anthropic') {
            return {
              baseURL: "https://api.anthropic.com/v1",
              apiKey: provider.value,
              requiresAuth: false
            };
          }
        }
      }
    } catch (error) {
      console.error('Error loading built-in provider config:', error);
    }
  }

  if (source === 'custom' && providerId) {
    try {
      const customProviders = localStorage.getItem('custom_api_providers');
      if (customProviders) {
        const providers = JSON.parse(customProviders);
        const provider = providers.find((p: Provider) => p.id === providerId);
        if (provider && provider.value && provider.base_url) {
          return {
            baseURL: provider.base_url,
            apiKey: provider.value,
            requiresAuth: false
          };
        }
      }
    } catch (error) {
      console.error('Error loading custom provider config:', error);
    }
  }

  // Default to system
  return {
    baseURL: "https://api-3ujaavqala-uc.a.run.app",
    apiKey: "",
    requiresAuth: true
  };
};
