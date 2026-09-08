/**
 * Student Ledger Export Utility (CSV / Excel compatible with UTF-8 BOM)
 * Ensures Thai language text renders cleanly in Microsoft Excel and Google Sheets.
 */

export function exportLedgerToCSV(students, filename = 'microbio_student_ledger.csv') {
  if (!students || !students.length) {
    alert('ไม่มีข้อมูลสำหรับส่งออก');
    return;
  }

  // Header columns
  const headers = [
    'ลำดับ',
    'รหัสนักศึกษา',
    'ชื่อ-นามสกุล',
    'ชั้นปี (Cohort)',
    'ยอดรวมที่ต้องชำระ (บาท)',
    'ยอดชำระแล้ว (บาท)',
    'ยอดคงค้าง (บาท)',
    'สถานะการชำระเงิน',
    'จำนวนรายการที่ส่ง',
  ];

  const rows = students.map((s, index) => {
    const totalRequired = s.totalRequired || s.total_obligation || 0;
    const totalPaid = s.totalPaid || s.amount_paid || 0;
    const balance = Math.max(0, totalRequired - totalPaid);

    let statusLabel = 'ยังไม่ชำระ';
    if (balance === 0 && totalPaid > 0) {
      statusLabel = 'ชำระครบแล้ว';
    } else if (s.hasPending) {
      statusLabel = 'รอตรวจสอบสลิป';
    } else if (totalPaid > 0 && balance > 0) {
      statusLabel = 'ชำระบางส่วน';
    }

    return [
      index + 1,
      `"${s.student_id || ''}"`,
      `"${(s.full_name || s.name_th || s.name || '').replace(/"/g, '""')}"`,
      s.cohort_year || s.cohort || '-',
      totalRequired.toFixed(2),
      totalPaid.toFixed(2),
      balance.toFixed(2),
      `"${statusLabel}"`,
      s.transaction_count || 0,
    ];
  });

  // Prepend UTF-8 BOM so Excel opens Thai characters correctly
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
