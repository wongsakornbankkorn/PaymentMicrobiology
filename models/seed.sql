-- =======================================================
-- Seed Data for Microbiology Department Treasury System
-- Faculty of Science, Prince of Songkla University (PSU)
-- Realistic data reflecting Microbiology cohorts and campaigns
-- =======================================================

USE dept_treasury;

-- Insert Students (Faculty of Science - Microbiology)
INSERT INTO students (id, student_id, name_th, name_en, cohort_year, email, phone, status) VALUES
(1, '6710210766', 'กิตติภูมิ พรหมวงศ์', 'Kittiphum Promwong', 3, 'kittiphum.p@sci.psu.ac.th', '081-234-5678', 'ENROLLED'),
(2, '6710210296', 'ธนวัฒน์ สุริยะมงคล', 'Thanawat Suriyamongkol', 3, 'thanawat.s@sci.psu.ac.th', '082-345-6789', 'ENROLLED'),
(3, '6710210045', 'ณภัทร วรเวชกุล', 'Naphat Woravechkul', 1, 'naphat.w@sci.psu.ac.th', '083-456-7890', 'ENROLLED'),
(4, '6710210112', 'พิมพ์พิชชา ธนสาร', 'Pimpitcha Tanasarn', 1, 'pimpitcha.t@sci.psu.ac.th', '084-567-8901', 'ENROLLED'),
(5, '6610210344', 'ชานนท์ เมธากุล', 'Chanon Methakul', 2, 'chanon.m@sci.psu.ac.th', '085-678-9012', 'ENROLLED'),
(6, '6610210872', 'วรัชยา จันทร์เรือง', 'Waratchaya Chanreung', 2, 'waratchaya.c@sci.psu.ac.th', '086-789-0123', 'ENROLLED'),
(7, '6510210519', 'พีรพล รัตนศิริ', 'Peerapol Rattanasiri', 4, 'peerapol.r@sci.psu.ac.th', '087-890-1234', 'ENROLLED'),
(8, '6510210920', 'ศศิภา เตชะวิบูลย์', 'Sasipa Techawiboon', 4, 'sasipa.t@sci.psu.ac.th', '088-901-2345', 'ENROLLED')
ON DUPLICATE KEY UPDATE name_th=VALUES(name_th), email=VALUES(email);

-- Insert Active Campaigns
INSERT INTO campaigns (id, title, description, category, amount, target_cohort, start_date, due_date, status) VALUES
(1, 'ค่าบำรุงสาขาวิชาจุลชีววิทยา ประจำปีการศึกษา 2568', 'กองทุนสนับสนุนกิจกรรมและการดูแลห้องปฏิบัติการทางจุลชีววิทยา คณะวิทยาศาสตร์ ม.อ.', 'Annual Fee', 500.00, 'ALL', '2026-08-01', '2026-09-30', 'ACTIVE'),
(2, 'เสื้อกาวน์ปฏิบัติการและเสื้อโปโลสาขาจุลชีววิทยา', 'เสื้อกาวน์ห้องปฏิบัติการจุลชีววิทยาปักตรา ม.อ. และเสื้อกิจกรรมรับน้อง', 'Uniform', 450.00, 'ALL', '2026-08-15', '2026-09-25', 'ACTIVE'),
(3, 'ค่ายเตรียมความพร้อมจุลชีววิทยาน้องใหม่ (Microbiology Freshmen Camp)', 'กิจกรรมค่ายวิชาการแนะแนวเทคนิคปฏิบัติการทางจุลชีววิทยาและการใช้กล้องจุลทรรศน์', 'Camp', 400.00, 'YEAR_1', '2026-08-10', '2026-09-20', 'ACTIVE'),
(4, 'สัมมนาและนำเสนอโครงงานวิจัยทางจุลชีววิทยา (Microbiology Senior Seminar)', 'ค่าวิทยากรและเอกสารประกอบการจัดแสดงผลงานวิจัยโครงงานวิทยาศาสตร์จบการศึกษา', 'Seminar', 300.00, 'YEAR_4', '2026-08-20', '2026-10-15', 'ACTIVE')
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), amount=VALUES(amount);

