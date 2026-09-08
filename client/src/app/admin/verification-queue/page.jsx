'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { supabaseApi } from '../../../services/supabaseApi';
import { exportLedgerToCSV } from '../../../utils/exportLedger';
import Toast from '../../../components/common/Toast';

import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ChevronRight,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Download,
  Filter,
  User,
  GraduationCap,
  Sparkles,
  LogOut,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';

const REJECTION_REASONS = [
  'ยอดเงินโอนไม่ตรงกับค่าธรรมเนียมที่ระบุ (Mismatched Amount)',
  'รูปภาพสลิปไม่ชัดเจน / ข้อมูลวันที่เวลาไม่สามารถอ่านได้ (Blurry / Unreadable)',
  'สลิปการโอนซ้ำกับในระบบ หรือเคยส่งแล้ว (Duplicate Slip)',
  'บัญชีปลายทางไม่ใช่บัญชีทางการของภาควิชา (Incorrect Beneficiary Account)',
  'ไม่พบรายการเดินบัญชีตรงกับเวลาที่ระบุ (Transaction Not Found)',
];

export default function AdminVerificationPage() {
  const router = useRouter();
  const { user, profile, role, loading, signOut } = useAuth();

  const [mainTab, setMainTab] = useState('queue'); // 'queue' | 'ledger'
  const [transactions, setTransactions] = useState([]);
  const [filterStatus, setFilterStatus] = useState('PENDING'); // PENDING | ALL | APPROVED | REJECTED
  const [selectedTxnId, setSelectedTxnId] = useState(null);

  // Zoom & Pan state for slip preview
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Rejection modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Ledger state
  const [ledgerStudents, setLedgerStudents] = useState([]);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerCohortFilter, setLedgerCohortFilter] = useState('ALL');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState('ALL');

  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Route protection
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (role !== 'ADMIN') {
        router.replace('/student/dashboard');
      }
    }
  }, [user, role, loading, router]);

  // Load Queue & Ledger data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [queueData, ledgerData] = await Promise.all([
        supabaseApi.getVerificationQueue(filterStatus),
        supabaseApi.getStudentLedger(),
      ]);
      setTransactions(queueData || []);
      setLedgerStudents(ledgerData || []);
      if (queueData && queueData.length > 0 && !selectedTxnId) {
        setSelectedTxnId(queueData[0].id);
      }
    } catch (err) {
      console.error('Admin data fetch error:', err);
      showToast('ไม่สามารถโหลดข้อมูลคิวได้', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, selectedTxnId]);

  useEffect(() => {
    if (role === 'ADMIN') {
      loadData();
    }
  }, [role, loadData]);

  // Reset zoom whenever active slip changes
  useEffect(() => {
    setZoomLevel(1);
    setRotation(0);
  }, [selectedTxnId]);

  // Active Transaction for Split-View
  const filteredTransactions = transactions.filter((t) => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  const activeTxn =
    filteredTransactions.find((t) => t.id === selectedTxnId) ||
    filteredTransactions[0] ||
    null;

  // Approve Transaction
  const handleApprove = async (txnId) => {
    setIsProcessing(true);
    try {
      await supabaseApi.verifyTransaction({
        transactionId: txnId,
        status: 'APPROVED',
        adminId: profile?.id,
      });

      showToast('อนุมัติสลิปการโอนเงินเรียบร้อยแล้ว', 'success');
      await loadData();
    } catch (err) {
      showToast(err.message || 'อนุมัติล้มเหลว', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject Transaction
  const handleConfirmReject = async () => {
    if (!activeTxn) return;
    setIsProcessing(true);
    try {
      const reason =
        rejectionReason === 'OTHER' ? customReason : rejectionReason;

      await supabaseApi.verifyTransaction({
        transactionId: activeTxn.id,
        status: 'REJECTED',
        rejectReason: reason,
        adminId: profile?.id,
      });

      showToast('ปฏิเสธสลิปการโอนเงินและบันทึกเหตุผลเรียบร้อย', 'info');
      setIsRejectModalOpen(false);
      setCustomReason('');
      await loadData();
    } catch (err) {
      showToast(err.message || 'ปฏิเสธรายการล้มเหลว', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered Ledger Students
  const filteredLedger = ledgerStudents.filter((s) => {
    const matchesSearch =
      !ledgerSearch ||
      (s.student_id && s.student_id.includes(ledgerSearch)) ||
      (s.full_name && s.full_name.toLowerCase().includes(ledgerSearch.toLowerCase()));

    const matchesCohort =
      ledgerCohortFilter === 'ALL' ||
      String(s.cohort_year) === String(ledgerCohortFilter);

    let matchesStatus = true;
    if (ledgerStatusFilter === 'PAID') {
      matchesStatus = s.balanceRemaining === 0 && s.totalPaid > 0;
    } else if (ledgerStatusFilter === 'PENDING') {
      matchesStatus = s.hasPending;
    } else if (ledgerStatusFilter === 'UNPAID') {
      matchesStatus = s.balanceRemaining > 0;
    }

    return matchesSearch && matchesCohort && matchesStatus;
  });

  if (loading || (user && role !== 'ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-400">
            กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 overflow-x-hidden">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/85 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">
                ศูนย์จัดการและตรวจสอบเหรัญญิก (Admin Portal)
              </h1>
              <p className="text-xs text-slate-400">
                สาขาวิชาจุลชีววิทยา คณะวิทยาศาสตร์ ม.สงขลานครินทร์
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-slate-300">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>{profile?.full_name || 'เหรัญญิกภาควิชา'}</span>
              <span className="text-emerald-400 font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-[10px]">
                ADMIN
              </span>
            </div>

            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMainTab('queue')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                mainTab === 'queue'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>
                คิวตรวจสอบสลิป (
                {transactions.filter((t) => t.status === 'PENDING').length})
              </span>
            </button>
            <button
              onClick={() => setMainTab('ledger')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                mainTab === 'ledger'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ทะเบียนคุมยอดรายบุคคล (Student Ledger)</span>
            </button>
          </div>

          {mainTab === 'ledger' && (
            <button
              onClick={() => exportLedgerToCSV(filteredLedger)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก CSV (Excel)</span>
            </button>
          )}
        </div>

        {/* TAB 1: VERIFICATION QUEUE */}
        {mainTab === 'queue' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 self-start">
              <button
                onClick={() => setFilterStatus('PENDING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === 'PENDING'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                รอตรวจสอบ (
                {transactions.filter((t) => t.status === 'PENDING').length})
              </button>
              <button
                onClick={() => setFilterStatus('APPROVED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === 'APPROVED'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                อนุมัติแล้ว (
                {transactions.filter((t) => t.status === 'APPROVED').length})
              </button>
              <button
                onClick={() => setFilterStatus('REJECTED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === 'REJECTED'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ปฏิเสธ (
                {transactions.filter((t) => t.status === 'REJECTED').length})
              </button>
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === 'ALL'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ทั้งหมด ({transactions.length})
              </button>
            </div>

            {/* Split View Content */}
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/80 backdrop-blur-md border border-slate-800 space-y-3 shadow-xl">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-70" />
                <h3 className="text-lg font-bold text-white">
                  ไม่มีรายการค้างในสถานะนี้
                </h3>
                <p className="text-sm text-slate-400">
                  สลิปทั้งหมดได้รับการตรวจสอบและบันทึกข้อมูลเรียบร้อยแล้ว
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Transaction List */}
                <div className="lg:col-span-4 space-y-3 max-h-[750px] overflow-y-auto pr-1">
                  {filteredTransactions.map((txn) => {
                    const isSelected = activeTxn?.id === txn.id;
                    return (
                      <div
                        key={txn.id}
                        onClick={() => setSelectedTxnId(txn.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40'
                            : 'bg-slate-900/80 backdrop-blur-md border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-mono font-bold text-cyan-400">
                              {txn.student?.student_id || 'ไม่ระบุรหัส'}
                            </span>
                            <h4 className="text-sm font-semibold text-white mt-0.5 line-clamp-1">
                              {txn.student?.full_name || 'นักศึกษา'}
                            </h4>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              txn.status === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : txn.status === 'REJECTED'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {txn.status}
                          </span>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-slate-400 line-clamp-1">
                            {txn.campaign?.title || 'ค่าบำรุง'}
                          </span>
                          <span className="font-bold text-white font-mono">
                            ฿{Number(txn.amount_paid).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Split-View Zoomable Preview */}
                {activeTxn && (
                  <div className="lg:col-span-8 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">
                            {activeTxn.student?.full_name}
                          </h3>
                          <span className="text-xs text-slate-400 font-mono">
                            ({activeTxn.student?.student_id})
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                            ปี {activeTxn.student?.cohort_year}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          กิจกรรม:{' '}
                          <span className="text-cyan-400 font-medium">
                            {activeTxn.campaign?.title}
                          </span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">
                          ยอดโอนที่แจ้ง
                        </span>
                        <span className="text-2xl font-bold font-mono text-emerald-400">
                          ฿{Number(activeTxn.amount_paid).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Zoomable Image Viewer */}
                    <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden min-h-[420px] flex items-center justify-center">
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700">
                        <button
                          onClick={() =>
                            setZoomLevel((prev) => Math.min(prev + 0.25, 3))
                          }
                          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setZoomLevel((prev) => Math.max(prev - 0.25, 0.75))
                          }
                          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setRotation((prev) => (prev + 90) % 360)
                          }
                          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setZoomLevel(1);
                            setRotation(0);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                        >
                          รีเซ็ต
                        </button>
                      </div>

                      {activeTxn.slip_image_url ? (
                        <div
                          className="transition-transform duration-200 cursor-grab active:cursor-grabbing p-4"
                          style={{
                            transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={activeTxn.slip_image_url}
                            alt="Slip Verification"
                            className="max-h-[460px] object-contain rounded-lg shadow-2xl"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          ไม่พบไฟล์รูปภาพสลิป
                        </p>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                      <div>
                        <span className="text-slate-500 block">
                          วัน-เวลาที่ทำรายการ (Transfer Date):
                        </span>
                        <span className="font-semibold text-white">
                          {new Date(
                            activeTxn.transfer_date
                          ).toLocaleString('th-TH')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">
                          วันที่ส่งเข้าระบบ (Created At):
                        </span>
                        <span className="font-semibold text-white">
                          {new Date(activeTxn.created_at).toLocaleString(
                            'th-TH'
                          )}
                        </span>
                      </div>

                      {activeTxn.reject_reason && (
                        <div className="sm:col-span-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                          <span className="font-bold block mb-0.5">
                            เหตุผลที่ปฏิเสธ:
                          </span>
                          <span>{activeTxn.reject_reason}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {activeTxn.status === 'PENDING' ? (
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => setIsRejectModalOpen(true)}
                          disabled={isProcessing}
                          className="flex-1 py-3 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>ปฏิเสธสลิป (Reject)</span>
                        </button>

                        <button
                          onClick={() => handleApprove(activeTxn.id)}
                          disabled={isProcessing}
                          className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {isProcessing
                              ? 'กำลังบันทึก...'
                              : 'อนุมัติการชำระเงิน (Approve)'}
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-800 text-center text-xs text-slate-400">
                        รายการนี้ถูกบันทึกสถานะเป็น{' '}
                        <span className="font-bold text-white">
                          {activeTxn.status}
                        </span>{' '}
                        แล้ว
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STUDENT LEDGER TABLE */}
        {mainTab === 'ledger' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ค้นหารหัสนักศึกษา หรือ ชื่อ-นามสกุล..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <select
                  value={ledgerCohortFilter}
                  onChange={(e) => setLedgerCohortFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">ชั้นปีทั้งหมด (All Cohorts)</option>
                  <option value="1">ชั้นปีที่ 1 (Cohort 1)</option>
                  <option value="2">ชั้นปีที่ 2 (Cohort 2)</option>
                  <option value="3">ชั้นปีที่ 3 (Cohort 3)</option>
                  <option value="4">ชั้นปีที่ 4 (Cohort 4)</option>
                </select>
              </div>

              <div>
                <select
                  value={ledgerStatusFilter}
                  onChange={(e) => setLedgerStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">สถานะทั้งหมด (All Status)</option>
                  <option value="PAID">ชำระครบถ้วน (Fully Paid)</option>
                  <option value="PENDING">มีรายการรอตรวจสอบ (Pending)</option>
                  <option value="UNPAID">ยังมียอดคงค้าง (Unpaid)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">รหัสนักศึกษา</th>
                      <th className="px-4 py-3.5">ชื่อ-นามสกุล</th>
                      <th className="px-4 py-3.5 text-center">ชั้นปี</th>
                      <th className="px-4 py-3.5 text-right">ยอดที่ต้องชำระ</th>
                      <th className="px-4 py-3.5 text-right">ชำระแล้ว</th>
                      <th className="px-4 py-3.5 text-right">ยอดคงค้าง</th>
                      <th className="px-4 py-3.5 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          ไม่พบข้อมูลนักศึกษาตรงตามเงื่อนไข
                        </td>
                      </tr>
                    ) : (
                      filteredLedger.map((s) => {
                        const isFullyPaid =
                          s.balanceRemaining === 0 && s.totalPaid > 0;
                        return (
                          <tr
                            key={s.id}
                            className="hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="px-4 py-3 font-mono font-bold text-cyan-400">
                              {s.student_id}
                            </td>
                            <td className="px-4 py-3 font-semibold text-white">
                              {s.full_name}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-400">
                              ปี {s.cohort_year}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-300">
                              ฿{s.totalRequired.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-emerald-400 font-bold">
                              ฿{s.totalPaid.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-rose-400 font-bold">
                              ฿{s.balanceRemaining.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isFullyPaid ? (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300">
                                  ชำระครบแล้ว
                                </span>
                              ) : s.hasPending ? (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300">
                                  รอตรวจสลิป
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300">
                                  ยังไม่ครบ
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Rejection Reason Dialog */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5 text-white">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <span>ระบุเหตุผลในการปฏิเสธสลิป</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                เหตุผลนี้จะถูกส่งแจ้งไปยังประวัติการชำระเงินของนักศึกษาโดยตรง
              </p>
            </div>

            <div className="space-y-2">
              {REJECTION_REASONS.map((reason, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    rejectionReason === reason
                      ? 'bg-rose-500/15 border-rose-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejection"
                    checked={rejectionReason === reason}
                    onChange={() => setRejectionReason(reason)}
                    className="accent-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  rejectionReason === 'OTHER'
                    ? 'bg-rose-500/15 border-rose-500/50 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="rejection"
                  checked={rejectionReason === 'OTHER'}
                  onChange={() => setRejectionReason('OTHER')}
                  className="accent-rose-500"
                />
                <span>ระบุเหตุผลอื่นๆ ด้วยตนเอง</span>
              </label>

              {rejectionReason === 'OTHER' && (
                <textarea
                  placeholder="พิมพ์เหตุผลที่ต้องการแจ้งนักศึกษา..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full mt-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  rows={3}
                  required
                />
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={
                  isProcessing ||
                  (rejectionReason === 'OTHER' && !customReason.trim())
                }
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {isProcessing ? 'กำลังบันทึก...' : 'ยืนยันการปฏิเสธ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
