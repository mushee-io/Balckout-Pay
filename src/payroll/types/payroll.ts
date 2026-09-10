/**
 * @file payroll.ts
 * TypeScript type definitions for BLACK PAYROLL — Privacy-Preserving Payroll Protocol on Midnight Network.
 * Core Thesis: "Pay people. Reveal nothing else."
 */

export type PayrollAsset = 'USDC' | 'tNIGHT' | 'GBPX' | 'USD';

export type PayrollStatus = 
  | 'DRAFT' 
  | 'READY' 
  | 'AUTHORIZED' 
  | 'EXECUTING' 
  | 'CONFIRMED' 
  | 'FAILED';

export interface PayrollRecipient {
  id: string;
  employeeId: string;
  label: string;
  walletAddress: string;
  paymentAmount: number;
  currency: string;
  status: 'READY' | 'VALIDATED' | 'PROCESSING' | 'PAID';
  eligibilityStatus?: 'ELIGIBLE' | 'PENDING_VERIFICATION' | 'EXEMPT';
}

export type PayrollExecutionStage = 
  | 'IDLE'
  | 'PREPARING_PAYROLL'
  | 'PREPARING_PRIVATE_STATE'
  | 'GENERATING_PROOF'
  | 'AWAITING_WALLET_APPROVAL'
  | 'SUBMITTING_TO_MIDNIGHT'
  | 'CONFIRMING'
  | 'PAYROLL_COMPLETE'
  | 'FAILED';

export interface PayrollExecutionResult {
  batchId: string;
  batchName: string;
  recipientCount: number;
  totalDisplay: string; // e.g. "PRIVATE"
  network: string;
  mode: 'DEMO' | 'LIVE';
  status: 'CONFIRMED' | 'FAILED';
  timestamp: number;
  txHash?: string;
  contractAddress?: string;
  blockHeight?: number;
  privacyStatus: 'COMPENSATION PRIVATE';
  unrevealedAttributes: string[];
  dataDisclosedBytes: 0;
  note?: string;
}

export interface PayrollBatch {
  id: string;
  name: string;
  period: string;
  paymentDate: string;
  paymentAsset: PayrollAsset;
  status: PayrollStatus;
  recipients: PayrollRecipient[];
  createdAt: number;
  authorizedAt?: number;
  executedAt?: number;
  mode: 'DEMO' | 'LIVE';
  executionResult?: PayrollExecutionResult;
}

export interface PayrollOverviewMetrics {
  activeEmployees: number;
  nextPayrollDate: string;
  payrollStatus: string;
  privatePayrollsCount: number;
  totalPayrollAmount: number;
  currency: string;
}

export interface AuthorizationCondition {
  id: string;
  label: string;
  isSatisfied: boolean;
  details: string;
}
