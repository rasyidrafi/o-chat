import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { ChatConversation, ChatMessage } from '../types/chat';
import { User } from 'firebase/auth';

export class ChatStorageService {
  // Local storage keys
  private static readonly CONVERSATIONS_KEY = 'chat_conversations';
  private static readonly MESSAGES_KEY_PREFIX = 'chat_messages_';

  // Save conversation to localStorage
  private static saveConversationToLocal(conversation: ChatConversation): void {
    try {
      const conversations = this.getConversationsFromLocal();
      const existingIndex = conversations.findIndex(c => c.id === conversation.id);
      
      if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
      } else {
        conversations.unshift(conversation);
      }
      
      localStorage.setItem(this.CONVERSATIONS_KEY, JSON.stringify(conversations));
      
      // Save messages separately
      localStorage.setItem(
        `${this.MESSAGES_KEY_PREFIX}${conversation.id}`, 
        JSON.stringify(conversation.messages)
      );
    } catch (error) {
      console.error('Error saving conversation to localStorage:', error);
    }
  }

  // Get conversations from localStorage
  private static getConversationsFromLocal(): ChatConversation[] {
    try {
      const stored = localStorage.getItem(this.CONVERSATIONS_KEY);
      if (!stored) return [];
      
      const conversations = JSON.parse(stored);
      return conversations.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: [] // Messages loaded separately
      }));
    } catch (error) {
      console.error('Error loading conversations from localStorage:', error);
      return [];
    }
  }

  // Get messages for a conversation from localStorage
  private static getMessagesFromLocal(conversationId: string): ChatMessage[] {
    try {
      const stored = localStorage.getItem(`${this.MESSAGES_KEY_PREFIX}${conversationId}`);
      if (!stored) return [];
      
      const messages = JSON.parse(stored);
      return messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
      return [];
    }
  }

  // Delete conversation from localStorage
  private static deleteConversationFromLocal(conversationId: string): void {
    try {
      const conversations = this.getConversationsFromLocal();
      const filtered = conversations.filter(c => c.id !== conversationId);
      localStorage.setItem(this.CONVERSATIONS_KEY, JSON.stringify(filtered));
      localStorage.removeItem(`${this.MESSAGES_KEY_PREFIX}${conversationId}`);
    } catch (error) {
      console.error('Error deleting conversation from localStorage:', error);
    }
  }

  // Save conversation to Firestore
  private static async saveConversationToFirestore(conversation: ChatConversation, userId: string): Promise<void> {
    try {
      const chatRef = doc(db, 'chats', userId);
      const conversationRef = doc(collection(chatRef, 'conversations'), conversation.id);
      
      // Save conversation metadata
      await setDoc(conversationRef, {
        id: conversation.id,
        title: conversation.title,
        model: conversation.model,
        createdAt: Timestamp.fromDate(conversation.createdAt),
        updatedAt: Timestamp.fromDate(conversation.updatedAt),
        messageCount: conversation.messages.length
      });

      // Save messages in batch
      const batch = writeBatch(db);
      const messagesRef = collection(conversationRef, 'messages');
      
      conversation.messages.forEach(message => {
        const messageRef = doc(messagesRef, message.id);
        batch.set(messageRef, {
          id: message.id,
          role: message.role,
          content: message.content,
          timestamp: Timestamp.fromDate(message.timestamp),
          model: message.model || null,
          isError: message.isError || false
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error saving conversation to Firestore:', error);
      throw error;
    }
  }

  // Get conversations from Firestore
  private static async getConversationsFromFirestore(userId: string): Promise<ChatConversation[]> {
    try {
      const chatRef = doc(db, 'chats', userId);
      const conversationsRef = collection(chatRef, 'conversations');
      const q = query(conversationsRef, orderBy('updatedAt', 'desc'));
      
      const snapshot = await getDocs(q);
      const conversations: ChatConversation[] = [];
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const messages = await this.getMessagesFromFirestore(userId, data.id);
        
        conversations.push({
          id: data.id,
          title: data.title,
          model: data.model,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          messages
        });
      }
      
      return conversations;
    } catch (error) {
      console.error('Error loading conversations from Firestore:', error);
      return [];
    }
  }

  // Get messages from Firestore
  private static async getMessagesFromFirestore(userId: string, conversationId: string): Promise<ChatMessage[]> {
    try {
      const chatRef = doc(db, 'chats', userId);
      const conversationRef = doc(collection(chatRef, 'conversations'), conversationId);
      const messagesRef = collection(conversationRef, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      
      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp.toDate(),
          model: data.model,
          isError: data.isError || false
        };
      });
      
      // Additional sort to ensure proper ordering, especially for messages with similar timestamps
      return messages.sort((a, b) => {
        const timeDiff = a.timestamp.getTime() - b.timestamp.getTime();
        if (timeDiff !== 0) return timeDiff;
        
        // If timestamps are identical, ensure user messages come before assistant messages
        if (a.role === 'user' && b.role === 'assistant') return -1;
        if (a.role === 'assistant' && b.role === 'user') return 1;
        
        return 0;
      });
    } catch (error) {
      console.error('Error loading messages from Firestore:', error);
      return [];
    }
  }

  // Delete conversation from Firestore
  private static async deleteConversationFromFirestore(userId: string, conversationId: string): Promise<void> {
    try {
      const chatRef = doc(db, 'chats', userId);
      const conversationRef = doc(collection(chatRef, 'conversations'), conversationId);
      
      // Delete all messages first
      const messagesRef = collection(conversationRef, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      
      const batch = writeBatch(db);
      messagesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete the conversation document
      batch.delete(conversationRef);
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting conversation from Firestore:', error);
      throw error;
    }
  }

  // Migrate localStorage data to Firestore
  private static async migrateLocalDataToFirestore(userId: string): Promise<void> {
    try {
      console.log('Starting migration from localStorage to Firestore...');
      const localConversations = this.getConversationsFromLocal();
      console.log(`Found ${localConversations.length} conversations in localStorage`);
      
      for (const conversation of localConversations) {
        // Load messages for this conversation
        const messages = this.getMessagesFromLocal(conversation.id);
        const fullConversation = { ...conversation, messages };
        console.log(`Migrating conversation: ${conversation.title} with ${messages.length} messages`);
        
        await this.saveConversationToFirestore(fullConversation, userId);
      }
      
      console.log('Migration completed successfully');
      // Clear localStorage after successful migration
      this.clearLocalStorage();
      console.log('localStorage cleared');
    } catch (error) {
      console.error('Error migrating data to Firestore:', error);
      throw error;
    }
  }

  // Clear localStorage
  private static clearLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key === this.CONVERSATIONS_KEY || key.startsWith(this.MESSAGES_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  // Public API methods

  // Save conversation (automatically chooses storage method)
  static async saveConversation(conversation: ChatConversation, user?: User | null): Promise<void> {
    if (user) {
      await this.saveConversationToFirestore(conversation, user.uid);
    } else {
      this.saveConversationToLocal(conversation);
    }
  }

  // Load conversations (automatically chooses storage method)
  static async loadConversations(user?: User | null): Promise<ChatConversation[]> {
    if (user) {
      return await this.getConversationsFromFirestore(user.uid);
    } else {
      const conversations = this.getConversationsFromLocal();
      // Load messages for each conversation
      return conversations.map(conv => ({
        ...conv,
        messages: this.getMessagesFromLocal(conv.id)
      }));
    }
  }

  // Delete conversation (automatically chooses storage method)
  static async deleteConversation(conversationId: string, user?: User | null): Promise<void> {
    if (user) {
      await this.deleteConversationFromFirestore(user.uid, conversationId);
    } else {
      this.deleteConversationFromLocal(conversationId);
    }
  }

  // Handle user login - migrate data if needed
  static async handleUserLogin(user: User): Promise<void> {
    try {
      console.log('Handling user login, checking for migration...');
      // Check if user has local data to migrate
      const localConversations = this.getConversationsFromLocal();
      console.log(`Found ${localConversations.length} local conversations`);
      
      if (localConversations.length > 0) {
        // Check if user already has data in Firestore
        const firestoreConversations = await this.getConversationsFromFirestore(user.uid);
        console.log(`Found ${firestoreConversations.length} Firestore conversations`);
        
        if (firestoreConversations.length === 0) {
          // Migrate local data to Firestore
          console.log('No Firestore data found, migrating localStorage data...');
          await this.migrateLocalDataToFirestore(user.uid);
        } else {
          // User has both local and cloud data - merge them
          console.log('Both local and cloud data found, merging...');
          await this.migrateLocalDataToFirestore(user.uid);
        }
      } else {
        console.log('No local data to migrate');
      }
    } catch (error) {
      console.error('Error handling user login:', error);
    }
  }

  // Handle user logout - optionally clear Firestore cache
  static handleUserLogout(): void {
    // Could implement cache clearing here if needed
  }

  // Subscribe to conversation changes (Firestore only)
  static subscribeToConversations(
    user: User,
    callback: (conversations: ChatConversation[]) => void
  ): () => void {
    const chatRef = doc(db, 'chats', user.uid);
    const conversationsRef = collection(chatRef, 'conversations');
    const q = query(conversationsRef, orderBy('updatedAt', 'desc'));
    
    return onSnapshot(q, async (snapshot) => {
      const conversations: ChatConversation[] = [];
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const messages = await this.getMessagesFromFirestore(user.uid, data.id);
        
        conversations.push({
          id: data.id,
          title: data.title,
          model: data.model,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          messages
        });
      }
      
      callback(conversations);
    });
  }
}