import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Time = bigint;
export interface Verdict {
  'source' : string,
  'hash' : string,
  'resultado' : VerdictResult,
  'timestamp' : Time,
  'confidence' : number,
}
export type VerdictResult = { 'True' : null } |
  { 'False' : null } |
  { 'Unknown' : null };
export interface _SERVICE {
  'greet' : ActorMethod<[string], string>,
  'setGreeting' : ActorMethod<[string], undefined>,
  'verifyStatement' : ActorMethod<[string], Verdict>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
