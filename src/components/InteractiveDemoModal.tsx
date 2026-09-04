import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  User, 
  Eye, 
  EyeOff, 
  RotateCcw
} from 'lucide-react';
import { computeCommitment, generateSecureSalt, proveIncomeThreshold } from '../midnight/zk-engine';
import { PrivateIncomeCredential, ZkProofResult } from '../midnight/types';

interface InteractiveDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDemoState: (credential: PrivateIncomeCredential, proof: ZkProofResult) => void;
}

export const InteractiveDemoModal: React.FC<InteractiveDemoModalProps> = ({
  isOpen,
  onClose,
  onApplyDemoState,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [demoIncome, setDemoIncome] = useState<number>(4720);
  const [demoThreshold, setDemoThreshold] = useState<number>(2500);
  const [applicantName, setApplicantName] = useState('Alex (Tech Lead)');
  const [landlordName, setLandlordName] = useState('King\'s Cross Residential');
  const [isGenerating, setIsGenerating] = useState(false);
  const [revealSalary, setRevealSalary] = useState(false);
  const [proofResult, setProofResult] = useState<ZkProofResult | null>(null);

  if (!isOpen) return null;

  const handleRunProver = async () => {
    setIsGenerating(true);
    try {
      const salt = generateSecureSalt();
      const commitment = await computeCommitment(demoIncome, 'GBP', salt);

      const cred: PrivateIncomeCredential = {
        id: 'cred_alex_demo_991',
        monthlyIncome: demoIncome,
        currency: 'GBP',
        salt,
        commitment,
        issuedAt: Date.now(),
        issuer: 'Self-Asserted (Demo / Wave 1)',
        label: `${applicantName}'s Monthly Income`,
        status: 'READY',
        isDemo: true,
      };

      const proof = await proveIncomeThreshold(
        cred,
        demoThreshold,
        'req_demo_rental_affordability_2500',
        'Midnight TestNet-02',
        'DEMO'
      );

      setProofResult(proof);
      setIsGenerating(false);
      setStep(4);
    } catch {
      setIsGenerating(false);
    }
  };

  const handleCompleteAndApply = () => {
    if (proofResult) {
      const salt = generateSecureSalt();
      computeCommitment(demoIncome, 'GBP', salt).then((commitment) => {
        onApplyDemoState(
          {
            id: 'cred_alex_demo_991',
            monthlyIncome: demoIncome,
            currency: 'GBP',
            salt,
            commitment,
            issuedAt: Date.now(),
            issuer: 'Self-Asserted (Demo / Wave 1)',
            label: `${applicantName}'s Monthly Income`,
            status: 'READY',
            isDemo: true,
          },
          proofResult
        );
        onClose();
      });
    } else {
      onClose();
    }
  };

  const resetToScenario = (income: number, threshold: number, name: string) => {
    setDemoIncome(income);
    setDemoThreshold(threshold);
    setApplicantName(name);
    setStep(1);
    setProofResult(null);
    setRevealSalary(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-sans select-none">
      <div 
        className="w-full max-w-2xl bg-[#0E0E0E] border border-white/[0.12] p-6 sm:p-8 relative text-left shadow-2xl rounded-[2px]"
        id="modal-interactive-demo"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="text-[10px] font-mono tracking-[0.2em] text-[#FF5A5F] uppercase font-bold">
              [ INTERACTIVE PROTOCOL WALKTHROUGH ]
            </div>
            <h3 className="text-xl font-condensed font-extrabold uppercase text-[#E8E6DF]">
              END-TO-END VERIFICATION SANDBOX.
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8A8882] hover:text-[#E8E6DF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2 my-4 font-mono text-xs uppercase">
          {[
            { num: 1, label: '01. Private RAM' },
            { num: 2, label: '02. Request' },
            { num: 3, label: '03. Prover' },
            { num: 4, label: '04. Receipt' },
          ].map((s) => (
            <div
              key={s.num}
              className={`p-2 border text-center transition-all ${
                step === s.num
                  ? 'bg-[#E8E6DF] text-black font-bold border-white'
                  : step > s.num
                  ? 'bg-[#141414] border-white/[0.12] text-[#E8E6DF]'
                  : 'bg-[#090909] border-white/[0.04] text-[#8A8882]'
              }`}
            >
              <div className="text-[10px] font-bold">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Scenario Preset Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#090909] border border-white/[0.08] mb-4 font-mono text-xs">
          <span className="text-[10px] text-[#8A8882] uppercase">PRESET:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => resetToScenario(4720, 2500, 'Alex (Tech Lead)')}
              className={`px-2.5 py-1 text-[11px] transition-all cursor-pointer ${
                demoIncome === 4720 ? 'bg-[#E8E6DF] text-black font-bold' : 'bg-[#141414] text-[#8A8882] hover:text-[#E8E6DF]'
              }`}
            >
              £4,720 vs £2,500 (PASS)
            </button>
            <button
              onClick={() => resetToScenario(2499, 2500, 'Test User (Below)')}
              className={`px-2.5 py-1 text-[11px] transition-all cursor-pointer ${
                demoIncome === 2499 ? 'bg-[#E8E6DF] text-black font-bold' : 'bg-[#141414] text-[#8A8882] hover:text-[#E8E6DF]'
              }`}
            >
              £2,499 vs £2,500 (FAIL)
            </button>
            <button
              onClick={() => resetToScenario(2500, 2500, 'Boundary User')}
              className={`px-2.5 py-1 text-[11px] transition-all cursor-pointer ${
                demoIncome === 2500 ? 'bg-[#E8E6DF] text-black font-bold' : 'bg-[#141414] text-[#8A8882] hover:text-[#E8E6DF]'
              }`}
            >
              £2,500 vs £2,500 (EXACT)
            </button>
          </div>
        </div>

        {/* STEP 1: Private Credential */}
        {step === 1 && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 bg-[#090909] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#FF5A5F]" />
                  <span className="font-bold text-[#E8E6DF]">Applicant: {applicantName}</span>
                </div>
                <span className="text-[10px] text-[#26A17B] font-bold">
                  LOCAL RAM
                </span>
              </div>

              <div className="p-4 bg-[#121212] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#8A8882] uppercase">Private Monthly Income</div>
                  <div className="font-mono text-xl font-bold text-[#E8E6DF] mt-1">
                    {revealSalary ? (
                      <span className="text-[#26A17B]">£{demoIncome.toLocaleString()}/MO</span>
                    ) : (
                      <span className="text-[#8A8882] tracking-widest">••••••</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setRevealSalary(!revealSalary)}
                  className="px-3 py-1.5 bg-[#181818] border border-white/[0.1] text-[#E8E6DF] text-[11px] font-bold uppercase transition-colors cursor-pointer"
                >
                  {revealSalary ? 'MASK VALUE' : 'INSPECT VALUE'}
                </button>
              </div>

              <div className="text-[10px] text-[#8A8882] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#FF5A5F] shrink-0" />
                <span>Encapsulated in local client memory. Never transmitted over the wire.</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-3 bg-[#E8E6DF] text-black hover:bg-white font-bold text-xs uppercase flex items-center gap-2 cursor-pointer rounded-[2px]"
              >
                <span>NEXT: RECEIVE VERIFICATION REQUEST →</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Verification Request */}
        {step === 2 && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 bg-[#090909] border border-white/[0.08] space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#FF5A5F]" />
                <span className="font-bold text-[#E8E6DF]">Verifier: {landlordName}</span>
              </div>

              <div className="p-4 bg-[#121212] border border-white/[0.06] space-y-2">
                <div className="text-[#8A8882]">
                  "Please prove that monthly income satisfies tenancy affordability multiplier."
                </div>
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[10px] text-[#8A8882] uppercase">REQUIRED THRESHOLD:</span>
                  <span className="text-sm font-bold text-[#FF5A5F]">Income ≥ £{demoThreshold.toLocaleString()}/MO</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="text-xs font-mono text-[#8A8882] hover:text-[#E8E6DF] cursor-pointer"
              >
                ← BACK
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-5 py-3 bg-[#E8E6DF] text-black hover:bg-white font-bold text-xs uppercase flex items-center gap-2 cursor-pointer rounded-[2px]"
              >
                <span>NEXT: RUN MIDNIGHT PROVER →</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Prover Execution */}
        {step === 3 && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 bg-[#090909] border border-white/[0.08] space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FF5A5F]" />
                <span className="font-bold text-[#E8E6DF]">MIDNIGHT COMPACT ZK-PROVER CIRCUIT</span>
              </div>

              <div className="p-4 bg-[#121212] border border-white/[0.06] space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#8A8882]">Private Witness Input:</span>
                  <span className="text-[#E8E6DF]">monthlyIncome (Local RAM)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A8882]">Public Circuit Input:</span>
                  <span className="text-[#E8E6DF]">requiredIncome = £{demoThreshold.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A8882]">Circuit Predicate:</span>
                  <span className="text-[#FF5A5F] font-bold">assert(monthlyIncome ≥ requiredIncome)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="text-xs font-mono text-[#8A8882] hover:text-[#E8E6DF] cursor-pointer"
              >
                ← BACK
              </button>
              <button
                onClick={handleRunProver}
                disabled={isGenerating}
                id="btn-demo-run-prover"
                className="px-6 py-3 bg-[#E8E6DF] text-black hover:bg-white font-bold text-xs uppercase flex items-center gap-2 cursor-pointer rounded-[2px]"
              >
                {isGenerating ? (
                  <span>SYNTHESIZING PROOF...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-black" />
                    <span>GENERATE ZK PROOF →</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Verifier Outcome */}
        {step === 4 && proofResult && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 bg-[#090909] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="font-bold text-[#E8E6DF] uppercase">VERIFIER RECEIPT OUTCOME</span>
                <span className="text-[10px] text-[#8A8882]">MIDNIGHT LEDGER</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#121212] border border-white/[0.06]">
                  <div className="text-[9px] text-[#8A8882] uppercase">Requirement</div>
                  <div className="font-bold text-[#E8E6DF] mt-0.5">≥ £{demoThreshold.toLocaleString()}/MO</div>
                </div>

                <div className={`p-3 border ${
                  proofResult.isVerified ? 'bg-[#0A100D] border-[#26A17B]' : 'bg-[#150A0A] border-[#FF5A5F]'
                }`}>
                  <div className="text-[9px] text-[#8A8882] uppercase">Result</div>
                  <div className={`font-bold flex items-center gap-1.5 mt-0.5 ${
                    proofResult.isVerified ? 'text-[#26A17B]' : 'text-[#FF5A5F]'
                  }`}>
                    {proofResult.isVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{proofResult.isVerified ? 'PASSED' : 'NOT SATISFIED'}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#121212] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-[#8A8882] uppercase">Plaintext Salary Disclosed</div>
                  <div className="font-bold text-[#E8E6DF] flex items-center gap-1.5 mt-0.5">
                    <Lock className="w-3 h-3 text-[#FF5A5F]" />
                    <span>0 bytes revealed (Zero-Knowledge)</span>
                  </div>
                </div>
                <span className="text-[10px] text-[#26A17B] font-bold px-2 py-0.5 bg-[#26A17B]/20 border border-[#26A17B]/40">
                  REDACTED
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => resetToScenario(4720, 2500, 'Alex')}
                className="text-xs font-mono text-[#8A8882] hover:text-[#E8E6DF] flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESTART DEMO</span>
              </button>
              <button
                onClick={handleCompleteAndApply}
                className="px-5 py-3 bg-[#E8E6DF] text-black hover:bg-white font-bold text-xs uppercase cursor-pointer rounded-[2px]"
              >
                APPLY TO WORKSPACE →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
