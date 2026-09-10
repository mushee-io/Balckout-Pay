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

export type PolicyRuleCategory = 
  | 'INCOME' 
  | 'AGE' 
  | 'RESIDENCY' 
  | 'EMPLOYMENT' 
  | 'BANK_BALANCE' 
  | 'KYC_STATUS' 
  | 'ACCREDITED_INVESTOR' 
  | 'MEMBERSHIP' 
  | 'ONCHAIN_CONDITION';

export type PolicyRuleOperator = 'GTE' | 'LTE' | 'EQ' | 'IN';
export type RuleCategory = PolicyRuleCategory;

export interface PolicyRule {
  id: string;
  category: PolicyRuleCategory;
  label: string;
  operator: PolicyRuleOperator;
  targetValue: string | number | boolean;
  displayTarget: string;
}

export type IssuerType = 'DEMO_CREDENTIAL' | 'VERIFIED_EXTERNAL_ISSUER';

export interface PrivateCredential {
  id: string;
  label: string;
  // Private witness attributes stored strictly in local client memory
  monthlyIncome: number;
  currency: CurrencyCode;
  age?: number;
  country?: string;
  employmentStatus?: 'EMPLOYED' | 'SELF_EMPLOYED' | 'STUDENT' | 'RETIRED' | 'OTHER';
  bankBalance?: number;
  kycStatus?: 'VERIFIED' | 'TIER_1' | 'TIER_2' | 'PENDING';
  accreditedInvestor?: boolean;
  
  // Cryptographic binding
  salt: string; // 256-bit blinding nonce
  commitment: string; // Public cryptographic commitment: persistentHash(witness, salt)
  issuedAt: number;
  expiresAt?: number;
  issuer: string;
  issuerType?: IssuerType;
  status: 'READY' | 'ACTIVE' | 'REVOKED';
  isDemo?: boolean;
}

// Backwards-compatible alias for existing references
export type PrivateIncomeCredential = PrivateCredential;

export type VerificationPurpose = 
  | 'Rental Affordability'
  | 'Mortgage Pre-Qualification'
  | 'Car Lease Approval'
  | 'Commercial Lease'
  | 'Credit & Loan Eligibility'
  | 'KYC & Compliance Screening'
  | 'Accredited Investor Access'
  | 'Custom Financial Requirement';

export interface VerificationRequest {
  id: string; // e.g. blk_req_9821
  policyId: string; // e.g. blk_policy_842a
  title: string;
  purpose: VerificationPurpose;
  rules: PolicyRule[];
  requiredIncome: number; // Primary Compact circuit threshold
  currency: CurrencyCode;
  verifierName: string;
  verifierAddress: string;
  createdAt: number;
  expiresAt: number;
  nonce: string; // Cryptographic request nonce
  policyHash: string; // Cryptographic digest of rules, nonce, and verifier
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

export interface RuleEvaluationResult {
  ruleId: string;
  category: PolicyRuleCategory;
  label: string;
  satisfied: boolean;
  operator: PolicyRuleOperator;
  displayTarget: string;
}

export interface ZkProofResult {
  requestId: string;
  policyId: string;
  policyHash: string;
  nonce: string;
  isVerified: boolean;
  requirementsSatisfied: number;
  requirementsTotal: number;
  ruleResults: RuleEvaluationResult[];
  threshold: number;
  currency: CurrencyCode;
  proofHash?: string;
  commitmentHash: string;
  timestamp: number;
  expiresAt: number;
  executionTimeMs: number;
  circuitName: string;
  contractAddress: string;
  midnightNetwork: MidnightNetwork;
  blockHeight?: number;
  proofBytesHex?: string;
  mode: ExecutionMode;
  txHash?: string;
  publicOutputs: {
    is_satisfied: boolean;
    required_income: number;
    threshold_currency: CurrencyCode;
    policy_id: string;
    requirements_satisfied: number;
    requirements_total: number;
  };
  // Audit confirmation that income and private witness values were omitted
  privateIncomeDisclosed: '0 BYTES';
  privateWitnessDisclosed: '0 BYTES';
  unrevealedFields: string[];
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

