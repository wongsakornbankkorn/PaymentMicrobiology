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

  /**
   * ตรวจสอบ session จาก localStorage ตอนเริ่มต้น
   * ไม่ใช้ Supabase Auth เพราะ login ผ่านตาราง students/admins โดยตรง
   */
  useEffect(() => {
    function initAuth() {
      try {
        // ตรวจสอบ admin session
        const adminAuth = localStorage.getItem('dept_admin_auth');
        if (adminAuth) {
          const parsed = JSON.parse(adminAuth);
          if (parsed.authenticated && parsed.admin) {
            setUser({ id: parsed.admin.id, role: 'ADMIN' });
            setProfile({
              ...parsed.admin,
              role: 'ADMIN',
            });
            setLoading(false);
            return;
          }
        }

        // ตรวจสอบ student session
        const studentAuth = localStorage.getItem('dept_student_auth');
        if (studentAuth) {
          const parsed = JSON.parse(studentAuth);
          if (parsed.authenticated && parsed.student) {
            setUser({ id: parsed.student.id, role: 'STUDENT' });
            setProfile({
              ...parsed.student,
              role: 'STUDENT',
            });
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('Init auth error:', e);
      }

      // ไม่มี session
      setLoading(false);
    }

    initAuth();
  }, []);

  /**
   * Sign In: รองรับทั้ง Student (ค้นหาจาก student_id) และ Admin (ค้นหาจาก username)
   * @param identifier - student_id (10 หลัก) หรือ admin username
   * @param password - password (ใช้ verify เฉพาะ Admin ในอนาคต)
   */
  const signIn = async (identifier, password) => {
    setLoading(true);

    const trimmed = String(identifier).trim();
    const isStudent = /^\d{10}$/.test(trimmed);

    try {
      if (isStudent) {
        // === Student Login: ค้นหาจากตาราง students ===
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('student_id', trimmed)
          .single();

        if (error || !data) {
          throw new Error('ไม่พบรหัสนักศึกษานี้ในระบบ กรุณาตรวจสอบรหัสนักศึกษาอีกครั้ง');
        }

        const studentProfile = { ...data, role: 'STUDENT' };
        const studentUser = { id: data.id, role: 'STUDENT' };

        setUser(studentUser);
        setProfile(studentProfile);

        // เก็บ session
        localStorage.setItem('dept_student_auth', JSON.stringify({
          authenticated: true,
          role: 'STUDENT',
          student: data,
          loginAt: new Date().toISOString(),
        }));
        localStorage.setItem('dept_student', JSON.stringify(data));

        setLoading(false);
        return { user: studentUser, profile: studentProfile };

      } else {
        // === Admin Login: ค้นหาจากตาราง admins ===
        const { data, error } = await supabase
          .from('admins')
          .select('id, username, name, role')
          .eq('username', trimmed)
          .single();

        if (error || !data) {
          throw new Error('ไม่พบชื่อผู้ใช้นี้ในระบบ กรุณาตรวจสอบอีกครั้ง');
        }

        // TODO: ส่ง password ไป verify ที่ backend (bcrypt compare) ภายหลัง
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
