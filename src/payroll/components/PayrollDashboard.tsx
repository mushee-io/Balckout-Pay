import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Sparkles,
  Layers,
  ChevronRight,
  FileText,
  AlertCircle
} from 'lucide-react';
import { PayrollBatch, PayrollExecutionResult } from '../types/payroll';
import { INITIAL_PAYROLL_BATCHES } from '../data/defaultPayroll';
import { PayrollOverview } from './PayrollOverview';
import { CreatePayroll } from './CreatePayroll';
import { PayrollReview } from './PayrollReview';
import { PayrollAuthorization } from './PayrollAuthorization';
import { PayrollExecution } from './PayrollExecution';
import { PayrollReceipt } from './PayrollReceipt';
import { PayrollHistory } from './PayrollHistory';
import { PayrollPrivacyPanel } from './PayrollPrivacyPanel';
import { VerifyIntegrationSection } from './VerifyIntegrationSection';

interface PayrollDashboardProps {
  onNavigateToVerify: () => void;
  walletMode: 'DEMO' | 'LIVE';
  onSwitchWalletMode: (mode: 'DEMO' | 'LIVE') => void;
}

type PayrollViewMode = 
  | 'OVERVIEW'
  | 'CREATE'
  | 'REVIEW'
  | 'AUTHORIZE'
  | 'EXECUTE'
  | 'RECEIPT';

