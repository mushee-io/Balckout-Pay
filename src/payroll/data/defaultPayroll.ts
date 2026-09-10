/**
 * @file defaultPayroll.ts
 * Initial seed data for Black Payroll.
 * Contains realistic institutional payroll batches with full zero-knowledge privacy metadata.
 */

import { PayrollBatch, PayrollRecipient } from '../types/payroll';

export const INITIAL_RECIPIENTS: PayrollRecipient[] = [
  {
    id: 'rec-001',
    employeeId: 'EMP-001',
    label: 'Lead Protocol Cryptographer',
    walletAddress: 'midnight1q88apexlettings2500req8923kf98s23kd',
    paymentAmount: 4720,
    currency: 'USDC',
    status: 'READY',
    eligibilityStatus: 'ELIGIBLE'
  },
  {
    id: 'rec-002',
    employeeId: 'EMP-002',
    label: 'Senior Compact Circuits Engineer',
    walletAddress: 'midnight1q48m79c80s3kd89f2a938jdf892k39d821',
    paymentAmount: 3850,
    currency: 'USDC',
    status: 'READY',
    eligibilityStatus: 'ELIGIBLE'
  },
  {
    id: 'rec-003',
    employeeId: 'EMP-003',
    label: 'Distributed Systems Architect',
    walletAddress: 'midnight1q29k48sf0293kf9238ks029384kdf8923a',
    paymentAmount: 2900,
    currency: 'USDC',
    status: 'READY',
    eligibilityStatus: 'ELIGIBLE'
  },
  {
    id: 'rec-004',
    employeeId: 'EMP-004',
    label: 'ZK Enclave Specialist',
    walletAddress: 'midnight1q773kd09238fk029384ks092384ks02934',
    paymentAmount: 3400,
    currency: 'USDC',
    status: 'READY',
    eligibilityStatus: 'ELIGIBLE'
  },
  {
    id: 'rec-005',
    employeeId: 'EMP-005',
    label: 'Protocol Security Auditor',
    walletAddress: 'midnight1q992384ks092384ks029384ks029384ks1',
    paymentAmount: 4100,
    currency: 'USDC',
    status: 'READY',
    eligibilityStatus: 'ELIGIBLE'
  },
  {
    id: 'rec-006',
    employeeId: 'EMP-006',
    label: 'Smart Contract Developer',
    walletAddress: 'midnight1q552384ks092384ks029384ks029384ks2',
    paymentAmount: 3200,
    currency: 'USDC',
    status: 'READY',
    eligibilityStatus: 'ELIGIBLE'
  },
  {
    id: 'rec-007',
    employeeId: 'EMP-007',
    label: 'Full-Stack Interface Engineer',
    walletAddress: 'midnight1q332384ks092384ks029384ks029384ks3',
    paymentAmount: 2750,
    currency: 'USDC',
    status: 'READY',
    eligibilityStatus: 'ELIGIBLE'
  },
  {
    id: 'rec-008',
    employeeId: 'EMP-008',
    label: 'Infrastructure & DevOps Lead',
    walletAddress: 'midnight1q112384ks092384ks029384ks029384ks4',
    paymentAmount: 3600,
    currency: 'USDC',
    status: 'READY',
    eligibilityStatus: 'ELIGIBLE'
  },
  {
    id: 'rec-009',
    employeeId: 'EMP-009',
    label: 'Product Designer (Industrial / UI)',
    walletAddress: 'midnight1q882384ks092384ks029384ks029384ks5',
    paymentAmount: 2950,
    currency: 'USDC',
    status: 'READY',
    eligibilityStatus: 'ELIGIBLE'
  },
  {
    id: 'rec-010',
    employeeId: 'EMP-010',
    label: 'Developer Relations & Tech Writer',
    walletAddress: 'midnight1q662384ks092384ks029384ks029384ks6',
    paymentAmount: 2400,
    currency: 'USDC',
    status: 'READY',
    eligibilityStatus: 'ELIGIBLE'
  },
  {
    id: 'rec-011',
    employeeId: 'EMP-011',
    label: 'Regulatory Compliance Counsel',
    walletAddress: 'midnight1q442384ks092384ks029384ks029384ks7',
    paymentAmount: 3900,
    currency: 'USDC',
    status: 'READY',
    eligibilityStatus: 'ELIGIBLE'
  },
  {
    id: 'rec-012',
    employeeId: 'EMP-012',
    label: 'Operations & Treasury Manager',
    walletAddress: 'midnight1q222384ks092384ks029384ks029384ks8',
    paymentAmount: 3100,
    currency: 'USDC',
    status: 'READY',
    eligibilityStatus: 'ELIGIBLE'
  },
  {
    id: 'rec-013',
    employeeId: 'EMP-013',
    label: 'Quality Assurance & Test Automation',
    walletAddress: 'midnight1q002384ks092384ks029384ks029384ks9',
    paymentAmount: 2650,
    currency: 'USDC',
    status: 'READY',
    eligibilityStatus: 'ELIGIBLE'
  },
  {
    id: 'rec-014',
    employeeId: 'EMP-014',
    label: 'Data Privacy & Governance Officer',
    walletAddress: 'midnight1q772384ks092384ks029384ks029384ks0',
    paymentAmount: 3500,
    currency: 'USDC',
    status: 'READY',
    eligibilityStatus: 'ELIGIBLE'
  },
];

