import OpenAI from 'openai';
import { User } from 'firebase/auth';
import { MessageAttachment } from '../types/chat';
import { ImageUploadService } from './imageUploadService';

export interface ImageGenerationParams {
  prompt: string;
  model: string;
  size?: string;
  response_format?: 'url' | 'b64_json';
  seed?: number;
  guidance_scale?: number;
  watermark?: boolean;
  image?: string;
}

export interface ImageGenerationConfig {
  baseURL: string;
  apiKey: string;
  requiresAuth: boolean;
}

export class ImageGenerationService {
  private static createOpenAIInstance(idToken?: string, baseURL?: string, apiKey?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Firebase ID token as Authorization header if available
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    return new OpenAI({
      apiKey: apiKey || "",
      baseURL: baseURL || "",
      defaultHeaders: headers,
      dangerouslyAllowBrowser: true
    });
  }

  private static getProviderConfig(source: string, providerId?: string): ImageGenerationConfig {
    if (source === 'system') {
      return {
        baseURL: import.meta.env.VITE_FIREBASE_FUNC_BASE_API,
        apiKey: "",
        requiresAuth: true
      };
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

    throw new Error('No valid provider configuration found for image generation');
  }

  static async generateImage(
    params: ImageGenerationParams,
    source: string = 'system',
    providerId?: string,
    user?: User | null
  ): Promise<string> {
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

      // Prepare image generation parameters
      const imageParams: any = {
        model: params.model,
        prompt: params.prompt,
        size: params.size || "1024x1024",
        response_format: "url",
      };

      // Add optional parameters if provided
      if (params.seed !== undefined && params.seed !== -1) {
        imageParams.seed = params.seed;
      }
      if (params.guidance_scale !== undefined) {
        imageParams.guidance_scale = params.guidance_scale;
      }
      if (params.watermark !== undefined) {
        imageParams.watermark = params.watermark;
      }
      if (params.image) {
        imageParams.image = params.image;
      }

      const response = await openai.images.generate(imageParams);

      if (!response.data || response.data.length === 0) {
        throw new Error('No image generated');
      }

      const imageData = response.data[0];

      if (params.response_format === 'b64_json' && imageData.b64_json) {
        return imageData.b64_json;
      } else if (imageData.url) {
        return imageData.url;
      } else {
        throw new Error('No image data received');
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      throw error;
    }
  }

  static async downloadAndUploadImage(
    imageUrl: string,
    prompt: string,
    userId: string | null,
    response_format?: 'url' | 'b64_json'
  ): Promise<MessageAttachment> {
    if (!response_format) response_format = 'url';

    // Create a filename based on prompt and timestamp
    const sanitizedPrompt = prompt.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.now();
    const filename = `generated_image_${sanitizedPrompt}_${timestamp}.jpg`;

    if (response_format === 'b64_json') {
      try {
        // Handle base64 image data
        const base64ImageData = imageUrl; // ex: /9j/4QBjRXhpZgAATU0AKgAAAAgAAQE7AAIAAABBAAAAGgAAAABhNmIyOGU5M2NmMGIyMDczNmM5ZTBkOTM4NGNjNjk4NDY2ZTcxOThjZmU2ZDRiZTdhNTlkNTAzZDY4NzY3YTJmAP/bAEMAAgEBAQEBAgEBAQICAgICBAMCAgICBQQEAwQGBQYGBgUGBgYHCQgGBwkH...

        // Convert base64 to proper data URI format if needed
        const dataUri = base64ImageData.startsWith('data:') 
          ? base64ImageData 
          : `data:image/jpeg;base64,${base64ImageData}`;

        const attachment = await ImageUploadService.uploadImage(dataUri, userId, filename);

        return attachment;
      } catch (error) {
        console.error('Error handling base64 image:', error);
        throw error;
      }
    } else {
      try {
        // Download the image
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }

        const blob = await response.blob();

        // Convert blob to File
        const file = new File([blob], filename, { type: 'image/jpeg' });

        // Upload to Firebase Storage
        const attachment = await ImageUploadService.uploadImage(file, userId, filename);

        return attachment;
      } catch (error) {
        console.warn('Failed to download and upload image, falling back to direct URL storage:', error);

        // Fallback: create attachment with direct URL
        return {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type: 'image',
          url: imageUrl,
          filename: `generated_image_${Date.now()}.jpeg`,
          size: 0, // Unknown size for direct URLs
          mimeType: 'image/jpeg',
          isDirectUrl: true // Mark as direct URL
        };
      }
    }
  }


  static getImageSizeOptions(): { label: string; value: string }[] {
    return [
      { label: "1024x1024 (1:1)", value: "1024x1024" },
      { label: "864x1152 (3:4)", value: "864x1152" },
      { label: "1152x864 (4:3)", value: "1152x864" },
      { label: "1280x720 (16:9)", value: "1280x720" },
      { label: "720x1280 (9:16)", value: "720x1280" },
      { label: "832x1248 (2:3)", value: "832x1248" },
      { label: "1248x832 (3:2)", value: "1248x832" },
      { label: "1512x648 (21:9)", value: "1512x648" },
    ];
  }

  static calculatePlaceholderDimensions(_size: string, maxWidth: number = 320): { width: number; height: number; aspectRatio: number } {
    // Always use 4:3 aspect ratio for consistent loading placeholders
    const aspectRatio = 4 / 3;
    const width = maxWidth;
    const height = Math.round(width / aspectRatio);

    return {
      width,
      height,
      aspectRatio
    };
  }
}
