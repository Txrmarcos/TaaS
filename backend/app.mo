// This file defines the backend service for verifying statements using Motoko on the Internet Computer.

import Time "mo:base/Time";
import Array "mo:base/Array";

import Verdict "logic/veredict";
import Hash "logic/hash";
import Veredict "logic/veredict";

persistent actor TaaS {

  // --- Persistent Storage ---

  stable var storedVeredicts : [(Text, Veredict.Verdict)] = [];

  // --- Main public function to verify a statement and store it ---

  public func verifyStatement(claim : Text) : async Verdict.Verdict {

  let simulated = if (claim.size() % 2 == 0) { #True } else { #False };
  let hash = Hash.calculateHash(claim);

  let verdict : Veredict.Verdict = {
    result = simulated;
    confidence = 0.93;
    source = "https://example.org/source";
    hash = hash;
    timestamp = Time.now();
  };
  
  // Save it
  storedVeredicts := Array.append(storedVeredicts, [(hash, verdict)]);
  return verdict;
  };

  // --- Lookup by hash ---

  public query func getVerdictByHash(hash : Text) : async ?Verdict.Verdict {
    for ((h, v) in storedVeredicts.vals()) {
      if (h == hash) {
        return ?v;
      }
    };
    return null; // Not found
  };
};