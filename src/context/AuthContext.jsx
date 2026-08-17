import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

function getFallbackProfile(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    full_name: meta.full_name || user.email?.split('@')[0] || 'Usuario',
    role: meta.role || 'salesperson',
    is_active: true,
  };
}

function getInitialSession() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.user) return parsed;
        }
      }
    }
  } catch {}
  return null;
}

export function AuthProvider({ children }) {
  const initialSession = getInitialSession();
  const [session, setSession] = useState(initialSession);
  const [profile, setProfile] = useState(() => initialSession ? getFallbackProfile(initialSession.user) : null);
  const [loading, setLoading] = useState(!initialSession);
  const isMountedRef = useRef(true);

  // Fetch user profile from database with a fast timeout (2.5s)
  const fetchProfile = useCallback(async (userId, fallback) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .abortSignal(controller.signal);

      clearTimeout(timeout);

      if (error) {
        console.warn('Profile fetch warning (using fallback):', error.message);
        return fallback;
      }
      return data || fallback;
    } catch (err) {
      console.warn('Profile fetch timeout/error (using fallback):', err.message);
      return fallback;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Safety timeout: ensure loading is ALWAYS dismissed after at most 1.5 seconds
    const safetyTimer = setTimeout(() => {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }, 1500);

    // Subscribe to auth events (onAuthStateChange fires INITIAL_SESSION on modern Supabase)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMountedRef.current) return;

        try {
          if (!currentSession?.user) {
            setSession(null);
            setProfile(null);
            setLoading(false);
            return;
          }

          // Check for expired session
          if (currentSession.expires_at && currentSession.expires_at * 1000 < Date.now()) {
            console.warn('Expired session detected, clearing...');
            await supabase.auth.signOut();
            setSession(null);
            setProfile(null);
            setLoading(false);
            return;
          }

          // 1. Immediately set session and optimistic fallback profile so UI doesn't hang
          const fallback = getFallbackProfile(currentSession.user);
          setSession(currentSession);
          setProfile((prev) => prev || fallback);
          setLoading(false);

          // 2. Fetch full DB profile in background
          const dbProfile = await fetchProfile(currentSession.user.id, fallback);
          if (isMountedRef.current && dbProfile) {
            setProfile(dbProfile);
          }
        } catch (err) {
          console.error('Auth state change error:', err);
          if (isMountedRef.current) setLoading(false);
        }
      }
    );

    return () => {
      isMountedRef.current = false;
      clearTimeout(safetyTimer);
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setSession(null);
      setProfile(null);
    }
    return { error };
  };

  const isAdmin = profile?.role === 'admin';
  const isSalesperson = profile?.role === 'salesperson';
  const isSupervisor = profile?.role === 'supervisor';
  const isOffice = profile?.role === 'office';

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isSalesperson,
    isSupervisor,
    isOffice,
    role: profile?.role ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
