-- ==============================================================================
-- POLICE HEADQUARTERS DATA MANAGEMENT SYSTEM (PHDMS)
-- Database: police_hq_db
-- Storage Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS police_hq_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE police_hq_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. POLICE STATIONS TABLE
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS Police_Stations;
CREATE TABLE Police_Stations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(255) NOT NULL,
    contact_details VARCHAR(100) NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_station_name (name),
    INDEX idx_station_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. POLICE OFFICERS TABLE
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS Police_Officers;
CREATE TABLE Police_Officers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    badge_number VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    rank_title VARCHAR(100) NOT NULL,
    role ENUM('Officer', 'Evidence-Manager', 'Head-Officer', 'System-Admin') NOT NULL DEFAULT 'Officer',
    station_id INT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(150) NULL UNIQUE,
    phone VARCHAR(50) NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_officer_station (station_id),
    INDEX idx_officer_role (role),
    INDEX idx_officer_badge (badge_number),
    INDEX idx_officer_deleted (is_deleted),
    CONSTRAINT fk_officer_station FOREIGN KEY (station_id) 
        REFERENCES Police_Stations(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. CRIMINALS TABLE (WITH FULLTEXT SEARCH)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS Criminals;
CREATE TABLE Criminals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    alias VARCHAR(100) NULL,
    dob DATE NULL,
    gender ENUM('Male', 'Female', 'Other', 'Unknown') NOT NULL DEFAULT 'Unknown',
    physical_description TEXT NULL,
    mugshot_path VARCHAR(255) NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_criminal_name (last_name, first_name),
    INDEX idx_criminal_alias (alias),
    INDEX idx_criminal_deleted (is_deleted),
    FULLTEXT INDEX ft_criminal_search (alias, physical_description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. FIR (FIRST INFORMATION REPORTS) TABLE
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS FIR;
CREATE TABLE FIR (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fir_number VARCHAR(50) NOT NULL UNIQUE,
    station_id INT NOT NULL,
    filed_by_officer_id INT NOT NULL,
    date_filed DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    incident_date DATETIME NOT NULL,
    crime_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('Pending', 'Active', 'Closed') NOT NULL DEFAULT 'Pending',
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fir_station (station_id),
    INDEX idx_fir_officer (filed_by_officer_id),
    INDEX idx_fir_crime_type (crime_type),
    INDEX idx_fir_status (status),
    INDEX idx_fir_date_filed (date_filed),
    INDEX idx_fir_coordinates (latitude, longitude),
    INDEX idx_fir_deleted (is_deleted),
    CONSTRAINT fk_fir_station FOREIGN KEY (station_id) 
        REFERENCES Police_Stations(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_fir_officer FOREIGN KEY (filed_by_officer_id) 
        REFERENCES Police_Officers(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. CASES TABLE
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS Cases;
CREATE TABLE Cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_number VARCHAR(50) NOT NULL UNIQUE,
    fir_id INT NOT NULL UNIQUE,
    assigned_officer_id INT NULL,
    case_status ENUM('Filed', 'Under Investigation', 'Warrant Issued', 'In Court', 'Closed', 'Cold') NOT NULL DEFAULT 'Filed',
    priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    open_date DATE NOT NULL,
    close_date DATE NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_case_status (case_status),
    INDEX idx_case_assigned_officer (assigned_officer_id),
    INDEX idx_case_open_date (open_date),
    INDEX idx_case_priority (priority),
    INDEX idx_case_deleted (is_deleted),
    CONSTRAINT fk_cases_fir FOREIGN KEY (fir_id) 
        REFERENCES FIR(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_cases_officer FOREIGN KEY (assigned_officer_id) 
        REFERENCES Police_Officers(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. CASE_CRIMINAL_JUNCTION TABLE
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS Case_Criminal_Junction;
CREATE TABLE Case_Criminal_Junction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    criminal_id INT NOT NULL,
    involvement_type ENUM('Suspect', 'Accused', 'Convicted') NOT NULL DEFAULT 'Suspect',
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_case_criminal (case_id, criminal_id),
    INDEX idx_junction_case (case_id),
    INDEX idx_junction_criminal (criminal_id),
    INDEX idx_junction_type (involvement_type),
    CONSTRAINT fk_junction_case FOREIGN KEY (case_id) 
        REFERENCES Cases(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_junction_criminal FOREIGN KEY (criminal_id) 
        REFERENCES Criminals(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. EVIDENCES TABLE
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS Evidences;
CREATE TABLE Evidences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evidence_number VARCHAR(50) NOT NULL UNIQUE,
    case_id INT NOT NULL,
    logged_by_officer_id INT NOT NULL,
    description TEXT NOT NULL,
    evidence_type VARCHAR(100) NOT NULL,
    storage_location VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NULL,
    file_hash CHAR(64) NULL, -- SHA-256 hex string (64 chars)
    file_size_bytes BIGINT NULL,
    mime_type VARCHAR(100) NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_evidence_case (case_id),
    INDEX idx_evidence_officer (logged_by_officer_id),
    INDEX idx_evidence_type (evidence_type),
    INDEX idx_evidence_hash (file_hash),
    INDEX idx_evidence_deleted (is_deleted),
    CONSTRAINT fk_evidence_case FOREIGN KEY (case_id) 
        REFERENCES Cases(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_evidence_officer FOREIGN KEY (logged_by_officer_id) 
        REFERENCES Police_Officers(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. EVIDENCE_CHAIN_OF_CUSTODY TABLE
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS Evidence_Chain_Of_Custody;
CREATE TABLE Evidence_Chain_Of_Custody (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evidence_id INT NOT NULL,
    transferred_from_officer_id INT NULL, -- NULL only on initial genesis evidence intake
    transferred_to_officer_id INT NOT NULL,
    transfer_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    purpose VARCHAR(255) NOT NULL,
    custody_location VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_custody_evidence (evidence_id),
    INDEX idx_custody_transfer_to (transferred_to_officer_id),
    INDEX idx_custody_timestamp (transfer_timestamp),
    CONSTRAINT fk_custody_evidence FOREIGN KEY (evidence_id) 
        REFERENCES Evidences(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_custody_from_officer FOREIGN KEY (transferred_from_officer_id) 
        REFERENCES Police_Officers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_custody_to_officer FOREIGN KEY (transferred_to_officer_id) 
        REFERENCES Police_Officers(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. COURT_DATES TABLE
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS Court_Dates;
CREATE TABLE Court_Dates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    criminal_id INT NULL,
    hearing_date DATETIME NOT NULL,
    court_name VARCHAR(150) NOT NULL,
    judge_name VARCHAR(150) NOT NULL,
    decision ENUM('Pending', 'Guilty', 'Not Guilty', 'Bail') NOT NULL DEFAULT 'Pending',
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_court_case (case_id),
    INDEX idx_court_criminal (criminal_id),
    INDEX idx_court_hearing_date (hearing_date),
    INDEX idx_court_decision (decision),
    CONSTRAINT fk_court_case FOREIGN KEY (case_id) 
        REFERENCES Cases(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_court_criminal FOREIGN KEY (criminal_id) 
        REFERENCES Criminals(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. WARRANTS TABLE
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS Warrants;
CREATE TABLE Warrants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    warrant_number VARCHAR(50) NOT NULL UNIQUE,
    case_id INT NOT NULL,
    suspect_id INT NOT NULL,
    issuing_judge VARCHAR(150) NOT NULL,
    warrant_type ENUM('Arrest', 'Search') NOT NULL DEFAULT 'Arrest',
    status ENUM('Issued', 'Executed', 'Cancelled') NOT NULL DEFAULT 'Issued',
    issue_date DATE NOT NULL,
    expiry_date DATE NULL,
    execution_date DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_warrant_case (case_id),
    INDEX idx_warrant_suspect (suspect_id),
    INDEX idx_warrant_status (status),
    INDEX idx_warrant_type (warrant_type),
    CONSTRAINT fk_warrant_case FOREIGN KEY (case_id) 
        REFERENCES Cases(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_warrant_suspect FOREIGN KEY (suspect_id) 
        REFERENCES Criminals(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. VICTIMS_AND_WITNESSES TABLE
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS Victims_And_Witnesses;
CREATE TABLE Victims_And_Witnesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    person_type ENUM('Victim', 'Witness', 'Reporter') NOT NULL DEFAULT 'Victim',
    name VARCHAR(150) NOT NULL,
    contact_info VARCHAR(255) NULL,
    statement TEXT NULL,
    is_protected BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_witness_case (case_id),
    INDEX idx_witness_type (person_type),
    INDEX idx_witness_protected (is_protected),
    CONSTRAINT fk_witness_case FOREIGN KEY (case_id) 
        REFERENCES Cases(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. ARRESTS_AND_CUSTODY TABLE
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS Arrests_And_Custody;
CREATE TABLE Arrests_And_Custody (
    id INT AUTO_INCREMENT PRIMARY KEY,
    arrest_number VARCHAR(50) NOT NULL UNIQUE,
    case_id INT NOT NULL,
    suspect_id INT NOT NULL,
    arresting_officer_id INT NOT NULL,
    station_id INT NOT NULL,
    booking_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    holding_cell_number VARCHAR(50) NOT NULL,
    bail_status ENUM('Granted', 'Denied', 'Pending', 'Released on Bail') NOT NULL DEFAULT 'Pending',
    bail_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    release_timestamp DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_arrest_case (case_id),
    INDEX idx_arrest_suspect (suspect_id),
    INDEX idx_arrest_officer (arresting_officer_id),
    INDEX idx_arrest_station (station_id),
    INDEX idx_arrest_cell (holding_cell_number),
    INDEX idx_arrest_bail (bail_status),
    CONSTRAINT fk_arrest_case FOREIGN KEY (case_id) 
        REFERENCES Cases(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_arrest_suspect FOREIGN KEY (suspect_id) 
        REFERENCES Criminals(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_arrest_officer FOREIGN KEY (arresting_officer_id) 
        REFERENCES Police_Officers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_arrest_station FOREIGN KEY (station_id) 
        REFERENCES Police_Stations(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. ALERTS TABLE
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS Alerts;
CREATE TABLE Alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NULL, -- NULLABLE for global precinct-wide BOLO broadcasts
    alert_message TEXT NOT NULL,
    severity ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_alert_case (case_id),
    INDEX idx_alert_severity (severity),
    INDEX idx_alert_is_read (is_read),
    INDEX idx_alert_created_at (created_at),
    CONSTRAINT fk_alert_case FOREIGN KEY (case_id) 
        REFERENCES Cases(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. AUDIT_LOGS TABLE
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS Audit_Logs;
CREATE TABLE Audit_Logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    officer_id INT NULL,
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(100) NOT NULL,
    record_id INT NULL,
    details TEXT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_officer (officer_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_target (target_table),
    INDEX idx_audit_timestamp (timestamp),
    CONSTRAINT fk_audit_officer FOREIGN KEY (officer_id) 
        REFERENCES Police_Officers(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 15. ALERT_READS TABLE (PER-OFFICER NOTIFICATION STATE)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS Alert_Reads;
CREATE TABLE Alert_Reads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_id INT NOT NULL,
    officer_id INT NOT NULL,
    read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_alert_officer (alert_id, officer_id),
    INDEX idx_read_officer (officer_id),
    CONSTRAINT fk_alert_read_alert FOREIGN KEY (alert_id) 
        REFERENCES Alerts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_alert_read_officer FOREIGN KEY (officer_id) 
        REFERENCES Police_Officers(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- DATABASE VIEWS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- View: vw_active_cases
-- Computes dynamic case duration (days_active) without generated column limitations
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_active_cases AS
SELECT 
    c.id,
    c.case_number,
    c.fir_id,
    f.fir_number,
    f.crime_type,
    f.station_id,
    s.name AS station_name,
    c.assigned_officer_id,
    CONCAT(o.first_name, ' ', o.last_name) AS assigned_officer_name,
    o.badge_number AS assigned_officer_badge,
    c.case_status,
    c.priority,
    c.open_date,
    c.close_date,
    DATEDIFF(COALESCE(c.close_date, CURDATE()), c.open_date) AS days_active,
    c.created_at,
    c.updated_at
FROM Cases c
JOIN FIR f ON c.fir_id = f.id
JOIN Police_Stations s ON f.station_id = s.id
LEFT JOIN Police_Officers o ON c.assigned_officer_id = o.id
WHERE c.is_deleted = FALSE;

-- ------------------------------------------------------------------------------
-- View: vw_precinct_custody_overview
-- Enforces Section 57 CrPC 24-hr magistrate production monitoring
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_precinct_custody_overview AS
SELECT 
    a.id AS arrest_id,
    a.arrest_number,
    a.case_id,
    c.case_number,
    a.station_id,
    s.name AS station_name,
    a.holding_cell_number,
    COALESCE(a.arrestee_name, CONCAT(cr.first_name, ' ', cr.last_name)) AS detainee_name,
    a.custody_type,
    a.booking_timestamp,
    a.magistrate_production_deadline,
    TIMESTAMPDIFF(HOUR, NOW(), a.magistrate_production_deadline) AS hours_until_production_deadline,
    a.medical_exam_status,
    a.bail_status,
    CONCAT(o.first_name, ' ', o.last_name) AS arresting_officer_name,
    o.badge_number AS arresting_officer_badge
FROM Arrests_And_Custody a
JOIN Cases c ON a.case_id = c.id
JOIN Criminals cr ON a.suspect_id = cr.id
JOIN Police_Stations s ON a.station_id = s.id
JOIN Police_Officers o ON a.arresting_officer_id = o.id;

-- ------------------------------------------------------------------------------
-- View: vw_evidence_vault_ledger
-- Malkhana Vault ledger tracking storage bin, custody officer, and parent case
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_evidence_vault_ledger AS
SELECT 
    e.id AS evidence_id,
    e.evidence_number,
    e.description,
    e.evidence_type,
    e.storage_location,
    e.locker_bin_number,
    e.chain_of_custody_status,
    e.seizure_memo_number,
    e.witness_name,
    e.file_hash,
    c.case_number,
    s.id AS station_id,
    s.name AS station_name,
    s.evidence_vault_location,
    CONCAT(o.first_name, ' ', o.last_name) AS logged_by_officer_name,
    o.badge_number AS logged_by_officer_badge,
    custodian.id AS current_custodian_id,
    CONCAT(custodian.first_name, ' ', custodian.last_name) AS current_custodian_name
FROM Evidences e
JOIN Cases c ON e.case_id = c.id
JOIN FIR f ON c.fir_id = f.id
JOIN Police_Stations s ON COALESCE(e.station_id, f.station_id) = s.id
JOIN Police_Officers o ON e.logged_by_officer_id = o.id
LEFT JOIN (
    SELECT ecc1.evidence_id, ecc1.transferred_to_officer_id
    FROM Evidence_Chain_Of_Custody ecc1
    INNER JOIN (
        SELECT evidence_id, MAX(id) AS max_id
        FROM Evidence_Chain_Of_Custody
        GROUP BY evidence_id
    ) ecc2 ON ecc1.id = ecc2.max_id
) latest_custody ON e.id = latest_custody.evidence_id
LEFT JOIN Police_Officers custodian ON latest_custody.transferred_to_officer_id = custodian.id
WHERE e.is_deleted = FALSE;

-- ==============================================================================
-- STORED PROCEDURES
-- ==============================================================================
DELIMITER $$

-- ------------------------------------------------------------------------------
-- Procedure: sp_convert_fir_to_case
-- Promotes FIR into official Case with sequential CASE-YYYY-XXX numbering & audit
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_convert_fir_to_case$$
CREATE PROCEDURE sp_convert_fir_to_case(
    IN p_fir_id INT,
    IN p_assigned_officer_id INT,
    IN p_priority VARCHAR(20),
    OUT p_case_id INT,
    OUT p_case_number VARCHAR(50)
)
proc_label: BEGIN
    DECLARE v_fir_count INT;
    DECLARE v_existing_case_count INT;
    DECLARE v_current_year INT;
    DECLARE v_seq INT;
    DECLARE v_case_no VARCHAR(50);
    DECLARE v_new_id INT;

    -- Validate FIR
    SELECT COUNT(*) INTO v_fir_count FROM FIR WHERE id = p_fir_id AND is_deleted = FALSE;
    IF v_fir_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: FIR not found or marked deleted';
    END IF;

    -- Prevent duplicate
    SELECT COUNT(*) INTO v_existing_case_count FROM Cases WHERE fir_id = p_fir_id AND is_deleted = FALSE;
    IF v_existing_case_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: An active case is already registered for this FIR';
    END IF;

    SET v_current_year = YEAR(CURDATE());
    SELECT COUNT(*) + 1 INTO v_seq FROM Cases WHERE YEAR(created_at) = v_current_year;
    SET v_case_no = CONCAT('CASE-', v_current_year, '-', LPAD(v_seq, 3, '0'));

    INSERT INTO Cases (case_number, fir_id, assigned_officer_id, case_status, priority, open_date)
    VALUES (v_case_no, p_fir_id, p_assigned_officer_id, 'Under Investigation', COALESCE(p_priority, 'Medium'), CURDATE());

    SET v_new_id = LAST_INSERT_ID();
    SET p_case_id = v_new_id;
    SET p_case_number = v_case_no;

    UPDATE FIR SET status = 'Active' WHERE id = p_fir_id;

    INSERT INTO Audit_Logs (officer_id, action, target_table, record_id, details)
    VALUES (p_assigned_officer_id, 'FIR_TO_CASE_CONVERSION', 'Cases', v_new_id, CONCAT('Generated ', v_case_no, ' from FIR #', p_fir_id));
END$$

-- ------------------------------------------------------------------------------
-- Procedure: sp_transfer_evidence_custody
-- Enforces custody chain log, updates storage location, and syncs status
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_transfer_evidence_custody$$
CREATE PROCEDURE sp_transfer_evidence_custody(
    IN p_evidence_id INT,
    IN p_from_officer_id INT,
    IN p_to_officer_id INT,
    IN p_purpose VARCHAR(255),
    IN p_new_location VARCHAR(255)
)
BEGIN
    DECLARE v_evidence_count INT;

    SELECT COUNT(*) INTO v_evidence_count FROM Evidences WHERE id = p_evidence_id AND is_deleted = FALSE;
    IF v_evidence_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Evidence item not found or marked deleted';
    END IF;

    INSERT INTO Evidence_Chain_Of_Custody (evidence_id, transferred_from_officer_id, transferred_to_officer_id, purpose, custody_location)
    VALUES (p_evidence_id, p_from_officer_id, p_to_officer_id, p_purpose, p_new_location);

    UPDATE Evidences 
    SET storage_location = p_new_location,
        chain_of_custody_status = CASE 
            WHEN p_purpose LIKE '%Court%' THEN 'Produced in Court'
            WHEN p_purpose LIKE '%FSL%' OR p_purpose LIKE '%Forensic%' THEN 'Dispatched to FSL'
            ELSE 'In Malkhana Vault'
        END
    WHERE id = p_evidence_id;

    INSERT INTO Audit_Logs (officer_id, action, target_table, record_id, details)
    VALUES (p_from_officer_id, 'EVIDENCE_CUSTODY_TRANSFER', 'Evidences', p_evidence_id, 
            CONCAT('Transferred from Officer #', p_from_officer_id, ' to Officer #', p_to_officer_id, ' (Loc: ', p_new_location, ')'));
END$$

-- ------------------------------------------------------------------------------
-- Procedure: sp_get_precinct_crime_stats
-- Aggregates station-level crime, custody, and evidence metrics
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_get_precinct_crime_stats$$
CREATE PROCEDURE sp_get_precinct_crime_stats(
    IN p_station_id INT
)
BEGIN
    SELECT 
        s.id AS station_id,
        s.name AS station_name,
        s.station_code,
        s.lockup_capacity,
        s.evidence_vault_capacity,
        COUNT(DISTINCT f.id) AS total_firs_registered,
        COUNT(DISTINCT CASE WHEN c.case_status = 'Under Investigation' THEN c.id END) AS active_investigations,
        COUNT(DISTINCT CASE WHEN c.case_status = 'In Court' THEN c.id END) AS cases_in_trial,
        COUNT(DISTINCT CASE WHEN c.case_status = 'Closed' THEN c.id END) AS cases_solved,
        COUNT(DISTINCT CASE WHEN a.release_timestamp IS NULL THEN a.id END) AS current_lockup_detainees,
        COUNT(DISTINCT e.id) AS malkhana_evidence_count
    FROM Police_Stations s
    LEFT JOIN FIR f ON s.id = f.station_id AND f.is_deleted = FALSE
    LEFT JOIN Cases c ON f.id = c.fir_id AND c.is_deleted = FALSE
    LEFT JOIN Arrests_And_Custody a ON s.id = a.station_id
    LEFT JOIN Evidences e ON (s.id = e.station_id OR s.id = f.station_id) AND e.is_deleted = FALSE
    WHERE s.id = p_station_id
    GROUP BY s.id;
END$$

-- ==============================================================================
-- TRIGGERS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Trigger: trg_prevent_evidence_delete
-- Blocks hard deletion of evidence if associated case has status 'Closed'
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_prevent_evidence_delete$$
CREATE TRIGGER trg_prevent_evidence_delete
BEFORE DELETE ON Evidences
FOR EACH ROW
BEGIN
    DECLARE v_status VARCHAR(50);
    SELECT case_status INTO v_status FROM Cases WHERE id = OLD.case_id;
    IF v_status = 'Closed' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Integrity Violation: Cannot delete evidence associated with a closed case. Legal preservation period active.';
    END IF;
END$$

-- ------------------------------------------------------------------------------
-- Trigger: trg_audit_case_update
-- Logs case lifecycle transitions into Audit_Logs using @current_officer_id context
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_audit_case_update$$
CREATE TRIGGER trg_audit_case_update
AFTER UPDATE ON Cases
FOR EACH ROW
BEGIN
    DECLARE v_actor_id INT;
    SET v_actor_id = COALESCE(@current_officer_id, NEW.assigned_officer_id);
    
    IF OLD.case_status <> NEW.case_status 
       OR OLD.assigned_officer_id <> NEW.assigned_officer_id 
       OR OLD.priority <> NEW.priority THEN
        INSERT INTO Audit_Logs (officer_id, action, target_table, record_id, details)
        VALUES (
            v_actor_id,
            'CASE_UPDATE',
            'Cases',
            NEW.id,
            CONCAT(
                'Status: ', OLD.case_status, ' -> ', NEW.case_status,
                '; Officer: ', COALESCE(CAST(OLD.assigned_officer_id AS CHAR), 'Unassigned'), 
                ' -> ', COALESCE(CAST(NEW.assigned_officer_id AS CHAR), 'Unassigned'),
                '; Priority: ', OLD.priority, ' -> ', NEW.priority
            )
        );
    END IF;
END$$

-- ------------------------------------------------------------------------------
-- Trigger: trg_enforce_warrant_execution_date
-- Automatically stamps execution date when warrant status transitions to 'Executed'
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_enforce_warrant_execution_date$$
CREATE TRIGGER trg_enforce_warrant_execution_date
BEFORE UPDATE ON Warrants
FOR EACH ROW
BEGIN
    IF NEW.status = 'Executed' AND (NEW.execution_date IS NULL) THEN
        SET NEW.execution_date = CURDATE();
    END IF;
END$$

-- ==============================================================================
-- SCHEDULED EVENTS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Event: evt_check_pending_cases
-- Runs daily to flag cases open for > 90 days with 30-day deduplication
-- ------------------------------------------------------------------------------
DROP EVENT IF EXISTS evt_check_pending_cases$$
CREATE EVENT IF NOT EXISTS evt_check_pending_cases
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_TIMESTAMP + INTERVAL 1 HOUR)
DO
BEGIN
    INSERT INTO Alerts (case_id, alert_message, severity, is_read, created_at)
    SELECT 
        c.id,
        CONCAT('Automatic Notice: Case ', c.case_number, ' has been pending for over 90 days without closure.'),
        'High',
        FALSE,
        NOW()
    FROM Cases c
    WHERE c.is_deleted = FALSE
      AND c.case_status NOT IN ('Closed', 'Cold')
      AND DATEDIFF(CURDATE(), c.open_date) > 90
      AND NOT EXISTS (
          SELECT 1 FROM Alerts a 
          WHERE a.case_id = c.id 
            AND a.alert_message LIKE '%pending for over 90 days%'
            AND a.created_at >= NOW() - INTERVAL 30 DAY
      );
END$$

DELIMITER ;
