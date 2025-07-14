import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Principal "mo:base/Principal";
import Time "mo:base/Time";

actor RoundtableCanister {

  type ProposalStatus = {
    #Pending;
    #Approved;
    #Rejected;
  };

  type Proposal = {
    id: Nat;
    name: Text;
    url: Text;
    pr_link: Text;
    description: Text;
    proposer: Principal;
    created_at: Time.Time;
    votes_for: Nat;
    votes_against: Nat;
    status: ProposalStatus;
    voters: [Principal];
  };

  stable var proposals: [Proposal] = [];
  stable var nextId: Nat = 0;

  public func propose_source(name: Text, url: Text, pr_link: Text, description: Text): async Nat {
    let caller = Principal.fromActor(RoundtableCanister);

    let newProposal: Proposal = {
      id = nextId;
      name = name;
      url = url;
      pr_link = pr_link;
      description = description;
      proposer = caller;
      created_at = Time.now();
      votes_for = 0;
      votes_against = 0;
      status = #Pending;
      voters = [];
    };

    proposals := Array.append(proposals, [newProposal]);
    nextId += 1;
    return newProposal.id;
  };

  public func vote_source(id: Nat, is_for: Bool): async Text {
    let caller = Principal.fromActor(RoundtableCanister);

    let optProposal = Array.find<Proposal>(proposals, func(p) { p.id == id });

    switch (optProposal) {
      case (null) { return "Proposta não encontrada."; };
      case (?proposal) {
        if (Array.find<Principal>(proposal.voters, func(v) { Principal.equal(v, caller) }) != null) {
          return "Você já votou nesta proposta.";
        };

        var updatedVotesFor = proposal.votes_for;
        var updatedVotesAgainst = proposal.votes_against;

        if (is_for) {
          updatedVotesFor += 1;
        } else {
          updatedVotesAgainst += 1;
        };

        let newStatus =
          if (updatedVotesFor >= 10) { #Approved }
          else if (updatedVotesAgainst >= 10) { #Rejected }
          else { #Pending };

        let newVoters = Array.append(proposal.voters, [caller]);

        let updatedProposal: Proposal = {
          id = proposal.id;
          name = proposal.name;
          url = proposal.url;
          pr_link = proposal.pr_link; 
          description = proposal.description;
          proposer = proposal.proposer;
          created_at = proposal.created_at;
          votes_for = updatedVotesFor;
          votes_against = updatedVotesAgainst;
          status = newStatus;
          voters = newVoters;
        };

        proposals := Array.map<Proposal, Proposal>(proposals, func(p) {
          if (p.id == id) { updatedProposal } else { p }
        });

        return "Voto registrado com sucesso!";
      };
    };
  };

  public func list_proposals(): async [Proposal] {
    return proposals;
  };

  public func get_proposal(id: Nat): async ?Proposal {
    let optProposal = Array.find<Proposal>(proposals, func(p) { p.id == id });
    return optProposal;
  };
};
