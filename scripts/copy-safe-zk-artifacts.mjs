import { access, copyFile, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

// Browser actions only need prover + bzkir material for the circuits the UI can
// execute directly. Contract deployment is different: Midnight installs a
// verifier key for every exported entry point declared by the compiled
// contract, so every exported circuit must have its .verifier available.
const interactiveCircuits = [
  'propose_private',
  'approve_private',
  'prove_quorum',
  'deposit_shielded',
  'execute_shielded_transfer',
  'receipt_statement',
];

const exportedCircuits = [
  ...interactiveCircuits,
  'governance_pause',
  'governance_resume',
  'governance_cancel_proposal',
  'governance_rotate_membership',
  'governance_change_policy',
];

const source = resolve('contract/build-safe');
const destination = resolve('public/zk-artifacts/blackout-safe');

const interactiveArtifacts = interactiveCircuits.flatMap((circuit) => [
  `keys/${circuit}.prover`,
  `keys/${circuit}.verifier`,
  `zkir/${circuit}.bzkir`,
]);
const deploymentVerifierArtifacts = exportedCircuits.map((circuit) => `keys/${circuit}.verifier`);
const required = [...new Set([...interactiveArtifacts, ...deploymentVerifierArtifacts])];

await Promise.all(required.map((artifact) => access(resolve(source, artifact))));
await rm(destination, { recursive: true, force: true });

for (const artifact of required) {
  const target = resolve(destination, artifact);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(source, artifact), target);
}

await Promise.all(required.map((artifact) => access(resolve(destination, artifact))));
console.log(
  `BLACKOUT SAFE: staged full verifier set for ${exportedCircuits.length} exported circuits and proving material for ${interactiveCircuits.length} interactive circuits.`,
);
