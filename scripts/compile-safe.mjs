import { access, chmod, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';

const compiler = resolve('bin/compact');
const sourcePath = resolve('contract/blackout_safe.compact');
const previewPath = resolve('contract/blackout_safe.preview.compact');
const output = resolve('contract/build-safe');
const toolchainVersion = process.env.COMPACT_TOOLCHAIN_VERSION || '0.31.1';

if (process.platform === 'win32') {
  throw new Error('The bundled Compact devtool is a Linux binary. Run this project in WSL/Linux so generated Midnight artifacts cannot become stale.');
}

await access(compiler);
await access(sourcePath);
await chmod(compiler, 0o755);

function runCompact(args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(compiler, args, { stdio: 'inherit', env: process.env });
    child.once('error', rejectPromise);
    child.once('exit', (code, signal) => {
      if (signal) return rejectPromise(new Error(`Compact ${args[0]} terminated by signal ${signal}.`));
      if (code !== 0) return rejectPromise(new Error(`Compact ${args[0]} exited with code ${code}.`));
      resolvePromise();
    });
  });
}

const receiptMarker = '// ---------------------------------------------------------------------------\n// BLACKOUT RECEIPT CIRCUITS\n// ---------------------------------------------------------------------------';
const helperMarker = 'circuit require_current_member(secret: Bytes<32>): [] {';

const receiptBlock = `// ---------------------------------------------------------------------------
// BLACKOUT RECEIPT — ONE EXPORTED CIRCUIT, FIVE PUBLIC STATEMENT MODES
// ---------------------------------------------------------------------------
export struct ReceiptStatementResult {
  valid: Boolean;
  amount: Uint<64>;
  recipient: Bytes<32>;
}

export circuit receipt_statement(
  statement: Uint<64>,
  proposal_commitment: Bytes<32>
): ReceiptStatementResult {
  const mode = disclose(statement);
  assert(mode >= 1 && mode <= 5, "BLACKOUT_SAFE_RECEIPT_STATEMENT_UNSUPPORTED");

  if (mode == 1) {
    assert(proposals.member(disclose(proposal_commitment)), "BLACKOUT_SAFE_UNKNOWN_PROPOSAL");
    const proposal = proposals.lookup(disclose(proposal_commitment));
    const policy = require_proposal_policy_opening(proposal);
    const valid = proposal.approval_count >= policy.threshold;
    assert(valid, "BLACKOUT_SAFE_QUORUM_NOT_REACHED");
    return ReceiptStatementResult { valid: disclose(valid), amount: 0, recipient: pad(32, "") };
  } else if (mode == 2) {
    const payload = local_private_proposal();
    assert(client_proposal_commitment(safe_id, payload) == proposal_commitment, "BLACKOUT_SAFE_RECEIPT_PAYLOAD_MISMATCH");
    const exec_nul = execution_nullifier(proposal_commitment, payload.nonce);
    assert(execution_nullifiers.member(exec_nul), "BLACKOUT_SAFE_RECEIPT_NOT_EXECUTED");
    return ReceiptStatementResult { valid: true, amount: 0, recipient: pad(32, "") };
  } else if (mode == 3) {
    const payload = local_private_proposal();
    assert(client_proposal_commitment(safe_id, payload) == proposal_commitment, "BLACKOUT_SAFE_RECEIPT_PAYLOAD_MISMATCH");
    const exec_nul = execution_nullifier(proposal_commitment, payload.nonce);
    assert(execution_nullifiers.member(exec_nul), "BLACKOUT_SAFE_RECEIPT_NOT_EXECUTED");
    return ReceiptStatementResult { valid: true, amount: disclose(payload.amount), recipient: pad(32, "") };
  } else if (mode == 4) {
    const payload = local_private_proposal();
    assert(client_proposal_commitment(safe_id, payload) == proposal_commitment, "BLACKOUT_SAFE_RECEIPT_PAYLOAD_MISMATCH");
    const exec_nul = execution_nullifier(proposal_commitment, payload.nonce);
    assert(execution_nullifiers.member(exec_nul), "BLACKOUT_SAFE_RECEIPT_NOT_EXECUTED");
    return ReceiptStatementResult { valid: true, amount: 0, recipient: disclose(payload.recipient) };
  } else {
    const valid = cancelled_proposals.member(disclose(proposal_commitment));
    assert(valid, "BLACKOUT_SAFE_RECEIPT_NOT_CANCELLED");
    return ReceiptStatementResult { valid: disclose(valid), amount: 0, recipient: pad(32, "") };
  }
}
`;

