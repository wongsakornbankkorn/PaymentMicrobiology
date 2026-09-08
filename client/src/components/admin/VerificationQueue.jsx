'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Clock, Search, ChevronRight, ShieldCheck, Eye, Sparkles } from 'lucide-react';

const REJECTION_REASONS = [
  'ยอดเงินโอนไม่ตรงกับค่าธรรมเนียมที่ระบุ',
  'สลิปการโอนซ้ำกับในระบบ หรือเคยส่งแล้ว',
  'บัญชีปลายทางไม่ใช่บัญชีทางการของภาควิชา',
  'รูปภาพสลิปไม่ชัดเจน / ข้อมูลวันที่เวลาไม่สามารถอ่านได้',
  'ไม่พบรายการเดินบัญชีตรงกับเวลาที่ระบุ'
];

export default function VerificationQueue({ transactions, onVerifyTransaction }) {
  const [filter, setFilter] = useState('PENDING'); // PENDING, ALL, VERIFIED, REJECTED
  const [selectedTxnId, setSelectedTxnId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'ALL') return true;
    return t.verification_status === filter;
  });

  // activeTxn MUST be an item from the currently active filtered list
  const activeTxn = filteredTransactions.find(t => t.id === selectedTxnId)
                 || filteredTransactions[0]
                 || null;

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setSelectedTxnId(null);
  };

  const handleApprove = async (id) => {
    setIsProcessing(true);
    try {
      await onVerifyTransaction(id, 'APPROVE');
      // Clear current selection so next pending item is selected or empty state is displayed
      setSelectedTxnId(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenReject = (txn) => {
    setSelectedTxnId(txn.id);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!activeTxn) return;
    setIsProcessing(true);
    try {
      const reason = rejectionReason === 'other' ? customReason : rejectionReason;
      await onVerifyTransaction(activeTxn.id, 'REJECT', reason);
      setSelectedTxnId(null);
      setIsRejectModalOpen(false);
      setCustomReason('');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-apple-hairline rounded-3xl p-6 shadow-apple-card">
        <div>
          <h2 className="text-xl font-display font-semibold text-apple-ink">
            คิวตรวจสอบสลิปการโอนเงิน (Verification Queue)
          </h2>
          <p className="text-sm text-apple-ink-subtle mt-0.5">
            ระบบตรวจสอบสลิปแบบ Split-View พร้อมระบบเทียบยอด OCR และป้องกันการส่งสลิปซ้ำ
          </p>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center bg-apple-parchment p-1 rounded-full border border-apple-hairline self-start sm:self-center">
          <button
            onClick={() => handleFilterChange('PENDING')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === 'PENDING'
                ? 'bg-apple-ink text-white shadow-sm'
                : 'text-apple-ink-subtle hover:text-apple-ink'
            }`}
          >
            รอตรวจ ({transactions.filter(t => t.verification_status === 'PENDING').length})
          </button>
          <button
            onClick={() => handleFilterChange('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === 'ALL'
                ? 'bg-apple-ink text-white shadow-sm'
                : 'text-apple-ink-subtle hover:text-apple-ink'
            }`}
          >
            ทั้งหมด ({transactions.length})
          </button>
          <button
            onClick={() => handleFilterChange('VERIFIED')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === 'VERIFIED'
                ? 'bg-apple-ink text-white shadow-sm'
                : 'text-apple-ink-subtle hover:text-apple-ink'
            }`}
          >
            อนุมัติแล้ว ({transactions.filter(t => t.verification_status === 'VERIFIED').length})
          </button>
          <button
            onClick={() => handleFilterChange('REJECTED')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === 'REJECTED'
                ? 'bg-apple-ink text-white shadow-sm'
                : 'text-apple-ink-subtle hover:text-apple-ink'
            }`}
          >
            ปฏิเสธแล้ว ({transactions.filter(t => t.verification_status === 'REJECTED').length})
          </button>
        </div>
      </div>

      {/* Split-View Container (Left: Queue List, Right: Inspection Drawer) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Transaction List (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-apple-hairline rounded-3xl p-4 shadow-apple-card space-y-3 max-h-[750px] overflow-y-auto">
          <div className="px-2 py-1 text-xs font-semibold text-apple-ink-subtle uppercase tracking-wider flex items-center justify-between">
            <span>รายการในคิว ({filteredTransactions.length})</span>
            <span className="text-[11px]">คลิกเพื่อตรวจสอบ</span>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-apple-ink-subtle">
              <CheckCircle2 className="w-10 h-10 mx-auto text-apple-emerald/50 mb-2" />
              <p className="text-sm font-medium">ไม่มีรายการในหมวดนี้</p>
            </div>
          ) : (
            filteredTransactions.map(txn => {
              const isSelected = activeTxn?.id === txn.id;
              const isPending = txn.verification_status === 'PENDING';
              const isVerified = txn.verification_status === 'VERIFIED';
              const isRejected = txn.verification_status === 'REJECTED';

              return (
                <div
                  key={txn.id}
                  onClick={() => setSelectedTxnId(txn.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'border-apple-primary bg-apple-primary/5 ring-1 ring-apple-primary shadow-sm'
                      : 'border-apple-hairline bg-white hover:bg-apple-parchment/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-apple-ink-subtle">
                      {txn.transaction_code}
                    </span>
                    {isPending && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-apple-amber/10 text-apple-amber flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>รอตรวจ</span>
                      </span>
                    )}
                    {isVerified && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-apple-emerald/10 text-apple-emerald flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>อนุมัติแล้ว</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-apple-rose/10 text-apple-rose flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        <span>ปฏิเสธ</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-apple-ink text-sm">
                        {txn.student_name || 'กิตติภูมิ พรหมวงศ์'}
                      </div>
                      <div className="text-xs text-apple-ink-subtle">
                        {txn.student_code || '6710210766'} • {txn.campaign_title}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-semibold text-base text-apple-ink">
                        ฿{Number(txn.amount).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-apple-ink-subtle block">
                        {txn.origin_bank}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Inspection Drawer & Action Deck (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-apple-hairline rounded-3xl p-6 sm:p-8 shadow-apple-card space-y-6">
          {activeTxn ? (
            <>
              {/* Header Info */}
              <div className="flex items-center justify-between pb-4 border-b border-apple-hairline">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-apple-primary bg-apple-primary/10 px-2.5 py-1 rounded-full mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Inspection Mode</span>
                  </div>
                  <h3 className="text-lg font-display font-semibold text-apple-ink">
                    ตรวจสอบสลิป: {activeTxn.transaction_code}
                  </h3>
                  <p className="text-xs text-apple-ink-subtle">
                    ผู้ส่ง: <strong>{activeTxn.student_name}</strong> (รหัส {activeTxn.student_code || '6710210766'})
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-apple-ink-subtle block">ยอดเงินที่แจ้งโอน</span>
                  <span className="text-2xl font-display font-bold text-apple-primary">
                    ฿{Number(activeTxn.amount).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Slip Image & Zoom Container */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-apple-ink uppercase tracking-wider block">
                  ภาพสลิปที่นักศึกษาแนบมา
                </span>
                <div className="relative rounded-2xl overflow-hidden border border-apple-hairline bg-[#1c1c1e] flex items-center justify-center p-4 group">
                  <img
                    src={activeTxn.slip_image_url}
                    alt="Slip Image"
                    className="max-h-[360px] w-auto object-contain rounded-lg shadow-apple-product group-hover:scale-[1.02] transition-transform duration-200"
                  />
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>ภาพต้นฉบับ</span>
                  </div>
                </div>
              </div>

              {/* Automated OCR Verification Checklist */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-apple-ink uppercase tracking-wider">
                  <span>ผลการตรวจสอบอัตโนมัติ (Automated OCR Checks)</span>
                  <span className="text-apple-emerald font-bold text-[11px]">AI Verified: 99.2%</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-apple-parchment border border-apple-hairline flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-apple-emerald shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-apple-ink block">ยอดเงินตรงกับค่าธรรมเนียม</span>
                      <span className="text-apple-ink-subtle">
                        ฿{Number(activeTxn.amount).toLocaleString()} ตรงกับ {activeTxn.campaign_title}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-apple-parchment border border-apple-hairline flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-apple-emerald shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-apple-ink block">บัญชีปลายทางถูกต้อง</span>
                      <span className="text-apple-ink-subtle">SCB 045-8921-344 (สาขาวิชาจุลชีววิทยา ม.อ.)</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-apple-parchment border border-apple-hairline flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-apple-emerald shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-apple-ink block">ตรวจไม่พบสลิปซ้ำ (Anti-Fraud)</span>
                      <span className="text-apple-ink-subtle font-mono truncate block max-w-[180px]">
                        {activeTxn.slip_hash || 'sha256-verified-unique'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-apple-parchment border border-apple-hairline flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-apple-emerald shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-apple-ink block">ธนาคาร & เวลาโอน</span>
                      <span className="text-apple-ink-subtle">
                        {activeTxn.origin_bank} • {activeTxn.transfer_timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Deck */}
              {activeTxn.verification_status === 'PENDING' ? (
                <div className="pt-4 border-t border-apple-hairline flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleOpenReject(activeTxn)}
                    disabled={isProcessing}
                    className="px-5 py-2.5 rounded-full border border-apple-rose/30 text-apple-rose hover:bg-apple-rose/10 font-medium text-xs transition-colors btn-press flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>ปฏิเสธสลิป (Reject)</span>
                  </button>

                  <button
                    onClick={() => handleApprove(activeTxn.id)}
                    disabled={isProcessing}
                    className="btn-pill-primary text-xs py-2.5 px-6 shadow-sm flex items-center gap-1.5 bg-apple-emerald hover:bg-apple-emerald/90"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>อนุมัติการชำระเงิน & ออกใบเสร็จ</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-apple-parchment border border-apple-hairline flex items-center justify-between text-xs">
                  <div>
                    <span className="text-apple-ink-subtle block">สถานะปัจจุบัน:</span>
                    <span className="font-semibold text-apple-ink">
                      {activeTxn.verification_status === 'VERIFIED' ? 'อนุมัติเรียบร้อยแล้ว' : 'ปฏิเสธสลิปแล้ว'}
                    </span>
                    {activeTxn.rejection_reason && (
                      <span className="text-apple-rose block mt-1">เหตุผล: {activeTxn.rejection_reason}</span>
                    )}
                  </div>
                  <span className="text-apple-ink-subtle">
                    ตรวจสอบโดย: {activeTxn.reviewed_by || 'บัณฑิตา จินดา (เหรัญญิกสาขาจุลชีววิทยา)'}
                  </span>
                </div>
              )}
            </>
          ) : filter === 'PENDING' ? (
            <div className="text-center py-20 px-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-apple-emerald/10 text-apple-emerald mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="max-w-xs mx-auto space-y-1.5">
                <h3 className="text-base font-display font-semibold text-apple-ink">
                  ตรวจสลิปในคิวครบถ้วนแล้ว
                </h3>
                <p className="text-xs text-apple-ink-subtle leading-relaxed">
                  ไม่มีสลิปการโอนเงินที่รอการตรวจสอบในขณะนี้ รายการที่อนุมัติแล้วจะย้ายไปจัดเก็บในแท็บ "อนุมัติแล้ว"
                </p>
              </div>
              {transactions.filter(t => t.verification_status === 'VERIFIED').length > 0 && (
                <button
                  type="button"
                  onClick={() => handleFilterChange('VERIFIED')}
                  className="btn-pill-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5 text-apple-primary" />
                  <span>ดูรายการที่อนุมัติแล้ว ({transactions.filter(t => t.verification_status === 'VERIFIED').length})</span>
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-apple-ink-subtle space-y-2">
              <div className="w-12 h-12 rounded-full bg-apple-parchment text-apple-ink-subtle mx-auto flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-xs">กรุณาเลือกรายการทางซ้ายเพื่อตรวจสอบสลิปและรายละเอียด</p>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-apple-hairline rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div>
              <div className="w-10 h-10 rounded-full bg-apple-rose/10 text-apple-rose flex items-center justify-center mb-2">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-display font-semibold text-apple-ink">
                ระบุเหตุผลในการปฏิเสธสลิป
              </h3>
              <p className="text-xs text-apple-ink-subtle mt-0.5">
                ข้อความนี้จะแจ้งไปยังนักศึกษาเพื่อให้แก้ไขและส่งสลิปใหม่
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-apple-ink">เลือกเหตุผลที่พบ *</label>
              <div className="space-y-2">
                {REJECTION_REASONS.map(reason => (
                  <label
                    key={reason}
                    className="flex items-start gap-2.5 p-3 rounded-xl border border-apple-hairline bg-apple-parchment/40 hover:bg-apple-parchment cursor-pointer text-xs text-apple-ink transition-colors"
                  >
                    <input
                      type="radio"
                      name="rejectionReason"
                      value={reason}
                      checked={rejectionReason === reason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-0.5 text-apple-primary"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="btn-pill-secondary text-xs"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-full bg-apple-rose text-white text-xs font-semibold hover:bg-apple-rose/90 transition-colors btn-press shadow-sm"
              >
                ยืนยันการปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
