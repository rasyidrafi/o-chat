import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot, 
  getCountFromServer,
  collectionGroup,
  where,
  Timestamp,
  writeBatch,
  limit as firestoreLimit,
  startAfter as firestoreStartAfter
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
      const parsedMessages = messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      
      // Ensure consistent sorting by timestamp to prevent duplicate keys
      return parsedMessages.sort((a: ChatMessage, b: ChatMessage) => 
        a.timestamp.getTime() - b.timestamp.getTime()
      );
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
        source: conversation.source || 'server', // Default to server for existing conversations
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
          modelName: message.modelName || null,
          isError: message.isError || false,
          source: message.source || 'server',
          userId: userId,
          reasoning: message.reasoning || null,
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
        
        // @ts-ignore
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
          modelName: data.modelName,
          isError: data.isError || false,
          source: data.source || 'server',
          reasoning: data.reasoning
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
      const localConversations = this.getConversationsFromLocal();
      
      for (const conversation of localConversations) {
        // Load messages for this conversation
        const messages = this.getMessagesFromLocal(conversation.id);
        const fullConversation = { ...conversation, messages };
        await this.saveConversationToFirestore(fullConversation, userId);
      }
      
      // Clear localStorage after successful migration
      this.clearLocalStorage();
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

  // Load conversations with pagination
  static async loadConversationsPaginated(user?: User | null, limit: number = 20, lastDoc?: any): Promise<{ conversations: ChatConversation[], hasMore: boolean, lastDoc: any }> {
    if (user) {
      return await this.getConversationsFromFirestorePaginated(user.uid, limit, lastDoc);
    } else {
      const conversations = this.getConversationsFromLocal();
      // For local storage, we'll simulate pagination
      const startIndex = lastDoc ? lastDoc.index + 1 : 0;
      const endIndex = startIndex + limit;
      const paginatedConversations = conversations.slice(startIndex, endIndex);
      
      return {
        conversations: paginatedConversations.map(conv => ({
          ...conv,
          messages: [] // Don't load messages initially
        })),
        hasMore: endIndex < conversations.length,
        lastDoc: paginatedConversations.length > 0 ? { index: endIndex - 1 } : null
      };
    }
  }

  // Get conversations from Firestore with pagination
  private static async getConversationsFromFirestorePaginated(userId: string, limit: number, lastDoc?: any): Promise<{ conversations: ChatConversation[], hasMore: boolean, lastDoc: any }> {
    try {
      const chatRef = doc(db, 'chats', userId);
      const conversationsRef = collection(chatRef, 'conversations');
      
      let q = query(conversationsRef, orderBy('updatedAt', 'desc'), firestoreLimit(limit));
      
      if (lastDoc) {
        q = query(conversationsRef, orderBy('updatedAt', 'desc'), firestoreStartAfter(lastDoc), firestoreLimit(limit));
      }
      
      const snapshot = await getDocs(q);
      const conversations: ChatConversation[] = [];
      
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        conversations.push({
          id: data.id,
          title: data.title,
          model: data.model,
          source: data.source || 'server',
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          messages: [] // Don't load messages initially
        });
      });
      
      return {
        conversations,
        hasMore: snapshot.docs.length === limit,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
      };
    } catch (error) {
      console.error('Error loading conversations from Firestore:', error);
      return { conversations: [], hasMore: false, lastDoc: null };
    }
  }

  // Load messages for a specific conversation with pagination
  static async loadMessagesPaginated(conversationId: string, user?: User | null, limit: number = 30, lastDoc?: any): Promise<{ messages: ChatMessage[], hasMore: boolean, lastDoc: any }> {
    if (user) {
      return await this.getMessagesFromFirestorePaginated(user.uid, conversationId, limit, lastDoc);
    } else {
      const allMessages = this.getMessagesFromLocal(conversationId);
      
      if (!lastDoc) {
        // First load: get the latest messages
        const latestMessages = allMessages.slice(-limit);
        return {
          messages: latestMessages,
          hasMore: allMessages.length > limit,
          lastDoc: latestMessages.length > 0 ? { 
            timestamp: latestMessages[0].timestamp.getTime(),
            index: allMessages.length - latestMessages.length
          } : null
        };
      } else {
        // Load older messages before the lastDoc timestamp
        const lastTimestamp = lastDoc.timestamp;
        const olderMessages = allMessages.filter(msg => 
          msg.timestamp.getTime() < lastTimestamp
        );
        
        // Get the latest 'limit' number of older messages
        const paginatedMessages = olderMessages.slice(-limit);
        
        return {
          messages: paginatedMessages,
          hasMore: olderMessages.length > limit,
          lastDoc: paginatedMessages.length > 0 ? {
            timestamp: paginatedMessages[0].timestamp.getTime(),
            index: lastDoc.index - paginatedMessages.length
          } : null
        };
      }
    }
  }

  // Get messages from Firestore with pagination (latest first)
  private static async getMessagesFromFirestorePaginated(userId: string, conversationId: string, limit: number, lastDoc?: any): Promise<{ messages: ChatMessage[], hasMore: boolean, lastDoc: any }> {
    try {
      const chatRef = doc(db, 'chats', userId);
      const conversationRef = doc(collection(chatRef, 'conversations'), conversationId);
      const messagesRef = collection(conversationRef, 'messages');
      
      let q = query(messagesRef, orderBy('timestamp', 'desc'), firestoreLimit(limit));
      
      if (lastDoc) {
        q = query(messagesRef, orderBy('timestamp', 'desc'), firestoreStartAfter(lastDoc), firestoreLimit(limit));
      }
      
      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp.toDate(),
          model: data.model,
          modelName: data.modelName,
          isError: data.isError || false,
          source: data.source || 'server',
          reasoning: data.reasoning
        };
      });
      
      // Reverse to show oldest first in UI
      messages.reverse();
      
      return {
        messages,
        hasMore: snapshot.docs.length === limit,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
      };
    } catch (error) {
      console.error('Error loading messages from Firestore:', error);
      return { messages: [], hasMore: false, lastDoc: null };
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
      // Check if user has local data to migrate
      const localConversations = this.getConversationsFromLocal();
      
      if (localConversations.length > 0) {
        // Check if user already has data in Firestore
        const firestoreConversations = await this.getConversationsFromFirestore(user.uid);
        
        if (firestoreConversations.length === 0) {
          // Migrate local data to Firestore
          await this.migrateLocalDataToFirestore(user.uid);
        } else {
          // User has both local and cloud data - merge them
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
          source: data.source || 'server', // Default to server for existing conversations
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          messages
        });
      }
      
      callback(conversations);
    });
  }

  // Get conversation counts by source
  static async getConversationCounts(userId: string): Promise<{ server: number; byok: number; total: number }> {
    try {
      const chatRef = doc(db, 'chats', userId);
      const conversationsRef = collection(chatRef, 'conversations');
      
      // Get total count
      const totalSnapshot = await getCountFromServer(conversationsRef);
      const total = totalSnapshot.data().count;
      
      // Get server conversations count
      const serverQuery = query(conversationsRef, where('source', '==', 'server'));
      const serverSnapshot = await getCountFromServer(serverQuery);
      const server = serverSnapshot.data().count;
      
      // Get byok conversations count
      const byokQuery = query(conversationsRef, where('source', '==', 'byok'));
      const byokSnapshot = await getCountFromServer(byokQuery);
      const byok = byokSnapshot.data().count;
      
      return { server, byok, total };
    } catch (error) {
      console.error('Error getting conversation counts:', error);
      return { server: 0, byok: 0, total: 0 };
    }
  }

  // Get message counts by conversation source
  static async getMessageCounts(userId: string): Promise<{ server: number; byok: number }> {
    try {
      const chatRef = doc(db, 'chats', userId);
      const conversationsRef = collection(chatRef, 'conversations');
      
      // Get server conversations
      const serverQuery = query(conversationsRef, where('source', '==', 'server'));
      const serverConversations = await getDocs(serverQuery);
      
      // Get byok conversations  
      const byokQuery = query(conversationsRef, where('source', '==', 'byok'));
      const byokConversations = await getDocs(byokQuery);
      
      let serverMessageCount = 0;
      let byokMessageCount = 0;
      
      // Count messages in server conversations
      for (const conversationDoc of serverConversations.docs) {
        const messagesRef = collection(conversationDoc.ref, 'messages');
        const userMessagesQuery = query(messagesRef, where('role', '==', 'user'));
        const userMessagesSnapshot = await getCountFromServer(userMessagesQuery);
        serverMessageCount += userMessagesSnapshot.data().count;
      }
      
      // Count messages in byok conversations
      for (const conversationDoc of byokConversations.docs) {
        const messagesRef = collection(conversationDoc.ref, 'messages');
        const userMessagesQuery = query(messagesRef, where('role', '==', 'user'));
        const userMessagesSnapshot = await getCountFromServer(userMessagesQuery);
        byokMessageCount += userMessagesSnapshot.data().count;
      }
      
      return { server: serverMessageCount, byok: byokMessageCount };
    } catch (error) {
      console.error('Error getting message counts:', error);
      return { server: 0, byok: 0 };
    }
  }

  // Get user chat statistics using collection group queries
  static async getUserChatStats(userId: string): Promise<{ totalConversations: number; totalMessages: number; serverMessages: number; byokMessages: number }> {
    try {
      const [conversationsCount, allMessagesCount, serverMessagesCount, byokMessagesCount] = 
        await Promise.all([
          getCountFromServer(collection(db, `chats/${userId}/conversations`)),
          getCountFromServer(query(
            collectionGroup(db, 'messages'), 
            where('userId', '==', userId)
          )),
          getCountFromServer(query(
            collectionGroup(db, 'messages'), 
            where('userId', '==', userId),
            where('source', '==', 'server')
          )),
          getCountFromServer(query(
            collectionGroup(db, 'messages'), 
            where('userId', '==', userId),
            where('source', '==', 'byok')
          ))
        ]);

      return {
        totalConversations: conversationsCount.data().count,
        totalMessages: allMessagesCount.data().count,
        serverMessages: serverMessagesCount.data().count,
        byokMessages: byokMessagesCount.data().count
      };
      
    } catch (error) {
      console.error('Error getting user chat stats:', error);
      throw error;
    }
  }
}