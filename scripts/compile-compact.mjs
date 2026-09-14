import { access, chmod, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';

const compiler = resolve('bin/compact');
const source = resolve('contract/income_verifier.compact');
const output = resolve('contract/build');

if (process.platform === 'win32') {
  throw new Error('The bundled Compact compiler is a Linux binary. Run this project in WSL/Linux so generated Midnight artifacts cannot become stale.');
}

await access(compiler);
await access(source);
await chmod(compiler, 0o755);
await rm(output, { recursive: true, force: true });

await new Promise((resolvePromise, rejectPromise) => {
  const child = spawn(compiler, ['compile', source, output], {
    stdio: 'inherit',
    env: process.env,
  });

  child.once('error', rejectPromise);
  child.once('exit', (code, signal) => {
    if (signal) {
      rejectPromise(new Error(`Compact compiler terminated by signal ${signal}.`));
      return;
    }
    if (code !== 0) {
      rejectPromise(new Error(`Compact compiler exited with code ${code}.`));
      return;
    }
    resolvePromise();
  });
});

const required = [
  'contract/index.js',
  'contract/index.d.ts',
  'keys/prove_income_threshold.prover',
  'keys/prove_income_threshold.verifier',
  'keys/register_verification_request.prover',
  'keys/register_verification_request.verifier',
  'zkir/prove_income_threshold.bzkir',
  'zkir/register_verification_request.bzkir',
];

await Promise.all(required.map((path) => access(resolve(output, path))));
console.log('Compact contract compiled and required Midnight artifacts verified.');
