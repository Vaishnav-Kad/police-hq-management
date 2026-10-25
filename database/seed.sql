-- ==============================================================================
-- POLICE HEADQUARTERS DATA MANAGEMENT SYSTEM (PHDMS)
-- Maharashtra & Indian Law Enforcement Seed Dataset
-- Jurisdiction: Maharashtra Police / Mumbai & Pune Police Commissionerates
-- Database: police_hq_db
-- ==============================================================================

USE police_hq_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. POLICE STATIONS (Mumbai & Pune Police Commissionerates)
-- ------------------------------------------------------------------------------
TRUNCATE TABLE Police_Stations;
INSERT INTO Police_Stations (id, name, location, contact_details, is_deleted) VALUES
(1, 'Mumbai Police HQ & Azad Maidan Police Station', 'Opp. CST Railway Station, Fort, South Mumbai, Maharashtra 400001', '+91-22-22620111', FALSE),
(2, 'Bandra Police Station (Zone IX)', 'Hill Road, Near Mehboob Studio, Bandra West, Mumbai, Maharashtra 400050', '+91-22-26422233', FALSE),
(3, 'Shivaji Nagar Police Station (Zone I Pune)', 'F.C. Road, Shivaji Nagar, Pune, Maharashtra 411005', '+91-20-25536343', FALSE);

-- ------------------------------------------------------------------------------
-- 2. POLICE OFFICERS (Maharashtra Police Cadre)
-- Passwords:
-- Admin@123    -> $2a$10$0Khiz8JTQ2VffPlnC6XzjeAy9ji0/J2sls1w1aJqv7iVEsKyEsy46
-- Head@123     -> $2a$10$3/S7t.8ZE9Iu.DIcjMJ9MuawdNTbJ.A4u8qT.czOL0yXGUPo5q1e2
-- Officer@123  -> $2a$10$s3Tc8YLgFMVISH0/fZo3cOtne9VsFYhNA30t0L/YNx2jmi/dE46.q
-- Evidence@123 -> $2a$10$i3F9SDr.XA/et/G58JiNveV5Dkh/tWklG1p5KYgi1Ix.O8GFwtqze
-- ------------------------------------------------------------------------------
TRUNCATE TABLE Police_Officers;
INSERT INTO Police_Officers (id, badge_number, first_name, last_name, rank_title, role, station_id, password_hash, email, phone, is_deleted) VALUES
(1, 'ADM-001', 'Asha', 'Kulkarni', 'Additional Commissioner of Police (Admin)', 'System-Admin', 1, '$2a$10$0Khiz8JTQ2VffPlnC6XzjeAy9ji0/J2sls1w1aJqv7iVEsKyEsy46', 'asha.kulkarni@mahapolice.gov.in', '+91-9820112233', FALSE),
(2, 'HED-101', 'Vikram', 'Shinde', 'Senior Police Inspector (Sr. PI)', 'Head-Officer', 1, '$2a$10$3/S7t.8ZE9Iu.DIcjMJ9MuawdNTbJ.A4u8qT.czOL0yXGUPo5q1e2', 'vikram.shinde@mahapolice.gov.in', '+91-9820223344', FALSE),
(3, 'HED-102', 'Pravin', 'Deshmukh', 'Assistant Commissioner of Police (ACP)', 'Head-Officer', 2, '$2a$10$3/S7t.8ZE9Iu.DIcjMJ9MuawdNTbJ.A4u8qT.czOL0yXGUPo5q1e2', 'pravin.deshmukh@mahapolice.gov.in', '+91-9820334455', FALSE),
(4, 'OFF-201', 'Sachin', 'Sawant', 'Police Sub-Inspector (PSI - Crime Branch)', 'Officer', 1, '$2a$10$s3Tc8YLgFMVISH0/fZo3cOtne9VsFYhNA30t0L/YNx2jmi/dE46.q', 'sachin.sawant@mahapolice.gov.in', '+91-9820445566', FALSE),
(5, 'OFF-202', 'Ananya', 'Patil', 'Assistant Police Inspector (API - Detection)', 'Officer', 2, '$2a$10$s3Tc8YLgFMVISH0/fZo3cOtne9VsFYhNA30t0L/YNx2jmi/dE46.q', 'ananya.patil@mahapolice.gov.in', '+91-9820556677', FALSE),
(6, 'EVD-301', 'Ganesh', 'More', 'Malkhana Incharge & Head Constable', 'Evidence-Manager', 1, '$2a$10$i3F9SDr.XA/et/G58JiNveV5Dkh/tWklG1p5KYgi1Ix.O8GFwtqze', 'ganesh.more@mahapolice.gov.in', '+91-9820667788', FALSE);

