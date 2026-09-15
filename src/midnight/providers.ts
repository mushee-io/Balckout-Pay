/**
 * @file src/midnight/providers.ts
 * Real Midnight Network Provider Configuration & GraphQL Ledger Client.
 */

import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { ledger } from '../../contract/build/contract/index.js';
import { getActiveLaceSession } from './wallet-connector';

const CONTRACT_ADDRESS_STORAGE_KEY = 'blackout_midnight_preview_contract_address_v2';

export interface MidnightConfig {
  networkId: string;
  nodeRpcUrl: string;
  indexerUrl: string;
  indexerWsUrl: string;
  proofServerUrl: string;
  contractAddress: string;
}

function normalizeContractAddress(value: string): string {
  const clean = value?.trim().replace(/^0x/i, '') ?? '';
  if (!clean) return '';
  return /^[0-9a-fA-F]{64}$/.test(clean) ? clean.toLowerCase() : '';
}

function readPersistedContractAddress(): string {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return '';
    return normalizeContractAddress(window.localStorage.getItem(CONTRACT_ADDRESS_STORAGE_KEY) || '');
  } catch {
    return '';
  }
}

function bytes32ToHex(value: Uint8Array): string {
  if (!(value instanceof Uint8Array) || value.length !== 32) {
    throw new Error('Decoded Compact Bytes<32> value has an invalid length.');
  }
  return Array.from(value, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function bigintToSafeNumber(value: bigint, label: string): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${label} exceeds JavaScript safe integer bounds.`);
  }
  return Number(value);
}

function unixSecondsToMs(value: bigint, label: string): number {
  const seconds = bigintToSafeNumber(value, label);
  const millis = seconds * 1000;
  if (!Number.isSafeInteger(millis)) throw new Error(`${label} exceeds safe timestamp bounds.`);
  return millis;
}

export function getMidnightConfig(): MidnightConfig {
  const isMeta = typeof import.meta !== 'undefined' && import.meta.env;
  const isProc = typeof process !== 'undefined' && process.env;

  const networkId =
    (isMeta && import.meta.env.VITE_MIDNIGHT_NETWORK_ID) ||
    (isProc && process.env.MIDNIGHT_NETWORK_ID) ||
    '';
  const nodeRpcUrl =
    (isMeta && import.meta.env.VITE_MIDNIGHT_NODE_URL) ||
    (isProc && process.env.MIDNIGHT_NODE_URL) ||
    '';
  const indexerUrl =
    (isMeta && import.meta.env.VITE_MIDNIGHT_INDEXER_URL) ||
    (isProc && process.env.MIDNIGHT_INDEXER_URL) ||
    '';
  const indexerWsUrl =
    (isMeta && import.meta.env.VITE_MIDNIGHT_INDEXER_WS_URL) ||
    (isProc && process.env.MIDNIGHT_INDEXER_WS_URL) ||
    '';
  const proofServerUrl =
    (isMeta && import.meta.env.VITE_MIDNIGHT_PROOF_SERVER_URL) ||
    (isProc && process.env.MIDNIGHT_PROOF_SERVER_URL) ||
    '';

  const persistedContractAddress = readPersistedContractAddress();
  const configuredContractAddress = normalizeContractAddress(
    (isMeta && import.meta.env.VITE_MIDNIGHT_CONTRACT_ADDRESS) ||
    (isProc && process.env.MIDNIGHT_CONTRACT_ADDRESS) ||
    ''
  );

  return {
    networkId,
    nodeRpcUrl,
    indexerUrl,
    indexerWsUrl,
    proofServerUrl,
    contractAddress: persistedContractAddress || configuredContractAddress,
  };
}

/**
 * LIVE browser reads must use the exact Preview indexer exposed by the active
 * wallet session. Static env values are only a fallback for non-wallet tooling.
 * This keeps writes and reads on the same network/indexer.
 */
function getLiveIndexerEndpoints(): { indexerUrl: string; indexerWsUrl: string } {
  const session = getActiveLaceSession();
  if (session) {
    if (session.networkId !== 'preview') {
      throw new Error(`Blackout Pay LIVE is locked to Midnight Preview; connected wallet is on "${session.networkId}".`);
    }
    const indexerUrl = session.configuration?.indexerUri?.trim() || '';
    const indexerWsUrl = session.configuration?.indexerWsUri?.trim() || '';
    if (indexerUrl) return { indexerUrl, indexerWsUrl };
    throw new Error('Connected Midnight Preview wallet did not provide an indexer endpoint. Reconnect the wallet and retry.');
  }

  const config = getMidnightConfig();
  return {
    indexerUrl: config.indexerUrl.trim(),
    indexerWsUrl: config.indexerWsUrl.trim(),
  };
}

export function assertLiveMidnightConfig(config: MidnightConfig = getMidnightConfig()): MidnightConfig {
  const required: Array<[string, string]> = [
    ['MIDNIGHT_NETWORK_ID', config.networkId],
    ['MIDNIGHT_NODE_URL', config.nodeRpcUrl],
    ['MIDNIGHT_INDEXER_URL', config.indexerUrl],
    ['MIDNIGHT_CONTRACT_ADDRESS', config.contractAddress],
  ];
  const missing = required.filter(([, value]) => !value?.trim()).map(([key]) => key);
  if (missing.length) {
    throw new Error(`LIVE mode requires Midnight configuration: ${missing.join(', ')}.`);
  }
  if (config.networkId !== 'preview') {
    throw new Error(`Blackout Pay LIVE is locked to Midnight Preview; configured network is "${config.networkId}".`);
  }
  if (!normalizeContractAddress(config.contractAddress)) {
    throw new Error('MIDNIGHT_CONTRACT_ADDRESS is not a valid 32-byte Midnight contract address.');
  }
  return config;
}

try {
  const config = getMidnightConfig();
  if (config.networkId) setNetworkId(config.networkId);
} catch {
  // Network is initialized by the connected wallet if static config is absent.
}

/** Legacy direct proof-server helper. LIVE wallet-delegated proving does not require it. */
export function getProofProvider(zkArtifactsBaseUrl: string = 'http://localhost:3000/zk-artifacts') {
  const config = getMidnightConfig();
  if (!config.proofServerUrl) throw new Error('MIDNIGHT_PROOF_SERVER_URL is required for direct proof-provider mode.');
  const zkConfigProvider = new FetchZkConfigProvider(zkArtifactsBaseUrl);
  return httpClientProofProvider(config.proofServerUrl, zkConfigProvider);
}

export function getPublicDataProvider() {
  const { indexerUrl, indexerWsUrl } = getLiveIndexerEndpoints();
  if (!indexerUrl || !indexerWsUrl) {
    throw new Error('Midnight Preview indexer HTTP and WebSocket endpoints are required for LIVE indexer access.');
  }
  return indexerPublicDataProvider(indexerUrl, indexerWsUrl);
}

export interface OnChainVerificationItem {
  requestId: string;
  requiredIncome: number;
  isVerified: boolean;
  timestamp: number;
  verifierPk: string;
  commitment: string;
}

/**
 * Read finalized verification results using MidnightJS' supported public-data
 * provider. This avoids depending on a hand-written GraphQL state shape and
 * keeps the frontend aligned with the wallet's Preview indexer API version.
 */
export async function fetchOnChainContractRecords(contractAddress: string): Promise<OnChainVerificationItem[]> {
  const cleanAddress = normalizeContractAddress(contractAddress);
  if (!cleanAddress) return [];

  const provider = getPublicDataProvider();
  const contractState = await provider.queryContractState(cleanAddress as any);
  if (!contractState) return [];

  const contractLedger = ledger(contractState.data);

  const resultsByRequest = new Map<string, any>();
  for (const [, result] of contractLedger.results) {
    const requestId = bytes32ToHex(result.request_id);
    resultsByRequest.set(requestId, result);
  }

  const items: OnChainVerificationItem[] = [];
  for (const [, record] of contractLedger.records) {
    const requestId = bytes32ToHex(record.request_id);
    const result = resultsByRequest.get(requestId);
    if (!result) continue;

    if (bytes32ToHex(result.request_id) !== requestId) {
      throw new Error('Midnight result/request identifier mismatch detected while decoding ledger state.');
    }
    if (BigInt(result.required_income) !== BigInt(record.required_income)) {
      throw new Error('Midnight result threshold does not match immutable request registration.');
    }
    if (bytes32ToHex(result.verifier_pk) !== bytes32ToHex(record.verifier_pk)) {
      throw new Error('Midnight result verifier does not match immutable request registration.');
    }

    items.push({
      requestId,
      requiredIncome: bigintToSafeNumber(BigInt(record.required_income), 'Required income'),
      isVerified: Boolean(result.is_verified),
      timestamp: unixSecondsToMs(BigInt(record.timestamp), 'Registration timestamp'),
      verifierPk: `0x${bytes32ToHex(record.verifier_pk)}`,
      commitment: `0x${bytes32ToHex(result.commitment)}`,
    });
  }

  return items;
}

export async function checkProofServerHealth(): Promise<{ ok: boolean; statusText: string }> {
  const config = getMidnightConfig();
  if (!config.proofServerUrl) return { ok: false, statusText: 'WALLET-DELEGATED / NOT CONFIGURED' };
  try {
    const res = await fetch(`${config.proofServerUrl}/`);
    return { ok: res.ok, statusText: res.ok ? 'ONLINE' : `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, statusText: err instanceof Error ? err.message.slice(0, 200) : 'UNREACHABLE' };
  }
}

export async function checkRpcHealth(): Promise<{ ok: boolean; peers?: number; isSyncing?: boolean }> {
  const config = getMidnightConfig();
  if (!config.nodeRpcUrl) return { ok: false };
  try {
    const res = await fetch(config.nodeRpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'system_health', params: [] }),
    });
    if (!res.ok) return { ok: false };
    const data: any = await res.json();
    if (data?.result) return { ok: true, peers: data.result.peers, isSyncing: data.result.isSyncing };
  } catch {
    // Health checks are informational only.
  }
  return { ok: false };
}

export async function checkIndexerHealth(): Promise<{ ok: boolean; blockHeight?: number }> {
  let indexerUrl = '';
  try {
    indexerUrl = getLiveIndexerEndpoints().indexerUrl;
  } catch {
    return { ok: false };
  }
  if (!indexerUrl) return { ok: false };

  try {
    const res = await fetch(indexerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ block { height hash } }' }),
    });
    if (!res.ok) return { ok: false };
    const data: any = await res.json();
    const height = Number(data?.data?.block?.height);
    if (Number.isSafeInteger(height) && height >= 0) return { ok: true, blockHeight: height };
  } catch {
    // Health checks are informational only.
  }
  return { ok: false };
}
