export const idlFactory = ({ IDL }) => {
  const VerdictResult = IDL.Variant({
    'True' : IDL.Null,
    'False' : IDL.Null,
    'Unknown' : IDL.Null,
  });
  const Time = IDL.Int;
  const Verdict = IDL.Record({
    'result' : VerdictResult,
    'source' : IDL.Text,
    'hash' : IDL.Text,
    'timestamp' : Time,
    'confidence' : IDL.Float64,
  });
  return IDL.Service({
    'getVerdictByHash' : IDL.Func([IDL.Text], [IDL.Opt(Verdict)], ['query']),
    'verifyStatement' : IDL.Func([IDL.Text], [Verdict], []),
  });
};
export const init = ({ IDL }) => { return []; };
