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

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), 8000)
    );

    async function init() {
      const fallbackToLocal = () => {
        try {
          const stored = localStorage.getItem('barba-crm-auth-token');
          if (stored) return { data: { session: JSON.parse(stored) }, error: null };
        } catch(e) {}
        return { data: { session: null }, error: null };
      };

      try {
        let response;
        try {
          response = await Promise.race([
            supabase.auth.getSession(),
            new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 5000))
          ]);
          
          if (response?.error) {
            console.warn('Supabase session error, falling back to local storage', response.error);
            response = fallbackToLocal();
          }
        } catch (e) {
          console.warn('Supabase getSession timeout, falling back to local storage');
          response = fallbackToLocal();
          // If we time out, the localStorage might be corrupted and causing issues
          // We don't remove it yet to preserve offline capabilities, but we catch it.
        }

        if (!mounted) return;

        const s = response?.data?.session;
        setSession(s);

        if (s?.user) {
          const p = await fetchProfile(s.user.id);
          if (!mounted) return;

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
        }
      } catch (err) {
        console.error('Fatal auth init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    Promise.race([init(), timeout]).catch(() => {
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        const updateState = (updates) => {
          if (!mounted) return;
          if (updates.session !== undefined) setSession(updates.session);
          if (updates.profile !== undefined) setProfile(updates.profile);
          setLoading(false);
        };

        if (!s?.user) {
          updateState({ session: null, profile: null });
          return;
        }

        const p = await fetchProfile(s.user.id);
        const fallback = (() => {
          const meta = s.user.user_metadata || {};
          return {
            id: s.user.id,
            full_name: meta.full_name || s.user.email,
            role: meta.role || 'salesperson',
            is_active: true,
          };
        })();

        updateState({ session: s, profile: p || fallback });
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
