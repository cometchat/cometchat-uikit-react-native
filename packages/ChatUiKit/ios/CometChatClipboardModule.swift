import Foundation
import UIKit

/// Private pasteboard type carrying the rich-text wire format alongside the plain text.
/// Other apps only ever see `public.utf8-plain-text`, so `<color=…>` markup can never leak
/// out of CometChat — only our own editor reads this type back.
let CometChatRichTextPasteboardType = "com.cometchat.uikit.richtext"

@objc(CometChatClipboardModule)
class CometChatClipboardModule: NSObject {

  /// Copies `plain` to the system pasteboard for everyone, and `wire` under a private type
  /// so our composer can restore inline colour when the paste lands back in CometChat.
  @objc func setRichText(
    _ plain: NSString,
    wire: NSString,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    var item: [String: Any] = ["public.utf8-plain-text": plain as String]
    // Only carry the private type when it actually differs — nothing to restore otherwise.
    if (wire as String) != (plain as String) {
      item[CometChatRichTextPasteboardType] = wire as String
    }
    UIPasteboard.general.items = [item]
    resolve(true)
  }

  @objc func hasImageInClipboard(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let pb = UIPasteboard.general
    resolve(pb.image != nil || pb.hasImages)
  }

  @objc func getClipboardImage(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let image = UIPasteboard.general.image else {
      resolve(nil); return
    }
    guard let data = image.jpegData(compressionQuality: 0.9) else {
      reject("ERROR", "Failed to encode clipboard image", nil); return
    }
    let tempURL = FileManager.default.temporaryDirectory
      .appendingPathComponent("clipboard_paste.jpg")
    do {
      try data.write(to: tempURL)
    } catch {
      reject("ERROR", error.localizedDescription, error); return
    }
    resolve([
      "uri": tempURL.absoluteString,
      "mimeType": "image/jpeg",
      "size": data.count,
      "name": "clipboard_paste.jpg"
    ] as [String: Any])
  }

  @objc static func requiresMainQueueSetup() -> Bool { return false }
}
