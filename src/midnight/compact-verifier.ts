/**
 * @file compact-verifier.ts
 * Manages Compact smart contract interaction, Midnight Indexer queries,
 * and isolated demo sandbox ledger state.
 * 
 * In DEMO mode: Uses in-memory sandbox requests for local testing.
 * In LIVE mode: Connects to the real Midnight GraphQL Indexer on Midnight Preview.
 */

import { ExecutionMode, VerificationRequest, ZkProofResult } from './types';
import { DEPLOYED_CONTRACT_ADDRESS } from './zk-engine';

export const MIDNIGHT_INDEXER_GRAPHQL_URL = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MIDNIGHT_INDEXER_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_MIDNIGHT_INDEXER_URL) ||
  'https://indexer.preview.midnight.network/api/v3/graphql';

export const INITIAL_DEMO_REQUESTS: VerificationRequest[] = [
  {
    id: 'req_rental_affordability_9821',
    title: 'Flat 4B, King\'s Cross - Tenancy Affordability',
    purpose: 'Rental Affordability',
    requiredIncome: 2500,
    currency: 'GBP',
    verifierName: 'Apex Residential Lettings Ltd',
    verifierAddress: 'mn_addr_test1q88...e94f',
    createdAt: Date.now() - 3600000 * 2,
    status: 'PENDING',
    notes: 'Landlord affordability check: applicant must prove monthly net income ≥ £2,500.',
    isLiveOnChain: false,
  },
  {
    id: 'req_mortgage_prequal_4190',
    title: 'Pre-Approved Homebuyer Certificate',
    purpose: 'Mortgage Pre-Qualification',
    requiredIncome: 4000,
    currency: 'GBP',
    verifierName: 'Mayfair Heritage Lending',
    verifierAddress: 'mn_addr_test1q44...a811',
    createdAt: Date.now() - 86400000,
    status: 'PENDING',
    notes: 'Tier 1 Prime Mortgage screening threshold: £4,000/month.',
    isLiveOnChain: false,
  }
];

/**
 * Query real on-chain contract events from Midnight Preview Indexer
 */
export async function fetchLiveContractState(contractAddress: string): Promise<unknown> {
  if (!contractAddress) return null;
  const query = `
    query GetContractState($address: HexEncoded!) {
      contract(address: $address) {
        address
        state
        maintenanceAuthority
      }
    }
  `;
  const res = await fetch(MIDNIGHT_INDEXER_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { address: contractAddress } }),
  });
  if (!res.ok) {
    throw new Error(`Midnight Indexer error: ${res.statusText}`);
  }
  return res.json();
}

export class CompactContractLedger {
  // DEMO sandbox ledger (isolated)
  private demoRequests: Map<string, VerificationRequest> = new Map();

  constructor() {
    INITIAL_DEMO_REQUESTS.forEach(req => this.demoRequests.set(req.id, req));
  }

  public getRequests(mode: ExecutionMode = 'DEMO'): VerificationRequest[] {
    if (mode === 'LIVE') {
      // In LIVE mode: Do NOT return mock requests.
      // If contract is not deployed yet on Midnight Preview, return empty on-chain list.
      if (!DEPLOYED_CONTRACT_ADDRESS) {
        return [];
      }
      // When contract is deployed, on-chain requests are indexed from the Midnight GraphQL Indexer
      return [];
    }

    return Array.from(this.demoRequests.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public getRequest(id: string, mode: ExecutionMode = 'DEMO'): VerificationRequest | undefined {
    if (mode === 'LIVE') {
      return undefined;
    }
    return this.demoRequests.get(id);
  }

  public registerRequest(
    req: Omit<VerificationRequest, 'id' | 'createdAt' | 'status'>,
    mode: ExecutionMode = 'DEMO'
  ): VerificationRequest {
    if (mode === 'LIVE') {
      if (!DEPLOYED_CONTRACT_ADDRESS) {
        throw new Error(
          'Live on-chain registration requires a deployed contract address on Midnight Preview. Contract is currently undeployed.'
        );
      }
      throw new Error(
        'Live on-chain registration must be submitted as a transaction via the connected Midnight Lace wallet to the Midnight Preview node.'
      );
    }

    const id = `req_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString().slice(-4)}`;
    const newRequest: VerificationRequest = {
      ...req,
      id,
      createdAt: Date.now(),
      status: 'PENDING',
      isLiveOnChain: false,
    };

    this.demoRequests.set(id, newRequest);
    return newRequest;
  }

  public recordProofResult(requestId: string, proof: ZkProofResult, mode: ExecutionMode = 'DEMO'): VerificationRequest {
    if (mode === 'LIVE') {
      if (!DEPLOYED_CONTRACT_ADDRESS) {
        throw new Error('Cannot record live proof: Midnight contract address is unset (pending deployment).');
      }
      throw new Error(
        'Live verification transactions must be submitted directly to the Midnight network node via Lace wallet.'
      );
    }

    const req = this.demoRequests.get(requestId);
    if (!req) {
      throw new Error(`Request ${requestId} not found in demo ledger`);
    }

    const updated: VerificationRequest = {
      ...req,
      status: proof.isVerified ? 'VERIFIED' : 'REJECTED',
      proofResult: proof,
      isLiveOnChain: false
    };
    this.demoRequests.set(requestId, updated);
    return updated;
  }
}

export const compactLedger = new CompactContractLedger();

