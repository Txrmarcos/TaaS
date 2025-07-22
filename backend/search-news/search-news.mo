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

  stable var lastRequestTime : Int = 0;
  let MIN_REQUEST_INTERVAL : Int = 3_000_000_000;

  let searchServers : [Text] = [
    "searx.perennialte.ch",
    "searx.be",
    "search.sapti.me",
    "searx.tiekoetter.com"
  ];

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
  };

  type SearchResult = {
    results: [NewsResult];
  };

  let botPlanCanister = actor("dkwk6-4aaaa-aaaaf-qbbxa-cai") : actor {
    use_request_for : (Principal) -> async Bool;
  };

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

  public func callAgent(prompt: Text) : async Text {
    Debug.print("🧪 Testing manual JSON parsing for: " # prompt);
    return await makeHttpRequest(prompt);
  };

  func parseJson(jsonText: Text, prompt: Text) : async Text {
    Debug.print("🔧 Parsing only titles from JSON");

    var results : [Text] = [];

    let trimmed = Text.trim(jsonText, #text "[\"");
    let cleaned = Text.trim(trimmed, #text "\"]");

    let items = Text.split(cleaned, #text "},{");

    for (item in items) {
      var title = "";

      let fields = Text.split(item, #char ',');

      for (field in fields) {
        if (Text.contains(field, #text "\"title\"")) {
          let pair = Text.split(field, #char ':');
          ignore pair.next();
          switch (pair.next()) {
            case (?value) {
              title := Text.trim(value, #text "\"");
            };
            case null {};
          };
        };
      };

      if (title != "") {
        results := Array.append(results, [title]);
      };
    };

    Debug.print("📋 Parsed " # debug_show(results.size()) # " titles");
    
    let titles = Array.foldLeft<Text, Text>(results, "", func(acc, title) {
      acc # "- " # title # "\n"
    });

    let systemPrompt = "You are a fact-checking assistant. Your job is to analyze news article titles and determine if a given statement is true, false, or uncertain based on the evidence.

    Always respond in this format:

    Answer: [True / False / Uncertain]

    Justification: [Your reasoning citing specific titles]

    Be concise and objective.";

    let userQuery = "Based on these recent news article:

    " # titles # "

    Question: " # prompt # " ?

    Please analyze the titles and provide your assessment.";

        let summary = await LLM.chat(#Llama3_1_8B).withMessages([
          #system_ {
            content = systemPrompt;
          },
          #user {
            content = userQuery;
          },
        ]).send();

        switch (summary.message.content) {
          case (?content) { return content; };
          case null { return "❌ No content returned from LLM."; };
        };
      };

      func encodeQuery(text: Text): Text {
        Text.map(text, func (c) {
          if (c == ' ') { '+' } else { c }
        });
      };

  func makeHttpRequest(userQuery: Text) : async Text {
    let encodedQuery = encodeQuery(userQuery);
    let url = "https://mnznnwrg2mgtemmtqmfvsptxni0ahiir.lambda-url.us-east-1.on.aws/?q=" # encodedQuery;

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
          return "❌ Não foi possível decodificar a resposta UTF-8.";
        };
        case (?jsonText) {
          let response = await parseJson(jsonText, userQuery);
          return response;
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
    let now = Time.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      let waitTime = (MIN_REQUEST_INTERVAL - (now - lastRequestTime)) / 1_000_000_000;
      return "⏳ Aguarde " # debug_show(waitTime) # " segundos antes de fazer uma nova consulta.";
    };

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

}