/**
 * Application Constants and Business Rule Configurations
 * Adheres to Single Responsibility & DRY principles.
 */

const STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
};

const BANKS = [
  { code: 'SCB', name: 'ธนาคารไทยพาณิชย์ (SCB)', color: '#4e2a84' },
  { code: 'KBANK', name: 'ธนาคารกสิกรไทย (KBank)', color: '#138f2d' },
  { code: 'KTB', name: 'ธนาคารกรุงไทย (KTB)', color: '#00a5e5' },
  { code: 'BBL', name: 'ธนาคารกรุงเทพ (BBL)', color: '#1e3799' },
  { code: 'BAY', name: 'ธนาคารกรุงศรีอยุธยา (Krungsri)', color: '#fecb00' },
  { code: 'TTB', name: 'ธนาคารทหารไทยธนชาต (ttb)', color: '#002d62' },
  { code: 'GSB', name: 'ธนาคารออมสิน (GSB)', color: '#eb1985' }
];

const REJECTION_REASONS = [
  'ยอดเงินโอนไม่ตรงกับค่าธรรมเนียมที่ระบุ',
  'สลิปการโอนซ้ำกับในระบบ หรือเคยส่งแล้ว',
  'บัญชีปลายทางไม่ใช่บัญชีทางการของภาควิชา',
  'รูปภาพสลิปไม่ชัดเจน / ข้อมูลวันที่เวลาไม่สามารถอ่านได้',
  'ไม่พบรายการเดินบัญชีตรงกับเวลาที่ระบุ'
];

const SLA_NOTICE = 'ตรวจสอบสลิปภายใน 24 ชม. พร้อมระบบตรวจสอบความถูกต้องอัตโนมัติ';

const PDPA_NOTICE = 'ระบบจัดเก็บข้อมูลและสลิปการโอนเงินเพื่อการยืนยันทางบัญชีของภาควิชา CPE เท่านั้น ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล';

module.exports = {
  STATUS,
  BANKS,
  REJECTION_REASONS,
  SLA_NOTICE,
  PDPA_NOTICE
};
