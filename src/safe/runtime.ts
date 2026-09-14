import type { PrivatePolicyWitness, PrivateProposalPayload } from '../../contract/build-safe/contract/index.js';
import { buildBlackoutSafeWitnesses } from './midnight/witnesses.ts';
import {
  clearActiveSafeWalletSession,
  connectBlackoutSafeWallet,
  requirePreviewDust,
  type SafeWalletSession,
} from './midnight/wallet-session.ts';
import {
  deployBlackoutSafe,
  submitBlackoutSafeCall,
  unavailableBlackoutSafeWitnesses,
  type BlackoutSafeCircuitId,
} from './midnight/live-safe.ts';
import {
  bytesToHex32,
  createMembershipSetup,
  decodePolicyOpening,
  decodeProposalBundle,
  decodeSignerKit,
  exactPolicyCommitment,
  exactProposalCommitment,
  fieldToHex32,
  hex32ToBytes,
  padAscii32,
  randomBytes32,
  serializePolicyOpening,
  serializeProposalBundle,
  witnessBundleForSigner,
  type Hex32String,
  type MembershipSetup,
  type SerializedPolicyOpening,
  type SerializedProposalBundle,
  type SerializedSafeSignerKit,
} from './midnight/live-encoding.ts';

export interface WalletView {
  walletName: string;
  connectorId: string;
  networkId: 'preview';
  dust: string;
  shieldedAddress?: string;
  shieldedCoinPublicKey?: string;
  shieldedEncryptionPublicKey?: string;
}

export interface PublicSafeRecord {
  version: 1;
  networkId: 'preview';
  safeId: Hex32String;
  membershipRoot: Hex32String;
  membershipVersion: string;
  policyCommitment: Hex32String;
  policyVersion: string;
  policyMode: 'STANDARD' | 'PRIVATE_POLICY';
  publicQuorum: string | null;
  contractAddress: string;
  deploymentTxId: string;
  deploymentBlockHeight: number;
  createdAt: string;
}

export interface BootstrapResult {
  membership: MembershipSetup;
  policy: PrivatePolicyWitness;
  policyOpening: SerializedPolicyOpening;
  policyCommitment: Uint8Array;
}

export interface TxResultView {
  txId: string;
  blockHeight: number;
  circuitId: BlackoutSafeCircuitId | 'deploy';
}

let connectedSession: SafeWalletSession | null = null;

function sameHex(a: string, b: string): boolean {
  return a.trim().toLowerCase().replace(/^0x/, '') === b.trim().toLowerCase().replace(/^0x/, '');
}

function assertSameSafe(record: PublicSafeRecord, candidate: string, label: string): void {
  if (!sameHex(record.safeId, candidate)) throw new Error(`${label}_SAFE_ID_MISMATCH`);
}

function zero32(): Uint8Array {
  return new Uint8Array(32);
}

function nowSeconds(): bigint {
  return BigInt(Math.floor(Date.now() / 1000));
}

export async function connectSafeWallet(): Promise<WalletView> {
  const session = await connectBlackoutSafeWallet();
  const dust = await requirePreviewDust(session);
  connectedSession = session;
  return {
    walletName: session.walletName,
    connectorId: session.connectorId,
    networkId: 'preview',
    dust: dust.toString(),
    shieldedAddress: session.addresses.shieldedAddress,
    shieldedCoinPublicKey: session.addresses.shieldedCoinPublicKey,
    shieldedEncryptionPublicKey: session.addresses.shieldedEncryptionPublicKey,
  };
}

export function disconnectSafeWallet(): void {
  clearActiveSafeWalletSession();
  connectedSession = null;
}

export function bootstrapSafe(input: {
  memberCount: number;
  mode: 'STANDARD' | 'PRIVATE_POLICY';
  threshold: bigint;
  maxTransferAmount: bigint;
  maxProposalLifetime: bigint;
  minExecutionDelay: bigint;
}): BootstrapResult {
  if (input.threshold <= 0n || input.threshold > BigInt(input.memberCount)) {
    throw new Error('BLACKOUT_SAFE_THRESHOLD_OUTSIDE_MEMBER_SET');
  }
  const membership = createMembershipSetup(input.memberCount);
  const policy: PrivatePolicyWitness = {
    is_private: input.mode === 'PRIVATE_POLICY',
    threshold: input.threshold,
    max_transfer_amount: input.maxTransferAmount,
    max_proposal_lifetime: input.maxProposalLifetime,
    min_execution_delay: input.minExecutionDelay,
    membership_version: 1n,
    policy_version: 1n,
    salt: input.mode === 'PRIVATE_POLICY' ? randomBytes32() : zero32(),
  };
  const policyCommitment = exactPolicyCommitment(policy);
  return {
    membership,
    policy,
    policyOpening: serializePolicyOpening(membership.safeId, policy),
    policyCommitment,
  };
}

