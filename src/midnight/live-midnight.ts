/**
 * Real Midnight Preview transaction lifecycle.
 *
 * This module deliberately uses the compiler-generated Contract class with
 * MidnightJS 4.1.1. It contains no transaction or proof simulation.
 */
import { deployContract, submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import * as ledger from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { createProofProvider, type MidnightProvider, type PrivateStateProvider, type WalletProvider } from '@midnight-ntwrk/midnight-js-types';
import type { ContractAddress, SigningKey } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { makeBlackoutCompiledContract, type BlackoutPrivateState, type BlackoutWitnesses } from './compiled-contract';
import { getActiveLaceSession, type LaceSession } from './wallet-connector';

export const BLACKOUT_PRIVATE_STATE_ID = 'blackout-income-verifier-session';
// v2 intentionally does not reuse the older contract address. The hardened
// Compact contract changes protocol state semantics and must be redeployed.
const CONTRACT_ADDRESS_STORAGE_KEY = 'blackout_midnight_preview_contract_address_v2';
const MAX_UINT64 = (1n << 64n) - 1n;

function normalizeContractAddress(value: string): string {
  const clean = value?.trim().replace(/^0x/i, '') ?? '';
  if (!/^[0-9a-fA-F]{64}$/.test(clean)) {
    throw new Error('Midnight contract address must be exactly 32 bytes (64 hexadecimal characters).');
  }
  return clean.toLowerCase();
}

function assertUint64(value: bigint, label: string): void {
  if (value < 0n || value > MAX_UINT64) {
    throw new Error(`${label} must be an unsigned 64-bit integer.`);
  }
}

function assertBytes32(value: Uint8Array, label: string): void {
  if (!(value instanceof Uint8Array) || value.length !== 32) {
    throw new Error(`${label} must be exactly 32 bytes.`);
  }
}

function readPersistedContractAddress(): string {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return '';
    const stored = window.localStorage.getItem(CONTRACT_ADDRESS_STORAGE_KEY)?.trim() || '';
    if (!stored) return '';
    return normalizeContractAddress(stored);
  } catch {
    return '';
  }
}

function persistContractAddress(address: string): void {
  try {
    const clean = normalizeContractAddress(address);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(CONTRACT_ADDRESS_STORAGE_KEY, clean);
    }
  } catch {
    // Contract address is public. Persistence failure must not block a valid deployment.
  }
}

let activeContractAddress = readPersistedContractAddress();

export function getActiveBlackoutContractAddress(): string {
  if (activeContractAddress) return activeContractAddress;
  activeContractAddress = readPersistedContractAddress();
  return activeContractAddress;
}

export interface PrivateIncomeWitness {
  monthlyIncome: bigint;
  salt: Uint8Array;
}

const toHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
const fromHex = (value: string) => {
  const hex = value.startsWith('0x') ? value.slice(2) : value;
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length < 2 || hex.length % 2 !== 0) {
    throw new Error('Wallet returned an invalid serialized Midnight transaction.');
  }
  return new Uint8Array(hex.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16)));
};

/**
 * Extract only safe diagnostic fields. Never stringify arbitrary wallet/SDK
 * objects because they may contain transaction or private-state material.
 */
function safeMidnightError(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim()) return error.slice(0, 500);
  if (error instanceof Error) {
    if (error.message?.trim()) return error.message.slice(0, 500);
    const cause = error.cause;
    if (cause && cause !== error) return safeMidnightError(cause, fallback);
    if (error.name && error.name !== 'Error') return error.name.slice(0, 100);
  }
  if (typeof error === 'object' && error !== null) {
    const value = error as Record<string, unknown>;
    const fields = ['reason', 'message', 'code', 'type', '_tag', 'name'] as const;
    const parts = fields
      .map((field) => typeof value[field] === 'string' && value[field] ? `${field}: ${String(value[field]).slice(0, 160)}` : '')
      .filter(Boolean);
    if (parts.length > 0) return parts.join(' | ').slice(0, 500);
    if (value.cause && value.cause !== error) return safeMidnightError(value.cause, fallback);
  }
  return fallback;
}

function readDustBalance(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  if (typeof value === 'string' && /^\d+$/.test(value)) return BigInt(value);
  if (typeof value === 'object' && value !== null && 'balance' in value) {
    return readDustBalance((value as { balance: unknown }).balance);
  }
  throw new Error('Connected wallet returned an unreadable DUST balance for Midnight Preview.');
}

async function requirePreviewDust(session: LaceSession): Promise<void> {
  if (session.networkId !== 'preview') {
    throw new Error(`Blackout Pay LIVE is locked to Midnight Preview; the connected wallet is on "${session.networkId}".`);
  }
  if (typeof session.wallet.getDustBalance !== 'function') {
    throw new Error('Connected Midnight wallet does not expose getDustBalance(). Update the wallet and reconnect on Midnight Preview.');
  }
  const dust = readDustBalance(await session.wallet.getDustBalance());
  if (dust <= 0n) {
    throw new Error(
      'Connected wallet reports 0 DUST on Midnight Preview. Register/designate tNIGHT for DUST generation, wait until DUST is above 0, then retry.'
    );
  }
}

