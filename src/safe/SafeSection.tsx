import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  FileKey2,
  KeyRound,
  LockKeyhole,
  ReceiptText,
  Send,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { WalletState } from '../midnight/types';

type SafeView = 'overview' | 'treasury' | 'proposals' | 'signers' | 'policies' | 'receipts' | 'security';

interface SafeSectionProps {
  wallet: WalletState;
  onConnectLive: () => void;
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

const safeViews: Array<{ id: SafeView; label: string }> = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'treasury', label: 'TREASURY' },
  { id: 'proposals', label: 'PROPOSALS' },
  { id: 'signers', label: 'SIGNERS' },
  { id: 'policies', label: 'POLICIES' },
  { id: 'receipts', label: 'RECEIPTS' },
  { id: 'security', label: 'SECURITY' },
];

export const SafeHomeSection: React.FC<{ onOpenSafe: () => void }> = ({ onOpenSafe }) => (
  <section className="border-t border-white/[0.08] bg-[#070707] px-4 sm:px-8 lg:px-12 py-16 sm:py-20">
    <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
      <div className="lg:col-span-8 border border-[#FF5A5F]/45 bg-[#0D0D0D] p-7 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#FF5A5F]" />
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.22em] text-[#8A8882] mb-8">
          <span className="text-[#FF5A5F] font-bold">[ BLACKOUT ECOSYSTEM ]</span>
          <span className="text-white/20">/</span>
          <span>MIDNIGHT PREVIEW</span>
          <span className="ml-auto px-2 py-1 border border-[#26A17B]/40 bg-[#26A17B]/10 text-[#26A17B] font-bold">SAFE</span>
        </div>
        <h2 className="font-condensed font-extrabold uppercase leading-[0.9] tracking-tight text-[clamp(3rem,7vw,6.4rem)] text-[#E8E6DF]">
          BLACKOUT<br />SAFE.
        </h2>
        <p className="mt-7 max-w-2xl text-sm sm:text-base leading-relaxed text-[#8A8882]">
          Private organizational treasury, anonymous quorum, shielded execution and selective audit receipts — inside the same Blackout product.
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

const Surface: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <section className={`border border-white/[0.1] bg-[#0B0B0B] ${className}`}>{children}</section>
);

