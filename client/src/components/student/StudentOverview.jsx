'use client';

import React, { useState } from 'react';
import { 
  CreditCard, CheckCircle2, AlertTriangle, ArrowUpRight, Calendar, 
  Sparkles, Clock, FileText, Check, ShieldCheck 
} from 'lucide-react';

export default function StudentOverview({ 
  student, 
  summary, 
  campaigns = [], 
  transactions = [], 
  onSelectPayCampaign,
  onViewReceipt
}) {
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'UNPAID' | 'PAID'

  const formattedOutstanding = Number(summary?.totalOutstanding || 0).toLocaleString();
  const formattedPaid = Number(summary?.totalPaid || 0).toLocaleString();
  const formattedOverdue = Number(summary?.overdueBalance || 0).toLocaleString();

  // Filter campaigns strictly for this student's cohort year
  const studentCohort = student?.cohort_year;
  const eligibleCampaigns = campaigns.filter(camp => {
    if (!camp.target_cohort || camp.target_cohort === 'ALL') return true;
    if (studentCohort && camp.target_cohort === `YEAR_${studentCohort}`) return true;
    return false;
  });

  // Calculate campaign statuses with respect to this student
  const campaignsWithStatus = eligibleCampaigns.map(camp => {
    const txn = transactions.find(t => t.campaign_id === camp.id && t.verification_status === 'VERIFIED')
             || transactions.find(t => t.campaign_id === camp.id && t.verification_status === 'PENDING')
             || transactions.find(t => t.campaign_id === camp.id && t.verification_status === 'REJECTED');

    const isVerified = txn?.verification_status === 'VERIFIED';
    const isPending = txn?.verification_status === 'PENDING';
    const isRejected = txn?.verification_status === 'REJECTED';
    const isUnpaid = !txn || isRejected;

    // A campaign is ONLY overdue if it is NOT yet paid/verified AND the due date has passed
    const isOverdue = isUnpaid && camp.due_date && new Date(camp.due_date) < new Date();

    const formattedDate = camp.due_date
      ? new Date(camp.due_date).toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      : 'ไม่ระบุ';

    const categoryLabel = {
      'Annual Fee': 'ค่าบำรุงประจำปี',
      'T-Shirt': 'เสื้อกิจกรรม/กาวน์',
      'Camp': 'ค่ายวิชาการ',
      'Seminar': 'สัมมนา',
      'Other': 'กิจกรรมทั่วไป'
    }[camp.category] || camp.category;

    return {
      ...camp,
      txn,
      isVerified,
      isPending,
      isRejected,
      isUnpaid,
      isOverdue,
      formattedDate,
      categoryLabel
    };
  });

  // Filter list by tab
  const displayedCampaigns = campaignsWithStatus.filter(camp => {
    if (filterTab === 'UNPAID') return camp.isUnpaid || camp.isPending;
    if (filterTab === 'PAID') return camp.isVerified;
    return true;
  });

  const paidCount = campaignsWithStatus.filter(c => c.isVerified).length;
  const unpaidCount = campaignsWithStatus.filter(c => c.isUnpaid).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Student Identity Banner (Apple Surface Tile) */}
      <div className="bg-white border border-apple-hairline rounded-3xl p-6 sm:p-8 shadow-apple-card relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-apple-parchment border border-apple-hairline text-xs font-medium text-apple-ink-subtle">
              <span>รหัสนักศึกษา: <strong className="text-apple-ink">{student?.student_id || '6710210766'}</strong></span>
              <span>•</span>
              <span className="text-apple-emerald font-semibold">สถานะ: กำลังศึกษา (Enrolled)</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-display text-apple-ink tracking-tight font-semibold">
              {student ? `สวัสดี, ${student.name_th}` : 'ยินดีต้อนรับสู่ระบบเช็คการชำระเงิน'}
            </h1>
            <p className="text-apple-ink-subtle text-sm">
              {student ? `${student.department || 'สาขาจุลชีววิทยา คณะวิทยาศาสตร์ ม.อ.'} • ชั้นปีที่ ${student.cohort_year}` : 'สาขาจุลชีววิทยา คณะวิทยาศาสตร์ มหาวิทยาลัยสงขลานครินทร์'}
            </p>
          </div>

          {student ? (
            <button
              onClick={() => onSelectPayCampaign(null)}
              className="btn-pill-primary self-start md:self-center shadow-sm"
            >
              <span>ชำระเงินค่ากิจกรรม</span>
              <ArrowUpRight className="w-4 h-4 ml-1.5" />
            </button>
          ) : (
            <div className="text-xs text-apple-ink-subtle px-4 py-2 rounded-2xl bg-apple-parchment border border-apple-hairline">
              เข้าสู่ระบบ Admin เพื่อเพิ่มนักศึกษา
            </div>
          )}
        </div>
      </div>

      {/* Financial Health Cards Grid (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Total Outstanding */}
        <div className="bg-white border border-apple-hairline rounded-3xl p-6 shadow-apple-card flex flex-col justify-between hover:border-[#b0b0b8] transition-colors">
          <div className="flex items-center justify-between text-apple-ink-subtle text-sm font-medium">
            <span>ยอดค้างชำระทั้งหมด</span>
            <div className="w-9 h-9 rounded-full bg-apple-primary/10 text-apple-primary flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-display font-semibold text-apple-ink">
              ฿{formattedOutstanding}
            </div>
            <p className="text-xs text-apple-ink-subtle mt-1.5 flex items-center gap-1">
              จากค่าธรรมเนียมและกิจกรรมเฉพาะชั้นปีที่ {student?.cohort_year || 1}
            </p>
          </div>
        </div>

        {/* 2. Total Paid */}
        <div className="bg-white border border-apple-hairline rounded-3xl p-6 shadow-apple-card flex flex-col justify-between hover:border-[#b0b0b8] transition-colors">
          <div className="flex items-center justify-between text-apple-ink-subtle text-sm font-medium">
            <span>ชำระเรียบร้อยแล้ว</span>
            <div className="w-9 h-9 rounded-full bg-apple-emerald/10 text-apple-emerald flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-display font-semibold text-apple-emerald">
              ฿{formattedPaid}
            </div>
            <p className="text-xs text-apple-ink-subtle mt-1.5">
              ผ่านการตรวจสอบและออกใบเสร็จแล้ว ({paidCount} รายการ)
            </p>
          </div>
        </div>

        {/* 3. Overdue Balance */}
        <div className="bg-white border border-apple-hairline rounded-3xl p-6 shadow-apple-card flex flex-col justify-between hover:border-[#b0b0b8] transition-colors">
          <div className="flex items-center justify-between text-apple-ink-subtle text-sm font-medium">
            <span>ยอดเกินกำหนดชำระ</span>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
              summary?.overdueBalance > 0
                ? 'bg-apple-rose/10 text-apple-rose'
                : 'bg-apple-parchment text-apple-ink-subtle'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-3xl sm:text-4xl font-display font-semibold ${
              summary?.overdueBalance > 0 ? 'text-apple-rose' : 'text-apple-ink'
            }`}>
              ฿{formattedOverdue}
            </div>
            <p className="text-xs text-apple-ink-subtle mt-1.5">
              {summary?.overdueBalance > 0 ? 'กรุณาชำระโดยด่วนเพื่อรักษาสิทธิ์' : 'ไม่มีรายการที่เกินกำหนดชำระ'}
            </p>
          </div>
        </div>
      </div>

      {/* Active Campaigns List (รายการที่ต้องชำระ) */}
      <div className="bg-white border border-apple-hairline rounded-3xl p-6 sm:p-8 shadow-apple-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-display font-semibold text-apple-ink flex items-center gap-2">
              <span>รายการกิจกรรมและค่าธรรมเนียมสำหรับชั้นปีที่ {student?.cohort_year || 1}</span>
            </h2>
            <p className="text-sm text-apple-ink-subtle mt-0.5">
              เลือกรายการเพื่อชำระเงินผ่าน PromptPay QR หรือดูใบเสร็จดิจิทัล
            </p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center bg-apple-parchment p-1 rounded-full border border-apple-hairline self-start sm:self-center">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filterTab === 'ALL'
                  ? 'bg-apple-ink text-white shadow-xs'
                  : 'text-apple-ink-subtle hover:text-apple-ink'
              }`}
            >
              ทั้งหมด ({campaignsWithStatus.length})
            </button>
            <button
              onClick={() => setFilterTab('UNPAID')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filterTab === 'UNPAID'
                  ? 'bg-apple-ink text-white shadow-xs'
                  : 'text-apple-ink-subtle hover:text-apple-ink'
              }`}
            >
              ต้องชำระ ({unpaidCount})
            </button>
            <button
              onClick={() => setFilterTab('PAID')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filterTab === 'PAID'
                  ? 'bg-apple-ink text-white shadow-xs'
                  : 'text-apple-ink-subtle hover:text-apple-ink'
              }`}
            >
              ชำระแล้ว ({paidCount})
            </button>
          </div>
        </div>

        {displayedCampaigns.length === 0 ? (
          <div className="text-center py-12 text-apple-ink-subtle space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-apple-emerald/50 mb-1" />
            <p className="text-sm font-medium text-apple-ink">ไม่มีรายการในหมวดหมู่นี้</p>
            <p className="text-xs">รายการกิจกรรมทั้งหมดได้รับการจัดการเรียบร้อยแล้ว</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedCampaigns.map(camp => {
              return (
                <div
                  key={camp.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                    camp.isVerified
                      ? 'border-apple-emerald/30 bg-apple-emerald/[0.02] hover:bg-apple-emerald/[0.04]'
                      : camp.isPending
                      ? 'border-apple-amber/30 bg-apple-amber/[0.02]'
                      : camp.isOverdue
                      ? 'border-apple-rose/30 bg-apple-rose/[0.02] hover:bg-apple-rose/[0.05]'
                      : 'border-apple-hairline bg-apple-parchment/40 hover:bg-apple-parchment/80'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-apple-primary/10 text-apple-primary">
                          {camp.categoryLabel}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-apple-parchment text-apple-ink-subtle border border-apple-hairline">
                          {camp.target_cohort === 'ALL' ? 'ทุกชั้นปี' : `เฉพาะปี ${camp.target_cohort.replace('YEAR_', '')}`}
                        </span>
                      </div>

                      {/* Top Right Status Badge */}
                      {camp.isVerified && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-apple-emerald/10 text-apple-emerald flex items-center gap-1 border border-apple-emerald/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ชำระแล้ว</span>
                        </span>
                      )}
                      {camp.isPending && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-apple-amber/10 text-apple-amber flex items-center gap-1 border border-apple-amber/20">
                          <Clock className="w-3 h-3" />
                          <span>รอตรวจสลิป</span>
                        </span>
                      )}
                      {camp.isOverdue && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-apple-rose/10 text-apple-rose shrink-0 border border-apple-rose/20">
                          เกินกำหนด
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-semibold text-apple-ink text-base">
                        {camp.title}
                      </h3>
                      <p className="text-xs text-apple-ink-subtle leading-relaxed line-clamp-2">
                        {camp.description}
                      </p>
                    </div>

                    {/* Due Date or Verified Date */}
                    <div className="pt-1">
                      {camp.isVerified ? (
                        <span className="text-xs text-apple-emerald font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>ชำระเรียบร้อยแล้วและออกใบเสร็จแล้ว</span>
                        </span>
                      ) : camp.isPending ? (
                        <span className="text-xs text-apple-amber font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>ส่งสลิปแล้ว อยู่ในคิวตรวจสอบของเหรัญญิก</span>
                        </span>
                      ) : (
                        <span className={`text-xs flex items-center gap-1 font-medium ${
                          camp.isOverdue ? 'text-apple-rose' : 'text-apple-ink-subtle'
                        }`}>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{camp.isOverdue ? `เลยกำหนดชำระ: ${camp.formattedDate}` : `กำหนดชำระ: ${camp.formattedDate}`}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-apple-hairline">
                    <div>
                      <span className="text-xs text-apple-ink-subtle block">จำนวนเงิน</span>
                      <span className="text-xl font-display font-semibold text-apple-ink">
                        ฿{Number(camp.amount).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      {camp.isVerified ? (
                        <button
                          type="button"
                          onClick={() => onViewReceipt && camp.txn?.id && onViewReceipt(camp.txn.id)}
                          className="btn-pill-secondary text-xs py-2 px-3.5 inline-flex items-center gap-1.5 text-apple-emerald hover:bg-apple-emerald/5 border-apple-emerald/30 shadow-none"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>ดูใบเสร็จ</span>
                        </button>
                      ) : camp.isPending ? (
                        <button
                          type="button"
                          disabled
                          className="btn-pill-secondary text-xs py-2 px-3.5 inline-flex items-center gap-1.5 text-apple-amber border-apple-amber/30 opacity-80 cursor-not-allowed shadow-none"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>รอตรวจสอบ</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectPayCampaign(camp)}
                          className="btn-pill-primary text-xs py-2 px-4 shadow-sm"
                        >
                          <span>ชำระรายการนี้</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Community & Student Life Showcase (Apple Glassmorphism Banner) */}
      <div className="relative overflow-hidden rounded-3xl border border-apple-hairline bg-white shadow-apple-card group">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-5 p-6 sm:p-8 sm:py-10 space-y-4 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-apple-primary/10 text-apple-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>มิตรภาพและกิจกรรมสาขาวิชา</span>
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-display font-semibold text-apple-ink tracking-tight">
                ร่วมสร้างความทรงจำที่อบอุ่นไปด้วยกัน
              </h3>
              <p className="text-xs sm:text-sm text-apple-ink-subtle leading-relaxed">
                ทุกการชำระค่าธรรมเนียมและค่ากิจกรรม คือพลังสำคัญในการขับเคลื่อนกิจกรรมรับน้อง ค่ายวิชาการ เสื้อกาวน์ปฏิบัติการ และเสริมสร้างความผูกพันของพวกเราชาวจุลชีววิทยา ม.อ.
              </p>
            </div>

            <div className="pt-2 border-t border-apple-hairline/60 flex items-center justify-between text-xs text-apple-ink-subtle">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-apple-emerald animate-pulse" />
                <span className="font-medium text-apple-ink">Microbiology PSU Community</span>
              </div>
              <span className="text-[11px]">ภาควิชาจุลชีววิทยา</span>
            </div>
          </div>
          
          <div className="lg:col-span-7 relative h-64 sm:h-72 lg:h-80 overflow-hidden bg-apple-parchment">
            <img
              src="/images/student-community.jpg"
              alt="Microbiology PSU Student Community"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            {/* Soft Gradient Overlay for Smooth Edge Blending */}
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-white via-white/20 to-transparent opacity-90 lg:opacity-100 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
