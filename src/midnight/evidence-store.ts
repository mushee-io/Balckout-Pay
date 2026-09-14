import type { VerificationRequest, ZkProofResult } from './types';

// v2 intentionally does not import the older cache. Cached browser data is a
// convenience layer only and is never treated as authoritative chain state.
const LIVE_EVIDENCE_STORAGE_KEY = 'blackout_midnight_preview_public_evidence_v2';
const MAX_STORAGE_BYTES = 512 * 1024;
const MAX_EVIDENCE_ITEMS = 100;

function isHex32(value: unknown, allowPrefix = true): value is string {
  if (typeof value !== 'string') return false;
  const clean = allowPrefix && value.startsWith('0x') ? value.slice(2) : value;
  return /^[0-9a-fA-F]{64}$/.test(clean);
}

function isSafeInteger(value: unknown, min = 0): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min;
}

function isSafeLiveProof(value: unknown, request: Partial<VerificationRequest>): value is ZkProofResult {
  if (!value || typeof value !== 'object') return false;
  const proof = value as Partial<ZkProofResult>;
  return (
    proof.mode === 'LIVE' &&
    typeof proof.requestId === 'string' &&
    proof.requestId === request.id &&
    typeof proof.policyId === 'string' &&
    typeof proof.policyHash === 'string' &&
    isHex32(proof.policyHash) &&
    typeof proof.nonce === 'string' &&
    isHex32(proof.nonce, false) &&
    typeof proof.isVerified === 'boolean' &&
    isSafeInteger(proof.threshold) &&
    proof.threshold === request.requiredIncome &&
    typeof proof.txHash === 'string' &&
    proof.txHash.trim().length > 0 &&
    typeof proof.contractAddress === 'string' &&
    isHex32(proof.contractAddress) &&
    proof.midnightNetwork === 'Midnight Preview' &&
    proof.privateIncomeDisclosed === '0 BYTES' &&
    proof.privateWitnessDisclosed === '0 BYTES'
  );
}

function isSafeLiveEvidence(value: unknown): value is VerificationRequest {
  if (!value || typeof value !== 'object') return false;
  const req = value as Partial<VerificationRequest>;
  if (
    req.isLiveOnChain !== true ||
    typeof req.id !== 'string' ||
    !isHex32(req.id, false) ||
    typeof req.policyId !== 'string' ||
    req.policyId.length < 1 || req.policyId.length > 160 ||
    typeof req.title !== 'string' ||
    req.title.length < 1 || req.title.length > 240 ||
    !isSafeInteger(req.requiredIncome) ||
    !['GBP', 'USD', 'EUR'].includes(String(req.currency)) ||
    typeof req.verifierName !== 'string' ||
    req.verifierName.length > 240 ||
    typeof req.verifierAddress !== 'string' ||
    !isHex32(req.verifierAddress) ||
    !isSafeInteger(req.createdAt) ||
    !isSafeInteger(req.expiresAt) ||
    req.expiresAt < req.createdAt ||
    typeof req.nonce !== 'string' ||
    !isHex32(req.nonce, false) ||
    typeof req.policyHash !== 'string' ||
    !isHex32(req.policyHash) ||
    !['PENDING', 'VERIFIED', 'REJECTED'].includes(String(req.status))
  ) {
    return false;
  }

  if (req.proofResult !== undefined && !isSafeLiveProof(req.proofResult, req)) {
    return false;
  }

  // A cached final status without a matching LIVE receipt is not evidence.
  if (req.status !== 'PENDING' && !req.proofResult) return false;
  return true;
}

export function loadPublicLiveEvidence(): VerificationRequest[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(LIVE_EVIDENCE_STORAGE_KEY);
    if (!raw || raw.length > MAX_STORAGE_BYTES) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_EVIDENCE_ITEMS).filter(isSafeLiveEvidence);
  } catch {
    return [];
  }
}

export function persistPublicLiveEvidence(request: VerificationRequest): void {
  if (!request.isLiveOnChain || !isSafeLiveEvidence(request)) return;
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const current = loadPublicLiveEvidence();
    const next = [request, ...current.filter((item) => item.id !== request.id)].slice(0, MAX_EVIDENCE_ITEMS);
    const serialized = JSON.stringify(next);
    if (serialized.length > MAX_STORAGE_BYTES) return;
    window.localStorage.setItem(LIVE_EVIDENCE_STORAGE_KEY, serialized);
  } catch {
    // Browser persistence is best-effort and never establishes authority.
  }
}

/**
 * Merge browser convenience state with authoritative indexer state.
 *
 * Security rule: a browser-only entry is allowed only while PENDING and without
 * a proof receipt. As soon as the indexer exposes a request result, every
 * security-critical field comes from the network record. LocalStorage can never
 * overwrite status, threshold, verifier, commitment, or proof outcome.
 */
export function mergePublicLiveEvidence(networkRequests: VerificationRequest[]): VerificationRequest[] {
  const persisted = loadPublicLiveEvidence();
  const merged = new Map<string, VerificationRequest>();

  for (const network of networkRequests) {
    if (network.isLiveOnChain) merged.set(network.id, network);
  }

  for (const saved of persisted) {
    const network = merged.get(saved.id);
    if (network) {
      // Preserve only human-facing metadata that is not used for authorization.
      merged.set(saved.id, {
        ...saved,
        ...network,
        title: saved.title || network.title,
        purpose: saved.purpose || network.purpose,
        verifierName: saved.verifierName || network.verifierName,
        notes: network.notes || saved.notes,
        isLiveOnChain: true,
      });
      continue;
    }

    // An orphan browser record is displayable only as an unfinalized pending
    // registration. Never display a browser-only PASS/FAIL as on-chain truth.
    if (saved.status === 'PENDING' && !saved.proofResult) {
      merged.set(saved.id, saved);
    }
  }

  return Array.from(merged.values()).sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Export a clearly sourced evidence bundle. Network entries are authoritative;
 * local-only entries are explicitly marked pending/browser-cache and contain no
 * final proof assertion.
 */
export function exportPublicLiveEvidence(networkRequests: VerificationRequest[] = []): string {
  const networkIds = new Set(networkRequests.map((request) => request.id));
  const evidence = mergePublicLiveEvidence(networkRequests).map((request) => ({
    source: networkIds.has(request.id) ? 'MIDNIGHT_INDEXER' : 'LOCAL_PENDING_CACHE',
    authoritative: networkIds.has(request.id),
    requestId: request.id,
    policyId: request.policyId,
    title: request.title,
    verifierName: request.verifierName,
    requiredIncome: request.requiredIncome,
    currency: request.currency,
    policyHash: request.policyHash,
    status: request.status,
    requestRegistrationNote: request.notes,
    proof: networkIds.has(request.id) && request.proofResult
      ? {
          outcome: request.proofResult.isVerified ? 'PASS' : 'FAIL',
          txId: request.proofResult.txHash ?? null,
          blockHeight: request.proofResult.blockHeight ?? null,
          contractAddress: request.proofResult.contractAddress,
          circuit: request.proofResult.circuitName,
          network: request.proofResult.midnightNetwork,
          timestamp: request.proofResult.timestamp,
          privateIncomeDisclosed: request.proofResult.privateIncomeDisclosed,
          privateWitnessDisclosed: request.proofResult.privateWitnessDisclosed,
        }
      : null,
  }));

  return JSON.stringify({
    protocol: 'BLACKOUT',
    network: 'Midnight Preview',
    cacheAuthority: 'NONE',
    evidence,
  }, null, 2);
}
