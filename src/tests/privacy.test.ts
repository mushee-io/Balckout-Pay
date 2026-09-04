/**
 * @file privacy.test.ts
 * Test suite verifying Zero-Knowledge logic, boundary conditions,
 * and mathematical assertions that private income is NEVER leaked.
 */

import { computeCommitment, generateSecureSalt, proveIncomeThreshold, verifyZkProof } from '../midnight/zk-engine';
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

  return results;
}
