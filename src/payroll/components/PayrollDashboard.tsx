import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileCheck2,
  KeyRound,
  Layers3,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Users,
  WalletCards,
} from 'lucide-react';
import { PayrollBatch, PayrollExecutionResult, PayrollRecipient } from '../types/payroll';
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

type PayrollRoom = 'OVERVIEW' | 'WORKSPACE' | 'EMPLOYEES' | 'PAY_RUNS' | 'PROOFS';

const ROOMS: Array<{
  id: PayrollRoom;
  label: string;
  caption: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'OVERVIEW', label: 'Overview', caption: 'Protocol status', icon: Layers3 },
  { id: 'WORKSPACE', label: 'Workspace', caption: 'Treasury control', icon: BriefcaseBusiness },
  { id: 'EMPLOYEES', label: 'Employees', caption: 'Private recipients', icon: Users },
  { id: 'PAY_RUNS', label: 'Pay Runs', caption: 'Create & settle', icon: WalletCards },
  { id: 'PROOFS', label: 'Proofs', caption: 'Private eligibility', icon: FileCheck2 },
];

function maskedAddress(address: string): string {
  if (!address) return 'NOT SET';
  if (address.length <= 18) return address;
  return `${address.slice(0, 10)}…${address.slice(-6)}`;
}

