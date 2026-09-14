import { access, copyFile, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const circuits = [
  'propose_private',
  'approve_private',
  'prove_quorum',
  'deposit_shielded',
  'execute_shielded_transfer',
  'receipt_statement',
];

const source = resolve('contract/build-safe');
const destination = resolve('public/zk-artifacts/blackout-safe');
const required = circuits.flatMap((circuit) => [
  `keys/${circuit}.prover`,
  `keys/${circuit}.verifier`,
  `zkir/${circuit}.bzkir`,
]);

await Promise.all(required.map((artifact) => access(resolve(source, artifact))));
await rm(destination, { recursive: true, force: true });

for (const artifact of required) {
  const target = resolve(destination, artifact);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(source, artifact), target);
}

await Promise.all(required.map((artifact) => access(resolve(destination, artifact))));
console.log(`BLACKOUT SAFE: staged ${required.length} proving artifacts for ${circuits.length} native Preview circuits.`);
