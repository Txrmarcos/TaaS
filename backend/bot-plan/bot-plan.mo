import LedgerTypes "mo:ckbtc-types/ledger";
import Principal "mo:base/Principal";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Trie "mo:base/Trie";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Nat8 "mo:base/Nat8";
import LLM "mo:llm";
import Debug "mo:base/Debug";
import Result "mo:base/Result";

actor BotPlanCanister {

  type Tokens = Nat;

  let ledger = actor "mc6ru-gyaaa-aaaar-qaaaq-cai" : actor {
    icrc1_balance_of: query ({ account: LedgerTypes.Account }) -> async Nat;
    icrc1_transfer: ({ 
      from_subaccount: ?Blob;
      to: LedgerTypes.Account;
      amount: Nat;
      fee: ?Nat;
      memo: ?Blob;
      created_at_time: ?Nat64;
    }) -> async Result.Result<Nat, LedgerTypes.TransferError>;
  };

  type Plan = { #Standard; #Pro; #Premium };

  type UserStatus = {
    plan: Plan;
    requestsLeft: Nat;
    resetAt: Time.Time;
  };

  stable var users: Trie.Trie<Text, UserStatus> = Trie.empty();
  
  private let MY_WALLET_PRINCIPAL = "YOUR_ACTUAL_PRINCIPAL_HERE";
  private let TRANSFER_FEE = 10;

  func getQuota(p: Plan): Nat {
    switch (p) {
      case (#Standard) { 5 };
      case (#Pro) { 50 };
      case (#Premium) { 500 };
    }
  };

  func principalToSubaccount(p: Principal): Blob {
    let bytes = Principal.toBlob(p);
    let padded = Array.tabulate<Nat8>(32, func i {
      if (i < bytes.size()) { bytes[i] } else { 0 };
    });
    Blob.fromArray(padded);
  };

  private func checkUserBalance(caller: Principal) : async Nat {
    let subaccount = principalToSubaccount(caller);
    let account : LedgerTypes.Account = {
      owner = Principal.fromText("dkwk6-4aaaa-aaaaf-qbbxa-cai");
      subaccount = ?Blob.toArray(subaccount);
    };

    Debug.print("Checking balance for account: " # debug_show(account));
    try {
      let balance = await ledger.icrc1_balance_of({ account });
      Debug.print("Balance received: " # Nat.toText(balance));
      return balance;
    } catch (_error) {
      Debug.print("Error fetching balance from ledger");
      return 0;
    };
  };

  private func transferPayment(caller: Principal, amount: Nat) : async Result.Result<Nat, Text> {
    let subaccount = principalToSubaccount(caller);
    
    let myAccount : LedgerTypes.Account = {
      owner = Principal.fromText(MY_WALLET_PRINCIPAL);
      subaccount = null;
    };

    let transferArgs = {
      from_subaccount = ?subaccount;
      to = myAccount;
      amount = amount;
      fee = ?TRANSFER_FEE;
      memo = null;
      created_at_time = null;
    };

    try {
      let result = await ledger.icrc1_transfer(transferArgs);
      switch (result) {
        case (#ok(blockIndex)) {
          Debug.print("Transfer successful! Block index: " # Nat.toText(blockIndex));
          #ok(blockIndex)
        };
        case (#err(error)) {
          Debug.print("Transfer failed: " # debug_show(error));
          #err("Transfer failed: " # debug_show(error))
        };
      };
    } catch (error) {
      Debug.print("Transfer error occurred");
      #err("Transfer error occurred");
    };
  };

  public shared({caller}) func check_balance() : async Nat {
    await checkUserBalance(caller)
  };

  public shared({caller}) func subscribe(plan: Plan) : async Text {
    let callerText = Principal.toText(caller);
    let key : Trie.Key<Text> = { hash = Text.hash(callerText); key = callerText };

    switch (Trie.find(users, key, Text.equal)) {
      case (?existingStatus) {
        let now = Time.now();
        if (now < existingStatus.resetAt) {
          return "⚠️ Você já possui um plano ativo: " # debug_show(existingStatus.plan);
        };
      };
      case (null) {};
    };

    let price_e8s = switch (plan) {
      case (#Standard) { 0 };
      case (#Pro) { 2_000_000 };
      case (#Premium) { 10_000_000 };
    };

    if (price_e8s == 0) {
      activatePlan(plan, caller);
      return "✅ Plano gratuito ativado!";
    };

    let balance = await checkUserBalance(caller);
    let totalRequired = price_e8s + TRANSFER_FEE;
    
    if (balance >= totalRequired) {
      let transferResult = await transferPayment(caller, price_e8s);
      
      switch (transferResult) {
        case (#ok(blockIndex)) {
          activatePlan(plan, caller);
          return "💎 Pagamento processado! Plano ativado. Transação: " # Nat.toText(blockIndex);
        };
        case (#err(errorMsg)) {
          return "❌ Erro ao transferir: " # errorMsg;
        };
      };
    } else {
      let subaccount = principalToSubaccount(caller);
      let sub_hex = Blob.toArray(subaccount);
      let sub_hex_text = Array.foldLeft<Nat8, Text>(
        sub_hex,
        "",
        func (acc, b) {
          acc # (if (b < 16) { "0" } else { "" }) # Nat8.toText(b)
        }
      );
      return "⚠️ Saldo insuficiente.\nEnvie " # Nat.toText(totalRequired) # " e8s para dkwk6-4aaaa-aaaaf-qbbxa-cai\nSubaccount: " # sub_hex_text;
    };
  };

  func activatePlan(plan: Plan, caller: Principal) {
    let quota = getQuota(plan);
    let resetTime = Time.now() + (24 * 60 * 60 * 1_000_000_000);

    let newStatus : UserStatus = {
      plan = plan;
      requestsLeft = quota;
      resetAt = resetTime;
    };

    let callerText = Principal.toText(caller);
    let key : Trie.Key<Text> = { hash = Text.hash(callerText); key = callerText };

    users := Trie.put(users, key, Text.equal, newStatus).0;
  };

  public shared({caller}) func get_user_status() : async ?UserStatus {
    let callerText = Principal.toText(caller);
    let key : Trie.Key<Text> = { hash = Text.hash(callerText); key = callerText };

    switch (Trie.find(users, key, Text.equal)) {
      case (?status) { 
        let now = Time.now();
        if (now >= status.resetAt) {
          let resetStatus : UserStatus = {
            plan = status.plan;
            requestsLeft = getQuota(status.plan);
            resetAt = now + (24 * 60 * 60 * 1_000_000_000);
          };
          users := Trie.put(users, key, Text.equal, resetStatus).0;
          return ?resetStatus;
        };
        return ?status;
      };
      case (null) {
        let quota = getQuota(#Standard);
        let resetTime = Time.now() + (24 * 60 * 60 * 1_000_000_000);
        let newStatus : UserStatus = {
          plan = #Standard;
          requestsLeft = quota;
          resetAt = resetTime;
        };
        users := Trie.put(users, key, Text.equal, newStatus).0;
        return ?newStatus;
      };
    };
  };


  public shared func use_request_for(p: Principal) : async Bool {
    let callerText = Principal.toText(p);
    let key : Trie.Key<Text> = { hash = Text.hash(callerText); key = callerText };

    switch (Trie.find(users, key, Text.equal)) {
      case (null) { return false };
      case (?status) {
        let now = Time.now();
        var effectiveStatus = if (now >= status.resetAt) {
          {
            plan = status.plan;
            requestsLeft = getQuota(status.plan);
            resetAt = now + (24 * 60 * 60 * 1_000_000_000);
          }
        } else {
          status
        };

        if (effectiveStatus.requestsLeft == 0) {
          return false;
        };

        let finalStatus : UserStatus = {
          plan = effectiveStatus.plan;
          requestsLeft = effectiveStatus.requestsLeft - 1;
          resetAt = effectiveStatus.resetAt;
        };

        users := Trie.put(users, key, Text.equal, finalStatus).0;

        return true;
      };
    };
  };

};