const helpers = `// ---------------------------------------------------------------------------
// STABLE CLIENT-SIDE COMMITMENT HELPERS
// ---------------------------------------------------------------------------
circuit client_proposal_commitment(
  client_safe_id: Bytes<32>,
  payload: PrivateProposalPayload
): Bytes<32> {
  return persistentHash<[
    Bytes<32>, Bytes<32>, Bytes<32>, Bytes<32>, Bytes<32>, Uint<64>,
    Bytes<32>, Bytes<32>, Uint<64>, Uint<64>, Bytes<32>, Bytes<32>
  ]>([
    pad(32, "blackout:safe:proposal:v1"), client_safe_id, payload.action_type,
    payload.asset, payload.recipient, payload.amount, payload.calldata_or_action,
    payload.memo_hash, payload.created_at, payload.expires_at, payload.nonce, payload.salt
  ]);
}

circuit client_governance_simple_commitment(
  client_safe_id: Bytes<32>, action_tag: Bytes<32>
): Bytes<32> {
  return persistentHash<Vector<3, Bytes<32>>>([
    pad(32, "blackout:safe:governance:v1"), client_safe_id, action_tag
  ]);
}

circuit client_governance_bytes_commitment(
  client_safe_id: Bytes<32>, action_tag: Bytes<32>, value: Bytes<32>
): Bytes<32> {
  return persistentHash<Vector<4, Bytes<32>>>([
    pad(32, "blackout:safe:governance:v1"), client_safe_id, action_tag, value
  ]);
}

circuit client_governance_root_commitment(
  client_safe_id: Bytes<32>, action_tag: Bytes<32>, root: MerkleTreeDigest
): Bytes<32> {
  return persistentHash<[Bytes<32>, Bytes<32>, Bytes<32>, Field]>([
    pad(32, "blackout:safe:governance:v1"), client_safe_id, action_tag, root.field
  ]);
}

`;

let source = await readFile(sourcePath, 'utf8');
const receiptIndex = source.indexOf(receiptMarker);
if (receiptIndex < 0) throw new Error('BLACKOUT_SAFE_RECEIPT_SECTION_NOT_FOUND');
source = `${source.slice(0, receiptIndex)}${receiptBlock}`;

if (!source.includes(helperMarker)) throw new Error('BLACKOUT_SAFE_HASH_HELPER_INSERTION_MARKER_MISSING');
source = source.replace(helperMarker, `${helpers}${helperMarker}`);
source = source.replaceAll('private_proposal_commitment(recovery_payload)', 'client_proposal_commitment(safe_id, recovery_payload)');
source = source.replaceAll('private_proposal_commitment(payload)', 'client_proposal_commitment(safe_id, payload)');
source = source.replaceAll('governance_simple_commitment(pad(32, ', 'client_governance_simple_commitment(safe_id, pad(32, ');
source = source.replaceAll('governance_bytes_commitment(pad(32, ', 'client_governance_bytes_commitment(safe_id, pad(32, ');
source = source.replaceAll('governance_root_commitment(pad(32, ', 'client_governance_root_commitment(safe_id, pad(32, ');

for (const helper of [
  'client_proposal_commitment',
  'client_governance_simple_commitment',
  'client_governance_bytes_commitment',
  'client_governance_root_commitment',
]) {
  if ((source.split(helper).length - 1) < 2) throw new Error(`BLACKOUT_SAFE_HASH_HELPER_NOT_RETAINED: ${helper}`);
}

await writeFile(previewPath, source, 'utf8');
await runCompact(['update', toolchainVersion]);
await rm(output, { recursive: true, force: true });
await runCompact(['compile', previewPath, output]);

const coreCircuits = [
  'propose_private',
  'approve_private',
  'prove_quorum',
  'deposit_shielded',
  'execute_shielded_transfer',
  'receipt_statement',
];
const required = [
  'compiler/contract-info.json',
  'contract/index.js',
  'contract/index.d.ts',
  ...coreCircuits.flatMap((circuit) => [
    `keys/${circuit}.prover`,
    `keys/${circuit}.verifier`,
    `zkir/${circuit}.bzkir`,
  ]),
];
await Promise.all(required.map((path) => access(resolve(output, path))));
console.log(`BLACKOUT SAFE: Compact ${toolchainVersion} Preview contract compiled and ${coreCircuits.length} core circuits verified.`);