export const PayrollDashboard: React.FC<PayrollDashboardProps> = ({
  onNavigateToVerify,
  walletMode,
  onSwitchWalletMode,
}) => {
  const [batches, setBatches] = useState<PayrollBatch[]>(
    walletMode === 'DEMO' ? INITIAL_PAYROLL_BATCHES : [],
  );
  const [activeBatch, setActiveBatch] = useState<PayrollBatch | null>(
    walletMode === 'DEMO' ? INITIAL_PAYROLL_BATCHES[0] : null,
  );
  const [viewMode, setViewMode] = useState<PayrollViewMode>('OVERVIEW');
  const [activeRoom, setActiveRoom] = useState<PayrollRoom>('OVERVIEW');
  const [activeExecutionResult, setActiveExecutionResult] = useState<PayrollExecutionResult | null>(null);

  useEffect(() => {
    if (walletMode === 'LIVE') {
      setBatches((current) => current.filter((batch) => batch.mode === 'LIVE'));
      setActiveBatch((current) => current?.mode === 'LIVE' ? current : null);
      setActiveExecutionResult((current) => current?.mode === 'LIVE' ? current : null);
      return;
    }

    setBatches((current) => current.length > 0 ? current : INITIAL_PAYROLL_BATCHES);
    setActiveBatch((current) => current ?? INITIAL_PAYROLL_BATCHES[0]);
  }, [walletMode]);

  const employees = useMemo(() => {
    const unique = new Map<string, PayrollRecipient>();
    for (const batch of batches) {
      for (const recipient of batch.recipients) {
        unique.set(recipient.employeeId, recipient);
      }
    }
    return Array.from(unique.values());
  }, [batches]);

  const confirmedRuns = useMemo(
    () => batches.filter((batch) => batch.status === 'CONFIRMED').length,
    [batches],
  );

  const handleStartCreatePayroll = () => {
    setActiveRoom('PAY_RUNS');
    setViewMode('CREATE');
  };

  const handleBatchCreated = (newBatch: PayrollBatch) => {
    setBatches((current) => [newBatch, ...current]);
    setActiveBatch(newBatch);
    setActiveRoom('PAY_RUNS');
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
      setBatches((current) => current.map((batch) => batch.id === updatedBatch.id ? updatedBatch : batch));
      setActiveBatch(updatedBatch);
    }
    setActiveRoom('PAY_RUNS');
    setViewMode('RECEIPT');
  };

  const handleSelectHistoryBatch = (batch: PayrollBatch) => {
    setActiveBatch(batch);
    setActiveRoom('PAY_RUNS');
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
    setActiveRoom('PAY_RUNS');
    setViewMode('CREATE');
  };

  const openRoom = (room: PayrollRoom) => {
    setActiveRoom(room);
    setViewMode('OVERVIEW');
    setActiveExecutionResult(null);
  };

  const renderRoomNavigation = () => (
    <section className="border-y border-white/[0.08] bg-[#080808]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div className="space-y-1">
            <div className="text-[10px] font-mono tracking-[0.24em] text-[#FF5A5F] font-bold uppercase">
              [ BLACKOUT PAYROLL / ROOMS ]
            </div>
            <div className="text-xs font-mono text-[#8A8882] uppercase tracking-[0.12em]">
              One private payroll system. Dedicated operational workspaces.
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-white/[0.08] border border-white/[0.08] min-w-0 xl:min-w-[760px]">
            {ROOMS.map((room) => {
              const RoomIcon = room.icon;
              const isActive = activeRoom === room.id && viewMode === 'OVERVIEW';
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => openRoom(room.id)}
                  className={`min-h-[76px] px-4 py-3 text-left transition-colors cursor-pointer group ${
                    isActive
                      ? 'bg-[#E8E6DF] text-black'
                      : 'bg-[#0D0D0D] text-[#E8E6DF] hover:bg-[#141414]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <RoomIcon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-[#FF5A5F]'}`} />
                    <span className={`text-[9px] font-mono ${isActive ? 'text-black/50' : 'text-[#8A8882]'}`}>→</span>
                  </div>
                  <div className="mt-2 text-[11px] font-mono font-bold tracking-[0.08em] uppercase">{room.label}</div>
                  <div className={`mt-0.5 text-[9px] font-mono uppercase ${isActive ? 'text-black/55' : 'text-[#8A8882]'}`}>{room.caption}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );

  const renderOverviewRoom = () => (
    <div className="space-y-16">
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="text-[10px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">
              [ BLACKOUT PAYROLL / COMMAND INDEX ]
            </div>
            <h2 className="text-2xl sm:text-3xl font-condensed font-extrabold uppercase text-[#E8E6DF] tracking-wide mt-1">
              PAYROLL OPERATIONS
            </h2>
          </div>
          <button
            onClick={handleStartCreatePayroll}
            className="px-4 py-2 bg-[#E8E6DF] text-black hover:bg-white font-mono text-xs font-bold uppercase tracking-[0.16em] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            CREATE PAYROLL
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {ROOMS.filter((room) => room.id !== 'OVERVIEW').map((room, index) => {
            const RoomIcon = room.icon;
            const detail = room.id === 'WORKSPACE'
              ? `${walletMode} execution boundary`
              : room.id === 'EMPLOYEES'
              ? `${employees.length} recipient${employees.length === 1 ? '' : 's'} in current session`
              : room.id === 'PAY_RUNS'
              ? `${batches.length} run${batches.length === 1 ? '' : 's'} · ${confirmedRuns} confirmed`
              : 'Private eligibility and disclosure';

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => openRoom(room.id)}
                className="min-h-[210px] p-5 bg-[#0E0E0E] border border-white/[0.08] hover:border-[#FF5A5F]/60 text-left group transition-colors cursor-pointer flex flex-col"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#8A8882]">0{index + 1}</span>
                  <RoomIcon className="w-5 h-5 text-[#FF5A5F]" />
                </div>
                <div className="mt-auto">
                  <h3 className="text-2xl font-condensed font-extrabold uppercase tracking-wide text-[#E8E6DF]">{room.label}</h3>
                  <p className="mt-2 text-xs font-mono text-[#8A8882] leading-relaxed">{detail}</p>
                  <div className="mt-5 text-[10px] font-mono font-bold text-[#E8E6DF] tracking-[0.16em] uppercase group-hover:text-[#FF5A5F]">
                    OPEN ROOM →
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <PayrollOverview
        currentBatch={activeBatch}
        totalBatchesCount={batches.length}
        onOpenCreatePayroll={handleStartCreatePayroll}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-6 bg-[#0D0D0D] border border-white/[0.08]">
          <div className="text-[10px] font-mono tracking-[0.22em] text-[#FF5A5F] font-bold uppercase">[ PRIVATE STATE ]</div>
          <h3 className="mt-3 text-2xl font-condensed font-extrabold uppercase text-[#E8E6DF]">EMPLOYEE DATA STAYS PRIVATE</h3>
          <p className="mt-3 text-sm text-[#8A8882] leading-relaxed">Compensation, recipient details and private witness material remain outside public ledger state.</p>
        </div>
        <div className="p-6 bg-[#0D0D0D] border border-white/[0.08]">
          <div className="text-[10px] font-mono tracking-[0.22em] text-[#26A17B] font-bold uppercase">[ SETTLEMENT ]</div>
          <h3 className="mt-3 text-2xl font-condensed font-extrabold uppercase text-[#E8E6DF]">PAYROLL HAS ITS OWN WORKFLOW</h3>
          <p className="mt-3 text-sm text-[#8A8882] leading-relaxed">Use Pay Runs for creation, authorization, execution and private receipts. Use Proofs for eligibility checks.</p>
        </div>
      </div>
    </div>
  );

  const renderWorkspaceRoom = () => (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="text-[10px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">[ BLACKOUT PAYROLL / WORKSPACE ]</div>
          <h2 className="mt-2 text-3xl sm:text-5xl font-condensed font-extrabold uppercase text-[#E8E6DF] leading-none">TREASURY WORKSPACE</h2>
          <p className="mt-3 max-w-2xl text-sm text-[#8A8882] leading-relaxed">Control the execution boundary for payroll without mixing private compensation with Blackout's public verification state.</p>
        </div>
        <button
          onClick={() => onSwitchWalletMode(walletMode === 'LIVE' ? 'DEMO' : 'LIVE')}
          className="px-5 py-3 border border-white/[0.14] bg-[#0D0D0D] text-[#E8E6DF] hover:border-[#FF5A5F] font-mono text-[11px] font-bold uppercase tracking-[0.14em] cursor-pointer"
        >
          SWITCH TO {walletMode === 'LIVE' ? 'DEMO' : 'LIVE'} →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <article className="p-5 bg-[#0E0E0E] border border-white/[0.08] min-h-[170px] flex flex-col justify-between">
          <div className="flex items-center justify-between"><span className="text-[10px] font-mono text-[#8A8882]">EXECUTION MODE</span><WalletCards className="w-4 h-4 text-[#FF5A5F]" /></div>
          <div><strong className={`text-3xl font-condensed font-extrabold ${walletMode === 'LIVE' ? 'text-[#26A17B]' : 'text-[#FFB800]'}`}>{walletMode}</strong><p className="mt-1 text-[10px] font-mono text-[#8A8882]">{walletMode === 'LIVE' ? 'MIDNIGHT ON-CHAIN' : 'LOCAL SANDBOX'}</p></div>
        </article>
        <article className="p-5 bg-[#0E0E0E] border border-white/[0.08] min-h-[170px] flex flex-col justify-between">
          <div className="flex items-center justify-between"><span className="text-[10px] font-mono text-[#8A8882]">EMPLOYEES</span><Users className="w-4 h-4 text-[#FF5A5F]" /></div>
          <div><strong className="text-3xl font-condensed font-extrabold text-[#E8E6DF]">{employees.length}</strong><p className="mt-1 text-[10px] font-mono text-[#8A8882]">CURRENT SESSION</p></div>
        </article>
        <article className="p-5 bg-[#0E0E0E] border border-white/[0.08] min-h-[170px] flex flex-col justify-between">
          <div className="flex items-center justify-between"><span className="text-[10px] font-mono text-[#8A8882]">PAY RUNS</span><Layers3 className="w-4 h-4 text-[#FF5A5F]" /></div>
          <div><strong className="text-3xl font-condensed font-extrabold text-[#E8E6DF]">{batches.length}</strong><p className="mt-1 text-[10px] font-mono text-[#8A8882]">{confirmedRuns} CONFIRMED</p></div>
        </article>
        <article className="p-5 bg-[#0E0E0E] border border-white/[0.08] min-h-[170px] flex flex-col justify-between">
          <div className="flex items-center justify-between"><span className="text-[10px] font-mono text-[#8A8882]">PRIVACY BOUNDARY</span><LockKeyhole className="w-4 h-4 text-[#26A17B]" /></div>
          <div><strong className="text-xl font-condensed font-extrabold text-[#26A17B]">ACTIVE</strong><p className="mt-1 text-[10px] font-mono text-[#8A8882]">PRIVATE WITNESS / PUBLIC PROOF</p></div>
        </article>
      </div>

      <div className="p-6 sm:p-8 border border-white/[0.08] bg-[#0B0B0B] grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#26A17B] font-bold tracking-[0.18em] uppercase"><ShieldCheck className="w-4 h-4" /> WORKSPACE READY</div>
          <h3 className="mt-4 text-2xl sm:text-4xl font-condensed font-extrabold uppercase text-[#E8E6DF]">CREATE A PRIVATE PAY RUN FROM THIS WORKSPACE.</h3>
          <p className="mt-3 max-w-3xl text-sm text-[#8A8882] leading-relaxed">Employee recipients are created inside the payroll workflow. Exact compensation is kept in local private state and is not published as public payroll metadata.</p>
        </div>
        <button onClick={handleStartCreatePayroll} className="px-6 py-3 bg-[#E8E6DF] text-black hover:bg-white font-mono text-xs font-bold uppercase tracking-[0.16em] cursor-pointer flex items-center gap-2">
          CREATE PAYROLL <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderEmployeesRoom = () => (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="text-[10px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">[ BLACKOUT PAYROLL / EMPLOYEES ]</div>
          <h2 className="mt-2 text-3xl sm:text-5xl font-condensed font-extrabold uppercase text-[#E8E6DF] leading-none">PRIVATE EMPLOYEES</h2>
          <p className="mt-3 text-sm text-[#8A8882]">Recipients currently present in this payroll session.</p>
        </div>
        <button onClick={handleStartCreatePayroll} className="px-4 py-2 bg-[#E8E6DF] text-black font-mono text-xs font-bold uppercase tracking-[0.14em] cursor-pointer">+ ADD THROUGH PAYROLL</button>
      </div>

      {employees.length === 0 ? (
        <div className="min-h-[320px] border border-white/[0.08] bg-[#0B0B0B] flex flex-col items-center justify-center text-center p-8">
          <Users className="w-8 h-8 text-[#FF5A5F]" />
          <h3 className="mt-5 text-2xl font-condensed font-extrabold uppercase text-[#E8E6DF]">NO LIVE EMPLOYEES IN THIS SESSION</h3>
          <p className="mt-2 max-w-xl text-sm text-[#8A8882]">Create a payroll to add private recipients. Demo identities are never carried into LIVE mode.</p>
          <button onClick={handleStartCreatePayroll} className="mt-6 px-5 py-3 border border-[#FF5A5F] text-[#E8E6DF] font-mono text-[11px] font-bold uppercase tracking-[0.15em] cursor-pointer">CREATE FIRST PAYROLL →</button>
        </div>
      ) : (
        <div className="border border-white/[0.08] bg-[#0B0B0B] divide-y divide-white/[0.07]">
          <div className="hidden md:grid grid-cols-[1.2fr_1.2fr_1fr_.8fr] gap-4 px-5 py-3 text-[9px] font-mono uppercase tracking-[0.15em] text-[#8A8882]">
            <span>Employee</span><span>Private payout</span><span>Eligibility</span><span>Status</span>
          </div>
          {employees.map((employee) => (
            <div key={employee.employeeId} className="grid grid-cols-1 md:grid-cols-[1.2fr_1.2fr_1fr_.8fr] gap-3 md:gap-4 px-5 py-4 items-center">
              <div><strong className="text-sm text-[#E8E6DF]">{employee.label}</strong><small className="block mt-1 font-mono text-[10px] text-[#8A8882]">{employee.employeeId}</small></div>
              <span className="font-mono text-[10px] text-[#8A8882]">{maskedAddress(employee.walletAddress)}</span>
              <span className="font-mono text-[10px] text-[#26A17B]">{employee.eligibilityStatus ?? 'NOT REQUESTED'}</span>
              <span className="font-mono text-[10px] text-[#E8E6DF]">{employee.status}</span>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 border border-white/[0.06] bg-[#090909] flex items-start gap-3 text-[11px] font-mono text-[#8A8882] leading-relaxed">
        <KeyRound className="w-4 h-4 text-[#26A17B] shrink-0 mt-0.5" />
        <span><strong className="text-[#E8E6DF]">PRIVACY NOTE:</strong> the UI masks payout addresses here. Exact compensation and witness material remain private to the payroll execution boundary.</span>
      </div>
    </div>
  );

  const renderPayRunsRoom = () => (
    <div className="space-y-14">
      <PayrollOverview
        currentBatch={activeBatch}
        totalBatchesCount={batches.length}
        onOpenCreatePayroll={handleStartCreatePayroll}
      />
      <PayrollHistory batches={batches} onSelectBatch={handleSelectHistoryBatch} />
    </div>
  );

  const renderProofsRoom = () => (
    <div className="space-y-14">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="text-[10px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">[ BLACKOUT PAYROLL / PROOFS ]</div>
          <h2 className="mt-2 text-3xl sm:text-5xl font-condensed font-extrabold uppercase text-[#E8E6DF] leading-none">PROVE CONDITIONS. KEEP PAYROLL PRIVATE.</h2>
        </div>
        <button onClick={onNavigateToVerify} className="px-5 py-3 border border-[#FF5A5F] text-[#E8E6DF] hover:bg-[#FF5A5F] hover:text-black font-mono text-[11px] font-bold uppercase tracking-[0.14em] cursor-pointer">OPEN BLACKOUT VERIFY →</button>
      </div>
      <VerifyIntegrationSection onNavigateToVerify={onNavigateToVerify} />
      <PayrollPrivacyPanel />
    </div>
  );

  const renderActiveRoom = () => {
    if (activeRoom === 'WORKSPACE') return renderWorkspaceRoom();
    if (activeRoom === 'EMPLOYEES') return renderEmployeesRoom();
    if (activeRoom === 'PAY_RUNS') return renderPayRunsRoom();
    if (activeRoom === 'PROOFS') return renderProofsRoom();
    return renderOverviewRoom();
  };

  return (
    <div className="bg-[#090909] text-[#E8E6DF] min-h-screen text-left font-sans select-none pb-24">
      <section className="border-b border-white/[0.08] bg-[#060606] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16 relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-[#FF5A5F]"></span>
              <span className="text-[11px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">BLACKOUT / PAYROLL</span>
            </div>

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

          <div className="space-y-4 max-w-5xl">
            <div className="flex items-center gap-3 text-[10px] font-mono tracking-[0.22em] uppercase text-[#8A8882]">
              <span>[ NEW ]</span>
              <span className="text-white/20">/</span>
              <span>WORKSPACE · EMPLOYEES · PAY RUNS · PROOFS</span>
            </div>
            <h1 className="text-4xl sm:text-7xl lg:text-8xl font-condensed font-extrabold uppercase text-[#E8E6DF] leading-[0.88] tracking-tight">MAKE PAYROLL PRIVATE.</h1>
            <p className="text-base sm:text-xl text-[#8A8882] font-normal max-w-2xl leading-relaxed">Compensation shouldn't become public data just because payroll moves onchain.</p>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center gap-6 font-mono text-xs text-[#8A8882]">
            <div className="flex items-center gap-2"><span className="text-[#E8E6DF] font-bold">BLACKOUT VERIFY:</span><span>PROVE PRIVATELY.</span></div>
            <span className="hidden sm:inline text-white/20">•</span>
            <div className="flex items-center gap-2"><span className="text-[#FF5A5F] font-bold">BLACKOUT PAYROLL:</span><span>PAY PRIVATELY.</span></div>
          </div>
        </div>
      </section>

      {renderRoomNavigation()}

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-10 space-y-16">
        {viewMode === 'OVERVIEW' && renderActiveRoom()}

        {viewMode === 'CREATE' && (
          <CreatePayroll onCancel={() => setViewMode('OVERVIEW')} onCompleteBatch={handleBatchCreated} initialBatch={activeBatch} />
        )}

        {viewMode === 'REVIEW' && activeBatch && (
          <PayrollReview batch={activeBatch} onBack={() => setViewMode('CREATE')} onProceedToAuthorization={handleProceedToAuthorization} />
        )}

        {viewMode === 'AUTHORIZE' && activeBatch && (
          <PayrollAuthorization batch={activeBatch} executionMode={walletMode} onBack={() => setViewMode('REVIEW')} onAuthorizeAndExecute={handleAuthorizeAndExecute} />
        )}

        {viewMode === 'EXECUTE' && activeBatch && (
          <PayrollExecution batch={activeBatch} executionMode={walletMode} onComplete={handleExecutionComplete} onCancel={() => setViewMode('OVERVIEW')} onSwitchMode={onSwitchWalletMode} />
        )}

        {viewMode === 'RECEIPT' && activeBatch && activeExecutionResult && (
          <PayrollReceipt batch={activeBatch} result={activeExecutionResult} onNewPayroll={handleNewPayroll} onBackToOverview={() => setViewMode('OVERVIEW')} />
        )}

        {viewMode !== 'OVERVIEW' && (
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A8882]">
            <span>BLACKOUT PAYROLL / {viewMode}</span>
            <button onClick={() => setViewMode('OVERVIEW')} className="text-[#E8E6DF] hover:text-[#FF5A5F] cursor-pointer">[ RETURN TO PAYROLL ROOMS ]</button>
          </div>
        )}
      </div>
    </div>
  );
};
