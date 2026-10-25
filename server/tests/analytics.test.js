import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { ALERT_SEVERITIES } from '../src/services/alertService.js';
import { env } from '../src/config/env.js';

test('ANALYTICS & BOLO ALERTS SUITE: KPIs, Trends, BOLO Broadcast & Socket Rooms', async (t) => {
  await t.test('1. Alert severity enumerations are strictly defined', () => {
    assert.deepEqual(ALERT_SEVERITIES, ['Low', 'Medium', 'High', 'Critical']);
  });

  await t.test('2. BOLO Alert validation and payload construction with audit structure', () => {
    const mockOfficer = {
      id: 2,
      badge_number: 'MH-MUM-1042',
      first_name: 'Vikram',
      last_name: 'Shinde',
      role: 'Head-Officer',
      station_id: 1,
    };

    function validateAndBuildBOLO(payload, officer) {
      if (!payload.message || !payload.message.trim()) {
        throw new Error('Alert message is required.');
      }
      const severity = payload.severity || 'High';
      if (!ALERT_SEVERITIES.includes(severity)) {
        throw new Error(`Invalid severity '${severity}'. Allowed: ${ALERT_SEVERITIES.join(', ')}`);
      }

      return {
        id: 999,
        case_id: payload.case_id || null,
        alert_message: payload.message.trim(),
        severity,
        created_at: new Date().toISOString(),
        issuer: {
          id: officer.id,
          name: `${officer.first_name} ${officer.last_name}`,
          badge: officer.badge_number,
        },
      };
    }

    // Valid BOLO payload
    const bolo = validateAndBuildBOLO(
      { message: 'ARMED SUSPECT AT BANDRA STATION', severity: 'Critical', case_id: 12 },
      mockOfficer
    );
    assert.equal(bolo.alert_message, 'ARMED SUSPECT AT BANDRA STATION');
    assert.equal(bolo.severity, 'Critical');
    assert.equal(bolo.case_id, 12);
    assert.equal(bolo.issuer.badge, 'MH-MUM-1042');
    assert.ok(bolo.created_at);

    // Missing message throws error
    assert.throws(() => validateAndBuildBOLO({ message: '   ' }, mockOfficer), /Alert message is required/);

    // Invalid severity throws error
    assert.throws(() => validateAndBuildBOLO({ message: 'Valid', severity: 'SuperUrgent' }, mockOfficer), /Invalid severity/);
  });

  await t.test('3. Automated 90-day cold case detection rule', () => {
    function evaluate90DayCaseAlert(c, daysActive) {
      const isEligible = daysActive > 90 && !['Closed', 'Cold'].includes(c.case_status) && !c.is_deleted;
      if (!isEligible) return null;
      return {
        case_id: c.id,
        severity: 'High',
        alert_message: `Automatic Notice: Case ${c.case_number} has been pending for ${daysActive} days without closure. Review required.`,
      };
    }

    const oldOpenCase = { id: 5, case_number: 'CASE-2025-010', case_status: 'Investigating', is_deleted: false };
    const alert1 = evaluate90DayCaseAlert(oldOpenCase, 95);
    assert.ok(alert1);
    assert.equal(alert1.severity, 'High');
    assert.match(alert1.alert_message, /pending for 95 days/);

    const oldClosedCase = { id: 6, case_number: 'CASE-2025-001', case_status: 'Closed', is_deleted: false };
    assert.equal(evaluate90DayCaseAlert(oldClosedCase, 150), null);

    const recentCase = { id: 7, case_number: 'CASE-2026-050', case_status: 'New', is_deleted: false };
    assert.equal(evaluate90DayCaseAlert(recentCase, 30), null);
  });

  await t.test('4. Officer case-closure rate calculation handles zero-case edge cases safely', () => {
    function computeClosureRate(totalCases, closedCases) {
      if (!totalCases || totalCases === 0) return 0.0;
      return Math.round((closedCases * 100.0) / totalCases * 10) / 10;
    }

    assert.equal(computeClosureRate(0, 0), 0.0);
    assert.equal(computeClosureRate(10, 8), 80.0);
    assert.equal(computeClosureRate(3, 1), 33.3);
    assert.equal(computeClosureRate(5, 5), 100.0);
  });

  await t.test('5. Socket.io JWT handshake and multi-room subscription logic', () => {
    const testOfficer = {
      id: 3,
      badge_number: 'MH-PUN-2031',
      role: 'Officer',
      station_id: 2,
    };

    const token = jwt.sign(testOfficer, env.JWT.SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, env.JWT.SECRET);

    assert.equal(decoded.badge_number, 'MH-PUN-2031');
    assert.equal(decoded.role, 'Officer');

    // Room resolution logic
    const joinedRooms = [];
    joinedRooms.push('broadcast');
    if (decoded.station_id) joinedRooms.push(`station_${decoded.station_id}`);
    if (decoded.role) joinedRooms.push(`role_${decoded.role}`);
    if (decoded.id) joinedRooms.push(`officer_${decoded.id}`);

    assert.deepEqual(joinedRooms, [
      'broadcast',
      'station_2',
      'role_Officer',
      'officer_3',
    ]);
  });
});
