import UIKit
import React
import UniformTypeIdentifiers
import MobileCoreServices

class FloatingToolbar: UIView, UIScrollViewDelegate {
    weak var editorView: RichTextEditorView?

    private var buttons: [UIButton] = []
    private var scrollView: UIScrollView!
    private var stackView: UIStackView!
    private var leftArrow: UILabel!
    private var rightArrow: UILabel!
    private var enabledOptions: [String] = [
        "bold", "italic", "underline", "strikethrough", "code", "highlight",
        "heading", "bullet", "numbered", "quote", "checklist",
        "link", "undo", "redo", "clearFormatting",
        "indent", "outdent",
        "alignLeft", "alignCenter", "alignRight"
    ]

    private let optionToIndex: [String: Int] = [
        "bold": 0, "italic": 1, "strikethrough": 2, "underline": 3, "code": 4, "highlight": 5,
        "heading": 6, "bullet": 7, "numbered": 8, "quote": 9, "checklist": 10,
        "link": 11, "undo": 12, "redo": 13, "clearFormatting": 14,
        "indent": 15, "outdent": 16,
        "alignLeft": 17, "alignCenter": 18, "alignRight": 19
    ]

    private let toolbarBackgroundColor = UIColor(red: 45/255, green: 45/255, blue: 45/255, alpha: 1.0)
    private let activeColor = UIColor(red: 80/255, green: 130/255, blue: 200/255, alpha: 1.0)
    private let inactiveColor = UIColor.white
    private let arrowColor = UIColor(white: 1.0, alpha: 0.7)

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupToolbar()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupToolbar()
    }

    func setToolbarOptions(_ options: [String]?) {
        if let options = options, !options.isEmpty {
            enabledOptions = options
        } else {
            enabledOptions = [
                "bold", "italic", "underline", "strikethrough", "code", "highlight",
                "heading", "bullet", "numbered", "quote", "checklist",
                "link", "undo", "redo", "clearFormatting",
                "indent", "outdent",
                "alignLeft", "alignCenter", "alignRight"
            ]
        }
        rebuildButtons()
        updateScrollIndicators()
    }

    private func setupToolbar() {
        backgroundColor = toolbarBackgroundColor
        layer.cornerRadius = 10
        layer.shadowColor = UIColor.black.cgColor
        layer.shadowOffset = CGSize(width: 0, height: 2)
        layer.shadowOpacity = 0.3
        layer.shadowRadius = 6

        leftArrow = UILabel()
        leftArrow.text = "‹"
        leftArrow.font = UIFont.systemFont(ofSize: 20, weight: .bold)
        leftArrow.textColor = arrowColor
        leftArrow.textAlignment = .center
        leftArrow.translatesAutoresizingMaskIntoConstraints = false
        leftArrow.isHidden = true
        leftArrow.isUserInteractionEnabled = true
        let leftTap = UITapGestureRecognizer(target: self, action: #selector(leftArrowTapped))
        leftArrow.addGestureRecognizer(leftTap)
        addSubview(leftArrow)

        rightArrow = UILabel()
        rightArrow.text = "›"
        rightArrow.font = UIFont.systemFont(ofSize: 20, weight: .bold)
        rightArrow.textColor = arrowColor
        rightArrow.textAlignment = .center
        rightArrow.translatesAutoresizingMaskIntoConstraints = false
        rightArrow.isHidden = false
        rightArrow.isUserInteractionEnabled = true
        let rightTap = UITapGestureRecognizer(target: self, action: #selector(rightArrowTapped))
        rightArrow.addGestureRecognizer(rightTap)
        addSubview(rightArrow)

        scrollView = UIScrollView()
        scrollView.showsHorizontalScrollIndicator = false
        scrollView.showsVerticalScrollIndicator = false
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.delegate = self
        addSubview(scrollView)

        stackView = UIStackView()
        stackView.axis = .horizontal
        stackView.spacing = 8
        stackView.distribution = .fill
        stackView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.addSubview(stackView)

        NSLayoutConstraint.activate([
            leftArrow.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 4),
            leftArrow.centerYAnchor.constraint(equalTo: centerYAnchor),
            leftArrow.widthAnchor.constraint(equalToConstant: 16),

            rightArrow.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -4),
            rightArrow.centerYAnchor.constraint(equalTo: centerYAnchor),
            rightArrow.widthAnchor.constraint(equalToConstant: 16),

            scrollView.leadingAnchor.constraint(equalTo: leftArrow.trailingAnchor, constant: 2),
            scrollView.trailingAnchor.constraint(equalTo: rightArrow.leadingAnchor, constant: -2),
            scrollView.topAnchor.constraint(equalTo: topAnchor, constant: 8),
            scrollView.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -8),

            stackView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
            stackView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
            stackView.topAnchor.constraint(equalTo: scrollView.topAnchor),
            stackView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
            stackView.heightAnchor.constraint(equalTo: scrollView.heightAnchor)
        ])

        rebuildButtons()
    }

    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        updateScrollIndicators()
    }

    private func updateScrollIndicators() {
        guard let scrollView = scrollView else { return }

        let contentWidth = scrollView.contentSize.width
        let scrollViewWidth = scrollView.bounds.width
        let offsetX = scrollView.contentOffset.x

        leftArrow.isHidden = offsetX <= 5
        rightArrow.isHidden = offsetX >= (contentWidth - scrollViewWidth - 5)
    }

    @objc private func leftArrowTapped() {
        guard let scrollView = scrollView else { return }
        let scrollAmount: CGFloat = 120
        let newOffsetX = max(0, scrollView.contentOffset.x - scrollAmount)
        scrollView.setContentOffset(CGPoint(x: newOffsetX, y: 0), animated: true)
    }

    @objc private func rightArrowTapped() {
        guard let scrollView = scrollView else { return }
        let scrollAmount: CGFloat = 120
        let maxOffsetX = scrollView.contentSize.width - scrollView.bounds.width
        let newOffsetX = min(maxOffsetX, scrollView.contentOffset.x + scrollAmount)
        scrollView.setContentOffset(CGPoint(x: newOffsetX, y: 0), animated: true)
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        DispatchQueue.main.async {
            self.updateScrollIndicators()
        }
    }

    private let iconSize: CGFloat = 20
    private let buttonSize: CGFloat = 36
    private let iconPadding: CGFloat = 8

    private func rebuildButtons() {
        buttons.forEach { $0.removeFromSuperview() }
        buttons.removeAll()

        for option in enabledOptions {
            guard let index = optionToIndex[option] else { continue }

            let button = UIButton(type: .custom)
            button.tag = index
            button.layer.cornerRadius = 6
            button.addTarget(self, action: #selector(buttonTapped(_:)), for: .touchUpInside)
            button.widthAnchor.constraint(equalToConstant: buttonSize).isActive = true
            button.heightAnchor.constraint(equalToConstant: buttonSize).isActive = true

            // Use vector icons with consistent sizing
            if let icon = ToolbarIcons.getIcon(for: option, color: inactiveColor, size: CGSize(width: iconSize, height: iconSize)) {
                button.setImage(icon.withRenderingMode(.alwaysOriginal), for: .normal)
                button.imageView?.contentMode = .scaleAspectFit
                button.contentEdgeInsets = UIEdgeInsets(top: iconPadding, left: iconPadding, bottom: iconPadding, right: iconPadding)
            }

            buttons.append(button)
            stackView.addArrangedSubview(button)
        }
    }

    func getToolbarWidth() -> CGFloat {
        let screenWidth = UIScreen.main.bounds.width
        let maxWidth = screenWidth * 0.9
        let buttonCount = CGFloat(enabledOptions.count)
        let calculatedWidth = (buttonCount * 36) + ((buttonCount - 1) * 8) + 48
        return min(calculatedWidth, maxWidth)
    }

    private func createButtonAttributedString(for index: Int, active: Bool) -> NSAttributedString {
        let color = active ? activeColor : inactiveColor
        let fontSize: CGFloat = 18

        switch index {
        case 0:
            return NSAttributedString(string: "B", attributes: [
                .font: UIFont.boldSystemFont(ofSize: fontSize),
                .foregroundColor: color
            ])
        case 1:
            return NSAttributedString(string: "I", attributes: [
                .font: UIFont.italicSystemFont(ofSize: fontSize),
                .foregroundColor: color
            ])
        case 2:
            return NSAttributedString(string: "S", attributes: [
                .font: UIFont.systemFont(ofSize: fontSize, weight: .medium),
                .foregroundColor: color,
                .strikethroughStyle: NSUnderlineStyle.single.rawValue,
                .strikethroughColor: color
            ])
        case 3:
            return NSAttributedString(string: "U", attributes: [
                .font: UIFont.systemFont(ofSize: fontSize, weight: .medium),
                .foregroundColor: color,
                .underlineStyle: NSUnderlineStyle.single.rawValue,
                .underlineColor: color
            ])
        case 4:
            return NSAttributedString(string: "</>", attributes: [
                .font: UIFont(name: "Menlo", size: fontSize - 4) ?? UIFont.monospacedSystemFont(ofSize: fontSize - 4, weight: .medium),
                .foregroundColor: color
            ])
        case 5:
            return NSAttributedString(string: "H", attributes: [
                .font: UIFont.systemFont(ofSize: fontSize, weight: .medium),
                .foregroundColor: color,
                .backgroundColor: active ? UIColor.yellow.withAlphaComponent(0.5) : UIColor.yellow.withAlphaComponent(0.3)
            ])
        case 6:
            return NSAttributedString(string: "H1", attributes: [
                .font: UIFont.boldSystemFont(ofSize: fontSize - 2),
                .foregroundColor: color
            ])
        case 7:
            return createListIcon(type: .bullet, color: color)
        case 8:
            return createListIcon(type: .numbered, color: color)
        case 9:
            return NSAttributedString(string: "❞", attributes: [
                .font: UIFont.systemFont(ofSize: fontSize + 2),
                .foregroundColor: color
            ])
        case 10:
            return NSAttributedString(string: "☑", attributes: [
                .font: UIFont.systemFont(ofSize: fontSize),
                .foregroundColor: color
            ])
        case 11:
            return NSAttributedString(string: "🔗", attributes: [
                .font: UIFont.systemFont(ofSize: fontSize - 2),
                .foregroundColor: color
            ])
        case 12:
            return NSAttributedString(string: "↩", attributes: [
                .font: UIFont.systemFont(ofSize: fontSize),
                .foregroundColor: color
            ])
        case 13:
            return NSAttributedString(string: "↪", attributes: [
                .font: UIFont.systemFont(ofSize: fontSize),
                .foregroundColor: color
            ])
        case 14:
            return NSAttributedString(string: "Tx", attributes: [
                .font: UIFont.systemFont(ofSize: fontSize - 2, weight: .medium),
                .foregroundColor: color,
                .strikethroughStyle: NSUnderlineStyle.single.rawValue,
                .strikethroughColor: color
            ])
        case 15:
            return NSAttributedString(string: "→⊢", attributes: [
                .font: UIFont.systemFont(ofSize: fontSize - 4),
                .foregroundColor: color
            ])
        case 16:
            return NSAttributedString(string: "⊣←", attributes: [
                .font: UIFont.systemFont(ofSize: fontSize - 4),
                .foregroundColor: color
            ])
        case 17:
            return createAlignmentIcon(alignment: .left, color: color)
        case 18:
            return createAlignmentIcon(alignment: .center, color: color)
        case 19:
            return createAlignmentIcon(alignment: .right, color: color)
        default:
            return NSAttributedString(string: "")
        }
    }

    private func createAlignmentIcon(alignment: NSTextAlignment, color: UIColor) -> NSAttributedString {
        let result = NSMutableAttributedString()
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.lineSpacing = 1
        paragraphStyle.alignment = alignment
        paragraphStyle.lineHeightMultiple = 0.9

        let attrs: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 8, weight: .medium),
            .foregroundColor: color,
            .paragraphStyle: paragraphStyle
        ]

        let lines = ["────", "──────", "────"]
        for (i, line) in lines.enumerated() {
            result.append(NSAttributedString(string: line, attributes: attrs))
            if i < lines.count - 1 {
                result.append(NSAttributedString(string: "\n", attributes: attrs))
            }
        }

        return result
    }

    private enum ListIconType {
        case bullet
        case numbered
    }

    private func createListIcon(type: ListIconType, color: UIColor) -> NSAttributedString {
        let result = NSMutableAttributedString()

        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.lineSpacing = 1
        paragraphStyle.alignment = .left
        paragraphStyle.lineHeightMultiple = 0.9

        let attrs: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 9, weight: .medium),
            .foregroundColor: color,
            .paragraphStyle: paragraphStyle
        ]

        for i in 0..<3 {
            let marker = type == .bullet ? "•" : "\(i + 1)"
            let line = "\(marker) ──"
            result.append(NSAttributedString(string: line, attributes: attrs))
            if i < 2 {
                result.append(NSAttributedString(string: "\n", attributes: attrs))
            }
        }

        return result
    }

    @objc private func buttonTapped(_ sender: UIButton) {
        switch sender.tag {
        case 0: editorView?.toggleBold()
        case 1: editorView?.toggleItalic()
        case 2: editorView?.toggleStrikethrough()
        case 3: editorView?.toggleUnderline()
        case 4: editorView?.toggleCode()
        case 5: editorView?.toggleHighlight(color: nil)
        case 6: editorView?.setHeading()
        case 7: editorView?.toggleBulletList()
        case 8: editorView?.toggleNumberedList()
        case 9: editorView?.setQuote()
        case 10: editorView?.setChecklist()
        case 11: editorView?.promptInsertLink()
        case 12: editorView?.undo()
        case 13: editorView?.redo()
        case 14: editorView?.clearFormatting()
        case 15: editorView?.indent()
        case 16: editorView?.outdent()
        case 17: editorView?.setAlignment(.left)
        case 18: editorView?.setAlignment(.center)
        case 19: editorView?.setAlignment(.right)
        default: break
        }
        editorView?.updateToolbarButtonStates()
    }

    private let indexToOption: [Int: String] = [
        0: "bold", 1: "italic", 2: "strikethrough", 3: "underline", 4: "code", 5: "highlight",
        6: "heading", 7: "bullet", 8: "numbered", 9: "quote", 10: "checklist",
        11: "link", 12: "undo", 13: "redo", 14: "clearFormatting",
        15: "indent", 16: "outdent",
        17: "alignLeft", 18: "alignCenter", 19: "alignRight"
    ]

    func updateButtonStates(bold: Bool, italic: Bool, underline: Bool, strikethrough: Bool, code: Bool = false, highlight: Bool = false, heading: Bool = false, bullet: Bool, numbered: Bool, quote: Bool = false, checklist: Bool = false, alignLeft: Bool = true, alignCenter: Bool = false, alignRight: Bool = false) {
        let styleStates: [Int: Bool] = [
            0: bold, 1: italic, 2: strikethrough, 3: underline, 4: code, 5: highlight,
            6: heading, 7: bullet, 8: numbered, 9: quote, 10: checklist,
            11: false, 12: false, 13: false, 14: false,
            15: false, 16: false,
            17: alignLeft, 18: alignCenter, 19: alignRight
        ]

        for button in buttons {
            let tag = button.tag
            let isActive = styleStates[tag] ?? false
            let color = isActive ? activeColor : inactiveColor

            // Update icon with new color
            if let option = indexToOption[tag],
               let icon = ToolbarIcons.getIcon(for: option, color: color, size: CGSize(width: iconSize, height: iconSize)) {
                button.setImage(icon.withRenderingMode(.alwaysOriginal), for: .normal)
            }

            button.backgroundColor = isActive ? UIColor.white.withAlphaComponent(0.15) : .clear
        }
    }
}

/// Custom NSLayoutManager that clips inline code `.backgroundColor` rects
/// to the actual glyph bounds instead of the full line fragment width.
/// Custom NSLayoutManager that clips inline code `.backgroundColor` rects
/// to the actual glyph bounds instead of the full line fragment width.
/// This keeps the background tight-wrapped to the text while staying in
/// the text rendering pipeline (so it scrolls correctly with content).
class InlineCodeLayoutManager: NSLayoutManager {

    /// Suppress rendering of the blockquote marker character (▎ U+258E).
    /// The character is kept in the text storage so line metrics and hit-testing
    /// remain correct, but its glyph is never drawn — only the custom grey bar
    /// painted in RichTextView.draw(_:) is visible.
    override func drawGlyphs(forGlyphRange glyphsToShow: NSRange, at origin: CGPoint) {
        guard let textStorage = self.textStorage else {
            super.drawGlyphs(forGlyphRange: glyphsToShow, at: origin)
            return
        }

        let fullString = textStorage.string as NSString
        var nonQuoteRanges: [NSRange] = []
        var current = glyphsToShow.location
        let end = glyphsToShow.location + glyphsToShow.length

        while current < end {
            let charIndex = self.characterIndexForGlyph(at: current)
            if charIndex < fullString.length && fullString.character(at: charIndex) == 0x258E {
                // Skip this single glyph (▎)
                current += 1
            } else {
                let rangeStart = current
                current += 1
                while current < end {
                    let ci = self.characterIndexForGlyph(at: current)
                    if ci < fullString.length && fullString.character(at: ci) == 0x258E {
                        break
                    }
                    current += 1
                }
                nonQuoteRanges.append(NSRange(location: rangeStart, length: current - rangeStart))
            }
        }

        for range in nonQuoteRanges {
            super.drawGlyphs(forGlyphRange: range, at: origin)
        }
    }

    override func fillBackgroundRectArray(_ rectArray: UnsafePointer<CGRect>, count rectCount: Int, forCharacterRange charRange: NSRange, color: UIColor) {
        // Only intercept inline code background color; pass everything else through
        guard color == inlineCodeBgColor, let textStorage = self.textStorage else {
            super.fillBackgroundRectArray(rectArray, count: rectCount, forCharacterRange: charRange, color: color)
            return
        }

        // Skip whitespace/newline-only ranges
        let nsString = textStorage.string as NSString
        let rangeStr = nsString.substring(with: charRange)
        if rangeStr.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return }

        let glyphRange = self.glyphRange(forCharacterRange: charRange, actualCharacterRange: nil)
        guard glyphRange.length > 0 else { return }

        guard let ctx = UIGraphicsGetCurrentContext() else { return }
        ctx.saveGState()
        color.setFill()

        let hPad: CGFloat = 2.0

        // Compute the Y offset between enumerateLineFragments coordinates
        // (text container space) and fillBackgroundRectArray coordinates
        // (drawing context space, which includes textContainerInset offset).
        // We derive this offset by comparing the first system rect Y with
        // the first line fragment Y for the same glyph range.
        var yOffset: CGFloat = 0.0
        if rectCount > 0 {
            var firstLineY: CGFloat = 0.0
            var found = false
            enumerateLineFragments(forGlyphRange: NSRange(location: glyphRange.location, length: 1)) { lineRect, usedRect, container, lineGlyphRange, stop in
                firstLineY = lineRect.origin.y
                found = true
                stop.pointee = true
            }
            if found {
                yOffset = rectArray[0].origin.y - firstLineY
            }
        }

        // Walk each visual line that intersects the inline code glyph range.
        // Compute tight X from glyph positions, apply yOffset to align Y
        // with the drawing coordinate space.
        enumerateLineFragments(forGlyphRange: glyphRange) { lineRect, usedRect, container, lineGlyphRange, stop in
            let intersectStart = max(glyphRange.location, lineGlyphRange.location)
            let intersectEnd = min(glyphRange.location + glyphRange.length, lineGlyphRange.location + lineGlyphRange.length)
            guard intersectStart < intersectEnd else { return }

            // Skip line segments that are only whitespace/newlines
            let charStart = self.characterIndexForGlyph(at: intersectStart)
            let charEnd = self.characterIndexForGlyph(at: intersectEnd - 1) + 1
            let segLen = min(charEnd, nsString.length) - charStart
            if segLen > 0 {
                let segStr = nsString.substring(with: NSRange(location: charStart, length: segLen))
                if segStr.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return }
            }

            // Tight horizontal bounds from glyph positions
            let leftX = self.location(forGlyphAt: intersectStart).x + lineRect.origin.x
            var rightX: CGFloat
            if intersectEnd < lineGlyphRange.location + lineGlyphRange.length {
                rightX = self.location(forGlyphAt: intersectEnd).x + lineRect.origin.x
            } else {
                let lastGlyph = intersectEnd - 1
                let lastGlyphX = self.location(forGlyphAt: lastGlyph).x + lineRect.origin.x
                let charIndex = self.characterIndexForGlyph(at: lastGlyph)
                let charFont = textStorage.attribute(.font, at: charIndex, effectiveRange: nil) as? UIFont ?? UIFont.monospacedSystemFont(ofSize: 15, weight: .regular)
                let charStr = nsString.substring(with: NSRange(location: charIndex, length: 1))
                let charWidth = (charStr as NSString).size(withAttributes: [.font: charFont]).width
                rightX = lastGlyphX + charWidth
            }

            // Apply yOffset to convert lineRect Y from text container space
            // to the drawing coordinate space used by fillBackgroundRectArray
            let bgRect = CGRect(
                x: leftX - hPad,
                y: lineRect.origin.y + yOffset,
                width: (rightX - leftX) + hPad * 2,
                height: lineRect.height
            )
            ctx.fill(bgRect)
        }

        ctx.restoreGState()
    }
}

class RichTextView: UITextView {
    /// Weak reference to the container RichTextEditorView for paste-URL-over-selection.
    weak var editorContainer: RichTextEditorView?

    override init(frame: CGRect, textContainer: NSTextContainer?) {
        super.init(frame: frame, textContainer: textContainer)
        disableAutofill()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        disableAutofill()
    }

    /// Force redraw on scroll so code block containers stay fixed relative to text.
    /// UITextView uses tiled rendering and only redraws the dirty rect; custom
    /// drawing in draw(_:) for code block borders can miss regions during scroll.
    override func layoutSubviews() {
        super.layoutSubviews()
        setNeedsDisplay()
    }

    /// Intercept paste to detect:
    ///  1. Media (images / files) on the clipboard → extract to temp files and emit
    ///     the `onPasteMedia` event to JS (does NOT insert anything into the editor).
    ///  2. URL-on-selected-text → create styled hyperlink
    ///     (matches Android onTextContextMenuItem paste handling).
    ///  3. Markdown text → parse and insert as styled text.
    ///  4. Otherwise → normal system text paste.
    override func paste(_ sender: Any?) {
        // ── (1) Media paste: images and/or file item providers ──
        // Detect media BEFORE the string check because an image/file copied from
        // Photos or a file provider may have NO plain-text representation, which
        // would otherwise fall through to super.paste() and paste nothing useful.
        if editorContainer?.handlePasteMediaIfAvailable() == true {
            return
        }

        guard let pastedString = UIPasteboard.general.string else {
            super.paste(sender)
            return
        }
        let sel = selectedRange
        // URL on clipboard + text selected → styled hyperlink
        if sel.length > 0, let editor = editorContainer, editor.isURL(pastedString) {
            let selectedText = (self.text as NSString).substring(with: sel)
            editor.insertLinkOverSelection(url: pastedString, displayText: selectedText, range: sel)
            return
        }
        // Markdown content → parse and insert as styled text
        if let editor = editorContainer, editor.looksLikeMarkdown(pastedString) {
            let styledText = editor.markdownToAttributedString(pastedString)
            editor.insertStyledPasteContent(styledText, at: sel)
            return
        }
        super.paste(sender)
    }

    private func disableAutofill() {
        autocorrectionType = .no
        autocapitalizationType = .none
        spellCheckingType = .no
        smartQuotesType = .no
        smartDashesType = .no
        smartInsertDeleteType = .no

        if #available(iOS 10.0, *) {
            textContentType = UITextContentType(rawValue: "")
        }

        if #available(iOS 9.0, *) {
            inputAssistantItem.leadingBarButtonGroups = []
            inputAssistantItem.trailingBarButtonGroups = []
        }

        inputAccessoryView = UIView(frame: .zero)

        if #available(iOS 16.0, *) {
            isFindInteractionEnabled = false
        }

        isSecureTextEntry = true
        isSecureTextEntry = false
    }

    /// Custom drawing for blockquote vertical bars (matches Android onDraw implementation).
    /// Custom drawing for code block containers and blockquote vertical bars.
    /// Code block containers are drawn BEHIND text (matching Android onDraw).
    /// The ▎ character is made invisible and a custom bar is drawn instead.
    override func draw(_ rect: CGRect) {
        // Guard: ensure text storage has content before custom drawing
        let textStore = self.textStorage
        let layoutMgr = self.layoutManager
        let textContainer = self.textContainer

        // ── Code block containers (unified rect per region, matching Android) ──
        if textStore.length > 0 {
            // Find all code block regions by enumerating CodeBlockAttributeKey ranges
            var codeRegions: [(Int, Int)] = []
            textStore.enumerateAttribute(CodeBlockAttributeKey, in: NSRange(location: 0, length: textStore.length), options: []) { value, range, _ in
                guard value != nil else { return }
                if !codeRegions.isEmpty && range.location <= codeRegions.last!.1 {
                    codeRegions[codeRegions.count - 1] = (codeRegions.last!.0, range.location + range.length)
                } else {
                    codeRegions.append((range.location, range.location + range.length))
                }
            }

            if !codeRegions.isEmpty, let ctx = UIGraphicsGetCurrentContext() {
                let isDark = self.traitCollection.userInterfaceStyle == .dark
                let bgColor = isDark ? codeBlockDarkBgColor : codeBlockBgColor
                let borderColor = isDark ? codeBlockDarkBorderColor : codeBlockBorderColor

                for (regionStart, regionEnd) in codeRegions {
                    let clampedEnd = max(regionStart, min(regionEnd - 1, textStore.length - 1))
                    let charRange = NSRange(location: regionStart, length: clampedEnd - regionStart + 1)
                    let glyphRange = layoutMgr.glyphRange(forCharacterRange: charRange, actualCharacterRange: nil)
                    guard glyphRange.length > 0 else { continue }

                    let boundingRect = layoutMgr.boundingRect(forGlyphRange: glyphRange, in: textContainer)

                    let vPad = codeBlockVerticalPadding
                    let codeTop = boundingRect.origin.y + textContainerInset.top
                    let codeBottom = boundingRect.origin.y + boundingRect.height + textContainerInset.top

                    // Clamp top padding so the container never overlaps the previous line.
                    // If there's content above, limit padding to half the gap between
                    // the code block edge and the previous line's bottom (matching Android).
                    let topPad: CGFloat
                    if regionStart > 0 {
                        let prevCharRange = NSRange(location: max(0, regionStart - 1), length: 1)
                        let prevGlyphRange = layoutMgr.glyphRange(forCharacterRange: prevCharRange, actualCharacterRange: nil)
                        var prevLineBottom: CGFloat = codeTop
                        layoutMgr.enumerateLineFragments(forGlyphRange: prevGlyphRange) { lineRect, _, _, _, _ in
                            prevLineBottom = lineRect.origin.y + lineRect.height + self.textContainerInset.top
                        }
                        let gap = codeTop - prevLineBottom
                        topPad = min(vPad, max(gap / 2.0, 0))
                    } else {
                        topPad = vPad
                    }

                    // Clamp bottom padding so the container never overlaps the next line.
                    let bottomPad: CGFloat
                    if regionEnd < textStore.length {
                        let nextCharRange = NSRange(location: min(regionEnd, textStore.length - 1), length: 1)
                        let nextGlyphRange = layoutMgr.glyphRange(forCharacterRange: nextCharRange, actualCharacterRange: nil)
                        var nextLineTop: CGFloat = codeBottom
                        layoutMgr.enumerateLineFragments(forGlyphRange: nextGlyphRange) { lineRect, _, _, _, _ in
                            nextLineTop = lineRect.origin.y + self.textContainerInset.top
                        }
                        let gap = nextLineTop - codeBottom
                        bottomPad = min(vPad, max(gap / 2.0, 0))
                    } else {
                        bottomPad = vPad
                    }

                    let topY = codeTop - topPad
                    let bottomY = codeBottom + bottomPad

                    let leftX = textContainerInset.left
                    let rightX = self.bounds.width - textContainerInset.right

                    let containerRect = CGRect(x: leftX, y: max(topY, 1), width: rightX - leftX, height: bottomY - max(topY, 1))
                    let path = UIBezierPath(roundedRect: containerRect, cornerRadius: codeBlockCornerRadius)

                    ctx.saveGState()
                    bgColor.setFill()
                    path.fill()

                    borderColor.setStroke()
                    path.lineWidth = 1.0
                    path.stroke()
                    ctx.restoreGState()
                }
            }
        }

        // Inline code backgrounds are rendered via NSAttributedString.backgroundColor
        // (set in toggleCode/setContent/applyPendingStylesToTypingAttributes)
        // which handles scrolling and dirty-rect rendering natively.
        super.draw(rect)

        // Draw blockquote bars on top of text (decorative side bars)
        guard textStore.length > 0 else { return }

        let plainText = text ?? ""
        guard !plainText.isEmpty else { return }

        let lines = plainText.components(separatedBy: "\n")

        var quoteRegions: [(Int, Int)] = []
        var offset = 0
        for line in lines {
            let lineEnd = offset + line.count
            if line.hasPrefix("▎") {
                if !quoteRegions.isEmpty && offset <= quoteRegions.last!.1 + 1 {
                    quoteRegions[quoteRegions.count - 1] = (quoteRegions.last!.0, lineEnd)
                } else {
                    quoteRegions.append((offset, lineEnd))
                }
            }
            offset = lineEnd + 1
        }

        guard !quoteRegions.isEmpty else { return }

        let barColor = UIColor(red: 220/255.0, green: 220/255.0, blue: 220/255.0, alpha: 1.0)
        let barWidth: CGFloat = 3.0
        let barRadius = barWidth / 2.0

        for (regionStart, regionEnd) in quoteRegions {
            let clampedEnd = min(regionEnd, textStore.length - 1)
            let safeEnd = max(clampedEnd, regionStart)

            let glyphRange = layoutMgr.glyphRange(forCharacterRange: NSRange(location: regionStart, length: safeEnd - regionStart + 1), actualCharacterRange: nil)

            var firstLineRect = CGRect.zero
            var lastLineRect = CGRect.zero

            layoutMgr.enumerateLineFragments(forGlyphRange: glyphRange) { (rect, usedRect, container, range, stop) in
                if firstLineRect == .zero {
                    firstLineRect = rect
                }
                lastLineRect = rect
            }

            guard firstLineRect != .zero else { continue }

            let topY = firstLineRect.origin.y + textContainerInset.top
            let bottomY = lastLineRect.origin.y + lastLineRect.height + textContainerInset.top
            let barX = textContainerInset.left + 1.0

            guard bottomY > topY else { continue }

            let barRect = CGRect(x: barX, y: topY, width: barWidth, height: bottomY - topY)
            let barPath = UIBezierPath(roundedRect: barRect, cornerRadius: barRadius)
            barColor.setFill()
            barPath.fill()
        }
    }

    override func canPerformAction(_ action: Selector, withSender sender: Any?) -> Bool {
        // Allow paste so clipboard content can be inserted and placeholder hides correctly.
        // Also enable paste when the clipboard carries file item providers (e.g. a file
        // copied from Files/another app) so media paste can be triggered.
        if action == #selector(UIResponderStandardEditActions.paste(_:)) {
            let pb = UIPasteboard.general
            return pb.hasStrings || pb.hasImages || pb.hasURLs || !pb.itemProviders.isEmpty
        }
        // Allow standard text editing actions (matching Android system context menu)
        if action == #selector(UIResponderStandardEditActions.cut(_:)) ||
           action == #selector(UIResponderStandardEditActions.copy(_:)) ||
           action == #selector(UIResponderStandardEditActions.selectAll(_:)) ||
           action == #selector(UIResponderStandardEditActions.select(_:)) {
            return super.canPerformAction(action, withSender: sender)
        }
        // Allow custom formatting actions when text is selected and showTextSelectionMenuItems is true
        if selectedRange.length > 0, editorContainer?.showTextSelectionMenuItems == true {
            if action == #selector(formatBold) ||
               action == #selector(formatItalic) ||
               action == #selector(formatUnderline) ||
               action == #selector(formatStrikethrough) {
                return true
            }
        }
        return false
    }

    /// Custom action: apply bold formatting to selection only (context menu — does not affect typing state)
    @objc func formatBold() {
        guard let editor = editorContainer else { return }
        editor.applyStyleToSelectionOnly(trait: .traitBold)
    }

    /// Custom action: apply italic formatting to selection only (context menu — does not affect typing state)
    @objc func formatItalic() {
        guard let editor = editorContainer else { return }
        editor.applyStyleToSelectionOnly(trait: .traitItalic)
    }

    /// Custom action: apply underline formatting to selection only (context menu — does not affect typing state)
    @objc func formatUnderline() {
        guard let editor = editorContainer else { return }
        editor.applyAttributeToSelectionOnly(key: .underlineStyle, value: NSUnderlineStyle.single.rawValue)
    }

    /// Custom action: apply strikethrough formatting to selection only (context menu — does not affect typing state)
    @objc func formatStrikethrough() {
        guard let editor = editorContainer else { return }
        editor.applyAttributeToSelectionOnly(key: .strikethroughStyle, value: NSUnderlineStyle.single.rawValue)
    }
}

