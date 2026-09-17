'use client';

import React, { useState, useEffect } from 'react';
import GlobalNav from '../components/common/GlobalNav';
import SubNavFrosted from '../components/common/SubNavFrosted';
import MobileBottomNav from '../components/common/MobileBottomNav';
import Toast from '../components/common/Toast';
import LoginPage from '../components/common/LoginPage';

// Student Components
import StudentOverview from '../components/student/StudentOverview';
import PromptPayCard from '../components/student/PromptPayCard';
import SlipUploadForm from '../components/student/SlipUploadForm';
import PaymentHistory from '../components/student/PaymentHistory';
import ReceiptModal from '../components/student/ReceiptModal';

// Admin Components
import AdminAnalytics from '../components/admin/AdminAnalytics';
import VerificationQueue from '../components/admin/VerificationQueue';
import RosterMatrix from '../components/admin/RosterMatrix';
import CreateCampaignModal from '../components/admin/CreateCampaignModal';
import AddStudentModal from '../components/admin/AddStudentModal';

import { api } from '../services/api';
import { AlertCircle } from 'lucide-react';

export default function App() {
  // Authentication & Role State
  const [auth, setAuth] = useState(null); // null | { role: 'STUDENT' | 'ADMIN', user: Object }
  const [role, setRole] = useState('STUDENT'); // 'STUDENT' | 'ADMIN'
  const [activeTab, setActiveTab] = useState('overview'); // student: overview | pay | history, admin: analytics | queue | roster
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Data State
  const [profileData, setProfileData] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [rosterData, setRosterData] = useState({ campaigns: [], roster: [] });

  // Interactive UI Modals & State
  const [selectedPayCampaign, setSelectedPayCampaign] = useState(null);
  const [currentAmount, setCurrentAmount] = useState(500);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [rejectReasonModal, setRejectReasonModal] = useState(null);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync activeTab when switching roles
  useEffect(() => {
    if (role === 'STUDENT') {
      setActiveTab('overview');
    } else {
      setActiveTab('analytics');
    }
  }, [role]);

  // Load all application data
  const loadData = async () => {
    try {
      const [profile, students, camps, txns, stats, roster] = await Promise.all([
        api.getProfile(),
        api.getStudents(),
        api.getCampaigns(),
        api.getVerificationQueue(),
        api.getAnalytics(),
        api.getRoster()
      ]);

      setProfileData(profile);
      setStudentsList(students || []);
      setCampaigns(camps || []);
      setTransactions(txns || []);
      setAnalytics(stats);
      setRosterData(roster || { campaigns: [], roster: [] });
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  // Check saved session on mount
  useEffect(() => {
    const saved = api.getSavedAuth();
    if (saved) {
      setAuth(saved);
      setRole(saved.role);
    }
    setIsAuthChecking(false);
    loadData();
  }, []);

  const handleLoginSuccess = async (credentials) => {
    const { identifier, password } = credentials;
    // นักศึกษาจะใช้รหัสนักศึกษา 10 หลัก (ตัวเลขล้วน)
    const isStudent = /^\d{10}$/.test(identifier.trim());

    if (isStudent) {
      const result = await api.studentLogin(identifier, password);
      const studentUser = result.student;
      setAuth({ role: 'STUDENT', user: studentUser });
      setRole('STUDENT');
      showToast(`เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${studentUser.name_th}!`, 'success');
      await loadData();
    } else {
      const result = await api.adminLogin(password, identifier);
      const adminUser = result.admin;
      setAuth({ role: 'ADMIN', user: adminUser });
      setRole('ADMIN');
      showToast('เข้าสู่ระบบเหรัญญิกสาขาจุลชีววิทยาสำเร็จ ยินดีต้อนรับ!', 'success');
      await loadData();
    }
  };

  // Unified Logout Handler
  const handleLogout = async () => {
    if (auth?.role === 'ADMIN') {
      await api.adminLogout();
    } else {
      await api.studentLogout();
    }
    setAuth(null);
    setProfileData(null);
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
  };

  // Add Student Handler
  const handleAddStudent = async (studentData) => {
    await api.addStudent(studentData);
    showToast(`เพิ่มข้อมูล ${studentData.name_th} ลงในระบบเรียบร้อยแล้ว`, 'success');
    await loadData();
  };

  // Delete Student Handler
  const handleDeleteStudent = async (id) => {
    await api.deleteStudent(id);
    showToast('ลบข้อมูลนักศึกษาเรียบร้อยแล้ว', 'info');
    await loadData();
  };

  // Quick action from StudentOverview to start payment
  const handleSelectPayCampaign = (camp) => {
    setSelectedPayCampaign(camp);
    if (camp) setCurrentAmount(camp.amount);
    setActiveTab('pay');
  };

  // Slip Submission Handler
  const handleSubmitSlip = async (formData) => {
    await api.uploadSlip(formData);
    showToast('ส่งสลิปการโอนเงินสำเร็จ! เหรัญญิกจะตรวจสอบภายใน 24 ชม.', 'success');
    await loadData();
    setActiveTab('history');
  };

  // Admin Verification Handler (Approve / Reject)
  const handleVerifyTransaction = async (id, action, reason = '') => {
    await api.verifyTransaction(id, action, reason);
    if (action === 'APPROVE') {
      showToast('อนุมัติการชำระเงินและออกใบเสร็จดิจิทัลเรียบร้อยแล้ว', 'success');
    } else {
      showToast('ปฏิเสธสลิปการโอนเงินและส่งข้อความแจ้งเตือนแล้ว', 'error');
    }
    await loadData();
  };

  // View Receipt Modal
  const handleViewReceipt = async (transactionId) => {
    const receipt = await api.getReceipt(transactionId);
    setActiveReceipt(receipt);
  };

  // Send Email Reminder
  const handleSendReminder = async (studentId, campaignTitle) => {
    const res = await api.sendReminder(studentId, campaignTitle);
    showToast(res.message || 'ส่งอีเมลแจ้งเตือนสำเร็จแล้ว', 'info');
  };

  // Export CSV
  const handleExportCsv = () => {
    window.open('/api/roster/export', '_blank');
    showToast('ดาวน์โหลดไฟล์ CSV สำหรับการตรวจสอบบัญชีสำเร็จ', 'success');
  };

  // Create Campaign
  const handleCreateCampaign = async (campaignData) => {
    await api.createCampaign(campaignData);
    showToast('สร้างรายการจัดเก็บเงินใหม่เรียบร้อยแล้ว', 'success');
    await loadData();
  };

  // Filter current active student transactions
  const currentStudent = auth?.role === 'STUDENT' ? (profileData?.student || auth.user) : null;
  const currentStudentId = currentStudent?.id;
  const studentTransactions = currentStudentId ? transactions.filter(t => t.student_id === currentStudentId) : [];
  const pendingCount = transactions.filter(t => t.verification_status === 'PENDING').length;

  // Filter campaigns strictly applicable to this student's cohort
  const studentCohort = currentStudent?.cohort_year;
  const applicableCampaigns = currentStudent
    ? campaigns.filter(c => {
        if (!c.target_cohort || c.target_cohort === 'ALL') return true;
        if (studentCohort && c.target_cohort === `YEAR_${studentCohort}`) return true;
        return false;
      })
    : campaigns;

  // Don't render until initial session check is complete
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-apple-parchment flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-apple-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // ==================== UNPROTECTED GATE: LOGIN PAGE ====================
  if (!auth) {
    return (
      <>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  // ==================== PROTECTED DASHBOARD ====================
  return (
    <div className="min-h-screen bg-apple-parchment pb-24 md:pb-16 flex flex-col justify-between">
      <div>
        {/* Apple Global Navigation */}
        <GlobalNav
          role={role}
          student={currentStudent}
          adminUser={auth.role === 'ADMIN' ? auth.user : null}
          onLogout={handleLogout}
        />

        {/* Apple 52px Frosted Glass Sub-Navigation */}
        <SubNavFrosted
          role={role}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCount={pendingCount}
          onOpenCreateCampaign={() => setIsCreateCampaignOpen(true)}
        />

        {/* Main Workspace Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8">
          {/* ===================== STUDENT PORTAL ===================== */}
          {role === 'STUDENT' && (
            <>
              {activeTab === 'overview' && (
                <StudentOverview
                  student={currentStudent}
                  summary={profileData?.summary}
                  campaigns={applicableCampaigns}
                  transactions={studentTransactions}
                  onSelectPayCampaign={handleSelectPayCampaign}
                  onViewReceipt={handleViewReceipt}
                />
              )}

              {activeTab === 'pay' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <PromptPayCard
                    selectedCampaign={selectedPayCampaign}
                    currentAmount={currentAmount}
                    onAmountChange={setCurrentAmount}
                  />

                  <SlipUploadForm
                    campaigns={applicableCampaigns}
                    selectedCampaign={selectedPayCampaign}
                    currentAmount={currentAmount}
                    onAmountChange={setCurrentAmount}
                    onSubmitSlip={handleSubmitSlip}
                  />
                </div>
              )}

              {activeTab === 'history' && (
                <div className="animate-in fade-in duration-300">
                  <PaymentHistory
                    transactions={studentTransactions}
                    onViewReceipt={handleViewReceipt}
                    onShowRejectReason={(reason) => setRejectReasonModal(reason)}
                  />
                </div>
              )}
            </>
          )}

          {/* ===================== ADMIN / TREASURER COMMAND ===================== */}
          {role === 'ADMIN' && (
            <>
              {activeTab === 'analytics' && (
                <AdminAnalytics
                  analytics={analytics}
                  onOpenQueue={() => setActiveTab('queue')}
                  onOpenRoster={() => setActiveTab('roster')}
                  onOpenCreateCampaign={() => setIsCreateCampaignOpen(true)}
                />
              )}

              {activeTab === 'queue' && (
                <VerificationQueue
                  transactions={transactions}
                  onVerifyTransaction={handleVerifyTransaction}
                />
              )}

              {activeTab === 'roster' && (
                <RosterMatrix
                  rosterData={rosterData}
                  onSendReminder={handleSendReminder}
                  onExportCsv={handleExportCsv}
                  onOpenAddStudent={() => setIsAddStudentOpen(true)}
                  onDeleteStudent={handleDeleteStudent}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Editorial Footer */}
      <footer className="mt-16 border-t border-apple-hairline py-8 px-4 sm:px-8 text-center text-xs text-apple-ink-subtle">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="font-semibold text-apple-ink">
            ระบบบริหารจัดการการเงินและติดตามการชำระเงิน • สาขาวิชาจุลชีววิทยา คณะวิทยาศาสตร์ มหาวิทยาลัยสงขลานครินทร์
          </p>
          <p>
            พัฒนาตามมาตรฐานความปลอดภัย PDPA และการตรวจสอบสลิปแบบ Double-Entry Reconciliation
          </p>
          <p className="text-[11px] text-gray-400">
            © 2026 Department of Microbiology, Faculty of Science, Prince of Songkla University. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        role={role}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onAddStudent={handleAddStudent}
      />

      {/* Digital Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal
          receipt={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {/* Rejection Reason Modal for Student */}
      {rejectReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-apple-hairline rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-apple-rose/10 text-apple-rose flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-display font-semibold text-apple-ink">
                  เหตุผลที่สลิปไม่ผ่านการตรวจสอบ
                </h3>
                <span className="text-xs text-apple-ink-subtle">จากเหรัญญิกสาขาวิชาจุลชีววิทยา</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-apple-rose/5 border border-apple-rose/20 text-xs text-apple-rose leading-relaxed">
              {rejectReasonModal}
            </div>

            <div className="text-right">
              <button
                onClick={() => setRejectReasonModal(null)}
                className="btn-pill-primary text-xs"
              >
                เข้าใจแล้ว / ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Fee Campaign Modal */}
      <CreateCampaignModal
        isOpen={isCreateCampaignOpen}
        onClose={() => setIsCreateCampaignOpen(false)}
        onCreateCampaign={handleCreateCampaign}
      />

      {/* Floating Notification Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
