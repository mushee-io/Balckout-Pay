import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  FileSpreadsheet, 
  ShieldCheck, 
  Calendar, 
  Coins, 
  Layers,
  AlertCircle
} from 'lucide-react';
import { PayrollAsset, PayrollBatch, PayrollRecipient } from '../types/payroll';
import { RecipientEditor } from './RecipientEditor';

interface CreatePayrollProps {
  onCancel: () => void;
  onCompleteBatch: (batch: PayrollBatch) => void;
  initialBatch?: PayrollBatch | null;
}

export const CreatePayroll: React.FC<CreatePayrollProps> = ({
  onCancel,
  onCompleteBatch,
  initialBatch,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 Details
  const [name, setName] = useState(initialBatch?.name || 'October Payroll');
  const [period, setPeriod] = useState(initialBatch?.period || '01 OCT — 31 OCT 2026');
  const [paymentDate, setPaymentDate] = useState(initialBatch?.paymentDate || '31 OCT 2026');
  const [paymentAsset, setPaymentAsset] = useState<PayrollAsset>(initialBatch?.paymentAsset || 'USDC');
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Step 2 Recipients
  const [recipients, setRecipients] = useState<PayrollRecipient[]>(
    initialBatch?.recipients || []
  );
  const [recipientsError, setRecipientsError] = useState<string | null>(null);

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsError(null);

    if (!name.trim()) {
      setDetailsError('Payroll Name is required.');
      return;
    }
    if (!period.trim()) {
      setDetailsError('Payroll Period is required.');
      return;
    }
    if (!paymentDate.trim()) {
      setDetailsError('Payment Date is required.');
      return;
    }

    setStep(2);
  };

  const handleFinishCreation = () => {
    setRecipientsError(null);
    if (recipients.length === 0) {
      setRecipientsError('At least 1 recipient is required to construct a private payroll batch.');
      return;
    }

    const newBatch: PayrollBatch = {
      id: `batch-${Date.now().toString(36)}`,
      name: name.trim(),
      period: period.trim(),
      paymentDate: paymentDate.trim(),
      paymentAsset,
      status: 'READY',
      recipients,
      createdAt: Date.now(),
      mode: 'DEMO',
    };

    onCompleteBatch(newBatch);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left font-sans">
      {/* Header & Step Tracker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <button
            onClick={onCancel}
            className="text-xs font-mono uppercase text-[#8A8882] hover:text-[#E8E6DF] flex items-center gap-1.5 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK TO PAYROLL OVERVIEW</span>
          </button>
          <div className="text-[10px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">
            [ NEW BATCH PROTOCOL ]
          </div>
          <h2 className="text-2xl sm:text-3xl font-condensed font-extrabold uppercase text-[#E8E6DF]">
            CREATE PRIVATE PAYROLL
          </h2>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className={`px-3 py-1.5 border flex items-center gap-1.5 ${
            step === 1 
              ? 'border-[#FF5A5F] bg-[#181818] text-[#E8E6DF] font-bold' 
              : 'border-white/[0.1] bg-[#0E0E0E] text-[#8A8882]'
          }`}>
            <span>01</span>
            <span className="hidden sm:inline">DETAILS</span>
          </div>
          <span className="text-[#8A8882]">→</span>
          <div className={`px-3 py-1.5 border flex items-center gap-1.5 ${
            step === 2 
              ? 'border-[#FF5A5F] bg-[#181818] text-[#E8E6DF] font-bold' 
              : 'border-white/[0.1] bg-[#0E0E0E] text-[#8A8882]'
          }`}>
            <span>02</span>
            <span className="hidden sm:inline">RECIPIENTS</span>
          </div>
        </div>
      </div>

      {/* Step 1: Payroll Details */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} className="space-y-6 font-mono text-xs">
          <div className="p-6 bg-[#0E0E0E] border border-white/[0.08] space-y-6">
            <div className="text-xs uppercase font-bold text-[#E8E6DF] border-b border-white/[0.08] pb-3 flex items-center justify-between">
              <span>STEP 01: PAYROLL DETAILS</span>
              <span className="text-[10px] text-[#8A8882]">[ METADATA CONFIGURATION ]</span>
            </div>

            {detailsError && (
              <div className="p-3 bg-[#1A0A0A] border border-[#FF5A5F]/60 text-[#FF5A5F] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{detailsError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-[#8A8882] uppercase">
                  Payroll Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="September Payroll"
                  className="w-full bg-[#121212] border border-white/[0.1] px-3.5 py-2.5 text-[#E8E6DF] focus:border-[#FF5A5F] outline-none text-sm font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#8A8882] uppercase">
                  Payment Asset *
                </label>
                <select
                  value={paymentAsset}
                  onChange={(e) => setPaymentAsset(e.target.value as PayrollAsset)}
                  className="w-full bg-[#121212] border border-white/[0.1] px-3.5 py-2.5 text-[#E8E6DF] focus:border-[#FF5A5F] outline-none cursor-pointer"
                >
                  <option value="USDC">USDC (USD Coin — Midnight Shielded Pool)</option>
                  <option value="tNIGHT">tNIGHT (Midnight Network Native Dust Token)</option>
                  <option value="GBPX">GBPX (Institutional Private Sterling)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#8A8882] uppercase">
                  Payroll Period *
                </label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="01 SEP — 30 SEP 2026"
                  className="w-full bg-[#121212] border border-white/[0.1] px-3.5 py-2.5 text-[#E8E6DF] focus:border-[#FF5A5F] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#8A8882] uppercase">
                  Payment Date *
                </label>
                <input
                  type="text"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  placeholder="30 SEP 2026"
                  className="w-full bg-[#121212] border border-white/[0.1] px-3.5 py-2.5 text-[#E8E6DF] focus:border-[#FF5A5F] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 border border-white/[0.1] text-[#8A8882] hover:text-[#E8E6DF] uppercase transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#E8E6DF] text-black hover:bg-white font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <span>CONTINUE TO RECIPIENTS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Recipients */}
      {step === 2 && (
        <div className="space-y-6">
          {recipientsError && (
            <div className="p-3 bg-[#1A0A0A] border border-[#FF5A5F]/60 text-[#FF5A5F] flex items-center gap-2 font-mono text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{recipientsError}</span>
            </div>
          )}

          <RecipientEditor
            recipients={recipients}
            onChangeRecipients={setRecipients}
            currency={paymentAsset === 'GBPX' ? 'GBP' : 'USD'}
          />

          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08] font-mono text-xs">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 border border-white/[0.1] text-[#8A8882] hover:text-[#E8E6DF] uppercase transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>BACK TO DETAILS</span>
            </button>

            <button
              type="button"
              onClick={handleFinishCreation}
              disabled={recipients.length === 0}
              className={`px-6 py-2.5 uppercase font-bold tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                recipients.length > 0
                  ? 'bg-[#E8E6DF] text-black hover:bg-white'
                  : 'bg-[#222] text-[#666] cursor-not-allowed'
              }`}
            >
              <span>PROCEED TO REVIEW BATCH ({recipients.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
