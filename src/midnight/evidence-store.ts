import type { VerificationRequest } from './types';

const LIVE_EVIDENCE_STORAGE_KEY = 'blackout_midnight_preview_public_evidence_v1';

function isSafeLiveEvidence(value: unknown): value is VerificationRequest {
  if (!value || typeof value !== 'object') return false;
  const req = value as Partial<VerificationRequest>;
  return (
    req.isLiveOnChain === true &&
    typeof req.id === 'string' &&
    typeof req.title === 'string' &&
    typeof req.requiredIncome === 'number' &&
    typeof req.policyHash === 'string'
  );
}

export function loadPublicLiveEvidence(): VerificationRequest[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(LIVE_EVIDENCE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSafeLiveEvidence);
  } catch {
    return [];
  }
}

export function persistPublicLiveEvidence(request: VerificationRequest): void {
  if (!request.isLiveOnChain) return;
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const current = loadPublicLiveEvidence();
    const next = [request, ...current.filter((item) => item.id !== request.id)].slice(0, 100);
    window.localStorage.setItem(LIVE_EVIDENCE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Evidence persistence is best-effort and never blocks a valid transaction.
  }
}

export function mergePublicLiveEvidence(networkRequests: VerificationRequest[]): VerificationRequest[] {
  const persisted = loadPublicLiveEvidence();
  const merged = new Map<string, VerificationRequest>();

  for (const req of networkRequests) merged.set(req.id, req);
  for (const saved of persisted) {
    const network = merged.get(saved.id);
    if (!network) {
      merged.set(saved.id, saved);
      continue;
    }
    merged.set(saved.id, {
      ...network,
      ...saved,
      proofResult: saved.proofResult ?? network.proofResult,
      isLiveOnChain: true,
    });
  }

  return Array.from(merged.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function exportPublicLiveEvidence(): string {
  const evidence = loadPublicLiveEvidence().map((request) => ({
    requestId: request.id,
    policyId: request.policyId,
    title: request.title,
    verifierName: request.verifierName,
    requiredIncome: request.requiredIncome,
    currency: request.currency,
    policyHash: request.policyHash,
    status: request.status,
    requestRegistrationNote: request.notes,
    proof: request.proofResult
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
  return JSON.stringify({ protocol: 'BLACKOUT', network: 'Midnight Preview', evidence }, null, 2);
}
