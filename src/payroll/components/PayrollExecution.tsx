import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Wallet } from 'lucide-react';
import { PayrollBatch, PayrollExecutionResult, PayrollExecutionStage } from '../types/payroll';
import { authorizePayrollOnPreview } from '../midnight/live-payroll';

interface PayrollExecutionProps {
  batch: PayrollBatch;
  executionMode: 'DEMO' | 'LIVE';
  onComplete: (result: PayrollExecutionResult) => void;
  onCancel: () => void;
  onSwitchMode: (mode: 'DEMO' | 'LIVE') => void;
}

const STAGES: { stage: PayrollExecutionStage; label: string; desc: string }[] = [
  { stage: 'PREPARING_PAYROLL', label: 'PREPARING PAYROLL', desc: 'Validating batch metadata and recipient network addresses.' },
  { stage: 'PREPARING_PRIVATE_STATE', label: 'PREPARING PRIVATE STATE', desc: 'Hashing recipients and binding compensation values inside the private witness.' },
  { stage: 'GENERATING_PROOF', label: 'GENERATING ZK PROOF', desc: 'Using wallet-delegated proving for the Compact payroll authorization circuit.' },
  { stage: 'AWAITING_WALLET_APPROVAL', label: 'AWAITING WALLET APPROVAL', desc: 'A real Midnight Preview wallet approval is required.' },
  { stage: 'SUBMITTING_TO_MIDNIGHT', label: 'SUBMITTING TO MIDNIGHT', desc: 'Broadcasting the real authorization transaction to Midnight Preview.' },
  { stage: 'CONFIRMING', label: 'CONFIRMING', desc: 'Reading the finalized transaction reference and block height.' },
  { stage: 'PAYROLL_COMPLETE', label: 'AUTHORIZATION FINALIZED', desc: 'Private payroll authorization finalized without exposing compensation or recipient addresses.' },
];

const stageIndex = (stage: PayrollExecutionStage): number => {
  if (stage === 'FAILED') return -1;
  const index = STAGES.findIndex((item) => item.stage === stage);
  return index < 0 ? 0 : index;
};

function isWalletProvingDisconnect(message: string): boolean {
  return /wallet ui disconnected|\bdisconnected\b|(?:prove|proving).*returned an error/i.test(message);
}

