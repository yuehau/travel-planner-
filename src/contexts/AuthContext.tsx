import React, { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient, supabase, supabaseConfigError } from '../lib/supabase';
import type { Profile } from '../types/database';
import { AuthContext, type DemoUser } from './authContextValue';

const getPublicAppUrl = () => {
  const configuredUrl = import.meta.env.VITE_APP_URL;
  const fallbackUrl = window.location.origin;
  const appUrl = configuredUrl || fallbackUrl;

  return appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
};

const getUserProfile = (user: User): Profile => ({
  id: user.id,
  full_name:
    typeof user.user_metadata.full_name === 'string'
      ? user.user_metadata.full_name
      : typeof user.user_metadata.name === 'string'
        ? user.user_metadata.name
        : user.email ?? 'Traveler',
  avatar_url: typeof user.user_metadata.avatar_url === 'string' ? user.user_metadata.avatar_url : null,
  updated_at: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | DemoUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [isDemoMode, setIsDemoMode] = useState(() => {
    return localStorage.getItem('demo_mode') === 'true';
  });

  const fetchProfile = React.useCallback(async (authUser: User) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      setProfile(getUserProfile(authUser));
      return;
    }

    if (data) {
      setProfile(data);
    } else {
      setProfile(getUserProfile(authUser));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('demo_mode', String(isDemoMode));
  }, [isDemoMode]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user);
      })
      .catch((error) => {
        console.error('Error getting session:', error);
      })
      .finally(() => {
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signInWithGoogle = async (redirectPath = '/dashboard') => {
    const client = getSupabaseClient();
    const nextPath = redirectPath.startsWith('/') ? redirectPath : '/dashboard';
    setIsDemoMode(false);

    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getPublicAppUrl()}${nextPath}`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsDemoMode(false);
  };

  // Demo Mode Overrides
  const effectiveUser = isDemoMode
    ? { id: 'demo-user-id', email: 'demo@example.com' }
    : user;

  const effectiveProfile = isDemoMode
    ? {
        id: 'demo-user-id',
        full_name: 'Demo Traveler',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        updated_at: null,
      }
    : profile;

  return (
    <AuthContext.Provider value={{
      session,
      user: effectiveUser,
      profile: effectiveProfile,
      isDemoMode,
      setDemoMode: setIsDemoMode,
      signInWithGoogle,
      signOut,
      loading,
      configurationError: supabaseConfigError
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