/**
 * Blackout's generated Compact private state is exactly an empty object.
 * The actual income and salt are provided only through witness callbacks and
 * are never written to this provider or browser storage.
 */
function sessionPrivateStateProvider(): PrivateStateProvider<string, BlackoutPrivateState> {
  const states = new Map<string, BlackoutPrivateState>();
  const signingKeys = new Map<string, SigningKey>();
  let contractAddress = '';
  const key = (id: string) => `${contractAddress}:${id}`;

  return {
    setContractAddress(address: ContractAddress) {
      contractAddress = String(address);
    },
    async get(id) {
      const scopedKey = key(id);
      const existing = states.get(scopedKey);
      if (existing !== undefined) return existing;

      if (id === BLACKOUT_PRIVATE_STATE_ID) {
        const initialState: BlackoutPrivateState = {};
        states.set(scopedKey, initialState);
        return initialState;
      }
      return null;
    },
    async set(id, state) {
      states.set(key(id), state);
    },
    async remove(id) {
      states.delete(key(id));
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
      throw new Error('Private witness export is disabled for Blackout Pay.');
    },
    async importPrivateStates() {
      throw new Error('Private witness import is disabled for Blackout Pay.');
    },
    async exportSigningKeys() {
      throw new Error('Signing-key export is disabled for Blackout Pay.');
    },
    async importSigningKeys() {
      throw new Error('Signing-key import is disabled for Blackout Pay.');
    },
  } as PrivateStateProvider<string, BlackoutPrivateState>;
}

const blackoutPrivateStateProvider = sessionPrivateStateProvider();

async function providersFor(session: LaceSession) {
  const { wallet, configuration, addresses } = session;
  if (session.networkId !== 'preview') {
    throw new Error('LIVE provider construction is restricted to Midnight Preview.');
  }
  if (!configuration.indexerUri || !configuration.indexerWsUri) {
    throw new Error('Connected Midnight wallet did not provide the required Preview indexer endpoints.');
  }
  if (!addresses.shieldedCoinPublicKey || !addresses.shieldedEncryptionPublicKey) {
    throw new Error('Connected Midnight wallet did not provide shielded coin and encryption public keys.');
  }
  if (typeof wallet.getProvingProvider !== 'function') {
    throw new Error('Connected Midnight wallet does not expose DApp Connector v4 wallet-delegated proving.');
  }

  setNetworkId(session.networkId);
  const zkConfigProvider = new FetchZkConfigProvider(window.location.origin, fetch.bind(window));
  const provingProvider = await wallet.getProvingProvider(zkConfigProvider.asKeyMaterialProvider());
  const proofProvider = createProofProvider(provingProvider);

  const walletProvider: WalletProvider = {
    getCoinPublicKey: () => addresses.shieldedCoinPublicKey as ledger.CoinPublicKey,
    getEncryptionPublicKey: () => addresses.shieldedEncryptionPublicKey as ledger.EncPublicKey,
    async balanceTx(tx) {
      try {
        const result = await wallet.balanceUnsealedTransaction(toHex(tx.serialize()), { payFees: true });
        if (!result || typeof result.tx !== 'string') {
          throw new Error('Wallet did not return a balanced serialized transaction.');
        }
        return ledger.Transaction.deserialize('signature', 'proof', 'binding', fromHex(result.tx)) as ledger.FinalizedTransaction;
      } catch (error: unknown) {
        throw new Error(safeMidnightError(error, 'Connected wallet failed to balance the Midnight Preview transaction.'));
      }
    },
  };

  const midnightProvider: MidnightProvider = {
    async submitTx(tx) {
      try {
        await wallet.submitTransaction(toHex(tx.serialize()));
        const identifiers = tx.identifiers();
        if (!identifiers?.[0]) throw new Error('Finalized transaction did not expose a transaction identifier.');
        return identifiers[0];
      } catch (error: unknown) {
        throw new Error(safeMidnightError(error, 'Connected wallet failed to submit the Midnight Preview transaction.'));
      }
    },
  };

  return {
    privateStateProvider: blackoutPrivateStateProvider,
    zkConfigProvider,
    proofProvider,
    publicDataProvider: indexerPublicDataProvider(configuration.indexerUri, configuration.indexerWsUri),
    walletProvider,
    midnightProvider,
  };
}

function inactiveWitnesses(): BlackoutWitnesses {
  const unavailable = () => {
    throw new Error('This contract operation requires a private income witness.');
  };
  return {
    get_private_monthly_income: unavailable,
    get_private_income_salt: unavailable,
  };
}

