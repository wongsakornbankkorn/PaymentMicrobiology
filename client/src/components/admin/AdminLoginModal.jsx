'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle, ArrowRight, X } from 'lucide-react';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('กรุณากรอกรหัสผ่านเหรัญญิก');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onLoginSuccess(password);
      setPassword('');
      onClose();
    } catch (err) {
      setError(err.message || 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-apple-hairline rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-apple-parchment hover:bg-gray-200 flex items-center justify-center text-apple-ink-subtle hover:text-apple-ink transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Security Shield Icon & Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-apple-primary/10 text-apple-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-apple-ink">
              ยืนยันสิทธิ์เหรัญญิก (Admin)
            </h2>
            <p className="text-xs text-apple-ink-subtle mt-0.5">
              ระบบป้องกันการเข้าถึงฟังก์ชันจัดการบัญชีและการอนุมัติสลิป
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-apple-rose/10 border border-apple-rose/20 text-xs text-apple-rose flex items-center gap-2.5 animate-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-apple-ink mb-1.5">
              รหัสผ่านผู้ดูแลระบบ (Admin Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-apple-ink-subtle" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                placeholder="กรุณากรอกรหัสผ่าน..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-2.5 text-sm rounded-2xl border border-apple-hairline bg-apple-parchment/50 text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40 transition-all placeholder:text-apple-ink-subtle/60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-apple-ink-subtle hover:text-apple-ink"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-apple-ink-subtle mt-1.5 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-apple-primary"></span>
              รหัสผ่านเริ่มต้นสำหรับการทดสอบ: <code className="bg-gray-100 px-1 py-0.5 rounded text-apple-ink font-mono font-medium">admin1234</code>
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-pill-secondary text-xs px-4 py-2"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-pill-primary text-xs px-5 py-2 flex items-center gap-2"
            >
              {isLoading ? (
                <span>กำลังตรวจสอบ...</span>
              ) : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
