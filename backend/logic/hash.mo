import Text "mo:base/Text";

module {
  public func calculateHash(input : Text) : Text {
    return debug_show(Text.hash(input));
  };
}
