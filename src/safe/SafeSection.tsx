import React from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from 'lucide-react';

const configuredSafeUrl = (import.meta.env.VITE_BLACKOUT_SAFE_URL || '').trim();

interface SafeSectionProps {
  onConnectLive: () => void;
  walletConnected: boolean;
}

const capabilityCards = [
  {
    label: 'PRIVATE TREASURY',
    copy: 'Shielded organizational balances and treasury execution on Midnight.',
    icon: WalletCards,
  },
  {
    label: 'ANONYMOUS QUORUM',
    copy: 'Authorized signers prove quorum without exposing the signer set.',
    icon: UsersRound,
  },
  {
    label: 'POLICY PROOFS',
    copy: 'Threshold, limits, delays and governance remain bound to committed policy.',
    icon: KeyRound,
  },
  {
    label: 'AUDIT RECEIPTS',
    copy: 'Generate selective, proof-backed receipts without leaking treasury secrets.',
    icon: ReceiptText,
  },
];

const testnetSteps = [
  'Connect a funded Midnight Preview wallet',
  'Create a Safe space and deploy the real Safe contract',
  'Deposit the existing shielded Preview test asset',
  'Collect three independent authorized approvals',
  'Execute one real shielded treasury transfer',
  'Verify the resulting Blackout receipt',
];

