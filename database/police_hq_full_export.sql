-- Police HQ Data Management System (PHDMS v2.0)
-- Full Consolidated Export Dump

CREATE DATABASE IF NOT EXISTS `police_hq_db`;
USE `police_hq_db`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `alert_reads`;
CREATE TABLE `alert_reads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `alert_id` int NOT NULL,
  `officer_id` int NOT NULL,
  `read_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_alert_officer` (`alert_id`,`officer_id`),
  KEY `idx_read_officer` (`officer_id`),
  CONSTRAINT `fk_alert_read_alert` FOREIGN KEY (`alert_id`) REFERENCES `alerts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_alert_read_officer` FOREIGN KEY (`officer_id`) REFERENCES `police_officers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `alert_reads` (`id`, `alert_id`, `officer_id`, `read_at`) VALUES (1, 1, 2, '2026-01-12 15:00:00');

DROP TABLE IF EXISTS `alerts`;
CREATE TABLE `alerts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `case_id` int DEFAULT NULL,
  `alert_message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `severity` enum('Low','Medium','High','Critical') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Medium',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_alert_case` (`case_id`),
  KEY `idx_alert_severity` (`severity`),
  KEY `idx_alert_is_read` (`is_read`),
  KEY `idx_alert_created_at` (`created_at`),
  CONSTRAINT `fk_alert_case` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `alerts` (`id`, `case_id`, `alert_message`, `severity`, `is_read`, `created_at`) VALUES (1, 1, 'CRITICAL INCIDENT: Gang member Chhota Raju apprehended in Zaveri Bazaar dacoity case. Heightened security required.', 'Critical', 0, '2026-01-12 14:30:00');
INSERT INTO `alerts` (`id`, `case_id`, `alert_message`, `severity`, `is_read`, `created_at`) VALUES (2, 7, 'Automatic Notice: Case CASE-2026-007 (Linking Road Burglary) has been pending for over 90 days without closure.', 'High', 0, '2026-02-15 02:30:00');
INSERT INTO `alerts` (`id`, `case_id`, `alert_message`, `severity`, `is_read`, `created_at`) VALUES (3, NULL, 'BOLO BROADCAST: Sharp shooter Munna Qureshi (Munna Supari) spotted near Dadar TT circle. Alert all patrol vans.', 'High', 0, '2026-03-10 08:50:00');
INSERT INTO `alerts` (`id`, `case_id`, `alert_message`, `severity`, `is_read`, `created_at`) VALUES (4, 1, 'Automatic Notice: Case CASE-2026-001 has been pending for over 90 days without closure.', 'High', 0, '2026-10-23 15:54:57');
INSERT INTO `alerts` (`id`, `case_id`, `alert_message`, `severity`, `is_read`, `created_at`) VALUES (5, 2, 'Automatic Notice: Case CASE-2026-002 has been pending for over 90 days without closure.', 'High', 0, '2026-10-23 15:54:57');
INSERT INTO `alerts` (`id`, `case_id`, `alert_message`, `severity`, `is_read`, `created_at`) VALUES (6, 3, 'Automatic Notice: Case CASE-2026-003 has been pending for over 90 days without closure.', 'High', 0, '2026-10-23 15:54:57');
INSERT INTO `alerts` (`id`, `case_id`, `alert_message`, `severity`, `is_read`, `created_at`) VALUES (7, 4, 'Automatic Notice: Case CASE-2026-004 has been pending for over 90 days without closure.', 'High', 0, '2026-10-23 15:54:57');
INSERT INTO `alerts` (`id`, `case_id`, `alert_message`, `severity`, `is_read`, `created_at`) VALUES (8, 5, 'Automatic Notice: Case CASE-2026-005 has been pending for over 90 days without closure.', 'High', 0, '2026-10-23 15:54:57');
INSERT INTO `alerts` (`id`, `case_id`, `alert_message`, `severity`, `is_read`, `created_at`) VALUES (9, 8, 'Automatic Notice: Case CASE-2026-008 has been pending for over 90 days without closure.', 'High', 0, '2026-10-23 15:54:57');
INSERT INTO `alerts` (`id`, `case_id`, `alert_message`, `severity`, `is_read`, `created_at`) VALUES (11, 9, 'High-Priority Incident Alert: New Critical crime registered under FIR-2026-009 (Armed Dacoity & Robbery (IPC 395/397)). Immediate precinct attention requested.', 'Critical', 0, '2026-10-23 16:33:15');

