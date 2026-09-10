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
const CONTRACT_ADDRESS_STORAGE_KEY = 'blackout_midnight_preview_contract_address_v1';

function readPersistedContractAddress(): string {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return '';
    const stored = window.localStorage.getItem(CONTRACT_ADDRESS_STORAGE_KEY)?.trim() || '';
    return /^[0-9a-fA-F]{64}$/.test(stored) ? stored : '';
  } catch {
    return '';
  }
}

function persistContractAddress(address: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage && /^[0-9a-fA-F]{64}$/.test(address)) {
      window.localStorage.setItem(CONTRACT_ADDRESS_STORAGE_KEY, address);
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

const toHex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
const fromHex = (value: string) => {
  const hex = value.startsWith('0x') ? value.slice(2) : value;
  if (!/^[0-9a-f]{2,}$/i.test(hex) || hex.length % 2 !== 0) {
    throw new Error('Wallet returned an invalid serialized Midnight transaction.');
  }
  return new Uint8Array(hex.match(/.{2}/g)!.map(byte => Number.parseInt(byte, 16)));
};

/**
 * Extract only safe diagnostic fields. Never stringify arbitrary wallet/SDK
 * objects because they may contain transaction or private-state material.
 */
function safeMidnightError(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim()) return error;
  if (error instanceof Error) {
    if (error.message?.trim()) return error.message;
    const cause = error.cause;
    if (cause && cause !== error) return safeMidnightError(cause, fallback);
    if (error.name && error.name !== 'Error') return error.name;
  }
  if (typeof error === 'object' && error !== null) {
    const value = error as Record<string, unknown>;
    const fields = ['reason', 'message', 'code', 'type', '_tag', 'name'] as const;
    const parts = fields
      .map((field) => typeof value[field] === 'string' && value[field] ? `${field}: ${value[field]}` : '')
      .filter(Boolean);
    if (parts.length > 0) return parts.join(' | ');
    if (value.cause && value.cause !== error) return safeMidnightError(value.cause, fallback);
  }
  return fallback;
}

function readDustBalance(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return BigInt(Math.trunc(value));
  if (typeof value === 'string' && /^\d+$/.test(value)) return BigInt(value);
  if (typeof value === 'object' && value !== null && 'balance' in value) {
    return readDustBalance((value as { balance: unknown }).balance);
  }
  throw new Error('Lace returned an unreadable DUST balance for Midnight Preview.');
}

async function requirePreviewDust(session: LaceSession): Promise<void> {
  if (session.networkId !== 'preview') {
    throw new Error(`Blackout Pay LIVE is locked to Midnight Preview testnet; Lace is connected to "${session.networkId}".`);
  }
  if (typeof session.wallet.getDustBalance !== 'function') {
    throw new Error('Connected Lace API does not expose getDustBalance(). Update Lace and reconnect on Midnight Preview.');
  }
  const dust = readDustBalance(await session.wallet.getDustBalance());
  if (dust <= 0n) {
    throw new Error(
      'Lace reports 0 DUST on Midnight Preview. Your tNIGHT is testnet funding, but a fee-paying testnet contract deployment needs generated DUST. Register/delegate the tNIGHT for DUST generation in Lace, wait until DUST is above 0, then retry.'
    );
  }
}

/** A session-only provider: income witnesses never enter browser storage. */
function sessionPrivateStateProvider(): PrivateStateProvider<string, BlackoutPrivateState> {
  const states = new Map<string, BlackoutPrivateState>();
  const signingKeys = new Map<string, SigningKey>();
  let contractAddress = '';
  const key = (id: string) => `${contractAddress}:${id}`;
  return {
    setContractAddress(address: ContractAddress) { contractAddress = String(address); },
    async get(id) { return states.get(key(id)) ?? null; },
    async set(id, state) { states.set(key(id), state); },
    async remove(id) { states.delete(key(id)); },
    async clear() { states.clear(); },
    async setSigningKey(address, signingKey) { signingKeys.set(String(address), signingKey); },
    async getSigningKey(address) { return signingKeys.get(String(address)) ?? null; },
    async removeSigningKey(address) { signingKeys.delete(String(address)); },
    async clearSigningKeys() { signingKeys.clear(); },
    async exportPrivateStates() { throw new Error('Private witness export is disabled for Blackout Pay.'); },
    async importPrivateStates() { throw new Error('Private witness import is disabled for Blackout Pay.'); },
    async exportSigningKeys() { throw new Error('Signing-key export is disabled for Blackout Pay.'); },
    async importSigningKeys() { throw new Error('Signing-key import is disabled for Blackout Pay.'); },
  } as PrivateStateProvider<string, BlackoutPrivateState>;
}

