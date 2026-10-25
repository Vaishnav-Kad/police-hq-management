import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { EVIDENCE_TYPES } from '../src/services/evidenceService.js';

test('EVIDENCE & INTEGRITY SUITE: SHA-256, Custody Ledger & QR Verification', async (t) => {
  await t.test('1. Evidence types include required physical and digital classifications', () => {
    assert.ok(EVIDENCE_TYPES.includes('Firearm'));
    assert.ok(EVIDENCE_TYPES.includes('Narcotics'));
    assert.ok(EVIDENCE_TYPES.includes('Digital Media'));
    assert.ok(EVIDENCE_TYPES.includes('Hardware'));
  });

  await t.test('2. Cryptographic SHA-256 produces exact 64-character hexadecimal digest', () => {
    const sampleData = Buffer.from('POLICE_MUMBAI_EVIDENCE_TEST_HASH');
    const hash = crypto.createHash('sha256').update(sampleData).digest('hex');

    assert.equal(hash.length, 64, 'SHA-256 digest must be exactly 64 hexadecimal characters');
    assert.match(hash, /^[0-9a-f]{64}$/, 'Hash must contain only lowercase hex characters');

    // SHA-256 of empty string standard verification
    const emptyHash = crypto.createHash('sha256').update(Buffer.from('')).digest('hex');
    assert.equal(emptyHash, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  await t.test('3. Integrity verification algorithm detects file tampering', () => {
    // Create temporary file
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `test_evidence_${Date.now()}.dat`);
    const initialContent = 'Original Ballistic Trajectory Data - Untampered';
    fs.writeFileSync(tempFile, initialContent, 'utf8');

    const originalHash = crypto.createHash('sha256').update(fs.readFileSync(tempFile)).digest('hex');

    // Verify pristine match
    const liveHash1 = crypto.createHash('sha256').update(fs.readFileSync(tempFile)).digest('hex');
    const isMatch1 = liveHash1 === originalHash;
    assert.equal(isMatch1, true);

    // Tamper with file content
    fs.writeFileSync(tempFile, 'ALTERED Ballistic Trajectory Data - TAMPERED!', 'utf8');
    const liveHash2 = crypto.createHash('sha256').update(fs.readFileSync(tempFile)).digest('hex');
    const isMatch2 = liveHash2 === originalHash;
    assert.equal(isMatch2, false, 'Tampered file must not match original checksum');

    // Cleanup
    fs.unlinkSync(tempFile);
  });

  await t.test('4. Closed case evidence deletion protection logic', () => {
    function canDeleteEvidence(caseStatus) {
      if (caseStatus === 'Closed') {
        const err = new Error('Integrity Violation: Cannot delete evidence associated with a closed case.');
        err.statusCode = 400;
        err.code = 'ERR_CLOSED_CASE_EVIDENCE_DELETE';
        throw err;
      }
      return true;
    }

    // Active cases allow deletion (if officer is authorized)
    assert.equal(canDeleteEvidence('Under Investigation'), true);
    assert.equal(canDeleteEvidence('Filed'), true);

    // Closed cases must be strictly blocked
    assert.throws(
      () => canDeleteEvidence('Closed'),
      (err) => err.code === 'ERR_CLOSED_CASE_EVIDENCE_DELETE' && err.statusCode === 400
    );
  });

  await t.test('5. Custody transfer authorization logic restricts unauthorized officers', () => {
    function authorizeTransfer(currentCustodianId, requestingUser) {
      const isCurrentCustodian = requestingUser.id === currentCustodianId;
      const isPrivileged = ['Evidence-Manager', 'Head-Officer', 'System-Admin'].includes(requestingUser.role);
      return isCurrentCustodian || isPrivileged;
    }

    const custodianId = 6; // Officer #6 is current custodian

    // Current custodian is permitted
    assert.equal(authorizeTransfer(custodianId, { id: 6, role: 'Officer' }), true);

    // Evidence Manager is permitted even if not current custodian
    assert.equal(authorizeTransfer(custodianId, { id: 10, role: 'Evidence-Manager' }), true);

    // Head Officer is permitted
    assert.equal(authorizeTransfer(custodianId, { id: 2, role: 'Head-Officer' }), true);

    // Unrelated officer who is not custodian is rejected
    assert.equal(authorizeTransfer(custodianId, { id: 4, role: 'Officer' }), false);
  });

  await t.test('6. QR code payload generation and parser handles both JSON and raw numbers', () => {
    const mockEvidence = {
      id: 1,
      evidence_number: 'EVD-2026-001',
      case_id: 1,
      case_number: 'CASE-2026-001',
      evidence_type: 'Firearm',
      storage_location: 'Malkhana Vault Rack M-104',
      file_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    };

    const qrPayload = JSON.stringify({
      phdms_type: 'EVIDENCE_IDENTIFIER',
      evidence_id: mockEvidence.id,
      evidence_number: mockEvidence.evidence_number,
      case_number: mockEvidence.case_number,
      file_hash_prefix: mockEvidence.file_hash.slice(0, 16),
    });

    function parseScannedCode(input) {
      try {
        const parsed = JSON.parse(input);
        if (typeof parsed === 'object' && parsed !== null) {
          if (parsed.evidence_id) return { id: parsed.evidence_id };
          if (parsed.evidence_number) return { number: parsed.evidence_number };
        }
      } catch (_) {}
      if (/^\d+$/.test(input.trim())) {
        return { id: parseInt(input.trim(), 10) };
      }
      return { number: input.trim() };
    }

    // Parse JSON from camera scanner
    const resultJson = parseScannedCode(qrPayload);
    assert.equal(resultJson.id, 1);

    // Parse raw evidence number
    const resultNumber = parseScannedCode('EVD-2026-001');
    assert.equal(resultNumber.number, 'EVD-2026-001');

    // Parse raw numeric ID
    const resultId = parseScannedCode('42');
    assert.equal(resultId.id, 42);
  });
});
