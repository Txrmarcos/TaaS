import Debug "mo:base/Debug";
import Text "mo:base/Text";
import Char "mo:base/Char";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import IC "ic:aaaaa-aa";
import LLM "mo:llm";
import Error "mo:base/Error";
import Cycles "mo:base/ExperimentalCycles";
import Time "mo:base/Time";
import _Nat8 "mo:base/Nat8";
import _Sha256 "mo:sha2/Sha256";

actor SearchNews {

  // --- Verdict Types and Logic ---
  
  public type VerdictResult = { #True; #False; #Uncertain };
  
  public type Verdict = {
    result: VerdictResult;
    source: Text;
    hash: Text;
    timestamp: Time.Time;
    llm_message: Text;
  };

  // Convert a byte array to a hexadecimal string representation
  func toHex(bytes: [_Nat8.Nat8]) : Text {
    Array.foldLeft<_Nat8.Nat8, Text>(
      bytes,
      "",
      func (acc, byte) {
        acc # (if (byte < 16) { "0" } else { "" }) # _Nat8.toText(byte)
      }
    )
  };

  // Calculate the SHA-256 hash of a given text input
  func calculateHash(input: Text): Text {
    let blob = Text.encodeUtf8(input);
    let hashBlob = _Sha256.fromBlob(#sha256, blob);
    return toHex(Blob.toArray(hashBlob));
  };

  // --- Persistent Storage ---
  
  stable var lastRequestTime : Int = 0;
  stable var storedVerdicts : [(Text, Verdict)] = [];
  let MIN_REQUEST_INTERVAL : Int = 3_000_000_000;

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
          case (?content) { 
            // Create and store verdict
            let hash = calculateHash(prompt);
            
            // More robust parsing of LLM response
            let lowercaseContent = Text.map(content, func(c: Char): Char {
              if (c >= 'A' and c <= 'Z') {
                Char.fromNat32(Char.toNat32(c) + 32)
              } else { c }
            });
            
            let result = if (Text.contains(lowercaseContent, #text "answer: true") or 
                            Text.contains(lowercaseContent, #text "true")) { 
              #True 
            } else if (Text.contains(lowercaseContent, #text "answer: false") or 
                      Text.contains(lowercaseContent, #text "false")) { 
              #False 
            } else { 
              #Uncertain 
            };
            
            let verdict : Verdict = {
              result = result;
              source = "bbc.com, cnn.com, reuters.com, nytimes.com, globo.com, brave.news";
              hash = hash;
              timestamp = Time.now();
              llm_message = content;
            };
            
            // Store the verdict
            storedVerdicts := Array.append(storedVerdicts, [(hash, verdict)]);
            Debug.print("✅ Verdict stored with hash: " # hash);
            
            return content; 
          };
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
      transform = ?{
        function = transform;
        context = Blob.fromArray([]);
      };
    };

    try {
      Cycles.add<system>(25_000_000_000);
      let response = await IC.http_request(request);

      Debug.print("📊 Status: " # debug_show(response.status));
      Debug.print("📋 Headers: " # debug_show(response.headers));

      switch (Text.decodeUtf8(response.body)) {
        case null {
          return "❌ Unable to decode UTF-8 response.";
        };
        case (?jsonText) {
          let response = await parseJson(jsonText, userQuery);
          return response;
        };
      };

    } catch (e) {
      Debug.print("❌ Error during HTTP request: " # Error.message(e));
      return "❌ Connection error. Please try again." # Error.message(e);
    };
  };

  public shared({caller}) func searchNews(userQuery: Text) : async Text {
    let now = Time.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      let waitTime = (MIN_REQUEST_INTERVAL - (now - lastRequestTime)) / 1_000_000_000;
      return "⏳ Please wait " # debug_show(waitTime) # " seconds before making a new request.";
    };

    try {
      let allowed = await botPlanCanister.use_request_for(caller);
      if (not allowed) {
        return "❌ You have reached the limit of your plan or do not have an active plan.";
      };
    } catch (e) {
      Debug.print("❌ Error checking bot plan: " # Error.message(e));
      return "❌ Internal error. Please try again.";
    };

    lastRequestTime := now;
    Debug.print("🔍 Query: " # userQuery);

    return await makeHttpRequest(userQuery);
  };

  // --- Verdict Access Functions ---

  public query func getVerdictByHash(hash : Text) : async ?Verdict {
    for ((h, v) in storedVerdicts.vals()) {
      if (h == hash) {
        return ?v;
      }
    };
    return null; // Not found
  };

  public query func getAllVerdicts() : async [(Text, Verdict)] {
    return storedVerdicts;
  };

  public func getVerdictByStatement(statement: Text) : async ?Verdict {
    let hash = calculateHash(statement);
    return await getVerdictByHash(hash);
  };

}