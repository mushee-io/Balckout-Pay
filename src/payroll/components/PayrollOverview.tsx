import React, { useState } from 'react';
import {
  Calendar,
  Eye,
  EyeOff,
  Layers,
  Lock,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { PayrollBatch } from '../types/payroll';

interface PayrollOverviewProps {
  currentBatch: PayrollBatch | null;
  totalBatchesCount: number;
  onOpenCreatePayroll: () => void;
}

export const PayrollOverview: React.FC<PayrollOverviewProps> = ({
  currentBatch,
  totalBatchesCount,
  onOpenCreatePayroll,
}) => {
  const [isRevealedLocally, setIsRevealedLocally] = useState(false);

  const totalAmount = currentBatch
    ? currentBatch.recipients.reduce((sum, recipient) => sum + recipient.paymentAmount, 0)
    : 0;

  const activeEmployees = currentBatch ? currentBatch.recipients.length : 0;
  const nextPayroll = currentBatch ? currentBatch.paymentDate : 'NOT SCHEDULED';
  const payrollStatus = currentBatch ? currentBatch.status : 'NOT STARTED';

  return (
    <div className="space-y-6 text-left font-sans">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="text-[10px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">
            [ INSTITUTIONAL TREASURY WORKSPACE ]
          </div>
          <h2 className="text-2xl sm:text-3xl font-condensed font-extrabold uppercase text-[#E8E6DF] tracking-wide mt-1">
            PAYROLL OVERVIEW
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRevealedLocally(!isRevealedLocally)}
            id="btn-payroll-reveal-locally"
            className={`px-3.5 py-2 font-mono text-xs uppercase tracking-wider border transition-all flex items-center gap-2 cursor-pointer ${
              isRevealedLocally
                ? 'bg-[#181818] border-[#FF5A5F] text-[#FF5A5F]'
                : 'bg-[#0E0E0E] border-white/[0.12] text-[#8A8882] hover:text-[#E8E6DF] hover:border-white/[0.3]'
            }`}
            title="Reveal numbers in this local browser session only. Never broadcasts to network."
          >
            {isRevealedLocally ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isRevealedLocally ? '[ HIDE LOCALLY ]' : '[ REVEAL LOCALLY ]'}</span>
          </button>

          <button
            onClick={onOpenCreatePayroll}
            id="btn-create-payroll-cta"
            className="px-4 py-2 bg-[#E8E6DF] text-black hover:bg-white font-mono text-xs font-bold uppercase tracking-[0.16em] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>CREATE PAYROLL</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-[#0E0E0E] border border-white/[0.08] space-y-1">
          <div className="text-[10px] font-mono tracking-wider text-[#8A8882] uppercase flex items-center justify-between">
            <span>ACTIVE EMPLOYEES</span>
            <Users className="w-3.5 h-3.5 text-[#8A8882]" />
          </div>
          <div className="text-2xl sm:text-3xl font-condensed font-extrabold text-[#E8E6DF]">{activeEmployees}</div>
          <div className="text-[10px] font-mono text-[#8A8882]">CURRENT PAY RUN</div>
        </div>

        <div className="p-4 bg-[#0E0E0E] border border-white/[0.08] space-y-1">
          <div className="text-[10px] font-mono tracking-wider text-[#8A8882] uppercase flex items-center justify-between">
            <span>NEXT PAYROLL</span>
            <Calendar className="w-3.5 h-3.5 text-[#8A8882]" />
          </div>
          <div className="text-xl sm:text-2xl font-condensed font-extrabold text-[#E8E6DF] truncate">{nextPayroll}</div>
          <div className="text-[10px] font-mono text-[#8A8882]">BATCH CYCLE</div>
        </div>

        <div className="p-4 bg-[#0E0E0E] border border-white/[0.08] space-y-1">
          <div className="text-[10px] font-mono tracking-wider text-[#8A8882] uppercase flex items-center justify-between">
            <span>PAYROLL STATUS</span>
            <span className={`w-2 h-2 rounded-full ${currentBatch ? 'bg-[#26A17B]' : 'bg-white/20'}`}></span>
          </div>
          <div className={`text-2xl sm:text-3xl font-condensed font-extrabold ${currentBatch ? 'text-[#26A17B]' : 'text-[#8A8882]'}`}>{payrollStatus}</div>
          <div className="text-[10px] font-mono text-[#8A8882]">LIVE SESSION STATE</div>
        </div>

        <div className="p-4 bg-[#0E0E0E] border border-white/[0.08] space-y-1">
          <div className="text-[10px] font-mono tracking-wider text-[#8A8882] uppercase flex items-center justify-between">
            <span>PRIVATE PAYROLLS</span>
            <Layers className="w-3.5 h-3.5 text-[#8A8882]" />
          </div>
          <div className="text-2xl sm:text-3xl font-condensed font-extrabold text-[#E8E6DF]">{totalBatchesCount}</div>
          <div className="text-[10px] font-mono text-[#8A8882]">CURRENT SESSION</div>
        </div>

        <div className="p-4 bg-[#0E0E0E] border border-white/[0.08] space-y-1 col-span-2 sm:col-span-1">
          <div className="text-[10px] font-mono tracking-wider text-[#FF5A5F] uppercase flex items-center justify-between font-bold">
            <span>TOTAL PAYROLL</span>
            <Lock className="w-3.5 h-3.5 text-[#FF5A5F]" />
          </div>
          <div className="text-xl sm:text-2xl font-condensed font-extrabold text-[#E8E6DF] tracking-wider">
            {isRevealedLocally ? (
              <span className="text-[#26A17B]">{currentBatch ? `${currentBatch.paymentAsset} ${totalAmount.toLocaleString()}` : 'NO ACTIVE RUN'}</span>
            ) : (
              <span className="text-[#8A8882] tracking-[0.2em]">••••••••</span>
            )}
          </div>
          <div className="text-[10px] font-mono text-[#8A8882] flex items-center gap-1.5">
            <span className="text-[#FF5A5F] font-bold">[ PRIVATE ]</span>
            <span>{isRevealedLocally ? 'LOCAL CLIENT RAM' : 'MASKED'}</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-[#0C0C0C] border border-white/[0.06] text-[11px] font-mono text-[#8A8882] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#26A17B] shrink-0" />
          <span>
            <strong className="text-[#E8E6DF]">LOCAL DATA MINIMIZATION:</strong> revealing payroll totals locally only renders in this browser session. Raw compensation values are not published as public ledger state.
          </span>
        </div>
        <div className="text-[10px] text-[#8A8882]/70 uppercase shrink-0">ZERO-KNOWLEDGE ARCHITECTURE</div>
      </div>
    </div>
  );
};