export async function deployBootstrap(bootstrap: BootstrapResult): Promise<PublicSafeRecord> {
  if (!connectedSession) throw new Error('BLACKOUT_SAFE_WALLET_SESSION_REQUIRED');
  const deployed = await deployBlackoutSafe({
    session: connectedSession,
    safeId: bootstrap.membership.safeId,
    membershipRoot: bootstrap.membership.root,
    policyCommitment: bootstrap.policyCommitment,
    policyIsPrivate: bootstrap.policy.is_private,
    standardRequiredQuorum: bootstrap.policy.is_private ? 0n : bootstrap.policy.threshold,
  });
  return {
    version: 1,
    networkId: 'preview',
    safeId: bytesToHex32(bootstrap.membership.safeId),
    membershipRoot: fieldToHex32(bootstrap.membership.root.field),
    membershipVersion: '1',
    policyCommitment: bytesToHex32(bootstrap.policyCommitment),
    policyVersion: '1',
    policyMode: bootstrap.policy.is_private ? 'PRIVATE_POLICY' : 'STANDARD',
    publicQuorum: bootstrap.policy.is_private ? null : bootstrap.policy.threshold.toString(),
    contractAddress: deployed.contractAddress,
    deploymentTxId: deployed.txId,
    deploymentBlockHeight: deployed.blockHeight,
    createdAt: new Date().toISOString(),
  };
}

export async function depositShielded(
  safe: PublicSafeRecord,
  color: Hex32String,
  value: bigint,
): Promise<TxResultView> {
  if (value <= 0n) throw new Error('BLACKOUT_SAFE_DEPOSIT_VALUE_MUST_BE_POSITIVE');
  const result = await submitBlackoutSafeCall({
    session: connectedSession ?? undefined,
    contractAddress: safe.contractAddress,
    circuitId: 'deposit_shielded',
    args: [{ nonce: randomBytes32(), color: hex32ToBytes(color), value }],
    witnesses: unavailableBlackoutSafeWitnesses(),
  });
  return { txId: result.txId, blockHeight: result.blockHeight, circuitId: result.circuitId };
}

export async function createTransferProposal(input: {
  safe: PublicSafeRecord;
  signerKit: SerializedSafeSignerKit;
  policyOpening: SerializedPolicyOpening;
  asset: Hex32String;
  recipientCoinPublicKey: Hex32String;
  amount: bigint;
  lifetimeSeconds: bigint;
}): Promise<{ tx: TxResultView; proposalBundle: SerializedProposalBundle }> {
  const signer = decodeSignerKit(input.signerKit);
  const policy = decodePolicyOpening(input.policyOpening);
  assertSameSafe(input.safe, bytesToHex32(signer.safeId), 'BLACKOUT_SAFE_SIGNER');
  assertSameSafe(input.safe, bytesToHex32(policy.safeId), 'BLACKOUT_SAFE_POLICY');
  if (input.amount <= 0n) throw new Error('BLACKOUT_SAFE_INVALID_AMOUNT');
  if (input.lifetimeSeconds <= 0n) throw new Error('BLACKOUT_SAFE_INVALID_PROPOSAL_LIFETIME');

  const createdAt = nowSeconds();
  const payload: PrivateProposalPayload = {
    action_type: padAscii32('TRANSFER'),
    asset: hex32ToBytes(input.asset),
    recipient: hex32ToBytes(input.recipientCoinPublicKey),
    amount: input.amount,
    calldata_or_action: padAscii32('TRANSFER'),
    memo_hash: randomBytes32(),
    created_at: createdAt,
    expires_at: createdAt + input.lifetimeSeconds,
    nonce: randomBytes32(),
    salt: randomBytes32(),
  };
  const safeId = hex32ToBytes(input.safe.safeId);
  const commitment = exactProposalCommitment(safeId, payload);
  const proposalBundle = serializeProposalBundle(safeId, commitment, payload);
  const witnesses = buildBlackoutSafeWitnesses(
    witnessBundleForSigner(input.signerKit, input.policyOpening, proposalBundle),
  );
  const result = await submitBlackoutSafeCall({
    session: connectedSession ?? undefined,
    contractAddress: input.safe.contractAddress,
    circuitId: 'propose_private',
    args: [commitment],
    witnesses,
  });
  return {
    tx: { txId: result.txId, blockHeight: result.blockHeight, circuitId: result.circuitId },
    proposalBundle,
  };
}

