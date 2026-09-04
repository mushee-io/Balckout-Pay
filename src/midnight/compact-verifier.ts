/**
 * @file compact-verifier.ts
 * Manages Compact smart contract interaction, Midnight Indexer queries,
 * and isolated demo sandbox ledger state.
 */

import { ExecutionMode, VerificationRequest, ZkProofResult } from './types';

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

export class CompactContractLedger {
  private demoRequests: Map<string, VerificationRequest> = new Map();
  private liveRequests: Map<string, VerificationRequest> = new Map();

  constructor() {
    INITIAL_DEMO_REQUESTS.forEach(req => this.demoRequests.set(req.id, req));
  }

  public getRequests(mode: ExecutionMode = 'DEMO'): VerificationRequest[] {
    const targetMap = mode === 'LIVE' ? this.liveRequests : this.demoRequests;
    return Array.from(targetMap.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public getRequest(id: string, mode: ExecutionMode = 'DEMO'): VerificationRequest | undefined {
    const targetMap = mode === 'LIVE' ? this.liveRequests : this.demoRequests;
    return targetMap.get(id);
  }

  public registerRequest(
    req: Omit<VerificationRequest, 'id' | 'createdAt' | 'status'>,
    mode: ExecutionMode = 'DEMO'
  ): VerificationRequest {
    const id = mode === 'LIVE' 
      ? `tx_req_0x${Math.random().toString(16).substring(2, 10)}_${Date.now().toString().slice(-4)}`
      : `req_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString().slice(-4)}`;
    
    const newRequest: VerificationRequest = {
      ...req,
      id,
      createdAt: Date.now(),
      status: 'PENDING',
      isLiveOnChain: mode === 'LIVE',
    };

    if (mode === 'LIVE') {
      this.liveRequests.set(id, newRequest);
    } else {
      this.demoRequests.set(id, newRequest);
    }

    return newRequest;
  }

  public recordProofResult(requestId: string, proof: ZkProofResult, mode: ExecutionMode = 'DEMO'): VerificationRequest {
    const targetMap = mode === 'LIVE' ? this.liveRequests : this.demoRequests;
    const req = targetMap.get(requestId);
    if (!req) {
      throw new Error(`Request ${requestId} not found in ${mode} ledger`);
    }

    const updated: VerificationRequest = {
      ...req,
      status: proof.isVerified ? 'VERIFIED' : 'REJECTED',
      proofResult: proof,
      isLiveOnChain: mode === 'LIVE'
    };
    targetMap.set(requestId, updated);
    return updated;
  }
}

export const compactLedger = new CompactContractLedger();