// Inline code colors matching Android defaults (#6852D6 text, #F5F5F5 bg, #E8E8E8 border)
private let inlineCodeTextColor = UIColor(red: 104.0/255.0, green: 82.0/255.0, blue: 214.0/255.0, alpha: 1.0)
private let inlineCodeBgColor = UIColor(red: 245.0/255.0, green: 245.0/255.0, blue: 245.0/255.0, alpha: 1.0)
private let inlineCodeBorderColor = UIColor(red: 232.0/255.0, green: 232.0/255.0, blue: 232.0/255.0, alpha: 1.0)

// Custom NSAttributedString key for link URL storage.
// Using a custom key instead of .link prevents UITextView from opening URLs
// in the browser on tap. Link taps are handled by our custom gesture recognizer.
private let LinkURLAttributeKey = NSAttributedString.Key("cometchat.linkURL")

// Custom NSAttributedString key for code block marker (equivalent to Android CodeBlockBorderSpan).
// Presence indicates the range is inside a code block. Drawing is handled in RichTextView.draw().
private let CodeBlockAttributeKey = NSAttributedString.Key("cometchat.codeBlock")

// Custom NSAttributedString key for mention marker (equivalent to Android MentionSpan).
// Used to selectively clear old mention styling (bold, foreground, background) without
// affecting inline code or link styling.
private let MentionMarkerKey = NSAttributedString.Key("cometchat.mention")

// Code block visual constants (matching Android CodeBlockBorderSpan companion)
private let codeBlockCornerRadius: CGFloat = 6.0
private let codeBlockPadding: CGFloat = 12.0
private let codeBlockVerticalPadding: CGFloat = 10.0
private let codeBlockBgColor = UIColor(red: 250.0/255.0, green: 250.0/255.0, blue: 250.0/255.0, alpha: 1.0) // #FAFAFA
private let codeBlockBorderColor = UIColor(red: 232.0/255.0, green: 232.0/255.0, blue: 232.0/255.0, alpha: 1.0) // #E8E8E8
private let codeBlockDarkBgColor = UIColor(white: 1.0, alpha: 0.1) // subtle white overlay
private let codeBlockDarkBorderColor = UIColor(white: 1.0, alpha: 0.2)

@objcMembers
class RichTextEditorView: UIView, UITextViewDelegate, UIGestureRecognizerDelegate {
    private static let defaultLineHeightMultiple: CGFloat = 1.3

    private let textView: RichTextView = {
        let textStorage = NSTextStorage()
        let layoutManager = InlineCodeLayoutManager()
        textStorage.addLayoutManager(layoutManager)
        let textContainer = NSTextContainer(size: CGSize(width: 0, height: CGFloat.greatestFiniteMagnitude))
        textContainer.widthTracksTextView = true
        layoutManager.addTextContainer(textContainer)
        let tv = RichTextView(frame: .zero, textContainer: textContainer)
        tv.font = UIFont.systemFont(ofSize: 16)
        tv.textContainerInset = UIEdgeInsets(top: 0, left: 4, bottom: 0, right: 4)
        tv.translatesAutoresizingMaskIntoConstraints = false
        tv.backgroundColor = .clear
        #if DEBUG
        // e2e only: expose the inner UITextView to UI automation (Detox) so tests can type a caption.
        // DEBUG-gated → not present in release builds.
        tv.accessibilityIdentifier = "rich-text-editor-input"
        #endif

        // Set default paragraph style with consistent line height
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.lineHeightMultiple = defaultLineHeightMultiple
        tv.typingAttributes = [
            .font: UIFont.systemFont(ofSize: 16),
            .paragraphStyle: paragraphStyle
        ]

        return tv
    }()

    private let placeholderLabel: UILabel = {
        let label = UILabel()
        label.textColor = UIColor.placeholderText
        label.font = UIFont.systemFont(ofSize: 16)
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    private let floatingToolbar: FloatingToolbar = {
        let toolbar = FloatingToolbar()
        toolbar.translatesAutoresizingMaskIntoConstraints = true
        toolbar.isHidden = true
        return toolbar
    }()

    private lazy var toolbarBackdrop: UIView = {
        let view = UIView()
        view.backgroundColor = .clear
        view.isUserInteractionEnabled = false
        view.isHidden = true
        return view
    }()

    private var maxHeightConstraint: NSLayoutConstraint?
    private var placeholderTopConstraint: NSLayoutConstraint?
    private var undoStack: [NSAttributedString] = []
    private var redoStack: [NSAttributedString] = []
    private var isInternalChange = false
    private var currentKeyboardHeight: CGFloat = 0
    private var savedSelectionRange: NSRange = NSRange(location: 0, length: 0)

    @objc var placeholder: String = "" {
        didSet { placeholderLabel.text = placeholder }
    }

    @objc var editable: Bool = true {
        didSet {
            textView.isEditable = editable
            applyNumberOfLines()
        }
    }

    @objc var maxHeight: CGFloat = 0 {
        didSet {
            if maxHeight > 0 {
                maxHeightConstraint?.isActive = false
                maxHeightConstraint = textView.heightAnchor.constraint(lessThanOrEqualToConstant: maxHeight)
                maxHeightConstraint?.isActive = true
            }
        }
    }

    @objc var numberOfLines: Int = 0 {
        didSet {
            applyNumberOfLines()
        }
    }

    @objc var showToolbar: Bool = true

    /// When true, Bold/Italic/Underline/Strikethrough appear in the text selection context menu.
    @objc var showTextSelectionMenuItems: Bool = true {
        didSet {
            if showTextSelectionMenuItems {
                let boldItem = UIMenuItem(title: "Bold", action: #selector(RichTextView.formatBold))
                let italicItem = UIMenuItem(title: "Italic", action: #selector(RichTextView.formatItalic))
                let underlineItem = UIMenuItem(title: "Underline", action: #selector(RichTextView.formatUnderline))
                let strikethroughItem = UIMenuItem(title: "Strikethrough", action: #selector(RichTextView.formatStrikethrough))
                UIMenuController.shared.menuItems = [boldItem, italicItem, underlineItem, strikethroughItem]
            } else {
                UIMenuController.shared.menuItems = []
            }
        }
    }

    @objc var toolbarOptions: [String]? {
        didSet {
            floatingToolbar.setToolbarOptions(toolbarOptions)
        }
    }

    @objc var initialContentJson: String? {
        didSet {
            if let jsonString = initialContentJson,
               let data = jsonString.data(using: .utf8),
               let blocks = try? JSONSerialization.jsonObject(with: data, options: []) as? [[String: Any]] {
                setContent(blocks: blocks)
            }
        }
    }

    @objc var variant: String = "outlined" {
        didSet {
            applyVariantStyle()
        }
    }

    @objc var onContentChange: RCTDirectEventBlock?
    @objc var onSelectionChange: RCTDirectEventBlock?
    @objc var onEditorFocus: RCTDirectEventBlock?
    @objc var onEditorBlur: RCTDirectEventBlock?
    @objc var onSizeChange: RCTDirectEventBlock?
    @objc var onActiveStylesChange: RCTDirectEventBlock?
    @objc var onLinkTap: RCTDirectEventBlock?
    @objc var onPasteMedia: RCTDirectEventBlock?

    // Props sent from JS that need @objc declarations to avoid doesNotRecognizeSelector crash
    @objc var toolbarMode: String?
    @objc var selection: NSDictionary?
    @objc var textStyle: NSDictionary? {
        didSet {
            guard let style = textStyle else { return }
            if let fontSize = style["fontSize"] as? CGFloat, fontSize > 0 {
                let currentFont = textView.font ?? UIFont.systemFont(ofSize: 16)
                textView.font = currentFont.withSize(fontSize)
                placeholderLabel.font = UIFont.systemFont(ofSize: fontSize)
                // Update typingAttributes so new text uses the correct size
                var attrs = textView.typingAttributes
                if let existingFont = attrs[.font] as? UIFont {
                    attrs[.font] = existingFont.withSize(fontSize)
                } else {
                    attrs[.font] = UIFont.systemFont(ofSize: fontSize)
                }
                textView.typingAttributes = attrs
            }
            if let colorStr = style["color"] as? String {
                // Parse hex color string (#RRGGBB or #AARRGGBB)
                var hex = colorStr.trimmingCharacters(in: .whitespacesAndNewlines)
                if hex.hasPrefix("#") { hex = String(hex.dropFirst()) }
                if let val = UInt64(hex, radix: 16) {
                    let r, g, b, a: CGFloat
                    if hex.count == 8 {
                        a = CGFloat((val >> 24) & 0xFF) / 255.0
                        r = CGFloat((val >> 16) & 0xFF) / 255.0
                        g = CGFloat((val >> 8) & 0xFF) / 255.0
                        b = CGFloat(val & 0xFF) / 255.0
                    } else {
                        a = 1.0
                        r = CGFloat((val >> 16) & 0xFF) / 255.0
                        g = CGFloat((val >> 8) & 0xFF) / 255.0
                        b = CGFloat(val & 0xFF) / 255.0
                    }
                    textView.textColor = UIColor(red: r, green: g, blue: b, alpha: a)
                }
            }
            updateContentSize()
        }
    }
    @objc var placeholderTextColor: String?
    @objc var text: String?
    @objc var codeBackgroundColor: String?
    @objc var codeBorderColor: String?
    @objc var codeTextColor: String?
    @objc var codeFontSize: NSNumber?

    private var lastReportedHeight: CGFloat = 0
    private var calculatedHeight: CGFloat = 22

    // Pending styles for type-ahead formatting (matches Android pendingStyles/explicitlyOffStyles)
    private var pendingStyles: Set<String> = []
    private var explicitlyOffStyles: Set<String> = []
    private var pendingStylesInsertPos: Int = -1

    /// Typing attributes to forcefully restore after all processing (including async
    /// JS bridge callbacks like syncMentionRanges) completes. Set by autoContinueListOnEnter
    /// so that inline styles (bold, italic, etc.) survive across list line continuation.
    private var deferredTypingAttrs: [NSAttributedString.Key: Any]? = nil

    /// Capture active inline styles from typingAttributes into pendingStyles
    /// so they survive attributedText resets during list continuation.
    /// Mirrors Android behavior where pendingStyles persist across Enter in lists.
    private func captureInlineStylesToPending() {
        let attrs = textView.typingAttributes
        if let font = attrs[.font] as? UIFont {
            let traits = font.fontDescriptor.symbolicTraits
            if traits.contains(.traitBold) { pendingStyles.insert("bold") }
            if traits.contains(.traitItalic) { pendingStyles.insert("italic") }
        }
        if let underline = attrs[.underlineStyle] as? Int, underline != 0 {
            pendingStyles.insert("underline")
        }
        if let strike = attrs[.strikethroughStyle] as? Int, strike != 0 {
            pendingStyles.insert("strikethrough")
        }
        pendingStylesInsertPos = textView.selectedRange.location
    }

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }

    private lazy var bottomBorder: UIView = {
        let view = UIView()
        view.backgroundColor = UIColor.separator
        view.translatesAutoresizingMaskIntoConstraints = false
        view.isHidden = true
        return view
    }()

    private func setupView() {
        backgroundColor = .systemBackground

        addSubview(textView)
        addSubview(placeholderLabel)
        addSubview(bottomBorder)

        NSLayoutConstraint.activate([
            bottomBorder.leadingAnchor.constraint(equalTo: leadingAnchor),
            bottomBorder.trailingAnchor.constraint(equalTo: trailingAnchor),
            bottomBorder.bottomAnchor.constraint(equalTo: bottomAnchor),
            bottomBorder.heightAnchor.constraint(equalToConstant: 1)
        ])

        applyVariantStyle()

        floatingToolbar.editorView = self

        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(backdropTapped))
        toolbarBackdrop.addGestureRecognizer(tapGesture)

        DispatchQueue.main.async { [weak self] in
            if let window = self?.window {
                window.addSubview(self!.toolbarBackdrop)
                window.addSubview(self!.floatingToolbar)
            }
        }

        clipsToBounds = true

        NSLayoutConstraint.activate([
            textView.topAnchor.constraint(equalTo: topAnchor),
            textView.leadingAnchor.constraint(equalTo: leadingAnchor),
            textView.trailingAnchor.constraint(equalTo: trailingAnchor),
            textView.bottomAnchor.constraint(equalTo: bottomAnchor),

            placeholderLabel.leadingAnchor.constraint(equalTo: textView.leadingAnchor, constant: 9)
        ])

        placeholderTopConstraint = placeholderLabel.topAnchor.constraint(equalTo: textView.topAnchor, constant: 4)
        placeholderTopConstraint?.isActive = true

        textView.delegate = self
        textView.editorContainer = self
        textView.isScrollEnabled = false
        textView.alwaysBounceVertical = false
        textView.showsVerticalScrollIndicator = false

        // Register custom context menu items for text selection (matching Android Bold/Italic + Underline/Strikethrough)
        let boldItem = UIMenuItem(title: "Bold", action: #selector(RichTextView.formatBold))
        let italicItem = UIMenuItem(title: "Italic", action: #selector(RichTextView.formatItalic))
        let underlineItem = UIMenuItem(title: "Underline", action: #selector(RichTextView.formatUnderline))
        let strikethroughItem = UIMenuItem(title: "Strikethrough", action: #selector(RichTextView.formatStrikethrough))
        UIMenuController.shared.menuItems = [boldItem, italicItem, underlineItem, strikethroughItem]

        // Tap gesture for intercepting link taps in editable mode
        // (shouldInteractWith delegate doesn't fire when isEditable=true)
        let linkTapGesture = UITapGestureRecognizer(target: self, action: #selector(handleLinkTap(_:)))
        linkTapGesture.delegate = self
        textView.addGestureRecognizer(linkTapGesture)

        NotificationCenter.default.addObserver(self, selector: #selector(textDidChange), name: UITextView.textDidChangeNotification, object: textView)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillShow(_:)), name: UIResponder.keyboardWillShowNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillHide(_:)), name: UIResponder.keyboardWillHideNotification, object: nil)
    }

    @objc private func keyboardWillShow(_ notification: Notification) {
        if let keyboardFrame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect {
            currentKeyboardHeight = keyboardFrame.height
        }
    }

    @objc private func keyboardWillHide(_ notification: Notification) {
        currentKeyboardHeight = 0
    }

    @objc private func backdropTapped() {
        hideToolbar()
        textView.selectedRange = NSRange(location: textView.selectedRange.location, length: 0)
    }

    private func hideToolbar() {
        floatingToolbar.isHidden = true
        toolbarBackdrop.isHidden = true
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        if let window = window {
            toolbarBackdrop.removeFromSuperview()
            floatingToolbar.removeFromSuperview()
            window.addSubview(toolbarBackdrop)
            window.addSubview(floatingToolbar)
        }
    }

    override func removeFromSuperview() {
        toolbarBackdrop.removeFromSuperview()
        floatingToolbar.removeFromSuperview()
        super.removeFromSuperview()
    }

    deinit {
        toolbarBackdrop.removeFromSuperview()
        floatingToolbar.removeFromSuperview()
        NotificationCenter.default.removeObserver(self)
    }

    private func updateToolbarPosition() {
        guard let selectedRange = textView.selectedTextRange,
              !selectedRange.isEmpty,
              showToolbar,
              let window = window else {
            hideToolbar()
            return
        }

       let endRect = textView.caretRect(for: selectedRange.end)
        let startRect = textView.caretRect(for: selectedRange.start)

        guard !endRect.isNull && !endRect.isInfinite else {
            hideToolbar()
            return
        }

        let convertedEndRect = textView.convert(endRect, to: window)
        let convertedStartRect = textView.convert(startRect, to: window)

        guard convertedEndRect.maxY > 0 && convertedStartRect.minY < window.bounds.height else {
            hideToolbar()
            return
        }

        let toolbarWidth: CGFloat = floatingToolbar.getToolbarWidth()
        let toolbarHeight: CGFloat = 52

        let safeAreaTop = window.safeAreaInsets.top
        let safeAreaBottom = window.safeAreaInsets.bottom

        var toolbarX = (window.bounds.width - toolbarWidth) / 2
        var toolbarY = convertedEndRect.maxY + 8

        toolbarX = max(8, min(toolbarX, window.bounds.width - toolbarWidth - 8))

        let maxY = window.bounds.height - safeAreaBottom - currentKeyboardHeight - toolbarHeight - 8
        if toolbarY > maxY {
            toolbarY = convertedStartRect.minY - toolbarHeight - 8
            if toolbarY < safeAreaTop + 8 {
                toolbarY = safeAreaTop + 8
            }
        }

        toolbarBackdrop.frame = window.bounds
        toolbarBackdrop.isHidden = false
        window.bringSubviewToFront(toolbarBackdrop)

        floatingToolbar.frame = CGRect(x: toolbarX, y: toolbarY, width: toolbarWidth, height: toolbarHeight)
        floatingToolbar.isHidden = false
        window.bringSubviewToFront(floatingToolbar)
    }

    func textViewDidBeginEditing(_ textView: UITextView) {
        onEditorFocus?([:])
    }

    func textViewDidEndEditing(_ textView: UITextView) {
        hideToolbar()
        onEditorBlur?([:])
    }

    /// Handle tap on links in the editable text view.
    /// UITextView's shouldInteractWith delegate doesn't fire when isEditable=true,
    /// so we use a tap gesture recognizer (matching Android's onSingleTapUp).
    @objc func handleLinkTap(_ gesture: UITapGestureRecognizer) {
        let location = gesture.location(in: textView)
        guard let position = textView.closestPosition(to: location) else { return }
        let charIndex = textView.offset(from: textView.beginningOfDocument, to: position)
        let attrText = textView.attributedText ?? NSAttributedString()
        guard charIndex >= 0 && charIndex < attrText.length else { return }

        // Check if the tapped character has a link attribute
        var effectiveRange = NSRange(location: 0, length: 0)
        guard let linkValue = attrText.attribute(LinkURLAttributeKey, at: charIndex, effectiveRange: &effectiveRange) else { return }

        let urlString: String
        if let url = linkValue as? URL {
            urlString = url.absoluteString
        } else if let str = linkValue as? String {
            urlString = str
        } else {
            return
        }

        let linkText = (attrText.string as NSString).substring(with: effectiveRange)
        onLinkTap?([
            "url": urlString,
            "text": linkText,
            "location": effectiveRange.location,
            "length": effectiveRange.length
        ])
    }

    /// Allow the link tap gesture to fire simultaneously with the text view's
    /// built-in gestures so normal cursor placement and selection still work.
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool {
        return true
    }

    func textViewDidChangeSelection(_ textView: UITextView) {
       let range = textView.selectedRange
        if range.length > 0 {
            savedSelectionRange = range
        }

        // Skip toolbar/style updates during internal changes (e.g. autoContinueListOnEnter)
        // to avoid emitting stale style state before typingAttributes are restored.
        guard !isInternalChange else { return }

        // Invalidate pending styles if cursor moved away from insert position
        if pendingStylesInsertPos >= 0 && (!pendingStyles.isEmpty || !explicitlyOffStyles.isEmpty) {
            if range.location != pendingStylesInsertPos && range.location != pendingStylesInsertPos + 1 {
                // Preserve "codeBlock" across cursor movements — it's a persistent
                // block-level style that should survive until explicitly toggled off
                let hadCodeBlock = pendingStyles.contains("codeBlock")
                pendingStyles.removeAll()
                explicitlyOffStyles.removeAll()
                pendingStylesInsertPos = -1
                if hadCodeBlock {
                    pendingStyles.insert("codeBlock")
                    pendingStylesInsertPos = range.location
                }
            } else if range.location == pendingStylesInsertPos + 1 {
                // User typed one char — advance insert pos
                pendingStylesInsertPos = range.location
            }
        }

        updateToolbarPosition()
        updateToolbarButtonStates()
        emitActiveStyles()

        // Strip mention-specific attributes from typingAttributes when cursor
        // lands adjacent to (or inherits from) a deleted mention.
        do {
            var needsClean = false
            var isMentionTriggered = false
            if let attrText = textView.attributedText, attrText.length > 0, range.length == 0, range.location > 0 {
                let checkIdx = min(range.location - 1, attrText.length - 1)
                let charAttrs = attrText.attributes(at: checkIdx, effectiveRange: nil)
                if charAttrs[MentionMarkerKey] != nil {
                    needsClean = true
                    isMentionTriggered = true
                }
            }
            if !needsClean, let bg = textView.typingAttributes[.backgroundColor] as? UIColor {
                var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
                bg.getRed(&r, green: &g, blue: &b, alpha: &a)
                let isInlineCodeBg = abs(r - 245.0/255.0) < 0.02 && abs(g - 245.0/255.0) < 0.02 && abs(b - 245.0/255.0) < 0.02 && a > 0.9
                let isCodeBlockBg = abs(r - 250.0/255.0) < 0.02 && abs(g - 250.0/255.0) < 0.02 && abs(b - 250.0/255.0) < 0.02 && a > 0.9
                if !isInlineCodeBg && !isCodeBlockBg { needsClean = true }
            }
            if needsClean {
                var cleanAttrs = textView.typingAttributes
                cleanAttrs.removeValue(forKey: .backgroundColor)
                cleanAttrs.removeValue(forKey: MentionMarkerKey)
                if let fg = cleanAttrs[.foregroundColor] as? UIColor {
                    var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
                    fg.getRed(&r, green: &g, blue: &b, alpha: &a)
                    if abs(r - 104.0/255.0) < 0.05 && abs(g - 82.0/255.0) < 0.05 && abs(b - 214.0/255.0) < 0.05 && a > 0.9 {
                        cleanAttrs[.foregroundColor] = UIColor.label
                    }
                }
                // Only strip bold when cleanup was triggered by an actual mention marker.
                // When triggered by a stray backgroundColor alone, bold is legitimate
                // user formatting (e.g., cursor moved into bold text after backspace)
                // and must be preserved.
                if isMentionTriggered,
                   let font = cleanAttrs[.font] as? UIFont,
                   font.fontDescriptor.symbolicTraits.contains(.traitBold),
                   !pendingStyles.contains("bold") {
                    let unbold = font.fontDescriptor.withSymbolicTraits(
                        font.fontDescriptor.symbolicTraits.subtracting(.traitBold)
                    ) ?? font.fontDescriptor
                    cleanAttrs[.font] = UIFont(descriptor: unbold, size: font.pointSize)
                }
                textView.typingAttributes = cleanAttrs
            }
        }

        emitActiveStyles()

        // Adjust selection positions to account for zero-width spaces (\u{200B})
        // that are stripped from text in sendContentChange().
        // Without this, JS-side cursor positions don't match the cleaned text length.
        // Matches Android's onSelectionChanged ZWS adjustment.
        let rawText = textView.text ?? ""
        var zwspBeforeStart = 0
        for i in 0..<min(range.location, rawText.count) {
            if rawText[rawText.index(rawText.startIndex, offsetBy: i)] == "\u{200B}" {
                zwspBeforeStart += 1
            }
        }
        let adjustedStart = range.location - zwspBeforeStart
        let adjustedEnd: Int
        if range.length == 0 {
            adjustedEnd = adjustedStart
        } else {
            var zwspBeforeEnd = zwspBeforeStart
            let endPos = range.location + range.length
            for i in range.location..<min(endPos, rawText.count) {
                if rawText[rawText.index(rawText.startIndex, offsetBy: i)] == "\u{200B}" {
                    zwspBeforeEnd += 1
                }
            }
            adjustedEnd = endPos - zwspBeforeEnd
        }

        onSelectionChange?([
            "start": adjustedStart,
            "end": adjustedEnd
        ])
    }

    private func emitActiveStyles() {
        guard let attributedText = textView.attributedText else { return }

        let range = textView.selectedRange
        let checkRange = range.length > 0 ? range : NSRange(location: max(0, range.location - 1), length: 1)

        guard checkRange.location >= 0, checkRange.location < attributedText.length else {
            onActiveStylesChange?([
                "bold": pendingStyles.contains("bold") && !explicitlyOffStyles.contains("bold"),
                "italic": pendingStyles.contains("italic") && !explicitlyOffStyles.contains("italic"),
                "underline": pendingStyles.contains("underline") && !explicitlyOffStyles.contains("underline"),
                "strikethrough": pendingStyles.contains("strikethrough") && !explicitlyOffStyles.contains("strikethrough"),
                "code": pendingStyles.contains("code") && !explicitlyOffStyles.contains("code"),
                "codeBlock": pendingStyles.contains("codeBlock"),
                "highlight": false,
                "blockType": "paragraph",
                "alignment": "left"
            ])
            return
        }

        var hasBold = false
        var hasItalic = false
        var hasUnderline = false
        var hasStrikethrough = false
        var hasCode = false
        var hasHighlight = false
        var blockType = "paragraph"
        var alignment = "left"

        // When cursor has no selection, typingAttributes is the authoritative source
        // for what formatting will apply to the next typed character. This is critical
        // after list continuation (Enter in lists) where the cursor sits after a
        // plain-styled prefix but typingAttributes carry the user's active formatting.
        if range.length == 0 {
            let typingAttrs = textView.typingAttributes
            if let font = typingAttrs[.font] as? UIFont {
                let traits = font.fontDescriptor.symbolicTraits
                hasBold = traits.contains(.traitBold)
                hasItalic = traits.contains(.traitItalic)
                if font.fontDescriptor.symbolicTraits.contains(.traitMonoSpace) ||
                   font.fontName.lowercased().contains("mono") ||
                   font.fontName.lowercased().contains("courier") {
                    hasCode = true
                }
            }
            if let underlineStyle = typingAttrs[.underlineStyle] as? Int, underlineStyle != 0 {
                hasUnderline = true
            }
            if let strikeStyle = typingAttrs[.strikethroughStyle] as? Int, strikeStyle != 0 {
                hasStrikethrough = true
            }
            if let bgColor = typingAttrs[.backgroundColor] as? UIColor {
                var red: CGFloat = 0, green: CGFloat = 0, blue: CGFloat = 0, alpha: CGFloat = 0
                bgColor.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
                if red > 0.8 && green > 0.8 && blue < 0.5 {
                    hasHighlight = true
                }
            }
        } else {
            if let font = attributedText.attribute(.font, at: checkRange.location, effectiveRange: nil) as? UIFont {
                let traits = font.fontDescriptor.symbolicTraits
                hasBold = traits.contains(.traitBold)
                hasItalic = traits.contains(.traitItalic)

                if font.fontDescriptor.symbolicTraits.contains(.traitMonoSpace) ||
                   font.fontName.lowercased().contains("mono") ||
                   font.fontName.lowercased().contains("courier") {
                    hasCode = true
                }
            }

            if let underlineStyle = attributedText.attribute(.underlineStyle, at: checkRange.location, effectiveRange: nil) as? Int,
               underlineStyle != 0 {
                hasUnderline = true
            }

            if let strikeStyle = attributedText.attribute(.strikethroughStyle, at: checkRange.location, effectiveRange: nil) as? Int,
               strikeStyle != 0 {
                hasStrikethrough = true
            }

            if let bgColor = attributedText.attribute(.backgroundColor, at: checkRange.location, effectiveRange: nil) as? UIColor {
                var red: CGFloat = 0, green: CGFloat = 0, blue: CGFloat = 0, alpha: CGFloat = 0
                bgColor.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
                if red > 0.8 && green > 0.8 && blue < 0.5 {
                    hasHighlight = true
                }
            }
        }

        let text = textView.text ?? ""
        let lineRange = (text as NSString).lineRange(for: NSRange(location: range.location, length: 0))
        let lineText = (text as NSString).substring(with: lineRange)

        // Detect combined blockquote+list types (must check before individual prefixes)
        let hasQuotePrefix = lineText.hasPrefix("▎ ")
        let contentAfterQuote = hasQuotePrefix ? String(lineText.dropFirst(2)) : lineText

        if hasQuotePrefix && contentAfterQuote.hasPrefix("• ") {
            blockType = "quoteBullet"
        } else if hasQuotePrefix && contentAfterQuote.range(of: "^\\d+\\.\\s", options: .regularExpression) != nil {
            blockType = "quoteNumbered"
        } else if contentAfterQuote.hasPrefix("• ") {
            blockType = "bullet"
        } else if contentAfterQuote.range(of: "^\\d+\\.\\s", options: .regularExpression) != nil {
            blockType = "numbered"
        } else if lineText.hasPrefix("☐ ") || lineText.hasPrefix("☑ ") {
            blockType = "checklist"
        } else if hasQuotePrefix {
            blockType = "quote"
        }

        if let font = attributedText.attribute(.font, at: checkRange.location, effectiveRange: nil) as? UIFont,
           font.pointSize > 20 {
            blockType = "heading"
        }

        if let paragraphStyle = attributedText.attribute(.paragraphStyle, at: checkRange.location, effectiveRange: nil) as? NSParagraphStyle {
            switch paragraphStyle.alignment {
            case .center:
                alignment = "center"
            case .right:
                alignment = "right"
            default:
                alignment = "left"
            }
        }

        // Detect code block state from CodeBlockAttributeKey
        var hasCodeBlock = false
        if checkRange.location >= 0 && checkRange.location + checkRange.length <= attributedText.length {
            attributedText.enumerateAttribute(CodeBlockAttributeKey, in: checkRange, options: []) { value, _, _ in
                if value != nil { hasCodeBlock = true }
            }
        }
        let codeBlockActive = hasCodeBlock || pendingStyles.contains("codeBlock")

        onActiveStylesChange?([
            "bold": (hasBold || pendingStyles.contains("bold")) && !explicitlyOffStyles.contains("bold"),
            "italic": (hasItalic || pendingStyles.contains("italic")) && !explicitlyOffStyles.contains("italic"),
            "underline": (hasUnderline || pendingStyles.contains("underline")) && !explicitlyOffStyles.contains("underline"),
            "strikethrough": (hasStrikethrough || pendingStyles.contains("strikethrough")) && !explicitlyOffStyles.contains("strikethrough"),
            "code": (hasCode || pendingStyles.contains("code") || pendingStyles.contains("codeBlock")) && !explicitlyOffStyles.contains("code"),
            "codeBlock": codeBlockActive,
            "highlight": hasHighlight,
            "blockType": blockType,
            "alignment": alignment
        ])
    }

    func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {

        // --- Mention bleed-through prevention (iOS equivalent of Android SPAN_EXCLUSIVE_EXCLUSIVE) ---
        // Check if typingAttributes carry mention styling and strip it before insertion.
        do {
            var mentionCleanNeeded = false
            var isMentionTriggered = false
            // Check 1: cursor is adjacent to text with MentionMarkerKey
            if let attrText = textView.attributedText, attrText.length > 0 {
                let checkIdx = max(0, min(range.location - 1, attrText.length - 1))
                if range.location > 0 {
                    let charAttrs = attrText.attributes(at: checkIdx, effectiveRange: nil)
                    if charAttrs[MentionMarkerKey] != nil {
                        mentionCleanNeeded = true
                        isMentionTriggered = true
                    }
                }
            }
            // Check 2: typingAttributes have a non-whitelisted backgroundColor
            if !mentionCleanNeeded, let bg = textView.typingAttributes[.backgroundColor] as? UIColor {
                var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
                bg.getRed(&r, green: &g, blue: &b, alpha: &a)
                // Whitelist: inline code (#F5F5F5), code block (#FAFAFA), highlight colors
                let isInlineCodeBg = abs(r - 245.0/255.0) < 0.02 && abs(g - 245.0/255.0) < 0.02 && abs(b - 245.0/255.0) < 0.02 && a > 0.9
                let isCodeBlockBg = abs(r - 250.0/255.0) < 0.02 && abs(g - 250.0/255.0) < 0.02 && abs(b - 250.0/255.0) < 0.02 && a > 0.9
                if !isInlineCodeBg && !isCodeBlockBg { mentionCleanNeeded = true }
            }
            if mentionCleanNeeded {
                var cleanAttrs = textView.typingAttributes
                cleanAttrs.removeValue(forKey: .backgroundColor)
                cleanAttrs.removeValue(forKey: MentionMarkerKey)
                // Restore foreground if it's mention purple (#6852D6)
                if let fg = cleanAttrs[.foregroundColor] as? UIColor {
                    var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
                    fg.getRed(&r, green: &g, blue: &b, alpha: &a)
                    if abs(r - 104.0/255.0) < 0.05 && abs(g - 82.0/255.0) < 0.05 && abs(b - 214.0/255.0) < 0.05 && a > 0.9 {
                        cleanAttrs[.foregroundColor] = UIColor.label
                    }
                }
                // Only strip bold when cleanup was triggered by an actual mention marker.
                // When triggered by a stray backgroundColor alone, bold is legitimate
                // user formatting and must be preserved.
                if isMentionTriggered,
                   let font = cleanAttrs[.font] as? UIFont,
                   font.fontDescriptor.symbolicTraits.contains(.traitBold),
                   !pendingStyles.contains("bold") {
                    let unbold = font.fontDescriptor.withSymbolicTraits(
                        font.fontDescriptor.symbolicTraits.subtracting(.traitBold)
                    ) ?? font.fontDescriptor
                    cleanAttrs[.font] = UIFont(descriptor: unbold, size: font.pointSize)
                }
                textView.typingAttributes = cleanAttrs
            }
        }

        if text.isEmpty && range.length == 1 {
            let currentText = textView.text ?? ""
            let nsText = currentText as NSString

            var lineStart = range.location
            while lineStart > 0 && nsText.character(at: lineStart - 1) != 10 {
                lineStart -= 1
            }

            var lineEnd = range.location
            while lineEnd < currentText.count && nsText.character(at: lineEnd) != 10 {
                lineEnd += 1
            }

            let currentLine = nsText.substring(with: NSRange(location: lineStart, length: lineEnd - lineStart))

            let numberedPattern = "^(\\d+)\\.\\s"
            if let regex = try? NSRegularExpression(pattern: numberedPattern),
               let match = regex.firstMatch(in: currentLine, range: NSRange(location: 0, length: currentLine.count)) {
                let prefixEnd = lineStart + match.range.length
                if range.location < prefixEnd && range.location >= lineStart {
                    let prefixRange = NSRange(location: lineStart, length: match.range.length)
                    isInternalChange = true
                    let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
                    mutable.deleteCharacters(in: prefixRange)
                    textView.attributedText = mutable
                    textView.selectedRange = NSRange(location: lineStart, length: 0)
                    isInternalChange = false
                    renumberNumberedLists()
                    saveToUndoStack()
                    sendContentChange()
                    return false
                }
            }

            if currentLine.hasPrefix("• ") {
                let prefixEnd = lineStart + 2
                if range.location < prefixEnd && range.location >= lineStart {
                    let prefixRange = NSRange(location: lineStart, length: 2)
                    isInternalChange = true
                    let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
                    mutable.deleteCharacters(in: prefixRange)
                    textView.attributedText = mutable
                    textView.selectedRange = NSRange(location: lineStart, length: 0)
                    isInternalChange = false
                    saveToUndoStack()
                    sendContentChange()
                    return false
                }
            }

           if currentLine.hasPrefix("☐ ") || currentLine.hasPrefix("☑ ") {
                let prefixEnd = lineStart + 2
                if range.location < prefixEnd && range.location >= lineStart {
                    let prefixRange = NSRange(location: lineStart, length: 2)
                    isInternalChange = true
                    let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
                    mutable.deleteCharacters(in: prefixRange)
                    textView.attributedText = mutable
                    textView.selectedRange = NSRange(location: lineStart, length: 0)
                    isInternalChange = false
                    saveToUndoStack()
                    sendContentChange()
                    return false
                }
            }

            // Handle blockquote prefix (▎ ) backspace — remove entire prefix when cursor is within it
            if currentLine.hasPrefix("▎ ") {
                let prefixEnd = lineStart + 2
                if range.location < prefixEnd && range.location >= lineStart {
                    let prefixRange = NSRange(location: lineStart, length: 2)
                    isInternalChange = true
                    let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
                    mutable.deleteCharacters(in: prefixRange)
                    // Ensure remaining text on this line has visible foreground color
                    // (the ▎ char uses .clear foreground which can bleed into adjacent text)
                    let newLineEnd = lineEnd - 2
                    if newLineEnd > lineStart {
                        mutable.addAttribute(.foregroundColor, value: UIColor.label, range: NSRange(location: lineStart, length: newLineEnd - lineStart))
                    }
                    textView.attributedText = mutable
                    textView.selectedRange = NSRange(location: lineStart, length: 0)
                    // Reset typingAttributes to visible color so new typing is not invisible
                    let paragraphStyle = NSMutableParagraphStyle()
                    paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
                    textView.typingAttributes = [
                        .font: UIFont.systemFont(ofSize: 16),
                        .foregroundColor: UIColor.label,
                        .paragraphStyle: paragraphStyle
                    ]
                    isInternalChange = false
                    placeholderLabel.isHidden = !textView.text.isEmpty
                    DispatchQueue.main.async { [weak self] in
                        self?.textView.setNeedsDisplay()
                    }
                    saveToUndoStack()
                    sendContentChange()
                    return false
                }
            }

            // Handle standalone blockquote character (▎ without trailing space)
            if currentLine == "▎" {
                let prefixRange = NSRange(location: lineStart, length: lineEnd - lineStart)
                isInternalChange = true
                let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
                mutable.deleteCharacters(in: prefixRange)
                textView.attributedText = mutable
                textView.selectedRange = NSRange(location: lineStart, length: 0)
                // Reset typingAttributes to visible color
                let paragraphStyle = NSMutableParagraphStyle()
                paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
                textView.typingAttributes = [
                    .font: UIFont.systemFont(ofSize: 16),
                    .foregroundColor: UIColor.label,
                    .paragraphStyle: paragraphStyle
                ]
                isInternalChange = false
                placeholderLabel.isHidden = !textView.text.isEmpty
                DispatchQueue.main.async { [weak self] in
                    self?.textView.setNeedsDisplay()
                }
                saveToUndoStack()
                sendContentChange()
                return false
            }
        }

        guard text == "\n" else { return true }

        let currentText = textView.text ?? ""
        let nsText = currentText as NSString

        var lineStart = range.location
        while lineStart > 0 && nsText.character(at: lineStart - 1) != 10 {
            lineStart -= 1
        }

        let lineLength = range.location - lineStart
        let currentLine = nsText.substring(with: NSRange(location: lineStart, length: lineLength))

        // Combined blockquote + numbered list (▎ N. ) — must check before individual prefixes
        let quoteNumberedPattern = "^▎ (\\d+)\\.\\s"
        if let qnRegex = try? NSRegularExpression(pattern: quoteNumberedPattern),
           let qnMatch = qnRegex.firstMatch(in: currentLine, range: NSRange(location: 0, length: currentLine.count)),
           let numberRange = Range(qnMatch.range(at: 1), in: currentLine) {

            let currentNumber = Int(currentLine[numberRange]) ?? 1
            let lineContent = String(currentLine.dropFirst(qnMatch.range.length))

            if lineContent.trimmingCharacters(in: .whitespaces).isEmpty {
                // Empty combined line — remove the prefix
                isInternalChange = true
                let deleteRange = NSRange(location: lineStart, length: range.location - lineStart)
                let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
                mutable.deleteCharacters(in: deleteRange)
                textView.attributedText = mutable
                textView.selectedRange = NSRange(location: lineStart, length: 0)
                let paragraphStyle = NSMutableParagraphStyle()
                paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
                textView.typingAttributes = [
                    .font: UIFont.systemFont(ofSize: 16),
                    .foregroundColor: UIColor.label,
                    .paragraphStyle: paragraphStyle
                ]
                isInternalChange = false
                renumberNumberedLists()
                DispatchQueue.main.async { [weak self] in
                    self?.textView.setNeedsDisplay()
                }
                saveToUndoStack()
                sendContentChange()
                return false
            }

            let nextNumber = currentNumber + 1
            let prefix = "▎ \(nextNumber). "
            // Capture active inline styles into pendingStyles so they survive
            // attributedText resets during list continuation (matches Android).
            captureInlineStylesToPending()
            isInternalChange = true
            let plainAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 16),
                .foregroundColor: UIColor.label
            ]
            let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
            let insertPos = range.location
            let newlineAttr = NSAttributedString(string: "\n", attributes: plainAttributes)
            var quoteCharAttrs = plainAttributes
            quoteCharAttrs[.foregroundColor] = UIColor.clear
            let quoteCharAttr = NSAttributedString(string: "▎", attributes: quoteCharAttrs)
            let restAttr = NSAttributedString(string: " \(nextNumber). ", attributes: plainAttributes)
            let insertAttr = NSMutableAttributedString()
            insertAttr.append(newlineAttr)
            insertAttr.append(quoteCharAttr)
            insertAttr.append(restAttr)
            mutable.insert(insertAttr, at: insertPos)
            textView.attributedText = mutable
            textView.selectedRange = NSRange(location: insertPos + prefix.count + 1, length: 0)
            applyPendingStylesToTypingAttributes()
            deferredTypingAttrs = textView.typingAttributes
            isInternalChange = false
            renumberNumberedLists()
            DispatchQueue.main.async { [weak self] in
                self?.textView.setNeedsDisplay()
            }
            saveToUndoStack()
            sendContentChange()
            return false
        }

        // Combined blockquote + bullet list (▎ • )
        if currentLine.hasPrefix("▎ • ") {
            let lineContent = String(currentLine.dropFirst(4))
            if lineContent.trimmingCharacters(in: .whitespaces).isEmpty {
                // Empty combined line — remove the prefix
                isInternalChange = true
                let deleteRange = NSRange(location: lineStart, length: range.location - lineStart)
                let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
                mutable.deleteCharacters(in: deleteRange)
                textView.attributedText = mutable
                textView.selectedRange = NSRange(location: lineStart, length: 0)
                let paragraphStyle = NSMutableParagraphStyle()
                paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
                textView.typingAttributes = [
                    .font: UIFont.systemFont(ofSize: 16),
                    .foregroundColor: UIColor.label,
                    .paragraphStyle: paragraphStyle
                ]
                isInternalChange = false
                DispatchQueue.main.async { [weak self] in
                    self?.textView.setNeedsDisplay()
                }
                saveToUndoStack()
                sendContentChange()
                return false
            }

            // Capture active inline styles into pendingStyles so they survive
            // attributedText resets during list continuation (matches Android).
            captureInlineStylesToPending()
            isInternalChange = true
            let plainAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 16),
                .foregroundColor: UIColor.label
            ]
            let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
            let insertPos = range.location
            let newlineAttr = NSAttributedString(string: "\n", attributes: plainAttributes)
            var quoteCharAttrs = plainAttributes
            quoteCharAttrs[.foregroundColor] = UIColor.clear
            let quoteCharAttr = NSAttributedString(string: "▎", attributes: quoteCharAttrs)
            let restAttr = NSAttributedString(string: " • ", attributes: plainAttributes)
            let insertAttr = NSMutableAttributedString()
            insertAttr.append(newlineAttr)
            insertAttr.append(quoteCharAttr)
            insertAttr.append(restAttr)
            mutable.insert(insertAttr, at: insertPos)
            textView.attributedText = mutable
            textView.selectedRange = NSRange(location: insertPos + 5, length: 0) // \n + ▎ + " • " = 5
            applyPendingStylesToTypingAttributes()
            deferredTypingAttrs = textView.typingAttributes
            isInternalChange = false
            DispatchQueue.main.async { [weak self] in
                self?.textView.setNeedsDisplay()
            }
            saveToUndoStack()
            sendContentChange()
            return false
        }

        if currentLine.hasPrefix("• ") {
            let lineContent = String(currentLine.dropFirst(2))
            if lineContent.trimmingCharacters(in: .whitespaces).isEmpty {
                isInternalChange = true
                let deleteRange = NSRange(location: lineStart, length: range.location - lineStart)
                let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
                mutable.deleteCharacters(in: deleteRange)
                textView.attributedText = mutable
                textView.selectedRange = NSRange(location: lineStart, length: 0)
                isInternalChange = false
                saveToUndoStack()
                sendContentChange()
                return false
            }
            // Capture active inline styles into pendingStyles so they survive
            // attributedText resets during list continuation (matches Android).
            captureInlineStylesToPending()
            isInternalChange = true
            let plainAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 16),
                .foregroundColor: UIColor.label
            ]
            textView.typingAttributes = plainAttributes
            textView.insertText("\n• ")
            // Restore inline styles via pendingStyles mechanism
            applyPendingStylesToTypingAttributes()
            deferredTypingAttrs = textView.typingAttributes
            isInternalChange = false
            saveToUndoStack()
            sendContentChange()
            return false
        }

        let numberedPattern = "^(\\d+)\\.\\s"
        if let regex = try? NSRegularExpression(pattern: numberedPattern),
           let match = regex.firstMatch(in: currentLine, range: NSRange(location: 0, length: currentLine.count)),
           let numberRange = Range(match.range(at: 1), in: currentLine) {

            let currentNumber = Int(currentLine[numberRange]) ?? 1
            let lineContent = String(currentLine.dropFirst(match.range.length))

            if lineContent.trimmingCharacters(in: .whitespaces).isEmpty {
                isInternalChange = true
                let deleteRange = NSRange(location: lineStart, length: range.location - lineStart)
                let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
                mutable.deleteCharacters(in: deleteRange)
                textView.attributedText = mutable
                textView.selectedRange = NSRange(location: lineStart, length: 0)
                isInternalChange = false
                renumberNumberedLists()
                saveToUndoStack()
                sendContentChange()
                return false
            }

            let nextNumber = currentNumber + 1
            // Capture active inline styles into pendingStyles so they survive
            // attributedText resets during list continuation (matches Android).
            captureInlineStylesToPending()
            isInternalChange = true
            let plainAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 16),
                .foregroundColor: UIColor.label
            ]
            textView.typingAttributes = plainAttributes
            textView.insertText("\n\(nextNumber). ")
            renumberNumberedLists()
            applyPendingStylesToTypingAttributes()
            deferredTypingAttrs = textView.typingAttributes
            isInternalChange = false
            saveToUndoStack()
            sendContentChange()
            return false
        }

        // Handle checklist Enter key
        if currentLine.hasPrefix("☐ ") || currentLine.hasPrefix("☑ ") {
            let lineContent = String(currentLine.dropFirst(2))
            if lineContent.trimmingCharacters(in: .whitespaces).isEmpty {
                isInternalChange = true
                let deleteRange = NSRange(location: lineStart, length: range.location - lineStart)
                let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
                mutable.deleteCharacters(in: deleteRange)
                textView.attributedText = mutable
                textView.selectedRange = NSRange(location: lineStart, length: 0)
                isInternalChange = false
                saveToUndoStack()
                sendContentChange()
                return false
            }
            // Capture active inline styles into pendingStyles so they survive
            // attributedText resets during list continuation (matches Android).
            captureInlineStylesToPending()
            isInternalChange = true
            let plainAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 16),
                .foregroundColor: UIColor.label
            ]
            textView.typingAttributes = plainAttributes
            textView.insertText("\n☐ ")
            applyPendingStylesToTypingAttributes()
            deferredTypingAttrs = textView.typingAttributes
            isInternalChange = false
            saveToUndoStack()
            sendContentChange()
            return false
        }

