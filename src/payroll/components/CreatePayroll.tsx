import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { PayrollAsset, PayrollBatch, PayrollRecipient } from '../types/payroll';
import { validateMidnightPreviewAddress } from '../midnight/address';
import { RecipientEditor } from './RecipientEditor';

interface CreatePayrollProps {
  onCancel: () => void;
  onCompleteBatch: (batch: PayrollBatch) => void;
  initialBatch?: PayrollBatch | null;
  executionMode: 'DEMO' | 'LIVE';
}

function liveRosterIsSafe(recipients: PayrollRecipient[]): boolean {
  if (recipients.length === 0 || recipients.length > 4) return false;

  const employeeIds = new Set<string>();
  const addresses = new Set<string>();

  for (const recipient of recipients) {
    const validation = validateMidnightPreviewAddress(recipient.walletAddress);
    if (!validation.ok || !validation.normalized) return false;
    if (!Number.isSafeInteger(recipient.paymentAmount) || recipient.paymentAmount <= 0) return false;

    const employeeId = recipient.employeeId.trim().toUpperCase();
    if (!employeeId || employeeIds.has(employeeId)) return false;
    if (addresses.has(validation.normalized)) return false;

    employeeIds.add(employeeId);
    addresses.add(validation.normalized);
  }

  return true;
}

function initialRecipientsForMode(
  initialBatch: PayrollBatch | null | undefined,
  executionMode: 'DEMO' | 'LIVE',
): PayrollRecipient[] {
  if (!initialBatch || initialBatch.mode !== executionMode) return [];
  if (executionMode === 'DEMO') return initialBatch.recipients;

  // LIVE drafts fail closed. Never inherit a roster that contains legacy demo
  // addresses, wrong-network addresses, duplicate recipients or more entries
  // than the current Preview circuit supports. Importing only a subset would be
  // more dangerous than clearing the draft because it could authorize a
  // different payroll than the operator intended.
  if (!liveRosterIsSafe(initialBatch.recipients)) return [];

  return initialBatch.recipients.map((recipient) => ({
    ...recipient,
    employeeId: recipient.employeeId.trim().toUpperCase(),
    walletAddress: validateMidnightPreviewAddress(recipient.walletAddress).normalized!,
  }));
}

export const CreatePayroll: React.FC<CreatePayrollProps> = ({
  onCancel,
  onCompleteBatch,
  initialBatch,
  executionMode,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  const [name, setName] = useState(initialBatch?.mode === executionMode ? initialBatch.name : 'October Payroll');
  const [period, setPeriod] = useState(initialBatch?.mode === executionMode ? initialBatch.period : '01 OCT — 31 OCT 2026');
  const [paymentDate, setPaymentDate] = useState(initialBatch?.mode === executionMode ? initialBatch.paymentDate : '31 OCT 2026');
  const [paymentAsset, setPaymentAsset] = useState<PayrollAsset>(
    initialBatch?.mode === executionMode ? initialBatch.paymentAsset : 'USDC',
  );
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const safeInitialRecipients = useMemo(
    () => initialRecipientsForMode(initialBatch, executionMode),
    [initialBatch, executionMode],
  );
  const [recipients, setRecipients] = useState<PayrollRecipient[]>(safeInitialRecipients);
  const [recipientsError, setRecipientsError] = useState<string | null>(null);

  const staleLiveRosterCleared = executionMode === 'LIVE'
    && Boolean(initialBatch)
    && initialBatch?.mode === 'LIVE'
    && initialBatch.recipients.length > 0
    && safeInitialRecipients.length === 0;

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

    if (executionMode === 'LIVE') {
      if (recipients.length > 4) {
        setRecipientsError('LIVE Preview authorization currently supports up to 4 private recipients per batch. Split larger payrolls into multiple batches.');
        return;
      }

      if (!liveRosterIsSafe(recipients)) {
        setRecipientsError('LIVE Preview roster validation failed. Every recipient must use a unique, valid Midnight Preview address and a positive whole-unit amount.');
        return;
      }
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
      mode: executionMode,
    };

    onCompleteBatch(newBatch);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left font-sans">
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
            [ NEW BATCH PROTOCOL / {executionMode} ]
          </div>
          <h2 className="text-2xl sm:text-3xl font-condensed font-extrabold uppercase text-[#E8E6DF]">
            CREATE PRIVATE PAYROLL
          </h2>
        </div>

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

            {staleLiveRosterCleared && (
              <div className="p-3 bg-[#1A1408] border border-[#FFB800]/40 text-[#FFB800] flex items-start gap-2 text-[11px] leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Legacy or incompatible recipients were removed from this LIVE draft. BLACKOUT will not carry demo, wrong-network, duplicate, or oversized roster state into a Midnight Preview authorization.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-[#8A8882] uppercase">Payroll Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="September Payroll"
                  className="w-full bg-[#121212] border border-white/[0.1] px-3.5 py-2.5 text-[#E8E6DF] focus:border-[#FF5A5F] outline-none text-sm font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#8A8882] uppercase">Payment Asset *</label>
                <select
                  value={paymentAsset}
                  onChange={(e) => setPaymentAsset(e.target.value as PayrollAsset)}
                  className="w-full bg-[#121212] border border-white/[0.1] px-3.5 py-2.5 text-[#E8E6DF] focus:border-[#FF5A5F] outline-none cursor-pointer"
                >
                  <option value="USDC">USDC (private payroll policy asset)</option>
                  <option value="tNIGHT">tNIGHT (Midnight test asset policy)</option>
                  <option value="GBPX">GBPX (private sterling payroll policy)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#8A8882] uppercase">Payroll Period *</label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="01 SEP — 30 SEP 2026"
                  className="w-full bg-[#121212] border border-white/[0.1] px-3.5 py-2.5 text-[#E8E6DF] focus:border-[#FF5A5F] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#8A8882] uppercase">Payment Date *</label>
                <input
                  type="text"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  placeholder="30 SEP 2026"
                  className="w-full bg-[#121212] border border-white/[0.1] px-3.5 py-2.5 text-[#E8E6DF] focus:border-[#FF5A5F] outline-none"
                />
              </div>
            </div>

            {executionMode === 'LIVE' && (
              <div className="p-3 border border-[#26A17B]/30 bg-[#0A100D] text-[11px] text-[#8A8882] leading-relaxed">
                LIVE mode creates a real Midnight Preview zero-knowledge authorization. Recipient addresses and compensation values are private witness inputs and are not written to public contract state.
              </div>
            )}
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
            executionMode={executionMode}
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
              disabled={recipients.length === 0 || (executionMode === 'LIVE' && recipients.length > 4)}
              className={`px-6 py-2.5 uppercase font-bold tracking-wider flex items-center gap-2 transition-all ${
                recipients.length > 0 && !(executionMode === 'LIVE' && recipients.length > 4)
                  ? 'bg-[#E8E6DF] text-black hover:bg-white cursor-pointer'
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
