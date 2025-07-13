export const idlFactory = ({ IDL }) => {
  const ToolCallArgument = IDL.Record({
    'value' : IDL.Text,
    'name' : IDL.Text,
  });
  const FunctionCall = IDL.Record({
    'name' : IDL.Text,
    'arguments' : IDL.Vec(ToolCallArgument),
  });
  const ToolCall = IDL.Record({ 'id' : IDL.Text, 'function' : FunctionCall });
  const AssistantMessage = IDL.Record({
    'content' : IDL.Opt(IDL.Text),
    'tool_calls' : IDL.Vec(ToolCall),
  });
  const ChatMessage = IDL.Variant({
    'tool' : IDL.Record({ 'content' : IDL.Text, 'tool_call_id' : IDL.Text }),
    'user' : IDL.Record({ 'content' : IDL.Text }),
    'assistant' : AssistantMessage,
    'system' : IDL.Record({ 'content' : IDL.Text }),
  });
  return IDL.Service({
    'chat' : IDL.Func([IDL.Vec(ChatMessage)], [IDL.Text], []),
    'prompt' : IDL.Func([IDL.Text], [IDL.Text], []),
  });
};
export const init = ({ IDL }) => { return []; };
