import React, { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient, supabase, supabaseConfigError } from '../lib/supabase';
import type { Profile, ProfileUpdateInput } from '../types/database';
import { AuthContext, type DemoUser } from './authContextValue';
import { demoProfileDefaults, getDemoProfile, updateDemoProfile } from '../services/demoTravelData';

type LocalAuthResponse = {
  user: DemoUser | null;
  profile: Profile | null;
};

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
  const authMode = import.meta.env.VITE_DATA_MODE === 'supabase' ? 'supabase' : 'local';
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | DemoUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(authMode === 'local' || Boolean(supabase));
  const [isDemoMode, setIsDemoMode] = useState(() => {
    return localStorage.getItem('demo_mode') === 'true';
  });
  const [demoProfile, setDemoProfile] = useState<Profile>(() => {
    try {
      return getDemoProfile();
    } catch {
      return demoProfileDefaults;
    }
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
    if (authMode === 'local') {
      fetch('/api/auth/session', { credentials: 'include' })
        .then((response) => response.json() as Promise<LocalAuthResponse>)
        .then((data) => {
          setSession(null);
          setUser(data.user);
          setProfile(data.profile);
        })
        .catch((error) => {
          console.error('Error getting local session:', error);
          setSession(null);
          setUser(null);
          setProfile(null);
        })
        .finally(() => setLoading(false));
      return;
    }

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
  }, [authMode, fetchProfile]);

  const signInWithPassword = async (email: string, password: string) => {
    if (authMode !== 'local') {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSession(data.session);
      setUser(data.user);
      if (data.user) await fetchProfile(data.user);
      setIsDemoMode(false);
      return;
    }

    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: 'Could not sign in.' })) as { message?: string };
      throw new Error(payload.message ?? 'Could not sign in.');
    }

    const data = await response.json() as LocalAuthResponse;
    setSession(null);
    setUser(data.user);
    setProfile(data.profile);
    setIsDemoMode(false);
  };

  const signUpWithPassword = async (email: string, password: string, fullName?: string) => {
    if (authMode !== 'local') {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      setSession(data.session);
      setUser(data.user);
      if (data.user) await fetchProfile(data.user);
      setIsDemoMode(false);
      return;
    }

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: 'Could not create account.' })) as { message?: string };
      throw new Error(payload.message ?? 'Could not create account.');
    }

    const data = await response.json() as LocalAuthResponse;
    setSession(null);
    setUser(data.user);
    setProfile(data.profile);
    setIsDemoMode(false);
  };

  const signInWithGoogle = async (redirectPath = '/dashboard') => {
    if (authMode === 'local') {
      throw new Error('Google sign-in is paused for this local prototype. Use email and password.');
    }

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

  const updateProfile = async (input: ProfileUpdateInput): Promise<Profile> => {
    if (isDemoMode) {
      const updated = updateDemoProfile(input);
      setDemoProfile(updated);
      return updated;
    }

    if (authMode === 'local') {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: 'Could not save profile.' })) as { message?: string };
        throw new Error(payload.message ?? 'Could not save profile.');
      }
      const data = await response.json() as { profile: Profile };
      setProfile(data.profile);
      return data.profile;
    }

    throw new Error('Profile editing is not available in remote mode yet.');
  };

  const signOut = async () => {
    if (authMode === 'local') {
      await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
      setSession(null);
      setUser(null);
      setProfile(null);
    } else if (supabase) {
      await supabase.auth.signOut();
    }
    setIsDemoMode(false);
  };

  // Demo Mode Overrides
  const effectiveUser = isDemoMode
    ? { id: 'demo-user-id', email: 'demo@example.com' }
    : user;

  const effectiveProfile = isDemoMode ? demoProfile : profile;

  return (
    <AuthContext.Provider value={{
      session,
      user: effectiveUser,
      profile: effectiveProfile,
      authMode,
      isDemoMode,
      setDemoMode: setIsDemoMode,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
      updateProfile,
      loading,
      configurationError: authMode === 'supabase' ? supabaseConfigError : null
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
