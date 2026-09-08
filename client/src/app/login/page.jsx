'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import {
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  KeyRound,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, role, loading, signIn, signUp } = useAuth();

  const [roleTab, setRoleTab] = useState('STUDENT'); // 'STUDENT' | 'ADMIN'
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Student form fields
  const [studentId, setStudentId] = useState('');
  const [studentFullName, setStudentFullName] = useState('');
  const [studentCohort, setStudentCohort] = useState('2');
  const [studentPassword, setStudentPassword] = useState('');

  // Admin form fields
  const [adminEmail, setAdminEmail] = useState('admin@psu.ac.th');
  const [adminPassword, setAdminPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'ADMIN') {
        router.replace('/admin/verification-queue');
      } else {
        router.replace('/student/dashboard');
      }
    }
  }, [user, role, loading, router]);

  // Handle Student Login / Register
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!studentId || !studentId.trim()) {
      setErrorMsg('กรุณากรอกรหัสนักศึกษา 10 หลัก');
      return;
    }

    if (!studentPassword) {
      setErrorMsg('กรุณากรอกรหัสผ่าน');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        if (!studentFullName.trim()) {
          throw new Error('กรุณากรอกชื่อ-นามสกุล');
        }
        await signUp({
          studentId: studentId.trim(),
          fullName: studentFullName.trim(),
          cohortYear: parseInt(studentCohort, 10),
          password: studentPassword,
        });
        setSuccessMsg('ลงทะเบียนสำเร็จ! กำลังนำเข้าสู่ระบบ...');
        setTimeout(() => router.replace('/student/dashboard'), 800);
      } else {
        await signIn(studentId.trim(), studentPassword);
        router.replace('/student/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'การเข้าสู่ระบบล้มเหลว กรุณาตรวจสอบข้อมูลอีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Admin Login
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!adminPassword) {
      setErrorMsg('กรุณากรอกรหัสผ่านเหรัญญิก');
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(adminEmail.trim(), adminPassword);
      router.replace('/admin/verification-queue');
    } catch (err) {
      setErrorMsg(err.message || 'รหัสผ่านหรืออีเมลเหรัญญิกไม่ถูกต้อง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-slate-950">
      {/* Atmospheric Radial Gradients */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Interactive Login Card */}
      <div className="relative z-10 w-full max-w-lg bg-slate-900/85 backdrop-blur-2xl border border-slate-700/60 rounded-[32px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.8)] p-6 sm:p-10 space-y-6 text-white animate-in fade-in zoom-in-95 duration-500">
        
        {/* Department Branding */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 p-2 rounded-2xl bg-white/10 backdrop-blur-md shadow-md border border-white/20 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/psu-emblem.png"
                alt="ตราสัญลักษณ์ มหาวิทยาลัยสงขลานครินทร์"
                className="w-full h-full object-contain drop-shadow-sm"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wide mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Prince of Songkla University</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
              สาขาวิชาจุลชีววิทยา คณะวิทยาศาสตร์
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              ระบบตรวจสอบการชำระเงินและกองทุนภาควิชา (Microbiology DeptFund)
            </p>
          </div>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 p-1 bg-slate-800/80 rounded-2xl border border-slate-700">
          <button
            type="button"
            onClick={() => {
              setRoleTab('STUDENT');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              roleTab === 'STUDENT'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>นักศึกษา (Student)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRoleTab('ADMIN');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              roleTab === 'ADMIN'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>เหรัญญิก / Admin</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Student Form */}
        {roleTab === 'STUDENT' ? (
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                รหัสนักศึกษา (10 หลัก)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="เช่น 6610210123"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ชื่อ-นามสกุล
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น นายสมชาย จุลชีวะ"
                    value={studentFullName}
                    onChange={(e) => setStudentFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ชั้นปีที่ศึกษา (Cohort Year)
                  </label>
                  <select
                    value={studentCohort}
                    onChange={(e) => setStudentCohort(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="1">ชั้นปีที่ 1 (Cohort 1)</option>
                    <option value="2">ชั้นปีที่ 2 (Cohort 2)</option>
                    <option value="3">ชั้นปีที่ 3 (Cohort 3)</option>
                    <option value="4">ชั้นปีที่ 4 (Cohort 4)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'กำลังดำเนินการ...' : (isRegisterMode ? 'สร้างบัญชีนักศึกษาใหม่' : 'เข้าสู่ระบบนักศึกษา')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setErrorMsg('');
                }}
                className="text-xs text-cyan-400 hover:underline"
              >
                {isRegisterMode ? 'มีบัญชีแล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชีนักศึกษา? ลงทะเบียนที่นี่'}
              </button>
            </div>
          </form>
        ) : (
          /* Admin Form */
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                อีเมลเหรัญญิกภาควิชา
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="admin@psu.ac.th"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                รหัสผ่านเข้าถึงสิทธิ์เหรัญญิก
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบคิวตรวจสอบเหรัญญิก'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
