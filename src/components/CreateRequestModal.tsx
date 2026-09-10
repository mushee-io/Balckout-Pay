import React, { useState, useId } from 'react';
import { X, Building2, Plus, ArrowRight, ShieldCheck, Check, Trash2, Calendar, FileKey, Sparkles, AlertCircle } from 'lucide-react';
import { CurrencyCode, PolicyRule, RuleCategory, VerificationPurpose, VerificationRequest } from '../midnight/types';
import { generateSecureNonce } from '../midnight/zk-engine';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRequest: (req: Omit<VerificationRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
}

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  isOpen,
  onClose,
  onCreateRequest,
}) => {
  const [title, setTitle] = useState('2-Bed Apartment Rental Affordability');
  const [purpose, setPurpose] = useState<VerificationPurpose>('Rental Affordability');
  const [currency, setCurrency] = useState<CurrencyCode>('GBP');
  const [verifierName, setVerifierName] = useState('Apex Residential Lettings');
  const [verifierAddress, setVerifierAddress] = useState('mn_addr_test1q88apexlettings2500req');
  const [notes, setNotes] = useState('Proof that applicant qualifies against standard tenancy risk policy.');
  const [validityDays, setValidityDays] = useState(14);
  const [formError, setFormError] = useState<string | null>(null);

  // Policy Rules
  const [rules, setRules] = useState<PolicyRule[]>([
    {
      id: 'rule_income',
      category: 'INCOME',
      label: 'Monthly Net Income',
      operator: 'GTE',
      targetValue: 2500,
      displayTarget: '≥ £2,500/mo'
    },
    {
      id: 'rule_age',
      category: 'AGE',
      label: 'Legal Majority Age',
      operator: 'GTE',
      targetValue: 18,
      displayTarget: '≥ 18 years'
    },
    {
      id: 'rule_residency',
      category: 'RESIDENCY',
      label: 'Primary Residency',
      operator: 'EQ',
      targetValue: 'UK',
      displayTarget: 'United Kingdom'
    }
  ]);

  if (!isOpen) return null;

  const handleToggleRule = (category: RuleCategory, defaultTarget: string | number, label: string, op: 'GTE' | 'EQ', display: string) => {
    const existing = rules.find(r => r.category === category);
    if (existing) {
      if (rules.length > 1) {
        setRules(rules.filter(r => r.category !== category));
      }
    } else {
      setRules([...rules, {
        id: `rule_${category.toLowerCase()}_${Date.now()}`,
        category,
        label,
        operator: op,
        targetValue: defaultTarget,
        displayTarget: display
      }]);
    }
  };

  const handleUpdateIncomeTarget = (val: number) => {
    setRules(rules.map(r => r.category === 'INCOME' ? {
      ...r,
      targetValue: val,
      displayTarget: `≥ ${currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$'}${val.toLocaleString()}/mo`
    } : r));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setFormError('Policy title is required.');
      return;
    }

    const incomeRule = rules.find(r => r.category === 'INCOME');
    const requiredIncome = incomeRule ? Number(incomeRule.targetValue) : 2500;
    if (!Number.isFinite(requiredIncome) || requiredIncome <= 0) {
      setFormError('Income threshold must be a valid positive number.');
      return;
    }
    if (requiredIncome > 100_000_000) {
      setFormError('Income threshold exceeds allowable protocol maximum (£100M).');
      return;
    }

    if (validityDays < 1 || validityDays > 365) {
      setFormError('Validity window must be between 1 and 365 days.');
      return;
    }

    const expiresAt = Date.now() + validityDays * 24 * 60 * 60 * 1000;
    const nonce = generateSecureNonce();

    try {
      await onCreateRequest({
        title: cleanTitle,
        purpose,
        requiredIncome,
        currency,
        verifierName: verifierName.trim() || 'Independent Verifier',
        verifierAddress: verifierAddress.trim() || 'mn_addr_test1q_unassigned_verifier',
        notes,
        rules,
        expiresAt,
        nonce
      });
      onClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to register the verification request.');
    }
  };

  const applyPreset = (
    presetTitle: string, 
    presetPurpose: VerificationPurpose, 
    presetVerifier: string,
    presetRules: PolicyRule[],
    notesStr: string
  ) => {
    setTitle(presetTitle);
    setPurpose(presetPurpose);
    setVerifierName(presetVerifier);
    setRules(presetRules);
    setNotes(notesStr);
  };

  const hasCategory = (cat: RuleCategory) => rules.some(r => r.category === cat);
  const incomeRule = rules.find(r => r.category === 'INCOME');
  const currentIncomeVal = incomeRule ? Number(incomeRule.targetValue) : 2500;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 font-sans select-none overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-[#0E0E0E] border border-white/[0.14] p-6 sm:p-8 relative text-left shadow-2xl rounded-[2px] my-8"
        id="modal-create-request"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="text-[10px] font-mono tracking-[0.2em] text-[#FF5A5F] uppercase font-bold flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-[#FF5A5F]"></span>
              <span>[ MIDNIGHT POLICY BUILDER ]</span>
            </div>
            <h3 className="text-xl font-condensed font-extrabold uppercase text-[#E8E6DF] tracking-wide">
              CONSTRUCT VERIFICATION POLICY.
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8A8882] hover:text-[#E8E6DF] hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Institutional Policy Presets */}
        <div className="my-4 space-y-2">
          <div className="text-[10px] font-mono text-[#8A8882] uppercase flex items-center justify-between">
            <span>INSTITUTIONAL POLICY TEMPLATES:</span>
            <span className="text-[9px] text-[#FF5A5F]">1-CLICK CONFIGURATION</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
            <button
              type="button"
              onClick={() => applyPreset(
                'UK Tenancy Affordability Assessment',
                'Rental Affordability',
                'Apex Residential Lettings',
                [
                  { id: 'r1', category: 'INCOME', label: 'Monthly Net Income', operator: 'GTE', targetValue: 2500, displayTarget: '≥ £2,500/mo' },
                  { id: 'r2', category: 'AGE', label: 'Minimum Age', operator: 'GTE', targetValue: 18, displayTarget: '≥ 18' },
                  { id: 'r3', category: 'RESIDENCY', label: 'Residency Jurisdiction', operator: 'EQ', targetValue: 'UK', displayTarget: 'UK' }
                ],
                'Requires income ≥ 30x monthly rent, adult age, and UK residency.'
              )}
              className="p-3 bg-[#121212] hover:bg-[#161616] border border-white/[0.08] hover:border-[#FF5A5F]/50 text-left transition-all cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-[#E8E6DF] group-hover:text-[#FF5A5F]">Tenancy Affordability</div>
              <div className="text-[9px] text-[#8A8882] mt-0.5">≥ £2,500 + Age 18+ + UK</div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset(
                'Tier-1 Mortgage Pre-Qualification',
                'Mortgage Pre-Qualification',
                'Mayfair Heritage Lending',
                [
                  { id: 'r1', category: 'INCOME', label: 'Monthly Net Income', operator: 'GTE', targetValue: 4000, displayTarget: '≥ £4,000/mo' },
                  { id: 'r2', category: 'EMPLOYMENT', label: 'Employment Status', operator: 'EQ', targetValue: 'EMPLOYED', displayTarget: 'Employed' },
                  { id: 'r3', category: 'AGE', label: 'Minimum Age', operator: 'GTE', targetValue: 21, displayTarget: '≥ 21' },
                  { id: 'r4', category: 'RESIDENCY', label: 'Residency Jurisdiction', operator: 'EQ', targetValue: 'UK', displayTarget: 'UK' }
                ],
                'Tier-1 residential mortgage underwriting filter.'
              )}
              className="p-3 bg-[#121212] hover:bg-[#161616] border border-white/[0.08] hover:border-[#FF5A5F]/50 text-left transition-all cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-[#E8E6DF] group-hover:text-[#FF5A5F]">Mortgage Pre-Qual</div>
              <div className="text-[9px] text-[#8A8882] mt-0.5">≥ £4,000 + Employed + Age 21+</div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset(
                'Institutional Credit & Liquidity Facility',
                'Custom Financial Requirement',
                'Barclays Institutional Credit',
                [
                  { id: 'r1', category: 'INCOME', label: 'Monthly Net Income', operator: 'GTE', targetValue: 8000, displayTarget: '≥ £8,000/mo' },
                  { id: 'r2', category: 'BANK_BALANCE', label: 'Liquid Bank Reserve', operator: 'GTE', targetValue: 30000, displayTarget: '≥ £30,000' },
                  { id: 'r3', category: 'KYC_STATUS', label: 'Regulatory KYC Clearance', operator: 'EQ', targetValue: 'VERIFIED', displayTarget: 'Verified Tier-1' }
                ],
                'High-net-worth private credit facility screening.'
              )}
              className="p-3 bg-[#121212] hover:bg-[#161616] border border-white/[0.08] hover:border-[#FF5A5F]/50 text-left transition-all cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-[#E8E6DF] group-hover:text-[#FF5A5F]">Private Credit Facility</div>
              <div className="text-[9px] text-[#8A8882] mt-0.5">≥ £8,000 + £30k Reserve</div>
            </button>
          </div>
        </div>

        {/* Error message */}
        {formError && (
          <div className="my-3 p-3 bg-[#1A0A0A] border border-[#FF5A5F]/60 text-[#FF5A5F] flex items-center gap-2 text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#FF5A5F]" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[10px] text-[#8A8882] uppercase mb-1">Policy Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tenancy Affordability Assessment"
              className="w-full px-3 py-2 bg-[#090909] border border-white/[0.1] text-[#E8E6DF] text-xs focus:outline-none focus:border-[#FF5A5F]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[#8A8882] uppercase mb-1">Purpose Category</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as VerificationPurpose)}
                className="w-full px-3 py-2 bg-[#090909] border border-white/[0.1] text-[#E8E6DF] text-xs focus:outline-none focus:border-[#FF5A5F]"
              >
                <option value="Rental Affordability">Rental Affordability</option>
                <option value="Mortgage Pre-Qualification">Mortgage Pre-Qualification</option>
                <option value="Car Lease Approval">Car Lease Approval</option>
                <option value="Commercial Lease">Commercial Lease</option>
                <option value="Credit & Loan Eligibility">Credit & Loan Eligibility</option>
                <option value="Custom Financial Requirement">Custom Policy</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-[#8A8882] uppercase mb-1">Verifier Institution Name</label>
              <input
                type="text"
                value={verifierName}
                onChange={(e) => setVerifierName(e.target.value)}
                placeholder="e.g. Apex Residential Lettings"
                className="w-full px-3 py-2 bg-[#090909] border border-white/[0.1] text-[#E8E6DF] text-xs focus:outline-none focus:border-[#FF5A5F]"
                required
              />
            </div>
          </div>

          {/* Compound Condition Selector */}
          <div className="p-4 bg-[#090909] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#FF5A5F] font-bold uppercase tracking-wider">
                COMPOUND ELIGIBILITY RULES ({rules.length} ACTIVE)
              </span>
              <span className="text-[9px] text-[#8A8882]">
                EVALUATED CONCURRENTLY IN ZERO-KNOWLEDGE
              </span>
            </div>

            {/* Rule 1: Income (Always Required) */}
            <div className="p-3 bg-[#121212] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#E8E6DF] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#26A17B]" />
                  <span>CRITERION 1: MONTHLY NET INCOME</span>
                </span>
                <span className="text-[9px] text-[#26A17B] font-bold bg-[#26A17B]/10 px-1.5 py-0.5 border border-[#26A17B]/30">
                  MANDATORY
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 items-center pt-1">
                <div>
                  <span className="text-[9px] text-[#8A8882] uppercase block mb-1">OPERATOR</span>
                  <div className="px-2.5 py-1.5 bg-[#090909] border border-white/[0.08] text-xs font-bold text-[#E8E6DF]">
                    At least (≥)
                  </div>
                </div>

                <div>
                  <span className="text-[9px] text-[#8A8882] uppercase block mb-1">CURRENCY</span>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="w-full px-2.5 py-1.5 bg-[#090909] border border-white/[0.08] text-[#E8E6DF] text-xs focus:outline-none"
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
                    min="100"
                    step="50"
                    value={currentIncomeVal}
                    onChange={(e) => handleUpdateIncomeTarget(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-[#090909] border border-white/[0.08] text-[#FF5A5F] font-bold text-xs focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Optional Additional Criteria Toggles */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[9px] text-[#8A8882] uppercase block">
                OPTIONAL SECONDARY CONDITIONS:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {/* Age Rule */}
                <button
                  type="button"
                  onClick={() => handleToggleRule('AGE', 18, 'Minimum Age Requirement', 'GTE', '≥ 18 years')}
                  className={`p-2.5 text-left border transition-all cursor-pointer flex items-center justify-between ${
                    hasCategory('AGE') 
                      ? 'bg-[#141414] border-[#26A17B] text-[#E8E6DF]' 
                      : 'bg-[#0E0E0E] border-white/[0.06] text-[#8A8882] hover:border-white/[0.2]'
                  }`}
                >
                  <div>
                    <div className="text-[11px] font-bold">Age ≥ 18</div>
                    <div className="text-[9px] text-[#8A8882]">Legal Majority Check</div>
                  </div>
                  {hasCategory('AGE') && <Check className="w-3.5 h-3.5 text-[#26A17B]" />}
                </button>

                {/* Residency Rule */}
                <button
                  type="button"
                  onClick={() => handleToggleRule('RESIDENCY', 'UK', 'Jurisdiction Residency', 'EQ', 'United Kingdom')}
                  className={`p-2.5 text-left border transition-all cursor-pointer flex items-center justify-between ${
                    hasCategory('RESIDENCY') 
                      ? 'bg-[#141414] border-[#26A17B] text-[#E8E6DF]' 
                      : 'bg-[#0E0E0E] border-white/[0.06] text-[#8A8882] hover:border-white/[0.2]'
                  }`}
                >
                  <div>
                    <div className="text-[11px] font-bold">Residency = UK</div>
                    <div className="text-[9px] text-[#8A8882]">Jurisdiction Requirement</div>
                  </div>
                  {hasCategory('RESIDENCY') && <Check className="w-3.5 h-3.5 text-[#26A17B]" />}
                </button>

                {/* Employment Status */}
                <button
                  type="button"
                  onClick={() => handleToggleRule('EMPLOYMENT', 'EMPLOYED', 'Employment Status', 'EQ', 'Employed / Self-Employed')}
                  className={`p-2.5 text-left border transition-all cursor-pointer flex items-center justify-between ${
                    hasCategory('EMPLOYMENT') 
                      ? 'bg-[#141414] border-[#26A17B] text-[#E8E6DF]' 
                      : 'bg-[#0E0E0E] border-white/[0.06] text-[#8A8882] hover:border-white/[0.2]'
                  }`}
                >
                  <div>
                    <div className="text-[11px] font-bold">Employed / Active</div>
                    <div className="text-[9px] text-[#8A8882]">Active Earner Status</div>
                  </div>
                  {hasCategory('EMPLOYMENT') && <Check className="w-3.5 h-3.5 text-[#26A17B]" />}
                </button>

                {/* Bank Balance Reserve */}
                <button
                  type="button"
                  onClick={() => handleToggleRule('BANK_BALANCE', 15000, 'Minimum Cash Reserve', 'GTE', '≥ £15,000 Liquid')}
                  className={`p-2.5 text-left border transition-all cursor-pointer flex items-center justify-between ${
                    hasCategory('BANK_BALANCE') 
                      ? 'bg-[#141414] border-[#26A17B] text-[#E8E6DF]' 
                      : 'bg-[#0E0E0E] border-white/[0.06] text-[#8A8882] hover:border-white/[0.2]'
                  }`}
                >
                  <div>
                    <div className="text-[11px] font-bold">Reserve ≥ £15,000</div>
                    <div className="text-[9px] text-[#8A8882]">Liquid Asset Gate</div>
                  </div>
                  {hasCategory('BANK_BALANCE') && <Check className="w-3.5 h-3.5 text-[#26A17B]" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[#8A8882] uppercase mb-1">Policy Expiry Window</label>
              <select
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#090909] border border-white/[0.1] text-[#E8E6DF] text-xs focus:outline-none"
              >
                <option value={7}>7 Days (Strict Timelock)</option>
                <option value={14}>14 Days (Standard)</option>
                <option value={30}>30 Days (Extended)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-[#8A8882] uppercase mb-1">Policy Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Standard 30x rent multiplier"
                className="w-full px-3 py-2 bg-[#090909] border border-white/[0.1] text-[#E8E6DF] text-xs focus:outline-none focus:border-[#FF5A5F]"
              />
            </div>
          </div>

          {/* Privacy Invariant Banner */}
          <div className="p-3 bg-[#090909] border border-white/[0.08] text-[10px] text-[#8A8882] flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#26A17B] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#E8E6DF]">Zero-Disclosure Contract:</span> Verifier only receives an all-or-nothing boolean (QUALIFIED / REJECTED) bound to this cryptographic policy hash. Zero underlying salary, age, or balance values are ever leaked.
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              id="btn-submit-create-request"
              className="w-full py-3.5 px-4 bg-[#E8E6DF] text-black hover:bg-white font-bold text-xs uppercase tracking-[0.16em] transition-all flex items-center justify-center gap-2 cursor-pointer rounded-[2px]"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>PUBLISH POLICY TO MIDNIGHT LEDGER</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

