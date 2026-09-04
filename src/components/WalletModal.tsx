import React from 'react';
import { 
  X, 
  AlertTriangle, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldAlert, 
  Laptop, 
  Coins, 
  ArrowRight,
  Info
} from 'lucide-react';
import { isInIframe, getInjectedMidnightWallets } from '../midnight/wallet-connector';
import { WalletState } from '../midnight/types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  onConnectLive: () => void;
  onSwitchToDemo: () => void;
  errorMessage?: string | null;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onConnectLive,
  onSwitchToDemo,
  errorMessage,
}) => {
  const [copiedCmd, setCopiedCmd] = React.useState(false);
  const inIframe = isInIframe();
  const injectedWallets = getInjectedMidnightWallets();
  const hasInjected = injectedWallets.length > 0;

  if (!isOpen) return null;

  const localRunCommand = `git clone <REPO_URL> blackout-midnight\ncd blackout-midnight\nnpm install\nnpm run dev`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('npm install && npm run dev');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md font-sans">
      <div 
        className="relative w-full max-w-2xl bg-[#0C0C0C] border border-white/[0.14] shadow-2xl p-6 sm:p-8 space-y-6 text-left"
        id="midnight-wallet-modal"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">
                [ MIDNIGHT DAPP CONNECTOR ]
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-white/[0.05] border border-white/[0.1] text-[#8A8882]">
                API v4.0.1
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-condensed font-extrabold uppercase text-[#E8E6DF] tracking-wide">
              Midnight Lace Wallet Connection
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8A8882] hover:text-white border border-transparent hover:border-white/[0.1] transition-colors cursor-pointer"
            id="wallet-modal-btn-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Diagnostics Checklist */}
        <div className="bg-[#141414] border border-white/[0.08] p-4 space-y-3 font-mono text-xs">
          <div className="text-[11px] text-[#E8E6DF] font-bold tracking-wider uppercase border-b border-white/[0.06] pb-2">
            Wallet Runtime Diagnostics
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center justify-between p-2 bg-black/40 border border-white/[0.04]">
              <span className="text-[#8A8882]">Wallet Extension Detected:</span>
              <span className={`font-bold ${hasInjected ? 'text-[#00FF66]' : 'text-[#FF5A5F]'}`}>
                {hasInjected ? 'YES' : 'NO'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-black/40 border border-white/[0.04]">
              <span className="text-[#8A8882]">Provider (`window.midnight`):</span>
              <span className={`font-bold ${hasInjected ? 'text-[#00FF66]' : 'text-[#FF5A5F]'}`}>
                {hasInjected ? 'YES' : 'NO'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-black/40 border border-white/[0.04]">
              <span className="text-[#8A8882]">Sandbox / Iframe Environment:</span>
              <span className={`font-bold ${inIframe ? 'text-[#FFB800]' : 'text-[#8A8882]'}`}>
                {inIframe ? 'YES (AI Studio Iframe)' : 'NO (Top-Level)'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-black/40 border border-white/[0.04]">
              <span className="text-[#8A8882]">Target Midnight Network:</span>
              <span className="text-[#00FF66] font-bold">Midnight Preview</span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 text-[#FF5A5F] text-[11px] leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Error:</span> {errorMessage}
              </div>
            </div>
          )}
        </div>

        {/* Actionable Steps for User */}
        <div className="space-y-4">
          <div className="text-xs font-mono tracking-wider text-[#8A8882] uppercase">
            Required Actions to Connect Real Midnight Wallet:
          </div>

          <div className="space-y-3 font-sans text-xs">
            {inIframe && (
              <div className="p-3 bg-[#181818] border border-[#FFB800]/40 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-mono text-[11px] text-[#FFB800] font-bold uppercase flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Step 1: Open in a New Browser Tab
                  </div>
                  <p className="text-[#B0AEA6] leading-relaxed">
                    Browser security policies prevent browser extensions (like Lace) from injecting wallet providers into sandboxed <code className="font-mono bg-black px-1 text-white">&lt;iframe&gt;</code> elements.
                  </p>
                </div>
                <button
                  onClick={handleOpenNewTab}
                  id="wallet-modal-btn-new-tab"
                  className="px-3 py-2 bg-[#FFB800] text-black font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-yellow-400 whitespace-nowrap cursor-pointer flex-shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open App in New Tab
                </button>
              </div>
            )}

            <div className="p-3 bg-[#141414] border border-white/[0.08] flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-mono text-[11px] text-[#E8E6DF] font-bold uppercase flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-[#FF5A5F]" />
                  Step 2: Install Lace (Midnight) Extension & Set to Preview
                </div>
                <p className="text-[#8A8882] leading-relaxed">
                  Install Lace Midnight from the Chrome Web Store, create or restore a wallet, and switch network to <strong>Midnight Preview</strong>.
                </p>
              </div>
              <a
                href="https://docs.midnight.network/develop/tutorial/building/prereqs#midnight-lace-wallet"
                target="_blank"
                rel="noreferrer"
                id="wallet-modal-link-lace"
                className="px-3 py-2 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-[#E8E6DF] font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap cursor-pointer flex-shrink-0"
              >
                Install Lace Guide
              </a>
            </div>

            <div className="p-3 bg-[#141414] border border-white/[0.08] flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-mono text-[11px] text-[#E8E6DF] font-bold uppercase flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-[#00FF66]" />
                  Step 3: Fund Wallet via Midnight Preview Faucet
                </div>
                <p className="text-[#8A8882] leading-relaxed">
                  Request tNIGHT and DUST tokens for transaction fees before contract deployment or on-chain proofs.
                </p>
              </div>
              <a
                href="https://faucet.preview.midnight.network"
                target="_blank"
                rel="noreferrer"
                id="wallet-modal-link-faucet"
                className="px-3 py-2 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-[#E8E6DF] font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap cursor-pointer flex-shrink-0"
              >
                Open Faucet
              </a>
            </div>

            <div className="p-3 bg-[#141414] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[11px] text-[#E8E6DF] font-bold uppercase flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-[#8A8882]" />
                  Step 4: Run Locally (Recommended for Direct Extension Injection)
                </div>
                <button
                  onClick={handleCopyCmd}
                  id="wallet-modal-btn-copy-cmd"
                  className="px-2 py-1 text-[10px] font-mono border border-white/[0.1] text-[#8A8882] hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedCmd ? <Check className="w-3 h-3 text-[#00FF66]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd ? 'COPIED' : 'COPY COMMAND'}</span>
                </button>
              </div>
              <div className="bg-black/60 p-2 font-mono text-[11px] text-[#00FF66] border border-white/[0.04]">
                npm install && npm run dev
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/[0.08]">
          <button
            onClick={() => {
              onSwitchToDemo();
              onClose();
            }}
            id="wallet-modal-btn-switch-demo"
            className="w-full sm:w-auto px-4 py-2.5 bg-[#181818] hover:bg-[#222] border border-white/[0.12] text-[#8A8882] hover:text-[#E8E6DF] font-mono text-xs uppercase tracking-wider cursor-pointer"
          >
            Use Demo Sandbox Mode (Isolated)
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              id="wallet-modal-btn-dismiss"
              className="w-full sm:w-auto px-4 py-2.5 bg-transparent border border-white/[0.1] text-[#8A8882] hover:text-white font-mono text-xs uppercase tracking-wider cursor-pointer"
            >
              Dismiss
            </button>
            <button
              onClick={onConnectLive}
              disabled={wallet.isConnecting}
              id="wallet-modal-btn-retry"
              className="w-full sm:w-auto px-5 py-2.5 bg-[#E8E6DF] hover:bg-white text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {wallet.isConnecting ? 'Detecting...' : 'Retry Live Connection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
