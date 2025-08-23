import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { MessageAttachment } from '../types/chat';

export class ImageUploadService {
  private static generateImageId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private static generateStoragePath(userId: string | null, imageId: string, filename: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const userPath = userId ? `users/${userId}` : 'anonymous';
    const extension = filename.split('.').pop() || 'png';
    return `${userPath}/images/${timestamp}/${imageId}.${extension}`;
  }

  static async uploadImage(
    file: File, 
    userId: string | null
  ): Promise<MessageAttachment> {
    try {
      const imageId = this.generateImageId();
      const storagePath = this.generateStoragePath(userId, imageId, file.name);
      const storageRef = ref(storage, storagePath);

      // Upload the file
      const uploadResult = await uploadBytes(storageRef, file);
      
      // Get the download URL (temporary URL for backend access)
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      const attachment: MessageAttachment = {
        id: imageId,
        type: 'image',
        url: downloadUrl,
        gcsPath: storagePath,
        filename: file.name,
        size: file.size,
        mimeType: file.type
      };

      return attachment;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  static async getImageUrl(gcsPath: string): Promise<string> {
    try {
      const storageRef = ref(storage, gcsPath);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting image URL:', error);
      throw new Error('Failed to get image URL');
    }
  }

  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.'
      };
    }

    // Check file size (max 10MB)
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      return {
        isValid: false,
        error: 'File size too large. Please upload images smaller than 10MB.'
      };
    }

    return { isValid: true };
  }

  static createImageDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
