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

    // 1. Immediate initial check using getSession
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!isMountedRef.current) return;
      if (initialSession?.user) {
        const cached = getCachedProfile(initialSession.user.id);
        const fallback = cached || getFallbackProfile(initialSession.user);
        setSession(initialSession);
        setProfile(fallback);
        setLoading(false);

        // Fetch DB profile in background
        fetchProfile(initialSession.user.id, fallback).then(dbProfile => {
          if (isMountedRef.current && dbProfile) {
            setProfile(dbProfile);
          }
        });
      } else {
        setSession(null);
        setProfile(null);
        setLoading(false);
      }
    }).catch(err => {
      console.warn('[Auth] getSession error:', err);
      if (isMountedRef.current) setLoading(false);
    });

    // 2. Subscribe to auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMountedRef.current) return;

        try {
          if (event === 'SIGNED_OUT' || !currentSession?.user) {
            setSession(null);
            setProfile(null);
            setLoading(false);
            return;
          }

          const cached = getCachedProfile(currentSession.user.id);
          const fallback = cached || getFallbackProfile(currentSession.user);

          setSession(currentSession);
          setProfile(fallback);
          setLoading(false);

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
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('SignOut server call warning:', err);
    } finally {
      try {
        localStorage.removeItem('barba-crm-auth-token');
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('barba_profile_')) localStorage.removeItem(k);
        });
      } catch (e) {}
      setSession(null);
      setProfile(null);
      window.location.href = '/login';
    }
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
