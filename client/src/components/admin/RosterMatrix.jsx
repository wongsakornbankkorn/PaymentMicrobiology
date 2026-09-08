'use client';

import React, { useState } from 'react';
import { 
  Search, Download, Mail, CheckCircle2, Clock, XCircle, UserPlus, 
  Users, Trash2, Info, ChevronDown, ChevronRight, LayoutList, Table2, 
  Filter, Check, Sparkles, FolderOpen, AlertCircle
} from 'lucide-react';

export default function RosterMatrix({
  rosterData,
  onSendReminder,
  onExportCsv,
  onOpenAddStudent,
  onDeleteStudent
}) {
  const [selectedCohort, setSelectedCohort] = useState('ALL');
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [remindingId, setRemindingId] = useState(null);
  
  // New Scalability & UX Controls
  const [viewMode, setViewMode] = useState('summary'); // 'summary' | 'matrix'
  const [selectedCampaignId, setSelectedCampaignId] = useState('ALL');
  const [expandedStudentIds, setExpandedStudentIds] = useState(new Set());

  const campaigns = rosterData?.campaigns || [];
  const students = rosterData?.roster || [];

  // Toggle single student accordion row
  const toggleExpandStudent = (id) => {
    setExpandedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Expand / Collapse all visible students
  const toggleExpandAll = () => {
    if (expandedStudentIds.size > 0) {
      setExpandedStudentIds(new Set());
    } else {
      setExpandedStudentIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  // Selected Campaign Details if filtering by specific campaign
  const activeCampaign = selectedCampaignId !== 'ALL' 
    ? campaigns.find(c => String(c.id) === String(selectedCampaignId)) 
    : null;

  // Filter students locally based on cohort, unpaidOnly, campaign, and search
  const filteredStudents = students.filter(student => {
    // Cohort filter
    if (selectedCohort !== 'ALL' && student.cohort_year !== parseInt(selectedCohort, 10)) {
      return false;
    }

    // Specific Campaign target cohort filter
    if (activeCampaign && activeCampaign.target_cohort !== 'ALL' && activeCampaign.target_cohort !== `YEAR_${student.cohort_year}`) {
      return false;
    }

    // Unpaid only filter
    if (unpaidOnly) {
      if (activeCampaign) {
        const cs = student.campaignStatuses?.find(c => c.campaign_id === activeCampaign.id);
        if (cs && cs.status === 'VERIFIED') return false;
      } else {
        if (student.balanceRemaining <= 0) return false;
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = student.student_id?.toLowerCase().includes(q);
      const matchName = student.name_th?.toLowerCase().includes(q) || student.name_en?.toLowerCase().includes(q);
      if (!matchId && !matchName) return false;
    }

    return true;
  });

  // Calculate quick statistics for active campaign view
  const campaignStats = React.useMemo(() => {
    if (!activeCampaign) return null;
    let verifiedCount = 0;
    let pendingCount = 0;
    let unpaidCount = 0;

    filteredStudents.forEach(student => {
      const cs = student.campaignStatuses?.find(c => c.campaign_id === activeCampaign.id);
      if (cs?.status === 'VERIFIED') verifiedCount++;
      else if (cs?.status === 'PENDING') pendingCount++;
      else unpaidCount++;
    });

    const totalEligible = filteredStudents.length;
    const progressRate = totalEligible > 0 ? Math.round((verifiedCount / totalEligible) * 100) : 0;
    const totalCollected = verifiedCount * parseFloat(activeCampaign.amount || 0);

    return { verifiedCount, pendingCount, unpaidCount, totalEligible, progressRate, totalCollected };
  }, [activeCampaign, filteredStudents]);

  const handleSendReminder = async (student) => {
    setRemindingId(student.student_id);
    try {
      const campaignTitle = activeCampaign ? activeCampaign.title : 'ค่าธรรมเนียมและกองทุนสาขาวิชาที่ค้างชำระ';
      await onSendReminder(student.student_id, campaignTitle);
    } finally {
      setRemindingId(null);
    }
  };

  const handleDelete = async (student) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูล "${student.name_th}" (${student.student_id}) ออกจากระบบ?`)) {
      if (onDeleteStudent) {
        await onDeleteStudent(student.id);
      }
    }
  };

  return (
    <div className="bg-white border border-apple-hairline rounded-3xl p-6 sm:p-8 shadow-apple-card space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-apple-parchment border border-apple-hairline text-xs font-semibold text-apple-primary mb-2">
            <span>ทะเบียนประวัติและบัญชีสาขาวิชา</span>
            <span>•</span>
            <span>{campaigns.length} รายการกิจกรรม</span>
          </div>
          <h2 className="text-xl font-display font-semibold text-apple-ink flex items-center gap-2">
            <span>บัญชีสถานะการชำระเงินนักศึกษา</span>
            <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-apple-parchment text-apple-ink-subtle border border-apple-hairline">
              {students.length} คน
            </span>
          </h2>
          <p className="text-sm text-apple-ink-subtle mt-0.5">
            ตรวจสอบยอดชำระรายบุคคล แยกตามกิจกรรม หรือคลี่ดูรายละเอียดได้อย่างสะดวกรวดเร็ว
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenAddStudent}
            className="btn-pill-primary text-xs py-2 px-4.5 flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ เพิ่มข้อมูลนักศึกษา</span>
          </button>

          <button
            onClick={onExportCsv}
            disabled={students.length === 0}
            className="btn-pill-secondary text-xs py-2 px-4 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออกรายงาน (CSV)</span>
          </button>
        </div>
      </div>

      {/* 2. Control Bar: View Switcher, Campaign Filter, Cohort, Search */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-apple-parchment/60 border border-apple-hairline">
        {/* Row A: View Switcher & Specific Campaign Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-apple-hairline/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-apple-ink shrink-0">รูปแบบการแสดงผล:</span>
            <div className="inline-flex items-center bg-white border border-apple-hairline rounded-full p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('summary')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  viewMode === 'summary'
                    ? 'bg-apple-primary text-white shadow-xs'
                    : 'text-apple-ink-subtle hover:text-apple-ink'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>มุมมองสรุปรายบุคคล (อ่านง่าย สบายตา)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  viewMode === 'matrix'
                    ? 'bg-apple-primary text-white shadow-xs'
                    : 'text-apple-ink-subtle hover:text-apple-ink'
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                <span>มุมมองตารางรวม (Matrix)</span>
              </button>
            </div>
          </div>

          {/* Campaign Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-apple-ink-subtle shrink-0">เลือกดูกิจกรรม:</span>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="px-3.5 py-1.5 text-xs rounded-full border border-apple-hairline bg-white text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40 font-medium shadow-xs cursor-pointer"
            >
              <option value="ALL">ดูกิจกรรมทั้งหมด ({campaigns.length} รายการ)</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} (฿{Number(c.amount).toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row B: Cohort Tabs, Unpaid Toggle & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Cohort Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {['ALL', '1', '2', '3', '4'].map(cohort => (
              <button
                key={cohort}
                onClick={() => setSelectedCohort(cohort)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedCohort === cohort
                    ? 'bg-apple-ink text-white shadow-xs'
                    : 'bg-white text-apple-ink-subtle hover:text-apple-ink border border-apple-hairline'
                }`}
              >
                {cohort === 'ALL' ? 'ทุกชั้นปี' : `ปี ${cohort}`}
              </button>
            ))}
          </div>

          {/* Search & Unpaid Only Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-apple-ink cursor-pointer select-none">
              <input
                type="checkbox"
                checked={unpaidOnly}
                onChange={(e) => setUnpaidOnly(e.target.checked)}
                className="rounded text-apple-primary focus:ring-apple-primary w-4 h-4"
              />
              <span>เฉพาะผู้ที่ค้างจ่าย (Unpaid)</span>
            </label>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-apple-ink-subtle" />
              <input
                type="text"
                placeholder="ค้นหารหัส หรือชื่อนักศึกษา..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 pr-4 py-1.5 text-xs rounded-full border border-apple-hairline bg-white text-apple-ink focus:outline-none focus:ring-2 focus:ring-apple-primary/40 w-full sm:w-56"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Campaign-Focused Spotlight Banner (When a specific campaign is selected) */}
      {activeCampaign && campaignStats && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-apple-primary/10 via-white to-apple-emerald/10 border border-apple-primary/20 shadow-xs space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-apple-primary">
                โฟกัสกิจกรรมที่เลือก
              </span>
              <h3 className="text-base font-display font-semibold text-apple-ink flex items-center gap-2">
                <span>{activeCampaign.title}</span>
                <span className="px-2 py-0.5 rounded-full bg-apple-primary text-white text-xs font-bold">
                  ฿{Number(activeCampaign.amount).toLocaleString()}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white border border-apple-hairline text-xs text-apple-ink-subtle">
                  {activeCampaign.target_cohort === 'ALL' ? 'นักศึกษาทุกชั้นปี' : `เฉพาะชั้นปีที่ ${activeCampaign.target_cohort.replace('YEAR_', '')}`}
                </span>
              </h3>
            </div>
            <button
              onClick={() => setSelectedCampaignId('ALL')}
              className="text-xs text-apple-primary hover:underline font-medium self-start sm:self-auto"
            >
              ← กลับไปดูกิจกรรมทั้งหมด
            </button>
          </div>

          {/* Quick Stat Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-white/80 border border-apple-hairline flex flex-col">
              <span className="text-apple-ink-subtle text-[11px]">ชำระแล้ว</span>
              <span className="text-base font-bold text-apple-emerald">
                {campaignStats.verifiedCount} / {campaignStats.totalEligible} คน
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 border border-apple-hairline flex flex-col">
              <span className="text-apple-ink-subtle text-[11px]">รอตรวจสอบสลิป</span>
              <span className="text-base font-bold text-apple-amber">
                {campaignStats.pendingCount} รายการ
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 border border-apple-hairline flex flex-col">
              <span className="text-apple-ink-subtle text-[11px]">ยังไม่ชำระ</span>
              <span className="text-base font-bold text-apple-rose">
                {campaignStats.unpaidCount} คน
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 border border-apple-hairline flex flex-col">
              <span className="text-apple-ink-subtle text-[11px]">ยอดเงินเข้ากองทุน</span>
              <span className="text-base font-bold text-apple-primary">
                ฿{campaignStats.totalCollected.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Empty State */}
      {students.length === 0 ? (
        <div className="py-16 px-4 text-center border-2 border-dashed border-apple-hairline rounded-3xl space-y-4">
          <div className="w-14 h-14 rounded-full bg-apple-primary/10 text-apple-primary mx-auto flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-display font-semibold text-apple-ink">
              ยังไม่มีข้อมูลนักศึกษาในระบบ (ฐานข้อมูลสะอาด 100%)
            </h3>
            <p className="text-xs text-apple-ink-subtle leading-relaxed">
              ตารางพร้อมสำหรับการทดลองใช้งานจริงแล้ว คุณสามารถกดปุ่มด้านล่างเพื่อเริ่มกรอกข้อมูลนักศึกษาแต่ละคนได้ทันที
            </p>
          </div>
          <button
            onClick={onOpenAddStudent}
            className="btn-pill-primary text-xs py-2.5 px-6 inline-flex items-center gap-2 shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ เพิ่มข้อมูลนักศึกษาคนแรก</span>
          </button>
        </div>
      ) : (
        /* 5. Main Table Display based on View Mode */
        <div className="space-y-3">
          {/* Sub-header Legend & Helper Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-apple-parchment/50 border border-apple-hairline text-xs text-apple-ink-subtle">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-apple-primary shrink-0" />
              <span>
                {viewMode === 'summary' ? (
                  <span>
                    <strong className="text-apple-ink font-medium">มุมมองสรุป:</strong> แสดงภาพรวมรายบุคคล คลิกที่แถวหรือปุ่ม <strong className="text-apple-primary font-medium">"ดูรายละเอียด"</strong> เพื่อคลี่ดูทุกกิจกรรม
                  </span>
                ) : (
                  <span>
                    <strong className="text-apple-ink font-medium">มุมมองตารางรวม:</strong> แสดงตารางกว้างแบบกระจายทุกกิจกรรม (สามารถเลื่อนแถบแนวนอนเพื่อตรวจดู)
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              {viewMode === 'summary' && (
                <button
                  type="button"
                  onClick={toggleExpandAll}
                  className="text-xs font-semibold text-apple-primary hover:underline"
                >
                  {expandedStudentIds.size > 0 ? 'ยุบรายละเอียดทั้งหมด' : 'คลี่ดูรายละเอียดทุกคน'}
                </button>
              )}
              <span className="inline-flex items-center gap-1 font-medium text-apple-emerald">
                <CheckCircle2 className="w-3 h-3" /> ชำระแล้ว
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-apple-amber">
                <Clock className="w-3 h-3" /> รอตรวจสลิป
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-apple-rose">
                <XCircle className="w-3 h-3" /> ไม่ผ่าน
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-[#a1a1a6]">
                <span className="font-bold text-xs">-</span> ยังไม่ชำระ
              </span>
            </div>
          </div>

          {/* =========================================================================
              VIEW MODE A: SUMMARY VIEW (Clean, Scalable, Fits perfectly on all screens)
             ========================================================================= */}
          {viewMode === 'summary' ? (
            <div className="overflow-hidden rounded-2xl border border-apple-hairline bg-white shadow-xs">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-apple-hairline text-xs font-semibold text-apple-ink-subtle bg-apple-parchment/40">
                    <th className="py-3.5 pl-4 w-12 text-center"></th>
                    <th className="py-3.5 px-3 w-32">รหัสนักศึกษา</th>
                    <th className="py-3.5 px-3 min-w-[180px]">ชื่อ - นามสกุล</th>
                    <th className="py-3.5 px-2 text-center w-20">ชั้นปี</th>
                    <th className="py-3.5 px-3 min-w-[170px]">สถานะกิจกรรมที่เกี่ยวข้อง</th>
                    <th className="py-3.5 px-3 text-right w-28">ยอดชำระแล้ว</th>
                    <th className="py-3.5 px-3 text-right w-28">ยอดคงค้าง</th>
                    <th className="py-3.5 pr-4 text-right w-36">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apple-hairline">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-apple-ink-subtle text-xs">
                        ไม่พบข้อมูลนักศึกษาตามเงื่อนไขที่ค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => {
                      const isExpanded = expandedStudentIds.has(student.id);

                      // Applicable campaigns for this specific student
                      const applicableCamps = campaigns.filter(c => 
                        c.target_cohort === 'ALL' || c.target_cohort === `YEAR_${student.cohort_year}`
                      );

                      const verifiedCount = student.campaignStatuses
                        ? student.campaignStatuses.filter(cs => {
                            const isApp = applicableCamps.some(ac => ac.id === cs.campaign_id);
                            return isApp && cs.status === 'VERIFIED';
                          }).length
                        : 0;

                      const pendingCount = student.campaignStatuses
                        ? student.campaignStatuses.filter(cs => {
                            const isApp = applicableCamps.some(ac => ac.id === cs.campaign_id);
                            return isApp && cs.status === 'PENDING';
                          }).length
                        : 0;

                      const totalEligible = applicableCamps.length;
                      const isFullyPaid = totalEligible > 0 && verifiedCount === totalEligible;

                      return (
                        <React.Fragment key={student.id}>
                          {/* Main Row */}
                          <tr 
                            onClick={() => toggleExpandStudent(student.id)}
                            className={`cursor-pointer transition-colors ${
                              isExpanded 
                                ? 'bg-apple-primary/5 hover:bg-apple-primary/8' 
                                : 'hover:bg-apple-parchment/30'
                            }`}
                          >
                            <td className="py-4 pl-4 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpandStudent(student.id);
                                }}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-apple-ink-subtle hover:text-apple-ink hover:bg-apple-hairline/60 transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-apple-primary" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                            </td>

                            <td className="py-4 px-3 font-mono text-xs font-semibold text-apple-ink whitespace-nowrap">
                              {student.student_id}
                            </td>

                            <td className="py-4 px-3 font-semibold text-apple-ink">
                              <div>{student.name_th}</div>
                              {student.name_en && (
                                <span className="text-[11px] font-normal text-apple-ink-subtle block">
                                  {student.name_en}
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-2 text-center text-xs">
                              <span className="px-2.5 py-0.5 rounded-full bg-apple-parchment text-apple-ink border border-apple-hairline font-medium text-[11px]">
                                ปี {student.cohort_year}
                              </span>
                            </td>

                            {/* Payment Progress Summary Pill */}
                            <td className="py-4 px-3">
                              {totalEligible === 0 ? (
                                <span className="text-xs text-[#a1a1a6] font-medium">-</span>
                              ) : isFullyPaid ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-apple-emerald/10 text-apple-emerald text-xs font-semibold border border-apple-emerald/20">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>ชำระครบ {verifiedCount}/{totalEligible} รายการ</span>
                                </span>
                              ) : verifiedCount > 0 || pendingCount > 0 ? (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-apple-ink">
                                      ชำระแล้ว {verifiedCount}/{totalEligible}
                                    </span>
                                    {pendingCount > 0 && (
                                      <span className="text-[10px] text-apple-amber font-medium flex items-center gap-0.5">
                                        <Clock className="w-2.5 h-2.5" /> รอตรวจ {pendingCount}
                                      </span>
                                    )}
                                  </div>
                                  <div className="w-28 bg-apple-parchment h-1.5 rounded-full overflow-hidden border border-apple-hairline">
                                    <div
                                      className="bg-apple-emerald h-full rounded-full transition-all"
                                      style={{ width: `${Math.round((verifiedCount / totalEligible) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-apple-parchment text-apple-ink-subtle text-[11px] border border-apple-hairline">
                                  <span>ยังไม่มีประวัติการจ่าย (0/{totalEligible})</span>
                                </span>
                              )}
                            </td>

                            {/* Total Paid */}
                            <td className="py-4 px-3 text-right">
                              {student.totalPaid > 0 ? (
                                <span className="font-display font-semibold text-apple-emerald text-xs">
                                  ฿{Number(student.totalPaid).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-xs text-[#a1a1a6] font-medium">-</span>
                              )}
                            </td>

                            {/* Outstanding Balance */}
                            <td className="py-4 px-3 text-right">
                              {student.balanceRemaining > 0 ? (
                                <span className="font-display font-semibold text-apple-rose text-xs">
                                  ฿{Number(student.balanceRemaining).toLocaleString()}
                                </span>
                              ) : student.totalPaid > 0 ? (
                                <span className="text-xs font-semibold text-apple-emerald">
                                  ครบถ้วน ✓
                                </span>
                              ) : (
                                <span className="text-xs text-[#a1a1a6] font-medium">-</span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td 
                              className="py-4 pr-4 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleExpandStudent(student.id)}
                                  className="text-xs font-medium text-apple-primary hover:bg-apple-primary/10 px-2.5 py-1 rounded-full border border-apple-primary/20 transition-colors"
                                  title="คลิกเพื่อคลี่ดูรายละเอียดกิจกรรม"
                                >
                                  <span>{isExpanded ? 'ปิด' : 'ดูกิจกรรม'}</span>
                                </button>

                                {student.balanceRemaining > 0 && (
                                  <button
                                    onClick={() => handleSendReminder(student)}
                                    disabled={remindingId === student.student_id}
                                    className="btn-pill-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1 shadow-none text-apple-primary hover:bg-apple-primary/10"
                                    title="ส่งอีเมลทวงถามยอดค้างชำระ"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">
                                      {remindingId === student.student_id ? 'ส่งแล้ว' : 'ส่งทวง'}
                                    </span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDelete(student)}
                                  className="p-1.5 rounded-full hover:bg-apple-rose/10 text-apple-ink-subtle hover:text-apple-rose transition-colors"
                                  title="ลบข้อมูลนักศึกษา"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Detail Row (Accordion Card List) */}
                          {isExpanded && (
                            <tr className="bg-apple-parchment/30 border-b border-apple-hairline">
                              <td colSpan={8} className="p-4 sm:p-5">
                                <div className="space-y-3 pl-8">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-apple-ink flex items-center gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5 text-apple-primary" />
                                      <span>รายการกิจกรรมและค่าธรรมเนียมของ {student.name_th} (ชั้นปีที่ {student.cohort_year})</span>
                                    </span>
                                    <span className="text-[11px] text-apple-ink-subtle">
                                      ทั้งหมด {applicableCamps.length} กิจกรรมที่เกี่ยวข้อง
                                    </span>
                                  </div>

                                  {applicableCamps.length === 0 ? (
                                    <p className="text-xs text-apple-ink-subtle italic py-2">
                                      ไม่มีรายการกิจกรรมที่เปิดรับสำหรับนักศึกษาชั้นปีนี้
                                    </p>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {applicableCamps.map(camp => {
                                        const statusObj = student.campaignStatuses?.find(cs => cs.campaign_id === camp.id);
                                        const status = statusObj?.status || 'UNPAID';

                                        return (
                                          <div
                                            key={camp.id}
                                            className={`p-3 rounded-2xl border transition-all ${
                                              status === 'VERIFIED'
                                                ? 'bg-apple-emerald/5 border-apple-emerald/30 shadow-xs'
                                                : status === 'PENDING'
                                                ? 'bg-apple-amber/5 border-apple-amber/30'
                                                : status === 'REJECTED'
                                                ? 'bg-apple-rose/5 border-apple-rose/30'
                                                : 'bg-white border-apple-hairline'
                                            }`}
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="space-y-1">
                                                <h4 className="text-xs font-semibold text-apple-ink line-clamp-1" title={camp.title}>
                                                  {camp.title}
                                                </h4>
                                                <div className="flex items-center gap-1.5 text-[11px]">
                                                  <span className="font-bold text-apple-primary">
                                                    ฿{Number(camp.amount).toLocaleString()}
                                                  </span>
                                                  <span className="text-apple-ink-subtle">•</span>
                                                  <span className="text-apple-ink-subtle">
                                                    {camp.target_cohort === 'ALL' ? 'ทุกปี' : `ปี ${camp.target_cohort.replace('YEAR_', '')}`}
                                                  </span>
                                                </div>
                                              </div>

                                              {/* Status Badge */}
                                              <div>
                                                {status === 'VERIFIED' && (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-apple-emerald/10 text-apple-emerald text-[11px] font-semibold border border-apple-emerald/20">
                                                    <CheckCircle2 className="w-3 h-3" /> ชำระแล้ว
                                                  </span>
                                                )}
                                                {status === 'PENDING' && (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-apple-amber/10 text-apple-amber text-[11px] font-semibold border border-apple-amber/20">
                                                    <Clock className="w-3 h-3" /> รอตรวจสลิป
                                                  </span>
                                                )}
                                                {status === 'REJECTED' && (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-apple-rose/10 text-apple-rose text-[11px] font-semibold border border-apple-rose/20">
                                                    <XCircle className="w-3 h-3" /> ไม่ผ่าน
                                                  </span>
                                                )}
                                                {status === 'UNPAID' && (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-apple-parchment text-[#a1a1a6] text-[11px] font-medium border border-apple-hairline">
                                                    <span>ยังไม่ชำระ</span>
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* =========================================================================
                VIEW MODE B: FULL MATRIX GRID (With Sticky Columns & Rich Headers)
               ========================================================================= */
            <div className="overflow-x-auto rounded-2xl border border-apple-hairline bg-white shadow-xs">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-apple-hairline text-xs font-semibold text-apple-ink-subtle bg-apple-parchment/40">
                    <th className="py-3.5 pl-3 w-28 whitespace-nowrap sticky left-0 bg-apple-parchment z-10 border-r border-apple-hairline/60">
                      รหัสนักศึกษา
                    </th>
                    <th className="py-3.5 px-3 min-w-[160px] sticky left-28 bg-apple-parchment z-10 border-r border-apple-hairline/60 shadow-xs">
                      ชื่อ - นามสกุล
                    </th>
                    <th className="py-3.5 px-2 text-center w-16">ชั้นปี</th>

                    {/* Filtered campaigns or all campaigns */}
                    {(activeCampaign ? [activeCampaign] : campaigns).map(c => (
                      <th
                        key={c.id}
                        className="py-3.5 px-2 text-center min-w-[130px] max-w-[180px]"
                        title={`${c.title} • ค่าธรรมเนียม: ฿${Number(c.amount).toLocaleString()} (${c.target_cohort === 'ALL' ? 'ทุกชั้นปี' : 'เฉพาะปี ' + c.target_cohort.replace('YEAR_', '')})`}
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="font-semibold text-apple-ink text-xs line-clamp-1 max-w-[150px] text-center" title={c.title}>
                            {c.title}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-apple-primary bg-apple-primary/10 px-1.5 py-0.5 rounded text-[11px] leading-none">
                              ฿{Number(c.amount).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-apple-ink-subtle bg-white border border-apple-hairline px-1 py-0.5 rounded leading-none">
                              {c.target_cohort === 'ALL' ? 'ทุกปี' : `ปี ${c.target_cohort.replace('YEAR_', '')}`}
                            </span>
                          </div>
                        </div>
                      </th>
                    ))}

                    <th className="py-3.5 px-3 text-right w-28 whitespace-nowrap sticky right-24 bg-apple-parchment z-10 border-l border-apple-hairline/60">
                      ยอดคงค้าง
                    </th>
                    <th className="py-3.5 pr-3 text-right w-24 whitespace-nowrap sticky right-0 bg-apple-parchment z-10 border-l border-apple-hairline/60">
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-apple-hairline">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5 + (activeCampaign ? 1 : campaigns.length)} className="text-center py-10 text-apple-ink-subtle text-xs">
                        ไม่พบข้อมูลนักศึกษาตามเงื่อนไขที่ค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-apple-parchment/30 transition-colors">
                        <td className="py-4 pl-3 font-mono text-xs font-semibold text-apple-ink whitespace-nowrap sticky left-0 bg-white border-r border-apple-hairline/40">
                          {student.student_id}
                        </td>

                        <td className="py-4 px-3 font-semibold text-apple-ink sticky left-28 bg-white border-r border-apple-hairline/40 shadow-xs">
                          <div>{student.name_th}</div>
                          {student.name_en && (
                            <span className="text-[11px] font-normal text-apple-ink-subtle block">
                              {student.name_en}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-2 text-center text-xs">
                          <span className="px-2 py-0.5 rounded-full bg-apple-parchment text-apple-ink border border-apple-hairline font-medium text-[11px]">
                            ปี {student.cohort_year}
                          </span>
                        </td>

                        {/* Campaign Columns */}
                        {(activeCampaign ? [activeCampaign] : campaigns).map(camp => {
                          const statusObj = student.campaignStatuses?.find(cs => cs.campaign_id === camp.id);
                          const status = statusObj?.status || 'UNPAID';
                          const isApplicable = camp.target_cohort === 'ALL' || camp.target_cohort === `YEAR_${student.cohort_year}`;

                          return (
                            <td key={camp.id} className="py-4 px-2 text-center">
                              {status === 'VERIFIED' && (
                                <span
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-apple-emerald/10 text-apple-emerald mx-auto cursor-help"
                                  title={`${camp.title} (฿${Number(camp.amount).toLocaleString()}): ชำระเงินเรียบร้อยแล้ว ✓`}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </span>
                              )}
                              {status === 'PENDING' && (
                                <span
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-apple-amber/10 text-apple-amber mx-auto cursor-help"
                                  title={`${camp.title} (฿${Number(camp.amount).toLocaleString()}): ส่งสลิปแล้ว กำลังรอเหรัญญิกตรวจสอบ`}
                                >
                                  <Clock className="w-4 h-4" />
                                </span>
                              )}
                              {status === 'REJECTED' && (
                                <span
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-apple-rose/10 text-apple-rose mx-auto cursor-help"
                                  title={`${camp.title} (฿${Number(camp.amount).toLocaleString()}): สลิปไม่ผ่านการตรวจสอบ`}
                                >
                                  <XCircle className="w-4 h-4" />
                                </span>
                              )}
                              {status === 'UNPAID' && (
                                <span
                                  className="text-xs font-medium text-[#a1a1a6] cursor-help inline-block px-1"
                                  title={
                                    isApplicable
                                      ? `${camp.title} (฿${Number(camp.amount).toLocaleString()}): ยังไม่ชำระ`
                                      : `${camp.title}: เฉพาะ${camp.target_cohort === 'ALL' ? 'ทุกชั้นปี' : 'ปี ' + camp.target_cohort.replace('YEAR_', '')} (ไม่เกี่ยวกับปี ${student.cohort_year})`
                                  }
                                >
                                  -
                                </span>
                              )}
                            </td>
                          );
                        })}

                        <td className="py-4 px-3 text-right sticky right-24 bg-white border-l border-apple-hairline/40">
                          {student.balanceRemaining > 0 ? (
                            <span className="font-display font-semibold text-apple-rose text-xs">
                              ฿{Number(student.balanceRemaining).toLocaleString()}
                            </span>
                          ) : student.totalPaid > 0 ? (
                            <span className="text-xs font-semibold text-apple-emerald">
                              ครบถ้วน ✓
                            </span>
                          ) : (
                            <span className="text-xs text-[#a1a1a6] font-medium">-</span>
                          )}
                        </td>

                        <td className="py-4 pr-3 text-right sticky right-0 bg-white border-l border-apple-hairline/40">
                          <div className="flex items-center justify-end gap-1.5">
                            {student.balanceRemaining > 0 ? (
                              <button
                                onClick={() => handleSendReminder(student)}
                                disabled={remindingId === student.student_id}
                                className="btn-pill-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1 shadow-none text-apple-primary hover:bg-apple-primary/10"
                                title="ส่งอีเมลทวงถามยอดค้างชำระ"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">
                                  {remindingId === student.student_id ? 'ส่งแล้ว' : 'ส่งทวง'}
                                </span>
                              </button>
                            ) : (
                              <span className="text-xs text-[#a1a1a6] font-medium px-2">-</span>
                            )}
                            <button
                              onClick={() => handleDelete(student)}
                              className="p-1.5 rounded-full hover:bg-apple-rose/10 text-apple-ink-subtle hover:text-apple-rose transition-colors"
                              title="ลบข้อมูลนักศึกษา"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
