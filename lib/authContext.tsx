"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  signInWithCustomToken 
} from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => void;
  loginWithCustomToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
      setUser({
        uid: 'mock-user-123',
        displayName: 'Mock Developer',
        email: 'developer@example.com',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
      } as any);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = () => {
    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
      setUser({
        uid: 'mock-user-123',
        displayName: 'Mock Developer',
        email: 'developer@example.com',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
      } as any);
      window.location.href = '/dashboard';
      return;
    }

    setLoading(true);
    // Redirect to our backend Google OAuth flow
    // If user is already authenticated but needs to re-consent/link, pass their UID
    const uidParam = auth.currentUser ? `?uid=${auth.currentUser.uid}` : '';
    window.location.href = `/api/auth/google${uidParam}`;
  };

  const loginWithCustomToken = async (token: string) => {
    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await signInWithCustomToken(auth, token);
    } catch (error) {
      console.error('Custom token sign in failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
      setUser(null);
      window.location.href = '/';
      return;
    }

    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // Optional: Clear session data if needed
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, loginWithCustomToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
