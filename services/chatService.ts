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
    };
  }[];
}

export class ChatService {
  private static createOpenAIInstance(idToken?: string) {
    const headers: Record<string, string> = {};

    // Add Firebase ID token as Authorization header if available
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    return new OpenAI({
      apiKey: "", // Replace with actual API key if needed
      baseURL: "https://api-3ujaavqala-uc.a.run.app",
      defaultHeaders: headers,
      dangerouslyAllowBrowser: true // Allow browser usage
    });
  }

  static async sendMessage(
    model: string,
    messages: ChatMessage[],
    onChunk: (content: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    user?: User | null,
    abortController?: AbortController
  ): Promise<void> {

    try {
      // Get Firebase ID token if user is authenticated
      let idToken: string | undefined;
      if (user) {
        try {
          idToken = await user.getIdToken();
        } catch (tokenError) {
          console.warn('Failed to get Firebase ID token:', tokenError);
          // Continue without token - might work for unauthenticated requests
        }
      }

      // Create OpenAI instance with the ID token
      const openai = this.createOpenAIInstance(idToken);

      const completion = await openai.chat.completions.create({
        model,
        messages,
        stream: true
      }, {
        signal: abortController?.signal
      });

      for await (const chunk of completion) {
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