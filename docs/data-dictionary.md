# Police Headquarters Data Management System (PHDMS)
## Master Database Data Dictionary & Schema Specification

**Database Engine:** MySQL 8.0.x (InnoDB Storage Engine)  
**Character Set:** `utf8mb4` (Collation: `utf8mb4_unicode_ci`)  
**Architecture:** 3NF / BCNF Normalized Relational Schema with Strict Foreign Keys  

---

### Entity-Relationship Summary

| # | Table Name | Primary Key | Foreign Keys | Functional Purpose |
|---|---|---|---|---|
| 1 | `Police_Stations` | `id` | - | Master precinct and commissionerate station records |
| 2 | `Police_Officers` | `id` | `station_id` | Law enforcement personnel, badge numbers, roles & bcrypt credentials |
| 3 | `FIR` | `id` | `station_id`, `filed_by_officer_id` | First Information Reports with GPS incident coordinates |
| 4 | `Cases` | `id` | `fir_id`, `assigned_officer_id` | 1:1 investigation cases with 5-stage legal lifecycle tracking |
| 5 | `Criminals` | `id` | - | Suspect & convict biometric dossiers with full-text search index |
| 6 | `Case_Criminal_Junction` | `(case_id, criminal_id)` | `case_id`, `criminal_id` | M:N association tracking involvement types (Suspect, Accused, Convicted) |
| 7 | `Evidences` | `id` | `case_id`, `logged_by_officer_id` | Physical & digital evidence items with SHA-256 byte hashes |
| 8 | `Evidence_Chain_Of_Custody` | `id` | `evidence_id`, `transferred_from_officer_id`, `transferred_to_officer_id` | Cryptographically auditable custody transfer ledger |
| 9 | `Court_Dates` | `id` | `case_id`, `criminal_id` | Sessions court trial schedules, presiding judges & verdicts |
| 10 | `Warrants` | `id` | `case_id`, `suspect_id` | Judicial arrest and search warrants with status transitions |
| 11 | `Victims_And_Witnesses` | `id` | `case_id` | Depositions and panchnama statements with Level-1 redaction |
| 12 | `Arrests_And_Custody` | `id` | `case_id`, `suspect_id`, `arresting_officer_id`, `station_id` | Precinct holding cell bookings, bail amounts & release dates |
| 13 | `Alerts` | `id` | `case_id` | Priority BOLO and 90-day cold case alert dispatches |
| 14 | `Alert_Reads` | `(alert_id, officer_id)` | `alert_id`, `officer_id` | Per-officer alert read status and timestamp tracking |
| 15 | `Audit_Logs` | `id` | `officer_id` | Append-only immutable system security audit ledger |

---

### Table 1: `Police_Stations`
*Stores police commissionerates, divisional headquarters, and precinct stations.*

