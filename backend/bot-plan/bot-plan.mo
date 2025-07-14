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
  
  // SUA CARTEIRA - SUBSTITUA PELO SEU PRINCIPAL
  private let MY_WALLET_PRINCIPAL = "SEU_PRINCIPAL_AQUI"; // Substitua pelo seu principal
  
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

  // Nova função para transferir pagamento para sua carteira
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
    Debug.print("Iniciando subscribe para caller: " # Principal.toText(caller));

    let callerText = Principal.toText(caller);
    let key : Trie.Key<Text> = { hash = Text.hash(callerText); key = callerText };

    switch (Trie.find(users, key, Text.equal)) {
      case (?existingStatus) {
        let now = Time.now();
        if (now < existingStatus.resetAt) {
          Debug.print("Usuário já possui plano ativo: " # debug_show(existingStatus.plan));
          return "⚠️ Você já possui um plano ativo: " # debug_show(existingStatus.plan) # ". Aguarde o reset ou use suas requisições restantes.";
        };
      };
      case (null) {};
    };

    let price_e8s = switch (plan) {
      case (#Standard) { 0 };
      case (#Pro) { 2_000_000 };
      case (#Premium) { 10_000_000 };
    };

    Debug.print("Plano escolhido: " # debug_show(plan) # ", Preço (e8s): " # Nat.toText(price_e8s));

    if (price_e8s == 0) {
      activatePlan(plan, caller);
      Debug.print("Plano gratuito ativado com sucesso para " # Principal.toText(caller));
      return "✅ Plano gratuito ativado!";
    };

    // Verificar saldo atual
    let balance = await checkUserBalance(caller);
    Debug.print("Saldo do usuário: " # Nat.toText(balance));

    let totalRequired = price_e8s + TRANSFER_FEE;
    
    if (balance >= totalRequired) {
      let transferResult = await transferPayment(caller, price_e8s);
      
      switch (transferResult) {
        case (#ok(blockIndex)) {
          activatePlan(plan, caller);
          Debug.print("💰 PAGAMENTO RECEBIDO! Transferido para sua carteira. Block: " # Nat.toText(blockIndex));
          return "💎 Pagamento processado automaticamente! Plano " # debug_show(plan) # " ativado!\n🧾 Transação: " # Nat.toText(blockIndex) # "\n💰 Valor transferido para sua carteira!";
        };
        case (#err(errorMsg)) {
          Debug.print("Erro na transferência automática: " # errorMsg);
          return "❌ Erro ao processar pagamento automático: " # errorMsg # "\nVerifique se você tem saldo suficiente e tente novamente.";
        };
      };
    } else {
      // Instruções para o usuário depositar
      let subaccount = principalToSubaccount(caller);
      let sub_hex = Blob.toArray(subaccount);
      let sub_hex_text = Array.foldLeft<Nat8, Text>(
        sub_hex,
        "",
        func (acc, b) {
          acc # (if (b < 16) { "0" } else { "" }) # Nat8.toText(b)
        }
      );
      return "⚠️ Saldo insuficiente para ativação automática.\n\n📋 INSTRUÇÕES:\n1️⃣ Envie " # Nat.toText(totalRequired) # " e8s ckBTC para:\n\n🏦 Principal: dkwk6-4aaaa-aaaaf-qbbxa-cai\n📋 Subaccount: " # sub_hex_text # "\n\n2️⃣ Após o depósito, chame novamente subscribe(" # debug_show(plan) # ")\n3️⃣ O pagamento será transferido automaticamente para o desenvolvedor\n4️⃣ Seu plano será ativado instantaneamente!\n\n💰 Saldo atual: " # Nat.toText(balance) # " e8s\n💎 Necessário: " # Nat.toText(totalRequired) # " e8s";
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

    users := Trie.put<Text, UserStatus>(users, key, Text.equal, newStatus).0;
  };

  public shared({caller}) func use_request() : async Bool {
    let callerText = Principal.toText(caller);
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

  public shared query({caller}) func get_user_status() : async ?UserStatus {
    let callerText = Principal.toText(caller);
    let key : Trie.Key<Text> = { hash = Text.hash(callerText); key = callerText };
    Trie.find(users, key, Text.equal)
  };

  public shared({caller}) func prompt(prompt: Text): async Text {
    let callerText = Principal.toText(caller);
    let key : Trie.Key<Text> = {
      hash = Text.hash(callerText);
      key = callerText;
    };

    switch (Trie.find(users, key, Text.equal)) {
      case (null) {
        return "❌ Você não possui plano ativo. Use a função 'subscribe' para ativar um plano.";
      };
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
          return "❌ Limite diário atingido para o plano " # debug_show(effectiveStatus.plan) # ". Tente novamente amanhã ou faça upgrade do seu plano!";
        };

        let finalStatus : UserStatus = {
          plan = effectiveStatus.plan;
          requestsLeft = effectiveStatus.requestsLeft - 1;
          resetAt = effectiveStatus.resetAt;
        };

        users := Trie.put(users, key, Text.equal, finalStatus).0;

        try {
          let response = await LLM.prompt(#Llama3_1_8B, prompt);
          return "🤖 Resposta do LLM:\n\n" # response # "\n\n📊 Plano: " # debug_show(finalStatus.plan) # " | Restantes: " # Nat.toText(finalStatus.requestsLeft);
        } catch (error) {
          // Reverter o contador se houve erro
          let revertStatus : UserStatus = {
            plan = effectiveStatus.plan;
            requestsLeft = effectiveStatus.requestsLeft;
            resetAt = effectiveStatus.resetAt;
          };
          users := Trie.put(users, key, Text.equal, revertStatus).0;
          
          return "❌ Erro ao processar sua solicitação. Tente novamente. Erro: ";
        };
      };
    };
  };


};