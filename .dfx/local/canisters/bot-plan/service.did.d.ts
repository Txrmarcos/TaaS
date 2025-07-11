import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Plan = { 'Pro' : null } |
  { 'Premium' : null } |
  { 'Standard' : null };
export type Time = bigint;
export interface UserStatus {
  'plan' : Plan,
  'resetAt' : Time,
  'requestsLeft' : bigint,
}
export interface _SERVICE {
  'check_balance' : ActorMethod<[], bigint>,
  'get_user_status' : ActorMethod<[], [] | [UserStatus]>,
  'prompt' : ActorMethod<[string], string>,
  'subscribe' : ActorMethod<[Plan], string>,
  'use_request' : ActorMethod<[], boolean>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
