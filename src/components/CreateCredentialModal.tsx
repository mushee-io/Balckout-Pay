import React, { useState } from 'react';
import { X, Lock, ShieldCheck, CheckCircle2, KeyRound } from 'lucide-react';
import { CurrencyCode, PrivateIncomeCredential } from '../midnight/types';
import { computeCommitment, generateSecureSalt } from '../midnight/zk-engine';

interface CreateCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCredential: (credential: PrivateIncomeCredential) => void;
  initialCredential?: PrivateIncomeCredential | null;
}

export const CreateCredentialModal: React.FC<CreateCredentialModalProps> = ({
  isOpen,
  onClose,
  onSaveCredential,
  initialCredential,
}) => {
  const [income, setIncome] = useState<string>(
    initialCredential ? initialCredential.monthlyIncome.toString() : '4720'
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    initialCredential ? initialCredential.currency : 'GBP'
  );
  const [label, setLabel] = useState<string>(
    initialCredential ? initialCredential.label : 'Primary Employment Income'
  );
  const [isCreating, setIsCreating] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const numIncome = parseFloat(income);
    if (isNaN(numIncome) || numIncome < 0) {
      return;
    }

    setIsCreating(true);
    try {
      const salt = generateSecureSalt();
      const commitment = await computeCommitment(numIncome, currency, salt);

      const credential: PrivateIncomeCredential = {
        id: `cred_${Math.random().toString(36).substring(2, 8)}`,
        monthlyIncome: numIncome,
        currency,
        salt,
        commitment,
        issuedAt: Date.now(),
        issuer: 'Self-Asserted (Demo / Wave 1)',
        label: label || 'Monthly Net Income',
        status: 'READY',
        isDemo: true,
      };

      setCreatedSuccess(true);
      await new Promise((r) => setTimeout(r, 600));
      onSaveCredential(credential);
      setIsCreating(false);
      setCreatedSuccess(false);
      onClose();
    } catch {
      setIsCreating(false);
    }
  };

  const setPreset = (val: number, name: string) => {
    setIncome(val.toString());
    setLabel(name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-sans select-none">
      <div 
        className="w-full max-w-lg bg-[#0E0E0E] border border-white/[0.12] p-6 sm:p-8 relative text-left shadow-2xl rounded-[2px]"
        id="modal-create-credential"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="text-[10px] font-mono tracking-[0.2em] text-[#FF5A5F] uppercase font-bold">
              [ WITNESS MEMORY VAULT ]
            </div>
            <h3 className="text-xl font-condensed font-extrabold uppercase text-[#E8E6DF]">
              CONFIGURE PRIVATE CREDENTIAL.
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8A8882] hover:text-[#E8E6DF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Banner */}
        <div className="my-4 p-3.5 bg-[#090909] border border-white/[0.08] text-xs font-mono text-[#8A8882] leading-relaxed">
          Your income is stored in local client RAM to generate proofs. Verifiers receive only the boolean verification outcome.
        </div>

        {/* Quick Demo Presets */}
        <div className="mb-4 space-y-2">
          <div className="text-[10px] font-mono text-[#8A8882] uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#FF5A5F]"></span>
            <span>PRESETS FOR TESTING & EVALUATION:</span>
          </div>
          <div className="grid grid-cols-3 gap-2 font-mono">
            <button
              type="button"
              onClick={() => setPreset(4720, 'Alex — Tech Lead Income')}
              className="p-2 bg-[#121212] hover:bg-[#181818] border border-white/[0.08] hover:border-white/[0.2] text-[11px] text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-[#E8E6DF]">£4,720/mo</div>
              <div className="text-[9px] text-[#26A17B]">Pass Scenario</div>
            </button>
            <button
              type="button"
              onClick={() => setPreset(2500, 'Exact Threshold Match')}
              className="p-2 bg-[#121212] hover:bg-[#181818] border border-white/[0.08] hover:border-white/[0.2] text-[11px] text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-[#E8E6DF]">£2,500/mo</div>
              <div className="text-[9px] text-[#8A8882]">Exact Boundary</div>
            </button>
            <button
              type="button"
              onClick={() => setPreset(2499, 'Below Threshold Match')}
              className="p-2 bg-[#121212] hover:bg-[#181818] border border-white/[0.08] hover:border-white/[0.2] text-[11px] text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-[#FF5A5F]">£2,499/mo</div>
              <div className="text-[9px] text-[#FF5A5F]">Fail Scenario</div>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[10px] text-[#8A8882] uppercase mb-1">Credential Name</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Primary Net Monthly Income"
              className="w-full px-3 py-2.5 bg-[#090909] border border-white/[0.1] text-[#E8E6DF] text-xs focus:outline-none focus:border-[#FF5A5F]"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-[#8A8882] uppercase mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3 py-2.5 bg-[#090909] border border-white/[0.1] text-[#E8E6DF] text-xs focus:outline-none"
              >
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-[#8A8882] uppercase">Monthly Income</label>
                <span className="text-[10px] text-[#FF5A5F] flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>SEALED IN RAM</span>
                </span>
              </div>
              <input
                type="number"
                min="0"
                step="1"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="4720"
                className="w-full px-3 py-2.5 bg-[#090909] border border-white/[0.1] text-[#E8E6DF] font-bold text-xs focus:outline-none focus:border-[#FF5A5F]"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-[#090909] border border-white/[0.08] text-[10px] text-[#8A8882] flex items-start gap-2">
            <KeyRound className="w-3.5 h-3.5 text-[#FF5A5F] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#E8E6DF]">Zero-Knowledge Commitment:</span> A cryptographic commitment will be generated locally. The raw salary value never leaves client-side witness memory.
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isCreating}
              id="btn-submit-create-credential"
              className="w-full py-3.5 px-4 bg-[#E8E6DF] text-black hover:bg-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer rounded-[2px]"
            >
              {isCreating ? (
                <span>SYNTHESIZING COMMITMENT...</span>
              ) : createdSuccess ? (
                <span>CREDENTIAL STORED IN RAM</span>
              ) : (
                <span>SEAL PRIVATE CREDENTIAL</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