        // Handle blockquote (▎) Enter key continuation
        if currentLine.hasPrefix("▎ ") {
            let lineContent = String(currentLine.dropFirst(2))
            if lineContent.trimmingCharacters(in: .whitespaces).isEmpty {
                // Empty quote line - remove the prefix
                isInternalChange = true
                let deleteRange = NSRange(location: lineStart, length: range.location - lineStart)
                let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
                mutable.deleteCharacters(in: deleteRange)
                textView.attributedText = mutable
                textView.selectedRange = NSRange(location: lineStart, length: 0)
                // Reset typingAttributes to visible color after removing ▎ prefix
                let paragraphStyle = NSMutableParagraphStyle()
                paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
                textView.typingAttributes = [
                    .font: UIFont.systemFont(ofSize: 16),
                    .foregroundColor: UIColor.label,
                    .paragraphStyle: paragraphStyle
                ]
                isInternalChange = false
                // Trigger redraw for blockquote bar asynchronously to avoid layout issues
                DispatchQueue.main.async { [weak self] in
                    self?.textView.setNeedsDisplay()
                }
                saveToUndoStack()
                sendContentChange()
                return false
            }
            // Continue quote on new line with transparent ▎ character
            // Capture active inline styles into pendingStyles so they survive
            // attributedText resets during list continuation (matches Android).
            captureInlineStylesToPending()
            isInternalChange = true
            let plainAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 16),
                .foregroundColor: UIColor.label
            ]
            // Insert newline + quote prefix with transparent ▎ character
            let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
            let insertPos = range.location
            let newlineAttr = NSAttributedString(string: "\n", attributes: plainAttributes)
            var quoteCharAttrs = plainAttributes
            quoteCharAttrs[.foregroundColor] = UIColor.clear // Make ▎ invisible
            let quoteCharAttr = NSAttributedString(string: "▎", attributes: quoteCharAttrs)
            let spaceAttr = NSAttributedString(string: " ", attributes: plainAttributes)
            let insertAttr = NSMutableAttributedString()
            insertAttr.append(newlineAttr)
            insertAttr.append(quoteCharAttr)
            insertAttr.append(spaceAttr)
            mutable.insert(insertAttr, at: insertPos)
            textView.attributedText = mutable
            textView.selectedRange = NSRange(location: insertPos + 3, length: 0)
            applyPendingStylesToTypingAttributes()
            deferredTypingAttrs = textView.typingAttributes
            isInternalChange = false
            // Trigger redraw for blockquote bar asynchronously to avoid layout issues
            DispatchQueue.main.async { [weak self] in
                self?.textView.setNeedsDisplay()
            }
            saveToUndoStack()
            sendContentChange()
            return false
        }

        // Handle code block Enter key continuation
        // When Enter is pressed inside a code block, ensure the new line inherits
        // code block typingAttributes (monospace font, CodeBlockAttributeKey)
        if let attrText = textView.attributedText, range.location > 0 {
            let checkPos = min(range.location - 1, attrText.length - 1)
            if checkPos >= 0 {
                let hasCodeBlockAttr = attrText.attribute(CodeBlockAttributeKey, at: checkPos, effectiveRange: nil) != nil
                if hasCodeBlockAttr {
                    let monoFont = UIFont.monospacedSystemFont(ofSize: 16, weight: .regular)
                    let paragraphStyle = NSMutableParagraphStyle()
                    paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
                    textView.typingAttributes = [
                        .font: monoFont,
                        .foregroundColor: UIColor.label,
                        .paragraphStyle: paragraphStyle,
                        CodeBlockAttributeKey: true
                    ]
                    pendingStyles.insert("codeBlock")
                    pendingStylesInsertPos = range.location + 1
                }
            }
        }

        return true
    }

    func updateToolbarButtonStates() {
        let range = textView.selectedRange

        let text = textView.text ?? ""
        let nsText = text as NSString
        var lineStart = range.location
        while lineStart > 0 && nsText.character(at: lineStart - 1) != 10 {
            lineStart -= 1
        }

        var lineEnd = range.location
        while lineEnd < text.count && nsText.character(at: lineEnd) != 10 {
            lineEnd += 1
        }

        let lineContent = lineStart < lineEnd ? nsText.substring(with: NSRange(location: lineStart, length: lineEnd - lineStart)) : ""

        // Detect combined blockquote+list patterns (matches Android behavior)
        let hasQuote = lineContent.hasPrefix("▎ ")
        let contentAfterQuote = hasQuote ? String(lineContent.dropFirst(2)) : lineContent
        let hasBullet = contentAfterQuote.hasPrefix("• ")
        let hasNumbered = contentAfterQuote.range(of: "^\\d+\\.\\s", options: .regularExpression) != nil
        let hasChecklist = lineContent.hasPrefix("☐ ") || lineContent.hasPrefix("☑ ")

        var currentAlignment: NSTextAlignment = .left
        if let attrText = textView.attributedText, attrText.length > 0 {
            let checkIndex = min(max(0, range.location - 1), attrText.length - 1)
            if let paragraphStyle = attrText.attribute(.paragraphStyle, at: checkIndex, effectiveRange: nil) as? NSParagraphStyle {
                currentAlignment = paragraphStyle.alignment
            }
        }

        guard range.length > 0 else {
            // Include pending styles for type-ahead toolbar state
            let boldActive = pendingStyles.contains("bold") && !explicitlyOffStyles.contains("bold")
            let italicActive = pendingStyles.contains("italic") && !explicitlyOffStyles.contains("italic")
            let underlineActive = pendingStyles.contains("underline") && !explicitlyOffStyles.contains("underline")
            let strikethroughActive = pendingStyles.contains("strikethrough") && !explicitlyOffStyles.contains("strikethrough")
            let codeActive = pendingStyles.contains("code") && !explicitlyOffStyles.contains("code")

            // Also check attributes at cursor position
            let attributedText = textView.attributedText ?? NSAttributedString()
            if range.location > 0 && range.location <= attributedText.length {
                let checkPos = range.location - 1
                if let font = attributedText.attribute(.font, at: checkPos, effectiveRange: nil) as? UIFont {
                    let traits = font.fontDescriptor.symbolicTraits
                    let hasBoldAtCursor = traits.contains(.traitBold) && !explicitlyOffStyles.contains("bold")
                    let hasItalicAtCursor = traits.contains(.traitItalic) && !explicitlyOffStyles.contains("italic")
                    let hasCodeAtCursor = traits.contains(.traitMonoSpace) && !explicitlyOffStyles.contains("code")
                    floatingToolbar.updateButtonStates(
                        bold: boldActive || hasBoldAtCursor, italic: italicActive || hasItalicAtCursor,
                        underline: underlineActive || ((attributedText.attribute(.underlineStyle, at: checkPos, effectiveRange: nil) as? Int ?? 0) != 0 && !explicitlyOffStyles.contains("underline")),
                        strikethrough: strikethroughActive || ((attributedText.attribute(.strikethroughStyle, at: checkPos, effectiveRange: nil) as? Int ?? 0) != 0 && !explicitlyOffStyles.contains("strikethrough")),
                        code: codeActive || hasCodeAtCursor, highlight: false, heading: false,
                        bullet: hasBullet, numbered: hasNumbered, quote: hasQuote, checklist: hasChecklist,
                        alignLeft: currentAlignment == .left, alignCenter: currentAlignment == .center, alignRight: currentAlignment == .right
                    )
                    return
                }
            }

            floatingToolbar.updateButtonStates(
                bold: boldActive, italic: italicActive, underline: underlineActive, strikethrough: strikethroughActive,
                code: codeActive, highlight: false, heading: false,
                bullet: hasBullet, numbered: hasNumbered, quote: hasQuote, checklist: hasChecklist,
                alignLeft: currentAlignment == .left, alignCenter: currentAlignment == .center, alignRight: currentAlignment == .right
            )
            return
        }

        let attributedText = textView.attributedText ?? NSAttributedString()
        var hasBold = false
        var hasItalic = false
        var hasUnderline = false
        var hasStrikethrough = false
        var hasCode = false
        var hasHighlight = false
        var hasHeading = false

        // Ensure range is valid for the attributed text
        let safeRange = NSRange(
            location: min(range.location, attributedText.length),
            length: min(range.length, max(0, attributedText.length - range.location))
        )
        guard safeRange.length > 0 else {
            floatingToolbar.updateButtonStates(
                bold: false, italic: false, underline: false, strikethrough: false,
                code: false, highlight: false, heading: false,
                bullet: hasBullet, numbered: hasNumbered, quote: hasQuote, checklist: hasChecklist,
                alignLeft: currentAlignment == .left, alignCenter: currentAlignment == .center, alignRight: currentAlignment == .right
            )
            return
        }

        attributedText.enumerateAttributes(in: safeRange, options: []) { attrs, _, _ in
            if let font = attrs[.font] as? UIFont {
                let traits = font.fontDescriptor.symbolicTraits
                if traits.contains(.traitBold) { hasBold = true }
                if traits.contains(.traitItalic) { hasItalic = true }
                if traits.contains(.traitMonoSpace) { hasCode = true }
                if font.pointSize > 18 { hasHeading = true }
            }
            if attrs[.underlineStyle] != nil { hasUnderline = true }
            if attrs[.strikethroughStyle] != nil { hasStrikethrough = true }
            if let bgColor = attrs[.backgroundColor] as? UIColor, bgColor != UIColor.systemGray5 {
                hasHighlight = true
            }
        }

        floatingToolbar.updateButtonStates(
            bold: hasBold, italic: hasItalic, underline: hasUnderline, strikethrough: hasStrikethrough,
            code: hasCode, highlight: hasHighlight, heading: hasHeading,
            bullet: hasBullet, numbered: hasNumbered, quote: hasQuote, checklist: hasChecklist,
            alignLeft: currentAlignment == .left, alignCenter: currentAlignment == .center, alignRight: currentAlignment == .right
        )
    }

    @objc private func textDidChange() {
        placeholderLabel.isHidden = !textView.text.isEmpty
        // Trigger redraw for blockquote bar asynchronously to avoid layout issues
        DispatchQueue.main.async { [weak self] in
            self?.textView.setNeedsDisplay()
        }

        if !isInternalChange {
            // Clear pending styles after text was typed (typingAttributes already applied them).
            // Preserve inline styles (bold, italic, underline, strikethrough) — they persist
            // until the cursor moves to a different position (matching Android behavior where
            // pendingStyles is only cleared in onSelectionChanged, not afterTextChanged).
            // Also preserve "codeBlock" — it's a persistent block-level style.
            if !pendingStyles.isEmpty || !explicitlyOffStyles.isEmpty {
                let hadCodeBlock = pendingStyles.contains("codeBlock")
                let hadBold = pendingStyles.contains("bold")
                let hadItalic = pendingStyles.contains("italic")
                let hadUnderline = pendingStyles.contains("underline")
                let hadStrikethrough = pendingStyles.contains("strikethrough")
                let hadOffBold = explicitlyOffStyles.contains("bold")
                let hadOffItalic = explicitlyOffStyles.contains("italic")
                let hadOffUnderline = explicitlyOffStyles.contains("underline")
                let hadOffStrikethrough = explicitlyOffStyles.contains("strikethrough")
                pendingStyles.removeAll()
                explicitlyOffStyles.removeAll()
                pendingStylesInsertPos = -1
                // Restore persistent styles
                if hadCodeBlock {
                    pendingStyles.insert("codeBlock")
                    pendingStylesInsertPos = textView.selectedRange.location
                }
                if hadBold { pendingStyles.insert("bold") }
                if hadItalic { pendingStyles.insert("italic") }
                if hadUnderline { pendingStyles.insert("underline") }
                if hadStrikethrough { pendingStyles.insert("strikethrough") }
                if hadOffBold { explicitlyOffStyles.insert("bold") }
                if hadOffItalic { explicitlyOffStyles.insert("italic") }
                if hadOffUnderline { explicitlyOffStyles.insert("underline") }
                if hadOffStrikethrough { explicitlyOffStyles.insert("strikethrough") }
                if pendingStylesInsertPos < 0 && (!pendingStyles.isEmpty || !explicitlyOffStyles.isEmpty) {
                    pendingStylesInsertPos = textView.selectedRange.location
                }
                if !pendingStyles.isEmpty {
                    applyPendingStylesToTypingAttributes()
                }
            }
            detectInlineMarkdownShortcuts()
            detectLinkShortcut()
            detectBlockquoteShortcut()
            checkTripleEnterExitCodeBlock()
            autoContinueListOnEnter()
            saveToUndoStack()
        }

        // Reset pending styles and typingAttributes when text becomes empty
        if textView.text.isEmpty {
            pendingStyles.removeAll()
            explicitlyOffStyles.removeAll()
            pendingStylesInsertPos = -1
            deferredTypingAttrs = nil
            // Reset typingAttributes to plain so next typed text has no ghost formatting
            let paragraphStyle = NSMutableParagraphStyle()
            paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
            textView.typingAttributes = [
                .font: UIFont.systemFont(ofSize: 16),
                .foregroundColor: UIColor.label,
                .paragraphStyle: paragraphStyle
            ]
        }

        // Skip applyListIndentation/renumberNumberedLists during internal changes
        // to avoid resetting typingAttributes set by autoContinueListOnEnter.
        guard !isInternalChange else {
            updateContentSize()
            sendContentChange()
            return
        }

        // When deferredTypingAttrs is set (from autoContinueListOnEnter), use it as
        // the authoritative source for typingAttributes. This survives any resets caused
        // by applyListIndentation/renumberNumberedLists setting textView.attributedText.
        // On the first non-Enter keystroke after list continuation, the deferred attrs
        // ensure the character is typed with the correct formatting; after that, clear
        // deferredTypingAttrs since the text at cursor now carries the correct attributes
        // and UIKit will derive typingAttributes from it naturally.
        let savedTypingAttrs: [NSAttributedString.Key: Any]
        if let deferred = deferredTypingAttrs {
            savedTypingAttrs = deferred
        } else {
            savedTypingAttrs = textView.typingAttributes
        }

        applyListIndentation()
        renumberNumberedLists()

        // Restore typingAttributes that were wiped by attributedText assignment
        textView.typingAttributes = savedTypingAttrs

        // Strip mention styling from typingAttributes after text change.
        // Use whitelist approach: remove any bg that isn't inline code or code block.
        do {
            var needsClean = false
            var isMentionTriggered = false
            let cursorPos = textView.selectedRange.location
            if let attrText = textView.attributedText, attrText.length > 0, cursorPos > 0 {
                let checkIdx = min(cursorPos - 1, attrText.length - 1)
                let charAttrs = attrText.attributes(at: checkIdx, effectiveRange: nil)
                if charAttrs[MentionMarkerKey] != nil {
                    needsClean = true
                    isMentionTriggered = true
                }
            }
            if !needsClean, let bg = textView.typingAttributes[.backgroundColor] as? UIColor {
                var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
                bg.getRed(&r, green: &g, blue: &b, alpha: &a)
                let isInlineCodeBg = abs(r - 245.0/255.0) < 0.02 && abs(g - 245.0/255.0) < 0.02 && abs(b - 245.0/255.0) < 0.02 && a > 0.9
                let isCodeBlockBg = abs(r - 250.0/255.0) < 0.02 && abs(g - 250.0/255.0) < 0.02 && abs(b - 250.0/255.0) < 0.02 && a > 0.9
                if !isInlineCodeBg && !isCodeBlockBg { needsClean = true }
            }
            if needsClean {
                var cleanAttrs = textView.typingAttributes
                cleanAttrs.removeValue(forKey: .backgroundColor)
                cleanAttrs.removeValue(forKey: MentionMarkerKey)
                if let fg = cleanAttrs[.foregroundColor] as? UIColor {
                    var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
                    fg.getRed(&r, green: &g, blue: &b, alpha: &a)
                    if abs(r - 104.0/255.0) < 0.05 && abs(g - 82.0/255.0) < 0.05 && abs(b - 214.0/255.0) < 0.05 && a > 0.9 {
                        cleanAttrs[.foregroundColor] = UIColor.label
                    }
                }
                // Only strip bold when cleanup was triggered by an actual mention marker.
                // When triggered by a stray backgroundColor alone, bold is legitimate
                // user formatting (e.g., cursor moved into bold text after backspace)
                // and must be preserved.
                if isMentionTriggered,
                   let font = cleanAttrs[.font] as? UIFont,
                   font.fontDescriptor.symbolicTraits.contains(.traitBold),
                   !pendingStyles.contains("bold") {
                    let unbold = font.fontDescriptor.withSymbolicTraits(
                        font.fontDescriptor.symbolicTraits.subtracting(.traitBold)
                    ) ?? font.fontDescriptor
                    cleanAttrs[.font] = UIFont(descriptor: unbold, size: font.pointSize)
                }
                textView.typingAttributes = cleanAttrs
            }
        }

        // If deferredTypingAttrs was consumed for a non-Enter keystroke, clear it.
        // Check: if the character before cursor is NOT a newline, the user typed a
        // regular character and the deferred attrs have been applied — safe to clear.
        if deferredTypingAttrs != nil {
            let cursorPos = textView.selectedRange.location
            let nsText = (textView.text ?? "") as NSString
            let isNewline = cursorPos > 0 && cursorPos <= nsText.length && nsText.character(at: cursorPos - 1) == 10
            if !isNewline {
                deferredTypingAttrs = nil
            }
        }

        updateContentSize()
        sendContentChange()
        // Emit correct active styles after all internal changes are done.
        // textViewDidChangeSelection is suppressed during isInternalChange,
        // so we must emit here to keep the toolbar in sync.
        emitActiveStyles()
        updateToolbarButtonStates()

        // Schedule a deferred restore of typingAttributes after the current run loop
        // completes. This catches async JS bridge callbacks (e.g. syncMentionRanges →
        // setMentionRanges) that set textView.attributedText and reset typingAttributes
        // after textDidChange returns.
        if let deferred = deferredTypingAttrs {
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                self.textView.typingAttributes = deferred
                self.emitActiveStyles()
                self.updateToolbarButtonStates()
            }
        }
    }

    /// Triple-Enter exit for code block mode (mirrors Android checkTripleEnterExitCodeBlock).
    /// When three consecutive newlines are detected at the cursor inside a code block,
    /// remove the trailing newlines, insert one newline after the code block, and exit
    /// code block mode so subsequent typing is plain text.
    private func checkTripleEnterExitCodeBlock() {
        guard let text = textView.text, !text.isEmpty else { return }
        let cursorPos = textView.selectedRange.location
        guard cursorPos >= 3, cursorPos <= text.count else { return }

        let nsText = text as NSString
        // Check last 3 characters are all newlines
        guard nsText.character(at: cursorPos - 1) == 10,
              nsText.character(at: cursorPos - 2) == 10,
              nsText.character(at: cursorPos - 3) == 10 else { return }

        // Check if we're inside a code block via pendingStyles or CodeBlockAttributeKey
        let inCodeBlock: Bool
        if pendingStyles.contains("codeBlock") {
            inCodeBlock = true
        } else if cursorPos > 3, let attrText = textView.attributedText {
            let checkPos = cursorPos - 4
            if checkPos >= 0 && checkPos < attrText.length {
                inCodeBlock = attrText.attribute(CodeBlockAttributeKey, at: checkPos, effectiveRange: nil) != nil
            } else {
                inCodeBlock = false
            }
        } else {
            inCodeBlock = false
        }
        guard inCodeBlock else { return }

        isInternalChange = true

        let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
        // Remove the trailing 3 newlines
        let newCursorPos = cursorPos - 3
        mutable.deleteCharacters(in: NSRange(location: newCursorPos, length: 3))

        // Insert a single newline after the code block content
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
        let plainAttrs: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 16),
            .foregroundColor: UIColor.label,
            .paragraphStyle: paragraphStyle
        ]
        let newlineAttr = NSAttributedString(string: "\n", attributes: plainAttrs)
        mutable.insert(newlineAttr, at: newCursorPos)

        // Remove CodeBlockAttributeKey from the inserted newline to prevent bleed
        let freshLinePos = newCursorPos + 1
        mutable.removeAttribute(CodeBlockAttributeKey, range: NSRange(location: newCursorPos, length: 1))

        textView.attributedText = mutable
        textView.selectedRange = NSRange(location: freshLinePos, length: 0)

        // Exit code block mode — reset typingAttributes to plain
        textView.typingAttributes = plainAttrs
        pendingStyles.remove("codeBlock")
        explicitlyOffStyles.removeAll()
        pendingStylesInsertPos = -1

        isInternalChange = false

        textView.setNeedsDisplay()
        emitActiveStyles()
        sendContentChange()
    }

    private func autoContinueListOnEnter() {
        guard let text = textView.text, !text.isEmpty else { return }
        let cursorPos = textView.selectedRange.location
        guard cursorPos > 0, cursorPos <= text.count else { return }

        // Code block guard: don't continue lists inside code blocks (matches Android)
        if pendingStyles.contains("codeBlock") { return }
        if let attrText = textView.attributedText, cursorPos > 0 {
            let checkPos = min(cursorPos - 1, attrText.length - 1)
            if checkPos >= 0 {
                let val = attrText.attribute(CodeBlockAttributeKey, at: checkPos, effectiveRange: nil)
                if val != nil { return }
            }
        }

        let nsText = text as NSString
        guard nsText.character(at: cursorPos - 1) == 10 else {
            return
        } // '\n'

        if cursorPos >= 2 && nsText.character(at: cursorPos - 2) == 10 {
            return
        }

        var prevLineStart = cursorPos - 2
        while prevLineStart > 0 && nsText.character(at: prevLineStart - 1) != 10 {
            prevLineStart -= 1
        }
        if prevLineStart < 0 { prevLineStart = 0 }

        let prevLine = nsText.substring(with: NSRange(location: prevLineStart, length: cursorPos - 1 - prevLineStart))

        let numberedRegex = try? NSRegularExpression(pattern: "^(\\d+)\\.\\s")
        if let match = numberedRegex?.firstMatch(in: prevLine, range: NSRange(location: 0, length: prevLine.count)) {
            let prefixStr = (prevLine as NSString).substring(with: match.range)
            let content = String(prevLine.dropFirst(prefixStr.count))

            if content.trimmingCharacters(in: .whitespaces).isEmpty {
                isInternalChange = true
                let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
                mutable.deleteCharacters(in: NSRange(location: prevLineStart, length: cursorPos - prevLineStart))
                textView.attributedText = mutable
                textView.selectedRange = NSRange(location: prevLineStart, length: 0)
                isInternalChange = false
                return
            }

            let numStr = (prevLine as NSString).substring(with: match.range(at: 1))
            let nextNum = (Int(numStr) ?? 0) + 1
            let prefix = "\(nextNum). "

            isInternalChange = true
            let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
            let attrs = mutable.attributes(at: max(0, cursorPos - 2), effectiveRange: nil)
            mutable.insert(NSAttributedString(string: prefix, attributes: attrs), at: cursorPos)
            textView.attributedText = mutable
            textView.selectedRange = NSRange(location: cursorPos + prefix.count, length: 0)
            renumberNumberedLists()
            // Restore typingAttributes AFTER renumberNumberedLists() because it may
            // set textView.attributedText which resets typingAttributes to defaults.
            textView.typingAttributes = attrs
            // Store for deferred restore — JS bridge callbacks (syncMentionRanges)
            // will reset typingAttributes again after this method returns.
            deferredTypingAttrs = attrs
            isInternalChange = false
            return
        }

        if prevLine.hasPrefix("• ") {
            let content = String(prevLine.dropFirst(2))
            if content.trimmingCharacters(in: .whitespaces).isEmpty {
                isInternalChange = true
                let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
                mutable.deleteCharacters(in: NSRange(location: prevLineStart, length: cursorPos - prevLineStart))
                textView.attributedText = mutable
                textView.selectedRange = NSRange(location: prevLineStart, length: 0)
                isInternalChange = false
                return
            }
            isInternalChange = true
            let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
            let attrs = mutable.attributes(at: max(0, cursorPos - 2), effectiveRange: nil)
            mutable.insert(NSAttributedString(string: "• ", attributes: attrs), at: cursorPos)
            textView.attributedText = mutable
            textView.selectedRange = NSRange(location: cursorPos + 2, length: 0)
            textView.typingAttributes = attrs
            deferredTypingAttrs = attrs
            isInternalChange = false
            return
        }

        if prevLine.hasPrefix("☐ ") || prevLine.hasPrefix("☑ ") {
            let content = String(prevLine.dropFirst(2))
            if content.trimmingCharacters(in: .whitespaces).isEmpty {
                isInternalChange = true
                let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
                mutable.deleteCharacters(in: NSRange(location: prevLineStart, length: cursorPos - prevLineStart))
                textView.attributedText = mutable
                textView.selectedRange = NSRange(location: prevLineStart, length: 0)
                isInternalChange = false
                return
            }
            isInternalChange = true
            let mutable = NSMutableAttributedString(attributedString: textView.attributedText)
            let attrs = mutable.attributes(at: max(0, cursorPos - 2), effectiveRange: nil)
            mutable.insert(NSAttributedString(string: "☐ ", attributes: attrs), at: cursorPos)
            textView.attributedText = mutable
            textView.selectedRange = NSRange(location: cursorPos + 2, length: 0)
            textView.typingAttributes = attrs
            deferredTypingAttrs = attrs
            isInternalChange = false
            return
        }
    }

    private func renumberNumberedLists() {
        guard let text = textView.text, !text.isEmpty else { return }
        let lines = text.components(separatedBy: "\n")
        let numberedRegex = try? NSRegularExpression(pattern: "^(\\d+)\\.\\s")
        let quoteNumberedRegex = try? NSRegularExpression(pattern: "^▎ (\\d+)\\.\\s")
        let bulletRegex = try? NSRegularExpression(pattern: "^(- |• |‧ |▎ - |▎ • |▎ ‧ )")

        var counter = 0
        var replacements: [(range: NSRange, newPrefix: String)] = []
        var offset = 0

        for line in lines {
            // Check for blockquote + numbered: "▎ N. "
            if let quoteMatch = quoteNumberedRegex?.firstMatch(in: line, range: NSRange(location: 0, length: line.count)) {
                counter += 1
                let oldPrefix = (line as NSString).substring(with: quoteMatch.range)
                let newPrefix = "▎ \(counter). "
                if oldPrefix != newPrefix {
                    replacements.append((NSRange(location: offset, length: oldPrefix.count), newPrefix))
                }
            } else if let match = numberedRegex?.firstMatch(in: line, range: NSRange(location: 0, length: line.count)) {
                counter += 1
                let oldPrefix = (line as NSString).substring(with: match.range)
                let newPrefix = "\(counter). "
                if oldPrefix != newPrefix {
                    replacements.append((NSRange(location: offset, length: oldPrefix.count), newPrefix))
                }
            } else if bulletRegex?.firstMatch(in: line, range: NSRange(location: 0, length: line.count)) != nil {
                // Bullet lines don't reset the counter — ordered numbering
                // continues across bullet interruptions (Slack behavior).
            } else {
                counter = 0
            }
            offset += line.count + 1
        }

        if !replacements.isEmpty {
            let cursorPos = textView.selectedRange

            // Compute cursor shift caused by prefix length changes before the cursor
            var cursorDelta = 0
            for replacement in replacements {
                if replacement.range.location + replacement.range.length <= cursorPos.location {
                    cursorDelta += replacement.newPrefix.count - replacement.range.length
                }
            }

            let mutableAttrString = NSMutableAttributedString(attributedString: textView.attributedText)
            // Use plain visible attributes for replacement prefixes — reading attrs
            // from the old position can inherit foregroundColor: .clear from ▎ chars,
            // making the entire new prefix invisible.
            let plainAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 16),
                .foregroundColor: UIColor.label
            ]
            for replacement in replacements.reversed() {
                mutableAttrString.replaceCharacters(in: replacement.range, with: NSAttributedString(string: replacement.newPrefix, attributes: plainAttrs))
            }
            // Make all ▎ characters invisible after renumbering
            let nsStr = mutableAttrString.string as NSString
            for i in 0..<nsStr.length {
                if nsStr.character(at: i) == 0x258E {
                    mutableAttrString.addAttribute(.foregroundColor, value: UIColor.clear, range: NSRange(location: i, length: 1))
                }
            }
            isInternalChange = true
            textView.attributedText = mutableAttrString
            // Restore cursor position adjusted for any prefix length changes
            let adjustedLocation = max(0, min(cursorPos.location + cursorDelta, mutableAttrString.length))
            textView.selectedRange = NSRange(location: adjustedLocation, length: 0)
            isInternalChange = false
        }
    }

    private func applyNumberOfLines() {
        if numberOfLines > 0 && !editable {
            textView.textContainer.maximumNumberOfLines = numberOfLines
            textView.textContainer.lineBreakMode = .byTruncatingTail
            textView.isScrollEnabled = false
        } else {
            textView.textContainer.maximumNumberOfLines = 0
            textView.textContainer.lineBreakMode = .byWordWrapping
        }
        updateContentSize()
    }

    /// Top padding needed when a code block is at the start of the document.
    /// Matches Android's codeBlockEdgePaddingPx() behavior.
    private func codeBlockTopPadding() -> CGFloat {
        guard let attrText = textView.attributedText, attrText.length > 0 else { return 0 }
        return attrText.attribute(CodeBlockAttributeKey, at: 0, effectiveRange: nil) != nil
            ? codeBlockVerticalPadding : 0
    }

    /// Bottom padding needed when a code block is at the end of the document.
    private func codeBlockBottomPadding() -> CGFloat {
        guard let attrText = textView.attributedText, attrText.length > 0 else { return 0 }
        return attrText.attribute(CodeBlockAttributeKey, at: attrText.length - 1, effectiveRange: nil) != nil
            ? codeBlockVerticalPadding : 0
    }

    private func updateContentSize() {
        // Adjust textContainerInset for code block edge padding so the cursor
        // aligns properly within the code block container (matches Android).
        let cbTopPad = codeBlockTopPadding()
        let cbBottomPad = codeBlockBottomPadding()
        let currentInset = textView.textContainerInset
        if abs(currentInset.top - cbTopPad) > 0.5 || abs(currentInset.bottom - cbBottomPad) > 0.5 {
            textView.textContainerInset = UIEdgeInsets(
                top: cbTopPad,
                left: currentInset.left,
                bottom: cbBottomPad,
                right: currentInset.right
            )
            // Keep placeholder aligned with text by matching textContainerInset.top
            placeholderTopConstraint?.constant = cbTopPad + 4
        }

        let width = bounds.width > 0 ? bounds.width : UIScreen.main.bounds.width - 32
        let fittingSize = textView.sizeThatFits(CGSize(width: width, height: CGFloat.greatestFiniteMagnitude))

        let minHeight: CGFloat = 22
        var newHeight = max(fittingSize.height, minHeight)

        if maxHeight > 0 {
            let shouldScroll = newHeight > maxHeight
            textView.isScrollEnabled = shouldScroll
            textView.alwaysBounceVertical = shouldScroll
            textView.showsVerticalScrollIndicator = shouldScroll

            newHeight = min(newHeight, maxHeight)
        } else {
            textView.isScrollEnabled = false
            textView.alwaysBounceVertical = false
            textView.showsVerticalScrollIndicator = false

        }

        calculatedHeight = newHeight

        if abs(newHeight - lastReportedHeight) > 0.5 {
            lastReportedHeight = newHeight
            onSizeChange?(["height": newHeight])
        }

        invalidateIntrinsicContentSize()

        // Scroll to keep cursor visible when content exceeds maxHeight
        // (matches Android's scrollTo(0, cursorBottom - height + paddingBottom) behavior)
        if textView.isScrollEnabled {
            let cursorRange = textView.selectedRange
            DispatchQueue.main.async { [weak self] in
                self?.textView.scrollRangeToVisible(cursorRange)
            }
        }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        updateContentSize()
    }

    override var intrinsicContentSize: CGSize {
        return CGSize(width: UIView.noIntrinsicMetric, height: calculatedHeight)
    }

    override func sizeThatFits(_ size: CGSize) -> CGSize {
        let width = size.width > 0 ? size.width : bounds.width > 0 ? bounds.width : UIScreen.main.bounds.width - 32
        let fittingSize = textView.sizeThatFits(CGSize(width: width, height: CGFloat.greatestFiniteMagnitude))
        var height = max(fittingSize.height, 22)

        if maxHeight > 0 {
            height = min(height, maxHeight)
        }

        return CGSize(width: size.width, height: height)
    }

    private func applyVariantStyle() {
        if variant == "flat" {
            layer.borderWidth = 0
            layer.cornerRadius = 0
            bottomBorder.isHidden = false
        } else if variant == "plain" {
            layer.borderWidth = 0
            layer.cornerRadius = 0
            bottomBorder.isHidden = true
        } else {
            layer.borderColor = UIColor.separator.cgColor
            layer.borderWidth = 1
            layer.cornerRadius = 8
            bottomBorder.isHidden = true
        }
    }

    private func applyListIndentation() {
        guard let text = textView.text, !text.isEmpty else { return }

        let mutableAttrString = NSMutableAttributedString(attributedString: textView.attributedText)
        let nsText = text as NSString

        let font = UIFont.systemFont(ofSize: 16)
        let bulletPrefix = "• "
        let bulletWidth = (bulletPrefix as NSString).size(withAttributes: [.font: font]).width

        let numberedPattern = "^(\\d+)\\.\\s"
        let numberedRegex = try? NSRegularExpression(pattern: numberedPattern, options: [])
        let quoteNumberedPattern = "^▎ (\\d+)\\.\\s"
        let quoteNumberedRegex = try? NSRegularExpression(pattern: quoteNumberedPattern, options: [])

        var lineStart = 0
        while lineStart < text.count {
            var lineEnd = lineStart
            while lineEnd < text.count && nsText.character(at: lineEnd) != 10 {
                lineEnd += 1
            }

            let lineRange = NSRange(location: lineStart, length: lineEnd - lineStart)
            let lineText = nsText.substring(with: lineRange)

            let paragraphStyle = NSMutableParagraphStyle()
            paragraphStyle.alignment = .left
            paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple

            if lineText.hasPrefix("▎ • ") {
                // Combined blockquote + bullet
                let prefixWidth = ("▎ • " as NSString).size(withAttributes: [.font: font]).width
                paragraphStyle.firstLineHeadIndent = 0
                paragraphStyle.headIndent = prefixWidth
            } else if let qnMatch = quoteNumberedRegex?.firstMatch(in: lineText, range: NSRange(location: 0, length: lineText.count)) {
                // Combined blockquote + numbered: "▎ N. "
                let matchedPrefix = (lineText as NSString).substring(with: qnMatch.range)
                let prefixWidth = (matchedPrefix as NSString).size(withAttributes: [.font: font]).width
                paragraphStyle.firstLineHeadIndent = 0
                paragraphStyle.headIndent = prefixWidth
            } else if lineText.hasPrefix("▎ ") {
                // Plain blockquote
                let prefixWidth = ("▎ " as NSString).size(withAttributes: [.font: font]).width
                paragraphStyle.firstLineHeadIndent = 0
                paragraphStyle.headIndent = prefixWidth
            } else if lineText.hasPrefix("• ") {
                paragraphStyle.firstLineHeadIndent = 0
                paragraphStyle.headIndent = bulletWidth
            } else if let match = numberedRegex?.firstMatch(in: lineText, range: NSRange(location: 0, length: lineText.count)) {
                let matchedPrefix = (lineText as NSString).substring(with: match.range)
                let prefixWidth = (matchedPrefix as NSString).size(withAttributes: [.font: font]).width
                paragraphStyle.firstLineHeadIndent = 0
                paragraphStyle.headIndent = prefixWidth
            } else {
                paragraphStyle.firstLineHeadIndent = 0
                paragraphStyle.headIndent = 0
            }

            mutableAttrString.addAttribute(.paragraphStyle, value: paragraphStyle, range: lineRange)

            // Ensure ▎ characters remain invisible
            if lineText.hasPrefix("▎") && lineRange.length > 0 {
                mutableAttrString.addAttribute(.foregroundColor, value: UIColor.clear, range: NSRange(location: lineStart, length: 1))
            }

            lineStart = lineEnd + 1
        }

        let selectedRange = textView.selectedRange

        isInternalChange = true
        textView.attributedText = mutableAttrString
        textView.selectedRange = selectedRange
        isInternalChange = false
    }

    private func saveToUndoStack() {
        undoStack.append(textView.attributedText)
        if undoStack.count > 50 {
            undoStack.removeFirst()
        }
        redoStack.removeAll()
    }

    private func sendContentChange() {
        let blocks = getBlocksArray()
        var blocksJson = "[]"
        if let jsonData = try? JSONSerialization.data(withJSONObject: blocks, options: []),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            blocksJson = jsonString
        }
        // Strip ZWS (code block placeholder) from text sent to JS, matching
        // Android's sendContentChangeWithDelta which does .replace("\u200B", "").
        // JS works in "clean" coordinates; keeping ZWS causes setTextContent's
        // diff algorithm to misalign and destroy code block attributes on mention insertion.
        let cleanText = (textView.text ?? "").replacingOccurrences(of: "\u{200B}", with: "")
        onContentChange?([
            "text": cleanText,
            "blocksJson": blocksJson
        ])
    }

    // MARK: - Paste Media (images / files)

    /// Inspects `UIPasteboard.general` for media content (images and/or file item
    /// providers). If found, extracts each item to a temp file in NSTemporaryDirectory()
    /// and emits the `onPasteMedia` event to JS with an `items` array of
    /// `{ uri, mimeType, name, size }`. Returns `true` if media was detected and a
    /// paste-media flow was started (so the caller should NOT fall through to text paste).
    ///
    /// For text-only clipboards this returns `false` so normal text paste proceeds.
    ///
    /// Note: file representation loading is asynchronous; the event is emitted once all
    /// providers have finished loading. `true` is returned synchronously as soon as we
    /// know the clipboard carries media, so text paste is suppressed immediately.
    @objc func handlePasteMediaIfAvailable() -> Bool {
        let pb = UIPasteboard.general

        // Prefer item providers (they carry real UTIs + file data for images AND files).
        let providers = pb.itemProviders
        if !providers.isEmpty {
            let mediaProviders = providers.filter { provider in
                // Consider it media if it can vend a file/data representation for any
                // non-plain-text type. Plain text / URLs alone should NOT be treated as media.
                return provider.registeredTypeIdentifiers.contains { typeId in
                    return Self.isMediaTypeIdentifier(typeId)
                }
            }
            if !mediaProviders.isEmpty {
                extractItemProviders(mediaProviders)
                return true
            }
        }

        // Fallback: raw images on the pasteboard with no item provider (rare, e.g. a
        // screenshot placed directly as a UIImage).
        if pb.hasImages, let images = pb.images, !images.isEmpty {
            extractRawImages(images)
            return true
        }

        return false
    }

    /// Returns true when a UTI represents pasteable media (image/video/audio/file),
    /// and false for plain text / URLs which should paste as text.
    private static func isMediaTypeIdentifier(_ typeId: String) -> Bool {
        if #available(iOS 14.0, *) {
            guard let type = UTType(typeId) else { return false }
            // Exclude plain text and URLs — those are handled by the text-paste path.
            if type.conforms(to: .plainText) || type.conforms(to: .url) || type.conforms(to: .text) {
                return false
            }
            return type.conforms(to: .image)
                || type.conforms(to: .movie)
                || type.conforms(to: .audio)
                || type.conforms(to: .fileURL)
                || type.conforms(to: .data)
                || type.conforms(to: .item)
        } else {
            // Pre-iOS 14 fallback using MobileCoreServices.
            let cf = typeId as CFString
            if UTTypeConformsTo(cf, kUTTypePlainText) || UTTypeConformsTo(cf, kUTTypeText) || UTTypeConformsTo(cf, kUTTypeURL) {
                return false
            }
            return UTTypeConformsTo(cf, kUTTypeImage)
                || UTTypeConformsTo(cf, kUTTypeMovie)
                || UTTypeConformsTo(cf, kUTTypeAudio)
                || UTTypeConformsTo(cf, kUTTypeData)
                || UTTypeConformsTo(cf, kUTTypeItem)
        }
    }

    /// Loads each NSItemProvider's file representation to a temp file, then emits
    /// `onPasteMedia` once all providers finish. Robust: items that fail are skipped.
    private func extractItemProviders(_ providers: [NSItemProvider]) {
        let group = DispatchGroup()
        // Guard concurrent appends from provider completion handlers on different queues.
        let lock = NSLock()
        var items: [[String: Any]] = []

        for provider in providers {
            // Pick the best (most specific media) type identifier this provider offers.
            guard let typeId = bestMediaTypeIdentifier(for: provider) else { continue }

            group.enter()
            // loadFileRepresentation gives us a temp URL we must copy out of before the
            // completion handler returns (the vended URL is only valid inside the block).
            provider.loadFileRepresentation(forTypeIdentifier: typeId) { [weak self] (url, error) in
                defer { group.leave() }
                guard let self = self, let srcURL = url, error == nil else {
                    if let error = error { print("[RichTextEditor] paste file load failed: \(error)") }
                    return
                }
                if let item = self.copyToTempAndBuildItem(
                    from: srcURL,
                    typeIdentifier: typeId,
                    suggestedName: provider.suggestedName
                ) {
                    lock.lock()
                    items.append(item)
                    lock.unlock()
                }
            }
        }

        group.notify(queue: .main) { [weak self] in
            guard let self = self, !items.isEmpty else { return }
            self.emitPasteMedia(items: items)
        }
    }

    /// Chooses the most appropriate media type identifier from a provider's registered
    /// identifiers (prefers concrete image/movie/audio/file types over generic ones).
    private func bestMediaTypeIdentifier(for provider: NSItemProvider) -> String? {
        let ids = provider.registeredTypeIdentifiers.filter { Self.isMediaTypeIdentifier($0) }
        if ids.isEmpty { return nil }
        if #available(iOS 14.0, *) {
            // Prefer image, then movie, then audio, then any file/data.
            let preferenceOrder: [UTType] = [.image, .movie, .audio, .pdf, .fileURL, .data, .item]
            for pref in preferenceOrder {
                if let match = ids.first(where: { UTType($0)?.conforms(to: pref) == true }) {
                    return match
                }
            }
        }
        return ids.first
    }

    /// Copies the data at `srcURL` to a uniquely-named temp file in NSTemporaryDirectory()
    /// and returns the JS item dict { uri, mimeType, name, size }, or nil on failure.
    private func copyToTempAndBuildItem(from srcURL: URL, typeIdentifier: String, suggestedName: String?) -> [String: Any]? {
        let fm = FileManager.default

        // Resolve the REAL mime type + preferred extension from the UTI (do NOT hardcode).
        let mimeType = Self.mimeType(forTypeIdentifier: typeIdentifier)
            ?? Self.mimeType(forPathExtension: srcURL.pathExtension)
            ?? "application/octet-stream"
        let preferredExt = Self.preferredExtension(forTypeIdentifier: typeIdentifier)

        // Build a display name with an extension.
        let srcExt = srcURL.pathExtension
        let ext = !srcExt.isEmpty ? srcExt : (preferredExt ?? "")
        let baseName: String
        if let suggested = suggestedName, !suggested.isEmpty {
            if (suggested as NSString).pathExtension.isEmpty, !ext.isEmpty {
                baseName = "\(suggested).\(ext)"
            } else {
                baseName = suggested
            }
        } else {
            let srcNameNoExt = srcURL.deletingPathExtension().lastPathComponent
            let core = srcNameNoExt.isEmpty ? "pasted_media_\(Int(Date().timeIntervalSince1970 * 1000))" : srcNameNoExt
            baseName = ext.isEmpty ? core : "\(core).\(ext)"
        }

        // Unique temp destination so multiple pasted items never collide.
        let uniquePrefix = "paste_\(UUID().uuidString)_"
        let destURL = URL(fileURLWithPath: NSTemporaryDirectory())
            .appendingPathComponent("\(uniquePrefix)\(baseName)")

        do {
            if fm.fileExists(atPath: destURL.path) {
                try fm.removeItem(at: destURL)
            }
            try fm.copyItem(at: srcURL, to: destURL)
        } catch {
            // Fallback: try reading data then writing (handles providers whose URL
            // can't be copied directly).
            do {
                let data = try Data(contentsOf: srcURL)
                try data.write(to: destURL)
            } catch {
                print("[RichTextEditor] paste temp copy failed: \(error)")
                return nil
            }
        }

        let size = Self.fileSize(atPath: destURL.path)

        return [
            "uri": destURL.absoluteString,   // file:///... (absoluteString yields file:// URL)
            "mimeType": mimeType,
            "name": baseName,
            "size": size
        ]
    }

    /// Returns the byte size of the file at `path`, or 0 if it cannot be read.
    private static func fileSize(atPath path: String) -> Int {
        guard let attrs = try? FileManager.default.attributesOfItem(atPath: path),
              let size = attrs[.size] as? Int else {
            return 0
        }
        return size
    }

    /// Handles raw UIImage(s) on the pasteboard that arrive without an item provider.
    private func extractRawImages(_ images: [UIImage]) {
        var items: [[String: Any]] = []
        for (idx, image) in images.enumerated() {
            // Prefer PNG to preserve transparency/quality; fall back to JPEG.
            let isPng: Bool
            let data: Data?
            if let png = image.pngData() {
                data = png; isPng = true
            } else {
                data = image.jpegData(compressionQuality: 0.9); isPng = false
            }
            guard let imageData = data else { continue }
            let ext = isPng ? "png" : "jpg"
            let mimeType = isPng ? "image/png" : "image/jpeg"
            let name = "pasted_image_\(Int(Date().timeIntervalSince1970 * 1000))_\(idx).\(ext)"
            let destURL = URL(fileURLWithPath: NSTemporaryDirectory())
                .appendingPathComponent("paste_\(UUID().uuidString)_\(name)")
            do {
                try imageData.write(to: destURL)
                let size = Self.fileSize(atPath: destURL.path)
                items.append([
                    "uri": destURL.absoluteString,
                    "mimeType": mimeType,
                    "name": name,
                    "size": size > 0 ? size : imageData.count
                ])
            } catch {
                print("[RichTextEditor] paste raw image write failed: \(error)")
            }
        }
        if !items.isEmpty {
            emitPasteMedia(items: items)
        }
    }

    /// Emits the onPasteMedia event to JS on the main thread.
    private func emitPasteMedia(items: [[String: Any]]) {
        guard !items.isEmpty else { return }
        let payload: [String: Any] = ["items": items]
        if Thread.isMainThread {
            onPasteMedia?(payload)
        } else {
            DispatchQueue.main.async { [weak self] in
                self?.onPasteMedia?(payload)
            }
        }
    }

    /// Resolves a mime type string from a UTI type identifier.
    private static func mimeType(forTypeIdentifier typeId: String) -> String? {
        if #available(iOS 14.0, *) {
            return UTType(typeId)?.preferredMIMEType
        } else {
            guard let mime = UTTypeCopyPreferredTagWithClass(typeId as CFString, kUTTagClassMIMEType)?.takeRetainedValue() else {
                return nil
            }
            return mime as String
        }
    }

    /// Resolves a mime type string from a file path extension.
    private static func mimeType(forPathExtension ext: String) -> String? {
        guard !ext.isEmpty else { return nil }
        if #available(iOS 14.0, *) {
            return UTType(filenameExtension: ext)?.preferredMIMEType
        } else {
            guard let uti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, ext as CFString, nil)?.takeRetainedValue() else {
                return nil
            }
            guard let mime = UTTypeCopyPreferredTagWithClass(uti, kUTTagClassMIMEType)?.takeRetainedValue() else {
                return nil
            }
            return mime as String
        }
    }

    /// Resolves the preferred filename extension for a UTI type identifier.
    private static func preferredExtension(forTypeIdentifier typeId: String) -> String? {
        if #available(iOS 14.0, *) {
            return UTType(typeId)?.preferredFilenameExtension
        } else {
            guard let ext = UTTypeCopyPreferredTagWithClass(typeId as CFString, kUTTagClassFilenameExtension)?.takeRetainedValue() else {
                return nil
            }
            return ext as String
        }
    }

    /// Returns sub-ranges of the given range that do NOT overlap with any mention.
    /// Mirrors Android's `nonMentionRanges()` — formatting is applied only to these
    /// segments so mention styling remains untouched (Req 6.1).
    private func nonMentionRanges(in range: NSRange, attributedText: NSAttributedString) -> [NSRange] {
        var mentionRanges: [NSRange] = []
        attributedText.enumerateAttribute(MentionMarkerKey, in: range, options: []) { value, attrRange, _ in
            if value != nil {
                mentionRanges.append(attrRange)
            }
        }
        if mentionRanges.isEmpty { return [range] }
        mentionRanges.sort { $0.location < $1.location }

        var result: [NSRange] = []
        var cursor = range.location
        for mr in mentionRanges {
            if cursor < mr.location {
                result.append(NSRange(location: cursor, length: mr.location - cursor))
            }
            cursor = mr.location + mr.length
        }
        let rangeEnd = range.location + range.length
        if cursor < rangeEnd {
            result.append(NSRange(location: cursor, length: rangeEnd - cursor))
        }
        return result
    }

    /// Apply a font trait (bold/italic) to the current selection only, without affecting
    /// pendingStyles or typingAttributes. Used by context menu actions so subsequent
    /// typing reverts to the pre-selection style (matching Android behavior where
    /// mode.finish() dismisses the action mode and deselects text).
    func applyStyleToSelectionOnly(trait: UIFontDescriptor.SymbolicTraits) {
        let range = textView.selectedRange
        guard range.length > 0 else { return }

        // Save typing attributes before modification (these represent the pre-format state)
        let savedAttrs = textView.typingAttributes

        let mutableAttrString = NSMutableAttributedString(attributedString: textView.attributedText)

        // Skip mention ranges — apply formatting only to non-mention text (Req 6.1)
        let segments = nonMentionRanges(in: range, attributedText: mutableAttrString)
        guard !segments.isEmpty else { return }

        var hasTrait = false
        for seg in segments {
            mutableAttrString.enumerateAttribute(.font, in: seg, options: []) { value, _, _ in
                if let font = value as? UIFont {
                    hasTrait = font.fontDescriptor.symbolicTraits.contains(trait)
                }
            }
        }

        for seg in segments {
            mutableAttrString.enumerateAttribute(.font, in: seg, options: []) { value, attrRange, _ in
                if let font = value as? UIFont {
                    var newTraits = font.fontDescriptor.symbolicTraits
                    if hasTrait { newTraits.remove(trait) } else { newTraits.insert(trait) }
                    if let descriptor = font.fontDescriptor.withSymbolicTraits(newTraits) {
                        let newFont = UIFont(descriptor: descriptor, size: font.pointSize)
                        mutableAttrString.addAttribute(.font, value: newFont, range: attrRange)
                    }
                }
            }
        }

        isInternalChange = true
        textView.attributedText = mutableAttrString
        // Collapse selection to end of formatted range (matches Android mode.finish() behavior)
        // This deselects the text so subsequent typing uses typingAttributes, not selection attributes
        let cursorPos = range.location + range.length
        textView.selectedRange = NSRange(location: cursorPos, length: 0)
        // Restore typing attributes so subsequent typing is NOT formatted
        textView.typingAttributes = savedAttrs
        isInternalChange = false
        saveToUndoStack()
        sendContentChange()
        emitActiveStyles()
    }

    /// Apply a simple attribute (underline/strikethrough) to the current selection only,
    /// without affecting pendingStyles or typingAttributes. Collapses selection after
    /// applying (matches Android mode.finish() behavior).
    func applyAttributeToSelectionOnly(key: NSAttributedString.Key, value: Int) {
        let range = textView.selectedRange
        guard range.length > 0 else { return }

        // Save typing attributes before modification (these represent the pre-format state)
        let savedAttrs = textView.typingAttributes

        let mutableAttrString = NSMutableAttributedString(attributedString: textView.attributedText)

        // Skip mention ranges — apply formatting only to non-mention text (Req 6.1)
        let segments = nonMentionRanges(in: range, attributedText: mutableAttrString)
        guard !segments.isEmpty else { return }

        var hasAttribute = false
        for seg in segments {
            if let existing = mutableAttrString.attribute(key, at: seg.location, effectiveRange: nil) as? Int, existing != 0 {
                hasAttribute = true
            }
        }

        for seg in segments {
            if hasAttribute {
                mutableAttrString.removeAttribute(key, range: seg)
            } else {
                mutableAttrString.addAttribute(key, value: value, range: seg)
            }
        }

        isInternalChange = true
        textView.attributedText = mutableAttrString
        // Collapse selection to end of formatted range (matches Android mode.finish() behavior)
        let cursorPos = range.location + range.length
        textView.selectedRange = NSRange(location: cursorPos, length: 0)
        // Restore typing attributes so subsequent typing is NOT formatted
        textView.typingAttributes = savedAttrs
        isInternalChange = false
        saveToUndoStack()
        sendContentChange()
        emitActiveStyles()
    }

    func toggleBold() {
        toggleStyle(key: .font, trait: .traitBold)
    }

    func toggleItalic() {
        toggleStyle(key: .font, trait: .traitItalic)
    }

    func toggleUnderline() {
        toggleAttribute(key: .underlineStyle, value: NSUnderlineStyle.single.rawValue)
    }

    func toggleStrikethrough() {
        toggleAttribute(key: .strikethroughStyle, value: NSUnderlineStyle.single.rawValue)
    }

    func toggleCode() {
        let range = textView.selectedRange

        // No selection: toggle pending code style for type-ahead (matches Android)
        if range.length == 0 {
            let styleName = "code"
            let attributedText = textView.attributedText ?? NSAttributedString()
            let cursorPos = range.location
            var isInsideStyle = false
            if cursorPos > 0 && cursorPos <= attributedText.length {
                if let font = attributedText.attribute(.font, at: cursorPos - 1, effectiveRange: nil) as? UIFont {
                    isInsideStyle = font.fontDescriptor.symbolicTraits.contains(.traitMonoSpace)
                }
            }

            if isInsideStyle {
                if explicitlyOffStyles.contains(styleName) {
                    explicitlyOffStyles.remove(styleName)
                } else {
                    explicitlyOffStyles.insert(styleName)
                    pendingStyles.remove(styleName)
                }
            } else {
                if pendingStyles.contains(styleName) {
                    pendingStyles.remove(styleName)
                } else {
                    pendingStyles.insert(styleName)
                    explicitlyOffStyles.remove(styleName)
                }
            }
            pendingStylesInsertPos = cursorPos
            emitActiveStyles()
            updateToolbarButtonStates()
            applyPendingStylesToTypingAttributes()
            return
        }

        let mutableAttrString = NSMutableAttributedString(attributedString: textView.attributedText)

        var hasMonospace = false
        mutableAttrString.enumerateAttribute(.font, in: range, options: []) { value, _, _ in
            if let font = value as? UIFont {
                if font.fontDescriptor.symbolicTraits.contains(.traitMonoSpace) {
                    hasMonospace = true
                }
            }
        }

        let monoFont = UIFont.monospacedSystemFont(ofSize: 15, weight: .regular)
        let regularFont = UIFont.systemFont(ofSize: 16)

        mutableAttrString.enumerateAttribute(.font, in: range, options: []) { value, attrRange, _ in
            if hasMonospace {
                // Removing code: restore to system font but preserve bold/italic traits
                if let existingFont = value as? UIFont {
                    let traits = existingFont.fontDescriptor.symbolicTraits
                    var newFont = regularFont
                    if traits.contains(.traitBold) && traits.contains(.traitItalic) {
                        if let desc = regularFont.fontDescriptor.withSymbolicTraits([.traitBold, .traitItalic]) {
                            newFont = UIFont(descriptor: desc, size: 16)
                        }
                    } else if traits.contains(.traitBold) {
                        newFont = UIFont.boldSystemFont(ofSize: 16)
                    } else if traits.contains(.traitItalic) {
                        newFont = UIFont.italicSystemFont(ofSize: 16)
                    }
                    mutableAttrString.addAttribute(.font, value: newFont, range: attrRange)
                } else {
                    mutableAttrString.addAttribute(.font, value: regularFont, range: attrRange)
                }
            } else {
                // Adding code: switch to monospace but preserve bold/italic traits
                if let existingFont = value as? UIFont {
                    let traits = existingFont.fontDescriptor.symbolicTraits
                    var newFont = monoFont
                    if traits.contains(.traitBold) && traits.contains(.traitItalic) {
                        // Monospace bold italic
                        if let desc = monoFont.fontDescriptor.withSymbolicTraits([.traitBold, .traitItalic, .traitMonoSpace]) {
                            newFont = UIFont(descriptor: desc, size: 15)
                        } else {
                            // Fallback: at least try bold monospace
                            newFont = UIFont.monospacedSystemFont(ofSize: 15, weight: .bold)
                        }
                    } else if traits.contains(.traitBold) {
                        newFont = UIFont.monospacedSystemFont(ofSize: 15, weight: .bold)
                    } else if traits.contains(.traitItalic) {
                        if let desc = monoFont.fontDescriptor.withSymbolicTraits([.traitItalic, .traitMonoSpace]) {
                            newFont = UIFont(descriptor: desc, size: 15)
                        }
                    }
                    mutableAttrString.addAttribute(.font, value: newFont, range: attrRange)
                } else {
                    mutableAttrString.addAttribute(.font, value: monoFont, range: attrRange)
                }
            }
        }

        if !hasMonospace {
            mutableAttrString.addAttribute(.foregroundColor, value: inlineCodeTextColor, range: range)
            mutableAttrString.addAttribute(.backgroundColor, value: inlineCodeBgColor, range: range)
        } else {
            mutableAttrString.removeAttribute(.backgroundColor, range: range)
            mutableAttrString.addAttribute(.foregroundColor, value: UIColor.label, range: range)
        }

        isInternalChange = true
        textView.attributedText = mutableAttrString
        textView.selectedRange = range
        isInternalChange = false
        saveToUndoStack()
        sendContentChange()
        emitActiveStyles()
        updateToolbarButtonStates()
    }

    func toggleHighlight(color: String?) {
        let range = textView.selectedRange
        guard range.length > 0 else { return }

        let mutableAttrString = NSMutableAttributedString(attributedString: textView.attributedText)
        var hasHighlight = false

        mutableAttrString.enumerateAttribute(.backgroundColor, in: range, options: []) { value, _, _ in
            if let bgColor = value as? UIColor, bgColor != UIColor.systemGray5 {
                hasHighlight = true
            }
        }

        if hasHighlight {
            mutableAttrString.removeAttribute(.backgroundColor, range: range)
        } else {
            let highlightColor = UIColor.yellow.withAlphaComponent(0.5)
            mutableAttrString.addAttribute(.backgroundColor, value: highlightColor, range: range)
        }

        isInternalChange = true
        textView.attributedText = mutableAttrString
        textView.selectedRange = range
        isInternalChange = false
        saveToUndoStack()
        sendContentChange()
    }

    func setHeading() {
        let range = textView.selectedRange
        let text = textView.text ?? ""
        let nsText = text as NSString

        var lineStart = range.location
        while lineStart > 0 && nsText.character(at: lineStart - 1) != 10 {
            lineStart -= 1
        }

        var lineEnd = range.location
        while lineEnd < text.count && nsText.character(at: lineEnd) != 10 {
            lineEnd += 1
        }

        let lineRange = NSRange(location: lineStart, length: lineEnd - lineStart)

        let mutableAttrString = NSMutableAttributedString(attributedString: textView.attributedText)

        var isHeading = false
        if lineRange.length > 0 {
            mutableAttrString.enumerateAttribute(.font, in: lineRange, options: []) { value, _, _ in
                if let font = value as? UIFont, font.pointSize > 18 {
                    isHeading = true
                }
            }
        }

        let headingFont = UIFont.boldSystemFont(ofSize: 24)
        let regularFont = UIFont.systemFont(ofSize: 16)

        mutableAttrString.addAttribute(.font, value: isHeading ? regularFont : headingFont, range: lineRange)

        isInternalChange = true
        textView.attributedText = mutableAttrString
        textView.selectedRange = range
        isInternalChange = false
        saveToUndoStack()
        sendContentChange()
    }

    func setQuote() {
        // Mutual exclusivity: exit code block mode before applying quote (matches Android toggleQuote)
        // Remove code block attributes inline rather than calling toggleCodeBlock() to avoid
        // textView.attributedText reassignment mid-flow.
        let qRange = textView.selectedRange
        let qText = textView.text ?? ""
        let qNsText = qText as NSString

        var qLineStart = qRange.location
        while qLineStart > 0 && qNsText.character(at: qLineStart - 1) != 10 { qLineStart -= 1 }
        var qLineEnd = qRange.location + qRange.length
        while qLineEnd < qText.count && qNsText.character(at: qLineEnd) != 10 { qLineEnd += 1 }

        let qAttrText = textView.attributedText ?? NSAttributedString()
        var qHasCodeBlock = false
        if qLineStart < qLineEnd && qLineEnd <= qAttrText.length {
            qAttrText.enumerateAttribute(CodeBlockAttributeKey, in: NSRange(location: qLineStart, length: qLineEnd - qLineStart), options: []) { value, _, _ in
                if value != nil { qHasCodeBlock = true }
            }
        }

        if qHasCodeBlock || pendingStyles.contains("codeBlock") {
            let mutablePre = NSMutableAttributedString(attributedString: qAttrText)
            let qLineRange = NSRange(location: qLineStart, length: qLineEnd - qLineStart)
            if qLineRange.length > 0 && qLineEnd <= mutablePre.length {
                mutablePre.removeAttribute(CodeBlockAttributeKey, range: qLineRange)
                mutablePre.enumerateAttribute(.font, in: qLineRange, options: []) { value, attrRange, _ in
                    if let font = value as? UIFont, font.fontDescriptor.symbolicTraits.contains(.traitMonoSpace) {
                        mutablePre.addAttribute(.font, value: UIFont.systemFont(ofSize: 16), range: attrRange)
                    }
                }
                mutablePre.removeAttribute(.underlineStyle, range: qLineRange)
                mutablePre.removeAttribute(.strikethroughStyle, range: qLineRange)
                mutablePre.removeAttribute(.backgroundColor, range: qLineRange)
                mutablePre.addAttribute(.foregroundColor, value: UIColor.label, range: qLineRange)

                // Remove ZWS placeholder from empty-line code blocks
                let lineStr = mutablePre.string as NSString
                var zwsOffset = 0
                for i in qLineStart..<qLineEnd {
                    if lineStr.character(at: i - zwsOffset) == 0x200B {
                        mutablePre.deleteCharacters(in: NSRange(location: i - zwsOffset, length: 1))
                        zwsOffset += 1
                    }
                }
            }
            isInternalChange = true
            textView.attributedText = mutablePre
            textView.selectedRange = NSRange(location: qRange.location, length: 0)
            isInternalChange = false
            pendingStyles.remove("codeBlock")
            pendingStyles.remove("bold")
            pendingStyles.remove("italic")
            pendingStyles.remove("underline")
            pendingStyles.remove("strikethrough")
            pendingStyles.remove("code")
            explicitlyOffStyles.removeAll()
            let plainParaStyle = NSMutableParagraphStyle()
            plainParaStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
            textView.typingAttributes = [
                .font: UIFont.systemFont(ofSize: 16),
                .foregroundColor: UIColor.label,
                .paragraphStyle: plainParaStyle
            ]
            textView.setNeedsDisplay()
        }

        let range = textView.selectedRange
        let text = textView.text ?? ""
        let nsText = text as NSString

        var lineStart = range.location
        while lineStart > 0 && nsText.character(at: lineStart - 1) != 10 {
            lineStart -= 1
        }

        var lineEnd = range.location + range.length
        while lineEnd < text.count && nsText.character(at: lineEnd) != 10 {
            lineEnd += 1
        }

        let lineRange = NSRange(location: lineStart, length: lineEnd - lineStart)
        let lineText = nsText.substring(with: lineRange)

        let mutableAttr = NSMutableAttributedString(attributedString: textView.attributedText)

        // Check if line already has blockquote prefix (▎ followed by space)
        if lineText.hasPrefix("▎ ") {
            // Remove blockquote prefix
            let deleteRange = NSRange(location: lineStart, length: 2)
            mutableAttr.deleteCharacters(in: deleteRange)
            // Ensure remaining text has visible foreground color (▎ uses .clear)
            let newLineLength = lineEnd - lineStart - 2
            if newLineLength > 0 {
                mutableAttr.addAttribute(.foregroundColor, value: UIColor.label, range: NSRange(location: lineStart, length: newLineLength))
            }
        } else {
            // Add blockquote prefix with transparent ▎ character
            let plainAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 16),
                .foregroundColor: UIColor.label
            ]
            var quoteCharAttrs = plainAttributes
            quoteCharAttrs[.foregroundColor] = UIColor.clear // Make ▎ invisible
            let quoteCharAttr = NSAttributedString(string: "▎", attributes: quoteCharAttrs)
            let spaceAttr = NSAttributedString(string: " ", attributes: plainAttributes)
            let insertAttr = NSMutableAttributedString()
            insertAttr.append(quoteCharAttr)
            insertAttr.append(spaceAttr)
            mutableAttr.insert(insertAttr, at: lineStart)
        }

        isInternalChange = true
        textView.attributedText = mutableAttr
        placeholderLabel.isHidden = !textView.text.isEmpty
        textView.selectedRange = NSRange(location: lineStart + (mutableAttr.string as NSString).length - (text as NSString).length + lineRange.length, length: 0)
        isInternalChange = false
        // Trigger redraw for blockquote bar asynchronously to avoid layout issues
        DispatchQueue.main.async { [weak self] in
            self?.textView.setNeedsDisplay()
        }

        applyListIndentation()
        renumberNumberedLists()
        saveToUndoStack()
        sendContentChange()
        emitActiveStyles()
    }

    func setChecklist() {
        let range = textView.selectedRange
        let text = textView.text ?? ""
        let nsText = text as NSString

        var lineStart = range.location
        while lineStart > 0 && nsText.character(at: lineStart - 1) != 10 {
            lineStart -= 1
        }

        var lineEnd = range.location + range.length
        while lineEnd < text.count && nsText.character(at: lineEnd) != 10 {
            lineEnd += 1
        }

        let lineRange = NSRange(location: lineStart, length: lineEnd - lineStart)
        let lineText = nsText.substring(with: lineRange)

        let uncheckedPrefix = "☐ "
        let checkedPrefix = "☑ "
        var newText: String

        if lineText.hasPrefix(uncheckedPrefix) || lineText.hasPrefix(checkedPrefix) {
            // Remove checklist
            newText = String(lineText.dropFirst(2))
        } else {
            // Add unchecked checkbox
            newText = uncheckedPrefix + lineText
        }

        let mutableText = NSMutableString(string: text)
        mutableText.replaceCharacters(in: lineRange, with: newText)

        isInternalChange = true
        textView.text = mutableText as String
        textView.selectedRange = NSRange(location: lineStart + newText.count, length: 0)
        isInternalChange = false

        saveToUndoStack()
        sendContentChange()
    }

    func toggleChecklistItem() {
        let range = textView.selectedRange
        let text = textView.text ?? ""
        let nsText = text as NSString

        var lineStart = range.location
        while lineStart > 0 && nsText.character(at: lineStart - 1) != 10 {
            lineStart -= 1
        }

        var lineEnd = range.location
        while lineEnd < text.count && nsText.character(at: lineEnd) != 10 {
            lineEnd += 1
        }

        let lineRange = NSRange(location: lineStart, length: lineEnd - lineStart)
        let lineText = nsText.substring(with: lineRange)

        let uncheckedPrefix = "☐ "
        let checkedPrefix = "☑ "
        var newText: String

        if lineText.hasPrefix(uncheckedPrefix) {
            // Check the item
            newText = checkedPrefix + String(lineText.dropFirst(2))
        } else if lineText.hasPrefix(checkedPrefix) {
            // Uncheck the item
            newText = uncheckedPrefix + String(lineText.dropFirst(2))
        } else {
            return
        }

        let mutableText = NSMutableString(string: text)
        mutableText.replaceCharacters(in: lineRange, with: newText)

        isInternalChange = true
        textView.text = mutableText as String
        textView.selectedRange = range
        isInternalChange = false

        saveToUndoStack()
        sendContentChange()
    }

    func setParagraph() {
        // Reset to normal paragraph style
        let range = textView.selectedRange
        guard range.length > 0 else { return }

        let mutableAttrString = NSMutableAttributedString(attributedString: textView.attributedText)
        let plainAttributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 16),
            .foregroundColor: UIColor.label
        ]

        mutableAttrString.setAttributes(plainAttributes, range: range)

        isInternalChange = true
        textView.attributedText = mutableAttrString
        textView.selectedRange = range
        isInternalChange = false
        saveToUndoStack()
        sendContentChange()
    }

    func clearFormatting() {
        // Use saved selection if current selection is empty
        var range = textView.selectedRange
        if range.length == 0 && savedSelectionRange.length > 0 {
            range = savedSelectionRange
        }
        guard range.length > 0 else { return }

        let mutableAttrString = NSMutableAttributedString(attributedString: textView.attributedText)
        let plainText = (textView.text as NSString?)?.substring(with: range) ?? ""

        let plainAttributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 16),
            .foregroundColor: UIColor.label
        ]

        mutableAttrString.replaceCharacters(in: range, with: NSAttributedString(string: plainText, attributes: plainAttributes))

        isInternalChange = true
        textView.attributedText = mutableAttrString
        textView.selectedRange = range
        isInternalChange = false
        saveToUndoStack()
        sendContentChange()
    }

    func indent() {
        let range = textView.selectedRange
        let text = textView.text ?? ""
        let nsText = text as NSString

        var lineStart = range.location
        while lineStart > 0 && nsText.character(at: lineStart - 1) != 10 {
            lineStart -= 1
        }

        let indentString = "    " // 4 spaces
        let mutableText = NSMutableString(string: text)
        mutableText.insert(indentString, at: lineStart)

        isInternalChange = true
        textView.text = mutableText as String
        textView.selectedRange = NSRange(location: range.location + indentString.count, length: range.length)
        isInternalChange = false

        saveToUndoStack()
        sendContentChange()
    }

    func outdent() {
        let range = textView.selectedRange
        let text = textView.text ?? ""
        let nsText = text as NSString

        var lineStart = range.location
        while lineStart > 0 && nsText.character(at: lineStart - 1) != 10 {
            lineStart -= 1
        }

        var lineEnd = range.location
        while lineEnd < text.count && nsText.character(at: lineEnd) != 10 {
            lineEnd += 1
        }

        let lineText = nsText.substring(with: NSRange(location: lineStart, length: lineEnd - lineStart))
        var charsToRemove = 0

        if lineText.hasPrefix("    ") {
            charsToRemove = 4
        } else if lineText.hasPrefix("\t") {
            charsToRemove = 1
        } else {
            // Remove up to 4 leading spaces
            for char in lineText {
                if char == " " && charsToRemove < 4 {
                    charsToRemove += 1
                } else {
                    break
                }
            }
        }

        guard charsToRemove > 0 else { return }

        let mutableText = NSMutableString(string: text)
        mutableText.deleteCharacters(in: NSRange(location: lineStart, length: charsToRemove))

        isInternalChange = true
        textView.text = mutableText as String
        let newLocation = max(lineStart, range.location - charsToRemove)
        textView.selectedRange = NSRange(location: newLocation, length: range.length)
        isInternalChange = false

        saveToUndoStack()
        sendContentChange()
    }

    func setAlignment(_ alignment: NSTextAlignment) {
        let range = textView.selectedRange
        let text = textView.text ?? ""
        let nsText = text as NSString

        var lineStart = range.location
        while lineStart > 0 && nsText.character(at: lineStart - 1) != 10 {
            lineStart -= 1
        }

        var lineEnd = range.location + range.length
        while lineEnd < text.count && nsText.character(at: lineEnd) != 10 {
            lineEnd += 1
        }

        let lineRange = NSRange(location: lineStart, length: lineEnd - lineStart)

        let mutableAttrString = NSMutableAttributedString(attributedString: textView.attributedText)
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.alignment = alignment
        paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple

        mutableAttrString.addAttribute(.paragraphStyle, value: paragraphStyle, range: lineRange)

        isInternalChange = true
        textView.attributedText = mutableAttrString
        textView.selectedRange = range
        isInternalChange = false
        saveToUndoStack()
        sendContentChange()
    }

    func promptInsertLink() {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let viewController = windowScene.windows.first?.rootViewController else {
            return
        }

        let alert = UIAlertController(title: "Insert Link", message: nil, preferredStyle: .alert)
        alert.addTextField { textField in
            textField.placeholder = "Link text"
            if let selectedText = self.textView.text(in: self.textView.selectedTextRange ?? UITextRange()) {
                textField.text = selectedText
            }
        }
        alert.addTextField { textField in
            textField.placeholder = "URL"
            textField.keyboardType = .URL
        }

        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        alert.addAction(UIAlertAction(title: "Insert", style: .default) { [weak self] _ in
            guard let text = alert.textFields?[0].text,
                  let url = alert.textFields?[1].text,
                  !text.isEmpty, !url.isEmpty else { return }
            self?.insertLink(url: url, text: text)
        })

        viewController.present(alert, animated: true)
    }

    private func toggleStyle(key: NSAttributedString.Key, trait: UIFontDescriptor.SymbolicTraits) {
        // User explicitly toggling a style overrides any deferred restore from list continuation
        deferredTypingAttrs = nil

        let range = textView.selectedRange

        // No selection: toggle pending style for type-ahead (matches Android)
        if range.length == 0 {
            let styleName: String
            if trait == .traitBold { styleName = "bold" }
            else if trait == .traitItalic { styleName = "italic" }
            else { return }

            let attributedText = textView.attributedText ?? NSAttributedString()
            let cursorPos = range.location
            var isInsideStyle = false
            if cursorPos > 0 && cursorPos <= attributedText.length {
                if let font = attributedText.attribute(.font, at: cursorPos - 1, effectiveRange: nil) as? UIFont {
                    isInsideStyle = font.fontDescriptor.symbolicTraits.contains(trait)
                }
            }

            if isInsideStyle {
                if explicitlyOffStyles.contains(styleName) {
                    explicitlyOffStyles.remove(styleName)
                } else {
                    explicitlyOffStyles.insert(styleName)
                    pendingStyles.remove(styleName)
                }
            } else {
                if pendingStyles.contains(styleName) {
                    pendingStyles.remove(styleName)
                } else {
                    pendingStyles.insert(styleName)
                    explicitlyOffStyles.remove(styleName)
                }
            }
            pendingStylesInsertPos = cursorPos
            emitActiveStyles()
            updateToolbarButtonStates()
            applyPendingStylesToTypingAttributes()
            return
        }

        let mutableAttrString = NSMutableAttributedString(attributedString: textView.attributedText)

        // Skip mention ranges — apply formatting only to non-mention text (Req 6.1)
        let segments = nonMentionRanges(in: range, attributedText: mutableAttrString)
        guard !segments.isEmpty else { return }

        var hasTrait = false
        for seg in segments {
            mutableAttrString.enumerateAttribute(.font, in: seg, options: []) { value, _, _ in
                if let font = value as? UIFont {
                    hasTrait = font.fontDescriptor.symbolicTraits.contains(trait)
                }
            }
        }

        for seg in segments {
            mutableAttrString.enumerateAttribute(.font, in: seg, options: []) { value, attrRange, _ in
                if let font = value as? UIFont {
                    var newTraits = font.fontDescriptor.symbolicTraits
                    if hasTrait {
                        newTraits.remove(trait)
                    } else {
                        newTraits.insert(trait)
                    }
                    if let descriptor = font.fontDescriptor.withSymbolicTraits(newTraits) {
                        let newFont = UIFont(descriptor: descriptor, size: font.pointSize)
                        mutableAttrString.addAttribute(.font, value: newFont, range: attrRange)
                    }
                }
            }
        }

        isInternalChange = true
        textView.attributedText = mutableAttrString
        textView.selectedRange = range
        isInternalChange = false
        saveToUndoStack()
        sendContentChange()
        emitActiveStyles()
        updateToolbarButtonStates()
    }

    private func toggleAttribute(key: NSAttributedString.Key, value: Int) {
        // User explicitly toggling an attribute overrides any deferred restore from list continuation
        deferredTypingAttrs = nil

        let range = textView.selectedRange

        // No selection: toggle pending style for type-ahead (matches Android)
        if range.length == 0 {
            let styleName: String
            if key == .underlineStyle { styleName = "underline" }
            else if key == .strikethroughStyle { styleName = "strikethrough" }
            else { return }

            let attributedText = textView.attributedText ?? NSAttributedString()
            let cursorPos = range.location
            var isInsideStyle = false
            if cursorPos > 0 && cursorPos <= attributedText.length {
                if let attrVal = attributedText.attribute(key, at: cursorPos - 1, effectiveRange: nil) as? Int, attrVal != 0 {
                    isInsideStyle = true
                }
            }

            if isInsideStyle {
                if explicitlyOffStyles.contains(styleName) {
                    explicitlyOffStyles.remove(styleName)
                } else {
                    explicitlyOffStyles.insert(styleName)
                    pendingStyles.remove(styleName)
                }
            } else {
                if pendingStyles.contains(styleName) {
                    pendingStyles.remove(styleName)
                } else {
                    pendingStyles.insert(styleName)
                    explicitlyOffStyles.remove(styleName)
                }
            }
            pendingStylesInsertPos = cursorPos
            emitActiveStyles()
            updateToolbarButtonStates()
            applyPendingStylesToTypingAttributes()
            return
        }

        let mutableAttrString = NSMutableAttributedString(attributedString: textView.attributedText)

        // Skip mention ranges — apply formatting only to non-mention text (Req 6.1)
        let segments = nonMentionRanges(in: range, attributedText: mutableAttrString)
        guard !segments.isEmpty else { return }

        var hasAttribute = false
        for seg in segments {
            mutableAttrString.enumerateAttribute(key, in: seg, options: []) { attrValue, _, _ in
                if attrValue != nil {
                    hasAttribute = true
                }
            }
        }

        for seg in segments {
            if hasAttribute {
                mutableAttrString.removeAttribute(key, range: seg)
            } else {
                mutableAttrString.addAttribute(key, value: value, range: seg)
            }
        }

        isInternalChange = true
        textView.attributedText = mutableAttrString
        textView.selectedRange = range
        isInternalChange = false
        saveToUndoStack()
        sendContentChange()
        emitActiveStyles()
        updateToolbarButtonStates()
    }

    /// Applies pending style toggles to typingAttributes so newly typed text inherits them.
    /// Matches Android's pendingStyles mechanism via iOS's native typingAttributes API.
    private func applyPendingStylesToTypingAttributes() {
        var attrs = textView.typingAttributes
        var baseFont = attrs[.font] as? UIFont ?? UIFont.systemFont(ofSize: 16)
        var traits = baseFont.fontDescriptor.symbolicTraits

        // Bold
        if pendingStyles.contains("bold") { traits.insert(.traitBold) }
        if explicitlyOffStyles.contains("bold") { traits.remove(.traitBold) }
        // Italic
        if pendingStyles.contains("italic") { traits.insert(.traitItalic) }
        if explicitlyOffStyles.contains("italic") { traits.remove(.traitItalic) }

        // Code (monospace) — switches base font family
        if pendingStyles.contains("code") || pendingStyles.contains("codeBlock") {
            let fontSize: CGFloat = pendingStyles.contains("codeBlock") ? 16 : 15
            baseFont = UIFont.monospacedSystemFont(ofSize: fontSize, weight: .regular)
            traits = baseFont.fontDescriptor.symbolicTraits
            // Re-apply bold/italic on mono font
            if pendingStyles.contains("bold") || (attrs[.font] as? UIFont)?.fontDescriptor.symbolicTraits.contains(.traitBold) == true {
                if !explicitlyOffStyles.contains("bold") { traits.insert(.traitBold) }
            }
            if pendingStyles.contains("italic") || (attrs[.font] as? UIFont)?.fontDescriptor.symbolicTraits.contains(.traitItalic) == true {
                if !explicitlyOffStyles.contains("italic") { traits.insert(.traitItalic) }
            }
            // Apply code visual styling (only inline code gets colored bg/fg)
            if pendingStyles.contains("code") && !pendingStyles.contains("codeBlock") {
                attrs[.foregroundColor] = inlineCodeTextColor
                attrs[.backgroundColor] = inlineCodeBgColor
            } else {
                attrs[.foregroundColor] = UIColor.label
                attrs.removeValue(forKey: .backgroundColor)
                attrs[CodeBlockAttributeKey] = true
            }
        } else if explicitlyOffStyles.contains("code") {
            if baseFont.fontDescriptor.symbolicTraits.contains(.traitMonoSpace) {
                baseFont = UIFont.systemFont(ofSize: 16)
                traits = baseFont.fontDescriptor.symbolicTraits
                if (attrs[.font] as? UIFont)?.fontDescriptor.symbolicTraits.contains(.traitBold) == true && !explicitlyOffStyles.contains("bold") {
                    traits.insert(.traitBold)
                }
                if (attrs[.font] as? UIFont)?.fontDescriptor.symbolicTraits.contains(.traitItalic) == true && !explicitlyOffStyles.contains("italic") {
                    traits.insert(.traitItalic)
                }
            }
            // Remove code visual styling
            attrs.removeValue(forKey: .backgroundColor)
            attrs[.foregroundColor] = UIColor.label
        }

        if let descriptor = baseFont.fontDescriptor.withSymbolicTraits(traits) {
            attrs[.font] = UIFont(descriptor: descriptor, size: baseFont.pointSize)
        }

        // Underline
        if pendingStyles.contains("underline") {
            attrs[.underlineStyle] = NSUnderlineStyle.single.rawValue
        } else if explicitlyOffStyles.contains("underline") {
            attrs.removeValue(forKey: .underlineStyle)
        }

        // Strikethrough
        if pendingStyles.contains("strikethrough") {
            attrs[.strikethroughStyle] = NSUnderlineStyle.single.rawValue
        } else if explicitlyOffStyles.contains("strikethrough") {
            attrs.removeValue(forKey: .strikethroughStyle)
        }

        textView.typingAttributes = attrs
    }

    func toggleBulletList() {
        toggleListStyle(bullet: true)
    }

    func toggleNumberedList() {
        toggleListStyle(bullet: false)
    }

    private func toggleListStyle(bullet: Bool) {
        // Mutual exclusivity: exit code block mode before applying list (matches Android toggleListPrefix)
        // Remove code block attributes inline rather than calling toggleCodeBlock() to avoid
        // textView.attributedText reassignment mid-flow.
        let range = textView.selectedRange
        let currentText = textView.text ?? ""
        let currentNsText = currentText as NSString

        var checkStart = range.location
        while checkStart > 0 && currentNsText.character(at: checkStart - 1) != 10 { checkStart -= 1 }
        var checkEnd = range.location + range.length
        while checkEnd < currentText.count && currentNsText.character(at: checkEnd) != 10 { checkEnd += 1 }

        let preAttrText = textView.attributedText ?? NSAttributedString()
        var hasCodeBlockAttr = false
        if checkStart < checkEnd && checkEnd <= preAttrText.length {
            preAttrText.enumerateAttribute(CodeBlockAttributeKey, in: NSRange(location: checkStart, length: checkEnd - checkStart), options: []) { value, _, _ in
                if value != nil { hasCodeBlockAttr = true }
            }
        }

        if hasCodeBlockAttr || pendingStyles.contains("codeBlock") {
            // Inline code block removal (same as Android: remove spans directly)
            let mutablePre = NSMutableAttributedString(attributedString: preAttrText)
            let lineRange = NSRange(location: checkStart, length: checkEnd - checkStart)
            if lineRange.length > 0 && checkEnd <= mutablePre.length {
                mutablePre.removeAttribute(CodeBlockAttributeKey, range: lineRange)
                mutablePre.enumerateAttribute(.font, in: lineRange, options: []) { value, attrRange, _ in
                    if let font = value as? UIFont, font.fontDescriptor.symbolicTraits.contains(.traitMonoSpace) {
                        mutablePre.addAttribute(.font, value: UIFont.systemFont(ofSize: 16), range: attrRange)
                    }
                }
                mutablePre.removeAttribute(.underlineStyle, range: lineRange)
                mutablePre.removeAttribute(.strikethroughStyle, range: lineRange)
                mutablePre.removeAttribute(.backgroundColor, range: lineRange)
                mutablePre.addAttribute(.foregroundColor, value: UIColor.label, range: lineRange)

                // Remove ZWS placeholder that toggleCodeBlock inserts for empty-line code blocks.
                // Without this, the ZWS remains as invisible content and can confuse list logic.
                let lineStr = mutablePre.string as NSString
                var zwsOffset = 0
                for i in checkStart..<checkEnd {
                    if lineStr.character(at: i - zwsOffset) == 0x200B {
                        mutablePre.deleteCharacters(in: NSRange(location: i - zwsOffset, length: 1))
                        zwsOffset += 1
                    }
                }
            }
            isInternalChange = true
            textView.attributedText = mutablePre
            textView.selectedRange = NSRange(location: max(0, range.location - (checkEnd - checkStart > 0 ? 0 : 0)), length: 0)
            isInternalChange = false
            pendingStyles.remove("codeBlock")
            pendingStyles.remove("bold")
            pendingStyles.remove("italic")
            pendingStyles.remove("underline")
            pendingStyles.remove("strikethrough")
            pendingStyles.remove("code")
            explicitlyOffStyles.removeAll()
            // Reset typingAttributes to plain so list prefix doesn't inherit code block styling
            let plainParaStyle = NSMutableParagraphStyle()
            plainParaStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
            textView.typingAttributes = [
                .font: UIFont.systemFont(ofSize: 16),
                .foregroundColor: UIColor.label,
                .paragraphStyle: plainParaStyle
            ]
            textView.setNeedsDisplay()
        }

        let text = textView.text ?? ""
        let nsText = text as NSString

        var selectionStart = range.location
        var selectionEnd = range.location + range.length

        while selectionStart > 0 && nsText.character(at: selectionStart - 1) != 10 {
            selectionStart -= 1
        }
        while selectionEnd < text.count && nsText.character(at: selectionEnd) != 10 {
            selectionEnd += 1
        }

        let selectedText = nsText.substring(with: NSRange(location: selectionStart, length: selectionEnd - selectionStart))
        let lines = selectedText.components(separatedBy: "\n")

        let bulletPrefix = "• "
        let numberedRegex = try? NSRegularExpression(pattern: "^\\d+\\.\\s")

        // Check if all non-empty lines already have this prefix (accounting for optional blockquote)
        let hasNonEmptyLines = lines.contains { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
        let allHavePrefix: Bool
        if bullet {
            allHavePrefix = hasNonEmptyLines && lines.allSatisfy { line in
                if line.trimmingCharacters(in: .whitespaces).isEmpty { return true }
                let content = line.hasPrefix("▎ ") ? String(line.dropFirst(2)) : line
                return content.hasPrefix(bulletPrefix)
            }
        } else {
            allHavePrefix = hasNonEmptyLines && lines.allSatisfy { line in
                if line.trimmingCharacters(in: .whitespaces).isEmpty { return true }
                let content = line.hasPrefix("▎ ") ? String(line.dropFirst(2)) : line
                return numberedRegex?.firstMatch(in: content, range: NSRange(location: 0, length: content.count)) != nil
            }
        }

        // Instead of replacing the entire text range with a plain NSAttributedString
        // (which destroys bold/italic/underline/strikethrough on existing content),
        // manipulate the mutableAttr directly: delete old prefixes and insert new ones
        // while preserving the attributes on the actual text content.
        let mutableAttr = NSMutableAttributedString(attributedString: textView.attributedText)
        let originalLength = mutableAttr.length
        let plainAttributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 16),
            .foregroundColor: UIColor.label
        ]

        // Process lines in reverse order so earlier offsets remain valid
        var lineOffset = selectionStart
        var lineOffsets: [(start: Int, line: String)] = []
        for line in lines {
            lineOffsets.append((start: lineOffset, line: line))
            lineOffset += line.count + 1 // +1 for \n
        }

        for (index, entry) in lineOffsets.enumerated().reversed() {
            let lineStart = entry.start
            let line = entry.line

            if line.trimmingCharacters(in: .whitespaces).isEmpty && allHavePrefix {
                continue
            }

            let hasQuote = line.hasPrefix("▎ ")
            let quoteOffset = hasQuote ? 2 : 0
            let lineContent = hasQuote ? String(line.dropFirst(2)) : line

            if allHavePrefix {
                // Removing prefix — delete the prefix characters after the optional blockquote
                if bullet && lineContent.hasPrefix(bulletPrefix) {
                    let deleteStart = lineStart + quoteOffset
                    mutableAttr.deleteCharacters(in: NSRange(location: deleteStart, length: bulletPrefix.count))
                } else if !bullet, let match = numberedRegex?.firstMatch(in: lineContent, range: NSRange(location: 0, length: lineContent.count)) {
                    let deleteStart = lineStart + quoteOffset
                    mutableAttr.deleteCharacters(in: NSRange(location: deleteStart, length: match.range.length))
                }
            } else {
                // Adding prefix — first strip any existing list prefix, then insert new one
                let contentStart = lineStart + quoteOffset
                var stripLength = 0
                if lineContent.hasPrefix(bulletPrefix) {
                    stripLength = bulletPrefix.count
                } else if lineContent.hasPrefix("☐ ") || lineContent.hasPrefix("☑ ") {
                    stripLength = 2
                } else if let match = numberedRegex?.firstMatch(in: lineContent, range: NSRange(location: 0, length: lineContent.count)) {
                    stripLength = match.range.length
                }

                if stripLength > 0 {
                    mutableAttr.deleteCharacters(in: NSRange(location: contentStart, length: stripLength))
                }

                // Insert new prefix with plain attributes (prefix should not inherit bold/italic)
                let newPrefix: String
                if bullet {
                    newPrefix = bulletPrefix
                } else {
                    newPrefix = "\(index + 1). "
                }
                let prefixAttr = NSAttributedString(string: newPrefix, attributes: plainAttributes)
                mutableAttr.insert(prefixAttr, at: contentStart)
            }
        }

        // Make all ▎ characters invisible in the affected range
        let newNsText = mutableAttr.string as NSString
        let lengthDelta = mutableAttr.length - originalLength
        let newSelEnd = selectionEnd + lengthDelta
        var searchPos = selectionStart
        while searchPos < newSelEnd && searchPos < mutableAttr.length {
            if newNsText.character(at: searchPos) == 0x258E { // ▎ character
                mutableAttr.addAttribute(.foregroundColor, value: UIColor.clear, range: NSRange(location: searchPos, length: 1))
            }
            searchPos += 1
        }

        isInternalChange = true
        textView.attributedText = mutableAttr
        textView.selectedRange = NSRange(location: newSelEnd, length: 0)
        isInternalChange = false

        // Restore pending inline styles (bold, italic, underline, strikethrough) that
        // were active before the list toggle. The attributedText assignment above resets
        // typingAttributes to plain, wiping any styles the user had toggled on.
        applyPendingStylesToTypingAttributes()

        placeholderLabel.isHidden = !textView.text.isEmpty

        applyListIndentation()
        renumberNumberedLists()

        // Restore again after applyListIndentation/renumberNumberedLists which also
        // set textView.attributedText and wipe typingAttributes.
        applyPendingStylesToTypingAttributes()
        deferredTypingAttrs = textView.typingAttributes

        // Re-check placeholder after all post-processing (applyListIndentation /
        // renumberNumberedLists may set textView.attributedText which can cause
        // UIKit to re-evaluate placeholder visibility on some iOS versions).
        placeholderLabel.isHidden = !textView.text.isEmpty

        DispatchQueue.main.async { [weak self] in
            // Final deferred placeholder check — covers UIKit edge cases where
            // attributedText setter schedules a layout pass that re-shows the label.
            guard let self = self else { return }
            let hasContent = self.textView.attributedText.length > 0
            self.placeholderLabel.isHidden = hasContent
            self.textView.setNeedsDisplay()
        }
        saveToUndoStack()
        sendContentChange()
        emitActiveStyles()
    }

    func setContent(blocks: [[String: Any]]) {
        let attributedString = NSMutableAttributedString()
        let font = UIFont.systemFont(ofSize: 16)

        var numberedIndex = 1
        for (blockIndex, block) in blocks.enumerated() {
            guard let text = block["text"] as? String else { continue }
            let blockType = block["type"] as? String ?? "paragraph"

            var displayText = text
            var prefixLength = 0
            let paragraphStyle = NSMutableParagraphStyle()
            paragraphStyle.alignment = .left
            paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple

            switch blockType {
            case "bullet":
                let bulletPrefix = "• "
                displayText = bulletPrefix + text
                prefixLength = 2
                let bulletWidth = (bulletPrefix as NSString).size(withAttributes: [.font: font]).width
                paragraphStyle.firstLineHeadIndent = 0
                paragraphStyle.headIndent = bulletWidth
            case "numbered":
                let prefix = "\(numberedIndex). "
                displayText = prefix + text
                prefixLength = prefix.count
                let prefixWidth = (prefix as NSString).size(withAttributes: [.font: font]).width
                paragraphStyle.firstLineHeadIndent = 0
                paragraphStyle.headIndent = prefixWidth
                numberedIndex += 1
            case "quote":
                let quotePrefix = "▎ "
                displayText = quotePrefix + text
                prefixLength = 2
                let prefixWidth = (quotePrefix as NSString).size(withAttributes: [.font: font]).width
                paragraphStyle.firstLineHeadIndent = 0
                paragraphStyle.headIndent = prefixWidth
            case "quoteBullet":
                let prefix = "▎ • "
                displayText = prefix + text
                prefixLength = 4
                let prefixWidth = (prefix as NSString).size(withAttributes: [.font: font]).width
                paragraphStyle.firstLineHeadIndent = 0
                paragraphStyle.headIndent = prefixWidth
            case "quoteNumbered":
                let prefix = "▎ \(numberedIndex). "
                displayText = prefix + text
                prefixLength = prefix.count
                let prefixWidth = (prefix as NSString).size(withAttributes: [.font: font]).width
                paragraphStyle.firstLineHeadIndent = 0
                paragraphStyle.headIndent = prefixWidth
                numberedIndex += 1
            case "codeBlock":
                displayText = text
                prefixLength = 0
                paragraphStyle.firstLineHeadIndent = 0
                paragraphStyle.headIndent = 0
            default:
                paragraphStyle.firstLineHeadIndent = 0
                paragraphStyle.headIndent = 0
                numberedIndex = 1
            }

            let blockFont = blockType == "codeBlock" ? UIFont.monospacedSystemFont(ofSize: 16, weight: .regular) : font
            let blockAttrString = NSMutableAttributedString(string: displayText, attributes: [
                .font: blockFont,
                .foregroundColor: UIColor.label,
                .paragraphStyle: paragraphStyle
            ])

            // Apply code block marker attribute for the entire line
            if blockType == "codeBlock" {
                blockAttrString.addAttribute(CodeBlockAttributeKey, value: true, range: NSRange(location: 0, length: blockAttrString.length))
            }

            // Make ▎ character invisible for quote block types — bar is custom-drawn
            if blockType == "quote" || blockType == "quoteBullet" || blockType == "quoteNumbered" {
                blockAttrString.addAttribute(.foregroundColor, value: UIColor.clear, range: NSRange(location: 0, length: 1))
            }

            if let styles = block["styles"] as? [[String: Any]] {
                for style in styles {
                    guard let start = style["start"] as? Int,
                          let end = style["end"] as? Int,
                          let styleType = style["style"] as? String,
                          start < end && end <= text.count else { continue }

                    let range = NSRange(location: start + prefixLength, length: end - start)

                    switch styleType {
                    case "bold":
                        // Read existing font and add bold trait (preserves italic if already set)
                        blockAttrString.enumerateAttribute(.font, in: range, options: []) { value, subRange, _ in
                            let existingFont = (value as? UIFont) ?? font
                            var traits = existingFont.fontDescriptor.symbolicTraits
                            traits.insert(.traitBold)
                            if let desc = existingFont.fontDescriptor.withSymbolicTraits(traits) {
                                blockAttrString.addAttribute(.font, value: UIFont(descriptor: desc, size: existingFont.pointSize), range: subRange)
                            }
                        }
                    case "italic":
                        // Read existing font and add italic trait (preserves bold if already set)
                        blockAttrString.enumerateAttribute(.font, in: range, options: []) { value, subRange, _ in
                            let existingFont = (value as? UIFont) ?? font
                            var traits = existingFont.fontDescriptor.symbolicTraits
                            traits.insert(.traitItalic)
                            if let desc = existingFont.fontDescriptor.withSymbolicTraits(traits) {
                                blockAttrString.addAttribute(.font, value: UIFont(descriptor: desc, size: existingFont.pointSize), range: subRange)
                            }
                        }
                    case "underline":
                        blockAttrString.addAttribute(.underlineStyle, value: NSUnderlineStyle.single.rawValue, range: range)
                    case "strikethrough":
                        blockAttrString.addAttribute(.strikethroughStyle, value: NSUnderlineStyle.single.rawValue, range: range)
                    case "code":
                        let monoFont = UIFont.monospacedSystemFont(ofSize: 15, weight: .regular)
                        blockAttrString.addAttribute(.font, value: monoFont, range: range)
                        blockAttrString.addAttribute(.foregroundColor, value: inlineCodeTextColor, range: range)
                        blockAttrString.addAttribute(.backgroundColor, value: inlineCodeBgColor, range: range)
                    case "link":
                        if let url = style["url"] as? String, !url.isEmpty {
                            let normalizedUrl = normalizeURL(url)
                            blockAttrString.addAttribute(LinkURLAttributeKey, value: normalizedUrl, range: range)
                            blockAttrString.addAttribute(.foregroundColor, value: UIColor.systemBlue, range: range)
                        }
                    default:
                        break
                    }
                }
            }

            if blockIndex < blocks.count - 1 {
                var newlineAttrs: [NSAttributedString.Key: Any] = [
                    .font: font,
                    .foregroundColor: UIColor.label,
                    .paragraphStyle: paragraphStyle
                ]
                // Carry CodeBlockAttributeKey on the newline between consecutive
                // codeBlock lines so getBlocksArray() fallback detects empty lines
                // inside code blocks correctly during edit round-trips.
                if blockType == "codeBlock" {
                    newlineAttrs[CodeBlockAttributeKey] = true
                }
                blockAttrString.append(NSAttributedString(string: "\n", attributes: newlineAttrs))
            }
            attributedString.append(blockAttrString)
        }

        isInternalChange = true
        textView.attributedText = attributedString
        placeholderLabel.isHidden = !textView.text.isEmpty
        isInternalChange = false
        applyListIndentation()

        let endPosition = textView.text?.count ?? 0

        // Detect if cursor lands inside a code block and update pendingStyles
        // BEFORE setting selectedRange, because selectedRange triggers
        // textViewDidChangeSelection which calls emitActiveStyles().
        if endPosition > 0, let attrText = textView.attributedText {
            let checkPos = min(endPosition - 1, attrText.length - 1)
            if checkPos >= 0 {
                let hasCodeBlockAttr = attrText.attribute(CodeBlockAttributeKey, at: checkPos, effectiveRange: nil) != nil
                if hasCodeBlockAttr {
                    pendingStyles.insert("codeBlock")
                    pendingStylesInsertPos = endPosition
                    let cbParaStyle = NSMutableParagraphStyle()
                    cbParaStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
                    textView.typingAttributes = [
                        .font: UIFont.monospacedSystemFont(ofSize: 16, weight: .regular),
                        .foregroundColor: UIColor.label,
                        .paragraphStyle: cbParaStyle,
                        CodeBlockAttributeKey: true
                    ]
                }
            }
        }

        textView.selectedRange = NSRange(location: endPosition, length: 0)

        // Force redraw so code block borders/backgrounds render immediately
        textView.setNeedsDisplay()
        sendContentChange()

        DispatchQueue.main.async { [weak self] in
            self?.textView.scrollRangeToVisible(NSRange(location: endPosition, length: 0))
            self?.updateContentSize()
        }
    }

    func getText() -> String {
        return textView.text ?? ""
    }

    func getBlocksArray() -> [[String: Any]] {
        let text = textView.text ?? ""
        let attributedText = textView.attributedText ?? NSAttributedString()

        let lines = text.components(separatedBy: "\n")
        var blocks: [[String: Any]] = []
        var currentIndex = 0
        let numberedPattern = "^(\\d+)\\.\\s"
        let numberedRegex = try? NSRegularExpression(pattern: numberedPattern, options: [])
        let quoteNumberedPattern = "^▎ (\\d+)\\.\\s"
        let quoteNumberedRegex = try? NSRegularExpression(pattern: quoteNumberedPattern, options: [])

        for line in lines {
            var blockType = "paragraph"
            var displayText = line

            // Combined blockquote + list (must check before individual prefixes)
            if line.hasPrefix("▎ • ") {
                blockType = "quoteBullet"
                displayText = String(line.dropFirst(4))
            } else if let qnMatch = quoteNumberedRegex?.firstMatch(in: line, range: NSRange(location: 0, length: line.count)) {
                blockType = "quoteNumbered"
                displayText = String(line.dropFirst(qnMatch.range.length))
            } else if line.hasPrefix("• ") {
                blockType = "bullet"
                displayText = String(line.dropFirst(2))
            } else if let match = numberedRegex?.firstMatch(in: line, range: NSRange(location: 0, length: line.count)) {
                blockType = "numbered"
                displayText = String(line.dropFirst(match.range.length))
            } else if line.hasPrefix("▎ ") {
                blockType = "quote"
                displayText = String(line.dropFirst(2))
            }

            // Detect code block: check the line range for CodeBlockAttributeKey
            let lineRange = NSRange(location: currentIndex, length: line.count)
            if lineRange.location + lineRange.length <= attributedText.length && lineRange.length > 0 {
                var hasCodeBlockAttr = false
                attributedText.enumerateAttribute(CodeBlockAttributeKey, in: lineRange, options: []) { value, _, _ in
                    if value != nil { hasCodeBlockAttr = true }
                }
                if hasCodeBlockAttr {
                    blockType = "codeBlock"
                }
            }
            // Fallback: empty lines inside a code block — check preceding newline
            if blockType != "codeBlock" && line.isEmpty && currentIndex > 0 {
                let prevIdx = currentIndex - 1
                if prevIdx < attributedText.length {
                    if attributedText.attribute(CodeBlockAttributeKey, at: prevIdx, effectiveRange: nil) != nil {
                        blockType = "codeBlock"
                    }
                }
            }

            // Strip ZWS from display text (code block placeholder)
            displayText = displayText.replacingOccurrences(of: "\u{200B}", with: "")

            var styles: [[String: Any]] = []
            let prefixLength = line.count - displayText.count
            let styleRangeStart = currentIndex + prefixLength
            let styleRangeLength = displayText.count
            let styleLineRange = NSRange(location: styleRangeStart, length: styleRangeLength)

            if styleLineRange.location + styleLineRange.length <= attributedText.length {
                attributedText.enumerateAttributes(in: styleLineRange, options: []) { attrs, range, _ in
                    let relativeStart = range.location - styleRangeStart
                    let relativeEnd = relativeStart + range.length

                    if let font = attrs[.font] as? UIFont {
                        let traits = font.fontDescriptor.symbolicTraits
                        if traits.contains(.traitBold) {
                            styles.append(["style": "bold", "start": relativeStart, "end": relativeEnd])
                        }
                        if traits.contains(.traitItalic) {
                            styles.append(["style": "italic", "start": relativeStart, "end": relativeEnd])
                        }
                        if traits.contains(.traitMonoSpace) {
                            styles.append(["style": "code", "start": relativeStart, "end": relativeEnd])
                        }
                    }
                    // Detect link attribute and emit with URL (matching Android URLSpan handling)
                    let hasLink = attrs[LinkURLAttributeKey] != nil
                    if hasLink {
                        var urlString = ""
                        if let url = attrs[LinkURLAttributeKey] as? URL {
                            urlString = url.absoluteString
                        } else if let str = attrs[LinkURLAttributeKey] as? String {
                            urlString = str
                        }
                        if !urlString.isEmpty {
                            styles.append(["style": "link", "start": relativeStart, "end": relativeEnd, "url": urlString])
                        }
                    }
                    // Skip underline if co-located with a link (links have underline by default)
                    if attrs[.underlineStyle] != nil && !hasLink {
                        styles.append(["style": "underline", "start": relativeStart, "end": relativeEnd])
                    }
                    if attrs[.strikethroughStyle] != nil {
                        styles.append(["style": "strikethrough", "start": relativeStart, "end": relativeEnd])
                    }
                }
            }

            blocks.append([
                "type": blockType,
                "text": displayText,
                "styles": styles
            ])

            currentIndex += line.count + 1
        }

        return blocks
    }

    func clear() {
        isInternalChange = true
        textView.text = ""
        textView.attributedText = NSAttributedString()
        placeholderLabel.isHidden = false
        isInternalChange = false
        pendingStyles.removeAll()
        explicitlyOffStyles.removeAll()
        pendingStylesInsertPos = -1
        // Reset typingAttributes to plain so next typed text has no formatting
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
        textView.typingAttributes = [
            .font: UIFont.systemFont(ofSize: 16),
            .foregroundColor: UIColor.label,
            .paragraphStyle: paragraphStyle
        ]
        sendContentChange()
        // Emit all-false active styles so JS toolbar resets
        emitActiveStyles()
    }

    func focus() {
        textView.becomeFirstResponder()
    }

    func blur() {
        textView.resignFirstResponder()
    }

    func insertLink(url: String, text: String) {
        let normalizedUrl = normalizeURL(url)
        let range = textView.selectedRange
        let mutableAttrString = NSMutableAttributedString(attributedString: textView.attributedText)

        let linkAttrString = NSAttributedString(string: text, attributes: [
            LinkURLAttributeKey: normalizedUrl,
            .font: UIFont.systemFont(ofSize: 16),
            .foregroundColor: UIColor.systemBlue
        ])

        if range.length > 0 {
            mutableAttrString.replaceCharacters(in: range, with: linkAttrString)
        } else {
            mutableAttrString.insert(linkAttrString, at: range.location)
        }

        isInternalChange = true
        textView.attributedText = mutableAttrString

        // Place cursor after the inserted link text
        let newCursorPos = range.location + text.count
        textView.selectedRange = NSRange(location: newCursorPos, length: 0)

        // Reset typing attributes to default so text typed after the link
        // is not underlined / styled as a link
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.alignment = .left
        paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
        textView.typingAttributes = [
            .font: UIFont.systemFont(ofSize: 16),
            .foregroundColor: UIColor.label,
            .paragraphStyle: paragraphStyle
        ]

        placeholderLabel.isHidden = !textView.text.isEmpty
        isInternalChange = false
        saveToUndoStack()
        sendContentChange()
        updateToolbarButtonStates()
        emitActiveStyles()
    }

    func undo() {
        guard undoStack.count > 1 else { return }

        let current = undoStack.removeLast()
        redoStack.append(current)

        if let previous = undoStack.last {
            isInternalChange = true
            textView.attributedText = previous
            placeholderLabel.isHidden = !textView.text.isEmpty
            isInternalChange = false
            sendContentChange()
        }
    }

    func redo() {
        guard let next = redoStack.popLast() else { return }

        undoStack.append(next)
        isInternalChange = true
        textView.attributedText = next
        placeholderLabel.isHidden = !textView.text.isEmpty
        isInternalChange = false
        sendContentChange()
    }

    // MARK: - Missing methods required by ViewManager

    func toggleCodeBlock() {
        let text = textView.text ?? ""
        let nsText = text as NSString
        let cursorPos = textView.selectedRange.location

        // Find current line boundaries
        var lineStart = min(cursorPos, nsText.length)
        while lineStart > 0 && nsText.character(at: lineStart - 1) != 10 { lineStart -= 1 }
        var lineEnd = min(max(cursorPos, textView.selectedRange.location + textView.selectedRange.length), nsText.length)
        while lineEnd < nsText.length && nsText.character(at: lineEnd) != 10 { lineEnd += 1 }

        let mutableAttr = NSMutableAttributedString(attributedString: textView.attributedText ?? NSAttributedString())

        // Mutual exclusivity: remove blockquote prefix if present
        let lineText = lineStart < lineEnd ? nsText.substring(with: NSRange(location: lineStart, length: lineEnd - lineStart)) : ""
        let quotePrefix = "▎ "
        if lineText.hasPrefix(quotePrefix) {
            isInternalChange = true
            mutableAttr.deleteCharacters(in: NSRange(location: lineStart, length: quotePrefix.count))
            textView.attributedText = mutableAttr
            isInternalChange = false
            lineEnd -= quotePrefix.count
        }

        // Mutual exclusivity: remove list prefixes (bullet, numbered, checklist)
        // Re-read line text after possible quote removal
        let updatedLineText = lineStart < lineEnd ? (textView.text as NSString).substring(with: NSRange(location: lineStart, length: lineEnd - lineStart)) : ""
        if updatedLineText.hasPrefix("• ") {
            isInternalChange = true
            mutableAttr.deleteCharacters(in: NSRange(location: lineStart, length: 2))
            textView.attributedText = mutableAttr
            isInternalChange = false
            lineEnd -= 2
        } else if updatedLineText.hasPrefix("☐ ") || updatedLineText.hasPrefix("☑ ") {
            isInternalChange = true
            mutableAttr.deleteCharacters(in: NSRange(location: lineStart, length: 2))
            textView.attributedText = mutableAttr
            isInternalChange = false
            lineEnd -= 2
        } else if let numberedMatch = try? NSRegularExpression(pattern: "^\\d+\\.\\s", options: []).firstMatch(in: updatedLineText, range: NSRange(location: 0, length: updatedLineText.count)) {
            isInternalChange = true
            mutableAttr.deleteCharacters(in: NSRange(location: lineStart, length: numberedMatch.range.length))
            textView.attributedText = mutableAttr
            isInternalChange = false
            lineEnd -= numberedMatch.range.length
        }

        // Empty line: insert ZWS with code block marker for immediate container
        if lineStart >= lineEnd {
            isInternalChange = true
            let zws = "\u{200B}"
            let insertPos = min(textView.selectedRange.location, mutableAttr.length)
            let monoFont = UIFont.monospacedSystemFont(ofSize: 16, weight: .regular)
            let paragraphStyle = NSMutableParagraphStyle()
            paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
            let zwsAttr = NSAttributedString(string: zws, attributes: [
                .font: monoFont,
                .foregroundColor: UIColor.label,
                .paragraphStyle: paragraphStyle,
                CodeBlockAttributeKey: true
            ])
            mutableAttr.insert(zwsAttr, at: insertPos)
            textView.attributedText = mutableAttr
            textView.selectedRange = NSRange(location: insertPos + 1, length: 0)
            textView.typingAttributes = [
                .font: monoFont,
                .foregroundColor: UIColor.label,
                .paragraphStyle: paragraphStyle,
                CodeBlockAttributeKey: true
            ]
            // Track code block as a pending style so it survives textDidChange clearing
            pendingStyles.insert("codeBlock")
            pendingStylesInsertPos = textView.selectedRange.location
            isInternalChange = false
            textView.setNeedsDisplay()
            updateContentSize()
            saveToUndoStack()
            sendContentChange()
            emitActiveStyles()
            return
        }

        // Non-empty line: check if already has code block attribute
        let lineRange = NSRange(location: lineStart, length: lineEnd - lineStart)
        var hasCodeBlock = false
        mutableAttr.enumerateAttribute(CodeBlockAttributeKey, in: lineRange, options: []) { value, _, _ in
            if value != nil { hasCodeBlock = true }
        }

        isInternalChange = true
        if hasCodeBlock {
            // Deactivating code block
            mutableAttr.removeAttribute(CodeBlockAttributeKey, range: lineRange)
            mutableAttr.enumerateAttribute(.font, in: lineRange, options: []) { value, attrRange, _ in
                if let font = value as? UIFont, font.fontDescriptor.symbolicTraits.contains(.traitMonoSpace) {
                    mutableAttr.addAttribute(.font, value: UIFont.systemFont(ofSize: 16), range: attrRange)
                }
            }
            mutableAttr.removeAttribute(.underlineStyle, range: lineRange)
            mutableAttr.removeAttribute(.strikethroughStyle, range: lineRange)
            mutableAttr.removeAttribute(.backgroundColor, range: lineRange)
            mutableAttr.addAttribute(.foregroundColor, value: UIColor.label, range: lineRange)

            // Remove ZWS placeholder that was inserted for empty-line code blocks
            let lineStr = mutableAttr.attributedSubstring(from: lineRange).string
            if lineStr == "\u{200B}" || lineStr.allSatisfy({ $0 == "\u{200B}" }) {
                mutableAttr.deleteCharacters(in: lineRange)
                lineEnd = lineStart
            }

            // Clear code block from pendingStyles and reset typingAttributes
            pendingStyles.remove("codeBlock")
            let paragraphStyle = NSMutableParagraphStyle()
            paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
            textView.typingAttributes = [
                .font: UIFont.systemFont(ofSize: 16),
                .foregroundColor: UIColor.label,
                .paragraphStyle: paragraphStyle
            ]
        } else {
            // Activating code block
            let monoFont = UIFont.monospacedSystemFont(ofSize: 16, weight: .regular)
            mutableAttr.addAttribute(.font, value: monoFont, range: lineRange)
            mutableAttr.removeAttribute(.backgroundColor, range: lineRange)
            mutableAttr.removeAttribute(.underlineStyle, range: lineRange)
            mutableAttr.removeAttribute(.strikethroughStyle, range: lineRange)
            mutableAttr.addAttribute(.foregroundColor, value: UIColor.label, range: lineRange)
            mutableAttr.addAttribute(CodeBlockAttributeKey, value: true, range: lineRange)
            // Strip mention markers so setMentionRanges() won't re-apply mention styling
            mutableAttr.removeAttribute(MentionMarkerKey, range: lineRange)
            // Set pendingStyles + typingAttributes so newly typed characters
            // inherit code block mode (matches empty-line activation path)
            pendingStyles.insert("codeBlock")
            pendingStylesInsertPos = lineEnd
            let paragraphStyle = NSMutableParagraphStyle()
            paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
            textView.typingAttributes = [
                .font: monoFont,
                .foregroundColor: UIColor.label,
                .paragraphStyle: paragraphStyle,
                CodeBlockAttributeKey: true
            ]
        }

        textView.attributedText = mutableAttr
        textView.selectedRange = NSRange(location: lineEnd, length: 0)
        isInternalChange = false
        textView.setNeedsDisplay()
        updateContentSize()
        saveToUndoStack()
        sendContentChange()
        emitActiveStyles()
    }

    func setTextContent(_ text: String, force: Bool = false) {
        let currentText = textView.text ?? ""
        // Compare clean texts (ZWS stripped) — JS sends clean text while native
        // has ZWS markers for code blocks. Raw comparison would never match.
        let cleanCurrent = currentText.replacingOccurrences(of: "\u{200B}", with: "")
        let cleanNew = text.replacingOccurrences(of: "\u{200B}", with: "")
        if cleanCurrent == cleanNew { return }

        isInternalChange = true

        // For force updates (mentions, clear, edit), do a targeted replacement
        // that preserves attributes (code block, inline code, etc.) on unchanged
        // regions. Matches Android's span-preserving editable.replace() approach.
        if force, let attrText = textView.attributedText, attrText.length > 0 {
            // Build clean-to-raw index mapping (strip ZWS)
            let rawChars = Array(currentText)
            var cleanChars: [Character] = []
            var cleanToRaw: [Int] = []
            for (rawIdx, ch) in rawChars.enumerated() {
                if ch != "\u{200B}" {
                    cleanToRaw.append(rawIdx)
                    cleanChars.append(ch)
                }
            }
            cleanToRaw.append(currentText.count) // sentinel

            let newChars = Array(cleanNew)
            let cleanLen = cleanChars.count
            let newLen = newChars.count
            let minLen = min(cleanLen, newLen)

            // Find common prefix
            var prefixLen = 0
            while prefixLen < minLen && cleanChars[prefixLen] == newChars[prefixLen] {
                prefixLen += 1
            }

            // Find common suffix (never overlap with prefix)
            var suffixLen = 0
            let maxSuffix = minLen - prefixLen
            while suffixLen < maxSuffix &&
                  cleanChars[cleanLen - 1 - suffixLen] == newChars[newLen - 1 - suffixLen] {
                suffixLen += 1
            }

            // Map clean-coordinate range back to raw-coordinate range
            let rawReplaceStart = cleanToRaw[prefixLen]
            let rawReplaceEnd = (cleanLen - suffixLen < cleanToRaw.count)
                ? cleanToRaw[cleanLen - suffixLen]
                : currentText.count
            let replacement = String(newChars[prefixLen ..< (newLen - suffixLen)])

            // Snapshot code block regions BEFORE replacement so we can verify
            // they survive the edit. Regions are stored as (rawStart, rawEnd).
            var codeBlockRegions: [(Int, Int)] = []
            attrText.enumerateAttribute(CodeBlockAttributeKey, in: NSRange(location: 0, length: attrText.length), options: []) { value, range, _ in
                if value != nil {
                    codeBlockRegions.append((range.location, range.location + range.length))
                }
            }

            let mutableAttr = NSMutableAttributedString(attributedString: attrText)
            let replaceRange = NSRange(location: rawReplaceStart, length: rawReplaceEnd - rawReplaceStart)

            // Build replacement attributed string with default attributes
            let paragraphStyle = NSMutableParagraphStyle()
            paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
            let replacementAttr = NSAttributedString(string: replacement, attributes: [
                .font: UIFont.systemFont(ofSize: 16),
                .foregroundColor: UIColor.label,
                .paragraphStyle: paragraphStyle
            ])
            mutableAttr.replaceCharacters(in: replaceRange, with: replacementAttr)

            // Restore CodeBlockAttributeKey on regions that were NOT part of the
            // replacement. The replacement shifts positions after rawReplaceStart
            // by (replacement.count - replaceRange.length).
            let delta = replacement.count - replaceRange.length
            for (cbStart, cbEnd) in codeBlockRegions {
                // Region entirely before replacement — unchanged
                if cbEnd <= rawReplaceStart {
                    let r = NSRange(location: cbStart, length: cbEnd - cbStart)
                    if r.location + r.length <= mutableAttr.length {
                        mutableAttr.addAttribute(CodeBlockAttributeKey, value: true, range: r)
                        // Ensure monospace font on code block region
                        mutableAttr.enumerateAttribute(.font, in: r, options: []) { val, fontRange, _ in
                            if let font = val as? UIFont, !font.fontDescriptor.symbolicTraits.contains(.traitMonoSpace) {
                                mutableAttr.addAttribute(.font, value: UIFont.monospacedSystemFont(ofSize: font.pointSize, weight: .regular), range: fontRange)
                            }
                        }
                    }
                }
                // Region entirely after replacement — shifted by delta
                else if cbStart >= rawReplaceEnd {
                    let newStart = cbStart + delta
                    let newEnd = cbEnd + delta
                    let r = NSRange(location: newStart, length: newEnd - newStart)
                    if r.location >= 0 && r.location + r.length <= mutableAttr.length {
                        mutableAttr.addAttribute(CodeBlockAttributeKey, value: true, range: r)
                        mutableAttr.enumerateAttribute(.font, in: r, options: []) { val, fontRange, _ in
                            if let font = val as? UIFont, !font.fontDescriptor.symbolicTraits.contains(.traitMonoSpace) {
                                mutableAttr.addAttribute(.font, value: UIFont.monospacedSystemFont(ofSize: font.pointSize, weight: .regular), range: fontRange)
                            }
                        }
                    }
                }
                // Region partially overlaps replacement — restore the non-overlapping part
                else {
                    if cbStart < rawReplaceStart {
                        let r = NSRange(location: cbStart, length: rawReplaceStart - cbStart)
                        if r.location + r.length <= mutableAttr.length {
                            mutableAttr.addAttribute(CodeBlockAttributeKey, value: true, range: r)
                        }
                    }
                    if cbEnd > rawReplaceEnd {
                        let newStart = rawReplaceStart + replacement.count
                        let newEnd = cbEnd + delta
                        if newStart < newEnd && newEnd <= mutableAttr.length {
                            let r = NSRange(location: newStart, length: newEnd - newStart)
                            mutableAttr.addAttribute(CodeBlockAttributeKey, value: true, range: r)
                        }
                    }
                }
            }

            textView.attributedText = mutableAttr
            // Force redraw so code block containers render after attributedText swap
            textView.setNeedsDisplay()

            let newPosition = min(rawReplaceStart + replacement.count, mutableAttr.length)
            textView.selectedRange = NSRange(location: newPosition, length: 0)
        } else {
            textView.text = text
        }

        placeholderLabel.isHidden = !text.isEmpty
        isInternalChange = false
        updateContentSize()
        if force {
            sendContentChange()
        }
    }

    func setSelectionRange(start: Int, end: Int) {
        // Map clean coordinates (no \u{200B}) to raw text positions,
        // matching Android's setSelectionRange ZWS mapping.
        let rawText = textView.text ?? ""
        var cleanToRaw: [Int] = []
        for (rawIdx, ch) in rawText.enumerated() {
            if ch != "\u{200B}" {
                cleanToRaw.append(rawIdx)
            }
        }
        cleanToRaw.append(rawText.count) // sentinel

        let rawStart = (start >= 0 && start < cleanToRaw.count) ? cleanToRaw[start] : rawText.count
        let rawEnd = (end >= 0 && end < cleanToRaw.count) ? cleanToRaw[end] : rawText.count
        let clampedStart = max(0, min(rawStart, rawText.count))
        let clampedEnd = max(clampedStart, min(rawEnd, rawText.count))

        if let startPos = textView.position(from: textView.beginningOfDocument, offset: clampedStart),
           let endPos = textView.position(from: textView.beginningOfDocument, offset: clampedEnd) {
            textView.selectedTextRange = textView.textRange(from: startPos, to: endPos)
        }
    }

    func setMentionRanges(_ ranges: [[String: Int]]) {
        // Apply mention styling to the specified ranges
        guard let text = textView.text, !text.isEmpty else { return }
        let mutableAttr = NSMutableAttributedString(attributedString: textView.attributedText)
        let fullRange = NSRange(location: 0, length: mutableAttr.length)

        // Clear old mention styling (bold, foreground, background) using MentionMarkerKey
        mutableAttr.enumerateAttribute(MentionMarkerKey, in: fullRange, options: []) { value, range, _ in
            guard value != nil else { return }
            mutableAttr.removeAttribute(MentionMarkerKey, range: range)
            mutableAttr.removeAttribute(.backgroundColor, range: range)
            // Restore default foreground color and un-bold the font
            mutableAttr.addAttribute(.foregroundColor, value: UIColor.label, range: range)
            mutableAttr.enumerateAttribute(.font, in: range, options: []) { fontVal, fontRange, _ in
                if let font = fontVal as? UIFont, font.fontDescriptor.symbolicTraits.contains(.traitBold) {
                    let unboldDescriptor = font.fontDescriptor.withSymbolicTraits(font.fontDescriptor.symbolicTraits.subtracting(.traitBold)) ?? font.fontDescriptor
                    mutableAttr.addAttribute(.font, value: UIFont(descriptor: unboldDescriptor, size: font.pointSize), range: fontRange)
                }
            }
        }

        // Remove orphaned mention backgrounds that lost their MentionMarkerKey
        // (e.g. when toggleCodeBlock strips the marker). Preserve inline code
        // and code block backgrounds by checking color components.
        mutableAttr.enumerateAttribute(.backgroundColor, in: fullRange, options: []) { value, range, _ in
            if let bgColor = value as? UIColor {
                var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
                bgColor.getRed(&r, green: &g, blue: &b, alpha: &a)
                // Mention bg: rgba(104/255, 82/255, 214/255, 0.15) — low alpha purple
                let isMentionBg = abs(r - 104.0/255.0) < 0.05 && abs(g - 82.0/255.0) < 0.05 && abs(b - 214.0/255.0) < 0.05 && a < 0.3
                if isMentionBg {
                    mutableAttr.removeAttribute(.backgroundColor, range: range)
                }
            }
        }

        // Reset all foreground colors to default, then re-apply link and inline code colors
        mutableAttr.removeAttribute(.foregroundColor, range: fullRange)
        mutableAttr.addAttribute(.foregroundColor, value: UIColor.label, range: fullRange)

        // Re-apply invisible foreground to blockquote ▎ characters (U+258E)
        // so the custom-drawn grey bar in draw(_ rect:) is the only visible bar.
        let mentionStr = mutableAttr.string as NSString
        for i in 0..<mentionStr.length {
            if mentionStr.character(at: i) == 0x258E {
                mutableAttr.addAttribute(.foregroundColor, value: UIColor.clear, range: NSRange(location: i, length: 1))
            }
        }

        // Re-apply link foreground color (systemBlue) to ranges with LinkURLAttributeKey
        // so that links remain visually blue after the blanket reset above.
        mutableAttr.enumerateAttribute(LinkURLAttributeKey, in: fullRange, options: []) { value, range, _ in
            if value != nil {
                mutableAttr.addAttribute(.foregroundColor, value: UIColor.systemBlue, range: range)
            }
        }

        // Re-apply inline code text color to ranges with inline code background
        mutableAttr.enumerateAttribute(.backgroundColor, in: fullRange, options: []) { value, range, _ in
            if let bgColor = value as? UIColor, bgColor == inlineCodeBgColor {
                mutableAttr.addAttribute(.foregroundColor, value: inlineCodeTextColor, range: range)
            }
        }
        
        // Build clean-to-raw index mapping (JS sends ranges in clean coordinates
        // with ZWS stripped, matching Android's setMentionRanges approach).
        let rawText = mutableAttr.string
        var cleanToRaw: [Int] = []
        for (rawIdx, ch) in rawText.enumerated() {
            if ch != "​" {
                cleanToRaw.append(rawIdx)
            }
        }
        cleanToRaw.append(rawText.count) // sentinel for end-of-string

        // Apply mention styling to each range (matches Android: bold + purple + light purple bg)
        let mentionColor = UIColor(red: 104/255, green: 82/255, blue: 214/255, alpha: 1.0)
        let mentionBgColor = UIColor(red: 104/255, green: 82/255, blue: 214/255, alpha: 0.15)
        for range in ranges {
            if let cleanStart = range["start"], let cleanEnd = range["end"] {
                // Map clean coordinates to raw coordinates
                guard cleanStart >= 0, cleanEnd > cleanStart,
                      cleanStart < cleanToRaw.count, cleanEnd < cleanToRaw.count else { continue }
                let rawStart = cleanToRaw[cleanStart]
                let rawEnd = cleanToRaw[cleanEnd]
                let nsRange = NSRange(location: rawStart, length: rawEnd - rawStart)
                if nsRange.location + nsRange.length <= mutableAttr.length {
                    // Skip mention styling inside code blocks — plain monospace only (matches Android Req 19.1)
                    var insideCodeBlock = false
                    mutableAttr.enumerateAttribute(CodeBlockAttributeKey, in: nsRange, options: []) { value, _, stop in
                        if value != nil { insideCodeBlock = true; stop.pointee = true }
                    }
                    if insideCodeBlock { continue }
                    mutableAttr.addAttribute(MentionMarkerKey, value: true, range: nsRange)
                    mutableAttr.addAttribute(.foregroundColor, value: mentionColor, range: nsRange)
                    mutableAttr.addAttribute(.backgroundColor, value: mentionBgColor, range: nsRange)
                    // Apply bold by adding bold trait to existing font
                    mutableAttr.enumerateAttribute(.font, in: nsRange, options: []) { value, fontRange, _ in
                        if let font = value as? UIFont {
                            let boldDescriptor = font.fontDescriptor.withSymbolicTraits(.traitBold) ?? font.fontDescriptor
                            let boldFont = UIFont(descriptor: boldDescriptor, size: font.pointSize)
                            mutableAttr.addAttribute(.font, value: boldFont, range: fontRange)
                        }
                    }
                }
            }
        }
        
        isInternalChange = true
        let savedTypingAttrs = textView.typingAttributes
        textView.attributedText = mutableAttr
        textView.typingAttributes = savedTypingAttrs
        // If a deferred restore is pending (from autoContinueListOnEnter),
        // use those attrs instead — they carry the user's active formatting.
        if let deferred = deferredTypingAttrs {
            textView.typingAttributes = deferred
        }

        // Strip mention-specific attributes from typingAttributes so newly typed
        // text after a deleted mention doesn't inherit bold/purple/background.
        // Use component comparison (not UIColor ==) to avoid color space mismatch.
        var cleanAttrs = textView.typingAttributes
        // Check if cursor is actually adjacent to a mention marker
        var cursorAdjacentToMention = false
        let cursorPos = textView.selectedRange.location
        if cursorPos > 0, cursorPos <= mutableAttr.length {
            let checkIdx = min(cursorPos - 1, mutableAttr.length - 1)
            if mutableAttr.attribute(MentionMarkerKey, at: checkIdx, effectiveRange: nil) != nil {
                cursorAdjacentToMention = true
            }
        }
        // Remove ANY backgroundColor that isn't inline code or code block
        if let bg = cleanAttrs[.backgroundColor] as? UIColor {
            var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
            bg.getRed(&r, green: &g, blue: &b, alpha: &a)
            let isInlineCodeBg = abs(r - 245.0/255.0) < 0.02 && abs(g - 245.0/255.0) < 0.02 && abs(b - 245.0/255.0) < 0.02 && a > 0.9
            let isCodeBlockBg = abs(r - 250.0/255.0) < 0.02 && abs(g - 250.0/255.0) < 0.02 && abs(b - 250.0/255.0) < 0.02 && a > 0.9
            if !isInlineCodeBg && !isCodeBlockBg {
                cleanAttrs.removeValue(forKey: .backgroundColor)
            }
        }
        // Remove mention foreground color — use component comparison
        if let fg = cleanAttrs[.foregroundColor] as? UIColor {
            var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
            fg.getRed(&r, green: &g, blue: &b, alpha: &a)
            if abs(r - 104.0/255.0) < 0.05 && abs(g - 82.0/255.0) < 0.05 && abs(b - 214.0/255.0) < 0.05 && a > 0.9 {
                cleanAttrs[.foregroundColor] = UIColor.label
            }
        }
        // Only strip bold when cursor is adjacent to an actual mention.
        // Otherwise bold is legitimate user formatting and must be preserved.
        if cursorAdjacentToMention,
           let font = cleanAttrs[.font] as? UIFont,
           font.fontDescriptor.symbolicTraits.contains(.traitBold),
           !pendingStyles.contains("bold") {
            let unbold = font.fontDescriptor.withSymbolicTraits(font.fontDescriptor.symbolicTraits.subtracting(.traitBold)) ?? font.fontDescriptor
            cleanAttrs[.font] = UIFont(descriptor: unbold, size: font.pointSize)
        }
        // Remove mention marker key from typing attributes
        cleanAttrs.removeValue(forKey: MentionMarkerKey)
        textView.typingAttributes = cleanAttrs

        isInternalChange = false

        // Trigger redraw so code block containers render correctly after
        // attributedText replacement (draw(_ rect:) uses CodeBlockAttributeKey).
        textView.setNeedsDisplay()

        // Recalculate height — mention styling (bold font) can cause text to
        // wrap differently, requiring the composer to expand or contract.
        updateContentSize()
    }

    // MARK: - URL Helpers (matches Android isURL / URL normalization)

    func isURL(_ string: String) -> Bool {
        let trimmed = string.trimmingCharacters(in: .whitespaces)
        if trimmed.isEmpty || trimmed.contains(" ") { return false }
        if let comps = URLComponents(string: trimmed), comps.scheme != nil, comps.host != nil {
            return true
        }
        if trimmed.contains(".") {
            if let comps = URLComponents(string: "https://\(trimmed)"), comps.host != nil {
                return true
            }
        }
        return false
    }

    private func normalizeURL(_ url: String) -> String {
        let trimmed = url.trimmingCharacters(in: .whitespaces)
        let lowered = trimmed.lowercased()
        if lowered.hasPrefix("http://") || lowered.hasPrefix("https://") || lowered.hasPrefix("mailto:") || lowered.hasPrefix("tel:") {
            return trimmed
        }
        return "https://\(trimmed)"
    }

    /// Detects inline markdown shortcuts (e.g., `text`, *bold*, **bold**, ~~strike~~, <u>underline</u>, _italic_)
    /// ending at the cursor position and converts them to live rich text formatting.
    /// Called from textDidChange(), matches Android detectMarkdownShortcut().
    private func detectInlineMarkdownShortcuts() {
        let text = textView.text ?? ""
        let cursorPos = textView.selectedRange.location
        guard cursorPos > 0, cursorPos <= text.count else { return }

        let nsText = text as NSString

        // Pre-check: detect if there is an unmatched opening ``` in the text
        // before the cursor. If so, suppress single-backtick inline code matching
        // entirely — the user is in the middle of typing a triple-backtick code
        // block and we must wait for the closing ``` to complete.
        let textBeforeCursor = nsText.substring(to: cursorPos)
        let hasUnmatchedTripleBacktick: Bool = {
            var count = 0
            var i = textBeforeCursor.startIndex
            while i < textBeforeCursor.endIndex {
                if textBeforeCursor[i] == "`" {
                    let remaining = textBeforeCursor.distance(from: i, to: textBeforeCursor.endIndex)
                    if remaining >= 3 {
                        let next1 = textBeforeCursor.index(after: i)
                        let next2 = textBeforeCursor.index(after: next1)
                        if textBeforeCursor[next1] == "`" && textBeforeCursor[next2] == "`" {
                            count += 1
                            i = textBeforeCursor.index(after: next2)
                            continue
                        }
                    }
                }
                i = textBeforeCursor.index(after: i)
            }
            // Odd count means there's an unmatched opening ```
            return count % 2 != 0
        }()

        // Patterns ordered longest-delimiter-first so multi-char delimiters
        // are checked before single-char ones to avoid false matches.
        // (open, close, styles)
        let patterns: [(String, String, [String])] = [
            ("***", "***", ["bold", "italic"]),
            ("```", "```", ["codeBlock"]),
            ("**", "**", ["bold"]),
            ("~~", "~~", ["strikethrough"]),
            ("<u>", "</u>", ["underline"]),
            ("*", "*", ["bold"]),
            ("~", "~", ["strikethrough"]),
            ("`", "`", ["code"]),
            ("_", "_", ["italic"]),
        ]

        for (open, close, styles) in patterns {
            let closeLen = close.count
            let openLen = open.count

            // Skip single-backtick inline code when an unmatched ``` exists —
            // the user is typing a triple-backtick code block.
            if open == "`" && close == "`" && hasUnmatchedTripleBacktick { continue }

            // Text must end with the closing delimiter at cursor position
            guard cursorPos >= closeLen else { continue }
            let closeStart = cursorPos - closeLen
            let closeStr = nsText.substring(with: NSRange(location: closeStart, length: closeLen))
            guard closeStr == close else { continue }

            // Skip single backtick when line ends with triple backticks
            if open == "`" && cursorPos >= 3 {
                let last3 = nsText.substring(with: NSRange(location: cursorPos - 3, length: 3))
                if last3 == "```" { continue }
            }

            // For backtick-based patterns, enforce exact delimiter boundaries:
            // the closing delimiter must not be immediately preceded by an extra
            // backtick (beyond the delimiter itself), which would mean the user
            // typed more backticks than the pattern expects (e.g., ```` instead of ```).
            if (open == "`" || open == "```") && closeStart > 0 {
                let charBeforeClose = nsText.character(at: closeStart - 1)
                if charBeforeClose == 0x60 { continue } // 0x60 = '`'
            }

            // Search backwards for the opening delimiter
            guard closeStart > openLen - 1 else { continue }

            var found = false
            var searchPos = closeStart - 1
            while searchPos >= openLen - 1 {
                let candidateStart = searchPos - (openLen - 1)
                let candidateStr = nsText.substring(with: NSRange(location: candidateStart, length: openLen))
                if candidateStr == open {
                    let contentStart = candidateStart + openLen
                    let contentLength = closeStart - contentStart
                    if contentLength > 0 {
                        let content = nsText.substring(with: NSRange(location: contentStart, length: contentLength))
                        // Content must not be only whitespace
                        guard !content.trimmingCharacters(in: .whitespaces).isEmpty else { break }
                        // For backtick, skip if content is only backticks
                        if open == "`" && content.allSatisfy({ $0 == "`" }) { break }
                        // For backtick-based patterns, enforce exact opening delimiter:
                        // skip if the character before the opening delimiter is also a
                        // backtick (e.g., ```` instead of ``` or `` instead of `).
                        if (open == "`" || open == "```") && candidateStart > 0 {
                            let charBeforeOpen = nsText.character(at: candidateStart - 1)
                            if charBeforeOpen == 0x60 { break } // 0x60 = '`'
                        }
                        // For single backtick, skip if the opening backtick is part of a
                        // triple-backtick sequence (e.g., ```asdfasdf` should not match)
                        if open == "`" && candidateStart >= 2 {
                            let preceding2 = nsText.substring(with: NSRange(location: candidateStart - 2, length: 2))
                            if preceding2 == "``" { break }
                        }

                        // Found valid match — replace delimiters with formatted text
                        let mutableAttr = NSMutableAttributedString(attributedString: textView.attributedText)

                        // Delete closing delimiter
                        mutableAttr.deleteCharacters(in: NSRange(location: closeStart, length: closeLen))
                        // Delete opening delimiter
                        mutableAttr.deleteCharacters(in: NSRange(location: candidateStart, length: openLen))

                        // Content is now at candidateStart with length contentLength
                        let fmtStart = candidateStart
                        let fmtEnd = candidateStart + contentLength
                        let fmtRange = NSRange(location: fmtStart, length: contentLength)

                        // Apply formatting
                        for style in styles {
                            switch style {
                            case "bold":
                                mutableAttr.enumerateAttribute(.font, in: fmtRange, options: []) { value, attrRange, _ in
                                    let currentFont = (value as? UIFont) ?? UIFont.systemFont(ofSize: 16)
                                    var traits = currentFont.fontDescriptor.symbolicTraits
                                    traits.insert(.traitBold)
                                    if let descriptor = currentFont.fontDescriptor.withSymbolicTraits(traits) {
                                        mutableAttr.addAttribute(.font, value: UIFont(descriptor: descriptor, size: currentFont.pointSize), range: attrRange)
                                    }
                                }
                            case "italic":
                                mutableAttr.enumerateAttribute(.font, in: fmtRange, options: []) { value, attrRange, _ in
                                    let currentFont = (value as? UIFont) ?? UIFont.systemFont(ofSize: 16)
                                    var traits = currentFont.fontDescriptor.symbolicTraits
                                    traits.insert(.traitItalic)
                                    if let descriptor = currentFont.fontDescriptor.withSymbolicTraits(traits) {
                                        mutableAttr.addAttribute(.font, value: UIFont(descriptor: descriptor, size: currentFont.pointSize), range: attrRange)
                                    }
                                }
                            case "underline":
                                mutableAttr.addAttribute(.underlineStyle, value: NSUnderlineStyle.single.rawValue, range: fmtRange)
                            case "strikethrough":
                                mutableAttr.addAttribute(.strikethroughStyle, value: NSUnderlineStyle.single.rawValue, range: fmtRange)
                            case "code":
                                let monoFont = UIFont.monospacedSystemFont(ofSize: 15, weight: .regular)
                                mutableAttr.addAttribute(.font, value: monoFont, range: fmtRange)
                                mutableAttr.addAttribute(.foregroundColor, value: inlineCodeTextColor, range: fmtRange)
                                mutableAttr.addAttribute(.backgroundColor, value: inlineCodeBgColor, range: fmtRange)
                            case "codeBlock":
                                let monoFont = UIFont.monospacedSystemFont(ofSize: 16, weight: .regular)
                                mutableAttr.addAttribute(.font, value: monoFont, range: fmtRange)
                                mutableAttr.addAttribute(.foregroundColor, value: UIColor.label, range: fmtRange)
                                mutableAttr.removeAttribute(.backgroundColor, range: fmtRange)
                                mutableAttr.removeAttribute(.underlineStyle, range: fmtRange)
                                mutableAttr.removeAttribute(.strikethroughStyle, range: fmtRange)
                                mutableAttr.addAttribute(CodeBlockAttributeKey, value: true, range: fmtRange)
                            default:
                                break
                            }
                        }

                        isInternalChange = true
                        textView.attributedText = mutableAttr
                        textView.selectedRange = NSRange(location: fmtEnd, length: 0)
                        isInternalChange = false

                        // For code block shortcut, preserve pending style so typing continues in code block
                        if styles.contains("codeBlock") {
                            pendingStyles.removeAll()
                            pendingStyles.insert("codeBlock")
                            pendingStylesInsertPos = fmtEnd
                            // Set typing attributes for code block continuation
                            let cbParaStyle = NSMutableParagraphStyle()
                            cbParaStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
                            textView.typingAttributes = [
                                .font: UIFont.monospacedSystemFont(ofSize: 16, weight: .regular),
                                .foregroundColor: UIColor.label,
                                .paragraphStyle: cbParaStyle,
                                CodeBlockAttributeKey: true
                            ]
                        } else {
                            // Clear pending styles so subsequent typing is unstyled
                            pendingStyles.removeAll()
                            pendingStylesInsertPos = -1
                        }
                        explicitlyOffStyles.removeAll()

                        placeholderLabel.isHidden = !textView.text.isEmpty
                        textView.setNeedsDisplay()
                        saveToUndoStack()
                        sendContentChange()
                        emitActiveStyles()
                        found = true
                    }
                    break // Found the opening delimiter position
                }
                searchPos -= 1
            }
            if found { return }
        }
    }

    /// Returns true if the string contains markdown syntax that should be parsed into rich text.
    /// Matches Android looksLikeMarkdown().
    func looksLikeMarkdown(_ str: String) -> Bool {
        if str.contains("[") && str.contains("](") { return true }
        if str.contains("**") { return true }
        if str.contains("~~") { return true }
        if str.contains("<u>") { return true }
        if str.filter({ $0 == "`" }).count >= 2 { return true }
        if str.range(of: "(?<![_\\w])_(?!_)(.+?)(?<!_)_(?![_\\w])", options: .regularExpression) != nil { return true }
        return false
    }

    /// Parses a markdown string into an NSAttributedString with proper styling.
    /// Handles: **bold**, *bold*, _italic_, <u>underline</u>, ~~strikethrough~~, ~strike~,
    /// `code`, and [text](url) links. Matches Android markdownToSpannable().
    func markdownToAttributedString(_ markdown: String) -> NSAttributedString {
        let result = NSMutableAttributedString()
        let chars = Array(markdown)
        let len = chars.count
        var i = 0
        var currentText = ""

        var isBold = false
        var isItalic = false
        var isUnderline = false
        var isStrikethrough = false
        var isCode = false

        let defaultFont = UIFont.systemFont(ofSize: 16)
        let monoFont = UIFont.monospacedSystemFont(ofSize: 15, weight: .regular)
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple

        func flush() {
            guard !currentText.isEmpty else { return }
            var attrs: [NSAttributedString.Key: Any] = [
                .paragraphStyle: paragraphStyle
            ]

            if isCode {
                attrs[.font] = monoFont
                attrs[.foregroundColor] = inlineCodeTextColor
                attrs[.backgroundColor] = inlineCodeBgColor
            } else {
                var font = defaultFont
                var traits = font.fontDescriptor.symbolicTraits
                if isBold { traits.insert(.traitBold) }
                if isItalic { traits.insert(.traitItalic) }
                if let descriptor = font.fontDescriptor.withSymbolicTraits(traits) {
                    font = UIFont(descriptor: descriptor, size: font.pointSize)
                }
                attrs[.font] = font
                attrs[.foregroundColor] = UIColor.label
                if isUnderline {
                    attrs[.underlineStyle] = NSUnderlineStyle.single.rawValue
                }
                if isStrikethrough {
                    attrs[.strikethroughStyle] = NSUnderlineStyle.single.rawValue
                }
            }

            result.append(NSAttributedString(string: currentText, attributes: attrs))
            currentText = ""
        }

        while i < len {
            if chars[i] == "[" {
                if let (linkText, linkURL, fullEnd) = parseLinkAt(chars, from: i) {
                    flush()
                    let normalizedURL = normalizeURL(linkURL)
                    var linkAttrs: [NSAttributedString.Key: Any] = [
                        .font: defaultFont,
                        .foregroundColor: UIColor.systemBlue,
                        .paragraphStyle: paragraphStyle,
                        LinkURLAttributeKey: normalizedURL
                    ]
                    if isBold {
                        var traits = defaultFont.fontDescriptor.symbolicTraits
                        traits.insert(.traitBold)
                        if let desc = defaultFont.fontDescriptor.withSymbolicTraits(traits) {
                            linkAttrs[.font] = UIFont(descriptor: desc, size: defaultFont.pointSize)
                        }
                    }
                    result.append(NSAttributedString(string: linkText, attributes: linkAttrs))
                    i = fullEnd
                    continue
                }
            }

            if i + 1 < len && chars[i] == "*" && chars[i + 1] == "*" {
                flush(); isBold = !isBold; i += 2; continue
            }
            if i + 1 < len && chars[i] == "~" && chars[i + 1] == "~" {
                flush(); isStrikethrough = !isStrikethrough; i += 2; continue
            }
            // Handle <u> and </u> HTML tags for underline
            if i + 2 < len && chars[i] == "<" && chars[i + 1] == "u" && chars[i + 2] == ">" {
                flush(); isUnderline = true; i += 3; continue
            }
            if i + 3 < len && chars[i] == "<" && chars[i + 1] == "/" && chars[i + 2] == "u" && chars[i + 3] == ">" {
                flush(); isUnderline = false; i += 4; continue
            }
            // Triple-backtick code block fence: ```content``` or ```\ncontent\n```
            if i + 2 < len && chars[i] == "`" && chars[i + 1] == "`" && chars[i + 2] == "`" {
                flush()
                i += 3
                // Find closing ```
                var codeContent = ""
                var foundClose = false
                while i < len {
                    if i + 2 < len && chars[i] == "`" && chars[i + 1] == "`" && chars[i + 2] == "`" {
                        i += 3
                        foundClose = true
                        break
                    }
                    codeContent.append(chars[i])
                    i += 1
                }
                // Determine if this is a true fenced block (contains newlines) or inline usage
                let isFencedBlock = codeContent.contains("\n") || codeContent.contains("\r")
                let trimmedCode = codeContent.trimmingCharacters(in: CharacterSet.newlines)
                if !trimmedCode.isEmpty {
                    let codeBlockParaStyle = NSMutableParagraphStyle()
                    codeBlockParaStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
                    let codeAttrs: [NSAttributedString.Key: Any] = [
                        .font: UIFont.monospacedSystemFont(ofSize: 16, weight: .regular),
                        .foregroundColor: UIColor.label,
                        .paragraphStyle: codeBlockParaStyle,
                        CodeBlockAttributeKey: true
                    ]
                    result.append(NSAttributedString(string: trimmedCode, attributes: codeAttrs))
                }
                // Only add newline separator for true fenced blocks (multi-line content),
                // not for inline triple-backtick usage like text```code```text
                if isFencedBlock && foundClose && i < len {
                    result.append(NSAttributedString(string: "\n", attributes: [
                        .font: defaultFont,
                        .foregroundColor: UIColor.label,
                        .paragraphStyle: paragraphStyle
                    ]))
                }
                continue
            }
            if chars[i] == "`" {
                flush(); isCode = !isCode; i += 1; continue
            }
            if chars[i] == "_" {
                flush(); isItalic = !isItalic; i += 1; continue
            }

            currentText.append(chars[i])
            i += 1
        }

        flush()
        return result
    }

    /// Parses a markdown link [text](url) starting at position `from`.
    private func parseLinkAt(_ chars: [Character], from: Int) -> (String, String, Int)? {
        guard chars[from] == "[" else { return nil }
        var j = from + 1
        while j < chars.count && chars[j] != "]" { j += 1 }
        guard j < chars.count else { return nil }
        guard j + 1 < chars.count && chars[j + 1] == "(" else { return nil }
        let urlStart = j + 2
        var k = urlStart
        while k < chars.count && chars[k] != ")" { k += 1 }
        guard k < chars.count else { return nil }
        let linkText = String(chars[(from + 1)..<j])
        let linkURL = String(chars[urlStart..<k])
        return (linkText, linkURL, k + 1)
    }

    /// Inserts styled paste content at the given selection range, replacing any selected text.
    func insertStyledPasteContent(_ styledText: NSAttributedString, at range: NSRange) {
        let mutableAttr = NSMutableAttributedString(attributedString: textView.attributedText)
        if range.length > 0 {
            mutableAttr.replaceCharacters(in: range, with: styledText)
        } else {
            mutableAttr.insert(styledText, at: range.location)
        }
        isInternalChange = true
        textView.attributedText = mutableAttr
        textView.selectedRange = NSRange(location: range.location + styledText.length, length: 0)
        isInternalChange = false
        placeholderLabel.isHidden = !textView.text.isEmpty
        saveToUndoStack()
        sendContentChange()
        emitActiveStyles()
    }

    /// Detects "> " markdown shortcut at the start of a line and converts to blockquote.
    /// Called from textDidChange(), matches Android detectBlockMarkdownShortcut() for "> ".
    private func detectBlockquoteShortcut() {
        let text = textView.text ?? ""
        let cursorPos = textView.selectedRange.location
        guard cursorPos >= 2 else { return }

        // Code block guard: don't convert "> " to blockquote inside code blocks (matches Android)
        if pendingStyles.contains("codeBlock") { return }
        if let attrText = textView.attributedText, cursorPos > 0 {
            let checkPos = min(cursorPos - 1, attrText.length - 1)
            if checkPos >= 0 {
                let val = attrText.attribute(CodeBlockAttributeKey, at: checkPos, effectiveRange: nil)
                if val != nil { return }
            }
        }

        let nsText = text as NSString

        // Find start of current line
        var lineStart = cursorPos
        while lineStart > 0 && nsText.character(at: lineStart - 1) != 10 { // '\n'
            lineStart -= 1
        }

        let lineText = nsText.substring(with: NSRange(location: lineStart, length: cursorPos - lineStart))
        guard lineText == "> " else { return }

        // Delete the "> " text and apply blockquote via setQuote()
        let mutableAttr = NSMutableAttributedString(attributedString: textView.attributedText)
        mutableAttr.deleteCharacters(in: NSRange(location: lineStart, length: 2))
        isInternalChange = true
        textView.attributedText = mutableAttr
        textView.selectedRange = NSRange(location: lineStart, length: 0)
        isInternalChange = false
        placeholderLabel.isHidden = !textView.text.isEmpty
        setQuote()
    }

    /// Detects [text](url) markdown pattern and converts to styled hyperlink.
    private func detectLinkShortcut() {
        let text = textView.text ?? ""
        let cursorPos = textView.selectedRange.location
        guard cursorPos >= 1, cursorPos <= text.count else { return }
        let nsText = text as NSString
        guard nsText.character(at: cursorPos - 1) == 41 else { return } // ')'

        var parenOpen = -1
        for i in stride(from: cursorPos - 2, through: 0, by: -1) {
            if nsText.character(at: i) == 40 { parenOpen = i; break } // '('
        }
        guard parenOpen >= 1 else { return }
        guard nsText.character(at: parenOpen - 1) == 93 else { return } // ']'
        var bracketOpen = -1
        for i in stride(from: parenOpen - 2, through: 0, by: -1) {
            if nsText.character(at: i) == 91 { bracketOpen = i; break } // '['
        }
        guard bracketOpen >= 0 else { return }

        let linkText = nsText.substring(with: NSRange(location: bracketOpen + 1, length: parenOpen - 1 - bracketOpen - 1))
        let url = nsText.substring(with: NSRange(location: parenOpen + 1, length: cursorPos - 1 - parenOpen - 1))
        guard !linkText.isEmpty, !url.isEmpty else { return }

        let normalizedUrl = normalizeURL(url)
        let patternRange = NSRange(location: bracketOpen, length: cursorPos - bracketOpen)
        let mutableAttr = NSMutableAttributedString(attributedString: textView.attributedText)
        let linkAttrString = NSAttributedString(string: linkText, attributes: [
            LinkURLAttributeKey: normalizedUrl,
            .font: UIFont.systemFont(ofSize: 16),
            .foregroundColor: UIColor.systemBlue
        ])

        isInternalChange = true
        mutableAttr.replaceCharacters(in: patternRange, with: linkAttrString)
        textView.attributedText = mutableAttr
        textView.selectedRange = NSRange(location: bracketOpen + linkText.count, length: 0)

        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.alignment = .left
        paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
        textView.typingAttributes = [
            .font: UIFont.systemFont(ofSize: 16),
            .foregroundColor: UIColor.label,
            .paragraphStyle: paragraphStyle
        ]
        isInternalChange = false
        saveToUndoStack()
        sendContentChange()
    }

    /// Creates a styled hyperlink from a pasted URL over selected text.
    func insertLinkOverSelection(url: String, displayText: String, range: NSRange) {
        let normalizedUrl = normalizeURL(url)
        let mutableAttr = NSMutableAttributedString(attributedString: textView.attributedText)
        let linkAttrString = NSAttributedString(string: displayText, attributes: [
            LinkURLAttributeKey: normalizedUrl,
            .font: UIFont.systemFont(ofSize: 16),
            .foregroundColor: UIColor.systemBlue
        ])
        mutableAttr.replaceCharacters(in: range, with: linkAttrString)

        isInternalChange = true
        textView.attributedText = mutableAttr
        let newCursorPos = range.location + displayText.count
        textView.selectedRange = NSRange(location: newCursorPos, length: 0)

        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.alignment = .left
        paragraphStyle.lineHeightMultiple = RichTextEditorView.defaultLineHeightMultiple
        textView.typingAttributes = [
            .font: UIFont.systemFont(ofSize: 16),
            .foregroundColor: UIColor.label,
            .paragraphStyle: paragraphStyle
        ]
        placeholderLabel.isHidden = !textView.text.isEmpty
        isInternalChange = false
        saveToUndoStack()
        sendContentChange()
    }

    func removeLink(location: Int, length: Int) {
        let range = NSRange(location: location, length: length)
        guard range.location + range.length <= textView.attributedText.length else { return }
        
        let mutableAttr = NSMutableAttributedString(attributedString: textView.attributedText)
        mutableAttr.removeAttribute(LinkURLAttributeKey, range: range)
        mutableAttr.addAttribute(.foregroundColor, value: UIColor.label, range: range)
        
        isInternalChange = true
        textView.attributedText = mutableAttr
        isInternalChange = false
        saveToUndoStack()
        sendContentChange()
    }

    func updateLink(location: Int, length: Int, newUrl: String, newText: String) {
        let normalizedUrl = normalizeURL(newUrl)
        let range = NSRange(location: location, length: length)
        guard range.location + range.length <= textView.attributedText.length else { return }
        
        let mutableAttr = NSMutableAttributedString(attributedString: textView.attributedText)
        
        // Replace the text at the range with new text
        let replacement = NSMutableAttributedString(string: newText)
        
        // Copy attributes from the original range
        if range.length > 0 {
            let originalAttrs = mutableAttr.attributes(at: range.location, effectiveRange: nil)
            replacement.addAttributes(originalAttrs, range: NSRange(location: 0, length: newText.count))
        }
        
        // Update the link URL with normalized URL
        replacement.addAttribute(LinkURLAttributeKey, value: normalizedUrl, range: NSRange(location: 0, length: newText.count))
        replacement.addAttribute(.foregroundColor, value: UIColor.systemBlue, range: NSRange(location: 0, length: newText.count))
        
        mutableAttr.replaceCharacters(in: range, with: replacement)
        
        isInternalChange = true
        textView.attributedText = mutableAttr
        isInternalChange = false
        saveToUndoStack()
        sendContentChange()
    }
}
