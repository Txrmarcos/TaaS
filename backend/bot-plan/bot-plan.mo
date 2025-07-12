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

actor BotPlanCanister {

  type Tokens = { e8s: Nat };

  let ledger = actor "mxzaz-hqaaa-aaaar-qaada-cai"
    : actor { account_balance: ({ account: LedgerTypes.Account }) -> async Tokens };

  type Plan = { #Standard; #Pro; #Premium };

  type UserStatus = {
    plan: Plan;
    requestsLeft: Nat;
    resetAt: Time.Time;
  };

  stable var users: Trie.Trie<Text, UserStatus> = Trie.empty();

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

  public shared({caller}) func check_balance() : async Nat {
    let subaccount = principalToSubaccount(caller);
    let account : LedgerTypes.Account = {
      owner = Principal.fromText("uxrrr-q7777-77774-qaaaq-cai");
      subaccount = ?Blob.toArray(subaccount);
    };

    let balance = await ledger.account_balance({ account });
    return balance.e8s;
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

  public shared({caller}) func subscribe(plan: Plan) : async Text {

    Debug.print("Iniciando subscribe para caller: " # Principal.toText(caller));

    let callerText = Principal.toText(caller);
    let key : Trie.Key<Text> = { hash = Text.hash(callerText); key = callerText };

    // Verificar se o usuário já tem um plano ativo
    switch (Trie.find(users, key, Text.equal)) {
      case (?existingStatus) {
        let now = Time.now();
        // Se ainda não passou o tempo de reset, o usuário já tem um plano ativo
        if (now < existingStatus.resetAt) {
          Debug.print("Usuário já possui plano ativo: " # debug_show(existingStatus.plan));
          return "⚠️ Você já possui um plano ativo: " # debug_show(existingStatus.plan) # ". Aguarde o reset ou use suas requisições restantes.";
        };
      };
      case (null) {
        // Usuário não possui plano, pode continuar
      };
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
      return "Plano gratuito ativado!";
    };

    let balance = await check_balance();
    Debug.print("Saldo do usuário: " # Nat.toText(balance));

    if (balance >= price_e8s) {
      activatePlan(plan, caller);
      Debug.print("Pagamento confirmado e plano ativado.");
      return "💎 Pagamento confirmado! Plano ativado.";
    } else {
      Debug.print("Saldo insuficiente. Plano não ativado.");
      let subaccount = principalToSubaccount(caller);
      let sub_hex = Blob.toArray(subaccount);
      let sub_hex_text = Array.foldLeft<Nat8, Text>(sub_hex, "", func (acc, b) { acc # Nat8.toText(b) });
      return "⚠️ Saldo insuficiente.\n\nEnvie " # Nat.toText(price_e8s) # " e8s ckBTC para:\n\nPrincipal: YOUR_CANISTER_PRINCIPAL_HERE\nSubaccount: " # sub_hex_text;
    };
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
      return "❌ Você não possui plano ativo.";
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
        return "❌ Limite diário atingido. Tente novamente amanhã!";
      };

      let finalStatus : UserStatus = {
        plan = effectiveStatus.plan;
        requestsLeft = effectiveStatus.requestsLeft - 1;
        resetAt = effectiveStatus.resetAt;
      };

      users := Trie.put(users, key, Text.equal, finalStatus).0;

      let response = await LLM.prompt(#Llama3_1_8B, prompt);

      return "🤖 Resposta do LLM:\n\n" # response # "\n\nRestantes: " # Nat.toText(finalStatus.requestsLeft);
    };
  };
};

};