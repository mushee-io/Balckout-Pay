import { access, cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('contract/build');
const publicRoot = resolve('public');
const keysDestination = resolve(publicRoot, 'keys');
const zkirDestination = resolve(publicRoot, 'zkir');

// MidnightJS 4.1.1 FetchZkConfigProvider resolves artifacts as:
//   <baseURL>/keys/<circuit>.{prover,verifier}
//   <baseURL>/zkir/<circuit>.bzkir
// The LIVE browser provider uses window.location.origin as baseURL, so these
// files must be served from /keys and /zkir on the deployed Vercel origin.
const requiredArtifacts = [
  'keys/prove_income_threshold.prover',
  'keys/prove_income_threshold.verifier',
  'keys/register_verification_request.prover',
  'keys/register_verification_request.verifier',
  'zkir/prove_income_threshold.bzkir',
  'zkir/register_verification_request.bzkir',
];

// Fail the production build instead of deploying a LIVE app with incomplete
// proving material. This preserves fail-closed behavior.
await Promise.all(requiredArtifacts.map((artifact) => access(resolve(source, artifact))));

await Promise.all([
  rm(keysDestination, { recursive: true, force: true }),
  rm(zkirDestination, { recursive: true, force: true }),
]);
await Promise.all([
  mkdir(keysDestination, { recursive: true }),
  mkdir(zkirDestination, { recursive: true }),
]);
await Promise.all([
  cp(resolve(source, 'keys'), keysDestination, { recursive: true }),
  cp(resolve(source, 'zkir'), zkirDestination, { recursive: true }),
]);

// Verify the exact files Vercel will serve before Vite builds dist/.
await Promise.all([
  ...requiredArtifacts.map((artifact) => access(resolve(publicRoot, artifact))),
]);

console.log('Midnight Preview ZK artifacts staged at /keys and /zkir.');
