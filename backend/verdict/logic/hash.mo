import Nat8 "mo:base/Nat8";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Sha256 "mo:sha2/Sha256";

module {
  // Convert a byte array to a hexadecimal string representation
  func toHex(bytes: [Nat8]) : Text {
    Array.foldLeft<Nat8, Text>(
      bytes,
      "",
      func (acc, byte) {
        acc # (if (byte < 16) { "0" } else { "" }) # Nat8.toText(byte)
      }
    )
  };

  // Calculate the SHA-256 hash of a given text input
  public func calculateHash(input: Text): Text {
    let blob = Text.encodeUtf8(input);
    let hashBlob = Sha256.fromBlob(#sha256, blob);
    return toHex(Blob.toArray(hashBlob));
  };
}
