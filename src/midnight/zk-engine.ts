/**
 * Security boundary for the proving engine.
 *
 * The historical implementation lives in zk-engine-core.ts so this module can
 * add fail-closed LIVE validation without duplicating the large demo/test
 * engine. All callers continue importing ./zk-engine.
 */
import * as core from './zk-engine-core';
import type {
  ExecutionMode,
  MidnightNetwork,
  PrivateIncomeCredential,
  VerificationRequest,
  ZkProofResult,
} from './types';
import type { ProverCallbacks } from './zk-engine-core';

export * from './zk-engine-core';

function normalizeHex32(value: string, fieldName: string): string {
  if (typeof value !== 'string') throw new Error(`${fieldName} must be a string.`);
  const clean = value.startsWith('0x') ? value.slice(2) : value;
  if (!/^[0-9a-fA-F]{64}$/.test(clean)) {
    throw new Error(`${fieldName} must be exactly 32 bytes (64 hexadecimal characters).`);
  }
  return clean.toLowerCase();
}

/** Strict replacement for the legacy permissive pad/truncate converter. */
export function hexToBytes32(value: string): Uint8Array {
  const clean = normalizeHex32(value, 'Bytes<32> value');
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i += 1) {
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function assertLiveIncomePolicy(
  credential: PrivateIncomeCredential,
  request: VerificationRequest,
): void {
  if (request.isLiveOnChain !== true) {
    throw new Error('LIVE proving requires a request that was registered on Midnight Preview.');
  }
  if (!Number.isSafeInteger(request.requiredIncome) || request.requiredIncome < 0) {
    throw new Error('LIVE income threshold must be a non-negative safe integer.');
  }
  if (!Number.isSafeInteger(credential.monthlyIncome) || credential.monthlyIncome < 0) {
    throw new Error('LIVE private monthly income must be a non-negative safe integer.');
  }
  if (request.currency !== credential.currency) {
    throw new Error('LIVE credential currency must match the registered request currency shown by Blackout Pay.');
  }
  if (!Number.isSafeInteger(request.expiresAt) || Date.now() > request.expiresAt) {
    throw new Error('This verification request is expired and cannot be proved by the Blackout Pay client.');
  }

  normalizeHex32(request.nonce, 'LIVE request nonce');
  normalizeHex32(request.policyHash, 'LIVE policy hash');
  normalizeHex32(request.verifierAddress, 'LIVE verifier public key');
  normalizeHex32(credential.salt, 'LIVE witness salt');

  // Wave 1's deployed Compact circuit proves exactly one condition:
  // private monthly income >= registered required income. Reject richer client
  // policies in LIVE mode until they have corresponding Compact constraints.
  if (!Array.isArray(request.rules) || request.rules.length !== 1) {
    throw new Error('LIVE Wave 1 supports exactly one on-chain rule: monthly income >= the registered threshold. Compound policies are DEMO/roadmap only.');
  }
  const rule = request.rules[0];
  if (
    rule.category !== 'INCOME' ||
    rule.operator !== 'GTE' ||
    typeof rule.targetValue !== 'number' ||
    !Number.isSafeInteger(rule.targetValue) ||
    rule.targetValue !== request.requiredIncome
  ) {
    throw new Error('LIVE Wave 1 rule must be INCOME / GTE and exactly match the registered required-income threshold.');
  }
}

/**
 * Hardened public prover entry point.
 * DEMO behavior is preserved; LIVE calls are constrained to claims enforced by
 * the current Compact circuit before the legacy engine can submit anything.
 */
export async function proveIncomeThreshold(
  credential: PrivateIncomeCredential,
  requiredIncomeOrRequest: number | VerificationRequest,
  requestIdArg?: string,
  network: MidnightNetwork = 'Midnight Preview',
  mode: ExecutionMode = 'DEMO',
  callbacks?: ProverCallbacks,
): Promise<ZkProofResult> {
  if (mode === 'LIVE') {
    if (network !== 'Midnight Preview') {
      throw new Error('Blackout Pay LIVE proving is locked to Midnight Preview.');
    }
    if (typeof requiredIncomeOrRequest !== 'object' || requiredIncomeOrRequest === null) {
      throw new Error('LIVE proving requires the full registered VerificationRequest; a bare threshold is not accepted.');
    }
    assertLiveIncomePolicy(credential, requiredIncomeOrRequest);
  }

  return core.proveIncomeThreshold(
    credential,
    requiredIncomeOrRequest,
    requestIdArg,
    network,
    mode,
    callbacks,
  );
}
