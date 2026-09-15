import { access, chmod, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';

const compiler = resolve('bin/compact');
const source = resolve('contract/blackout_payroll.compact');
const output = resolve('contract/build-payroll');
const toolchainVersion = process.env.COMPACT_TOOLCHAIN_VERSION || '0.31.1';

if (process.platform === 'win32') {
  throw new Error('The bundled Compact devtool is a Linux binary. Run this project in WSL/Linux so generated Midnight artifacts cannot become stale.');
}

await access(compiler);
await access(source);
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

await runCompact(['update', toolchainVersion]);
await rm(output, { recursive: true, force: true });
await runCompact(['compile', source, output]);

const required = [
  'compiler/contract-info.json',
  'contract/index.js',
  'contract/index.d.ts',
  'keys/authorize_payroll.prover',
  'keys/authorize_payroll.verifier',
  'zkir/authorize_payroll.bzkir',
];

await Promise.all(required.map((path) => access(resolve(output, path))));
console.log(`BLACKOUT PAYROLL: Compact ${toolchainVersion} contract compiled and live authorization artifacts verified.`);
