// NewslettersCanister.mo
// Este canister gere a criação, gestão e descoberta de newsletters.
// Refatorado para usar Trie para armazenamento estável.

import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import List "mo:base/List";
import Trie "mo:base/Trie";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Nat32 "mo:base/Nat32";

actor class NewslettersCanister() {

  // --- TIPOS DEFINIDOS LOCALMENTE ---
  
  public type NewsletterId = Nat;
  public type UserId = Principal;

  public type Newsletter = {
    id: NewsletterId;
    owner: UserId;
    title: Text;
    description: Text;
    coverImgUrl: Text;
    subscribersCount: Nat;
  };

  // --- ESTADO ESTÁVEL ---
  // Usando Trie para armazenamento estável, que persiste durante as atualizações.
  stable var newsletters: Trie.Trie<NewsletterId, Newsletter> = Trie.empty();
  stable var nextNewsletterId: NewsletterId = 0;

  // --- CONFIG (Canisters externos) ---
  // Assume-se que o ID do UsersCanister é conhecido.
  let usersCanisterId = Principal.fromText("aaaaa-aa"); // SUBSTITUIR PELO ID REAL
  transient let usersCanister = actor(Principal.toText(usersCanisterId)) : actor {
    isJournalist: (UserId) -> async Bool;
    addOwnedNewsletter: (UserId, NewsletterId) -> async ();
    subscribeToNewsletter: (NewsletterId) -> async ();
  };

  // --- Funções Auxiliares ---
  func keyFromNat(n: Nat): Trie.Key<Nat> {
    { key = n; hash = Nat32.fromNat(n % (2**32 - 1)) }
  };

  // --- Funções Públicas (Atualizações - `update`) ---

  // Cria uma nova newsletter.
  public shared(msg) func createNewsletter(title: Text, description: Text, coverImgUrl: Text): async Newsletter {
    let caller = msg.caller;

    // Verifica se o chamador é um jornalista registado.
    let isJournalist = await usersCanister.isJournalist(caller);
    if (not isJournalist) {
      Debug.trap("Apenas jornalistas podem criar newsletters.");
    };

    let newId = nextNewsletterId;
    let newNewsletter: Newsletter = {
      id = newId;
      owner = caller;
      title = title;
      description = description;
      coverImgUrl = coverImgUrl;
      subscribersCount = 0;
    };

    newsletters := Trie.put(newsletters, keyFromNat(newId), Nat.equal, newNewsletter).0;
    nextNewsletterId += 1;

    // Informa o UsersCanister que este jornalista agora possui uma nova newsletter.
    await usersCanister.addOwnedNewsletter(caller, newId);

    return newNewsletter;
  };

  // Regista uma subscrição.
  public shared(msg) func subscribe(id: NewsletterId): async () {
    let newsletter = await getNewsletter(id); // Reutiliza a função de consulta

    // Atualiza o contador de subscritores.
    let updatedNewsletter = {
      id = newsletter.id;
      owner = newsletter.owner;
      title = newsletter.title;
      description = newsletter.description;
      coverImgUrl = newsletter.coverImgUrl;
      subscribersCount = newsletter.subscribersCount + 1;
    };
    newsletters := Trie.put(newsletters, keyFromNat(id), Nat.equal, updatedNewsletter).0;

    // Chama o UsersCanister para registar a subscrição no perfil do utilizador.
    await usersCanister.subscribeToNewsletter(id);
  };

  // --- Funções Públicas (Consultas - `query`) ---

  // ✅ Tornada pública para evitar o erro [M0126]
  public shared query func getNewsletter(id: NewsletterId): async Newsletter {
    switch (Trie.find(newsletters, keyFromNat(id), Nat.equal)) {
      case (?newsletter) { return newsletter; };
      case null { Debug.trap("Newsletter não encontrada."); };
    };
  };

  // Retorna uma lista das newsletters mais populares (ordenadas por subscritores).
  public shared query func getTopNewsletters(count: Nat): async [Newsletter] {
  // Converte os valores do Trie para um Array.
  let allEntries = Iter.toArray(Trie.iter(newsletters));
  let allNewsletters = Array.map<(NewsletterId, Newsletter), Newsletter>(
    allEntries,
    func((_, newsletter)) { newsletter }
  );

  // Corrigido: `Array.sort` retorna [Newsletter], então não use Iter.toArray aqui.
  let sortedNewsletters = Array.sort<Newsletter>(
    allNewsletters,
    func(a, b) { Nat.compare(b.subscribersCount, a.subscribersCount) }
  );

  // Retorna uma fatia do array já ordenado.
  return Array.subArray<Newsletter>(sortedNewsletters, 0, count);
};
}
