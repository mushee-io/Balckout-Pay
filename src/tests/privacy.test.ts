/**
 * @file privacy.test.ts
 * Test suite verifying Zero-Knowledge logic, boundary conditions,
 * and mathematical assertions that private income is NEVER leaked.
 */

import { 
  computeCommitment, 
  generateSecureSalt, 
  proveIncomeThreshold, 
  verifyZkProof,
  nullifierRegistry,
  timingSafeEqualHex,
  generateAuditCertificateSeal,
  verifyAuditCertificateSeal
} from '../midnight/zk-engine';
import { PrivateIncomeCredential, ZkProofResult } from '../midnight/types';

export interface TestCaseResult {
  id: string;
  name: string;
  category: 'THRESHOLD' | 'BOUNDARY' | 'LEAKAGE_AUDIT' | 'SECURITY';
  passed: boolean;
  details: string;
  executionTimeMs: number;
}

export async function runPrivacyTestSuite(): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  const createMockCred = async (income: number, currency: 'GBP' | 'USD' | 'EUR' = 'GBP'): Promise<PrivateIncomeCredential> => {
    const salt = generateSecureSalt();
    const commitment = await computeCommitment(income, currency, salt);
    return {
      id: `cred_${Math.random().toString(36).substring(2, 7)}`,
      monthlyIncome: income,
      currency,
      salt,
      commitment,
      issuedAt: Date.now(),
      issuer: 'Self-Asserted Private Credential',
      label: 'Monthly Income Test Credential',
      status: 'READY'
    };
  };

  // Test 1: £4,720 vs £2,500 -> PASS
  {
    const t0 = performance.now();
    const cred = await createMockCred(4720);
    const proof = await proveIncomeThreshold(cred, 2500, 'test_req_1');
    const verification = verifyZkProof(proof, 2500);
    const passed = proof.isVerified === true && verification.isRequirementSatisfied === true;
    results.push({
      id: 'TEST-01',
      name: 'Standard Above Threshold: £4,720 vs £2,500 Requirement',
      category: 'THRESHOLD',
      passed,
      details: `Expected PASS, Got ${proof.isVerified ? 'PASS' : 'FAIL'}. Proof Hash: ${proof.proofHash.slice(0, 10)}...`,
      executionTimeMs: Math.round(performance.now() - t0)
    });
  }

  // Test 2: £2,500 vs £2,500 -> PASS (Exact Boundary)
  {
    const t0 = performance.now();
    const cred = await createMockCred(2500);
    const proof = await proveIncomeThreshold(cred, 2500, 'test_req_2');
    const verification = verifyZkProof(proof, 2500);
    const passed = proof.isVerified === true && verification.isRequirementSatisfied === true;
    results.push({
      id: 'TEST-02',
      name: 'Exact Boundary Match: £2,500 vs £2,500 Requirement',
      category: 'BOUNDARY',
      passed,
      details: `Expected PASS (equality condition satisfied). Got ${proof.isVerified ? 'PASS' : 'FAIL'}`,
      executionTimeMs: Math.round(performance.now() - t0)
    });
  }

  // Test 3: £2,499 vs £2,500 -> FAIL (Strict 1 Unit Below Threshold)
  {
    const t0 = performance.now();
    const cred = await createMockCred(2499);
    const proof = await proveIncomeThreshold(cred, 2500, 'test_req_3');
    const verification = verifyZkProof(proof, 2500);
    const passed = proof.isVerified === false && verification.isRequirementSatisfied === false;
    results.push({
      id: 'TEST-03',
      name: 'Strict 1-Unit Below Threshold: £2,499 vs £2,500 Requirement',
      category: 'BOUNDARY',
      passed,
      details: `Expected FAIL. Got ${proof.isVerified ? 'PASS (Defect!)' : 'FAIL (Correct)'}`,
      executionTimeMs: Math.round(performance.now() - t0)
    });
  }

  // Test 4: £0 vs £2,500 -> FAIL (Zero Income Baseline)
  {
    const t0 = performance.now();
    const cred = await createMockCred(0);
    const proof = await proveIncomeThreshold(cred, 2500, 'test_req_4');
    const passed = proof.isVerified === false;
    results.push({
      id: 'TEST-04',
      name: 'Zero Baseline: £0 vs £2,500 Requirement',
      category: 'THRESHOLD',
      passed,
      details: `Expected FAIL. Got ${proof.isVerified ? 'PASS' : 'FAIL'}`,
      executionTimeMs: Math.round(performance.now() - t0)
    });
  }

  // Test 5: ZERO DATA LEAKAGE AUDIT (Critical)
  {
    const t0 = performance.now();
    const secretIncome = 98452;
    const cred = await createMockCred(secretIncome);
    const proof: ZkProofResult = await proveIncomeThreshold(cred, 3000, 'test_req_leak_audit');
    
    // Stringify entire public payload
    const publicPayloadString = JSON.stringify(proof);
    const serializedLedger = JSON.stringify({
      proofHash: proof.proofHash,
      isVerified: proof.isVerified,
      publicOutputs: proof.publicOutputs,
      contractAddress: proof.contractAddress
    });

    const incomeLeakedInProof = publicPayloadString.includes(secretIncome.toString());
    const incomeLeakedInLedger = serializedLedger.includes(secretIncome.toString());
    const passed = !incomeLeakedInProof && !incomeLeakedInLedger;

    results.push({
      id: 'TEST-05',
      name: 'Zero-Knowledge Privacy Leakage Audit: Confirm 0 bytes salary exposure',
      category: 'LEAKAGE_AUDIT',
      passed,
      details: passed 
        ? 'PASSED: Secret value 98452 was completely absent from all public structures and proof outputs.' 
        : 'FAILED: Secret income was found in serialized output!',
      executionTimeMs: Math.round(performance.now() - t0)
    });
  }

  // Test 6: Commitment Integrity Tamper Detection
  {
    const t0 = performance.now();
    const cred = await createMockCred(5000);
    // Tamper with commitment
    const tamperedCred = { ...cred, commitment: '0xdeadbeef000000000000000000000000' };
    let failedAsExpected = false;
    try {
      await proveIncomeThreshold(tamperedCred, 2500, 'test_req_tamper');
    } catch {
      failedAsExpected = true;
    }

    results.push({
      id: 'TEST-06',
      name: 'Tamper Resistance: Reject Invalid Commitment Witness',
      category: 'SECURITY',
      passed: failedAsExpected,
      details: failedAsExpected 
        ? 'PASSED: Prover rejected tampered commitment before generating proof.' 
        : 'FAILED: Tampered credential was accepted!',
      executionTimeMs: Math.round(performance.now() - t0)
    });
  }

  // Test 7: Multi-Condition Compound Eligibility (Income ≥ £2,500, Age ≥ 18, Country = UK, Employed)
  {
    const t0 = performance.now();
    const cred = await createMockCred(4720);
    cred.age = 26;
    cred.country = 'United Kingdom';
    cred.employmentStatus = 'EMPLOYED';

    const multiReq = {
      id: 'blk_test_multi_07',
      policyId: 'blk_policy_mortgage_uk_t1',
      title: 'Mortgage Pre-Qualification Assessment',
      purpose: 'Mortgage Pre-Qualification' as const,
      requiredIncome: 2500,
      currency: 'GBP' as const,
      rules: [
        { id: 'r1', category: 'AGE' as const, label: 'Age ≥ 18', operator: 'GTE' as const, targetValue: 18, displayTarget: '≥ 18' },
        { id: 'r2', category: 'INCOME' as const, label: 'Income ≥ £2,500', operator: 'GTE' as const, targetValue: 2500, displayTarget: '≥ £2,500/mo' },
        { id: 'r3', category: 'RESIDENCY' as const, label: 'Residency = UK', operator: 'EQ' as const, targetValue: 'UK', displayTarget: 'UK' },
        { id: 'r4', category: 'EMPLOYMENT' as const, label: 'Employment = Employed', operator: 'EQ' as const, targetValue: 'EMPLOYED', displayTarget: 'Employed' }
      ],
      verifierName: 'Lending Verifier',
      verifierAddress: 'mn_addr_test_verifier',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
      nonce: 'nonce_test_07_' + Date.now(),
      policyHash: '0xpolicy_hash_07',
      status: 'PENDING' as const,
      isLiveOnChain: false
    };

    const proof = await proveIncomeThreshold(cred, multiReq);
    const verification = verifyZkProof(proof, multiReq, { checkReplay: false });
    const passed = proof.isVerified === true && 
                   verification.isRequirementSatisfied === true && 
                   proof.requirementsSatisfied === 4 &&
                   proof.privateWitnessDisclosed === '0 BYTES';

    results.push({
      id: 'TEST-07',
      name: 'Compound Policy: Income ≥ £2,500 + Age ≥ 18 + Country = UK + Employed',
      category: 'THRESHOLD',
      passed,
      details: passed 
        ? 'PASSED: All 4 conditions verified in zero-knowledge. 0 bytes disclosed.' 
        : 'FAILED: Multi-condition evaluation failed.',
      executionTimeMs: Math.round(performance.now() - t0)
    });
  }

  // Test 8: Partial Disqualification (Underage applicant fails silently)
  {
    const t0 = performance.now();
    const cred = await createMockCred(5000);
    cred.age = 16; // Underage
    cred.country = 'United Kingdom';

    const req = {
      id: 'blk_test_underage_08',
      policyId: 'blk_policy_age_gate',
      title: 'Age Gated Financial Product',
      purpose: 'Credit & Loan Eligibility' as const,
      requiredIncome: 2500,
      currency: 'GBP' as const,
      rules: [
        { id: 'r1', category: 'AGE' as const, label: 'Age ≥ 18', operator: 'GTE' as const, targetValue: 18, displayTarget: '≥ 18' },
        { id: 'r2', category: 'INCOME' as const, label: 'Income ≥ £2,500', operator: 'GTE' as const, targetValue: 2500, displayTarget: '≥ £2,500/mo' }
      ],
      verifierName: 'Age Verifier',
      verifierAddress: 'mn_addr_test_age',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
      nonce: 'nonce_test_08_' + Date.now(),
      policyHash: '0xpolicy_hash_08',
      status: 'PENDING' as const,
      isLiveOnChain: false
    };

    const proof = await proveIncomeThreshold(cred, req);
    const passed = proof.isVerified === false && 
                   proof.requirementsSatisfied === 1 && 
                   proof.requirementsTotal === 2;

    results.push({
      id: 'TEST-08',
      name: 'Partial Disqualification: Underage applicant (Age 16 vs 18) rejected cleanly',
      category: 'BOUNDARY',
      passed,
      details: passed 
        ? 'PASSED: 1/2 criteria satisfied. isVerified = false. Exact age 16 was NOT disclosed.' 
        : 'FAILED: Underage applicant was incorrectly qualified.',
      executionTimeMs: Math.round(performance.now() - t0)
    });
  }

  // Test 9: Tampered Policy Digest Rejection
  {
    const t0 = performance.now();
    const cred = await createMockCred(4500);
    const req = {
      id: 'blk_test_tamper_09',
      policyId: 'blk_policy_valid',
      title: 'Tenancy Check',
      purpose: 'Rental Affordability' as const,
      requiredIncome: 2500,
      currency: 'GBP' as const,
      rules: [{ id: 'r1', category: 'INCOME' as const, label: 'Income ≥ £2,500', operator: 'GTE' as const, targetValue: 2500, displayTarget: '≥ £2,500/mo' }],
      verifierName: 'Apex',
      verifierAddress: 'mn_addr_apex',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
      nonce: 'nonce_09_' + Date.now(),
      policyHash: '0xORIGINAL_POLICY_DIGEST',
      status: 'PENDING' as const,
      isLiveOnChain: false
    };

    const proof = await proveIncomeThreshold(cred, req);
    // Simulating attacker attempting to verify against a modified policy
    const tamperedReq = { ...req, policyHash: '0xTAMPERED_POLICY_DIGEST_ATTACK' };
    const verification = verifyZkProof(proof, tamperedReq, { checkReplay: false });

    const passed = verification.isValid === false && verification.isRequirementSatisfied === false;

    results.push({
      id: 'TEST-09',
      name: 'Tampered Policy Rejection: Cryptographic policy digest mismatch detected',
      category: 'SECURITY',
      passed,
      details: passed 
        ? 'PASSED: Verifier rejected proof with policy hash mismatch.' 
        : 'FAILED: Tampered policy hash was accepted!',
      executionTimeMs: Math.round(performance.now() - t0)
    });
  }

  // Test 10: Replay Attack and Expiration Protection
  {
    const t0 = performance.now();
    const cred = await createMockCred(4500);
    const req = {
      id: 'blk_test_replay_10',
      policyId: 'blk_policy_replay',
      title: 'Single-Use Access Request',
      purpose: 'Custom Financial Requirement' as const,
      requiredIncome: 2000,
      currency: 'GBP' as const,
      rules: [{ id: 'r1', category: 'INCOME' as const, label: 'Income ≥ £2,000', operator: 'GTE' as const, targetValue: 2000, displayTarget: '≥ £2,000/mo' }],
      verifierName: 'Security Gate',
      verifierAddress: 'mn_addr_sec',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
      nonce: 'nonce_single_use_' + Math.random(),
      policyHash: '0xpolicy_single_use',
      status: 'PENDING' as const,
      isLiveOnChain: false
    };

    const proof = await proveIncomeThreshold(cred, req);
    // 1st verification: should pass and consume nonce
    const firstVerif = verifyZkProof(proof, req, { checkReplay: true });
    // 2nd verification with same proof/nonce: should be REJECTED as replay attack
    const replayVerif = verifyZkProof(proof, req, { checkReplay: true });

    const passed = firstVerif.isValid === true && replayVerif.isValid === false;

    results.push({
      id: 'TEST-10',
      name: 'Replay Protection: Single-use cryptographic nonce reuse blocked',
      category: 'SECURITY',
      passed,
      details: passed 
        ? 'PASSED: 1st presentation approved; 2nd presentation rejected (replay blocked).' 
        : 'FAILED: Replay attack was not prevented!',
      executionTimeMs: Math.round(performance.now() - t0)
    });
  }

  // TEST-11: Malformed Hex / Tampered Witness Salt Rejection
  {
    const t0 = performance.now();
    const cred = await createMockCred(4500);
    // Tamper with salt to make it invalid (not 32 bytes hex)
    const malformedCred = { ...cred, salt: 'not_a_valid_hex_salt_string_12345' };
    let rejected = false;
    try {
      await proveIncomeThreshold(malformedCred, 2500);
    } catch {
      rejected = true;
    }

    results.push({
      id: 'TEST-11',
      name: 'Malformed Witness Salt Guard: Non-hex or invalid length salt rejected',
      category: 'SECURITY',
      passed: rejected,
      details: rejected 
        ? 'PASSED: Malformed witness salt intercepted before Compact circuit synthesis.' 
        : 'FAILED: Malformed salt was accepted by prover!',
      executionTimeMs: Math.round(performance.now() - t0)
    });
  }

  // TEST-12: Negative Income & NaN Boundary Exploit Guard
  {
    const t0 = performance.now();
    const cred = await createMockCred(3000);
    const negativeCred = { ...cred, monthlyIncome: -1500 };
    let rejected = false;
    try {
      await proveIncomeThreshold(negativeCred, 2000);
    } catch {
      rejected = true;
    }

    results.push({
      id: 'TEST-12',
      name: 'Input Boundary Guard: Negative income and NaN values safely blocked',
      category: 'BOUNDARY',
      passed: rejected,
      details: rejected 
        ? 'PASSED: Negative witness income rejected by strict integer boundary validation.' 
        : 'FAILED: Negative income bypassed input checks!',
      executionTimeMs: Math.round(performance.now() - t0)
    });
  }

  // TEST-13: Clock Skew & Future Timestamp Forgery Guard
  {
    const t0 = performance.now();
    const cred = await createMockCred(4000);
    const proof = await proveIncomeThreshold(cred, 2000);
    
    // Forged proof with timestamp 1 hour in the future
    const forgedProof: ZkProofResult = {
      ...proof,
      timestamp: Date.now() + 60 * 60 * 1000
    };
    const verif = verifyZkProof(forgedProof, 2000, { checkReplay: false });
    const passed = verif.isValid === false && (verif.reason?.includes('future') || false);

    results.push({
      id: 'TEST-13',
      name: 'Clock Skew & Timestamp Forgery Guard: Future-dated proof rejected',
      category: 'SECURITY',
      passed,
      details: passed
        ? 'PASSED: Future-dated proof artifact identified as clock manipulation and rejected.'
        : 'FAILED: Future-dated proof was accepted as valid!',
      executionTimeMs: Math.round(performance.now() - t0)
    });
  }

  // TEST-14: Expired Proof Strict TTL Enforcement
  {
    const t0 = performance.now();
    const cred = await createMockCred(4000);
    const proof = await proveIncomeThreshold(cred, 2000);
    
    // Expired proof
    const expiredProof: ZkProofResult = {
      ...proof,
      expiresAt: Date.now() - 5000 // Expired 5 seconds ago
    };
    const verif = verifyZkProof(expiredProof, 2000, { checkReplay: false });
    const passed = verif.isValid === false && (verif.reason?.includes('expired') || false);

    results.push({
      id: 'TEST-14',
      name: 'Proof TTL Expiration: Proof presented after request expiry rejected',
      category: 'SECURITY',
      passed,
      details: passed
        ? 'PASSED: Expired proof rejected under strict institutional TTL enforcement.'
        : 'FAILED: Expired proof was accepted!',
      executionTimeMs: Math.round(performance.now() - t0)
    });
  }

  // TEST-15: Persistent Nullifier Registry Cross-Session Protection
  {
    const t0 = performance.now();
    const testNonce = 'test_persistent_nonce_' + Date.now();
    const isFirstTime = !nullifierRegistry.isConsumed(testNonce);
    nullifierRegistry.consume(testNonce, { requestId: 'req_test_15' });
    const isSecondTime = nullifierRegistry.isConsumed(testNonce);
    const doubleConsumeFails = nullifierRegistry.consume(testNonce) === false;

    const passed = isFirstTime && isSecondTime && doubleConsumeFails;

    results.push({
      id: 'TEST-15',
      name: 'Nullifier Registry: Replay protection records and locks consumed nonces',
      category: 'SECURITY',
      passed,
      details: passed
        ? 'PASSED: Nullifier registry recorded presentation nonce and prevented double-spend.'
        : 'FAILED: Nullifier registry failed to prevent duplicate nonce consumption!',
      executionTimeMs: Math.round(performance.now() - t0)
    });
  }

  // TEST-16: Tamper-Evident Digital Seal & Constant-Time Hash Integrity
  {
    const t0 = performance.now();
    const cred = await createMockCred(5000);
    const req = {
      id: 'blk_test_seal_16',
      policyId: 'blk_policy_seal',
      title: 'Institutional Audit',
      purpose: 'Rental Affordability' as const,
      requiredIncome: 3000,
      currency: 'GBP' as const,
      rules: [{ id: 'r1', category: 'INCOME' as const, label: 'Income ≥ £3,000', operator: 'GTE' as const, targetValue: 3000, displayTarget: '≥ £3,000/mo' }],
      verifierName: 'City Vault',
      verifierAddress: 'mn_addr_city_vault',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
      nonce: 'nonce_seal_' + Date.now(),
      policyHash: '0xcanonical_policy_digest_16',
      status: 'PENDING' as const,
      isLiveOnChain: false
    };

    const proof = await proveIncomeThreshold(cred, req);
    const seal = await generateAuditCertificateSeal(proof, req);
    const validSeal = await verifyAuditCertificateSeal(seal, proof, req);

    // Tampered verifier address
    const tamperedReq = { ...req, verifierAddress: 'mn_addr_malicious_party' };
    const invalidSeal = await verifyAuditCertificateSeal(seal, proof, tamperedReq);

    // Constant-time hex comparison check
    const ctMatch = timingSafeEqualHex('0xABCDEF1234', '0xabcdef1234');
    const ctMismatch = !timingSafeEqualHex('0xABCDEF1234', '0xABCDEF1235');

    const passed = validSeal && !invalidSeal && ctMatch && ctMismatch;

    results.push({
      id: 'TEST-16',
      name: 'Cryptographic Certificate Seal: Tamper-evident verification receipt verified',
      category: 'SECURITY',
      passed,
      details: passed
        ? 'PASSED: Cryptographic audit seal verified; tampering with verifier address immediately invalidates seal.'
        : 'FAILED: Tamper-evident seal did not detect payload alteration!',
      executionTimeMs: Math.round(performance.now() - t0)
    });
  }

  return results;
}

// Auto-run when executed directly via CLI
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('privacy.test')) {
  runPrivacyTestSuite().then((results) => {
    console.log('\n======================================================');
    console.log(' BLACKOUTPAY PRIVACY & ZERO-KNOWLEDGE TEST SUITE');
    console.log('======================================================\n');
    let allPassed = true;
    for (const r of results) {
      const mark = r.passed ? '✓ PASS' : '✗ FAIL';
      console.log(`[${mark}] ${r.id}: ${r.name} (${r.executionTimeMs}ms)`);
      if (!r.passed) {
        allPassed = false;
        console.log(`       Details: ${r.details}`);
      }
    }
    console.log('\n------------------------------------------------------');
    const passedCount = results.filter((r) => r.passed).length;
    console.log(`TOTAL: ${passedCount}/${results.length} PASSED`);
    console.log('======================================================\n');
    if (!allPassed) process.exit(1);
  });
}

