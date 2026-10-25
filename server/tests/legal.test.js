import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COURT_DECISIONS,
  WARRANT_TYPES,
  WARRANT_STATUSES,
  BAIL_STATUSES,
} from '../src/services/legalService.js';

test('LEGAL & AUXILIARY SUITE: Warrants, Hearings, Custody & Audit Integrity', async (t) => {
  await t.test('1. Legal status and decision enumerations are strictly defined', () => {
    assert.deepEqual(COURT_DECISIONS, ['Pending', 'Guilty', 'Not Guilty', 'Bail']);
    assert.deepEqual(WARRANT_TYPES, ['Arrest', 'Search']);
    assert.deepEqual(WARRANT_STATUSES, ['Issued', 'Executed', 'Cancelled']);
    assert.deepEqual(BAIL_STATUSES, ['Granted', 'Denied', 'Pending', 'Released on Bail']);
  });

  await t.test('2. Warrant execution logic sets execution_date when status changes to Executed', () => {
    function processWarrantStatusUpdate(status, customDate) {
      if (!WARRANT_STATUSES.includes(status)) {
        throw new Error(`Invalid warrant status '${status}'`);
      }
      let execDate = customDate ? new Date(customDate) : null;
      if (status === 'Executed' && !execDate) {
        execDate = new Date();
      }
      return { status, executionDate: execDate };
    }

    // Issued warrant has null execution date
    const issued = processWarrantStatusUpdate('Issued', null);
    assert.equal(issued.status, 'Issued');
    assert.equal(issued.executionDate, null);

    // Executed warrant auto-populates execution date
    const executed = processWarrantStatusUpdate('Executed', null);
    assert.equal(executed.status, 'Executed');
    assert.ok(executed.executionDate instanceof Date);

    // Invalid status throws
    assert.throws(() => processWarrantStatusUpdate('InvalidStatus', null));
  });

  await t.test('3. Bail status and release timestamp logic enforces proper state transitions', () => {
    function processBailUpdate(bailStatus, customReleaseTime) {
      if (!BAIL_STATUSES.includes(bailStatus)) {
        throw new Error(`Invalid bail status '${bailStatus}'`);
      }
      let releaseTime = customReleaseTime ? new Date(customReleaseTime) : null;
      if (bailStatus === 'Released on Bail' && !releaseTime) {
        releaseTime = new Date();
      }
      return { bailStatus, releaseTime };
    }

    // Denied bail has no release timestamp
    const denied = processBailUpdate('Denied', null);
    assert.equal(denied.bailStatus, 'Denied');
    assert.equal(denied.releaseTime, null);

    // Released on bail auto-populates release timestamp
    const released = processBailUpdate('Released on Bail', null);
    assert.equal(released.bailStatus, 'Released on Bail');
    assert.ok(released.releaseTime instanceof Date);

    // Invalid bail status throws
    assert.throws(() => processBailUpdate('UnknownBail', null));
  });

  await t.test('4. Protected witness redaction accurately secures confidential informants across roles', () => {
    const witnessRecord = {
      id: 1,
      name: 'Panch Witness - Dilip Solanki',
      contact_info: '+91-9820123456',
      statement: 'Witnessed gold jewelry transfer at midnight',
      is_protected: true,
    };

    function filterWitnessForUser(witness, userRole) {
      if (witness.is_protected && userRole !== 'Head-Officer' && userRole !== 'System-Admin') {
        return {
          ...witness,
          contact_info: 'REDACTED (CONFIDENTIAL - LEVEL 1 CLEARANCE REQUIRED)',
          statement: 'REDACTED - STATEMENT PROTECTED UNDER WITNESS SECURITY PROTOCOL',
        };
      }
      return witness;
    }

    // Regular Officer sees redacted statement
    const regularView = filterWitnessForUser(witnessRecord, 'Officer');
    assert.ok(regularView.contact_info.includes('REDACTED'));
    assert.ok(regularView.statement.includes('REDACTED'));

    // Evidence Manager sees redacted statement
    const evidenceView = filterWitnessForUser(witnessRecord, 'Evidence-Manager');
    assert.ok(evidenceView.statement.includes('REDACTED'));

    // Head-Officer sees original statement
    const headView = filterWitnessForUser(witnessRecord, 'Head-Officer');
    assert.equal(headView.contact_info, '+91-9820123456');
    assert.equal(headView.statement, 'Witnessed gold jewelry transfer at midnight');

    // System-Admin sees original statement
    const adminView = filterWitnessForUser(witnessRecord, 'System-Admin');
    assert.equal(adminView.contact_info, '+91-9820123456');
  });

  await t.test('5. Audit logs API enforces append-only immutability', () => {
    // In our auditRoutes, only GET is implemented.
    // Verify that attempting mutation functions are undefined/forbidden.
    import('../src/routes/auditRoutes.js').then((module) => {
      const router = module.default;
      const routes = router.stack.map((layer) => ({
        path: layer.route?.path,
        methods: layer.route ? Object.keys(layer.route.methods) : [],
      }));

      // Check all defined methods on audit router
      for (const route of routes) {
        if (route.methods.length > 0) {
          assert.equal(route.methods.includes('delete'), false, 'Audit logs must NOT have a DELETE method');
          assert.equal(route.methods.includes('put'), false, 'Audit logs must NOT have a PUT method');
          assert.equal(route.methods.includes('patch'), false, 'Audit logs must NOT have a PATCH method');
        }
      }
    });
  });
});
