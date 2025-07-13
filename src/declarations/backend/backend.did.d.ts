import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Time = bigint;
export interface Verdict {
  'result' : VerdictResult,
  'source' : string,
  'hash' : string,
  'timestamp' : Time,
  'confidence' : number,
}
export type VerdictResult = { 'True' : null } |
  { 'False' : null } |
  { 'Unknown' : null };
export interface _SERVICE {
  'getVerdictByHash' : ActorMethod<[string], [] | [Verdict]>,
  'verifyStatement' : ActorMethod<[string], Verdict>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
