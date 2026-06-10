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
  aadhaar_number VARCHAR(12) DEFAULT NULL,
  gst_number VARCHAR(15) DEFAULT NULL,
  aadhaar_or_gst_number VARCHAR(32) NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending',
  language_preference VARCHAR(10) NOT NULL DEFAULT 'en',
  otp_code VARCHAR(16) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS dealer_otp_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dealer_id BIGINT UNSIGNED NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  otp_code VARCHAR(16) NOT NULL,
  verification_status ENUM('pending', 'verified', 'expired', 'locked') NOT NULL DEFAULT 'pending',
  expires_at DATETIME NOT NULL,
  verified_at DATETIME DEFAULT NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  resend_count INT NOT NULL DEFAULT 0,
  last_sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_dealer_otp_mobile_status (mobile, verification_status),
  KEY idx_dealer_otp_expires_at (expires_at),
  CONSTRAINT fk_dealer_otp_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_permissions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id BIGINT UNSIGNED NOT NULL,
  permission_key VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_permission (admin_id, permission_key),
  KEY idx_admin_permissions_admin_id (admin_id),
  CONSTRAINT fk_admin_permissions_admin FOREIGN KEY (admin_id) REFERENCES dealers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS farmer_statuses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  aadhaar VARCHAR(16) DEFAULT NULL,
  farmer_name VARCHAR(150) NOT NULL,
  mobile_number VARCHAR(20) DEFAULT NULL,
  district VARCHAR(100) NOT NULL,
  mandal VARCHAR(100) NOT NULL,
  village VARCHAR(100) NOT NULL,
  district_id BIGINT UNSIGNED DEFAULT NULL,
  mandal_id BIGINT UNSIGNED DEFAULT NULL,
  village_id BIGINT UNSIGNED DEFAULT NULL,
  status_color ENUM('GREEN', 'YELLOW', 'RED') DEFAULT NULL,
  ration_card_number VARCHAR(50) DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  amount_pending DECIMAL(12,2) DEFAULT NULL,
  remarks TEXT DEFAULT NULL,
  proof_image_path VARCHAR(255) DEFAULT NULL,
  created_by_dealer_id BIGINT UNSIGNED NOT NULL,
  vote_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_farmer_status_dealer_aadhaar (created_by_dealer_id, aadhaar),
  KEY idx_farmer_status_location (district, mandal, village),
  CONSTRAINT fk_farmer_status_created_by FOREIGN KEY (created_by_dealer_id) REFERENCES dealers(id)
);

CREATE TABLE IF NOT EXISTS farmer_status_votes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  status_id BIGINT UNSIGNED NOT NULL,
  dealer_id BIGINT UNSIGNED NOT NULL,
  vote_color ENUM('GREEN', 'YELLOW', 'RED') DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vote_once (status_id, dealer_id),
  CONSTRAINT fk_vote_status FOREIGN KEY (status_id) REFERENCES farmer_statuses(id) ON DELETE CASCADE,
  CONSTRAINT fk_vote_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS farmer_status_count_actions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  status_id BIGINT UNSIGNED NOT NULL,
  dealer_id BIGINT UNSIGNED NOT NULL,
  action_type ENUM('INCREMENT', 'DECREMENT') NOT NULL,
  proof_image_path VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_farmer_status_count_action_once (status_id, dealer_id),
  KEY idx_farmer_status_count_action_status (status_id),
  KEY idx_farmer_status_count_action_dealer (dealer_id),
  CONSTRAINT fk_farmer_status_count_action_status FOREIGN KEY (status_id) REFERENCES farmer_statuses(id) ON DELETE CASCADE,
  CONSTRAINT fk_farmer_status_count_action_dealer FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_farmer_votes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  status_id BIGINT UNSIGNED NOT NULL,
  admin_id BIGINT UNSIGNED NOT NULL,
  vote_count INT UNSIGNED NOT NULL DEFAULT 0,
  proof_image_path VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_farmer_vote_once (status_id, admin_id),
  KEY idx_admin_farmer_votes_status (status_id),
  KEY idx_admin_farmer_votes_admin (admin_id),
  CONSTRAINT fk_admin_farmer_votes_status FOREIGN KEY (status_id) REFERENCES farmer_statuses(id) ON DELETE CASCADE,
  CONSTRAINT fk_admin_farmer_votes_admin FOREIGN KEY (admin_id) REFERENCES dealers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_farmer_vote_proofs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  status_id BIGINT UNSIGNED NOT NULL,
  admin_id BIGINT UNSIGNED NOT NULL,
  proof_image_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_admin_farmer_vote_proofs_status (status_id),
  KEY idx_admin_farmer_vote_proofs_admin (admin_id),
  CONSTRAINT fk_admin_farmer_vote_proofs_status FOREIGN KEY (status_id) REFERENCES farmer_statuses(id) ON DELETE CASCADE,
  CONSTRAINT fk_admin_farmer_vote_proofs_admin FOREIGN KEY (admin_id) REFERENCES dealers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS blacklist_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  aadhaar VARCHAR(16) DEFAULT NULL,
  mobile_number VARCHAR(20) DEFAULT NULL,
  farmer_name VARCHAR(150) NOT NULL,
  district VARCHAR(100) DEFAULT NULL,
  mandal VARCHAR(100) NOT NULL,
  village VARCHAR(100) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  address VARCHAR(255) DEFAULT NULL,
  created_by_dealer_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_blacklist_aadhaar (aadhaar),
  UNIQUE KEY uq_blacklist_mobile (mobile_number),
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

