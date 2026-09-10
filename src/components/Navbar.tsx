import React from 'react';
import { 
  Eye, 
  EyeOff, 
  Terminal,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { WalletState } from '../midnight/types';
import { DEPLOYED_CONTRACT_ADDRESS } from '../midnight/zk-engine';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  wallet: WalletState;
  onConnectWallet: (mode?: 'LIVE' | 'DEMO') => void;
  privacyMode: boolean;
  onTogglePrivacyMode: () => void;
  onOpenDemo: () => void;
  onOpenDevDrawer: () => void;
  onOpenAuditor: () => void;
  onOpenTests: () => void;
  onOpenDeployModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  wallet,
  onConnectWallet,
  privacyMode,
  onTogglePrivacyMode,
  onOpenDemo,
  onOpenDevDrawer,
  onOpenAuditor,
  onOpenTests,
  onOpenDeployModal,
}) => {
  const navItems = [
    { id: 'home', label: 'HOME' },
    { id: 'prove', label: 'VERIFY' },
    { id: 'request', label: 'REQUEST' },
    { id: 'verify', label: 'LEDGER' },
    { id: 'payroll', label: 'BLACK PAYROLL', isSpecial: true },
    { id: 'developers', label: 'DEVELOPERS' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#090909]/95 backdrop-blur-md transition-all font-sans">
      {/* Top Status Bar: Environment & Network Indicator */}
      <div className="bg-[#050505] border-b border-white/[0.06] px-4 sm:px-8 lg:px-12 py-1 flex items-center justify-between text-[10px] font-mono tracking-wider">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 ${wallet.mode === 'LIVE' ? 'bg-[#00FF66] animate-pulse' : 'bg-[#FFB800]'}`}></span>
            <span className={wallet.mode === 'LIVE' ? 'text-[#00FF66] font-bold' : 'text-[#FFB800]'}>
              {wallet.mode === 'LIVE' ? `NETWORK: ${wallet.network.toUpperCase()} (LIVE ON-CHAIN)` : 'MODE: DEMO SANDBOX — NO ON-CHAIN TRANSACTION'}
            </span>
          </span>
          <span className="hidden md:inline text-white/30">|</span>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-[#8A8882]">CONTRACT:</span>
            {DEPLOYED_CONTRACT_ADDRESS ? (
              <span className="text-[#00FF66] font-bold">
                {`${DEPLOYED_CONTRACT_ADDRESS.slice(0, 10)}...${DEPLOYED_CONTRACT_ADDRESS.slice(-4)}`}
              </span>
            ) : (
              <button
                onClick={onOpenDeployModal}
                className="text-[#FFB800] hover:text-[#FFA000] underline font-bold cursor-pointer inline-flex items-center gap-1"
                title="Click to deploy income_verifier.compact via Lace wallet"
              >
                [UNSET — CLICK TO DEPLOY ON-CHAIN]
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!DEPLOYED_CONTRACT_ADDRESS && (
            <button
              onClick={onOpenDeployModal}
              className="text-[#00E5FF] hover:text-[#80F4FF] font-bold cursor-pointer uppercase flex items-center gap-1"
            >
              🚀 Deploy Contract
            </button>
          )}
          <button
            onClick={() => onConnectWallet(wallet.mode === 'LIVE' ? 'DEMO' : 'LIVE')}
            className="text-[#8A8882] hover:text-[#E8E6DF] underline uppercase cursor-pointer"
          >
            {wallet.mode === 'LIVE' ? 'Switch to Demo' : 'Switch to Live Lace'}
          </button>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Wordmark (Editorial / Swiss Brutalist) */}
        <div className="flex items-center gap-8">
          <button 
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
            id="nav-brand-logo"
          >
            {/* Minimalist Brutalist Logo Glyph */}
            <div className="w-6 h-6 bg-[#E8E6DF] text-black flex items-center justify-center font-mono font-bold text-xs">
              <span className="w-2.5 h-2.5 bg-black"></span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-condensed font-extrabold tracking-wider text-[#E8E6DF] text-lg sm:text-xl uppercase">
                BLACKOUT
              </span>
              <span className="w-1.5 h-1.5 bg-[#FF5A5F]"></span>
              <span className="hidden sm:inline text-[10px] font-mono tracking-[0.2em] text-[#8A8882] uppercase">
                [ MIDNIGHT NETWORK ]
              </span>
            </div>
          </button>

          {/* Center Navigation Links: HOME, VERIFY, REQUEST, LEDGER, BLACK PAYROLL, DEVELOPERS */}
          <nav className="hidden md:flex items-center gap-1 font-mono text-[11px] tracking-[0.2em] uppercase">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  id={`nav-link-${item.id}`}
                  className={`px-3 py-1.5 transition-all relative cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'text-[#E8E6DF] font-bold'
                      : item.isSpecial
                      ? 'text-[#FF5A5F] hover:text-white font-medium'
                      : 'text-[#8A8882] hover:text-[#E8E6DF]'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.isSpecial && (
                    <span className="text-[9px] px-1 py-0.2 bg-[#FF5A5F]/20 text-[#FF5A5F] border border-[#FF5A5F]/40 font-bold">
                      NEW
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#FF5A5F]"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Privacy Mask Toggle */}
          <button
            onClick={onTogglePrivacyMode}
            id="nav-btn-toggle-mask"
            className={`p-2 border font-mono text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              privacyMode
                ? 'bg-[#181818] border-[#FF5A5F] text-[#FF5A5F]'
                : 'bg-[#0E0E0E] border-white/[0.1] text-[#8A8882] hover:text-[#E8E6DF]'
            }`}
            title={privacyMode ? 'Privacy Mask Active' : 'Privacy Mask Inactive'}
          >
            {privacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline text-[10px]">
              {privacyMode ? 'MASKED' : 'VISIBLE'}
            </span>
          </button>

          {/* Quick 30s Interactive Demo Trigger */}
          <button
            onClick={onOpenDemo}
            id="nav-btn-quick-demo"
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-[#121212] border border-[#FF5A5F]/40 hover:border-[#FF5A5F] text-[#E8E6DF] hover:text-white font-mono text-[11px] uppercase tracking-[0.16em] transition-all cursor-pointer"
          >
            <span className="w-1.5 h-1.5 bg-[#FF5A5F]"></span>
            <span>30S DEMO</span>
          </button>

          {/* Midnight Wallet Connect Button */}
          {wallet.isConnected ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0E0E0E] border border-white/[0.12] text-[11px] font-mono text-[#8A8882]">
              <span className={`w-1.5 h-1.5 ${wallet.mode === 'LIVE' ? 'bg-[#00FF66]' : 'bg-[#FF5A5F]'}`}></span>
              <span className="text-[#E8E6DF] font-bold">
                {wallet.address.slice(0, 10)}...{wallet.address.slice(-4)}
              </span>
              <span className="text-[9px] text-[#8A8882]">[{wallet.mode}]</span>
            </div>
          ) : (
            <button
              onClick={() => onConnectWallet('LIVE')}
              disabled={wallet.isConnecting}
              id="nav-btn-connect-wallet"
              className="px-3.5 sm:px-4 py-2 bg-[#E8E6DF] text-black hover:bg-white active:translate-y-[1px] font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] transition-all flex items-center gap-1.5 cursor-pointer rounded-[2px]"
            >
              {wallet.isConnecting ? (
                <span>CONNECTING...</span>
              ) : (
                <span>[ CONNECT MIDNIGHT WALLET ]</span>
              )}
            </button>
          )}

          {/* Developer Drawer Trigger */}
          <button
            onClick={onOpenDevDrawer}
            className="p-2 border border-white/[0.1] hover:border-white/[0.3] text-[#8A8882] hover:text-[#E8E6DF] transition-colors cursor-pointer"
            title="Open Compact Contract & Developer Drawer"
            id="nav-btn-dev-drawer"
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-start overflow-x-auto px-4 py-2 border-t border-white/[0.06] bg-[#0E0E0E] gap-2 font-mono text-[10px] tracking-[0.18em] uppercase no-scrollbar">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`px-2.5 py-1.5 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                isActive
                  ? 'bg-[#E8E6DF] text-black font-bold'
                  : item.isSpecial
                  ? 'text-[#FF5A5F] border border-[#FF5A5F]/40'
                  : 'text-[#8A8882] hover:text-[#E8E6DF]'
              }`}
            >
              <span>{item.label}</span>
              {item.isSpecial && <span className="text-[8px] bg-[#FF5A5F] text-black px-1 font-bold">NEW</span>}
            </button>
          );
        })}
      </div>
    </header>
  );
};
