import Debug "mo:base/Debug";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Option "mo:base/Option";
import IC "ic:aaaaa-aa";
import JSON "mo:serde/JSON";
import LLM "mo:llm";
import Iter "mo:base/Iter";
import Error "mo:base/Error";
import Cycles "mo:base/ExperimentalCycles";
import Time "mo:base/Time";
import Timer "mo:base/Timer";

actor SearchNews {

  // Rate limiting
  stable var lastRequestTime : Int = 0;
  let MIN_REQUEST_INTERVAL : Int = 3_000_000_000; // 3 segundos em nanosegundos

  // Lista de servidores alternativos
  let searchServers : [Text] = [
    "searx.perennialte.ch",
    "searx.be",
    "search.sapti.me",
    "searx.tiekoetter.com"
  ];

  stable var currentServerIndex : Nat = 0;

  public shared query func transform(args: {
    context : Blob;
    response : IC.http_request_result;
  }) : async IC.http_request_result {
    {
      args.response with headers = [];
    };
  };

  type NewsResult = {
    title: Text;
    url: Text;
    content: Text;
  };

  type SearchResult = {
    results: [NewsResult];
  };

  // TODO: Replace with your actual BotPlanCanister ID
  let botPlanCanister = actor("dkwk6-4aaaa-aaaaf-qbbxa-cai") : actor {
    use_request_for : (Principal) -> async Bool;
  };

  // Whitelist dinâmica - começa com domínios padrão
  stable var whitelist : [Text] = [
    "bbc.com", "cnn.com", "reuters.com", "nytimes.com", "globo.com",
    "brave.news"
  ];

  public func addToWhitelist(domain: Text): async Bool {
    if (Array.find<Text>(whitelist, func(d) { Text.equal(d, domain) }) != null) {
      Debug.print("⚠️ Domain already in whitelist: " # domain);
      return true;
    };
    
    whitelist := Array.append(whitelist, [domain]);
    Debug.print("✅ Added domain to whitelist: " # domain);
    return true;
  };

  public func removeFromWhitelist(domain: Text): async Bool {
    whitelist := Array.filter<Text>(whitelist, func(d) { not Text.equal(d, domain) });
    Debug.print("🗑️ Removed domain from whitelist: " # domain);
    return true;
  };

  public query func getWhitelist(): async [Text] {
    return whitelist;
  };

  func parseJson(jsonText: Text) : [NewsResult] {
    switch (JSON.fromText(jsonText, null)) {
      case (#err(err)) {
        Debug.print("❌ JSON parsing error: " # err);
        [];
      };
      case (#ok(blob)) {
        let searchResult: ?SearchResult = from_candid(blob);
        switch (searchResult) {
          case (?result) {
            result.results;
          };
          case (_) {
            Debug.print("⚠️ Could not deserialize search results");
            [];
          };
        };
      };
    };
  };

  func encodeQuery(text: Text): Text {
    Text.map(text, func (c) {
      if (c == ' ') { '+' } else { c }
    });
  };

  func getNextServer() : Text {
    let server = searchServers[currentServerIndex];
    currentServerIndex := (currentServerIndex + 1) % searchServers.size();
    server;
  };

  // Função otimizada para fazer requisição HTTP - RETORNA APENAS O RESPONSE BODY
  func makeHttpRequest(userQuery: Text) : async Text {
    let encodedQuery = encodeQuery(userQuery);
    let url = "https://mnznnwrg2mgtemmtqmfvsptxni0ahiir.lambda-url.us-east-1.on.aws/?q=bitcoin+hits+120k";

    Debug.print("🔍 Query: " # userQuery);
    Debug.print("🌐 URL: " # url);

    let headers : [IC.http_header] = [
      { name = "User-Agent"; value = "IC-Agent/1.0" },
      { name = "Accept"; value = "application/json" }
    ];

    let request : IC.http_request_args = {
      url = url;
      method = #get;
      headers = headers;
      body = null;
      max_response_bytes = ?2000000; 
      is_replicated = ?false;
      transform = ?{
        function = transform;
        context = Blob.fromArray([]);
      };
    };

    try {
      Cycles.add(25_000_000_000); 
      let response = await IC.http_request(request);

      Debug.print("📊 Status: " # debug_show(response.status));
      Debug.print("📋 Headers: " # debug_show(response.headers));

      switch (Text.decodeUtf8(response.body)) {
        case null {
          return "❌ Não foi possível decodificar a resposta UTF-8. Status: " # debug_show(response.status) # "\nBody size: " # debug_show(response.body.size());
        };
        case (?responseText) {
          return "📋 Response (Status " # debug_show(response.status) # "):\n\n" # responseText;
        };
      };

    } catch (e) {
      Debug.print("❌ Erro na requisição HTTP: " # Error.message(e));
      return "❌ Erro na conexão com o servidor. Tente novamente." # Error.message(e);
    };
  };

  func isWhitelistedDomain(url: Text, domainList: [Text]) : Bool {
    Option.isSome(Array.find(domainList, func(domain: Text) : Bool {
      Text.contains(url, #text domain)
    }));
  };

  public shared({caller}) func searchNews(userQuery: Text) : async Text {
    // Verificar rate limiting primeiro (mais eficiente)
    let now = Time.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      let waitTime = (MIN_REQUEST_INTERVAL - (now - lastRequestTime)) / 1_000_000_000;
      return "⏳ Aguarde " # debug_show(waitTime) # " segundos antes de fazer uma nova consulta.";
    };

    // Verificar permissão do bot plan
    try {
      let allowed = await botPlanCanister.use_request_for(caller);
      if (not allowed) {
        return "❌ Você atingiu o limite do seu plano ou não tem um plano ativo.";
      };
    } catch (e) {
      Debug.print("❌ Erro ao verificar bot plan: " # Error.message(e));
      return "❌ Erro interno. Tente novamente.";
    };

    lastRequestTime := now;
    Debug.print("🔍 Query: " # userQuery);

    return await makeHttpRequest(userQuery);
  };

  // Função para retry com delay usando Timer (mais eficiente)
  public func searchNewsWithRetry(userQuery: Text) : async Text {
    let result = await searchNews(userQuery);
    
    // Se for erro de servidor ocupado, pode tentar novamente
    if (Text.contains(result, #text "Servidor ocupado")) {
      Debug.print("⏳ Primeiro servidor ocupado, tentando próximo...");
      return await searchNews(userQuery);
    };
    
    return result;
  };
}