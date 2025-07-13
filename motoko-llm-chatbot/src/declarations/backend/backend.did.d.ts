import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AssistantMessage {
  'content' : [] | [string],
  'tool_calls' : Array<ToolCall>,
}
export type ChatMessage = {
    'tool' : { 'content' : string, 'tool_call_id' : string }
  } |
  { 'user' : { 'content' : string } } |
  { 'assistant' : AssistantMessage } |
  { 'system' : { 'content' : string } };
export interface FunctionCall {
  'name' : string,
  'arguments' : Array<ToolCallArgument>,
}
export interface ToolCall { 'id' : string, 'function' : FunctionCall }
export interface ToolCallArgument { 'value' : string, 'name' : string }
export interface _SERVICE {
  'chat' : ActorMethod<[Array<ChatMessage>], string>,
  'prompt' : ActorMethod<[string], string>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