export const SafeHomeSection: React.FC<{ onOpenSafe: () => void }> = ({ onOpenSafe }) => (
  <section className="border-t border-white/[0.08] bg-[#070707] px-4 sm:px-8 lg:px-12 py-16 sm:py-20">
    <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
      <div className="lg:col-span-8 border border-[#FF5A5F]/45 bg-[#0D0D0D] p-7 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#FF5A5F]" />
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.22em] text-[#8A8882] mb-8">
          <span className="text-[#FF5A5F] font-bold">[ NEW PRODUCT ]</span>
          <span className="text-white/20">/</span>
          <span>MIDNIGHT PREVIEW</span>
          <span className="ml-auto px-2 py-1 border border-[#26A17B]/40 bg-[#26A17B]/10 text-[#26A17B] font-bold">PREVIEW READY</span>
        </div>
        <h2 className="font-condensed font-extrabold uppercase leading-[0.9] tracking-tight text-[clamp(3rem,7vw,6.4rem)] text-[#E8E6DF]">
          BLACKOUT<br />SAFE.
        </h2>
        <p className="mt-7 max-w-2xl text-sm sm:text-base leading-relaxed text-[#8A8882]">
          A zero-knowledge treasury operating system for private organizational funds, anonymous authorization, shielded execution and selective auditability.
        </p>
        <button
          onClick={onOpenSafe}
          className="mt-8 inline-flex items-center gap-3 px-6 py-3.5 bg-[#E8E6DF] text-black font-mono text-xs font-bold tracking-[0.16em] uppercase hover:bg-white transition-colors cursor-pointer"
        >
          OPEN SAFE <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="lg:col-span-4 border border-white/[0.1] bg-[#0B0B0B] p-7 sm:p-8 flex flex-col justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#FF5A5F] mb-5">[ CORE PROMISE ]</div>
          <p className="font-condensed text-3xl sm:text-4xl uppercase font-extrabold leading-[0.95] text-[#E8E6DF]">
            PROVE THE TREASURY ACTION IS AUTHORIZED.
          </p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[#8A8882]">
            REVEAL NOTHING ELSE THAT DOES NOT NEED TO BE REVEALED.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-px bg-white/[0.08] border border-white/[0.08]">
          {['SHIELDED', 'QUORUM ZK', 'NO MASTER KEY', 'SELECTIVE AUDIT'].map((item) => (
            <div key={item} className="bg-[#090909] px-3 py-4 text-[9px] font-mono tracking-[0.16em] text-[#8A8882] uppercase">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export const SafeSection: React.FC<SafeSectionProps> = ({ onConnectLive, walletConnected }) => {
  const launchSafe = () => {
    if (!configuredSafeUrl) return;
    window.open(configuredSafeUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#090909] text-[#E8E6DF]">
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 pt-14 sm:pt-20 pb-16 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A8882] mb-10">
          <span className="w-2 h-2 bg-[#FF5A5F]" />
          <span>[ BLACKOUT SAFE ]</span>
          <span className="text-white/20">/</span>
          <span>MIDNIGHT PREVIEW TESTNET</span>
          <span className="ml-auto border border-[#26A17B]/40 bg-[#26A17B]/10 text-[#26A17B] px-2 py-1 font-bold">PREVIEW READY</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-end">
          <div className="lg:col-span-8">
            <h1 className="font-condensed font-extrabold uppercase tracking-tight leading-[0.86] text-[clamp(3.8rem,9vw,8rem)]">
              PRIVATE TREASURY.<br />
              <span className="text-stroke-bone">PROVABLE CONTROL.</span>
            </h1>
            <p className="mt-8 max-w-3xl text-sm sm:text-base leading-relaxed text-[#8A8882]">
              BLACKOUT SAFE is the treasury layer of Blackout: confidential balances, anonymous authorized signers, zero-knowledge quorum, programmable policy, shielded execution and verifiable receipts.
            </p>
          </div>

          <div className="lg:col-span-4 border border-[#FF5A5F]/40 bg-[#0D0D0D] p-6">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#FF5A5F] font-bold">[ TESTNET LAUNCH ]</div>
            <div className="mt-5 space-y-3 font-mono text-[11px] uppercase tracking-[0.1em]">
              <div className="flex justify-between border-b border-white/[0.08] pb-2"><span className="text-[#8A8882]">NETWORK</span><span>PREVIEW</span></div>
              <div className="flex justify-between border-b border-white/[0.08] pb-2"><span className="text-[#8A8882]">SAFE CORE</span><span className="text-[#26A17B]">READY</span></div>
              <div className="flex justify-between border-b border-white/[0.08] pb-2"><span className="text-[#8A8882]">LIVE FALLBACK</span><span>NONE</span></div>
              <div className="flex justify-between"><span className="text-[#8A8882]">WALLET</span><span className={walletConnected ? 'text-[#26A17B]' : 'text-[#FFB800]'}>{walletConnected ? 'CONNECTED' : 'REQUIRED'}</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 border-l border-t border-white/[0.08]">
          {capabilityCards.map(({ label, copy, icon: Icon }, index) => (
            <div key={label} className="border-r border-b border-white/[0.08] bg-[#0B0B0B] p-6 min-h-[220px] flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#8A8882] tracking-[0.18em]">0{index + 1}</span>
                <Icon className="w-4 h-4 text-[#FF5A5F]" />
              </div>
              <h3 className="mt-10 font-condensed font-extrabold text-2xl uppercase">{label}</h3>
              <p className="mt-3 text-xs leading-relaxed text-[#8A8882]">{copy}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 border border-white/[0.1] bg-[#0B0B0B] p-7 sm:p-8">
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] uppercase text-[#FF5A5F] font-bold">
              <ShieldCheck className="w-4 h-4" /> [ PREVIEW COMPLETION GATE ]
            </div>
            <div className="mt-7 space-y-0 border-t border-white/[0.08]">
              {testnetSteps.map((step, index) => (
                <div key={step} className="grid grid-cols-[42px_1fr_auto] gap-3 items-center border-b border-white/[0.08] py-4 font-mono text-[11px] uppercase tracking-[0.08em]">
                  <span className="text-[#8A8882]">0{index + 1}</span>
                  <span className="text-[#E8E6DF]">{step}</span>
                  <span className="text-[#8A8882]">PENDING</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 border border-[#FF5A5F]/40 bg-[#111] p-7 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF5A5F] font-bold">
                <LockKeyhole className="w-4 h-4" /> [ LIVE MODE ONLY ]
              </div>
              <h2 className="mt-6 font-condensed text-4xl sm:text-5xl font-extrabold uppercase leading-[0.9]">NO FAKE SUCCESS PATH.</h2>
              <p className="mt-5 text-sm text-[#8A8882] leading-relaxed">
                Safe stays fail-closed. Contract deployment, deposits, approvals and execution only count after real Midnight Preview transactions and network evidence exist.
              </p>
            </div>

            <div className="mt-10 space-y-3">
              {!walletConnected && (
                <button
                  onClick={onConnectLive}
                  className="w-full flex items-center justify-between px-5 py-4 border border-white/[0.14] hover:border-white/[0.35] bg-[#0A0A0A] font-mono text-[11px] uppercase tracking-[0.14em] cursor-pointer"
                >
                  CONNECT MIDNIGHT WALLET <WalletCards className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={launchSafe}
                disabled={!configuredSafeUrl}
                className={`w-full flex items-center justify-between px-5 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                  configuredSafeUrl
                    ? 'bg-[#E8E6DF] text-black hover:bg-white cursor-pointer'
                    : 'bg-white/[0.05] text-[#8A8882] border border-white/[0.08] cursor-not-allowed'
                }`}
              >
                {configuredSafeUrl ? 'OPEN SAFE TESTNET WORKSPACE' : 'SAFE DEPLOYMENT URL NOT SET'}
                {configuredSafeUrl ? <ArrowUpRight className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 opacity-40" />}
              </button>

              {!configuredSafeUrl && (
                <p className="font-mono text-[9px] leading-relaxed uppercase tracking-[0.12em] text-[#8A8882]">
                  SET VITE_BLACKOUT_SAFE_URL TO THE PRODUCTION URL OF THE LEAN mushee-io/Safe DEPLOYMENT.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
