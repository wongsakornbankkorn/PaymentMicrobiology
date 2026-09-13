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

      if (dbError) {
        console.error('Insert error:', dbError);
        // Fallback for UPSERT if student_id already exists
        if (dbError.code === '23505') { 
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
        router.push('/');
      }, 2000);

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-[#f5f5f7]">
      {/* Background Image: Science & Technology Building */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{
          backgroundImage: "url('/images/login-bg.jpg')",
          filter: 'brightness(0.92)'
        }}
      />

      {/* Atmospheric Frosted Tint Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-slate-900/40 to-black/60 backdrop-blur-[2px]" />

      {/* Main Glassmorphic Registration Card */}
      <div className="relative z-10 w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-white/60 rounded-[32px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.45)] p-6 sm:p-10 space-y-6 text-apple-ink animate-in fade-in zoom-in-95 duration-500">
        
        {/* Department Branding */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 p-2 rounded-2xl bg-white/90 shadow-md border border-apple-hairline flex items-center justify-center">
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-apple-primary/10 text-apple-primary text-xs font-semibold tracking-wide mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>สร้างบัญชีนักศึกษาใหม่</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-apple-ink tracking-tight">
              ลงทะเบียนระบบเช็คการชำระเงิน
            </h1>
            <p className="text-sm sm:text-base font-semibold text-apple-primary font-display mt-0.5">
              สาขาวิชาจุลชีววิทยา (Microbiology)
            </p>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-apple-rose/10 border border-apple-rose/25 text-apple-rose text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-apple-emerald/10 border border-apple-emerald/25 text-apple-emerald text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-3">
            
            {/* Student ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-apple-ink uppercase tracking-wider block">
                รหัสนักศึกษา (10 หลัก)
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="เช่น 6710210000"
                  disabled={isSubmitting}
                  className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-white border border-apple-hairline text-sm font-mono text-apple-ink placeholder:text-apple-ink-subtle/50 focus:outline-none focus:ring-2 focus:ring-apple-primary/40 focus:border-apple-primary transition-all shadow-inner"
                  maxLength={10}
                />
                <User className="w-4 h-4 text-apple-ink-subtle absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-apple-ink uppercase tracking-wider block">
                ชื่อ-นามสกุล (ภาษาไทย)
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="เช่น สมชาย ใจดี"
                  disabled={isSubmitting}
                  className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-white border border-apple-hairline text-sm text-apple-ink placeholder:text-apple-ink-subtle/50 focus:outline-none focus:ring-2 focus:ring-apple-primary/40 focus:border-apple-primary transition-all shadow-inner"
                />
                <User className="w-4 h-4 text-apple-ink-subtle absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-apple-ink uppercase tracking-wider block">
                อีเมล (Email)
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="off"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@sci.psu.ac.th"
                  disabled={isSubmitting}
                  className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-white border border-apple-hairline text-sm text-apple-ink placeholder:text-apple-ink-subtle/50 focus:outline-none focus:ring-2 focus:ring-apple-primary/40 focus:border-apple-primary transition-all shadow-inner"
                />
                <Mail className="w-4 h-4 text-apple-ink-subtle absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-apple-ink uppercase tracking-wider block">
                รหัสผ่าน (6 ตัวอักษรขึ้นไป)
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-white border border-apple-hairline text-sm text-apple-ink placeholder:text-apple-ink-subtle/50 focus:outline-none focus:ring-2 focus:ring-apple-primary/40 focus:border-apple-primary transition-all shadow-inner"
                />
                <Lock className="w-4 h-4 text-apple-ink-subtle absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-pill-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all bg-apple-ink text-white hover:bg-black disabled:opacity-50 mt-2"
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

        <div className="pt-4 border-t border-apple-hairline/80 text-center space-y-3">
          <p className="text-xs text-apple-ink-subtle">
            มีบัญชีผู้ใช้งานอยู่แล้วใช่หรือไม่?{' '}
            <Link href="/" className="text-apple-primary font-semibold hover:underline transition-colors">
              เข้าสู่ระบบที่นี่
            </Link>
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ปลอดภัยด้วย Supabase Authentication</span>
          </div>
        </div>

      </div>
    </div>
  );
}
