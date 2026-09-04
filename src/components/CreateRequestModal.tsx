import React, { useState } from 'react';
import { X, Building2, Plus, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { CurrencyCode, VerificationPurpose, VerificationRequest } from '../midnight/types';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRequest: (req: Omit<VerificationRequest, 'id' | 'createdAt' | 'status'>) => void;
}

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  isOpen,
  onClose,
  onCreateRequest,
}) => {
  const [title, setTitle] = useState('2-Bed Apartment Rental Affordability');
  const [purpose, setPurpose] = useState<VerificationPurpose>('Rental Affordability');
  const [requiredIncome, setRequiredIncome] = useState('2500');
  const [currency, setCurrency] = useState<CurrencyCode>('GBP');
  const [verifierName, setVerifierName] = useState('Apex Residential Lettings');
  const [notes, setNotes] = useState('Proof that monthly income satisfies tenancy affordability multiplier.');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(requiredIncome);
    if (isNaN(amount) || amount <= 0) return;

    onCreateRequest({
      title: title || 'Income Threshold Verification',
      purpose,
      requiredIncome: amount,
      currency,
      verifierName: verifierName || 'Independent Verifier',
      verifierAddress: `mn_addr_test1q${Math.random().toString(16).substring(2, 8)}`,
      notes,
    });
    onClose();
  };

  const setPreset = (presetTitle: string, presetPurpose: VerificationPurpose, presetAmount: number, verifier: string) => {
    setTitle(presetTitle);
    setPurpose(presetPurpose);
    setRequiredIncome(presetAmount.toString());
    setVerifierName(verifier);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 font-sans select-none">
      <div 
        className="w-full max-w-lg bg-[#0E0E0E] border border-white/[0.12] p-6 sm:p-8 relative text-left shadow-2xl rounded-[2px]"
        id="modal-create-request"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="text-[10px] font-mono tracking-[0.2em] text-[#FF5A5F] uppercase font-bold">
              [ VERIFIER LEDGER REQUEST ]
            </div>
            <h3 className="text-xl font-condensed font-extrabold uppercase text-[#E8E6DF]">
              CREATE VERIFICATION REQUEST.
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8A8882] hover:text-[#E8E6DF] hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets for Demo */}
        <div className="my-4 space-y-2">
          <div className="text-[10px] font-mono text-[#8A8882] uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#FF5A5F]"></span>
            <span>STANDARD VERIFICATION SCENARIOS:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono">
            <button
              type="button"
              onClick={() => setPreset('Rental Affordability Check', 'Rental Affordability', 2500, 'Apex Residential Lettings')}
              className="p-2.5 bg-[#121212] hover:bg-[#181818] border border-white/[0.08] hover:border-white/[0.2] text-[11px] text-left transition-all cursor-pointer"
            >
              <div className="font-bold text-[#E8E6DF]">Landlord: ≥ £2,500/mo</div>
              <div className="text-[9px] text-[#8A8882]">Rental Affordability</div>
            </button>
            <button
              type="button"
              onClick={() => setPreset('Tier-1 Mortgage Screening', 'Mortgage Pre-Qualification', 4000, 'Mayfair Heritage Lending')}
              className="p-2.5 bg-[#121212] hover:bg-[#181818] border border-white/[0.08] hover:border-white/[0.2] text-[11px] text-left transition-all cursor-pointer"
            >
              <div className="font-bold text-[#E8E6DF]">Mortgage: ≥ £4,000/mo</div>
              <div className="text-[9px] text-[#8A8882]">Lender Pre-Qualification</div>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[10px] text-[#8A8882] uppercase mb-1">Request Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2-Bed Flat Tenancy Affordability"
              className="w-full px-3 py-2.5 bg-[#090909] border border-white/[0.1] text-[#E8E6DF] text-xs focus:outline-none focus:border-[#FF5A5F]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[#8A8882] uppercase mb-1">Purpose</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as VerificationPurpose)}
                className="w-full px-3 py-2.5 bg-[#090909] border border-white/[0.1] text-[#E8E6DF] text-xs focus:outline-none focus:border-[#FF5A5F]"
              >
                <option value="Rental Affordability">Rental Affordability</option>
                <option value="Mortgage Pre-Qualification">Mortgage Pre-Qualification</option>
                <option value="Car Lease Approval">Car Lease Approval</option>
                <option value="Commercial Lease">Commercial Lease</option>
                <option value="Custom Financial Requirement">Custom Requirement</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-[#8A8882] uppercase mb-1">Verifier Name</label>
              <input
                type="text"
                value={verifierName}
                onChange={(e) => setVerifierName(e.target.value)}
                placeholder="e.g. Apex Lettings"
                className="w-full px-3 py-2.5 bg-[#090909] border border-white/[0.1] text-[#E8E6DF] text-xs focus:outline-none focus:border-[#FF5A5F]"
                required
              />
            </div>
          </div>

          {/* Threshold Input */}
          <div className="p-4 bg-[#090909] border border-white/[0.08] space-y-2">
            <div className="text-[10px] text-[#FF5A5F] font-bold uppercase tracking-wider">
              CONDITION PREDICATE (ZK INEQUALITY)
            </div>
            
            <div className="grid grid-cols-3 gap-2 items-center">
              <div>
                <span className="text-[9px] text-[#8A8882] uppercase block mb-1">OPERATOR</span>
                <div className="px-3 py-2 bg-[#121212] border border-white/[0.08] text-xs font-bold text-[#E8E6DF]">
                  At least (≥)
                </div>
              </div>

              <div>
                <span className="text-[9px] text-[#8A8882] uppercase block mb-1">CURRENCY</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full px-3 py-2 bg-[#121212] border border-white/[0.08] text-[#E8E6DF] text-xs focus:outline-none"
                >
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>

              <div>
                <span className="text-[9px] text-[#8A8882] uppercase block mb-1">THRESHOLD</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={requiredIncome}
                  onChange={(e) => setRequiredIncome(e.target.value)}
                  placeholder="2500"
                  className="w-full px-3 py-2 bg-[#121212] border border-white/[0.08] text-[#E8E6DF] font-bold text-xs focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="text-[10px] text-[#8A8882] pt-1">
              The verifier will only receive a verified boolean: satisfied or not satisfied.
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-[#8A8882] uppercase mb-1">Notes / Policy (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Standard 30x monthly rent requirement"
              className="w-full px-3 py-2 bg-[#090909] border border-white/[0.1] text-[#E8E6DF] text-xs focus:outline-none focus:border-[#FF5A5F]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              id="btn-submit-create-request"
              className="w-full py-3.5 px-4 bg-[#E8E6DF] text-black hover:bg-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer rounded-[2px]"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>PUBLISH TO MIDNIGHT LEDGER</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
