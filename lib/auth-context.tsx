import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { ensureUserProfileExists, type UserProfile, type UserRole } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  authReady: boolean;
  currentRole: UserRole | null;
  currentUser: User | null;
  currentUserProfile: UserProfile | null;
  isAdmin: boolean;
  refreshCurrentUserProfile: () => Promise<UserProfile | null>;
  session: Session | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  const refreshCurrentUserProfile = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    const nextSession = data.session;
    setSession(nextSession);

    if (!nextSession?.user) {
      setCurrentUserProfile(null);
      return null;
    }

    const profile = await ensureUserProfileExists({ user: nextSession.user });
    setCurrentUserProfile(profile);
    return profile;
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadSessionAndProfile = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        console.error('Failed to load auth session.', error);
        setSession(null);
        setCurrentUserProfile(null);
        setAuthReady(true);
        return;
      }

      setSession(data.session);

      if (data.session?.user) {
        try {
          const profile = await ensureUserProfileExists({ user: data.session.user });

          if (mounted) {
            setCurrentUserProfile(profile);
          }
        } catch (profileError) {
          console.error('Failed to load user profile.', profileError);

          if (mounted) {
            setCurrentUserProfile(null);
          }
        }
      } else {
        setCurrentUserProfile(null);
      }

      if (mounted) {
        setAuthReady(true);
      }
    };

    loadSessionAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);

      if (!nextSession?.user) {
        setCurrentUserProfile(null);
        setAuthReady(true);
        return;
      }

      try {
        const profile = await ensureUserProfileExists({ user: nextSession.user });
        setCurrentUserProfile(profile);
      } catch (profileError) {
        console.error('Failed to load user profile.', profileError);
        setCurrentUserProfile(null);
      } finally {
        setAuthReady(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    authReady,
    currentRole: session?.user ? currentUserProfile?.role ?? 'member' : null,
    currentUser: session?.user ?? null,
    currentUserProfile,
    isAdmin: currentUserProfile?.role === 'admin',
    refreshCurrentUserProfile,
    session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
