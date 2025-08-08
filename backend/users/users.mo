// UsersCanister.mo
// Este canister é responsável por gerir perfis de utilizadores, incluindo o seu estado
// como jornalista e as suas subscrições de newsletters.
// Refatorado para usar Trie para armazenamento estável.

import Principal "mo:base/Principal";
import Trie "mo:base/Trie";
import Nat32 "mo:base/Nat32";
import List "mo:base/List";
import Debug "mo:base/Debug";

actor class UsersCanister() {

  // --- TIPOS DEFINIDOS LOCALMENTE ---
  
  public type NewsletterId = Nat;
  public type UserId = Principal;

  public type UserProfile = {
    id: UserId;
    username: Text;
    bio: Text;
    profileImgUrl: Text;
    isJournalist: Bool;
    ownedNewsletters: [NewsletterId];
    subscribedNewsletters: [NewsletterId];
  };

  // --- ESTADO ESTÁVEL ---
  // Usamos Trie para garantir que os dados persistam durante as atualizações do canister.
  stable var profiles: Trie.Trie<UserId, UserProfile> = Trie.empty();

  // --- Funções Auxiliares ---
  
  // Cria uma chave para o Trie a partir de um Principal.
  func keyFromPrincipal(p: Principal): Trie.Key<Principal> {
    { key = p; hash = Principal.hash(p) }
  };

  // --- Funções Públicas (Atualizações - `update`) ---

  // Cria um novo perfil de utilizador.
  public shared(msg) func createUser(username: Text, bio: Text, profileImgUrl: Text): async UserProfile {
    let caller = msg.caller;
    let key = keyFromPrincipal(caller);

    // Verifica se o utilizador já existe.
    if (Trie.find(profiles, key, Principal.equal) != null) {
      Debug.trap("Este utilizador já possui um perfil.");
    };

    let newUserProfile: UserProfile = {
      id = caller;
      username = username;
      bio = bio;
      profileImgUrl = profileImgUrl;
      isJournalist = false;
      ownedNewsletters = [];
      subscribedNewsletters = [];
    };

    profiles := Trie.put(profiles, key, Principal.equal, newUserProfile).0;
    return newUserProfile;
  };

  // Permite a um utilizador atualizar o seu perfil.
  public shared(msg) func updateProfile(newBio: Text, newProfileImgUrl: Text): async UserProfile {
    let caller = msg.caller;
    let userProfile = await getProfile(caller); // Reutiliza a função de consulta

    let updatedProfile = {
      id = userProfile.id;
      username = userProfile.username;
      bio = newBio;
      profileImgUrl = newProfileImgUrl;
      isJournalist = userProfile.isJournalist;
      ownedNewsletters = userProfile.ownedNewsletters;
      subscribedNewsletters = userProfile.subscribedNewsletters;
    };

    profiles := Trie.put(profiles, keyFromPrincipal(caller), Principal.equal, updatedProfile).0;
    return updatedProfile;
  };

  // Regista o utilizador como jornalista.
  public shared(msg) func registerAsJournalist(): async UserProfile {
    let caller = msg.caller;
    let userProfile = await getProfile(caller);

    if (userProfile.isJournalist) {
      Debug.trap("O utilizador já é um jornalista.");
    };

    let updatedProfile = {
      id = userProfile.id;
      username = userProfile.username;
      bio = userProfile.bio;
      profileImgUrl = userProfile.profileImgUrl;
      isJournalist = true;
      ownedNewsletters = userProfile.ownedNewsletters;
      subscribedNewsletters = userProfile.subscribedNewsletters;
    };
    profiles := Trie.put(profiles, keyFromPrincipal(caller), Principal.equal, updatedProfile).0;
    return updatedProfile;
  };

  // Subscreve o utilizador a uma newsletter.
  public shared(msg) func subscribeToNewsletter(newsletterId: NewsletterId): async () {
    let caller = msg.caller;
    let userProfile = await getProfile(caller);

    // Adiciona o ID da newsletter à lista de subscrições, evitando duplicados.
    if (List.find<NewsletterId>(List.fromArray<NewsletterId>(userProfile.subscribedNewsletters), func(x) { x == newsletterId }) == null) {
      let subscriptionsList = List.fromArray<NewsletterId>(userProfile.subscribedNewsletters);
      let updatedSubscriptionsList = List.push<NewsletterId>(newsletterId, subscriptionsList);
      let updatedSubscriptions = List.toArray<NewsletterId>(updatedSubscriptionsList);
      let updatedProfile = {
        id = userProfile.id;
        username = userProfile.username;
        bio = userProfile.bio;
        profileImgUrl = userProfile.profileImgUrl;
        isJournalist = userProfile.isJournalist;
        ownedNewsletters = userProfile.ownedNewsletters;
        subscribedNewsletters = updatedSubscriptions;
      };
      profiles := Trie.put(profiles, keyFromPrincipal(caller), Principal.equal, updatedProfile).0;
    };
  };

  // Adiciona uma newsletter criada à lista de newsletters do jornalista.
  public shared(msg) func addOwnedNewsletter(journalistId: UserId, newsletterId: NewsletterId): async () {
    // Validação de segurança: apenas canisters autorizados podem chamar isto.
    let key = keyFromPrincipal(journalistId);
    switch (Trie.find(profiles, key, Principal.equal)) {
      case (?userProfile) {
        if (not userProfile.isJournalist) {
          Debug.trap("Apenas jornalistas podem possuir newsletters.");
        };
        let ownedList = List.fromArray<NewsletterId>(userProfile.ownedNewsletters);
        let updatedOwnedList = List.push<NewsletterId>(newsletterId, ownedList);
        let updatedOwned = List.toArray<NewsletterId>(updatedOwnedList);
        let updatedProfile = {
          id = userProfile.id;
          username = userProfile.username;
          bio = userProfile.bio;
          profileImgUrl = userProfile.profileImgUrl;
          isJournalist = userProfile.isJournalist;
          ownedNewsletters = updatedOwned;
          subscribedNewsletters = userProfile.subscribedNewsletters;
        };
        profiles := Trie.put(profiles, key, Principal.equal, updatedProfile).0;
      };
      case null {
        Debug.trap("Perfil do jornalista não encontrado.");
      };
    };
  };

  // --- Funções Públicas (Consultas - `query`) ---

  // Obtém o perfil de um utilizador.
  public shared query func getProfile(userId: UserId): async UserProfile {
    switch (Trie.find(profiles, keyFromPrincipal(userId), Principal.equal)) {
      case (?userProfile) { return userProfile; };
      case null { Debug.trap("Perfil de utilizador não encontrado."); };
    };
  };

  // Verifica se um utilizador é jornalista.
  public shared query func isJournalist(userId: UserId): async Bool {
    switch (Trie.find(profiles, keyFromPrincipal(userId), Principal.equal)) {
      case (?userProfile) { return userProfile.isJournalist; };
      case null { return false; };
    };
  };
}
