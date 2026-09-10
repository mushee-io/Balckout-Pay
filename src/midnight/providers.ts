/**
 * @file src/midnight/providers.ts
 * Real Midnight Network Provider Configuration & GraphQL Ledger Client.
 * 
 * Binds directly to official @midnight-ntwrk packages:
 * - @midnight-ntwrk/midnight-js-http-client-proof-provider
 * - @midnight-ntwrk/midnight-js-indexer-public-data-provider
 * - @midnight-ntwrk/midnight-js-network-id
 * - @midnight-ntwrk/compact-runtime
 * - Generated contract bindings from contract/build/contract/index.js
 */

import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { StateValue } from '@midnight-ntwrk/compact-runtime';
import { ledger, VerificationRecord } from '../../contract/build/contract/index.js';

export interface MidnightConfig {
  networkId: string;
  nodeRpcUrl: string;
  indexerUrl: string;
  indexerWsUrl: string;
  proofServerUrl: string;
  contractAddress: string;
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

  const contractAddress = 
    (isMeta && import.meta.env.VITE_MIDNIGHT_CONTRACT_ADDRESS) ||
    (isProc && process.env.MIDNIGHT_CONTRACT_ADDRESS) ||
    '';

  return {
    networkId,
    nodeRpcUrl,
    indexerUrl,
    indexerWsUrl,
    proofServerUrl,
    contractAddress
  };
}

export function assertLiveMidnightConfig(config: MidnightConfig = getMidnightConfig()): MidnightConfig {
  const required: Array<[string, string]> = [
    ['MIDNIGHT_NETWORK_ID', config.networkId],
    ['MIDNIGHT_NODE_URL', config.nodeRpcUrl],
    ['MIDNIGHT_INDEXER_URL', config.indexerUrl],
    ['MIDNIGHT_PROOF_SERVER_URL', config.proofServerUrl],
    ['MIDNIGHT_CONTRACT_ADDRESS', config.contractAddress],
  ];
  const missing = required.filter(([, value]) => !value?.trim()).map(([key]) => key);
  if (missing.length) {
    throw new Error(`LIVE mode requires wallet-verified Midnight configuration: ${missing.join(', ')}.`);
  }
  return config;
}

// Initialize network ID globally on load
try {
  const config = getMidnightConfig();
  if (config.networkId) setNetworkId(config.networkId);
} catch {
  // Already configured or handled
}

/**
 * Initialize official Midnight proof provider connected to proof server
 */
export function getProofProvider(zkArtifactsBaseUrl: string = 'http://localhost:3000/zk-artifacts') {
  const config = getMidnightConfig();
  if (!config.proofServerUrl) throw new Error('MIDNIGHT_PROOF_SERVER_URL is required for LIVE proving.');
  const zkConfigProvider = new FetchZkConfigProvider(zkArtifactsBaseUrl);
  return httpClientProofProvider(config.proofServerUrl, zkConfigProvider);
}

/**
 * Initialize official Midnight public data provider connected to preview indexer
 */
export function getPublicDataProvider() {
  const config = getMidnightConfig();
  if (!config.indexerUrl || !config.indexerWsUrl) {
    throw new Error('MIDNIGHT_INDEXER_URL and MIDNIGHT_INDEXER_WS_URL are required for LIVE indexer access.');
  }
  return indexerPublicDataProvider(config.indexerUrl, config.indexerWsUrl);
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
 * Reads real on-chain ledger state for the deployed income_verifier contract
 * directly from the Midnight GraphQL Indexer and decodes via compact-runtime StateValue.
 */
export async function fetchOnChainContractRecords(contractAddress: string): Promise<OnChainVerificationItem[]> {
  if (!contractAddress || contractAddress.trim() === '') {
    return [];
  }

  const config = getMidnightConfig();
  if (!config.indexerUrl) throw new Error('MIDNIGHT_INDEXER_URL is required for on-chain reads.');
  const query = `
    query GetContractState($address: HexEncoded!) {
      contract(address: $address) {
        address
        state
      }
    }
  `;

  // Normalize hex address
  const cleanAddress = contractAddress.startsWith('0x') ? contractAddress.slice(2) : contractAddress;

  const res = await fetch(config.indexerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { address: cleanAddress }
    })
  });

  if (!res.ok) {
    throw new Error(`Failed to query Midnight Indexer: ${res.statusText}`);
  }

  const json: any = await res.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(`Midnight GraphQL error: ${json.errors[0].message}`);
  }

  const contractData = json.data?.contract;
  if (!contractData || !contractData.state) {
    return [];
  }

  try {
    const stateHex = contractData.state.startsWith('0x') ? contractData.state.slice(2) : contractData.state;
    const stateBytes = new Uint8Array(
      stateHex.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []
    );

    // Decode StateValue via official compact-runtime
    const decodedState = StateValue.decode(stateBytes as any);
    const contractLedger = ledger(decodedState);

    const items: OnChainVerificationItem[] = [];
    for (const [keyBytes, record] of contractLedger.records) {
      const reqIdStr = new TextDecoder().decode(record.request_id).replace(/\0/g, '').trim() ||
        '0x' + Array.from(record.request_id).map(b => b.toString(16).padStart(2, '0')).join('');

      const verifierHex = '0x' + Array.from(record.verifier_pk).map(b => b.toString(16).padStart(2, '0')).join('');
      const commitmentHex = '0x' + Array.from(record.commitment).map(b => b.toString(16).padStart(2, '0')).join('');

      items.push({
        requestId: reqIdStr,
        requiredIncome: Number(record.required_income),
        isVerified: record.is_verified,
        timestamp: Number(record.timestamp),
        verifierPk: verifierHex,
        commitment: commitmentHex
      });
    }

    return items;
  } catch (err) {
    console.error('Failed to parse on-chain contract ledger state:', err);
    return [];
  }
}

/**
 * Diagnostics / Health checks
 */
export async function checkProofServerHealth(): Promise<{ ok: boolean; statusText: string }> {
  const config = getMidnightConfig();
  try {
    const res = await fetch(`${config.proofServerUrl}/`);
    return { ok: res.ok, statusText: res.ok ? 'ONLINE (Port 6300)' : `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, statusText: err instanceof Error ? err.message : 'UNREACHABLE' };
  }
}

export async function checkRpcHealth(): Promise<{ ok: boolean; peers?: number; isSyncing?: boolean }> {
  const config = getMidnightConfig();
  try {
    const res = await fetch(config.nodeRpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'system_health', params: [] })
    });
    const data: any = await res.json();
    if (data?.result) {
      return { ok: true, peers: data.result.peers, isSyncing: data.result.isSyncing };
    }
  } catch {}
  return { ok: false };
}

export async function checkIndexerHealth(): Promise<{ ok: boolean; blockHeight?: number }> {
  const config = getMidnightConfig();
  try {
    const res = await fetch(config.indexerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ block { height hash } }' })
    });
    const data: any = await res.json();
    if (data?.data?.block?.height) {
      return { ok: true, blockHeight: data.data.block.height };
    }
  } catch {}
  return { ok: false };
}
