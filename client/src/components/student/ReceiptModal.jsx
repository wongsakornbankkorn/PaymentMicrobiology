'use client';

import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-apple-hairline rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-apple-hairline">
          <div className="flex items-center gap-2 text-xs font-semibold text-apple-emerald bg-apple-emerald/10 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ใบเสร็จรับเงินอิเล็กทรอนิกส์ (Official E-Receipt)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-full text-apple-ink hover:bg-apple-parchment transition-colors"
              title="พิมพ์ใบเสร็จ"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-apple-ink hover:bg-apple-parchment transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="border border-apple-hairline rounded-2xl p-6 bg-[#fafafa] space-y-6 text-apple-ink">
          {/* Institution Header */}
          <div className="text-center space-y-1">
            <div className="flex justify-center mb-1">
              <div className="w-12 h-12 p-1 rounded-xl bg-white shadow-xs border border-apple-hairline flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/psu-emblem.png"
                  alt="PSU Crest"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-apple-ink">
              กองทุนสาขาวิชาจุลชีววิทยา (Microbiology Department Fund)
            </h3>
            <p className="text-xs text-apple-ink-subtle">
              คณะวิทยาศาสตร์ • มหาวิทยาลัยสงขลานครินทร์ (ม.อ.)
            </p>
            <div className="text-xs font-mono font-bold text-apple-primary pt-1">
              เลขที่ใบเสร็จ: {receipt.receipt_number}
            </div>
          </div>

          {/* Student & Date Info */}
          <div className="grid grid-cols-2 gap-4 text-xs py-3 border-y border-apple-hairline">
            <div>
              <span className="text-apple-ink-subtle block">ผู้ชำระเงิน (Payer):</span>
              <span className="font-semibold text-apple-ink">{receipt.student_name}</span>
              <span className="block text-apple-ink-subtle">รหัสนักศึกษา: {receipt.student_code}</span>
            </div>
            <div className="text-right">
              <span className="text-apple-ink-subtle block">วันที่ออกเอกสาร:</span>
              <span className="font-semibold text-apple-ink">
                {new Date(receipt.issued_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="block text-apple-ink-subtle">รหัสอ้างอิง: {receipt.transaction_code}</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-apple-ink-subtle pb-1 border-b border-apple-hairline">
              <span>รายการ (Description)</span>
              <span>จำนวนเงิน (Amount)</span>
            </div>

            <div className="flex justify-between items-center py-2 text-sm font-medium">
              <div>
                <span>{receipt.campaign_title}</span>
                <span className="text-xs text-apple-ink-subtle block">
                  โอนผ่าน {receipt.origin_bank} • {receipt.transfer_timestamp}
                </span>
              </div>
              <span className="font-display font-bold text-apple-ink">
                ฿{Number(receipt.amount).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t-2 border-apple-ink text-base font-bold">
              <span>ยอดชำระสุทธิ (Total Paid)</span>
              <span className="text-apple-primary font-display">
                ฿{Number(receipt.amount).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Digital Signature & Seal */}
          <div className="pt-4 flex items-center justify-between text-xs text-apple-ink-subtle">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-apple-emerald shrink-0" />
              <div>
                <span className="font-semibold text-apple-ink block">ตรวจสอบและรับรองถูกต้อง</span>
                <span className="text-[11px]">ลงนามดิจิทัลโดย เหรัญญิกสาขาวิชาจุลชีววิทยา</span>
              </div>
            </div>

            <div className="text-right">
              <div className="font-serif italic text-sm text-apple-ink font-semibold">Bandita J.</div>
              <span className="text-[11px] block">(บัณฑิตา จินดา)</span>
              <span className="text-[10px] text-apple-ink-subtle">เหรัญญิกสาขาวิชาจุลชีววิทยา</span>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-pill-secondary text-xs"
          >
            ปิดหน้าต่าง
          </button>
          <button
            onClick={handlePrint}
            className="btn-pill-primary text-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            <span>พิมพ์ใบเสร็จ (Print / PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
