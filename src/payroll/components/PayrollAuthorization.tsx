import React from 'react';
import { ArrowLeft, ShieldCheck, CheckCircle2, ArrowRight, Zap } from 'lucide-react';
import { PayrollBatch } from '../types/payroll';

interface PayrollAuthorizationProps {
  batch: PayrollBatch;
  onBack: () => void;
  onAuthorizeAndExecute: () => void;
  executionMode: 'DEMO' | 'LIVE';
}

export const PayrollAuthorization: React.FC<PayrollAuthorizationProps> = ({
  batch,
  onBack,
  onAuthorizeAndExecute,
  executionMode,
}) => {
  const conditions = [
    {
      id: 'c1',
      title: 'Payroll Prepared',
      status: batch.recipients.length > 0,
      description: `Batch configuration complete with ${batch.recipients.length} private recipient${batch.recipients.length === 1 ? '' : 's'}.`,
    },
    {
      id: 'c2',
      title: executionMode === 'LIVE' ? 'Preview Recipients Validated' : 'Demo Recipients Prepared',
      status: batch.recipients.length > 0,
      description: executionMode === 'LIVE'
        ? 'Recipient destinations passed Midnight Preview Bech32m network and checksum validation.'
        : 'Demo recipient identifiers are isolated from LIVE state.',
    },
    {
      id: 'c3',
      title: 'Wallet Authorization Boundary',
      status: true,
      description: executionMode === 'LIVE'
        ? 'The actual cryptographic approval happens in the connected Midnight Preview wallet during submission.'
        : 'Demo approval is clearly separated from a real wallet signature.',
    },
    {
      id: 'c4',
      title: 'Private Data Protected',
      status: true,
      description: 'Plaintext compensation and recipient addresses are not Compact circuit arguments or public ledger fields.',
    },
  ];

  const allSatisfied = conditions.every((condition) => condition.status);

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <button onClick={onBack} className="text-xs font-mono uppercase text-[#8A8882] hover:text-[#E8E6DF] flex items-center gap-1.5 transition-colors cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO REVIEW</span>
        </button>
        <span className="text-[10px] font-mono text-[#26A17B] uppercase font-bold">[ {conditions.filter((condition) => condition.status).length}/4 CONDITIONS READY ]</span>
      </div>

      <div className="bg-[#0E0E0E] border border-white/[0.1] rounded-[2px] overflow-hidden">
        <div className="p-6 bg-[#121212] border-b border-white/[0.08]">
          <div className="text-[10px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">[ PRE-FLIGHT VERIFICATION GATEWAY / {executionMode} ]</div>
          <h2 className="text-2xl sm:text-3xl font-condensed font-extrabold uppercase text-[#E8E6DF] mt-1">PAYROLL AUTHORIZATION</h2>
          <p className="text-xs font-mono text-[#8A8882] mt-1">Prepare the private batch for a real Midnight Preview ZK authorization or an explicitly isolated demo run.</p>
        </div>

        <div className="p-6 space-y-3 font-mono text-xs">
          {conditions.map((item) => (
            <div key={item.id} className="p-4 bg-[#080808] border border-white/[0.06] flex items-start justify-between gap-4">
              <div className="space-y-1"><div className="font-bold text-[#E8E6DF]">{item.title}</div><div className="text-[11px] text-[#8A8882]">{item.description}</div></div>
              <div className={`shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1 border ${item.status ? 'text-[#26A17B] bg-[#26A17B]/10 border-[#26A17B]/30' : 'text-[#FF5A5F] bg-[#FF5A5F]/10 border-[#FF5A5F]/30'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{item.status ? 'READY' : 'BLOCKED'}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-6 mb-6 p-3 bg-[#0A100D] border border-[#26A17B]/30 text-[11px] font-mono text-[#8A8882] space-y-1">
          <div className="text-[10px] font-bold text-[#26A17B] uppercase flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /><span>PROTOCOL DISCLOSURE:</span></div>
          <p>{executionMode === 'LIVE'
            ? 'The next step submits a real Compact authorization transaction on Midnight Preview. It proves a private batch commitment and creates an audit receipt. It does not claim that payroll assets have already been transferred to recipients.'
            : 'Demo mode never emits a synthetic on-chain transaction hash or contract address.'}</p>
        </div>

        <div className="p-6 bg-[#121212] border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
          <div className="text-[11px] text-[#8A8882]">Target: <span className="text-[#E8E6DF]">{batch.name}</span> ({batch.recipients.length} recipients)</div>
          <button onClick={onAuthorizeAndExecute} disabled={!allSatisfied} id="btn-execute-private-payroll" className="px-6 py-3 bg-[#FF5A5F] text-black hover:bg-white disabled:bg-[#333] disabled:text-[#777] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed">
            <Zap className="w-4 h-4" />
            <span>[ {executionMode === 'LIVE' ? 'CONTINUE TO PREVIEW AUTHORIZATION' : 'RUN DEMO AUTHORIZATION'} ]</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
