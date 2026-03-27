import React

@objc(RichTextEditorViewManager)
class RichTextEditorViewManager: RCTViewManager {

    override func view() -> UIView! {
        return RichTextEditorView()
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc func setContent(_ node: NSNumber, blocks: NSArray) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView,
               let blocksArray = blocks as? [[String: Any]] {
                view.setContent(blocks: blocksArray)
            }
        }
    }

    @objc func getText(_ node: NSNumber, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                resolve(view.getText())
            } else {
                reject("ERROR", "View not found", nil)
            }
        }
    }

    @objc func getBlocks(_ node: NSNumber, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                resolve(view.getBlocksArray())
            } else {
                reject("ERROR", "View not found", nil)
            }
        }
    }

    @objc func clear(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.clear()
            }
        }
    }

    @objc func focus(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.focus()
            }
        }
    }

    @objc func blur(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.blur()
            }
        }
    }

    @objc func insertLink(_ node: NSNumber, url: NSString, text: NSString) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.insertLink(url: url as String, text: text as String)
            }
        }
    }

    @objc func undo(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.undo()
            }
        }
    }

    @objc func redo(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.redo()
            }
        }
    }

    @objc func toggleBold(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.toggleBold()
            }
        }
    }

    @objc func toggleItalic(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.toggleItalic()
            }
        }
    }

    @objc func toggleUnderline(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.toggleUnderline()
            }
        }
    }

    @objc func toggleStrikethrough(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.toggleStrikethrough()
            }
        }
    }

    @objc func toggleCode(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.toggleCode()
            }
        }
    }

    @objc func toggleCodeBlock(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.toggleCodeBlock()
            }
        }
    }

    @objc func toggleHighlight(_ node: NSNumber, color: NSString?) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.toggleHighlight(color: color as String?)
            }
        }
    }

    @objc func setHeading(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.setHeading()
            }
        }
    }

    @objc func setBulletList(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.toggleBulletList()
            }
        }
    }

    @objc func setNumberedList(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.toggleNumberedList()
            }
        }
    }

    @objc func setQuote(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.setQuote()
            }
        }
    }

    @objc func setChecklist(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.setChecklist()
            }
        }
    }

    @objc func setParagraph(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.setParagraph()
            }
        }
    }

    @objc func clearFormatting(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.clearFormatting()
            }
        }
    }

    @objc func indent(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.indent()
            }
        }
    }

    @objc func outdent(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.outdent()
            }
        }
    }

    @objc func setAlignment(_ node: NSNumber, alignment: NSString) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                let alignmentValue: NSTextAlignment
                switch alignment as String {
                case "center":
                    alignmentValue = .center
                case "right":
                    alignmentValue = .right
                default:
                    alignmentValue = .left
                }
                view.setAlignment(alignmentValue)
            }
        }
    }

    @objc func toggleChecklistItem(_ node: NSNumber) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.toggleChecklistItem()
            }
        }
    }

    @objc func setText(_ node: NSNumber, text: String) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.setTextContent(text, force: true)
            }
        }
    }

    @objc func setSelection(_ node: NSNumber, start: Int, end: Int) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.setSelectionRange(start: start, end: end)
            }
        }
    }

    @objc func setMentionRanges(_ node: NSNumber, ranges: NSArray) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                var parsed: [[String: Int]] = []
                for item in ranges {
                    if let dict = item as? [String: Any],
                       let start = dict["start"] as? Int,
                       let end = dict["end"] as? Int {
                        parsed.append(["start": start, "end": end])
                    }
                }
                view.setMentionRanges(parsed)
            }
        }
    }

    @objc func removeLink(_ node: NSNumber, location: Int, length: Int) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.removeLink(location: location, length: length)
            }
        }
    }

    @objc func updateLink(_ node: NSNumber, location: Int, length: Int, newUrl: NSString, newText: NSString) {
        DispatchQueue.main.async {
            if let view = self.bridge?.uiManager.view(forReactTag: node) as? RichTextEditorView {
                view.updateLink(location: location, length: length, newUrl: newUrl as String, newText: newText as String)
            }
        }
    }
}