| Column | Data Type | Nullable | Key | Constraints / Defaults | Description |
|---|---|---|---|---|---|
| `id` | INT UNSIGNED | NO | PK | AUTO_INCREMENT | Unique surrogate identifier |
| `name` | VARCHAR(100) | NO | - | - | Official station name (e.g., Azad Maidan HQ) |
| `location` | VARCHAR(255) | NO | - | - | Physical postal address and landmark |
| `contact_number` | VARCHAR(20) | NO | - | - | Official landline / control room contact |
| `is_deleted` | BOOLEAN | NO | - | DEFAULT FALSE | Soft-delete flag |
| `created_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last modification timestamp |

---

### Table 2: `Police_Officers`
*Stores authenticated law enforcement personnel across Maharashtra Police ranks.*

| Column | Data Type | Nullable | Key | Constraints / Defaults | Description |
|---|---|---|---|---|---|
| `id` | INT UNSIGNED | NO | PK | AUTO_INCREMENT | Unique surrogate officer ID |
| `badge_number` | VARCHAR(50) | NO | UK | UNIQUE | Unique police badge (e.g., `MH-MUM-2031`) |
| `first_name` | VARCHAR(50) | NO | - | - | Officer given name |
| `last_name` | VARCHAR(50) | NO | - | - | Officer surname |
| `rank_title` | VARCHAR(50) | NO | - | - | Rank designation (Addl. CP, Sr. PI, PSI, Malkhana Incharge) |
| `role` | ENUM | NO | - | `'System-Admin'`, `'Head-Officer'`, `'Officer'`, `'Evidence-Manager'` | RBAC permission level |
| `station_id` | INT UNSIGNED | NO | FK | REFERENCES `Police_Stations(id)` | Assigned precinct station (ABAC boundary) |
| `email` | VARCHAR(100) | NO | UK | UNIQUE | Official department email address |
| `phone` | VARCHAR(20) | YES | - | - | Mobile contact number |
| `password_hash` | VARCHAR(255) | NO | - | - | Bcrypt salt & hash (cost 10) |
| `is_deleted` | BOOLEAN | NO | - | DEFAULT FALSE | Soft-delete flag |
| `created_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |
| `updated_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last profile update |

---

### Table 3: `FIR` (First Information Reports)
*Formal citizen complaints and cognizable offense intake reports.*

| Column | Data Type | Nullable | Key | Constraints / Defaults | Description |
|---|---|---|---|---|---|
| `id` | INT UNSIGNED | NO | PK | AUTO_INCREMENT | Primary key surrogate identifier |
| `fir_number` | VARCHAR(50) | NO | UK | UNIQUE | Sequential identifier (e.g., `FIR-2026-001`) |
| `station_id` | INT UNSIGNED | NO | FK | REFERENCES `Police_Stations(id)` | Filing police station jurisdiction |
| `filed_by_officer_id` | INT UNSIGNED | NO | FK | REFERENCES `Police_Officers(id)` | Registering police officer |
| `date_filed` | DATETIME | NO | - | DEFAULT CURRENT_TIMESTAMP | Official registration date/time |
| `incident_date` | DATETIME | NO | - | - | Occurrence timestamp of offense |
| `crime_type` | VARCHAR(100) | NO | - | - | Offense description (IPC/NDPS/IT Act) |
| `description` | TEXT | NO | - | - | Detailed complainant statement |
| `status` | ENUM | NO | - | `'Active'`, `'Pending'`, `'Dismissed'`, `'Closed'` | Current administrative FIR status |
| `latitude` | DECIMAL(10, 8) | YES | - | CHECK `latitude BETWEEN -90 AND 90` | WGS-84 Latitude coordinate |
| `longitude` | DECIMAL(11, 8) | YES | - | CHECK `longitude BETWEEN -180 AND 180` | WGS-84 Longitude coordinate |
| `is_deleted` | BOOLEAN | NO | - | DEFAULT FALSE | Soft-delete flag |
| `created_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |
| `updated_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Audit update |

---

### Table 4: `Cases`
*Active and closed police investigations originating 1:1 from an FIR.*

| Column | Data Type | Nullable | Key | Constraints / Defaults | Description |
|---|---|---|---|---|---|
| `id` | INT UNSIGNED | NO | PK | AUTO_INCREMENT | Case surrogate primary key |
| `case_number` | VARCHAR(50) | NO | UK | UNIQUE | Official Case Code (e.g., `CASE-2026-001`) |
| `fir_id` | INT UNSIGNED | NO | FK, UK | REFERENCES `FIR(id)` UNIQUE | Enforces strict 1:1 FIR-to-Case relationship |
| `assigned_officer_id`| INT UNSIGNED | YES | FK | REFERENCES `Police_Officers(id)` | Lead Investigating Officer |
| `case_status` | ENUM | NO | - | `'Filed'`, `'Under Investigation'`, `'Warrant Issued'`, `'In Court'`, `'Closed'`, `'Cold'` | 5-stage legal lifecycle + Cold |
| `priority` | ENUM | NO | - | `'Critical'`, `'High'`, `'Medium'`, `'Low'` | Operational severity level |
| `open_date` | DATE | NO | - | DEFAULT (CURRENT_DATE) | Case initiation date |
| `close_date` | DATE | YES | - | - | Adjudication or formal closure date |
| `is_deleted` | BOOLEAN | NO | - | DEFAULT FALSE | Soft-delete flag |
| `created_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |
| `updated_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Audit update |

---

### Table 5: `Criminals`
*Biometric and profiling dossiers for suspects, accused, and convicts.*

| Column | Data Type | Nullable | Key | Constraints / Defaults | Description |
|---|---|---|---|---|---|
| `id` | INT UNSIGNED | NO | PK | AUTO_INCREMENT | Criminal surrogate identifier |
| `first_name` | VARCHAR(50) | NO | - | - | Given name |
| `last_name` | VARCHAR(50) | NO | - | - | Surname |
| `alias` | VARCHAR(50) | YES | - | - | Street moniker (e.g., "Chhota Raju") |
| `dob` | DATE | YES | - | - | Date of birth |
| `gender` | ENUM | NO | - | `'Male'`, `'Female'`, `'Other'` | Gender classification |
| `physical_description`| TEXT | YES | - | FULLTEXT `ft_criminal_search` | Scars, tattoos, marks, height |
| `mugshot_path` | VARCHAR(255) | YES | - | - | Relative path to stored mugshot image |
| `is_deleted` | BOOLEAN | NO | - | DEFAULT FALSE | Soft-delete flag |
| `created_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP | Profile creation timestamp |
| `updated_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Profile update |

---

### Table 6: `Case_Criminal_Junction`
*Resolves M:N relationship between Cases and Criminals.*

| Column | Data Type | Nullable | Key | Constraints / Defaults | Description |
|---|---|---|---|---|---|
| `case_id` | INT UNSIGNED | NO | PK, FK | REFERENCES `Cases(id)` ON DELETE CASCADE | Associated case |
| `criminal_id` | INT UNSIGNED | NO | PK, FK | REFERENCES `Criminals(id)` ON DELETE RESTRICT | Associated criminal |
| `involvement_type` | ENUM | NO | - | `'Suspect'`, `'Accused'`, `'Convicted'` | Legal standing in case |
| `created_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP | Linking timestamp |

