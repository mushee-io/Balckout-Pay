import React from 'react';
import { 
  Layers, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  Calendar,
  Users
} from 'lucide-react';
import { PayrollBatch } from '../types/payroll';

interface PayrollHistoryProps {
  batches: PayrollBatch[];
  onSelectBatch: (batch: PayrollBatch) => void;
}

export const PayrollHistory: React.FC<PayrollHistoryProps> = ({
  batches,
  onSelectBatch,
}) => {
  return (
    <div className="space-y-4 text-left font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div>
          <div className="text-[10px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">
            [ HISTORICAL AUDIT TRAILS ]
          </div>
          <h3 className="text-xl sm:text-2xl font-condensed font-extrabold uppercase text-[#E8E6DF] mt-0.5">
            PAYROLL HISTORY
          </h3>
        </div>

        <div className="text-xs font-mono text-[#8A8882] flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-[#26A17B]" />
          <span>ZERO PUBLIC SALARY DISCLOSURE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
        {batches.map((batch) => {
          const isConfirmed = batch.status === 'CONFIRMED';
          return (
            <div
              key={batch.id}
              onClick={() => onSelectBatch(batch)}
              className="p-4 bg-[#0E0E0E] hover:bg-[#141414] border border-white/[0.08] hover:border-white/[0.2] transition-all cursor-pointer space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#E8E6DF] text-sm font-sans uppercase">
                  {batch.name}
                </span>
                <span className={`text-[10px] px-2 py-0.5 border ${
                  isConfirmed 
                    ? 'border-[#26A17B]/40 bg-[#26A17B]/10 text-[#26A17B]' 
                    : 'border-white/[0.1] bg-[#1a1a1a] text-[#8A8882]'
                }`}>
                  {batch.status}
                </span>
              </div>

              <div className="space-y-1 text-[#8A8882]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3 h-3" />
                    <span>{batch.recipients.length} recipients</span>
                  </span>
                  <span className="text-[#FF5A5F] font-bold">PRIVATE</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{batch.paymentDate}</span>
                  </span>
                  <span className="text-[#8A8882]">{batch.paymentAsset}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-[#8A8882] group-hover:text-[#E8E6DF] transition-colors">
                <span>VIEW RECEIPT & AUDIT</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
