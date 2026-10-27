-- ==============================================================================
-- POLICE HEADQUARTERS DBMS - ADVANCED DATABASE PROGRAMMING
-- File: database/advanced_database_programming.sql
-- Description: Implementation of Stored Procedures, Triggers, and Views
--              enforcing core business rules and data integrity for police ops.
-- Target RDBMS: MySQL 8.0+
-- ==============================================================================

USE police_hq_db;

-- ==============================================================================
-- PART 1: STORED PROCEDURES
-- ==============================================================================

DELIMITER $$

-- ------------------------------------------------------------------------------
-- Procedure 1: sp_convert_fir_to_case
-- Business Rule Enforced:
-- 1. Verifies that the FIR exists and is not soft-deleted.
-- 2. Prevents duplicate case generation for the same FIR (one active case per FIR).
-- 3. Automatically generates a structured, formatted Case Number: CASE-YYYY-XXX.
-- 4. Automatically transitions FIR status from 'Pending' to 'Active'.
-- 5. Automatically writes an entry to the Audit_Logs ledger.
-- Parameters:
--   IN  p_fir_id              : ID of the FIR to promote
--   IN  p_assigned_officer_id : ID of the Investigating Officer (IO)
--   IN  p_priority            : Case Priority ('Critical', 'High', 'Medium', 'Low')
--   OUT p_case_id             : ID of newly generated Case record
--   OUT p_case_number         : Generated unique Case tracking number
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

    -- 1. Validate FIR existence
    SELECT COUNT(*) INTO v_fir_count FROM FIR WHERE id = p_fir_id AND is_deleted = FALSE;
    IF v_fir_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: FIR not found or marked deleted';
    END IF;

    -- 2. Prevent duplicate case creation
    SELECT COUNT(*) INTO v_existing_case_count FROM Cases WHERE fir_id = p_fir_id AND is_deleted = FALSE;
    IF v_existing_case_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: An active case is already registered for this FIR';
    END IF;

    -- 3. Generate sequential case number: CASE-YYYY-XXX
    SET v_current_year = YEAR(CURDATE());
    SELECT COUNT(*) + 1 INTO v_seq FROM Cases WHERE YEAR(created_at) = v_current_year;
    SET v_case_no = CONCAT('CASE-', v_current_year, '-', LPAD(v_seq, 3, '0'));

    -- 4. Create case
    INSERT INTO Cases (case_number, fir_id, assigned_officer_id, case_status, priority, open_date)
    VALUES (v_case_no, p_fir_id, p_assigned_officer_id, 'Under Investigation', COALESCE(p_priority, 'Medium'), CURDATE());

    SET v_new_id = LAST_INSERT_ID();
    SET p_case_id = v_new_id;
    SET p_case_number = v_case_no;

    -- 5. Transition FIR status
    UPDATE FIR SET status = 'Active' WHERE id = p_fir_id;

    -- 6. Insert audit trail
    INSERT INTO Audit_Logs (officer_id, action, target_table, record_id, details)
    VALUES (p_assigned_officer_id, 'FIR_TO_CASE_CONVERSION', 'Cases', v_new_id, CONCAT('Generated ', v_case_no, ' from FIR #', p_fir_id));
END$$

