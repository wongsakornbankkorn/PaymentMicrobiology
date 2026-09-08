'use client';

import React, { useState } from 'react';
import { UserPlus, X, Check, AlertCircle } from 'lucide-react';

export default function AddStudentModal({ isOpen, onClose, onAddStudent }) {
  const [formData, setFormData] = useState({
    student_id: '',
    name_th: '',
    name_en: '',
    cohort_year: 3,
    email: '',
    phone: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.student_id.trim() || !formData.name_th.trim()) {
      setError('กรุณากรอกรหัสนักศึกษา และชื่อ-นามสกุลภาษาไทย');
      return;
    }

    setIsLoading(true);
    setError(null);

    const sanitizedEmail = (formData.email && formData.email.trim() && formData.email.trim() !== '-')
      ? formData.email.trim()
      : '';

    try {
      await onAddStudent({
        student_id: formData.student_id.trim(),
        name_th: formData.name_th.trim(),
        name_en: formData.name_en.trim(),
        cohort_year: parseInt(formData.cohort_year, 10),
        email: sanitizedEmail,
        phone: formData.phone.trim()
      });

      // Reset form
      setFormData({
        student_id: '',
        name_th: '',
        name_en: '',
        cohort_year: 3,
        email: '',
        phone: ''
      });
      onClose();
    } catch (err) {
      setError(err.message || 'ไม่สามารถเพิ่มข้อมูลนักศึกษาได้');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-apple-hairline rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-apple-parchment hover:bg-gray-200 flex items-center justify-center text-apple-ink-subtle hover:text-apple-ink transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-apple-primary/10 text-apple-primary flex items-center justify-center shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-apple-ink">
              เพิ่มข้อมูลนักศึกษาใหม่
            </h2>
            <p className="text-xs text-apple-ink-subtle mt-0.5">
              บันทึกลงระบบฐานข้อมูล เพื่อให้สามารถตรวจสอบและชำระเงินค่าธรรมเนียมได้
            </p>
          </div>
        </div>


        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-apple-rose/10 border border-apple-rose/20 text-xs text-apple-rose flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student ID */}
            <div>
              <label className="block text-xs font-semibold text-apple-ink mb-1.5">
                รหัสนักศึกษา <span className="text-apple-rose">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น 6710210766"
                value={formData.student_id}
                onChange={(e) => handleChange('student_id', e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-apple-hairline bg-apple-parchment/50 text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40 font-mono"
              />
            </div>

            {/* Cohort Year */}
            <div>
              <label className="block text-xs font-semibold text-apple-ink mb-1.5">
                ชั้นปี <span className="text-apple-rose">*</span>
              </label>
              <select
                value={formData.cohort_year}
                onChange={(e) => handleChange('cohort_year', e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-apple-hairline bg-white text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40"
              >
                <option value={1}>ปี 1 (ชั้นปีที่ 1 - Freshman)</option>
                <option value={2}>ปี 2 (ชั้นปีที่ 2 - Sophomore)</option>
                <option value={3}>ปี 3 (ชั้นปีที่ 3 - Junior)</option>
                <option value={4}>ปี 4 (ชั้นปีที่ 4 - Senior)</option>
              </select>
            </div>
          </div>

          {/* Thai Name */}
          <div>
            <label className="block text-xs font-semibold text-apple-ink mb-1.5">
              ชื่อ - นามสกุล (ภาษาไทย) <span className="text-apple-rose">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น นายกิตติภูมิ พรหมวงศ์"
              value={formData.name_th}
              onChange={(e) => handleChange('name_th', e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-apple-hairline bg-apple-parchment/50 text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40"
            />
          </div>

          {/* English Name */}
          <div>
            <label className="block text-xs font-semibold text-apple-ink mb-1.5">
              ชื่อ - นามสกุล (ภาษาอังกฤษ)
            </label>
            <input
              type="text"
              placeholder="เช่น Kittiphum Promwong"
              value={formData.name_en}
              onChange={(e) => handleChange('name_en', e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-apple-hairline bg-apple-parchment/50 text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-apple-ink mb-1.5">
                อีเมล <span className="text-[11px] text-apple-ink-subtle font-normal">(ไม่บังคับ)</span>
              </label>
              <input
                type="text"
                placeholder="เช่น student@sci.psu.ac.th"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-apple-hairline bg-apple-parchment/50 text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-apple-ink mb-1.5">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                placeholder="081-234-5678"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-apple-hairline bg-apple-parchment/50 text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-apple-hairline">
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
              className="btn-pill-primary text-xs px-5 py-2 flex items-center gap-1.5"
            >
              {isLoading ? (
                <span>กำลังบันทึก...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>บันทึกข้อมูลนักศึกษา</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
