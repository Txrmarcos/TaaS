import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Proposal {
  'id' : bigint,
  'url' : string,
  'status' : ProposalStatus,
  'name' : string,
  'description' : string,
  'voters' : Array<Principal>,
  'created_at' : Time,
  'proposer' : Principal,
  'votes_for' : bigint,
  'pr_link' : string,
  'votes_against' : bigint,
}
export type ProposalStatus = { 'Approved' : null } |
  { 'Rejected' : null } |
  { 'Pending' : null };
export type Time = bigint;
export interface _SERVICE {
  'get_proposal' : ActorMethod<[bigint], [] | [Proposal]>,
  'list_proposals' : ActorMethod<[], Array<Proposal>>,
  'propose_source' : ActorMethod<[string, string, string, string], bigint>,
  'vote_source' : ActorMethod<[bigint, boolean], string>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
