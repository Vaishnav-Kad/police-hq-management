import { query } from '../config/db.js';

/**
 * Service: Top-level KPI summary counters
 */
export async function getDashboardSummary(stationId = null) {
  let stationFilter = '';
  const params = [];
  if (stationId) {
    stationFilter = ' AND f.station_id = ?';
    params.push(stationId);
  }

  // Active cases count
  const [activeCasesRow] = await query(
    `SELECT COUNT(*) AS total 
     FROM Cases c 
     JOIN FIR f ON c.fir_id = f.id 
     WHERE c.is_deleted = FALSE AND c.case_status NOT IN ('Closed') ${stationFilter}`,
    params
  );

  // Pending FIRs count
  const [pendingFIRsRow] = await query(
    `SELECT COUNT(*) AS total 
     FROM FIR f 
     WHERE f.is_deleted = FALSE AND f.status = 'Pending' ${stationFilter}`,
    params
  );

  // Active warrants count
  const [activeWarrantsRow] = await query(
    `SELECT COUNT(*) AS total 
     FROM Warrants w 
     JOIN Cases c ON w.case_id = c.id 
     JOIN FIR f ON c.fir_id = f.id 
     WHERE w.status = 'Issued' AND c.is_deleted = FALSE ${stationFilter}`,
    params
  );

  // Total cataloged evidence
  const [totalEvidenceRow] = await query(
    `SELECT COUNT(*) AS total 
     FROM Evidences e 
     JOIN Cases c ON e.case_id = c.id 
     JOIN FIR f ON c.fir_id = f.id 
     WHERE e.is_deleted = FALSE AND c.is_deleted = FALSE ${stationFilter}`,
    params
  );

  // Detained suspects in custody
  const [detainedSuspectsRow] = await query(
    `SELECT COUNT(*) AS total 
     FROM Arrests_And_Custody a 
     JOIN Cases c ON a.case_id = c.id 
     JOIN FIR f ON c.fir_id = f.id 
     WHERE a.bail_status IN ('Denied', 'Pending') AND c.is_deleted = FALSE ${stationFilter}`,
    params
  );

  return {
    activeCases: Number(activeCasesRow?.total || 0),
    pendingFIRs: Number(pendingFIRsRow?.total || 0),
    activeWarrants: Number(activeWarrantsRow?.total || 0),
    totalEvidence: Number(totalEvidenceRow?.total || 0),
    detainedSuspects: Number(detainedSuspectsRow?.total || 0),
  };
}

/**
 * Service: Crime category distribution
 */
export async function getCrimeTypeDistribution(stationId = null) {
  let denominatorFilter = 'WHERE is_deleted = FALSE';
  let stationFilter = '';
  const queryParams = [];

  if (stationId) {
    denominatorFilter += ' AND station_id = ?';
    stationFilter = ' AND f.station_id = ?';
    queryParams.push(stationId, stationId);
  }

  const sql = `
    SELECT 
      f.crime_type,
      COUNT(f.id) AS total_incidents,
      ROUND(COUNT(f.id) * 100.0 / NULLIF((SELECT COUNT(*) FROM FIR ${denominatorFilter}), 0), 1) AS percentage
    FROM FIR f
    WHERE f.is_deleted = FALSE ${stationFilter}
    GROUP BY f.crime_type 
    ORDER BY total_incidents DESC;
  `;

  return await query(sql, queryParams);
}

/**
 * Service: 12-month calendar trends (ensures all 12 consecutive monthly slots)
 */
export async function getMonthlyCrimeTrends(stationId = null) {
  let sql = `
    SELECT 
      DATE_FORMAT(f.date_filed, '%Y-%m') AS month,
      COUNT(f.id) AS incident_count,
      COUNT(CASE WHEN c.case_status = 'Closed' THEN 1 END) AS closed_count
    FROM FIR f
    LEFT JOIN Cases c ON f.id = c.fir_id AND c.is_deleted = FALSE
    WHERE f.is_deleted = FALSE 
      AND f.date_filed >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
  `;
  const params = [];
  if (stationId) {
    sql += ` AND f.station_id = ?`;
    params.push(stationId);
  }
  sql += ` GROUP BY DATE_FORMAT(f.date_filed, '%Y-%m') ORDER BY month ASC;`;

  const rows = await query(sql, params);

  // Guarantee complete 12-month continuum up to current month
  const monthMap = new Map();
  rows.forEach((r) => {
    monthMap.set(r.month, {
      month: r.month,
      incident_count: Number(r.incident_count) || 0,
      closed_count: Number(r.closed_count) || 0,
    });
  });

  const now = new Date();
  const full12Months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    full12Months.push(
      monthMap.get(mStr) || {
        month: mStr,
        incident_count: 0,
        closed_count: 0,
      }
    );
  }

  return full12Months;
}

/**
 * Service: Officer case-closure performance metrics
 */
export async function getOfficerPerformance(stationId = null) {
  let sql = `
    SELECT 
      o.id AS officer_id,
      CONCAT(o.first_name, ' ', o.last_name) AS officer_name,
      o.badge_number,
      o.rank_title,
      s.name AS station_name,
      COUNT(c.id) AS total_assigned_cases,
      COUNT(CASE WHEN c.case_status = 'Closed' THEN 1 END) AS closed_cases,
      COUNT(CASE WHEN c.case_status NOT IN ('Closed', 'Cold') THEN 1 END) AS active_cases,
      CASE 
        WHEN COUNT(c.id) > 0 THEN ROUND((COUNT(CASE WHEN c.case_status = 'Closed' THEN 1 END) * 100.0 / COUNT(c.id)), 1)
        ELSE 0.0 
      END AS closure_rate_percent
    FROM Police_Officers o
    JOIN Police_Stations s ON o.station_id = s.id
    LEFT JOIN Cases c ON o.id = c.assigned_officer_id AND c.is_deleted = FALSE
    WHERE o.is_deleted = FALSE AND o.role IN ('Officer', 'Head-Officer')
  `;
  const params = [];
  if (stationId) {
    sql += ` AND o.station_id = ?`;
    params.push(stationId);
  }
  sql += ` GROUP BY o.id ORDER BY closure_rate_percent DESC, closed_cases DESC, total_assigned_cases DESC;`;

  return await query(sql, params);
}

/**
 * Service: Incident counts grouped by precinct station
 */
export async function getAreaCrimeRates() {
  const sql = `
    SELECT 
      s.id AS station_id,
      s.name AS station_name,
      s.location,
      COUNT(DISTINCT f.id) AS total_firs,
      COUNT(DISTINCT c.id) AS total_cases,
      COUNT(DISTINCT CASE WHEN c.case_status NOT IN ('Closed', 'Cold') THEN c.id END) AS active_cases,
      COUNT(DISTINCT o.id) AS deployed_officers
    FROM Police_Stations s
    LEFT JOIN FIR f ON s.id = f.station_id AND f.is_deleted = FALSE
    LEFT JOIN Cases c ON f.id = c.fir_id AND c.is_deleted = FALSE
    LEFT JOIN Police_Officers o ON s.id = o.station_id AND o.is_deleted = FALSE
    WHERE s.is_deleted = FALSE
    GROUP BY s.id
    ORDER BY total_firs DESC;
  `;
  return await query(sql);
}
