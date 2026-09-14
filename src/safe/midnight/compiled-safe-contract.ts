import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { Contract, type Witnesses } from '../../../contract/build-safe/contract/index.js';

export type BlackoutSafePrivateState = Record<string, never>;
export type BlackoutSafeWitnesses = Witnesses<BlackoutSafePrivateState>;

export const BLACKOUT_SAFE_CONTRACT_NAME = 'BlackoutSafe';
export const BLACKOUT_SAFE_ZK_ASSET_PATH = '/zk-artifacts/blackout-safe';

export function makeBlackoutSafeCompiledContract(
  witnesses: BlackoutSafeWitnesses,
  assetBaseUrl = BLACKOUT_SAFE_ZK_ASSET_PATH,
) {
  return CompiledContract.make(BLACKOUT_SAFE_CONTRACT_NAME, Contract).pipe(
    CompiledContract.withWitnesses(witnesses),
    CompiledContract.withCompiledFileAssets(assetBaseUrl),
  );
}
