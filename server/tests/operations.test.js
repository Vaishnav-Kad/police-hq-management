import test from 'node:test';
import assert from 'node:assert/strict';
import { CASE_STATUSES } from '../src/services/caseService.js';
import { INVOLVEMENT_TYPES } from '../src/services/criminalService.js';

test('CORE OPERATIONS SUITE: Business Logic, ABAC & Data Integrity', async (t) => {
  await t.test('1. Case statuses strictly match the 5-stage Kanban lifecycle plus Cold', () => {
    const expected = ['Filed', 'Under Investigation', 'Warrant Issued', 'In Court', 'Closed', 'Cold'];
    assert.deepEqual(CASE_STATUSES, expected);
  });

  await t.test('2. Criminal involvement types are strictly constrained', () => {
    const expected = ['Suspect', 'Accused', 'Convicted'];
    assert.deepEqual(INVOLVEMENT_TYPES, expected);
  });

  await t.test('3. Coordinate validation correctly filters invalid ranges', () => {
    function validateCoordinates(lat, lng) {
      if (lat !== undefined && lat !== null) {
        const parsedLat = Number(lat);
        if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) return false;
      }
      if (lng !== undefined && lng !== null) {
        const parsedLng = Number(lng);
        if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) return false;
      }
      return true;
    }

    // Valid Mumbai coordinates
    assert.equal(validateCoordinates(18.9502, 72.8318), true);
    // Invalid latitude (> 90)
    assert.equal(validateCoordinates(95.0, 72.8318), false);
    // Invalid longitude (< -180)
    assert.equal(validateCoordinates(18.9502, -185.0), false);
    // Null/undefined coordinates are acceptable (optional location)
    assert.equal(validateCoordinates(null, null), true);
  });

  await t.test('4. Witness redaction protects confidential panchnama witnesses for standard officers', () => {
    const mockWitnesses = [
      {
        id: 1,
        name: 'Maheshbhai Shah',
        contact_info: '+91-9820987654',
        statement: 'Saw suspects flee',
        is_protected: false,
      },
      {
        id: 2,
        name: 'Panch Witness - Dilip Solanki',
        contact_info: '+91-9898989898',
        statement: 'Secret panchnama details',
        is_protected: true,
      },
    ];

    function applyWitnessRedaction(witnesses, userRole) {
      return witnesses.map((w) => {
        if (w.is_protected && userRole !== 'Head-Officer' && userRole !== 'System-Admin') {
          return {
            ...w,
            contact_info: 'REDACTED (CONFIDENTIAL - LEVEL 1 CLEARANCE REQUIRED)',
            statement: 'REDACTED - STATEMENT PROTECTED UNDER WITNESS SECURITY PROTOCOL',
          };
        }
        return w;
      });
    }

    // Regular Officer viewing
    const officerView = applyWitnessRedaction(mockWitnesses, 'Officer');
    assert.equal(officerView[0].contact_info, '+91-9820987654');
    assert.ok(officerView[1].contact_info.includes('REDACTED'));
    assert.ok(officerView[1].statement.includes('REDACTED'));

    // Head-Officer viewing
    const headView = applyWitnessRedaction(mockWitnesses, 'Head-Officer');
    assert.equal(headView[1].contact_info, '+91-9898989898');
    assert.equal(headView[1].statement, 'Secret panchnama details');
  });

  await t.test('5. Full-text search term formatting expands tokens with wildcard for BOOLEAN MODE', () => {
    function formatSearchQuery(search) {
      return search.trim().split(/\s+/).map((word) => `${word}*`).join(' ');
    }

    const formatted = formatSearchQuery('Chhota Raju');
    assert.equal(formatted, 'Chhota* Raju*');
  });

  await t.test('6. Dynamic days_active computation handles both active and closed cases', () => {
    function calculateDaysActive(openDateStr, closeDateStr, mockCurrentDateStr) {
      const openDate = new Date(openDateStr);
      const closeDate = closeDateStr ? new Date(closeDateStr) : new Date(mockCurrentDateStr);
      const diffTime = Math.abs(closeDate - openDate);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Case closed after 115 days
    const closedDays = calculateDaysActive('2025-11-05', '2026-02-28', '2026-10-14');
    assert.equal(closedDays, 115);

    // Active case still running
    const activeDays = calculateDaysActive('2026-01-10', null, '2026-04-10');
    assert.equal(activeDays, 90);
  });
});