async function providersFor(session: LaceSession) {
  const { wallet, configuration, addresses } = session;
  if (!configuration.indexerUri || !configuration.indexerWsUri) {
    throw new Error('Lace did not provide the required Midnight Preview indexer endpoints.');
  }
  if (!addresses.shieldedCoinPublicKey || !addresses.shieldedEncryptionPublicKey) {
    throw new Error('Lace did not provide shielded coin and encryption public keys.');
  }
  if (typeof wallet.getProvingProvider !== 'function') {
    throw new Error('Lace does not expose DApp Connector v4 wallet-delegated proving. Update Lace and reconnect.');
  }

  setNetworkId(session.networkId);
  const zkConfigProvider = new FetchZkConfigProvider(window.location.origin, fetch.bind(window));

  // DApp Connector API v4 deprecates direct use of proverServerUri. Delegate
  // proving through Lace so the wallet uses the user's configured Preview
  // proving infrastructure (localhost:6300 in this test setup) while key
  // material still comes from this Vercel origin.
  const provingProvider = await wallet.getProvingProvider(zkConfigProvider.asKeyMaterialProvider());
  const proofProvider = createProofProvider(provingProvider);

  const walletProvider: WalletProvider = {
    getCoinPublicKey: () => addresses.shieldedCoinPublicKey as ledger.CoinPublicKey,
    getEncryptionPublicKey: () => addresses.shieldedEncryptionPublicKey as ledger.EncPublicKey,
    async balanceTx(tx) {
      try {
        const result = await wallet.balanceUnsealedTransaction(toHex(tx.serialize()), { payFees: true });
        return ledger.Transaction.deserialize('signature', 'proof', 'binding', fromHex(result.tx)) as ledger.FinalizedTransaction;
      } catch (error: unknown) {
        throw new Error(safeMidnightError(error, 'Lace failed to balance the Midnight Preview testnet transaction.'));
      }
    },
  };

  const midnightProvider: MidnightProvider = {
    async submitTx(tx) {
      try {
        await wallet.submitTransaction(toHex(tx.serialize()));
        return tx.identifiers()[0];
      } catch (error: unknown) {
        throw new Error(safeMidnightError(error, 'Lace failed to submit the Midnight Preview testnet transaction.'));
      }
    },
  };

  return {
    privateStateProvider: sessionPrivateStateProvider(),
    zkConfigProvider,
    proofProvider,
    publicDataProvider: indexerPublicDataProvider(configuration.indexerUri, configuration.indexerWsUri),
    walletProvider,
    midnightProvider,
  };
}

function inactiveWitnesses(): BlackoutWitnesses {
  const unavailable = () => { throw new Error('This contract operation requires a private income witness.'); };
  return { get_private_monthly_income: unavailable, get_private_income_salt: unavailable };
}

function witnessCallbacks(witness: PrivateIncomeWitness): BlackoutWitnesses {
  if (witness.salt.length !== 32) throw new Error('Income salt must be exactly 32 bytes.');
  return {
    get_private_monthly_income: context => [context.privateState, witness.monthlyIncome],
    get_private_income_salt: context => [context.privateState, witness.salt],
  };
}

export async function deployBlackoutContract() {
  const session = getActiveLaceSession();
  if (!session) throw new Error('Connect Midnight Lace on Preview before deploying.');
  try {
    await requirePreviewDust(session);
    const providers = await providersFor(session);
    const compiledContract = makeBlackoutCompiledContract(inactiveWitnesses(), window.location.origin);
    const deployed = await deployContract(providers as any, {
      compiledContract,
      privateStateId: BLACKOUT_PRIVATE_STATE_ID,
      initialPrivateState: {},
    });
    activeContractAddress = String(deployed.deployTxData.public.contractAddress);
    persistContractAddress(activeContractAddress);
    return { contractAddress: activeContractAddress, txId: String(deployed.deployTxData.public.txId) };
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
  if (input.requestId.length !== 32 || input.verifierPublicKey.length !== 32) {
    throw new Error('The generated Compact circuit requires 32-byte request and verifier public keys.');
  }
  const session = getActiveLaceSession();
  if (!session) throw new Error('Connect Midnight Lace on Preview before proving.');
  try {
    await requirePreviewDust(session);
    const providers = await providersFor(session);
    const compiledContract = makeBlackoutCompiledContract(witnessCallbacks(input.witness), window.location.origin);
    const result = await submitCallTx(providers as any, {
      compiledContract,
      contractAddress: input.contractAddress,
      circuitId: 'prove_income_threshold',
      args: [input.requestId, input.requiredIncome, input.verifierPublicKey, input.timestamp],
      privateStateId: BLACKOUT_PRIVATE_STATE_ID,
    });
    return { txId: String(result.public.txId), blockHeight: Number(result.public.blockHeight) };
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
  if (input.requestId.length !== 32 || input.verifierPublicKey.length !== 32) {
    throw new Error('The generated Compact circuit requires 32-byte request and verifier public keys.');
  }
  const session = getActiveLaceSession();
  if (!session) throw new Error('Connect Midnight Lace on Preview before registering a request.');
  try {
    await requirePreviewDust(session);
    const providers = await providersFor(session);
    const compiledContract = makeBlackoutCompiledContract(inactiveWitnesses(), window.location.origin);
    const result = await submitCallTx(providers as any, {
      compiledContract,
      contractAddress: input.contractAddress,
      circuitId: 'register_verification_request',
      args: [input.requestId, input.requiredIncome, input.verifierPublicKey, input.timestamp],
      privateStateId: BLACKOUT_PRIVATE_STATE_ID,
    });
    return { txId: String(result.public.txId), blockHeight: Number(result.public.blockHeight) };
  } catch (error: unknown) {
    throw new Error(safeMidnightError(error, 'Midnight Preview request-registration transaction failed.'));
  }
}
