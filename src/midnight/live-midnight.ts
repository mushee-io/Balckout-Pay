/**
 * Real Midnight Preview transaction lifecycle.
 *
 * This module deliberately uses the compiler-generated Contract class with
 * MidnightJS 4.1.1.  It contains no transaction or proof simulation.
 */
import { deployContract, submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import * as ledger from '@midnight-ntwrk/midnight-js-protocol/ledger';
import type { MidnightProvider, PrivateStateProvider, WalletProvider } from '@midnight-ntwrk/midnight-js-types';
import type { ContractAddress, SigningKey } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { makeBlackoutCompiledContract, type BlackoutPrivateState, type BlackoutWitnesses } from './compiled-contract';
import { getActiveLaceSession, type LaceSession } from './wallet-connector';

export const BLACKOUT_PRIVATE_STATE_ID = 'blackout-income-verifier-session';
let activeContractAddress = '';

export function getActiveBlackoutContractAddress(): string {
  return activeContractAddress;
}

export interface PrivateIncomeWitness {
  monthlyIncome: bigint;
  salt: Uint8Array;
}

const toHex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
const fromHex = (value: string) => {
  const hex = value.startsWith('0x') ? value.slice(2) : value;
  if (!/^[0-9a-f]{2,}$/i.test(hex) || hex.length % 2 !== 0) throw new Error('Wallet returned an invalid serialized Midnight transaction.');
  return new Uint8Array(hex.match(/.{2}/g)!.map(byte => Number.parseInt(byte, 16)));
};

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

function providersFor(session: LaceSession) {
  const { wallet, configuration, addresses } = session;
  if (!configuration.proverServerUri || !configuration.indexerUri || !configuration.indexerWsUri) {
    throw new Error('Lace did not provide the required Preview proof-server or indexer endpoints.');
  }
  if (!addresses.shieldedCoinPublicKey || !addresses.shieldedEncryptionPublicKey) {
    throw new Error('Lace did not provide shielded coin and encryption public keys.');
  }
  setNetworkId(session.networkId);
  const zkConfigProvider = new FetchZkConfigProvider(window.location.origin, fetch.bind(window));
  const walletProvider: WalletProvider = {
    getCoinPublicKey: () => addresses.shieldedCoinPublicKey as ledger.CoinPublicKey,
    getEncryptionPublicKey: () => addresses.shieldedEncryptionPublicKey as ledger.EncPublicKey,
    async balanceTx(tx) {
      const result = await wallet.balanceUnsealedTransaction(toHex(tx.serialize()), {});
      return ledger.Transaction.deserialize('signature', 'proof', 'binding', fromHex(result.tx)) as ledger.FinalizedTransaction;
    },
  };
  const midnightProvider: MidnightProvider = {
    async submitTx(tx) {
      await wallet.submitTransaction(toHex(tx.serialize()));
      return tx.identifiers()[0];
    },
  };
  return {
    privateStateProvider: sessionPrivateStateProvider(),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(configuration.proverServerUri, zkConfigProvider),
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
  const providers = providersFor(session);
  const compiledContract = makeBlackoutCompiledContract(inactiveWitnesses(), window.location.origin);
  const deployed = await deployContract(providers as any, {
    compiledContract,
    privateStateId: BLACKOUT_PRIVATE_STATE_ID,
    initialPrivateState: {},
  });
  activeContractAddress = String(deployed.deployTxData.public.contractAddress);
  return { contractAddress: activeContractAddress, txId: String(deployed.deployTxData.public.txId) };
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
  const providers = providersFor(session);
  const compiledContract = makeBlackoutCompiledContract(witnessCallbacks(input.witness), window.location.origin);
  const result = await submitCallTx(providers as any, {
    compiledContract,
    contractAddress: input.contractAddress,
    circuitId: 'prove_income_threshold',
    args: [input.requestId, input.requiredIncome, input.verifierPublicKey, input.timestamp],
    privateStateId: BLACKOUT_PRIVATE_STATE_ID,
  });
  return { txId: String(result.public.txId), blockHeight: Number(result.public.blockHeight) };
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
  const providers = providersFor(session);
  const compiledContract = makeBlackoutCompiledContract(inactiveWitnesses(), window.location.origin);
  const result = await submitCallTx(providers as any, {
    compiledContract,
    contractAddress: input.contractAddress,
    circuitId: 'register_verification_request',
    args: [input.requestId, input.requiredIncome, input.verifierPublicKey, input.timestamp],
    privateStateId: BLACKOUT_PRIVATE_STATE_ID,
  });
  return { txId: String(result.public.txId), blockHeight: Number(result.public.blockHeight) };
}
