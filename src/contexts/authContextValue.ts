import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile, ProfileUpdateInput } from '../types/database';

export type DemoUser = {
  id: string;
  email: string;
};

export interface AuthContextType {
  session: Session | null;
  user: User | DemoUser | null;
  profile: Profile | null;
  authMode: 'local' | 'supabase';
  isDemoMode: boolean;
  setDemoMode: (value: boolean) => void;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string, fullName?: string) => Promise<void>;
  signInWithGoogle: (redirectPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (input: ProfileUpdateInput) => Promise<Profile>;
  loading: boolean;
  configurationError: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
