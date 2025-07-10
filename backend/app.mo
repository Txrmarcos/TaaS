// This file defines the backend service for verifying statements using Motoko on the Internet Computer.

import Time "mo:base/Time";

persistent actor HelloWorld {

  // Define a variant for the verdict result
  type VerdictResult = {
    #True;
    #False;
    #Unknown;
  };

  // Define the structure of a verdict
  type Verdict = {
    resultado: VerdictResult;
    confidence: Float;
    source: Text;
    hash: Text;
    timestamp: Time.Time;
  };

  // Existing functionality

  // We store the greeting in a stable variable such that it gets persisted over canister upgrades.
  var greeting : Text = "Hello, ";

  // This update method stores the greeting prefix in stable memory.
  public func setGreeting(prefix : Text) : async () {
    greeting := prefix;
  };

  // This query method returns the currently persisted greeting with the given name.
  public query func greet(name : Text) : async Text {
    return greeting # name # "!";
  };

  // New function
  
  //Verifies a factual claim
  public query func verifyStatement(claim : Text) : async Verdict {

    let simulated = if (claim.size() % 2 == 0) { #True } else { #False };

    return {
      resultado = simulated;
      confidence = 0.93;
      source = "https://example.org/source";
      hash = "dummy-hash-0xABC123";
      timestamp = Time.now();
    };
  }
}