export async function approveProposal(input: {
  safe: PublicSafeRecord;
  signerKit: SerializedSafeSignerKit;
  proposalBundle: SerializedProposalBundle;
}): Promise<TxResultView> {
  const signer = decodeSignerKit(input.signerKit);
  assertSameSafe(input.safe, bytesToHex32(signer.safeId), 'BLACKOUT_SAFE_SIGNER');
  assertSameSafe(input.safe, input.proposalBundle.safeId, 'BLACKOUT_SAFE_PROPOSAL');
  const witnesses = buildBlackoutSafeWitnesses(
    witnessBundleForSigner(input.signerKit, undefined, input.proposalBundle),
  );
  const result = await submitBlackoutSafeCall({
    session: connectedSession ?? undefined,
    contractAddress: input.safe.contractAddress,
    circuitId: 'approve_private',
    args: [hex32ToBytes(input.proposalBundle.proposalCommitment)],
    witnesses,
  });
  return { txId: result.txId, blockHeight: result.blockHeight, circuitId: result.circuitId };
}

export async function proveQuorum(input: {
  safe: PublicSafeRecord;
  policyOpening: SerializedPolicyOpening;
  proposalCommitment: Hex32String;
}): Promise<TxResultView> {
  const decoded = decodePolicyOpening(input.policyOpening);
  assertSameSafe(input.safe, bytesToHex32(decoded.safeId), 'BLACKOUT_SAFE_POLICY');
  const witnesses = buildBlackoutSafeWitnesses({ policy: decoded.policy as any });
  const result = await submitBlackoutSafeCall({
    session: connectedSession ?? undefined,
    contractAddress: input.safe.contractAddress,
    circuitId: 'prove_quorum',
    args: [hex32ToBytes(input.proposalCommitment)],
    witnesses,
  });
  return { txId: result.txId, blockHeight: result.blockHeight, circuitId: result.circuitId };
}

export async function executeTransfer(input: {
  safe: PublicSafeRecord;
  policyOpening: SerializedPolicyOpening;
  proposalBundle: SerializedProposalBundle;
  heldCoin: { nonce: Hex32String; color: Hex32String; value: string; mt_index: string };
}): Promise<TxResultView> {
  assertSameSafe(input.safe, input.proposalBundle.safeId, 'BLACKOUT_SAFE_PROPOSAL');
  assertSameSafe(input.safe, input.policyOpening.safeId, 'BLACKOUT_SAFE_POLICY');
  const proposal = decodeProposalBundle(input.proposalBundle);
  const decodedPolicy = decodePolicyOpening(input.policyOpening);
  const witnesses = buildBlackoutSafeWitnesses({
    privateProposal: proposal.payload as any,
    policy: decodedPolicy.policy as any,
    heldCoin: {
      nonce: hex32ToBytes(input.heldCoin.nonce),
      color: hex32ToBytes(input.heldCoin.color),
      value: BigInt(input.heldCoin.value),
      mt_index: BigInt(input.heldCoin.mt_index),
    } as any,
  });
  const result = await submitBlackoutSafeCall({
    session: connectedSession ?? undefined,
    contractAddress: input.safe.contractAddress,
    circuitId: 'execute_shielded_transfer',
    args: [proposal.proposalCommitment],
    witnesses,
  });
  return { txId: result.txId, blockHeight: result.blockHeight, circuitId: result.circuitId };
}

export async function runReceiptCircuit(input: {
  safe: PublicSafeRecord;
  circuitId:
    | 'receipt_quorum_authorized'
    | 'receipt_executed_exactly_once'
    | 'receipt_disclose_amount'
    | 'receipt_disclose_recipient'
    | 'receipt_proposal_cancelled';
  proposalCommitment: Hex32String;
  policyOpening?: SerializedPolicyOpening;
  proposalBundle?: SerializedProposalBundle;
}): Promise<TxResultView> {
  const witnessBundle: any = {};
  if (input.policyOpening) {
    assertSameSafe(input.safe, input.policyOpening.safeId, 'BLACKOUT_SAFE_POLICY');
    witnessBundle.policy = decodePolicyOpening(input.policyOpening).policy;
  }
  if (input.proposalBundle) {
    assertSameSafe(input.safe, input.proposalBundle.safeId, 'BLACKOUT_SAFE_PROPOSAL');
    witnessBundle.privateProposal = decodeProposalBundle(input.proposalBundle).payload;
  }
  const result = await submitBlackoutSafeCall({
    session: connectedSession ?? undefined,
    contractAddress: input.safe.contractAddress,
    circuitId: input.circuitId,
    args: [hex32ToBytes(input.proposalCommitment)],
    witnesses: buildBlackoutSafeWitnesses(witnessBundle),
  });
  return { txId: result.txId, blockHeight: result.blockHeight, circuitId: result.circuitId };
}

export type {
  Hex32String,
  SerializedPolicyOpening,
  SerializedProposalBundle,
  SerializedSafeSignerKit,
};
