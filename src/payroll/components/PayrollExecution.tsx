import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  AlertTriangle, 
  Clock, 
  Cpu, 
  Wallet, 
  Send, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { PayrollBatch, PayrollExecutionResult, PayrollExecutionStage } from '../types/payroll';

interface PayrollExecutionProps {
  batch: PayrollBatch;
  executionMode: 'DEMO' | 'LIVE';
  onComplete: (result: PayrollExecutionResult) => void;
  onCancel: () => void;
  onSwitchMode: (mode: 'DEMO' | 'LIVE') => void;
}

const STAGES: { stage: PayrollExecutionStage; label: string; desc: string }[] = [
  { 
    stage: 'PREPARING_PAYROLL', 
    label: 'PREPARING PAYROLL', 
    desc: 'Compiling batch manifest, recipient list, and currency bindings.' 
  },
  { 
    stage: 'PREPARING_PRIVATE_STATE', 
    label: 'PREPARING PRIVATE STATE', 
    desc: 'Blinding individual salary values in client memory enclaves.' 
  },
  { 
    stage: 'GENERATING_PROOF', 
    label: 'GENERATING PROOF', 
    desc: 'Synthesizing zero-knowledge circuit constraints for aggregate solvency.' 
  },
  { 
    stage: 'AWAITING_WALLET_APPROVAL', 
    label: 'AWAITING WALLET APPROVAL', 
    desc: 'User cryptographic authorization signature required for execution payload.' 
  },
  { 
    stage: 'SUBMITTING_TO_MIDNIGHT', 
    label: 'SUBMITTING TO MIDNIGHT', 
    desc: 'Broadcasting shielded zero-knowledge transaction to Midnight testnet.' 
  },
  { 
    stage: 'CONFIRMING', 
    label: 'CONFIRMING', 
    desc: 'Awaiting block inclusion and state commitment confirmation.' 
  },
  { 
    stage: 'PAYROLL_COMPLETE', 
    label: 'PAYROLL COMPLETE', 
    desc: 'Batch finalized. Zero employee compensation leaked to public ledger.' 
  },
];