-- Insert Sample Transactions
INSERT INTO transactions (id, transaction_code, student_id, campaign_id, amount, transfer_timestamp, origin_bank, slip_image_url, slip_hash, ocr_status, ocr_confidence, verification_status, rejection_reason, note, reviewed_by, reviewed_at) VALUES
(1, 'TXN-202608-001', 1, 1, 500.00, '2026-08-22 14:32:00', 'SCB', '/uploads/slips/slip-demo-1.png', 'sha256-a1b2c3d4e5f6', 'MATCHED', 99.20, 'VERIFIED', NULL, 'ชำระค่าบำรุงสาขาปี 68 เรียบร้อยครับ', 'ธนวัฒน์ (เหรัญญิกสาขาจุลชีววิทยา)', '2026-08-22 15:10:00'),
(2, 'TXN-202608-002', 1, 2, 450.00, '2026-08-25 10:15:00', 'KBANK', '/uploads/slips/slip-demo-2.png', 'sha256-f6e5d4c3b2a1', 'MATCHED', 98.70, 'VERIFIED', NULL, 'เสื้อโปโล Size L และเสื้อกาวน์', 'ธนวัฒน์ (เหรัญญิกสาขาจุลชีววิทยา)', '2026-08-25 11:00:00'),
(3, 'TXN-202609-003', 3, 3, 400.00, '2026-09-02 09:40:00', 'KTB', '/uploads/slips/slip-demo-3.png', 'sha256-112233445566', 'MATCHED', 98.40, 'VERIFIED', NULL, 'ค่ายวิชาการจุลชีววิทยาน้องใหม่', 'ธนวัฒน์ (เหรัญญิกสาขาจุลชีววิทยา)', '2026-09-02 12:30:00'),
(4, 'TXN-202609-004', 5, 1, 500.00, '2026-09-06 18:22:00', 'BBL', '/uploads/slips/slip-demo-4.png', 'sha256-778899aabbcc', 'MATCHED', 97.90, 'PENDING', NULL, 'โอนผ่านโมบายแบงกิ้งครับ', NULL, NULL),
(5, 'TXN-202609-005', 6, 2, 450.00, '2026-09-07 11:05:00', 'SCB', '/uploads/slips/slip-demo-5.png', 'sha256-ddeeff001122', 'MATCHED', 99.50, 'PENDING', NULL, 'เสื้อไซส์ M 1 ตัวค่ะ', NULL, NULL),
(6, 'TXN-202609-006', 4, 3, 350.00, '2026-09-07 16:45:00', 'GSB', '/uploads/slips/slip-demo-6.png', 'sha256-334455667788', 'MISMATCH', 75.00, 'REJECTED', 'ยอดเงินโอนไม่ตรงกับค่าธรรมเนียมที่ระบุ (โอน 350 แต่ยอดจริงคือ 400 บาท)', 'โอนผ่านธนาคารออมสิน', 'ธนวัฒน์ (เหรัญญิกสาขาจุลชีววิทยา)', '2026-09-07 17:15:00')
ON DUPLICATE KEY UPDATE transaction_code=VALUES(transaction_code);

-- Insert Receipts for Verified Transactions
INSERT INTO receipts (id, receipt_number, transaction_id, issued_at, receipt_url) VALUES
(1, 'REC-2026-MICRO-001', 1, '2026-08-22 15:10:00', '/receipts/REC-2026-MICRO-001.pdf'),
(2, 'REC-2026-MICRO-002', 2, '2026-08-25 11:00:00', '/receipts/REC-2026-MICRO-002.pdf'),
(3, 'REC-2026-MICRO-003', 3, '2026-09-02 12:30:00', '/receipts/REC-2026-MICRO-003.pdf')
ON DUPLICATE KEY UPDATE receipt_number=VALUES(receipt_number);
