/**
 * @file src/midnight/compact-verifier.ts
 * Manages Compact smart contract interaction, Midnight Indexer queries,
 * and live on-chain ledger state synchronization.
 * 
 * In LIVE mode: Reads and writes actual Midnight contract state directly from the
 * Midnight GraphQL Indexer and the deployed income_verifier contract on Midnight Preview.
 * In DEMO mode: Uses isolated in-memory sandbox requests for local testing.
 */

import { ExecutionMode, VerificationRequest, ZkProofResult } from './types';
import { getMidnightConfig, fetchOnChainContractRecords, OnChainVerificationItem } from './providers';
import { getActiveLaceSession } from './wallet-connector';
import { generateSecureNonce, hexToBytes32 } from './zk-engine';
import { getActiveBlackoutContractAddress, registerVerificationRequest } from './live-midnight';

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32M_CONST = 0x2bc830a3;
const BECH32_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function bech32Polymod(values: number[]): number {
  let chk = 1;
  for (const value of values) {
    const top = chk >>> 25;
    chk = (((chk & 0x1ffffff) << 5) ^ value) >>> 0;
    for (let i = 0; i < 5; i++) {
      if ((top >>> i) & 1) chk = (chk ^ BECH32_GENERATORS[i]) >>> 0;
    }
  }
  return chk >>> 0;
}

function bech32HrpExpand(hrp: string): number[] {
  const high = Array.from(hrp, (char) => char.charCodeAt(0) >>> 5);
  const low = Array.from(hrp, (char) => char.charCodeAt(0) & 31);
  return [...high, 0, ...low];
}

function convertBech32WordsToBytes(words: number[]): Uint8Array {
  let acc = 0;
  let bits = 0;
  const output: number[] = [];

  for (const value of words) {
    if (value < 0 || value > 31) throw new Error('Invalid Bech32m data word.');
    acc = ((acc << 5) | value) & 0xfff;
    bits += 5;
    while (bits >= 8) {
      bits -= 8;
      output.push((acc >>> bits) & 0xff);
    }
  }

  if (bits >= 5 || ((acc << (8 - bits)) & 0xff) !== 0) {
    throw new Error('Invalid Bech32m padding.');
  }

  return Uint8Array.from(output);
}

/**
 * DApp Connector v4 exposes shieldedCoinPublicKey in Midnight Bech32m form.
 * The Compact circuit needs the underlying Bytes<32>, so decode and checksum-
 * validate it locally. Raw 32-byte hex is also accepted for compatible wallets.
 */
