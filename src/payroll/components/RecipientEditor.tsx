import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { PayrollRecipient } from '../types/payroll';
import { validateMidnightPreviewAddress } from '../midnight/address';

interface RecipientEditorProps {
  recipients: PayrollRecipient[];
  onChangeRecipients: (recipients: PayrollRecipient[]) => void;
  currency: string;
  executionMode: 'DEMO' | 'LIVE';
}

export const RecipientEditor: React.FC<RecipientEditorProps> = ({
  recipients,
  onChangeRecipients,
  currency,
  executionMode,
}) => {
  const [employeeId, setEmployeeId] = useState('');
  const [label, setLabel] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [maskAmounts, setMaskAmounts] = useState(false);

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);

    const cleanId = employeeId.trim().toUpperCase();
    const cleanLabel = label.trim();
    const cleanAddress = walletAddress.trim();
    const amountNum = Number(paymentAmount);

    if (!cleanId) {
      setInputError('Employee ID is required (e.g. EMP-015).');
      return;
    }

    let normalizedAddress = cleanAddress;
    if (executionMode === 'LIVE') {
      const validation = validateMidnightPreviewAddress(cleanAddress);
      if (!validation.ok || !validation.normalized) {
        setInputError(validation.error || 'Valid Midnight Preview address required.');
        return;
      }
      normalizedAddress = validation.normalized;
      if (recipients.length >= 4) {
        setInputError('LIVE Preview batches support up to 4 private recipients. Create another batch for additional recipients.');
        return;
      }
    } else if (!cleanAddress || !cleanAddress.startsWith('midnight1')) {
      setInputError('Demo recipient address must start with "midnight1".');
      return;
    }

    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setInputError('Payment amount must be a positive number.');
      return;
    }
    if (executionMode === 'LIVE' && !Number.isSafeInteger(amountNum)) {
      setInputError('LIVE Preview payroll currently accepts whole-unit compensation amounts only.');
      return;
    }
    if (amountNum > 1_000_000_000_000) {
      setInputError('Individual payment amount exceeds the protocol maximum.');
      return;
    }

    const newRecipient: PayrollRecipient = {
      id: `rec-${Date.now().toString(36)}`,
      employeeId: cleanId,
      label: cleanLabel || 'Team Member',
      walletAddress: normalizedAddress,
      paymentAmount: amountNum,
      currency,
      status: 'READY',
      eligibilityStatus: 'ELIGIBLE',
    };

    onChangeRecipients([...recipients, newRecipient]);
    setEmployeeId('');
    setLabel('');
    setWalletAddress('');
    setPaymentAmount('');
  };

  const handleRemoveRecipient = (id: string) => {
    onChangeRecipients(recipients.filter((recipient) => recipient.id !== id));
  };

  const handleLoadSampleRecipients = () => {
    if (executionMode === 'LIVE') return;
    const samples: PayrollRecipient[] = [
      {
        id: `rec-s1-${Date.now()}`,
        employeeId: 'EMP-001',
        label: 'Lead Protocol Cryptographer',
        walletAddress: 'midnight1demo_payroll_recipient_001',
        paymentAmount: 4720,
        currency,
        status: 'READY',
        eligibilityStatus: 'ELIGIBLE'
      },
      {
        id: `rec-s2-${Date.now()}`,
        employeeId: 'EMP-002',
        label: 'Senior Compact Circuits Engineer',
        walletAddress: 'midnight1demo_payroll_recipient_002',
        paymentAmount: 3850,
        currency,
        status: 'READY',
        eligibilityStatus: 'ELIGIBLE'
      },
    ];
    onChangeRecipients([...recipients, ...samples]);
  };

  return (
    <div className="space-y-6 text-left font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="text-[10px] font-mono tracking-wider text-[#8A8882] uppercase">PAYROLL ROSTER</div>
          <div className="text-lg font-condensed font-extrabold uppercase text-[#E8E6DF] flex items-center gap-2">
            <span>{recipients.length} RECIPIENTS CONFIGURED</span>
            <span className="text-xs font-mono text-[#26A17B] font-normal">[READY]</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMaskAmounts(!maskAmounts)}
            className="px-3 py-1.5 bg-[#121212] border border-white/[0.1] text-[#8A8882] hover:text-[#E8E6DF] font-mono text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {maskAmounts ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{maskAmounts ? 'REVEAL LOCALLY' : 'MASK AMOUNTS'}</span>
          </button>

          {executionMode === 'DEMO' && recipients.length === 0 && (
            <button
              type="button"
              onClick={handleLoadSampleRecipients}
              className="px-3 py-1.5 bg-[#181818] border border-white/[0.1] hover:border-[#FF5A5F] text-[#E8E6DF] font-mono text-xs uppercase transition-colors cursor-pointer"
            >
              + POPULATE SAMPLE RECIPIENTS
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleAddRecipient} className="p-4 bg-[#0A0A0A] border border-white/[0.08] space-y-4 font-mono text-xs">
        <div className="text-[10px] uppercase font-bold text-[#E8E6DF] flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 text-[#FF5A5F]" />
          <span>ADD RECIPIENT TO BATCH</span>
        </div>

        {inputError && (
          <div className="p-2.5 bg-[#1A0A0A] border border-[#FF5A5F]/60 text-[#FF5A5F] flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{inputError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-3 space-y-1">
            <label className="text-[10px] text-[#8A8882] uppercase">Employee ID *</label>
            <input type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="EMP-015" className="w-full bg-[#121212] border border-white/[0.1] px-3 py-2 text-[#E8E6DF] focus:border-[#FF5A5F] outline-none" />
          </div>

          <div className="sm:col-span-4 space-y-1">
            <label className="text-[10px] text-[#8A8882] uppercase">Role / Label</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Research Scientist" className="w-full bg-[#121212] border border-white/[0.1] px-3 py-2 text-[#E8E6DF] focus:border-[#FF5A5F] outline-none" />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className="text-[10px] text-[#8A8882] uppercase">Amount ({currency}) *</label>
            <input type="number" step="1" min="1" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="4200" className="w-full bg-[#121212] border border-white/[0.1] px-3 py-2 text-[#E8E6DF] focus:border-[#FF5A5F] outline-none font-bold" />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button type="submit" className="w-full py-2 bg-[#E8E6DF] text-black hover:bg-white font-bold uppercase transition-all cursor-pointer">+ ADD</button>
          </div>

          <div className="sm:col-span-12 space-y-1">
            <label className="text-[10px] text-[#8A8882] uppercase">
              {executionMode === 'LIVE' ? 'Midnight Preview Recipient Address (Bech32m) *' : 'Demo Recipient Address *'}
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder={executionMode === 'LIVE' ? 'mn_addr_preview1… or mn_shield-addr_preview1…' : 'midnight1demo…'}
              className="w-full bg-[#121212] border border-white/[0.1] px-3 py-2 text-[#E8E6DF] focus:border-[#FF5A5F] outline-none text-[11px]"
            />
            {executionMode === 'LIVE' && (
              <div className="text-[9px] text-[#8A8882] pt-1">Mainnet, Preprod and malformed addresses are rejected. Copy the Preview address directly from the recipient wallet.</div>
            )}
          </div>
        </div>
      </form>

      <div className="border border-white/[0.08] bg-[#0E0E0E] overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] bg-[#070707] text-[10px] text-[#8A8882] uppercase">
              <th className="py-3 px-4">EMPLOYEE ID / LABEL</th>
              <th className="py-3 px-4">MIDNIGHT WALLET</th>
              <th className="py-3 px-4 text-right">COMPENSATION</th>
              <th className="py-3 px-4 text-center">ELIGIBILITY</th>
              <th className="py-3 px-4 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {recipients.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-[#8A8882]">No recipients added yet. Add recipients above{executionMode === 'DEMO' ? ' or load the sample roster' : ''}.</td></tr>
            ) : recipients.map((recipient) => (
              <tr key={recipient.id} className="hover:bg-[#141414] transition-colors">
                <td className="py-3 px-4"><div className="font-bold text-[#E8E6DF]">{recipient.employeeId}</div><div className="text-[10px] text-[#8A8882]">{recipient.label}</div></td>
                <td className="py-3 px-4 text-[11px] text-[#8A8882]"><span className="font-mono">{recipient.walletAddress.slice(0, 18)}...{recipient.walletAddress.slice(-8)}</span></td>
                <td className="py-3 px-4 text-right font-bold">{maskAmounts ? <span className="text-[#8A8882] tracking-wider">••••••</span> : <span className="text-[#26A17B]">{currency} {recipient.paymentAmount.toLocaleString()}</span>}</td>
                <td className="py-3 px-4 text-center"><span className="inline-flex items-center gap-1 text-[10px] text-[#26A17B] bg-[#26A17B]/10 px-2 py-0.5 border border-[#26A17B]/30"><Check className="w-2.5 h-2.5" /><span>{recipient.eligibilityStatus || 'ELIGIBLE'}</span></span></td>
                <td className="py-3 px-4 text-right"><button type="button" onClick={() => handleRemoveRecipient(recipient.id)} className="text-[#8A8882] hover:text-[#FF5A5F] p-1 transition-colors cursor-pointer" title="Remove recipient"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-[#0A0A0A] border border-white/[0.06] text-[11px] font-mono text-[#8A8882] flex items-center gap-2">
        <Lock className="w-3.5 h-3.5 text-[#FF5A5F] shrink-0" />
        <span><strong>Zero-Knowledge Memory Invariant:</strong> recipient addresses and individual compensation remain private witness data. LIVE Preview stores only one-way authorization evidence, never plaintext payroll values.</span>
      </div>
    </div>
  );
};
