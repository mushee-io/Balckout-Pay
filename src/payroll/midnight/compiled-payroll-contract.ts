import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { Contract, type Witnesses } from '../../../contract/build-payroll/contract/index.js';

export type BlackoutPayrollPrivateState = Record<string, never>;
export type BlackoutPayrollWitnesses = Witnesses<BlackoutPayrollPrivateState>;

export const BLACKOUT_PAYROLL_PRIVATE_STATE_ID = 'blackout-payroll-preview-v1';
export const BLACKOUT_PAYROLL_CONTRACT_NAME = 'BlackoutPayroll';
export const BLACKOUT_PAYROLL_ZK_ASSET_PATH = '/zk-artifacts/blackout-payroll';

export function makeBlackoutPayrollCompiledContract(
  witnesses: BlackoutPayrollWitnesses,
  assetBaseUrl = BLACKOUT_PAYROLL_ZK_ASSET_PATH,
) {
  return CompiledContract.make(BLACKOUT_PAYROLL_CONTRACT_NAME, Contract).pipe(
    CompiledContract.withWitnesses(witnesses),
    CompiledContract.withCompiledFileAssets(assetBaseUrl),
  );
}
