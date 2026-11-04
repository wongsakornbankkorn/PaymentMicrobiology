'use client';

import React, { useState } from 'react';
import { Copy, Check, Download, QrCode, Building2, ShieldCheck, Sparkles } from 'lucide-react';
import { DEPARTMENT_INFO } from '../../data/mockData';

export default function PromptPayCard({ selectedCampaign, onAmountChange, currentAmount }) {
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState(selectedCampaign?.amount || currentAmount || 500);

  const presets = [
    { label: 'ค่าบำรุงสาขาวิชา', amount: 500 },
    { label: 'เสื้อกาวน์ & โปโล', amount: 450 },
    { label: 'ค่ายวิชาการน้องใหม่', amount: 400 },
    { label: 'สัมมนาวิจัยจบ', amount: 300 }
  ];

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(DEPARTMENT_INFO.account_no.replace(/-/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectPreset = (amount) => {
    setActivePreset(amount);
    if (onAmountChange) onAmountChange(amount);
  };

  return (
    <div className="bg-white border border-apple-hairline rounded-3xl p-6 sm:p-8 shadow-apple-card space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold text-apple-ink">
            ช่องทางการโอนเงิน & PromptPay QR
          </h2>
          <p className="text-sm text-apple-ink-subtle mt-0.5">
            สแกนเพื่อจ่ายตรงเข้าบัญชีกองทุนสาขาวิชาจุลชีววิทยา คณะวิทยาศาสตร์ ม.อ. พร้อมระบบตรวจสอบยอดอัตโนมัติ
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-apple-primary/10 text-apple-primary flex items-center justify-center">
          <QrCode className="w-5 h-5" />
        </div>
      </div>

      {/* Preset Amount Chips (Apple Configurator Chips) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-apple-ink uppercase tracking-wider">
          เลือกจำนวนเงินตามรายการ (Preset)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {presets.map(p => (
            <button
              key={p.amount}
              type="button"
              onClick={() => handleSelectPreset(p.amount)}
              className={`p-3 rounded-2xl border text-left transition-all btn-press ${
                Number(currentAmount) === p.amount
                  ? 'border-apple-primary bg-apple-primary/5 text-apple-primary font-semibold ring-1 ring-apple-primary'
                  : 'border-apple-hairline bg-white hover:bg-apple-parchment text-apple-ink'
              }`}
            >
              <div className="text-xs text-apple-ink-subtle truncate">{p.label}</div>
              <div className="text-lg font-display font-semibold mt-0.5">฿{p.amount}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Two-Column QR & Account Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-5 rounded-2xl bg-apple-parchment/60 border border-apple-hairline">
        {/* Left: Dynamic PromptPay QR Render */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-apple-hairline shadow-sm">
          {/* PromptPay Branding Header */}
          <div className="w-full text-center pb-2 mb-2 border-b border-apple-hairline flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-[#003b71] tracking-wider uppercase">PROMPTPAY QR</span>
            <span className="text-[10px] bg-[#003b71]/10 text-[#003b71] px-1.5 py-0.5 rounded font-bold">พร้อมเพย์</span>
          </div>

          {/* Dynamic PromptPay QR Render */}
          <div className="relative p-2 bg-white rounded-xl border border-gray-100 flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/images/prompay.jpg" 
              alt="PromptPay QR Code" 
              className="w-52 h-52 object-contain rounded-xl shadow-sm"
            />
          </div>

          <div className="mt-3 text-center">
            <span className="text-xs text-apple-ink-subtle">ยอดเงินที่ระบุใน QR</span>
            <div className="text-xl font-display font-bold text-apple-ink">
              ฿{Number(currentAmount || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Right: Bank Account Details with 1-Tap Copy */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-apple-ink uppercase tracking-wider">
              บัญชีทางการของภาควิชา
            </span>
            <div className="flex items-center gap-2 text-sm text-apple-ink font-medium">
              <Building2 className="w-4 h-4 text-[#4e2a84]" />
              <span>{DEPARTMENT_INFO.bank_name}</span>
            </div>
            <div className="text-xs text-apple-ink-subtle">
              ชื่อบัญชี: <strong className="text-apple-ink">{DEPARTMENT_INFO.account_name}</strong>
            </div>
          </div>

          {/* Account Number Box with 1-Tap Copy */}
          <div className="p-3.5 rounded-2xl bg-white border border-apple-hairline flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[11px] text-apple-ink-subtle block">เลขที่บัญชี (Account No.)</span>
              <span className="text-lg font-mono font-bold tracking-wider text-apple-ink">
                {DEPARTMENT_INFO.account_no}
              </span>
            </div>

            <button
              onClick={handleCopyAccount}
              className={`p-2.5 rounded-xl border transition-all btn-press flex items-center gap-1.5 text-xs font-medium ${
                copied
                  ? 'bg-apple-emerald/10 border-apple-emerald text-apple-emerald'
                  : 'bg-apple-parchment border-apple-hairline hover:bg-gray-100 text-apple-ink'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกเลข'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-apple-emerald bg-apple-emerald/10 px-3 py-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>โอนผ่านระบบพร้อมเพย์ฟรีค่าธรรมเนียมทุกธนาคาร</span>
          </div>
        </div>
      </div>
    </div>
  );
}