CREATE TABLE IF NOT EXISTS admin_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  recipient_type ENUM('all', 'individual') NOT NULL DEFAULT 'all',
  dealer_id BIGINT UNSIGNED NULL,
  recipient_label VARCHAR(200) NOT NULL,
  recipient_company_name VARCHAR(200) DEFAULT NULL,
  recipient_owner_name VARCHAR(200) DEFAULT NULL,
  recipient_dealer_code VARCHAR(50) DEFAULT NULL,
  recipient_mobile_number VARCHAR(20) DEFAULT NULL,
  recipient_district VARCHAR(100) DEFAULT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  notification_type ENUM('Broadcast', 'Individual') NOT NULL DEFAULT 'Broadcast',
  status ENUM('Sent', 'Queued', 'Failed') NOT NULL DEFAULT 'Sent',
  sent_by_admin_id BIGINT UNSIGNED NOT NULL,
  sent_by_name VARCHAR(200) NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_admin_notifications_recipient_type (recipient_type),
  KEY idx_admin_notifications_dealer_id (dealer_id),
  KEY idx_admin_notifications_sent_at (sent_at)
);

CREATE TABLE IF NOT EXISTS site_hero_banner_settings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  desktop_image_path VARCHAR(255) DEFAULT NULL,
  desktop_image_name VARCHAR(255) DEFAULT NULL,
  mobile_image_path VARCHAR(255) DEFAULT NULL,
  mobile_image_name VARCHAR(255) DEFAULT NULL,
  updated_by_dealer_id INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

INSERT IGNORE INTO site_hero_banner_settings (id) VALUES (1);

CREATE TABLE IF NOT EXISTS subscription_settings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  plan_name VARCHAR(150) NOT NULL DEFAULT 'One Year Plan',
  yearly_price DECIMAL(10,2) NOT NULL DEFAULT 1999.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  duration_label VARCHAR(50) NOT NULL DEFAULT '1 Year',
  updated_by_admin_id BIGINT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

INSERT IGNORE INTO subscription_settings (id) VALUES (1);

CREATE TABLE IF NOT EXISTS razorpay_webhook_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  razorpay_order_id VARCHAR(100) DEFAULT NULL,
  razorpay_payment_id VARCHAR(100) DEFAULT NULL,
  processing_status ENUM('processing', 'processed', 'ignored', 'failed') NOT NULL DEFAULT 'processing',
  attempt_count INT UNSIGNED NOT NULL DEFAULT 1,
  error_message VARCHAR(500) DEFAULT NULL,
  processed_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_razorpay_webhook_event_id (event_id),
  KEY idx_razorpay_webhook_order_id (razorpay_order_id),
  KEY idx_razorpay_webhook_payment_id (razorpay_payment_id)
);

CREATE TABLE IF NOT EXISTS districts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  district_code VARCHAR(32) NOT NULL,
  district_name VARCHAR(150) NOT NULL,
  state_name VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_district_code (district_code),
  KEY idx_district_name (district_name),
  KEY idx_district_state_name (state_name)
);

CREATE TABLE IF NOT EXISTS mandals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  state_name VARCHAR(100) NOT NULL,
  district_name VARCHAR(150) NOT NULL,
  mandal_name VARCHAR(150) NOT NULL,
  source_label VARCHAR(100) DEFAULT NULL,
  mandal_code VARCHAR(32) DEFAULT NULL,
  district_code VARCHAR(32) DEFAULT NULL,
  district_id BIGINT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mandal_state_district_name (state_name, district_name, mandal_name),
  UNIQUE KEY uq_mandal_code (mandal_code),
  KEY idx_mandal_state_district (state_name, district_name),
  KEY idx_mandal_name (mandal_name),
  KEY idx_mandal_district_id (district_id),
  KEY idx_mandal_district_code (district_code)
);

CREATE TABLE IF NOT EXISTS villages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  village_code VARCHAR(32) NOT NULL,
  village_name VARCHAR(150) NOT NULL,
  mandal_code VARCHAR(32) NOT NULL,
  mandal_id BIGINT UNSIGNED NOT NULL,
  district_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_village_code (village_code),
  KEY idx_village_name (village_name),
  KEY idx_village_mandal_id (mandal_id),
  KEY idx_village_district_id (district_id)
);

INSERT INTO dealers (id, role, name, mobile, password_hash, shop_name, district, state, mandal, village, aadhaar_number, gst_number, aadhaar_or_gst_number, status, otp_code)
VALUES
  (1, 'admin', 'KYFI Admin', '9000000000', NULL, 'KYFI Control', 'Guntur', 'Andhra Pradesh', 'Guntur East', 'Kondapalli', NULL, NULL, 'ADMIN001', 'approved', '123456'),
  (2, 'dealer', 'Ramesh Kumar', '9876543210', NULL, 'Sri Lakshmi Pesticides', 'Guntur', 'Andhra Pradesh', 'Guntur East', 'Kondapalli', '123412341234', NULL, '123412341234', 'approved', '123456')
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
  id, aadhaar, mobile_number, farmer_name, district, mandal, village, reason, address, created_by_dealer_id
)
VALUES
  (1, '123456781234', NULL, 'Rama Devi', 'Guntur', 'Guntur East', 'Kondapalli', 'Credit taken and not repaid within the agreed season.', 'Kondapalli village', 2)
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO blacklist_reports (id, blacklist_entry_id, dealer_id)
VALUES
  (1, 1, 2)
ON DUPLICATE KEY UPDATE id = id;
