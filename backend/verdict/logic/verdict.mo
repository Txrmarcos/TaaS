import Time "mo:base/Time";

module {
  public type VerdictResult = { #True; #False; #Unknown };
  
  public type Verdict = {
    result: VerdictResult;
    confidence: Float;
    source: Text;
    hash: Text;
    timestamp: Time.Time;
    llm_message: Text;
  };
}
