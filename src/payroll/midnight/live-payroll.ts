import { deployContract, submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import * as ledger from '@midnight-ntwrk/midnight-js-protocol/ledger';
import {
  createProofProvider,
  type MidnightProvider,
  type PrivateStateProvider,
  type WalletProvider,
} from '@midnight-ntwrk/midnight-js-types';
import type { ContractAddress, SigningKey } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import {
  connectLiveLaceWallet,
  getActiveLaceSession,
  type LaceSession,
} from '../../midnight/wallet-connector.ts';
import type { PayrollBatch, PayrollExecutionResult, PayrollExecutionStage } from '../types/payroll.ts';
import { validateMidnightPreviewAddress } from './address.ts';
import {
  BLACKOUT_PAYROLL_PRIVATE_STATE_ID,
  BLACKOUT_PAYROLL_ZK_ASSET_PATH,
  makeBlackoutPayrollCompiledContract,
  type BlackoutPayrollPrivateState,
  type BlackoutPayrollWitnesses,
} from './compiled-payroll-contract.ts';

const CONTRACT_ADDRESS_STORAGE_KEY = 'blackout_payroll_preview_contract_address_v1';
const MAX_LIVE_RECIPIENTS = 4;
const MAX_AMOUNT = 1_000_000_000_000;

export interface PayrollLiveCallbacks {
  onStage?: (stage: PayrollExecutionStage, message: string) => void;
}

interface PayrollLiveSession extends LaceSession {
  networkId: 'preview';
}

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

const fromHex = (value: string): Uint8Array => {
  const hex = value.startsWith('0x') ? value.slice(2) : value;
  if (!/^[0-9a-f]{2,}$/i.test(hex) || hex.length % 2 !== 0) {
    throw new Error('BLACKOUT_PAYROLL_INVALID_SERIALIZED_TRANSACTION');
  }
  return new Uint8Array(hex.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16)));
};

function safeError(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim()) return error.trim().slice(0, 500);
  if (error instanceof Error && error.message.trim()) return error.message.trim().slice(0, 500);
  return fallback;
}

function normalizeContractAddress(value: string): string {
  const clean = value.trim().replace(/^0x/i, '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(clean)) throw new Error('BLACKOUT_PAYROLL_INVALID_CONTRACT_ADDRESS');
  return clean;
}

function loadContractAddress(): string {
  try {
    if (typeof window === 'undefined') return '';
    const value = window.localStorage.getItem(CONTRACT_ADDRESS_STORAGE_KEY) || '';
    return value ? normalizeContractAddress(value) : '';
  } catch {
    return '';
  }
}

function saveContractAddress(address: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONTRACT_ADDRESS_STORAGE_KEY, normalizeContractAddress(address));
}

export function getPayrollContractAddress(): string {
  return loadContractAddress();
}

function makePrivateStateProvider(): PrivateStateProvider<string, BlackoutPayrollPrivateState> {
  const states = new Map<string, BlackoutPayrollPrivateState>();
  const signingKeys = new Map<string, SigningKey>();
  let contractAddress = '';
  const scoped = (id: string) => `${contractAddress}:${id}`;

  return {
    setContractAddress(address: ContractAddress) {
      contractAddress = String(address);
    },
    async get(id) {
      const key = scoped(id);
      const existing = states.get(key);
      if (existing !== undefined) return existing;
      if (id === BLACKOUT_PAYROLL_PRIVATE_STATE_ID) {
        const initial: BlackoutPayrollPrivateState = {};
        states.set(key, initial);
        return initial;
      }
      return null;
    },
    async set(id, state) {
      states.set(scoped(id), state);
    },
    async remove(id) {
      states.delete(scoped(id));
    },
    async clear() {
      states.clear();
    },
    async setSigningKey(address, signingKey) {
      signingKeys.set(String(address), signingKey);
    },
    async getSigningKey(address) {
      return signingKeys.get(String(address)) ?? null;
    },
    async removeSigningKey(address) {
      signingKeys.delete(String(address));
    },
    async clearSigningKeys() {
      signingKeys.clear();
    },
    async exportPrivateStates() {
      throw new Error('BLACKOUT_PAYROLL_PRIVATE_STATE_EXPORT_DISABLED');
    },
    async importPrivateStates() {
      throw new Error('BLACKOUT_PAYROLL_PRIVATE_STATE_IMPORT_DISABLED');
    },
    async exportSigningKeys() {
      throw new Error('BLACKOUT_PAYROLL_SIGNING_KEY_EXPORT_DISABLED');
    },
    async importSigningKeys() {
      throw new Error('BLACKOUT_PAYROLL_SIGNING_KEY_IMPORT_DISABLED');
    },
  } as PrivateStateProvider<string, BlackoutPayrollPrivateState>;
}

