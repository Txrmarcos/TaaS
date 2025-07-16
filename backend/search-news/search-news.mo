import Debug "mo:base/Debug";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Option "mo:base/Option";
import IC "ic:aaaaa-aa";
import JSON "mo:serde/JSON";
import LLM "mo:llm";
import Iter "mo:base/Iter";

actor SearchNews {

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
  let botPlanCanister = actor("uxrrr-q7777-77774-qaaaq-cai") : actor {
    use_request_for : (Principal) -> async Bool;
  };

  // Whitelist dinâmica - começa com domínios padrão
  stable var whitelist : [Text] = [
    "bbc.com", "cnn.com", "reuters.com", "nytimes.com", "globo.com"
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

  // Função para remover domínio da whitelist
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

  func isWhitelistedDomain(url: Text, domainList: [Text]) : Bool {
    Option.isSome(Array.find(domainList, func(domain: Text) : Bool {
      Text.contains(url, #text domain)
    }));
  };

  public shared({caller}) func searchNews(userQuery: Text) : async Text {
    let allowed = await botPlanCanister.use_request_for(caller);
    if (not allowed) {
      return "❌ Você atingiu o limite do seu plano ou não tem um plano ativo. Por favor, assine ou aguarde o reset.";
    };
    Debug.print("Permissão ON (bateu no canister do bot-plan)");

    let host = "searx.perennialte.ch";
    let encodedQuery = encodeQuery(userQuery);
    let url = "https://" # host # "/search?q=" # encodedQuery # "&categories=news&format=json";

    Debug.print("🔍 Query: " # userQuery);
    Debug.print("🌐 URL: " # url);
    Debug.print("📋 Current whitelist: " # debug_show(whitelist));

    let headers : [IC.http_header] = [
      { name = "Host"; value = host },
      { name = "User-Agent"; value = "motoko-agent" }
    ];

    let request : IC.http_request_args = {
      url = url;
      method = #get;
      headers = headers;
      is_replicated = null;
      body = null;
      max_response_bytes = null;
      transform = ?{
        function = transform;
        context = Blob.fromArray([]);
      };
    };

    try {
      let response = await IC.http_request(request);

      switch (Text.decodeUtf8(response.body)) {
        case null {
          return "❌ Could not decode UTF-8 from response.";
        };
        case (?jsonText) {
          let news = parseJson(jsonText);

          let filtered = Array.filter(news, func(r: NewsResult) : Bool {
            isWhitelistedDomain(r.url, whitelist)
          });

          if (filtered.size() == 0) {
            return "No relevant news found for your query: " # userQuery # "\nCurrent whitelist: " # debug_show(whitelist);
          };

          let combined = Text.join("\n\n", Iter.fromArray(Array.map(filtered, func(r: NewsResult) : Text {
            "- " # r.title # ": " # r.content
          })));

          let prompt = "Summarize the following news headlines in plain language:\n\n" # combined;

          try {
            let summary = await LLM.prompt(#Llama3_1_8B, prompt);
            return "📰 Summary of news:\n\n" # summary;
          } catch (_e) {
            Debug.print("❌ LLM error occurred");
            return "❌ Error generating summary. Raw news:\n\n" # combined;
          };
        };
      };
    } catch (_e) {
      Debug.print("❌ HTTP request error occurred");
      return "❌ Error fetching news from external source";
    };
  };
};