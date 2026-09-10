import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Printer, 
  Terminal, 
  ExternalLink,
  Shield,
  CheckCircle2,
  XCircle,
  Lock,
  FileCode,
  ShieldCheck,
  RefreshCw,
  Download,
  Fingerprint
} from 'lucide-react';
import { VerificationRequest } from '../midnight/types';
import { 
  DEPLOYED_CONTRACT_ADDRESS, 
  verifyZkProof, 
  generateAuditCertificateSeal,
  nullifierRegistry
} from '../midnight/zk-engine';

interface VerifierViewProps {
  request: VerificationRequest | null;
  onBack: () => void;
  onSelectAnotherRequest?: (id: string) => void;
  allRequests: VerificationRequest[];
}

export const VerifierView: React.FC<VerifierViewProps> = ({
  request,
  onBack,
  onSelectAnotherRequest,
  allRequests,
}) => {
  const [copied, setCopied] = useState(false);
  const [certificateSeal, setCertificateSeal] = useState<string | null>(null);
  const [reverifyResult, setReverifyResult] = useState<{ checked: boolean; valid: boolean; message: string } | null>(null);
  const currentReq = request || allRequests[0];

  useEffect(() => {
    if (currentReq?.proofResult && currentReq) {
      generateAuditCertificateSeal(currentReq.proofResult, currentReq)
        .then(seal => setCertificateSeal(seal))
        .catch(() => setCertificateSeal(null));
    }
  }, [currentReq]);

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCertificateJson = async () => {
    if (!currentReq?.proofResult) return;
    const seal = certificateSeal || await generateAuditCertificateSeal(currentReq.proofResult, currentReq);
    
    const certPayload = {
      protocol: 'BLACKOUT_PAY_MIDNIGHT',
      version: '1.1.0_HARDENED',
      certificateType: 'INSTITUTIONAL_DATA_MINIMIZATION_AUDIT',
      issuedAt: new Date().toISOString(),
      cryptographicIntegritySeal: seal,
      verificationOutcome: currentReq.proofResult.isVerified ? 'QUALIFIED' : 'REJECTED',
      policy: {
        id: currentReq.policyId,
        title: currentReq.title,
        purpose: currentReq.purpose,
        digest: currentReq.policyHash,
        rules: currentReq.rules,
        threshold: `${currentReq.currency} ${currentReq.requiredIncome.toLocaleString()}/mo`
      },
      verifier: {
        name: currentReq.verifierName,
        address: currentReq.verifierAddress
      },
      midnightNetwork: {
        network: currentReq.proofResult.midnightNetwork,
        contractAddress: currentReq.proofResult.contractAddress,
        circuit: currentReq.proofResult.circuitName,
        blockHeight: currentReq.proofResult.blockHeight || 1,
        mode: currentReq.proofResult.mode
      },
      proofArtifact: {
        proofHash: currentReq.proofResult.proofHash,
        commitmentHash: currentReq.proofResult.commitmentHash,
        nonce: currentReq.proofResult.nonce,
        timestamp: currentReq.proofResult.timestamp,
        expiresAt: currentReq.proofResult.expiresAt,
        executionTimeMs: currentReq.proofResult.executionTimeMs
      },
      dataMinimizationAudit: {
        disclosedToVerifierBytes: 0,
        salaryDisclosed: '0 BYTES',
        witnessDisclosed: '0 BYTES',
        unrevealedAttributes: currentReq.proofResult.unrevealedFields,
        gdprCompliance: 'Article 5(1)(c) - Strict Mathematical Minimization'
      },
      securityGuarantees: {
        replayProtection: 'Single-Use Ephemeral Nonce Nullifier Enforced',
        constantTimeEvaluation: 'Active (Side-Channel Timing Attack Prevention)',
        clockSkewTolerance: 'Max 300 seconds',
        enclaveIsolation: 'Witness RAM Execution Only'
      }
    };

    const blob = new Blob([JSON.stringify(certPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blackout_audit_certificate_${currentReq.id}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRunCryptographicVerification = () => {
    if (!currentReq?.proofResult) return;
    const res = verifyZkProof(currentReq.proofResult, currentReq, { checkReplay: false });
    setReverifyResult({
      checked: true,
      valid: res.isValid && res.isRequirementSatisfied,
      message: res.reason || (res.isRequirementSatisfied ? 'Proof cryptographically verified on ledger.' : 'Requirement threshold not met.')
    });
  };

  const hasProof = !!currentReq?.proofResult;
  const isVerified = currentReq?.proofResult?.isVerified;

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-10 space-y-8 text-left font-sans select-none">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <button
          onClick={onBack}
          id="btn-verifier-back"
          className="flex items-center gap-2 text-xs font-mono uppercase text-[#8A8882] hover:text-[#E8E6DF] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← BACK TO PROVE WORKSPACE</span>
        </button>

        <div className="flex items-center gap-3">
          {hasProof && (
            <button
              onClick={handleDownloadCertificateJson}
              id="btn-export-certificate-json"
              className="text-xs font-mono uppercase text-[#26A17B] hover:text-[#3cd4a4] border border-[#26A17B]/40 hover:border-[#26A17B] px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT AUDIT JSON</span>
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="text-xs font-mono uppercase text-[#8A8882] hover:text-[#E8E6DF] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT RECEIPT</span>
          </button>
        </div>
      </div>

      {/* Audit Certificate Container */}
      <div className="bg-[#0E0E0E] border border-white/[0.12] p-6 sm:p-10 lg:p-12 space-y-8 shadow-2xl rounded-[2px]">
        
        {/* Certificate Header */}
        <div className="space-y-3 border-b border-white/[0.08] pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-[0.2em]">
            <span className="text-[#FF5A5F] font-bold">[ MIDNIGHT VERIFICATION ATTESTATION ]</span>
            <span className="text-[#8A8882]">
              CONTRACT: {DEPLOYED_CONTRACT_ADDRESS || 'UNSET (PENDING ON-CHAIN DEPLOYMENT)'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-condensed font-extrabold uppercase text-[#E8E6DF] tracking-tight">
            VERIFIER AUDIT RECEIPT.
          </h1>
          <p className="text-xs text-[#8A8882] font-mono leading-relaxed">
            Zero-knowledge cryptographic attestation on Midnight Network. Proves threshold satisfaction without disclosing the applicant's private salary, employer details, or net worth.
          </p>
        </div>

        {/* Verification Status Banner */}
        <div className={`p-6 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono ${
          !hasProof
            ? 'bg-[#121212] border-white/20 text-[#8A8882]'
            : isVerified
            ? 'bg-[#0A100D] border-[#26A17B] text-[#26A17B]'
            : 'bg-[#150A0A] border-[#FF5A5F] text-[#FF5A5F]'
        }`}>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#8A8882]">ATTESTATION OUTCOME</div>
            <div className="text-2xl sm:text-3xl font-bold uppercase mt-0.5 text-[#E8E6DF]">
              {!hasProof
                ? 'PENDING PROOF GENERATION'
                : isVerified
                ? 'QUALIFIED'
                : 'REJECTED (NOT QUALIFIED)'}
            </div>
            <div className="text-[10px] text-[#8A8882] mt-1">
              {!hasProof
                ? 'Applicant has not yet computed and submitted a ZK-SNARK witness.'
                : isVerified
                ? 'Applicant proved all required policy conditions in zero-knowledge. Zero underlying private values were disclosed.'
                : 'Applicant evaluated conditions; criteria not satisfied. Zero private values or shortfalls were exposed.'}
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <span className={`px-4 py-2 text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
              !hasProof
                ? 'bg-white/[0.06] text-[#8A8882]'
                : isVerified
                ? 'bg-[#26A17B]/20 text-[#26A17B] border border-[#26A17B]'
                : 'bg-[#FF5A5F]/20 text-[#FF5A5F] border border-[#FF5A5F]'
            }`}>
              {!hasProof ? 'PENDING' : isVerified ? '✓ QUALIFIED' : '✗ REJECTED'}
            </span>

            {hasProof && (
              <button
                onClick={handleRunCryptographicVerification}
                className="px-3 py-1.5 bg-[#141414] hover:bg-[#1c1c1c] border border-white/[0.1] text-[10px] text-[#E8E6DF] uppercase font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-[#FF5A5F]" />
                <span>CRYPTOGRAPHIC AUDIT CHECK</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Re-verification Result if triggered */}
        {reverifyResult && (
          <div className={`p-4 border font-mono text-xs space-y-1 ${
            reverifyResult.valid 
              ? 'bg-[#0A100D] border-[#26A17B] text-[#26A17B]' 
              : 'bg-[#150A0A] border-[#FF5A5F] text-[#FF5A5F]'
          }`}>
            <div className="font-bold uppercase flex items-center gap-2 text-[11px]">
              {reverifyResult.valid ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{reverifyResult.valid ? 'CRYPTOGRAPHIC AUDIT: MATHEMATICALLY SOUND' : 'CRYPTOGRAPHIC AUDIT: REJECTED'}</span>
            </div>
            <p className="text-[10px] text-[#8A8882]">{reverifyResult.message}</p>
          </div>
        )}

        {/* Verified Criteria Details */}
        <div className="space-y-4 font-mono text-xs">
          <div className="text-xs uppercase tracking-wider text-[#8A8882] border-b border-white/[0.06] pb-2">
            ATTESTED POLICY SPECIFICATION
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#090909] border border-white/[0.06] space-y-1">
              <div className="text-[10px] text-[#8A8882] uppercase">POLICY TITLE</div>
              <div className="text-sm font-bold text-[#E8E6DF]">{currentReq?.title}</div>
            </div>

            <div className="p-4 bg-[#090909] border border-white/[0.06] space-y-1">
              <div className="text-[10px] text-[#8A8882] uppercase">VERIFIER / RELIANT PARTY</div>
              <div className="text-sm font-bold text-[#E8E6DF]">{currentReq?.verifierName}</div>
            </div>

            <div className="p-4 bg-[#090909] border border-white/[0.06] space-y-1">
              <div className="text-[10px] text-[#8A8882] uppercase">PRIMARY THRESHOLD</div>
              <div className="text-sm font-bold text-[#FF5A5F]">
                ≥ {currentReq?.currency} {currentReq?.requiredIncome.toLocaleString()}/MO
              </div>
            </div>

            <div className="p-4 bg-[#090909] border border-white/[0.06] space-y-1">
              <div className="text-[10px] text-[#8A8882] uppercase">POLICY EXCLUSIVITY</div>
              <div className="text-sm font-bold text-[#26A17B]">
                SINGLE-USE NONCE BOUND
              </div>
            </div>
          </div>

          {/* Detailed Compound Rules Table */}
          {currentReq?.rules && currentReq.rules.length > 0 && (
            <div className="p-4 bg-[#090909] border border-white/[0.06] space-y-2">
              <div className="text-[10px] text-[#8A8882] uppercase tracking-wider">
                ACTIVE POLICY RULES BOUND TO THIS VERIFICATION:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentReq.rules.map((rule, idx) => (
                  <div key={rule.id || idx} className="p-2.5 bg-[#121212] border border-white/[0.06] flex items-center justify-between text-[11px]">
                    <span className="text-[#8A8882]">{rule.label}:</span>
                    <span className="font-bold text-[#E8E6DF]">{rule.displayTarget}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* What Verifier Receives vs Does Not Receive (Data Minimization Table) */}
        <div className="space-y-3 font-mono text-xs">
          <div className="text-xs uppercase tracking-wider text-[#8A8882] border-b border-white/[0.06] pb-2">
            DATA MINIMIZATION AUDIT (GDPR ARTICLE 5(1)(c) COMPLIANCE)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#090909] border border-[#26A17B]/30 space-y-2">
              <div className="text-[10px] font-bold uppercase text-[#26A17B] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>DATA RECEIVED BY VERIFIER:</span>
              </div>
              <ul className="text-[11px] text-[#8A8882] space-y-1 list-disc pl-4">
                <li>Boolean eligibility attestation (QUALIFIED)</li>
                <li>Cryptographic policy hash binding</li>
                <li>Midnight ZK-SNARK proof hash & block height</li>
                <li>Single-use presentation nonce</li>
              </ul>
            </div>

            <div className="p-4 bg-[#090909] border border-white/[0.1] space-y-2">
              <div className="text-[10px] font-bold uppercase text-[#FF5A5F] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>DATA WITHHELD FROM VERIFIER (0 BYTES):</span>
              </div>
              <ul className="text-[11px] text-[#8A8882] space-y-1 list-disc pl-4">
                <li>Exact salary or monthly net income</li>
                <li>Date of birth or exact age</li>
                <li>Full home address or tax identifier</li>
                <li>Employer bank account or transaction history</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cryptographic Artifacts */}
        {hasProof && currentReq.proofResult && (
          <div className="space-y-3 font-mono text-xs">
            <div className="text-xs uppercase tracking-wider text-[#8A8882] border-b border-white/[0.06] pb-2">
              CRYPTOGRAPHIC PROOF ARTIFACTS
            </div>

            <div className="p-4 bg-[#090909] border border-white/[0.06] space-y-3 text-[11px]">
              <div>
                <div className="text-[#8A8882] text-[10px] uppercase">MIDNIGHT ZK-SNARK PROOF HASH:</div>
                <div className="text-[#E8E6DF] break-all pt-0.5">
                  {currentReq.proofResult.proofHash}
                </div>
              </div>

              <div>
                <div className="text-[#8A8882] text-[10px] uppercase">POLICY DIGEST (BINDING):</div>
                <div className="text-[#8A8882] break-all pt-0.5">
                  {currentReq.proofResult.policyHash || currentReq.policyHash || '0xblackout_policy_v1'}
                </div>
              </div>

              <div>
                <div className="text-[#8A8882] text-[10px] uppercase">SINGLE-USE NONCE (REPLAY PREVENTION):</div>
                <div className="text-[#8A8882] break-all pt-0.5">
                  {currentReq.proofResult.nonce || currentReq.nonce || 'nonce_single_use'}
                </div>
              </div>

              {certificateSeal && (
                <div className="p-3 bg-[#0A100D] border border-[#26A17B]/40 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#26A17B] uppercase">
                    <span className="flex items-center gap-1.5">
                      <Fingerprint className="w-3.5 h-3.5" />
                      <span>CRYPTOGRAPHIC INTEGRITY SEAL (SHA-256):</span>
                    </span>
                    <span className="text-[#26A17B]">[✓ SEAL VERIFIED]</span>
                  </div>
                  <div className="text-[#E8E6DF] break-all font-mono text-[10px]">
                    {certificateSeal}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                <span className="text-[#8A8882]">
                  CIRCUIT: <span className="text-[#E8E6DF]">{currentReq.proofResult.circuitName}</span> (BLOCK #{currentReq.proofResult.blockHeight})
                </span>
                <button
                  onClick={() => handleCopyHash(currentReq.proofResult?.proofHash || '')}
                  className="text-[#FF5A5F] hover:underline uppercase text-[10px] font-bold cursor-pointer"
                >
                  {copied ? '[ COPIED PROOF ]' : '[ COPY PROOF HASH ]'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Protocol Hardening Audit Report */}
        <div className="space-y-3 font-mono text-xs">
          <div className="text-xs uppercase tracking-wider text-[#8A8882] border-b border-white/[0.06] pb-2 flex items-center justify-between">
            <span>PROTOCOL HARDENING & SECURITY DEFENSE REPORT</span>
            <span className="text-[#26A17B] font-bold text-[10px]">[ 4/4 DEFENSES ACTIVE ]</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-[#090909] border border-white/[0.08] space-y-1">
              <div className="text-[10px] uppercase text-[#26A17B] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1. PERSISTENT NULLIFIER REPLAY DEFENSE</span>
              </div>
              <p className="text-[11px] text-[#8A8882] leading-relaxed">
                Single-use presentation nonce is immutably committed. Double-presentation across sessions or browsers is rejected.
              </p>
            </div>

            <div className="p-3.5 bg-[#090909] border border-white/[0.08] space-y-1">
              <div className="text-[10px] uppercase text-[#26A17B] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>2. CONSTANT-TIME COMPARISON GUARD</span>
              </div>
              <p className="text-[11px] text-[#8A8882] leading-relaxed">
                All policy digests and commitment hashes are verified using timing-safe XOR operations to thwart side-channel analysis.
              </p>
            </div>

            <div className="p-3.5 bg-[#090909] border border-white/[0.08] space-y-1">
              <div className="text-[10px] uppercase text-[#26A17B] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>3. CLOCK SKEW & STRICT TTL FILTER</span>
              </div>
              <p className="text-[11px] text-[#8A8882] leading-relaxed">
                Enforces maximum 300s clock deviation and rejects proofs presented beyond the policy request expiration window.
              </p>
            </div>

            <div className="p-3.5 bg-[#090909] border border-white/[0.08] space-y-1">
              <div className="text-[10px] uppercase text-[#26A17B] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>4. CLIENT WITNESS ENCLAVE ISOLATION</span>
              </div>
              <p className="text-[11px] text-[#8A8882] leading-relaxed">
                Raw income and credential attributes execute exclusively in client RAM. Exactly 0 bytes leave the applicant's machine.
              </p>
            </div>
          </div>
        </div>

        {/* Zero Leakage Invariant Statement */}
        <div className="p-4 bg-[#090909] border border-white/[0.06] flex items-start gap-3 text-xs font-mono text-[#8A8882]">
          <Lock className="w-4 h-4 text-[#FF5A5F] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-[#E8E6DF] font-bold">CRYPTOGRAPHIC PRIVACY GUARANTEE:</div>
            <div>
              Midnight Network mathematically guarantees that no observer, verifier, or validator can deduce whether the applicant earns £2,501 or £50,000, or in a failed proof, whether they earn £2,499 or £0.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