DROP TABLE IF EXISTS `arrests_and_custody`;
CREATE TABLE `arrests_and_custody` (
  `id` int NOT NULL AUTO_INCREMENT,
  `arrest_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `case_id` int NOT NULL,
  `suspect_id` int NOT NULL,
  `arresting_officer_id` int NOT NULL,
  `station_id` int NOT NULL,
  `booking_timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `holding_cell_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bail_status` enum('Granted','Denied','Pending','Released on Bail') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `bail_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `release_timestamp` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `arrestee_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `custody_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Police Custody (PCR)',
  `magistrate_production_deadline` datetime DEFAULT NULL,
  `medical_exam_status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Conducted - Fit for Lockup',
  `medical_officer_notes` text COLLATE utf8mb4_unicode_ci,
  `relative_intimated` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `property_seized_inventory` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `arrest_number` (`arrest_number`),
  KEY `idx_arrest_case` (`case_id`),
  KEY `idx_arrest_suspect` (`suspect_id`),
  KEY `idx_arrest_officer` (`arresting_officer_id`),
  KEY `idx_arrest_station` (`station_id`),
  KEY `idx_arrest_cell` (`holding_cell_number`),
  KEY `idx_arrest_bail` (`bail_status`),
  CONSTRAINT `fk_arrest_case` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_arrest_officer` FOREIGN KEY (`arresting_officer_id`) REFERENCES `police_officers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_arrest_station` FOREIGN KEY (`station_id`) REFERENCES `police_stations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_arrest_suspect` FOREIGN KEY (`suspect_id`) REFERENCES `criminals` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `arrests_and_custody` (`id`, `arrest_number`, `case_id`, `suspect_id`, `arresting_officer_id`, `station_id`, `booking_timestamp`, `holding_cell_number`, `bail_status`, `bail_amount`, `release_timestamp`, `created_at`, `updated_at`, `arrestee_name`, `custody_type`, `magistrate_production_deadline`, `medical_exam_status`, `medical_officer_notes`, `relative_intimated`, `property_seized_inventory`) VALUES (1, 'ARR-2026-001', 1, 1, 4, 1, '2026-01-12 14:00:00', 'Lockup Cell 2 (Azad Maidan)', 'Denied', '0.00', NULL, '2026-10-23 14:45:19', '2026-10-25 12:12:13', 'Raju Gaikwad', 'Police Custody (PCR)', '2026-01-13 14:00:00', 'Conducted - Fit for Lockup', 'G.T. Hospital Mumbai - Dr. S. Kulkarni. No external trauma noted.', 'Smt. Kavita Gaikwad (Wife) - Intimated at 20:15 IST via Phone', 'Black leather wallet, Rs. 2,450 cash, Samsung Galaxy phone, stainless steel wristwatch, leather belt.');
INSERT INTO `arrests_and_custody` (`id`, `arrest_number`, `case_id`, `suspect_id`, `arresting_officer_id`, `station_id`, `booking_timestamp`, `holding_cell_number`, `bail_status`, `bail_amount`, `release_timestamp`, `created_at`, `updated_at`, `arrestee_name`, `custody_type`, `magistrate_production_deadline`, `medical_exam_status`, `medical_officer_notes`, `relative_intimated`, `property_seized_inventory`) VALUES (2, 'ARR-2026-002', 4, 3, 5, 2, '2026-03-20 22:30:00', 'Female Lockup Cell 1 (Bandra)', 'Granted', '75000.00', NULL, '2026-10-23 14:45:19', '2026-10-25 12:12:13', 'Sunita Jadhav', 'Police Custody (PCR)', '2026-03-21 22:30:00', 'Conducted - Fit for Lockup', 'G.T. Hospital Mumbai - Dr. S. Kulkarni. No external trauma noted.', 'Smt. Kavita Gaikwad (Wife) - Intimated at 20:15 IST via Phone', 'Black leather wallet, Rs. 2,450 cash, Samsung Galaxy phone, stainless steel wristwatch, leather belt.');

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `officer_id` int DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_table` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` int DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_officer` (`officer_id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_target` (`target_table`),
  KEY `idx_audit_timestamp` (`timestamp`),
  CONSTRAINT `fk_audit_officer` FOREIGN KEY (`officer_id`) REFERENCES `police_officers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (1, 4, 'CASE_UPDATE', 'Cases', 1, 'Status: Under Investigation -> In Court; Officer: 4 -> 4; Priority: Critical -> Critical', '2026-02-10 04:30:00');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (2, 5, 'FIR_REGISTERED', 'FIR', 3, 'Registered new Cyber Extortion FIR under IT Act 66D; High severity alert triggered.', '2026-03-01 04:35:00');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (3, 1, 'LOGIN', 'Police_Officers', 1, '{"message":"Officer authenticated successfully","badge_number":"ADM-001","ip":"::1","timestamp":"2026-10-23T14:46:58.655Z"}', '2026-10-23 14:46:58');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (4, 1, 'LOGIN', 'Police_Officers', 7, '{"message":"Officer authenticated successfully","badge_number":"MH-HQ-001","ip":"::1","timestamp":"2026-10-23T14:47:51.609Z"}', '2026-10-23 14:47:51');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (5, 1, 'LOGIN', 'Police_Officers', 7, '{"message":"Officer authenticated successfully","badge_number":"MH-HQ-001","ip":"::1","timestamp":"2026-10-23T14:50:18.076Z"}', '2026-10-23 14:50:18');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (6, 2, 'LOGIN', 'Police_Officers', 14, '{"message":"Officer authenticated successfully","badge_number":"MH-MUM-1042","ip":"::1","timestamp":"2026-10-23T14:50:23.773Z"}', '2026-10-23 14:50:23');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (7, 1, 'LOGIN', 'Police_Officers', 7, '{"message":"Officer authenticated successfully","badge_number":"MH-HQ-001","ip":"::1","timestamp":"2026-10-23T14:50:25.702Z"}', '2026-10-23 14:50:25');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (8, 1, 'LOGIN', 'Police_Officers', 7, '{"message":"Officer authenticated successfully","badge_number":"MH-HQ-001","ip":"::1","timestamp":"2026-10-23T15:10:40.783Z"}', '2026-10-23 15:10:40');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (9, 2, 'LOGIN', 'Police_Officers', 14, '{"message":"Officer authenticated successfully","badge_number":"MH-MUM-1042","ip":"::1","timestamp":"2026-10-23T15:18:20.728Z"}', '2026-10-23 15:18:20');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (10, 4, 'LOGIN', 'Police_Officers', 9, '{"message":"Officer authenticated successfully","badge_number":"MH-MUM-2031","ip":"::1","timestamp":"2026-10-23T15:18:28.458Z"}', '2026-10-23 15:18:28');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (11, 2, 'LOGIN', 'Police_Officers', 14, '{"message":"Officer authenticated successfully","badge_number":"MH-MUM-1042","ip":"::1","timestamp":"2026-10-23T15:18:31.858Z"}', '2026-10-23 15:18:31');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (12, 4, 'LOGIN', 'Police_Officers', 9, '{"message":"Officer authenticated successfully","badge_number":"MH-MUM-2031","ip":"::1","timestamp":"2026-10-23T15:18:36.116Z"}', '2026-10-23 15:18:36');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (13, 2, 'LOGIN', 'Police_Officers', 14, '{"message":"Officer authenticated successfully","badge_number":"MH-MUM-1042","ip":"::1","timestamp":"2026-10-23T15:18:53.132Z"}', '2026-10-23 15:18:53');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (14, 1, 'LOGIN', 'Police_Officers', 7, '{"message":"Officer authenticated successfully","badge_number":"MH-HQ-001","ip":"::1","timestamp":"2026-10-23T15:19:00.930Z"}', '2026-10-23 15:19:00');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (15, 2, 'LOGIN', 'Police_Officers', 14, '{"message":"Officer authenticated successfully","badge_number":"MH-MUM-1042","ip":"::1","timestamp":"2026-10-23T15:19:06.827Z"}', '2026-10-23 15:19:06');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (16, 4, 'LOGIN', 'Police_Officers', 9, '{"message":"Officer authenticated successfully","badge_number":"MH-MUM-2031","ip":"::1","timestamp":"2026-10-23T15:19:12.324Z"}', '2026-10-23 15:19:12');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (17, 6, 'LOGIN', 'Police_Officers', 11, '{"message":"Officer authenticated successfully","badge_number":"MH-MUM-4011","ip":"::1","timestamp":"2026-10-23T15:19:16.167Z"}', '2026-10-23 15:19:16');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (18, 1, 'LOGIN', 'Police_Officers', 7, '{"message":"Officer authenticated successfully","badge_number":"MH-HQ-001","ip":"::1","timestamp":"2026-10-23T15:19:22.050Z"}', '2026-10-23 15:19:22');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (19, 1, 'FIR_REGISTERED', 'FIR', 11, '{"fir_number":"FIR-2026-009","case_number":"CASE-2026-009","crime_type":"Armed Dacoity & Robbery (IPC 395/397)","station_id":1}', '2026-10-23 16:33:15');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (20, 1, 'LOGIN', 'Police_Officers', 7, '{"message":"Officer authenticated successfully","badge_number":"MH-HQ-001","ip":"::1","timestamp":"2026-10-24T19:32:16.042Z"}', '2026-10-24 19:32:16');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (21, 1, 'LOGIN', 'Police_Officers', 7, '{"message":"Officer authenticated successfully","badge_number":"MH-HQ-001","ip":"::1","timestamp":"2026-10-24T19:41:57.832Z"}', '2026-10-24 19:41:57');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (22, 2, 'LOGIN', 'Police_Officers', 14, '{"message":"Officer authenticated successfully","badge_number":"MH-MUM-1042","ip":"::1","timestamp":"2026-10-24T19:41:57.960Z"}', '2026-10-24 19:41:57');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (23, NULL, 'LOGIN', 'Police_Officers', 15, '{"message":"Officer authenticated successfully","badge_number":"MH-TEST-3926","ip":"::1","timestamp":"2026-10-24T19:41:58.285Z"}', '2026-10-24 19:41:58');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (24, 1, 'LOGIN', 'Police_Officers', 7, '{"message":"Officer authenticated successfully","badge_number":"MH-HQ-001","ip":"::1","timestamp":"2026-10-24T19:53:21.820Z"}', '2026-10-24 19:53:21');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (25, 2, 'LOGIN', 'Police_Officers', 2, '{"message":"Officer authenticated successfully","badge_number":"MH-MUM-101","ip":"::1","timestamp":"2026-10-24T20:05:12.215Z"}', '2026-10-24 20:05:12');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (26, 6, 'LOGIN', 'Police_Officers', 6, '{"message":"Officer authenticated successfully","badge_number":"MH-MUM-301","ip":"::1","timestamp":"2026-10-24T20:06:33.732Z"}', '2026-10-24 20:06:33');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (27, 1, 'LOGIN', 'Police_Officers', 1, '{"message":"Officer authenticated successfully","badge_number":"MH-HQ-001","ip":"::1","timestamp":"2026-10-24T20:07:54.151Z"}', '2026-10-24 20:07:54');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (28, 2, 'LOGIN', 'Police_Officers', 2, '{"message":"Officer authenticated successfully","badge_number":"MH-MUM-101","ip":"::1","timestamp":"2026-10-25T07:15:26.488Z"}', '2026-10-25 07:15:26');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (29, 6, 'LOGIN', 'Police_Officers', 6, '{"message":"Officer authenticated successfully","badge_number":"MH-MUM-301","ip":"::1","timestamp":"2026-10-25T07:16:04.659Z"}', '2026-10-25 07:16:04');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (30, 1, 'LOGIN', 'Police_Officers', 1, '{"message":"Officer authenticated successfully","badge_number":"MH-HQ-001","ip":"::1","timestamp":"2026-10-25T07:16:44.298Z"}', '2026-10-25 07:16:44');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (31, 4, 'LOGIN', 'Police_Officers', 4, '{"message":"Officer authenticated successfully","badge_number":"MH-MUM-201","ip":"::1","timestamp":"2026-10-25T11:50:49.156Z"}', '2026-10-25 11:50:49');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (32, 4, 'FIR_REGISTERED', 'FIR', 12, '{"fir_number":"FIR-2026-010","case_number":"CASE-2026-010","crime_type":"Armed Robbery & Dacoity (IPC 395/397)","station_id":1}', '2026-10-25 11:50:49');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (33, 1, 'LOGIN', 'Police_Officers', 1, '{"message":"Officer authenticated successfully","badge_number":"MH-HQ-001","ip":"::1","timestamp":"2026-10-25T14:06:27.633Z"}', '2026-10-25 14:06:27');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (34, 1, 'LOGIN', 'Police_Officers', 1, '{"message":"Officer authenticated successfully","badge_number":"MH-HQ-001","ip":"::1","timestamp":"2026-10-26T11:16:35.032Z"}', '2026-10-26 11:16:35');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (35, 1, 'LOGIN', 'Police_Officers', 1, '{"message":"Officer authenticated successfully","badge_number":"MH-HQ-001","ip":"::1","timestamp":"2026-10-26T11:26:07.780Z"}', '2026-10-26 11:26:07');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (36, 6, 'LOGIN', 'Police_Officers', 6, '{"message":"Officer authenticated successfully","badge_number":"MH-MUM-301","ip":"::1","timestamp":"2026-10-26T11:30:14.055Z"}', '2026-10-26 11:30:14');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (37, 1, 'LOGIN', 'Police_Officers', 1, '{"message":"Officer authenticated successfully","badge_number":"MH-HQ-001","ip":"::1","timestamp":"2026-10-27T17:49:49.150Z"}', '2026-10-27 17:49:49');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (38, 1, 'LOGIN', 'Police_Officers', 1, '{"message":"Officer authenticated successfully","badge_number":"MH-HQ-001","ip":"::1","timestamp":"2026-10-27T17:55:29.485Z"}', '2026-10-27 17:55:29');
INSERT INTO `audit_logs` (`id`, `officer_id`, `action`, `target_table`, `record_id`, `details`, `timestamp`) VALUES (39, 1, 'LOGIN', 'Police_Officers', 1, '{"message":"Officer authenticated successfully","badge_number":"MH-HQ-001","ip":"::1","timestamp":"2026-10-27T18:04:01.928Z"}', '2026-10-27 18:04:01');

DROP TABLE IF EXISTS `case_criminal_junction`;
CREATE TABLE `case_criminal_junction` (
  `id` int NOT NULL AUTO_INCREMENT,
  `case_id` int NOT NULL,
  `criminal_id` int NOT NULL,
  `involvement_type` enum('Suspect','Accused','Convicted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Suspect',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_case_criminal` (`case_id`,`criminal_id`),
  KEY `idx_junction_case` (`case_id`),
  KEY `idx_junction_criminal` (`criminal_id`),
  KEY `idx_junction_type` (`involvement_type`),
  CONSTRAINT `fk_junction_case` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_junction_criminal` FOREIGN KEY (`criminal_id`) REFERENCES `criminals` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `case_criminal_junction` (`id`, `case_id`, `criminal_id`, `involvement_type`, `notes`, `created_at`) VALUES (1, 1, 1, 'Accused', 'Identified via Zaveri Bazaar shop CCTV footage and forearm Trishul tattoo match.', '2026-10-23 14:45:19');
INSERT INTO `case_criminal_junction` (`id`, `case_id`, `criminal_id`, `involvement_type`, `notes`, `created_at`) VALUES (2, 1, 4, 'Suspect', 'Believed to have operated getaway Pulsar motorcycle during escape.', '2026-10-23 14:45:19');
INSERT INTO `case_criminal_junction` (`id`, `case_id`, `criminal_id`, `involvement_type`, `notes`, `created_at`) VALUES (3, 2, 2, 'Suspect', 'Vehicle electronics cloned using frequency devices traced to Munna Supari network.', '2026-10-23 14:45:19');
INSERT INTO `case_criminal_junction` (`id`, `case_id`, `criminal_id`, `involvement_type`, `notes`, `created_at`) VALUES (4, 3, 5, 'Suspect', 'Digital footprint and Bitcoin wallet transactions traced to alias Hacker Sam.', '2026-10-23 14:45:19');
INSERT INTO `case_criminal_junction` (`id`, `case_id`, `criminal_id`, `involvement_type`, `notes`, `created_at`) VALUES (5, 4, 3, 'Accused', 'Apprehended in possession of Mephedrone packets during Bandra WEH nakabandi.', '2026-10-23 14:45:19');
INSERT INTO `case_criminal_junction` (`id`, `case_id`, `criminal_id`, `involvement_type`, `notes`, `created_at`) VALUES (6, 5, 1, 'Suspect', 'Informant tip indicated Chhota Raju gang members were active in Sassoon Docks.', '2026-10-23 14:45:19');
INSERT INTO `case_criminal_junction` (`id`, `case_id`, `criminal_id`, `involvement_type`, `notes`, `created_at`) VALUES (7, 6, 6, 'Convicted', 'Admitted to coordinating extortion threats and supplying country-made revolvers.', '2026-10-23 14:45:19');

DROP TABLE IF EXISTS `cases`;
CREATE TABLE `cases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `case_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fir_id` int NOT NULL,
  `assigned_officer_id` int DEFAULT NULL,
  `case_status` enum('Filed','Under Investigation','Warrant Issued','In Court','Closed','Cold') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Filed',
  `priority` enum('Low','Medium','High','Critical') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Medium',
  `open_date` date NOT NULL,
  `close_date` date DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `case_number` (`case_number`),
  UNIQUE KEY `fir_id` (`fir_id`),
  KEY `idx_case_status` (`case_status`),
  KEY `idx_case_assigned_officer` (`assigned_officer_id`),
  KEY `idx_case_open_date` (`open_date`),
  KEY `idx_case_priority` (`priority`),
  KEY `idx_case_deleted` (`is_deleted`),
  CONSTRAINT `fk_cases_fir` FOREIGN KEY (`fir_id`) REFERENCES `fir` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_cases_officer` FOREIGN KEY (`assigned_officer_id`) REFERENCES `police_officers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (1, 'CASE-2026-001', 1, 4, 'In Court', 'Critical', '2026-01-09 18:30:00', NULL, 0, '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (2, 'CASE-2026-002', 2, 4, 'Warrant Issued', 'High', '2026-02-14 18:30:00', NULL, 0, '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (3, 'CASE-2026-003', 3, 5, 'Under Investigation', 'High', '2026-02-28 18:30:00', NULL, 0, '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (4, 'CASE-2026-004', 4, 5, 'Filed', 'Medium', '2026-03-19 18:30:00', NULL, 0, '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (5, 'CASE-2026-005', 5, 4, 'Under Investigation', 'Critical', '2026-03-24 18:30:00', NULL, 0, '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (6, 'CASE-2026-006', 6, 4, 'Closed', 'Medium', '2025-11-04 18:30:00', '2026-02-27 18:30:00', 0, '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (7, 'CASE-2026-007', 7, 5, 'Cold', 'Low', '2025-08-09 18:30:00', NULL, 0, '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (8, 'CASE-2026-008', 8, NULL, 'Filed', 'Low', '2026-03-31 18:30:00', NULL, 0, '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (9, 'CASE-2026-009', 11, NULL, 'Filed', 'Critical', '2026-10-22 18:30:00', NULL, 0, '2026-10-23 16:33:15', '2026-10-23 16:33:15');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (11, 'CASE-2025-012', 13, 2, 'Closed', 'Critical', '2025-11-17 18:30:00', '2026-01-19 18:30:00', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (12, 'CASE-2025-013', 14, 5, 'Closed', 'High', '2025-12-07 18:30:00', '2026-02-13 18:30:00', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (13, 'CASE-2025-014', 15, 4, 'Closed', 'Medium', '2025-12-21 18:30:00', '2026-01-29 18:30:00', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (14, 'CASE-2026-015', 16, 13, 'Closed', 'Medium', '2026-01-21 18:30:00', '2026-03-09 18:30:00', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (15, 'CASE-2026-016', 17, 12, 'Closed', 'High', '2026-02-09 18:30:00', '2026-04-14 18:30:00', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (16, 'CASE-2026-017', 18, 2, 'Closed', 'Medium', '2026-03-13 18:30:00', '2026-05-19 18:30:00', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (17, 'CASE-2026-018', 19, 5, 'Closed', 'High', '2026-04-11 18:30:00', '2026-06-17 18:30:00', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (18, 'CASE-2026-019', 20, 13, 'Under Investigation', 'Critical', '2026-04-25 18:30:00', NULL, 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (19, 'CASE-2026-020', 21, 4, 'Closed', 'Low', '2026-05-08 18:30:00', '2026-07-01 18:30:00', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (20, 'CASE-2026-021', 22, 12, 'Under Investigation', 'Medium', '2026-05-20 18:30:00', NULL, 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (21, 'CASE-2026-022', 23, 13, 'In Court', 'Critical', '2026-06-03 18:30:00', NULL, 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (22, 'CASE-2026-023', 24, 2, 'Closed', 'Critical', '2026-06-18 18:30:00', '2026-08-10 18:30:00', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (23, 'CASE-2026-024', 25, 5, 'Closed', 'High', '2026-07-10 18:30:00', '2026-09-04 18:30:00', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (24, 'CASE-2026-025', 26, 4, 'Under Investigation', 'High', '2026-07-27 18:30:00', NULL, 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (25, 'CASE-2026-026', 27, 12, 'Closed', 'High', '2026-08-06 18:30:00', '2026-09-24 18:30:00', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (26, 'CASE-2026-027', 28, 2, 'Under Investigation', 'Medium', '2026-08-22 18:30:00', NULL, 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (27, 'CASE-2026-028', 29, 13, 'Closed', 'Medium', '2026-09-02 18:30:00', '2026-10-11 18:30:00', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (28, 'CASE-2026-029', 30, 5, 'Under Investigation', 'Medium', '2026-09-16 18:30:00', NULL, 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (29, 'CASE-2026-030', 31, 4, 'Under Investigation', 'High', '2026-10-04 18:30:00', NULL, 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `cases` (`id`, `case_number`, `fir_id`, `assigned_officer_id`, `case_status`, `priority`, `open_date`, `close_date`, `is_deleted`, `created_at`, `updated_at`) VALUES (30, 'CASE-2026-031', 32, 13, 'Under Investigation', 'Critical', '2026-10-14 18:30:00', NULL, 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13');

DROP TABLE IF EXISTS `court_dates`;
CREATE TABLE `court_dates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `case_id` int NOT NULL,
  `criminal_id` int DEFAULT NULL,
  `hearing_date` datetime NOT NULL,
  `court_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `judge_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `decision` enum('Pending','Guilty','Not Guilty','Bail') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_court_case` (`case_id`),
  KEY `idx_court_criminal` (`criminal_id`),
  KEY `idx_court_hearing_date` (`hearing_date`),
  KEY `idx_court_decision` (`decision`),
  CONSTRAINT `fk_court_case` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_court_criminal` FOREIGN KEY (`criminal_id`) REFERENCES `criminals` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `court_dates` (`id`, `case_id`, `criminal_id`, `hearing_date`, `court_name`, `judge_name`, `decision`, `notes`, `created_at`, `updated_at`) VALUES (1, 1, 1, '2026-10-25 05:30:00', 'City Civil & Sessions Court Fort, Courtroom 14', 'Hon. Additional Sessions Judge R. K. Joshi', 'Pending', 'Evidentiary admissibility hearing regarding recovered 7.65mm weapon and FSL ballistic report.', '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `court_dates` (`id`, `case_id`, `criminal_id`, `hearing_date`, `court_name`, `judge_name`, `decision`, `notes`, `created_at`, `updated_at`) VALUES (2, 6, 6, '2026-02-14 09:00:00', 'Pune District & Sessions Court, Shivajinagar', 'Hon. Sessions Judge S. V. Mahajan', 'Guilty', 'Convicted under Arms Act Section 25(1B)(a) and IPC 387; sentenced to 5 years rigorous imprisonment.', '2026-10-23 14:45:19', '2026-10-23 14:45:19');

DROP TABLE IF EXISTS `criminals`;
CREATE TABLE `criminals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alias` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `gender` enum('Male','Female','Other','Unknown') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Unknown',
  `physical_description` text COLLATE utf8mb4_unicode_ci,
  `mugshot_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `id_proof_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `threat_level` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Medium',
  `gang_affiliation` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT 'Independent',
  `prior_convictions_count` int DEFAULT '0',
  `fingerprint_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `known_territory` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_criminal_name` (`last_name`,`first_name`),
  KEY `idx_criminal_alias` (`alias`),
  KEY `idx_criminal_deleted` (`is_deleted`),
  FULLTEXT KEY `ft_criminal_search` (`alias`,`physical_description`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `criminals` (`id`, `first_name`, `last_name`, `alias`, `dob`, `gender`, `physical_description`, `mugshot_path`, `is_deleted`, `created_at`, `updated_at`, `id_proof_number`, `father_name`, `threat_level`, `gang_affiliation`, `prior_convictions_count`, `fingerprint_id`, `known_territory`) VALUES (1, 'Raju', 'Gaikwad', 'Chhota Raju', '1987-05-13 18:30:00', 'Male', 'Height 5ft 8in, wheatish complexion, trident (Trishul) tattoo on right wrist, deep scar near left ear, walks with slight swagger.', '/police_storage/mugshots/raju_gaikwad.jpg', 0, '2026-10-23 14:45:19', '2026-10-25 12:12:13', 'AADHAAR-8921-4491-0012', 'Kishan Gaikwad', 'High', 'Gaikwad Syndicate', 3, 'FP-MH-99214', 'Zaveri Bazaar, South Mumbai');
INSERT INTO `criminals` (`id`, `first_name`, `last_name`, `alias`, `dob`, `gender`, `physical_description`, `mugshot_path`, `is_deleted`, `created_at`, `updated_at`, `id_proof_number`, `father_name`, `threat_level`, `gang_affiliation`, `prior_convictions_count`, `fingerprint_id`, `known_territory`) VALUES (2, 'Munna', 'Qureshi', 'Munna Supari', '1982-11-19 18:30:00', 'Male', 'Height 5ft 11in, dark complexion, thick mustache, slight limp on left foot due to old bullet injury, gold tooth in upper jaw.', '/police_storage/mugshots/munna_qureshi.jpg', 0, '2026-10-23 14:45:19', '2026-10-25 12:12:13', 'AADHAAR-4491-9921-5512', 'Rashid Qureshi', 'Critical / Hardened', 'D-Company Syndicate', 5, 'FP-MH-10294', 'Dongri / Bhendi Bazaar');
INSERT INTO `criminals` (`id`, `first_name`, `last_name`, `alias`, `dob`, `gender`, `physical_description`, `mugshot_path`, `is_deleted`, `created_at`, `updated_at`, `id_proof_number`, `father_name`, `threat_level`, `gang_affiliation`, `prior_convictions_count`, `fingerprint_id`, `known_territory`) VALUES (3, 'Sunita', 'Jadhav', 'Mami', '1991-03-11 18:30:00', 'Female', 'Height 5ft 4in, fair complexion, round face, small black mole on right cheek, prominent silver ring on left thumb.', '/police_storage/mugshots/sunita_jadhav.jpg', 0, '2026-10-23 14:45:19', '2026-10-23 14:45:19', NULL, NULL, 'Medium', 'Independent', 0, NULL, NULL);
INSERT INTO `criminals` (`id`, `first_name`, `last_name`, `alias`, `dob`, `gender`, `physical_description`, `mugshot_path`, `is_deleted`, `created_at`, `updated_at`, `id_proof_number`, `father_name`, `threat_level`, `gang_affiliation`, `prior_convictions_count`, `fingerprint_id`, `known_territory`) VALUES (4, 'Bablu', 'Kadam', 'Hathoda', '1985-08-24 18:30:00', 'Male', 'Height 6ft 2in, heavy muscular build, shaved head, knife laceration mark across collarbone, speaks Marathi with Kolhapuri dialect.', '/police_storage/mugshots/bablu_kadam.jpg', 0, '2026-10-23 14:45:19', '2026-10-23 14:45:19', NULL, NULL, 'Medium', 'Independent', 0, NULL, NULL);
INSERT INTO `criminals` (`id`, `first_name`, `last_name`, `alias`, `dob`, `gender`, `physical_description`, `mugshot_path`, `is_deleted`, `created_at`, `updated_at`, `id_proof_number`, `father_name`, `threat_level`, `gang_affiliation`, `prior_convictions_count`, `fingerprint_id`, `known_territory`) VALUES (5, 'Sameer', 'Tambe', 'Hacker Sam', '1996-01-17 18:30:00', 'Male', 'Height 5ft 7in, lean build, spectacles with black rectangular frame, burn scar on left palm.', '/police_storage/mugshots/sameer_tambe.jpg', 0, '2026-10-23 14:45:19', '2026-10-23 14:45:19', NULL, NULL, 'Medium', 'Independent', 0, NULL, NULL);
INSERT INTO `criminals` (`id`, `first_name`, `last_name`, `alias`, `dob`, `gender`, `physical_description`, `mugshot_path`, `is_deleted`, `created_at`, `updated_at`, `id_proof_number`, `father_name`, `threat_level`, `gang_affiliation`, `prior_convictions_count`, `fingerprint_id`, `known_territory`) VALUES (6, 'Reshma', 'Bhosale', 'Madam X', '1989-10-08 18:30:00', 'Female', 'Height 5ft 6in, wheatish complexion, shoulder-length straight black hair, crescent moon tattoo behind right ear.', '/police_storage/mugshots/reshma_bhosale.jpg', 0, '2026-10-23 14:45:19', '2026-10-23 14:45:19', NULL, NULL, 'Medium', 'Independent', 0, NULL, NULL);

DROP TABLE IF EXISTS `evidence_chain_of_custody`;
CREATE TABLE `evidence_chain_of_custody` (
  `id` int NOT NULL AUTO_INCREMENT,
  `evidence_id` int NOT NULL,
  `transferred_from_officer_id` int DEFAULT NULL,
  `transferred_to_officer_id` int NOT NULL,
  `transfer_timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `purpose` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `custody_location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_custody_evidence` (`evidence_id`),
  KEY `idx_custody_transfer_to` (`transferred_to_officer_id`),
  KEY `idx_custody_timestamp` (`transfer_timestamp`),
  KEY `fk_custody_from_officer` (`transferred_from_officer_id`),
  CONSTRAINT `fk_custody_evidence` FOREIGN KEY (`evidence_id`) REFERENCES `evidences` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_custody_from_officer` FOREIGN KEY (`transferred_from_officer_id`) REFERENCES `police_officers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_custody_to_officer` FOREIGN KEY (`transferred_to_officer_id`) REFERENCES `police_officers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `evidence_chain_of_custody` (`id`, `evidence_id`, `transferred_from_officer_id`, `transferred_to_officer_id`, `transfer_timestamp`, `purpose`, `custody_location`, `created_at`) VALUES (1, 1, NULL, 6, '2026-01-10 05:30:00', 'Initial crime scene seizure at Zaveri Bazaar and entry into Azad Maidan Malkhana', 'Azad Maidan Police Station Malkhana', '2026-10-23 14:45:19');
INSERT INTO `evidence_chain_of_custody` (`id`, `evidence_id`, `transferred_from_officer_id`, `transferred_to_officer_id`, `transfer_timestamp`, `purpose`, `custody_location`, `created_at`) VALUES (2, 1, 6, 4, '2026-02-10 04:00:00', 'Transferred to PSI Sachin Sawant for Sessions Court ballistic demonstration', 'City Civil & Sessions Court Fort, Mumbai', '2026-10-23 14:45:19');
INSERT INTO `evidence_chain_of_custody` (`id`, `evidence_id`, `transferred_from_officer_id`, `transferred_to_officer_id`, `transfer_timestamp`, `purpose`, `custody_location`, `created_at`) VALUES (3, 2, NULL, 6, '2026-01-10 07:00:00', 'Seized and sealed from jewelry shop CCTV DVR unit under Panchnama', 'Azad Maidan Malkhana Digital Vault', '2026-10-23 14:45:19');
INSERT INTO `evidence_chain_of_custody` (`id`, `evidence_id`, `transferred_from_officer_id`, `transferred_to_officer_id`, `transfer_timestamp`, `purpose`, `custody_location`, `created_at`) VALUES (4, 3, NULL, 6, '2026-03-02 03:15:00', 'Confiscated during residence search under Panchnama at Kurla West', 'BKC Cyber Police Station Lab', '2026-10-23 14:45:19');

DROP TABLE IF EXISTS `evidences`;
CREATE TABLE `evidences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `evidence_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `case_id` int NOT NULL,
  `logged_by_officer_id` int NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `evidence_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `storage_location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_hash` char(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size_bytes` bigint DEFAULT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `station_id` int DEFAULT NULL,
  `locker_bin_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chain_of_custody_status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'In Malkhana Vault',
  `seizure_memo_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `witness_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `evidence_number` (`evidence_number`),
  KEY `idx_evidence_case` (`case_id`),
  KEY `idx_evidence_officer` (`logged_by_officer_id`),
  KEY `idx_evidence_type` (`evidence_type`),
  KEY `idx_evidence_hash` (`file_hash`),
  KEY `idx_evidence_deleted` (`is_deleted`),
  CONSTRAINT `fk_evidence_case` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_evidence_officer` FOREIGN KEY (`logged_by_officer_id`) REFERENCES `police_officers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `evidences` (`id`, `evidence_number`, `case_id`, `logged_by_officer_id`, `description`, `evidence_type`, `storage_location`, `file_path`, `file_hash`, `file_size_bytes`, `mime_type`, `is_deleted`, `created_at`, `updated_at`, `station_id`, `locker_bin_number`, `chain_of_custody_status`, `seizure_memo_number`, `witness_name`) VALUES (1, 'EVD-2026-001', 1, 6, 'Country-made 7.65mm pistol (Katta) with 3 live rounds seized from Mumbadevi drain', 'Firearm', 'Malkhana Ballistics Locker B-104', '/police_storage/evidences/katta_765mm_zaveri.dat', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 1024, 'application/octet-stream', 0, '2026-10-23 14:45:19', '2026-10-25 12:12:13', 1, 'Rack A, Shelf 2, Bin #04', 'In Malkhana Vault', 'PANCH-2026-001', 'Ramesh Patil (Independent Panch)');
INSERT INTO `evidences` (`id`, `evidence_number`, `case_id`, `logged_by_officer_id`, `description`, `evidence_type`, `storage_location`, `file_path`, `file_hash`, `file_size_bytes`, `mime_type`, `is_deleted`, `created_at`, `updated_at`, `station_id`, `locker_bin_number`, `chain_of_custody_status`, `seizure_memo_number`, `witness_name`) VALUES (2, 'EVD-2026-002', 1, 6, 'High-definition digital video pendrive of Zaveri Bazaar lane CCTV camera #4', 'Digital Video', 'Malkhana Digital Safe Vault Alpha', '/police_storage/evidences/cctv_zaveri_bazaar.mp4', 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e', 41943040, 'video/mp4', 0, '2026-10-23 14:45:19', '2026-10-25 12:12:13', 1, 'Rack A, Shelf 2, Bin #04', 'In Malkhana Vault', 'PANCH-2026-002', 'Ramesh Patil (Independent Panch)');
INSERT INTO `evidences` (`id`, `evidence_number`, `case_id`, `logged_by_officer_id`, `description`, `evidence_type`, `storage_location`, `file_path`, `file_hash`, `file_size_bytes`, `mime_type`, `is_deleted`, `created_at`, `updated_at`, `station_id`, `locker_bin_number`, `chain_of_custody_status`, `seizure_memo_number`, `witness_name`) VALUES (3, 'EVD-2026-003', 3, 6, 'Seized Lenovo ThinkPad laptop containing VPN proxy logs and extortion script files', 'Hardware', 'Cyber Cell Forensic Lab Rack 2', '/police_storage/evidences/laptop_tambe_dump.img', '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', 104857600, 'application/octet-stream', 0, '2026-10-23 14:45:19', '2026-10-25 12:12:13', 2, 'Rack A, Shelf 2, Bin #04', 'In Malkhana Vault', 'PANCH-2026-003', 'Ramesh Patil (Independent Panch)');
INSERT INTO `evidences` (`id`, `evidence_number`, `case_id`, `logged_by_officer_id`, `description`, `evidence_type`, `storage_location`, `file_path`, `file_hash`, `file_size_bytes`, `mime_type`, `is_deleted`, `created_at`, `updated_at`, `station_id`, `locker_bin_number`, `chain_of_custody_status`, `seizure_memo_number`, `witness_name`) VALUES (4, 'EVD-2026-004', 4, 6, 'Forensic Science Laboratory (FSL Kalina) chemical report confirming 500g Mephedrone', 'Document', 'Malkhana FSL Archive Shelf F-12', '/police_storage/evidences/fsl_kalina_md_report.pdf', 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9', 512000, 'application/pdf', 0, '2026-10-23 14:45:19', '2026-10-25 12:12:13', 2, 'Rack A, Shelf 2, Bin #04', 'In Malkhana Vault', 'PANCH-2026-004', 'Ramesh Patil (Independent Panch)');

DROP TABLE IF EXISTS `fir`;
CREATE TABLE `fir` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fir_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `station_id` int NOT NULL,
  `filed_by_officer_id` int NOT NULL,
  `date_filed` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `incident_date` datetime NOT NULL,
  `crime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Pending','Active','Closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `complainant_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `complainant_phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `complainant_address` text COLLATE utf8mb4_unicode_ci,
  `complainant_id_proof` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `complainant_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Citizen / Victim',
  `accused_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accused_alias` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accused_details` text COLLATE utf8mb4_unicode_ci,
  `suspect_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Named in FIR',
  PRIMARY KEY (`id`),
  UNIQUE KEY `fir_number` (`fir_number`),
  KEY `idx_fir_station` (`station_id`),
  KEY `idx_fir_officer` (`filed_by_officer_id`),
  KEY `idx_fir_crime_type` (`crime_type`),
  KEY `idx_fir_status` (`status`),
  KEY `idx_fir_date_filed` (`date_filed`),
  KEY `idx_fir_coordinates` (`latitude`,`longitude`),
  KEY `idx_fir_deleted` (`is_deleted`),
  CONSTRAINT `fk_fir_officer` FOREIGN KEY (`filed_by_officer_id`) REFERENCES `police_officers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_fir_station` FOREIGN KEY (`station_id`) REFERENCES `police_stations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (1, 'FIR-2026-001', 1, 4, '2026-01-10 04:00:00', '2026-01-10 02:45:00', 'Armed Dacoity & Robbery (IPC 395/397)', 'Armed dacoity reported at Zaveri Bazaar jewelry showroom. Three masked assailants brandished country-made pistols (Katta) and fled on black Bajaj Pulsar motorbikes toward Marine Drive.', 'Active', '18.95020000', '72.83180000', 0, '2026-10-23 14:45:19', '2026-10-25 07:29:00', 'Mohanlal Zaveri', '+91 98201 44552', 'Shop 14, Bullion Exchange Bldg, Zaveri Bazaar, South Mumbai', 'Aadhaar 4921-8842-1092', 'Citizen / Victim', 'Raju Gaikwad', 'Chhota Raju', 'Height 5ft 8in, trident tattoo on right wrist, deep scar near left ear. Fled on black Bajaj Pulsar motorbikes with country-made pistols.', 'Absconding');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (2, 'FIR-2026-002', 1, 4, '2026-02-15 08:45:00', '2026-02-15 06:00:00', 'Motor Vehicle Theft (IPC 379)', 'White luxury executive SUV stolen from outside corporate towers at Nariman Point using electronic frequency jamming and key-cloning device.', 'Active', '18.92560000', '72.82420000', 0, '2026-10-23 14:45:19', '2026-10-25 07:29:00', 'Aditya Singhania', '+91 98202 33441', 'Flat 12B, Sea Lord Apts, Cuffe Parade, South Mumbai', 'Aadhaar 3810-9281-4451', 'Citizen / Victim', 'Sameer Tambe', 'Hacker Sam', 'Electronic frequency jammer and key-cloning operator, burn scar on left palm, lean build.', 'Under Investigation');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (3, 'FIR-2026-003', 2, 5, '2026-03-01 04:30:00', '2026-02-28 18:15:00', 'Cyber Extortion & Ransomware (IT Act 66D)', 'Corporate ransomware payload deployed against financial services firm at Bandra-Kurla Complex (BKC); cryptocurrency ransom demanded to release decryptor.', 'Active', '19.06570000', '72.86870000', 0, '2026-10-23 14:45:19', '2026-10-25 07:29:00', 'Meera Nair', '+91 98203 77889', 'FinEdge Solutions, 5th Floor, G-Block, BKC, Bandra East, Mumbai', 'PAN ABCPN1294F', 'Citizen / Victim', 'Unidentified Cyber Syndicate', 'DarkNet-Shadow', 'Ransomware deployment operator demanding 4.5 BTC cryptocurrency ransom; operating through international proxies.', 'Unidentified');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (4, 'FIR-2026-004', 2, 5, '2026-03-20 11:15:00', '2026-03-20 09:50:00', 'Narcotics Trafficking (NDPS Act 21/22)', 'Commercial quantity consignment of 500g Mephedrone (MD) seized during nighttime highway nakabandi near Western Express Highway Bandra flyover.', 'Pending', '19.05530000', '72.84200000', 0, '2026-10-23 14:45:19', '2026-10-25 07:29:00', 'API Ananya Patil', '+91 98205 56677', 'Bandra Police Station Detection Squad, Zone IX', 'Service Badge MH-MUM-202', 'Reporting Officer', 'Munna Qureshi', 'Munna Supari', 'Height 5ft 11in, thick mustache, gold tooth upper jaw, intercepted with 500g commercial Mephedrone (MD).', 'Apprehended');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (5, 'FIR-2026-005', 1, 4, '2026-03-25 01:50:00', '2026-03-24 22:30:00', 'Homicide & Murder (IPC 302)', 'Unidentified adult male body with blunt-force trauma injuries discovered inside abandoned warehouse structure near Sassoon Docks waterfront in Colaba.', 'Active', '18.91350000', '72.82450000', 0, '2026-10-23 14:45:19', '2026-10-25 07:29:00', 'Santosh Koli', '+91 98208 11223', 'Sassoon Docks Fish Landing Jetty, Colaba, Mumbai', 'Voter ID VTR-MH-88192', 'Eyewitness', 'Bablu Kadam', 'Hathoda', 'Height 6ft 2in, heavy muscular build, shaved head, knife laceration across collarbone, Kolhapuri Marathi dialect.', 'Absconding');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (6, 'FIR-2026-006', 3, 4, '2025-11-05 05:40:00', '2025-11-04 16:30:00', 'Extortion & Arms Act (IPC 384/387, Arms Act 25)', 'Extortion demand of Rs 50 Lakh made to prominent infrastructure developer on F.C. Road Shivaji Nagar Pune; two country-made revolvers recovered.', 'Closed', '18.53140000', '73.84460000', 0, '2026-10-23 14:45:19', '2026-10-25 07:29:00', 'Dilip Chordia', '+91 98209 66778', 'Chordia Heights, F.C. Road, Shivaji Nagar, Pune-411005', 'Aadhaar 8812-4410-9921', 'Citizen / Victim', 'Munna Qureshi & Associates', 'Munna Supari', 'Extortion demand of Rs 50 Lakh made via VoIP; two country-made revolvers recovered from site.', 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (7, 'FIR-2026-007', 2, 5, '2025-08-10 12:30:00', '2025-08-09 21:00:00', 'Commercial Burglary (IPC 457/380)', 'Electronics showroom on Linking Road Bandra breached during power outage; security shutter lock cut and 45 high-end smartphones stolen.', 'Active', '19.06200000', '72.83360000', 0, '2026-10-23 14:45:19', '2026-10-25 07:29:00', 'Haresh Dsouza', '+91 98204 11099', 'Dsouza Jewelers, Hill Road, Bandra West, Mumbai', 'Aadhaar 5501-9231-1182', 'Citizen / Victim', 'Unknown Burglary Crew', 'The Shutter Gang', 'Three masked individuals with gas cutters, dark hoodies and gloves; fled in white Maruti Swift.', 'Unidentified');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (8, 'FIR-2026-008', 1, 4, '2026-04-01 07:30:00', '2026-04-01 05:30:00', 'Counterfeit Currency (IPC 489B/489C)', 'Circulation of forged Indian currency notes (FICN) of denomination Rs 500 detected across Crawford Market wholesale fruit and spice stalls.', 'Pending', '18.94720000', '72.83470000', 0, '2026-10-23 14:45:19', '2026-10-25 07:29:00', 'Kavita Deshmukh', '+91 98207 44881', 'Branch Manager, State Bank of India, Fort Branch, Mumbai', 'Employee ID SBI-88219', 'Citizen / Victim', 'Reshma Bhosale', 'Madam X', 'Height 5ft 6in, crescent moon tattoo behind right ear, attempted deposit of Rs 8 Lakh fake currency notes.', 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (11, 'FIR-2026-009', 1, 1, '2026-10-23 16:33:15', '2026-10-23 14:30:00', 'Armed Dacoity & Robbery (IPC 395/397)', 'Test FIR description from node verification', 'Active', '18.95020000', '72.83180000', 0, '2026-10-23 16:33:15', '2026-10-25 07:29:00', 'Sunil Shinde', '+91 98200 99881', 'Andheri West Commercial Complex, Veera Desai Rd, Mumbai', 'Aadhaar 7712-4491-0023', 'Citizen / Victim', 'Bablu Kadam & Gang', 'Hathoda', 'Armed with iron rods and country-made weapons, escaped towards Western Express Highway.', 'Absconding');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (13, 'FIR-2025-012', 1, 2, '2025-11-18 05:00:00', '2025-11-18 05:00:00', 'Homicide & Murder (IPC 302)', 'Homicide investigation at Fort area warehouse. Forensic ballistics matched firearm to local organized syndicate.', 'Active', '18.93220000', '72.83400000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (14, 'FIR-2025-013', 2, 5, '2025-12-08 08:45:00', '2025-12-08 08:45:00', 'Armed Dacoity & Robbery (IPC 395/397)', 'Armed robbery at jewelry boutique on Hill Road Bandra. Stolen gold recovered via nakabandi intercept.', 'Active', '19.05600000', '72.82900000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (15, 'FIR-2025-014', 1, 4, '2025-12-22 03:30:00', '2025-12-22 03:30:00', 'Motor Vehicle Theft (IPC 379)', 'Theft of commercial delivery van near Crawford Market. GPS telemetry tracked vehicle to Bhiwandi godown.', 'Active', '18.94800000', '72.83500000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (16, 'FIR-2026-015', 3, 13, '2026-01-22 06:15:00', '2026-01-22 06:15:00', 'Commercial Burglary (IPC 457/380)', 'Night burglary at Shivajinagar Pune corporate electronics distributor. 2 perpetrators apprehended with stolen inventory.', 'Active', '18.53200000', '73.84500000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (17, 'FIR-2026-016', 2, 12, '2026-02-10 11:00:00', '2026-02-10 11:00:00', 'Narcotics Trafficking (NDPS Act 21/22)', 'Interception of contraband MD packets during highway vehicle check near Bandra reclamation.', 'Active', '19.04900000', '72.83100000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (18, 'FIR-2026-017', 1, 2, '2026-03-14 07:30:00', '2026-03-14 07:30:00', 'Counterfeit Currency (IPC 489B/489C)', 'Fake high-security denomination notes circulated at Marine Lines merchant stall. Printing plates recovered.', 'Active', '18.94200000', '72.82500000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (19, 'FIR-2026-018', 2, 5, '2026-04-12 05:50:00', '2026-04-12 05:50:00', 'Cyber Extortion & Ransomware (IT Act 66D)', 'Phishing payload targeted healthcare chain servers in Bandra. Decryption key acquired, servers restored.', 'Active', '19.06000000', '72.83600000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (20, 'FIR-2026-019', 3, 13, '2026-04-26 13:10:00', '2026-04-26 13:10:00', 'Armed Dacoity & Robbery (IPC 395/397)', 'Highway robbery of cash transit vehicle near Pune-Mumbai expressway junction.', 'Active', '18.54100000', '73.83900000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (21, 'FIR-2026-020', 1, 4, '2026-05-09 09:40:00', '2026-05-09 09:40:00', 'Motor Vehicle Theft (IPC 379)', 'High-end motorcycle stolen from Colaba residential compound. Recovered with altered registration plate.', 'Active', '18.91500000', '72.82700000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (22, 'FIR-2026-021', 2, 12, '2026-05-21 03:00:00', '2026-05-21 03:00:00', 'Commercial Burglary (IPC 457/380)', 'Hardware store burglary near Khar-Bandra link road. Power tool inventory stolen during night.', 'Active', '19.06800000', '72.83900000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (23, 'FIR-2026-022', 3, 13, '2026-06-04 06:30:00', '2026-06-04 06:30:00', 'Homicide & Murder (IPC 302)', 'Fatal assault outside warehouse in Deccan Gymkhana area Pune. Accused arrested and chargesheeted in court.', 'Active', '18.52100000', '73.84000000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (24, 'FIR-2026-023', 1, 2, '2026-06-19 12:15:00', '2026-06-19 12:15:00', 'Extortion & Arms Act (IPC 384/387, Arms Act 25)', 'Extortion phone calls made to South Mumbai builder. Syndicate safehouse raided and weapons seized.', 'Active', '18.93800000', '72.83100000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (25, 'FIR-2026-024', 2, 5, '2026-07-11 08:30:00', '2026-07-11 08:30:00', 'Narcotics Trafficking (NDPS Act 21/22)', 'Narcotics network distribution busted near Bandra station West. Substantial contraband seized.', 'Active', '19.05500000', '72.84000000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (26, 'FIR-2026-025', 1, 4, '2026-07-28 04:45:00', '2026-07-28 04:45:00', 'Cyber Extortion & Ransomware (IT Act 66D)', 'Corporate server credentials exfiltrated via targeted spear-phishing campaign against marine shipping agency.', 'Active', '18.93000000', '72.83600000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (27, 'FIR-2026-026', 2, 12, '2026-08-07 13:50:00', '2026-08-07 13:50:00', 'Armed Dacoity & Robbery (IPC 395/397)', 'Armed robbery at electronic appliances superstore on S.V. Road. Accused tracked through CCTV grid and arrested.', 'Active', '19.06100000', '72.83500000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (28, 'FIR-2026-027', 1, 2, '2026-08-23 06:00:00', '2026-08-23 06:00:00', 'Commercial Burglary (IPC 457/380)', 'Break-in at wholesale chemical trading office in Ballard Estate. Safe forced open during weekend closure.', 'Active', '18.93500000', '72.84000000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (29, 'FIR-2026-028', 3, 13, '2026-09-03 11:20:00', '2026-09-03 11:20:00', 'Motor Vehicle Theft (IPC 379)', 'Luxury sedan stolen from hotel valet parking in Pune Camp. Vehicle recovered at expressway toll plaza.', 'Active', '18.51800000', '73.87400000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (30, 'FIR-2026-029', 2, 5, '2026-09-17 07:40:00', '2026-09-17 07:40:00', 'Counterfeit Currency (IPC 489B/489C)', 'Forged notes supplied to local petrol pumps in Bandra East. Intercepted during cash replenishment.', 'Active', '19.06300000', '72.85200000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (31, 'FIR-2026-030', 1, 4, '2026-10-05 04:10:00', '2026-10-05 04:10:00', 'Extortion & Arms Act (IPC 384/387, Arms Act 25)', 'Threat letters demanding protection money sent to South Mumbai hotelier. Undercover operation active.', 'Active', '18.92800000', '72.83100000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');
INSERT INTO `fir` (`id`, `fir_number`, `station_id`, `filed_by_officer_id`, `date_filed`, `incident_date`, `crime_type`, `description`, `status`, `latitude`, `longitude`, `is_deleted`, `created_at`, `updated_at`, `complainant_name`, `complainant_phone`, `complainant_address`, `complainant_id_proof`, `complainant_type`, `accused_name`, `accused_alias`, `accused_details`, `suspect_status`) VALUES (32, 'FIR-2026-031', 3, 13, '2026-10-15 08:50:00', '2026-10-15 08:50:00', 'Narcotics Trafficking (NDPS Act 21/22)', 'Courier parcel intercept containing synthetic narcotics destined for student campus area in Pune.', 'Active', '18.53000000', '73.84200000', 0, '2026-10-27 19:21:13', '2026-10-27 19:21:13', NULL, NULL, NULL, NULL, 'Citizen / Victim', NULL, NULL, NULL, 'Named in FIR');

DROP TABLE IF EXISTS `police_officers`;
CREATE TABLE `police_officers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `badge_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rank_title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('Officer','Evidence-Manager','Head-Officer','System-Admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Officer',
  `station_id` int NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `initial_password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_officer_id` int DEFAULT NULL,
  `blood_group` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'B+',
  `joining_date` date DEFAULT NULL,
  `emergency_contact` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT 'Police Welfare Board / HQ Control Room',
  `id_proof_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `badge_number` (`badge_number`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_officer_station` (`station_id`),
  KEY `idx_officer_role` (`role`),
  KEY `idx_officer_badge` (`badge_number`),
  KEY `idx_officer_deleted` (`is_deleted`),
  CONSTRAINT `fk_officer_station` FOREIGN KEY (`station_id`) REFERENCES `police_stations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `police_officers` (`id`, `badge_number`, `first_name`, `last_name`, `rank_title`, `role`, `station_id`, `password_hash`, `email`, `phone`, `is_deleted`, `created_at`, `updated_at`, `initial_password`, `created_by_officer_id`, `blood_group`, `joining_date`, `emergency_contact`, `id_proof_number`) VALUES (1, 'MH-HQ-001', 'Asha', 'Kulkarni', 'Director General of Police (DGP)', 'System-Admin', 1, '$2a$10$bbDgoOvhPjoZusQqPIdW7uAu5tOqtIykSjJUQJz2ii.WBgMTGqZry', 'asha.kulkarni@mahapolice.gov.in', '+91-9820112233', 0, '2026-10-23 14:45:19', '2026-10-25 12:12:12', 'Admin@123', NULL, 'O+', '2015-05-31 18:30:00', 'Control Room Desk (022-22620429)', 'MH-POL-10981');
INSERT INTO `police_officers` (`id`, `badge_number`, `first_name`, `last_name`, `rank_title`, `role`, `station_id`, `password_hash`, `email`, `phone`, `is_deleted`, `created_at`, `updated_at`, `initial_password`, `created_by_officer_id`, `blood_group`, `joining_date`, `emergency_contact`, `id_proof_number`) VALUES (2, 'MH-MUM-101', 'Vikram', 'Shinde', 'Senior Police Inspector (Sr. PI)', 'Head-Officer', 1, '$2a$10$bbDgoOvhPjoZusQqPIdW7un2jouXui8IiESf2mAnXkPdOqKYCihhO', 'vikram.shinde@mahapolice.gov.in', '+91-9820223344', 0, '2026-10-23 14:45:19', '2026-10-25 12:12:12', 'Head@123', NULL, 'O+', '2015-05-31 18:30:00', 'Control Room Desk (022-22620429)', 'MH-POL-20981');
INSERT INTO `police_officers` (`id`, `badge_number`, `first_name`, `last_name`, `rank_title`, `role`, `station_id`, `password_hash`, `email`, `phone`, `is_deleted`, `created_at`, `updated_at`, `initial_password`, `created_by_officer_id`, `blood_group`, `joining_date`, `emergency_contact`, `id_proof_number`) VALUES (3, 'MH-MUM-102', 'Pravin', 'Deshmukh', 'Assistant Commissioner of Police (ACP)', 'Head-Officer', 2, '$2a$10$bbDgoOvhPjoZusQqPIdW7un2jouXui8IiESf2mAnXkPdOqKYCihhO', 'pravin.deshmukh@mahapolice.gov.in', '+91-9820334455', 0, '2026-10-23 14:45:19', '2026-10-25 12:12:12', 'Head@123', NULL, 'O+', '2015-05-31 18:30:00', 'Control Room Desk (022-22620429)', 'MH-POL-30981');
INSERT INTO `police_officers` (`id`, `badge_number`, `first_name`, `last_name`, `rank_title`, `role`, `station_id`, `password_hash`, `email`, `phone`, `is_deleted`, `created_at`, `updated_at`, `initial_password`, `created_by_officer_id`, `blood_group`, `joining_date`, `emergency_contact`, `id_proof_number`) VALUES (4, 'MH-MUM-201', 'Sachin', 'Sawant', 'Police Sub-Inspector (PSI - Crime Branch)', 'Officer', 1, '$2a$10$bbDgoOvhPjoZusQqPIdW7uLMaQTJueQGChhxzeWLlMb9HrqhY0pnm', 'sachin.sawant@mahapolice.gov.in', '+91-9820445566', 0, '2026-10-23 14:45:19', '2026-10-25 12:12:12', 'Officer@123', NULL, 'O+', '2015-05-31 18:30:00', 'Control Room Desk (022-22620429)', 'MH-POL-40981');
INSERT INTO `police_officers` (`id`, `badge_number`, `first_name`, `last_name`, `rank_title`, `role`, `station_id`, `password_hash`, `email`, `phone`, `is_deleted`, `created_at`, `updated_at`, `initial_password`, `created_by_officer_id`, `blood_group`, `joining_date`, `emergency_contact`, `id_proof_number`) VALUES (5, 'MH-MUM-202', 'Ananya', 'Patil', 'Assistant Police Inspector (API - Detection)', 'Officer', 2, '$2a$10$bbDgoOvhPjoZusQqPIdW7uLMaQTJueQGChhxzeWLlMb9HrqhY0pnm', 'ananya.patil@mahapolice.gov.in', '+91-9820556677', 0, '2026-10-23 14:45:19', '2026-10-25 12:12:12', 'Officer@123', NULL, 'O+', '2015-05-31 18:30:00', 'Control Room Desk (022-22620429)', 'MH-POL-50981');
INSERT INTO `police_officers` (`id`, `badge_number`, `first_name`, `last_name`, `rank_title`, `role`, `station_id`, `password_hash`, `email`, `phone`, `is_deleted`, `created_at`, `updated_at`, `initial_password`, `created_by_officer_id`, `blood_group`, `joining_date`, `emergency_contact`, `id_proof_number`) VALUES (6, 'MH-MUM-301', 'Ganesh', 'More', 'Malkhana Incharge & Head Constable', 'Evidence-Manager', 1, '$2a$10$bbDgoOvhPjoZusQqPIdW7uINcdbe/rqmAlIu/GAcrbYfh1i/8b3IO', 'ganesh.more@mahapolice.gov.in', '+91-9820667788', 0, '2026-10-23 14:45:19', '2026-10-25 12:12:12', 'Evidence@123', NULL, 'O+', '2015-05-31 18:30:00', 'Control Room Desk (022-22620429)', 'MH-POL-60981');
INSERT INTO `police_officers` (`id`, `badge_number`, `first_name`, `last_name`, `rank_title`, `role`, `station_id`, `password_hash`, `email`, `phone`, `is_deleted`, `created_at`, `updated_at`, `initial_password`, `created_by_officer_id`, `blood_group`, `joining_date`, `emergency_contact`, `id_proof_number`) VALUES (12, 'MH-MUM-203', 'Priya', 'Kadam', 'Assistant Commissioner of Police (ACP)', 'Officer', 2, '$2a$10$bbDgoOvhPjoZusQqPIdW7uLMaQTJueQGChhxzeWLlMb9HrqhY0pnm', 'priya.kadam@mahapolice.gov.in', '+91-9820556688', 0, '2026-10-23 14:47:33', '2026-10-25 12:12:12', 'Officer@123', NULL, 'O+', '2015-05-31 18:30:00', 'Control Room Desk (022-22620429)', 'MH-POL-120981');
INSERT INTO `police_officers` (`id`, `badge_number`, `first_name`, `last_name`, `rank_title`, `role`, `station_id`, `password_hash`, `email`, `phone`, `is_deleted`, `created_at`, `updated_at`, `initial_password`, `created_by_officer_id`, `blood_group`, `joining_date`, `emergency_contact`, `id_proof_number`) VALUES (13, 'MH-PUN-103', 'Vikram', 'Rane', 'Deputy Commissioner of Police (DCP)', 'Head-Officer', 3, '$2a$10$bbDgoOvhPjoZusQqPIdW7un2jouXui8IiESf2mAnXkPdOqKYCihhO', 'vikram.rane@mahapolice.gov.in', '+91-9820998877', 0, '2026-10-23 14:47:33', '2026-10-25 12:12:12', 'Head@123', NULL, 'O+', '2015-05-31 18:30:00', 'Control Room Desk (022-22620429)', 'MH-POL-130981');

DROP TABLE IF EXISTS `police_stations`;
CREATE TABLE `police_stations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_details` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `station_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'MUM-PS',
  `zone_division` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Zone 1',
  `jurisdiction_area_sq_km` decimal(8,2) DEFAULT '12.50',
  `lockup_capacity` int DEFAULT '10',
  `lockup_rooms` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Lockup Cell 1 (General), Lockup Cell 2 (Remand)',
  `evidence_vault_location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Malkhana Vault Ground Floor Room 102',
  `evidence_vault_capacity` int DEFAULT '50',
  PRIMARY KEY (`id`),
  KEY `idx_station_name` (`name`),
  KEY `idx_station_deleted` (`is_deleted`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `police_stations` (`id`, `name`, `location`, `contact_details`, `is_deleted`, `created_at`, `updated_at`, `station_code`, `zone_division`, `jurisdiction_area_sq_km`, `lockup_capacity`, `lockup_rooms`, `evidence_vault_location`, `evidence_vault_capacity`) VALUES (1, 'Mumbai Police HQ & Azad Maidan Police Station', 'Opp. CST Railway Station, Fort, South Mumbai, Maharashtra 400001', '+91-22-22620111', 0, '2026-10-23 14:45:19', '2026-10-25 12:12:12', 'MUM-AZAD-01', 'Zone 1, South Region', '14.50', 20, 'Cell 1 (General Male), Cell 2 (Remand), Cell 3 (High-Security)', 'Azad Maidan Malkhana Vault Ground Floor Sector-A', 150);
INSERT INTO `police_stations` (`id`, `name`, `location`, `contact_details`, `is_deleted`, `created_at`, `updated_at`, `station_code`, `zone_division`, `jurisdiction_area_sq_km`, `lockup_capacity`, `lockup_rooms`, `evidence_vault_location`, `evidence_vault_capacity`) VALUES (2, 'Bandra Police Station (Zone IX)', 'Hill Road, Near Mehboob Studio, Bandra West, Mumbai, Maharashtra 400050', '+91-22-26422233', 0, '2026-10-23 14:45:19', '2026-10-25 12:12:12', 'MUM-BND-09', 'Zone 9, Western Region', '18.20', 15, 'Cell 1 (General Male), Female Lockup Cell 1, Cell 2 (Remand)', 'Bandra Malkhana Vault Room 104', 100);
INSERT INTO `police_stations` (`id`, `name`, `location`, `contact_details`, `is_deleted`, `created_at`, `updated_at`, `station_code`, `zone_division`, `jurisdiction_area_sq_km`, `lockup_capacity`, `lockup_rooms`, `evidence_vault_location`, `evidence_vault_capacity`) VALUES (3, 'Shivaji Nagar Police Station (Zone I Pune)', 'F.C. Road, Shivaji Nagar, Pune, Maharashtra 411005', '+91-20-25536343', 0, '2026-10-23 14:45:19', '2026-10-25 12:12:12', 'PUN-SHIV-01', 'Pune City Zone 1', '22.00', 18, 'Secure Holding Cell A, Cell B (General Male), Cell C (Remand)', 'Pune Malkhana Secure Bay Room 12', 120);
INSERT INTO `police_stations` (`id`, `name`, `location`, `contact_details`, `is_deleted`, `created_at`, `updated_at`, `station_code`, `zone_division`, `jurisdiction_area_sq_km`, `lockup_capacity`, `lockup_rooms`, `evidence_vault_location`, `evidence_vault_capacity`) VALUES (4, 'Andheri Police Station (Zone-1)', 'Veera Desai Road, Andheri - West, Mumbai-400053', '022-22558852 / andherips@mahagove.ps.in', 0, '2026-10-23 14:53:08', '2026-10-25 12:12:12', 'MUM-AND-10', 'Zone 10, Western Region', '16.80', 12, 'Cell 1 (General), Cell 2 (Holding)', 'Andheri Malkhana Vault Bay 3', 80);
INSERT INTO `police_stations` (`id`, `name`, `location`, `contact_details`, `is_deleted`, `created_at`, `updated_at`, `station_code`, `zone_division`, `jurisdiction_area_sq_km`, `lockup_capacity`, `lockup_rooms`, `evidence_vault_location`, `evidence_vault_capacity`) VALUES (5, 'Dadar Police Station', 'Dadar, Mumbai-500020', '022-22558826 / dadarps@mahapolice.in', 0, '2026-10-23 15:51:58', '2026-10-25 12:12:12', 'MUM-DAD-05', 'Zone 5, Central Region', '11.40', 10, 'Cell 1 (General), Cell 2 (Custody)', 'Dadar Malkhana Vault Room 101', 60);
INSERT INTO `police_stations` (`id`, `name`, `location`, `contact_details`, `is_deleted`, `created_at`, `updated_at`, `station_code`, `zone_division`, `jurisdiction_area_sq_km`, `lockup_capacity`, `lockup_rooms`, `evidence_vault_location`, `evidence_vault_capacity`) VALUES (6, 'Versova Police Station', 'Versova, Mumbai', '022-25582856 / versovaps@mahapolice.in', 0, '2026-10-27 18:49:47', '2026-10-27 18:49:47', 'MUM-VER-01', 'Zone 1, West Region', '14.50', 15, 'Cell 1 (General Male), Cell 2 (Remand), Female Lockup Cell 1', 'Ground Floor Room 104, Malkhana Strongroom', 50);

DROP TABLE IF EXISTS `victims_and_witnesses`;
CREATE TABLE `victims_and_witnesses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `case_id` int NOT NULL,
  `person_type` enum('Victim','Witness','Reporter') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Victim',
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_info` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statement` text COLLATE utf8mb4_unicode_ci,
  `is_protected` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_witness_case` (`case_id`),
  KEY `idx_witness_type` (`person_type`),
  KEY `idx_witness_protected` (`is_protected`),
  CONSTRAINT `fk_witness_case` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `victims_and_witnesses` (`id`, `case_id`, `person_type`, `name`, `contact_info`, `statement`, `is_protected`, `created_at`, `updated_at`) VALUES (1, 1, 'Victim', 'Maheshbhai Shah (Jewelry Store Owner)', '+91-9820987654', 'Stood at the main cash counter when three individuals brandished a firearm at the security guard and broke glass displays.', 0, '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `victims_and_witnesses` (`id`, `case_id`, `person_type`, `name`, `contact_info`, `statement`, `is_protected`, `created_at`, `updated_at`) VALUES (2, 1, 'Witness', 'Panch Witness - Dilip Solanki', 'REDACTED - LEVEL 1 CONFIDENTIAL', 'Observed two men mounting a black Bajaj Pulsar motorcycle without a rear number plate in the alley behind Zaveri Bazaar.', 1, '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `victims_and_witnesses` (`id`, `case_id`, `person_type`, `name`, `contact_info`, `statement`, `is_protected`, `created_at`, `updated_at`) VALUES (3, 5, 'Reporter', 'Subhash Kamble (Fisherman)', '+91-9819123456', 'Noticed floating canvas bundle near jetty while mooring trawler boat at Sassoon Docks at dawn.', 0, '2026-10-23 14:45:19', '2026-10-23 14:45:19');

DROP TABLE IF EXISTS `vw_active_cases`;
undefined;

INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (1, 'CASE-2026-001', 1, 'FIR-2026-001', 'Armed Dacoity & Robbery (IPC 395/397)', 1, 'Mumbai Police HQ & Azad Maidan Police Station', 4, 'Sachin Sawant', 'MH-MUM-201', 'In Court', 'Critical', '2026-01-09 18:30:00', NULL, 291, '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (2, 'CASE-2026-002', 2, 'FIR-2026-002', 'Motor Vehicle Theft (IPC 379)', 1, 'Mumbai Police HQ & Azad Maidan Police Station', 4, 'Sachin Sawant', 'MH-MUM-201', 'Warrant Issued', 'High', '2026-02-14 18:30:00', NULL, 255, '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (3, 'CASE-2026-003', 3, 'FIR-2026-003', 'Cyber Extortion & Ransomware (IT Act 66D)', 2, 'Bandra Police Station (Zone IX)', 5, 'Ananya Patil', 'MH-MUM-202', 'Under Investigation', 'High', '2026-02-28 18:30:00', NULL, 241, '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (4, 'CASE-2026-004', 4, 'FIR-2026-004', 'Narcotics Trafficking (NDPS Act 21/22)', 2, 'Bandra Police Station (Zone IX)', 5, 'Ananya Patil', 'MH-MUM-202', 'Filed', 'Medium', '2026-03-19 18:30:00', NULL, 222, '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (5, 'CASE-2026-005', 5, 'FIR-2026-005', 'Homicide & Murder (IPC 302)', 1, 'Mumbai Police HQ & Azad Maidan Police Station', 4, 'Sachin Sawant', 'MH-MUM-201', 'Under Investigation', 'Critical', '2026-03-24 18:30:00', NULL, 217, '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (6, 'CASE-2026-006', 6, 'FIR-2026-006', 'Extortion & Arms Act (IPC 384/387, Arms Act 25)', 3, 'Shivaji Nagar Police Station (Zone I Pune)', 4, 'Sachin Sawant', 'MH-MUM-201', 'Closed', 'Medium', '2025-11-04 18:30:00', '2026-02-27 18:30:00', 115, '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (7, 'CASE-2026-007', 7, 'FIR-2026-007', 'Commercial Burglary (IPC 457/380)', 2, 'Bandra Police Station (Zone IX)', 5, 'Ananya Patil', 'MH-MUM-202', 'Cold', 'Low', '2025-08-09 18:30:00', NULL, 444, '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (8, 'CASE-2026-008', 8, 'FIR-2026-008', 'Counterfeit Currency (IPC 489B/489C)', 1, 'Mumbai Police HQ & Azad Maidan Police Station', NULL, NULL, NULL, 'Filed', 'Low', '2026-03-31 18:30:00', NULL, 210, '2026-10-23 14:45:19', '2026-10-23 14:45:19');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (9, 'CASE-2026-009', 11, 'FIR-2026-009', 'Armed Dacoity & Robbery (IPC 395/397)', 1, 'Mumbai Police HQ & Azad Maidan Police Station', NULL, NULL, NULL, 'Filed', 'Critical', '2026-10-22 18:30:00', NULL, 5, '2026-10-23 16:33:15', '2026-10-23 16:33:15');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (11, 'CASE-2025-012', 13, 'FIR-2025-012', 'Homicide & Murder (IPC 302)', 1, 'Mumbai Police HQ & Azad Maidan Police Station', 2, 'Vikram Shinde', 'MH-MUM-101', 'Closed', 'Critical', '2025-11-17 18:30:00', '2026-01-19 18:30:00', 63, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (12, 'CASE-2025-013', 14, 'FIR-2025-013', 'Armed Dacoity & Robbery (IPC 395/397)', 2, 'Bandra Police Station (Zone IX)', 5, 'Ananya Patil', 'MH-MUM-202', 'Closed', 'High', '2025-12-07 18:30:00', '2026-02-13 18:30:00', 68, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (13, 'CASE-2025-014', 15, 'FIR-2025-014', 'Motor Vehicle Theft (IPC 379)', 1, 'Mumbai Police HQ & Azad Maidan Police Station', 4, 'Sachin Sawant', 'MH-MUM-201', 'Closed', 'Medium', '2025-12-21 18:30:00', '2026-01-29 18:30:00', 39, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (14, 'CASE-2026-015', 16, 'FIR-2026-015', 'Commercial Burglary (IPC 457/380)', 3, 'Shivaji Nagar Police Station (Zone I Pune)', 13, 'Vikram Rane', 'MH-PUN-103', 'Closed', 'Medium', '2026-01-21 18:30:00', '2026-03-09 18:30:00', 47, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (15, 'CASE-2026-016', 17, 'FIR-2026-016', 'Narcotics Trafficking (NDPS Act 21/22)', 2, 'Bandra Police Station (Zone IX)', 12, 'Priya Kadam', 'MH-MUM-203', 'Closed', 'High', '2026-02-09 18:30:00', '2026-04-14 18:30:00', 64, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (16, 'CASE-2026-017', 18, 'FIR-2026-017', 'Counterfeit Currency (IPC 489B/489C)', 1, 'Mumbai Police HQ & Azad Maidan Police Station', 2, 'Vikram Shinde', 'MH-MUM-101', 'Closed', 'Medium', '2026-03-13 18:30:00', '2026-05-19 18:30:00', 67, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (17, 'CASE-2026-018', 19, 'FIR-2026-018', 'Cyber Extortion & Ransomware (IT Act 66D)', 2, 'Bandra Police Station (Zone IX)', 5, 'Ananya Patil', 'MH-MUM-202', 'Closed', 'High', '2026-04-11 18:30:00', '2026-06-17 18:30:00', 67, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (18, 'CASE-2026-019', 20, 'FIR-2026-019', 'Armed Dacoity & Robbery (IPC 395/397)', 3, 'Shivaji Nagar Police Station (Zone I Pune)', 13, 'Vikram Rane', 'MH-PUN-103', 'Under Investigation', 'Critical', '2026-04-25 18:30:00', NULL, 185, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (19, 'CASE-2026-020', 21, 'FIR-2026-020', 'Motor Vehicle Theft (IPC 379)', 1, 'Mumbai Police HQ & Azad Maidan Police Station', 4, 'Sachin Sawant', 'MH-MUM-201', 'Closed', 'Low', '2026-05-08 18:30:00', '2026-07-01 18:30:00', 54, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (20, 'CASE-2026-021', 22, 'FIR-2026-021', 'Commercial Burglary (IPC 457/380)', 2, 'Bandra Police Station (Zone IX)', 12, 'Priya Kadam', 'MH-MUM-203', 'Under Investigation', 'Medium', '2026-05-20 18:30:00', NULL, 160, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (21, 'CASE-2026-022', 23, 'FIR-2026-022', 'Homicide & Murder (IPC 302)', 3, 'Shivaji Nagar Police Station (Zone I Pune)', 13, 'Vikram Rane', 'MH-PUN-103', 'In Court', 'Critical', '2026-06-03 18:30:00', NULL, 146, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (22, 'CASE-2026-023', 24, 'FIR-2026-023', 'Extortion & Arms Act (IPC 384/387, Arms Act 25)', 1, 'Mumbai Police HQ & Azad Maidan Police Station', 2, 'Vikram Shinde', 'MH-MUM-101', 'Closed', 'Critical', '2026-06-18 18:30:00', '2026-08-10 18:30:00', 53, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (23, 'CASE-2026-024', 25, 'FIR-2026-024', 'Narcotics Trafficking (NDPS Act 21/22)', 2, 'Bandra Police Station (Zone IX)', 5, 'Ananya Patil', 'MH-MUM-202', 'Closed', 'High', '2026-07-10 18:30:00', '2026-09-04 18:30:00', 56, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (24, 'CASE-2026-025', 26, 'FIR-2026-025', 'Cyber Extortion & Ransomware (IT Act 66D)', 1, 'Mumbai Police HQ & Azad Maidan Police Station', 4, 'Sachin Sawant', 'MH-MUM-201', 'Under Investigation', 'High', '2026-07-27 18:30:00', NULL, 92, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (25, 'CASE-2026-026', 27, 'FIR-2026-026', 'Armed Dacoity & Robbery (IPC 395/397)', 2, 'Bandra Police Station (Zone IX)', 12, 'Priya Kadam', 'MH-MUM-203', 'Closed', 'High', '2026-08-06 18:30:00', '2026-09-24 18:30:00', 49, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (26, 'CASE-2026-027', 28, 'FIR-2026-027', 'Commercial Burglary (IPC 457/380)', 1, 'Mumbai Police HQ & Azad Maidan Police Station', 2, 'Vikram Shinde', 'MH-MUM-101', 'Under Investigation', 'Medium', '2026-08-22 18:30:00', NULL, 66, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (27, 'CASE-2026-028', 29, 'FIR-2026-028', 'Motor Vehicle Theft (IPC 379)', 3, 'Shivaji Nagar Police Station (Zone I Pune)', 13, 'Vikram Rane', 'MH-PUN-103', 'Closed', 'Medium', '2026-09-02 18:30:00', '2026-10-11 18:30:00', 39, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (28, 'CASE-2026-029', 30, 'FIR-2026-029', 'Counterfeit Currency (IPC 489B/489C)', 2, 'Bandra Police Station (Zone IX)', 5, 'Ananya Patil', 'MH-MUM-202', 'Under Investigation', 'Medium', '2026-09-16 18:30:00', NULL, 41, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (29, 'CASE-2026-030', 31, 'FIR-2026-030', 'Extortion & Arms Act (IPC 384/387, Arms Act 25)', 1, 'Mumbai Police HQ & Azad Maidan Police Station', 4, 'Sachin Sawant', 'MH-MUM-201', 'Under Investigation', 'High', '2026-10-04 18:30:00', NULL, 23, '2026-10-27 19:21:13', '2026-10-27 19:21:13');
INSERT INTO `vw_active_cases` (`id`, `case_number`, `fir_id`, `fir_number`, `crime_type`, `station_id`, `station_name`, `assigned_officer_id`, `assigned_officer_name`, `assigned_officer_badge`, `case_status`, `priority`, `open_date`, `close_date`, `days_active`, `created_at`, `updated_at`) VALUES (30, 'CASE-2026-031', 32, 'FIR-2026-031', 'Narcotics Trafficking (NDPS Act 21/22)', 3, 'Shivaji Nagar Police Station (Zone I Pune)', 13, 'Vikram Rane', 'MH-PUN-103', 'Under Investigation', 'Critical', '2026-10-14 18:30:00', NULL, 13, '2026-10-27 19:21:13', '2026-10-27 19:21:13');

DROP TABLE IF EXISTS `vw_evidence_vault_ledger`;
undefined;

INSERT INTO `vw_evidence_vault_ledger` (`evidence_id`, `evidence_number`, `description`, `evidence_type`, `storage_location`, `locker_bin_number`, `chain_of_custody_status`, `seizure_memo_number`, `witness_name`, `file_hash`, `case_number`, `station_id`, `station_name`, `evidence_vault_location`, `logged_by_officer_name`, `logged_by_officer_badge`, `current_custodian_id`, `current_custodian_name`) VALUES (1, 'EVD-2026-001', 'Country-made 7.65mm pistol (Katta) with 3 live rounds seized from Mumbadevi drain', 'Firearm', 'Malkhana Ballistics Locker B-104', 'Rack A, Shelf 2, Bin #04', 'In Malkhana Vault', 'PANCH-2026-001', 'Ramesh Patil (Independent Panch)', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'CASE-2026-001', 1, 'Mumbai Police HQ & Azad Maidan Police Station', 'Azad Maidan Malkhana Vault Ground Floor Sector-A', 'Ganesh More', 'MH-MUM-301', 4, 'Sachin Sawant');
INSERT INTO `vw_evidence_vault_ledger` (`evidence_id`, `evidence_number`, `description`, `evidence_type`, `storage_location`, `locker_bin_number`, `chain_of_custody_status`, `seizure_memo_number`, `witness_name`, `file_hash`, `case_number`, `station_id`, `station_name`, `evidence_vault_location`, `logged_by_officer_name`, `logged_by_officer_badge`, `current_custodian_id`, `current_custodian_name`) VALUES (2, 'EVD-2026-002', 'High-definition digital video pendrive of Zaveri Bazaar lane CCTV camera #4', 'Digital Video', 'Malkhana Digital Safe Vault Alpha', 'Rack A, Shelf 2, Bin #04', 'In Malkhana Vault', 'PANCH-2026-002', 'Ramesh Patil (Independent Panch)', 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e', 'CASE-2026-001', 1, 'Mumbai Police HQ & Azad Maidan Police Station', 'Azad Maidan Malkhana Vault Ground Floor Sector-A', 'Ganesh More', 'MH-MUM-301', 6, 'Ganesh More');
INSERT INTO `vw_evidence_vault_ledger` (`evidence_id`, `evidence_number`, `description`, `evidence_type`, `storage_location`, `locker_bin_number`, `chain_of_custody_status`, `seizure_memo_number`, `witness_name`, `file_hash`, `case_number`, `station_id`, `station_name`, `evidence_vault_location`, `logged_by_officer_name`, `logged_by_officer_badge`, `current_custodian_id`, `current_custodian_name`) VALUES (3, 'EVD-2026-003', 'Seized Lenovo ThinkPad laptop containing VPN proxy logs and extortion script files', 'Hardware', 'Cyber Cell Forensic Lab Rack 2', 'Rack A, Shelf 2, Bin #04', 'In Malkhana Vault', 'PANCH-2026-003', 'Ramesh Patil (Independent Panch)', '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', 'CASE-2026-003', 2, 'Bandra Police Station (Zone IX)', 'Bandra Malkhana Vault Room 104', 'Ganesh More', 'MH-MUM-301', 6, 'Ganesh More');
INSERT INTO `vw_evidence_vault_ledger` (`evidence_id`, `evidence_number`, `description`, `evidence_type`, `storage_location`, `locker_bin_number`, `chain_of_custody_status`, `seizure_memo_number`, `witness_name`, `file_hash`, `case_number`, `station_id`, `station_name`, `evidence_vault_location`, `logged_by_officer_name`, `logged_by_officer_badge`, `current_custodian_id`, `current_custodian_name`) VALUES (4, 'EVD-2026-004', 'Forensic Science Laboratory (FSL Kalina) chemical report confirming 500g Mephedrone', 'Document', 'Malkhana FSL Archive Shelf F-12', 'Rack A, Shelf 2, Bin #04', 'In Malkhana Vault', 'PANCH-2026-004', 'Ramesh Patil (Independent Panch)', 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9', 'CASE-2026-004', 2, 'Bandra Police Station (Zone IX)', 'Bandra Malkhana Vault Room 104', 'Ganesh More', 'MH-MUM-301', NULL, NULL);

DROP TABLE IF EXISTS `vw_precinct_custody_overview`;
undefined;

INSERT INTO `vw_precinct_custody_overview` (`arrest_id`, `arrest_number`, `case_id`, `case_number`, `station_id`, `station_name`, `holding_cell_number`, `detainee_name`, `custody_type`, `booking_timestamp`, `magistrate_production_deadline`, `hours_until_production_deadline`, `medical_exam_status`, `bail_status`, `arresting_officer_name`, `arresting_officer_badge`) VALUES (1, 'ARR-2026-001', 1, 'CASE-2026-001', 1, 'Mumbai Police HQ & Azad Maidan Police Station', 'Lockup Cell 2 (Azad Maidan)', 'Raju Gaikwad', 'Police Custody (PCR)', '2026-01-12 14:00:00', '2026-01-13 14:00:00', -6893, 'Conducted - Fit for Lockup', 'Denied', 'Sachin Sawant', 'MH-MUM-201');
INSERT INTO `vw_precinct_custody_overview` (`arrest_id`, `arrest_number`, `case_id`, `case_number`, `station_id`, `station_name`, `holding_cell_number`, `detainee_name`, `custody_type`, `booking_timestamp`, `magistrate_production_deadline`, `hours_until_production_deadline`, `medical_exam_status`, `bail_status`, `arresting_officer_name`, `arresting_officer_badge`) VALUES (2, 'ARR-2026-002', 4, 'CASE-2026-004', 2, 'Bandra Police Station (Zone IX)', 'Female Lockup Cell 1 (Bandra)', 'Sunita Jadhav', 'Police Custody (PCR)', '2026-03-20 22:30:00', '2026-03-21 22:30:00', -5276, 'Conducted - Fit for Lockup', 'Granted', 'Ananya Patil', 'MH-MUM-202');

DROP TABLE IF EXISTS `warrants`;
CREATE TABLE `warrants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `warrant_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `case_id` int NOT NULL,
  `suspect_id` int NOT NULL,
  `issuing_judge` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warrant_type` enum('Arrest','Search') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Arrest',
  `status` enum('Issued','Executed','Cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Issued',
  `issue_date` date NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `execution_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `court_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT 'Sessions Court Fort, Mumbai',
  `target_person_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `offense_sections` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'IPC 302, 120-B / BNSS 103',
  `station_id` int DEFAULT NULL,
  `executing_officer_id` int DEFAULT NULL,
  `execution_notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `warrant_number` (`warrant_number`),
  KEY `idx_warrant_case` (`case_id`),
  KEY `idx_warrant_suspect` (`suspect_id`),
  KEY `idx_warrant_status` (`status`),
  KEY `idx_warrant_type` (`warrant_type`),
  CONSTRAINT `fk_warrant_case` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_warrant_suspect` FOREIGN KEY (`suspect_id`) REFERENCES `criminals` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `warrants` (`id`, `warrant_number`, `case_id`, `suspect_id`, `issuing_judge`, `warrant_type`, `status`, `issue_date`, `expiry_date`, `execution_date`, `created_at`, `updated_at`, `court_name`, `target_person_name`, `offense_sections`, `station_id`, `executing_officer_id`, `execution_notes`) VALUES (1, 'WAR-2026-001', 2, 2, 'Hon. Metropolitan Magistrate V. P. Shinde', 'Arrest', 'Issued', '2026-02-17 18:30:00', '2026-12-30 18:30:00', NULL, '2026-10-23 14:45:19', '2026-10-25 12:12:13', 'Sessions Court Fort, Mumbai', 'Munna Qureshi', 'IPC 302, 120-B / BNSS 103', 1, NULL, NULL);
INSERT INTO `warrants` (`id`, `warrant_number`, `case_id`, `suspect_id`, `issuing_judge`, `warrant_type`, `status`, `issue_date`, `expiry_date`, `execution_date`, `created_at`, `updated_at`, `court_name`, `target_person_name`, `offense_sections`, `station_id`, `executing_officer_id`, `execution_notes`) VALUES (2, 'WAR-2026-002', 3, 5, 'Hon. Additional Chief Metropolitan Magistrate Bandra', 'Search', 'Executed', '2026-03-04 18:30:00', '2026-04-04 18:30:00', '2026-03-07 18:30:00', '2026-10-23 14:45:19', '2026-10-25 12:12:13', 'Sessions Court Fort, Mumbai', 'Sameer Tambe', 'IPC 302, 120-B / BNSS 103', 2, NULL, NULL);

SET FOREIGN_KEY_CHECKS = 1;
