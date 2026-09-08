'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { supabaseApi } from '../../../services/supabaseApi';
import { uploadSlipToSupabase } from '../../../utils/imageCompression';

import PromptPayCard from '../../../components/student/PromptPayCard';
import SlipUploadForm from '../../../components/student/SlipUploadForm';
import PaymentHistory from '../../../components/student/PaymentHistory';
import ReceiptModal from '../../../components/student/ReceiptModal';
import Toast from '../../../components/common/Toast';

import {
  LogOut,
  User,
  GraduationCap,
  CreditCard,
  History,
  LayoutDashboard,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, profile, role, loading, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'pay' | 'history'
  const [campaigns, setCampaigns] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedPayCampaign, setSelectedPayCampaign] = useState(null);
  const [currentAmount, setCurrentAmount] = useState(500);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [toast, setToast] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Route protection
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (role === 'ADMIN') {
        router.replace('/admin/verification-queue');
      }
    }
  }, [user, role, loading, router]);

  // Load student dashboard data
  const loadStudentData = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoadingData(true);
    try {
      const [camps, txns] = await Promise.all([
        supabaseApi.getFeeCampaigns(profile.cohort_year),
        supabaseApi.getStudentTransactions(profile.id),
      ]);
      setCampaigns(camps || []);
      setTransactions(txns || []);
      if (camps && camps.length > 0 && !selectedPayCampaign) {
        setSelectedPayCampaign(camps[0]);
        setCurrentAmount(camps[0].amount);
      }
    } catch (err) {
      console.error('Error loading student data:', err);
      showToast('ไม่สามารถโหลดข้อมูลได้ในขณะนี้', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [profile?.id, profile?.cohort_year, selectedPayCampaign]);

  useEffect(() => {
    if (profile?.id) {
      loadStudentData();
    }
  }, [profile?.id, loadStudentData]);

  // Calculate financial overview
  const totalObligation = campaigns.reduce(
    (sum, c) => sum + parseFloat(c.amount || 0),
    0
  );
  const totalPaid = transactions
    .filter((t) => t.status === 'APPROVED')
    .reduce((sum, t) => sum + parseFloat(t.amount_paid || 0), 0);
  const pendingAmount = transactions
    .filter((t) => t.status === 'PENDING')
    .reduce((sum, t) => sum + parseFloat(t.amount_paid || 0), 0);
  const balanceRemaining = Math.max(0, totalObligation - totalPaid);

  // Handle slip submission
  const handleSubmitSlip = async ({
    file,
    campaignId,
    amountPaid,
    transferDate,
  }) => {
    if (!profile?.id) {
      showToast('กรุณาเข้าสู่ระบบก่อนทำรายการ', 'error');
      return;
    }

    try {
      // 1. Upload compressed slip directly to Supabase Storage bucket 'slips'
      const uploadResult = await uploadSlipToSupabase(file, profile.student_id);

      // 2. Insert record into Supabase 'transactions' table
      await supabaseApi.submitTransaction({
        studentId: profile.id,
        campaignId,
        amountPaid,
        slipImageUrl: uploadResult.publicUrl,
        transferDate,
      });

      showToast('ส่งสลิปเรียบร้อยแล้ว! เหรัญญิกจะดำเนินการตรวจสอบในลำดับถัดไป', 'success');
      await loadStudentData();
      setActiveTab('history');
    } catch (err) {
      console.error('Submit slip failed:', err);
      throw err;
    }
  };

  if (loading || (!profile && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-400">
            กำลังโหลดข้อมูลนักศึกษา...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 overflow-x-hidden">
      {/* Toast Notification */}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">
                สาขาวิชาจุลชีววิทยา (Microbiology)
              </h1>
              <p className="text-xs text-slate-400">
                ระบบชำระและติดตามค่าธรรมเนียมภาควิชา
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-slate-300">
              <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-white">{profile?.full_name}</span>
              <span className="text-slate-600">|</span>
              <span className="font-mono text-cyan-300">รหัส {profile?.student_id}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">ปี {profile?.cohort_year}</span>
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
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>ภาพรวมการชำระเงิน</span>
          </button>
          <button
            onClick={() => setActiveTab('pay')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'pay'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>ชำระเงิน & แนบสลิป</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <History className="w-4 h-4" />
            <span>ประวัติสลิป ({transactions.length})</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-xl">
                <span className="text-xs font-semibold text-slate-400">
                  ยอดที่ต้องชำระทั้งหมด
                </span>
                <p className="text-2xl font-display font-bold text-white mt-1">
                  ฿{totalObligation.toLocaleString()}
                </p>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  คำนวณตามกิจกรรมชั้นปีที่ {profile?.cohort_year}
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-xl">
                <span className="text-xs font-semibold text-emerald-400">
                  ยอดชำระแล้ว (อนุมัติ)
                </span>
                <p className="text-2xl font-display font-bold text-emerald-400 mt-1">
                  ฿{totalPaid.toLocaleString()}
                </p>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {transactions.filter((t) => t.status === 'APPROVED').length}{' '}
                  รายการได้รับการยืนยัน
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-xl">
                <span className="text-xs font-semibold text-amber-400">
                  กำลังรอการตรวจสอบ
                </span>
                <p className="text-2xl font-display font-bold text-amber-400 mt-1">
                  ฿{pendingAmount.toLocaleString()}
                </p>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {transactions.filter((t) => t.status === 'PENDING').length}{' '}
                  รายการในคิว
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-xl">
                <span className="text-xs font-semibold text-rose-400">
                  ยอดคงค้างสุทธิ
                </span>
                <p className="text-2xl font-display font-bold text-rose-400 mt-1">
                  ฿{balanceRemaining.toLocaleString()}
                </p>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {balanceRemaining === 0 ? 'ชำระครบถ้วนแล้ว' : 'ยังมียอดค้างชำระ'}
                </span>
              </div>
            </div>

            {/* Campaign List */}
            <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-white">
                รายการกิจกรรมและค่าธรรมเนียมสำหรับชั้นปีของคุณ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.map((camp) => {
                  const isPaid = transactions.some(
                    (t) =>
                      String(t.campaign_id) === String(camp.id) &&
                      t.status === 'APPROVED'
                  );
                  const isPending = transactions.some(
                    (t) =>
                      String(t.campaign_id) === String(camp.id) &&
                      t.status === 'PENDING'
                  );

                  return (
                    <div
                      key={camp.id}
                      className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 flex items-start justify-between gap-4"
                    >
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {camp.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                          {camp.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-bold text-cyan-400 font-mono">
                            ฿{Number(camp.amount).toLocaleString()}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ครบกำหนด{' '}
                            {new Date(camp.due_date).toLocaleDateString('th-TH')}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ชำระแล้ว
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300">
                            รอตรวจสอบ
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedPayCampaign(camp);
                              setCurrentAmount(camp.amount);
                              setActiveTab('pay');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-sm"
                          >
                            ชำระเงิน
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Payment & Slip Upload */}
        {activeTab === 'pay' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
            <div className="lg:col-span-5">
              <PromptPayCard
                campaigns={campaigns}
                selectedCampaign={selectedPayCampaign}
                onSelectCampaign={(c) => {
                  setSelectedPayCampaign(c);
                  setCurrentAmount(c.amount);
                }}
                currentAmount={currentAmount}
              />
            </div>
            <div className="lg:col-span-7">
              <SlipUploadForm
                campaigns={campaigns}
                selectedCampaign={selectedPayCampaign}
                currentAmount={currentAmount}
                onAmountChange={setCurrentAmount}
                onSubmitSlip={handleSubmitSlip}
              />
            </div>
          </div>
        )}

        {/* Tab 3: History & Receipt */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in">
            <PaymentHistory
              transactions={transactions}
              onViewReceipt={(txn) => setActiveReceipt(txn)}
            />
          </div>
        )}
      </main>

      {/* Modal: Official Receipt */}
      {activeReceipt && (
        <ReceiptModal
          transaction={activeReceipt}
          student={profile}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
}
