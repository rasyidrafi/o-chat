// Chat service for handling AI model interactions
import OpenAI from "openai";
import { User } from 'firebase/auth';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  choices: {
    delta: {
      content?: string;
      reasoning?: string;
      reasoning_details?: any[];
    };
  }[];
}

export class ChatService {
  private static createOpenAIInstance(idToken?: string, baseURL?: string, apiKey?: string) {
    const headers: Record<string, string> = {};

    // Add Firebase ID token as Authorization header if available
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    return new OpenAI({
      apiKey: apiKey || "",
      baseURL: baseURL || "",
      defaultHeaders: headers,
      dangerouslyAllowBrowser: true // Allow browser usage
    });
  }

  private static getProviderConfig(source: string, providerId?: string) {
    if (source === 'system') {
      return {
        baseURL: import.meta.env.VITE_FIREBASE_FUNC_BASE_API,
        apiKey: "",
        requiresAuth: true
      };
    }

    if (source === 'builtin' && providerId) {
      try {
        const builtInProviders = localStorage.getItem('builtin_api_providers');
        if (builtInProviders) {
          const providers = JSON.parse(builtInProviders);
          const provider = providers.find((p: any) => p.id === providerId);
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
          const provider = providers.find((p: any) => p.id === providerId);
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

    // return error
    throw new Error('No valid provider configuration found');
  }

  static async sendMessage(
    model: string,
    messages: ChatMessage[],
    onChunk: (content: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    user?: User | null,
    abortController?: AbortController,
    source: string = 'system',
    providerId?: string,
    onReasoningChunk?: (reasoning: string) => void
  ): Promise<void> {

    try {
      const config = this.getProviderConfig(source, providerId);
      let idToken: string | undefined;

      // Get Firebase ID token if required and user is authenticated
      if (config.requiresAuth && user) {
        try {
          idToken = await user.getIdToken();
        } catch (tokenError) {
          console.warn('Failed to get Firebase ID token:', tokenError);
          if (source === 'system') {
            throw new Error('Authentication required for system models');
          }
        }
      }

      // Create OpenAI instance with the appropriate configuration
      const openai = this.createOpenAIInstance(idToken, config.baseURL, config.apiKey);

      // Handle different provider message formats
      let processedMessages = messages;
      if (source === 'builtin' && providerId === 'anthropic') {
        // Anthropic may require different message formatting
        // For now, we'll use the OpenAI format but this could be extended
        processedMessages = messages;
      }

      const completion = await openai.chat.completions.create({
        model,
        messages: processedMessages,
        stream: true
      }, {
        signal: abortController?.signal
      });

      for await (const chunk of completion) {
        // Handle reasoning chunks
        // @ts-ignore
        if (chunk.choices[0]?.delta?.reasoning && onReasoningChunk) {
          // @ts-ignore
          onReasoningChunk(chunk.choices[0].delta.reasoning);
        }
        
        // Handle content chunks
        if (chunk.choices[0]?.delta?.content) {
          onChunk(chunk.choices[0].delta.content);
        }
      }

      onComplete();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, don't call onError
        return;
      }
      onError(error as Error);
    }
  }
}