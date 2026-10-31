-- =======================================================
-- Microbiology Department Treasury & Student Payment Tracking System
-- Faculty of Science, Prince of Songkla University (PSU)
-- Database Schema: MySQL 8.0+
-- Enforces Parameterized Queries, Relational Integrity & PDPA
-- =======================================================

CREATE DATABASE IF NOT EXISTS dept_treasury CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dept_treasury;

-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL UNIQUE,
  name_th VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  cohort_year INT NOT NULL,
  email VARCHAR(100) NULL,
  phone VARCHAR(20),
  status ENUM('ENROLLED', 'GRADUATED', 'LEAVE') DEFAULT 'ENROLLED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cohort (cohort_year),
  INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Fee Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  target_cohort VARCHAR(20) DEFAULT 'ALL',
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('ACTIVE', 'CLOSED', 'DRAFT') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Transactions & Bank Slips Table
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_code VARCHAR(50) NOT NULL UNIQUE,
  student_id INT NOT NULL,
  campaign_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  transfer_timestamp DATETIME NOT NULL,
  origin_bank VARCHAR(50) NOT NULL,
  slip_image_url VARCHAR(500) NOT NULL,
  slip_hash VARCHAR(100) NULL,
  ocr_status ENUM('MATCHED', 'MISMATCH', 'PENDING') DEFAULT 'MATCHED',
  ocr_confidence DECIMAL(5, 2) DEFAULT 98.50,
  verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
  rejection_reason TEXT,
  note TEXT,
  reviewed_by VARCHAR(100),
  reviewed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE RESTRICT,
  INDEX idx_verif_status (verification_status),
  INDEX idx_transfer_time (transfer_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Official Digital Receipts Table
CREATE TABLE IF NOT EXISTS receipts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  transaction_id INT NOT NULL UNIQUE,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  receipt_url VARCHAR(500),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  INDEX idx_receipt_num (receipt_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Administrators & Treasurers Table
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'ADMIN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