const privateStateProvider = makePrivateStateProvider();

async function requirePreviewSession(): Promise<PayrollLiveSession> {
  let session = getActiveLaceSession();
  if (!session || session.networkId !== 'preview') {
    await connectLiveLaceWallet('Midnight Preview');
    session = getActiveLaceSession();
  }
  if (!session || session.networkId !== 'preview') throw new Error('BLACKOUT_PAYROLL_PREVIEW_SESSION_REQUIRED');
  if (!session.configuration?.indexerUri || !session.configuration?.indexerWsUri) {
    throw new Error('BLACKOUT_PAYROLL_PREVIEW_INDEXER_CONFIGURATION_MISSING');
  }
  if (!session.addresses?.shieldedCoinPublicKey || !session.addresses?.shieldedEncryptionPublicKey) {
    throw new Error('BLACKOUT_PAYROLL_SHIELDED_WALLET_KEYS_MISSING');
  }
  if (typeof session.wallet.getProvingProvider !== 'function') {
    throw new Error('BLACKOUT_PAYROLL_WALLET_DELEGATED_PROVING_UNAVAILABLE');
  }
  const status = await session.wallet.getConnectionStatus();
  if (status?.status !== 'connected' || status.networkId !== 'preview') {
    throw new Error('BLACKOUT_PAYROLL_WALLET_NETWORK_CHANGED');
  }
  if (typeof session.wallet.getDustBalance === 'function') {
    const raw = await session.wallet.getDustBalance();
    const value = raw && typeof raw === 'object' && 'balance' in raw ? raw.balance : raw;
    const dust = BigInt(String(value ?? '0'));
    if (dust <= 0n) throw new Error('BLACKOUT_PAYROLL_PREVIEW_DUST_REQUIRED');
  }
  setNetworkId('preview');
  return session as PayrollLiveSession;
}

function assetBaseUrl(): string {
  if (typeof window === 'undefined') throw new Error('BLACKOUT_PAYROLL_BROWSER_REQUIRED');
  return new URL(BLACKOUT_PAYROLL_ZK_ASSET_PATH, window.location.origin).toString().replace(/\/$/, '');
}

async function providersFor(session: PayrollLiveSession) {
  const zkConfigProvider = new FetchZkConfigProvider(assetBaseUrl(), fetch.bind(window));
  const provingProvider = await session.wallet.getProvingProvider(zkConfigProvider.asKeyMaterialProvider());
  if (!provingProvider) throw new Error('BLACKOUT_PAYROLL_PROVING_PROVIDER_EMPTY');
  const proofProvider = createProofProvider(provingProvider);

  const walletProvider: WalletProvider = {
    getCoinPublicKey: () => session.addresses.shieldedCoinPublicKey as ledger.CoinPublicKey,
    getEncryptionPublicKey: () => session.addresses.shieldedEncryptionPublicKey as ledger.EncPublicKey,
    async balanceTx(tx) {
      const result = await session.wallet.balanceUnsealedTransaction(toHex(tx.serialize()), { payFees: true });
      if (!result || typeof result.tx !== 'string' || !result.tx) {
        throw new Error('BLACKOUT_PAYROLL_WALLET_BALANCER_RETURNED_NO_TRANSACTION');
      }
      return ledger.Transaction.deserialize(
        'signature',
        'proof',
        'binding',
        fromHex(result.tx),
      ) as ledger.FinalizedTransaction;
    },
  };

  const midnightProvider: MidnightProvider = {
    async submitTx(tx) {
      await session.wallet.submitTransaction(toHex(tx.serialize()));
      const txId = tx.identifiers()?.[0];
      if (!txId) throw new Error('BLACKOUT_PAYROLL_TRANSACTION_IDENTIFIER_MISSING');
      return txId;
    },
  };

  return {
    privateStateProvider,
    zkConfigProvider,
    proofProvider,
    publicDataProvider: indexerPublicDataProvider(
      session.configuration.indexerUri!,
      session.configuration.indexerWsUri!,
    ),
    walletProvider,
    midnightProvider,
  };
}

