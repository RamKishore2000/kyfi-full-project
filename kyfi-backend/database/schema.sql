CREATE DATABASE IF NOT EXISTS kyfi;
USE kyfi;

CREATE TABLE IF NOT EXISTS dealers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role ENUM('dealer', 'admin') NOT NULL DEFAULT 'dealer',
  name VARCHAR(150) NOT NULL,
  mobile VARCHAR(20) NOT NULL UNIQUE,
  password_hash VARCHAR(128) DEFAULT NULL,
  shop_name VARCHAR(200) NOT NULL,
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  mandal VARCHAR(100) NOT NULL,
  village VARCHAR(100) NOT NULL,
  aadhaar_or_gst_number VARCHAR(32) NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending',
  language_preference VARCHAR(10) NOT NULL DEFAULT 'en',
  otp_code VARCHAR(16) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS farmer_statuses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  aadhaar VARCHAR(16) NOT NULL,
  farmer_name VARCHAR(150) NOT NULL,
  mobile_number VARCHAR(20) DEFAULT NULL,
  district VARCHAR(100) NOT NULL,
  mandal VARCHAR(100) NOT NULL,
  village VARCHAR(100) NOT NULL,
  status_color ENUM('GREEN', 'YELLOW', 'RED') NOT NULL,
  ration_card_number VARCHAR(50) DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  amount_pending DECIMAL(12,2) DEFAULT NULL,
  remarks TEXT DEFAULT NULL,
  created_by_dealer_id BIGINT UNSIGNED NOT NULL,
  vote_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_farmer_status_aadhaar (aadhaar),
  KEY idx_farmer_status_location (district, mandal, village),
  CONSTRAINT fk_farmer_status_created_by FOREIGN KEY (created_by_dealer_id) REFERENCES dealers(id)
);

CREATE TABLE IF NOT EXISTS farmer_status_votes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  status_id BIGINT UNSIGNED NOT NULL,
  dealer_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vote_once (status_id, dealer_id),
  CONSTRAINT fk_vote_status FOREIGN KEY (status_id) REFERENCES farmer_statuses(id) ON DELETE CASCADE,
  CONSTRAINT fk_vote_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS blacklist_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  aadhaar VARCHAR(16) NOT NULL,
  farmer_name VARCHAR(150) NOT NULL,
  district VARCHAR(100) NOT NULL,
  mandal VARCHAR(100) NOT NULL,
  village VARCHAR(100) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  address VARCHAR(255) DEFAULT NULL,
  created_by_dealer_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_blacklist_aadhaar (aadhaar),
  KEY idx_blacklist_location (district, mandal, village),
  CONSTRAINT fk_blacklist_created_by FOREIGN KEY (created_by_dealer_id) REFERENCES dealers(id)
);

CREATE TABLE IF NOT EXISTS blacklist_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  blacklist_entry_id BIGINT UNSIGNED NOT NULL,
  dealer_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_blacklist_report_once (blacklist_entry_id, dealer_id),
  KEY idx_blacklist_report_entry (blacklist_entry_id),
  KEY idx_blacklist_report_dealer (dealer_id),
  CONSTRAINT fk_blacklist_report_entry FOREIGN KEY (blacklist_entry_id) REFERENCES blacklist_entries(id) ON DELETE CASCADE,
  CONSTRAINT fk_blacklist_report_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE
);

INSERT INTO dealers (id, role, name, mobile, password_hash, shop_name, district, state, mandal, village, aadhaar_or_gst_number, status, otp_code)
VALUES
  (1, 'admin', 'KYFI Admin', '9000000000', NULL, 'KYFI Control', 'Guntur', 'Andhra Pradesh', 'Guntur East', 'Kondapalli', 'ADMIN001', 'approved', '123456'),
  (2, 'dealer', 'Ramesh Kumar', '9876543210', NULL, 'Sri Lakshmi Pesticides', 'Guntur', 'Andhra Pradesh', 'Guntur East', 'Kondapalli', '123412341234', 'approved', '123456')
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO farmer_statuses (
  id, aadhaar, farmer_name, mobile_number, district, mandal, village, status_color,
  ration_card_number, address, amount_pending, remarks, created_by_dealer_id, vote_count
)
VALUES
  (1, '123456781234', 'Rama Devi', '98XX XX12 44', 'Guntur', 'Guntur East', 'Kondapalli', 'GREEN', NULL, NULL, NULL, 'Pays on time overall.', 2, 9),
  (2, '234567892345', 'Suresh Babu', '97XX XX56 11', 'Guntur', 'Guntur East', 'Kondapalli', 'RED', NULL, NULL, 12000.00, 'Repeated default.', 2, 7),
  (3, '345678903456', 'Anitha Devi', '96XX XX90 33', 'Krishna', 'Vijayawada Rural', 'Nunna', 'YELLOW', NULL, NULL, 2400.00, 'Delayed payment in last season.', 2, 4)
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO blacklist_entries (
  id, aadhaar, farmer_name, district, mandal, village, reason, address, created_by_dealer_id
)
VALUES
  (1, '123456781234', 'Rama Devi', 'Guntur', 'Guntur East', 'Kondapalli', 'Credit taken and not repaid within the agreed season.', 'Kondapalli village', 2)
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO blacklist_reports (id, blacklist_entry_id, dealer_id)
VALUES
  (1, 1, 2)
ON DUPLICATE KEY UPDATE id = id;
