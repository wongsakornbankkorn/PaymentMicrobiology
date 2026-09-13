'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Sparkles, User, Mail, Lock, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    email: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const { studentId, name, email, password } = formData;

    if (!studentId || !name || !email || !password) {
      setErrorMsg('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    if (studentId.trim().length !== 10) {
      setErrorMsg('รหัสนักศึกษาต้องมี 10 หลัก');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: name.trim(),
            student_id: studentId.trim(),
          }
        }
      });

      if (authError) {
        throw new Error(authError.message || 'ไม่สามารถสมัครสมาชิกได้ กรุณาลองอีกครั้ง');
      }

      if (!authData.user) {
        throw new Error('การสมัครสมาชิกไม่สมบูรณ์ กรุณาลองใหม่อีกครั้ง');
      }

      // 2. Insert into students table
      const newStudent = {
        student_id: studentId.trim(),
        name_th: name.trim(),
        email: email.trim(),
        auth_id: authData.user.id,
        status: 'ENROLLED',
      };

      const { error: dbError } = await supabase
        .from('students')
        .insert([newStudent]);

      // Note: If student_id already exists without auth_id, this insert might fail 
      // if student_id is marked as UNIQUE. To handle updates for existing records, 
      // an upsert or update logic would be needed. But for this requirement, insert is fine.
      if (dbError) {
        console.error('Insert error:', dbError);
        // Fallback: Try to update existing record if insert fails due to unique constraint
        if (dbError.code === '23505') { // Unique violation
          const { error: updateError } = await supabase
            .from('students')
            .update({ auth_id: authData.user.id, email: email.trim(), name_th: name.trim() })
            .eq('student_id', studentId.trim());
            
          if (updateError) {
            throw new Error('ไม่สามารถบันทึกข้อมูลนักศึกษาได้: ' + updateError.message);
          }
        } else {
          throw new Error('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + dbError.message);
        }
      }

      setSuccessMsg('สมัครสมาชิกสำเร็จ! กำลังพากลับไปยังหน้าล็อกอิน...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-slate-950">
      {/* Atmospheric Radial Gradients */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Interactive Registration Card */}
      <div className="relative z-10 w-full max-w-lg bg-slate-900/85 backdrop-blur-2xl border border-slate-700/60 rounded-[32px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.8)] p-6 sm:p-10 space-y-6 text-white animate-in fade-in zoom-in-95 duration-500">
        
        {/* Department Branding */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 p-2 rounded-2xl bg-white/10 backdrop-blur-md shadow-md border border-white/20 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/psu-emblem.png"
                alt="PSU Emblem"
                className="w-full h-full object-contain drop-shadow-sm"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>สร้างบัญชีนักศึกษาใหม่</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
              ลงทะเบียนระบบเช็คการชำระเงิน
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              สาขาวิชาจุลชีววิทยา คณะวิทยาศาสตร์ ม.อ.
            </p>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">{successMsg}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-3">
            
            {/* Student ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                รหัสนักศึกษา (10 หลัก)
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="671021xxxx"
                  disabled={isSubmitting}
                  className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-mono"
                  maxLength={10}
                />
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                ชื่อ-นามสกุล (ภาษาไทย)
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="เช่น สมชาย ใจดี"
                  disabled={isSubmitting}
                  className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                อีเมล (Email)
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@sci.psu.ac.th"
                  disabled={isSubmitting}
                  className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                รหัสผ่าน (6 ตัวอักษรขึ้นไป)
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 mt-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              isSubmitting
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5'
            }`}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>สมัครสมาชิก</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center space-y-3">
          <p className="text-sm text-slate-400">
            มีบัญชีผู้ใช้งานอยู่แล้วใช่หรือไม่?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              เข้าสู่ระบบ
            </Link>
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ปลอดภัยด้วย Supabase Authentication</span>
          </div>
        </div>

      </div>
    </div>
  );
}
