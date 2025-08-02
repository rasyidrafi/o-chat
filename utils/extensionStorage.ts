/**
 * Storage utility that works in both web and extension environments
 * Automatically detects if running in a browser extension and uses appropriate storage API
 */

type StorageValue = string | number | boolean | object;

class ExtensionStorage {
  private isExtension: boolean;

  constructor() {
    // Check if we're running in a browser extension environment
    this.isExtension = typeof browser !== 'undefined' && browser.storage;
  }

  async getItem(key: string): Promise<string | null> {
    if (this.isExtension) {
      try {
        const result = await browser.storage.local.get(key);
        return result[key] || null;
      } catch (error) {
        console.error('Extension storage getItem error:', error);
        return null;
      }
    } else {
      return localStorage.getItem(key);
    }
  }

  async setItem(key: string, value: StorageValue): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (this.isExtension) {
      try {
        await browser.storage.local.set({ [key]: stringValue });
      } catch (error) {
        console.error('Extension storage setItem error:', error);
      }
    } else {
      localStorage.setItem(key, stringValue);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (this.isExtension) {
      try {
        await browser.storage.local.remove(key);
      } catch (error) {
        console.error('Extension storage removeItem error:', error);
      }
    } else {
      localStorage.removeItem(key);
    }
  }

  async getMultiple(keys: string[]): Promise<Record<string, string | null>> {
    if (this.isExtension) {
      try {
        const result = await browser.storage.local.get(keys);
        const output: Record<string, string | null> = {};
        keys.forEach(key => {
          output[key] = result[key] || null;
        });
        return output;
      } catch (error) {
        console.error('Extension storage getMultiple error:', error);
        return {};
      }
    } else {
      const result: Record<string, string | null> = {};
      keys.forEach(key => {
        result[key] = localStorage.getItem(key);
      });
      return result;
    }
  }

  async setMultiple(items: Record<string, StorageValue>): Promise<void> {
    if (this.isExtension) {
      try {
        const stringifiedItems: Record<string, string> = {};
        Object.entries(items).forEach(([key, value]) => {
          stringifiedItems[key] = typeof value === 'string' ? value : JSON.stringify(value);
        });
        await browser.storage.local.set(stringifiedItems);
      } catch (error) {
        console.error('Extension storage setMultiple error:', error);
      }
    } else {
      Object.entries(items).forEach(([key, value]) => {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, stringValue);
      });
    }
  }
}

// Export singleton instance
export const extensionStorage = new ExtensionStorage();