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
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";

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

  // Interface para o Cycles Minting Canister
  let cycles_minting_canister = actor "rkp4c-7iaaa-aaaah-qc7pq-cai" : actor {
    notify_top_up: ({
      block_index: Nat64;
      canister_id: Principal;
    }) -> async Result.Result<Nat, Text>;
  };

  type Plan = { #Standard; #Pro; #Premium };

  type UserStatus = {
    plan: Plan;
    requestsLeft: Nat;
    resetAt: Time.Time;
  };

  stable var users: Trie.Trie<Text, UserStatus> = Trie.empty();
  
  private let MY_WALLET_PRINCIPAL = "7bikl-yrjtx-w6ib3-loqyc-buozt-ubb2o-vhkdb-vlmnz-jhyoo-5qiuc-5qe";
  private let TARGET_CANISTER_PRINCIPAL = "dkwk6-4aaaa-aaaaf-qbbxa-cai"; // Canister fixo que vai receber os ciclos
  private let TRANSFER_FEE = 10;
  private let CMC_PRINCIPAL = "rkp4c-7iaaa-aaaah-qc7pq-cai"; // Cycles Minting Canister

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

  // Transfere 50% para sua wallet
  private func transferToWallet(caller: Principal, amount: Nat) : async Result.Result<Nat, Text> {
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
          Debug.print("Transfer to wallet successful! Block index: " # Nat.toText(blockIndex));
          #ok(blockIndex)
        };
        case (#err(error)) {
          Debug.print("Transfer to wallet failed: " # debug_show(error));
          #err("Transfer to wallet failed: " # debug_show(error))
        };
      };
    } catch (error) {
      Debug.print("Transfer to wallet error occurred");
      #err("Transfer to wallet error occurred");
    };
  };

  // Transfere 50% para o CMC para comprar ciclos para o canister fixo
  private func transferForCycles(caller: Principal, amount: Nat) : async Result.Result<Nat, Text> {
    let subaccount = principalToSubaccount(caller);
    let targetCanister = Principal.fromText(TARGET_CANISTER_PRINCIPAL);
    
    let cmcAccount : LedgerTypes.Account = {
      owner = Principal.fromText(CMC_PRINCIPAL);
      subaccount = ?Blob.toArray(principalToSubaccount(targetCanister));
    };

    let transferArgs = {
      from_subaccount = ?subaccount;
      to = cmcAccount;
      amount = amount;
      fee = ?TRANSFER_FEE;
      memo = null;
      created_at_time = null;
    };

    try {
      let result = await ledger.icrc1_transfer(transferArgs);
      switch (result) {
        case (#ok(blockIndex)) {
          Debug.print("Transfer for cycles successful! Block index: " # Nat.toText(blockIndex) # " Target: " # TARGET_CANISTER_PRINCIPAL);
          
          // Notifica o CMC para converter ICP em ciclos para o canister fixo
          try {
            let topUpResult = await cycles_minting_canister.notify_top_up({
              block_index = Nat64.fromNat(blockIndex);
              canister_id = targetCanister;
            });
            
            switch (topUpResult) {
              case (#ok(cycles)) {
                Debug.print("Top-up successful! Cycles received: " # Nat.toText(cycles) # " for canister: " # TARGET_CANISTER_PRINCIPAL);
                #ok(blockIndex)
              };
              case (#err(error)) {
                Debug.print("Top-up failed for " # TARGET_CANISTER_PRINCIPAL # ": " # error);
                #err("Top-up failed for " # TARGET_CANISTER_PRINCIPAL # ": " # error)
              };
            };
          } catch (error) {
            Debug.print("Error notifying CMC for top-up to " # TARGET_CANISTER_PRINCIPAL);
            #err("Error notifying CMC for top-up to " # TARGET_CANISTER_PRINCIPAL);
          };
        };
        case (#err(error)) {
          Debug.print("Transfer for cycles failed: " # debug_show(error));
          #err("Transfer for cycles failed: " # debug_show(error))
        };
      };
    } catch (error) {
      Debug.print("Transfer for cycles error occurred");
      #err("Transfer for cycles error occurred");
    };
  };

  // Função principal para processar pagamento dividido
  private func processSplitPayment(caller: Principal, totalAmount: Nat) : async Result.Result<(Nat, Nat), Text> {
    let halfAmount = totalAmount / 2;
    
    Debug.print("Processing split payment - Total: " # Nat.toText(totalAmount) # ", Half: " # Nat.toText(halfAmount) # ", Target: " # TARGET_CANISTER_PRINCIPAL);
    
    // Transfere 50% para sua wallet
    let walletResult = await transferToWallet(caller, halfAmount);
    let walletBlockIndex = switch (walletResult) {
      case (#ok(blockIndex)) { blockIndex };
      case (#err(error)) { 
        return #err("Erro na transferência para wallet: " # error);
      };
    };
    
    // Transfere 50% para comprar ciclos para o canister fixo
    let cyclesResult = await transferForCycles(caller, halfAmount);
    let cyclesBlockIndex = switch (cyclesResult) {
      case (#ok(blockIndex)) { blockIndex };
      case (#err(error)) { 
        return #err("Erro na transferência para ciclos: " # error);
      };
    };
    
    #ok(walletBlockIndex, cyclesBlockIndex)
  };

  public shared({caller}) func check_balance() : async Nat {
    await checkUserBalance(caller)
  };

  // Função para verificar o saldo de ciclos do canister fixo
  public func get_target_cycles_balance() : async ?Nat {
    try {
      let canister = actor(TARGET_CANISTER_PRINCIPAL) : actor {
        wallet_balance: query () -> async Nat;
      };
      let balance = await canister.wallet_balance();
      ?balance
    } catch (error) {
      Debug.print("Error fetching cycles balance for " # TARGET_CANISTER_PRINCIPAL);
      null
    }
  };

  // Função pública para mostrar qual canister está configurado para receber ciclos
  public query func get_target_canister() : async Text {
    TARGET_CANISTER_PRINCIPAL
  };

  public shared({caller}) func subscribe(plan: Plan) : async Text {
    let callerText = Principal.toText(caller);
    let key : Trie.Key<Text> = { hash = Text.hash(callerText); key = callerText };

    switch (Trie.find(users, key, Text.equal)) {
      case (?existingStatus) {
        let now = Time.now();
        if (now < existingStatus.resetAt) {
          switch (existingStatus.plan, plan) {
            case (#Standard, #Standard) { return "⚠️ Plano Standard já ativo!" };
            case (#Pro, #Pro) { return "⚠️ Plano Pro já ativo!" };
            case (#Premium, #Premium) { return "⚠️ Plano Premium já ativo!" };
            case (_, _) { 
              Debug.print("Mudança de plano: " # debug_show(existingStatus.plan) # " -> " # debug_show(plan));
            };
          };
        };
      };
      case (null) {};
    };

    let price_e8s = switch (plan) {
      case (#Standard) { 0 };
      case (#Pro) { 2_000_0 };
      case (#Premium) { 10_000_0 };
    };

    if (price_e8s == 0) {
      activatePlan(plan, caller);
      return "✅ Plano Standard ativado!";
    };

    let balance = await checkUserBalance(caller);
    let totalRequired = price_e8s + (TRANSFER_FEE * 2); // Taxa para ambas as transferências
    
    if (balance >= totalRequired) {
      let splitResult = await processSplitPayment(caller, price_e8s);
      
      switch (splitResult) {
        case (#ok(walletBlock, cyclesBlock)) {
          activatePlan(plan, caller);
          return "💎 Plano " # debug_show(plan) # " ativado!\n" # 
                 "🏦 Wallet: " # Nat.toText(walletBlock) # "\n" #
                 "⚡ Ciclos para " # TARGET_CANISTER_PRINCIPAL # ": " # Nat.toText(cyclesBlock);
        };
        case (#err(errorMsg)) {
          return "❌ Erro no pagamento dividido: " # errorMsg;
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