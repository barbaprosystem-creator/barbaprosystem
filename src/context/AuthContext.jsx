import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { clearAllCache } from '../lib/dataCache';
import { withDeadline } from '../lib/withDeadline';

const AuthContext = createContext({});

function getCachedProfile(userId) {
  try {
    const raw = localStorage.getItem(`barba_profile_${userId}`) || sessionStorage.getItem(`barba_profile_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function saveCachedProfile(userId, profile) {
  try {
    if (userId && profile) {
      localStorage.setItem(`barba_profile_${userId}`, JSON.stringify(profile));
      sessionStorage.setItem(`barba_profile_${userId}`, JSON.stringify(profile));
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
    } else if (email.includes('ventas') || email.includes('sales')) {
      defaultRole = 'salesperson';
    } else {
      defaultRole = 'admin'; // Internal company fail-safe
    }
  }

  return {
    id: user.id,
    full_name: meta.full_name || user.email?.split('@')[0] || 'Admin',
    role: defaultRole,
    is_active: true,
  };
}

function isProfileEqual(p1, p2) {
  if (!p1 && !p2) return true;
  if (!p1 || !p2) return false;
  return p1.id === p2.id && p1.role === p2.role && p1.full_name === p2.full_name && p1.is_active === p2.is_active;
}

function getInitialState() {
  if (typeof window === 'undefined') {
    return { initialSession: null, initialProfile: null, initialLoading: true };
  }
  try {
    const rawToken = localStorage.getItem('barba-crm-auth-token');
    if (!rawToken) {
      return { initialSession: null, initialProfile: null, initialLoading: false };
    }
    const parsed = JSON.parse(rawToken);
    const user = parsed?.user;
    if (user?.id) {
      const cached = getCachedProfile(user.id);
      const fallback = cached || getFallbackProfile(user);
      return { initialSession: parsed, initialProfile: fallback, initialLoading: false };
    }
  } catch (e) {}
  return { initialSession: null, initialProfile: null, initialLoading: true };
}

export function AuthProvider({ children }) {
  const [initial] = useState(getInitialState);
  const [session, setSession] = useState(initial.initialSession);
  const [profile, setProfile] = useState(initial.initialProfile);
  const [loading, setLoading] = useState(initial.initialLoading);
  const isMountedRef = useRef(true);
  const profileRef = useRef(initial.initialProfile);
  profileRef.current = profile;

  // Fetch user profile from database with timeout
  const fetchProfile = useCallback(async (userId, fallback) => {
    try {
      return await withDeadline(
        async (signal) => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
            .abortSignal(signal);

          if (error) {
            console.warn('Profile fetch warning (using fallback):', error.message);
            return fallback;
          }
          if (data) {
            saveCachedProfile(userId, data);
            return data;
          }
          return fallback;
        },
        { timeoutMs: 3500, label: 'fetchProfile' }
      );
    } catch (err) {
      console.warn('Profile fetch timeout/error (using fallback):', err.message);
      return fallback;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // 1. Initial auth check with token validity verification
    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (!isMountedRef.current) return;

        if (error || !initialSession?.user) {
          setSession(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        const now = Math.floor(Date.now() / 1000);
        const isExpired = initialSession.expires_at && (initialSession.expires_at - now < 30);

        let activeSession = initialSession;

        if (isExpired) {
          // Verify user and let Supabase SDK refresh the token before mounting pages
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData?.user) {
            setSession(null);
            setProfile(null);
            setLoading(false);
            return;
          }
          const { data: refreshedSession } = await supabase.auth.getSession();
          activeSession = refreshedSession?.session || initialSession;
        }

        if (!isMountedRef.current) return;

        const cached = getCachedProfile(activeSession.user.id);
        const fallback = cached || getFallbackProfile(activeSession.user);
        
        setSession(activeSession);
        if (!profileRef.current) {
          setProfile(fallback);
        }
        setLoading(false);

        // Fetch DB profile in background (outside initial auth cycle)
        setTimeout(() => {
          if (!isMountedRef.current) return;
          fetchProfile(activeSession.user.id, fallback).then(dbProfile => {
            if (isMountedRef.current && dbProfile && !isProfileEqual(dbProfile, profileRef.current)) {
              setProfile(dbProfile);
            }
          });
        }, 0);
      } catch (err) {
        console.warn('[Auth] Initialization error:', err);
        if (isMountedRef.current) {
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    // 2. Subscribe to auth events (CRITICAL: callback is strictly synchronous)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMountedRef.current) return;

        try {
          if (event === 'SIGNED_OUT' || !currentSession?.user) {
            setSession(null);
            setProfile(null);
            setLoading(false);
            return;
          }

          setSession(currentSession);
          setLoading(false);

          // Only set fallback if we have NO profile yet
          if (!profileRef.current) {
            const cached = getCachedProfile(currentSession.user.id);
            const fallback = cached || getFallbackProfile(currentSession.user);
            setProfile(fallback);
          }

          // Asynchronously fetch profile OUTSIDE the synchronous auth callback using setTimeout
          setTimeout(() => {
            if (!isMountedRef.current || !currentSession?.user?.id) return;
            fetchProfile(currentSession.user.id, profileRef.current).then(dbProfile => {
              if (isMountedRef.current && dbProfile && !isProfileEqual(dbProfile, profileRef.current)) {
                setProfile(dbProfile);
              }
            });
          }, 0);
        } catch (err) {
          console.error('Auth state change error:', err);
          if (isMountedRef.current) setLoading(false);
        }
      }
    );

    // 3. Tab wake & focus listener to ensure valid token after idle/sleep
    let wakeCheckTimer = null;
    let isWakeChecking = false;
    const handleWakeCheck = () => {
      if (document.visibilityState !== 'visible' || isWakeChecking) return;
      clearTimeout(wakeCheckTimer);
      wakeCheckTimer = setTimeout(async () => {
        isWakeChecking = true;
        try {
          const { data: { session: currentSess } } = await supabase.auth.getSession();
          if (currentSess?.user) {
            const now = Math.floor(Date.now() / 1000);
            if (currentSess.expires_at && (currentSess.expires_at - now < 60)) {
              const { data: userData } = await supabase.auth.getUser();
              if (userData?.user) {
                const { data: refreshed } = await supabase.auth.getSession();
                if (refreshed?.session && isMountedRef.current) {
                  setSession(refreshed.session);
                }
              }
            }
          }
        } catch (e) {}
        isWakeChecking = false;
      }, 2000);
    };

    window.addEventListener('focus', handleWakeCheck);
    document.addEventListener('visibilitychange', handleWakeCheck);

    return () => {
      isMountedRef.current = false;
      subscription?.unsubscribe();
      clearTimeout(wakeCheckTimer);
      window.removeEventListener('focus', handleWakeCheck);
      document.removeEventListener('visibilitychange', handleWakeCheck);
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }, []);

  const signUp = useCallback(async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('SignOut server call warning:', err);
    } finally {
      try {
        sessionStorage.removeItem('barba-crm-session-token');
        sessionStorage.removeItem('barba-crm-auth-token');
        localStorage.removeItem('barba-crm-auth-token');
        localStorage.removeItem('barba-crm-session-token');
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith('barba_profile_')) sessionStorage.removeItem(k);
        });
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('barba_profile_')) localStorage.removeItem(k);
        });
        // Atomic purge of all IndexedDB cached entities (prevents cross-user data leakage)
        await clearAllCache();
      } catch (e) {}
      setSession(null);
      setProfile(null);
      window.location.href = '/login';
    }
  }, []);

  const isAdmin = profile?.role === 'admin';
  const isSalesperson = profile?.role === 'salesperson';
  const isSupervisor = profile?.role === 'supervisor';
  const isOffice = profile?.role === 'office';

  const value = React.useMemo(() => ({
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
  }), [
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isSalesperson,
    isSupervisor,
    isOffice,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
