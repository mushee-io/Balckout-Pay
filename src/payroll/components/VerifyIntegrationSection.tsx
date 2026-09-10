import React from 'react';
import { 
  ArrowDown, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  Sparkles,
  Lock,
  ExternalLink
} from 'lucide-react';

interface VerifyIntegrationSectionProps {
  onNavigateToVerify?: () => void;
}

export const VerifyIntegrationSection: React.FC<VerifyIntegrationSectionProps> = ({
  onNavigateToVerify,
}) => {
  return (
    <div className="space-y-6 text-left font-sans">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="text-[10px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">
            [ UNIFIED PRIVACY ARCHITECTURE ]
          </div>
          <h3 className="text-xl sm:text-2xl font-condensed font-extrabold uppercase text-[#E8E6DF] mt-0.5">
            BLACKOUT VERIFY × BLACK PAYROLL
          </h3>
        </div>

        <div className="text-xs font-mono">
          <span className="px-2.5 py-1 bg-[#1A1208] border border-[#FFB800]/40 text-[#FFB800] uppercase font-bold">
            ROADMAP: PLANNED (WAVE 2/3)
          </span>
        </div>
      </div>

      <div className="p-6 bg-[#0E0E0E] border border-white/[0.08] rounded-[2px] space-y-6">
        <div className="text-xs sm:text-sm text-[#8A8882] leading-relaxed max-w-3xl">
          Black Payroll utilizes Blackout Verify to establish automated qualification and payment prerequisites without unnecessarily exposing underlying employee identity, salary tiers, or private bank balances.
        </div>

        {/* Conceptual Architecture Diagram */}
        <div className="p-6 bg-[#080808] border border-white/[0.06] font-mono text-xs">
          <div className="text-[10px] uppercase text-[#8A8882] tracking-wider mb-4 text-center">
            CRYPTOGRAPHIC PRE-PAYMENT ELIGIBILITY PIPELINE
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center">
            {/* Step 1 */}
            <div className="p-4 bg-[#111] border border-white/[0.1] w-full md:w-48 space-y-1">
              <div className="text-[10px] text-[#8A8882]">STEP 01</div>
              <div className="font-bold text-[#E8E6DF]">EMPLOYEE</div>
              <div className="text-[10px] text-[#8A8882]">Private Witness State</div>
            </div>

            <div className="text-[#FF5A5F] font-bold text-sm">
              <span className="hidden md:inline">→</span>
              <span className="md:hidden">↓</span>
            </div>

            {/* Step 2 */}
            <div className="p-4 bg-[#111] border border-[#FF5A5F]/40 w-full md:w-48 space-y-1">
              <div className="text-[10px] text-[#FF5A5F] font-bold">BLACKOUT VERIFY</div>
              <div className="font-bold text-[#E8E6DF]">ZK CIRCUIT</div>
              <div className="text-[10px] text-[#8A8882]">Compact DSL Evaluation</div>
            </div>

            <div className="text-[#26A17B] font-bold text-sm">
              <span className="hidden md:inline">→</span>
              <span className="md:hidden">↓</span>
            </div>

            {/* Step 3 */}
            <div className="p-4 bg-[#0F1A14] border border-[#26A17B]/40 w-full md:w-48 space-y-1">
              <div className="text-[10px] text-[#26A17B] font-bold">OUTCOME</div>
              <div className="font-bold text-[#26A17B] flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ELIGIBLE ✓</span>
              </div>
              <div className="text-[10px] text-[#8A8882]">0 Bytes Data Leaked</div>
            </div>

            <div className="text-[#26A17B] font-bold text-sm">
              <span className="hidden md:inline">→</span>
              <span className="md:hidden">↓</span>
            </div>

            {/* Step 4 */}
            <div className="p-4 bg-[#111] border border-white/[0.1] w-full md:w-48 space-y-1">
              <div className="text-[10px] text-[#8A8882]">BLACK PAYROLL</div>
              <div className="font-bold text-[#E8E6DF]">PRIVATE PAYMENT</div>
              <div className="text-[10px] text-[#8A8882]">Shielded Settlement</div>
            </div>
          </div>
        </div>

        {/* Future Eligibility Conditions Grid */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase text-[#8A8882] tracking-wider">
            FUTURE PLANNED ELIGIBILITY POLICIES (WAVE 2/3):
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 bg-[#080808] border border-white/[0.06] space-y-1">
              <div className="text-[10px] text-[#FFB800]">[ PLANNED ]</div>
              <div className="text-[#E8E6DF] font-bold">Employment Status = Active</div>
              <div className="text-[10px] text-[#8A8882]">Proves active contract tenure</div>
            </div>

            <div className="p-3 bg-[#080808] border border-white/[0.06] space-y-1">
              <div className="text-[10px] text-[#FFB800]">[ PLANNED ]</div>
              <div className="text-[#E8E6DF] font-bold">Payroll Period = Eligible</div>
              <div className="text-[10px] text-[#8A8882]">Validates temporal payout cycle</div>
            </div>

            <div className="p-3 bg-[#080808] border border-white/[0.06] space-y-1">
              <div className="text-[10px] text-[#FFB800]">[ PLANNED ]</div>
              <div className="text-[#E8E6DF] font-bold">Jurisdiction = Approved</div>
              <div className="text-[10px] text-[#8A8882]">Regulatory sanction list screening</div>
            </div>

            <div className="p-3 bg-[#080808] border border-white/[0.06] space-y-1">
              <div className="text-[10px] text-[#FFB800]">[ PLANNED ]</div>
              <div className="text-[#E8E6DF] font-bold">Required Credential = Valid</div>
              <div className="text-[10px] text-[#8A8882]">Issuer cryptographic signature check</div>
            </div>
          </div>
        </div>

        {/* Honest Disclosure */}
        <div className="p-3 bg-[#080808] border border-white/[0.06] text-[11px] font-mono text-[#8A8882] flex items-center justify-between">
          <span>
            Current integration status: <strong className="text-[#FFB800]">PREVIEW SPECIFICATION</strong>. Live cross-contract invocation requires Midnight multi-contract composability.
          </span>
          {onNavigateToVerify && (
            <button
              onClick={onNavigateToVerify}
              className="text-[#E8E6DF] hover:underline uppercase text-[10px] shrink-0 font-bold ml-4 cursor-pointer"
            >
              [ EXPLORE BLACKOUT VERIFY ]
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