-- ------------------------------------------------------------------------------
-- 3. CRIMINALS (Indian/Maharashtrian Profiles with Aliases & Full-Text Search Traits)
-- ------------------------------------------------------------------------------
TRUNCATE TABLE Criminals;
INSERT INTO Criminals (id, first_name, last_name, alias, dob, gender, physical_description, mugshot_path, is_deleted) VALUES
(1, 'Raju', 'Gaikwad', 'Chhota Raju', '1987-05-14', 'Male', 'Height 5ft 8in, wheatish complexion, trident (Trishul) tattoo on right wrist, deep scar near left ear, walks with slight swagger.', '/police_storage/mugshots/raju_gaikwad.jpg', FALSE),
(2, 'Munna', 'Qureshi', 'Munna Supari', '1982-11-20', 'Male', 'Height 5ft 11in, dark complexion, thick mustache, slight limp on left foot due to old bullet injury, gold tooth in upper jaw.', '/police_storage/mugshots/munna_qureshi.jpg', FALSE),
(3, 'Sunita', 'Jadhav', 'Mami', '1991-03-12', 'Female', 'Height 5ft 4in, fair complexion, round face, small black mole on right cheek, prominent silver ring on left thumb.', '/police_storage/mugshots/sunita_jadhav.jpg', FALSE),
(4, 'Bablu', 'Kadam', 'Hathoda', '1985-08-25', 'Male', 'Height 6ft 2in, heavy muscular build, shaved head, knife laceration mark across collarbone, speaks Marathi with Kolhapuri dialect.', '/police_storage/mugshots/bablu_kadam.jpg', FALSE),
(5, 'Sameer', 'Tambe', 'Hacker Sam', '1996-01-18', 'Male', 'Height 5ft 7in, lean build, spectacles with black rectangular frame, burn scar on left palm.', '/police_storage/mugshots/sameer_tambe.jpg', FALSE),
(6, 'Reshma', 'Bhosale', 'Madam X', '1989-10-09', 'Female', 'Height 5ft 6in, wheatish complexion, shoulder-length straight black hair, crescent moon tattoo behind right ear.', '/police_storage/mugshots/reshma_bhosale.jpg', FALSE);

-- ------------------------------------------------------------------------------
-- 4. FIR (FIRST INFORMATION REPORTS - Genuine Mumbai & Pune GPS Coordinates)
-- ------------------------------------------------------------------------------
TRUNCATE TABLE FIR;
INSERT INTO FIR (id, fir_number, station_id, filed_by_officer_id, date_filed, incident_date, crime_type, description, status, latitude, longitude, is_deleted) VALUES
(1, 'FIR-2026-001', 1, 4, '2026-01-10 09:30:00', '2026-01-10 08:15:00', 'Armed Dacoity & Robbery (IPC 395/397)', 'Armed dacoity reported at Zaveri Bazaar jewelry showroom. Three masked assailants brandished country-made pistols (Katta) and fled on black Bajaj Pulsar motorbikes toward Marine Drive.', 'Active', 18.95020000, 72.83180000, FALSE),
(2, 'FIR-2026-002', 1, 4, '2026-02-15 14:15:00', '2026-02-15 11:30:00', 'Motor Vehicle Theft (IPC 379)', 'White luxury executive SUV stolen from outside corporate towers at Nariman Point using electronic frequency jamming and key-cloning device.', 'Active', 18.92560000, 72.82420000, FALSE),
(3, 'FIR-2026-003', 2, 5, '2026-03-01 10:00:00', '2026-02-28 23:45:00', 'Cyber Extortion & Ransomware (IT Act 66D)', 'Corporate ransomware payload deployed against financial services firm at Bandra-Kurla Complex (BKC); cryptocurrency ransom demanded to release decryptor.', 'Active', 19.06570000, 72.86870000, FALSE),
(4, 'FIR-2026-004', 2, 5, '2026-03-20 16:45:00', '2026-03-20 15:20:00', 'Narcotics Trafficking (NDPS Act 21/22)', 'Commercial quantity consignment of 500g Mephedrone (MD) seized during nighttime highway nakabandi near Western Express Highway Bandra flyover.', 'Pending', 19.05530000, 72.84200000, FALSE),
(5, 'FIR-2026-005', 1, 4, '2026-03-25 07:20:00', '2026-03-25 04:00:00', 'Homicide & Murder (IPC 302)', 'Unidentified adult male body with blunt-force trauma injuries discovered inside abandoned warehouse structure near Sassoon Docks waterfront in Colaba.', 'Active', 18.91350000, 72.82450000, FALSE),
(6, 'FIR-2026-006', 3, 4, '2025-11-05 11:10:00', '2025-11-04 22:00:00', 'Extortion & Arms Act (IPC 384/387, Arms Act 25)', 'Extortion demand of Rs 50 Lakh made to prominent infrastructure developer on F.C. Road Shivaji Nagar Pune; two country-made revolvers recovered.', 'Closed', 18.53140000, 73.84460000, FALSE),
(7, 'FIR-2026-007', 2, 5, '2025-08-10 18:00:00', '2025-08-10 02:30:00', 'Commercial Burglary (IPC 457/380)', 'Electronics showroom on Linking Road Bandra breached during power outage; security shutter lock cut and 45 high-end smartphones stolen.', 'Active', 19.06200000, 72.83360000, FALSE),
(8, 'FIR-2026-008', 1, 4, '2026-04-01 13:00:00', '2026-04-01 11:00:00', 'Counterfeit Currency (IPC 489B/489C)', 'Circulation of forged Indian currency notes (FICN) of denomination Rs 500 detected across Crawford Market wholesale fruit and spice stalls.', 'Pending', 18.94720000, 72.83470000, FALSE);

