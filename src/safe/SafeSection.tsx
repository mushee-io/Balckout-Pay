import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  FileKey2,
  KeyRound,
  ReceiptText,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { WalletState } from '../midnight/types';
import {
  approveProposal,
  bootstrapSafe,
  connectSafeWallet,
  createTransferProposal,
  deployBootstrap,
  depositShielded,
  executeTransfer,
  proveQuorum,
  runReceiptCircuit,
  type BootstrapResult,
  type PublicSafeRecord,
  type SerializedPolicyOpening,
  type SerializedProposalBundle,
  type SerializedSafeSignerKit,
  type TxResultView,
  type WalletView,
} from './runtime.ts';

type SafeView = 'overview' | 'treasury' | 'proposals' | 'signers' | 'policies' | 'receipts' | 'security';
type Notice = { type: 'success' | 'error'; message: string } | null;
type RecoveryExports = { policy: boolean; signer1: boolean; signer2: boolean };

interface SafeSectionProps {
  wallet: WalletState;
  onConnectLive: () => Promise<void> | void;
}

const PUBLIC_SAFE_KEY = 'blackout:safe:public-record:v1';
const PREVIEW_TEST_ASSET_COLOR = '0x1c071ef4927e580b290e7784249a40d833eb6cc834c6f8b9ea55d54b81a52369';

const safeViews: Array<{ id: SafeView; label: string }> = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'treasury', label: 'TREASURY' },
  { id: 'proposals', label: 'PROPOSALS' },
  { id: 'signers', label: 'SIGNERS' },
  { id: 'policies', label: 'POLICIES' },
  { id: 'receipts', label: 'RECEIPTS' },
  { id: 'security', label: 'SECURITY' },
];

const capabilityCards = [
  ['PRIVATE TREASURY', 'Shielded organizational balances and treasury execution on Midnight.', WalletCards],
  ['ANONYMOUS QUORUM', 'Authorized signers prove quorum without exposing the signer set.', UsersRound],
  ['POLICY PROOFS', 'Threshold, limits and delays remain bound to committed policy.', KeyRound],
  ['AUDIT RECEIPTS', 'Generate selective proof-backed receipts without leaking treasury secrets.', ReceiptText],
] as const;

function loadPublicSafe(): PublicSafeRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PUBLIC_SAFE_KEY);
    return raw ? JSON.parse(raw) as PublicSafeRecord : null;
  } catch {
    return null;
  }
}

function short(value?: string | null, left = 10, right = 6): string {
  if (!value) return '—';
  return value.length <= left + right + 3 ? value : `${value.slice(0, left)}…${value.slice(-right)}`;
}

function parseJson<T>(value: string, label: string): T {
  if (!value.trim()) throw new Error(`${label}_REQUIRED`);
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`${label}_INVALID_JSON`);
  }
}

function errorMessage(error: unknown): string {
  const raw = error instanceof Error && error.message ? error.message : 'BLACKOUT_SAFE_UNKNOWN_ERROR';
  if (raw.includes('BLACKOUT_SAFE_POLICY_OPENING_REQUIRED')) return 'POLICY OPENING IS NOT LOADED. OPEN POLICIES AND PASTE THE EXPORTED BLACKOUT SAFE POLICY JSON.';
  if (raw.includes('BLACKOUT_SAFE_SIGNER_KIT_REQUIRED')) return 'SIGNER KIT IS NOT LOADED. OPEN SIGNERS AND LOAD ONE OF THE EXPORTED SIGNER KITS.';
  if (raw.includes('BLACKOUT_SAFE_PROPOSAL_BUNDLE_REQUIRED')) return 'CREATE OR LOAD A PRIVATE PROPOSAL BEFORE CONTINUING.';
  if (raw.includes('BLACKOUT_SAFE_HELD_COIN_REQUIRED')) return 'A REAL HELD-COIN OPENING IS REQUIRED BEFORE EXECUTION. THE PLACEHOLDER COIN CANNOT BE USED.';
  if (raw.includes('BLACKOUT_SAFE_RECOVERY_LOCKED')) return 'FUNDING LOCKED: EXPORT POLICY OPENING, EXPORT SIGNER 1, EXPORT SIGNER 2, THEN ACKNOWLEDGE THE RECOVERY CHECKLIST.';
  return raw;
}

function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function isHex32(value: string): boolean {
  return /^0x[0-9a-f]{64}$/i.test(value.trim());
}

function heldCoinLooksReal(value: string): boolean {
  try {
    const parsed = JSON.parse(value) as { nonce?: unknown; color?: unknown; value?: unknown; mt_index?: unknown };
    if (typeof parsed.nonce !== 'string' || !isHex32(parsed.nonce)) return false;
    if (typeof parsed.color !== 'string' || !isHex32(parsed.color)) return false;
    if (BigInt(String(parsed.value ?? '0')) <= 0n) return false;
    if (BigInt(String(parsed.mt_index ?? '-1')) < 0n) return false;
    return true;
  } catch {
    return false;
  }
}

const Surface: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <section className={`border border-white/[0.1] bg-[#0B0B0B] ${className}`}>{children}</section>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`w-full bg-[#070707] border border-white/[0.12] px-3 py-3 font-mono text-xs text-[#E8E6DF] outline-none focus:border-[#FF5A5F]/70 ${props.className ?? ''}`} />
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className={`w-full min-h-32 bg-[#070707] border border-white/[0.12] px-3 py-3 font-mono text-[10px] leading-relaxed text-[#E8E6DF] outline-none focus:border-[#FF5A5F]/70 ${props.className ?? ''}`} />
);

