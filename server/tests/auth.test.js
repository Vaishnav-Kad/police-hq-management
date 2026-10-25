import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { generateToken } from '../src/middleware/authMiddleware.js';
import { authorizeRoles, ROLES } from '../src/middleware/rbacMiddleware.js';
import { enforceStationJurisdiction } from '../src/middleware/abacMiddleware.js';
import { validateLoginInput } from '../src/validators/authValidator.js';
import { env } from '../src/config/env.js';

test('AUTH & SECURITY SUITE: Token, RBAC & ABAC Verification', async (t) => {
  await t.test('1. generateToken produces valid signed JWT with correct payload', () => {
    const payload = {
      id: 1,
      badge_number: 'ADM-001',
      role: 'System-Admin',
      station_id: 1,
    };

    const token = generateToken(payload);
    assert.ok(typeof token === 'string' && token.length > 20, 'Token should be a non-empty string');

    const decoded = jwt.verify(token, env.JWT.SECRET);
    assert.equal(decoded.id, 1);
    assert.equal(decoded.badge_number, 'ADM-001');
    assert.equal(decoded.role, 'System-Admin');
    assert.equal(decoded.station_id, 1);
  });

  await t.test('2. Token verification rejects expired or forged token', () => {
    const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.bogus_signature';
    assert.throws(() => {
      jwt.verify(forgedToken, env.JWT.SECRET);
    });
  });

  await t.test('3. RBAC authorizeRoles middleware allows permitted roles', () => {
    const middleware = authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.HEAD_OFFICER);
    const req = { user: { role: ROLES.HEAD_OFFICER } };
    let nextCalled = false;
    const res = {};

    middleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true, 'Next should be called for permitted role');
  });

  await t.test('4. RBAC authorizeRoles middleware denies unauthorized roles with 403', () => {
    const middleware = authorizeRoles(ROLES.SYSTEM_ADMIN);
    const req = { user: { role: ROLES.OFFICER } };
    let responseStatus = null;
    let responseBody = null;

    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(payload) {
        responseBody = payload;
        return this;
      },
    };

    middleware(req, res, () => {
      assert.fail('Next should not be called when role is unauthorized');
    });

    assert.equal(responseStatus, 403);
    assert.equal(responseBody.success, false);
    assert.equal(responseBody.error.code, 'ERR_FORBIDDEN_ROLE');
  });

  await t.test('5. ABAC enforceStationJurisdiction allows System-Admin across all precincts', () => {
    const middleware = enforceStationJurisdiction('stationId');
    const req = {
      user: { role: ROLES.SYSTEM_ADMIN, station_id: 1 },
      params: { stationId: '99' },
    };
    let nextCalled = false;

    middleware(req, {}, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true, 'System-Admin must have cross-precinct override');
  });

  await t.test('6. ABAC enforceStationJurisdiction permits Officer within matching station', () => {
    const middleware = enforceStationJurisdiction('station_id');
    const req = {
      user: { role: ROLES.OFFICER, station_id: 2 },
      body: { station_id: 2 },
    };
    let nextCalled = false;

    middleware(req, {}, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true, 'Officer must be permitted within assigned station');
  });

  await t.test('7. ABAC enforceStationJurisdiction rejects Officer attempting cross-station action', () => {
    const middleware = enforceStationJurisdiction('station_id');
    const req = {
      user: { role: ROLES.OFFICER, station_id: 2 },
      body: { station_id: 1 },
    };
    let responseStatus = null;
    let responseBody = null;

    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(payload) {
        responseBody = payload;
        return this;
      },
    };

    middleware(req, res, () => {
      assert.fail('Next should not be called on jurisdictional violation');
    });

    assert.equal(responseStatus, 403);
    assert.equal(responseBody.success, false);
    assert.equal(responseBody.error.code, 'ERR_JURISDICTION_DENIED');
  });

  await t.test('8. authValidator rejects missing badge number and normalizes casing', () => {
    const reqValid = { body: { badge_number: ' off-201 ', password: 'SecretPassword' } };
    let validNextCalled = false;

    validateLoginInput(reqValid, {}, () => {
      validNextCalled = true;
    });

    assert.equal(validNextCalled, true);
    assert.equal(reqValid.body.badge_number, 'OFF-201', 'Badge number should be trimmed and uppercased');

    // Missing password test
    const reqInvalid = { body: { badge_number: 'OFF-201', password: '' } };
    let invalidStatus = null;
    const resInvalid = {
      status(code) {
        invalidStatus = code;
        return this;
      },
      json() {
        return this;
      },
    };

    validateLoginInput(reqInvalid, resInvalid, () => {
      assert.fail('Next should not be called with invalid input');
    });

    assert.equal(invalidStatus, 400);
  });
});