-- ------------------------------------------------------------------------------
-- 5. CASES (1:1 with FIRs, 5-Stage Kanban Progression)
-- ------------------------------------------------------------------------------
TRUNCATE TABLE Cases;
INSERT INTO Cases (id, case_number, fir_id, assigned_officer_id, case_status, priority, open_date, close_date, is_deleted) VALUES
(1, 'CASE-2026-001', 1, 4, 'In Court', 'Critical', '2026-01-10', NULL, FALSE),
(2, 'CASE-2026-002', 2, 4, 'Warrant Issued', 'High', '2026-02-15', NULL, FALSE),
(3, 'CASE-2026-003', 3, 5, 'Under Investigation', 'High', '2026-03-01', NULL, FALSE),
(4, 'CASE-2026-004', 4, 5, 'Filed', 'Medium', '2026-03-20', NULL, FALSE),
(5, 'CASE-2026-005', 5, 4, 'Under Investigation', 'Critical', '2026-03-25', NULL, FALSE),
(6, 'CASE-2026-006', 6, 4, 'Closed', 'Medium', '2025-11-05', '2026-02-28', FALSE),
(7, 'CASE-2026-007', 7, 5, 'Cold', 'Low', '2025-08-10', NULL, FALSE),
(8, 'CASE-2026-008', 8, NULL, 'Filed', 'Low', '2026-04-01', NULL, FALSE);

-- ------------------------------------------------------------------------------
-- 6. CASE_CRIMINAL_JUNCTION
-- ------------------------------------------------------------------------------
TRUNCATE TABLE Case_Criminal_Junction;
INSERT INTO Case_Criminal_Junction (id, case_id, criminal_id, involvement_type, notes) VALUES
(1, 1, 1, 'Accused', 'Identified via Zaveri Bazaar shop CCTV footage and forearm Trishul tattoo match.'),
(2, 1, 4, 'Suspect', 'Believed to have operated getaway Pulsar motorcycle during escape.'),
(3, 2, 2, 'Suspect', 'Vehicle electronics cloned using frequency devices traced to Munna Supari network.'),
(4, 3, 5, 'Suspect', 'Digital footprint and Bitcoin wallet transactions traced to alias Hacker Sam.'),
(5, 4, 3, 'Accused', 'Apprehended in possession of Mephedrone packets during Bandra WEH nakabandi.'),
(6, 5, 1, 'Suspect', 'Informant tip indicated Chhota Raju gang members were active in Sassoon Docks.'),
(7, 6, 6, 'Convicted', 'Admitted to coordinating extortion threats and supplying country-made revolvers.');

