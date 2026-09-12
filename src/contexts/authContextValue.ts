import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types/database';

export type DemoUser = {
  id: string;
  email: string;
};

export interface AuthContextType {
  session: Session | null;
  user: User | DemoUser | null;
  profile: Profile | null;
  isDemoMode: boolean;
  setDemoMode: (value: boolean) => void;
  signInWithGoogle: (redirectPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  configurationError: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
