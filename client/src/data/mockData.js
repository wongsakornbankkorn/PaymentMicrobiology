/**
 * Initial Data and Templates for Microbiology DeptTreasury
 * Faculty of Science, Prince of Songkla University (PSU)
 */

export const INITIAL_STUDENT = null;

export const INITIAL_CAMPAIGNS = [
  {
    id: 1,
    title: 'ค่าบำรุงสาขาวิชาจุลชีววิทยา ประจำปีการศึกษา 2568',
    description: 'กองทุนสนับสนุนกิจกรรมและการดูแลห้องปฏิบัติการทางจุลชีววิทยา คณะวิทยาศาสตร์ ม.อ.',
    category: 'Annual Fee',
    amount: 500.00,
    target_cohort: 'ALL',
    start_date: '2026-08-01',
    due_date: '2026-09-30',
    status: 'ACTIVE'
  },
  {
    id: 2,
    title: 'เสื้อกาวน์ปฏิบัติการและเสื้อโปโลสาขาจุลชีววิทยา',
    description: 'เสื้อกาวน์ห้องปฏิบัติการจุลชีววิทยาปักตรา ม.อ. และเสื้อกิจกรรมรับน้อง',
    category: 'Uniform',
    amount: 450.00,
    target_cohort: 'ALL',
    start_date: '2026-08-15',
    due_date: '2026-09-25',
    status: 'ACTIVE'
  },
  {
    id: 3,
    title: 'ค่ายเตรียมความพร้อมจุลชีววิทยาน้องใหม่ (Microbiology Freshmen Camp)',
    description: 'กิจกรรมค่ายวิชาการแนะแนวเทคนิคปฏิบัติการทางจุลชีววิทยาและการใช้กล้องจุลทรรศน์',
    category: 'Camp',
    amount: 400.00,
    target_cohort: 'YEAR_1',
    start_date: '2026-08-10',
    due_date: '2026-09-20',
    status: 'ACTIVE'
  },
  {
    id: 4,
    title: 'สัมมนาและนำเสนอโครงงานวิจัยทางจุลชีววิทยา (Microbiology Senior Seminar)',
    description: 'ค่าวิทยากรและเอกสารประกอบการจัดแสดงผลงานวิจัยโครงงานวิทยาศาสตร์จบการศึกษา',
    category: 'Seminar',
    amount: 300.00,
    target_cohort: 'YEAR_4',
    start_date: '2026-08-20',
    due_date: '2026-10-15',
    status: 'ACTIVE'
  }
];

// Clean zero transactions
export const INITIAL_TRANSACTIONS = [];

// Clean zero students
export const INITIAL_STUDENTS_ROSTER = [];

// Clean sample students (to be populated from database)
export const SAMPLE_STUDENTS = [];

export const DEPARTMENT_INFO = {
  name: 'สาขาจุลชีววิทยา คณะวิทยาศาสตร์ มหาวิทยาลัยสงขลานครินทร์',
  faculty: 'คณะวิทยาศาสตร์',
  university: 'มหาวิทยาลัยสงขลานครินทร์',
  account_name: 'กองทุนสาขาวิชาจุลชีววิทยา ม.อ. (Microbiology Department Fund)',
  bank_name: 'ธนาคารไทยพาณิชย์ (SCB)',
  account_no: '045-8921-344',
  promptpay_id: '0458921344',
  sla_notice: 'ตรวจสอบสลิปภายใน 24 ชม. พร้อมระบบตรวจจับสลิปซ้ำอัตโนมัติ'
};
