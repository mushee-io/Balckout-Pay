import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Calendar, 
  Network, 
  Check,
  Building2,
  FileCheck
} from 'lucide-react';
import { PayrollBatch } from '../types/payroll';

interface PayrollReviewProps {
  batch: PayrollBatch;
  onBack: () => void;
  onProceedToAuthorization: () => void;
}

export const PayrollReview: React.FC<PayrollReviewProps> = ({
  batch,
  onBack,
  onProceedToAuthorization,
}) => {
  const [isRevealedLocally, setIsRevealedLocally] = useState(false);

  const totalCalculated = batch.recipients.reduce((sum, r) => sum + r.paymentAmount, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left font-sans">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <button
          onClick={onBack}
          className="text-xs font-mono uppercase text-[#8A8882] hover:text-[#E8E6DF] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO EDIT BATCH</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRevealedLocally(!isRevealedLocally)}
            className="px-3 py-1 bg-[#121212] border border-white/[0.1] text-[#8A8882] hover:text-[#E8E6DF] font-mono text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isRevealedLocally ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>{isRevealedLocally ? 'MASK AMOUNTS' : 'REVEAL LOCALLY'}</span>
          </button>
        </div>
      </div>

      {/* Review Card */}
      <div className="bg-[#0E0E0E] border border-white/[0.1] rounded-[2px] overflow-hidden">
        {/* Batch Header Bar */}
        <div className="p-6 bg-[#121212] border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">
              [ BATCH PRE-AUTHORIZATION AUDIT ]
            </div>
            <h2 className="text-2xl sm:text-3xl font-condensed font-extrabold uppercase text-[#E8E6DF] tracking-wide mt-1">
              {batch.name.toUpperCase()}
            </h2>
            <div className="text-xs font-mono text-[#8A8882] mt-0.5">
              CYCLE: {batch.period}
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#090909] border border-[#26A17B]/40 text-[#26A17B] font-mono text-xs font-bold uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PRIVACY: ENABLED</span>
          </div>
        </div>

        {/* Recipients Summary Block */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-[#8A8882] uppercase border-b border-white/[0.06] pb-2">
            <span>{batch.recipients.length} RECIPIENTS</span>
            <span>COMPENSATION STATUS</span>
          </div>

          <div className="divide-y divide-white/[0.04] max-h-80 overflow-y-auto pr-1">
            {batch.recipients.map((rec) => (
              <div key={rec.id} className="py-2.5 flex items-center justify-between font-mono text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#E8E6DF]">{rec.employeeId}</span>
                    <span className="text-[10px] text-[#8A8882] hidden sm:inline">
                      ({rec.walletAddress.slice(0, 10)}...{rec.walletAddress.slice(-4)})
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8A8882]">{rec.label}</div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className="font-bold">
                    {isRevealedLocally ? (
                      <span className="text-[#26A17B]">
                        £{rec.paymentAmount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-[#8A8882] tracking-wider">
                        £••••••
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-[#26A17B]/10 border border-[#26A17B]/30 text-[#26A17B]">
                    {rec.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Dividing Rules */}
          <div className="border-t border-white/[0.08] pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-3 bg-[#080808] border border-white/[0.06] space-y-1">
              <div className="text-[10px] text-[#8A8882] uppercase">PAYROLL TOTAL</div>
              <div className="text-base sm:text-lg font-bold text-[#E8E6DF]">
                {isRevealedLocally ? (
                  <span className="text-[#26A17B]">£{totalCalculated.toLocaleString()}</span>
                ) : (
                  <span className="text-[#FF5A5F]">PRIVATE</span>
                )}
              </div>
            </div>

            <div className="p-3 bg-[#080808] border border-white/[0.06] space-y-1">
              <div className="text-[10px] text-[#8A8882] uppercase">PAYMENT DATE</div>
              <div className="text-base sm:text-lg font-bold text-[#E8E6DF]">
                {batch.paymentDate}
              </div>
            </div>

            <div className="p-3 bg-[#080808] border border-white/[0.06] space-y-1">
              <div className="text-[10px] text-[#8A8882] uppercase">NETWORK</div>
              <div className="text-base sm:text-lg font-bold text-[#E8E6DF]">
                MIDNIGHT
              </div>
            </div>

            <div className="p-3 bg-[#080808] border border-white/[0.06] space-y-1">
              <div className="text-[10px] text-[#8A8882] uppercase">PRIVACY</div>
              <div className="text-base sm:text-lg font-bold text-[#26A17B] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ENABLED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Guarantee & Action */}
        <div className="p-6 bg-[#121212] border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-2 text-[#8A8882] text-[11px]">
            <Lock className="w-3.5 h-3.5 text-[#FF5A5F] shrink-0" />
            <span>Compensation information is private by design. 0 bytes public exposure.</span>
          </div>

          <button
            onClick={onProceedToAuthorization}
            id="btn-authorize-payroll"
            className="px-6 py-3 bg-[#E8E6DF] text-black hover:bg-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>[ AUTHORIZE PAYROLL ]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
