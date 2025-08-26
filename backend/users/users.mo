import Principal "mo:base/Principal";
import Trie "mo:base/Trie";
import Nat32 "mo:base/Nat32";
import List "mo:base/List";
import Debug "mo:base/Debug";

actor class UsersCanister() {

  
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
    firstLogin: Bool; 
  };

  stable var profiles: Trie.Trie<UserId, UserProfile> = Trie.empty();

  
  func keyFromPrincipal(p: Principal): Trie.Key<Principal> {
    { key = p; hash = Principal.hash(p) }
  };


  public shared(msg) func createUser(username: Text, bio: Text, profileImgUrl: Text): async UserProfile {
    let caller = msg.caller;
    let key = keyFromPrincipal(caller);

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
      firstLogin = true;
    };

    profiles := Trie.put(profiles, key, Principal.equal, newUserProfile).0;
    return newUserProfile;
  };

  public shared(msg) func updateProfile(newBio: Text, newProfileImgUrl: Text): async UserProfile {
    let caller = msg.caller;
    let userProfile = await getProfile(caller);

    let updatedProfile = {
      id = userProfile.id;
      username = userProfile.username;
      bio = newBio;
      profileImgUrl = newProfileImgUrl;
      isJournalist = userProfile.isJournalist;
      ownedNewsletters = userProfile.ownedNewsletters;
      subscribedNewsletters = userProfile.subscribedNewsletters;
      firstLogin = userProfile.firstLogin; 
    };

    profiles := Trie.put(profiles, keyFromPrincipal(caller), Principal.equal, updatedProfile).0;
    return updatedProfile;
  };

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
      firstLogin = userProfile.firstLogin;
    };
    profiles := Trie.put(profiles, keyFromPrincipal(caller), Principal.equal, updatedProfile).0;
    return updatedProfile;
  };

  public shared(msg) func subscribeToNewsletter(newsletterId: NewsletterId): async () {
    let caller = msg.caller;
    let userProfile = await getProfile(caller);

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
        firstLogin = userProfile.firstLogin;
      };
      profiles := Trie.put(profiles, keyFromPrincipal(caller), Principal.equal, updatedProfile).0;
    };
  };

  public shared(msg) func addOwnedNewsletter(journalistId: UserId, newsletterId: NewsletterId): async () {
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
          firstLogin = userProfile.firstLogin;
        };
        profiles := Trie.put(profiles, key, Principal.equal, updatedProfile).0;
      };
      case null {
        Debug.trap("Perfil do jornalista não encontrado.");
      };
    };
  };

  public shared(msg) func markFirstLoginDone(): async UserProfile {
    let caller = msg.caller;
    let userProfile = await getProfile(caller);
    if (not userProfile.firstLogin) {
      return userProfile;
    };
    let updatedProfile = {
      id = userProfile.id;
      username = userProfile.username;
      bio = userProfile.bio;
      profileImgUrl = userProfile.profileImgUrl;
      isJournalist = userProfile.isJournalist;
      ownedNewsletters = userProfile.ownedNewsletters;
      subscribedNewsletters = userProfile.subscribedNewsletters;
      firstLogin = false;
    };
    profiles := Trie.put(profiles, keyFromPrincipal(caller), Principal.equal, updatedProfile).0;
    return updatedProfile;
  };

  public shared(msg) func isFirstLogin(): async Bool {
    let caller = msg.caller;
    let key = keyFromPrincipal(caller);

    switch (Trie.find(profiles, key, Principal.equal)) {
        case (?userProfile) {
            if (userProfile.firstLogin) {
                let updatedProfile = {
                    id = userProfile.id;
                    username = userProfile.username;
                    bio = userProfile.bio;
                    profileImgUrl = userProfile.profileImgUrl;
                    isJournalist = userProfile.isJournalist;
                    ownedNewsletters = userProfile.ownedNewsletters;
                    subscribedNewsletters = userProfile.subscribedNewsletters;
                    firstLogin = false;
                };
                profiles := Trie.put(profiles, key, Principal.equal, updatedProfile).0;
                return true;
            } else {
                return false;
            };
        };
        case null {
            return true;
        };
    };
};

  public shared query func getProfile(userId: UserId): async UserProfile {
    switch (Trie.find(profiles, keyFromPrincipal(userId), Principal.equal)) {
      case (?userProfile) { return userProfile; };
      case null { Debug.trap("Perfil de utilizador não encontrado."); };
    };
  };

  public shared query func isJournalist(userId: UserId): async Bool {
    switch (Trie.find(profiles, keyFromPrincipal(userId), Principal.equal)) {
      case (?userProfile) { return userProfile.isJournalist; };
      case null { return false; };
    };
  };
}
