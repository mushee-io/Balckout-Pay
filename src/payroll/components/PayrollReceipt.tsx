import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, Download, ArrowRight } from 'lucide-react';
import { PayrollBatch, PayrollExecutionResult } from '../types/payroll';

interface PayrollReceiptProps {
  batch: PayrollBatch;
  result: PayrollExecutionResult;
  onNewPayroll: () => void;
  onBackToOverview: () => void;
}

export const PayrollReceipt: React.FC<PayrollReceiptProps> = ({
  batch,
  result,
  onNewPayroll,
  onBackToOverview,
}) => {
  const [showFullReceipt, setShowFullReceipt] = useState(false);

  const handleExportJson = () => {
    const certPayload = {
      protocol: 'BLACKOUT_PAYROLL',
      version: '1.0.0_MIDNIGHT',
      receiptType: result.mode === 'LIVE' ? 'PRIVATE_PAYROLL_AUTHORIZATION_AUDIT' : 'DEMO_PAYROLL_AUTHORIZATION',
      timestamp: new Date(result.timestamp).toISOString(),
      batch: {
        id: batch.id,
        name: batch.name,
        period: batch.period,
        paymentDate: batch.paymentDate,
        assetPolicy: batch.paymentAsset,
        recipientCount: batch.recipients.length,
      },
      verification: {
        network: result.network,
        mode: result.mode,
        status: result.status,
        privacyStatus: result.privacyStatus,
        sensitivePayrollBytesDisclosed: result.dataDisclosedBytes,
        txHash: result.txHash ?? null,
        deploymentTxHash: result.deploymentTxHash ?? null,
        contractAddress: result.contractAddress ?? null,
        blockHeight: result.blockHeight ?? null,
        withheldAttributes: result.unrevealedAttributes,
      },
      settlement: {
        status: 'NOT_ASSERTED_BY_THIS_RECEIPT',
        notice: 'This receipt proves private payroll batch authorization. It does not by itself prove asset delivery to recipients.',
      },
      auditNotice: result.note || 'No plaintext compensation or recipient address was written to public payroll contract state.',
    };

    const blob = new Blob([JSON.stringify(certPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blackout_payroll_authorization_${batch.id}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left font-sans">
      <div className="bg-[#0E0E0E] border border-white/[0.1] rounded-[2px] overflow-hidden">
        <div className="p-8 bg-[#121212] border-b border-white/[0.08] text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#26A17B]/10 border border-[#26A17B]/40 text-[#26A17B] mb-2"><CheckCircle2 className="w-6 h-6" /></div>
          <div className="text-[10px] font-mono tracking-[0.25em] text-[#26A17B] uppercase font-bold">[ AUTHORIZATION CONFIRMED ]</div>
          <h2 className="text-3xl sm:text-4xl font-condensed font-extrabold uppercase text-[#E8E6DF]">PRIVATE PAYROLL AUTHORIZED</h2>
          <div className="text-sm font-mono text-[#8A8882]">{batch.name} · {batch.period}</div>
        </div>

        <div className="p-6 space-y-4 font-mono text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#080808] border border-white/[0.06] space-y-1"><div className="text-[10px] text-[#8A8882] uppercase">RECIPIENTS</div><div className="text-lg font-bold text-[#E8E6DF]">{batch.recipients.length}</div></div>
            <div className="p-3 bg-[#080808] border border-white/[0.06] space-y-1"><div className="text-[10px] text-[#FF5A5F] uppercase font-bold">COMPENSATION</div><div className="text-lg font-bold text-[#FF5A5F]">{result.totalDisplay}</div></div>
            <div className="p-3 bg-[#080808] border border-white/[0.06] space-y-1"><div className="text-[10px] text-[#8A8882] uppercase">NETWORK</div><div className="text-lg font-bold text-[#E8E6DF]">{result.network}</div></div>
            <div className="p-3 bg-[#080808] border border-white/[0.06] space-y-1"><div className="text-[10px] text-[#8A8882] uppercase">STATUS</div><div className="text-lg font-bold text-[#26A17B]">{result.status}</div></div>
          </div>

          <div className="p-3 bg-[#0A100D] border border-[#26A17B]/40 flex items-center justify-between text-xs font-bold text-[#26A17B]"><span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /><span>PRIVACY STATUS:</span></span><span>{result.privacyStatus}</span></div>

          <div className="p-4 bg-[#080808] border border-white/[0.06] space-y-2 text-[11px] text-[#8A8882]">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.04] pb-1.5"><span>AUTHORIZATION TX:</span><span className="font-mono text-[#E8E6DF] break-all text-right">{result.txHash || '[ DEMO — NO ON-CHAIN BROADCAST ]'}</span></div>
            {result.deploymentTxHash && <div className="flex items-start justify-between gap-4 border-b border-white/[0.04] pb-1.5"><span>CONTRACT DEPLOY TX:</span><span className="font-mono text-[#E8E6DF] break-all text-right">{result.deploymentTxHash}</span></div>}
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.04] pb-1.5"><span>CONTRACT:</span><span className="font-mono text-[#E8E6DF] break-all text-right">{result.contractAddress || '[ DEMO — NO CONTRACT ]'}</span></div>
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5"><span>BLOCK HEIGHT:</span><span className="font-mono text-[#E8E6DF]">{result.blockHeight ?? '[ DEMO ]'}</span></div>
            <div className="flex items-center justify-between"><span>SENSITIVE PAYROLL DATA DISCLOSED:</span><span className="font-bold text-[#26A17B]">{result.dataDisclosedBytes} BYTES</span></div>
          </div>

          <div className="p-4 bg-[#12100A] border border-[#FFB800]/30 text-[11px] text-[#C3B98D] leading-relaxed">
            <strong className="text-[#FFB800]">SETTLEMENT BOUNDARY:</strong> this receipt proves that the private payroll batch was authorized by the BLACKOUT PAYROLL Compact contract. It does not claim that the selected asset has already been transferred to recipients.
          </div>

          {showFullReceipt && (
            <div className="p-4 bg-[#050505] border border-white/[0.08] space-y-3">
              <div className="text-[10px] text-[#8A8882] uppercase font-bold flex items-center justify-between"><span>WITHHELD PRIVATE ATTRIBUTES</span><span className="text-[#26A17B]">[VERIFIED PRIVATE]</span></div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-[#8A8882]">{result.unrevealedAttributes.map((attribute) => <li key={attribute} className="text-[#E8E6DF]">{attribute}</li>)}</ul>
              {result.note && <div className="text-[10px] text-[#8A8882] pt-2 border-t border-white/[0.04]">{result.note}</div>}
            </div>
          )}
        </div>

        <div className="p-6 bg-[#121212] border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button onClick={() => setShowFullReceipt(!showFullReceipt)} className="px-4 py-2.5 bg-[#181818] hover:bg-[#222] border border-white/[0.1] text-[#E8E6DF] uppercase cursor-pointer w-full sm:w-auto">{showFullReceipt ? 'HIDE RECEIPT' : 'VIEW RECEIPT'}</button>
            <button onClick={handleExportJson} className="px-4 py-2.5 bg-[#181818] hover:bg-[#222] border border-white/[0.1] text-[#26A17B] uppercase flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"><Download className="w-3.5 h-3.5" /><span>EXPORT JSON</span></button>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button onClick={onBackToOverview} className="px-4 py-2.5 border border-white/[0.1] text-[#8A8882] hover:text-[#E8E6DF] uppercase cursor-pointer w-full sm:w-auto">OVERVIEW</button>
            <button onClick={onNewPayroll} className="px-5 py-2.5 bg-[#E8E6DF] text-black hover:bg-white font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"><span>+ NEW PAYROLL</span><ArrowRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};
