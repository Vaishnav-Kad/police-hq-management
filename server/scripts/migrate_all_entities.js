import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'police_hq_db',
    port: process.env.DB_PORT || 3306,
  });

  console.log('Connected to MySQL. Running entity schema expansion...');

  // Helper to add column if it doesn't already exist
  async function addColumnIfNotExists(table, column, def) {
    const [cols] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
    if (cols.length === 0) {
      console.log(`Adding ${column} to ${table}...`);
      await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
    } else {
      console.log(`Column ${column} already exists on ${table}.`);
    }
  }

  // 1. Police_Stations
  await addColumnIfNotExists('Police_Stations', 'station_code', 'VARCHAR(50) NULL DEFAULT "MUM-PS"');
  await addColumnIfNotExists('Police_Stations', 'zone_division', 'VARCHAR(100) NULL DEFAULT "Zone 1"');
  await addColumnIfNotExists('Police_Stations', 'jurisdiction_area_sq_km', 'DECIMAL(8,2) NULL DEFAULT 12.50');
  await addColumnIfNotExists('Police_Stations', 'lockup_capacity', 'INT NULL DEFAULT 10');
  await addColumnIfNotExists('Police_Stations', 'lockup_rooms', 'VARCHAR(255) NULL DEFAULT "Lockup Cell 1 (General), Lockup Cell 2 (Remand)"');
  await addColumnIfNotExists('Police_Stations', 'evidence_vault_location', 'VARCHAR(255) NULL DEFAULT "Malkhana Vault Ground Floor Room 102"');
  await addColumnIfNotExists('Police_Stations', 'evidence_vault_capacity', 'INT NULL DEFAULT 50');

  // Populate existing stations with real data
  await connection.query(`
    UPDATE Police_Stations SET
      station_code = 'MUM-AZAD-01',
      zone_division = 'Zone 1, South Region',
      jurisdiction_area_sq_km = 14.50,
      lockup_capacity = 20,
      lockup_rooms = 'Cell 1 (General Male), Cell 2 (Remand), Cell 3 (High-Security)',
      evidence_vault_location = 'Azad Maidan Malkhana Vault Ground Floor Sector-A',
      evidence_vault_capacity = 150
    WHERE id = 1
  `);

  await connection.query(`
    UPDATE Police_Stations SET
      station_code = 'MUM-BND-09',
      zone_division = 'Zone 9, Western Region',
      jurisdiction_area_sq_km = 18.20,
      lockup_capacity = 15,
      lockup_rooms = 'Cell 1 (General Male), Female Lockup Cell 1, Cell 2 (Remand)',
      evidence_vault_location = 'Bandra Malkhana Vault Room 104',
      evidence_vault_capacity = 100
    WHERE id = 2
  `);

  await connection.query(`
    UPDATE Police_Stations SET
      station_code = 'PUN-SHIV-01',
      zone_division = 'Pune City Zone 1',
      jurisdiction_area_sq_km = 22.00,
      lockup_capacity = 18,
      lockup_rooms = 'Secure Holding Cell A, Cell B (General Male), Cell C (Remand)',
      evidence_vault_location = 'Pune Malkhana Secure Bay Room 12',
      evidence_vault_capacity = 120
    WHERE id = 3
  `);

  await connection.query(`
    UPDATE Police_Stations SET
      station_code = 'MUM-AND-10',
      zone_division = 'Zone 10, Western Region',
      jurisdiction_area_sq_km = 16.80,
      lockup_capacity = 12,
      lockup_rooms = 'Cell 1 (General), Cell 2 (Holding)',
      evidence_vault_location = 'Andheri Malkhana Vault Bay 3',
      evidence_vault_capacity = 80
    WHERE id = 4
  `);

  await connection.query(`
    UPDATE Police_Stations SET
      station_code = 'MUM-DAD-05',
      zone_division = 'Zone 5, Central Region',
      jurisdiction_area_sq_km = 11.40,
      lockup_capacity = 10,
      lockup_rooms = 'Cell 1 (General), Cell 2 (Custody)',
      evidence_vault_location = 'Dadar Malkhana Vault Room 101',
      evidence_vault_capacity = 60
    WHERE id = 5
  `);

  // 2. Police_Officers
  await addColumnIfNotExists('Police_Officers', 'blood_group', 'VARCHAR(10) NULL DEFAULT "B+"');
  await addColumnIfNotExists('Police_Officers', 'joining_date', 'DATE NULL');
  await addColumnIfNotExists('Police_Officers', 'emergency_contact', 'VARCHAR(150) NULL DEFAULT "Police Welfare Board / HQ Control Room"');
  await addColumnIfNotExists('Police_Officers', 'id_proof_number', 'VARCHAR(100) NULL');

  await connection.query(`
    UPDATE Police_Officers SET
      blood_group = 'O+',
      joining_date = '2015-06-01',
      emergency_contact = 'Control Room Desk (022-22620429)',
      id_proof_number = CONCAT('MH-POL-', id, '0981')
    WHERE id_proof_number IS NULL
  `);

  // 3. Criminals
  await addColumnIfNotExists('Criminals', 'id_proof_number', 'VARCHAR(100) NULL');
  await addColumnIfNotExists('Criminals', 'father_name', 'VARCHAR(150) NULL');
  await addColumnIfNotExists('Criminals', 'threat_level', 'VARCHAR(50) NULL DEFAULT "Medium"');
  await addColumnIfNotExists('Criminals', 'gang_affiliation', 'VARCHAR(150) NULL DEFAULT "Independent"');
  await addColumnIfNotExists('Criminals', 'prior_convictions_count', 'INT NULL DEFAULT 0');
  await addColumnIfNotExists('Criminals', 'fingerprint_id', 'VARCHAR(100) NULL');
  await addColumnIfNotExists('Criminals', 'known_territory', 'VARCHAR(255) NULL');

  await connection.query(`
    UPDATE Criminals SET
      father_name = 'Kishan Gaikwad',
      threat_level = 'High',
      gang_affiliation = 'Gaikwad Syndicate',
      prior_convictions_count = 3,
      fingerprint_id = 'FP-MH-99214',
      known_territory = 'Zaveri Bazaar, South Mumbai',
      id_proof_number = 'AADHAAR-8921-4491-0012'
    WHERE id = 1
  `);

  await connection.query(`
    UPDATE Criminals SET
      father_name = 'Rashid Qureshi',
      threat_level = 'Critical / Hardened',
      gang_affiliation = 'D-Company Syndicate',
      prior_convictions_count = 5,
      fingerprint_id = 'FP-MH-10294',
      known_territory = 'Dongri / Bhendi Bazaar',
      id_proof_number = 'AADHAAR-4491-9921-5512'
    WHERE id = 2
  `);

  // 4. Evidences
  await addColumnIfNotExists('Evidences', 'station_id', 'INT NULL');
  await addColumnIfNotExists('Evidences', 'locker_bin_number', 'VARCHAR(100) NULL');
  await addColumnIfNotExists('Evidences', 'chain_of_custody_status', 'VARCHAR(100) NULL DEFAULT "In Malkhana Vault"');
  await addColumnIfNotExists('Evidences', 'seizure_memo_number', 'VARCHAR(100) NULL');
  await addColumnIfNotExists('Evidences', 'witness_name', 'VARCHAR(255) NULL');

  // Backfill station_id in Evidences based on FIR/Case link
  await connection.query(`
    UPDATE Evidences e
    JOIN Cases c ON e.case_id = c.id
    JOIN FIR f ON c.fir_id = f.id
    SET e.station_id = f.station_id
    WHERE e.station_id IS NULL
  `);

  await connection.query(`
    UPDATE Evidences SET
      locker_bin_number = 'Rack A, Shelf 2, Bin #04',
      chain_of_custody_status = 'In Malkhana Vault',
      seizure_memo_number = CONCAT('PANCH-2026-', LPAD(id, 3, '0')),
      witness_name = 'Ramesh Patil (Independent Panch)'
    WHERE locker_bin_number IS NULL
  `);

  // 5. Warrants
  await addColumnIfNotExists('Warrants', 'court_name', 'VARCHAR(200) NULL DEFAULT "Sessions Court Fort, Mumbai"');
  await addColumnIfNotExists('Warrants', 'target_person_name', 'VARCHAR(150) NULL');
  await addColumnIfNotExists('Warrants', 'offense_sections', 'VARCHAR(255) NULL DEFAULT "IPC 302, 120-B / BNSS 103"');
  await addColumnIfNotExists('Warrants', 'station_id', 'INT NULL');
  await addColumnIfNotExists('Warrants', 'executing_officer_id', 'INT NULL');
  await addColumnIfNotExists('Warrants', 'execution_notes', 'TEXT NULL');

  // Backfill Warrants station_id and target_person_name
  await connection.query(`
    UPDATE Warrants w
    JOIN Cases c ON w.case_id = c.id
    JOIN FIR f ON c.fir_id = f.id
    JOIN Criminals cr ON w.suspect_id = cr.id
    SET 
      w.station_id = f.station_id,
      w.target_person_name = CONCAT(cr.first_name, ' ', cr.last_name)
    WHERE w.station_id IS NULL OR w.target_person_name IS NULL
  `);

  // 6. Arrests_And_Custody
  await addColumnIfNotExists('Arrests_And_Custody', 'arrestee_name', 'VARCHAR(150) NULL');
  await addColumnIfNotExists('Arrests_And_Custody', 'custody_type', 'VARCHAR(50) NULL DEFAULT "Police Custody (PCR)"');
  await addColumnIfNotExists('Arrests_And_Custody', 'magistrate_production_deadline', 'DATETIME NULL');
  await addColumnIfNotExists('Arrests_And_Custody', 'medical_exam_status', 'VARCHAR(100) NULL DEFAULT "Conducted - Fit for Lockup"');
  await addColumnIfNotExists('Arrests_And_Custody', 'medical_officer_notes', 'TEXT NULL');
  await addColumnIfNotExists('Arrests_And_Custody', 'relative_intimated', 'VARCHAR(255) NULL');
  await addColumnIfNotExists('Arrests_And_Custody', 'property_seized_inventory', 'TEXT NULL');

  // Backfill Arrests
  await connection.query(`
    UPDATE Arrests_And_Custody a
    JOIN Criminals cr ON a.suspect_id = cr.id
    SET 
      a.arrestee_name = CONCAT(cr.first_name, ' ', cr.last_name),
      a.magistrate_production_deadline = DATE_ADD(a.booking_timestamp, INTERVAL 24 HOUR),
      a.medical_exam_status = 'Conducted - Fit for Lockup',
      a.medical_officer_notes = 'G.T. Hospital Mumbai - Dr. S. Kulkarni. No external trauma noted.',
      a.relative_intimated = 'Smt. Kavita Gaikwad (Wife) - Intimated at 20:15 IST via Phone',
      a.property_seized_inventory = 'Black leather wallet, Rs. 2,450 cash, Samsung Galaxy phone, stainless steel wristwatch, leather belt.'
    WHERE a.arrestee_name IS NULL
  `);

  console.log('Migration completed successfully for all law enforcement entities!');
  await connection.end();
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
