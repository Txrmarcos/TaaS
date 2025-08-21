
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import List "mo:base/List";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Option "mo:base/Option";
import Trie "mo:base/Trie";
import Debug "mo:base/Debug";
import Nat32 "mo:base/Nat32";

actor class PostsCanister() {

  // --- TIPOS ---

  public type PostId = Nat;
  public type CommentId = Nat;
  public type UserId = Principal;

  public type TaaSVerification = {
    #Pending;
    #True;
    #False;
    #Uncertain;
  };

  public type Comment = {
    id: CommentId;
    author: UserId;
    text: Text;
    timestamp: Time.Time;
  };

  public type Post = {
    id: PostId;
    author: UserId;
    title: Text;
    subtitle: Text;
    content: Text;
    imageUrl: Text;
    location: Text;
    timestamp: Time.Time;
    likes: [UserId];
    dislikes: [UserId];
    comments: [Comment];
    repostedFrom: ?PostId;
    taasStatus: TaaSVerification;
  };

  // --- ESTADO ESTÁVEL ---

  stable var posts: Trie.Trie<PostId, Post> = Trie.empty();
  stable var nextPostId: PostId = 0;
  stable var nextCommentId: CommentId = 0;

  // --- CONFIG (Canisters externos) ---

  let taasProxyCanisterId = Principal.fromText("h7vld-naaaa-aaaaf-qbgsq-cai"); // SUBSTITUIR PELO ID REAL

  // --- Funções auxiliares ---

  func keyFromNat(n: Nat): Trie.Key<Nat> {
    { key = n; hash = Nat32.fromNat(n % (2**32-1)) }
  };

  func addUnique(list: [UserId], user: UserId): [UserId] {
    if (Array.find<UserId>(list, func(x) { x == user }) != null) {
      return list;
    } else {
      return Array.append(list, [user]);
    }
  };

  func removeUser(list: [UserId], user: UserId): [UserId] {
    return Array.filter<UserId>(list, func(x) { x != user });
  };

  func getPostById(id: PostId): Post {
    switch (Trie.find(posts, keyFromNat(id), Nat.equal)) {
      case (?post) { return post; };
      case null { Debug.trap("Post não encontrado."); };
    }
  };



  public shared(msg) func createPost(title: Text, subtitle: Text, content: Text, imageUrl: Text, location: Text): async Post {
    let caller = msg.caller;

    // if (not await usersCanister.isJournalist(caller)) {
    //   trap("Apenas jornalistas podem publicar notícias.");
    // };

    let postId = nextPostId;
    let newPost: Post = {
      id = postId;
      author = caller;
      title = title;
      subtitle = subtitle;
      content = content;
      imageUrl = imageUrl;
      location = location;
      timestamp = Time.now();
      likes = [];
      dislikes = [];
      comments = [];
      repostedFrom = null;
      taasStatus = #Pending;
    };

    posts := Trie.put(posts, keyFromNat(postId), Nat.equal, newPost).0;
    nextPostId += 1;

    // await taasProxyCanister.requestVerification(postId, content);

    return newPost;
  };

  public shared(msg) func likePost(id: PostId): async () {
    let caller = msg.caller;
    let post = getPostById(id);
    let newLikes = addUnique(post.likes, caller);
    let newDislikes = removeUser(post.dislikes, caller);
    let updatedPost = { post with likes = newLikes; dislikes = newDislikes };
    posts := Trie.put(posts, keyFromNat(id), Nat.equal, updatedPost).0;
  };

  public shared(msg) func dislikePost(id: PostId): async () {
    let caller = msg.caller;
    let post = getPostById(id);
    let newDislikes = addUnique(post.dislikes, caller);
    let newLikes = removeUser(post.likes, caller);
    let updatedPost = { post with dislikes = newDislikes; likes = newLikes };
    posts := Trie.put(posts, keyFromNat(id), Nat.equal, updatedPost).0;
  };

  public shared(msg) func addComment(id: PostId, text: Text): async () {
    let caller = msg.caller;
    let post = getPostById(id);

    let comment: Comment = {
      id = nextCommentId;
      author = caller;
      text = text;
      timestamp = Time.now();
    };
    nextCommentId += 1;

    let updatedComments = Array.append(post.comments, [comment]);
    let updatedPost = { post with comments = updatedComments };
    posts := Trie.put(posts, keyFromNat(id), Nat.equal, updatedPost).0;
  };

  public shared(msg) func updateTaaSStatus(id: PostId, status: TaaSVerification): async () {
    if (msg.caller != taasProxyCanisterId) {
      Debug.trap("Apenas o TaaSProxyCanister pode atualizar o estado de verificação.");
    };

    let post = getPostById(id);
    let updatedPost = { post with taasStatus = status };
    posts := Trie.put(posts, keyFromNat(id), Nat.equal, updatedPost).0;
  };

  public query func getAllPosts(): async [Post] {
  let allPosts = Iter.toArray(Trie.iter(posts));
  let onlyPosts = Array.map<(PostId, Post), Post>(allPosts, func((_, post)) { post });

  return Array.sort<Post>(
    onlyPosts,
    func(a, b) {
      Int.compare(b.timestamp, a.timestamp)
    }
  );
};

  // --- FUNÇÕES QUERY ---

  public shared query func getPost(id: PostId): async Post {
    return getPostById(id);
  };




  public shared query func getPostsByAuthor(author: UserId): async [Post] {
    let allPosts = Iter.toArray(Trie.iter(posts));
    let authorPosts = Array.filter<Post>(
      Array.map<(PostId, Post), Post>(allPosts, func((_, post)) { post }),
      func(post: Post): Bool { post.author == author }
    );
    
    return Array.sort<Post>(
      authorPosts,
      func(a, b) {
        // CORREÇÃO: Compara diretamente os timestamps como Ints
        Int.compare(b.timestamp, a.timestamp)
      }
    );
  };

  public shared query func getPostsCount(): async Nat {
    return Trie.size(posts);
  };

  public shared query func getVerifiedPosts(): async [Post] {
    let allPosts = Iter.toArray(Trie.iter(posts));
    let verifiedPosts = Array.filter<Post>(
      Array.map<(PostId, Post), Post>(allPosts, func((_, post)) { post }),
      func(post: Post): Bool { post.taasStatus != #Pending }
    );
    
    return Array.sort<Post>(
      verifiedPosts,
      func(a, b) {
        // CORREÇÃO: Compara diretamente os timestamps como Ints
        Int.compare(b.timestamp, a.timestamp)
      }
    );
  };
};
