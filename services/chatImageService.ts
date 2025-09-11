import { MessageAttachment } from '../types/chat';
import { ImageUploadService } from './imageUploadService';

export class ChatImageService {
  /**
   * Downloads and stores a generated image from a chat response
   * First tries to upload to Firebase Storage, falls back to direct URL if failed
   */
  static async downloadAndStoreImage(
    imageUrl: string,
    prompt: string,
    userId: string | null
  ): Promise<MessageAttachment> {
    try {
      // Create a filename based on prompt and timestamp
      const sanitizedPrompt = prompt.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '_');
      const timestamp = Date.now();
      const filename = `chat_image_${sanitizedPrompt}_${timestamp}.jpg`;

      // Try to download and upload to Firebase Storage
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }

        const blob = await response.blob();
        const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

        // Upload to Firebase Storage
        const attachment = await ImageUploadService.uploadImage(file, userId, filename);
        
        return attachment;
      } catch (uploadError) {
        console.warn('⚠️ Failed to upload chat image to Firebase Storage, using direct URL:', uploadError);
        
        // Fallback: create attachment with direct URL
        return {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type: 'image',
          url: imageUrl,
          filename: filename,
          size: 0, // Unknown size for direct URLs
          mimeType: 'image/jpeg',
          isDirectUrl: true // Mark as direct URL for fallback handling
        };
      }
    } catch (error) {
      console.error('❌ Error processing chat image:', error);
      
      // Last resort fallback: direct URL attachment
      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'image',
        url: imageUrl,
        filename: `chat_image_${Date.now()}.jpg`,
        size: 0,
        mimeType: 'image/jpeg',
        isDirectUrl: true
      };
    }
  }

  /**
   * Processes multiple images from a chat response
   */
  static async processMultipleImages(
    imageUrls: string[],
    prompt: string,
    userId: string | null
  ): Promise<MessageAttachment[]> {
    const attachments: MessageAttachment[] = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const indexedPrompt = imageUrls.length > 1 ? `${prompt}_${i + 1}` : prompt;
      
      try {
        const attachment = await this.downloadAndStoreImage(imageUrl, indexedPrompt, userId);
        attachments.push(attachment);
      } catch (error) {
        console.error(`Failed to process image ${i + 1}:`, error);
        // Continue with other images even if one fails
      }
    }
    
    return attachments;
  }
}