export const PayrollExecution: React.FC<PayrollExecutionProps> = ({
  batch,
  executionMode,
  onComplete,
  onCancel,
  onSwitchMode,
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isPausedForApproval, setIsPausedForApproval] = useState(false);
  const [liveBusy, setLiveBusy] = useState(false);
  const [liveStarted, setLiveStarted] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [stageMessage, setStageMessage] = useState(STAGES[0].desc);

  useEffect(() => {
    if (executionMode !== 'DEMO') return;

    if (currentStageIndex === 3) {
      setIsPausedForApproval(true);
      return;
    }

    if (currentStageIndex < STAGES.length - 1) {
      const timer = setTimeout(() => setCurrentStageIndex((previous) => previous + 1), 700);
      return () => clearTimeout(timer);
    }

    const result: PayrollExecutionResult = {
      batchId: batch.id,
      batchName: batch.name,
      recipientCount: batch.recipients.length,
      totalDisplay: 'PRIVATE',
      network: 'Midnight Demo Sandbox',
      mode: 'DEMO',
      status: 'CONFIRMED',
      timestamp: Date.now(),
      privacyStatus: 'COMPENSATION PRIVATE',
      unrevealedAttributes: [
        'Individual Employee Compensation Amounts',
        'Exact Aggregate Payroll Total',
        'Recipient Addresses',
        'Employee Identity Labels',
      ],
      dataDisclosedBytes: 0,
      note: 'Demo-only authorization. No synthetic transaction hash or fake contract address is emitted.',
    };
    onComplete(result);
  }, [currentStageIndex, executionMode, batch, onComplete]);

  const handleApproveDemo = () => {
    setIsPausedForApproval(false);
    setCurrentStageIndex(4);
  };

  const handleLiveAuthorization = async () => {
    if (liveBusy) return;
    setLiveBusy(true);
    setLiveStarted(true);
    setLiveError(null);
    setCurrentStageIndex(0);
    setStageMessage(STAGES[0].desc);

    try {
      const result = await authorizePayrollOnPreview(batch, {
        onStage: (stage, message) => {
          setStageMessage(message);
          if (stage === 'FAILED') {
            setLiveError(message);
            if (isWalletProvingDisconnect(message)) {
              // A delegated prover can lose its wallet popup/session after a
              // one-time deployment approval. That failure happened before a
              // payroll call was submitted, so present proof generation as the
              // retry point instead of falsely marking later stages complete.
              setCurrentStageIndex(stageIndex('GENERATING_PROOF'));
            }
            return;
          }
          setCurrentStageIndex(stageIndex(stage));
        },
      });
      onComplete(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'BLACKOUT_PAYROLL_PREVIEW_AUTHORIZATION_FAILED';
      setLiveError(message);
      if (isWalletProvingDisconnect(message)) {
        setCurrentStageIndex(stageIndex('GENERATING_PROOF'));
        setStageMessage('Wallet proving UI disconnected before the payroll authorization was submitted. Re-open the wallet approval UI and retry; an existing payroll contract deployment will be reused.');
      }
    } finally {
      setLiveBusy(false);
    }
  };

  const currentStageObj = STAGES[currentStageIndex] ?? STAGES[0];
  const environmentLabel = executionMode === 'LIVE' ? 'MIDNIGHT PREVIEW / LIVE ON-CHAIN' : 'DEMO SANDBOX';
  const walletProvingDisconnected = Boolean(liveError && isWalletProvingDisconnect(liveError));

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div>
          <div className={`text-[10px] font-mono tracking-[0.25em] uppercase font-bold ${executionMode === 'LIVE' ? 'text-[#26A17B]' : 'text-[#FFB800]'}`}>
            [ {environmentLabel} ]
          </div>
          <h2 className="text-2xl sm:text-3xl font-condensed font-extrabold uppercase text-[#E8E6DF] mt-1">
            PRIVATE PAYROLL AUTHORIZATION
          </h2>
        </div>
        <div className="text-xs font-mono text-[#8A8882]">STAGE {currentStageIndex + 1} / {STAGES.length}</div>
      </div>

      {executionMode === 'LIVE' && !liveStarted && (
        <div className="p-4 bg-[#0A100D] border border-[#26A17B]/30 font-mono text-[11px] text-[#8A8882] leading-relaxed">
          This is the real Preview path. The first authorization may request two wallet approvals: one for the one-time BLACKOUT PAYROLL Compact contract deployment and one for the private batch authorization transaction. No fake transaction fallback is used.
        </div>
      )}

      {liveError && (
        <div className="p-4 bg-[#1A0D0D] border border-[#FF5A5F]/50 text-[#FF5A5F] font-mono text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div>{liveError}</div>
            {walletProvingDisconnected && (
              <div className="text-[#E8E6DF]">
                The payroll call was not finalized. Keep the Midnight wallet approval UI open, then retry below. If the one-time contract deployment already succeeded, BLACKOUT reuses it and does not create a duplicate contract.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-[#0E0E0E] border border-white/[0.1] rounded-[2px] overflow-hidden">
        <div className="p-6 bg-[#121212] border-b border-white/[0.08] flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] font-mono text-[#8A8882] uppercase">CURRENT OPERATION:</div>
            <div className="text-xl font-condensed font-extrabold uppercase text-[#E8E6DF] flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${liveError ? 'bg-[#FF5A5F]' : 'bg-[#26A17B] animate-pulse'}`} />
              <span>{currentStageObj.label}</span>
            </div>
            <div className="text-xs font-mono text-[#8A8882]">{executionMode === 'LIVE' ? stageMessage : currentStageObj.desc}</div>
          </div>
        </div>

        <div className="p-6 space-y-3 font-mono text-xs">
          {STAGES.map((item, index) => {
            const isDone = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            return (
              <div key={item.stage} className={`p-3 border transition-all flex items-center justify-between gap-4 ${isCurrent ? 'bg-[#181818] border-[#26A17B] text-[#E8E6DF]' : isDone ? 'bg-[#080808] border-white/[0.06] text-[#8A8882]' : 'bg-[#050505] border-transparent text-[#444]'}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold border ${isDone ? 'border-[#26A17B] bg-[#26A17B]/20 text-[#26A17B]' : isCurrent ? 'border-[#26A17B] text-[#26A17B]' : 'border-white/[0.1] text-[#444]'}`}>{isDone ? '✓' : index + 1}</span>
                  <div className="font-bold">{item.label}</div>
                </div>
                <div className="text-[10px]">{isDone ? <span className="text-[#26A17B]">COMPLETE</span> : isCurrent ? <span className={liveError ? 'text-[#FF5A5F] font-bold' : 'text-[#26A17B] font-bold'}>{liveError ? 'RETRY REQUIRED' : liveBusy || executionMode === 'DEMO' ? 'ACTIVE' : 'READY'}</span> : <span>PENDING</span>}</div>
              </div>
            );
          })}
        </div>

        {executionMode === 'LIVE' && !liveStarted && (
          <div className="p-6 bg-[#161616] border-t border-[#26A17B]/30 space-y-4 font-mono text-xs">
            <div className="flex items-center gap-2 text-[#26A17B] font-bold uppercase"><Wallet className="w-4 h-4" /><span>MIDNIGHT PREVIEW APPROVAL REQUIRED</span></div>
            <p className="text-[#8A8882] leading-relaxed">The wallet will prove the private batch and authorize the public commitment. Recipient addresses and compensation amounts are not sent as plaintext circuit arguments.</p>
            <button onClick={handleLiveAuthorization} disabled={liveBusy} className="px-6 py-3 bg-[#E8E6DF] text-black hover:bg-white disabled:bg-[#333] disabled:text-[#777] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed">
              <span>{liveBusy ? 'AUTHORIZING…' : '[ AUTHORIZE ON MIDNIGHT PREVIEW ]'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {executionMode === 'LIVE' && liveStarted && liveError && !liveBusy && (
          <div className="p-6 bg-[#161616] border-t border-[#FF5A5F]/35 space-y-4 font-mono text-xs">
            <div className="flex items-center gap-2 text-[#FFB800] font-bold uppercase"><Wallet className="w-4 h-4" /><span>{walletProvingDisconnected ? 'WALLET PROVER RECONNECT REQUIRED' : 'AUTHORIZATION RETRY AVAILABLE'}</span></div>
            <p className="text-[#8A8882] leading-relaxed">
              {walletProvingDisconnected
                ? 'Open/unlock the Midnight wallet, keep its approval window available, then retry. BLACKOUT will request a fresh delegated proving session and reuse any already-deployed payroll contract.'
                : 'The previous attempt did not complete. Retry only after resolving the wallet or network error shown above.'}
            </p>
            <button onClick={handleLiveAuthorization} disabled={liveBusy} className="px-6 py-3 bg-[#E8E6DF] text-black hover:bg-white disabled:bg-[#333] disabled:text-[#777] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed">
              <span>[ RETRY MIDNIGHT AUTHORIZATION ]</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {executionMode === 'DEMO' && isPausedForApproval && (
          <div className="p-6 bg-[#161616] border-t border-[#FF5A5F]/40 space-y-4 font-mono text-xs">
            <div className="flex items-center gap-2 text-[#FF5A5F] font-bold uppercase"><Wallet className="w-4 h-4" /><span>DEMO APPROVAL</span></div>
            <button onClick={handleApproveDemo} className="px-6 py-2.5 bg-[#E8E6DF] text-black hover:bg-white font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"><span>[ APPROVE DEMO AUTHORIZATION ]</span><ArrowRight className="w-3.5 h-3.5" /></button>
          </div>
        )}

        <div className="p-4 bg-[#090909] border-t border-white/[0.06] text-[11px] font-mono text-[#8A8882] flex flex-wrap items-center justify-between gap-3">
          <span>BATCH: {batch.name}</span>
          <span className={executionMode === 'LIVE' ? 'text-[#26A17B]' : 'text-[#FFB800]'}>[ {environmentLabel} ]</span>
        </div>
      </div>

      <div className="flex items-center justify-between font-mono text-xs">
        <button onClick={onCancel} disabled={liveBusy} className="px-4 py-2.5 border border-white/[0.1] text-[#8A8882] hover:text-[#E8E6DF] disabled:opacity-40 uppercase flex items-center gap-1.5 cursor-pointer"><ArrowLeft className="w-3.5 h-3.5" />CANCEL</button>
        {executionMode === 'DEMO' && <button onClick={() => onSwitchMode('LIVE')} className="text-[#26A17B] hover:text-[#E8E6DF] uppercase cursor-pointer">SWITCH TO LIVE PREVIEW →</button>}
      </div>
    </div>
  );
};