---

### Table 7: `Evidences`
*Malkhana physical and digital evidence property records.*

| Column | Data Type | Nullable | Key | Constraints / Defaults | Description |
|---|---|---|---|---|---|
| `id` | INT UNSIGNED | NO | PK | AUTO_INCREMENT | Evidence surrogate identifier |
| `evidence_number` | VARCHAR(50) | NO | UK | UNIQUE | Sequential identifier (e.g., `EVD-2026-001`) |
| `case_id` | INT UNSIGNED | NO | FK | REFERENCES `Cases(id)` | Associated criminal case |
| `logged_by_officer_id`| INT UNSIGNED | NO | FK | REFERENCES `Police_Officers(id)` | Seizing / logging officer |
| `description` | TEXT | NO | - | - | Seized item description and serials |
| `evidence_type` | ENUM | NO | - | 10 types: Firearm, Weapon, Narcotics, Digital Media, Hardware, Document, Biological, Currency, Clothing, Other | Classification |
| `storage_location`| VARCHAR(100) | NO | - | - | Vault shelf / locker ID |
| `file_path` | VARCHAR(255) | YES | - | - | Path to digital copy on disk |
| `file_hash` | VARCHAR(64) | YES | - | - | SHA-256 64-hexadecimal digest |
| `file_size_bytes` | BIGINT | YES | - | - | Byte size of stored file |
| `mime_type` | VARCHAR(50) | YES | - | - | MIME format |
| `is_deleted` | BOOLEAN | NO | - | DEFAULT FALSE | Soft-delete flag (guarded by trigger) |
| `created_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP | Intake timestamp |
| `updated_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Modification timestamp |

---

### Table 8: `Evidence_Chain_Of_Custody`
*Immutable ledger tracking physical evidence movement between officers.*