function unavailableWitnesses(): BlackoutPayrollWitnesses {
  const unavailable = () => {
    throw new Error('BLACKOUT_PAYROLL_PRIVATE_WITNESS_REQUIRED');
  };
  return { local_private_payroll: unavailable } as unknown as BlackoutPayrollWitnesses;
}

async function hashText32(value: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return new Uint8Array(digest);
}

function randomBytes32(): Uint8Array {
  const value = new Uint8Array(32);
  crypto.getRandomValues(value);
  return value;
}

function safeBlockHeight(value: unknown): number {
  const height = Number(value);
  if (!Number.isSafeInteger(height) || height < 0) throw new Error('BLACKOUT_PAYROLL_INVALID_BLOCK_HEIGHT');
  return height;
}

function transactionId(publicData: any): string {
  const txId = String(publicData?.txId || '').trim();
  if (!txId) throw new Error('BLACKOUT_PAYROLL_TRANSACTION_ID_MISSING');
  return txId;
}

async function ensurePayrollContract(
  providers: Awaited<ReturnType<typeof providersFor>>,
  callbacks?: PayrollLiveCallbacks,
) {
  const existing = loadContractAddress();
  if (existing) return { contractAddress: existing, deploymentTxId: undefined as string | undefined };

  callbacks?.onStage?.('AWAITING_WALLET_APPROVAL', 'Approve the one-time BLACKOUT PAYROLL contract deployment in your Midnight Preview wallet.');
  const compiledContract = makeBlackoutPayrollCompiledContract(unavailableWitnesses(), assetBaseUrl());
  const deployed = await deployContract(providers as any, {
    compiledContract,
    privateStateId: BLACKOUT_PAYROLL_PRIVATE_STATE_ID,
    initialPrivateState: {},
  } as any);
  const publicData = deployed.deployTxData.public;
  const contractAddress = normalizeContractAddress(String(publicData.contractAddress));
  const deploymentTxId = transactionId(publicData);
  saveContractAddress(contractAddress);
  return { contractAddress, deploymentTxId };
}

async function buildWitnesses(batch: PayrollBatch): Promise<{
  witnesses: BlackoutPayrollWitnesses;
  batchId: Uint8Array;
}> {
  if (batch.recipients.length < 1) throw new Error('BLACKOUT_PAYROLL_AT_LEAST_ONE_RECIPIENT_REQUIRED');
  if (batch.recipients.length > MAX_LIVE_RECIPIENTS) {
    throw new Error(`BLACKOUT_PAYROLL_LIVE_SUPPORTS_UP_TO_${MAX_LIVE_RECIPIENTS}_RECIPIENTS_PER_BATCH`);
  }

  const normalizedRecipients: Array<{ address: string; amount: bigint }> = [];
  for (const recipient of batch.recipients) {
    const validation = validateMidnightPreviewAddress(recipient.walletAddress);
    if (!validation.ok || !validation.normalized) {
      throw new Error(validation.error || 'BLACKOUT_PAYROLL_INVALID_PREVIEW_RECIPIENT');
    }
    if (!Number.isSafeInteger(recipient.paymentAmount) || recipient.paymentAmount <= 0 || recipient.paymentAmount > MAX_AMOUNT) {
      throw new Error(`BLACKOUT_PAYROLL_INVALID_AMOUNT_FOR_${recipient.employeeId}`);
    }
    normalizedRecipients.push({ address: validation.normalized, amount: BigInt(recipient.paymentAmount) });
  }

  const zero = new Uint8Array(32);
  const recipientHashes: Uint8Array[] = [];
  for (const recipient of normalizedRecipients) {
    recipientHashes.push(await hashText32(`blackout:payroll:recipient:v1:${recipient.address}`));
  }
  while (recipientHashes.length < MAX_LIVE_RECIPIENTS) recipientHashes.push(zero);

  const amounts = normalizedRecipients.map((recipient) => recipient.amount);
  while (amounts.length < MAX_LIVE_RECIPIENTS) amounts.push(0n);

  const assetCommitment = await hashText32(`blackout:payroll:asset:v1:${batch.paymentAsset}`);
  const batchId = await hashText32(`blackout:payroll:id:v1:${batch.id}`);
  const nonce = randomBytes32();

  const privateBatch = {
    asset_commitment: assetCommitment,
    recipient_1: recipientHashes[0],
    recipient_2: recipientHashes[1],
    recipient_3: recipientHashes[2],
    recipient_4: recipientHashes[3],
    amount_1: amounts[0],
    amount_2: amounts[1],
    amount_3: amounts[2],
    amount_4: amounts[3],
    nonce,
  };

  const witnesses = {
    local_private_payroll: (context: any) => [context.privateState, privateBatch],
  } as unknown as BlackoutPayrollWitnesses;

  return { witnesses, batchId };
}

