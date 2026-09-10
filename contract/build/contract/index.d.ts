import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type VerificationRecord = { request_id: Uint8Array;
                                   required_income: bigint;
                                   is_verified: boolean;
                                   timestamp: bigint;
                                   verifier_pk: Uint8Array;
                                   commitment: Uint8Array
                                 };

export type Witnesses<PS> = {
  get_private_monthly_income(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  get_private_income_salt(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  prove_income_threshold(context: __compactRuntime.CircuitContext<PS>,
                         request_id_0: Uint8Array,
                         required_income_0: bigint,
                         verifier_pk_0: Uint8Array,
                         timestamp_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
  register_verification_request(context: __compactRuntime.CircuitContext<PS>,
                                request_id_0: Uint8Array,
                                required_income_0: bigint,
                                verifier_pk_0: Uint8Array,
                                timestamp_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  prove_income_threshold(context: __compactRuntime.CircuitContext<PS>,
                         request_id_0: Uint8Array,
                         required_income_0: bigint,
                         verifier_pk_0: Uint8Array,
                         timestamp_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
  register_verification_request(context: __compactRuntime.CircuitContext<PS>,
                                request_id_0: Uint8Array,
                                required_income_0: bigint,
                                verifier_pk_0: Uint8Array,
                                timestamp_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  prove_income_threshold(context: __compactRuntime.CircuitContext<PS>,
                         request_id_0: Uint8Array,
                         required_income_0: bigint,
                         verifier_pk_0: Uint8Array,
                         timestamp_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
  register_verification_request(context: __compactRuntime.CircuitContext<PS>,
                                request_id_0: Uint8Array,
                                required_income_0: bigint,
                                verifier_pk_0: Uint8Array,
                                timestamp_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  records: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): VerificationRecord;
    [Symbol.iterator](): Iterator<[Uint8Array, VerificationRecord]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