const Label: React.FC<React.PropsWithChildren> = ({ children }) => (
  <label className="block text-[9px] mb-2 font-mono tracking-[0.15em] uppercase text-[#8A8882]">{children}</label>
);

const ActionButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, disabled, className = '', ...props }) => (
  <button
    {...props}
    disabled={disabled}
    className={`inline-flex items-center justify-center gap-2 px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${disabled ? 'bg-white/[0.04] text-[#666] border border-white/[0.08] cursor-not-allowed' : 'bg-[#E8E6DF] text-black hover:bg-white cursor-pointer'} ${className}`}
  >
    {children}
  </button>
);

export const SafeHomeSection: React.FC<{ onOpenSafe: () => void }> = ({ onOpenSafe }) => (
  <section className="border-t border-white/[0.08] bg-[#070707] px-4 sm:px-8 lg:px-12 py-16 sm:py-20">
    <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
      <div className="lg:col-span-8 border border-[#FF5A5F]/45 bg-[#0D0D0D] p-7 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#FF5A5F]" />
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.22em] text-[#8A8882] mb-8">
          <span className="text-[#FF5A5F] font-bold">[ BLACKOUT ECOSYSTEM ]</span><span>/</span><span>MIDNIGHT PREVIEW</span>
          <span className="ml-auto px-2 py-1 border border-[#26A17B]/40 bg-[#26A17B]/10 text-[#26A17B] font-bold">SAFE</span>
        </div>
        <h2 className="font-condensed font-extrabold uppercase leading-[0.9] tracking-tight text-[clamp(3rem,7vw,6.4rem)] text-[#E8E6DF]">BLACKOUT<br />SAFE.</h2>
        <p className="mt-7 max-w-2xl text-sm sm:text-base leading-relaxed text-[#8A8882]">Private organizational treasury, anonymous quorum, shielded execution and selective audit receipts — inside the same Blackout product.</p>
        <button onClick={onOpenSafe} className="mt-8 inline-flex items-center gap-3 px-6 py-3.5 bg-[#E8E6DF] text-black font-mono text-xs font-bold tracking-[0.16em] uppercase hover:bg-white cursor-pointer">OPEN SAFE <ArrowRight className="w-4 h-4" /></button>
      </div>
      <div className="lg:col-span-4 border border-white/[0.1] bg-[#0B0B0B] p-7 sm:p-8 flex flex-col justify-between">
        <div><div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#FF5A5F] mb-5">[ CORE PROMISE ]</div><p className="font-condensed text-3xl sm:text-4xl uppercase font-extrabold leading-[0.95]">PROVE THE TREASURY ACTION IS AUTHORIZED.</p><p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[#8A8882]">REVEAL NOTHING ELSE THAT DOES NOT NEED TO BE REVEALED.</p></div>
        <div className="mt-10 grid grid-cols-2 gap-px bg-white/[0.08] border border-white/[0.08]">{['SHIELDED', 'QUORUM ZK', 'NO MASTER KEY', 'SELECTIVE AUDIT'].map((item) => <div key={item} className="bg-[#090909] px-3 py-4 text-[9px] font-mono tracking-[0.16em] text-[#8A8882] uppercase">{item}</div>)}</div>
      </div>
    </div>
  </section>
);

