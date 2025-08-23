import OpenAI from 'openai';
import { User } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { MessageAttachment } from '../types/chat';

export interface ImageGenerationParams {
  prompt: string;
  model: string;
  size?: string;
  response_format?: 'url' | 'b64_json';
  seed?: number;
  guidance_scale?: number;
  watermark?: boolean;
}

export interface ImageGenerationConfig {
  baseURL: string;
  apiKey: string;
  requiresAuth: boolean;
}

export class ImageGenerationService {
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
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }

  static async downloadAndUploadImage(
    imageUrl: string,
    prompt: string,
    userId: string | null
  ): Promise<MessageAttachment> {
    try {
      // Download the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Create a filename based on prompt and timestamp
      const sanitizedPrompt = prompt.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '_');
      const timestamp = Date.now();
      const filename = `generated_image_${sanitizedPrompt}_${timestamp}.jpg`;

      // Convert blob to File
      const file = new File([blob], filename, { type: 'image/jpeg' });

      // Generate storage path
      const imageId = this.generateImageId();
      const storagePath = this.generateStoragePath(userId, imageId, filename);
      const storageRef = ref(storage, storagePath);

      // Upload to Firebase Storage
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      const attachment: MessageAttachment = {
        id: imageId,
        type: 'image',
        url: downloadUrl,
        gcsPath: storagePath,
        filename: filename,
        size: file.size,
        mimeType: 'image/jpeg'
      };

      return attachment;
    } catch (error) {
      console.error('Error downloading and uploading image:', error);
      throw error;
    }
  }

  private static generateImageId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateStoragePath(userId: string | null, imageId: string, filename: string): string {
    const userFolder = userId || 'anonymous';
    const datePath = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return `generated_images/${userFolder}/${datePath}/${imageId}_${filename}`;
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
}
