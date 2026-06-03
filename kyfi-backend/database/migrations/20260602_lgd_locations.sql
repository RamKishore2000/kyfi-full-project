-- LGD-backed location schema for KYFI
-- Run once on databases that do not yet have the LGD district/mandal/village structure.

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

ALTER TABLE mandals
  ADD COLUMN IF NOT EXISTS mandal_code VARCHAR(32) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS district_code VARCHAR(32) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS district_id BIGINT UNSIGNED DEFAULT NULL;

ALTER TABLE farmer_statuses
  ADD COLUMN IF NOT EXISTS district_id BIGINT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS mandal_id BIGINT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS village_id BIGINT UNSIGNED DEFAULT NULL;

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
