import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  FileCode,
  Lock
} from 'lucide-react';
import { VerificationRequest } from '../midnight/types';

interface RequestViewProps {
  requests: VerificationRequest[];
  onOpenCreateRequest: () => void;
  onSelectRequestToView: (req: VerificationRequest) => void;
  onSelectRequestToProve: (req: VerificationRequest) => void;
}

export const RequestView: React.FC<RequestViewProps> = ({
  requests,
  onOpenCreateRequest,
  onSelectRequestToView,
  onSelectRequestToProve,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = requests.filter((req) => {
    const matchesStatus = filterStatus === 'ALL' || req.status === filterStatus;
    const matchesSearch = 
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.verifierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-10 space-y-12 text-left font-sans select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div className="space-y-2">
          <div className="text-[11px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">
            [ VERIFICATION REQUESTS PORTAL ]
          </div>
          <h1 className="text-3xl sm:text-5xl font-condensed font-extrabold uppercase text-[#E8E6DF]">
            REQUEST ELIGIBILITY PROOF.
          </h1>
          <p className="text-xs sm:text-sm text-[#8A8882] max-w-2xl font-normal">
            Create threshold requirements for tenants, applicants, or loan counterparties. Midnight evaluates candidate eligibility in zero-knowledge and delivers cryptographically certified receipts.
          </p>
        </div>

        <button
          onClick={onOpenCreateRequest}
          id="btn-portal-create-request"
          className="px-5 py-3 bg-[#E8E6DF] text-black hover:bg-white active:translate-y-[1px] font-mono text-xs font-bold uppercase tracking-[0.16em] transition-all flex items-center gap-2 cursor-pointer rounded-[2px]"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>CREATE REQUEST</span>
        </button>
      </div>

      {/* Search & Filter Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8A8882] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="FILTER BY TITLE, VERIFIER, PURPOSE..."
            className="w-full bg-[#0E0E0E] border border-white/[0.1] pl-10 pr-4 py-2.5 font-mono text-xs text-[#E8E6DF] placeholder:text-[#8A8882]/60 focus:outline-none focus:border-[#FF5A5F]"
          />
        </div>

        <div className="flex items-center gap-1 font-mono text-xs uppercase">
          {['ALL', 'PENDING', 'VERIFIED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-2 transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-[#E8E6DF] text-black font-bold'
                  : 'bg-[#141414] text-[#8A8882] hover:text-[#E8E6DF]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-[#0E0E0E] border border-white/[0.08] overflow-hidden rounded-[2px] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#121212] text-[#8A8882] uppercase text-[10px] tracking-[0.18em]">
                <th className="py-4 px-6">REQUEST DETAILS</th>
                <th className="py-4 px-6">VERIFIER</th>
                <th className="py-4 px-6">CONDITION REQUIRED</th>
                <th className="py-4 px-6">STATUS</th>
                <th className="py-4 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((req) => {
                const hasProof = !!req.proofResult;
                const isPass = req.proofResult?.isVerified;

                return (
                  <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#E8E6DF] text-sm font-sans uppercase">
                        {req.title}
                      </div>
                      <div className="text-[10px] text-[#8A8882] flex items-center gap-2 mt-0.5">
                        <span>{req.purpose}</span>
                        <span>•</span>
                        <span className="text-[#8A8882]/80">{req.id}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-[#E8E6DF]">
                      <div>{req.verifierName}</div>
                      <div className="text-[10px] text-[#8A8882]">{req.verifierAddress.slice(0, 14)}...</div>
                    </td>

                    <td className="py-4 px-6 font-bold text-[#FF5A5F]">
                      Income ≥ £{req.requiredIncome.toLocaleString()}/mo
                    </td>

                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'VERIFIED'
                          ? 'bg-[#26A17B]/20 text-[#26A17B] border border-[#26A17B]/40'
                          : req.status === 'REJECTED'
                          ? 'bg-[#FF5A5F]/20 text-[#FF5A5F] border border-[#FF5A5F]/40'
                          : 'bg-white/[0.06] text-[#8A8882]'
                      }`}>
                        {req.status === 'VERIFIED' ? '✓ VERIFIED PASS' : req.status === 'REJECTED' ? '✗ NOT SATISFIED' : 'PENDING'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasProof ? (
                          <button
                            onClick={() => onSelectRequestToView(req)}
                            className="px-3 py-1.5 bg-[#181818] hover:bg-[#E8E6DF] hover:text-black border border-white/[0.1] text-[#E8E6DF] font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer"
                          >
                            VIEW RECEIPT →
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectRequestToProve(req)}
                            className="px-3 py-1.5 bg-[#181818] hover:bg-[#FF5A5F] hover:text-black border border-white/[0.1] text-[#FF5A5F] font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer font-bold"
                          >
                            PROVE NOW →
                          </button>
                        )}
                        <button
                          onClick={() => handleCopy(`https://blackout.network/verify/${req.id}`, req.id)}
                          className="p-1.5 bg-[#121212] border border-white/[0.08] hover:border-white/[0.2] text-[#8A8882] hover:text-[#E8E6DF] transition-colors cursor-pointer"
                          title="Copy Proof Link"
                        >
                          {copiedId === req.id ? <Check className="w-3.5 h-3.5 text-[#26A17B]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Embed & Integration Terminal */}
      <div className="p-6 bg-[#0E0E0E] border border-white/[0.08] space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#FF5A5F]"></span>
            <span className="text-[#E8E6DF] font-bold uppercase">[ VERIFIER EMBED API // WAVE 3 PREVIEW ]</span>
          </div>
          <span className="text-[10px] text-[#8A8882]">INTEGRATION SNIPPET</span>
        </div>
        <div className="p-4 bg-[#090909] border border-white/[0.06] text-[#8A8882] space-y-1">
          <div className="text-[#26A17B]">// Embed verification trigger inside your tenancy application checkout:</div>
          <div className="text-[#E8E6DF]">
            &lt;button onClick=&#123;() =&gt; blackout.requestProof(&#123; threshold: 2500 &#125;)&#125;&gt;PROVE INCOME PRIVATELY&lt;/button&gt;
          </div>
        </div>
      </div>

    </div>
  );
};