| Column | Data Type | Nullable | Key | Constraints / Defaults | Description |
|---|---|---|---|---|---|
| `id` | INT UNSIGNED | NO | PK | AUTO_INCREMENT | Custody transaction ID |
| `evidence_id` | INT UNSIGNED | NO | FK | REFERENCES `Evidences(id)` | Target evidence item |
| `transferred_from_officer_id`| INT UNSIGNED | YES | FK | REFERENCES `Police_Officers(id)` | Relinquishing officer (NULL on genesis) |
| `transferred_to_officer_id` | INT UNSIGNED | NO | FK | REFERENCES `Police_Officers(id)` | Receiving officer / custodian |
| `transfer_timestamp` | DATETIME | NO | - | DEFAULT CURRENT_TIMESTAMP | Exact transfer time |
| `reason` | VARCHAR(255) | NO | - | - | Purpose (FSL analysis, court exhibit) |
| `created_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP | Immutability audit timestamp |

---

### Table 9: `Court_Dates`
*Sessions Court trial hearing schedules and judicial decisions.*

| Column | Data Type | Nullable | Key | Constraints / Defaults | Description |
|---|---|---|---|---|---|
| `id` | INT UNSIGNED | NO | PK | AUTO_INCREMENT | Hearing surrogate identifier |
| `case_id` | INT UNSIGNED | NO | FK | REFERENCES `Cases(id)` | Associated criminal case |
| `criminal_id` | INT UNSIGNED | YES | FK | REFERENCES `Criminals(id)` | Accused appearing in court |
| `hearing_date` | DATE | NO | - | - | Scheduled court date |
| `court_name` | VARCHAR(100) | NO | - | - | Designated court and room number |
| `judge_name` | VARCHAR(100) | NO | - | - | Presiding Sessions Judge |
| `decision` | ENUM | NO | - | `'Pending'`, `'Guilty'`, `'Not Guilty'`, `'Bail'` | Judicial ruling |
| `notes` | TEXT | YES | - | - | Courtroom proceedings and orders |
| `created_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP | Scheduling timestamp |
| `updated_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Decision update |

---

### Table 10: `Warrants`
*Judicial arrest and search warrants issued by Magistrates.*

| Column | Data Type | Nullable | Key | Constraints / Defaults | Description |
|---|---|---|---|---|---|
| `id` | INT UNSIGNED | NO | PK | AUTO_INCREMENT | Warrant surrogate identifier |
| `warrant_number` | VARCHAR(50) | NO | UK | UNIQUE | Identifier (e.g., `WAR-2026-001`) |
| `case_id` | INT UNSIGNED | NO | FK | REFERENCES `Cases(id)` | Originating case |
| `suspect_id` | INT UNSIGNED | NO | FK | REFERENCES `Criminals(id)` | Target suspect / person |
| `issuing_judge` | VARCHAR(100) | NO | - | - | Magistrate name |
| `warrant_type` | ENUM | NO | - | `'Arrest'`, `'Search'` | Classification |
| `status` | ENUM | NO | - | `'Issued'`, `'Executed'`, `'Cancelled'` | Lifecycle state |
| `issue_date` | DATE | NO | - | - | Date signed by magistrate |
| `expiry_date` | DATE | YES | - | - | Date of warrant expiration |
| `execution_date` | DATE | YES | - | - | Date warrant was executed |
| `created_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |
| `updated_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Execution update |

---

### Table 11: `Victims_And_Witnesses`
*Witness panchnamas and victim statements with Level-1 identity security.*

| Column | Data Type | Nullable | Key | Constraints / Defaults | Description |
|---|---|---|---|---|---|
| `id` | INT UNSIGNED | NO | PK | AUTO_INCREMENT | Deposition primary key |
| `case_id` | INT UNSIGNED | NO | FK | REFERENCES `Cases(id)` | Associated case |
| `person_type` | ENUM | NO | - | `'Victim'`, `'Witness'`, `'Reporter'` | Relationship to offense |
| `name` | VARCHAR(100) | NO | - | - | Legal name of informant |
| `contact_info` | VARCHAR(255) | YES | - | - | Phone & residence (Redacted for regular officers) |
| `statement` | TEXT | NO | - | - | Sworn deposition (Redacted if `is_protected = TRUE`) |
| `is_protected` | BOOLEAN | NO | - | DEFAULT FALSE | Activates witness protection protocol |
| `created_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP | Deposition timestamp |
| `updated_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Modification timestamp |

---

### Table 12: `Arrests_And_Custody`
*Suspect apprehension bookings, holding cell allocation, and bail bonds.*

| Column | Data Type | Nullable | Key | Constraints / Defaults | Description |
|---|---|---|---|---|---|
| `id` | INT UNSIGNED | NO | PK | AUTO_INCREMENT | Arrest record identifier |
| `arrest_number` | VARCHAR(50) | NO | UK | UNIQUE | Official arrest code (e.g., `ARR-2026-001`) |
| `case_id` | INT UNSIGNED | NO | FK | REFERENCES `Cases(id)` | Associated case |
| `suspect_id` | INT UNSIGNED | NO | FK | REFERENCES `Criminals(id)` | Detained suspect |
| `arresting_officer_id`| INT UNSIGNED | NO | FK | REFERENCES `Police_Officers(id)` | Apprehending officer |
| `station_id` | INT UNSIGNED | NO | FK | REFERENCES `Police_Stations(id)` | Holding police station lockup |
| `booking_timestamp` | DATETIME | NO | - | DEFAULT CURRENT_TIMESTAMP | Precise custody booking time |
| `holding_cell_number`| VARCHAR(20) | YES | - | - | Lockup cell ID (e.g., `Lockup Cell 2`) |
| `bail_status` | ENUM | NO | - | `'Granted'`, `'Denied'`, `'Pending'`, `'Released on Bail'` | Judicial bail status |
| `bail_amount` | DECIMAL(10, 2) | YES | - | - | Surety bond in INR (₹) |
| `release_timestamp` | DATETIME | YES | - | - | Timestamp suspect left lockup |
| `created_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP | Entry timestamp |
| `updated_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Bail update |

---

### Table 13: `Alerts`
*Precinct priority BOLO broadcasts and automated 90-day cold case alerts.*

| Column | Data Type | Nullable | Key | Constraints / Defaults | Description |
|---|---|---|---|---|---|
| `id` | INT UNSIGNED | NO | PK | AUTO_INCREMENT | Alert surrogate identifier |
| `case_id` | INT UNSIGNED | YES | FK | REFERENCES `Cases(id)` ON DELETE SET NULL | Associated case (if applicable) |
| `alert_message` | TEXT | NO | - | - | Urgency broadcast text |
| `severity` | ENUM | NO | - | `'Low'`, `'Medium'`, `'High'`, `'Critical'` | Broadcast urgency level |
| `is_read` | BOOLEAN | NO | - | DEFAULT FALSE | Legacy indicator |
| `created_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP | Broadcast timestamp |

