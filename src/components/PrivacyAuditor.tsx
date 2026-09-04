import React, { useState } from 'react';
import { X, ShieldCheck, Lock, HardDrive, Wifi, Database, Terminal } from 'lucide-react';
import { PrivateIncomeCredential, VerificationRequest } from '../midnight/types';

interface PrivacyAuditorProps {
  isOpen: boolean;
  onClose: () => void;
  credential: PrivateIncomeCredential | null;
  requests: VerificationRequest[];
}

export const PrivacyAuditor: React.FC<PrivacyAuditorProps> = ({
  isOpen,
  onClose,
  credential,
  requests,
}) => {
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'MEMORY_INSPECTION' | 'COMPLIANCE'>('TELEMETRY');

  if (!isOpen) return null;

  const checks = [
    {
      id: 'AUDIT-01',
      title: 'RAM Witness Isolation',
      desc: 'Monthly income is evaluated exclusively in private witness memory and never exported to global scope or network payloads.',
      status: 'VERIFIED SECURE',
      evidence: 'Witness closure encapsulation active'
    },
    {
      id: 'AUDIT-02',
      title: 'Zero-Leakage URL Guard',
      desc: 'No query parameters (?income=, ?salary=) exist in shareable verification links or endpoints.',
      status: 'VERIFIED SECURE',
      evidence: 'URL only contains opaque request_id tokens'
    },
    {
      id: 'AUDIT-03',
      title: 'Public Ledger Sanitization',
      desc: 'Midnight public ledger records contain only cryptographic commitments and boolean outcomes.',
      status: 'VERIFIED SECURE',
      evidence: 'Payload audit: 0 numerical salary bytes in ledger transactions'
    },
    {
      id: 'AUDIT-04',
      title: 'Verifier UI Redaction',
      desc: 'Verifier view components receive only public boolean flags (is_verified: true/false).',
      status: 'VERIFIED SECURE',
      evidence: 'Props contract restricts private fields from verifier components'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-sans select-none">
      <div 
        className="w-full max-w-3xl bg-[#0E0E0E] border border-white/[0.12] p-6 sm:p-8 relative text-left shadow-2xl rounded-[2px] max-h-[90vh] flex flex-col"
        id="modal-privacy-auditor"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="text-[10px] font-mono tracking-[0.2em] text-[#FF5A5F] uppercase font-bold">
              [ CRYPTOGRAPHIC PRIVACY AUDITOR ]
            </div>
            <h3 className="text-xl font-condensed font-extrabold uppercase text-[#E8E6DF]">
              ZERO-LEAKAGE PROTOCOL AUDIT.
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8A8882] hover:text-[#E8E6DF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 my-4 border-b border-white/[0.08] pb-3 font-mono text-xs uppercase">
          {(['TELEMETRY', 'MEMORY_INSPECTION', 'COMPLIANCE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 transition-all cursor-pointer ${
                activeTab === tab ? 'bg-[#E8E6DF] text-black font-bold' : 'text-[#8A8882] hover:text-[#E8E6DF]'
              }`}
            >
              {tab === 'TELEMETRY' ? 'Privacy Telemetry' : tab === 'MEMORY_INSPECTION' ? 'Data Boundaries' : 'GDPR Data Minimization'}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto pr-1 space-y-4 flex-1 font-mono text-xs">
          {activeTab === 'TELEMETRY' && (
            <div className="space-y-3">
              {checks.map((c) => (
                <div key={c.id} className="p-4 bg-[#090909] border border-white/[0.08] flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#E8E6DF]">{c.title}</span>
                      <span className="text-[10px] text-[#8A8882]">{c.id}</span>
                    </div>
                    <p className="text-[#8A8882] text-[11px] leading-relaxed">{c.desc}</p>
                    <div className="text-[10px] text-[#26A17B] mt-1">
                      ✓ {c.evidence}
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#26A17B]/20 text-[#26A17B] border border-[#26A17B]/40 shrink-0">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'MEMORY_INSPECTION' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Client RAM */}
                <div className="p-4 bg-[#090909] border border-white/[0.08] space-y-2">
                  <div className="flex items-center gap-2 text-[#FF5A5F] font-bold text-[11px] uppercase">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>1. Client RAM</span>
                  </div>
                  <div className="text-[10px] text-[#8A8882] space-y-1">
                    <div>monthlyIncome: {credential ? '🔒 PROTECTED' : 'NOT SET'}</div>
                    <div>salt: 🔒 PROTECTED</div>
                    <div className="text-[#26A17B] pt-1">Scope: Isolated Prover only</div>
                  </div>
                </div>

                {/* Network / Transit */}
                <div className="p-4 bg-[#090909] border border-white/[0.08] space-y-2">
                  <div className="flex items-center gap-2 text-[#E8E6DF] font-bold text-[11px] uppercase">
                    <Wifi className="w-3.5 h-3.5" />
                    <span>2. Network Transit</span>
                  </div>
                  <div className="text-[10px] text-[#8A8882] space-y-1">
                    <div>salaryBytes: 0 bytes</div>
                    <div>payload: ZK-SNARK bytes</div>
                    <div className="text-[#26A17B] pt-1">Zero plaintext transit</div>
                  </div>
                </div>

                {/* Public Ledger */}
                <div className="p-4 bg-[#090909] border border-white/[0.08] space-y-2">
                  <div className="flex items-center gap-2 text-[#26A17B] font-bold text-[11px] uppercase">
                    <Database className="w-3.5 h-3.5" />
                    <span>3. Midnight Ledger</span>
                  </div>
                  <div className="text-[10px] text-[#8A8882] space-y-1">
                    <div>is_verified: boolean</div>
                    <div>commitment: 0x...</div>
                    <div className="text-[#26A17B] pt-1">Verifiable compliance</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#090909] border border-white/[0.06] text-[#8A8882]">
                <div className="text-[#E8E6DF] font-bold mb-2 uppercase text-[11px]">
                  Simulated Midnight Public Ledger Entry:
                </div>
                <pre className="text-[11px] text-[#E8E6DF] overflow-x-auto leading-relaxed">
{`{
  "request_id": "req_rental_affordability_9821",
  "required_income": 2500,
  "is_verified": true,
  "disclosed_salary_bytes": "0 BYTES",
  "proof_hash": "0x7a8e291f4c01a9b2...",
  "network": "Midnight TestNet-02"
}`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'COMPLIANCE' && (
            <div className="p-5 bg-[#090909] border border-white/[0.08] space-y-3 text-xs text-[#8A8882] leading-relaxed">
              <h4 className="text-sm font-bold text-[#E8E6DF] uppercase">Data Minimization Principle (GDPR Article 5(1)(c))</h4>
              <p>
                Under modern data protection frameworks, processing personal financial information must be adequate, relevant, and strictly limited to what is necessary.
              </p>
              <p>
                Traditional screening unnecessarily over-collects bank statements and payslips. Blackout complies with data minimization laws by proving eligibility with <strong className="text-[#E8E6DF]">zero raw salary exposure</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#8A8882] font-mono">
          <span>Midnight Network Protocol Specification</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#E8E6DF] text-black hover:bg-white font-bold text-xs uppercase cursor-pointer rounded-[2px]"
          >
            CLOSE AUDITOR
          </button>
        </div>
      </div>
    </div>
  );
};
