'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User, Lock, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Unified Login
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!identifier || !password) {
      setErrorMsg('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (onLoginSuccess) {
        await onLoginSuccess({ 
          identifier: identifier.trim(), 
          password: password 
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'อีเมล/ชื่อผู้ใช้ หรือ รหัสผ่าน ไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
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

      {/* Main Glassmorphic Login Card */}
      <div className="relative z-10 w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-white/60 rounded-[32px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.45)] p-6 sm:p-10 space-y-6 text-apple-ink animate-in fade-in zoom-in-95 duration-500">
        {/* University & Department Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-24 h-24 sm:w-28 sm:h-28 p-2 rounded-2xl bg-white/90 shadow-md border border-apple-hairline flex items-center justify-center">
              {/* PSU Royal Emblem Logo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/psu-emblem.png"
                alt="ตราสัญลักษณ์ มหาวิทยาลัยสงขลานครินทร์"
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-apple-primary/10 text-apple-primary text-xs font-semibold tracking-wide mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>มหาวิทยาลัยสงขลานครินทร์</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-apple-ink tracking-tight">
              คณะวิทยาศาสตร์
            </h1>
            <p className="text-sm sm:text-base font-semibold text-apple-primary font-display">
              สาขาวิชาจุลชีววิทยา (Microbiology)
            </p>
            <p className="text-xs text-apple-ink-subtle mt-0.5">
              ระบบบริหารจัดการกองทุนและติดตามการชำระเงิน
            </p>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-apple-rose/10 border border-apple-rose/25 text-apple-rose text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {/* ==================== UNIFIED LOGIN FORM ==================== */}
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-apple-ink uppercase tracking-wider block">
              อีเมล / ชื่อผู้ใช้ (Email / Username)
            </label>
            <div className="relative">
              <input
                type="text"
                name="loginIdentifier"
                id="loginIdentifier"
                autoComplete="off"
                placeholder="อีเมลนักศึกษา หรือ ชื่อผู้ดูแลระบบ"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-white border border-apple-hairline text-sm text-apple-ink placeholder:text-apple-ink-subtle/50 focus:outline-none focus:ring-2 focus:ring-apple-primary/40 focus:border-apple-primary transition-all shadow-inner"
                autoFocus
              />
              <User className="w-4 h-4 text-apple-ink-subtle absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-apple-ink uppercase tracking-wider block">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <input
                type="password"
                name="loginPassword"
                id="loginPassword"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-white border border-apple-hairline text-sm text-apple-ink placeholder:text-apple-ink-subtle/50 focus:outline-none focus:ring-2 focus:ring-apple-primary/40 focus:border-apple-primary transition-all shadow-inner"
              />
              <Lock className="w-4 h-4 text-apple-ink-subtle absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-pill-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Sign In)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <div className="pt-2 text-center">
            <p className="text-[11px] text-apple-ink-subtle">
              ยังไม่มีบัญชีนักศึกษา?{' '}
              <Link href="/student/register" className="text-apple-primary font-semibold hover:underline">
                ลงทะเบียนใช้งานครั้งแรก
              </Link>
            </p>
          </div>
        </form>

        {/* Card Footer: Security & PDPA Assurance */}
        <div className="pt-2 border-t border-apple-hairline/80 text-center space-y-1">
          <p className="text-[11px] text-apple-ink-subtle flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-apple-emerald" />
            <span>คุ้มครองข้อมูลส่วนบุคคลตามมาตรฐาน PDPA • ตรวจสอบสลิปผ่าน OCR</span>
          </p>
          <p className="text-[10px] text-gray-400">
            อาคารวิทยาศาสตร์และเทคโนโลยี • คณะวิทยาศาสตร์ มหาวิทยาลัยสงขลานครินทร์
          </p>
        </div>
      </div>
    </div>
  );
}
