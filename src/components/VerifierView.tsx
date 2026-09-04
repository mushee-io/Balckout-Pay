import React, { useState } from 'react';
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
  FileCode
} from 'lucide-react';
import { VerificationRequest } from '../midnight/types';

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
  const currentReq = request || allRequests[0];

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <button
            onClick={() => window.print()}
            className="text-xs font-mono uppercase text-[#8A8882] hover:text-[#E8E6DF] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT RECEIPT</span>
          </button>
        </div>
      </div>

      {/* Audit Certificate Container (Editorial Neo-Brutalist Layout) */}
      <div className="bg-[#0E0E0E] border border-white/[0.12] p-6 sm:p-10 lg:p-12 space-y-8 shadow-2xl rounded-[2px]">
        
        {/* Certificate Header */}
        <div className="space-y-3 border-b border-white/[0.08] pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-[0.2em]">
            <span className="text-[#FF5A5F] font-bold">[ MIDNIGHT VERIFICATION ATTESTATION ]</span>
            <span className="text-[#8A8882]">CONTRACT: 0x3a91c84f29e1d87e55b3c4118029d3ba9f018e44</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-condensed font-extrabold uppercase text-[#E8E6DF]">
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
            <div className="text-xl sm:text-2xl font-bold uppercase mt-0.5 text-[#E8E6DF]">
              {!hasProof
                ? 'PENDING PROOF GENERATION'
                : isVerified
                ? 'CRITERIA SATISFIED (PASS)'
                : 'REQUIREMENT NOT SATISFIED (FAIL)'}
            </div>
            <div className="text-[10px] text-[#8A8882] mt-1">
              {!hasProof
                ? 'Applicant has not yet computed and submitted a ZK-SNARK witness.'
                : isVerified
                ? 'Applicant privately proved income ≥ required threshold.'
                : 'Applicant privately evaluated condition; criterion was not met. Zero income data was exposed.'}
            </div>
          </div>

          <span className={`px-4 py-2 text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
            !hasProof
              ? 'bg-white/[0.06] text-[#8A8882]'
              : isVerified
              ? 'bg-[#26A17B]/20 text-[#26A17B] border border-[#26A17B]'
              : 'bg-[#FF5A5F]/20 text-[#FF5A5F] border border-[#FF5A5F]'
          }`}>
            {!hasProof ? 'PENDING' : isVerified ? '✓ VERIFIED PASS' : '✗ FAILED'}
          </span>
        </div>

        {/* Verified Criteria Details */}
        <div className="space-y-4 font-mono text-xs">
          <div className="text-xs uppercase tracking-wider text-[#8A8882] border-b border-white/[0.06] pb-2">
            ATTESTED CONSTRAINT PARAMETERS
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#090909] border border-white/[0.06] space-y-1">
              <div className="text-[10px] text-[#8A8882] uppercase">PURPOSE / TITLE</div>
              <div className="text-sm font-bold text-[#E8E6DF]">{currentReq?.title}</div>
            </div>

            <div className="p-4 bg-[#090909] border border-white/[0.06] space-y-1">
              <div className="text-[10px] text-[#8A8882] uppercase">VERIFIER / RELIANT PARTY</div>
              <div className="text-sm font-bold text-[#E8E6DF]">{currentReq?.verifierName}</div>
            </div>

            <div className="p-4 bg-[#090909] border border-white/[0.06] space-y-1">
              <div className="text-[10px] text-[#8A8882] uppercase">REQUIRED THRESHOLD</div>
              <div className="text-sm font-bold text-[#FF5A5F]">
                ≥ {currentReq?.currency} {currentReq?.requiredIncome.toLocaleString()}/MO
              </div>
            </div>

            <div className="p-4 bg-[#090909] border border-white/[0.06] space-y-1">
              <div className="text-[10px] text-[#8A8882] uppercase">PRIVATE INCOME DISCLOSED</div>
              <div className="text-sm font-bold text-[#E8E6DF]">
                0 BYTES (ZERO DISCLOSURE)
              </div>
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
                <div className="text-[#8A8882] text-[10px] uppercase">COMMITMENT HASH:</div>
                <div className="text-[#8A8882] break-all pt-0.5">
                  {currentReq.proofResult.commitmentHash}
                </div>
              </div>

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
