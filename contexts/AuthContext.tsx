import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  authLoaded: boolean;
  isLoading: boolean;
  isSignedIn: boolean;
  signOut: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // If no user is logged in, sign in anonymously
      if (!currentUser) {
        try {
          const result = await signInAnonymously(auth);
          setUser(result.user);
        } catch (error) {
          console.error('Error signing in anonymously:', error);
          setUser(null);
        }
      } else {
        setUser(currentUser);
      }
      
      setAuthLoaded(true);
      setIsLoading(false);
    });

    return () => {
      authUnsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      // After sign out, Firebase will automatically trigger onAuthStateChanged
      // which will sign in anonymously again
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInAnonymously = async () => {
    try {
      setIsLoading(true);
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    authLoaded,
    isLoading,
    isSignedIn: user ? !user.isAnonymous : false,
    signOut: handleSignOut,
    signInAnonymously: handleSignInAnonymously,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
