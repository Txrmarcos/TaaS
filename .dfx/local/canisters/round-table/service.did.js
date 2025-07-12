export const idlFactory = ({ IDL }) => {
  const ProposalStatus = IDL.Variant({
    'Approved' : IDL.Null,
    'Rejected' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const Time = IDL.Int;
  const Proposal = IDL.Record({
    'id' : IDL.Nat,
    'url' : IDL.Text,
    'status' : ProposalStatus,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'voters' : IDL.Vec(IDL.Principal),
    'created_at' : Time,
    'proposer' : IDL.Principal,
    'votes_for' : IDL.Nat,
    'pr_link' : IDL.Text,
    'votes_against' : IDL.Nat,
  });
  return IDL.Service({
    'get_proposal' : IDL.Func([IDL.Nat], [IDL.Opt(Proposal)], []),
    'list_proposals' : IDL.Func([], [IDL.Vec(Proposal)], []),
    'propose_source' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text],
        [IDL.Nat],
        [],
      ),
    'vote_source' : IDL.Func([IDL.Nat, IDL.Bool], [IDL.Text], []),
  });
};
export const init = ({ IDL }) => { return []; };