export const SafeSection: React.FC<SafeSectionProps> = ({ wallet, onConnectLive }) => {
  const [view, setView] = useState<SafeView>('overview');
  const isLive = wallet.isConnected && wallet.mode === 'LIVE';
  const walletLabel = isLive && wallet.address
    ? `${wallet.address.slice(0, 10)}...${wallet.address.slice(-4)}`
    : 'NOT CONNECTED';

  const completion = useMemo(() => testnetSteps.map((step, index) => ({
    step,
    complete: index === 0 && isLive,
  })), [isLive]);

  const renderWorkspace = () => {
    if (view === 'overview') {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <Surface className="xl:col-span-8 p-7 sm:p-8 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#FF5A5F]" />
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#8A8882]">[ TREASURY STATUS ]</div>
                  <h2 className="mt-4 font-condensed text-4xl sm:text-6xl font-extrabold uppercase leading-[0.9]">PRIVATE BY DEFAULT.</h2>
                  <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[#8A8882]">
                    Safe does not invent a public portfolio value. Shielded balances remain private until real Midnight wallet and asset discovery data are available.
                  </p>
                </div>
                <LockKeyhole className="w-5 h-5 text-[#FF5A5F] shrink-0" />
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 border-l border-t border-white/[0.08]">
                {[
                  ['TREASURY', 'SHIELDED'],
                  ['CONTRACT', 'NOT DEPLOYED'],
                  ['QUORUM', 'UNINITIALIZED'],
                ].map(([label, value]) => (
                  <div key={label} className="border-r border-b border-white/[0.08] p-4">
                    <div className="text-[9px] font-mono tracking-[0.16em] text-[#8A8882] uppercase">{label}</div>
                    <div className="mt-2 text-sm font-mono font-bold text-[#E8E6DF]">{value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                {!isLive && (
                  <button
                    onClick={onConnectLive}
                    className="inline-flex items-center gap-2 px-5 py-3.5 bg-[#E8E6DF] text-black hover:bg-white font-mono text-[11px] font-bold uppercase tracking-[0.14em] cursor-pointer"
                  >
                    CONNECT MIDNIGHT WALLET <WalletCards className="w-4 h-4" />
                  </button>
                )}
                <button
                  disabled
                  title="Safe contract deployment will be enabled only when the native Safe runtime is wired into this Blackout repository."
                  className="inline-flex items-center gap-2 px-5 py-3.5 border border-white/[0.1] bg-white/[0.04] text-[#8A8882] font-mono text-[11px] font-bold uppercase tracking-[0.14em] cursor-not-allowed"
                >
                  CREATE SAFE <ShieldCheck className="w-4 h-4" />
                </button>
              </div>
            </Surface>

            <Surface className="xl:col-span-4 p-6 sm:p-7">
              <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#FF5A5F] font-bold">[ LIVE BOUNDARY ]</div>
              <div className="mt-5 space-y-0 border-t border-white/[0.08] font-mono text-[10px] uppercase tracking-[0.1em]">
                {[
                  ['NETWORK', isLive ? wallet.network.toUpperCase() : 'PREVIEW REQUIRED'],
                  ['WALLET', walletLabel],
                  ['MODE', isLive ? 'LIVE' : 'DISCONNECTED'],
                  ['FAKE FALLBACK', 'NONE'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b border-white/[0.08] py-3">
                    <span className="text-[#8A8882]">{label}</span>
                    <span className={label === 'MODE' && isLive ? 'text-[#26A17B]' : 'text-[#E8E6DF]'}>{value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[10px] leading-relaxed font-mono uppercase tracking-[0.08em] text-[#8A8882]">
                No deployment, deposit, approval, execution or receipt is shown as successful without real Preview evidence.
              </p>
            </Surface>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 border-l border-t border-white/[0.08]">
            {capabilityCards.map(({ label, copy, icon: Icon }, index) => (
              <div key={label} className="border-r border-b border-white/[0.08] bg-[#0B0B0B] p-6 min-h-[210px] flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#8A8882] tracking-[0.18em]">0{index + 1}</span>
                  <Icon className="w-4 h-4 text-[#FF5A5F]" />
                </div>
                <h3 className="mt-10 font-condensed font-extrabold text-2xl uppercase">{label}</h3>
                <p className="mt-3 text-xs leading-relaxed text-[#8A8882]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const viewCopy: Record<Exclude<SafeView, 'overview'>, { title: string; eyebrow: string; copy: string; icon: React.ElementType }> = {
      treasury: {
        title: 'SHIELDED TREASURY',
        eyebrow: '[ ASSETS + EXECUTION ]',
        copy: 'Deposit shielded assets, inspect real wallet-discovered positions and execute only quorum-authorized transfers.',
        icon: WalletCards,
      },
      proposals: {
        title: 'PRIVATE PROPOSALS',
        eyebrow: '[ TRANSACTION INTENT ]',
        copy: 'Create committed transfer or governance proposals without publishing treasury intelligence that does not need to be public.',
        icon: Send,
      },
      signers: {
        title: 'ANONYMOUS SIGNERS',
        eyebrow: '[ MEMBER SET ]',
        copy: 'Authorized members prove membership and approval without exposing which signer approved the proposal.',
        icon: UsersRound,
      },
      policies: {
        title: 'PROGRAMMABLE POLICY',
        eyebrow: '[ QUORUM + LIMITS ]',
        copy: 'Threshold, transfer ceilings, execution delay and governance rules remain committed and enforceable.',
        icon: FileKey2,
      },
      receipts: {
        title: 'BLACKOUT RECEIPTS',
        eyebrow: '[ SELECTIVE AUDIT ]',
        copy: 'Produce proof-backed authorization and execution receipts while selectively disclosing only the fields an auditor needs.',
        icon: ReceiptText,
      },
      security: {
        title: 'FAIL-CLOSED SECURITY',
        eyebrow: '[ LIVE BOUNDARY ]',
        copy: 'No master withdrawal key, no fake transaction path, no hard-coded PASS and no LIVE success without finalized network evidence.',
        icon: ShieldCheck,
      },
    };

    const selected = viewCopy[view as Exclude<SafeView, 'overview'>];
    const Icon = selected.icon;
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Surface className="lg:col-span-8 p-7 sm:p-9 min-h-[420px]">
          <div className="flex items-center justify-between gap-4">
            <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#FF5A5F] font-bold">{selected.eyebrow}</div>
            <Icon className="w-5 h-5 text-[#FF5A5F]" />
          </div>
          <h2 className="mt-8 font-condensed font-extrabold uppercase text-5xl sm:text-7xl leading-[0.88]">{selected.title}</h2>
          <p className="mt-7 max-w-2xl text-sm leading-relaxed text-[#8A8882]">{selected.copy}</p>
          <div className="mt-10 border border-white/[0.08] bg-[#080808] p-5">
            <div className="text-[10px] font-mono tracking-[0.16em] uppercase text-[#8A8882]">CURRENT LIVE STATE</div>
            <div className="mt-3 font-mono text-sm font-bold uppercase">NO SAFE CONTRACT ATTACHED</div>
            <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.08em] leading-relaxed text-[#8A8882]">
              This workspace will populate only from real Midnight Preview contract and wallet evidence.
            </p>
          </div>
        </Surface>

        <Surface className="lg:col-span-4 p-7 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#FF5A5F] font-bold">[ ACCESS ]</div>
            <h3 className="mt-5 font-condensed text-4xl uppercase font-extrabold leading-[0.92]">CONNECT. DEPLOY. PROVE.</h3>
            <p className="mt-5 text-xs leading-relaxed text-[#8A8882]">
              The native Safe workspace shares Blackout's navigation and visual system. Real treasury actions remain gated behind the Safe Preview runtime.
            </p>
          </div>
          {!isLive ? (
            <button onClick={onConnectLive} className="mt-8 w-full flex items-center justify-between px-5 py-4 bg-[#E8E6DF] text-black hover:bg-white font-mono text-[11px] font-bold uppercase tracking-[0.14em] cursor-pointer">
              CONNECT PREVIEW WALLET <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="mt-8 border border-[#26A17B]/40 bg-[#26A17B]/10 px-5 py-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#26A17B]">
              WALLET CONNECTED // {walletLabel}
            </div>
          )}
        </Surface>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#090909] text-[#E8E6DF]">
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 pt-12 sm:pt-16 pb-12 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A8882] mb-9">
          <span className="w-2 h-2 bg-[#FF5A5F]" />
          <span>[ BLACKOUT SAFE ]</span>
          <span className="text-white/20">/</span>
          <span>MIDNIGHT PREVIEW</span>
          <span className="ml-auto border border-[#26A17B]/40 bg-[#26A17B]/10 text-[#26A17B] px-2 py-1 font-bold">NATIVE BLACKOUT SECTION</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-end">
          <div className="lg:col-span-8">
            <h1 className="font-condensed font-extrabold uppercase tracking-tight leading-[0.86] text-[clamp(3.8rem,9vw,8rem)]">
              PRIVATE TREASURY.<br />
              <span className="text-stroke-bone">PROVABLE CONTROL.</span>
            </h1>
            <p className="mt-7 max-w-3xl text-sm sm:text-base leading-relaxed text-[#8A8882]">
              BLACKOUT SAFE is a first-class workspace inside Blackout — the same way Payroll is. No redirect, no second product shell, no external Safe URL.
            </p>
          </div>

          <div className="lg:col-span-4 border border-[#FF5A5F]/40 bg-[#0D0D0D] p-6">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#FF5A5F] font-bold">[ PREVIEW SESSION ]</div>
            <div className="mt-5 space-y-3 font-mono text-[10px] uppercase tracking-[0.1em]">
              <div className="flex justify-between border-b border-white/[0.08] pb-2"><span className="text-[#8A8882]">NETWORK</span><span>{isLive ? wallet.network.toUpperCase() : 'PREVIEW'}</span></div>
              <div className="flex justify-between border-b border-white/[0.08] pb-2"><span className="text-[#8A8882]">WALLET</span><span className={isLive ? 'text-[#26A17B]' : 'text-[#FFB800]'}>{isLive ? 'CONNECTED' : 'REQUIRED'}</span></div>
              <div className="flex justify-between"><span className="text-[#8A8882]">SAFE CONTRACT</span><span>PENDING</span></div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-1 overflow-x-auto border-t border-b border-white/[0.08] py-2 font-mono text-[10px] tracking-[0.14em] uppercase no-scrollbar">
          {safeViews.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`px-3 py-2 whitespace-nowrap transition-colors cursor-pointer ${view === item.id ? 'bg-[#E8E6DF] text-black font-bold' : 'text-[#8A8882] hover:text-[#E8E6DF]'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-12">
        {renderWorkspace()}

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Surface className="lg:col-span-7 p-7 sm:p-8">
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] uppercase text-[#FF5A5F] font-bold">
              <Activity className="w-4 h-4" /> [ PREVIEW COMPLETION GATE ]
            </div>
            <div className="mt-6 border-t border-white/[0.08]">
              {completion.map(({ step, complete }, index) => (
                <div key={step} className="grid grid-cols-[42px_1fr_auto] gap-3 items-center border-b border-white/[0.08] py-4 font-mono text-[10px] uppercase tracking-[0.08em]">
                  <span className="text-[#8A8882]">0{index + 1}</span>
                  <span>{step}</span>
                  <span className={complete ? 'text-[#26A17B]' : 'text-[#8A8882]'}>{complete ? 'CONNECTED' : 'PENDING'}</span>
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="lg:col-span-5 p-7 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF5A5F] font-bold">
                <ShieldCheck className="w-4 h-4" /> [ SECURITY RULE ]
              </div>
              <h2 className="mt-6 font-condensed text-4xl sm:text-5xl font-extrabold uppercase leading-[0.9]">NO FAKE SUCCESS PATH.</h2>
              <p className="mt-5 text-sm text-[#8A8882] leading-relaxed">
                Contract deployment, deposits, approvals, execution and receipts only become green after real Midnight Preview transactions and verification evidence exist.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-3 border border-white/[0.08] bg-[#080808] p-4 font-mono text-[10px] uppercase tracking-[0.1em] text-[#8A8882]">
              <CheckCircle2 className="w-4 h-4 text-[#26A17B]" />
              SAME BLACKOUT APP // SAME NAVIGATION // SAME DESIGN SYSTEM
            </div>
          </Surface>
        </div>
      </section>
    </div>
  );
};
