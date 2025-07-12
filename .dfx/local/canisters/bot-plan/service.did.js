export const idlFactory = ({ IDL }) => {
  const Plan = IDL.Variant({
    'Pro' : IDL.Null,
    'Premium' : IDL.Null,
    'Standard' : IDL.Null,
  });
  const Time = IDL.Int;
  const UserStatus = IDL.Record({
    'plan' : Plan,
    'resetAt' : Time,
    'requestsLeft' : IDL.Nat,
  });
  return IDL.Service({
    'check_balance' : IDL.Func([], [IDL.Nat], []),
    'get_user_status' : IDL.Func([], [IDL.Opt(UserStatus)], ['query']),
    'prompt' : IDL.Func([IDL.Text], [IDL.Text], []),
    'subscribe' : IDL.Func([Plan], [IDL.Text], []),
    'use_request' : IDL.Func([], [IDL.Bool], []),
  });
};
export const init = ({ IDL }) => { return []; };
