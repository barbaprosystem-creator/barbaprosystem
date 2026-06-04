import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from profiles table with timeout
  const fetchProfile = useCallback(async (userId) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .abortSignal(controller.signal);

      clearTimeout(timeout);

      if (error) {
        console.error('Error fetching profile:', error.message);
        // Check for token invalidation / auth errors
        if (error.status === 401 || error.message?.includes('JWT') || error.message?.includes('invalid') || error.code === 'PGRST301') {
          return { isAuthError: true };
        }
        return null;
      }
      return data;
    } catch (err) {
      console.error('Profile fetch timeout/error:', err.message);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // STEP 1: Get the initial session immediately from Supabase's own cache.
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return;
      
      try {
        if (s?.user) {
          // Check if session is expired
          const isExpired = s.expires_at ? s.expires_at * 1000 < Date.now() : false;
          if (isExpired) {
            console.warn('Cached session is expired, signing out to clear cache...');
            await supabase.auth.signOut();
            setSession(null);
            setProfile(null);
            return;
          }

          const p = await fetchProfile(s.user.id);
          if (!mounted) return;

          if (p?.isAuthError) {
            console.warn('Auth error fetching initial profile, signing out to clear cache...');
            await supabase.auth.signOut();
            setSession(null);
            setProfile(null);
            return;
          }

          setSession(s);
          if (p) {
            setProfile(p);
          } else {
            const meta = s.user.user_metadata || {};
            setProfile({
              id: s.user.id,
              full_name: meta.full_name || s.user.email,
              role: meta.role || 'salesperson',
              is_active: true,
            });
          }
        } else {
          setSession(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('getSession process error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }).catch((err) => {
      console.error('getSession error:', err);
      if (mounted) setLoading(false);
    });

    // STEP 2: Subscribe to auth state changes (login, logout, token refresh).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        if (!mounted) return;

        try {
          if (!s?.user) {
            setSession(null);
            setProfile(null);
            return;
          }

          if (event === 'SIGNED_OUT') {
            setSession(null);
            setProfile(null);
            return;
          }

          const p = await fetchProfile(s.user.id);
          if (!mounted) return;

          if (p?.isAuthError) {
            console.warn('Auth error on state change, signing out to clear cache...');
            await supabase.auth.signOut();
            setSession(null);
            setProfile(null);
            return;
          }

          setSession(s);
          const fallback = (() => {
            const meta = s.user.user_metadata || {};
            return {
              id: s.user.id,
              full_name: meta.full_name || s.user.email,
              role: meta.role || 'salesperson',
              is_active: true,
            };
          })();

          setProfile(p || fallback);
        } catch (err) {
          console.error('onAuthStateChange process error:', err);
        } finally {
          if (mounted) setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
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