export const SafeSection: React.FC<SafeSectionProps> = ({ wallet, onConnectLive }) => {
  const [view, setView] = useState<SafeView>('overview');
  const [safeWallet, setSafeWallet] = useState<WalletView | null>(null);
  const [safe, setSafe] = useState<PublicSafeRecord | null>(loadPublicSafe);
  const [bootstrap, setBootstrap] = useState<BootstrapResult | null>(null);
  const [activity, setActivity] = useState<Array<TxResultView & { label: string }>>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [recoveryExports, setRecoveryExports] = useState<RecoveryExports>({ policy: false, signer1: false, signer2: false });
  const [recoveryAcknowledged, setRecoveryAcknowledged] = useState(false);

  const [memberCount, setMemberCount] = useState('3');
  const [threshold, setThreshold] = useState('2');
  const [policyMode, setPolicyMode] = useState<'STANDARD' | 'PRIVATE_POLICY'>('STANDARD');
  const [maxTransfer, setMaxTransfer] = useState('1000000');
  const [proposalLifetime, setProposalLifetime] = useState('3600');
  const [executionDelay, setExecutionDelay] = useState('0');
  const [assetColor, setAssetColor] = useState(PREVIEW_TEST_ASSET_COLOR);
  const [depositAmount, setDepositAmount] = useState('100000');
  const [recipient, setRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('100000');
  const [signerKitText, setSignerKitText] = useState('');
  const [policyOpeningText, setPolicyOpeningText] = useState('');
  const [proposalBundleText, setProposalBundleText] = useState('');
  const [heldCoinText, setHeldCoinText] = useState(`{\n  "nonce": "",\n  "color": "${PREVIEW_TEST_ASSET_COLOR}",\n  "value": "",\n  "mt_index": ""\n}`);
  const [receiptMode, setReceiptMode] = useState<'receipt_quorum_authorized' | 'receipt_executed_exactly_once' | 'receipt_disclose_amount' | 'receipt_disclose_recipient'>('receipt_quorum_authorized');

  const recoveryReady = Boolean(bootstrap && recoveryExports.policy && recoveryExports.signer1 && recoveryExports.signer2 && recoveryAcknowledged);
  const approvalsRecorded = activity.filter((item) => item.label === 'APPROVE').length;
  const quorumReached = activity.some((item) => item.label === 'PROVE QUORUM');
  const canCreateProposal = Boolean(safe && signerKitText.trim() && policyOpeningText.trim() && isHex32(recipient) && isHex32(assetColor));
  const canApprove = Boolean(safe && signerKitText.trim() && proposalBundleText.trim());
  const canProveQuorum = Boolean(safe && policyOpeningText.trim() && proposalBundleText.trim() && approvalsRecorded >= Number(safe?.publicQuorum ?? threshold));
  const canExecute = Boolean(safe && policyOpeningText.trim() && proposalBundleText.trim() && quorumReached && heldCoinLooksReal(heldCoinText));

  const addActivity = (label: string, tx: TxResultView) => setActivity((items) => [{ ...tx, label }, ...items].slice(0, 20));

  const run = async (name: string, operation: () => Promise<void>) => {
    if (busy) return;
    setBusy(name);
    setNotice(null);
    try {
      await operation();
      setNotice({ type: 'success', message: `${name.toUpperCase()} COMPLETE — REAL PREVIEW EVIDENCE RECEIVED` });
    } catch (error) {
      setNotice({ type: 'error', message: errorMessage(error) });
    } finally {
      setBusy(null);
    }
  };

  const connect = () => run('wallet connection', async () => {
    if (!(wallet.isConnected && wallet.mode === 'LIVE')) await Promise.resolve(onConnectLive());
    const connected = await connectSafeWallet();
    setSafeWallet(connected);
  });

  const createAndDeploy = () => run('safe deployment', async () => {
    const members = Number(memberCount);
    if (!Number.isInteger(members) || members < 2) throw new Error('BLACKOUT_SAFE_REQUIRES_AT_LEAST_2_MEMBERS');
    if (!(wallet.isConnected && wallet.mode === 'LIVE')) await Promise.resolve(onConnectLive());
    const connected = await connectSafeWallet();
    setSafeWallet(connected);
    setRecoveryExports({ policy: false, signer1: false, signer2: false });
    setRecoveryAcknowledged(false);
    setActivity([]);

    const prepared = bootstrapSafe({
      memberCount: members,
      mode: policyMode,
      threshold: BigInt(threshold),
      maxTransferAmount: BigInt(maxTransfer),
      maxProposalLifetime: BigInt(proposalLifetime),
      minExecutionDelay: BigInt(executionDelay),
    });
    setBootstrap(prepared);
    setPolicyOpeningText(JSON.stringify(prepared.policyOpening, null, 2));
    setSignerKitText(JSON.stringify(prepared.membership.kits[0], null, 2));
    const deployed = await deployBootstrap(prepared);
    setSafe(deployed);
    window.localStorage.setItem(PUBLIC_SAFE_KEY, JSON.stringify(deployed));
    addActivity('DEPLOY SAFE', { txId: deployed.deploymentTxId, blockHeight: deployed.deploymentBlockHeight, circuitId: 'deploy' });
  });

  const exportPolicy = () => {
    if (!bootstrap) {
      setNotice({ type: 'error', message: 'THIS BROWSER SESSION DOES NOT HOLD THE PRIVATE POLICY OPENING. DO NOT FUND THIS SAFE.' });
      return;
    }
    downloadJson('blackout-safe-policy-opening.json', bootstrap.policyOpening);
    setRecoveryExports((current) => ({ ...current, policy: true }));
  };

  const exportSigner = (index: number) => {
    const kit = bootstrap?.membership.kits[index];
    if (!kit) {
      setNotice({ type: 'error', message: `SIGNER ${index + 1} IS NOT AVAILABLE IN THIS BROWSER SESSION. DO NOT FUND THIS SAFE.` });
      return;
    }
    downloadJson(`blackout-safe-signer-${index + 1}.json`, kit);
    if (index === 0) setRecoveryExports((current) => ({ ...current, signer1: true }));
    if (index === 1) setRecoveryExports((current) => ({ ...current, signer2: true }));
  };

  const deposit = () => run('shielded deposit', async () => {
    if (!safe) throw new Error('BLACKOUT_SAFE_DEPLOY_SAFE_FIRST');
    if (!recoveryReady) throw new Error('BLACKOUT_SAFE_RECOVERY_LOCKED');
    const tx = await depositShielded(safe, assetColor as `0x${string}`, BigInt(depositAmount));
    addActivity('DEPOSIT', tx);
  });

  const createProposal = () => run('proposal creation', async () => {
    if (!safe) throw new Error('BLACKOUT_SAFE_DEPLOY_SAFE_FIRST');
    if (!signerKitText.trim()) throw new Error('BLACKOUT_SAFE_SIGNER_KIT_REQUIRED');
    if (!policyOpeningText.trim()) throw new Error('BLACKOUT_SAFE_POLICY_OPENING_REQUIRED');
    if (!isHex32(recipient)) throw new Error('BLACKOUT_SAFE_RECIPIENT_COIN_PUBLIC_KEY_MUST_BE_32_BYTE_HEX');
    const signerKit = parseJson<SerializedSafeSignerKit>(signerKitText, 'BLACKOUT_SAFE_SIGNER_KIT');
    const policyOpening = parseJson<SerializedPolicyOpening>(policyOpeningText, 'BLACKOUT_SAFE_POLICY_OPENING');
    const result = await createTransferProposal({
      safe,
      signerKit,
      policyOpening,
      asset: assetColor as `0x${string}`,
      recipientCoinPublicKey: recipient as `0x${string}`,
      amount: BigInt(transferAmount),
      lifetimeSeconds: BigInt(proposalLifetime),
    });
    setProposalBundleText(JSON.stringify(result.proposalBundle, null, 2));
    addActivity('CREATE PROPOSAL', result.tx);
  });

  const approve = () => run('anonymous approval', async () => {
    if (!safe) throw new Error('BLACKOUT_SAFE_DEPLOY_SAFE_FIRST');
    if (!signerKitText.trim()) throw new Error('BLACKOUT_SAFE_SIGNER_KIT_REQUIRED');
    if (!proposalBundleText.trim()) throw new Error('BLACKOUT_SAFE_PROPOSAL_BUNDLE_REQUIRED');
    const tx = await approveProposal({
      safe,
      signerKit: parseJson<SerializedSafeSignerKit>(signerKitText, 'BLACKOUT_SAFE_SIGNER_KIT'),
      proposalBundle: parseJson<SerializedProposalBundle>(proposalBundleText, 'BLACKOUT_SAFE_PROPOSAL_BUNDLE'),
    });
    addActivity('APPROVE', tx);
  });

  const quorum = () => run('quorum proof', async () => {
    if (!safe) throw new Error('BLACKOUT_SAFE_DEPLOY_SAFE_FIRST');
    if (!policyOpeningText.trim()) throw new Error('BLACKOUT_SAFE_POLICY_OPENING_REQUIRED');
    if (!proposalBundleText.trim()) throw new Error('BLACKOUT_SAFE_PROPOSAL_BUNDLE_REQUIRED');
    const bundle = parseJson<SerializedProposalBundle>(proposalBundleText, 'BLACKOUT_SAFE_PROPOSAL_BUNDLE');
    const tx = await proveQuorum({
      safe,
      policyOpening: parseJson<SerializedPolicyOpening>(policyOpeningText, 'BLACKOUT_SAFE_POLICY_OPENING'),
      proposalCommitment: bundle.proposalCommitment,
    });
    addActivity('PROVE QUORUM', tx);
  });

  const execute = () => run('shielded execution', async () => {
    if (!safe) throw new Error('BLACKOUT_SAFE_DEPLOY_SAFE_FIRST');
    if (!policyOpeningText.trim()) throw new Error('BLACKOUT_SAFE_POLICY_OPENING_REQUIRED');
    if (!proposalBundleText.trim()) throw new Error('BLACKOUT_SAFE_PROPOSAL_BUNDLE_REQUIRED');
    if (!heldCoinLooksReal(heldCoinText)) throw new Error('BLACKOUT_SAFE_HELD_COIN_REQUIRED');
    const tx = await executeTransfer({
      safe,
      policyOpening: parseJson<SerializedPolicyOpening>(policyOpeningText, 'BLACKOUT_SAFE_POLICY_OPENING'),
      proposalBundle: parseJson<SerializedProposalBundle>(proposalBundleText, 'BLACKOUT_SAFE_PROPOSAL_BUNDLE'),
      heldCoin: parseJson<{ nonce: `0x${string}`; color: `0x${string}`; value: string; mt_index: string }>(heldCoinText, 'BLACKOUT_SAFE_HELD_COIN'),
    });
    addActivity('EXECUTE', tx);
  });

  const receipt = () => run('receipt proof', async () => {
    if (!safe) throw new Error('BLACKOUT_SAFE_DEPLOY_SAFE_FIRST');
    if (!proposalBundleText.trim()) throw new Error('BLACKOUT_SAFE_PROPOSAL_BUNDLE_REQUIRED');
    const bundle = parseJson<SerializedProposalBundle>(proposalBundleText, 'BLACKOUT_SAFE_PROPOSAL_BUNDLE');
    const tx = await runReceiptCircuit({
      safe,
      circuitId: receiptMode,
      proposalCommitment: bundle.proposalCommitment,
      policyOpening: receiptMode === 'receipt_quorum_authorized'
        ? parseJson<SerializedPolicyOpening>(policyOpeningText, 'BLACKOUT_SAFE_POLICY_OPENING')
        : undefined,
      proposalBundle: receiptMode === 'receipt_quorum_authorized' ? undefined : bundle,
    });
    addActivity('RECEIPT', tx);
  });

  const completion = useMemo(() => [
    ['CONNECT PREVIEW WALLET', Boolean(safeWallet)],
    ['DEPLOY REAL SAFE CONTRACT', Boolean(safe)],
    ['SAVE RECOVERY KIT', recoveryReady],
    ['DEPOSIT SHIELDED TEST ASSET', activity.some((item) => item.label === 'DEPOSIT')],
    ['REACH QUORUM', activity.some((item) => item.label === 'PROVE QUORUM')],
    ['EXECUTE SHIELDED TRANSFER', activity.some((item) => item.label === 'EXECUTE')],
    ['GENERATE BLACKOUT RECEIPT', activity.some((item) => item.label === 'RECEIPT')],
  ] as Array<[string, boolean]>, [safeWallet, safe, recoveryReady, activity]);

  const recoveryPanel = (
    <Surface className={`p-6 ${recoveryReady ? 'border-[#26A17B]/45' : 'border-[#FF5A5F]/45'}`}>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
        <div>
          <div className={`text-[10px] font-mono tracking-[0.2em] uppercase ${recoveryReady ? 'text-[#26A17B]' : 'text-[#FF5A5F]'}`}>[ RECOVERY LOCK ]</div>
          <h3 className="mt-3 font-condensed text-3xl font-extrabold uppercase">{recoveryReady ? 'FUNDING UNLOCKED' : 'SAVE PRIVATE RECOVERY MATERIAL FIRST'}</h3>
          <p className="mt-3 max-w-3xl text-xs leading-relaxed text-[#8A8882]">SAFE never stores signer secrets or the private policy opening in localStorage. Funding stays locked until the current browser session has exported the policy opening and the first two signer kits, then you explicitly confirm that those files are stored safely.</p>
          {safe && !bootstrap && <div className="mt-4 border border-[#FF5A5F]/40 bg-[#FF5A5F]/5 p-4 font-mono text-[10px] leading-relaxed text-[#FF5A5F]">THIS SAFE WAS RESTORED FROM ITS PUBLIC RECORD, BUT ITS PRIVATE RECOVERY MATERIAL IS NOT IN THIS SESSION. DO NOT ADD MORE FUNDS. IF YOU PREVIOUSLY EXPORTED THE JSON FILES, LOAD THEM IN SIGNERS / POLICIES TO CONTINUE OPERATING THE SAFE.</div>}
        </div>
        <div className={`shrink-0 px-3 py-2 border font-mono text-[10px] font-bold tracking-[0.16em] ${recoveryReady ? 'border-[#26A17B]/50 text-[#26A17B]' : 'border-[#FF5A5F]/50 text-[#FF5A5F]'}`}>{recoveryReady ? 'RECOVERY READY' : 'FUNDING LOCKED'}</div>
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          ['POLICY OPENING', recoveryExports.policy],
          ['SIGNER 1', recoveryExports.signer1],
          ['SIGNER 2', recoveryExports.signer2],
          ['ACKNOWLEDGED', recoveryAcknowledged],
        ].map(([label, done]) => <div key={String(label)} className="border border-white/[0.08] bg-[#090909] p-4"><div className="text-[9px] font-mono text-[#8A8882]">{label}</div><div className={`mt-2 text-xs font-mono font-bold ${done ? 'text-[#26A17B]' : 'text-[#FF5A5F]'}`}>{done ? 'SAVED' : 'REQUIRED'}</div></div>)}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <ActionButton onClick={exportPolicy} disabled={!bootstrap || Boolean(busy)}>EXPORT POLICY OPENING</ActionButton>
        <ActionButton onClick={() => exportSigner(0)} disabled={!bootstrap?.membership.kits[0] || Boolean(busy)}>EXPORT SIGNER 1</ActionButton>
        <ActionButton onClick={() => exportSigner(1)} disabled={!bootstrap?.membership.kits[1] || Boolean(busy)}>EXPORT SIGNER 2</ActionButton>
      </div>
      <label className={`mt-5 flex items-start gap-3 border p-4 font-mono text-[10px] leading-relaxed ${recoveryExports.policy && recoveryExports.signer1 && recoveryExports.signer2 ? 'border-white/[0.12] cursor-pointer' : 'border-white/[0.06] text-[#666]'}`}>
        <input type="checkbox" className="mt-0.5" checked={recoveryAcknowledged} disabled={!(recoveryExports.policy && recoveryExports.signer1 && recoveryExports.signer2)} onChange={(event) => setRecoveryAcknowledged(event.target.checked)} />
        I HAVE SAVED THE POLICY OPENING, SIGNER 1 AND SIGNER 2 PRIVATE JSON FILES OUTSIDE THIS BROWSER SESSION. I UNDERSTAND THAT LOSING THEM CAN MAKE A FUNDED SAFE INOPERABLE.
      </label>
    </Surface>
  );

  const sharedJsonInputs = (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <div><Label>SIGNER KIT</Label><TextArea value={signerKitText} onChange={(e) => setSignerKitText(e.target.value)} placeholder="Paste BLACKOUT_SAFE_SIGNER_KIT_V1 JSON" /></div>
      <div><Label>POLICY OPENING</Label><TextArea value={policyOpeningText} onChange={(e) => setPolicyOpeningText(e.target.value)} placeholder="Paste BLACKOUT_SAFE_POLICY_OPENING_V1 JSON" /></div>
    </div>
  );

  const renderWorkspace = () => {
    if (view === 'overview') return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <Surface className="xl:col-span-8 p-7 sm:p-8 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#FF5A5F]" />
            <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#FF5A5F]">[ REAL PREVIEW CONTROL PLANE ]</div>
            <h2 className="mt-4 font-condensed text-4xl sm:text-6xl font-extrabold uppercase leading-[0.9]">PRIVATE TREASURY.<br />REAL TRANSACTIONS.</h2>
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 border-l border-t border-white/[0.08]">
              {[
                ['WALLET', safeWallet ? safeWallet.walletName : 'DISCONNECTED'],
                ['SAFE', safe ? short(safe.contractAddress) : 'NOT DEPLOYED'],
                ['QUORUM', safe?.publicQuorum ?? (safe?.policyMode === 'PRIVATE_POLICY' ? 'PRIVATE' : 'UNSET')],
              ].map(([label, value]) => <div key={label} className="border-r border-b border-white/[0.08] p-4"><div className="text-[9px] font-mono text-[#8A8882]">{label}</div><div className="mt-2 text-xs font-mono font-bold break-all">{value}</div></div>)}
            </div>
            <div className="mt-7 flex flex-wrap gap-3"><ActionButton onClick={connect} disabled={Boolean(busy)}>{safeWallet ? 'REFRESH WALLET' : 'CONNECT MIDNIGHT WALLET'} <WalletCards className="w-4 h-4" /></ActionButton></div>
          </Surface>

          <Surface className="xl:col-span-4 p-6">
            <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#FF5A5F]">[ TESTNET COMPLETION ]</div>
            <div className="mt-5 border-t border-white/[0.08]">{completion.map(([label, done]) => <div key={label} className="flex items-center justify-between gap-3 py-3 border-b border-white/[0.08] text-[9px] font-mono uppercase tracking-[0.1em]"><span className="text-[#8A8882]">{label}</span><span className={done ? 'text-[#26A17B]' : 'text-[#666]'}>{done ? 'PASS' : 'PENDING'}</span></div>)}</div>
          </Surface>
        </div>

        {safe && recoveryPanel}

        <Surface className="p-7 sm:p-8">
          <div className="flex items-center justify-between"><div><div className="text-[10px] font-mono text-[#FF5A5F] tracking-[0.2em]">[ CREATE + DEPLOY ]</div><h3 className="mt-3 font-condensed text-3xl font-extrabold uppercase">NEW BLACKOUT SAFE</h3></div><ShieldCheck className="w-5 h-5 text-[#FF5A5F]" /></div>
          {safe && <div className="mt-5 border border-[#FFB800]/30 bg-[#FFB800]/5 p-4 text-[10px] font-mono text-[#FFB800]">DEPLOYING ANOTHER SAFE REPLACES ONLY THE LOCAL PUBLIC POINTER. IT DOES NOT DESTROY OR RECOVER THE EXISTING SAFE.</div>}
          <div className="mt-7 grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div><Label>MEMBERS</Label><Input value={memberCount} onChange={(e) => setMemberCount(e.target.value)} inputMode="numeric" /></div>
            <div><Label>THRESHOLD</Label><Input value={threshold} onChange={(e) => setThreshold(e.target.value)} inputMode="numeric" /></div>
            <div><Label>MAX TRANSFER</Label><Input value={maxTransfer} onChange={(e) => setMaxTransfer(e.target.value)} /></div>
            <div><Label>PROPOSAL TTL SEC</Label><Input value={proposalLifetime} onChange={(e) => setProposalLifetime(e.target.value)} /></div>
            <div><Label>EXECUTION DELAY</Label><Input value={executionDelay} onChange={(e) => setExecutionDelay(e.target.value)} /></div>
            <div><Label>POLICY MODE</Label><select value={policyMode} onChange={(e) => setPolicyMode(e.target.value as 'STANDARD' | 'PRIVATE_POLICY')} className="w-full bg-[#070707] border border-white/[0.12] px-3 py-3 font-mono text-xs"><option value="STANDARD">STANDARD</option><option value="PRIVATE_POLICY">PRIVATE</option></select></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3"><ActionButton onClick={createAndDeploy} disabled={Boolean(busy)}>{safeWallet ? 'CREATE + DEPLOY ON PREVIEW' : 'CONNECT + CREATE SAFE ON PREVIEW'}</ActionButton>{safe && <span className="self-center text-[10px] font-mono text-[#26A17B]">TX {short(safe.deploymentTxId)}</span>}</div>
        </Surface>
      </div>
    );

    if (view === 'treasury') return (
      <div className="space-y-6">
        {safe && recoveryPanel}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Surface className="p-7">
            <div className="text-[10px] font-mono text-[#FF5A5F]">[ DEPOSIT SHIELDED ]</div>
            <h2 className="mt-3 font-condensed text-4xl font-extrabold uppercase">FUND SAFE</h2>
            <div className="mt-6 space-y-4">
              <div><Label>ASSET COLOR</Label><Input value={assetColor} onChange={(e) => setAssetColor(e.target.value)} /></div>
              <div><Label>BASE UNITS</Label><Input value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} /></div>
              {!recoveryReady && <div className="border border-[#FF5A5F]/35 bg-[#FF5A5F]/5 p-3 text-[9px] font-mono text-[#FF5A5F]">FUNDING DISABLED UNTIL THE RECOVERY LOCK ABOVE IS COMPLETE.</div>}
              <ActionButton onClick={deposit} disabled={!safe || !safeWallet || !recoveryReady || Boolean(busy)}>{recoveryReady ? 'DEPOSIT REAL ASSET' : 'SAVE RECOVERY KIT BEFORE FUNDING'}</ActionButton>
            </div>
          </Surface>

          <Surface className="p-7">
            <div className="text-[10px] font-mono text-[#FF5A5F]">[ EXECUTE SHIELDED ]</div>
            <h2 className="mt-3 font-condensed text-4xl font-extrabold uppercase">EXECUTE APPROVED TRANSFER</h2>
            <div className="mt-6">
              <Label>HELD COIN OPENING</Label>
              <TextArea value={heldCoinText} onChange={(e) => setHeldCoinText(e.target.value)} />
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[9px]">
                <div className={`border p-3 ${proposalBundleText ? 'border-[#26A17B]/30 text-[#26A17B]' : 'border-white/[0.08] text-[#666]'}`}>PROPOSAL {proposalBundleText ? 'READY' : 'REQUIRED'}</div>
                <div className={`border p-3 ${quorumReached ? 'border-[#26A17B]/30 text-[#26A17B]' : 'border-white/[0.08] text-[#666]'}`}>QUORUM {quorumReached ? 'READY' : 'REQUIRED'}</div>
                <div className={`border p-3 ${heldCoinLooksReal(heldCoinText) ? 'border-[#26A17B]/30 text-[#26A17B]' : 'border-white/[0.08] text-[#666]'}`}>HELD COIN {heldCoinLooksReal(heldCoinText) ? 'READY' : 'REQUIRED'}</div>
              </div>
              <p className="mt-3 text-[9px] font-mono text-[#8A8882]">REAL HELD-COIN OPENING REQUIRED. THE UI NO LONGER PROVIDES A FABRICATED NONCE PLACEHOLDER.</p>
              <ActionButton onClick={execute} disabled={!canExecute || Boolean(busy)} className="mt-4">{canExecute ? 'EXECUTE TRANSFER' : 'COMPLETE PROPOSAL + QUORUM + HELD COIN FIRST'}</ActionButton>
            </div>
          </Surface>
        </div>
      </div>
    );

    if (view === 'proposals') return (
      <div className="space-y-6">
        <Surface className="p-7">
          <div className="text-[10px] font-mono text-[#FF5A5F]">[ PRIVATE TRANSFER PROPOSAL ]</div>
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div><Label>RECIPIENT COIN PUBLIC KEY</Label><Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x + 64 hex characters" /></div>
            <div><Label>AMOUNT</Label><Input value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} /></div>
            <div><Label>ASSET COLOR</Label><Input value={assetColor} onChange={(e) => setAssetColor(e.target.value)} /></div>
          </div>
          <div className="mt-5">{sharedJsonInputs}</div>
          <div className="mt-5 flex flex-wrap gap-3">
            <ActionButton onClick={createProposal} disabled={!canCreateProposal || Boolean(busy)}>CREATE PROPOSAL</ActionButton>
            <ActionButton onClick={approve} disabled={!canApprove || Boolean(busy)}>APPROVE AS CURRENT SIGNER</ActionButton>
            <ActionButton onClick={quorum} disabled={!canProveQuorum || Boolean(busy)}>PROVE QUORUM</ActionButton>
          </div>
          <div className="mt-4 text-[9px] font-mono text-[#8A8882]">CURRENT SESSION APPROVAL EVIDENCE: {approvalsRecorded} / {safe?.publicQuorum ?? threshold}. EACH APPROVAL MUST USE A DIFFERENT SIGNER KIT; DUPLICATES ARE REJECTED ON-CHAIN.</div>
        </Surface>

        <Surface className="p-7"><div className="flex justify-between items-center"><div className="text-[10px] font-mono text-[#FF5A5F]">[ PROPOSAL BUNDLE ]</div>{proposalBundleText && <button onClick={() => downloadJson('blackout-safe-proposal.json', parseJson(proposalBundleText, 'PROPOSAL'))} className="text-[9px] font-mono text-[#E8E6DF] underline">EXPORT</button>}</div><TextArea className="mt-4 min-h-52" value={proposalBundleText} onChange={(e) => setProposalBundleText(e.target.value)} placeholder="Generated proposal bundle appears here. It stays local unless you explicitly export it." /></Surface>
      </div>
    );

    if (view === 'signers') return (
      <div className="space-y-6">
        <Surface className="p-7">
          <div className="text-[10px] font-mono text-[#FF5A5F]">[ ANONYMOUS SIGNERS ]</div>
          <h2 className="mt-3 font-condensed text-4xl font-extrabold uppercase">MEMBER KITS STAY PRIVATE</h2>
          <p className="mt-4 text-xs text-[#8A8882] max-w-3xl">Signer kits are never written to localStorage. Export them before funding. To approve a proposal, load a different signer kit for each approval.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {bootstrap?.membership.kits.map((kit, index) => <div key={index} className="flex gap-2"><button onClick={() => setSignerKitText(JSON.stringify(kit, null, 2))} className="px-4 py-3 border border-white/[0.14] font-mono text-[10px] uppercase hover:border-[#FF5A5F]">USE SIGNER {index + 1}</button><button onClick={() => exportSigner(index)} className="px-4 py-3 border border-white/[0.14] font-mono text-[10px] uppercase hover:border-[#26A17B]">EXPORT</button></div>) ?? <span className="text-[10px] font-mono text-[#8A8882]">NO PRIVATE KITS IN THIS SESSION. PASTE AN EXPORTED KIT BELOW IF YOU SAVED ONE EARLIER.</span>}
          </div>
        </Surface>
        <Surface className="p-7"><Label>CURRENT SIGNER KIT</Label><TextArea className="min-h-64" value={signerKitText} onChange={(e) => setSignerKitText(e.target.value)} placeholder="Paste an exported blackout-safe-signer-N.json file here" /></Surface>
      </div>
    );

    if (view === 'policies') return (
      <div className="space-y-6">
        <Surface className="p-7">
          <div className="flex items-center justify-between"><div><div className="text-[10px] font-mono text-[#FF5A5F]">[ COMMITTED POLICY ]</div><h2 className="mt-3 font-condensed text-4xl font-extrabold uppercase">QUORUM + LIMITS</h2></div><FileKey2 className="w-5 h-5 text-[#FF5A5F]" /></div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.08]">{[['MODE', safe?.policyMode ?? '—'], ['QUORUM', safe?.publicQuorum ?? (safe ? 'PRIVATE' : '—')], ['VERSION', safe?.policyVersion ?? '—'], ['COMMITMENT', short(safe?.policyCommitment)]].map(([label, value]) => <div key={label} className="bg-[#090909] p-4"><div className="text-[9px] font-mono text-[#8A8882]">{label}</div><div className="mt-2 text-xs font-mono break-all">{value}</div></div>)}</div>
        </Surface>
        <Surface className="p-7"><div className="flex justify-between gap-4"><Label>POLICY OPENING</Label>{bootstrap && <button onClick={exportPolicy} className="text-[9px] font-mono underline">EXPORT POLICY</button>}</div><TextArea className="min-h-64" value={policyOpeningText} onChange={(e) => setPolicyOpeningText(e.target.value)} placeholder="Paste blackout-safe-policy-opening.json here" /></Surface>
      </div>
    );

    if (view === 'receipts') return (
      <Surface className="p-7"><div className="flex items-center justify-between"><div><div className="text-[10px] font-mono text-[#FF5A5F]">[ SELECTIVE AUDIT ]</div><h2 className="mt-3 font-condensed text-4xl font-extrabold uppercase">BLACKOUT RECEIPT</h2></div><ReceiptText className="w-5 h-5 text-[#FF5A5F]" /></div><div className="mt-6 max-w-xl"><Label>STATEMENT</Label><select value={receiptMode} onChange={(e) => setReceiptMode(e.target.value as typeof receiptMode)} className="w-full bg-[#070707] border border-white/[0.12] px-3 py-3 font-mono text-xs"><option value="receipt_quorum_authorized">QUORUM AUTHORIZED</option><option value="receipt_executed_exactly_once">EXECUTED EXACTLY ONCE</option><option value="receipt_disclose_amount">DISCLOSE AMOUNT</option><option value="receipt_disclose_recipient">DISCLOSE RECIPIENT</option></select><ActionButton onClick={receipt} disabled={!safe || !proposalBundleText || Boolean(busy)} className="mt-4">GENERATE REAL RECEIPT</ActionButton></div></Surface>
    );

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Surface className="p-7"><div className="text-[10px] font-mono text-[#FF5A5F]">[ FAIL-CLOSED SECURITY ]</div><h2 className="mt-3 font-condensed text-4xl font-extrabold uppercase">NO FAKE LIVE PATH</h2><div className="mt-6 space-y-3 text-xs text-[#8A8882]">{['Midnight Preview is required.', 'Private signer kits and policy openings are never persisted by SAFE.', 'Funding is blocked until recovery material has been exported and acknowledged.', 'Execution is disabled until a proposal, quorum proof and real held coin opening exist.', 'Duplicate approvals and execution replay are rejected by the Compact contract.', 'There is no unilateral master withdrawal key.'].map((line) => <div key={line} className="flex gap-3 border-b border-white/[0.08] pb-3"><ShieldCheck className="w-4 h-4 text-[#26A17B] shrink-0" />{line}</div>)}</div></Surface>
        <Surface className="p-7"><div className="text-[10px] font-mono text-[#FF5A5F]">[ PUBLIC SAFE RECORD ]</div><pre className="mt-5 whitespace-pre-wrap break-all text-[9px] leading-relaxed text-[#8A8882]">{safe ? JSON.stringify(safe, null, 2) : 'NO SAFE DEPLOYED'}</pre></Surface>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#090909] text-[#E8E6DF]">
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 pt-10 pb-8 border-b border-white/[0.08]">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6"><div><div className="flex items-center gap-3 text-[10px] font-mono tracking-[0.2em] uppercase text-[#8A8882]"><span className="w-2 h-2 bg-[#FF5A5F]" />BLACKOUT SAFE / MIDNIGHT PREVIEW</div><h1 className="mt-5 font-condensed font-extrabold uppercase tracking-tight leading-[0.86] text-[clamp(3.6rem,8vw,7rem)]">PRIVATE TREASURY.<br /><span className="text-stroke-bone">PROVABLE CONTROL.</span></h1></div><div className="font-mono text-[10px] uppercase text-right"><div className="text-[#8A8882]">CONTRACT</div><div className={safe ? 'text-[#26A17B]' : 'text-[#FFB800]'}>{safe ? short(safe.contractAddress) : 'NOT DEPLOYED'}</div></div></div>
        <div className="mt-9 flex gap-2 overflow-x-auto border-t border-white/[0.08] pt-4">{safeViews.map((item) => <button key={item.id} onClick={() => setView(item.id)} className={`px-3 py-2 font-mono text-[10px] tracking-[0.15em] uppercase whitespace-nowrap border ${view === item.id ? 'bg-[#E8E6DF] text-black border-[#E8E6DF]' : 'text-[#8A8882] border-white/[0.1] hover:text-white'}`}>{item.label}</button>)}</div>
      </section>

      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-10">{notice && <div className={`mb-6 border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.08em] ${notice.type === 'error' ? 'border-[#FF5A5F]/50 text-[#FF5A5F] bg-[#FF5A5F]/5' : 'border-[#26A17B]/40 text-[#26A17B] bg-[#26A17B]/5'}`}>{notice.message}</div>}{renderWorkspace()}</section>

      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 pb-14"><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 border-l border-t border-white/[0.08]">{capabilityCards.map(([label, copy, Icon], index) => <div key={label} className="border-r border-b border-white/[0.08] bg-[#0B0B0B] p-5 min-h-44"><div className="flex justify-between"><span className="text-[9px] font-mono text-[#8A8882]">0{index + 1}</span><Icon className="w-4 h-4 text-[#FF5A5F]" /></div><h3 className="mt-7 font-condensed text-2xl font-extrabold uppercase">{label}</h3><p className="mt-2 text-[11px] text-[#8A8882]">{copy}</p></div>)}</div></section>

      {activity.length > 0 && <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 pb-16"><Surface className="p-6"><div className="flex items-center gap-2 text-[10px] font-mono text-[#FF5A5F]"><Activity className="w-4 h-4" /> [ REAL PREVIEW ACTIVITY ]</div><div className="mt-4 border-t border-white/[0.08]">{activity.map((item, index) => <div key={`${item.txId}-${index}`} className="grid grid-cols-[130px_1fr_auto] gap-3 py-3 border-b border-white/[0.08] text-[9px] font-mono"><span>{item.label}</span><span className="text-[#8A8882] break-all">{item.txId}</span><span className="text-[#26A17B]">BLOCK {item.blockHeight}</span></div>)}</div></Surface></section>}
    </div>
  );
};