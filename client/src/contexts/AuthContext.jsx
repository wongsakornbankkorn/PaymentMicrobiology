'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  profile: null,
  role: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Helper: Fetch profile row from public.profiles
  const fetchProfile = async (userId) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Profile fetch warning (may be using demo profile):', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.error('fetchProfile error:', err);
      return null;
    }
  };

  // Sync auth state on mount and listener
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      // If Supabase is not configured (e.g. initial clone without .env.local), check localStorage for demo mode
      if (!isSupabaseConfigured()) {
        try {
          const demoAuth = localStorage.getItem('supabase_demo_auth');
          if (demoAuth) {
            const parsed = JSON.parse(demoAuth);
            setUser(parsed.user);
            setProfile(parsed.profile);
          }
        } catch (e) {
          console.error(e);
        }
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          setUser(session.user);
          const prof = await fetchProfile(session.user.id);
          if (mounted) setProfile(prof);
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;
          if (session?.user) {
            setUser(session.user);
            const prof = await fetchProfile(session.user.id);
            setProfile(prof);
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        }
      );

      return () => {
        subscription?.unsubscribe();
      };
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshProfile = async () => {
    if (user?.id) {
      const prof = await fetchProfile(user.id);
      setProfile(prof);
      return prof;
    }
    return null;
  };

  /**
   * Unified Sign In:
   * Accepts (email, password) or (studentId, password).
   * For student ID login, formats student email as `<student_id>@psu.ac.th`
   */
  const signIn = async (identifier, password) => {
    setLoading(true);

    // Fallback if Supabase is not yet connected to a live cloud project
    if (!isSupabaseConfigured()) {
      const isStudent = /^\d{10}$/.test(identifier.trim());
      const role = isStudent ? 'STUDENT' : 'ADMIN';
      const mockUser = {
        id: isStudent ? '11111111-0000-0000-0000-111111111111' : '99999999-0000-0000-0000-999999999999',
        email: isStudent ? `${identifier.trim()}@psu.ac.th` : 'admin@psu.ac.th',
      };
      const mockProfile = {
        id: mockUser.id,
        student_id: isStudent ? identifier.trim() : null,
        full_name: isStudent ? `นักศึกษา (${identifier.trim()})` : 'อาจารย์ / เหรัญญิกภาควิชา',
        cohort_year: isStudent ? 2 : null,
        role: role,
      };

      setUser(mockUser);
      setProfile(mockProfile);
      localStorage.setItem('supabase_demo_auth', JSON.stringify({ user: mockUser, profile: mockProfile }));
      setLoading(false);
      return { user: mockUser, profile: mockProfile };
    }

    const email = identifier.includes('@')
      ? identifier.trim()
      : `${identifier.trim()}@psu.ac.th`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    const prof = await fetchProfile(data.user.id);
    setUser(data.user);
    setProfile(prof);
    setLoading(false);
    return { user: data.user, profile: prof };
  };

  /**
   * Student Sign Up
   */
  const signUp = async ({ email, password, studentId, fullName, cohortYear }) => {
    setLoading(true);

    if (!isSupabaseConfigured()) {
      const mockUser = { id: '11111111-0000-0000-0000-111111111111', email };
      const mockProfile = {
        id: mockUser.id,
        student_id: studentId,
        full_name: fullName,
        cohort_year: parseInt(cohortYear, 10),
        role: 'STUDENT',
      };
      setUser(mockUser);
      setProfile(mockProfile);
      localStorage.setItem('supabase_demo_auth', JSON.stringify({ user: mockUser, profile: mockProfile }));
      setLoading(false);
      return { user: mockUser, profile: mockProfile };
    }

    const targetEmail = email || `${studentId}@psu.ac.th`;

    const { data, error } = await supabase.auth.signUp({
      email: targetEmail,
      password,
      options: {
        data: {
          student_id: studentId,
          full_name: fullName,
          cohort_year: parseInt(cohortYear, 10),
          role: 'STUDENT',
        },
      },
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    setLoading(false);
    return data;
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem('supabase_demo_auth');
      setUser(null);
      setProfile(null);
      router.push('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const role = profile?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
