import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { SafeSection } from './SafeSection';

const safeUrl = (import.meta.env.VITE_BLACKOUT_SAFE_URL || '').trim();

const navItems = [
  ['home', 'HOME'],
  ['prove', 'VERIFY'],
  ['request', 'REQUEST'],
  ['verify', 'LEDGER'],
  ['payroll', 'BLACKOUT PAYROLL'],
  ['safe', 'SAFE'],
  ['developers', 'DEVELOPERS'],
] as const;

export const SafeShell: React.FC = () => {
  const navigate = (tab: string) => {
    window.location.hash = tab === 'home' ? '/' : `/${tab}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openWorkspace = () => {
    if (!safeUrl) return;
    window.open(safeUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#090909] text-[#E8E6DF] font-sans selection:bg-[#FF5A5F] selection:text-black">
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#090909]/95 backdrop-blur-md">
        <div className="bg-[#050505] border-b border-white/[0.06] px-4 sm:px-8 lg:px-12 py-1 flex items-center justify-between text-[10px] font-mono tracking-wider uppercase">
          <div className="flex items-center gap-2 text-[#8A8882]">
            <span className="w-1.5 h-1.5 bg-[#FFB800]" />
            <span>BLACKOUT SAFE // MIDNIGHT PREVIEW TESTNET</span>
          </div>
          <span className="text-[#26A17B] font-bold">PREVIEW READY</span>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8 min-w-0">
            <button onClick={() => navigate('home')} className="flex items-center gap-3 text-left cursor-pointer shrink-0">
              <div className="w-6 h-6 bg-[#E8E6DF] text-black flex items-center justify-center">
                <span className="w-2.5 h-2.5 bg-black" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-condensed font-extrabold tracking-wider text-lg sm:text-xl uppercase">BLACKOUT</span>
                <span className="w-1.5 h-1.5 bg-[#FF5A5F]" />
                <span className="hidden sm:inline text-[10px] font-mono tracking-[0.2em] text-[#8A8882] uppercase">[ SAFE ]</span>
              </div>
            </button>

            <nav className="hidden md:flex items-center gap-1 font-mono text-[11px] tracking-[0.18em] uppercase overflow-x-auto">
              {navItems.map(([id, label]) => {
                const active = id === 'safe';
                const product = id === 'payroll' || id === 'safe';
                return (
                  <button
                    key={id}
                    onClick={() => navigate(id)}
                    className={`px-3 py-1.5 transition-all relative cursor-pointer whitespace-nowrap ${
                      active ? 'text-[#E8E6DF] font-bold' : product ? 'text-[#FF5A5F] hover:text-white' : 'text-[#8A8882] hover:text-[#E8E6DF]'
                    }`}
                  >
                    {label}
                    {active && <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#FF5A5F]" />}
                  </button>
                );
              })}
            </nav>
          </div>

          <button
            onClick={openWorkspace}
            disabled={!safeUrl}
            className={`hidden sm:flex items-center gap-2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${
              safeUrl ? 'bg-[#E8E6DF] text-black hover:bg-white cursor-pointer' : 'border border-white/[0.1] text-[#8A8882] cursor-not-allowed'
            }`}
          >
            {safeUrl ? 'OPEN TESTNET' : 'TESTNET URL PENDING'}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="md:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-t border-white/[0.06] bg-[#0E0E0E] font-mono text-[10px] tracking-[0.16em] uppercase">
          {navItems.map(([id, label]) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`px-2.5 py-1.5 whitespace-nowrap cursor-pointer ${
                id === 'safe' ? 'bg-[#E8E6DF] text-black font-bold' : id === 'payroll' ? 'text-[#FF5A5F] border border-[#FF5A5F]/40' : 'text-[#8A8882]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <SafeSection onConnectLive={openWorkspace} walletConnected={false} />
    </div>
  );
};
