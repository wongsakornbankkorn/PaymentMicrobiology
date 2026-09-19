'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  profile: null,
  role: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // 1. Check Admin Session (LocalStorage with TTL)
        const adminAuth = localStorage.getItem('dept_admin_auth');
        if (adminAuth) {
          const parsed = JSON.parse(adminAuth);
          // ตรวจว่า session ยังไม่หมดอายุ (8 ชั่วโมง) เพื่อไม่ให้ session เก่าให้สิทธิ์ได้ไม่จำกัด
          const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
          const loginTime = parsed.loginAt ? new Date(parsed.loginAt).getTime() : 0;
          const isExpired = Date.now() - loginTime > SESSION_TTL_MS;

          if (parsed.authenticated && parsed.admin && !isExpired) {
            if (mounted) {
              setUser({ id: parsed.admin.id, role: 'ADMIN' });
              setProfile({
                ...parsed.admin,
                role: 'ADMIN',
              });
              setLoading(false);
            }
            return;
          } else if (isExpired) {
            // Session หมดอายุ — ลบออก
            localStorage.removeItem('dept_admin_auth');
          }
        }

        // 2. Check Student Session (Supabase Auth)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && session.user) {
          // Fetch student profile using auth_id
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

          if (!studentError && studentData && mounted) {
            const studentProfile = { ...studentData, role: 'STUDENT' };
            const studentUser = { id: session.user.id, role: 'STUDENT' };
            
            setUser(studentUser);
            setProfile(studentProfile);
            localStorage.setItem('dept_student', JSON.stringify(studentData));
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('Init auth error:', e);
      }

      if (mounted) setLoading(false);
    }

    initAuth();

    // Listen to Supabase Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: studentData } = await supabase
          .from('students')
          .select('*')
          .eq('auth_id', session.user.id)
          .single();
          
        if (studentData && mounted) {
          setUser({ id: session.user.id, role: 'STUDENT' });
          setProfile({ ...studentData, role: 'STUDENT' });
          localStorage.setItem('dept_student', JSON.stringify(studentData));
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted && profile?.role === 'STUDENT') {
          setUser(null);
          setProfile(null);
          localStorage.removeItem('dept_student');
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [profile?.role]);

  /**
   * Sign In: รองรับทั้ง Student (Student ID + Password) และ Admin (Username + Password)
   * @param identifier - รหัสนักศึกษา (10 หลัก) หรือ admin username
   * @param password - password 
   */
  const signIn = async (identifier, password) => {
    setLoading(true);

    const trimmed = String(identifier).trim();
    // ถ้ารูปแบบเป็นตัวเลข 10 หลัก ถือว่าเป็น Student
    const isStudent = /^\d{10}$/.test(trimmed);

    try {
      if (isStudent) {
        // === Student Login: Supabase Auth ===
        if (!password) {
          throw new Error('กรุณากรอกรหัสผ่าน');
        }
        
        const dummyEmail = `${trimmed}@student.psu.mock`;
        
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: dummyEmail,
          password: password,
        });

        if (authError || !authData.user) {
          throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }

        // Fetch student data by auth_id
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('auth_id', authData.user.id)
          .single();

        if (studentError || !studentData) {
          // หากไม่มีข้อมูลนักศึกษาที่ผูกกับ auth_id นี้ ให้ sign out ทันที
          await supabase.auth.signOut();
          throw new Error('ไม่พบข้อมูลนักศึกษาที่ผูกกับบัญชีนี้ กรุณาติดต่อผู้ดูแลระบบ');
        }

        const studentProfile = { ...studentData, role: 'STUDENT' };
        const studentUser = { id: authData.user.id, role: 'STUDENT' };

        setUser(studentUser);
        setProfile(studentProfile);
        localStorage.setItem('dept_student', JSON.stringify(studentData));

        setLoading(false);
        return { user: studentUser, profile: studentProfile };

      } else {
        // === Admin Login: เรียก Backend API ที่ตรวจ bcrypt password ===
        if (!password) {
          throw new Error('กรุณากรอกรหัสผ่านเหรัญญิก');
        }

        // เรียก Backend API ที่มี bcrypt compare — ไม่ query ฐานข้อมูลจาก client โดยตรง
        // เพื่อป้องกันไม่ให้ใครเข้าสู่ระบบได้โดยรู้แค่ username
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${backendUrl}/api/auth/admin-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: trimmed, password }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'ชื่อผู้ใช้หรือรหัสผ่านเหรัญญิกไม่ถูกต้อง');
        }

        const data = result.admin;
        const adminProfile = {
          id: data.id,
          username: data.username,
          name: data.name,
          role: data.role || 'ADMIN',
        };
        const adminUser = { id: data.id, role: 'ADMIN' };

        setUser(adminUser);
        setProfile(adminProfile);

        localStorage.setItem('dept_admin_auth', JSON.stringify({
          authenticated: true,
          role: 'ADMIN',
          admin: adminProfile,
          loginAt: new Date().toISOString(),
        }));

        setLoading(false);
        return { user: adminUser, profile: adminProfile };
      }
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (profile?.role === 'STUDENT') {
        await supabase.auth.signOut();
      }
      localStorage.removeItem('dept_admin_auth');
      localStorage.removeItem('dept_student_auth');
      localStorage.removeItem('dept_student');
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
        signOut,
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