---

### Table 14: `Alert_Reads`
*Resolves personalized alert read receipts across police officers.*

| Column | Data Type | Nullable | Key | Constraints / Defaults | Description |
|---|---|---|---|---|---|
| `alert_id` | INT UNSIGNED | NO | PK, FK | REFERENCES `Alerts(id)` ON DELETE CASCADE | Target alert |
| `officer_id` | INT UNSIGNED | NO | PK, FK | REFERENCES `Police_Officers(id)` ON DELETE CASCADE | Officer who viewed alert |
| `read_at` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP | Time alert was acknowledged |

---

### Table 15: `Audit_Logs`
*Immutable, append-only security audit trail tracking officer interactions.*

| Column | Data Type | Nullable | Key | Constraints / Defaults | Description |
|---|---|---|---|---|---|
| `id` | INT UNSIGNED | NO | PK | AUTO_INCREMENT | Audit log primary key |
| `officer_id` | INT UNSIGNED | YES | FK | REFERENCES `Police_Officers(id)` ON DELETE SET NULL | Officer who performed action |
| `action` | VARCHAR(100) | NO | - | - | Action code (`BOLO_ALERT_ISSUED`, `EVIDENCE_CATALOGED`) |
| `target_table` | VARCHAR(50) | NO | - | - | Database entity affected |
| `record_id` | INT UNSIGNED | YES | - | - | Primary key ID of affected record |
| `details` | JSON | YES | - | - | JSON serialized delta / metadata payload |
| `timestamp` | TIMESTAMP | NO | - | DEFAULT CURRENT_TIMESTAMP | System timestamp of event |
