/**
 * @file types.ts
 * Strict TypeScript types for BLACKOUT — Private Eligibility Protocol on Midnight Network.
 */

export type CurrencyCode = 'GBP' | 'USD' | 'EUR';

export type ExecutionMode = 'LIVE' | 'DEMO';

export type MidnightNetwork = 
  | 'Midnight Preview'
  | 'Midnight TestNet-02' 
  | 'Midnight DevNet' 
  | 'Midnight Local Sandbox';

export interface PrivateIncomeCredential {
  id: string;
  monthlyIncome: number; // Stored STRICTLY in local client witness memory — never posted to ledger
  currency: CurrencyCode;
  salt: string; // 256-bit blinding nonce
  commitment: string; // Public cryptographic commitment: persistentHash(income, salt)
  issuedAt: number;
  issuer: string;
  label: string;
  status: 'READY' | 'ACTIVE' | 'REVOKED';
  isDemo?: boolean;
}

export type VerificationPurpose = 
  | 'Rental Affordability'
  | 'Mortgage Pre-Qualification'
  | 'Car Lease Approval'
  | 'Commercial Lease'
  | 'Credit & Loan Eligibility'
  | 'Custom Financial Requirement';

export interface VerificationRequest {
  id: string;
  title: string;
  purpose: VerificationPurpose;
  requiredIncome: number;
  currency: CurrencyCode;
  verifierName: string;
  verifierAddress: string;
  createdAt: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  proofResult?: ZkProofResult;
  notes?: string;
  isLiveOnChain?: boolean;
}

export type ProverStep = 
  | 'IDLE'
  | 'PREPARING_WITNESS'
  | 'SYNTHESIZING_CIRCUIT'
  | 'EVALUATING_CONSTRAINT'
  | 'GENERATING_SNARK_PROOF'
  | 'BROADCASTING_MIDNIGHT'
  | 'COMPLETED'
  | 'FAILED';

export interface ZkProofResult {
  requestId: string;
  isVerified: boolean;
  threshold: number;
  currency: CurrencyCode;
  proofHash: string;
  commitmentHash: string;
  timestamp: number;
  executionTimeMs: number;
  circuitName: string;
  contractAddress: string;
  midnightNetwork: MidnightNetwork;
  blockHeight: number;
  proofBytesHex: string;
  mode: ExecutionMode;
  txHash: string;
  publicOutputs: {
    is_satisfied: boolean;
    required_income: number;
    threshold_currency: CurrencyCode;
  };
  // Audit confirmation that income was omitted
  privateIncomeDisclosed: '0 BYTES';
}

export interface WalletState {
  isConnected: boolean;
  address: string;
  network: MidnightNetwork;
  walletName: string;
  balanceDust: string;
  isConnecting: boolean;
  mode: ExecutionMode;
  error?: string;
}

export interface VerificationAuditLog {
  id: string;
  requestId: string;
  purpose: string;
  threshold: string;
  outcome: 'PASS' | 'FAIL';
  txHash: string;
  timestamp: number;
  privateDataDisclosed: '0 BYTES';
  blockHeight: number;
  mode: ExecutionMode;
}

