'use client';

import React, { useState } from 'react';
import { X, PlusCircle, Calendar, Tag, AlertCircle } from 'lucide-react';

export default function CreateCampaignModal({ isOpen, onClose, onCreateCampaign }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('T-Shirt');
  const [amount, setAmount] = useState('');
  const [targetCohort, setTargetCohort] = useState('ALL');
  const [dueDate, setDueDate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount || !dueDate) {
      setErrorMsg('กรุณากรอกชื่อกิจกรรม จำนวนเงิน และวันครบกำหนดชำระ');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onCreateCampaign({
        title,
        description,
        category,
        amount: parseFloat(amount),
        target_cohort: targetCohort,
        due_date: dueDate
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสร้างรายการ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-apple-hairline rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-apple-hairline">
          <div>
            <h3 className="text-xl font-display font-semibold text-apple-ink">
              สร้างรายการเก็บเงินใหม่ (New Campaign)
            </h3>
            <p className="text-xs text-apple-ink-subtle mt-0.5">
              กำหนดค่าธรรมเนียม เป้าหมายชั้นปี และวันสิ้นสุดการรับชำระ
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-apple-ink hover:bg-apple-parchment transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-apple-rose/10 border border-apple-rose/20 text-apple-rose text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-apple-ink">ชื่อกิจกรรม / รายการค่าธรรมเนียม *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ค่าเสื้อกาวน์ปฏิบัติการ หรือ กิจกรรมรับน้องสาขา"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-apple-hairline bg-white text-sm text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-apple-ink">หมวดหมู่กิจกรรม *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-apple-hairline bg-white text-sm text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40"
              >
                <option value="T-Shirt">เสื้อและของที่ระลึก (T-Shirt)</option>
                <option value="Annual Fee">ค่าบำรุงสาขาวิชา (Annual Fee)</option>
                <option value="Camp">ค่ายและกิจกรรมวิชาการ (Camp)</option>
                <option value="Seminar">สัมมนาและอบรม (Seminar)</option>
                <option value="Sports">กีฬาและนันทนาการ (Sports)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-apple-ink">จำนวนเงินต่อคน (บาท) *</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="เช่น 350"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-apple-hairline bg-white text-sm font-semibold text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-apple-ink">กลุ่มเป้าหมาย (Cohort) *</label>
              <select
                value={targetCohort}
                onChange={(e) => setTargetCohort(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-apple-hairline bg-white text-sm text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40"
              >
                <option value="ALL">นักศึกษาทุกชั้นปี (Year 1 - 4)</option>
                <option value="YEAR_1">เฉพาะชั้นปีที่ 1 (Freshmen)</option>
                <option value="YEAR_2">เฉพาะชั้นปีที่ 2 (Sophomore)</option>
                <option value="YEAR_3">เฉพาะชั้นปีที่ 3 (Junior)</option>
                <option value="YEAR_4">เฉพาะชั้นปีที่ 4 (Senior)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-apple-ink">วันครบกำหนดชำระ *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-apple-hairline bg-white text-sm text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-apple-ink">รายละเอียดเพิ่มเติม</label>
            <textarea
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="รายละเอียดของกิจกรรม หรือคำแนะนำในการส่งสลิป..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-apple-hairline bg-white text-sm text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-pill-secondary text-xs"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-pill-primary text-xs flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรายการ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
