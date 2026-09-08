'use client';

import React, { useState } from 'react';
import { ShieldCheck, User, Lock, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [roleTab, setRoleTab] = useState('STUDENT'); // 'STUDENT' | 'ADMIN'
  const [studentId, setStudentId] = useState('');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Student Login
  const handleStudentSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!studentId || !studentId.trim()) {
      setErrorMsg('กรุณากรอกรหัสนักศึกษา 10 หลัก');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (onLoginSuccess) {
        await onLoginSuccess('STUDENT', { student_id: studentId.trim() });
      }
    } catch (err) {
      setErrorMsg(err.message || 'ไม่พบรหัสนักศึกษานี้ในระบบ กรุณาตรวจสอบอีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Login
  const handleAdminSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!adminPassword) {
      setErrorMsg('กรุณากรอกรหัสผ่านเหรัญญิก');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (onLoginSuccess) {
        await onLoginSuccess('ADMIN', {
          username: adminUsername.trim(),
          password: adminPassword
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'รหัสผ่านเหรัญญิกไม่ถูกต้อง');
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

        {/* Role Segmented Controller (Apple Pill Switcher) */}
        <div className="bg-[#f0f0f4] p-1 rounded-2xl flex items-center border border-apple-hairline">
          <button
            type="button"
            onClick={() => {
              setRoleTab('STUDENT');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              roleTab === 'STUDENT'
                ? 'bg-white text-apple-ink shadow-sm ring-1 ring-black/5'
                : 'text-apple-ink-subtle hover:text-apple-ink'
            }`}
          >
            <User className="w-4 h-4 text-apple-primary" />
            <span>นักศึกษา (Student)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRoleTab('ADMIN');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              roleTab === 'ADMIN'
                ? 'bg-white text-apple-ink shadow-sm ring-1 ring-black/5'
                : 'text-apple-ink-subtle hover:text-apple-ink'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-apple-emerald" />
            <span>เหรัญญิก (Admin)</span>
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-apple-rose/10 border border-apple-rose/25 text-apple-rose text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {/* ==================== STUDENT LOGIN FORM ==================== */}
        {roleTab === 'STUDENT' && (
          <form onSubmit={handleStudentSubmit} className="space-y-4 animate-in fade-in duration-300">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-apple-ink uppercase tracking-wider block">
                รหัสนักศึกษา (Student ID)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={10}
                  placeholder="กรอกรหัสนักศึกษา 10 หลัก"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-white border border-apple-hairline text-sm font-mono text-apple-ink placeholder:text-apple-ink-subtle/50 focus:outline-none focus:ring-2 focus:ring-apple-primary/40 focus:border-apple-primary transition-all shadow-inner"
                  autoFocus
                />
                <User className="w-4 h-4 text-apple-ink-subtle absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[11px] text-apple-ink-subtle">
                กรอกรหัสนักศึกษาเพื่อเข้าสู่ระบบตรวจสอบยอดและส่งสลิปส่วนตัว
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-pill-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบนักศึกษา'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ==================== ADMIN LOGIN FORM ==================== */}
        {roleTab === 'ADMIN' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4 animate-in fade-in duration-300">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-apple-ink uppercase tracking-wider block">
                ชื่อผู้ใช้เหรัญญิก (Username)
              </label>
              <input
                type="text"
                placeholder="ชื่อผู้ใช้"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-white border border-apple-hairline text-sm text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40 focus:border-apple-primary transition-all shadow-inner"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-apple-ink uppercase tracking-wider block">
                รหัสผ่านเหรัญญิก (Password)
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="รหัสผ่านผู้ดูแลระบบ"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-white border border-apple-hairline text-sm text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40 focus:border-apple-primary transition-all shadow-inner"
                  autoFocus
                />
                <Lock className="w-4 h-4 text-apple-ink-subtle absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-pill-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all bg-apple-ink text-white hover:bg-black disabled:opacity-50 mt-2"
            >
              <ShieldCheck className="w-4 h-4 text-apple-emerald" />
              <span>{loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบเหรัญญิก'}</span>
            </button>
          </form>
        )}

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
