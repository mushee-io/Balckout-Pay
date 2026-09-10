/**
 * Read-only Midnight readiness check. This script never starts a prover,
 * opens a wallet, or submits a transaction.
 */
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const required = [
  'MIDNIGHT_NETWORK_ID',
  'MIDNIGHT_NODE_URL',
  'MIDNIGHT_INDEXER_URL',
  'MIDNIGHT_PROOF_SERVER_URL',
] as const;

const artifacts = [
  'compiler/contract-info.json',
  'contract/index.js',
  'contract/index.d.ts',
  'zkir/prove_income_threshold.bzkir',
  'keys/prove_income_threshold.prover',
  'keys/prove_income_threshold.verifier',
];

function url(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'ws:' || parsed.protocol === 'wss:';
  } catch {
    return false;
  }
}

async function health(name: string, endpoint: string, init?: RequestInit): Promise<boolean> {
  try {
    const response = await fetch(endpoint, init);
    console.log(`${name.padEnd(18)} ${response.ok ? 'PASS' : `FAIL (HTTP ${response.status})`}`);
    return response.ok;
  } catch (error) {
    console.log(`${name.padEnd(18)} FAIL (${error instanceof Error ? error.message : 'unreachable'})`);
    return false;
  }
}

async function main() {
  let passed = true;
  console.log('BLACKOUT Midnight readiness check');

  for (const key of required) {
    const value = process.env[key];
    const valid = key === 'MIDNIGHT_NETWORK_ID' ? Boolean(value?.trim()) : url(value);
    console.log(`${key.padEnd(18)} ${valid ? 'PASS' : 'FAIL (required and must be valid)'}`);
    passed &&= valid;
  }

  const artifactRoot = path.resolve('contract/build');
  const artifactOk = artifacts.every((file) => fs.existsSync(path.join(artifactRoot, file)));
  console.log(`${'compiled artifacts'.padEnd(18)} ${artifactOk ? 'PASS' : 'FAIL (missing generated files)'}`);
  passed &&= artifactOk;

  if (process.env.MIDNIGHT_NODE_URL) {
    passed &&= await health('node', process.env.MIDNIGHT_NODE_URL, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 'blackout-check', method: 'system_health', params: [] }),
    });
  }
  if (process.env.MIDNIGHT_INDEXER_URL) {
    passed &&= await health('indexer', process.env.MIDNIGHT_INDEXER_URL, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ block { height } }' }),
    });
  }
  if (process.env.MIDNIGHT_PROOF_SERVER_URL) {
    passed &&= await health('proof server', process.env.MIDNIGHT_PROOF_SERVER_URL);
  }

  const deployment = process.env.MIDNIGHT_CONTRACT_ADDRESS;
  console.log(`${'contract address'.padEnd(18)} ${deployment ? 'CONFIGURED' : 'UNSET (deployment required)'}`);
  if (!passed) process.exitCode = 1;
}

void main();
