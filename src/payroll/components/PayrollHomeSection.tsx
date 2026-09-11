import React from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  FileCheck2,
  Users,
  WalletCards,
} from 'lucide-react';

interface PayrollHomeSectionProps {
  onOpenPayroll: () => void;
}

const rooms = [
  {
    label: 'Workspace',
    description: 'Private treasury and payroll execution boundary.',
    icon: BriefcaseBusiness,
  },
  {
    label: 'Employees',
    description: 'Private recipients, payout details and eligibility state.',
    icon: Users,
  },
  {
    label: 'Pay Runs',
    description: 'Create, review, authorize, execute and audit payroll.',
    icon: WalletCards,
  },
  {
    label: 'Proofs',
    description: 'Prove payroll conditions without revealing raw compensation.',
    icon: FileCheck2,
  },
];

export const PayrollHomeSection: React.FC<PayrollHomeSectionProps> = ({ onOpenPayroll }) => {
  return (
    <section className="bg-[#090909] border-t border-white/[0.08] text-[#E8E6DF] font-sans">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-16 sm:py-20">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-8 pb-8 border-b border-white/[0.08]">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 text-[10px] font-mono tracking-[0.24em] uppercase font-bold text-[#FF5A5F]">
              <span className="w-2 h-2 bg-[#FF5A5F]" />
              <span>[ BLACKOUT PAYROLL — NEW ]</span>
            </div>
            <h2 className="mt-5 text-[clamp(2.7rem,6vw,5.8rem)] leading-[0.9] font-condensed font-extrabold uppercase tracking-tight">
              PAY PEOPLE.<br />REVEAL NOTHING ELSE.
            </h2>
            <p className="mt-5 max-w-2xl text-sm sm:text-base text-[#8A8882] leading-relaxed">
              Blackout now includes a dedicated private payroll system. Enter separate rooms for workspace control, private employees, pay runs and proof-based eligibility.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenPayroll}
            className="shrink-0 inline-flex items-center justify-center gap-3 px-6 py-4 bg-[#E8E6DF] text-black hover:bg-white font-mono text-xs font-bold uppercase tracking-[0.16em] transition-colors cursor-pointer"
          >
            OPEN BLACKOUT PAYROLL
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-px mt-8 bg-white/[0.08] border border-white/[0.08]">
          {rooms.map((room, index) => {
            const RoomIcon = room.icon;
            return (
              <button
                type="button"
                key={room.label}
                onClick={onOpenPayroll}
                className="group min-h-[240px] p-6 bg-[#0D0D0D] hover:bg-[#121212] text-left cursor-pointer transition-colors flex flex-col"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#8A8882]">0{index + 1}</span>
                  <RoomIcon className="w-5 h-5 text-[#FF5A5F]" />
                </div>

                <div className="mt-auto">
                  <h3 className="text-2xl sm:text-3xl font-condensed font-extrabold uppercase tracking-wide">{room.label}</h3>
                  <p className="mt-3 text-xs font-mono text-[#8A8882] leading-relaxed">{room.description}</p>
                  <div className="mt-6 text-[10px] font-mono uppercase tracking-[0.16em] font-bold text-[#E8E6DF] group-hover:text-[#FF5A5F]">
                    ENTER ROOM →
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 px-5 py-4 border border-white/[0.07] bg-[#070707] flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.12em] text-[#8A8882]">
          <span>BLACKOUT VERIFY = PROVE PRIVATELY</span>
          <span className="text-white/20 hidden md:inline">•</span>
          <span className="text-[#FF5A5F]">BLACKOUT PAYROLL = PAY PRIVATELY</span>
          <span className="text-white/20 hidden md:inline">•</span>
          <span>MIDNIGHT NETWORK</span>
        </div>
      </div>
    </section>
  );
};