function witnessCallbacks(witness: PrivateIncomeWitness): BlackoutWitnesses {
  assertUint64(witness.monthlyIncome, 'Private monthly income');
  assertBytes32(witness.salt, 'Income salt');
  return {
    get_private_monthly_income: (context) => [context.privateState, witness.monthlyIncome],
    get_private_income_salt: (context) => [context.privateState, witness.salt],
  };
}

export async function deployBlackoutContract() {
  const session = getActiveLaceSession();
  if (!session) throw new Error('Connect a Midnight wallet on Preview before deploying.');
  try {
    await requirePreviewDust(session);
    const providers = await providersFor(session);
    const compiledContract = makeBlackoutCompiledContract(inactiveWitnesses(), window.location.origin);
    const deployed = await deployContract(providers as any, {
      compiledContract,
      privateStateId: BLACKOUT_PRIVATE_STATE_ID,
      initialPrivateState: {},
    });
    const contractAddress = normalizeContractAddress(String(deployed.deployTxData.public.contractAddress));
    const txId = String(deployed.deployTxData.public.txId || '').trim();
    if (!txId) throw new Error('Midnight deployment did not return a transaction id.');
    activeContractAddress = contractAddress;
    persistContractAddress(contractAddress);
    return { contractAddress, txId };
  } catch (error: unknown) {
    throw new Error(safeMidnightError(error, 'Midnight Preview contract deployment failed.'));
  }
}

export async function proveIncomeThreshold(input: {
  contractAddress: string;
  requestId: Uint8Array;
  requiredIncome: bigint;
  verifierPublicKey: Uint8Array;
  timestamp: bigint;
  witness: PrivateIncomeWitness;
}) {
  const contractAddress = normalizeContractAddress(input.contractAddress);
  assertBytes32(input.requestId, 'Request id');
  assertBytes32(input.verifierPublicKey, 'Verifier public key');
  assertUint64(input.requiredIncome, 'Required income');
  assertUint64(input.timestamp, 'Proof timestamp');
  assertUint64(input.witness.monthlyIncome, 'Private monthly income');
  assertBytes32(input.witness.salt, 'Income salt');

  const session = getActiveLaceSession();
  if (!session) throw new Error('Connect a Midnight wallet on Preview before proving.');
  try {
    await requirePreviewDust(session);
    const providers = await providersFor(session);
    const compiledContract = makeBlackoutCompiledContract(witnessCallbacks(input.witness), window.location.origin);
    const result = await submitCallTx(providers as any, {
      compiledContract,
      contractAddress,
      circuitId: 'prove_income_threshold',
      args: [input.requestId, input.requiredIncome, input.verifierPublicKey, input.timestamp],
      privateStateId: BLACKOUT_PRIVATE_STATE_ID,
    });
    const txId = String(result.public.txId || '').trim();
    const blockHeight = Number(result.public.blockHeight);
    if (!txId || !Number.isSafeInteger(blockHeight) || blockHeight < 0) {
      throw new Error('Midnight returned an incomplete proof transaction receipt.');
    }
    return { txId, blockHeight };
  } catch (error: unknown) {
    throw new Error(safeMidnightError(error, 'Midnight Preview income proof transaction failed.'));
  }
}

export async function registerVerificationRequest(input: {
  contractAddress: string;
  requestId: Uint8Array;
  requiredIncome: bigint;
  verifierPublicKey: Uint8Array;
  timestamp: bigint;
}) {
  const contractAddress = normalizeContractAddress(input.contractAddress);
  assertBytes32(input.requestId, 'Request id');
  assertBytes32(input.verifierPublicKey, 'Verifier public key');
  assertUint64(input.requiredIncome, 'Required income');
  assertUint64(input.timestamp, 'Registration timestamp');

  const session = getActiveLaceSession();
  if (!session) throw new Error('Connect a Midnight wallet on Preview before registering a request.');
  try {
    await requirePreviewDust(session);
    const providers = await providersFor(session);
    const compiledContract = makeBlackoutCompiledContract(inactiveWitnesses(), window.location.origin);
    const result = await submitCallTx(providers as any, {
      compiledContract,
      contractAddress,
      circuitId: 'register_verification_request',
      args: [input.requestId, input.requiredIncome, input.verifierPublicKey, input.timestamp],
      privateStateId: BLACKOUT_PRIVATE_STATE_ID,
    });
    const txId = String(result.public.txId || '').trim();
    const blockHeight = Number(result.public.blockHeight);
    if (!txId || !Number.isSafeInteger(blockHeight) || blockHeight < 0) {
      throw new Error('Midnight returned an incomplete request-registration receipt.');
    }
    return { txId, blockHeight };
  } catch (error: unknown) {
    throw new Error(safeMidnightError(error, 'Midnight Preview request-registration transaction failed.'));
  }
}