-- ------------------------------------------------------------------------------
-- Procedure 2: sp_transfer_evidence_custody
-- Business Rule Enforced:
-- 1. Validates that the evidence item exists and is active.
-- 2. Enforces non-repudiation by logging chain-of-custody transfer with previous
--    and recipient officers, date, timestamp, and purpose.
-- 3. Automatically synchronizes physical storage location and legal custody status
--    (e.g., 'In Malkhana Vault', 'Dispatched to FSL', 'Produced in Court').
-- 4. Creates an immutable entry in the Audit_Logs.
-- Parameters:
--   IN p_evidence_id     : Evidence primary key
--   IN p_from_officer_id : Discharging Officer ID
--   IN p_to_officer_id   : Receiving Officer ID
--   IN p_purpose         : Transfer Reason (e.g., 'Forensic Analysis at FSL Kalina')
--   IN p_new_location    : Physical location/Bin/Court Room
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

    -- Log Chain of Custody movement
    INSERT INTO Evidence_Chain_Of_Custody (evidence_id, transferred_from_officer_id, transferred_to_officer_id, purpose, custody_location)
    VALUES (p_evidence_id, p_from_officer_id, p_to_officer_id, p_purpose, p_new_location);

    -- Update parent Evidence record status and current location
    UPDATE Evidences 
    SET storage_location = p_new_location,
        chain_of_custody_status = CASE 
            WHEN p_purpose LIKE '%Court%' THEN 'Produced in Court'
            WHEN p_purpose LIKE '%FSL%' OR p_purpose LIKE '%Forensic%' THEN 'Dispatched to FSL'
            ELSE 'In Malkhana Vault'
        END
    WHERE id = p_evidence_id;

    -- Audit trail
    INSERT INTO Audit_Logs (officer_id, action, target_table, record_id, details)
    VALUES (p_from_officer_id, 'EVIDENCE_CUSTODY_TRANSFER', 'Evidences', p_evidence_id, 
            CONCAT('Transferred from Officer #', p_from_officer_id, ' to Officer #', p_to_officer_id, ' (Loc: ', p_new_location, ')'));
END$$

-- ------------------------------------------------------------------------------
-- Procedure 3: sp_get_precinct_crime_stats
-- Business Rule Enforced:
-- 1. Aggregates multi-table divisional metrics for Police Station Commanders.
-- 2. Calculates real-time counts for FIRs, active investigations, solved cases,
--    lockup occupancy vs total lockup capacity, and Malkhana evidence inventory.
-- Parameters:
--   IN p_station_id : Primary key of the Police Station
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

DELIMITER ;

-- ==============================================================================
-- PART 2: DATABASE TRIGGERS
-- ==============================================================================

DELIMITER $$

-- ------------------------------------------------------------------------------
-- Trigger 1: trg_prevent_evidence_delete
-- Business Rule Enforced:
-- Legal & chain of custody integrity: Prevents hard deletion of physical/digital
-- evidence if the parent criminal case is closed or finalized. Under Indian Evidence
-- Act & BNSS, evidence in concluded trials must be preserved for appeal periods.
-- Event: BEFORE DELETE ON Evidences
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
-- Trigger 2: trg_audit_case_update
-- Business Rule Enforced:
-- Accountability & Non-Repudiation: Every change to Case Status, Assigned Officer,
-- or Case Priority automatically writes an immutable log into Audit_Logs with the
-- old value, new value, and acting officer identifier.
-- Event: AFTER UPDATE ON Cases
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
-- Trigger 3: trg_enforce_warrant_execution_date
-- Business Rule Enforced:
-- When an outstanding arrest or search warrant status is updated to 'Executed',
-- automatically record today's date if execution_date was omitted.
-- Event: BEFORE UPDATE ON Warrants
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

DELIMITER ;

-- ==============================================================================
-- PART 3: DATABASE VIEWS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- View 1: vw_active_cases
-- Business Rule & Purpose:
-- Combines Case details, FIR details, Investigating Officer name/badge, and Station.
-- Computes the live dynamic duration (days_active) using DATEDIFF between
-- open_date and either close_date or today's date (CURDATE()).
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
-- View 2: vw_precinct_custody_overview
-- Business Rule & Purpose:
-- Enforces Section 57 CrPC / Article 22(2) Indian Constitution: A person arrested
-- must be produced before the nearest judicial magistrate within 24 hours.
-- Computes hours remaining until the mandatory 24-hr magistrate production deadline.
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
-- View 3: vw_evidence_vault_ledger
-- Business Rule & Purpose:
-- Provides the Master Malkhana Vault Inventory ledger. Joins evidence records with
-- parent cases, police station vault locations, logging officers, and computes the
-- most recent chain-of-custody holder via a subquery.
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