export async function authorizePayrollOnPreview(
  batch: PayrollBatch,
  callbacks?: PayrollLiveCallbacks,
): Promise<PayrollExecutionResult> {
  callbacks?.onStage?.('PREPARING_PAYROLL', 'Validating the payroll manifest and Midnight Preview recipient addresses.');

  try {
    const session = await requirePreviewSession();
    callbacks?.onStage?.('PREPARING_PRIVATE_STATE', 'Hashing recipient addresses and keeping compensation values inside the private witness.');
    const { witnesses, batchId } = await buildWitnesses(batch);

    // The DApp Connector delegated proving API is designed for a proving
    // provider to be obtained once and reused. Reusing one provider bundle for
    // both an optional first-time deployment and the payroll call prevents a
    // second transient wallet proving UI from being created mid-flow.
    const providers = await providersFor(session);
    const deployment = await ensurePayrollContract(providers, callbacks);

    callbacks?.onStage?.('GENERATING_PROOF', 'Generating the payroll proof through the active Midnight wallet proving session. Keep the wallet approval UI open until authorization completes.');

    const compiledContract = makeBlackoutPayrollCompiledContract(witnesses, assetBaseUrl());
    const authorizedAt = BigInt(Math.floor(Date.now() / 1000));

    const result = await submitCallTx(providers as any, {
      compiledContract,
      contractAddress: deployment.contractAddress,
      circuitId: 'authorize_payroll',
      args: [batchId, authorizedAt],
      privateStateId: BLACKOUT_PAYROLL_PRIVATE_STATE_ID,
    } as any);

    callbacks?.onStage?.('SUBMITTING_TO_MIDNIGHT', 'Wallet proving, balancing and authorization completed; validating the submitted Midnight Preview transaction reference.');
    const txHash = transactionId(result.public);
    const blockHeight = safeBlockHeight(result.public.blockHeight);
    callbacks?.onStage?.('CONFIRMING', `Midnight Preview included the authorization at block ${blockHeight}.`);
    callbacks?.onStage?.('PAYROLL_COMPLETE', 'Private payroll authorization finalized on Midnight Preview.');

    return {
      batchId: batch.id,
      batchName: batch.name,
      recipientCount: batch.recipients.length,
      totalDisplay: 'PRIVATE',
      network: 'Midnight Preview',
      mode: 'LIVE',
      status: 'CONFIRMED',
      timestamp: Date.now(),
      txHash,
      contractAddress: deployment.contractAddress,
      blockHeight,
      deploymentTxHash: deployment.deploymentTxId,
      privacyStatus: 'COMPENSATION PRIVATE',
      unrevealedAttributes: [
        'Individual Employee Compensation Amounts',
        'Exact Aggregate Payroll Total',
        'Recipient Midnight Addresses',
        'Employee Identity Labels',
      ],
      dataDisclosedBytes: 0,
      note: 'Real Midnight Preview ZK authorization. The public chain receives a batch identifier, one-way commitment, replay nullifier and timestamp; recipient addresses and compensation values remain private. This authorization receipt does not itself represent asset settlement to recipients.',
    };
  } catch (error) {
    const rawMessage = safeError(error, 'BLACKOUT_PAYROLL_PREVIEW_AUTHORIZATION_FAILED');
    const message = /wallet ui disconnected|(?:prove|proving).*disconnected/i.test(rawMessage)
      ? 'BLACKOUT_PAYROLL_WALLET_PROVER_DISCONNECTED: the Midnight wallet proving UI disconnected before authorization submission. Keep the wallet approval UI open and retry; an existing payroll contract deployment will be reused.'
      : rawMessage;
    callbacks?.onStage?.('FAILED', message);
    throw new Error(message);
  }
}