export const PayrollExecution: React.FC<PayrollExecutionProps> = ({
  batch,
  executionMode,
  onComplete,
  onCancel,
  onSwitchMode,
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isPausedForApproval, setIsPausedForApproval] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // In DEMO mode, manage stage progression
  useEffect(() => {
    if (executionMode !== 'DEMO') return;

    if (currentStageIndex === 3) {
      // Stage 3 is AWAITING_WALLET_APPROVAL
      setIsPausedForApproval(true);
      return;
    }

    if (currentStageIndex < STAGES.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStageIndex((prev) => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (currentStageIndex === STAGES.length - 1) {
      // Final stage reached
      const result: PayrollExecutionResult = {
        batchId: batch.id,
        batchName: batch.name,
        recipientCount: batch.recipients.length,
        totalDisplay: 'PRIVATE',
        network: 'Midnight TestNet-02 (Simulated Runtime)',
        mode: 'DEMO',
        status: 'CONFIRMED',
        timestamp: Date.now(),
        privacyStatus: 'COMPENSATION PRIVATE',
        unrevealedAttributes: [
          'Individual Employee Compensation Amounts',
          'Exact Aggregate Payroll Total',
          'Employee Bank Routing Details',
          'Tax & Deduction Schedules'
        ],
        dataDisclosedBytes: 0,
        note: 'Simulated Demo Run: In compliance with Blackout protocol integrity guarantees, zero synthetic on-chain transaction hashes or contract addresses are emitted.'
      };
      onComplete(result);
    }
  }, [currentStageIndex, executionMode, batch, onComplete]);

  const handleApproveWallet = () => {
    setIsPausedForApproval(false);
    setCurrentStageIndex(4); // proceed to SUBMITTING_TO_MIDNIGHT
  };

  // If LIVE mode: execution is strictly disabled per section 14
  if (executionMode === 'LIVE') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 text-left font-sans">
        <div className="p-8 bg-[#0E0E0E] border border-white/[0.1] rounded-[2px] space-y-6">
          <div className="text-[10px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">
            [ PROTOCOL INTEGRITY ENFORCEMENT ]
          </div>

          <h2 className="text-3xl sm:text-4xl font-condensed font-extrabold uppercase text-[#E8E6DF]">
            BLACK PAYROLL LIVE EXECUTION
          </h2>

          <div className="p-3 bg-[#1A0D0D] border border-[#FF5A5F]/40 text-[#FF5A5F] font-mono text-xs uppercase font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#FF5A5F]" />
            <span>STATUS: COMING SOON (WAVE 2/3 ROADMAP)</span>
          </div>

          <div className="space-y-3 font-mono text-xs text-[#8A8882] leading-relaxed">
            <p>
              The Midnight Wave 1 testnet currently supports single-party income eligibility verification via <code className="text-[#E8E6DF]">income_verifier.compact</code>.
            </p>
            <p>
              The multi-party private compensation and batch payroll smart contract is scheduled for deployment in Wave 2/3.
            </p>
            <p className="text-[#E8E6DF]">
              In accordance with Blackout protocol integrity rules, live execution is disabled to guarantee that zero synthetic transactions, fabricated contract addresses, or fake hashes are ever presented to the user.
            </p>
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center gap-3 font-mono text-xs">
            <button
              onClick={() => onSwitchMode('DEMO')}
              className="w-full sm:w-auto px-5 py-3 bg-[#E8E6DF] text-black hover:bg-white font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              SWITCH TO DEMO EXECUTION
            </button>
            <button
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-3 border border-white/[0.1] text-[#8A8882] hover:text-[#E8E6DF] uppercase transition-colors cursor-pointer"
            >
              RETURN TO OVERVIEW
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStageObj = STAGES[currentStageIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div>
          <div className="text-[10px] font-mono tracking-[0.25em] text-[#26A17B] uppercase font-bold">
            [ DEMO RUNTIME // REAL-TIME STAGE PROGRESSION ]
          </div>
          <h2 className="text-2xl sm:text-3xl font-condensed font-extrabold uppercase text-[#E8E6DF] mt-1">
            PAYROLL EXECUTION
          </h2>
        </div>

        <div className="text-xs font-mono text-[#8A8882]">
          STAGE {currentStageIndex + 1} / {STAGES.length}
        </div>
      </div>

      <div className="bg-[#0E0E0E] border border-white/[0.1] rounded-[2px] overflow-hidden">
        {/* Active Stage Banner */}
        <div className="p-6 bg-[#121212] border-b border-white/[0.08] flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] font-mono text-[#8A8882] uppercase">
              CURRENT OPERATION:
            </div>
            <div className="text-xl font-condensed font-extrabold uppercase text-[#E8E6DF] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#26A17B] animate-pulse"></span>
              <span>{currentStageObj.label}</span>
            </div>
            <div className="text-xs font-mono text-[#8A8882]">
              {currentStageObj.desc}
            </div>
          </div>
        </div>

        {/* Vertical Pipeline Stepper */}
        <div className="p-6 space-y-3 font-mono text-xs">
          {STAGES.map((s, idx) => {
            const isDone = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const isPending = idx > currentStageIndex;

            return (
              <div
                key={s.stage}
                className={`p-3 border transition-all flex items-center justify-between gap-4 ${
                  isCurrent
                    ? 'bg-[#181818] border-[#26A17B] text-[#E8E6DF]'
                    : isDone
                    ? 'bg-[#080808] border-white/[0.06] text-[#8A8882]'
                    : 'bg-[#050505] border-transparent text-[#444]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold border ${
                    isDone
                      ? 'border-[#26A17B] bg-[#26A17B]/20 text-[#26A17B]'
                      : isCurrent
                      ? 'border-[#26A17B] text-[#26A17B] animate-pulse'
                      : 'border-white/[0.1] text-[#444]'
                  }`}>
                    {isDone ? '✓' : idx + 1}
                  </span>
                  <div>
                    <div className={`font-bold ${isCurrent ? 'text-[#E8E6DF]' : isDone ? 'text-[#8A8882]' : 'text-[#444]'}`}>
                      {s.label}
                    </div>
                  </div>
                </div>

                <div className="text-[10px]">
                  {isDone && <span className="text-[#26A17B]">COMPLETE</span>}
                  {isCurrent && <span className="text-[#26A17B] font-bold animate-pulse">EXECUTING...</span>}
                  {isPending && <span className="text-[#444]">PENDING</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Interaction Point for Wallet Approval */}
        {isPausedForApproval && (
          <div className="p-6 bg-[#161616] border-t border-[#FF5A5F]/40 space-y-4 font-mono text-xs">
            <div className="flex items-center gap-2 text-[#FF5A5F] font-bold text-xs uppercase">
              <Wallet className="w-4 h-4" />
              <span>CRYPTOGRAPHIC WALLET SIGNATURE REQUIRED</span>
            </div>
            <p className="text-[#8A8882] text-xs leading-relaxed">
              Batch authorization requires a cryptographic signature over the commitment root. No salary numbers will be exposed to the signer or network.
            </p>
            <button
              onClick={handleApproveWallet}
              id="btn-approve-wallet-signature"
              className="px-6 py-2.5 bg-[#E8E6DF] text-black hover:bg-white font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>[ APPROVE EXECUTION SIGNATURE ]</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="p-4 bg-[#090909] border-t border-white/[0.06] text-[11px] font-mono text-[#8A8882] flex items-center justify-between">
          <span>BATCH: {batch.name}</span>
          <span className="text-[#26A17B]">[ DEMO ENVIRONMENT ]</span>
        </div>
      </div>
    </div>
  );
};
