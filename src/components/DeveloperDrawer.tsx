import React, { useState } from 'react';
import { X, Terminal, Copy, Check, FileCode, Cpu, ShieldCheck } from 'lucide-react';

interface DeveloperDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperDrawer: React.FC<DeveloperDrawerProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<'COMPACT' | 'TYPES' | 'PRIVACY_DOC'>('COMPACT');

  if (!isOpen) return null;

  const compactContractCode = `// ============================================================================
// BLACKOUT PAY — MIDNIGHT NETWORK COMPACT SMART CONTRACT
// Language: Compact (Midnight Network ZK Smart Contract DSL)
// Pragma: Midnight Compact v0.20+
//
// Purpose: Privacy-preserving income threshold verification.
// ============================================================================

pragma language_version >= 0.20.0;

import CompactStandardLibrary;

// Public ledger state record
export struct VerificationRecord {
    request_id: Bytes<32>;
    required_income: Uint<64>;
    is_verified: Boolean;
    timestamp: Uint<64>;
    verifier_pk: Bytes<32>;
    commitment: Bytes<32>;
}

// Ledger storage
export ledger records: Map<Bytes<32>, VerificationRecord>;
export ledger total_verifications: Counter;

// Private witness definitions (Executed locally off-chain inside the prover)
witness get_private_monthly_income(): Uint<64>;
witness get_private_income_salt(): Bytes<32>;

// ZK Circuit: Proves income threshold without revealing income
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

    // 4. Update ledger state atomically with only the public verification result
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

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl h-full bg-[#0b0c10] border-l border-white/[0.1] p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col text-left overflow-hidden"
        id="drawer-developer-compact"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#14161c] border border-white/[0.1] flex items-center justify-center">
              <Terminal className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white">Midnight Compact Contract & DSL</h3>
              <p className="text-xs text-[#8e94a5]">Official Wave 1 Zero-Knowledge Smart Contract</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#717682] hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File Tabs */}
        <div className="flex items-center justify-between my-4 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedFile('COMPACT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                selectedFile === 'COMPACT' ? 'bg-[#1c202a] text-white border border-white/20' : 'text-[#717682] hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>income_verifier.compact</span>
            </button>
          </div>

          <button
            onClick={() => handleCopy(compactContractCode)}
            className="flex items-center gap-1.5 text-xs text-[#8e94a5] hover:text-white bg-[#14161c] px-3 py-1.5 rounded-lg border border-white/[0.08] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code View */}
        <div className="flex-1 overflow-y-auto bg-[#07080a] rounded-xl border border-white/[0.06] p-4 font-mono text-xs text-[#c9d1d9] leading-relaxed">
          <pre className="whitespace-pre">
            <code>{compactContractCode}</code>
          </pre>
        </div>

        {/* Footer Notes */}
        <div className="mt-4 pt-3 border-t border-white/[0.08] text-[11px] text-[#717682] font-mono flex items-center justify-between">
          <span>Midnight Compact Language Spec v0.20+</span>
          <span className="text-emerald-400 font-medium">Dual-State Prover Verified</span>
        </div>
      </div>
    </div>
  );
};
