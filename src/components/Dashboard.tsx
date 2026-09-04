import React from 'react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  X,
  ShieldCheck, 
  Plus, 
  ArrowRight, 
  FileCode, 
  Sparkles,
  HelpCircle,
  RefreshCw,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { 
  PrivateIncomeCredential, 
  VerificationRequest 
} from '../midnight/types';

interface DashboardProps {
  credential: PrivateIncomeCredential | null;
  requests: VerificationRequest[];
  privacyMode: boolean;
  onTogglePrivacyMode: () => void;
  onOpenCreateCredential: () => void;
  onOpenCreateRequest: () => void;
  onStartProof: (req: VerificationRequest) => void;
  onViewVerifierResult: (req: VerificationRequest) => void;
  onSetQuickCredential: (income: number, label: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  credential,
  requests,
  privacyMode,
  onTogglePrivacyMode,
  onOpenCreateCredential,
  onOpenCreateRequest,
  onStartProof,
  onViewVerifierResult,
  onSetQuickCredential,
}) => {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-10 space-y-12 text-left font-sans">
      
      {/* 01 — Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div className="space-y-2">
          <div className="text-[11px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">
            [ PROVE WORKSPACE // WAVE 01 ACTIVE ]
          </div>
          <h1 className="text-3xl sm:text-5xl font-condensed font-extrabold uppercase text-[#E8E6DF]">
            PROVE ELIGIBILITY.
          </h1>
          <p className="text-xs sm:text-sm text-[#8A8882] max-w-2xl font-normal">
            Select a verification request and synthesize a zero-knowledge proof from your private client witness. Midnight proves whether you qualify without exposing your exact salary.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateCredential}
            id="dash-btn-custom-credential"
            className="px-4 py-2.5 bg-[#141414] hover:bg-[#E8E6DF] hover:text-black border border-white/[0.12] text-[#E8E6DF] font-mono text-xs uppercase tracking-wider transition-all cursor-pointer rounded-[2px]"
          >
            EDIT CREDENTIAL
          </button>
          <button
            onClick={onOpenCreateRequest}
            id="dash-btn-new-request"
            className="px-4 py-2.5 bg-[#E8E6DF] text-black hover:bg-white font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer rounded-[2px]"
          >
            + NEW REQUEST
          </button>
        </div>
      </div>

      {/* 02 — Private Witness Credential Card & Quick Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Active Witness Credential (7 cols) */}
        <div className="lg:col-span-7 bg-[#0E0E0E] border border-white/[0.1] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#FF5A5F]" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#E8E6DF] font-bold">
                LOCAL CLIENT WITNESS CREDENTIAL
              </span>
            </div>
            <span className="px-2 py-0.5 bg-[#FF5A5F]/10 border border-[#FF5A5F]/40 text-[#FF5A5F] text-[9px] font-mono font-bold uppercase">
              SEALED IN WITNESS MEMORY
            </span>
          </div>

          {credential ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#090909] border border-white/[0.06]">
                  <div className="text-[10px] font-mono text-[#8A8882] uppercase">MONTHLY INCOME (PRIVATE)</div>
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-[#E8E6DF] mt-1">
                    {privacyMode ? '••••••••' : `£${credential.monthlyIncome.toLocaleString()}`}
                    <span className="text-xs text-[#8A8882] font-normal ml-2">/ month</span>
                  </div>
                  <div className="text-[10px] text-[#8A8882]/70 font-mono mt-1">
                    {credential.label}
                  </div>
                </div>

                <div className="p-4 bg-[#090909] border border-white/[0.06]">
                  <div className="text-[10px] font-mono text-[#8A8882] uppercase">ISSUER ATTESTATION</div>
                  <div className="text-sm font-mono font-bold text-[#E8E6DF] mt-1 truncate">
                    {credential.issuer}
                  </div>
                  <div className="text-[10px] text-[#26A17B] font-mono mt-1">
                    ✓ STATUS: {credential.status}
                  </div>
                </div>
              </div>

              {/* Cryptographic Proof Parameters */}
              <div className="p-3.5 bg-[#090909] border border-white/[0.06] space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-[10px] text-[#8A8882]">
                  <span>256-BIT BLINDING SALT:</span>
                  <span className="text-[#E8E6DF] truncate max-w-[220px]">
                    {privacyMode ? '••••••••••••••••' : credential.salt.slice(0, 24) + '...'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#8A8882]">
                  <span>PUBLIC COMMITMENT HASH:</span>
                  <span className="text-[#FF5A5F] truncate max-w-[220px]">
                    {credential.commitment.slice(0, 24)}...
                  </span>
                </div>
              </div>

              <div className="text-[10px] font-mono text-[#8A8882]">
                <span className="text-[#E8E6DF] font-bold">PRIVACY GUARANTEE:</span> This private income value is stored solely in local client witness storage. It is NEVER transmitted across the network, posted to the ledger, or logged.
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-3 font-mono">
              <div className="text-sm text-[#8A8882]">No active private credential sealed.</div>
              <button
                onClick={onOpenCreateCredential}
                className="px-4 py-2 bg-[#E8E6DF] text-black font-bold text-xs uppercase"
              >
                + SEAL PRIVATE CREDENTIAL
              </button>
            </div>
          )}
        </div>

        {/* Right: Quick Switch Presets (Test PASS vs FAIL) (5 cols) */}
        <div className="lg:col-span-5 bg-[#0E0E0E] border border-white/[0.1] p-6 sm:p-8 space-y-6">
          <div className="border-b border-white/[0.08] pb-4">
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#E8E6DF] font-bold">
              SWITCH TEST CANDIDATE
            </div>
            <div className="text-[11px] text-[#8A8882] font-mono mt-0.5">
              Instantly test PASS and FAIL scenarios to verify zero-knowledge behavior.
            </div>
          </div>

          <div className="space-y-3">
            {/* Candidate A: £4,720 (Passes £2,500 rental) */}
            <button
              onClick={() => onSetQuickCredential(4720, 'Senior Systems Engineer (Demo)')}
              className={`w-full p-4 border text-left font-mono transition-all cursor-pointer ${
                credential?.monthlyIncome === 4720
                  ? 'bg-[#141414] border-[#26A17B] text-[#E8E6DF]'
                  : 'bg-[#090909] border-white/[0.08] hover:border-white/[0.2] text-[#8A8882]'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#E8E6DF]">CANDIDATE A: £4,720/mo</span>
                <span className="px-2 py-0.5 bg-[#26A17B]/20 text-[#26A17B] text-[9px] font-bold">
                  PASSES £2,500
                </span>
              </div>
              <div className="text-[10px] text-[#8A8882] mt-1">
                Satisfies standard Rental Affordability threshold.
              </div>
            </button>

            {/* Candidate B: £2,000 (Fails £2,500 rental) */}
            <button
              onClick={() => onSetQuickCredential(2000, 'Junior Analyst (Demo)')}
              className={`w-full p-4 border text-left font-mono transition-all cursor-pointer ${
                credential?.monthlyIncome === 2000
                  ? 'bg-[#141414] border-[#FF5A5F] text-[#E8E6DF]'
                  : 'bg-[#090909] border-white/[0.08] hover:border-white/[0.2] text-[#8A8882]'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#E8E6DF]">CANDIDATE B: £2,000/mo</span>
                <span className="px-2 py-0.5 bg-[#FF5A5F]/20 text-[#FF5A5F] text-[9px] font-bold">
                  FAILS £2,500
                </span>
              </div>
              <div className="text-[10px] text-[#8A8882] mt-1">
                Demonstrates fail scenario: Verifier learns only "FAIL", not £2,000 or shortfall.
              </div>
            </button>

            {/* Candidate C: £6,500 (Passes all) */}
            <button
              onClick={() => onSetQuickCredential(6500, 'Principal Architect (Demo)')}
              className={`w-full p-4 border text-left font-mono transition-all cursor-pointer ${
                credential?.monthlyIncome === 6500
                  ? 'bg-[#141414] border-[#26A17B] text-[#E8E6DF]'
                  : 'bg-[#090909] border-white/[0.08] hover:border-white/[0.2] text-[#8A8882]'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#E8E6DF]">CANDIDATE C: £6,500/mo</span>
                <span className="px-2 py-0.5 bg-[#26A17B]/20 text-[#26A17B] text-[9px] font-bold">
                  HIGH EARNER
                </span>
              </div>
              <div className="text-[10px] text-[#8A8882] mt-1">
                Passes luxury lease and mortgage thresholds.
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* 03 — Active Verification Requests to Prove */}
      <div className="space-y-6">
        <div className="flex items-end justify-between border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <div className="text-[11px] font-mono tracking-[0.25em] text-[#8A8882] uppercase">
              [ VERIFICATION TARGETS ]
            </div>
            <h2 className="text-2xl sm:text-4xl font-condensed font-extrabold uppercase text-[#E8E6DF]">
              INCOMING VERIFICATION REQUESTS.
            </h2>
          </div>
          <div className="text-xs font-mono text-[#8A8882]">
            {requests.length} REQUESTS AVAILABLE
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => {
            const hasProof = !!req.proofResult;
            const isVerified = req.proofResult?.isVerified;
            const currentIncome = credential?.monthlyIncome || 0;
            const willPass = currentIncome >= req.requiredIncome;

            return (
              <div 
                key={req.id}
                className="p-6 bg-[#0E0E0E] border border-white/[0.08] hover:border-white/[0.2] transition-colors flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#8A8882] border-b border-white/[0.06] pb-3">
                    <span>{req.purpose}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold ${
                      hasProof
                        ? isVerified
                          ? 'bg-[#26A17B]/20 text-[#26A17B] border border-[#26A17B]/40'
                          : 'bg-[#FF5A5F]/20 text-[#FF5A5F] border border-[#FF5A5F]/40'
                        : 'bg-white/[0.06] text-[#8A8882]'
                    }`}>
                      {hasProof
                        ? isVerified ? '✓ PROVED PASS' : '✗ PROVED FAIL'
                        : 'PENDING PROOF'}
                    </span>
                  </div>

                  {/* Title & Threshold */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-condensed font-bold uppercase text-[#E8E6DF]">
                      {req.title}
                    </h3>
                    <div className="text-xs font-mono text-[#8A8882]">
                      VERIFIER: <span className="text-[#E8E6DF]">{req.verifierName}</span>
                    </div>
                    <div className="p-3 bg-[#090909] border border-white/[0.06] font-mono text-xs">
                      <div className="text-[10px] text-[#8A8882] uppercase">CONDITION REQUIRED:</div>
                      <div className="text-sm font-bold text-[#FF5A5F] mt-0.5">
                        Monthly Income ≥ £{req.requiredIncome.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Proof Action Buttons */}
                <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                  <button
                    onClick={() => onStartProof(req)}
                    id={`btn-prove-${req.id}`}
                    className="w-full py-3 bg-[#E8E6DF] text-black hover:bg-white active:translate-y-[1px] font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer rounded-[2px]"
                  >
                    <span>GENERATE ZK PROOF</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {hasProof && (
                    <button
                      onClick={() => onViewVerifierResult(req)}
                      className="w-full py-2 bg-transparent hover:bg-white/[0.04] border border-white/[0.1] text-[#8A8882] hover:text-[#E8E6DF] font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer"
                    >
                      VIEW VERIFIER RECEIPT →
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* 04 — Privacy Invariant Audit Strip */}
      <div className="p-6 bg-[#0E0E0E] border border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1 font-mono text-xs">
          <div className="text-[#FF5A5F] font-bold uppercase tracking-wider">[ ZERO-LEAKAGE PRIVACY INVARIANT ]</div>
          <div className="text-[#8A8882]">
            Raw income value is evaluated exclusively in the client-side Compact R1CS constraint system.
          </div>
        </div>
        <div className="flex items-center gap-6 font-mono text-xs shrink-0">
          <div>DATA EXPOSURE: <span className="text-[#E8E6DF] font-bold">0 BYTES</span></div>
          <div>CIRCUIT: <span className="text-[#26A17B] font-bold">SATISFIED</span></div>
        </div>
      </div>

    </div>
  );
};
