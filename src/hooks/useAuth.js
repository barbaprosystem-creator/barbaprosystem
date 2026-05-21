import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from profiles table with timeout
  const fetchProfile = useCallback(async (userId) => {
    try {
      // Add a timeout to prevent infinite hanging
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
        // If profile fetch fails, create a minimal profile from session
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
      try {
        const response = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, r) => setTimeout(() => r(new Error('getSession timeout')), 7000))
        ]);

        if (!mounted) return;

        // If there's a critical error (like AuthSessionMissingError or corrupted token), force clear
        if (response?.error) {
          console.error('Critical auth error on init, forcing signout:', response.error.message);
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
          setLoading(false);
          return;
        }

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
        console.warn('Auth init exception (clearing corrupt session):', err.message);
        // On timeout/error (which could be a dead token loop), try to sign out to clear local storage
        await supabase.auth.signOut().catch(() => {});
        if (mounted) {
          setSession(null);
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    Promise.race([init(), timeout]).catch(() => {
      if (mounted) setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        // Always resolve loading even if unmounted
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

  return {
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
}
