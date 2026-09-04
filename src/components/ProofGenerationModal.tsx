import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Cpu, 
  ArrowRight, 
  Check, 
  ExternalLink,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  PrivateIncomeCredential, 
  ProverStep, 
  VerificationRequest, 
  WalletState, 
  ZkProofResult 
} from '../midnight/types';
import { proveIncomeThreshold } from '../midnight/zk-engine';

interface ProofGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: VerificationRequest | null;
  credential: PrivateIncomeCredential | null;
  wallet: WalletState;
  onProofSuccess: (proof: ZkProofResult) => void;
  onOpenCreateCredential: () => void;
}

export const ProofGenerationModal: React.FC<ProofGenerationModalProps> = ({
  isOpen,
  onClose,
  request,
  credential,
  wallet,
  onProofSuccess,
  onOpenCreateCredential,
}) => {
  const [currentStep, setCurrentStep] = useState<ProverStep>('IDLE');
  const [stepMessage, setStepMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [proofResult, setProofResult] = useState<ZkProofResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('IDLE');
      setStepMessage('');
      setProgress(0);
      setProofResult(null);
      setErrorMsg(null);
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const handleStartProving = async () => {
    if (!credential) return;

    setErrorMsg(null);
    try {
      const result = await proveIncomeThreshold(
        credential,
        request.requiredIncome,
        request.id,
        wallet.network,
        wallet.mode,
        {
          onStepChange: (step, msg) => {
            setCurrentStep(step);
            setStepMessage(msg);
          },
          onProgress: (p) => setProgress(p),
        }
      );

      setProofResult(result);
      onProofSuccess(result);
    } catch (err: unknown) {
      setCurrentStep('FAILED');
      const msg = err instanceof Error ? err.message : 'Unknown proof generation error';
      setErrorMsg(msg);
    }
  };

  const stepsList: { key: ProverStep; label: string; desc: string }[] = [
    { 
      key: 'PREPARING_WITNESS', 
      label: '01 / PREPARING WITNESS', 
      desc: 'Loading secret witness from local RAM without network transmission' 
    },
    { 
      key: 'SYNTHESIZING_CIRCUIT', 
      label: '02 / SYNTHESIZING CIRCUIT', 
      desc: 'Executing Compact R1CS zero-knowledge arithmetic constraint circuit' 
    },
    { 
      key: 'GENERATING_SNARK_PROOF', 
      label: '03 / GENERATING SNARK PROOF', 
      desc: 'Synthesizing polynomial commitments and ZK-SNARK witness proof' 
    },
    { 
      key: 'COMPLETED', 
      label: '04 / MIDNIGHT SETTLEMENT', 
      desc: 'Public proof recorded on Midnight ledger with 0 bytes salary exposure' 
    },
  ];

  const getStepStatus = (targetStep: ProverStep) => {
    const order: ProverStep[] = [
      'IDLE',
      'PREPARING_WITNESS',
      'SYNTHESIZING_CIRCUIT',
      'EVALUATING_CONSTRAINT',
      'GENERATING_SNARK_PROOF',
      'BROADCASTING_MIDNIGHT',
      'COMPLETED',
    ];
    const currentIndex = order.indexOf(currentStep);
    const targetIndex = order.indexOf(targetStep);

    if (currentStep === 'COMPLETED' || currentIndex > targetIndex) return 'COMPLETED';
    if (currentStep === targetStep || (targetStep === 'SYNTHESIZING_CIRCUIT' && currentStep === 'EVALUATING_CONSTRAINT')) return 'ACTIVE';
    return 'PENDING';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-sans select-none">
      <div 
        className="w-full max-w-xl bg-[#0E0E0E] border border-white/[0.12] p-6 sm:p-8 relative text-left shadow-2xl rounded-[2px]"
        id="modal-proof-generation"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="text-[10px] font-mono tracking-[0.2em] text-[#FF5A5F] uppercase font-bold">
              [ MIDNIGHT PROVER ENGINE ]
            </div>
            <h3 className="text-xl font-condensed font-extrabold uppercase text-[#E8E6DF]">
              SYNTHESIZE ZERO-KNOWLEDGE PROOF.
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8A8882] hover:text-[#E8E6DF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Request Target Card */}
        <div className="my-4 p-4 bg-[#090909] border border-white/[0.08] space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-[10px] text-[#8A8882] uppercase">
            <span>TARGET REQUIREMENT:</span>
            <span className="text-[#E8E6DF]">{request.verifierName}</span>
          </div>
          <div className="text-sm font-bold text-[#E8E6DF] font-sans uppercase">
            {request.title}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
            <span className="text-[#8A8882]">CONDITION TO PROVE:</span>
            <span className="font-bold text-[#FF5A5F]">
              Income ≥ {request.currency === 'GBP' ? '£' : request.currency === 'EUR' ? '€' : '$'}{request.requiredIncome.toLocaleString()}/MO
            </span>
          </div>
        </div>

        {/* Missing Credential Warning */}
        {!credential && currentStep === 'IDLE' && (
          <div className="p-4 bg-[#141414] border border-[#FF5A5F]/40 font-mono text-xs text-[#E8E6DF] space-y-3 mb-4">
            <div className="font-bold text-[#FF5A5F] flex items-center gap-1.5 uppercase">
              <Lock className="w-3.5 h-3.5" />
              <span>NO LOCAL WITNESS CREDENTIAL CONFIGURED</span>
            </div>
            <p className="text-[#8A8882] text-[11px] leading-relaxed">
              You must store your private income in local witness memory before evaluating constraints.
            </p>
            <button
              onClick={onOpenCreateCredential}
              className="px-4 py-2 bg-[#E8E6DF] text-black font-bold uppercase text-[11px] cursor-pointer"
            >
              SEAL INCOME CREDENTIAL →
            </button>
          </div>
        )}

        {/* Initial Idle Prover State */}
        {credential && currentStep === 'IDLE' && !proofResult && (
          <div className="space-y-4">
            <div className="p-4 bg-[#090909] border border-white/[0.08] font-mono text-xs text-[#8A8882] space-y-2">
              <div className="font-bold text-[#E8E6DF] uppercase flex items-center gap-1.5 text-[11px]">
                <Lock className="w-3.5 h-3.5 text-[#FF5A5F]" />
                <span>CRYPTOGRAPHIC EXECUTION BOUNDARY:</span>
              </div>
              <ul className="space-y-1.5 pl-4 list-disc text-[11px]">
                <li>Your income (<span className="text-[#E8E6DF] font-bold">••••••</span>) is evaluated exclusively in client-side RAM.</li>
                <li>Compact circuit privately asserts: <code className="text-[#FF5A5F]">income ≥ {request.requiredIncome}</code>.</li>
                <li>Only the boolean predicate (<strong className="text-[#26A17B]">PASS</strong> / <strong className="text-[#FF5A5F]">FAIL</strong>) is committed to the Midnight Ledger.</li>
                <li>Zero bytes of your actual salary are ever leaked.</li>
              </ul>
            </div>

            <button
              onClick={handleStartProving}
              id="btn-trigger-prove-privately"
              className="w-full py-4 bg-[#E8E6DF] text-black hover:bg-white active:translate-y-[1px] font-mono text-xs font-bold uppercase tracking-[0.16em] transition-all flex items-center justify-center gap-2 cursor-pointer rounded-[2px]"
            >
              <ShieldCheck className="w-4 h-4 text-black" />
              <span>PROVE IN ZERO-KNOWLEDGE →</span>
            </button>
          </div>
        )}

        {/* In-Progress Honest Proving Stages */}
        {currentStep !== 'IDLE' && !proofResult && !errorMsg && (
          <div className="space-y-4 my-2 font-mono">
            {/* Progress Bar */}
            <div className="w-full bg-[#090909] h-1.5 overflow-hidden border border-white/[0.08]">
              <div 
                className="bg-[#FF5A5F] h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="space-y-2.5 pt-1">
              {stepsList.map((st, idx) => {
                const status = getStepStatus(st.key);
                return (
                  <div
                    key={st.key}
                    className={`p-3 border transition-all flex items-start gap-3 ${
                      status === 'ACTIVE' 
                        ? 'bg-[#141414] border-[#FF5A5F]' 
                        : status === 'COMPLETED'
                        ? 'bg-[#090909] border-white/[0.12]'
                        : 'bg-[#090909] border-white/[0.04] opacity-40'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {status === 'COMPLETED' ? (
                        <div className="w-4 h-4 bg-[#26A17B]/20 border border-[#26A17B] flex items-center justify-center text-[#26A17B]">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      ) : status === 'ACTIVE' ? (
                        <div className="w-4 h-4 border-2 border-[#FF5A5F] border-t-transparent animate-spin" />
                      ) : (
                        <div className="w-4 h-4 bg-[#141414] border border-white/[0.1] flex items-center justify-center text-[9px] text-[#8A8882]">
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className={`text-xs font-bold ${status === 'ACTIVE' ? 'text-[#FF5A5F]' : status === 'COMPLETED' ? 'text-[#E8E6DF]' : 'text-[#8A8882]'}`}>
                        {st.label}
                      </div>
                      <div className="text-[10px] text-[#8A8882] mt-0.5">
                        {st.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center text-[11px] text-[#8A8882] font-mono py-1">
              {stepMessage || 'Executing Midnight Compact circuit...'}
            </div>
          </div>
        )}

        {/* Final Verified Screen */}
        {proofResult && (
          <div className="space-y-4 my-2 animate-in zoom-in-95 duration-200 font-mono text-left">
            {proofResult.isVerified ? (
              <div className="p-5 bg-[#0A100D] border border-[#26A17B] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#26A17B]" />
                    <h4 className="text-base font-bold text-[#E8E6DF] uppercase">REQUIREMENT VERIFIED</h4>
                  </div>
                  <span className="px-2 py-0.5 bg-[#26A17B]/20 text-[#26A17B] text-[10px] font-bold">
                    PASS
                  </span>
                </div>

                <div className="text-xs text-[#26A17B]">
                  ✓ Monthly income privately satisfies requirement: ≥ £{request.requiredIncome.toLocaleString()}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#26A17B]/30">
                  <div className="p-2.5 bg-[#090909] border border-white/[0.08]">
                    <span className="text-[#8A8882] block text-[9px] uppercase">EXACT INCOME DISCLOSED:</span>
                    <strong className="text-[#E8E6DF] font-bold">0 BYTES</strong>
                  </div>
                  <div className="p-2.5 bg-[#090909] border border-white/[0.08]">
                    <span className="text-[#8A8882] block text-[9px] uppercase">WITNESS LEAKAGE:</span>
                    <strong className="text-[#26A17B] font-bold">0% (SEALED)</strong>
                  </div>
                </div>

                <div className="text-[10px] text-[#8A8882] truncate pt-1">
                  PROOF: {proofResult.proofHash} • BLOCK #{proofResult.blockHeight}
                </div>
              </div>
            ) : (
              <div className="p-5 bg-[#150A0A] border border-[#FF5A5F] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-[#FF5A5F]" />
                    <h4 className="text-base font-bold text-[#E8E6DF] uppercase">REQUIREMENT NOT SATISFIED</h4>
                  </div>
                  <span className="px-2 py-0.5 bg-[#FF5A5F]/20 text-[#FF5A5F] text-[10px] font-bold">
                    FAIL
                  </span>
                </div>

                <div className="text-xs text-[#FF5A5F]">
                  ✗ Monthly income does not meet the requested threshold of £{request.requiredIncome.toLocaleString()}.
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#FF5A5F]/30">
                  <div className="p-2.5 bg-[#090909] border border-white/[0.08]">
                    <span className="text-[#8A8882] block text-[9px] uppercase">EXACT INCOME DISCLOSED:</span>
                    <strong className="text-[#E8E6DF] font-bold">0 BYTES</strong>
                  </div>
                  <div className="p-2.5 bg-[#090909] border border-white/[0.08]">
                    <span className="text-[#8A8882] block text-[9px] uppercase">SHORTFALL LEAKED:</span>
                    <strong className="text-[#26A17B] font-bold">NONE (0 BYTES)</strong>
                  </div>
                </div>

                <div className="text-[10px] text-[#8A8882] pt-1">
                  Verifier receives only the failed boolean. They do not know your exact income or shortfall.
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-[#8A8882] pt-2">
              <span>Execution Time: <strong className="text-[#E8E6DF]">{proofResult.executionTimeMs}ms</strong></span>
              <span className="text-[#FF5A5F] font-bold">MIDNIGHT NETWORK</span>
            </div>

            <button
              onClick={onClose}
              id="btn-close-proof-modal"
              className="w-full py-3 bg-[#E8E6DF] text-black hover:bg-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer rounded-[2px]"
            >
              CLOSE & VIEW RECEIPT
            </button>
          </div>
        )}

        {/* Error State */}
        {errorMsg && (
          <div className="p-4 bg-[#141414] border border-[#FF5A5F] font-mono text-xs text-[#E8E6DF] space-y-3 my-4">
            <div className="font-bold text-[#FF5A5F] flex items-center gap-1.5 uppercase">
              <XCircle className="w-4 h-4" />
              <span>PROOF GENERATION ERROR</span>
            </div>
            <p className="text-[#8A8882] text-[11px]">{errorMsg}</p>
            <button
              onClick={handleStartProving}
              className="px-3 py-1.5 bg-[#E8E6DF] text-black font-bold text-xs uppercase cursor-pointer"
            >
              RETRY PROVER
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