export const INITIAL_PAYROLL_BATCHES: PayrollBatch[] = [
  {
    id: 'batch-2026-09',
    name: 'September Payroll',
    period: '01 SEP — 30 SEP 2026',
    paymentDate: '30 SEP 2026',
    paymentAsset: 'USDC',
    status: 'READY',
    recipients: INITIAL_RECIPIENTS,
    createdAt: Date.now() - 86400000 * 4,
    mode: 'DEMO'
  },
  {
    id: 'batch-2026-08',
    name: 'August Payroll',
    period: '01 AUG — 31 AUG 2026',
    paymentDate: '31 AUG 2026',
    paymentAsset: 'USDC',
    status: 'CONFIRMED',
    recipients: INITIAL_RECIPIENTS.slice(0, 12),
    createdAt: Date.now() - 86400000 * 35,
    authorizedAt: Date.now() - 86400000 * 34,
    executedAt: Date.now() - 86400000 * 34,
    mode: 'DEMO',
    executionResult: {
      batchId: 'batch-2026-08',
      batchName: 'August Payroll',
      recipientCount: 12,
      totalDisplay: 'PRIVATE',
      network: 'Midnight TestNet-02 (Simulated Runtime)',
      mode: 'DEMO',
      status: 'CONFIRMED',
      timestamp: Date.now() - 86400000 * 34,
      privacyStatus: 'COMPENSATION PRIVATE',
      unrevealedAttributes: [
        'Individual Employee Compensation Amounts',
        'Exact Aggregate Payroll Total',
        'Employee Bank Routing Details',
        'Tax & Deduction Schedules'
      ],
      dataDisclosedBytes: 0,
      note: 'Demo simulation batch. In compliance with Blackout protocol integrity guarantees, zero synthetic transaction hashes are broadcast.'
    }
  },
  {
    id: 'batch-2026-07',
    name: 'July Payroll',
    period: '01 JUL — 31 JUL 2026',
    paymentDate: '31 JUL 2026',
    paymentAsset: 'USDC',
    status: 'CONFIRMED',
    recipients: INITIAL_RECIPIENTS.slice(0, 12),
    createdAt: Date.now() - 86400000 * 66,
    authorizedAt: Date.now() - 86400000 * 65,
    executedAt: Date.now() - 86400000 * 65,
    mode: 'DEMO',
    executionResult: {
      batchId: 'batch-2026-07',
      batchName: 'July Payroll',
      recipientCount: 12,
      totalDisplay: 'PRIVATE',
      network: 'Midnight TestNet-02 (Simulated Runtime)',
      mode: 'DEMO',
      status: 'CONFIRMED',
      timestamp: Date.now() - 86400000 * 65,
      privacyStatus: 'COMPENSATION PRIVATE',
      unrevealedAttributes: [
        'Individual Employee Compensation Amounts',
        'Exact Aggregate Payroll Total',
        'Employee Bank Routing Details',
        'Tax & Deduction Schedules'
      ],
      dataDisclosedBytes: 0,
      note: 'Demo simulation batch. In compliance with Blackout protocol integrity guarantees, zero synthetic transaction hashes are broadcast.'
    }
  }
];
