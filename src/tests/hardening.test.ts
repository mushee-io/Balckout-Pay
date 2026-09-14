import { hexToBytes32, proveIncomeThreshold } from '../midnight/zk-engine';
import type { PrivateIncomeCredential, VerificationRequest } from '../midnight/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectReject(label: string, fn: () => Promise<unknown>, includes: string) {
  let rejected = false;
  try {
    await fn();
  } catch (error) {
    rejected = true;
    const message = error instanceof Error ? error.message : String(error);
    assert(
      message.toLowerCase().includes(includes.toLowerCase()),
      `${label}: expected error containing "${includes}", received "${message}"`,
    );
  }
  assert(rejected, `${label}: expected operation to fail closed.`);
}

const salt = '11'.repeat(32);
const nonce = '22'.repeat(32);
const verifier = `0x${'33'.repeat(32)}`;
const policyHash = `0x${'44'.repeat(32)}`;

const credential: PrivateIncomeCredential = {
  id: 'hardening-credential',
  monthlyIncome: 4720,
  currency: 'GBP',
  salt,
  commitment: `0x${'55'.repeat(32)}`,
  issuedAt: Date.now(),
  issuer: 'Hardening test',
  label: 'Hardening test credential',
  status: 'READY',
};

const request: VerificationRequest = {
  id: nonce,
  policyId: 'hardening-policy',
  title: 'Hardening income check',
  purpose: 'Custom Financial Requirement',
  requiredIncome: 2500,
  currency: 'GBP',
  rules: [
    {
      id: 'income',
      category: 'INCOME',
      label: 'Monthly income >= 2500',
      operator: 'GTE',
      targetValue: 2500,
      displayTarget: '>= 2500',
    },
  ],
  verifierName: 'Hardening verifier',
  verifierAddress: verifier,
  createdAt: Date.now(),
  expiresAt: Date.now() + 60_000,
  nonce,
  policyHash,
  status: 'PENDING',
  isLiveOnChain: true,
};

async function main() {
  const valid = hexToBytes32(`0x${'ab'.repeat(32)}`);
  assert(valid.length === 32, 'Strict Bytes<32> converter rejected valid input.');

  let malformedRejected = false;
  try {
    hexToBytes32('abcd');
  } catch {
    malformedRejected = true;
  }
  assert(malformedRejected, 'Strict Bytes<32> converter accepted short input.');

  await expectReject(
    'Bare LIVE threshold',
    () => proveIncomeThreshold(credential, 2500, undefined, 'Midnight Preview', 'LIVE'),
    'full registered VerificationRequest',
  );

  await expectReject(
    'Wrong LIVE network',
    () => proveIncomeThreshold(credential, request, undefined, 'Midnight DevNet', 'LIVE'),
    'locked to Midnight Preview',
  );

  await expectReject(
    'Expired LIVE request',
    () => proveIncomeThreshold(
      credential,
      { ...request, expiresAt: Date.now() - 1 },
      undefined,
      'Midnight Preview',
      'LIVE',
    ),
    'expired',
  );

  await expectReject(
    'Compound LIVE request',
    () => proveIncomeThreshold(
      credential,
      {
        ...request,
        rules: [
          ...request.rules,
          {
            id: 'age',
            category: 'AGE',
            label: 'Age >= 18',
            operator: 'GTE',
            targetValue: 18,
            displayTarget: '>= 18',
          },
        ],
      },
      undefined,
      'Midnight Preview',
      'LIVE',
    ),
    'exactly one on-chain rule',
  );

  await expectReject(
    'Mismatched LIVE threshold rule',
    () => proveIncomeThreshold(
      credential,
      {
        ...request,
        rules: [{ ...request.rules[0], targetValue: 1000 }],
      },
      undefined,
      'Midnight Preview',
      'LIVE',
    ),
    'exactly match',
  );

  await expectReject(
    'Malformed LIVE verifier key',
    () => proveIncomeThreshold(
      credential,
      { ...request, verifierAddress: '0x1234' },
      undefined,
      'Midnight Preview',
      'LIVE',
    ),
    '32 bytes',
  );

  console.log('Hardening tests: PASS');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
