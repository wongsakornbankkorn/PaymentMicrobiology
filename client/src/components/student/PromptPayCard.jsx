'use client';

/**
 * PromptPayCard — Dynamic QR Code Component
 * สร้าง PromptPay QR Code ตามมาตรฐาน EMVCo แบบ Real-time
 * ฝังยอดเงินลงใน QR อัตโนมัติ — นักศึกษาสแกนแล้วยอดขึ้นเป๊ะไม่ต้องกรอกเอง
 *
 * Libraries:
 *   - promptpay-qr: สร้าง EMVCo Payload สำหรับ PromptPay
 *   - qrcode.react: Render QR Code เป็น SVG/Canvas ใน React
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import generatePayload from 'promptpay-qr';
import { Copy, Check, Download, QrCode, Building2, ShieldCheck, Sparkles } from 'lucide-react';
import { DEPARTMENT_INFO } from '../../data/mockData';

export default function PromptPayCard({ selectedCampaign, onAmountChange, currentAmount }) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const qrRef = useRef(null);

  const presets = [
    { label: 'ค่าบำรุงสาขาวิชา', amount: 500 },
    { label: 'เสื้อกาวน์ & โปโล', amount: 450 },
    { label: 'ค่ายวิชาการน้องใหม่', amount: 400 },
    { label: 'สัมมนาวิจัยจบ', amount: 300 }
  ];

  const handleSelectPreset = (amount) => {
    if (onAmountChange) onAmountChange(amount);
  };

  const handleCopyAccount = useCallback(() => {
    navigator.clipboard.writeText(DEPARTMENT_INFO.account_no.replace(/-/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  /**
   * สร้าง EMVCo Payload สำหรับ PromptPay QR
   * ใช้ useMemo เพื่อ cache ผลลัพธ์ — re-generate เฉพาะตอนยอดเงินเปลี่ยน
   * PromptPay ID จาก DEPARTMENT_INFO.promptpay_id (เลขบัญชี/เบอร์พร้อมเพย์)
   */
  const qrPayload = useMemo(() => {
    const amount = Number(currentAmount) || 0;
    try {
      // generatePayload(promptpayId, { amount }) -> EMVCo string
      return generatePayload(DEPARTMENT_INFO.promptpay_id, { amount: amount > 0 ? amount : undefined });
    } catch (err) {
      console.error('PromptPay QR generation error:', err);
      return '';
    }
  }, [currentAmount]);

  /**
   * ดาวน์โหลด QR Code เป็นภาพ PNG ลงเครื่อง
   * แปลง SVG → Canvas → PNG Blob → Download
   */
  const handleDownloadQR = useCallback(async () => {
    if (!qrRef.current || isDownloading) return;
    setIsDownloading(true);

    try {
      const svgElement = qrRef.current.querySelector('svg');
      if (!svgElement) return;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        // สร้าง Canvas ขนาด 600x600 เพื่อภาพคมชัด
        const canvas = document.createElement('canvas');
        const size = 600;
        const padding = 40;
        canvas.width = size + padding * 2;
        canvas.height = size + padding * 2 + 80;

        const ctx = canvas.getContext('2d');
        // พื้นหลังสีขาว
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // วาด QR Code
        ctx.drawImage(img, padding, padding, size, size);

        // เขียนข้อความยอดเงินด้านล่าง QR
        ctx.fillStyle = '#1d1d1f';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        const amountText = `฿${Number(currentAmount || 0).toLocaleString()}`;
        ctx.fillText(amountText, canvas.width / 2, size + padding + 40);

        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#6e6e73';
        ctx.fillText('กองทุนสาขาวิชาจุลชีววิทยา ม.อ.', canvas.width / 2, size + padding + 68);

        // ดาวน์โหลดเป็นไฟล์ PNG
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `PromptPay-QR-${currentAmount}THB.png`;
          link.click();
          URL.revokeObjectURL(url);
          URL.revokeObjectURL(svgUrl);
          setIsDownloading(false);
        }, 'image/png');
      };
      img.src = svgUrl;
    } catch (err) {
      console.error('QR download error:', err);
      setIsDownloading(false);
    }
  }, [currentAmount, isDownloading]);

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
        {/* Left: Dynamic PromptPay QR */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-apple-hairline shadow-sm">
          {/* PromptPay Branding Header */}
          <div className="w-full text-center pb-2 mb-2 border-b border-apple-hairline flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-[#003b71] tracking-wider uppercase">PROMPTPAY QR</span>
            <span className="text-[10px] bg-[#003b71]/10 text-[#003b71] px-1.5 py-0.5 rounded font-bold">พร้อมเพย์</span>
            {/* ป้ายกำกับว่ายอดเงินฝังใน QR อัตโนมัติ */}
            <span className="text-[9px] bg-apple-emerald/10 text-apple-emerald px-1.5 py-0.5 rounded font-bold">
              <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />
              AUTO
            </span>
          </div>

          {/* Dynamic QR Code — SVG Render ด้วย qrcode.react */}
          <div ref={qrRef} className="relative p-3 bg-white rounded-xl border border-gray-100 flex flex-col items-center">
            {qrPayload ? (
              <QRCodeSVG
                value={qrPayload}
                size={200}
                level="M"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#1d1d1f"
              />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-apple-ink-subtle text-sm">
                กำลังสร้าง QR...
              </div>
            )}
          </div>

          {/* ยอดเงินที่ฝังใน QR */}
          <div className="mt-3 text-center">
            <span className="text-xs text-apple-ink-subtle">ยอดเงินที่ฝังอัตโนมัติใน QR</span>
            <div className="text-xl font-display font-bold text-apple-ink">
              ฿{Number(currentAmount || 0).toLocaleString()}
            </div>
            <p className="text-[10px] text-apple-emerald mt-1 font-medium">
              ✓ สแกนแล้วยอดเงินขึ้นอัตโนมัติในแอปธนาคาร
            </p>
          </div>

          {/* ปุ่มดาวน์โหลด QR เป็นรูปภาพ */}
          <button
            onClick={handleDownloadQR}
            disabled={isDownloading || !qrPayload}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border border-apple-hairline bg-apple-parchment hover:bg-gray-100 text-apple-ink text-xs font-semibold transition-all btn-press disabled:opacity-50"
          >
            {isDownloading ? (
              <div className="w-4 h-4 border-2 border-apple-ink/30 border-t-apple-ink rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isDownloading ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด QR เป็นรูปภาพ'}</span>
          </button>
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

          {/* PromptPay ID Info */}
          <div className="p-3 rounded-2xl bg-[#003b71]/5 border border-[#003b71]/15">
            <span className="text-[11px] text-[#003b71]/70 block">PromptPay ID (พร้อมเพย์)</span>
            <span className="text-sm font-mono font-bold tracking-wider text-[#003b71]">
              {DEPARTMENT_INFO.promptpay_id}
            </span>
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
