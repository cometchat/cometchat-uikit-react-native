import Foundation
import UIKit

@objc(CometChatClipboardModule)
class CometChatClipboardModule: NSObject {

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
