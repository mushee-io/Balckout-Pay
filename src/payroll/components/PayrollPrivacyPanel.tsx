import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  FileCheck, 
  HelpCircle,
  EyeOff
} from 'lucide-react';

export const PayrollPrivacyPanel: React.FC = () => {
  const protectionGuarantees = [
    {
      title: 'COMPENSATION',
      status: 'PRIVATE',
      description: 'Individual employee compensation figures are never recorded on the public ledger.'
    },
    {
      title: 'EMPLOYEE PAYMENT AMOUNTS',
      status: 'PRIVATE',
      description: 'Per-recipient payment values execute within zero-knowledge witness enclaves.'
    },
    {
      title: 'PAYROLL METADATA',
      status: 'MINIMIZED',
      description: 'Only batch ID and proof verification status are published to the network.'
    },
    {
      title: 'ELIGIBILITY DATA',
      status: 'PRIVATE',
      description: 'Underlying KYC credentials and tax records remain strictly in off-chain RAM.'
    },
    {
      title: 'PUBLIC VERIFICATION',
      status: 'ONLY WHAT IS REQUIRED',
      description: 'Public observers verify only that payment authorization conditions were satisfied.'
    }
  ];

  return (
    <div className="space-y-6 text-left font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div>
          <div className="text-[10px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">
            [ TECHNICAL ARCHITECTURE ]
          </div>
          <h3 className="text-xl sm:text-2xl font-condensed font-extrabold uppercase text-[#E8E6DF] mt-0.5">
            WHAT BLACK PAYROLL PROTECTS
          </h3>
        </div>

        <div className="text-xs font-mono text-[#26A17B] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          <span>ZERO-KNOWLEDGE FORMAL DESIGN</span>
        </div>
      </div>

      <div className="bg-[#0E0E0E] border border-white/[0.08] p-6 rounded-[2px] space-y-6">
        {/* Core Philosophy Quote */}
        <blockquote className="p-4 bg-[#121212] border-l-2 border-[#FF5A5F] text-sm sm:text-base text-[#E8E6DF] italic font-serif">
          “Payroll should prove that payment conditions were satisfied without turning employee compensation into public data.”
        </blockquote>

        {/* 5 Guarantees Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
          {protectionGuarantees.map((item, idx) => (
            <div key={idx} className="p-4 bg-[#080808] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#E8E6DF] text-[11px]">{item.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 border ${
                  item.status === 'PRIVATE'
                    ? 'border-[#26A17B]/40 bg-[#26A17B]/10 text-[#26A17B]'
                    : 'border-white/[0.1] bg-[#1a1a1a] text-[#E8E6DF]'
                }`}>
                  {item.status}
                </span>
              </div>
              <p className="text-[11px] text-[#8A8882] leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Cryptographic Disclosure */}
        <div className="p-3 bg-[#060606] border border-white/[0.04] text-[10px] font-mono text-[#8A8882] space-y-1">
          <div className="text-[#E8E6DF] font-bold uppercase">CRYPTOGRAPHIC BOUNDARY STATEMENT:</div>
          <p>
            Black Payroll leverages zero-knowledge SNARK proof construction natively powered by Midnight's dual-state architecture. The public ledger records boolean validation outcomes, while sensitive witness values (salaries, identity attributes, private blinding nonces) are pruned prior to on-chain broadcast.
          </p>
        </div>
      </div>
    </div>
  );
};
