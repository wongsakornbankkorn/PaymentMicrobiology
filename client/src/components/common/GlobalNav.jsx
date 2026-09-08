'use client';

import React from 'react';
import { ShieldCheck, User, LogOut, Sparkles } from 'lucide-react';

export default function GlobalNav({
  role,
  student,
  adminUser,
  onLogout
}) {
  return (
    <nav className="sticky top-0 z-40 bg-apple-black text-white h-12 px-4 sm:px-8 flex items-center justify-between text-xs font-normal tracking-tight select-none border-b border-[#2d2d2f] shadow-sm">
      {/* Brand Identity with PSU Crest */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-white/95 p-0.5 shadow-sm flex items-center justify-center shrink-0 border border-white/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/psu-emblem.png"
            alt="PSU Emblem"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-white tracking-normal text-sm font-display">
            Microbiology Treasury
          </span>
          <span className="hidden md:inline-block text-[#86868b] border-l border-[#424245] pl-2 text-xs">
            สาขาจุลชีววิทยา คณะวิทยาศาสตร์ ม.อ.
          </span>
        </div>
      </div>

      {/* Role & Active User Profile Pill */}
      <div className="flex items-center gap-3">
        {role === 'STUDENT' && student && (
          <div className="flex items-center gap-2 bg-[#1d1d1f] pl-3 pr-2 py-1 rounded-full border border-[#333336]">
            <span className="w-2 h-2 rounded-full bg-apple-emerald animate-pulse" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-white font-medium">{student.name_th}</span>
              <span className="text-[#86868b] hidden sm:inline">({student.student_id})</span>
              <span className="px-1.5 py-0.5 rounded bg-apple-primary/20 text-apple-primary text-[10px] font-medium hidden sm:inline">
                ปี {student.cohort_year}
              </span>
            </div>
          </div>
        )}

        {role === 'ADMIN' && (
          <div className="flex items-center gap-2 bg-[#1d1d1f] pl-3 pr-2 py-1 rounded-full border border-[#333336]">
            <ShieldCheck className="w-3.5 h-3.5 text-apple-emerald" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-white font-medium">{adminUser?.name || 'เหรัญญิกสาขาจุลชีววิทยา'}</span>
              <span className="px-1.5 py-0.5 rounded bg-apple-emerald/20 text-apple-emerald text-[10px] font-bold">
                ADMIN
              </span>
            </div>
          </div>
        )}

        {/* Unified Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="ออกจากระบบ"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1d1d1f] hover:bg-red-950/50 border border-[#333336] hover:border-red-500/40 text-xs text-red-400 hover:text-red-300 transition-all font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        )}
      </div>
    </nav>
  );
}
