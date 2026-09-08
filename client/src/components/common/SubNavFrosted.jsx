'use client';

import React from 'react';
import { Clock, ShieldAlert, PlusCircle } from 'lucide-react';

export default function SubNavFrosted({ role, activeTab, setActiveTab, pendingCount, onOpenCreateCampaign }) {
  const studentTabs = [
    { id: 'overview', label: 'ภาพรวมการเงิน' },
    { id: 'pay', label: 'ชำระเงิน & ส่งสลิป' },
    { id: 'history', label: 'ประวัติและใบเสร็จ' }
  ];

  const adminTabs = [
    { id: 'analytics', label: 'สรุปภาพรวมกองทุน' },
    { id: 'queue', label: 'คิวตรวจสลิป', badge: pendingCount },
    { id: 'roster', label: 'บัญชีรายชื่อนักศึกษา (Ledger)' }
  ];

  const currentTabs = role === 'STUDENT' ? studentTabs : adminTabs;

  return (
    <div className="sticky top-11 z-30 backdrop-blur-md bg-white/85 border-b border-apple-hairline px-4 sm:px-8 transition-all">
      <div className="max-w-7xl mx-auto h-[52px] flex items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
          {currentTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3.5 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap btn-press ${
                activeTab === tab.id
                  ? 'bg-apple-ink text-white shadow-sm'
                  : 'text-apple-ink-subtle hover:text-apple-ink hover:bg-apple-parchment'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {tab.label}
                {tab.badge > 0 && (
                  <span className="bg-apple-rose text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Right Info Pill / Action */}
        <div className="hidden md:flex items-center gap-3">
          {role === 'STUDENT' ? (
            <div className="flex items-center gap-1.5 text-xs text-apple-ink-subtle bg-apple-parchment px-3 py-1.5 rounded-full border border-apple-hairline">
              <Clock className="w-3.5 h-3.5 text-apple-emerald" />
              <span>SLA ตรวจสอบภายใน 24 ชม.</span>
            </div>
          ) : (
            <button
              onClick={onOpenCreateCampaign}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-apple-primary hover:bg-apple-primary-focus px-3.5 py-1.5 rounded-full btn-press transition-colors shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>สร้างรายการเก็บเงินใหม่</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
