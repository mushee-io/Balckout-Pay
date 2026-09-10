import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  FileCode, 
  ExternalLink,
  Shield,
  Layers,
  Lock,
  ArrowRight,
  Code2,
  Sparkles
} from 'lucide-react';
import { DEPLOYED_CONTRACT_ADDRESS } from '../midnight/zk-engine';

export const DevelopersView: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'COMPACT' | 'SDK_PREVIEW' | 'PAYROLL_SDK' | 'ARCHITECTURE'>('COMPACT');

  const compactContractCode = `// ============================================================================
// BLACKOUT — MIDNIGHT NETWORK COMPACT SMART CONTRACT
// Language: Compact (Midnight Network ZK Smart Contract DSL)
// Pragma: Midnight Compact v0.20+
//
// Purpose: Privacy-preserving income threshold verification.
// Wave: Wave 1 (Active)
// ============================================================================

pragma language_version >= 0.20.0;

import CompactStandardLibrary;

// Public ledger state record (Stored on Midnight Network)
export struct VerificationRecord {
    request_id: Bytes<32>;
    required_income: Uint<64>;
    is_verified: Boolean;
    timestamp: Uint<64>;
    verifier_pk: Bytes<32>;
    commitment: Bytes<32>;
}

// Public ledger storage
export ledger records: Map<Bytes<32>, VerificationRecord>;
export ledger total_verifications: Counter;

// Private witness definitions (Executed strictly off-chain inside client RAM)
witness get_private_monthly_income(): Uint<64>;
witness get_private_income_salt(): Bytes<32>;

// ZK Circuit: Proves income threshold without revealing underlying income
export circuit prove_income_threshold(
    request_id: Bytes<32>,
    required_income: Uint<64>,
    verifier_pk: Bytes<32>,
    timestamp: Uint<64>
): Boolean {
    // 1. Fetch private witness state directly inside the zero-knowledge circuit
    const private_income: Uint<64> = get_private_monthly_income();
    const private_salt: Bytes<32> = get_private_income_salt();

    // 2. Cryptographic commitment calculation (Poseidon hash of private witness)
    const computed_commitment: Bytes<32> = poseidon_hash_2(
        private_income as Field, 
        private_salt as Field
    );

    // 3. Evaluate the private threshold constraint in Zero-Knowledge
    const is_satisfied: Boolean = private_income >= required_income;

    // 4. Update ledger state atomically with ONLY the public verification result
    records.insert(request_id, VerificationRecord {
        request_id: request_id,
        required_income: required_income,
        is_verified: is_satisfied,
        timestamp: timestamp,
        verifier_pk: verifier_pk,
        commitment: computed_commitment
    });

    total_verifications.increment(1);

    // 5. Return boolean verification outcome
    // Notice: private_income NEVER appears in public ledger, state, or return value!
    return is_satisfied;
}`;

  const sdkPreviewCode = `// ============================================================================
// BLACKOUT PROTOCOL SDK — [ WAVE 3 PREVIEW ]
// Developer preview of the embeddable verification API planned for Wave 3.
// ============================================================================

import { BlackoutClient } from '@blackout/protocol-sdk'; // Wave 3 Preview

// Initialize client with Midnight Network provider
const blackout = new BlackoutClient({
  network: 'midnight-testnet-02',
  contractAddress: ${DEPLOYED_CONTRACT_ADDRESS ? `'${DEPLOYED_CONTRACT_ADDRESS}'` : "process.env.MIDNIGHT_CONTRACT_ADDRESS /* unset until deployment */"}
});

// 1. Verifier Application creates a request
const request = await blackout.createVerificationRequest({
  purpose: 'Rental Affordability',
  requiredIncome: 2500, // Monthly income in GBP
  currency: 'GBP',
  verifierName: 'Apex Residential Lettings'
});

// 2. Prover synthesizes ZK proof in client witness memory
const proofResult = await blackout.proveEligibility({
  requestId: request.id,
  credential: userWitnessCredential,
  onProgress: (stage, percent) => {
    console.log(\`[MIDNIGHT PROVER] \${stage} (\${percent}%)\`);
  }
});

// 3. Verifier verifies boolean receipt on Midnight Ledger
const verification = await blackout.verifyProof(proofResult);

console.log(verification.isSatisfied); // true (PASS)
console.log(verification.privateIncomeDisclosed); // "0 BYTES"`;

  const payrollSdkCode = `// ============================================================================
// BLACK PAYROLL PROTOCOL SDK — [ SDK PREVIEW ]
// Privacy-preserving on-chain compensation & batch payroll.
// Status: Specification Preview (Wave 2/3 Roadmap — Non-Production)
// ============================================================================

import { BlackoutPayroll } from '@blackout/payroll-sdk'; // SDK Preview

const payroll = new BlackoutPayroll({
  network: 'midnight-testnet-02',
  executionMode: 'DEMO' // 'DEMO' | 'LIVE'
});

// 1. Create a privacy-preserving payroll batch
const batch = await blackout.payroll.create({
  name: 'September Payroll',
  period: '01 SEP — 30 SEP 2026',
  paymentDate: '2026-09-30',
  asset: 'USDC'
});

// 2. Add recipients with private compensation values
await blackout.payroll.addRecipient(batch.id, {
  employeeId: 'EMP-001',
  label: 'Lead Protocol Cryptographer',
  walletAddress: 'midnight1q88apexlettings2500req8923kf98s23kd',
  paymentAmount: 4720,
  currency: 'USDC'
});

// 3. Authorize batch under multi-signature and condition checks
const auth = await blackout.payroll.authorize(batch.id, {
  requireProofOfFunds: true,
  requireEligibilityVerification: true
});

// 4. Execute private payroll (generates ZK proofs for zero compensation disclosure)
const execution = await blackout.payroll.execute(batch.id);

// 5. Query execution status & privacy verification
const status = await blackout.payroll.status(batch.id);
console.log(status.privacyStatus); // "COMPENSATION PRIVATE"
console.log(status.publicCompensationDisclosed); // "0 BYTES"`;

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-10 space-y-12 text-left font-sans select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div className="space-y-2">
          <div className="text-[11px] font-mono tracking-[0.25em] text-[#FF5A5F] uppercase font-bold">
            [ DEVELOPER DOCUMENTATION // MIDNIGHT COMPACT ]
          </div>
          <h1 className="text-3xl sm:text-5xl font-condensed font-extrabold uppercase text-[#E8E6DF]">
            COMPACT SMART CONTRACTS.
          </h1>
          <p className="text-xs sm:text-sm text-[#8A8882] max-w-2xl font-normal">
            Inspect the real Midnight Compact smart contract and explore the Wave 3 Developer SDK specification for embedding private zero-knowledge verification into external applications.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-1 font-mono text-xs uppercase">
          <button
            onClick={() => setActiveTab('COMPACT')}
            className={`px-3.5 py-2 transition-all cursor-pointer ${
              activeTab === 'COMPACT'
                ? 'bg-[#E8E6DF] text-black font-bold'
                : 'bg-[#141414] text-[#8A8882] hover:text-[#E8E6DF]'
            }`}
          >
            income_verifier.compact (WAVE 1)
          </button>
          <button
            onClick={() => setActiveTab('SDK_PREVIEW')}
            className={`px-3.5 py-2 transition-all cursor-pointer ${
              activeTab === 'SDK_PREVIEW'
                ? 'bg-[#E8E6DF] text-black font-bold'
                : 'bg-[#141414] text-[#8A8882] hover:text-[#E8E6DF]'
            }`}
          >
            VERIFY SDK API [WAVE 3 PREVIEW]
          </button>
          <button
            onClick={() => setActiveTab('PAYROLL_SDK')}
            className={`px-3.5 py-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PAYROLL_SDK'
                ? 'bg-[#FF5A5F] text-black font-bold'
                : 'bg-[#141414] text-[#8A8882] hover:text-[#E8E6DF]'
            }`}
          >
            <span>BLACK PAYROLL API [SDK PREVIEW]</span>
          </button>
        </div>
      </div>

      {/* Main Code View Container */}
      <div className="bg-[#0E0E0E] border border-white/[0.1] rounded-[2px] overflow-hidden shadow-2xl">
        
        {/* Code Header Bar */}
        <div className="px-6 py-4 bg-[#121212] border-b border-white/[0.08] flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-[#FF5A5F]"></span>
            <span className="text-[#E8E6DF] font-bold">
              {activeTab === 'COMPACT' 
                ? 'contract/income_verifier.compact' 
                : activeTab === 'SDK_PREVIEW'
                ? 'src/sdk/client.ts (WAVE 3 PREVIEW)'
                : 'src/sdk/payroll.ts (SDK PREVIEW)'}
            </span>
            <span className="text-[10px] text-[#8A8882]">
              {activeTab === 'COMPACT' 
                ? '[ COMPACT DSL v0.20+ ]' 
                : activeTab === 'SDK_PREVIEW'
                ? '[ SDK ROADMAP PREVIEW ]'
                : '[ BLACK PAYROLL SPECIFICATION PREVIEW ]'}
            </span>
          </div>

          <button
            onClick={() => {
              const codeToCopy = 
                activeTab === 'COMPACT' 
                  ? compactContractCode 
                  : activeTab === 'SDK_PREVIEW' 
                  ? sdkPreviewCode 
                  : payrollSdkCode;
              handleCopy(codeToCopy, activeTab);
            }}
            className="px-3 py-1.5 bg-[#181818] hover:bg-[#E8E6DF] hover:text-black border border-white/[0.1] text-[#E8E6DF] font-mono text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copiedCode === activeTab ? <Check className="w-3.5 h-3.5 text-[#26A17B]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode === activeTab ? 'COPIED CODE' : 'COPY CODE'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="p-6 bg-[#090909] overflow-x-auto font-mono text-xs text-[#E8E6DF] leading-relaxed">
          <pre className="whitespace-pre">
            <code>
              {activeTab === 'COMPACT' 
                ? compactContractCode 
                : activeTab === 'SDK_PREVIEW' 
                ? sdkPreviewCode 
                : payrollSdkCode}
            </code>
          </pre>
        </div>

      </div>

      {/* Key Architectural Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        
        <div className="p-6 bg-[#0E0E0E] border border-white/[0.08] space-y-3">
          <div className="text-xs font-mono font-bold text-[#FF5A5F] uppercase">
            01 / WITNESS BOUNDARY
          </div>
          <h3 className="text-lg font-condensed font-bold uppercase text-[#E8E6DF]">
            LOCAL WITNESS EXECUTION
          </h3>
          <p className="text-xs text-[#8A8882] leading-relaxed">
            <code>witness get_private_monthly_income()</code> is invoked strictly inside the client-side proving enclave. It never enters network serialization.
          </p>
        </div>

        <div className="p-6 bg-[#0E0E0E] border border-white/[0.08] space-y-3">
          <div className="text-xs font-mono font-bold text-[#FF5A5F] uppercase">
            02 / R1CS CONSTRAINT
          </div>
          <h3 className="text-lg font-condensed font-bold uppercase text-[#E8E6DF]">
            INEQUALITY ARITHMETIC
          </h3>
          <p className="text-xs text-[#8A8882] leading-relaxed">
            The inequality <code>private_income &gt;= required_income</code> compiles into rank-1 constraint systems. The secret value cancels out during polynomial reduction.
          </p>
        </div>

        <div className="p-6 bg-[#0E0E0E] border border-white/[0.08] space-y-3">
          <div className="text-xs font-mono font-bold text-[#FF5A5F] uppercase">
            03 / LEDGER PURITY
          </div>
          <h3 className="text-lg font-condensed font-bold uppercase text-[#E8E6DF]">
            0 BYTES EXPOSURE
          </h3>
          <p className="text-xs text-[#8A8882] leading-relaxed">
            The public state record contains solely <code>is_verified: is_satisfied</code>, timestamp, verifier public key, and Poseidon commitment hash.
          </p>
        </div>

      </div>

    </div>
  );
};