-- ------------------------------------------------------------------------------
-- 7. EVIDENCES (With SHA-256 Checksums & Local File Storage References)
-- ------------------------------------------------------------------------------
TRUNCATE TABLE Evidences;
INSERT INTO Evidences (id, evidence_number, case_id, logged_by_officer_id, description, evidence_type, storage_location, file_path, file_hash, file_size_bytes, mime_type, is_deleted) VALUES
(1, 'EVD-2026-001', 1, 6, 'Country-made 7.65mm pistol (Katta) with 3 live rounds seized from Mumbadevi drain', 'Firearm', 'Malkhana Ballistics Locker B-104', '/police_storage/evidences/katta_765mm_zaveri.dat', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 1024, 'application/octet-stream', FALSE),
(2, 'EVD-2026-002', 1, 6, 'High-definition digital video pendrive of Zaveri Bazaar lane CCTV camera #4', 'Digital Video', 'Malkhana Digital Safe Vault Alpha', '/police_storage/evidences/cctv_zaveri_bazaar.mp4', 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e', 41943040, 'video/mp4', FALSE),
(3, 'EVD-2026-003', 3, 6, 'Seized Lenovo ThinkPad laptop containing VPN proxy logs and extortion script files', 'Hardware', 'Cyber Cell Forensic Lab Rack 2', '/police_storage/evidences/laptop_tambe_dump.img', '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', 104857600, 'application/octet-stream', FALSE),
(4, 'EVD-2026-004', 4, 6, 'Forensic Science Laboratory (FSL Kalina) chemical report confirming 500g Mephedrone', 'Document', 'Malkhana FSL Archive Shelf F-12', '/police_storage/evidences/fsl_kalina_md_report.pdf', 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9', 512000, 'application/pdf', FALSE);

-- ------------------------------------------------------------------------------
-- 8. EVIDENCE_CHAIN_OF_CUSTODY (Immutable Legal Chain)
-- ------------------------------------------------------------------------------
TRUNCATE TABLE Evidence_Chain_Of_Custody;
INSERT INTO Evidence_Chain_Of_Custody (id, evidence_id, transferred_from_officer_id, transferred_to_officer_id, transfer_timestamp, purpose, custody_location) VALUES
(1, 1, NULL, 6, '2026-01-10 11:00:00', 'Initial crime scene seizure at Zaveri Bazaar and entry into Azad Maidan Malkhana', 'Azad Maidan Police Station Malkhana'),
(2, 1, 6, 4, '2026-02-10 09:30:00', 'Transferred to PSI Sachin Sawant for Sessions Court ballistic demonstration', 'City Civil & Sessions Court Fort, Mumbai'),
(3, 2, NULL, 6, '2026-01-10 12:30:00', 'Seized and sealed from jewelry shop CCTV DVR unit under Panchnama', 'Azad Maidan Malkhana Digital Vault'),
(4, 3, NULL, 6, '2026-03-02 08:45:00', 'Confiscated during residence search under Panchnama at Kurla West', 'BKC Cyber Police Station Lab');

-- ------------------------------------------------------------------------------
-- 9. COURT_DATES (Sessions & Magistrate Courts in Mumbai and Pune)
-- ------------------------------------------------------------------------------
TRUNCATE TABLE Court_Dates;
INSERT INTO Court_Dates (id, case_id, criminal_id, hearing_date, court_name, judge_name, decision, notes) VALUES
(1, 1, 1, '2026-10-25 11:00:00', 'City Civil & Sessions Court Fort, Courtroom 14', 'Hon. Additional Sessions Judge R. K. Joshi', 'Pending', 'Evidentiary admissibility hearing regarding recovered 7.65mm weapon and FSL ballistic report.'),
(2, 6, 6, '2026-02-14 14:30:00', 'Pune District & Sessions Court, Shivajinagar', 'Hon. Sessions Judge S. V. Mahajan', 'Guilty', 'Convicted under Arms Act Section 25(1B)(a) and IPC 387; sentenced to 5 years rigorous imprisonment.');

-- ------------------------------------------------------------------------------
-- 10. WARRANTS
-- ------------------------------------------------------------------------------
TRUNCATE TABLE Warrants;
INSERT INTO Warrants (id, warrant_number, case_id, suspect_id, issuing_judge, warrant_type, status, issue_date, expiry_date, execution_date) VALUES
(1, 'WAR-2026-001', 2, 2, 'Hon. Metropolitan Magistrate V. P. Shinde', 'Arrest', 'Issued', '2026-02-18', '2026-12-31', NULL),
(2, 'WAR-2026-002', 3, 5, 'Hon. Additional Chief Metropolitan Magistrate Bandra', 'Search', 'Executed', '2026-03-05', '2026-04-05', '2026-03-08');

-- ------------------------------------------------------------------------------
-- 11. VICTIMS_AND_WITNESSES (With Protected Witness Redaction)
-- ------------------------------------------------------------------------------
TRUNCATE TABLE Victims_And_Witnesses;
INSERT INTO Victims_And_Witnesses (id, case_id, person_type, name, contact_info, statement, is_protected) VALUES
(1, 1, 'Victim', 'Maheshbhai Shah (Jewelry Store Owner)', '+91-9820987654', 'Stood at the main cash counter when three individuals brandished a firearm at the security guard and broke glass displays.', FALSE),
(2, 1, 'Witness', 'Panch Witness - Dilip Solanki', 'REDACTED - LEVEL 1 CONFIDENTIAL', 'Observed two men mounting a black Bajaj Pulsar motorcycle without a rear number plate in the alley behind Zaveri Bazaar.', TRUE),
(3, 5, 'Reporter', 'Subhash Kamble (Fisherman)', '+91-9819123456', 'Noticed floating canvas bundle near jetty while mooring trawler boat at Sassoon Docks at dawn.', FALSE);

-- ------------------------------------------------------------------------------
-- 12. ARRESTS_AND_CUSTODY (Precinct Holding Cells & Bail Status)
-- ------------------------------------------------------------------------------
TRUNCATE TABLE Arrests_And_Custody;
INSERT INTO Arrests_And_Custody (id, arrest_number, case_id, suspect_id, arresting_officer_id, station_id, booking_timestamp, holding_cell_number, bail_status, bail_amount, release_timestamp) VALUES
(1, 'ARR-2026-001', 1, 1, 4, 1, '2026-01-12 19:30:00', 'Lockup Cell 2 (Azad Maidan)', 'Denied', 0.00, NULL),
(2, 'ARR-2026-002', 4, 3, 5, 2, '2026-03-21 04:00:00', 'Female Lockup Cell 1 (Bandra)', 'Granted', 75000.00, NULL);

-- ------------------------------------------------------------------------------
-- 13. ALERTS (High-Priority, Cold Case & Broadcast BOLOs)
-- ------------------------------------------------------------------------------
TRUNCATE TABLE Alerts;
INSERT INTO Alerts (id, case_id, alert_message, severity, is_read, created_at) VALUES
(1, 1, 'CRITICAL INCIDENT: Gang member Chhota Raju apprehended in Zaveri Bazaar dacoity case. Heightened security required.', 'Critical', FALSE, '2026-01-12 20:00:00'),
(2, 7, 'Automatic Notice: Case CASE-2026-007 (Linking Road Burglary) has been pending for over 90 days without closure.', 'High', FALSE, '2026-02-15 08:00:00'),
(3, NULL, 'BOLO BROADCAST: Sharp shooter Munna Qureshi (Munna Supari) spotted near Dadar TT circle. Alert all patrol vans.', 'High', FALSE, '2026-03-10 14:20:00');

-- ------------------------------------------------------------------------------
-- 14. AUDIT_LOGS
-- ------------------------------------------------------------------------------
TRUNCATE TABLE Audit_Logs;
INSERT INTO Audit_Logs (id, officer_id, action, target_table, record_id, details, timestamp) VALUES
(1, 4, 'CASE_UPDATE', 'Cases', 1, 'Status: Under Investigation -> In Court; Officer: 4 -> 4; Priority: Critical -> Critical', '2026-02-10 10:00:00'),
(2, 5, 'FIR_REGISTERED', 'FIR', 3, 'Registered new Cyber Extortion FIR under IT Act 66D; High severity alert triggered.', '2026-03-01 10:05:00');

-- ------------------------------------------------------------------------------
-- 15. ALERT_READS
-- ------------------------------------------------------------------------------
TRUNCATE TABLE Alert_Reads;
INSERT INTO Alert_Reads (id, alert_id, officer_id, read_at) VALUES
(1, 1, 2, '2026-01-12 20:30:00');

SET FOREIGN_KEY_CHECKS = 1;
