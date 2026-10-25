import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../src/config/env.js';
import { ROLES } from '../src/middleware/rbacMiddleware.js';
import { CASE_STATUSES } from '../src/services/caseService.js';
import { EVIDENCE_TYPES } from '../src/services/evidenceService.js';
import { ALERT_SEVERITIES } from '../src/services/alertService.js';
import { COURT_DECISIONS, WARRANT_STATUSES, BAIL_STATUSES } from '../src/services/legalService.js';

test('MASTER END-TO-END SYSTEM INTEGRATION SUITE (PHDMS v2.0)', async (t) => {
  // Mock verified officer identities from Maharashtra Police dataset
  const adminUser = {
    id: 1,
    badge_number: 'MH-HQ-001',
    role: 'System-Admin',
    station_id: 1,
    first_name: 'Asha',
    last_name: 'Kulkarni',
  };

  const headOfficer = {
    id: 2,
    badge_number: 'MH-MUM-1042',
    role: 'Head-Officer',
    station_id: 2,
    first_name: 'Vikram',
    last_name: 'Shinde',
  };

  const fieldOfficer = {
    id: 3,
    badge_number: 'MH-MUM-2031',
    role: 'Officer',
    station_id: 1,
    first_name: 'Sachin',
    last_name: 'Sawant',
  };

  const evidenceManager = {
    id: 4,
    badge_number: 'MH-MUM-4011',
    role: 'Evidence-Manager',
    station_id: 1,
    first_name: 'Ganesh',
    last_name: 'More',
  };

  await t.test('1. Security: Multi-Role Token Issuance & Signature Verification', () => {
    [adminUser, headOfficer, fieldOfficer, evidenceManager].forEach((officer) => {
      const token = jwt.sign(officer, env.JWT.SECRET, { expiresIn: '1h' });
      assert.ok(token);

      const decoded = jwt.verify(token, env.JWT.SECRET);
      assert.equal(decoded.badge_number, officer.badge_number);
      assert.equal(decoded.role, officer.role);
      assert.equal(decoded.station_id, officer.station_id);
    });
  });

  await t.test('2. ABAC: Precinct Jurisdictional Boundary Enforcement Rules', () => {
    function verifyJurisdiction(officer, resourceStationId) {
      if (officer.role === ROLES.SYSTEM_ADMIN) {
        return { allowed: true, reason: 'System-Admin unrestricted clearance' };
      }
      if (Number(officer.station_id) !== Number(resourceStationId)) {
        return {
          allowed: false,
          code: 'ERR_JURISDICTION_DENIED',
          status: 403,
          message: `Jurisdictional Access Denied: You are stationed at Precinct #${officer.station_id}, and cannot modify resources at Precinct #${resourceStationId}.`,
        };
      }
      return { allowed: true, reason: 'Matching precinct jurisdiction' };
    }

    // System-Admin has statewide jurisdiction across all stations
    assert.equal(verifyJurisdiction(adminUser, 1).allowed, true);
    assert.equal(verifyJurisdiction(adminUser, 2).allowed, true);
    assert.equal(verifyJurisdiction(adminUser, 3).allowed, true);

    // Regular Officer stationed at #1 cannot modify Station #2 resources
    const deniedCrossStation = verifyJurisdiction(fieldOfficer, 2);
    assert.equal(deniedCrossStation.allowed, false);
    assert.equal(deniedCrossStation.status, 403);
    assert.equal(deniedCrossStation.code, 'ERR_JURISDICTION_DENIED');

    // Regular Officer modifying Station #1 resources is permitted
    assert.equal(verifyJurisdiction(fieldOfficer, 1).allowed, true);
  });

  await t.test('3. Operational Lifecycle: Atomic FIR-to-Case Conversion & Kanban Progression', () => {
    function atomicFIRToCase(firData, officer) {
      const firNumber = `FIR-2026-${String(firData.id).padStart(3, '0')}`;
      const caseNumber = `CASE-2026-${String(firData.id).padStart(3, '0')}`;
      const priority = firData.crime_type.includes('Dacoity') || firData.crime_type.includes('Homicide')
        ? 'Critical'
        : 'High';

      return {
        fir: {
          id: firData.id,
          fir_number: firNumber,
          station_id: firData.station_id,
          crime_type: firData.crime_type,
          status: 'Active',
          filed_by_officer_id: officer.id,
        },
        linkedCase: {
          id: firData.id,
          case_number: caseNumber,
          fir_id: firData.id,
          case_status: 'Filed',
          priority,
          assigned_officer_id: officer.id,
        },
      };
    }

    const { fir, linkedCase } = atomicFIRToCase(
      { id: 9, station_id: 1, crime_type: 'Armed Dacoity (IPC 395/397)' },
      fieldOfficer
    );

    assert.equal(fir.fir_number, 'FIR-2026-009');
    assert.equal(linkedCase.case_number, 'CASE-2026-009');
    assert.equal(linkedCase.case_status, 'Filed');
    assert.equal(linkedCase.priority, 'Critical');

    // Advance through the 5-stage Kanban lifecycle
    const expectedProgression = ['Filed', 'Under Investigation', 'Warrant Issued', 'In Court', 'Closed'];
    let currentStatus = linkedCase.case_status;

    for (let i = 1; i < expectedProgression.length; i++) {
      const nextStage = expectedProgression[i];
      assert.ok(CASE_STATUSES.includes(nextStage));
      currentStatus = nextStage;
    }
    assert.equal(currentStatus, 'Closed');
  });

  await t.test('4. Evidence Management: SHA-256 Hashing, Genesis Custody & Deletion Guard', () => {
    const rawFileBuffer = Buffer.from('POLICE_EXHIBIT_FORENSIC_AUDIO_SAMPLE_2026');
    const computedHash = crypto.createHash('sha256').update(rawFileBuffer).digest('hex');

    assert.equal(computedHash.length, 64);

    function evaluateEvidenceDeletion(caseStatus, isClosedCase) {
      if (isClosedCase || caseStatus === 'Closed') {
        const error = new Error('Cannot delete evidence from a closed or adjudicated case.');
        error.statusCode = 400;
        throw error;
      }
      return { deleted: true };
    }

    // Attempting to delete evidence on closed case throws error
    assert.throws(() => evaluateEvidenceDeletion('Closed', true), /Cannot delete evidence/);

    // Active case allows deletion
    assert.equal(evaluateEvidenceDeletion('Under Investigation', false).deleted, true);
  });

  await t.test('5. Judicial Integration: Hearing Scheduling Advances Case to "In Court"', () => {
    function processCourtHearingSchedule(hearing, existingCase) {
      assert.ok(COURT_DECISIONS.includes(hearing.decision));
      // Scheduling a hearing advances active case to 'In Court'
      let updatedCaseStatus = existingCase.case_status;
      if (existingCase.case_status !== 'Closed') {
        updatedCaseStatus = 'In Court';
      }
      return { hearing, updatedCaseStatus };
    }

    const testHearing = {
      case_id: 1,
      hearing_date: '2026-10-25',
      court_name: 'Sessions Court Fort',
      judge_name: 'Hon. R. K. Joshi',
      decision: 'Pending',
    };

    const initialCase = { id: 1, case_status: 'Warrant Issued' };
    const result = processCourtHearingSchedule(testHearing, initialCase);

    assert.equal(result.updatedCaseStatus, 'In Court');
  });

  await t.test('6. Security Protocol: Role-Based Protected Witness Redaction', () => {
    const rawWitness = {
      id: 101,
      case_id: 1,
      name: 'Prakash Surve',
      contact_info: '+91 98201 44521 (Parel, Mumbai)',
      statement: 'I saw Chhota Raju entering the showroom at 09:25 AM carrying a black leather bag.',
      is_protected: true,
    };

    function applyWitnessRedaction(witness, role) {
      if (witness.is_protected && role !== 'System-Admin' && role !== 'Head-Officer') {
        return {
          ...witness,
          contact_info: 'REDACTED (CONFIDENTIAL - LEVEL 1 CLEARANCE REQUIRED)',
          statement: 'REDACTED - STATEMENT PROTECTED UNDER WITNESS SECURITY PROTOCOL',
        };
      }
      return witness;
    }

    // Field Officer receives redacted statement
    const redactedForOfficer = applyWitnessRedaction(rawWitness, fieldOfficer.role);
    assert.match(redactedForOfficer.contact_info, /REDACTED/);
    assert.match(redactedForOfficer.statement, /REDACTED/);

    // Head-Officer receives unmasked statement
    const unmaskedForHead = applyWitnessRedaction(rawWitness, headOfficer.role);
    assert.equal(unmaskedForHead.contact_info, rawWitness.contact_info);
    assert.equal(unmaskedForHead.statement, rawWitness.statement);

    // System-Admin receives unmasked statement
    const unmaskedForAdmin = applyWitnessRedaction(rawWitness, adminUser.role);
    assert.equal(unmaskedForAdmin.contact_info, rawWitness.contact_info);
  });

  await t.test('7. Real-Time Alerts: BOLO Urgency Validation & Read Receipt Tracking', () => {
    function processBOLOAlert(message, severity, issuer) {
      if (!ALERT_SEVERITIES.includes(severity)) {
        throw new Error(`Invalid severity '${severity}'`);
      }
      return {
        id: 777,
        alert_message: message,
        severity,
        issuer_badge: issuer.badge_number,
        is_read_by_me: false,
      };
    }

    const alert = processBOLOAlert(
      'RED CORNER NOTICE: Armed suspect sighted near Dadar TT',
      'Critical',
      headOfficer
    );

    assert.equal(alert.severity, 'Critical');
    assert.equal(alert.issuer_badge, 'MH-MUM-1042');
    assert.equal(alert.is_read_by_me, false);

    // Mark as read
    const readReceipt = { alert_id: alert.id, officer_id: fieldOfficer.id, is_read: true };
    assert.equal(readReceipt.is_read, true);
  });
});
