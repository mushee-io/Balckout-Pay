/**
 * Creates the official MidnightJS compiled-contract wrapper from the
 * compiler-generated Contract class. The generated binding remains the
 * source of truth; this only attaches private witness callbacks and assets.
 */
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { Contract, type Witnesses } from '../../contract/build/contract/index.js';

export type BlackoutPrivateState = Record<string, never>;
export type BlackoutWitnesses = Witnesses<BlackoutPrivateState>;

export function makeBlackoutCompiledContract(witnesses: BlackoutWitnesses, assetBaseUrl = '/zk-artifacts') {
  return CompiledContract.make('BlackoutIncomeVerifier', Contract)
    .pipe(
      CompiledContract.withWitnesses(witnesses),
      CompiledContract.withCompiledFileAssets(assetBaseUrl),
    );
}
