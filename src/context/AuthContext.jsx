import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

function getCachedProfile(userId) {
  try {
    const raw = localStorage.getItem(`barba_profile_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function saveCachedProfile(userId, profile) {
  try {
    if (userId && profile) {
      localStorage.setItem(`barba_profile_${userId}`, JSON.stringify(profile));
    }
  } catch (e) {}
}

function getFallbackProfile(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  const email = (user.email || '').toLowerCase();
  
  let defaultRole = meta.role;
  if (!defaultRole) {
    if (email.includes('admin') || email.includes('barbaconstruct@') || email.includes('luisbarba')) {
      defaultRole = 'admin';
    } else if (email.includes('office') || email.includes('oficina') || email.includes('barbafence')) {
      defaultRole = 'office';
    } else if (email.includes('supervisor')) {
      defaultRole = 'supervisor';
    } else {
      defaultRole = 'admin'; // Safe default for internal system access
    }
  }

  return {
    id: user.id,
    full_name: meta.full_name || user.email?.split('@')[0] || 'Admin',
    role: defaultRole,
    is_active: true,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  // Fetch user profile from database with timeout
  const fetchProfile = useCallback(async (userId, fallback) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

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
      if (data) {
        saveCachedProfile(userId, data);
        return data;
      }
      return fallback;
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

          // 1. Get cached profile or heuristic fallback profile
          const cached = getCachedProfile(currentSession.user.id);
          const fallback = cached || getFallbackProfile(currentSession.user);

          setSession(currentSession);
          setProfile(fallback);
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
    role: profile?.role ?? 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
