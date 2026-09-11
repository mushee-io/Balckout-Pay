import React, { useState, useEffect } from 'react';
import { Homepage } from './components/Homepage';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { RequestView } from './components/RequestView';
import { DevelopersView } from './components/DevelopersView';
import { VerifierView } from './components/VerifierView';

import { CreateCredentialModal } from './components/CreateCredentialModal';
import { CreateRequestModal } from './components/CreateRequestModal';
import { ProofGenerationModal } from './components/ProofGenerationModal';
import { InteractiveDemoModal } from './components/InteractiveDemoModal';
import { PrivacyAuditor } from './components/PrivacyAuditor';
import { DeveloperDrawer } from './components/DeveloperDrawer';
import { TestSuiteModal } from './components/TestSuiteModal';
import { WalletModal } from './components/WalletModal';
import { ContractDeploymentModal } from './components/ContractDeploymentModal';

import {
  ExecutionMode,
  PrivateIncomeCredential,
  VerificationRequest,
  WalletState,
  ZkProofResult
} from './midnight/types';
import {
  connectLiveLaceWallet,
  connectDemoWallet,
  DEFAULT_WALLET_STATE,
} from './midnight/wallet-connector';
import { compactLedger } from './midnight/compact-verifier';
import { computeCommitment, generateSecureSalt } from './midnight/zk-engine';
import {
  mergePublicLiveEvidence,
  persistPublicLiveEvidence,
} from './midnight/evidence-store';
import { PayrollDashboard } from './payroll/components/PayrollDashboard';
import { PayrollHomeSection } from './payroll/components/PayrollHomeSection';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    if (['prove', 'request', 'developers', 'verify', 'payroll'].includes(hash)) {
      return hash;
    }
    if (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('payroll')) {
      return 'payroll';
    }
    return 'home';
  });

  const [wallet, setWallet] = useState<WalletState>({ ...DEFAULT_WALLET_STATE });
  const [walletError, setWalletError] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState(false);

  const [credential, setCredential] = useState<PrivateIncomeCredential | null>(null);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequestForVerifier, setSelectedRequestForVerifier] = useState<VerificationRequest | null>(null);
  const [selectedRequestForProof, setSelectedRequestForProof] = useState<VerificationRequest | null>(null);

  const [isCreateCredentialOpen, setIsCreateCredentialOpen] = useState(false);
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isAuditorOpen, setIsAuditorOpen] = useState(false);
  const [isDevDrawerOpen, setIsDevDrawerOpen] = useState(false);
  const [isTestsOpen, setIsTestsOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.location.search.includes('action=deploy') || window.location.hash.includes('deploy');
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
      if (['prove', 'request', 'developers', 'verify', 'payroll'].includes(hash)) {
        setActiveTab(hash);
      } else if (hash === 'home' || hash === '' || hash === '/') {
        setActiveTab('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigateTab = (tab: string) => {
    setActiveTab(tab);
    window.location.hash = tab === 'home' ? '/' : `/${tab}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!wallet.isConnected || wallet.mode !== 'DEMO' || credential) return;

    let cancelled = false;
    async function initDefaultDemoCredential() {
      const salt = generateSecureSalt();
      const commitment = await computeCommitment(4720, 'GBP', salt);
      if (cancelled) return;
      setCredential({
        id: 'cred_alex_primary_01',
        monthlyIncome: 4720,
        currency: 'GBP',
        age: 26,
        country: 'United Kingdom',
        employmentStatus: 'EMPLOYED',
        bankBalance: 38400,
        kycStatus: 'VERIFIED',
        accreditedInvestor: true,
        salt,
        commitment,
        issuedAt: Date.now() - 86400000 * 3,
        issuer: 'Self-Asserted (Demo / Wave 1)',
        label: 'Alex — Primary Monthly Net Income',
        status: 'READY',
        isDemo: true,
      });
    }
    initDefaultDemoCredential();
    return () => { cancelled = true; };
  }, [wallet.isConnected, wallet.mode, credential]);

  const handleConnectWallet = async (mode: ExecutionMode = 'LIVE') => {
    setWallet((prev) => ({ ...prev, isConnecting: true }));
    setWalletError(null);
    try {
      setCredential(null);
      setSelectedRequestForProof(null);
      setSelectedRequestForVerifier(null);

      if (mode === 'LIVE') {
        const state = await connectLiveLaceWallet(wallet.network);
        setWallet(state);
        const indexed = await compactLedger.syncLiveLedger();
        setRequests(mergePublicLiveEvidence(indexed));
      } else {
        const state = await connectDemoWallet(wallet.network);
        setWallet(state);
        setRequests(compactLedger.getRequests('DEMO'));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect wallet';
      setWalletError(msg);
      setWallet((prev) => ({ ...prev, isConnecting: false, error: msg }));
      if (mode === 'LIVE') setIsWalletModalOpen(true);
    }
  };

  const handleProofSuccess = (proof: ZkProofResult) => {
    const updated = compactLedger.recordProofResult(proof.requestId, proof, wallet.mode);
    if (wallet.mode === 'LIVE') {
      persistPublicLiveEvidence(updated);
      setRequests(mergePublicLiveEvidence(compactLedger.getRequests('LIVE')));
    } else {
      setRequests(compactLedger.getRequests('DEMO'));
    }
    if (selectedRequestForVerifier?.id === proof.requestId) {
      setSelectedRequestForVerifier(updated);
    }
  };

  const handleStartProof = (req: VerificationRequest) => {
    setSelectedRequestForProof(req);
    setIsProofModalOpen(true);
  };

  const handleViewVerifierResult = (req: VerificationRequest) => {
    setSelectedRequestForVerifier(req);
    handleNavigateTab('verify');
  };

  const handleCreateRequest = async (reqData: Omit<VerificationRequest, 'id' | 'createdAt' | 'status'>) => {
    const created = await compactLedger.registerRequest(reqData, wallet.mode);
    if (wallet.mode === 'LIVE') {
      persistPublicLiveEvidence(created);
      setRequests(mergePublicLiveEvidence(compactLedger.getRequests('LIVE')));
    } else {
      setRequests(compactLedger.getRequests('DEMO'));
    }
  };

  const handleApplyDemoState = async (demoCred: PrivateIncomeCredential, proof: ZkProofResult) => {
    const demoWallet = await connectDemoWallet(wallet.network);
    setWallet(demoWallet);
    setCredential(demoCred);
    const updated = compactLedger.recordProofResult(proof.requestId, proof, 'DEMO');
    setRequests(compactLedger.getRequests('DEMO'));
    setSelectedRequestForVerifier(updated);
  };

  return (
    <div className="min-h-screen bg-[#090909] text-[#E8E6DF] flex flex-col font-sans selection:bg-[#FF5A5F] selection:text-black">
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleNavigateTab}
        wallet={wallet}
        onConnectWallet={handleConnectWallet}
        privacyMode={privacyMode}
        onTogglePrivacyMode={() => setPrivacyMode((value) => !value)}
        onOpenDemo={() => setIsDemoOpen(true)}
        onOpenDevDrawer={() => setIsDevDrawerOpen(true)}
        onOpenAuditor={() => setIsAuditorOpen(true)}
        onOpenTests={() => setIsTestsOpen(true)}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
      />

      <main className="flex-1">
        {activeTab === 'home' && (
          <>
            <Homepage
              requests={requests}
              onNavigate={handleNavigateTab}
              onOpenDemo={() => setIsDemoOpen(true)}
              onOpenDevDrawer={() => setIsDevDrawerOpen(true)}
              onOpenAuditor={() => setIsAuditorOpen(true)}
              onOpenTests={() => setIsTestsOpen(true)}
            />
            <PayrollHomeSection onOpenPayroll={() => handleNavigateTab('payroll')} />
          </>
        )}

        {activeTab === 'prove' && (
          <Dashboard
            credential={credential}
            requests={requests}
            onNavigateToTab={handleNavigateTab}
            onOpenCreateCredential={() => setIsCreateCredentialOpen(true)}
            onOpenCreateRequest={() => setIsCreateRequestOpen(true)}
            onStartProof={handleStartProof}
            onViewVerifierResult={handleViewVerifierResult}
          />
        )}

        {activeTab === 'request' && (
          <RequestView
            requests={requests}
            onOpenCreateRequest={() => setIsCreateRequestOpen(true)}
            onSelectRequestToView={handleViewVerifierResult}
            onSelectRequestToProve={handleStartProof}
          />
        )}

        {activeTab === 'developers' && <DevelopersView />}

        {activeTab === 'verify' && (
          <VerifierView
            request={selectedRequestForVerifier || requests[0]}
            onBack={() => handleNavigateTab('prove')}
            allRequests={requests}
          />
        )}

        {activeTab === 'payroll' && (
          <PayrollDashboard
            onNavigateToVerify={() => handleNavigateTab('prove')}
            walletMode={wallet.mode}
            onSwitchWalletMode={(mode) => handleConnectWallet(mode)}
          />
        )}
      </main>

      <footer className="border-t border-white/[0.08] bg-[#060606] text-left font-sans">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 pt-16 pb-12 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end border-b border-white/[0.08] pb-12">
            <div className="lg:col-span-8 space-y-2">
              <div className="text-[10px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">
                [ PROTOCOL PHILOSOPHY ]
              </div>
              <h2 className="text-4xl sm:text-7xl font-condensed font-extrabold uppercase text-[#E8E6DF] leading-[0.88]">
                PROVE YOU QUALIFY. REVEAL NOTHING ELSE.
              </h2>
            </div>
            <div className="lg:col-span-4 text-xs font-mono text-[#8A8882] space-y-2">
              <p>
                Blackout provides private eligibility infrastructure built on Midnight Network. Mathematically proves conditions in zero-knowledge with zero raw data disclosure.
              </p>
              <div className="text-[10px] text-[#FF5A5F] font-bold">
                MIDNIGHT BUILDATHON WAVE 1 // INCOME ELIGIBILITY
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 font-mono text-xs text-[#8A8882]">
            <div className="flex flex-wrap items-center gap-6">
              <button onClick={() => setIsDevDrawerOpen(true)} className="hover:text-[#E8E6DF] uppercase transition-colors cursor-pointer">
                [ COMPACT CONTRACT ]
              </button>
              <button onClick={() => setIsAuditorOpen(true)} className="hover:text-[#E8E6DF] uppercase transition-colors cursor-pointer">
                [ PRIVACY TELEMETRY ]
              </button>
              <button onClick={() => setIsTestsOpen(true)} className="hover:text-[#E8E6DF] uppercase transition-colors cursor-pointer">
                [ TEST SUITE ]
              </button>
              {wallet.mode !== 'LIVE' && (
                <button onClick={() => setIsDemoOpen(true)} className="text-[#FF5A5F] hover:underline uppercase font-bold cursor-pointer">
                  [ 30S INTERACTIVE DEMO ]
                </button>
              )}
            </div>

            <div className="text-[11px] text-[#8A8882]/80">
              © {new Date().getFullYear()} BLACKOUT PROTOCOL. PRIVATE ELIGIBILITY ON MIDNIGHT.
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] py-3 bg-[#040404] overflow-hidden text-[10px] font-mono tracking-[0.25em] text-[#8A8882]/60 uppercase whitespace-nowrap">
          <div className="inline-block">
            BLACKOUT PROTOCOL · MIDNIGHT COMPACT DSL · ZERO-KNOWLEDGE SNARK PROOFS · 0 BYTES SALARY EXPOSURE · DUAL-STATE ARCHITECTURE · PRIVATE ELIGIBILITY INFRASTRUCTURE
          </div>
        </div>
      </footer>

      {isProofModalOpen && selectedRequestForProof && (
        <ProofGenerationModal
          isOpen={isProofModalOpen}
          request={selectedRequestForProof}
          credential={credential}
          wallet={wallet}
          onClose={() => setIsProofModalOpen(false)}
          onProofSuccess={handleProofSuccess}
          onOpenCreateCredential={() => {
            setIsProofModalOpen(false);
            setIsCreateCredentialOpen(true);
          }}
        />
      )}

      {isCreateCredentialOpen && (
        <CreateCredentialModal
          isOpen={isCreateCredentialOpen}
          onClose={() => setIsCreateCredentialOpen(false)}
          onSaveCredential={setCredential}
          initialCredential={credential}
          mode={wallet.mode}
        />
      )}

      {isCreateRequestOpen && (
        <CreateRequestModal
          isOpen={isCreateRequestOpen}
          onClose={() => setIsCreateRequestOpen(false)}
          onCreateRequest={handleCreateRequest}
        />
      )}

      {isDemoOpen && (
        <InteractiveDemoModal
          isOpen={isDemoOpen}
          onClose={() => setIsDemoOpen(false)}
          onApplyDemoState={handleApplyDemoState}
        />
      )}

      {isAuditorOpen && (
        <PrivacyAuditor
          isOpen={isAuditorOpen}
          credential={credential}
          requests={requests}
          onClose={() => setIsAuditorOpen(false)}
        />
      )}

      {isDevDrawerOpen && (
        <DeveloperDrawer isOpen={isDevDrawerOpen} onClose={() => setIsDevDrawerOpen(false)} />
      )}

      {isTestsOpen && (
        <TestSuiteModal isOpen={isTestsOpen} onClose={() => setIsTestsOpen(false)} />
      )}

      {isWalletModalOpen && (
        <WalletModal
          isOpen={isWalletModalOpen}
          onClose={() => setIsWalletModalOpen(false)}
          wallet={wallet}
          onConnectLive={() => handleConnectWallet('LIVE')}
          onSwitchToDemo={() => handleConnectWallet('DEMO')}
          errorMessage={walletError}
        />
      )}

      {isDeployModalOpen && (
        <ContractDeploymentModal
          isOpen={isDeployModalOpen}
          onClose={() => setIsDeployModalOpen(false)}
          onDeploymentComplete={() => {
            handleConnectWallet('LIVE');
          }}
        />
      )}
    </div>
  );
}
