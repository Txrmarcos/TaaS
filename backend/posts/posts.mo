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
    #Error;
  };

  // Tipo para o veredito completo do SearchNews
  public type Verdict = {
    result: TaaSVerification;
    source: Text;
    hash: Text;
    timestamp: Time.Time;
    llm_message: Text;
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
    verdict: ?Verdict; // Novo campo para armazenar o veredito completo
  };

  // --- ESTADO ESTÁVEL ---

  stable var posts: Trie.Trie<PostId, Post> = Trie.empty();
  stable var nextPostId: PostId = 0;
  stable var nextCommentId: CommentId = 0;

  // --- CONFIG (Canisters externos) ---

  let searchNewsCanisterId = Principal.fromText("h7vld-naaaa-aaaaf-qbgsq-cai"); // SUBSTITUIR PELO ID REAL

  // Interface para o SearchNews canister
  let searchNewsActor = actor(Principal.toText(searchNewsCanisterId)) : actor {
    searchNews: (Text) -> async {
      result: {#True; #False; #Uncertain; #Error};
      source: Text;
      hash: Text;
      timestamp: Time.Time;
      llm_message: Text;
    };
  };

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

  // Função para converter o resultado do SearchNews para TaaSVerification
  func convertVerdictResult(result: {#True; #False; #Uncertain; #Error}): TaaSVerification {
    switch (result) {
      case (#True) { #True };
      case (#False) { #False };
      case (#Uncertain) { #Uncertain };
      case (#Error) { #Error };
    }
  };

  // Função para solicitar verificação
  func requestVerification(postId: PostId, content: Text): async () {
    try {
      Debug.print("Solicitando verificação para post " # Nat.toText(postId));
      
      let verdictResponse = await searchNewsActor.searchNews(content);
      
      let verdict: Verdict = {
        result = convertVerdictResult(verdictResponse.result);
        source = verdictResponse.source;
        hash = verdictResponse.hash;
        timestamp = verdictResponse.timestamp;
        llm_message = verdictResponse.llm_message;
      };

      // Atualizar o post com o veredito
      let post = getPostById(postId);
      let updatedPost = { 
        post with 
        taasStatus = verdict.result; 
        verdict = ?verdict;
      };
      
      posts := Trie.put(posts, keyFromNat(postId), Nat.equal, updatedPost).0;
      
      Debug.print("Verificação concluída para post " # Nat.toText(postId) # " com resultado: " # debug_show(verdict.result));
      
    } catch (error) {

      let errorVerdict: Verdict = {
        result = #Error;
        source = "";
        hash = "";
        timestamp = Time.now();
        llm_message = "Erro ao processar verificação: ";
      };

      let post = getPostById(postId);
      let updatedPost = { 
        post with 
        taasStatus = #Error; 
        verdict = ?errorVerdict;
      };
      
      posts := Trie.put(posts, keyFromNat(postId), Nat.equal, updatedPost).0;
    };
  };

  public shared(msg) func createPost(title: Text, subtitle: Text, content: Text, imageUrl: Text, location: Text): async Post {
    let caller = msg.caller;

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
      verdict = null; // Inicialmente null
    };

    posts := Trie.put(posts, keyFromNat(postId), Nat.equal, newPost).0;
    nextPostId += 1;

    // Solicitar verificação de forma assíncrona
    ignore requestVerification(postId, content);

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

  // Função para forçar re-verificação de um post
  public shared(msg) func reVerifyPost(id: PostId): async () {
    let post = getPostById(id);
    
    // Resetar status para pending
    let updatedPost = { 
      post with 
      taasStatus = #Pending; 
      verdict = null;
    };
    posts := Trie.put(posts, keyFromNat(id), Nat.equal, updatedPost).0;
    
    // Solicitar nova verificação
    ignore requestVerification(id, post.content);
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
      func(post: Post): Bool { 
        post.taasStatus == #True or post.taasStatus == #False or post.taasStatus == #Uncertain 
      }
    );
    
    return Array.sort<Post>(
      verifiedPosts,
      func(a, b) {
        Int.compare(b.timestamp, a.timestamp)
      }
    );
  };

  // Nova função para obter posts por status de verificação
  public shared query func getPostsByVerificationStatus(status: TaaSVerification): async [Post] {
    let allPosts = Iter.toArray(Trie.iter(posts));
    let filteredPosts = Array.filter<Post>(
      Array.map<(PostId, Post), Post>(allPosts, func((_, post)) { post }),
      func(post: Post): Bool { post.taasStatus == status }
    );
    
    return Array.sort<Post>(
      filteredPosts,
      func(a, b) {
        Int.compare(b.timestamp, a.timestamp)
      }
    );
  };
};