export const PayrollDashboard: React.FC<PayrollDashboardProps> = ({
  onNavigateToVerify,
  walletMode,
  onSwitchWalletMode,
}) => {
  const [batches, setBatches] = useState<PayrollBatch[]>(INITIAL_PAYROLL_BATCHES);
  const [activeBatch, setActiveBatch] = useState<PayrollBatch | null>(INITIAL_PAYROLL_BATCHES[0]);
  const [viewMode, setViewMode] = useState<PayrollViewMode>('OVERVIEW');
  const [activeExecutionResult, setActiveExecutionResult] = useState<PayrollExecutionResult | null>(null);

  // Workflow Handlers
  const handleStartCreatePayroll = () => {
    setViewMode('CREATE');
  };

  const handleBatchCreated = (newBatch: PayrollBatch) => {
    setBatches([newBatch, ...batches]);
    setActiveBatch(newBatch);
    setViewMode('REVIEW');
  };

  const handleProceedToAuthorization = () => {
    setViewMode('AUTHORIZE');
  };

  const handleAuthorizeAndExecute = () => {
    setViewMode('EXECUTE');
  };

  const handleExecutionComplete = (result: PayrollExecutionResult) => {
    setActiveExecutionResult(result);
    if (activeBatch) {
      const updatedBatch: PayrollBatch = {
        ...activeBatch,
        status: 'CONFIRMED',
        executedAt: Date.now(),
        executionResult: result,
      };
      setBatches(batches.map(b => b.id === updatedBatch.id ? updatedBatch : b));
      setActiveBatch(updatedBatch);
    }
    setViewMode('RECEIPT');
  };

  const handleSelectHistoryBatch = (batch: PayrollBatch) => {
    setActiveBatch(batch);
    if (batch.executionResult) {
      setActiveExecutionResult(batch.executionResult);
      setViewMode('RECEIPT');
    } else {
      setViewMode('REVIEW');
    }
  };

  const handleNewPayroll = () => {
    setActiveBatch(null);
    setActiveExecutionResult(null);
    setViewMode('CREATE');
  };

  return (
    <div className="bg-[#090909] text-[#E8E6DF] min-h-screen text-left font-sans select-none pb-24">
      {/* 1. BLACK PAYROLL LANDING / HERO STATE */}
      <section className="border-b border-white/[0.08] bg-[#060606] relative overflow-hidden">
        {/* Subtle architectural grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16 relative z-10 space-y-6">
          {/* Eyebrow & Mode Pill */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-[#FF5A5F]"></span>
              <span className="text-[11px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">
                BLACKOUT / PAYROLL
              </span>
            </div>

            {/* Restrained Privacy Indicator */}
            <div className="flex items-center gap-3 font-mono text-[10px] tracking-wider uppercase">
              <span className="text-[#8A8882]">POWERED BY MIDNIGHT</span>
              <span className="text-white/20">|</span>
              <span className={`px-2 py-0.5 border ${
                walletMode === 'LIVE' 
                  ? 'border-[#26A17B] text-[#26A17B] bg-[#26A17B]/10' 
                  : 'border-[#FFB800] text-[#FFB800] bg-[#FFB800]/10'
              }`}>
                {walletMode === 'LIVE' ? 'LIVE ONCHAIN' : 'DEMO MODE'}
              </span>
            </div>
          </div>

          {/* Hero Typography */}
          <div className="space-y-4 max-w-4xl">
            <h1 className="text-4xl sm:text-7xl lg:text-8xl font-condensed font-extrabold uppercase text-[#E8E6DF] leading-[0.88] tracking-tight">
              MAKE PAYROLL PRIVATE.
            </h1>

            <p className="text-base sm:text-xl text-[#8A8882] font-normal max-w-2xl leading-relaxed">
              Compensation shouldn't become public data just because payroll moves onchain.
            </p>
          </div>

          {/* Product Thesis Bar */}
          <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center gap-6 font-mono text-xs text-[#8A8882]">
            <div className="flex items-center gap-2">
              <span className="text-[#E8E6DF] font-bold">BLACKOUT VERIFY:</span>
              <span>PROVE PRIVATELY.</span>
            </div>
            <span className="hidden sm:inline text-white/20">•</span>
            <div className="flex items-center gap-2">
              <span className="text-[#FF5A5F] font-bold">BLACK PAYROLL:</span>
              <span>PAY PRIVATELY.</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-10 space-y-16">
        
        {/* VIEW ROUTER FOR WORKFLOW MODES */}
        {viewMode === 'OVERVIEW' && (
          <div className="space-y-16">
            {/* Top Summary Area: Payroll Overview */}
            <PayrollOverview
              currentBatch={activeBatch}
              totalBatchesCount={batches.length}
              onOpenCreatePayroll={handleStartCreatePayroll}
              onSelectBatch={handleSelectHistoryBatch}
            />

            {/* Payroll History */}
            <PayrollHistory
              batches={batches}
              onSelectBatch={handleSelectHistoryBatch}
            />

            {/* Blackout Verify x Black Payroll Architecture Section */}
            <VerifyIntegrationSection
              onNavigateToVerify={onNavigateToVerify}
            />

            {/* Privacy Model Educational Panel */}
            <PayrollPrivacyPanel />
          </div>
        )}

        {viewMode === 'CREATE' && (
          <CreatePayroll
            onCancel={() => setViewMode('OVERVIEW')}
            onCompleteBatch={handleBatchCreated}
            initialBatch={activeBatch}
          />
        )}

        {viewMode === 'REVIEW' && activeBatch && (
          <PayrollReview
            batch={activeBatch}
            onBack={() => setViewMode('CREATE')}
            onProceedToAuthorization={handleProceedToAuthorization}
          />
        )}

        {viewMode === 'AUTHORIZE' && activeBatch && (
          <PayrollAuthorization
            batch={activeBatch}
            executionMode={walletMode}
            onBack={() => setViewMode('REVIEW')}
            onAuthorizeAndExecute={handleAuthorizeAndExecute}
          />
        )}

        {viewMode === 'EXECUTE' && activeBatch && (
          <PayrollExecution
            batch={activeBatch}
            executionMode={walletMode}
            onComplete={handleExecutionComplete}
            onCancel={() => setViewMode('OVERVIEW')}
            onSwitchMode={onSwitchWalletMode}
          />
        )}

        {viewMode === 'RECEIPT' && activeBatch && activeExecutionResult && (
          <PayrollReceipt
            batch={activeBatch}
            result={activeExecutionResult}
            onNewPayroll={handleNewPayroll}
            onBackToOverview={() => setViewMode('OVERVIEW')}
          />
        )}
      </div>
    </div>
  );
};
