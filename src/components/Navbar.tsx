import React from 'react';
import { Eye, EyeOff, Terminal } from 'lucide-react';
import { WalletState } from '../midnight/types';
import { getMidnightConfig } from '../midnight/providers';
import { getActiveBlackoutContractAddress } from '../midnight/live-midnight';

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

  const contractAddress = getActiveBlackoutContractAddress() || getMidnightConfig().contractAddress;
  const isLive = wallet.isConnected && wallet.mode === 'LIVE';
  const isDemo = wallet.isConnected && wallet.mode === 'DEMO';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#090909]/95 backdrop-blur-md transition-all font-sans">
      <div className="bg-[#050505] border-b border-white/[0.06] px-4 sm:px-8 lg:px-12 py-1 flex items-center justify-between text-[10px] font-mono tracking-wider">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 ${isLive ? 'bg-[#00FF66] animate-pulse' : isDemo ? 'bg-[#FFB800]' : 'bg-white/30'}`}></span>
            <span className={isLive ? 'text-[#00FF66] font-bold' : isDemo ? 'text-[#FFB800]' : 'text-[#8A8882]'}>
              {isLive
                ? `NETWORK: ${wallet.network.toUpperCase()} (LIVE ON-CHAIN)`
                : isDemo
                ? 'MODE: DEMO SANDBOX — NO ON-CHAIN TRANSACTION'
                : 'WALLET: DISCONNECTED — LIVE MODE NOT ACTIVE'}
            </span>
          </span>
          <span className="hidden md:inline text-white/30">|</span>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-[#8A8882]">CONTRACT:</span>
            {contractAddress ? (
              <span className="text-[#00FF66] font-bold" title={contractAddress}>
                {`${contractAddress.slice(0, 10)}...${contractAddress.slice(-4)}`}
              </span>
            ) : (
              <button
                onClick={onOpenDeployModal}
                className="text-[#FFB800] hover:text-[#FFA000] underline font-bold cursor-pointer inline-flex items-center gap-1"
                title="Click to deploy income_verifier.compact on Midnight Preview"
              >
                [UNSET — CLICK TO DEPLOY ON-CHAIN]
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!contractAddress && (
            <button
              onClick={onOpenDeployModal}
              className="text-[#00E5FF] hover:text-[#80F4FF] font-bold cursor-pointer uppercase flex items-center gap-1"
            >
              🚀 Deploy Contract
            </button>
          )}
          <button
            onClick={() => onConnectWallet(isLive ? 'DEMO' : 'LIVE')}
            className="text-[#8A8882] hover:text-[#E8E6DF] underline uppercase cursor-pointer"
          >
            {isLive ? 'Switch to Demo' : wallet.isConnected ? 'Switch to Live Wallet' : 'Connect Live Wallet'}
          </button>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
            id="nav-brand-logo"
          >
            <div className="w-6 h-6 bg-[#E8E6DF] text-black flex items-center justify-center font-mono font-bold text-xs">
              <span className="w-2.5 h-2.5 bg-black"></span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-condensed font-extrabold tracking-wider text-[#E8E6DF] text-lg sm:text-xl uppercase">BLACKOUT</span>
              <span className="w-1.5 h-1.5 bg-[#FF5A5F]"></span>
              <span className="hidden sm:inline text-[10px] font-mono tracking-[0.2em] text-[#8A8882] uppercase">[ MIDNIGHT NETWORK ]</span>
            </div>
          </button>

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
                    <span className="text-[9px] px-1 py-0.2 bg-[#FF5A5F]/20 text-[#FF5A5F] border border-[#FF5A5F]/40 font-bold">NEW</span>
                  )}
                  {isActive && <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#FF5A5F]"></span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
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
            <span className="hidden xl:inline text-[10px]">{privacyMode ? 'MASKED' : 'VISIBLE'}</span>
          </button>

          {!isLive && (
            <button
              onClick={onOpenDemo}
              id="nav-btn-quick-demo"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-[#121212] border border-[#FF5A5F]/40 hover:border-[#FF5A5F] text-[#E8E6DF] hover:text-white font-mono text-[11px] uppercase tracking-[0.16em] transition-all cursor-pointer"
            >
              <span className="w-1.5 h-1.5 bg-[#FF5A5F]"></span>
              <span>30S DEMO</span>
            </button>
          )}

          {wallet.isConnected ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0E0E0E] border border-white/[0.12] text-[11px] font-mono text-[#8A8882]">
              <span className={`w-1.5 h-1.5 ${isLive ? 'bg-[#00FF66]' : 'bg-[#FF5A5F]'}`}></span>
              <span className="text-[#E8E6DF] font-bold">{wallet.address.slice(0, 10)}...{wallet.address.slice(-4)}</span>
              <span className="text-[9px] text-[#8A8882]">[{wallet.mode}]</span>
            </div>
          ) : (
            <button
              onClick={() => onConnectWallet('LIVE')}
              disabled={wallet.isConnecting}
              id="nav-btn-connect-wallet"
              className="px-3.5 sm:px-4 py-2 bg-[#E8E6DF] text-black hover:bg-white active:translate-y-[1px] font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] transition-all flex items-center gap-1.5 cursor-pointer rounded-[2px]"
            >
              {wallet.isConnecting ? 'CONNECTING...' : '[ CONNECT MIDNIGHT WALLET ]'}
            </button>
          )}

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
