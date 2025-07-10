export const idlFactory = ({ IDL }) => {
  const VerdictResult = IDL.Variant({
    'True' : IDL.Null,
    'False' : IDL.Null,
    'Unknown' : IDL.Null,
  });
  const Time = IDL.Int;
  const Verdict = IDL.Record({
    'source' : IDL.Text,
    'hash' : IDL.Text,
    'resultado' : VerdictResult,
    'timestamp' : Time,
    'confidence' : IDL.Float64,
  });
  return IDL.Service({
    'greet' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'setGreeting' : IDL.Func([IDL.Text], [], []),
    'verifyStatement' : IDL.Func([IDL.Text], [Verdict], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
