'use client';

import React from 'react';
import { LayoutDashboard, CreditCard, History, ListCheck, Users, BarChart3 } from 'lucide-react';

export default function MobileBottomNav({ role, activeTab, setActiveTab, pendingCount }) {
  const studentItems = [
    { id: 'overview', label: 'ภาพรวม', icon: LayoutDashboard },
    { id: 'pay', label: 'ชำระเงิน', icon: CreditCard },
    { id: 'history', label: 'ประวัติ', icon: History }
  ];

  const adminItems = [
    { id: 'analytics', label: 'ภาพรวม', icon: BarChart3 },
    { id: 'queue', label: 'คิวสลิป', icon: ListCheck, badge: pendingCount },
    { id: 'roster', label: 'บัญชีรายชื่อ', icon: Users }
  ];

  const items = role === 'STUDENT' ? studentItems : adminItems;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-apple-hairline px-6 py-2">
      <div className="flex items-center justify-around">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
                isActive ? 'text-apple-primary' : 'text-apple-ink-subtle'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-apple-rose text-white text-[10px] font-bold px-1 rounded-full min-w-[15px] h-3.5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
