import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Check, 
  X,
  ChevronRight,
  Terminal,
  Shield,
  FileCode,
  Sparkles,
  Zap,
  Lock,
  CornerDownRight,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { VerificationRequest } from '../midnight/types';

interface HomepageProps {
  requests: VerificationRequest[];
  onNavigate: (tab: string) => void;
  onOpenDemo: () => void;
  onOpenDevDrawer: () => void;
  onOpenAuditor: () => void;
  onOpenTests: () => void;
}

export const Homepage: React.FC<HomepageProps> = ({
  requests,
  onNavigate,
  onOpenDemo,
  onOpenDevDrawer,
  onOpenAuditor,
  onOpenTests,
}) => {
  // Interactive Hero Privacy Visualizer State
  const [demoCandidate, setDemoCandidate] = useState<'QUALIFIED' | 'UNQUALIFIED'>('QUALIFIED');
  const [isMasked, setIsMasked] = useState(false);
  const [circuitPulse, setCircuitPulse] = useState(0);

  // Candidate Data (Private vs Requirement)
  const candidateIncome = demoCandidate === 'QUALIFIED' ? 4720 : 2000;
  const requirementThreshold = 2500;
  const isSatisfied = candidateIncome >= requirementThreshold;

  // Circuit animation tick
  useEffect(() => {
    const interval = setInterval(() => {
      setCircuitPulse((p) => (p + 1) % 4);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#090909] text-[#E8E6DF] min-h-screen relative overflow-hidden font-sans select-none">
      
      {/* Edge Micro-Typography (Swiss Editorial Style) */}
      <div className="hidden 2xl:flex fixed left-4 top-1/2 -translate-y-1/2 writing-vertical-rl rotate-180 items-center gap-6 text-[10px] font-mono tracking-[0.3em] text-[#8A8882]/40 z-30 pointer-events-none uppercase">
        <span>BLACKOUT PROTOCOL // MIDNIGHT COMPACT</span>
        <span className="w-1.5 h-1.5 bg-[#FF5A5F]"></span>
        <span>ZERO-KNOWLEDGE PRIVACY PRESERVING ELIGIBILITY</span>
      </div>

      <div className="hidden 2xl:flex fixed right-4 top-1/2 -translate-y-1/2 writing-vertical-rl items-center gap-6 text-[10px] font-mono tracking-[0.3em] text-[#8A8882]/40 z-30 pointer-events-none uppercase">
        <span>PROVE YOU QUALIFY · REVEAL NOTHING ELSE</span>
        <span className="w-1.5 h-1.5 bg-[#E8E6DF]/30"></span>
        <span>PRIVATE INCOME DISCLOSED: 0 BYTES</span>
      </div>

      {/* ==================================================
          01 — HERO SECTION (55/45 Editorial Split)
          ================================================== */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-8 lg:px-12 max-w-[1440px] mx-auto border-b border-white/[0.08]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          
          {/* Left Hero (55%) */}
          <div className="lg:col-span-7 space-y-8 text-left">
            
            {/* Protocol Eyebrow */}
            <div className="inline-flex items-center gap-3 text-[11px] font-mono tracking-[0.22em] text-[#8A8882] uppercase border-b border-white/[0.08] pb-2">
              <span className="w-2 h-2 bg-[#FF5A5F]"></span>
              <span>[ PRIVACY-PRESERVING ELIGIBILITY PROTOCOL ]</span>
              <span className="text-white/[0.3]">/</span>
              <span className="text-[#E8E6DF]/80">MIDNIGHT NETWORK</span>
            </div>

            {/* Massive Display Headline */}
            <div className="space-y-1">
              <h1 className="text-[clamp(3.4rem,8.2vw,7.6rem)] font-condensed font-extrabold uppercase leading-[0.88] tracking-tight text-[#E8E6DF]">
                <span className="block">PROVE YOU</span>
                <span className="block text-stroke-bone">QUALIFY.</span>
                <span className="block relative">
                  REVEAL NOTHING ELSE.
                  {/* Slicing Signal-Red Accent */}
                  <span className="absolute left-0 bottom-2 sm:bottom-4 w-32 sm:w-64 h-[2px] bg-[#FF5A5F]"></span>
                </span>
              </h1>
            </div>

            {/* Editorial Lead Paragraph */}
            <p className="text-sm sm:text-base text-[#8A8882] leading-relaxed max-w-[560px] font-normal pt-2">
              Blackout uses Midnight to prove that you satisfy a requirement without exposing the private information behind it. A verifier asks a question; Midnight privately evaluates your credentials; the verifier receives only <span className="text-[#E8E6DF] font-bold">PASS</span> or <span className="text-[#E8E6DF] font-bold">FAIL</span>.
            </p>

            {/* Institutional Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <button
                onClick={() => onNavigate('prove')}
                id="hero-btn-create-proof"
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#E8E6DF] text-black hover:bg-white active:translate-y-[1px] font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.16em] transition-all rounded-[2px] cursor-pointer"
              >
                <span>CREATE PRIVATE PROOF</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('payroll')}
                id="hero-btn-black-payroll"
                className="inline-flex items-center gap-2.5 px-6 py-4 bg-[#141414] hover:bg-[#1c1c1c] border border-[#FF5A5F]/50 hover:border-[#FF5A5F] text-[#E8E6DF] font-mono text-xs font-semibold uppercase tracking-[0.14em] transition-all rounded-[2px] cursor-pointer"
              >
                <span className="w-1.5 h-1.5 bg-[#FF5A5F]"></span>
                <span>BLACK PAYROLL [NEW] →</span>
              </button>

              <button
                onClick={() => onNavigate('request')}
                id="hero-btn-create-request"
                className="inline-flex items-center gap-2.5 px-6 py-4 bg-transparent hover:bg-white/[0.04] border border-white/[0.14] hover:border-white/[0.3] text-[#8A8882] hover:text-[#E8E6DF] font-mono text-xs font-semibold uppercase tracking-[0.14em] transition-all rounded-[2px] cursor-pointer"
              >
                <span>VERIFICATION REQUESTS</span>
              </button>
            </div>

            {/* Micro Technical Ticker */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-[11px] font-mono text-[#8A8882] uppercase tracking-[0.18em]">
              <div>WAVE: <span className="text-[#FF5A5F] font-bold">01 (INCOME PROOF)</span></div>
              <div className="text-white/[0.2]">•</div>
              <div>CIRCUIT: <span className="text-[#E8E6DF]">COMPACT R1CS</span></div>
              <div className="text-white/[0.2]">•</div>
              <div>PRIVATE DATA DISCLOSED: <span className="text-[#E8E6DF] font-bold">0 BYTES</span></div>
            </div>
          </div>

          {/* Right Hero (45%): Signature Interactive Privacy Transformation Visualizer */}
          <div className="lg:col-span-5">
            <div className="bg-[#0E0E0E] border border-white/[0.1] p-6 sm:p-7 relative space-y-5 rounded-[2px] shadow-2xl">
              
              {/* Header Bar with Interactive Switch */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-[10px] font-mono tracking-[0.18em] text-[#8A8882] uppercase">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#FF5A5F]"></span>
                  <span>PRIVACY BOUNDARY VISUALIZER</span>
                </div>
                <div className="flex items-center gap-1 bg-[#141414] p-1 border border-white/[0.08]">
                  <button
                    onClick={() => setDemoCandidate('QUALIFIED')}
                    className={`px-2 py-0.5 text-[9px] font-bold transition-all ${
                      demoCandidate === 'QUALIFIED'
                        ? 'bg-[#E8E6DF] text-black'
                        : 'text-[#8A8882] hover:text-[#E8E6DF]'
                    }`}
                  >
                    PASS CASE
                  </button>
                  <button
                    onClick={() => setDemoCandidate('UNQUALIFIED')}
                    className={`px-2 py-0.5 text-[9px] font-bold transition-all ${
                      demoCandidate === 'UNQUALIFIED'
                        ? 'bg-[#FF5A5F] text-black'
                        : 'text-[#8A8882] hover:text-[#E8E6DF]'
                    }`}
                  >
                    FAIL CASE
                  </button>
                </div>
              </div>

              {/* 3-Stage Transformation Flow */}
              <div className="space-y-3 font-mono text-xs text-left">
                
                {/* 1. LEFT / USER PRIVATE SIDE */}
                <div className="p-3.5 bg-[#090909] border border-white/[0.08] space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-[#8A8882] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-[#E8E6DF] font-bold">
                      <Lock className="w-3 h-3 text-[#FF5A5F]" />
                      01 / PRIVATE DATA (CLIENT WITNESS)
                    </span>
                    <button 
                      onClick={() => setIsMasked(!isMasked)}
                      className="text-[9px] text-[#8A8882] hover:text-[#E8E6DF] uppercase flex items-center gap-1"
                    >
                      {isMasked ? <EyeOff className="w-3 h-3 text-[#FF5A5F]" /> : <Eye className="w-3 h-3" />}
                      <span>{isMasked ? 'MASKED' : 'REVEAL'}</span>
                    </button>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-[#8A8882] text-xs">Monthly Income:</span>
                    <span className="text-base sm:text-lg font-bold font-mono text-[#E8E6DF]">
                      {isMasked ? '████████' : `£${candidateIncome.toLocaleString()}/mo`}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8A8882]/70">
                    Exact value sealed in client witness memory. Never exposed on-chain.
                  </div>
                </div>

                {/* Transition Flow Arrow */}
                <div className="flex justify-center items-center gap-2 text-[#8A8882] text-[10px] tracking-widest uppercase py-0.5">
                  <span>↓</span>
                  <span className="text-[#FF5A5F] font-bold">PRIVACY BOUNDARY</span>
                  <span>↓</span>
                </div>

                {/* 2. CENTER / MIDNIGHT PRIVATE COMPUTATION */}
                <div className="p-3.5 bg-[#121212] border border-[#FF5A5F]/40 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between text-[10px] text-[#8A8882] uppercase">
                    <span className="text-[#FF5A5F] font-bold">[ 02 / MIDNIGHT PRIVATE COMPUTATION ]</span>
                    <span className="font-mono text-[9px] text-[#E8E6DF] animate-pulse">
                      ZK EVALUATION
                    </span>
                  </div>
                  <div className="p-2 bg-[#090909] border border-white/[0.06] font-mono text-[11px] text-[#E8E6DF]">
                    <span className="text-[#8A8882]">// Compact R1CS Constraint</span>
                    <div className="text-[#FF5A5F] font-bold mt-0.5">
                      income ({isMasked ? '████' : `£${candidateIncome}`}) ≥ requirement (£{requirementThreshold})
                    </div>
                  </div>
                  <div className="w-full bg-[#090909] h-1 overflow-hidden">
                    <div 
                      className="bg-[#FF5A5F] h-full transition-all duration-500"
                      style={{ width: `${(circuitPulse + 1) * 25}%` }}
                    ></div>
                  </div>
                </div>

                {/* Transition Flow Arrow */}
                <div className="flex justify-center items-center gap-2 text-[#8A8882] text-[10px] tracking-widest uppercase py-0.5">
                  <span>↓</span>
                  <span>VERIFIER RECEIPT ONLY</span>
                  <span>↓</span>
                </div>

                {/* 3. RIGHT / VERIFIER RECEIVES */}
                <div className={`p-3.5 border transition-all space-y-1.5 ${
                  isSatisfied 
                    ? 'bg-[#0A100D] border-[#26A17B]/40' 
                    : 'bg-[#150A0A] border-[#FF5A5F]/40'
                }`}>
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider">
                    <span className="text-[#8A8882]">03 / VERIFIER RECEIVES</span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold ${
                      isSatisfied 
                        ? 'bg-[#26A17B]/20 text-[#26A17B] border border-[#26A17B]/30' 
                        : 'bg-[#FF5A5F]/20 text-[#FF5A5F] border border-[#FF5A5F]/30'
                    }`}>
                      {isSatisfied ? '✓ PASS / VERIFIED' : '✗ NOT SATISFIED'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 pt-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#8A8882]">Condition Proved:</span>
                      <span className="text-[#E8E6DF] font-bold">Income ≥ £{requirementThreshold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A8882]">Exact Income:</span>
                      <span className="text-[#FF5A5F] font-bold">NOT DISCLOSED</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8A8882]">Private Income Disclosed:</span>
                      <span className="text-[#E8E6DF] font-bold">0 BYTES</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Technical Status */}
              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-[#8A8882]">
                <span>LEDGER PROOF: COMPACT VERIFIED</span>
                <span className="text-[#E8E6DF] font-bold">MIDNIGHT NETWORK</span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ==================================================
          02 — PROTOCOL PROPERTIES (Accurate Editorial Matrix)
          ================================================== */}
      <section className="py-14 sm:py-16 px-4 sm:px-8 lg:px-12 max-w-[1440px] mx-auto border-b border-white/[0.08]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          <div className="space-y-2 text-left">
            <div className="text-3xl sm:text-5xl font-condensed font-extrabold text-[#E8E6DF]">
              SEALED
            </div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A8882]">
              01 / PRIVATE VALUE
            </div>
            <div className="text-[11px] text-[#8A8882]/70 font-mono">
              Never Stored in Public State
            </div>
          </div>

          <div className="space-y-2 text-left">
            <div className="text-3xl sm:text-5xl font-condensed font-extrabold text-[#FF5A5F]">
              PASS / FAIL
            </div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A8882]">
              02 / VERIFIER OUTPUT
            </div>
            <div className="text-[11px] text-[#8A8882]/70 font-mono">
              Boolean Predicate Only
            </div>
          </div>

          <div className="space-y-2 text-left">
            <div className="text-3xl sm:text-5xl font-condensed font-extrabold text-[#E8E6DF]">
              0 BYTES
            </div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A8882]">
              03 / PRIVATE INCOME DISCLOSED
            </div>
            <div className="text-[11px] text-[#8A8882]/70 font-mono">
              Zero Underlying Data Shared
            </div>
          </div>

          <div className="space-y-2 text-left">
            <div className="text-3xl sm:text-5xl font-condensed font-extrabold text-[#E8E6DF]">
              MIDNIGHT
            </div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A8882]">
              04 / NETWORK
            </div>
            <div className="text-[11px] text-[#8A8882]/70 font-mono">
              Compact Smart Contracts
            </div>
          </div>

        </div>
      </section>

      {/* ==================================================
          03 — ARCHITECTURAL BREAKDOWN (3 Large Editorial Columns)
          ================================================== */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 lg:px-12 max-w-[1440px] mx-auto border-b border-white/[0.08]">
        <div className="space-y-16">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/[0.08] text-left">
            <div className="space-y-2">
              <div className="text-[11px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase">
                [ PROTOCOL MECHANISM ]
              </div>
              <h2 className="text-4xl sm:text-6xl font-condensed font-extrabold uppercase text-[#E8E6DF] leading-[0.92]">
                HOW BLACKOUT WORKS ON MIDNIGHT.
              </h2>
            </div>
            <div className="text-xs font-mono text-[#8A8882] uppercase tracking-[0.16em] max-w-[320px]">
              EVALUATING FINANCIAL ELIGIBILITY WITHOUT DATA EXPOSURE.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-white/[0.08]">
            
            {/* Column 01 */}
            <div className="p-8 sm:p-10 border-r border-b border-white/[0.08] bg-[#090909] hover:bg-[#0E0E0E] transition-colors space-y-8 text-left group">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-bold text-[#8A8882]/60 group-hover:text-[#FF5A5F] transition-colors">01</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A8882]">[ WITNESS STATE ]</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl sm:text-4xl font-condensed font-bold uppercase text-[#E8E6DF]">
                  LOCAL CLIENT WITNESS.
                </h3>
                <p className="text-xs sm:text-sm text-[#8A8882] leading-relaxed">
                  Your private income and cryptographic blinding salt reside solely in off-chain client memory. The raw values are never dispatched across RPC nodes or public API services.
                </p>
              </div>
              <div className="pt-4 border-t border-white/[0.06] text-[11px] font-mono text-[#8A8882] uppercase tracking-wider">
                → WITNESS FUNCTION ENCLAVE
              </div>
            </div>

            {/* Column 02 */}
            <div className="p-8 sm:p-10 border-r border-b border-white/[0.08] bg-[#090909] hover:bg-[#0E0E0E] transition-colors space-y-8 text-left group">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-bold text-[#8A8882]/60 group-hover:text-[#FF5A5F] transition-colors">02</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A8882]">[ ZERO KNOWLEDGE ]</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl sm:text-4xl font-condensed font-bold uppercase text-[#E8E6DF]">
                  COMPACT CIRCUIT PROOF.
                </h3>
                <p className="text-xs sm:text-sm text-[#8A8882] leading-relaxed">
                  The Midnight Compact circuit evaluates the mathematical inequality <code className="text-[#FF5A5F]">income ≥ threshold</code> in Zero-Knowledge. Only the boolean truth is extracted.
                </p>
              </div>
              <div className="pt-4 border-t border-white/[0.06] text-[11px] font-mono text-[#8A8882] uppercase tracking-wider">
                → R1CS CONSTRAINT ARITHMETIC
              </div>
            </div>

            {/* Column 03 */}
            <div className="p-8 sm:p-10 border-r border-b border-white/[0.08] bg-[#090909] hover:bg-[#0E0E0E] transition-colors space-y-8 text-left group">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-bold text-[#8A8882]/60 group-hover:text-[#FF5A5F] transition-colors">03</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A8882]">[ DISCLOSURE ]</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl sm:text-4xl font-condensed font-bold uppercase text-[#E8E6DF]">
                  VERIFIER RECEIVES ANSWER.
                </h3>
                <p className="text-xs sm:text-sm text-[#8A8882] leading-relaxed">
                  The verifier queries the Midnight ledger and confirms you satisfy the requirement. They never learn your exact salary, exact shortfall, or financial history.
                </p>
              </div>
              <div className="pt-4 border-t border-white/[0.06] text-[11px] font-mono text-[#8A8882] uppercase tracking-wider">
                → 0 BYTES SALARY EXPOSURE
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          04 — THE BIGGER VISION: ONE PROTOCOL. MANY QUESTIONS.
          ================================================== */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 lg:px-12 max-w-[1440px] mx-auto border-b border-white/[0.08]">
        <div className="space-y-16">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/[0.08] text-left">
            <div className="space-y-2">
              <div className="text-[11px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase">
                [ THE EXPANSION HORIZON ]
              </div>
              <h2 className="text-4xl sm:text-6xl font-condensed font-extrabold uppercase text-[#E8E6DF] leading-[0.92]">
                ONE PROTOCOL. MANY QUESTIONS.
              </h2>
            </div>
            <div className="text-xs font-mono text-[#8A8882] uppercase tracking-wider">
              THE VERIFIER GETS THE ANSWER. NOT THE UNDERLYING DATA.
            </div>
          </div>

          {/* Grid of Future Capabilities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            
            {/* Income (Active Wave 1) */}
            <div className="p-6 bg-[#121212] border border-[#FF5A5F] space-y-4">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                <span className="text-[#FF5A5F] font-bold">[ WAVE 01 // ACTIVE ]</span>
                <span className="px-2 py-0.5 bg-[#FF5A5F] text-black font-bold">OPERATIONAL</span>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-condensed font-bold uppercase text-[#E8E6DF]">MONTHLY INCOME</div>
                <div className="text-sm font-mono text-[#8A8882]">"Do they earn ≥ £2,500/mo?"</div>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs font-mono text-[#26A17B]">
                <span>✓ VERIFICATION SUPPORTED</span>
                <span className="text-[#8A8882]">BLACKOUT VERIFY</span>
              </div>
            </div>

            {/* Black Payroll (New Product Standalone) */}
            <div className="p-6 bg-[#121212] border border-[#26A17B] space-y-4 cursor-pointer hover:bg-[#161616] transition-colors" onClick={() => onNavigate('payroll')}>
              <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                <span className="text-[#26A17B] font-bold">[ NEW PRODUCT ]</span>
                <span className="px-2 py-0.5 bg-[#26A17B] text-black font-bold">STANDALONE SUITE</span>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-condensed font-bold uppercase text-[#E8E6DF]">BLACK PAYROLL</div>
                <div className="text-sm font-mono text-[#8A8882]">"Pay people. Reveal nothing else."</div>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs font-mono text-[#26A17B]">
                <span>EXPLORE WORKSPACE →</span>
                <span className="text-[#8A8882]">MIDNIGHT PROTOCOL</span>
              </div>
            </div>

            {/* Savings (Wave 2) */}
            <div className="p-6 bg-[#0E0E0E] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#8A8882]">
                <span>[ COMING IN FUTURE WAVES ]</span>
                <span className="text-[#8A8882]/70">WAVE 02</span>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-condensed font-bold uppercase text-[#E8E6DF]">SAVINGS & LIQUIDITY</div>
                <div className="text-sm font-mono text-[#8A8882]">"Do they hold ≥ £20,000?"</div>
              </div>
              <div className="pt-2 text-[11px] font-mono text-[#8A8882]">
                PLANNED // COMPOSITE ASSET PROOF
              </div>
            </div>

            {/* Age (Wave 2) */}
            <div className="p-6 bg-[#0E0E0E] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#8A8882]">
                <span>[ COMING IN FUTURE WAVES ]</span>
                <span className="text-[#8A8882]/70">WAVE 02</span>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-condensed font-bold uppercase text-[#E8E6DF]">AGE ATTESTATION</div>
                <div className="text-sm font-mono text-[#8A8882]">"Are they ≥ 18 years old?"</div>
              </div>
              <div className="pt-2 text-[11px] font-mono text-[#8A8882]">
                PLANNED // IDENTITY AGE BOUNDARY
              </div>
            </div>

            {/* Employment (Wave 2) */}
            <div className="p-6 bg-[#0E0E0E] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#8A8882]">
                <span>[ COMING IN FUTURE WAVES ]</span>
                <span className="text-[#8A8882]/70">WAVE 02</span>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-condensed font-bold uppercase text-[#E8E6DF]">EMPLOYMENT TENURE</div>
                <div className="text-sm font-mono text-[#8A8882]">"Employed continuously ≥ 12 months?"</div>
              </div>
              <div className="pt-2 text-[11px] font-mono text-[#8A8882]">
                PLANNED // PAYROLL TENURE CIRCUIT
              </div>
            </div>

            {/* Portfolio (Wave 2) */}
            <div className="p-6 bg-[#0E0E0E] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#8A8882]">
                <span>[ COMING IN FUTURE WAVES ]</span>
                <span className="text-[#8A8882]/70">WAVE 02</span>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-condensed font-bold uppercase text-[#E8E6DF]">ACCREDITED PORTFOLIO</div>
                <div className="text-sm font-mono text-[#8A8882]">"Total net assets ≥ $1,000,000?"</div>
              </div>
              <div className="pt-2 text-[11px] font-mono text-[#8A8882]">
                PLANNED // SOLVENCY CERTIFICATION
              </div>
            </div>

            {/* Membership (Wave 2) */}
            <div className="p-6 bg-[#0E0E0E] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#8A8882]">
                <span>[ COMING IN FUTURE WAVES ]</span>
                <span className="text-[#8A8882]/70">WAVE 02</span>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-condensed font-bold uppercase text-[#E8E6DF]">MEMBERSHIP QUALIFICATION</div>
                <div className="text-sm font-mono text-[#8A8882]">"Member in good standing of registry?"</div>
              </div>
              <div className="pt-2 text-[11px] font-mono text-[#8A8882]">
                PLANNED // MERKLE ACCUMULATOR PROOF
              </div>
            </div>

          </div>

          {/* Statement Banner */}
          <div className="p-6 bg-[#0E0E0E] border border-white/[0.08] text-center font-mono text-xs text-[#8A8882]">
            <span className="text-[#E8E6DF] font-bold">THE CORE PROMISE:</span> Applications ask questions. Users prove conditions privately. Blackout returns the answer. Underlying data stays private.
          </div>
        </div>
      </section>

      {/* ==================================================
          05 — PROTOCOL ROADMAP (Wave Sequence)
          ================================================== */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 lg:px-12 max-w-[1440px] mx-auto border-b border-white/[0.08]">
        <div className="space-y-12 text-left">
          
          <div className="space-y-2 pb-6 border-b border-white/[0.08]">
            <div className="text-[11px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase">
              [ PROTOCOL EVOLUTION ]
            </div>
            <h2 className="text-4xl sm:text-6xl font-condensed font-extrabold uppercase text-[#E8E6DF] leading-[0.92]">
              DEVELOPMENT ROADMAP.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Wave 01 */}
            <div className="p-8 bg-[#121212] border border-[#FF5A5F] space-y-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-[#FF5A5F]">WAVE 01</span>
                <span className="px-2 py-0.5 bg-[#FF5A5F] text-black">ACTIVE</span>
              </div>
              <h3 className="text-2xl font-condensed font-bold uppercase text-[#E8E6DF]">
                PRIVATE INCOME PROOF
              </h3>
              <p className="text-xs text-[#8A8882] leading-relaxed">
                Zero-knowledge income threshold verification on Midnight Network. Complete functional proof-of-concept for rental affordability and mortgage pre-qualification.
              </p>
              <div className="pt-2 text-[10px] font-mono text-[#FF5A5F] uppercase">
                → LIVE ON MIDNIGHT TESTNET-02
              </div>
            </div>

            {/* Wave 02 */}
            <div className="p-8 bg-[#0E0E0E] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-[#8A8882]">WAVE 02</span>
                <span className="text-[#8A8882]/70">PLANNED</span>
              </div>
              <h3 className="text-2xl font-condensed font-bold uppercase text-[#E8E6DF]">
                GENERAL CREDENTIALS
              </h3>
              <p className="text-xs text-[#8A8882] leading-relaxed">
                Expanded private predicates: Savings thresholds, age boundaries, employment tenure, and multi-condition composite proofs.
              </p>
              <div className="pt-2 text-[10px] font-mono text-[#8A8882] uppercase">
                → MULTI-FIELD COMPACT CIRCUITS
              </div>
            </div>

            {/* Wave 03 */}
            <div className="p-8 bg-[#0E0E0E] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-[#8A8882]">WAVE 03</span>
                <span className="text-[#8A8882]/70">PLANNED</span>
              </div>
              <h3 className="text-2xl font-condensed font-bold uppercase text-[#E8E6DF]">
                PROTOCOL DEVELOPER SDK
              </h3>
              <p className="text-xs text-[#8A8882] leading-relaxed">
                Client SDK and REST/GraphQL APIs enabling third-party DApps and Web2 platforms to embed private eligibility requests directly into checkout or onboarding.
              </p>
              <div className="pt-2 text-[10px] font-mono text-[#8A8882] uppercase">
                → EMBEDDABLE VERIFICATION WIDGET
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          06 — CANONICAL VERIFICATION REQUESTS REGISTRY
          ================================================== */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 lg:px-12 max-w-[1440px] mx-auto border-b border-white/[0.08]">
        <div className="space-y-8 text-left">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
            <div className="space-y-2">
              <div className="text-[11px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase">
                [ CANONICAL LEDGER REQUESTS ]
              </div>
              <h2 className="text-3xl sm:text-5xl font-condensed font-extrabold uppercase text-[#E8E6DF]">
                ACTIVE VERIFICATION REQUESTS.
              </h2>
            </div>
            <button
              onClick={() => onNavigate('request')}
              className="text-xs font-mono text-[#E8E6DF] hover:text-[#FF5A5F] uppercase tracking-[0.16em] flex items-center gap-2"
            >
              <span>+ NEW REQUEST</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-[#0E0E0E] border border-white/[0.08] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#121212] text-[#8A8882] uppercase text-[10px] tracking-[0.18em]">
                    <th className="py-4 px-6">REQUEST ID / TITLE</th>
                    <th className="py-4 px-6">VERIFIER</th>
                    <th className="py-4 px-6">CONDITION TO PROVE</th>
                    <th className="py-4 px-6">STATUS</th>
                    <th className="py-4 px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-[#E8E6DF]">{req.title}</div>
                        <div className="text-[10px] text-[#8A8882]">{req.id}</div>
                      </td>
                      <td className="py-4 px-6 text-[#8A8882]">
                        {req.verifierName}
                      </td>
                      <td className="py-4 px-6 font-bold text-[#FF5A5F]">
                        Monthly Income ≥ £{req.requiredIncome.toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 text-[10px] font-bold ${
                          req.status === 'VERIFIED'
                            ? 'bg-[#26A17B]/20 text-[#26A17B] border border-[#26A17B]/30'
                            : req.status === 'REJECTED'
                            ? 'bg-[#FF5A5F]/20 text-[#FF5A5F] border border-[#FF5A5F]/30'
                            : 'bg-white/[0.06] text-[#E8E6DF]'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => onNavigate('prove')}
                          className="px-3 py-1.5 bg-[#181818] hover:bg-[#E8E6DF] hover:text-black border border-white/[0.1] text-[#E8E6DF] font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer"
                        >
                          PROVE PRIVATELY →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          07 — MASSIVE EDITORIAL CALL TO ACTION
          ================================================== */}
      <section className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 max-w-[1440px] mx-auto text-left relative overflow-hidden">
        <div className="space-y-8 max-w-4xl">
          <div className="text-[11px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">
            [ READY TO PROVE ELIGIBILITY ]
          </div>
          <h2 className="text-[clamp(3.2rem,7.5vw,6.8rem)] font-condensed font-extrabold uppercase leading-[0.88] text-[#E8E6DF]">
            YOUR DATA IS YOURS. <span className="text-stroke-bone">PROVE IT</span> ON MIDNIGHT.
          </h2>
          <p className="text-sm sm:text-base text-[#8A8882] max-w-xl font-normal leading-relaxed">
            Generate mathematical zero-knowledge proofs that satisfy real-world financial requirements while preserving absolute personal privacy.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('prove')}
              id="cta-btn-start-proving"
              className="inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-[#E8E6DF] text-black hover:bg-white font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.16em] transition-all cursor-pointer rounded-[2px]"
            >
              <span>CREATE PRIVATE PROOF</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
            <button
              onClick={() => onNavigate('request')}
              className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-4 sm:py-5 bg-transparent hover:bg-white/[0.04] border border-white/[0.14] text-[#E8E6DF] font-mono text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer"
            >
              <span>REQUEST A PROOF</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
