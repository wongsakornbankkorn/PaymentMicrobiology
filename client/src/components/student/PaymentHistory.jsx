'use client';

import React from 'react';
import { FileText, CheckCircle2, Clock, AlertCircle, Eye, ExternalLink } from 'lucide-react';

export default function PaymentHistory({ transactions, onViewReceipt, onShowRejectReason }) {
  return (
    <div className="bg-white border border-apple-hairline rounded-3xl p-6 sm:p-8 shadow-apple-card space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold text-apple-ink">
            ประวัติการส่งสลิป & สถานะการตรวจสอบ
          </h2>
          <p className="text-sm text-apple-ink-subtle mt-0.5">
            ติดตามผลการยืนยันยอดเงินจากเหรัญญิก และดาวน์โหลดใบเสร็จรับเงินดิจิทัล
          </p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-apple-hairline rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-apple-parchment text-apple-ink-subtle mx-auto flex items-center justify-center mb-2">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-apple-ink">ยังไม่มีประวัติการส่งสลิป</p>
          <p className="text-xs text-apple-ink-subtle mt-1">สลิปที่คุณส่งจะแสดงที่นี่พร้อมสถานะการตรวจสอบ</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-apple-hairline text-xs font-semibold text-apple-ink-subtle">
                <th className="pb-3 pl-2">รหัสธุรกรรม</th>
                <th className="pb-3">กิจกรรม / ค่าธรรมเนียม</th>
                <th className="pb-3">วันเวลาโอน</th>
                <th className="pb-3">ธนาคาร</th>
                <th className="pb-3 text-right">จำนวนเงิน</th>
                <th className="pb-3 text-center">สถานะ</th>
                <th className="pb-3 pr-2 text-right">เอกสาร</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apple-hairline">
              {transactions.map(txn => {
                const isVerified = txn.verification_status === 'VERIFIED';
                const isPending = txn.verification_status === 'PENDING';
                const isRejected = txn.verification_status === 'REJECTED';

                return (
                  <tr key={txn.id} className="hover:bg-apple-parchment/40 transition-colors">
                    <td className="py-4 pl-2 font-mono text-xs text-apple-ink-subtle font-medium">
                      {txn.transaction_code}
                    </td>

                    <td className="py-4 font-medium text-apple-ink">
                      <div>{txn.campaign_title}</div>
                      {txn.note && (
                        <span className="text-[11px] text-apple-ink-subtle block">
                          หมายเหตุ: {txn.note}
                        </span>
                      )}
                    </td>

                    <td className="py-4 text-xs text-apple-ink-subtle">
                      {txn.transfer_timestamp}
                    </td>

                    <td className="py-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-apple-parchment border border-apple-hairline text-apple-ink">
                        {txn.origin_bank}
                      </span>
                    </td>

                    <td className="py-4 text-right font-display font-semibold text-apple-ink">
                      ฿{Number(txn.amount).toLocaleString()}
                    </td>

                    <td className="py-4 text-center">
                      {isVerified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-apple-emerald/10 text-apple-emerald">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ตรวจสอบแล้ว</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-apple-amber/10 text-apple-amber">
                          <Clock className="w-3.5 h-3.5" />
                          <span>รอตรวจสอบ</span>
                        </span>
                      )}
                      {isRejected && (
                        <button
                          type="button"
                          onClick={() => onShowRejectReason(txn.rejection_reason || 'ยอดเงินไม่ตรงกับค่าธรรมเนียม')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-apple-rose/10 text-apple-rose hover:bg-apple-rose/20 transition-colors"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>ไม่ผ่าน (ดูเหตุผล)</span>
                        </button>
                      )}
                    </td>

                    <td className="py-4 pr-2 text-right">
                      {isVerified ? (
                        <button
                          onClick={() => onViewReceipt(txn.id)}
                          className="btn-pill-secondary text-xs py-1.5 px-3"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          <span>ใบเสร็จ</span>
                        </button>
                      ) : (
                        <span className="text-xs text-apple-ink-subtle">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