function getLiveVerifierPublicKeyHex(): string {
  const session = getActiveLaceSession();
  if (!session) {
    throw new Error('LIVE registration requires an active Midnight Preview wallet session. Reconnect the wallet and try again.');
  }

  const encodedKey = session.addresses?.shieldedCoinPublicKey;
  if (!encodedKey || typeof encodedKey !== 'string') {
    throw new Error('Connected Midnight wallet did not expose a shielded coin public key for verifier binding.');
  }

  const rawHex = encodedKey.startsWith('0x') ? encodedKey.slice(2) : encodedKey;
  if (/^[0-9a-fA-F]{64}$/.test(rawHex)) {
    return `0x${rawHex.toLowerCase()}`;
  }

  if (encodedKey !== encodedKey.toLowerCase() && encodedKey !== encodedKey.toUpperCase()) {
    throw new Error('Wallet returned a mixed-case Bech32m verifier public key.');
  }

  const value = encodedKey.toLowerCase();
  const separator = value.lastIndexOf('1');
  if (separator <= 0 || separator + 7 > value.length) {
    throw new Error('Wallet returned an invalid Bech32m verifier public key.');
  }

  const hrp = value.slice(0, separator);
  const expectedHrp = session.networkId === 'mainnet'
    ? 'mn_shield-cpk'
    : `mn_shield-cpk_${session.networkId}`;
  if (hrp !== expectedHrp) {
    throw new Error(`Verifier public key network/type mismatch: expected ${expectedHrp}, received ${hrp}.`);
  }

  const words = Array.from(value.slice(separator + 1), (char) => {
    const index = BECH32_CHARSET.indexOf(char);
    if (index === -1) throw new Error('Wallet returned an invalid Bech32m character.');
    return index;
  });

  if (bech32Polymod([...bech32HrpExpand(hrp), ...words]) !== BECH32M_CONST) {
    throw new Error('Wallet verifier public key failed Bech32m checksum validation.');
  }

  const bytes = convertBech32WordsToBytes(words.slice(0, -6));
  if (bytes.length !== 32) {
    throw new Error(`Decoded verifier public key must be 32 bytes; received ${bytes.length}.`);
  }

  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export const INITIAL_DEMO_REQUESTS: VerificationRequest[] = [
  {
    id: 'blk_req_mortgage_4190',
    policyId: 'blk_policy_mortgage_uk_t1',
    title: 'Prime Homebuyer Mortgage Pre-Qualification',
    purpose: 'Mortgage Pre-Qualification',
    requiredIncome: 2500,
    currency: 'GBP',
    rules: [
      {
        id: 'rule_age_18',
        category: 'AGE',
        label: 'Applicant Age ≥ 18',
        operator: 'GTE',
        targetValue: 18,
        displayTarget: '≥ 18 years'
      },
      {
        id: 'rule_inc_2500',
        category: 'INCOME',
        label: 'Monthly Net Income ≥ £2,500',
        operator: 'GTE',
        targetValue: 2500,
        displayTarget: '≥ £2,500/mo'
      },
      {
        id: 'rule_country_uk',
        category: 'RESIDENCY',
        label: 'Primary Tax Residency: United Kingdom',
        operator: 'EQ',
        targetValue: 'UK',
        displayTarget: 'United Kingdom (UK)'
      }
    ],
    verifierName: 'Mayfair Heritage Lending Group',
    verifierAddress: 'mn_addr_test1q44mayfairheritage811lender',
    createdAt: Date.now() - 86400000 * 2,
    expiresAt: Date.now() + 86400000 * 28,
    nonce: '8c91a03f4e2b6d19a4e7021c9b33a84f09d2e11894a733bc50e29d714b99aa12',
    policyHash: '0x3f4a9b2184de01c98342719aebc1928374659018234857692018273645019283',
    status: 'PENDING',
    notes: 'Standard Tier-1 mortgage qualification criteria: adult status, £2,500/mo baseline affordability, and UK tax residence.',
    isLiveOnChain: false,
  },
  {
    id: 'blk_req_rental_9821',
    policyId: 'blk_policy_rental_kcross_98',
    title: 'Flat 4B, King\'s Cross - Tenancy Affordability',
    purpose: 'Rental Affordability',
    requiredIncome: 2500,
    currency: 'GBP',
    rules: [
      {
        id: 'rule_inc_rent_2500',
        category: 'INCOME',
        label: 'Monthly Net Income ≥ £2,500',
        operator: 'GTE',
        targetValue: 2500,
        displayTarget: '≥ £2,500/mo'
      },
      {
        id: 'rule_emp_employed',
        category: 'EMPLOYMENT',
        label: 'Employment Status: Employed or Self-Employed',
        operator: 'EQ',
        targetValue: 'EMPLOYED',
        displayTarget: 'Active Employment'
      },
      {
        id: 'rule_res_uk',
        category: 'RESIDENCY',
        label: 'Residency: United Kingdom',
        operator: 'EQ',
        targetValue: 'UK',
        displayTarget: 'UK Resident'
      }
    ],
    verifierName: 'Apex Residential Lettings Ltd',
    verifierAddress: 'mn_addr_test1q88apexlettings2500req',
    createdAt: Date.now() - 3600000 * 4,
    expiresAt: Date.now() + 86400000 * 14,
    nonce: '3b8f102a94dc8811e7a0219c4b73a64f09d2e11894a733bc50e29d714b99bb34',
    policyHash: '0x12a84b9c83719028471928374650192837465918273645019283746501928374',
    status: 'PENDING',
    notes: 'Landlord affordability check: applicant proves monthly net income ≥ £2,500, active employment, and UK residency.',
    isLiveOnChain: false,
  },
  {
    id: 'blk_req_accredited_3302',
    policyId: 'blk_policy_accredited_investor_v1',
    title: 'Private Syndicate & Credit Facility Access',
    purpose: 'Accredited Investor Access',
    requiredIncome: 5000,
    currency: 'GBP',
    rules: [
      {
        id: 'rule_inc_acc_5000',
        category: 'INCOME',
        label: 'Monthly Net Income ≥ £5,000',
        operator: 'GTE',
        targetValue: 5000,
        displayTarget: '≥ £5,000/mo'
      },
      {
        id: 'rule_balance_25k',
        category: 'BANK_BALANCE',
        label: 'Liquid Bank Reserves ≥ £25,000',
        operator: 'GTE',
        targetValue: 25000,
        displayTarget: '≥ £25,000'
      },
      {
        id: 'rule_kyc_verified',
        category: 'KYC_STATUS',
        label: 'Regulatory KYC Status: Verified Tier 1/2',
        operator: 'EQ',
        targetValue: 'VERIFIED',
        displayTarget: 'Verified Identity'
      }
    ],
    verifierName: 'Vanguard Private Credit Partners',
    verifierAddress: 'mn_addr_test1q99vanguardpartners9921cred',
    createdAt: Date.now() - 86400000 * 5,
    expiresAt: Date.now() + 86400000 * 45,
    nonce: '7c4e912b04f18a22d9b0318e5c82a53e08d1e22793a622ab40d19c603a88cc45',
    policyHash: '0x8472910482710394857291039485720192837465019283746501928374650192',
    status: 'PENDING',
    notes: 'Accredited investor threshold for private syndication: financial capability and verified compliance status.',
    isLiveOnChain: false,
  }
];

export class CompactContractLedger {
  // DEMO sandbox ledger (strictly isolated from LIVE state)
  private demoRequests: Map<string, VerificationRequest> = new Map();
  // Cached on-chain requests fetched from live indexer
  private liveRequestsCache: VerificationRequest[] = [];
  private lastLiveFetch: number = 0;

  constructor() {
    INITIAL_DEMO_REQUESTS.forEach(req => this.demoRequests.set(req.id, req));
  }

  /**
   * Synchronize live on-chain requests from Midnight Preview Indexer
   */
  public async syncLiveLedger(): Promise<VerificationRequest[]> {
    const config = getMidnightConfig();
    if (!config.contractAddress) {
      this.liveRequestsCache = [];
      return [];
    }

    try {
      const records: OnChainVerificationItem[] = await fetchOnChainContractRecords(config.contractAddress);
      this.liveRequestsCache = records.map(record => ({
        id: record.requestId,
        policyId: `blk_policy_${record.requestId.slice(0, 6)}`,
        title: `Midnight Verified Credential #${record.requestId.slice(0, 8)}`,
        purpose: 'Rental Affordability',
        requiredIncome: record.requiredIncome,
        currency: 'GBP',
        rules: [
          {
            id: 'rule_onchain_inc',
            category: 'INCOME',
            label: `Monthly Income ≥ £${record.requiredIncome.toLocaleString()}`,
            operator: 'GTE',
            targetValue: record.requiredIncome,
            displayTarget: `≥ £${record.requiredIncome.toLocaleString()}/mo`
          }
        ],
        verifierName: `Verifier (${record.verifierPk.slice(0, 10)}...)`,
        verifierAddress: record.verifierPk,
        createdAt: record.timestamp,
        expiresAt: record.timestamp + 86400000 * 30,
        nonce: record.commitment,
        policyHash: `0x${record.requestId}`,
        status: record.isVerified ? 'VERIFIED' : 'REJECTED',
        isLiveOnChain: true,
        notes: `On-chain record verified by Midnight Smart Contract at block height.`
      }));
      this.lastLiveFetch = Date.now();
      return this.liveRequestsCache;
    } catch (err) {
      console.warn('Failed to sync live ledger from indexer:', err);
      return this.liveRequestsCache;
    }
  }

  public getRequests(mode: ExecutionMode = 'DEMO'): VerificationRequest[] {
    if (mode === 'LIVE') {
      const config = getMidnightConfig();
      const contractAddress = getActiveBlackoutContractAddress() || config.contractAddress;
      if (!contractAddress) {
        return [];
      }
      return this.liveRequestsCache;
    }

    return Array.from(this.demoRequests.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public getRequest(id: string, mode: ExecutionMode = 'DEMO'): VerificationRequest | undefined {
    if (mode === 'LIVE') {
      return this.liveRequestsCache.find(r => r.id === id);
    }
    return this.demoRequests.get(id);
  }

  public async registerRequest(
    req: Partial<VerificationRequest> & {
      title: string;
      purpose: VerificationRequest['purpose'];
      requiredIncome: number;
      currency: VerificationRequest['currency'];
      verifierName: string;
      verifierAddress: string;
    },
    mode: ExecutionMode = 'DEMO'
  ): Promise<VerificationRequest> {
    const nonce = req.nonce || generateSecureNonce();
    const policyId = req.policyId || `blk_policy_${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = req.expiresAt || (Date.now() + 86400000 * 30);
    const rules = req.rules && req.rules.length > 0 ? req.rules : [
      {
        id: 'rule_inc_reg',
        category: 'INCOME' as const,
        label: `Monthly Income ≥ £${req.requiredIncome.toLocaleString()}`,
        operator: 'GTE' as const,
        targetValue: req.requiredIncome,
        displayTarget: `≥ £${req.requiredIncome.toLocaleString()}/mo`
      }
    ];

    if (mode === 'LIVE') {
      const config = getMidnightConfig();
      const contractAddress = getActiveBlackoutContractAddress() || config.contractAddress;
      if (!contractAddress) {
        throw new Error(
          'Live on-chain registration requires a deployed contract address on Midnight Preview. Contract is currently undeployed.'
        );
      }

      // LIVE verifier identity is always bound to the actual connected Midnight
      // wallet key. The form's demo placeholder is deliberately ignored.
      const verifierPublicKeyHex = getLiveVerifierPublicKeyHex();
      const submitted = await registerVerificationRequest({
        contractAddress,
        requestId: hexToBytes32(nonce),
        requiredIncome: BigInt(Math.floor(req.requiredIncome)),
        verifierPublicKey: hexToBytes32(verifierPublicKeyHex),
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
      });
      const liveRequest: VerificationRequest = {
        ...req, verifierAddress: verifierPublicKeyHex, id: req.id || nonce, policyId, rules, nonce,
        policyHash: req.policyHash || `0x${nonce}`,
        createdAt: Date.now(), expiresAt, status: 'PENDING', isLiveOnChain: true,
        notes: `${req.notes ? `${req.notes} ` : ''}Preview transaction: ${submitted.txId}`,
      };
      this.liveRequestsCache = [liveRequest, ...this.liveRequestsCache];
      return liveRequest;
    }

    // DEMO mode
    const id = `blk_req_${Math.random().toString(36).substring(2, 6)}_${Date.now().toString().slice(-4)}`;
    const newRequest: VerificationRequest = {
      ...req,
      id,
      policyId,
      rules,
      nonce,
      policyHash: `0x${nonce.slice(0, 32)}`,
      createdAt: Date.now(),
      expiresAt,
      status: 'PENDING',
      isLiveOnChain: false,
    };

    this.demoRequests.set(id, newRequest);
    return newRequest;
  }

  public recordProofResult(requestId: string, proof: ZkProofResult, mode: ExecutionMode = 'DEMO'): VerificationRequest {
    if (mode === 'LIVE') {
      const liveReq = this.liveRequestsCache.find(r => r.id === requestId);
      if (liveReq) {
        liveReq.status = proof.isVerified ? 'VERIFIED' : 'REJECTED';
        liveReq.proofResult = proof;
        return liveReq;
      }
      return {
        id: requestId,
        policyId: proof.policyId || `blk_policy_${requestId.slice(0, 6)}`,
        title: `Midnight Verified Credential #${requestId.slice(0, 8)}`,
        purpose: 'Rental Affordability',
        requiredIncome: proof.threshold,
        currency: proof.currency,
        rules: proof.ruleResults.map(r => ({
          id: r.ruleId,
          category: r.category,
          label: r.label,
          operator: r.operator,
          targetValue: r.displayTarget,
          displayTarget: r.displayTarget
        })),
        verifierName: 'Midnight Preview Contract',
        verifierAddress: getMidnightConfig().contractAddress,
        createdAt: proof.timestamp,
        expiresAt: proof.expiresAt,
        nonce: proof.nonce,
        policyHash: proof.policyHash,
        status: proof.isVerified ? 'VERIFIED' : 'REJECTED',
        proofResult: proof,
        isLiveOnChain: true
      };
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
