'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, FileText, Clock, ShieldCheck, Image as ImageIcon } from 'lucide-react';

const BANKS = [
  { code: 'SCB', name: 'ธนาคารไทยพาณิชย์ (SCB)' },
  { code: 'KBANK', name: 'ธนาคารกสิกรไทย (KBank)' },
  { code: 'KTB', name: 'ธนาคารกรุงไทย (KTB)' },
  { code: 'BBL', name: 'ธนาคารกรุงเทพ (BBL)' },
  { code: 'BAY', name: 'ธนาคารกรุงศรีอยุธยา (Krungsri)' },
  { code: 'TTB', name: 'ธนาคารทหารไทยธนชาต (ttb)' },
  { code: 'GSB', name: 'ธนาคารออมสิน (GSB)' }
];

export default function SlipUploadForm({ campaigns, selectedCampaign, currentAmount, onAmountChange, onSubmitSlip }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [campaignId, setCampaignId] = useState(selectedCampaign?.id || campaigns[0]?.id || 1);
  const [amount, setAmount] = useState(currentAmount || selectedCampaign?.amount || 500);
  const [bank, setBank] = useState('SCB');
  const [transferTime, setTransferTime] = useState(new Date().toISOString().slice(0, 16));
  const [note, setNote] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // Sync campaign selection
  const handleCampaignChange = (id) => {
    const cid = parseInt(id, 10);
    setCampaignId(cid);
    const camp = campaigns.find(c => c.id === cid);
    if (camp) {
      setAmount(camp.amount);
      if (onAmountChange) onAmountChange(camp.amount);
    }
  };

  // Process File with Validation (Rule 2: File upload & storage preparation)
  const processFile = (selectedFile) => {
    setErrorMsg('');
    if (!selectedFile) return;

    // 1. File Size Check (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      setErrorMsg('ขนาดไฟล์เกินกำหนด (สูงสุดไม่เกิน 10MB)');
      return;
    }

    // 2. MIME Type Check
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setErrorMsg('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP) หรือไฟล์ PDF เท่านั้น');
      return;
    }

    setFile(selectedFile);
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(''); // PDF icon mode
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    alert('ปุ่ม Submit ใน Form ทำงานแล้ว (SlipUploadForm.jsx)');
    if (!file) {
      setErrorMsg('กรุณาแนบรูปสลิปการโอนเงินก่อนส่งแบบฟอร์ม');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('slip', file);
      formData.append('campaign_id', campaignId);
      formData.append('amount', amount);
      formData.append('transfer_timestamp', transferTime);
      formData.append('origin_bank', bank);
      formData.append('note', note);
      formData.append('preview_url', previewUrl);

      await onSubmitSlip(formData);
      handleClearFile();
      setNote('');
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการส่งสลิป กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-apple-hairline rounded-3xl p-6 sm:p-8 shadow-apple-card space-y-6">
      <div>
        <h2 className="text-xl font-display font-semibold text-apple-ink">
          แนบสลิปการชำระเงิน (Smart Slip Submission)
        </h2>
        <p className="text-sm text-apple-ink-subtle mt-0.5">
          กรอกข้อมูลการโอนและแนบสลิปเพื่อส่งเข้าคิวตรวจสอบของเหรัญญิกภาควิชา
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-apple-rose/10 border border-apple-rose/20 text-apple-rose text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Campaign Selector & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-apple-ink">
              กิจกรรม / รายการค่าธรรมเนียม *
            </label>
            <select
              value={campaignId}
              onChange={(e) => handleCampaignChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-apple-hairline bg-white text-sm text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40 focus:border-apple-primary"
            >
              {campaigns.map(camp => (
                <option key={camp.id} value={camp.id}>
                  {camp.title} (฿{Number(camp.amount).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-apple-ink">
              จำนวนเงินที่โอนจริง (บาท) *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (onAmountChange) onAmountChange(e.target.value);
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-apple-hairline bg-white text-sm font-semibold text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40 focus:border-apple-primary"
              required
            />
          </div>
        </div>

        {/* Row 2: Bank Selector & Transfer Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-apple-ink">
              ธนาคารต้นทางที่คุณใช้โอน *
            </label>
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-apple-hairline bg-white text-sm text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40 focus:border-apple-primary"
            >
              {BANKS.map(b => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-apple-ink">
              วันและเวลาที่โอน (ตามสลิป) *
            </label>
            <input
              type="datetime-local"
              value={transferTime}
              onChange={(e) => setTransferTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-apple-hairline bg-white text-sm text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40 focus:border-apple-primary"
              required
            />
          </div>
        </div>

        {/* Dropzone Area (Apple Smooth Surface) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-apple-ink">
            รูปภาพสลิปการโอนเงิน (Slip Image / PDF) *
          </label>

          {!file ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${dragActive
                  ? 'border-apple-primary bg-apple-primary/5'
                  : 'border-apple-hairline hover:border-apple-primary/50 hover:bg-apple-parchment/50'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              />
              <div className="w-12 h-12 rounded-full bg-apple-parchment text-apple-primary mx-auto flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-apple-ink">
                ลากไฟล์สลิปมาวางที่นี่ หรือ <span className="text-apple-primary">คลิกเพื่อเลือกไฟล์</span>
              </p>
              <p className="text-xs text-apple-ink-subtle mt-1">
                รองรับไฟล์ JPG, PNG, WEBP หรือ PDF ขนาดสูงสุด 10MB
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-apple-hairline bg-apple-parchment/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 overflow-hidden">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Slip Preview"
                    className="w-16 h-16 object-cover rounded-xl border border-apple-hairline shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-white border border-apple-hairline flex items-center justify-center text-apple-primary shrink-0">
                    <FileText className="w-8 h-8" />
                  </div>
                )}
                <div className="overflow-hidden">
                  <span className="text-xs font-semibold text-apple-ink truncate block">
                    {file.name}
                  </span>
                  <span className="text-[11px] text-apple-ink-subtle">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-apple-emerald font-medium mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>พร้อมส่งตรวจสอบ</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearFile}
                className="p-2 rounded-full text-apple-ink-subtle hover:bg-apple-parchment hover:text-apple-rose transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Note / Remark Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-apple-ink">
            หมายเหตุเพิ่มเติม (ถ้ามี เช่น ไซส์เสื้อ, ชื่อเล่น)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="เช่น เสื้อโปโล Size L / ชำระแทนเพื่อน"
            className="w-full px-3.5 py-2.5 rounded-2xl border border-apple-hairline bg-white text-sm text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40 focus:border-apple-primary"
          />
        </div>

        {/* PDPA & SLA Policy Notice */}
        <div className="p-3.5 rounded-2xl bg-apple-parchment border border-apple-hairline text-xs text-apple-ink-subtle space-y-1">
          <div className="flex items-center gap-1.5 text-apple-ink font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-apple-primary" />
            <span>นโยบายความคุ้มครองข้อมูล (PDPA) & มาตรฐานการตรวจสอบ</span>
          </div>
          <p className="leading-relaxed">
            ระบบจัดเก็บสลิปเพื่อวัตถุประสงค์ในการตรวจสอบการชำระเงินของภาควิชาเท่านั้น ข้อมูลจะถูกเก็บเป็นความลับและตรวจสอบความถูกต้องด้วยระบบแฮชป้องกันสลิปซ้ำ
          </p>
        </div>

        {/* Submit Button (Apple Pill Button) */}
        <button
          type="submit"
          disabled={isSubmitting || !file}
          className={`w-full py-3.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm ${isSubmitting || !file
              ? 'bg-[#d2d2d7] text-white cursor-not-allowed'
              : 'bg-apple-primary hover:bg-apple-primary-focus text-white btn-press'
            }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>กำลังส่งสลิปเข้าคิวตรวจ...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>ยืนยันการส่งสลิปตรวจสอบ (Submit Slip)</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
