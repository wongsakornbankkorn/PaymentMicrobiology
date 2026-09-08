'use client';

import React from 'react';
import { DollarSign, Users, AlertCircle, TrendingUp, CheckCircle2, PlusCircle, ArrowUpRight } from 'lucide-react';

export default function AdminAnalytics({ analytics, onOpenQueue, onOpenRoster, onOpenCreateCampaign }) {
  const collectionRate = parseFloat(analytics?.collectionRate || 89.2);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-white border border-apple-hairline rounded-3xl p-6 sm:p-8 shadow-apple-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-apple-parchment border border-apple-hairline text-xs font-semibold text-apple-primary mb-2">
            <span>Executive Command Center</span>
            <span>•</span>
            <span>ปีการศึกษา 2568</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-apple-ink tracking-tight">
            ภาพรวมการเงิน & กองทุนสาขาวิชาจุลชีววิทยา
          </h1>
          <p className="text-sm text-apple-ink-subtle mt-1">
            ติดตามสถานะยอดเงินเข้ากองทุน ความคืบหน้าการจัดเก็บ และคิวสลิปที่รอการตรวจสอบ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateCampaign}
            className="btn-pill-primary shadow-sm text-sm"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            <span>สร้างกิจกรรมเก็บเงิน</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total Collected */}
        <div className="bg-white border border-apple-hairline rounded-3xl p-6 shadow-apple-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-apple-ink-subtle text-xs font-semibold uppercase tracking-wider">
            <span>ยอดเงินเข้ากองทุนสะสม</span>
            <div className="w-8 h-8 rounded-full bg-apple-emerald/10 text-apple-emerald flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-display font-bold text-apple-ink">
              ฿{Number(analytics?.totalCollected || 0).toLocaleString()}
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-apple-emerald font-semibold mt-1">
              <span>{analytics?.growthRate || '+14.2%'}</span>
              <span className="text-apple-ink-subtle font-normal">เทียบกับภาคการศึกษาที่แล้ว</span>
            </span>
          </div>
        </div>

        {/* KPI 2: Outstanding Balance */}
        <div className="bg-white border border-apple-hairline rounded-3xl p-6 shadow-apple-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-apple-ink-subtle text-xs font-semibold uppercase tracking-wider">
            <span>ยอดค้างชำระรวม</span>
            <div className="w-8 h-8 rounded-full bg-apple-amber/10 text-apple-amber flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-display font-bold text-apple-ink">
              ฿{Number(18500).toLocaleString()}
            </div>
            <p className="text-xs text-apple-ink-subtle mt-1">
              จากนักศึกษาที่มีภาระค้างจ่าย
            </p>
          </div>
        </div>

        {/* KPI 3: Collection Progress */}
        <div className="bg-white border border-apple-hairline rounded-3xl p-6 shadow-apple-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-apple-ink-subtle text-xs font-semibold uppercase tracking-wider">
            <span>อัตราความสำเร็จในการจัดเก็บ</span>
            <div className="w-8 h-8 rounded-full bg-apple-primary/10 text-apple-primary flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-display font-bold text-apple-primary">
              {collectionRate}%
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-apple-parchment h-2 rounded-full mt-2 overflow-hidden border border-apple-hairline">
              <div
                className="bg-apple-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(collectionRate, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-apple-ink-subtle mt-1.5">
              เป้าหมายกองทุน: ฿160,000
            </p>
          </div>
        </div>

        {/* KPI 4: Pending Verification Queue */}
        <div
          onClick={onOpenQueue}
          className="bg-white border border-apple-hairline rounded-3xl p-6 shadow-apple-card flex flex-col justify-between cursor-pointer hover:border-apple-primary/60 transition-colors group"
        >
          <div className="flex items-center justify-between text-apple-ink-subtle text-xs font-semibold uppercase tracking-wider">
            <span>สลิปรอการตรวจสอบ</span>
            <div className="w-8 h-8 rounded-full bg-apple-rose/10 text-apple-rose flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="font-bold text-xs">{analytics?.pendingQueueCount || 0}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-display font-bold text-apple-rose">
              {analytics?.pendingQueueCount || 0} รายการ
            </div>
            <span className="text-xs text-apple-primary font-medium flex items-center gap-1 mt-1 group-hover:underline">
              <span>เปิดคิวตรวจสอบ (Queue)</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          onClick={onOpenQueue}
          className="p-6 rounded-3xl bg-white border border-apple-hairline shadow-apple-card hover:border-apple-primary/60 transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-apple-primary uppercase tracking-wider">
              Verification Engine
            </span>
            <h3 className="text-lg font-display font-semibold text-apple-ink mt-1">
              ระบบตรวจสอบสลิปแบบ Split-View
            </h3>
            <p className="text-xs text-apple-ink-subtle mt-1">
              ตรวจสลิปพร้อมระบบเปรียบเทียบ OCR อัตโนมัติ ป้องกันสลิปซ้ำ และออกใบเสร็จ
            </p>
          </div>
          <button className="btn-pill-primary text-xs py-2 px-4 shrink-0 ml-4">
            เข้าสู่คิว
          </button>
        </div>

        <div
          onClick={onOpenRoster}
          className="p-6 rounded-3xl bg-white border border-apple-hairline shadow-apple-card hover:border-apple-primary/60 transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-apple-emerald uppercase tracking-wider">
              Master Ledger
            </span>
            <h3 className="text-lg font-display font-semibold text-apple-ink mt-1">
              บัญชีสถานะนักศึกษาตามชั้นปี (Roster Matrix)
            </h3>
            <p className="text-xs text-apple-ink-subtle mt-1">
              ค้นหาและกรองนักศึกษาปี 1-4 ตรวจสอบผู้ค้างจ่าย ส่งอีเมลทวง และส่งออกไฟล์ CSV
            </p>
          </div>
          <button className="btn-pill-secondary text-xs py-2 px-4 shrink-0 ml-4">
            ดูบัญชี
          </button>
        </div>
      </div>
    </div>
  );
}
