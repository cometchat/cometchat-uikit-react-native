package com.reactnativecometchatuikit

import android.content.ClipboardManager
import android.content.ClipData
import android.content.ContentResolver
import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import android.webkit.MimeTypeMap
import androidx.core.view.ContentInfoCompat
import androidx.core.view.OnReceiveContentListener
import androidx.core.view.ViewCompat
import java.io.File
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.text.Editable
import android.text.Html
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.TextWatcher
import android.text.Layout
import android.text.method.ScrollingMovementMethod
import android.text.style.*
import android.view.GestureDetector
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.PopupWindow
import android.widget.FrameLayout
import android.content.res.Configuration
import android.app.AlertDialog
import android.widget.EditText
import android.widget.LinearLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class CodeBlockBorderSpan(initDensity: Float = 1f) : LineBackgroundSpan {
    companion object {
        const val CORNER_RADIUS = 6f  // 6dp — structured editor feel, not bubble-like
        const val PADDING = 12f  // 12dp per Figma padding_3
        const val VERTICAL_PADDING = 10f  // 10dp vertical breathing room above/below text
        const val CODE_BLOCK_FONT_SIZE = 16  // sp — matches default text size for consistent cursor height

        // Per Figma: light #FAFAFA bg, #E8E8E8 border; dark subtle white overlay
        fun borderColor(isDark: Boolean): Int =
            if (isDark) Color.parseColor("#33FFFFFF") else Color.parseColor("#E8E8E8")

        fun bgColor(isDark: Boolean): Int =
            if (isDark) Color.parseColor("#1AFFFFFF") else Color.parseColor("#FAFAFA")

        fun inlineCodeBg(isDark: Boolean): Int =
            if (isDark) Color.parseColor("#33FFFFFF") else Color.parseColor("#1A000000")

        // Pre-allocated Paint for container drawing (shared across all instances;
        // each drawBackground call configures it before use)
        val containerPaint = Paint().apply { isAntiAlias = true }
    }

    // Region-awareness flags — set by applyListIndentation().
    var isFirstLine = false
    var isLastLine = false
    // Density for dp→px conversion — initialized from constructor, updated by applyListIndentation()
    var density = initDensity
    // Dark mode flag, set by applyListIndentation()
    var isDark = false

    override fun drawBackground(
        canvas: Canvas, paint: Paint,
        left: Int, right: Int, top: Int, baseline: Int, bottom: Int,
        text: CharSequence, start: Int, end: Int, lineNumber: Int
    ) {
        // No-op: container drawing is handled centrally in RichTextEditorView.onDraw()
        // using a unified rect per code block region (matching iOS approach).
    }
}

/**
 * Marker span for inline code. Drawing is handled in RichTextEditorView.onDraw()
 * for tight-fitting bordered containers around glyph bounds (same pattern as CodeBlockBorderSpan).
 */
class InlineCodeSpan : CharacterStyle() {
    override fun updateDrawState(tp: android.text.TextPaint?) {
        // No-op: visual rendering is handled by custom onDraw() in RichTextEditorView
    }
}

/**
 * Marker span for mentions. Stores uid and displayName so that mention metadata
 * can be preserved across code block toggle cycles (Req 19.1, 19.2, 19.3).
 */
class MentionSpan(val uid: String, val displayName: String) : CharacterStyle() {
    override fun updateDrawState(tp: android.text.TextPaint?) {
        // No-op: mention styling is handled by the JS layer
    }
}

/**
 * Foreground colour applied by a consumer formatter via applyInlineStyle().
 *
 * Deliberately NOT a `ForegroundColorSpan` subclass. Two reasons:
 *  1. 17 sites in this file sweep `ForegroundColorSpan` indiscriminately (they own the
 *     inline-code purple, link blue, code-block grey, transparent quote prefix and mention
 *     purple). A subclass would be silently clobbered by every one of them; a sibling type
 *     is invisible to all of them by construction.
 *  2. `ForegroundColorSpan` is a `ParcelableSpan`; a subclass reports the *parent's* span
 *     type id, so clipboard / saved-instance-state round-trips would downgrade this marker
 *     into a plain colour span, indistinguishable from the editor's own colour plumbing.
 *
 * It actually paints, so it implements `UpdateAppearance` to make repaints correct.
 */
class ExternalForegroundColorSpan(val color: Int) : CharacterStyle(), UpdateAppearance {
    override fun updateDrawState(tp: android.text.TextPaint?) {
        tp?.color = color
    }
}

/**
 * Background colour applied by a consumer formatter. A sibling type for the same reasons as
 * [ExternalForegroundColorSpan] — 12 sites sweep `BackgroundColorSpan` indiscriminately (mention
 * background, highlight, inline code, code block). Setting `TextPaint.bgColor` is exactly how
 * `BackgroundColorSpan` itself renders, so this paints identically without being caught by them.
 */
class ExternalBackgroundColorSpan(val color: Int) : CharacterStyle(), UpdateAppearance {
    override fun updateDrawState(tp: android.text.TextPaint?) {
        tp?.bgColor = color
    }
}

/**
 * Custom URLSpan that suppresses the default underline drawn by ClickableSpan.
 * Links are visually distinguished by ForegroundColorSpan (blue) only, matching iOS parity.
 */
class NoUnderlineURLSpan(url: String) : URLSpan(url) {
    override fun updateDrawState(ds: android.text.TextPaint) {
        super.updateDrawState(ds)
        ds.isUnderlineText = false
    }
}

class RichTextEditorView(context: Context) : androidx.appcompat.widget.AppCompatEditText(context) {

    private var placeholder: String = ""
    private var maxHeightValue: Int = 0
    private var numberOfLinesValue: Int = 0
    private var showToolbar: Boolean = true
    private var variant: String = "outlined"
    private var density: Float = 1f
    private var isInternalChange = false
    private var lastUserEditTime: Long = 0L
    private var lastReportedHeight: Float = 0f
    private var calculatedHeight: Float = 0f
    private var minHeightPx: Float = 0f
    private var isInitialized = false

    private var previousText: String = ""
    private var pendingDelta: Map<String, Any>? = null
    private var pendingPrefixDeletion: Pair<Int, Int>? = null // (lineStart, prefixLength) for backspace-in-prefix
    // Saved selected text for URL-paste-over-selection detection in TextWatcher
    private var savedSelectedTextForPaste: String? = null

    /// When true, the ``` shortcut in detectBlockMarkdownShortcut is suppressed.
    /// Set after a code-block shortcut fires; cleared when the user types a
    /// non-backtick character or the text becomes empty. This prevents stale
    /// backtick spans/characters from re-triggering code block mode.
    private var suppressCodeBlockShortcut = false

    // For flat variant bottom border
    private val bottomBorderPaint = Paint().apply {
        color = Color.parseColor("#E0E0E0")
        strokeWidth = 1f
        style = Paint.Style.STROKE
    }
    private var drawBottomBorder = false

    // Pre-allocated paint for code block / inline code container drawing (avoids GC in onDraw)
    private val codeBlockPaint = Paint().apply { isAntiAlias = true }

    // Stored mention metadata for code block toggle round-trip (Req 19.1, 19.2, 19.3)
    data class StoredMention(
        val displayName: String,
        val uid: String,
        val originalRange: IntRange
    )
    private val storedMentionMetadata = mutableMapOf<String, StoredMention>()

    /// Produces a stable map key for an IntRange.
    private fun rangeKey(range: IntRange): String = "${range.first}_${range.last}"

    /// Formats a colour int as the lowercase `#rrggbb` string the JS wire format expects.
    /// Alpha is intentionally dropped — the wire contract is `#rrggbb` only.
    private fun hexOf(color: Int): String = String.format("#%06x", color and 0xFFFFFF)

    // Theme-derived colors for inline code container drawing (set via React props)
    var inlineCodeBackgroundColor: Int? = null
    var inlineCodeBorderColor: Int? = null
    var inlineCodeTextColor: Int? = null
    var inlineCodeFontSize: Float? = null

    // Undo/Redo stacks
    private val undoStack = mutableListOf<CharSequence>()
    private val redoStack = mutableListOf<CharSequence>()
    private var lastSavedText: CharSequence = ""

    private fun isDarkMode(): Boolean {
        val nightMode = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
        return nightMode == Configuration.UI_MODE_NIGHT_YES
    }
    private var toolbarPopup: PopupWindow? = null
    private var toolbarOptions: List<String>? = null

    // Pending styles for type-ahead formatting (Slack-style)
    private val pendingStyles = mutableSetOf<String>()
    private val explicitlyOffStyles = mutableSetOf<String>()  // Styles user explicitly turned off at cursor
    private var pendingStylesInsertPos = -1
    // Colour values for the "externalColor"/"externalBackgroundColor" pending styles. Kept beside
    // pendingStyles (rather than as independent fields) so they inherit its existing
    // caret-moved/cleared invalidation instead of needing a parallel copy of it.
    private var pendingExternalColor: Int? = null
    private var pendingExternalBackgroundColor: Int? = null

    // Store selection for toolbar actions (selection might be lost when clicking toolbar)
    private var savedSelectionStart: Int = 0
    private var savedSelectionEnd: Int = 0

    // Pre-compiled regex for numbered list prefix detection in applyListIndentation (ENG-31433)
    private val numberedPrefixRegex = Regex("^(\\d+)\\.\\s")
    private val quoteNumberedPrefixRegex = Regex("^▎ (\\d+)\\.\\s")

    // Reference to parent container for event routing (set by ViewManager)
    var containerView: android.view.View? = null

    // Enter key behavior: "newLine" (default) or "sendMessage" (Android only)
    var enterKeyBehavior: String = "newLine"

    // When true, Bold/Italic/Underline/Strikethrough appear in the text selection context menu
    var showTextSelectionMenuItems: Boolean = true
        set(value) {
            field = value
            // Re-install or remove the custom selection action mode callback
            updateSelectionActionModeCallback()
        }

    // Gesture detector for double-tap word selection
    private val gestureDetector = GestureDetector(context, object : GestureDetector.SimpleOnGestureListener() {
        override fun onDoubleTap(e: MotionEvent): Boolean {
            selectWordAtPosition(e.x, e.y)
            return true
        }

        override fun onSingleTapUp(e: MotionEvent): Boolean {
            // Check if tap landed on a link span — intercept and emit to RN
            val offset = getOffsetForPosition(e.x, e.y)
            val spanned = text as? Spanned
            if (spanned != null && offset >= 0 && offset < spanned.length) {
                val urlSpans = spanned.getSpans(offset, offset, URLSpan::class.java)
                if (urlSpans.isNotEmpty()) {
                    val span = urlSpans[0]
                    val start = spanned.getSpanStart(span)
                    val end = spanned.getSpanEnd(span)
                    val linkText = spanned.subSequence(start, end).toString()
                    emitLinkTapEvent(span.url, linkText, start, end - start)
                    return true
                }
            }
            return false
        }
    })

    // ── Typing traits (autocorrect / autocapitalize / spellcheck) ────────────────
    //
    // Autocorrect / sentence capitalization / suggestions are never pinned to a fixed
    // value. In prose the editor asks for exactly the flags RN's own
    // ReactTextInputManager emits for a plain TextInput, so the IME's language and the
    // user's keyboard settings decide; on top of that the editor drops all of them by
    // itself while the caret sits in code (see [isCodeContext]), so autocorrect never
    // rewrites a code sample.

    /** True while the caret/selection sits inside a code block or an inline code span. */
    private var isCodeContext = false

    /** Called on every selection/style update with the resolved code state. */
    private fun setCodeContext(inCode: Boolean) {
        if (inCode == isCodeContext) return
        isCodeContext = inCode
        applyTypingTraits()
    }

    /**
     * Resolves inputType for the caret's current context and applies it, restarting the
     * IME only when the resolved value actually changed — i.e. when the caret crosses a
     * code boundary, never mid-word in prose.
     */
    private fun applyTypingTraits() {
        var flags = EditorInfo.TYPE_CLASS_TEXT or EditorInfo.TYPE_TEXT_FLAG_MULTI_LINE

        flags = flags or if (isCodeContext) {
            // Capitalizing `teh` to `Teh` inside a code block corrupts the snippet the
            // user is typing, so code always opts out.
            EditorInfo.TYPE_TEXT_FLAG_NO_SUGGESTIONS
        } else {
            // The RN TextInput defaults: autoCapitalize="sentences" + autoCorrect=true.
            EditorInfo.TYPE_TEXT_FLAG_CAP_SENTENCES or EditorInfo.TYPE_TEXT_FLAG_AUTO_CORRECT
        }

        if (inputType == flags) return

        // setInputType() rebuilds the key listener; it only rewrites text/typeface for
        // password variations (never our case), but the caret is restored defensively.
        val selStart = selectionStart
        val selEnd = selectionEnd
        inputType = flags
        if (selStart in 0..length() && selEnd in 0..length() &&
            (selectionStart != selStart || selectionEnd != selEnd)
        ) {
            setSelection(selStart, selEnd)
        }

        // The IME reads the flags when input starts, so a keyboard already up needs a restart.
        if (hasFocus()) {
            (context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager)
                ?.restartInput(this)
        }
    }

    init {
        density = context.resources.displayMetrics.density
        minHeightPx = 64 * density
        calculatedHeight = minHeightPx
        bottomBorderPaint.strokeWidth = density

        val paddingHorizontal = (12 * density).toInt()
        val paddingVertical = (0 * density).toInt()

        setPadding(paddingHorizontal, paddingVertical, paddingHorizontal, paddingVertical)
        textSize = 16f
        setLineSpacing(0f, 1.3f)  // Consistent line height multiplier
        setTextColor(Color.BLACK)
        setHintTextColor(Color.parseColor("#9E9E9E"))
        gravity = Gravity.TOP or Gravity.START
        isFocusable = true
        isFocusableInTouchMode = true
        applyTypingTraits()

        // Disable vertical scrolling by default
        isVerticalScrollBarEnabled = false

        // Use simple (greedy) line breaking so that text after list markers
        // fills the first line as much as possible. The default HIGH_QUALITY
        // strategy may wrap entire words to the next line, orphaning the
        // marker (e.g. "1.") on its own line. SIMPLE strategy greedily fills
        // each line, keeping the marker and content together.
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            breakStrategy = android.text.Layout.BREAK_STRATEGY_SIMPLE
        }

        // Set transparent background by default
        setBackgroundColor(Color.TRANSPARENT)

        // Default outlined style
        applyVariantStyle()

        // Setup toolbar
        setupToolbar()

        addTextChangedListener(object : TextWatcher {
            private var changeStart = 0
            private var removedCount = 0
            private var addedCount = 0

            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {
                changeStart = start
                removedCount = count
                addedCount = after
                // Save selected text for URL-paste-over-selection detection.
                // When count > 0 and after > 0, it's a replace (paste over selection).
                if (count > 0 && after > 0 && s != null && start + count <= s.length) {
                    savedSelectedTextForPaste = s.subSequence(start, start + count).toString()
                } else {
                    savedSelectedTextForPaste = null
                }
                detectBackspaceInListPrefix(s, start, count, after)
            }

            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                // Capture delta information
                if (!isInternalChange && s != null) {
                    val newText = s.toString()
                    val deltaMap = mutableMapOf<String, Any>()

                    when {
                        removedCount == 0 && addedCount > 0 -> {
                            // Insert
                            deltaMap["type"] = "insert"
                            deltaMap["position"] = changeStart
                            deltaMap["text"] = newText.substring(start, start + count)
                        }
                        removedCount > 0 && addedCount == 0 -> {
                            // Delete
                            deltaMap["type"] = "delete"
                            deltaMap["position"] = changeStart
                            deltaMap["length"] = removedCount
                        }
                        removedCount > 0 && addedCount > 0 -> {
                            // Replace
                            deltaMap["type"] = "replace"
                            deltaMap["position"] = changeStart
                            deltaMap["length"] = removedCount
                            deltaMap["text"] = newText.substring(start, start + count)
                        }
                    }

                    if (deltaMap.isNotEmpty()) {
                        pendingDelta = deltaMap
                    }
                }
            }

            override fun afterTextChanged(s: Editable?) {
                if (!isInternalChange) {
                    // enterKeyBehavior="sendMessage": intercept Enter key press.
                    // When a single newline is inserted (not part of a paste or list continuation),
                    // remove it and emit a send request event instead.
                    if (enterKeyBehavior == "sendMessage" && addedCount == 1 && removedCount == 0 && s != null) {
                        val insertedChar = s.subSequence(changeStart, (changeStart + 1).coerceAtMost(s.length)).toString()
                        if (insertedChar == "\n") {
                            isInternalChange = true
                            s.delete(changeStart, changeStart + 1)
                            isInternalChange = false
                            emitSendRequestEvent()
                            return
                        }
                    }

                    // Track when user last typed — used to ignore stale text prop updates
                    lastUserEditTime = System.currentTimeMillis()

                    // Clear the code-block shortcut suppression when the user types
                    // a non-backtick character, proving they've moved past the stale
                    // backtick state. Also clear when text becomes empty.
                    if (suppressCodeBlockShortcut && s != null) {
                        if (s.isEmpty()) {
                            suppressCodeBlockShortcut = false
                        } else if (addedCount > 0 && removedCount == 0) {
                            val inserted = s.subSequence(changeStart, (changeStart + addedCount).coerceAtMost(s.length)).toString()
                            if (inserted.any { it != '`' }) {
                                suppressCodeBlockShortcut = false
                            }
                        }
                    }

                    // Apply pending styles to newly typed text
                    if (addedCount > 0 && removedCount == 0 && s != null) {
                        val spanStart = changeStart
                        val spanEnd = changeStart + addedCount
                        if (spanEnd <= s.length) {
                            isInternalChange = true

                            // Apply pending ON styles
                            if (pendingStyles.isNotEmpty()) {
                                for (style in pendingStyles) {
                                    when (style) {
                                        "bold" -> s.setSpan(StyleSpan(Typeface.BOLD), spanStart, spanEnd, Spanned.SPAN_EXCLUSIVE_INCLUSIVE)
                                        "italic" -> s.setSpan(StyleSpan(Typeface.ITALIC), spanStart, spanEnd, Spanned.SPAN_EXCLUSIVE_INCLUSIVE)
                                        "underline" -> s.setSpan(UnderlineSpan(), spanStart, spanEnd, Spanned.SPAN_EXCLUSIVE_INCLUSIVE)
                                        "strikethrough" -> s.setSpan(StrikethroughSpan(), spanStart, spanEnd, Spanned.SPAN_EXCLUSIVE_INCLUSIVE)
                                        // These spans are EXCLUSIVE_INCLUSIVE so a colour keeps
                                        // applying as the user types. That also means an OLDER
                                        // colour span grows over text typed after a new colour was
                                        // armed, leaving two colours on the same characters. Cut
                                        // the previous colour back to where this one starts.
                                        "externalColor" -> pendingExternalColor?.let {
                                            clearInlineStyleSpans(s, "color", spanStart, spanEnd, keepColor = it)
                                            s.setSpan(ExternalForegroundColorSpan(it), spanStart, spanEnd, Spanned.SPAN_EXCLUSIVE_INCLUSIVE)
                                        }
                                        "externalBackgroundColor" -> pendingExternalBackgroundColor?.let {
                                            clearInlineStyleSpans(s, "backgroundColor", spanStart, spanEnd, keepColor = it)
                                            s.setSpan(ExternalBackgroundColorSpan(it), spanStart, spanEnd, Spanned.SPAN_EXCLUSIVE_INCLUSIVE)
                                        }
                                        "code" -> {
                                            val fontSize = inlineCodeFontSize ?: 12f
                                            s.setSpan(AbsoluteSizeSpan(fontSize.toInt(), true), spanStart, spanEnd, Spanned.SPAN_EXCLUSIVE_INCLUSIVE)
                                            s.setSpan(InlineCodeSpan(), spanStart, spanEnd, Spanned.SPAN_EXCLUSIVE_INCLUSIVE)
                                            val codeColor = inlineCodeTextColor ?: Color.parseColor("#6852D6")
                                            s.setSpan(ForegroundColorSpan(codeColor), spanStart, spanEnd, Spanned.SPAN_EXCLUSIVE_INCLUSIVE)
                                        }
                                        "codeBlock" -> {
                                            // Only apply TypefaceSpan/ForegroundColorSpan if not already covered
                                            // by an existing auto-extended span. Redundant overlapping spans cause
                                            // Android's DynamicLayout to re-measure text multiple times (perf kill).
                                            val existingMono = s.getSpans(spanStart, spanEnd, TypefaceSpan::class.java)
                                                .any { it.family == "monospace" && s.getSpanStart(it) <= spanStart && s.getSpanEnd(it) >= spanEnd }
                                            if (!existingMono) {
                                                s.setSpan(TypefaceSpan("monospace"), spanStart, spanEnd, Spanned.SPAN_EXCLUSIVE_INCLUSIVE)
                                            }
                                            val existingColor = s.getSpans(spanStart, spanEnd, ForegroundColorSpan::class.java)
                                                .any { s.getSpanStart(it) <= spanStart && s.getSpanEnd(it) >= spanEnd }
                                            if (!existingColor) {
                                                val cbTextColor = if (isDarkMode()) Color.parseColor("#E0E0E0") else Color.parseColor("#333333")
                                                s.setSpan(ForegroundColorSpan(cbTextColor), spanStart, spanEnd, Spanned.SPAN_EXCLUSIVE_INCLUSIVE)
                                            }
                                            // Extend existing CodeBlockBorderSpan or create new one
                                            val existingBorderSpans = s.getSpans(0, s.length, CodeBlockBorderSpan::class.java)
                                            var extended = false
                                            for (bs in existingBorderSpans) {
                                                val bsEnd = s.getSpanEnd(bs)
                                                // If the new text is adjacent to an existing code block span, extend it
                                                if (bsEnd == spanStart || bsEnd == spanStart - 1) {
                                                    val bsStart = s.getSpanStart(bs)
                                                    s.removeSpan(bs)
                                                    s.setSpan(CodeBlockBorderSpan(density), bsStart, spanEnd, Spanned.SPAN_EXCLUSIVE_INCLUSIVE)
                                                    extended = true
                                                    break
                                                }
                                            }
                                            if (!extended) {
                                                s.setSpan(CodeBlockBorderSpan(density), spanStart, spanEnd, Spanned.SPAN_EXCLUSIVE_INCLUSIVE)
                                            }
                                        }
                                    }
                                }
                            }

                            // Remove explicitly-off styles from newly typed text
                            if (explicitlyOffStyles.isNotEmpty()) {
                                for (offStyle in explicitlyOffStyles) {
                                    when (offStyle) {
                                        "bold" -> s.getSpans(spanStart, spanEnd, StyleSpan::class.java)
                                            .filter { it.style == Typeface.BOLD }
                                            .forEach { span ->
                                                val ss = s.getSpanStart(span)
                                                val se = s.getSpanEnd(span)
                                                s.removeSpan(span)
                                                // Re-apply to part before new text only
                                                if (ss < spanStart) s.setSpan(StyleSpan(Typeface.BOLD), ss, spanStart, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                                // Re-apply to part after new text only
                                                if (se > spanEnd) s.setSpan(StyleSpan(Typeface.BOLD), spanEnd, se, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                            }
                                        "italic" -> s.getSpans(spanStart, spanEnd, StyleSpan::class.java)
                                            .filter { it.style == Typeface.ITALIC }
                                            .forEach { span ->
                                                val ss = s.getSpanStart(span)
                                                val se = s.getSpanEnd(span)
                                                s.removeSpan(span)
                                                if (ss < spanStart) s.setSpan(StyleSpan(Typeface.ITALIC), ss, spanStart, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                                if (se > spanEnd) s.setSpan(StyleSpan(Typeface.ITALIC), spanEnd, se, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                            }
                                        "underline" -> s.getSpans(spanStart, spanEnd, UnderlineSpan::class.java)
                                            .forEach { span ->
                                                val ss = s.getSpanStart(span)
                                                val se = s.getSpanEnd(span)
                                                s.removeSpan(span)
                                                if (ss < spanStart) s.setSpan(UnderlineSpan(), ss, spanStart, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                                if (se > spanEnd) s.setSpan(UnderlineSpan(), spanEnd, se, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                            }
                                        "strikethrough" -> s.getSpans(spanStart, spanEnd, StrikethroughSpan::class.java)
                                            .forEach { span ->
                                                val ss = s.getSpanStart(span)
                                                val se = s.getSpanEnd(span)
                                                s.removeSpan(span)
                                                if (ss < spanStart) s.setSpan(StrikethroughSpan(), ss, spanStart, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                                if (se > spanEnd) s.setSpan(StrikethroughSpan(), spanEnd, se, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                            }
                                        "code" -> {
                                            s.getSpans(spanStart, spanEnd, InlineCodeSpan::class.java)
                                                .forEach { span ->
                                                    val ss = s.getSpanStart(span)
                                                    val se = s.getSpanEnd(span)
                                                    s.removeSpan(span)
                                                    if (ss < spanStart) s.setSpan(InlineCodeSpan(), ss, spanStart, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                                    if (se > spanEnd) s.setSpan(InlineCodeSpan(), spanEnd, se, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                                }
                                            s.getSpans(spanStart, spanEnd, ForegroundColorSpan::class.java)
                                                .forEach { span ->
                                                    val ss = s.getSpanStart(span)
                                                    val se = s.getSpanEnd(span)
                                                    s.removeSpan(span)
                                                    if (ss < spanStart) s.setSpan(ForegroundColorSpan(span.foregroundColor), ss, spanStart, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                                    if (se > spanEnd) s.setSpan(ForegroundColorSpan(span.foregroundColor), spanEnd, se, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                                }
                                            s.getSpans(spanStart, spanEnd, AbsoluteSizeSpan::class.java)
                                                .forEach { span ->
                                                    val ss = s.getSpanStart(span)
                                                    val se = s.getSpanEnd(span)
                                                    s.removeSpan(span)
                                                    if (ss < spanStart) s.setSpan(AbsoluteSizeSpan(span.size, true), ss, spanStart, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                                    if (se > spanEnd) s.setSpan(AbsoluteSizeSpan(span.size, true), spanEnd, se, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                                }
                                        }
                                    }
                                }
                            }

                            isInternalChange = false
                        }
                    }

                    // Detect markdown syntax in pasted text and convert to styled
                    // spannable. This catches pastes that bypass onTextContextMenuItem
                    // (e.g., system clipboard paste, IME paste).
                    if (addedCount > 1 && removedCount == 0 && s != null) {
                        val insertedStart = changeStart
                        val insertedEnd = (changeStart + addedCount).coerceAtMost(s.length)
                        // A copy from CometChat puts the PLAIN text on the clipboard (so `<color=…>`
                        // can never leak into another app) and the wire form in a private clip
                        // extra. Nothing read that extra back, so a copy/paste inside CometChat
                        // always arrived stripped of its colour — `markdownToSpannable` below
                        // handles `<color=…>` fine, it was simply never given it (ENG-38253).
                        val insertedText = richTextForPaste(
                            s.subSequence(insertedStart, insertedEnd).toString()
                        )
                        if (looksLikeMarkdown(insertedText)) {
                            // Check that the inserted text doesn't already have styled spans
                            // (would mean it came through onTextContextMenuItem or blocksToSpannable)
                            val existingUrlSpans = s.getSpans(insertedStart, insertedEnd, URLSpan::class.java)
                            val existingStyleSpans = s.getSpans(insertedStart, insertedEnd, StyleSpan::class.java)
                            if (existingUrlSpans.isEmpty() && existingStyleSpans.isEmpty()) {
                                isInternalChange = true
                                val result = markdownToSpannable(insertedText)
                                s.replace(insertedStart, insertedEnd, result)
                                isInternalChange = false
                            }
                        }
                    }

                    // URL-paste-over-selection fallback: catches pastes that bypass
                    // onTextContextMenuItem (e.g., system clipboard, IME paste).
                    // When text was replaced (removedCount > 0 && addedCount > 0)
                    // and the inserted text is a URL, undo the replace and create
                    // a styled hyperlink using the original selected text.
                    if (addedCount > 0 && removedCount > 0 && s != null && savedSelectedTextForPaste != null) {
                        val insertedStart = changeStart
                        val insertedEnd = (changeStart + addedCount).coerceAtMost(s.length)
                        val insertedText = s.subSequence(insertedStart, insertedEnd).toString()
                        // Check if inserted text is a URL and doesn't already have link spans
                        // (link spans would mean onTextContextMenuItem already handled it)
                        val existingUrlSpans = s.getSpans(insertedStart, insertedEnd, URLSpan::class.java)
                        if (isURL(insertedText) && existingUrlSpans.isEmpty()) {
                            val selectedText = savedSelectedTextForPaste!!
                            val trimmedURL = insertedText.trim()
                            isInternalChange = true
                            // Remove the pasted URL text
                            s.delete(insertedStart, insertedEnd)
                            // Insert styled link with original selected text as display
                            val normalizedUrl = if (!trimmedURL.lowercase().startsWith("http://") &&
                                !trimmedURL.lowercase().startsWith("https://") &&
                                !trimmedURL.lowercase().startsWith("mailto:") &&
                                !trimmedURL.lowercase().startsWith("tel:")) {
                                "https://$trimmedURL"
                            } else trimmedURL
                            val linkSpannable = SpannableStringBuilder(selectedText)
                            linkSpannable.setSpan(NoUnderlineURLSpan(normalizedUrl), 0, selectedText.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                            linkSpannable.setSpan(ForegroundColorSpan(Color.parseColor("#2196F3")), 0, selectedText.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                            s.insert(insertedStart, linkSpannable)
                            isInternalChange = false
                            savedSelectedTextForPaste = null
                            sendContentChange()
                        }
                    }

                    // Split InlineCodeSpan at newline boundaries so the container
                    // does not visually extend across line breaks in the composer.
                    if (addedCount > 0 && s != null) {
                        splitInlineCodeSpansAtNewlines(s)
                    }
                    // When Enter is pressed while inline code is active, the split
                    // removes the span from the newline so the new line has nothing.
                    // Re-add "code" to pendingStyles so subsequent typing gets styled.
                    if (addedCount > 0 && s != null) {
                        val inserted = s.subSequence(changeStart, (changeStart + addedCount).coerceAtMost(s.length)).toString()
                        if (inserted.contains("\n")) {
                            // Check if char before the newline had InlineCodeSpan
                            val nlPos = changeStart + inserted.indexOf('\n')
                            if (nlPos > 0 && s.getSpans(nlPos - 1, nlPos, InlineCodeSpan::class.java).isNotEmpty()) {
                                if (!explicitlyOffStyles.contains("code")) {
                                    pendingStyles.add("code")
                                    pendingStylesInsertPos = selectionStart
                                }
                            }
                        }
                    }
                    var handled = handleBackspaceInListPrefix(s)
                    if (!handled) {
                        handled = autoContinueListOnEnter(s)
                    }
                    if (!handled) {
                        handled = checkTripleEnterExitCodeBlock(s)
                    }
                    if (!handled) {
                        isInternalChange = true
                        renumberNumberedLists()
                        isInternalChange = false
                    }

                    // Apply hanging indent for lines with list/blockquote prefixes (ENG-31433)
                    applyListIndentation()

                    // Issue 1: When text becomes empty, reset all pending/explicit style toggles
                    if (s != null && s.isEmpty()) {
                        pendingStyles.clear()
                        explicitlyOffStyles.clear()
                        pendingStylesInsertPos = -1
                        suppressCodeBlockShortcut = false
                        // Also remove all zero-length style spans that survive in the empty Editable.
                        // SPAN_EXCLUSIVE_INCLUSIVE spans shrink to zero-length but still expand when
                        // new text is typed, causing ghost bold/italic/underline/strikethrough.
                        s.getSpans(0, 0, StyleSpan::class.java).forEach { s.removeSpan(it) }
                        s.getSpans(0, 0, UnderlineSpan::class.java).forEach { s.removeSpan(it) }
                        s.getSpans(0, 0, StrikethroughSpan::class.java).forEach { s.removeSpan(it) }
                        s.getSpans(0, 0, InlineCodeSpan::class.java).forEach { s.removeSpan(it) }
                        s.getSpans(0, 0, ForegroundColorSpan::class.java).forEach { s.removeSpan(it) }
                        s.getSpans(0, 0, AbsoluteSizeSpan::class.java).forEach { s.removeSpan(it) }
                        s.getSpans(0, 0, CodeBlockBorderSpan::class.java).forEach { s.removeSpan(it) }
                        s.getSpans(0, 0, TypefaceSpan::class.java).forEach { s.removeSpan(it) }
                    }

                    // Issue 2: Clean up zero-length spans left behind after backspace
                    // These ghost spans cause the toolbar to show active state incorrectly
                    if (removedCount > 0 && s != null && s.isNotEmpty()) {
                        val cursorPos = selectionStart.coerceIn(0, s.length)
                        // Check for zero-length style spans at cursor
                        s.getSpans(cursorPos, cursorPos, StyleSpan::class.java).forEach { span ->
                            if (s.getSpanStart(span) == s.getSpanEnd(span)) {
                                s.removeSpan(span)
                            }
                        }
                        s.getSpans(cursorPos, cursorPos, UnderlineSpan::class.java).forEach { span ->
                            if (s.getSpanStart(span) == s.getSpanEnd(span)) {
                                s.removeSpan(span)
                            }
                        }
                        s.getSpans(cursorPos, cursorPos, StrikethroughSpan::class.java).forEach { span ->
                            if (s.getSpanStart(span) == s.getSpanEnd(span)) {
                                s.removeSpan(span)
                            }
                        }
                        // Consumer colours are applied SPAN_EXCLUSIVE_INCLUSIVE while typing, so a
                        // zero-length ghost would resurrect the colour after the text is deleted.
                        s.getSpans(cursorPos, cursorPos, ExternalForegroundColorSpan::class.java).forEach { span ->
                            if (s.getSpanStart(span) == s.getSpanEnd(span)) {
                                s.removeSpan(span)
                            }
                        }
                    }

                    // Detect markdown shortcuts (e.g., **text** → bold) and convert to
                    // live formatting. Skip if inside a code block (Req 20.6).
                    detectMarkdownShortcut(s)

                    // Issue 3: Prevent link span bleed — when typing immediately after
                    // a link, URLSpan/ForegroundColorSpan/UnderlineSpan from the link
                    // extend into the newly typed characters. Strip them so new text
                    // appears unstyled (Req 18.4).
                    if (addedCount > 0 && removedCount == 0 && s != null && s.isNotEmpty()) {
                        val spanStart = changeStart
                        val spanEnd = (changeStart + addedCount).coerceAtMost(s.length)
                        if (spanEnd > spanStart) {
                            isInternalChange = true
                            s.getSpans(spanStart, spanEnd, URLSpan::class.java).forEach { span ->
                                val ss = s.getSpanStart(span)
                                val se = s.getSpanEnd(span)
                                // Only trim if the span was extended into the new text
                                // (original span ended at or before the insert position)
                                if (ss < spanStart && se >= spanEnd) {
                                    s.removeSpan(span)
                                    s.setSpan(span, ss, spanStart, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                }
                            }
                            s.getSpans(spanStart, spanEnd, ForegroundColorSpan::class.java).forEach { span ->
                                val ss = s.getSpanStart(span)
                                val se = s.getSpanEnd(span)
                                if (ss < spanStart && se >= spanEnd) {
                                    // Only trim color spans that co-occur with a URLSpan (link color)
                                    val hasUrl = s.getSpans(ss, spanStart, URLSpan::class.java).isNotEmpty()
                                    if (hasUrl) {
                                        s.removeSpan(span)
                                        s.setSpan(ForegroundColorSpan(span.foregroundColor), ss, spanStart, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                    }
                                }
                            }
                            s.getSpans(spanStart, spanEnd, UnderlineSpan::class.java).forEach { span ->
                                val ss = s.getSpanStart(span)
                                val se = s.getSpanEnd(span)
                                if (ss < spanStart && se >= spanEnd) {
                                    val hasUrl = s.getSpans(ss, spanStart, URLSpan::class.java).isNotEmpty()
                                    if (hasUrl) {
                                        s.removeSpan(span)
                                        s.setSpan(UnderlineSpan(), ss, spanStart, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                    }
                                }
                            }
                            isInternalChange = false
                        }
                    }

                    // Before bleed prevention, check if the newly typed text
                    // landed inside an existing CodeBlockBorderSpan. If so, the
                    // user IS typing inside a code block and pendingStyles just
                    // hasn't been updated yet (onSelectionChanged fires after
                    // afterTextChanged). Add "codeBlock" to pendingStyles so the
                    // bleed prevention below correctly skips trimming.
                    //
                    // IMPORTANT: check the actual insertion point (changeStart),
                    // not changeStart-1. After triple-enter exit the span uses
                    // SPAN_EXCLUSIVE_EXCLUSIVE and ends right before changeStart,
                    // so checking changeStart-1 would falsely detect the cursor
                    // as inside the code block. Checking changeStart directly
                    // only matches when the span truly covers the new text
                    // (i.e. SPAN_EXCLUSIVE_INCLUSIVE auto-extended it).
                    if (addedCount > 0 && s != null && s.isNotEmpty()
                        && !pendingStyles.contains("codeBlock")) {
                        val insertEnd = (changeStart + addedCount).coerceAtMost(s.length)
                        if (insertEnd > changeStart) {
                            val cbSpans = s.getSpans(changeStart, insertEnd, CodeBlockBorderSpan::class.java)
                            val insideCodeBlock = cbSpans.any { span ->
                                val ss = s.getSpanStart(span)
                                val se = s.getSpanEnd(span)
                                // The span must strictly contain the inserted text,
                                // not just be adjacent (ss < changeStart rules out
                                // spans that start at changeStart from a separate block)
                                ss < changeStart && se >= insertEnd
                            }
                            if (insideCodeBlock) {
                                pendingStyles.add("codeBlock")
                                pendingStylesInsertPos = selectionStart
                            }
                        }
                    }

                    // Prevent CodeBlockBorderSpan bleed — SPAN_EXCLUSIVE_INCLUSIVE
                    // causes the span to auto-expand when text is typed at its end
                    // boundary. If the user is NOT in code block mode, trim any
                    // CodeBlockBorderSpan (and its companion TypefaceSpan monospace)
                    // that leaked into the newly typed characters.
                    if (addedCount > 0 && removedCount == 0 && s != null && s.isNotEmpty()
                        && !pendingStyles.contains("codeBlock")) {
                        val spanStart = changeStart
                        val spanEnd = (changeStart + addedCount).coerceAtMost(s.length)
                        if (spanEnd > spanStart) {
                            isInternalChange = true
                            s.getSpans(spanStart, spanEnd, CodeBlockBorderSpan::class.java).forEach { span ->
                                val ss = s.getSpanStart(span)
                                val se = s.getSpanEnd(span)
                                // Only trim if the span was extended into the new text
                                if (ss < spanStart && se >= spanEnd) {
                                    s.removeSpan(span)
                                    if (ss < spanStart) {
                                        s.setSpan(CodeBlockBorderSpan(density), ss, spanStart, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                    }
                                }
                            }
                            s.getSpans(spanStart, spanEnd, TypefaceSpan::class.java)
                                .filter { it.family == "monospace" }
                                .forEach { span ->
                                    val ss = s.getSpanStart(span)
                                    val se = s.getSpanEnd(span)
                                    if (ss < spanStart && se >= spanEnd) {
                                        s.removeSpan(span)
                                        if (ss < spanStart) {
                                            s.setSpan(TypefaceSpan("monospace"), ss, spanStart, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                                        }
                                    }
                                }
                            isInternalChange = false
                        }
                    }

                    sendContentChangeWithDelta()
                    saveToUndoStack()

                    pendingDelta = null
                }
                previousText = s?.toString() ?: ""
                updatePlaceholderVisibility()
                post {
                    updateContentSize()
                    invalidate()

                    // If line count changed (soft-wrap), schedule another redraw
                    // after the framework's layout pass to ensure onDraw sees
                    // the updated Layout with correct line positions.
                    val currentLineCount = layout?.lineCount ?: 0
                    if (currentLineCount != lastKnownLineCount) {
                        lastKnownLineCount = currentLineCount
                        post { invalidate() }
                    }
                }
            }
        })

        setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                sendEvent("onEditorFocus", Arguments.createMap())
            } else {
                hideToolbar()
                sendEvent("onEditorBlur", Arguments.createMap())
            }
        }

        // Install text selection context menu (conditionally adds Bold/Italic/Underline/Strikethrough)
        updateSelectionActionModeCallback()

        // Install the OnReceiveContentListener so pasted rich content (images / files
        // from Photos, file explorers, other apps) is intercepted, extracted to temp
        // files, and surfaced to JS via the onPasteMedia event. Plain text pastes are
        // returned unchanged so normal text-paste behavior is preserved.
        installOnReceiveContentListener()

        isInitialized = true
    }

    /**
     * Registers a [OnReceiveContentListener] on this EditText via [ViewCompat] so that
     * pasted (and drag-and-dropped) rich content is intercepted before the platform
     * inserts it as text. This is the modern, backwards-compatible API (androidx.core);
     * on API 31+ it is backed by the platform ON_RECEIVE_CONTENT infrastructure, and on
     * older API levels androidx routes clipboard pastes through the same callback.
     *
     * Media (image, video, audio and application MIME types) is copied to a temp file in
     * cacheDir and emitted to JS; plain text (and anything else) is passed through
     * unchanged so the default paste/insert behavior is untouched.
     */
    private fun installOnReceiveContentListener() {
        // Register the concrete top-level MIME types we want a shot at. Android's
        // setOnReceiveContentListener FORBIDS a "*/*" wildcard (the top-level type must be
        // concrete — it throws IllegalArgumentException otherwise); the subtype "/*"
        // wildcard is allowed. These cover images, video, audio, and every file kind
        // (application/*, text/*). We still decide per-item below whether to consume
        // (URI-backed media/files) or pass through (plain text has no URI).
        val mimeTypes = arrayOf("image/*", "video/*", "audio/*", "application/*", "text/*")
        val listener = OnReceiveContentListener { _, payload ->
            handleReceivedContent(payload)
        }
        ViewCompat.setOnReceiveContentListener(this, mimeTypes, listener)
    }

    /**
     * Splits the incoming [ContentInfoCompat] payload into a media part (content:// URIs
     * we extract) and a remaining part (text / anything else) that we hand back to the
     * platform so normal paste continues. Returns the remaining payload, or null if we
     * consumed everything.
     */
    private fun handleReceivedContent(payload: ContentInfoCompat): ContentInfoCompat? {
        // Partition the clip: URIs (potential media) vs. everything else (text, etc.).
        val split = payload.partition { item -> item.uri != null }
        val uriPayload: ContentInfoCompat? = split.first
        val remaining: ContentInfoCompat? = split.second

        if (uriPayload == null) {
            // No URI content — this is a plain text (or other) paste. Pass through
            // unchanged so normal text paste proceeds. Do NOT emit.
            return payload
        }

        val emitted = try {
            extractAndEmitMedia(uriPayload.clip)
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }

        // If we could not extract anything usable from the URIs (e.g. resolver returned
        // no stream), fall back to letting the platform handle the whole payload so we
        // never silently swallow a paste.
        return if (emitted) remaining else payload
    }

    /**
     * Iterates over each item in the pasted [ClipData], copies content:// (or file://)
     * media to a temp file in cacheDir, and emits a single onPasteMedia event with an
     * `items` array. Each item: { uri, mimeType, name, size }. Returns true if at least
     * one item was successfully extracted and the event was emitted.
     */
    private fun extractAndEmitMedia(clip: ClipData): Boolean {
        val resolver = context.contentResolver
        val items: WritableArray = Arguments.createArray()

        for (i in 0 until clip.itemCount) {
            val uri = clip.getItemAt(i)?.uri ?: continue
            try {
                val itemMap = copyUriToTempFileMap(resolver, uri) ?: continue
                items.pushMap(itemMap)
            } catch (e: Exception) {
                // Skip items that fail; never crash on a single bad clipboard entry.
                e.printStackTrace()
            }
        }

        if (items.size() == 0) return false

        val payload = Arguments.createMap()
        payload.putArray("items", items)
        sendEvent("onPasteMedia", payload)
        return true
    }

    /**
     * Copies a single content:// / file:// [uri] to a temp file in cacheDir and returns
     * a WritableMap of { uri (file://), mimeType (REAL type), name (with extension),
     * size (bytes) }. Returns null if the URI could not be read.
     */
    private fun copyUriToTempFileMap(resolver: ContentResolver, uri: Uri): WritableMap? {
        // Resolve the REAL mime type via the content resolver (do NOT hardcode).
        val mimeType = resolver.getType(uri)
            ?: MimeTypeMap.getSingleton()
                .getMimeTypeFromExtension(
                    MimeTypeMap.getFileExtensionFromUrl(uri.toString()).lowercase()
                )
            ?: "application/octet-stream"

        // Resolve a display name + size from the resolver where possible.
        val (resolvedName, resolvedSize) = queryNameAndSize(resolver, uri)

        // Derive an extension: prefer the one on the resolved name, else map from mime.
        val extFromMime = MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType)
        val hasExt = resolvedName?.substringAfterLast('.', "")?.isNotEmpty() == true
        val baseName = when {
            !resolvedName.isNullOrBlank() && hasExt -> resolvedName
            !resolvedName.isNullOrBlank() -> {
                if (!extFromMime.isNullOrBlank()) "$resolvedName.$extFromMime" else resolvedName
            }
            else -> {
                val ext = if (!extFromMime.isNullOrBlank()) ".$extFromMime" else ""
                "pasted_media_${System.currentTimeMillis()}$ext"
            }
        }
        // Guard against illegal filename characters when building the temp file.
        val safeName = baseName.replace(Regex("[^A-Za-z0-9._-]"), "_")

        // Copy the stream to a uniquely-named temp file so multiple pastes don't collide.
        val tempFile = File.createTempFile(
            "paste_${System.currentTimeMillis()}_",
            "_$safeName",
            context.cacheDir
        )

        val copied = resolver.openInputStream(uri)?.use { input ->
            tempFile.outputStream().use { output ->
                input.copyTo(output)
            }
            true
        } ?: false

        if (!copied || !tempFile.exists() || tempFile.length() == 0L) {
            tempFile.delete()
            return null
        }

        val size = if (resolvedSize > 0L) resolvedSize else tempFile.length()

        return Arguments.createMap().apply {
            putString("uri", "file://${tempFile.absolutePath}")
            putString("mimeType", mimeType)
            putString("name", safeName)
            // size is bytes; use double to avoid Int overflow for large files (>2GB safe).
            putDouble("size", size.toDouble())
        }
    }

    /**
     * Queries the content resolver for a display name and size. Returns Pair(name?, size).
     * Size is -1 when unknown. Falls back gracefully for file:// URIs.
     */
    private fun queryNameAndSize(resolver: ContentResolver, uri: Uri): Pair<String?, Long> {
        var name: String? = null
        var size = -1L
        if (uri.scheme == ContentResolver.SCHEME_CONTENT) {
            try {
                resolver.query(uri, null, null, null, null)?.use { cursor ->
                    if (cursor.moveToFirst()) {
                        val nameIdx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                        if (nameIdx >= 0 && !cursor.isNull(nameIdx)) {
                            name = cursor.getString(nameIdx)
                        }
                        val sizeIdx = cursor.getColumnIndex(OpenableColumns.SIZE)
                        if (sizeIdx >= 0 && !cursor.isNull(sizeIdx)) {
                            size = cursor.getLong(sizeIdx)
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        } else {
            // file:// or other — derive name from the last path segment.
            name = uri.lastPathSegment
        }
        return Pair(name, size)
    }

    private fun setupToolbar() {
        toolbarPopup = PopupWindow(context).apply {
            width = WindowManager.LayoutParams.WRAP_CONTENT
            height = WindowManager.LayoutParams.WRAP_CONTENT
            isOutsideTouchable = true
            isFocusable = false  // Don't take focus away from EditText
            isTouchable = true
            elevation = 10 * density

            // Don't dim the background
            setBackgroundDrawable(null)
        }

        // Install text selection context menu (conditionally adds Bold/Italic/Underline/Strikethrough)
        updateSelectionActionModeCallback()

        customInsertionActionModeCallback = object : android.view.ActionMode.Callback {
            override fun onCreateActionMode(mode: android.view.ActionMode?, menu: android.view.Menu?): Boolean {
                return true
            }

            override fun onPrepareActionMode(mode: android.view.ActionMode?, menu: android.view.Menu?): Boolean {
                // Insertion action mode = long-press / cursor tap with NO selection (e.g. an
                // empty composer). Rebuild the menu so the system "Paste" bubble is available
                // — this is what lets the user paste an image/file into an empty composer.
                // (Previously the menu was cleared and left empty, so no Paste ever appeared.)
                // Paste is offered only when the clipboard has content; "Select all" is added
                // when there is text to select.
                menu?.clear()
                val clipboard =
                    context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                if (clipboard?.hasPrimaryClip() == true) {
                    menu?.add(0, android.R.id.paste, 0, android.R.string.paste)
                }
                if ((text?.length ?: 0) > 0) {
                    menu?.add(0, android.R.id.selectAll, 1, android.R.string.selectAll)
                }
                return true
            }

            override fun onActionItemClicked(mode: android.view.ActionMode?, item: android.view.MenuItem?): Boolean {
                return when (item?.itemId) {
                    android.R.id.paste -> {
                        onTextContextMenuItem(android.R.id.paste); mode?.finish(); true
                    }
                    android.R.id.selectAll -> {
                        onTextContextMenuItem(android.R.id.selectAll); true
                    }
                    else -> false
                }
            }

            override fun onDestroyActionMode(mode: android.view.ActionMode?) {}
        }
    }

    /**
     * Install or update the text selection action mode callback.
     * When showTextSelectionMenuItems is true, adds Bold/Italic/Underline/Strikethrough
     * to the context menu. When false, only system defaults (Cut/Copy/Paste) appear.
     */
    private fun updateSelectionActionModeCallback() {
        customSelectionActionModeCallback = object : android.view.ActionMode.Callback {
            override fun onCreateActionMode(mode: android.view.ActionMode?, menu: android.view.Menu?): Boolean {
                return true
            }

            override fun onPrepareActionMode(mode: android.view.ActionMode?, menu: android.view.Menu?): Boolean {
                menu?.clear()
                // Re-add standard Cut/Copy/Paste/Select All
                menu?.add(0, android.R.id.cut, 0, android.R.string.cut)
                menu?.add(0, android.R.id.copy, 1, android.R.string.copy)
                menu?.add(0, android.R.id.paste, 2, android.R.string.paste)
                menu?.add(0, android.R.id.selectAll, 3, android.R.string.selectAll)
                // Add formatting options only when enabled and not in code block
                if (showTextSelectionMenuItems && !isCursorInCodeBlock()) {
                    menu?.add(0, 100, 10, "Bold")
                    menu?.add(0, 101, 11, "Italic")
                    menu?.add(0, 102, 12, "Underline")
                    menu?.add(0, 103, 13, "Strikethrough")
                }
                return true
            }

            override fun onActionItemClicked(mode: android.view.ActionMode?, item: android.view.MenuItem?): Boolean {
                when (item?.itemId) {
                    android.R.id.cut -> { onTextContextMenuItem(android.R.id.cut); mode?.finish(); return true }
                    android.R.id.copy -> { onTextContextMenuItem(android.R.id.copy); mode?.finish(); return true }
                    android.R.id.paste -> { onTextContextMenuItem(android.R.id.paste); mode?.finish(); return true }
                    android.R.id.selectAll -> { onTextContextMenuItem(android.R.id.selectAll); return true }
                    100 -> { applyFormatAndDismiss(mode) { onBoldClick() }; return true }
                    101 -> { applyFormatAndDismiss(mode) { onItalicClick() }; return true }
                    102 -> { applyFormatAndDismiss(mode) { onUnderlineClick() }; return true }
                    103 -> { applyFormatAndDismiss(mode) { onStrikethroughClick() }; return true }
                }
                return false
            }

            override fun onDestroyActionMode(mode: android.view.ActionMode?) {}
        }
    }

    /**
     * Applies a formatting action from the native text selection action bar,
     * then dismisses the action bar and collapses the selection so subsequent
     * typing does not carry the formatting (WhatsApp-style behavior).
     */
    private fun applyFormatAndDismiss(mode: android.view.ActionMode?, action: () -> Unit) {
        val selEnd = selectionEnd.coerceIn(0, text?.length ?: 0)
        action()
        updateToolbarButtonStates()
        // Dismiss the contextual action bar
        mode?.finish()
        // Collapse selection to end so next typed chars are unstyled
        setSelection(selEnd)
        // Clear any pending/explicitly-off styles to prevent carry-over
        pendingStyles.clear()
        explicitlyOffStyles.clear()
        pendingStylesInsertPos = -1
        emitActiveStyles()
    }

    override fun onSelectionChanged(selStart: Int, selEnd: Int) {
        super.onSelectionChanged(selStart, selEnd)

        // Skip if not initialized yet (during construction)
        if (!isInitialized) return

        // Clear pending/explicitly-off styles when cursor moves WITHOUT text changing
        // (i.e., user tapped somewhere else or used arrow keys)
        if ((pendingStyles.isNotEmpty() || explicitlyOffStyles.isNotEmpty()) && pendingStylesInsertPos >= 0) {
            if (selStart != pendingStylesInsertPos) {
                val currentLen = text?.length ?: 0
                // Allow cursor to advance by 1 (typing) — don't clear in that case
                if (selStart != pendingStylesInsertPos + 1 || currentLen == previousText.length) {
                    // Preserve "codeBlock" across cursor movements — it's a persistent
                    // block-level style that should survive until explicitly toggled off
                    // or exited via triple-Enter. Without this, the clear-and-re-add
                    // cycle via the re-activation block below can miss edge cases where
                    // the CodeBlockBorderSpan hasn't been extended yet.
                    val hadCodeBlock = pendingStyles.contains("codeBlock")
                    pendingStyles.clear()
                    explicitlyOffStyles.clear()
                    pendingStylesInsertPos = -1
                    if (hadCodeBlock) {
                        pendingStyles.add("codeBlock")
                        pendingStylesInsertPos = selStart
                    }
                } else {
                    // Cursor advanced by 1 due to typing — update insert pos
                    pendingStylesInsertPos = selStart
                }
            }
        }

        // Re-activate code block mode when cursor moves INTO a code block region.
        // Mirrors iOS isCodeBlockModeActive re-activation in textViewDidChangeSelection.
        // After a triple-enter exit, pendingStyles is cleared and the CodeBlockBorderSpan
        // flag is EXCLUSIVE_EXCLUSIVE, so new typing won't get code block spans unless
        // we re-add "codeBlock" to pendingStyles here.
        // Only check the character immediately before the cursor (selStart - 1) to avoid
        // false positives when the cursor is on the line right after a code block.
        if (!isInternalChange && !pendingStyles.contains("codeBlock") && selStart == selEnd) {
            val editable = text
            if (editable != null && editable.isNotEmpty()) {
                val checkPos = if (selStart > 0) selStart - 1 else 0
                val cursorInCodeBlock = checkPos in 0 until editable.length &&
                    editable.getSpans(checkPos, checkPos + 1, CodeBlockBorderSpan::class.java).isNotEmpty()
                if (cursorInCodeBlock) {
                    pendingStyles.add("codeBlock")
                    pendingStylesInsertPos = selStart
                }
            }
        }

        android.util.Log.d("RichTextEditor", "onSelectionChanged: start=$selStart, end=$selEnd, showToolbar=$showToolbar, hasFocus=${hasFocus()}")

        // Save selection for toolbar actions
        if (selStart != selEnd) {
            savedSelectionStart = selStart
            savedSelectionEnd = selEnd
        } else {
            // Clear saved selection when cursor collapses (no selection)
            savedSelectionStart = 0
            savedSelectionEnd = 0
        }

        // Send selection change event — adjust positions to account for zero-width
        // spaces (\u200B) that are stripped from text in sendContentChange().
        // Without this, JS-side cursor positions don't match the cleaned text length.
        val rawText = text?.toString() ?: ""
        var zwspBeforeStart = 0
        for (i in 0 until selStart.coerceAtMost(rawText.length)) {
            if (rawText[i] == '\u200B') zwspBeforeStart++
        }
        val adjustedStart = selStart - zwspBeforeStart
        val adjustedEnd: Int
        if (selStart == selEnd) {
            adjustedEnd = adjustedStart
        } else {
            var zwspBeforeEnd = zwspBeforeStart
            for (i in selStart until selEnd.coerceAtMost(rawText.length)) {
                if (rawText[i] == '\u200B') zwspBeforeEnd++
            }
            adjustedEnd = selEnd - zwspBeforeEnd
        }
        val map = Arguments.createMap()
        map.putInt("start", adjustedStart)
        map.putInt("end", adjustedEnd)
        sendEvent("onSelectionChange", map)

        // Emit active styles synchronously for instant toolbar updates
        emitActiveStyles()

        // Show/hide toolbar based on selection
        if (selStart != selEnd && showToolbar && hasFocus()) {
            android.util.Log.d("RichTextEditor", "Should show toolbar - selection exists")
            removeCallbacks(hideToolbarRunnable)
            // Use postDelayed to ensure layout is complete
            postDelayed({ showToolbarAtSelection() }, 50)
        } else {
            // Delay hiding to prevent flicker during selection changes
            android.util.Log.d("RichTextEditor", "Scheduling hide toolbar")
            postDelayed(hideToolbarRunnable, 200)
        }

        // Update toolbar button states
        if (selStart != selEnd) {
            updateToolbarButtonStates()
        }
    }

    // Redraw custom overlays (code block containers, inline code borders, blockquote bars)
    // when the user scrolls so they stay in sync with the text content.
    override fun onScrollChanged(horiz: Int, vert: Int, oldHoriz: Int, oldVert: Int) {
        super.onScrollChanged(horiz, vert, oldHoriz, oldVert)
        invalidate()
    }

    // Draw unified code block borders BEHIND text (iOS-matching approach:
    // single rounded rect per code block region, full-width of the view).
    override fun onDraw(canvas: Canvas) {
        // Compute the vertical offset that TextView applies for gravity.
        // Layout line positions are relative to the Layout origin (0,0).
        // With CENTER_VERTICAL gravity, TextView shifts the Layout down by
        // (viewHeight - padding - layoutHeight) / 2. We must apply the same
        // offset so our custom-drawn containers align with the text.
        val textLayout = layout
        val gravityOffsetY = if (textLayout != null) {
            ((height - paddingTop - paddingBottom - textLayout.height) / 2f).coerceAtLeast(0f)
        } else 0f
        val textBaseY = paddingTop + gravityOffsetY

        // ── Code block containers (unified rect per region, matching iOS) ──
        val spannable = text as? Spanned ?: run { super.onDraw(canvas); return }
        if (spannable != null && textLayout != null) {
            // 1. Find all code block regions by merging overlapping CodeBlockBorderSpan ranges.
            //    Only merge spans that truly overlap or are directly adjacent within the
            //    same code block. A gap of even one character (e.g. a normal-text newline
            //    between two separate code blocks) must NOT be merged — otherwise two
            //    distinct code blocks render as one giant container.
            val cbSpans = spannable.getSpans(0, spannable.length, CodeBlockBorderSpan::class.java)
            if (cbSpans.isNotEmpty()) {
                val rawRanges = mutableListOf<Pair<Int, Int>>()
                for (sp in cbSpans) {
                    val ss = spannable.getSpanStart(sp)
                    val se = spannable.getSpanEnd(sp)
                    if (ss >= 0 && se > ss) rawRanges.add(Pair(ss, se))
                }
                rawRanges.sortBy { it.first }

                // Merge only truly overlapping or touching ranges (no +1 tolerance).
                // Two spans [A..B] and [C..D] merge only when C <= B (overlap/touch).
                val codeRegions = mutableListOf<Pair<Int, Int>>()
                for ((s, e) in rawRanges) {
                    if (codeRegions.isNotEmpty() && s <= codeRegions.last().second) {
                        codeRegions[codeRegions.lastIndex] =
                            Pair(codeRegions.last().first, maxOf(codeRegions.last().second, e))
                    } else {
                        codeRegions.add(Pair(s, e))
                    }
                }

                val cornerRadiusPx = CodeBlockBorderSpan.CORNER_RADIUS * density
                val dark = isDarkMode()

                val totalLines = textLayout.lineCount

                for ((regionStart, regionEnd) in codeRegions) {
                    val clampedEnd = (regionEnd - 1).coerceAtLeast(regionStart)
                        .coerceAtMost((spannable.length - 1).coerceAtLeast(0))
                    val firstLine = textLayout.getLineForOffset(regionStart)
                    var lastLine = textLayout.getLineForOffset(clampedEnd)

                    // Match iOS: when a code block region ends with '\n', the
                    // empty line below it (where the cursor sits after pressing
                    // Enter) is not covered by clampedEnd. Extend the container
                    // to include that next visual line so the background/border
                    // wraps the cursor immediately, not one keystroke later.
                    // BUT: only extend if the next character is ALSO inside a
                    // code block span. After triple-enter exit, the text after
                    // the \n is normal text — extending would overlap it.
                    if (regionEnd > 0 && clampedEnd < spannable.length) {
                        val lastChar = spannable[clampedEnd]
                        if (lastChar == '\n') {
                            if (regionEnd < spannable.length) {
                                // Trailing \n with text after — only extend if
                                // the next character is inside a code block span
                                val nextCharCB = spannable.getSpans(
                                    regionEnd, (regionEnd + 1).coerceAtMost(spannable.length),
                                    CodeBlockBorderSpan::class.java
                                )
                                if (nextCharCB.isNotEmpty()) {
                                    val nextLine = textLayout.getLineForOffset(regionEnd)
                                    if (nextLine > lastLine) lastLine = nextLine
                                }
                            } else {
                                // Trailing \n at very end of text — the cursor is on
                                // an extra line that has no layout line entry yet.
                                // Extend by one line height so the container covers it.
                                lastLine = (totalLines - 1).coerceAtLeast(lastLine)
                            }
                        }
                    }

                    // No setPadding() is used — all visual padding is handled
                    // purely in onDraw. Extend the container by vPadPx above
                    // the first line and below the last line for breathing room.
                    // Clamp padding so the container never overlaps adjacent
                    // non-code-block lines (matching iOS clamping behavior).
                    val vPadPx = CodeBlockBorderSpan.VERTICAL_PADDING * density

                    // Clamp top padding: if there's content above the code block,
                    // limit padding to half the gap between the previous line's
                    // bottom and the code block's first line top.
                    val topPad: Float
                    if (regionStart > 0) {
                        val prevLine = textLayout.getLineForOffset((regionStart - 1).coerceAtLeast(0))
                        val prevLineBottom = textLayout.getLineBottom(prevLine).toFloat() + textBaseY
                        val codeLineTop = textLayout.getLineTop(firstLine).toFloat() + textBaseY
                        val gap = codeLineTop - prevLineBottom
                        topPad = minOf(vPadPx, maxOf(gap / 2f, 0f))
                    } else {
                        topPad = vPadPx
                    }

                    // Clamp bottom padding: if there's content below the code block,
                    // limit padding to half the gap between the code block's last
                    // line bottom and the next line's top.
                    val bottomPad: Float
                    if (regionEnd < spannable.length) {
                        val nextLine = textLayout.getLineForOffset(regionEnd.coerceAtMost(spannable.length - 1))
                        val nextLineTop = textLayout.getLineTop(nextLine).toFloat() + textBaseY
                        val codeLineBottom = textLayout.getLineBottom(lastLine).toFloat() + textBaseY
                        val gap = nextLineTop - codeLineBottom
                        bottomPad = minOf(vPadPx, maxOf(gap / 2f, 0f))
                    } else {
                        bottomPad = vPadPx
                    }

                    val codeTop = textLayout.getLineTop(firstLine).toFloat() + textBaseY - topPad
                    val codeBottom = textLayout.getLineBottom(lastLine).toFloat() + textBaseY + bottomPad

                    // Clamp topY so the container's top rounded corner is never
                    // clipped by the view's clip bounds (minimum 1px from edge).
                    val topY = codeTop.coerceAtLeast(1f)
                    val bottomY = codeBottom

                    // Full width of the view content area (matching iOS textContainer width)
                    val leftX = paddingLeft.toFloat()
                    val rightX = (width - paddingRight).toFloat()

                    val containerRect = android.graphics.RectF(leftX, topY, rightX, bottomY)
                    val path = android.graphics.Path()
                    path.addRoundRect(containerRect, cornerRadiusPx, cornerRadiusPx,
                        android.graphics.Path.Direction.CW)

                    // Background fill
                    codeBlockPaint.color = CodeBlockBorderSpan.bgColor(dark)
                    codeBlockPaint.style = Paint.Style.FILL
                    codeBlockPaint.strokeWidth = 0f
                    canvas.drawPath(path, codeBlockPaint)

                    // Border stroke
                    codeBlockPaint.color = CodeBlockBorderSpan.borderColor(dark)
                    codeBlockPaint.style = Paint.Style.STROKE
                    codeBlockPaint.strokeWidth = 1f * density
                    canvas.drawPath(path, codeBlockPaint)
                }
            }
        }

        // Draw inline code bordered containers (tight-fitting around glyph bounds)
        if (spannable != null && textLayout != null) {
            val inlineCodeSpans = spannable.getSpans(0, spannable.length, InlineCodeSpan::class.java)
            for (span in inlineCodeSpans) {
                val ss = spannable.getSpanStart(span)
                val se = spannable.getSpanEnd(span)
                if (ss < 0 || se < 0 || ss >= se) continue
                // Skip if inside a code block (code block takes precedence)
                val overlapsCodeBlock = spannable.getSpans(ss, se, CodeBlockBorderSpan::class.java).isNotEmpty()
                if (overlapsCodeBlock) continue

                val firstLine = textLayout.getLineForOffset(ss)
                val lastLine = textLayout.getLineForOffset(se)

                val cornerRadius = 4f * density
                val hPad = 4f * density
                val vPad = 2f * density

                val bgColor = inlineCodeBackgroundColor
                    ?: if (isDarkMode()) Color.parseColor("#272727") else Color.parseColor("#F5F5F5")
                val borderColor = inlineCodeBorderColor
                    ?: if (isDarkMode()) Color.parseColor("#383838") else Color.parseColor("#E8E8E8")

                // Draw per-line containers (Slack-style: each line gets its own rounded rect)
                for (line in firstLine..lastLine) {
                    val lineStart = textLayout.getLineStart(line)
                    val lineEnd = textLayout.getLineEnd(line)
                    // Intersect with the inline code span range
                    val drawStart = maxOf(ss, lineStart)
                    val drawEnd = minOf(se, lineEnd)
                    if (drawStart >= drawEnd) continue

                    val leftX = textLayout.getPrimaryHorizontal(drawStart) + paddingLeft - hPad
                    val rightX = textLayout.getPrimaryHorizontal(drawEnd) + paddingLeft + hPad
                    val topY = textLayout.getLineTop(line).toFloat() + textBaseY - vPad
                    val bottomY = textLayout.getLineBottom(line).toFloat() + textBaseY + vPad

                    val rect = android.graphics.RectF(leftX, topY, rightX, bottomY)

                    // Background fill
                    codeBlockPaint.color = bgColor
                    codeBlockPaint.style = Paint.Style.FILL
                    canvas.drawRoundRect(rect, cornerRadius, cornerRadius, codeBlockPaint)

                    // Border stroke
                    codeBlockPaint.color = borderColor
                    codeBlockPaint.style = Paint.Style.STROKE
                    codeBlockPaint.strokeWidth = 1f * density
                    canvas.drawRoundRect(rect, cornerRadius, cornerRadius, codeBlockPaint)
                }
            }
        }

        // Draw blockquote vertical bars (continuous bar for merged adjacent quote lines)
        // Same pattern as iOS: ▎ character is made invisible, bar is custom-drawn
        if (textLayout != null) {
            val plainText = text?.toString() ?: ""
            val lines = plainText.split("\n")
            // Merge adjacent quote lines into regions (startOffset, endOffset)
            val quoteRegions = mutableListOf<Pair<Int, Int>>()
            var offset = 0
            for (line in lines) {
                val lineEnd = offset + line.length
                if (line.startsWith("▎")) {
                    if (quoteRegions.isNotEmpty() && offset <= quoteRegions.last().second + 1) {
                        quoteRegions[quoteRegions.lastIndex] = Pair(quoteRegions.last().first, lineEnd)
                    } else {
                        quoteRegions.add(Pair(offset, lineEnd))
                    }
                }
                offset = lineEnd + 1 // +1 for the \n
            }

            for ((regionStart, regionEnd) in quoteRegions) {
                val clampedEnd = regionEnd.coerceAtMost((text?.length ?: 0) - 1).coerceAtLeast(regionStart)
                val firstLine = textLayout.getLineForOffset(regionStart)
                val lastLine = textLayout.getLineForOffset(clampedEnd)

                val topY = textLayout.getLineTop(firstLine).toFloat() + textBaseY
                val bottomY = textLayout.getLineBottom(lastLine).toFloat() + textBaseY

                val barWidth = 3f * density
                val barX = paddingLeft.toFloat() + 1f
                val barRadius = barWidth / 2f

                val barRect = android.graphics.RectF(barX, topY, barX + barWidth, bottomY)
                codeBlockPaint.isAntiAlias = true
                codeBlockPaint.style = Paint.Style.FILL
                codeBlockPaint.strokeWidth = 0f
                codeBlockPaint.color = if (isDarkMode()) Color.parseColor("#DCDCDC") else Color.parseColor("#DCDCDC")
                canvas.drawRoundRect(barRect, barRadius, barRadius, codeBlockPaint)
            }
        }

        // Draw text on top of code block containers
        super.onDraw(canvas)

        // Draw flat variant bottom border on top of everything
        if (drawBottomBorder) {
            val y = scrollY + height.toFloat() - bottomBorderPaint.strokeWidth / 2
            canvas.drawLine(0f, y, width.toFloat(), y, bottomBorderPaint)
        }
    }

    // Synchronous style detection - emits current active styles to JS
    private fun emitActiveStyles() {
        val start = selectionStart
        val end = selectionEnd
        val spannable = text as? Spanned

        var hasBold = false
        var hasItalic = false
        var hasUnderline = false
        var hasStrikethrough = false
        var hasCode = false
        var hasHighlight = false
        var blockType = "paragraph"
        var alignment = "left"

        if (spannable != null && start <= end) {
            // For cursor position (no selection), check spans touching the cursor from the left
            // This ensures we detect bold/italic when cursor is at the end of a styled span
            // But when text is empty, skip span detection entirely
            val textLen = spannable.length
            if (textLen == 0) {
                // Empty text — no spans to detect, only pending styles matter
            } else {
                val checkStart = if (start == end && start > 0) start - 1 else start
                val checkEnd = end.coerceAtLeast(start + 1).coerceAtMost(textLen)

            // Check for style spans
            spannable.getSpans(checkStart, checkEnd, StyleSpan::class.java).forEach { span ->
                when (span.style) {
                    Typeface.BOLD -> hasBold = true
                    Typeface.ITALIC -> hasItalic = true
                    Typeface.BOLD_ITALIC -> {
                        hasBold = true
                        hasItalic = true
                    }
                }
            }

            hasUnderline = spannable.getSpans(checkStart, checkEnd, UnderlineSpan::class.java).isNotEmpty()
            hasStrikethrough = spannable.getSpans(checkStart, checkEnd, StrikethroughSpan::class.java).isNotEmpty()
            hasCode = spannable.getSpans(checkStart, checkEnd, InlineCodeSpan::class.java).isNotEmpty()

            // When cursor is on a new line after Enter, checkStart points to the
            // newline char which has no InlineCodeSpan (splitInlineCodeSpansAtNewlines
            // strips it). Check the character before the newline for the marker.
            if (!hasCode && start == end && start >= 2) {
                val prevChar = spannable[start - 1]
                if (prevChar == '\n') {
                    hasCode = spannable.getSpans(start - 2, start - 1, InlineCodeSpan::class.java).isNotEmpty()
                }
            }

            // Check highlight (but not code background)
            val bgSpans = spannable.getSpans(checkStart, checkEnd, BackgroundColorSpan::class.java)
            hasHighlight = bgSpans.any {
                val color = it.backgroundColor
                color == Color.parseColor("#80FFFF00") || color == Color.YELLOW
            }

            // Check block type from line content
            val lineText = getCurrentLineText()
            val hasQuotePrefix = lineText.startsWith("▎ ")
            // For combined blockquote+list, strip the quote prefix before checking list type
            val contentAfterQuote = if (hasQuotePrefix) lineText.substring(2) else lineText
            blockType = when {
                hasQuotePrefix && contentAfterQuote.startsWith("• ") -> "quoteBullet"
                hasQuotePrefix && contentAfterQuote.matches(Regex("^\\d+\\.\\s.*")) -> "quoteNumbered"
                contentAfterQuote.startsWith("• ") -> "bullet"
                contentAfterQuote.matches(Regex("^\\d+\\.\\s.*")) -> "numbered"
                lineText.startsWith("☐ ") || lineText.startsWith("☑ ") -> "checklist"
                hasQuotePrefix -> "quote"
                spannable.getSpans(checkStart, checkEnd, RelativeSizeSpan::class.java).any { it.sizeChange > 1.2f } -> "heading"
                else -> "paragraph"
            }

            // Check alignment
            spannable.getSpans(checkStart, checkEnd, AlignmentSpan.Standard::class.java).firstOrNull()?.let { span ->
                alignment = when (span.alignment) {
                    Layout.Alignment.ALIGN_CENTER -> "center"
                    Layout.Alignment.ALIGN_OPPOSITE -> "right"
                    else -> "left"
                }
            }
            } // end else (textLen > 0)
        }

        val map = Arguments.createMap()
        val boldActive = (hasBold || pendingStyles.contains("bold")) && !explicitlyOffStyles.contains("bold")
        val italicActive = (hasItalic || pendingStyles.contains("italic")) && !explicitlyOffStyles.contains("italic")
        val underlineActive = (hasUnderline || pendingStyles.contains("underline")) && !explicitlyOffStyles.contains("underline")
        val strikethroughActive = (hasStrikethrough || pendingStyles.contains("strikethrough")) && !explicitlyOffStyles.contains("strikethrough")
        map.putBoolean("bold", boldActive)
        map.putBoolean("italic", italicActive)
        map.putBoolean("underline", underlineActive)
        map.putBoolean("strikethrough", strikethroughActive)
        val codeActive = (hasCode || pendingStyles.contains("code") || pendingStyles.contains("codeBlock")) && !explicitlyOffStyles.contains("code")
        // Detect code block separately for Slack-style toolbar hiding
        var hasCodeBlock = false
        if (spannable != null && start <= end) {
            val textLen = spannable.length
            if (textLen > 0) {
                val checkStart = if (start == end && start > 0) start - 1 else start
                val checkEnd = end.coerceAtLeast(start + 1).coerceAtMost(textLen)
                hasCodeBlock = spannable.getSpans(checkStart, checkEnd, CodeBlockBorderSpan::class.java).isNotEmpty()
            }
        }
        val codeBlockActive = hasCodeBlock || pendingStyles.contains("codeBlock")

        // Autocorrect/autocapitalize/spellcheck follow the caret: off in code, platform
        // default everywhere else.
        setCodeContext(codeActive || codeBlockActive)

        map.putBoolean("code", codeActive)
        map.putBoolean("codeBlock", codeBlockActive)
        map.putBoolean("highlight", hasHighlight)
        map.putString("blockType", blockType)
        map.putString("alignment", alignment)
        sendEvent("onActiveStylesChange", map)

        // Also update inline toolbar button states if present
    }

    private val hideToolbarRunnable = Runnable {
        android.util.Log.d("RichTextEditor", "hideToolbarRunnable: selectionStart=$selectionStart, selectionEnd=$selectionEnd")
        if (selectionStart == selectionEnd) {
            hideToolbar()
        }
    }

    private fun showToolbarAtSelection() {
        if (!showToolbar || toolbarPopup == null) return
        if (!isAttachedToWindow) return

        val selStart = selectionStart
        val selEnd = selectionEnd
        if (selStart == selEnd) return

        try {
            val textLayout = layout ?: return

            // Get the line of the end of selection
            val endLine = textLayout.getLineForOffset(selEnd)
            val lineBottom = textLayout.getLineBottom(endLine)

            val location = IntArray(2)
            getLocationOnScreen(location)

            val toolbarWidth = (300 * density).toInt()
            val toolbarHeight = (52 * density).toInt()

            // Center horizontally
            val screenWidth = context.resources.displayMetrics.widthPixels
            var x = (screenWidth - toolbarWidth) / 2

            // Ensure x is not negative
            if (x < 0) x = 0

            // Position BELOW the selection (like iOS: convertedRect.maxY + 8)
            var y = location[1] + lineBottom + paddingTop + (8 * density).toInt()

            // If toolbar would go off screen at bottom, show above selection
            val screenHeight = context.resources.displayMetrics.heightPixels
            if (y + toolbarHeight > screenHeight - (100 * density).toInt()) {
                val startLine = textLayout.getLineForOffset(selStart)
                val lineTop = textLayout.getLineTop(startLine)
                y = location[1] + lineTop + paddingTop - toolbarHeight - (8 * density).toInt()
            }

            // Ensure y is not negative
            if (y < 0) y = (8 * density).toInt()

            android.util.Log.d("RichTextEditor", "Showing toolbar at x=$x, y=$y, width=$toolbarWidth, height=$toolbarHeight")

            toolbarPopup?.width = toolbarWidth
            toolbarPopup?.height = toolbarHeight

            // Use windowToken to get the activity's window
            val token = windowToken
            if (token == null) {
                android.util.Log.e("RichTextEditor", "Window token is null, cannot show popup")
                return
            }

            if (toolbarPopup?.isShowing == true) {
                toolbarPopup?.update(x, y, toolbarWidth, toolbarHeight)
            } else {
                // Show at the root window using absolute coordinates
                val decorView = (context as? android.app.Activity)?.window?.decorView
                    ?: rootView
                toolbarPopup?.showAtLocation(decorView, Gravity.NO_GRAVITY, x, y)
                android.util.Log.d("RichTextEditor", "Toolbar popup shown: ${toolbarPopup?.isShowing}")
            }
        } catch (e: Exception) {
            android.util.Log.e("RichTextEditor", "Error showing toolbar", e)
            e.printStackTrace()
        }
    }

    private fun hideToolbar() {
        try {
            if (toolbarPopup?.isShowing == true) {
                android.util.Log.d("RichTextEditor", "Hiding toolbar")
                toolbarPopup?.dismiss()
            }
        } catch (e: Exception) {
            android.util.Log.e("RichTextEditor", "Error hiding toolbar", e)
            e.printStackTrace()
        }
    }

    private fun updateToolbarButtonStates() {
        val start = selectionStart
        val end = selectionEnd
        if (start == end || text == null) {
            // No selection — delegate to emitActiveStyles which handles
            // pending styles, explicitly-off styles, AND actual spans at cursor
            emitActiveStyles()
            return
        }

        val spannable = text as? Spanned ?: return

        var hasBold = false
        var hasItalic = false
        var hasUnderline = false
        var hasStrikethrough = false
        var hasCode = false
        var hasHighlight = false

        // Check for style spans in selection
        spannable.getSpans(start, end, StyleSpan::class.java).forEach { span ->
            when (span.style) {
                Typeface.BOLD -> hasBold = true
                Typeface.ITALIC -> hasItalic = true
                Typeface.BOLD_ITALIC -> {
                    hasBold = true
                    hasItalic = true
                }
            }
        }

        hasUnderline = spannable.getSpans(start, end, UnderlineSpan::class.java).isNotEmpty()
        hasStrikethrough = spannable.getSpans(start, end, StrikethroughSpan::class.java).isNotEmpty()
        hasCode = spannable.getSpans(start, end, InlineCodeSpan::class.java).isNotEmpty()
        hasHighlight = spannable.getSpans(start, end, BackgroundColorSpan::class.java).isNotEmpty()

        // Check for list prefixes
        val lineText = getCurrentLineText()
        val hasBullet = lineText.startsWith("• ") || lineText.startsWith("▎ • ")
        val hasNumbered = lineText.matches(Regex("^\\d+\\.\\s.*")) || lineText.matches(Regex("^▎ \\d+\\.\\s.*"))
        val hasQuote = lineText.startsWith("▎ ")
        val hasChecklist = lineText.startsWith("☐ ") || lineText.startsWith("☑ ")

        // Check alignment
        var alignLeft = true
        var alignCenter = false
        var alignRight = false

        spannable.getSpans(start, end, AlignmentSpan.Standard::class.java).firstOrNull()?.let { span ->
            when (span.alignment) {
                Layout.Alignment.ALIGN_CENTER -> {
                    alignLeft = false
                    alignCenter = true
                }
                Layout.Alignment.ALIGN_OPPOSITE -> {
                    alignLeft = false
                    alignRight = true
                }
                else -> {}
            }
        }

        // Detect code block state to disable inline format buttons (Req 5.1, 5.3)
        val codeBlockActive = isCursorInCodeBlock()


    }

    private fun getCurrentLineText(): String {
        val text = text?.toString() ?: return ""
        val cursorPos = selectionStart
        if (cursorPos < 0) return ""

        var lineStart = cursorPos
        while (lineStart > 0 && text[lineStart - 1] != '\n') {
            lineStart--
        }

        var lineEnd = cursorPos
        while (lineEnd < text.length && text[lineEnd] != '\n') {
            lineEnd++
        }

        return text.substring(lineStart, lineEnd)
    }

    /**
     * Returns true if the cursor (or selection) is currently inside a code block.
     * Used to disable inline formatting when code block is active (Req 5.1, 5.2).
     */
    private fun isCursorInCodeBlock(): Boolean {
        val spannable = text as? Spanned ?: return false
        val textLen = spannable.length
        if (textLen == 0) return false
        val start = selectionStart
        val end = selectionEnd
        if (start < 0) return false
        val checkStart = if (start == end && start > 0) start - 1 else start
        val checkEnd = end.coerceAtLeast(start + 1).coerceAtMost(textLen)
        return spannable.getSpans(checkStart, checkEnd, CodeBlockBorderSpan::class.java).isNotEmpty()
                || pendingStyles.contains("codeBlock")
    }

    /**
     * Detects markdown shortcut patterns (e.g., **text**, _text_, ~~text~~, `text`, <u>text</u>)
     * ending at the cursor position and converts them to live rich text formatting.
     * Skips conversion inside code blocks (Req 20.6).
     */
    private fun detectMarkdownShortcut(s: Editable?) {
        if (s == null || s.isEmpty()) return
        val cursorPos = selectionStart
        if (cursorPos <= 0) return

        // Skip if inside a code block (Req 20.6)
        if (isCursorInCodeBlock()) return

        val fullText = s.toString()

        // Pre-check: detect if there is an unmatched opening ``` in the text
        // before the cursor. If so, suppress single-backtick inline code matching
        // entirely — the user is in the middle of typing a triple-backtick code
        // block and we must wait for the closing ``` to complete.
        val textBeforeCursor = fullText.substring(0, cursorPos)
        val hasUnmatchedTripleBacktick: Boolean = run {
            var count = 0
            var i = 0
            while (i < textBeforeCursor.length) {
                if (textBeforeCursor[i] == '`' && i + 2 < textBeforeCursor.length
                    && textBeforeCursor[i + 1] == '`' && textBeforeCursor[i + 2] == '`') {
                    count++
                    i += 3
                } else {
                    i++
                }
            }
            count % 2 != 0
        }

        // Patterns ordered longest-delimiter-first so that multi-char delimiters
        // (***,  **, ~~, __) are checked before single-char ones (*, _, ~, `)
        // to avoid false matches. Slack-style: *bold*, **bold**, ***bold+italic***,
        // _italic_, ~strike~, ~~strike~~, `code`.
        data class MdPattern(val open: String, val close: String, val styles: List<String>)
        val patterns = listOf(
            MdPattern("***", "***", listOf("bold", "italic")),
            MdPattern("```", "```", listOf("codeBlock")),
            MdPattern("**", "**", listOf("bold")),
            MdPattern("~~", "~~", listOf("strikethrough")),
            MdPattern("<u>", "</u>", listOf("underline")),
            MdPattern("*", "*", listOf("bold")),
            MdPattern("~", "~", listOf("strikethrough")),
            MdPattern("`", "`", listOf("code")),
            MdPattern("_", "_", listOf("italic")),
        )

        for (pattern in patterns) {
            val closeLen = pattern.close.length
            val openLen = pattern.open.length

            // Skip single-backtick inline code when an unmatched ``` exists —
            // the user is typing a triple-backtick code block.
            if (pattern.open == "`" && pattern.close == "`" && hasUnmatchedTripleBacktick) continue

            // Text must end with the closing delimiter at cursor position
            if (cursorPos < closeLen) continue
            val closeStart = cursorPos - closeLen
            val closeStr = fullText.substring(closeStart, cursorPos)
            if (closeStr != pattern.close) continue

            // Skip single-backtick inline code when the line actually ends with
            // triple backticks — let detectBlockMarkdownShortcut handle it instead.
            if (pattern.open == "`" && cursorPos >= 3) {
                val last3 = fullText.substring(cursorPos - 3, cursorPos)
                if (last3 == "```") continue
            }

            // For backtick-based patterns, enforce exact delimiter boundaries:
            // the closing delimiter must not be immediately preceded by an extra
            // backtick (beyond the delimiter itself), which would mean the user
            // typed more backticks than the pattern expects (e.g., ```` instead of ```).
            if ((pattern.open == "`" || pattern.open == "```") && closeStart > 0) {
                if (fullText[closeStart - 1] == '`') continue
            }

            // Search backwards for the opening delimiter before the closing one
            val searchEnd = closeStart
            if (searchEnd <= openLen - 1) continue

            var found = false
            var openStart = searchEnd - 1
            while (openStart >= openLen - 1) {
                val candidateStart = openStart - (openLen - 1)
                val candidateStr = fullText.substring(candidateStart, candidateStart + openLen)
                if (candidateStr == pattern.open) {
                    val contentStart = candidateStart + openLen
                    val contentLength = searchEnd - contentStart
                    if (contentLength > 0) {
                        val content = fullText.substring(contentStart, searchEnd)
                        // Content must not be only whitespace
                        if (content.isNotBlank()) {
                            // For inline code, skip if content is only backticks —
                            // prevents `(`)` from matching when user types ```
                            if (pattern.open == "`" && content.all { it == '`' }) {
                                break
                            }
                            // For backtick-based patterns, enforce exact opening delimiter:
                            // skip if the character before the opening delimiter is also a
                            // backtick (e.g., ```` instead of ``` or `` instead of `).
                            if ((pattern.open == "`" || pattern.open == "```") && candidateStart > 0) {
                                if (fullText[candidateStart - 1] == '`') break
                            }
                            // For single backtick, skip if the opening backtick is part of a
                            // triple-backtick sequence (e.g., ```asdfasdf` should not match)
                            if (pattern.open == "`" && candidateStart >= 2) {
                                val preceding2 = fullText.substring(candidateStart - 2, candidateStart)
                                if (preceding2 == "``") break
                            }
                            // Found a valid match — replace delimiters with formatted text
                            isInternalChange = true

                            // Delete closing delimiter
                            s.delete(closeStart, cursorPos)
                            // Delete opening delimiter
                            s.delete(candidateStart, candidateStart + openLen)

                            // The content is now at candidateStart with length contentLength
                            val fmtStart = candidateStart
                            val fmtEnd = candidateStart + contentLength

                            // Apply all formatting spans for this pattern
                            for (style in pattern.styles) {
                                when (style) {
                                    "bold" -> s.setSpan(
                                        StyleSpan(Typeface.BOLD), fmtStart, fmtEnd,
                                        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                                    )
                                    "italic" -> s.setSpan(
                                        StyleSpan(Typeface.ITALIC), fmtStart, fmtEnd,
                                        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                                    )
                                    "underline" -> s.setSpan(
                                        UnderlineSpan(), fmtStart, fmtEnd,
                                        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                                    )
                                    "strikethrough" -> s.setSpan(
                                        StrikethroughSpan(), fmtStart, fmtEnd,
                                        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                                    )
                                    "code" -> {
                                        val fontSize = inlineCodeFontSize ?: 12f
                                        val codeColor = inlineCodeTextColor ?: Color.parseColor("#6852D6")
                                        s.setSpan(
                                            InlineCodeSpan(), fmtStart, fmtEnd,
                                            Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                                        )
                                        s.setSpan(
                                            AbsoluteSizeSpan(fontSize.toInt(), true), fmtStart, fmtEnd,
                                            Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                                        )
                                        s.setSpan(
                                            ForegroundColorSpan(codeColor), fmtStart, fmtEnd,
                                            Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                                        )
                                    }
                                    "codeBlock" -> {
                                        // Remove any existing inline styles
                                        s.getSpans(fmtStart, fmtEnd, StyleSpan::class.java)
                                            .forEach { s.removeSpan(it) }
                                        s.getSpans(fmtStart, fmtEnd, UnderlineSpan::class.java)
                                            .forEach { s.removeSpan(it) }
                                        s.getSpans(fmtStart, fmtEnd, StrikethroughSpan::class.java)
                                            .forEach { s.removeSpan(it) }
                                        s.getSpans(fmtStart, fmtEnd, InlineCodeSpan::class.java)
                                            .forEach { s.removeSpan(it) }
                                        s.getSpans(fmtStart, fmtEnd, ForegroundColorSpan::class.java)
                                            .forEach { s.removeSpan(it) }
                                        // Apply code block spans: monospace + border
                                        s.setSpan(
                                            TypefaceSpan("monospace"), fmtStart, fmtEnd,
                                            Spanned.SPAN_EXCLUSIVE_INCLUSIVE
                                        )
                                        s.setSpan(
                                            CodeBlockBorderSpan(density), fmtStart, fmtEnd,
                                            Spanned.SPAN_EXCLUSIVE_INCLUSIVE
                                        )
                                        // Apply dark-mode-aware text color for readability
                                        val cbColor = if (isDarkMode()) Color.parseColor("#E0E0E0") else Color.parseColor("#333333")
                                        s.setSpan(
                                            ForegroundColorSpan(cbColor), fmtStart, fmtEnd,
                                            Spanned.SPAN_EXCLUSIVE_INCLUSIVE
                                        )
                                    }
                                }
                            }

                            // Place cursor after the formatted text
                            setSelection(fmtEnd)

                            // For code block shortcut, preserve pending style so typing continues in code block
                            if (pattern.styles.contains("codeBlock")) {
                                pendingStyles.clear()
                                pendingStyles.add("codeBlock")
                                pendingStylesInsertPos = fmtEnd
                            } else {
                                // Clear pending styles so subsequent typing is unstyled
                                pendingStyles.clear()
                                pendingStylesInsertPos = -1
                            }
                            explicitlyOffStyles.clear()

                            isInternalChange = false
                            invalidate()
                            found = true
                        }
                    }
                    break // Found the opening delimiter
                }
                openStart--
            }
            if (found) return
        }

        // --- HTML underline: <u>text</u> ---
        detectHtmlUnderlineShortcut(s, cursorPos)

        // --- Link: [text](url) ---
        detectLinkShortcut(s, cursorPos)

        // --- Block-level shortcuts: ```, - , 1. , > ---
        detectBlockMarkdownShortcut(s, cursorPos)
    }

    /// Detects <u>text</u> pattern and converts to underline formatting.
    private fun detectHtmlUnderlineShortcut(s: Editable, cursorPos: Int) {
        val fullText = s.toString()
        val closeTag = "</u>"
        if (cursorPos < closeTag.length) return
        val closeStart = cursorPos - closeTag.length
        val closeStr = fullText.substring(closeStart, cursorPos)
        if (!closeStr.equals(closeTag, ignoreCase = true)) return

        // Search backwards for <u>
        val openTag = "<u>"
        val searchArea = fullText.substring(0, closeStart)
        val openIdx = searchArea.lastIndexOf(openTag, ignoreCase = true)
        if (openIdx < 0) return

        val contentStart = openIdx + openTag.length
        val contentLength = closeStart - contentStart
        if (contentLength <= 0) return
        val content = fullText.substring(contentStart, closeStart)
        if (content.isBlank()) return

        isInternalChange = true
        // Delete closing tag
        s.delete(closeStart, cursorPos)
        // Delete opening tag
        s.delete(openIdx, openIdx + openTag.length)

        val fmtStart = openIdx
        val fmtEnd = openIdx + contentLength
        s.setSpan(UnderlineSpan(), fmtStart, fmtEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        setSelection(fmtEnd)
        pendingStyles.clear()
        explicitlyOffStyles.clear()
        pendingStylesInsertPos = -1
        isInternalChange = false
        invalidate()
    }

    /// Detects [text](url) pattern and converts to a styled hyperlink.
    private fun detectLinkShortcut(s: Editable, cursorPos: Int) {
        val fullText = s.toString()
        if (cursorPos < 1) return
        if (fullText[cursorPos - 1] != ')') return

        // Find matching ( before )
        val parenOpen = fullText.lastIndexOf('(', cursorPos - 2)
        if (parenOpen < 0) return

        // Find ]( sequence
        if (parenOpen < 1 || fullText[parenOpen - 1] != ']') return

        // Find matching [ before ]
        val bracketOpen = fullText.lastIndexOf('[', parenOpen - 2)
        if (bracketOpen < 0) return

        val linkText = fullText.substring(bracketOpen + 1, parenOpen - 1)
        val url = fullText.substring(parenOpen + 1, cursorPos - 1)
        if (linkText.isEmpty() || url.isEmpty()) return

        // Normalize URL
        val normalizedUrl = if (!url.lowercase().startsWith("http://") &&
            !url.lowercase().startsWith("https://") &&
            !url.lowercase().startsWith("mailto:") &&
            !url.lowercase().startsWith("tel:")) {
            "https://$url"
        } else url

        isInternalChange = true
        // Delete the entire [text](url) pattern
        s.delete(bracketOpen, cursorPos)

        // Insert styled link text
        val linkSpannable = SpannableStringBuilder(linkText)
        linkSpannable.setSpan(NoUnderlineURLSpan(normalizedUrl), 0, linkText.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        linkSpannable.setSpan(ForegroundColorSpan(Color.parseColor("#2196F3")), 0, linkText.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        s.insert(bracketOpen, linkSpannable)

        setSelection(bracketOpen + linkText.length)
        pendingStyles.clear()
        explicitlyOffStyles.clear()
        pendingStylesInsertPos = -1
        isInternalChange = false
        invalidate()
    }

    /// Detects block-level markdown shortcuts at the start of a line:
    /// ``` → code block, - → bullet list, 1. → numbered list, > → blockquote
    private fun detectBlockMarkdownShortcut(s: Editable, cursorPos: Int) {
        val fullText = s.toString()

        // Find current line start
        var lineStart = cursorPos
        while (lineStart > 0 && fullText[lineStart - 1] != '\n') lineStart--

        val lineText = fullText.substring(lineStart, cursorPos)

        // Triple backtick → code block
        // Only trigger if the backticks are plain (no InlineCodeSpan) — leftover
        // formatted backticks from a previous inline code conversion should not count.
        if (lineText == "```") {
            val hasInlineCodeSpan = s.getSpans(lineStart, cursorPos, InlineCodeSpan::class.java).isNotEmpty()
            if (!hasInlineCodeSpan && !suppressCodeBlockShortcut) {
                isInternalChange = true
                s.delete(lineStart, cursorPos)
                isInternalChange = false
                suppressCodeBlockShortcut = true
                toggleCodeBlock()
                saveToUndoStack()
                return
            }
        }

        // "- " → bullet list
        if (lineText == "- ") {
            isInternalChange = true
            s.delete(lineStart, cursorPos)
            isInternalChange = false
            onBulletListClick()
            saveToUndoStack()
            return
        }

        // "1. " → numbered list
        if (lineText.matches(Regex("^\\d+\\. $"))) {
            isInternalChange = true
            s.delete(lineStart, cursorPos)
            isInternalChange = false
            applyNumberedList()
            saveToUndoStack()
            return
        }

        // "> " → blockquote
        if (lineText == "> ") {
            isInternalChange = true
            s.delete(lineStart, cursorPos)
            isInternalChange = false
            toggleQuote()
            saveToUndoStack()
            return
        }
    }

    private fun getLineRange(): Pair<Int, Int> {
        val text = text?.toString() ?: return Pair(0, 0)
        val start = selectionStart
        val end = selectionEnd

        var lineStart = start
        while (lineStart > 0 && text[lineStart - 1] != '\n') {
            lineStart--
        }

        var lineEnd = end
        while (lineEnd < text.length && text[lineEnd] != '\n') {
            lineEnd++
        }

        return Pair(lineStart, lineEnd)
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        // When the gesture detector handles a link tap (onSingleTapUp returns true),
        // consume the event so the default URL-opening behavior is suppressed.
        if (gestureDetector.onTouchEvent(event)) {
            return true
        }
        return super.onTouchEvent(event)
    }

    /// Checks whether a string looks like a URL.
    /// Accepts any scheme with a host, www. prefixed strings, and bare
    /// domain names (e.g. "example.com"). insertLink normalizes schemeless
    /// URLs by prepending https://.
    private fun isURL(string: String): Boolean {
        val trimmed = string.trim()
        if (trimmed.isEmpty() || trimmed.contains(" ")) return false

        // 1. Any scheme:// with a host (http, https, ftp, custom, etc.)
        try {
            val uri = java.net.URI(trimmed)
            if (uri.scheme != null && uri.host != null) return true
        } catch (_: Exception) {}

        // 2. Bare domain: contains a dot, no spaces, and parses as valid
        //    when https:// is prepended (e.g. "example.com", "sub.example.co.uk/path")
        if (trimmed.contains(".")) {
            return try {
                val uri = java.net.URI("https://$trimmed")
                uri.host != null
            } catch (_: Exception) { false }
        }
        return false
    }

    // Override copy/paste to handle rich content and URL-on-selected-text link embedding
    // (Req 18.1, 18.2, 18.3, 1.1, 1.2, 1.3)
    override fun onTextContextMenuItem(id: Int): Boolean {
        // Rich copy: place both HTML and markdown fallback on clipboard (Req 18.1)
        if (id == android.R.id.copy || id == android.R.id.cut) {
            val s = text as? Spanned
            val start = selectionStart
            val end = selectionEnd
            if (s != null && start >= 0 && end > start && end <= s.length) {
                val selectedSpan = s.subSequence(start, end) as Spanned
                val htmlContent = Html.toHtml(SpannableStringBuilder(selectedSpan), Html.TO_HTML_PARAGRAPH_LINES_INDIVIDUAL)
                val markdownContent = spannedToMarkdown(selectedSpan)

                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                if (clipboard != null) {
                    val clipData = ClipData.newHtmlText("rich text", markdownContent, htmlContent)
                    clipboard.setPrimaryClip(clipData)

                    // For cut, also remove the selected text
                    if (id == android.R.id.cut) {
                        val editable = text as? Editable ?: return true
                        isInternalChange = true
                        editable.delete(start, end)
                        isInternalChange = false
                        sendContentChangeWithDelta()
                        saveToUndoStack()
                    }
                    return true
                }
            }
            return super.onTextContextMenuItem(id)
        }

        // Rich paste: check for HTML first, then URL detection, then plain text
        // (Req 18.2, 18.3, 1.1, 1.2, 1.3)
        if (id == android.R.id.paste || id == android.R.id.pasteAsPlainText) {
            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
            val clip = clipboard?.primaryClip

            // 0. Our own rich-text wire format, carried in the clip's extras. Checked before
            //    HTML because a CometChat copy sets plain text only — the colour lives here,
            //    and the plain-text type is deliberately clean so other apps never see markup.
            val wireText = clip?.description?.extras
                ?.getString(CometChatClipboardModule.EXTRA_RICH_TEXT)
            if (!wireText.isNullOrEmpty()) {
                val s = text as? Editable
                if (s != null) {
                    val start = selectionStart
                    val end = selectionEnd
                    isInternalChange = true
                    s.replace(
                        start.coerceAtMost(end),
                        start.coerceAtLeast(end),
                        markdownToSpannable(wireText)
                    )
                    isInternalChange = false
                    sendContentChangeWithDelta()
                    saveToUndoStack()
                    return true
                }
            }

            // 1. Check for HTML rich content first (Req 18.2)
            if (clip != null && clip.description.hasMimeType("text/html")) {
                val htmlText = clip.getItemAt(0)?.htmlText
                if (htmlText != null && htmlText.isNotEmpty()) {
                    val richSpanned = Html.fromHtml(htmlText, Html.FROM_HTML_MODE_COMPACT)
                    if (richSpanned.isNotEmpty()) {
                        val s = text as? Editable ?: return super.onTextContextMenuItem(id)
                        val start = selectionStart
                        val end = selectionEnd

                        isInternalChange = true
                        s.replace(start.coerceAtMost(end), start.coerceAtLeast(end), richSpanned)
                        isInternalChange = false

                        sendContentChangeWithDelta()
                        saveToUndoStack()
                        return true
                    }
                }
            }

            // 2. Fall through to URL-on-selected-text link embedding and plain text
            val pastedString = clip?.getItemAt(0)?.text?.toString()

            if (pastedString != null) {
                val s = text as? Editable ?: return super.onTextContextMenuItem(id)
                val start = selectionStart
                val end = selectionEnd
                val hasSelection = start != end && start >= 0 && end >= 0

                if (isURL(pastedString) && hasSelection) {
                    // URL on clipboard + text selected → create a styled hyperlink
                    // (not raw markdown) using the existing insertLink method
                    val selectedText = s.subSequence(start, end).toString()
                    val trimmedURL = pastedString.trim()
                    // insertLink replaces the current selection, so ensure it's set
                    setSelection(start.coerceAtMost(end), start.coerceAtLeast(end))
                    insertLink(trimmedURL, selectedText)
                    saveToUndoStack()
                    return true
                }

                // Detect markdown content (links, bold, italic, etc.) and convert
                // to rich spannable. This handles copy from message bubbles which
                // place markdown plain text on the clipboard (no HTML).
                if (looksLikeMarkdown(pastedString)) {
                    val result = markdownToSpannable(pastedString)
                    val insertPos = start.coerceAtMost(end)
                    isInternalChange = true
                    s.replace(insertPos, start.coerceAtLeast(end), result)
                    isInternalChange = false
                    sendContentChangeWithDelta()
                    saveToUndoStack()
                    return true
                }

                // Plain text fallback (Req 18.3)
                isInternalChange = true
                s.replace(start.coerceAtMost(end), start.coerceAtLeast(end), pastedString)
                isInternalChange = false
                sendContentChangeWithDelta()
                saveToUndoStack()
                return true
            }
        }
        return super.onTextContextMenuItem(id)
    }

    /// Converts a Spanned substring to a markdown string for clipboard fallback.
    /// Handles bold, italic, underline, strikethrough, inline code, and
    /// block-level prefixes (bullet, numbered, quote).
    /// Empty list items are preserved as `- ` or `N. ` markers (Req 8.1).
    private fun spannedToMarkdown(spanned: Spanned): String {
        val text = spanned.toString().replace("\u200B", "")
        if (text.isEmpty()) return ""

        val markerMap = mapOf(
            "bold" to "**", "italic" to "_",
            "strikethrough" to "~~", "code" to "`"
        )
        // Underline uses asymmetric HTML tags <u>...</u>
        val openMarkerMap = markerMap + mapOf("underline" to "<u>")
        val closeMarkerMap = markerMap + mapOf("underline" to "</u>")
        val styleOrder = listOf("bold", "underline", "strikethrough", "italic", "code")
        val numberedRegex = Regex("^(\\d+)\\.\\s")

        // Process line-by-line to handle block-level prefixes (Req 8.1)
        val lines = text.split("\n")
        val resultLines = mutableListOf<String>()
        var charOffset = 0

        for (line in lines) {
            var blockPrefix = ""
            var contentStart = 0

            // Detect and convert native block prefixes to markdown format
            when {
                line.startsWith("• ") -> {
                    blockPrefix = "- "
                    contentStart = 2
                }
                line.startsWith("▎ ") -> {
                    blockPrefix = "> "
                    contentStart = 2
                }
                else -> {
                    val match = numberedRegex.find(line)
                    if (match != null) {
                        val num = match.groupValues[1]
                        blockPrefix = "$num. "
                        contentStart = match.value.length
                    }
                }
            }

            val content = line.substring(contentStart)

            // If content is empty, just output the markdown prefix (preserves empty list items)
            if (content.isEmpty()) {
                resultLines.add(blockPrefix)
                charOffset += line.length + 1
                continue
            }

            // Build style ranges for this line's content
            data class StyleRange(val style: String, val start: Int, val end: Int)
            val styles = mutableListOf<StyleRange>()

            val lineContentStart = charOffset + contentStart
            val lineContentEnd = charOffset + line.length

            if (lineContentStart < spanned.length && lineContentEnd > lineContentStart) {
                val rangeEnd = minOf(lineContentEnd, spanned.length)
                val spans = spanned.getSpans(lineContentStart, rangeEnd, Any::class.java)
                for (span in spans) {
                    val spanStart = maxOf(spanned.getSpanStart(span), lineContentStart) - lineContentStart
                    val spanEnd = minOf(spanned.getSpanEnd(span), rangeEnd) - lineContentStart
                    if (spanEnd <= spanStart) continue
                    when (span) {
                        is URLSpan -> {
                            val url = span.url ?: ""
                            if (url.isNotEmpty()) {
                                styles.add(StyleRange("link:$url", spanStart, spanEnd))
                            }
                        }
                        is StyleSpan -> {
                            when (span.style) {
                                Typeface.BOLD -> styles.add(StyleRange("bold", spanStart, spanEnd))
                                Typeface.ITALIC -> styles.add(StyleRange("italic", spanStart, spanEnd))
                                Typeface.BOLD_ITALIC -> {
                                    styles.add(StyleRange("bold", spanStart, spanEnd))
                                    styles.add(StyleRange("italic", spanStart, spanEnd))
                                }
                            }
                        }
                        is UnderlineSpan -> {
                            // Skip underline if co-located with a URLSpan (links have underline by default)
                            val hasUrlSpan = spanned.getSpans(
                                lineContentStart + spanStart, lineContentStart + spanEnd, URLSpan::class.java
                            ).isNotEmpty()
                            if (!hasUrlSpan) {
                                styles.add(StyleRange("underline", spanStart, spanEnd))
                            }
                        }
                        is StrikethroughSpan -> styles.add(StyleRange("strikethrough", spanStart, spanEnd))
                        is TypefaceSpan -> {
                            if (span.family == "monospace") {
                                styles.add(StyleRange("code", spanStart, spanEnd))
                            }
                        }
                    }
                }
            }

            if (styles.isEmpty()) {
                resultLines.add(blockPrefix + content)
                charOffset += line.length + 1
                continue
            }

            // Separate link styles from non-link styles.
            // Links are rendered as [text](url); non-link styles (bold, italic, etc.)
            // use marker pairs. Both must be applied together so bold+link produces
            // **[text](url)** instead of dropping the bold markers.
            val linkStyles = styles.filter { it.style.startsWith("link:") }
            val nonLinkStyles = styles.filter { !it.style.startsWith("link:") }

            if (nonLinkStyles.isEmpty() && linkStyles.isEmpty()) {
                resultLines.add(blockPrefix + content)
                charOffset += line.length + 1
                continue
            }

            // Apply markers using boundary-based approach, integrating link wrapping
            val boundaries = sortedSetOf(0, content.length)
            for (s in nonLinkStyles) {
                boundaries.add(maxOf(0, s.start))
                boundaries.add(minOf(content.length, s.end))
            }
            // Include link boundaries so segments align with link edges
            for (s in linkStyles) {
                boundaries.add(maxOf(0, s.start))
                boundaries.add(minOf(content.length, s.end))
            }
            val sorted = boundaries.toList()

            val lineResult = StringBuilder()
            val openStack = mutableListOf<String>()

            for (i in 0 until sorted.size - 1) {
                val segStart = sorted[i]
                val segEnd = sorted[i + 1]
                if (segEnd <= segStart) continue

                val segment = content.substring(segStart, segEnd)

                val active = mutableListOf<String>()
                for (s in nonLinkStyles) {
                    val sStart = maxOf(0, s.start)
                    val sEnd = minOf(content.length, s.end)
                    if (sStart <= segStart && sEnd >= segEnd) {
                        if (openMarkerMap.containsKey(s.style) && !active.contains(s.style)) {
                            active.add(s.style)
                        }
                    }
                }
                val desired = styleOrder.filter { active.contains(it) }

                val toReopen = mutableListOf<String>()
                if (openStack.isNotEmpty()) {
                    var closeFrom = -1
                    for (j in openStack.size - 1 downTo 0) {
                        if (!desired.contains(openStack[j])) {
                            closeFrom = j
                            break
                        }
                    }
                    if (closeFrom >= 0) {
                        for (j in openStack.size - 1 downTo closeFrom) {
                            lineResult.append(closeMarkerMap[openStack[j]] ?: "")
                            if (desired.contains(openStack[j])) {
                                toReopen.add(openStack[j])
                            }
                        }
                        while (openStack.size > closeFrom) {
                            openStack.removeAt(openStack.size - 1)
                        }
                        for (s in toReopen.reversed()) {
                            lineResult.append(openMarkerMap[s] ?: "")
                            openStack.add(s)
                        }
                    }
                }

                for (s in desired) {
                    if (!openStack.contains(s)) {
                        lineResult.append(openMarkerMap[s] ?: "")
                        openStack.add(s)
                    }
                }

                // Check if this segment falls inside a link range
                var linkUrl: String? = null
                for (link in linkStyles) {
                    val lStart = maxOf(0, link.start)
                    val lEnd = minOf(content.length, link.end)
                    if (lStart <= segStart && lEnd >= segEnd) {
                        linkUrl = link.style.removePrefix("link:")
                        break
                    }
                }

                if (linkUrl != null) {
                    lineResult.append("[$segment]($linkUrl)")
                } else {
                    lineResult.append(segment)
                }
            }

            for (j in openStack.size - 1 downTo 0) {
                lineResult.append(closeMarkerMap[openStack[j]] ?: "")
            }

            resultLines.add(blockPrefix + lineResult.toString())
            charOffset += line.length + 1
        }

        return resultLines.joinToString("\n")
    }

    /** Returns true if the string contains markdown syntax that should be parsed into rich text. */
    private fun looksLikeMarkdown(str: String): Boolean {
        // Rich-text wire format — only ever reaches here from our own clipboard extra.
        if (str.contains("<color=", ignoreCase = true)) return true
        if (str.contains("[") && str.contains("](")) return true
        if (str.contains("**")) return true
        if (str.contains("~~")) return true
        if (str.contains("<u>")) return true
        if (str.count { it == '`' } >= 2) return true
        // Italic: _text_ — avoid false positives on plain underscores
        if (Regex("(?<![_\\w])_(?!_)(.+?)(?<!_)_(?![_\\w])").containsMatchIn(str)) return true
        return false
    }

    /**
     * The rich-text WIRE form of [inserted] when this paste came from a CometChat copy, else
     * [inserted] unchanged.
     *
     * The match is on the clipboard's own plain text: only a paste of exactly what we copied may be
     * swapped for the wire form. A partial paste, or a clipboard that has moved on since, falls
     * through untouched rather than pasting the wrong message's markup.
     */
    private fun richTextForPaste(inserted: String): String {
        return try {
            val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                ?: return inserted
            val clip = cm.primaryClip ?: return inserted
            val wire = clip.description?.extras
                ?.getString(CometChatClipboardModule.EXTRA_RICH_TEXT) ?: return inserted
            val plain = clip.getItemAt(0)?.text?.toString() ?: return inserted
            if (inserted == plain) wire else inserted
        } catch (e: Exception) {
            inserted
        }
    }

    /** Normalizes a URL by prepending https:// if no recognized scheme is present. */
    private fun normalizeURL(url: String): String {
        val lower = url.lowercase()
        if (lower.startsWith("http://") || lower.startsWith("https://") ||
            lower.startsWith("mailto:") || lower.startsWith("tel:")) {
            return url
        }
        return "https://$url"
    }

    /**
     * Parses a markdown string into a SpannableStringBuilder with proper styling.
     * Handles: **bold**, _italic_, <u>underline</u>, ~~strikethrough~~, `code`,
     * and [text](url) links. Mirrors the markers used by spannedToMarkdown.
     */
    private fun markdownToSpannable(markdown: String): SpannableStringBuilder {
        val result = SpannableStringBuilder()
        val chars = markdown.toCharArray()
        val len = chars.size
        var i = 0
        var currentText = StringBuilder()

        // Active style state
        var isBold = false
        var activePasteColor: Int? = null
        var isItalic = false
        var isUnderline = false
        var isStrikethrough = false
        var isCode = false

        // Flushes accumulated text into result with current styles applied
        fun flush() {
            if (currentText.isEmpty()) return
            val segStart = result.length
            result.append(currentText)
            val segEnd = result.length

            if (isBold) {
                result.setSpan(StyleSpan(Typeface.BOLD), segStart, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
            if (isItalic) {
                result.setSpan(StyleSpan(Typeface.ITALIC), segStart, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
            if (isUnderline) {
                result.setSpan(UnderlineSpan(), segStart, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
            if (isStrikethrough) {
                result.setSpan(StrikethroughSpan(), segStart, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
            if (isCode) {
                result.setSpan(InlineCodeSpan(), segStart, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                val codeColor = if (isDarkMode()) Color.parseColor("#E0E0E0") else Color.parseColor("#333333")
                result.setSpan(ForegroundColorSpan(codeColor), segStart, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
            // A pasted colour behaves like any other consumer-applied colour once inserted — and it
            // wins over inline code's own foreground, so this goes in AFTER the code span. Two
            // foreground spans over one range are applied in the order they were added, so while the
            // colour was set first the code colour painted straight over it and a copied coloured
            // message pasted back uniformly grey (ENG-38253). iOS had the same defect in mirror image.
            activePasteColor?.let {
                result.setSpan(ExternalForegroundColorSpan(it), segStart, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
            currentText.clear()
        }

        while (i < len) {
            // <color=#rrggbb> … </color> — same grammar the formatter renders.
            if (chars[i] == '<') {
                val rest = markdown.substring(i)
                if (rest.startsWith("</color>", ignoreCase = true)) {
                    flush()
                    activePasteColor = null
                    i += 8
                    continue
                }
                if (rest.startsWith("<color=", ignoreCase = true)) {
                    val close = rest.indexOf('>')
                    if (close > 0) {
                        val hex = rest.substring(7, close).trim()
                        val parsed = try { Color.parseColor(hex) } catch (e: Exception) { null }
                        if (parsed != null) {
                            flush()
                            activePasteColor = parsed
                            i += close + 1
                            continue
                        }
                    }
                }
            }
            // Markdown link: [text](url)
            if (chars[i] == '[') {
                val linkResult = parseLinkAt(chars, i)
                if (linkResult != null) {
                    flush()
                    val (linkText, linkURL, fullEnd) = linkResult
                    val normalizedURL = normalizeURL(linkURL)
                    val linkStart = result.length
                    result.append(linkText)
                    val linkEnd = result.length
                    result.setSpan(NoUnderlineURLSpan(normalizedURL), linkStart, linkEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    result.setSpan(ForegroundColorSpan(Color.parseColor("#2196F3")), linkStart, linkEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    // Carry over active styles to link text
                    if (isBold) result.setSpan(StyleSpan(Typeface.BOLD), linkStart, linkEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    if (isItalic) result.setSpan(StyleSpan(Typeface.ITALIC), linkStart, linkEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    if (isStrikethrough) result.setSpan(StrikethroughSpan(), linkStart, linkEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    i = fullEnd
                    continue
                }
            }

            // ** bold toggle
            if (i + 1 < len && chars[i] == '*' && chars[i + 1] == '*') {
                flush(); isBold = !isBold; i += 2; continue
            }

            // ~~ strikethrough toggle
            if (i + 1 < len && chars[i] == '~' && chars[i + 1] == '~') {
                flush(); isStrikethrough = !isStrikethrough; i += 2; continue
            }

            // <u> and </u> HTML tags for underline (used by blocksToMarkdown)
            if (i + 2 < len && chars[i] == '<' && chars[i + 1] == 'u' && chars[i + 2] == '>') {
                flush(); isUnderline = true; i += 3; continue
            }
            if (i + 3 < len && chars[i] == '<' && chars[i + 1] == '/' && chars[i + 2] == 'u' && chars[i + 3] == '>') {
                flush(); isUnderline = false; i += 4; continue
            }

            // Triple-backtick code block fence: ```content``` or ```\ncontent\n```
            if (i + 2 < len && chars[i] == '`' && chars[i + 1] == '`' && chars[i + 2] == '`') {
                flush()
                i += 3
                // Find closing ```
                val codeContent = StringBuilder()
                var foundClose = false
                while (i < len) {
                    if (i + 2 < len && chars[i] == '`' && chars[i + 1] == '`' && chars[i + 2] == '`') {
                        i += 3
                        foundClose = true
                        break
                    }
                    codeContent.append(chars[i])
                    i += 1
                }
                // Determine if this is a true fenced block (contains newlines) or inline usage
                val rawCode = codeContent.toString()
                val isFencedBlock = rawCode.contains('\n') || rawCode.contains('\r')
                val trimmedCode = rawCode.trim('\n', '\r')
                if (trimmedCode.isNotEmpty()) {
                    val segStart = result.length
                    result.append(trimmedCode)
                    val segEnd = result.length
                    if (isFencedBlock) {
                        // True fenced code block — use EXCLUSIVE_EXCLUSIVE to prevent
                        // span from auto-extending when subsequent text is appended
                        result.setSpan(TypefaceSpan("monospace"), segStart, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                        result.setSpan(CodeBlockBorderSpan(density), segStart, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                        val cbTextColor = if (isDarkMode()) Color.parseColor("#E0E0E0") else Color.parseColor("#333333")
                        result.setSpan(ForegroundColorSpan(cbTextColor), segStart, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    } else {
                        // Inline triple-backtick — treat as inline code, not a block
                        result.setSpan(InlineCodeSpan(), segStart, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                        result.setSpan(TypefaceSpan("monospace"), segStart, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                        val icTextColor = if (isDarkMode()) Color.parseColor("#E0E0E0") else Color.parseColor("#333333")
                        result.setSpan(ForegroundColorSpan(icTextColor), segStart, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    }
                }
                // Only add newline separator for true fenced blocks (multi-line content),
                // not for inline triple-backtick usage like text```code```text
                if (isFencedBlock && foundClose && i < len) {
                    result.append("\n")
                }
                continue
            }

            // ` inline code toggle
            if (chars[i] == '`') {
                flush(); isCode = !isCode; i += 1; continue
            }

            // _ italic toggle (single underscore — __ already handled above)
            if (chars[i] == '_') {
                flush(); isItalic = !isItalic; i += 1; continue
            }

            currentText.append(chars[i])
            i += 1
        }

        flush()
        return result
    }

    /**
     * Parses a markdown link [text](url) starting at position `from` in the char array.
     * Returns a Triple of (linkText, linkURL, fullEndIndex) or null if no valid pattern found.
     */
    private fun parseLinkAt(chars: CharArray, from: Int): Triple<String, String, Int>? {
        if (chars[from] != '[') return null
        var j = from + 1
        while (j < chars.size && chars[j] != ']') j++
        if (j >= chars.size) return null
        if (j + 1 >= chars.size || chars[j + 1] != '(') return null
        val urlStart = j + 2
        var k = urlStart
        while (k < chars.size && chars[k] != ')') k++
        if (k >= chars.size) return null
        val linkText = String(chars, from + 1, j - from - 1)
        val linkURL = String(chars, urlStart, k - urlStart)
        return Triple(linkText, linkURL, k + 1)
    }

    private fun selectWordAtPosition(x: Float, y: Float) {
        val layout = layout ?: return
        val textContent = text?.toString() ?: return

        // Convert touch position to text offset
        val line = layout.getLineForVertical(y.toInt() - paddingTop)
        val offset = layout.getOffsetForHorizontal(line, x - paddingLeft)

        if (offset < 0 || offset > textContent.length) return

        // Find word boundaries
        var start = offset
        var end = offset

        // Move start to beginning of word
        while (start > 0 && !Character.isWhitespace(textContent[start - 1])) {
            start--
        }

        // Move end to end of word
        while (end < textContent.length && !Character.isWhitespace(textContent[end])) {
            end++
        }

        // Select the word if valid
        if (start < end) {
            setSelection(start, end)
        }
    }

    // Combined: draw code block borders + flat variant bottom border
    // (first onDraw removed — merged here)

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec)

        val textLayout = layout
        if (textLayout != null) {
            val lineCount = textLayout.lineCount
            if (lineCount > 0) {
                val effectiveLineCount = if (numberOfLinesValue > 0 && !isEnabled) {
                    minOf(numberOfLinesValue, lineCount)
                } else {
                    lineCount
                }

                var desiredHeight = textLayout.getLineBottom(effectiveLineCount - 1).toFloat() + paddingTop + paddingBottom

                // Add extra height for code block visual padding at document
                // edges. The onDraw() container extends VERTICAL_PADDING above
                // the first line and below the last line — the view must be
                // tall enough to avoid clipping those visual extensions.
                desiredHeight += codeBlockEdgePaddingPx()

                if (desiredHeight < minHeightPx) {
                    desiredHeight = minHeightPx
                }

                if (maxHeightValue > 0) {
                    val maxHeightPx = maxHeightValue * density
                    if (desiredHeight > maxHeightPx) {
                        desiredHeight = maxHeightPx
                    }
                }

                calculatedHeight = desiredHeight

                val measuredWidth = MeasureSpec.getSize(widthMeasureSpec)
                setMeasuredDimension(measuredWidth, kotlin.math.ceil(desiredHeight.toDouble()).toInt())
            }
        }
    }

    // Track line count to detect soft-wrap changes that need container redraw
    private var lastKnownLineCount = 0

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
        super.onLayout(changed, left, top, right, bottom)
        updateContentSize()
        // Redraw code block containers after layout recalculation.
        // When text soft-wraps to a new visual line, onDraw() may run before
        // the Layout has updated line positions. This ensures a redraw with
        // the correct line metrics so the container covers all wrapped lines.
        val currentLineCount = layout?.lineCount ?: 0
        if (currentLineCount != lastKnownLineCount) {
            lastKnownLineCount = currentLineCount
            invalidate()
        }
    }

    private fun updateContentSize() {
        val textLayout = layout ?: return

        val lineCount = textLayout.lineCount
        if (lineCount == 0) return

        val effectiveLineCount = if (numberOfLinesValue > 0 && !isEnabled) {
            minOf(numberOfLinesValue, lineCount)
        } else {
            lineCount
        }

        var newHeightPx = textLayout.getLineBottom(effectiveLineCount - 1).toFloat() + paddingTop + paddingBottom

        // Add extra height for code block visual padding at document edges.
        newHeightPx += codeBlockEdgePaddingPx()

        if (newHeightPx < minHeightPx) {
            newHeightPx = minHeightPx
        }

        if (maxHeightValue > 0) {
            val maxHeightPx = maxHeightValue * density
            if (newHeightPx > maxHeightPx) {
                isVerticalScrollBarEnabled = true
                newHeightPx = maxHeightPx
            } else {
                isVerticalScrollBarEnabled = false
            }
        }

        val previousHeight = calculatedHeight
        calculatedHeight = newHeightPx

        val newHeightDp = newHeightPx / density

        // Standard height reporting — no special stabilization needed
        // since TOP gravity doesn't reposition text on relayout.
        if (kotlin.math.abs(newHeightDp - lastReportedHeight) > 0.5f) {
            lastReportedHeight = newHeightDp
            val map = Arguments.createMap()
            map.putInt("height", kotlin.math.ceil(newHeightDp.toDouble()).toInt())
            sendEvent("onSizeChange", map)

            if (kotlin.math.abs(previousHeight - calculatedHeight) > 1f) {
                requestLayout()
            }
        }

        if (maxHeightValue > 0 && textLayout.lineCount > 0 && !(numberOfLinesValue > 0 && !isEnabled)) {
            val cursorPos = selectionEnd.coerceAtLeast(0)
            val cursorLine = textLayout.getLineForOffset(cursorPos)
            val cursorBottom = textLayout.getLineBottom(cursorLine)
            val visibleBottom = scrollY + height - paddingBottom
            if (cursorBottom > visibleBottom) {
                scrollTo(0, cursorBottom - height + paddingBottom)
            } else if (textLayout.getLineTop(cursorLine) < scrollY + paddingTop) {
                scrollTo(0, textLayout.getLineTop(cursorLine) - paddingTop)
            }
        }
    }

    /**
     * Returns the extra height (in px) needed for code block container drawing
     * that extends beyond the text's intrinsic bounds at document edges.
     * The onDraw() container rect extends VERTICAL_PADDING above the first
     * line and below the last line, so the view must be tall enough to
     * prevent clipping at the top/bottom edges.
     */
    private fun codeBlockEdgePaddingPx(): Float {
        val spannable = text as? Spanned ?: return 0f
        val cbSpans = spannable.getSpans(0, spannable.length, CodeBlockBorderSpan::class.java)
        if (cbSpans.isEmpty()) return 0f

        val vPad = CodeBlockBorderSpan.VERTICAL_PADDING * density
        var extra = 0f

        // Check if a code block touches the first line
        for (sp in cbSpans) {
            val ss = spannable.getSpanStart(sp)
            if (ss == 0) { extra += vPad; break }
        }
        // Check if a code block touches the last line
        val textLen = spannable.length
        for (sp in cbSpans) {
            val se = spannable.getSpanEnd(sp)
            if (se >= textLen) { extra += vPad; break }
        }
        return extra
    }

    // Tracks whether a code block is present in the plain variant.
    // Used by onDraw to draw the container and by codeBlockEdgePaddingPx
    // to add extra height for the visual padding.
    private var codeBlockPaddingApplied = false

    /**
     * Tracks code block presence for the plain variant.
     *
     * Does NOT call setPadding() or change gravity — all visual padding
     * is handled purely in onDraw() and codeBlockEdgePaddingPx(). This
     * avoids layout thrashing and timing races between setPadding() and
     * updateContentSize().
     */
    private fun updateCodeBlockEdgePadding() {
        val spannable = text as? Spanned
        val cbSpans = spannable?.getSpans(0, spannable.length, CodeBlockBorderSpan::class.java)
        val hasCodeBlock = cbSpans != null && cbSpans.isNotEmpty()

        if (variant == "plain") {
            if (hasCodeBlock && !codeBlockPaddingApplied) {
                codeBlockPaddingApplied = true
            } else if (!hasCodeBlock && codeBlockPaddingApplied) {
                codeBlockPaddingApplied = false
            }
        }
    }

    private fun applyVariantStyle() {
        if (variant == "flat") {
            background = null
            setBackgroundColor(Color.TRANSPARENT)
            drawBottomBorder = true
        } else if (variant == "plain") {
            background = null
            setBackgroundColor(Color.TRANSPARENT)
            drawBottomBorder = false
            setPadding(0, 0, 0, 0)
            gravity = Gravity.CENTER_VERTICAL or Gravity.START
            // Let JS side control height via style prop
            minHeightPx = 0f
        } else {
            drawBottomBorder = false
            val bg = GradientDrawable().apply {
                setColor(Color.WHITE)
                cornerRadius = 8 * density
                setStroke((1 * density).toInt(), Color.parseColor("#E0E0E0"))
            }
            background = bg
        }
        invalidate()
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        try {
            val reactContext = context as? ReactContext ?: return
            // Use container's ID if available (when wrapped in LinearLayout by ViewManager)
            val viewId = containerView?.id ?: id

            // Convert event name to Fabric "top" prefix format
            val fabricEventName = when (eventName) {
                "onContentChange" -> "topContentChange"
                "onSelectionChange" -> "topSelectionChange"
                "onEditorFocus" -> "topEditorFocus"
                "onEditorBlur" -> "topEditorBlur"
                "onSizeChange" -> "topSizeChange"
                "onActiveStylesChange" -> "topActiveStylesChange"
                "onLinkTap" -> "topLinkTap"
                "onSendRequest" -> "topSendRequest"
                "onPasteMedia" -> "topPasteMedia"
                else -> eventName
            }

            // Try Fabric event dispatcher (New Architecture)
            val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, viewId)
            if (dispatcher != null) {
                val surfaceId = UIManagerHelper.getSurfaceId(reactContext)
                dispatcher.dispatchEvent(
                    RichTextEditorEvent(surfaceId, viewId, fabricEventName, params)
                )
                return
            }

            // Fallback to Paper (Old Architecture)
            reactContext.getJSModule(RCTEventEmitter::class.java)
                ?.receiveEvent(viewId, eventName, params)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /** Custom event class for Fabric event dispatching */
    private class RichTextEditorEvent(
        surfaceId: Int,
        viewId: Int,
        private val name: String,
        private val eventData: WritableMap
    ) : Event<RichTextEditorEvent>(surfaceId, viewId) {
        override fun getEventName(): String = name
        override fun getEventData(): WritableMap = eventData
    }

    private fun sendContentChange() {
        sendContentChangeWithDelta(null)
    }

    private fun emitLinkTapEvent(url: String, text: String, location: Int, length: Int) {
        val map = Arguments.createMap()
        map.putString("url", url)
        map.putString("text", text)
        map.putInt("location", location)
        map.putInt("length", length)
        sendEvent("onLinkTap", map)
    }

    /**
     * Emit a send request event when Enter is pressed in "sendMessage" mode.
     * The RN side listens for this and triggers the send action.
     */
    private fun emitSendRequestEvent() {
        sendEvent("onSendRequest", Arguments.createMap())
    }

    private fun sendContentChangeWithDelta(delta: Map<String, Any>? = pendingDelta) {
        try {
            val map = Arguments.createMap()
            map.putString("text", (text?.toString() ?: "").replace("\u200B", ""))
            // Serialize blocks to JSON string (codegen doesn't support nested arrays)
            map.putString("blocksJson", getBlocksJsonString())
            map.putString("mentionRangesJson", currentMentionRangesJson())

            // Include delta information if available
            if (delta != null) {
                val deltaMap = Arguments.createMap()
                delta["type"]?.let { deltaMap.putString("type", it as String) }
                delta["position"]?.let { deltaMap.putInt("position", it as Int) }
                delta["length"]?.let { deltaMap.putInt("length", it as Int) }
                delta["text"]?.let { deltaMap.putString("text", it as String) }
                delta["style"]?.let { deltaMap.putString("style", it as String) }
                map.putMap("delta", deltaMap)
            }

            sendEvent("onContentChange", map)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    // Send format delta when applying styles
    private fun sendFormatDelta(style: String, start: Int, end: Int) {
        val delta = mapOf(
            "type" to "format",
            "position" to start,
            "length" to (end - start),
            "style" to style
        )
        sendContentChangeWithDelta(delta)
    }

    private fun saveToUndoStack() {
        val currentText = text?.toString() ?: ""
        if (currentText != lastSavedText) {
            undoStack.add(SpannableStringBuilder(text))
            if (undoStack.size > 50) {
                undoStack.removeAt(0)
            }
            redoStack.clear()
            lastSavedText = currentText
        }
    }

    // ==================== Public API ====================

    fun setPlaceholderText(value: String) {
        placeholder = value
        hint = value
        updatePlaceholderVisibility()
    }

    /// Returns true when the editor has no user-visible content.
    /// ZWS-only text (code block empty placeholder) is treated as empty.
    private fun isEffectivelyEmpty(): Boolean {
        val t = text?.toString() ?: return true
        return t.isEmpty() || t.replace("\u200B", "").isEmpty()
    }

    /// Show or hide the hint based on effective emptiness.
    /// Android's built-in hint hides whenever text is non-empty, but we want
    /// the placeholder to remain visible when only ZWS is present (code block
    /// empty state).
    private fun updatePlaceholderVisibility() {
        val empty = isEffectivelyEmpty()
        // Restore or clear hint to control visibility
        hint = if (empty && placeholder.isNotEmpty()) placeholder else null
    }

    fun setVariant(value: String) {
        variant = value
        applyVariantStyle()
    }

    fun setEditable(value: Boolean) {
        isEnabled = value
        if (numberOfLinesValue > 0) {
            setNumberOfLinesValue(numberOfLinesValue)
        }
    }

    fun setMaxHeightValue(value: Int) {
        maxHeightValue = value
        post { updateContentSize() }
    }

    fun setNumberOfLinesValue(value: Int) {
        numberOfLinesValue = if (value == 0) 0 else value
        if (numberOfLinesValue > 0 && !isEnabled) {
            maxLines = numberOfLinesValue
            ellipsize = android.text.TextUtils.TruncateAt.END
            isVerticalScrollBarEnabled = false
            scrollTo(0, 0)
        } else {
            maxLines = Integer.MAX_VALUE
            ellipsize = null
        }
        requestLayout()
    }

    private fun applyEllipsisIfNeeded() {
        if (numberOfLinesValue <= 0 || isEnabled) return
        val textLayout = layout ?: return
        if (textLayout.lineCount <= numberOfLinesValue) return

        val content = text ?: return
        val availableWidth = textLayout.width

        val staticLayout = android.text.StaticLayout.Builder
            .obtain(content, 0, content.length, paint, availableWidth)
            .setMaxLines(numberOfLinesValue)
            .setEllipsize(android.text.TextUtils.TruncateAt.END)
            .setLineSpacing(lineSpacingExtra, lineSpacingMultiplier)
            .setIncludePad(includeFontPadding)
            .build()

        val lastLine = numberOfLinesValue - 1
        val ellipsisStart = staticLayout.getEllipsisStart(lastLine)
        val ellipsisCount = staticLayout.getEllipsisCount(lastLine)

        if (ellipsisCount > 0) {
            val lineStart = staticLayout.getLineStart(lastLine)
            val truncPoint = lineStart + ellipsisStart

            isInternalChange = true
            val editable = content as? android.text.Editable ?: return
            editable.delete(truncPoint, editable.length)
            editable.append("\u2026")
            setSelection(0)
            isInternalChange = false
        }
    }

    fun setShowToolbar(value: Boolean) {
        showToolbar = value
        if (!value) hideToolbar()
    }

    fun setToolbarOptions(options: List<String>?) {
        toolbarOptions = options
    }

    fun setContent(blocks: List<Map<String, Any>>) {
        val spannable = SpannableStringBuilder()
        var currentOffset = 0
        var numberedListCounter = 1

        blocks.forEachIndexed { index, block ->
            val textContent = block["text"] as? String ?: ""
            val blockType = block["type"] as? String ?: "paragraph"

            // Add list prefix based on block type
            val prefix = when (blockType) {
                "bullet", "bulletList" -> "• "
                "numbered", "numberedList" -> "${numberedListCounter++}. "
                "checklist" -> "☐ "
                "quote" -> "▎ "
                "quoteBullet" -> "▎ • "
                "quoteNumbered" -> "▎ ${numberedListCounter++}. "
                else -> {
                    // Reset numbered list counter when not in numbered list
                    if (blockType != "numbered" && blockType != "numberedList" && blockType != "quoteNumbered") numberedListCounter = 1
                    ""
                }
            }

            // No suffix needed for quotes (using prefix-only approach)
            val suffix = ""

            val blockStart = currentOffset
            spannable.append(prefix)
            currentOffset += prefix.length

            val textStart = currentOffset
            spannable.append(textContent)
            currentOffset += textContent.length

            spannable.append(suffix)
            currentOffset += suffix.length

            // Apply heading style
            if (blockType == "heading") {
                spannable.setSpan(RelativeSizeSpan(1.5f), blockStart, currentOffset, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                spannable.setSpan(StyleSpan(Typeface.BOLD), blockStart, currentOffset, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }

            // Apply styles from the block
            @Suppress("UNCHECKED_CAST")
            val styles = block["styles"] as? List<Map<String, Any>> ?: emptyList()
            for (styleInfo in styles) {
                val styleName = styleInfo["style"] as? String ?: continue
                val start = (styleInfo["start"] as? Number)?.toInt() ?: 0
                val end = (styleInfo["end"] as? Number)?.toInt() ?: textContent.length

                if (start >= end || end > textContent.length) continue

                val absoluteStart = textStart + start
                val absoluteEnd = textStart + end

                when (styleName) {
                    "bold" -> spannable.setSpan(StyleSpan(Typeface.BOLD), absoluteStart, absoluteEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    "italic" -> spannable.setSpan(StyleSpan(Typeface.ITALIC), absoluteStart, absoluteEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    "underline" -> spannable.setSpan(UnderlineSpan(), absoluteStart, absoluteEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    "strikethrough" -> spannable.setSpan(StrikethroughSpan(), absoluteStart, absoluteEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    "code" -> {
                        val fontSize = inlineCodeFontSize ?: 12f
                        spannable.setSpan(AbsoluteSizeSpan(fontSize.toInt(), true), absoluteStart, absoluteEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                        spannable.setSpan(InlineCodeSpan(), absoluteStart, absoluteEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                        val codeColor = inlineCodeTextColor ?: Color.parseColor("#6852D6")
                        spannable.setSpan(ForegroundColorSpan(codeColor), absoluteStart, absoluteEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    }
                    "highlight" -> spannable.setSpan(BackgroundColorSpan(Color.parseColor("#80FFFF00")), absoluteStart, absoluteEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    "textColor" -> {
                        // Edit round-trip: restore a consumer colour from the wire format so the
                        // composer shows the colour rather than raw <color=…> text.
                        val hex = styleInfo["color"] as? String
                        val parsed = try { hex?.let { Color.parseColor(it) } } catch (e: Exception) { null }
                        if (parsed != null) {
                            spannable.setSpan(ExternalForegroundColorSpan(parsed), absoluteStart, absoluteEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                        }
                    }
                    "link" -> {
                        val url = styleInfo["url"] as? String ?: ""
                        if (url.isNotEmpty()) {
                            spannable.setSpan(NoUnderlineURLSpan(url), absoluteStart, absoluteEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                            spannable.setSpan(ForegroundColorSpan(Color.parseColor("#2196F3")), absoluteStart, absoluteEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                        }
                    }
                }
            }

            // Make ▎ quote prefix invisible — bar is custom-drawn in onDraw()
            if ((blockType == "quote" || blockType == "quoteBullet" || blockType == "quoteNumbered") && prefix.isNotEmpty()) {
                spannable.setSpan(ForegroundColorSpan(Color.TRANSPARENT), blockStart, blockStart + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }

            // Apply code block attributes (monospace font + border span) for codeBlock lines
            if (blockType == "codeBlock") {
                spannable.setSpan(TypefaceSpan("monospace"), blockStart, currentOffset, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                spannable.setSpan(CodeBlockBorderSpan(density), blockStart, currentOffset, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                // Apply dark-mode-aware text color for readability
                val cbTextColor = if (isDarkMode()) Color.parseColor("#E0E0E0") else Color.parseColor("#333333")
                spannable.setSpan(ForegroundColorSpan(cbTextColor), blockStart, currentOffset, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }

            if (index < blocks.size - 1) {
                spannable.append("\n")
                // Carry CodeBlockBorderSpan on the newline between consecutive
                // codeBlock lines so getBlocksArray() fallback detects empty lines
                // inside code blocks correctly during edit round-trips.
                if (blockType == "codeBlock") {
                    spannable.setSpan(CodeBlockBorderSpan(density), currentOffset, currentOffset + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                }
                currentOffset += 1
            }
        }

        isInternalChange = true
        setText(spannable)

        // Detect if cursor lands inside a code block and update pendingStyles
        // BEFORE setSelection, because setSelection triggers onSelectionChanged
        // which calls emitActiveStyles().
        val endPos = spannable.length
        if (endPos > 0) {
            val checkPos = (endPos - 1).coerceAtMost(spannable.length - 1)
            if (checkPos >= 0) {
                val codeBlockSpans = spannable.getSpans(checkPos, checkPos + 1, CodeBlockBorderSpan::class.java)
                if (codeBlockSpans.isNotEmpty()) {
                    pendingStyles.add("codeBlock")
                    pendingStylesInsertPos = endPos
                }

                // Arm the INLINE styles the caret lands in, so typing CONTINUES the run the message
                // ended with. iOS gets this for free — UITextView derives its typingAttributes from
                // the character before the insertion point — but here every span above is
                // SPAN_EXCLUSIVE_EXCLUSIVE, so text appended at the end extends none of them and
                // only `codeBlock` was ever armed. Opening a message that ended in inline code and
                // typing therefore dropped straight out of the code (and its colour) mid-word, while
                // the same edit on iOS carried both (ENG-38253).
                //
                // `pendingStyles` is the established mechanism: the TextWatcher applies each armed
                // style over the inserted range as SPAN_EXCLUSIVE_INCLUSIVE, which is exactly the
                // "keep applying as the user types" behaviour wanted here.
                var armedInline = false
                if (spannable.getSpans(checkPos, checkPos + 1, InlineCodeSpan::class.java).isNotEmpty()) {
                    pendingStyles.add("code")
                    armedInline = true
                }
                spannable.getSpans(checkPos, checkPos + 1, StyleSpan::class.java).forEach { span ->
                    // BOLD_ITALIC is a bitmask, not a third case — test the bits, don't match values.
                    if (span.style and Typeface.BOLD != 0) {
                        pendingStyles.add("bold")
                        armedInline = true
                    }
                    if (span.style and Typeface.ITALIC != 0) {
                        pendingStyles.add("italic")
                        armedInline = true
                    }
                }
                if (spannable.getSpans(checkPos, checkPos + 1, UnderlineSpan::class.java).isNotEmpty()) {
                    pendingStyles.add("underline")
                    armedInline = true
                }
                if (spannable.getSpans(checkPos, checkPos + 1, StrikethroughSpan::class.java).isNotEmpty()) {
                    pendingStyles.add("strikethrough")
                    armedInline = true
                }
                spannable.getSpans(checkPos, checkPos + 1, ExternalForegroundColorSpan::class.java)
                    .firstOrNull()?.let { span ->
                        // The consumer colour rides its own pending slot, not `pendingStyles` alone.
                        pendingExternalColor = span.color
                        pendingStyles.add("externalColor")
                        armedInline = true
                    }
                if (armedInline) {
                    pendingStylesInsertPos = endPos
                }
            }
        }

        if (numberOfLinesValue > 0 && !isEnabled) {
            setSelection(0)
        } else {
            setSelection(spannable.length)
        }
        isInternalChange = false
        applyListIndentation()
        updateCodeBlockEdgePadding()
        updatePlaceholderVisibility()

        // Force redraw so code block borders/backgrounds render immediately
        invalidate()
        sendContentChange()

        post {
            if (numberOfLinesValue > 0 && !isEnabled) {
                scrollTo(0, 0)
                applyEllipsisIfNeeded()
            }
            updateContentSize()
        }
    }

    fun getTextContent(): String = text.toString()

    // Fabric command response methods
    fun emitGetTextResponse() {
        val map = Arguments.createMap()
        map.putString("text", text?.toString() ?: "")
        sendEvent("onGetTextResponse", map)
    }

    fun emitGetBlocksResponse() {
        val map = Arguments.createMap()
        map.putArray("blocks", getBlocksArray())
        sendEvent("onGetBlocksResponse", map)
    }

    private fun extractStylesForRange(spannable: Spanned, lineStart: Int, lineEnd: Int): List<Map<String, Any>> {
        val styles = mutableListOf<Map<String, Any>>()

        spannable.getSpans(lineStart, lineEnd, StyleSpan::class.java).forEach { span ->
            val start = (spannable.getSpanStart(span) - lineStart).coerceAtLeast(0)
            val end = (spannable.getSpanEnd(span) - lineStart).coerceAtMost(lineEnd - lineStart)
            when (span.style) {
                Typeface.BOLD -> styles.add(mapOf("style" to "bold", "start" to start, "end" to end))
                Typeface.ITALIC -> styles.add(mapOf("style" to "italic", "start" to start, "end" to end))
                Typeface.BOLD_ITALIC -> {
                    styles.add(mapOf("style" to "bold", "start" to start, "end" to end))
                    styles.add(mapOf("style" to "italic", "start" to start, "end" to end))
                }
            }
        }

        spannable.getSpans(lineStart, lineEnd, UnderlineSpan::class.java).forEach { span ->
            if (spannable.getSpans(spannable.getSpanStart(span), spannable.getSpanEnd(span), URLSpan::class.java).isEmpty()) {
                val start = (spannable.getSpanStart(span) - lineStart).coerceAtLeast(0)
                val end = (spannable.getSpanEnd(span) - lineStart).coerceAtMost(lineEnd - lineStart)
                styles.add(mapOf("style" to "underline", "start" to start, "end" to end))
            }
        }

        spannable.getSpans(lineStart, lineEnd, StrikethroughSpan::class.java).forEach { span ->
            val start = (spannable.getSpanStart(span) - lineStart).coerceAtLeast(0)
            val end = (spannable.getSpanEnd(span) - lineStart).coerceAtMost(lineEnd - lineStart)
            styles.add(mapOf("style" to "strikethrough", "start" to start, "end" to end))
        }

        spannable.getSpans(lineStart, lineEnd, InlineCodeSpan::class.java).forEach { span ->
            val start = (spannable.getSpanStart(span) - lineStart).coerceAtLeast(0)
            val end = (spannable.getSpanEnd(span) - lineStart).coerceAtMost(lineEnd - lineStart)
            styles.add(mapOf("style" to "code", "start" to start, "end" to end))
        }

        // Consumer inline colour. Offsets are already relative to the block prefix
        // (`• `/`▎ `/`1. ` and ZWS are stripped by the callers before extraction), so a colour
        // range can never cover a list/quote glyph.
        spannable.getSpans(lineStart, lineEnd, ExternalForegroundColorSpan::class.java).forEach { span ->
            val start = (spannable.getSpanStart(span) - lineStart).coerceAtLeast(0)
            val end = (spannable.getSpanEnd(span) - lineStart).coerceAtMost(lineEnd - lineStart)
            if (end > start) {
                styles.add(
                    mapOf(
                        "style" to "textColor",
                        "start" to start,
                        "end" to end,
                        "color" to hexOf(span.color)
                    )
                )
            }
        }

        spannable.getSpans(lineStart, lineEnd, BackgroundColorSpan::class.java).filter {
            val color = it.backgroundColor
            color == Color.parseColor("#80FFFF00") || color == Color.YELLOW
        }.forEach { span ->
            val start = (spannable.getSpanStart(span) - lineStart).coerceAtLeast(0)
            val end = (spannable.getSpanEnd(span) - lineStart).coerceAtMost(lineEnd - lineStart)
            styles.add(mapOf("style" to "highlight", "start" to start, "end" to end))
        }

        // Extract link spans (URLSpan) with url metadata
        spannable.getSpans(lineStart, lineEnd, URLSpan::class.java).forEach { span ->
            val start = (spannable.getSpanStart(span) - lineStart).coerceAtLeast(0)
            val end = (spannable.getSpanEnd(span) - lineStart).coerceAtMost(lineEnd - lineStart)
            val url = span.url ?: ""
            if (url.isNotEmpty()) {
                styles.add(mapOf("style" to "link", "start" to start, "end" to end, "url" to url))
            }
        }

        return styles
    }

    private fun detectBlockType(lineText: String): Pair<String, String> {
        return when {
            // Combined blockquote + list (must check before individual prefixes)
            lineText.startsWith("▎ • ") -> "quoteBullet" to lineText.substring(4)
            lineText.startsWith("▎ ") && lineText.substring(2).matches(Regex("^\\d+\\.\\s.*")) ->
                "quoteNumbered" to lineText.substring(2).replace(Regex("^\\d+\\.\\s"), "")
            lineText.startsWith("• ") -> "bullet" to lineText.substring(2)
            lineText.matches(Regex("^\\d+\\.\\s.*")) -> "numbered" to lineText.replace(Regex("^\\d+\\.\\s"), "")
            lineText.startsWith("☐ ") || lineText.startsWith("☑ ") -> "checklist" to lineText.substring(2)
            lineText.startsWith("▎ ") -> "quote" to lineText.substring(2)
            else -> "paragraph" to lineText
        }
    }

    fun getBlocksArray(): WritableArray {
        val blocks = Arguments.createArray()
        val spannable = text as? Spanned ?: return blocks
        val textContent = spannable.toString()
        if (textContent.isEmpty()) return blocks

        val lines = textContent.split("\n")
        var currentIndex = 0
        lines.forEach { line ->
            var (blockType, displayText) = detectBlockType(line)
            // Strip zero-width space placeholders from display text
            displayText = displayText.replace("\u200B", "")
            val prefixLen = line.length - displayText.length

            // Detect code block: check the full line range (including ZWS prefix)
            // for CodeBlockBorderSpan. Using currentIndex instead of lineStart
            // ensures we detect spans that cover the ZWS placeholder character
            // at the start of code block lines.
            val lineStart = currentIndex + prefixLen
            val lineEnd = currentIndex + line.length
            val cbCheckStart = currentIndex.coerceAtMost(spannable.length)
            val cbCheckEnd = lineEnd.coerceAtMost(spannable.length)
            if (cbCheckEnd > cbCheckStart) {
                val cbSpans = spannable.getSpans(cbCheckStart, cbCheckEnd, CodeBlockBorderSpan::class.java)
                if (cbSpans.isNotEmpty()) {
                    blockType = "codeBlock"
                }
            }
            // Fallback: empty lines inside a code block — the newline char before
            // this line carries the CodeBlockBorderSpan, but the empty line itself
            // has zero length so getSpans(start, start) returns nothing.
            // Check the preceding newline character for the span.
            if (blockType != "codeBlock" && line.isEmpty() && currentIndex > 0) {
                val prevCharIdx = currentIndex - 1
                if (prevCharIdx < spannable.length) {
                    val cbSpans = spannable.getSpans(prevCharIdx, prevCharIdx + 1, CodeBlockBorderSpan::class.java)
                    if (cbSpans.isNotEmpty()) {
                        blockType = "codeBlock"
                    }
                }
            }

            val block = Arguments.createMap()
            block.putString("type", blockType)
            block.putString("text", displayText)

            val stylesArray = Arguments.createArray()
            extractStylesForRange(spannable, lineStart, lineEnd).forEach { style ->
                val styleMap = Arguments.createMap()
                styleMap.putString("style", style["style"] as String)
                styleMap.putInt("start", style["start"] as Int)
                styleMap.putInt("end", style["end"] as Int)
                val url = style["url"] as? String
                if (url != null) styleMap.putString("url", url)
                val color = style["color"] as? String
                if (color != null) styleMap.putString("color", color)
                stylesArray.pushMap(styleMap)
            }
            block.putArray("styles", stylesArray)
            blocks.pushMap(block)

            currentIndex += line.length + 1
        }
        return blocks
    }

    fun getBlocksJsonString(): String {
        val spannable = text as? Spanned ?: return "[]"
        val textContent = spannable.toString()
        if (textContent.isEmpty()) return "[]"

        val jsonArray = org.json.JSONArray()
        val lines = textContent.split("\n")
        var currentIndex = 0
        lines.forEach { line ->
            var (blockType, displayText) = detectBlockType(line)
            // Strip zero-width space placeholders from display text
            displayText = displayText.replace("\u200B", "")
            val prefixLen = line.length - displayText.length

            // Detect code block: check the full line range (including ZWS prefix)
            // for CodeBlockBorderSpan. Using currentIndex instead of lineStart
            // ensures we detect spans that cover the ZWS placeholder character
            // at the start of code block lines.
            val lineStart = currentIndex + prefixLen
            val lineEnd = currentIndex + line.length
            val cbCheckStart = currentIndex.coerceAtMost(spannable.length)
            val cbCheckEnd = lineEnd.coerceAtMost(spannable.length)
            if (cbCheckEnd > cbCheckStart) {
                val cbSpans = spannable.getSpans(cbCheckStart, cbCheckEnd, CodeBlockBorderSpan::class.java)
                if (cbSpans.isNotEmpty()) {
                    blockType = "codeBlock"
                }
            }
            // Fallback: empty lines inside a code block — the newline char before
            // this line carries the CodeBlockBorderSpan, but the empty line itself
            // has zero length so getSpans(start, start) returns nothing.
            // Check the preceding newline character for the span.
            if (blockType != "codeBlock" && line.isEmpty() && currentIndex > 0) {
                val prevCharIdx = currentIndex - 1
                if (prevCharIdx < spannable.length) {
                    val cbSpans = spannable.getSpans(prevCharIdx, prevCharIdx + 1, CodeBlockBorderSpan::class.java)
                    if (cbSpans.isNotEmpty()) {
                        blockType = "codeBlock"
                    }
                }
            }

            val block = org.json.JSONObject()
            block.put("type", blockType)
            block.put("text", displayText)

            val stylesJson = org.json.JSONArray()
            extractStylesForRange(spannable, lineStart, lineEnd).forEach { style ->
                val styleObj = org.json.JSONObject()
                styleObj.put("style", style["style"])
                styleObj.put("start", style["start"])
                styleObj.put("end", style["end"])
                val url = style["url"] as? String
                if (url != null) styleObj.put("url", url)
                // textColor is value-carrying: without the hex the JS side sees a colour range it
                // cannot render, and drops it — colour shows in the composer but not in the bubble.
                val color = style["color"] as? String
                if (color != null) styleObj.put("color", color)
                stylesJson.put(styleObj)
            }
            block.put("styles", stylesJson)
            jsonArray.put(block)

            currentIndex += line.length + 1
        }
        return jsonArray.toString()
    }

    // ==================== Text Styling (ToolbarActionListener) ====================

    fun onBoldClick() {
        // Ignore inline formatting when code block is active (Req 5.2)
        if (isCursorInCodeBlock()) return
        android.util.Log.d("RichTextEditor", "onBoldClick called")
        toggleStyle(Typeface.BOLD)
    }

    fun onItalicClick() {
        // Ignore inline formatting when code block is active (Req 5.2)
        if (isCursorInCodeBlock()) return
        android.util.Log.d("RichTextEditor", "onItalicClick called")
        toggleStyle(Typeface.ITALIC)
    }

    fun onUnderlineClick() {
        // Ignore inline formatting when code block is active (Req 5.2)
        if (isCursorInCodeBlock()) return
        android.util.Log.d("RichTextEditor", "onUnderlineClick called")
        toggleSpan(UnderlineSpan::class.java) { UnderlineSpan() }
    }

    fun onStrikethroughClick() {
        // Ignore inline formatting when code block is active (Req 5.2)
        if (isCursorInCodeBlock()) return
        android.util.Log.d("RichTextEditor", "onStrikethroughClick called")
        toggleSpan(StrikethroughSpan::class.java) { StrikethroughSpan() }
    }


    /**
     * Split InlineCodeSpan spans at newline characters so the visual container
     * drawn by onDraw() does not extend across line breaks. Each line segment
     * gets its own InlineCodeSpan (plus matching AbsoluteSizeSpan and ForegroundColorSpan).
     */
    private fun splitInlineCodeSpansAtNewlines(s: Editable) {
        val spans = s.getSpans(0, s.length, InlineCodeSpan::class.java)
        for (span in spans) {
            val ss = s.getSpanStart(span)
            val se = s.getSpanEnd(span)
            if (ss < 0 || se < 0 || ss >= se) continue
            val text = s.subSequence(ss, se).toString()
            if (!text.contains("\n")) continue

            // Collect associated spans (font size + foreground color) for re-application
            val sizeSpans = s.getSpans(ss, se, AbsoluteSizeSpan::class.java)
                .filter { s.getSpanStart(it) == ss && s.getSpanEnd(it) == se }
            val colorSpans = s.getSpans(ss, se, ForegroundColorSpan::class.java)
                .filter { s.getSpanStart(it) == ss && s.getSpanEnd(it) == se }
            val fontSize = sizeSpans.firstOrNull()?.size ?: (inlineCodeFontSize?.toInt() ?: 12)
            val codeColor = colorSpans.firstOrNull()?.foregroundColor
                ?: (inlineCodeTextColor ?: Color.parseColor("#6852D6"))

            // Remove original spans
            isInternalChange = true
            s.removeSpan(span)
            sizeSpans.forEach { s.removeSpan(it) }
            colorSpans.forEach { s.removeSpan(it) }

            // Re-apply per-line segments (skip newline characters)
            var i = 0
            while (i < text.length) {
                if (text[i] == '\n') { i++; continue }
                var end = text.indexOf('\n', i)
                if (end < 0) end = text.length
                if (end > i) {
                    val segStart = ss + i
                    val segEnd = ss + end
                    s.setSpan(InlineCodeSpan(), segStart, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    s.setSpan(AbsoluteSizeSpan(fontSize, true), segStart, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    s.setSpan(ForegroundColorSpan(codeColor), segStart, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                }
                i = end
            }
            isInternalChange = false
        }
        invalidate()
    }

    fun onCodeClick() {
        // Ignore inline code toggle when code block is active (Req 5.2)
        if (isCursorInCodeBlock()) return

        // Use saved selection if current selection is empty
        var start = selectionStart
        var end = selectionEnd

        if (start >= end && savedSelectionStart < savedSelectionEnd) {
            start = savedSelectionStart
            end = savedSelectionEnd
        }

        // Clamp to current text length
        val textLength = text?.length ?: 0
        start = start.coerceIn(0, textLength)
        end = end.coerceIn(start, textLength)

        // No selection: toggle pending code style for type-ahead (Slack-style)
        if (start >= end) {
            val key = "code"
            val spannableText = text as? Spanned
            val cursorPos = selectionStart
            val isInsideStyle = if (spannableText != null && cursorPos > 0) {
                spannableText.getSpans(cursorPos - 1, cursorPos, InlineCodeSpan::class.java).isNotEmpty()
            } else false

            if (isInsideStyle) {
                if (explicitlyOffStyles.contains(key)) {
                    explicitlyOffStyles.remove(key)
                } else {
                    explicitlyOffStyles.add(key)
                    pendingStyles.remove(key)
                    pendingStyles.remove("codeBlock")
                }
            } else {
                if (pendingStyles.contains(key)) {
                    pendingStyles.remove(key)
                } else {
                    pendingStyles.add(key)
                    pendingStyles.remove("codeBlock") // remove code block if active
                    explicitlyOffStyles.remove(key)
                }
            }
            pendingStylesInsertPos = selectionStart
            emitActiveStyles()
            return
        }

        val spannable = text as? Editable ?: return

        // Skip mention ranges — apply formatting only to non-mention text (Req 6.1)
        val segments = nonMentionRanges(start, end, spannable)
        if (segments.isEmpty()) return

        val hasInlineCode = segments.any { seg ->
            spannable.getSpans(seg.first, seg.last + 1, InlineCodeSpan::class.java).isNotEmpty()
        }

        isInternalChange = true
        if (hasInlineCode) {
            for (seg in segments) {
                val segEnd = seg.last + 1 // IntRange.last is inclusive; span APIs need exclusive end
                spannable.getSpans(seg.first, segEnd, InlineCodeSpan::class.java)
                    .forEach { spannable.removeSpan(it) }
                spannable.getSpans(seg.first, segEnd, AbsoluteSizeSpan::class.java)
                    .filter { spannable.getSpanStart(it) >= seg.first && spannable.getSpanEnd(it) <= segEnd }
                    .forEach { spannable.removeSpan(it) }
                spannable.getSpans(seg.first, segEnd, BackgroundColorSpan::class.java)
                    .filter { spannable.getSpanStart(it) >= seg.first && spannable.getSpanEnd(it) <= segEnd }
                    .forEach { spannable.removeSpan(it) }
                spannable.getSpans(seg.first, segEnd, ForegroundColorSpan::class.java)
                    .filter { spannable.getSpanStart(it) >= seg.first && spannable.getSpanEnd(it) <= segEnd }
                    .forEach { spannable.removeSpan(it) }
            }
        } else {
            val fontSize = inlineCodeFontSize ?: 12f
            val codeColor = inlineCodeTextColor ?: Color.parseColor("#6852D6")
            for (seg in segments) {
                val segEnd = seg.last + 1 // IntRange.last is inclusive; span APIs need exclusive end
                spannable.setSpan(AbsoluteSizeSpan(fontSize.toInt(), true), seg.first, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                spannable.setSpan(InlineCodeSpan(), seg.first, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                spannable.setSpan(ForegroundColorSpan(codeColor), seg.first, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
        }
        setSelection(start, end)
        isInternalChange = false
        invalidate()
        sendContentChange()
        updateToolbarButtonStates()
    }

    /**
     * Selection to style: the live selection, falling back to the saved one because tapping a
     * toolbar button can clear it. Returns null when there is nothing to style.
     */
    private fun styleTargetRange(): Pair<Int, Int>? {
        var start = selectionStart
        var end = selectionEnd
        if (start >= end && savedSelectionStart < savedSelectionEnd) {
            start = savedSelectionStart
            end = savedSelectionEnd
        }
        val textLength = text?.length ?: 0
        start = start.coerceIn(0, textLength)
        end = end.coerceIn(start, textLength)
        return if (start < end) Pair(start, end) else null
    }

    /**
     * Drops consumer-applied [key] spans inside [start]..[end], preserving the parts that fall
     * outside it. getSpans() also returns spans that merely OVERLAP the range, so removing them
     * outright would clear colour beyond it; the outside parts are re-applied instead. This is
     * what iOS gets implicitly, since an attributed-string attribute is per-character.
     */
    private fun clearInlineStyleSpans(
        spannable: Editable,
        key: String,
        start: Int,
        end: Int,
        keepColor: Int? = null,
    ) {
        val spans: Array<out Any> = when (key) {
            "color" -> spannable.getSpans(start, end, ExternalForegroundColorSpan::class.java)
            "backgroundColor" -> spannable.getSpans(start, end, ExternalBackgroundColorSpan::class.java)
            else -> return
        }
        spans.forEach { span ->
            val spanStart = spannable.getSpanStart(span)
            val spanEnd = spannable.getSpanEnd(span)
            val color = when (span) {
                is ExternalForegroundColorSpan -> span.color
                is ExternalBackgroundColorSpan -> span.color
                else -> return@forEach
            }
            // Leave a span that already carries the colour being applied. Trimming and re-setting
            // it per keystroke would shatter one run into a chain of one-character spans, each
            // emitting its own <color=…> tag.
            if (keepColor != null && color == keepColor) return@forEach
            spannable.removeSpan(span)
            if (spanStart < start) {
                spannable.setSpan(
                    if (key == "color") ExternalForegroundColorSpan(color) else ExternalBackgroundColorSpan(color),
                    spanStart, start, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                )
            }
            if (spanEnd > end) {
                spannable.setSpan(
                    if (key == "color") ExternalForegroundColorSpan(color) else ExternalBackgroundColorSpan(color),
                    end, spanEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                )
            }
        }
    }

    /**
     * Applies an arbitrary inline style to the current selection, skipping mentions so a
     * consumer's formatter cannot recolour a mention (§8.2 S4). [color] is an ARGB int from
     * RN's processColor(). Styles of *different* kinds compose (S3), but a second colour
     * replaces the first — a character has exactly one foreground colour.
     *
     * ponytail: colours are the only inline style a trailing-button formatter needs today —
     * widen the `when` if fonts/spacing ever follow.
     */
    fun applyInlineStyle(key: String, color: Int) {
        if (key != "color" && key != "backgroundColor") return

        // No selection: style what gets typed next, matching the built-in bold/italic/code
        // type-ahead rather than silently doing nothing.
        val target = styleTargetRange()
        if (target == null) {
            if (key == "color") {
                pendingExternalColor = color
                pendingStyles.add("externalColor")
            } else {
                pendingExternalBackgroundColor = color
                pendingStyles.add("externalBackgroundColor")
            }
            pendingStylesInsertPos = selectionStart
            return
        }

        val (start, end) = target
        val spannable = text as? Editable ?: return

        isInternalChange = true
        nonMentionRanges(start, end, spannable).forEach { range ->
            val rangeStart = range.first
            val rangeEnd = range.last + 1
            // Recolouring must REPLACE, not stack. Leaving the old span underneath makes
            // extraction report two overlapping textColor ranges for the same characters, and the
            // JS side keeps whichever it sees first — so the earlier colour wins in the sent
            // message even though the newer one is what the composer paints.
            clearInlineStyleSpans(spannable, key, rangeStart, rangeEnd)
            val span: Any =
                if (key == "color") ExternalForegroundColorSpan(color)
                else ExternalBackgroundColorSpan(color)
            spannable.setSpan(span, rangeStart, rangeEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        }
        setSelection(start, end)
        isInternalChange = false
        invalidate()
        sendContentChange()
    }

    /**
     * Removes a previously applied inline style from the current selection. Only consumer-applied
     * spans are removed — mention/link/code colouring is left intact.
     */
    fun removeInlineStyle(key: String) {
        // No selection: cancel the pending type-ahead style instead of no-oping.
        val target = styleTargetRange()
        if (target == null) {
            if (key == "color") {
                pendingExternalColor = null
                pendingStyles.remove("externalColor")
            } else {
                pendingExternalBackgroundColor = null
                pendingStyles.remove("externalBackgroundColor")
            }
            // Clearing the pending colour is not enough. A colour span applied by type-ahead is
            // SPAN_EXCLUSIVE_INCLUSIVE so it grows with typing — a span ending exactly at the cursor
            // would keep swallowing everything typed after the user asked for NO colour. Pin it shut
            // by re-applying it as EXCLUSIVE_EXCLUSIVE.
            (text as? Editable)?.let { s ->
                val cursor = selectionStart.coerceIn(0, s.length)
                val spans: Array<out Any> =
                    if (key == "color") s.getSpans(cursor, cursor, ExternalForegroundColorSpan::class.java)
                    else s.getSpans(cursor, cursor, ExternalBackgroundColorSpan::class.java)
                spans.forEach { span ->
                    val spanStart = s.getSpanStart(span)
                    val spanEnd = s.getSpanEnd(span)
                    if (spanEnd != cursor || spanStart >= spanEnd) return@forEach
                    val colour = when (span) {
                        is ExternalForegroundColorSpan -> span.color
                        is ExternalBackgroundColorSpan -> span.color
                        else -> return@forEach
                    }
                    isInternalChange = true
                    s.removeSpan(span)
                    s.setSpan(
                        if (key == "color") ExternalForegroundColorSpan(colour)
                        else ExternalBackgroundColorSpan(colour),
                        spanStart, spanEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                    )
                    isInternalChange = false
                }
            }
            return
        }

        val (start, end) = target
        val spannable = text as? Editable ?: return

        val spans: Array<out Any> = when (key) {
            "color" -> spannable.getSpans(start, end, ExternalForegroundColorSpan::class.java)
            "backgroundColor" -> spannable.getSpans(start, end, ExternalBackgroundColorSpan::class.java)
            else -> return
        }
        if (spans.isEmpty()) return

        isInternalChange = true
        clearInlineStyleSpans(spannable, key, start, end)
        setSelection(start, end)
        isInternalChange = false
        invalidate()
        sendContentChange()
    }

    /**
     * Current mention ranges in "clean" (ZWS-stripped) coordinates — the same space
     * setMentionRanges() accepts and JS works in. Emitted on every content change so a consumer
     * formatter can read back where mentions ended up after edits (§8.2 S4).
     */
    private fun currentMentionRangesJson(): String {
        val spannable = text as? Spanned ?: return "[]"
        val spans = spannable.getSpans(0, spannable.length, MentionSpan::class.java)
        if (spans.isEmpty()) return "[]"

        val raw = spannable.toString()
        val rawToClean = IntArray(raw.length + 1)
        var clean = 0
        for (i in raw.indices) {
            rawToClean[i] = clean
            if (raw[i] != '\u200B') clean++
        }
        rawToClean[raw.length] = clean

        return spans
            .map { Pair(spannable.getSpanStart(it), spannable.getSpanEnd(it)) }
            .filter { it.first >= 0 && it.second in (it.first + 1)..raw.length }
            .sortedBy { it.first }
            .joinToString(",", "[", "]") {
                """{"start":${rawToClean[it.first]},"end":${rawToClean[it.second]}}"""
            }
    }

    fun onHighlightClick() {
        // Use saved selection if current selection is empty
        var start = selectionStart
        var end = selectionEnd

        if (start >= end && savedSelectionStart < savedSelectionEnd) {
            start = savedSelectionStart
            end = savedSelectionEnd
        }

        // Clamp to current text length
        val textLength = text?.length ?: 0
        start = start.coerceIn(0, textLength)
        end = end.coerceIn(start, textLength)

        if (start >= end) return

        val spannable = text as? Editable ?: return
        val existingSpans = spannable.getSpans(start, end, BackgroundColorSpan::class.java)
            .filter {
                val color = it.backgroundColor
                color == Color.parseColor("#80FFFF00") || color == Color.YELLOW
            }

        isInternalChange = true
        if (existingSpans.isNotEmpty()) {
            existingSpans.forEach { spannable.removeSpan(it) }
        } else {
            spannable.setSpan(BackgroundColorSpan(Color.parseColor("#80FFFF00")), start, end, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        }
        setSelection(start, end)
        isInternalChange = false
        invalidate()
        sendContentChange()
        updateToolbarButtonStates()
    }

    fun onHeadingClick() {
        val (lineStart, lineEnd) = getLineRange()
        if (lineStart >= lineEnd) return

        val spannable = text as? Editable ?: return

        // Check if already a heading
        val existingSpans = spannable.getSpans(lineStart, lineEnd, RelativeSizeSpan::class.java)
        val isHeading = existingSpans.any { it.sizeChange > 1.2f }

        isInternalChange = true
        existingSpans.forEach { spannable.removeSpan(it) }
        spannable.getSpans(lineStart, lineEnd, StyleSpan::class.java)
            .filter { it.style == Typeface.BOLD }
            .forEach { spannable.removeSpan(it) }

        if (!isHeading) {
            spannable.setSpan(RelativeSizeSpan(1.5f), lineStart, lineEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            spannable.setSpan(StyleSpan(Typeface.BOLD), lineStart, lineEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        }
        isInternalChange = false
        sendContentChange()
        updateToolbarButtonStates()
    }

    fun onBulletListClick() {
        toggleListPrefix("• ")
    }

    fun onNumberedListClick() {
        applyNumberedList()
    }

    fun onQuoteClick() {
        toggleQuote()
    }

    fun onChecklistClick() {
        toggleChecklistPrefix()
    }

    fun onLinkClick() {
        promptInsertLink()
    }

    fun onUndoClick() {
        undo()
    }

    fun onRedoClick() {
        redo()
    }

    fun onClearFormattingClick() {
        clearFormatting()
    }

    fun onIndentClick() {
        indent()
    }

    fun onOutdentClick() {
        outdent()
    }

    fun onAlignLeftClick() {
        setAlignment(Layout.Alignment.ALIGN_NORMAL)
    }

    fun onAlignCenterClick() {
        setAlignment(Layout.Alignment.ALIGN_CENTER)
    }

    fun onAlignRightClick() {
        setAlignment(Layout.Alignment.ALIGN_OPPOSITE)
    }

    // ==================== Helper Methods ====================

    /// Returns sub-ranges of `start..<end` that do NOT overlap any MentionSpan or URLSpan.
    /// Used to skip mentions and links when applying inline formatting (Req 6.1).
    private fun nonMentionRanges(start: Int, end: Int, spannable: Spanned): List<IntRange> {
        val mentionSpans = spannable.getSpans(start, end, MentionSpan::class.java)
        val urlSpans = spannable.getSpans(start, end, URLSpan::class.java)

        val protectedRanges = mutableListOf<IntRange>()
        mentionSpans.forEach {
            protectedRanges.add(spannable.getSpanStart(it) until spannable.getSpanEnd(it))
        }
        urlSpans.forEach {
            protectedRanges.add(spannable.getSpanStart(it) until spannable.getSpanEnd(it))
        }
        if (protectedRanges.isEmpty()) return listOf(start until end)
        protectedRanges.sortBy { it.first }

        val result = mutableListOf<IntRange>()
        var cursor = start
        for (pr in protectedRanges) {
            if (cursor < pr.first) {
                result.add(cursor until pr.first)
            }
            cursor = pr.last + 1 // IntRange.last is inclusive; advance past the protected range
        }
        if (cursor < end) {
            result.add(cursor until end)
        }
        return result
    }

    private fun toggleStyle(style: Int) {
        // Use saved selection if current selection is empty (can happen when clicking toolbar)
        var start = selectionStart
        var end = selectionEnd

        if (start >= end && savedSelectionStart < savedSelectionEnd) {
            start = savedSelectionStart
            end = savedSelectionEnd
            android.util.Log.d("RichTextEditor", "Using saved selection: start=$start, end=$end")
        }

        // Clamp to current text length to prevent IndexOutOfBoundsException
        val textLength = text?.length ?: 0
        start = start.coerceIn(0, textLength)
        end = end.coerceIn(start, textLength)

        android.util.Log.d("RichTextEditor", "toggleStyle called: style=$style, start=$start, end=$end")

        // No selection: toggle pending style for type-ahead (Slack-style)
        if (start >= end) {
            val key = when (style) {
                Typeface.BOLD -> "bold"
                Typeface.ITALIC -> "italic"
                else -> return
            }

            // Check if cursor is currently inside a span of this style
            val spannable = text as? Spanned
            val cursorPos = selectionStart
            val isInsideStyle = if (spannable != null && cursorPos > 0) {
                spannable.getSpans(cursorPos - 1, cursorPos, StyleSpan::class.java)
                    .any { it.style == style }
            } else false

            if (isInsideStyle) {
                // Inside styled text — toggle between explicitly-off and normal
                if (explicitlyOffStyles.contains(key)) {
                    explicitlyOffStyles.remove(key)
                } else {
                    explicitlyOffStyles.add(key)
                    pendingStyles.remove(key)
                }
            } else {
                // Not inside styled text — toggle pending on/off
                if (pendingStyles.contains(key)) {
                    pendingStyles.remove(key)
                } else {
                    pendingStyles.add(key)
                    explicitlyOffStyles.remove(key)
                }
            }
            pendingStylesInsertPos = selectionStart
            emitActiveStyles()
            return
        }

        val spannable = text as? Editable ?: return

        // Skip mention ranges — apply formatting only to non-mention text (Req 6.1)
        val segments = nonMentionRanges(start, end, spannable)
        if (segments.isEmpty()) return

        val hasStyle = segments.any { seg ->
            spannable.getSpans(seg.first, seg.last + 1, StyleSpan::class.java)
                .any { it.style == style }
        }

        isInternalChange = true
        if (hasStyle) {
            android.util.Log.d("RichTextEditor", "Removing style $style")
            for (seg in segments) {
                val segEnd = seg.last + 1 // IntRange.last is inclusive; span APIs need exclusive end
                spannable.getSpans(seg.first, segEnd, StyleSpan::class.java)
                    .filter { it.style == style }
                    .forEach { spannable.removeSpan(it) }
            }
        } else {
            android.util.Log.d("RichTextEditor", "Applying style $style")
            for (seg in segments) {
                val segEnd = seg.last + 1 // IntRange.last is inclusive; span APIs need exclusive end
                spannable.setSpan(StyleSpan(style), seg.first, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
        }
        // Restore and maintain selection after applying style
        setSelection(start, end)
        isInternalChange = false
        invalidate()
        sendContentChange()
        updateToolbarButtonStates()
        emitActiveStyles()
    }

    private fun <T : Any> toggleSpan(spanClass: Class<T>, createSpan: () -> Any) {
        // Use saved selection if current selection is empty
        var start = selectionStart
        var end = selectionEnd

        if (start >= end && savedSelectionStart < savedSelectionEnd) {
            start = savedSelectionStart
            end = savedSelectionEnd
        }

        // Clamp to current text length to prevent IndexOutOfBoundsException
        val textLength = text?.length ?: 0
        start = start.coerceIn(0, textLength)
        end = end.coerceIn(start, textLength)

        // No selection: toggle pending style for type-ahead
        if (start >= end) {
            val key = when (spanClass) {
                UnderlineSpan::class.java -> "underline"
                StrikethroughSpan::class.java -> "strikethrough"
                else -> return
            }

            // Check if cursor is currently inside a span of this type
            val spannableText = text as? Spanned
            val cursorPos = selectionStart
            val isInsideStyle = if (spannableText != null && cursorPos > 0) {
                spannableText.getSpans(cursorPos - 1, cursorPos, spanClass).isNotEmpty()
            } else false

            if (isInsideStyle) {
                if (explicitlyOffStyles.contains(key)) {
                    explicitlyOffStyles.remove(key)
                } else {
                    explicitlyOffStyles.add(key)
                    pendingStyles.remove(key)
                }
            } else {
                if (pendingStyles.contains(key)) {
                    pendingStyles.remove(key)
                } else {
                    pendingStyles.add(key)
                    explicitlyOffStyles.remove(key)
                }
            }
            pendingStylesInsertPos = selectionStart
            emitActiveStyles()
            return
        }

        val spannable = text as? Editable ?: return

        // Skip mention ranges — apply formatting only to non-mention text (Req 6.1)
        val segments = nonMentionRanges(start, end, spannable)
        if (segments.isEmpty()) return

        val hasSpan = segments.any { seg ->
            spannable.getSpans(seg.first, seg.last + 1, spanClass).isNotEmpty()
        }

        isInternalChange = true
        if (hasSpan) {
            for (seg in segments) {
                val segEnd = seg.last + 1 // IntRange.last is inclusive; span APIs need exclusive end
                spannable.getSpans(seg.first, segEnd, spanClass)
                    .forEach { spannable.removeSpan(it) }
            }
        } else {
            for (seg in segments) {
                val segEnd = seg.last + 1 // IntRange.last is inclusive; span APIs need exclusive end
                spannable.setSpan(createSpan(), seg.first, segEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
        }
        // Restore and maintain selection after applying style
        setSelection(start, end)
        isInternalChange = false
        invalidate()
        sendContentChange()
        updateToolbarButtonStates()
        emitActiveStyles()
    }

    private fun toggleListPrefix(prefix: String) {
        val (lineStart, lineEnd) = getLineRange()
        val currentText = text?.toString() ?: return
        val s = text as? Editable ?: return

        // Mutual exclusivity: if code block is active, remove it first (Req 14.1, 14.3)
        val existingMonospace = s.getSpans(lineStart, lineEnd, TypefaceSpan::class.java)
            .filter { it.family == "monospace" }
        if (existingMonospace.isNotEmpty()) {
            isInternalChange = true
            existingMonospace.forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, CodeBlockBorderSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, BackgroundColorSpan::class.java)
                .filter { s.getSpanStart(it) >= lineStart && s.getSpanEnd(it) <= lineEnd }
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, StyleSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, UnderlineSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, StrikethroughSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, InlineCodeSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, ForegroundColorSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, AbsoluteSizeSpan::class.java)
                .filter { s.getSpanStart(it) >= lineStart && s.getSpanEnd(it) <= lineEnd }
                .forEach { s.removeSpan(it) }
            pendingStyles.remove("codeBlock")
            pendingStyles.remove("bold")
            pendingStyles.remove("italic")
            pendingStyles.remove("underline")
            pendingStyles.remove("strikethrough")
            pendingStyles.remove("code")
            explicitlyOffStyles.clear()
            isInternalChange = false
        } else if (pendingStyles.contains("codeBlock")) {
            pendingStyles.remove("codeBlock")
            pendingStyles.remove("bold")
            pendingStyles.remove("italic")
            pendingStyles.remove("underline")
            pendingStyles.remove("strikethrough")
            pendingStyles.remove("code")
            explicitlyOffStyles.clear()
        }

        val selectedText = currentText.substring(lineStart, lineEnd)
        val lines = selectedText.split("\n")

        val numberedRegex = Regex("^\\d+\\.\\s")

        // Check if all non-empty lines already have this prefix (accounting for optional blockquote)
        val hasNonEmptyLines = lines.any { it.trimEnd().isNotEmpty() }
        val allHavePrefix = hasNonEmptyLines && lines.all { line ->
            if (line.trimEnd().isEmpty()) return@all true
            val content = if (line.startsWith("▎ ")) line.substring(2) else line
            content.startsWith(prefix)
        }

        val newLines = lines.map { line ->
            // Preserve blockquote prefix if present
            val hasQuote = line.startsWith("▎ ")
            val quoteStr = if (hasQuote) "▎ " else ""
            val lineContent = if (hasQuote) line.substring(2) else line

            if (allHavePrefix) {
                // Removing prefix — skip empty lines, preserve blockquote
                if (line.trimEnd().isEmpty()) return@map line
                if (lineContent.startsWith(prefix)) {
                    quoteStr + lineContent.substring(prefix.length)
                } else {
                    line
                }
            } else {
                // Adding prefix — preserve blockquote, strip other prefixes (not blockquote)
                val cleanLine = removeExistingPrefixKeepQuote(lineContent)
                quoteStr + prefix + cleanLine
            }
        }

        val newText = newLines.joinToString("\n")

        // Snapshot mention spans before text modification (Req 5.1, 5.2, 5.7)
        val mentionSnapshots = snapshotMentionSpans(lineStart, lineEnd)
        val colorSnapshots = snapshotInlineColorSpans(lineStart, lineEnd)

        isInternalChange = true
        val editable = text ?: return
        editable.replace(lineStart, lineEnd, newText)

        // Restore mention spans at adjusted positions
        if (mentionSnapshots.isNotEmpty()) {
            val offsetDelta = newText.length - (lineEnd - lineStart)
            restoreMentionSpans(editable, mentionSnapshots, offsetDelta)
        }
        restoreInlineColorSpans(editable, colorSnapshots, lineStart, selectedText, newText)

        setSelection(lineStart + newText.length)
        renumberNumberedLists()
        isInternalChange = false
        applyListIndentation()
        sendContentChange()
        updateToolbarButtonStates()
    }

    private fun applyNumberedList() {
        val (lineStart, lineEnd) = getLineRange()
        val currentText = text?.toString() ?: return
        val s = text as? Editable ?: return

        // Mutual exclusivity: if code block is active, remove it first (Req 14.2, 14.3)
        val existingMonospace = s.getSpans(lineStart, lineEnd, TypefaceSpan::class.java)
            .filter { it.family == "monospace" }
        if (existingMonospace.isNotEmpty()) {
            isInternalChange = true
            existingMonospace.forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, CodeBlockBorderSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, BackgroundColorSpan::class.java)
                .filter { s.getSpanStart(it) >= lineStart && s.getSpanEnd(it) <= lineEnd }
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, StyleSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, UnderlineSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, StrikethroughSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, InlineCodeSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, ForegroundColorSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, AbsoluteSizeSpan::class.java)
                .filter { s.getSpanStart(it) >= lineStart && s.getSpanEnd(it) <= lineEnd }
                .forEach { s.removeSpan(it) }
            pendingStyles.remove("codeBlock")
            pendingStyles.remove("bold")
            pendingStyles.remove("italic")
            pendingStyles.remove("underline")
            pendingStyles.remove("strikethrough")
            pendingStyles.remove("code")
            explicitlyOffStyles.clear()
            isInternalChange = false
        } else if (pendingStyles.contains("codeBlock")) {
            pendingStyles.remove("codeBlock")
            pendingStyles.remove("bold")
            pendingStyles.remove("italic")
            pendingStyles.remove("underline")
            pendingStyles.remove("strikethrough")
            pendingStyles.remove("code")
            explicitlyOffStyles.clear()
        }

        val selectedText = currentText.substring(lineStart, lineEnd)
        val lines = selectedText.split("\n")

        val numberedRegex = Regex("^\\d+\\.\\s")

        // Check if all non-empty lines already have numbered prefix (accounting for optional blockquote)
        val hasNonEmptyLines = lines.any { it.trimEnd().isNotEmpty() }
        val allHaveNumbered = hasNonEmptyLines && lines.all { line ->
            if (line.trimEnd().isEmpty()) return@all true
            val content = if (line.startsWith("▎ ")) line.substring(2) else line
            numberedRegex.containsMatchIn(content)
        }

        val newLines = lines.mapIndexed { index, line ->
            // Preserve blockquote prefix if present
            val hasQuote = line.startsWith("▎ ")
            val quoteStr = if (hasQuote) "▎ " else ""
            val lineContent = if (hasQuote) line.substring(2) else line

            if (allHaveNumbered) {
                // Removing numbered prefix — skip empty lines, preserve blockquote
                if (line.trimEnd().isEmpty()) return@mapIndexed line
                val match = numberedRegex.find(lineContent)
                if (match != null) quoteStr + lineContent.substring(match.value.length) else line
            } else {
                // Adding numbered prefix — preserve blockquote, strip other prefixes
                val cleanLine = removeExistingPrefixKeepQuote(lineContent)
                "$quoteStr${index + 1}. $cleanLine"
            }
        }

        val newText = newLines.joinToString("\n")

        // Snapshot mention spans before text modification (Req 5.1, 5.2, 5.7)
        val mentionSnapshots = snapshotMentionSpans(lineStart, lineEnd)
        val colorSnapshots = snapshotInlineColorSpans(lineStart, lineEnd)

        isInternalChange = true
        val editable = text ?: return
        editable.replace(lineStart, lineEnd, newText)

        // Restore mention spans at adjusted positions
        if (mentionSnapshots.isNotEmpty()) {
            val offsetDelta = newText.length - (lineEnd - lineStart)
            restoreMentionSpans(editable, mentionSnapshots, offsetDelta)
        }
        restoreInlineColorSpans(editable, colorSnapshots, lineStart, selectedText, newText)

        setSelection(lineStart + newText.length)
        renumberNumberedLists()
        isInternalChange = false
        applyListIndentation()
        sendContentChange()
        updateToolbarButtonStates()
    }

    private fun detectBackspaceInListPrefix(s: CharSequence?, start: Int, count: Int, after: Int) {
        pendingPrefixDeletion = null
        if (isInternalChange || s == null || count != 1 || after != 0) return

        val text = s.toString()
        var lineStart = start
        while (lineStart > 0 && text[lineStart - 1] != '\n') lineStart--

        val lineEnd = text.indexOf('\n', lineStart).let { if (it == -1) text.length else it }
        val line = text.substring(lineStart, lineEnd)

        val numberedMatch = Regex("^(\\d+)\\.\\s").find(line)
        if (numberedMatch != null && start < lineStart + numberedMatch.value.length) {
            pendingPrefixDeletion = Pair(lineStart, numberedMatch.value.length)
            return
        }
        if ((line.startsWith("• ") || line.startsWith("☐ ") || line.startsWith("☑ ") || line.startsWith("▎ ")) && start < lineStart + 2) {
            pendingPrefixDeletion = Pair(lineStart, 2)
            return
        }
    }

    private fun handleBackspaceInListPrefix(s: Editable?): Boolean {
        val deletion = pendingPrefixDeletion ?: return false
        pendingPrefixDeletion = null
        if (s == null) return false

        val (origLineStart, origPrefixLen) = deletion
        // After the single-char delete, the remaining prefix starts at the same lineStart
        // but is now origPrefixLen - 1 chars long
        val remainingLen = origPrefixLen - 1
        if (remainingLen <= 0) return false
        if (origLineStart + remainingLen > s.length) return false

        isInternalChange = true
        s.delete(origLineStart, origLineStart + remainingLen)
        setSelection(origLineStart)
        renumberNumberedLists()
        isInternalChange = false
        return true
    }

    /**
     * Detects three consecutive Enter presses inside a code block and exits code block mode.
     * Removes the trailing three newlines, clears CodeBlockBorderSpan and TypefaceSpan("monospace")
     * from the last code block line, removes "codeBlock" from pendingStyles, and emits updated
     * active styles. Follows the same isInternalChange guard pattern as autoContinueListOnEnter().
     */
    private fun checkTripleEnterExitCodeBlock(s: Editable?): Boolean {
        if (s == null) return false
        val cursorPos = selectionStart
        if (cursorPos < 3 || cursorPos > s.length) return false

        // Check that the last 3 characters at cursor are all newlines
        if (s[cursorPos - 1] != '\n' || s[cursorPos - 2] != '\n' || s[cursorPos - 3] != '\n') return false

        // Check if we're inside a code block — either via pendingStyles or CodeBlockBorderSpan
        val inCodeBlock = pendingStyles.contains("codeBlock") ||
            (cursorPos > 3 && s.getSpans(cursorPos - 4, cursorPos - 3, CodeBlockBorderSpan::class.java).isNotEmpty())
        if (!inCodeBlock) return false

        isInternalChange = true

        // Remove the trailing 3 newlines
        val newCursorPos = cursorPos - 3
        s.delete(newCursorPos, cursorPos)

        // Keep CodeBlockBorderSpan and TypefaceSpan on the last content line —
        // it's still valid code block content. Instead, insert a newline after
        // the code block and place the cursor on the fresh normal line.
        s.insert(newCursorPos, "\n")
        val freshLinePos = newCursorPos + 1

        // Trim code block spans so they end at newCursorPos (the \n boundary),
        // preventing the EXCLUSIVE_INCLUSIVE flag from absorbing the new line.
        s.getSpans(newCursorPos, freshLinePos, CodeBlockBorderSpan::class.java).forEach { span ->
            val spanStart = s.getSpanStart(span)
            val spanEnd = s.getSpanEnd(span)
            if (spanEnd > newCursorPos) {
                s.removeSpan(span)
                if (spanStart < newCursorPos) {
                    s.setSpan(CodeBlockBorderSpan(density), spanStart, newCursorPos, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                }
            }
        }
        s.getSpans(newCursorPos, freshLinePos, TypefaceSpan::class.java)
            .filter { it.family == "monospace" }
            .forEach { span ->
                val spanStart = s.getSpanStart(span)
                val spanEnd = s.getSpanEnd(span)
                if (spanEnd > newCursorPos) {
                    s.removeSpan(span)
                    if (spanStart < newCursorPos) {
                        s.setSpan(TypefaceSpan("monospace"), spanStart, newCursorPos, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                    }
                }
            }

        // Exit code block mode
        pendingStyles.remove("codeBlock")
        suppressCodeBlockShortcut = false
        setSelection(freshLinePos.coerceAtMost(s.length))

        isInternalChange = false

        emitActiveStyles()
        sendContentChangeWithDelta()
        updateCodeBlockEdgePadding()
        updateContentSize()
        return true
    }

    private fun autoContinueListOnEnter(s: Editable?): Boolean {
        if (s == null) return false
        val cursorPos = selectionStart
        if (cursorPos <= 0 || cursorPos > s.length) return false
        if (s[cursorPos - 1] != '\n') return false

        if (cursorPos >= 2 && s[cursorPos - 2] == '\n') return false

        val text = s.toString()
        var prevLineStart = cursorPos - 2
        while (prevLineStart > 0 && text[prevLineStart - 1] != '\n') prevLineStart--
        if (prevLineStart < 0) prevLineStart = 0

        val prevLine = text.substring(prevLineStart, cursorPos - 1)

        // Combined blockquote + list prefixes (ENG-31998): must check before individual prefixes
        val quoteNumberedMatch = Regex("^▎ (\\d+)\\.\\s").find(prevLine)
        if (quoteNumberedMatch != null) {
            val content = prevLine.substring(quoteNumberedMatch.value.length)
            if (content.isBlank()) {
                isInternalChange = true
                s.delete(prevLineStart, cursorPos)
                setSelection(prevLineStart.coerceAtMost(s.length))
                isInternalChange = false
                return true
            }
            val nextNum = (quoteNumberedMatch.groupValues[1].toIntOrNull() ?: 0) + 1
            val prefix = "▎ $nextNum. "
            isInternalChange = true
            s.insert(cursorPos, prefix)
            // Make ▎ invisible — bar is custom-drawn in onDraw()
            s.setSpan(ForegroundColorSpan(Color.TRANSPARENT), cursorPos, cursorPos + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            setSelection(cursorPos + prefix.length)
            renumberNumberedLists()
            isInternalChange = false
            return true
        }

        if (prevLine.startsWith("▎ • ")) {
            val content = prevLine.substring(4)
            if (content.isBlank()) {
                isInternalChange = true
                s.delete(prevLineStart, cursorPos)
                setSelection(prevLineStart.coerceAtMost(s.length))
                isInternalChange = false
                return true
            }
            isInternalChange = true
            s.insert(cursorPos, "▎ • ")
            // Make ▎ invisible — bar is custom-drawn in onDraw()
            s.setSpan(ForegroundColorSpan(Color.TRANSPARENT), cursorPos, cursorPos + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            setSelection(cursorPos + 4)
            isInternalChange = false
            return true
        }

        val numberedMatch = Regex("^(\\d+)\\.\\s").find(prevLine)
        if (numberedMatch != null) {
            val content = prevLine.substring(numberedMatch.value.length)
            if (content.isBlank()) {
                isInternalChange = true
                s.delete(prevLineStart, cursorPos)
                setSelection(prevLineStart.coerceAtMost(s.length))
                isInternalChange = false
                return true
            }
            val nextNum = (numberedMatch.groupValues[1].toIntOrNull() ?: 0) + 1
            val prefix = "$nextNum. "
            isInternalChange = true
            s.insert(cursorPos, prefix)
            setSelection(cursorPos + prefix.length)
            renumberNumberedLists()
            isInternalChange = false
            return true
        }

        if (prevLine.startsWith("• ")) {
            val content = prevLine.substring(2)
            if (content.isBlank()) {
                isInternalChange = true
                s.delete(prevLineStart, cursorPos)
                setSelection(prevLineStart.coerceAtMost(s.length))
                isInternalChange = false
                return true
            }
            isInternalChange = true
            s.insert(cursorPos, "• ")
            setSelection(cursorPos + 2)
            isInternalChange = false
            return true
        }

        if (prevLine.startsWith("☐ ") || prevLine.startsWith("☑ ")) {
            val content = prevLine.substring(2)
            if (content.isBlank()) {
                isInternalChange = true
                s.delete(prevLineStart, cursorPos)
                setSelection(prevLineStart.coerceAtMost(s.length))
                isInternalChange = false
                return true
            }
            isInternalChange = true
            s.insert(cursorPos, "☐ ")
            setSelection(cursorPos + 2)
            isInternalChange = false
            return true
        }

        if (prevLine.startsWith("▎ ")) {
            val content = prevLine.substring(2)
            if (content.isBlank()) {
                isInternalChange = true
                s.delete(prevLineStart, cursorPos)
                setSelection(prevLineStart.coerceAtMost(s.length))
                isInternalChange = false
                return true
            }
            isInternalChange = true
            s.insert(cursorPos, "▎ ")
            // Make ▎ invisible — bar is custom-drawn in onDraw()
            s.setSpan(ForegroundColorSpan(Color.TRANSPARENT), cursorPos, cursorPos + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            setSelection(cursorPos + 2)
            isInternalChange = false
            return true
        }

        return false
    }

    /// Scan all lines and renumber contiguous numbered-list blocks sequentially,
    /// continuing across bullet-list interruptions (Slack behavior).
    /// Bullet lines (- or • or ‧ prefix) are skipped without resetting the counter.
    /// Any other non-matching line (blank, regular text, quote, etc.) ends the block
    /// and resets the counter for the next block.
    /// Requirements: 4.1, 4.2, 4.3
    private fun renumberNumberedLists() {
        val editable = text ?: return
        val fullText = editable.toString()
        if (fullText.isEmpty()) return

        val lines = fullText.split("\n")
        val numberedRegex = Regex("^(\\d+)\\.\\s")
        val quoteNumberedRegex = Regex("^▎ (\\d+)\\.\\s")
        val bulletRegex = Regex("^(- |• |‧ |▎ - |▎ • |▎ ‧ )")

        var counter = 0
        var offset = 0
        val replacements = mutableListOf<Triple<Int, Int, String>>()

        for (line in lines) {
            val quoteMatch = quoteNumberedRegex.find(line)
            val match = numberedRegex.find(line)
            if (quoteMatch != null) {
                // Blockquote + numbered: "▎ N. " — renumber preserving quote prefix
                counter++
                val oldPrefix = quoteMatch.value
                val newPrefix = "▎ $counter. "
                if (oldPrefix != newPrefix) {
                    replacements.add(Triple(offset, oldPrefix.length, newPrefix))
                }
            } else if (match != null) {
                counter++
                val oldPrefix = match.value
                val newPrefix = "$counter. "
                if (oldPrefix != newPrefix) {
                    replacements.add(Triple(offset, oldPrefix.length, newPrefix))
                }
            } else if (bulletRegex.containsMatchIn(line)) {
                // Bullet lines don't reset the counter — ordered numbering
                // continues across bullet interruptions (Slack behavior).
            } else {
                counter = 0
            }
            offset += line.length + 1
        }

        if (replacements.isNotEmpty()) {
            val cursorPos = selectionStart

            // Compute cursor shift caused by prefix length changes before the cursor
            var cursorDelta = 0
            for ((start, length, newPrefix) in replacements) {
                if (start + length <= cursorPos) {
                    cursorDelta += newPrefix.length - length
                }
            }

            // Apply replacements in reverse order to preserve earlier offsets
            for ((start, length, newPrefix) in replacements.reversed()) {
                editable.replace(start, start + length, newPrefix)
            }

            // Restore cursor position adjusted for any prefix length changes
            val adjustedCursor = (cursorPos + cursorDelta).coerceIn(0, editable.length)
            setSelection(adjustedCursor)
        }
    }

    /**
     * Snapshots all MentionSpan instances within [start, end) so they can be
     * restored at adjusted positions after a block-formatter text modification.
     */
    private fun snapshotMentionSpans(start: Int, end: Int): List<Triple<Int, Int, MentionSpan>> {
        val s = text as? Spanned ?: return emptyList()
        return s.getSpans(start, end, MentionSpan::class.java).map { span ->
            Triple(s.getSpanStart(span), s.getSpanEnd(span), span)
        }
    }

    /**
     * Re-applies snapshotted MentionSpans at positions shifted by [offsetDelta]
     * (e.g. after a block-format prefix insertion/removal).
     */
    private fun restoreMentionSpans(
        editable: Editable,
        snapshots: List<Triple<Int, Int, MentionSpan>>,
        offsetDelta: Int
    ) {
        for ((origStart, origEnd, span) in snapshots) {
            val newStart = origStart + offsetDelta
            val newEnd = origEnd + offsetDelta
            if (newStart >= 0 && newEnd <= editable.length) {
                editable.setSpan(span, newStart, newEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
        }
    }

    /** A consumer colour span captured before a block-prefix rewrite. */
    private class ColorSnapshot(val start: Int, val end: Int, val color: Int, val isBackground: Boolean)

    private fun snapshotInlineColorSpans(start: Int, end: Int): List<ColorSnapshot> {
        val s = text as? Spanned ?: return emptyList()
        val out = ArrayList<ColorSnapshot>()
        s.getSpans(start, end, ExternalForegroundColorSpan::class.java).forEach {
            out.add(ColorSnapshot(s.getSpanStart(it), s.getSpanEnd(it), it.color, false))
        }
        s.getSpans(start, end, ExternalBackgroundColorSpan::class.java).forEach {
            out.add(ColorSnapshot(s.getSpanStart(it), s.getSpanEnd(it), it.color, true))
        }
        return out
    }

    /**
     * Re-applies snapshotted consumer colours after a block-prefix rewrite. replace() drops every
     * span in the replaced range, so without this the user's colour disappears the moment the line
     * becomes a list item / quote / checklist.
     *
     * Positions cannot shift by one uniform delta the way restoreMentionSpans() assumes: each line's
     * prefix can grow or shrink by a different amount (`• ` → `1. `, quote kept, empty lines
     * untouched). The prefix rewrite never touches the line's *content*, so the common suffix of the
     * old and new line is that content — which gives each line's prefix length on both sides, and
     * with it an exact content-character mapping.
     */
    private fun restoreInlineColorSpans(
        editable: Editable,
        snapshots: List<ColorSnapshot>,
        lineStart: Int,
        oldRangeText: String,
        newRangeText: String,
    ) {
        if (snapshots.isEmpty()) return
        val oldLines = oldRangeText.split("\n")
        val newLines = newRangeText.split("\n")

        // old absolute offset -> new absolute offset, for content characters only
        val map = HashMap<Int, Int>()
        var oldPos = lineStart
        var newPos = lineStart
        for (i in oldLines.indices) {
            val oldLine = oldLines[i]
            val newLine = newLines.getOrElse(i) { oldLine }
            var contentLen = 0
            while (contentLen < oldLine.length && contentLen < newLine.length &&
                oldLine[oldLine.length - 1 - contentLen] == newLine[newLine.length - 1 - contentLen]
            ) {
                contentLen++
            }
            val oldPrefix = oldLine.length - contentLen
            val newPrefix = newLine.length - contentLen
            for (c in 0..contentLen) map[oldPos + oldPrefix + c] = newPos + newPrefix + c
            oldPos += oldLine.length + 1
            newPos += newLine.length + 1
        }

        val oldRangeEnd = lineStart + oldRangeText.length
        for (snap in snapshots) {
            // getSpans() also returns spans overhanging the rewritten range; only the part inside
            // it was destroyed, so clamp and restore just that.
            val newStart = map[snap.start.coerceIn(lineStart, oldRangeEnd)] ?: continue
            val newEnd = map[snap.end.coerceIn(lineStart, oldRangeEnd)] ?: continue
            if (newEnd > newStart && newStart >= 0 && newEnd <= editable.length) {
                editable.setSpan(
                    if (snap.isBackground) ExternalBackgroundColorSpan(snap.color)
                    else ExternalForegroundColorSpan(snap.color),
                    newStart, newEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                )
            }
        }
    }

    private fun toggleQuote() {
        val (lineStart, lineEnd) = getLineRange()
        val currentText = text?.toString() ?: return
        val lineText = currentText.substring(lineStart, lineEnd)
        val s = text as? Editable ?: return

        val quotePrefix = "▎ "

        // Mutual exclusivity: if code block is active, remove it first (Req 13.2)
        val existingMonospace = s.getSpans(lineStart, lineEnd, TypefaceSpan::class.java)
            .filter { it.family == "monospace" }
        if (existingMonospace.isNotEmpty()) {
            isInternalChange = true
            existingMonospace.forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, CodeBlockBorderSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, BackgroundColorSpan::class.java)
                .filter { s.getSpanStart(it) >= lineStart && s.getSpanEnd(it) <= lineEnd }
                .forEach { s.removeSpan(it) }
            // Also clear inline formatting spans left from code block
            s.getSpans(lineStart, lineEnd, StyleSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, UnderlineSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, StrikethroughSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, InlineCodeSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, ForegroundColorSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, AbsoluteSizeSpan::class.java)
                .filter { s.getSpanStart(it) >= lineStart && s.getSpanEnd(it) <= lineEnd }
                .forEach { s.removeSpan(it) }
            // Reset pending code block styles
            pendingStyles.remove("codeBlock")
            pendingStyles.remove("bold")
            pendingStyles.remove("italic")
            pendingStyles.remove("underline")
            pendingStyles.remove("strikethrough")
            pendingStyles.remove("code")
            explicitlyOffStyles.clear()
            isInternalChange = false
        } else if (pendingStyles.contains("codeBlock")) {
            // Code block active via pending styles on empty line
            pendingStyles.remove("codeBlock")
            pendingStyles.remove("bold")
            pendingStyles.remove("italic")
            pendingStyles.remove("underline")
            pendingStyles.remove("strikethrough")
            pendingStyles.remove("code")
            explicitlyOffStyles.clear()
        }

        // Snapshot mention spans before text modification (Req 5.1, 5.3, 5.7)
        val mentionSnapshots = snapshotMentionSpans(lineStart, lineEnd)
        val colorSnapshots = snapshotInlineColorSpans(lineStart, lineEnd)

        isInternalChange = true
        val editable = text ?: return

        if (lineText.startsWith(quotePrefix)) {
            // Remove quote prefix — preserve any list prefix underneath
            val unquoted = lineText.substring(quotePrefix.length)
            editable.replace(lineStart, lineEnd, unquoted)
            // Restore mention spans shifted back by prefix length
            if (mentionSnapshots.isNotEmpty()) {
                restoreMentionSpans(editable, mentionSnapshots, -quotePrefix.length)
            }
            restoreInlineColorSpans(editable, colorSnapshots, lineStart, lineText, unquoted)
        } else {
            // Add quote prefix — preserve existing list prefix
            val quoted = "$quotePrefix$lineText"
            editable.replace(lineStart, lineEnd, quoted)
            // Make ▎ invisible — bar is custom-drawn in onDraw()
            editable.setSpan(ForegroundColorSpan(Color.TRANSPARENT), lineStart, lineStart + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            // Restore mention spans shifted forward by prefix length
            if (mentionSnapshots.isNotEmpty()) {
                restoreMentionSpans(editable, mentionSnapshots, quotePrefix.length)
            }
            restoreInlineColorSpans(editable, colorSnapshots, lineStart, lineText, quoted)
        }
        isInternalChange = false
        applyListIndentation()
        sendContentChange()
        updateToolbarButtonStates() // reflect mutually exclusive state (Req 13.3)
    }

    private fun toggleChecklistPrefix() {
        val (lineStart, lineEnd) = getLineRange()
        val currentText = text?.toString() ?: return
        val lineText = currentText.substring(lineStart, lineEnd)
        val s = text as? Editable ?: return

        // Mutual exclusivity: if code block is active, remove it first (Req 14.1, 14.3)
        val existingMonospace = s.getSpans(lineStart, lineEnd, TypefaceSpan::class.java)
            .filter { it.family == "monospace" }
        if (existingMonospace.isNotEmpty()) {
            isInternalChange = true
            existingMonospace.forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, CodeBlockBorderSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, BackgroundColorSpan::class.java)
                .filter { s.getSpanStart(it) >= lineStart && s.getSpanEnd(it) <= lineEnd }
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, StyleSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, UnderlineSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, StrikethroughSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, InlineCodeSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, ForegroundColorSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, AbsoluteSizeSpan::class.java)
                .filter { s.getSpanStart(it) >= lineStart && s.getSpanEnd(it) <= lineEnd }
                .forEach { s.removeSpan(it) }
            pendingStyles.remove("codeBlock")
            pendingStyles.remove("bold")
            pendingStyles.remove("italic")
            pendingStyles.remove("underline")
            pendingStyles.remove("strikethrough")
            pendingStyles.remove("code")
            explicitlyOffStyles.clear()
            isInternalChange = false
        } else if (pendingStyles.contains("codeBlock")) {
            pendingStyles.remove("codeBlock")
            pendingStyles.remove("bold")
            pendingStyles.remove("italic")
            pendingStyles.remove("underline")
            pendingStyles.remove("strikethrough")
            pendingStyles.remove("code")
            explicitlyOffStyles.clear()
        }

        isInternalChange = true
        val editable = text ?: return

        when {
            lineText.startsWith("☐ ") -> {
                // Remove checklist
                editable.delete(lineStart, lineStart + 2)
            }
            lineText.startsWith("☑ ") -> {
                // Remove checklist
                editable.delete(lineStart, lineStart + 2)
            }
            else -> {
                // Add checklist. Only this branch needs colour re-applied — delete() above shifts
                // spans rather than dropping them.
                val cleanLine = removeExistingPrefix(lineText)
                val checked = "☐ $cleanLine"
                val colorSnapshots = snapshotInlineColorSpans(lineStart, lineEnd)
                editable.replace(lineStart, lineEnd, checked)
                restoreInlineColorSpans(editable, colorSnapshots, lineStart, lineText, checked)
            }
        }
        isInternalChange = false
        renumberNumberedLists()
        applyListIndentation()
        sendContentChange()
        updateToolbarButtonStates()
    }

    private fun removeExistingPrefix(line: String): String {
        return when {
            line.startsWith("• ") -> line.substring(2)
            line.startsWith("☐ ") || line.startsWith("☑ ") -> line.substring(2)
            line.matches(Regex("^\\d+\\.\\s.*")) -> line.replace(Regex("^\\d+\\.\\s"), "")
            line.startsWith("\"") && line.endsWith("\"") && line.length >= 2 -> line.substring(1, line.length - 1)
            line.startsWith("▎ ") -> line.substring(2)
            else -> line
        }
    }

    /** Strips list/checklist prefixes but preserves blockquote prefix. */
    private fun removeExistingPrefixKeepQuote(line: String): String {
        return when {
            line.startsWith("• ") -> line.substring(2)
            line.startsWith("☐ ") || line.startsWith("☑ ") -> line.substring(2)
            line.matches(Regex("^\\d+\\.\\s.*")) -> line.replace(Regex("^\\d+\\.\\s"), "")
            else -> line
        }
    }

    /**
     * Applies LeadingMarginSpan to lines with list/blockquote prefixes so that
     * wrapped long text indents past the prefix (hanging indent). Also makes
     * the ▎ blockquote character invisible since the bar is custom-drawn in onDraw().
     * Mirrors iOS applyListIndentation() behavior (ENG-31433).
     */
    private fun applyListIndentation() {
        val s = text as? Editable ?: return
        val fullText = s.toString()
        if (fullText.isEmpty()) return

        val textPaint = paint

        // Remove all existing LeadingMarginSpan.Standard spans first
        s.getSpans(0, s.length, LeadingMarginSpan.Standard::class.java).forEach { s.removeSpan(it) }

        val lines = fullText.split("\n")
        var offset = 0

        isInternalChange = true
        for ((idx, line) in lines.withIndex()) {
            val lineEnd = offset + line.length
            val lineRange = offset until lineEnd.coerceAtMost(s.length)

            if (lineRange.isEmpty() || lineRange.first >= s.length) {
                offset = lineEnd + 1
                continue
            }

            val safeEnd = lineRange.last.coerceAtMost(s.length - 1) + 1
            val safeStart = lineRange.first

            var prefixWidth = 0f
            when {
                line.startsWith("▎ • ") -> {
                    // Combined blockquote + bullet
                    prefixWidth = textPaint.measureText("▎ • ")
                }
                line.startsWith("▎ ") && quoteNumberedPrefixRegex.containsMatchIn(line) -> {
                    // Combined blockquote + numbered: "▎ N. "
                    val match = quoteNumberedPrefixRegex.find(line)!!
                    prefixWidth = textPaint.measureText(match.value)
                }
                line.startsWith("▎ ") -> {
                    // Plain blockquote
                    prefixWidth = textPaint.measureText("▎ ")
                }
                line.startsWith("• ") -> {
                    prefixWidth = textPaint.measureText("• ")
                }
                numberedPrefixRegex.containsMatchIn(line) -> {
                    val match = numberedPrefixRegex.find(line)!!
                    prefixWidth = textPaint.measureText(match.value)
                }
                line.startsWith("☐ ") || line.startsWith("☑ ") -> {
                    prefixWidth = textPaint.measureText("☐ ")
                }
            }

            if (prefixWidth > 0f && safeStart < safeEnd) {
                s.setSpan(
                    LeadingMarginSpan.Standard(0, prefixWidth.toInt()),
                    safeStart, safeEnd,
                    Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                )
            }

            // Code block horizontal padding — inset text from container edges (matches iOS)
            val isCodeBlockLine = prefixWidth == 0f && safeStart < safeEnd
                && s.getSpans(safeStart, safeEnd, CodeBlockBorderSpan::class.java).isNotEmpty()
            if (isCodeBlockLine) {
                val hPadPx = (CodeBlockBorderSpan.PADDING * density).toInt()
                s.setSpan(
                    LeadingMarginSpan.Standard(hPadPx, hPadPx),
                    safeStart, safeEnd,
                    Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                )

                // Determine first/last line status for this code block line.
                // A line is "first" if the previous line is NOT a code block line.
                // A line is "last" if the next line is NOT a code block line.
                val prevIsCodeBlock = if (idx > 0) {
                    val prevOffset = offset - lines[idx - 1].length - 1
                    val prevEnd = prevOffset + lines[idx - 1].length
                    prevOffset >= 0 && prevEnd > prevOffset
                        && s.getSpans(prevOffset, prevEnd.coerceAtMost(s.length), CodeBlockBorderSpan::class.java).isNotEmpty()
                } else false

                val nextIsCodeBlock = if (idx + 1 < lines.size) {
                    val nextOffset = lineEnd + 1
                    val nextLineEnd = nextOffset + lines[idx + 1].length
                    nextOffset < s.length && nextLineEnd > nextOffset
                        && s.getSpans(nextOffset, nextLineEnd.coerceAtMost(s.length), CodeBlockBorderSpan::class.java).isNotEmpty()
                } else false

                val isFirst = !prevIsCodeBlock
                val isLast = !nextIsCodeBlock

                // Set region-awareness flags on all CodeBlockBorderSpan instances for this line
                val cbSpans = s.getSpans(safeStart, safeEnd, CodeBlockBorderSpan::class.java)
                val dark = isDarkMode()
                for (cb in cbSpans) {
                    cb.isFirstLine = isFirst
                    cb.isLastLine = isLast
                    cb.density = density
                    cb.isDark = dark
                }
            } else if (safeStart < safeEnd) {
                // Non-code-block lines don't need special spacing —
                // vertical padding is purely visual via vPadPx in onDraw().
            }

            // Make ▎ invisible — bar is custom-drawn in onDraw()
            if (line.startsWith("▎") && safeStart < s.length) {
                s.setSpan(
                    ForegroundColorSpan(Color.TRANSPARENT),
                    safeStart, safeStart + 1,
                    Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                )
            }

            offset = lineEnd + 1
        }
        isInternalChange = false
    }

    private fun promptInsertLink() {
        val context = context
        val builder = AlertDialog.Builder(context)
        builder.setTitle("Insert Link")

        val layout = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(50, 40, 50, 10)
        }

        val textInput = EditText(context).apply {
            hint = "Link text"
            // Pre-fill with selected text
            val selectedText = text?.subSequence(selectionStart, selectionEnd)?.toString() ?: ""
            setText(selectedText)
        }

        val urlInput = EditText(context).apply {
            hint = "URL"
        }

        layout.addView(textInput)
        layout.addView(urlInput)
        builder.setView(layout)

        builder.setPositiveButton("Insert") { _, _ ->
            val linkText = textInput.text.toString()
            val url = urlInput.text.toString()
            if (linkText.isNotEmpty() && url.isNotEmpty()) {
                insertLink(url, linkText)
            }
        }
        builder.setNegativeButton("Cancel", null)
        builder.show()
    }

    fun insertLink(url: String, linkText: String) {
        val start = selectionStart
        val end = selectionEnd
        val editable = text ?: return

        // Normalize URL: add https:// if no scheme present
        val normalizedUrl = if (!url.lowercase().startsWith("http://") &&
            !url.lowercase().startsWith("https://") &&
            !url.lowercase().startsWith("mailto:") &&
            !url.lowercase().startsWith("tel:")) {
            "https://$url"
        } else url

        isInternalChange = true
        if (start != end) {
            editable.delete(start, end)
        }

        val linkSpannable = SpannableStringBuilder(linkText)
        linkSpannable.setSpan(NoUnderlineURLSpan(normalizedUrl), 0, linkText.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        linkSpannable.setSpan(ForegroundColorSpan(Color.parseColor("#2196F3")), 0, linkText.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)

        editable.insert(start, linkSpannable)
        isInternalChange = false
        sendContentChange()
    }

    fun removeLink(location: Int, length: Int) {
        val editable = text ?: return
        val end = location + length
        if (location < 0 || end > editable.length) return

        isInternalChange = true
        // Remove URLSpan, link color, and underline spans within the range while preserving display text
        editable.getSpans(location, end, URLSpan::class.java).forEach { editable.removeSpan(it) }
        editable.getSpans(location, end, ForegroundColorSpan::class.java).forEach { span ->
            val ss = editable.getSpanStart(span)
            val se = editable.getSpanEnd(span)
            if (ss >= location && se <= end) {
                editable.removeSpan(span)
            }
        }
        editable.getSpans(location, end, UnderlineSpan::class.java).forEach { span ->
            val ss = editable.getSpanStart(span)
            val se = editable.getSpanEnd(span)
            if (ss >= location && se <= end) {
                editable.removeSpan(span)
            }
        }
        isInternalChange = false
        sendContentChange()
    }

    fun updateLink(location: Int, length: Int, newUrl: String, newText: String) {
        val editable = text ?: return
        val end = location + length
        if (location < 0 || end > editable.length) return

        // Normalize URL: add https:// if no scheme present
        val normalizedUrl = if (!newUrl.lowercase().startsWith("http://") &&
            !newUrl.lowercase().startsWith("https://") &&
            !newUrl.lowercase().startsWith("mailto:") &&
            !newUrl.lowercase().startsWith("tel:")) {
            "https://$newUrl"
        } else newUrl

        isInternalChange = true
        // Remove existing link spans in the range
        editable.getSpans(location, end, URLSpan::class.java).forEach { editable.removeSpan(it) }
        editable.getSpans(location, end, ForegroundColorSpan::class.java).forEach { span ->
            val ss = editable.getSpanStart(span)
            val se = editable.getSpanEnd(span)
            if (ss >= location && se <= end) {
                editable.removeSpan(span)
            }
        }
        editable.getSpans(location, end, UnderlineSpan::class.java).forEach { span ->
            val ss = editable.getSpanStart(span)
            val se = editable.getSpanEnd(span)
            if (ss >= location && se <= end) {
                editable.removeSpan(span)
            }
        }

        // Replace text in range with new display text
        editable.replace(location, end, newText)

        // Apply new link spans on the replaced text
        val newEnd = location + newText.length
        editable.setSpan(NoUnderlineURLSpan(normalizedUrl), location, newEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        editable.setSpan(ForegroundColorSpan(Color.parseColor("#2196F3")), location, newEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        isInternalChange = false
        sendContentChange()
    }

    fun undo() {
        if (undoStack.size > 1) {
            val current = undoStack.removeAt(undoStack.size - 1)
            redoStack.add(current)
            val previous = undoStack.last()

            isInternalChange = true
            setText(previous)
            setSelection(previous.length)
            lastSavedText = previous.toString()
            isInternalChange = false
            sendContentChange()
        }
    }

    fun redo() {
        if (redoStack.isNotEmpty()) {
            val next = redoStack.removeAt(redoStack.size - 1)
            undoStack.add(next)

            isInternalChange = true
            setText(next)
            setSelection(next.length)
            lastSavedText = next.toString()
            isInternalChange = false
            sendContentChange()
        }
    }

    fun clearFormatting() {
        // Use saved selection if current selection is empty
        var start = selectionStart
        var end = selectionEnd

        if (start >= end && savedSelectionStart < savedSelectionEnd) {
            start = savedSelectionStart
            end = savedSelectionEnd
        }

        // Clamp to current text length
        val textLength = text?.length ?: 0
        start = start.coerceIn(0, textLength)
        end = end.coerceIn(start, textLength)

        if (start >= end) return

        val spannable = text as? Editable ?: return

        isInternalChange = true
        // Remove all spans in selection
        spannable.getSpans(start, end, Any::class.java).forEach { span ->
            if (span is StyleSpan || span is UnderlineSpan || span is StrikethroughSpan ||
                span is BackgroundColorSpan || span is ForegroundColorSpan || span is TypefaceSpan ||
                span is RelativeSizeSpan || span is URLSpan || span is InlineCodeSpan ||
                span is AbsoluteSizeSpan) {
                spannable.removeSpan(span)
            }
        }
        setSelection(start, end)
        isInternalChange = false
        sendContentChange()
        updateToolbarButtonStates()
    }

    fun indent() {
        val (lineStart, _) = getLineRange()
        val editable = text ?: return

        isInternalChange = true
        editable.insert(lineStart, "    ")
        isInternalChange = false
        sendContentChange()
    }

    fun outdent() {
        val (lineStart, lineEnd) = getLineRange()
        val currentText = text?.toString() ?: return
        val lineText = currentText.substring(lineStart, lineEnd)
        val editable = text ?: return

        isInternalChange = true
        when {
            lineText.startsWith("    ") -> editable.delete(lineStart, lineStart + 4)
            lineText.startsWith("\t") -> editable.delete(lineStart, lineStart + 1)
            lineText.startsWith(" ") -> {
                var spaces = 0
                for (c in lineText) {
                    if (c == ' ' && spaces < 4) spaces++ else break
                }
                if (spaces > 0) editable.delete(lineStart, lineStart + spaces)
            }
        }
        isInternalChange = false
        sendContentChange()
    }

    fun setAlignment(alignment: Layout.Alignment) {
        val (lineStart, lineEnd) = getLineRange()
        val spannable = text as? Editable ?: return

        isInternalChange = true
        // Remove existing alignment spans
        spannable.getSpans(lineStart, lineEnd, AlignmentSpan.Standard::class.java)
            .forEach { spannable.removeSpan(it) }

        spannable.setSpan(AlignmentSpan.Standard(alignment), lineStart, lineEnd, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        isInternalChange = false
        sendContentChange()
        updateToolbarButtonStates()
    }

    // Legacy method names for ViewManager commands
    fun toggleBold() = onBoldClick()
    fun toggleItalic() = onItalicClick()
    fun toggleUnderline() = onUnderlineClick()
    fun toggleStrikethrough() = onStrikethroughClick()
    fun toggleCode() = onCodeClick()

    fun toggleCodeBlock() {
        val s = text as? Editable ?: return
        var fullText = s.toString()

        // Find current line boundaries
        var lineStart = selectionStart.coerceIn(0, fullText.length)
        while (lineStart > 0 && fullText[lineStart - 1] != '\n') lineStart--
        var lineEnd = (selectionStart.coerceAtLeast(selectionEnd)).coerceIn(0, fullText.length)
        while (lineEnd < fullText.length && fullText[lineEnd] != '\n') lineEnd++

        android.util.Log.d("RichTextEditor", "toggleCodeBlock: lineStart=$lineStart, lineEnd=$lineEnd, pendingStyles=$pendingStyles, textLen=${s.length}, selStart=$selectionStart")

        // Mutual exclusivity: if blockquote is active, remove it first (Req 13.1)
        val quotePrefix = "▎ "
        if (lineStart < lineEnd) {
            val lineText = fullText.substring(lineStart, lineEnd)
            if (lineText.startsWith(quotePrefix)) {
                isInternalChange = true
                s.delete(lineStart, lineStart + quotePrefix.length)
                isInternalChange = false

                // Recalculate text and boundaries after quote removal
                fullText = s.toString()
                lineEnd -= quotePrefix.length
            }
        }

        // Mutual exclusivity: remove list prefixes (bullet, numbered, checklist)
        if (lineStart < lineEnd) {
            val updatedLineText = fullText.substring(lineStart, lineEnd)
            val numberedMatch = Regex("^\\d+\\.\\s").find(updatedLineText)
            when {
                updatedLineText.startsWith("• ") -> {
                    isInternalChange = true
                    s.delete(lineStart, lineStart + 2)
                    isInternalChange = false
                    fullText = s.toString()
                    lineEnd -= 2
                }
                updatedLineText.startsWith("☐ ") || updatedLineText.startsWith("☑ ") -> {
                    isInternalChange = true
                    s.delete(lineStart, lineStart + 2)
                    isInternalChange = false
                    fullText = s.toString()
                    lineEnd -= 2
                }
                numberedMatch != null -> {
                    val prefixLen = numberedMatch.value.length
                    isInternalChange = true
                    s.delete(lineStart, lineStart + prefixLen)
                    isInternalChange = false
                    fullText = s.toString()
                    lineEnd -= prefixLen
                }
            }
        }

        // If line is empty, insert ZWS for immediate container appearance (Slack behavior)
        if (lineStart >= lineEnd) {
            val key = "codeBlock"
            isInternalChange = true
            if (pendingStyles.contains(key)) {
                // Deactivating: remove ZWS and code block spans
                pendingStyles.remove(key)
                pendingStyles.remove("bold")
                pendingStyles.remove("italic")
                pendingStyles.remove("underline")
                pendingStyles.remove("strikethrough")
                pendingStyles.remove("code")
                explicitlyOffStyles.clear()
                suppressCodeBlockShortcut = false
                // Remove ZWS if present at cursor position
                val pos = selectionStart.coerceIn(0, s.length)
                if (pos > 0 && s.length > 0 && s[pos - 1] == '\u200B') {
                    // Explicitly remove code block spans BEFORE deleting the ZWS,
                    // because SPAN_EXCLUSIVE_INCLUSIVE spans can collapse to zero-length
                    // instead of being auto-removed when their only character is deleted.
                    s.getSpans(pos - 1, pos, CodeBlockBorderSpan::class.java)
                        .forEach { s.removeSpan(it) }
                    s.getSpans(pos - 1, pos, TypefaceSpan::class.java)
                        .filter { it.family == "monospace" }
                        .forEach { s.removeSpan(it) }
                    s.delete(pos - 1, pos)
                }
                // Safety: remove any remaining zero-length CodeBlockBorderSpan spans
                // that may have survived the deletion
                s.getSpans(0, s.length, CodeBlockBorderSpan::class.java).forEach { span ->
                    if (s.getSpanStart(span) == s.getSpanEnd(span)) {
                        s.removeSpan(span)
                    }
                }
            } else {
                pendingStyles.add(key)
                pendingStyles.remove("code")
                explicitlyOffStyles.remove("code")
                explicitlyOffStyles.remove(key)
                // Drop an armed consumer colour, or the first character typed into the empty block
                // comes out coloured instead of the code block default (matches iOS).
                pendingExternalColor = null
                pendingExternalBackgroundColor = null
                pendingStyles.remove("externalColor")
                pendingStyles.remove("externalBackgroundColor")
                // Insert ZWS with code block spans for immediate container
                val zws = "\u200B"
                val insertPos = selectionStart.coerceIn(0, s.length)
                s.insert(insertPos, zws)
                s.setSpan(CodeBlockBorderSpan(density), insertPos, insertPos + 1, Spanned.SPAN_EXCLUSIVE_INCLUSIVE)
                s.setSpan(TypefaceSpan("monospace"), insertPos, insertPos + 1, Spanned.SPAN_EXCLUSIVE_INCLUSIVE)
                setSelection(insertPos + 1)
            }
            isInternalChange = false
            pendingStylesInsertPos = selectionStart
            applyListIndentation()
            invalidate()
            sendContentChangeWithDelta()
            saveToUndoStack()
            updateCodeBlockEdgePadding()
            updateContentSize()
            updatePlaceholderVisibility()
            emitActiveStyles()
            return
        }

        // Check if the line already has monospace (code block style)
        val existingMonospace = s.getSpans(lineStart, lineEnd, TypefaceSpan::class.java)
            .filter { it.family == "monospace" }

        isInternalChange = true
        if (existingMonospace.isNotEmpty()) {
            // Deactivating code block — remove code block styling
            suppressCodeBlockShortcut = false
            existingMonospace.forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, CodeBlockBorderSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, BackgroundColorSpan::class.java)
                .filter { s.getSpanStart(it) >= lineStart && s.getSpanEnd(it) <= lineEnd }
                .forEach { s.removeSpan(it) }
            // Clear all inline formatting spans from the affected range (Req 16.1)
            s.getSpans(lineStart, lineEnd, StyleSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, UnderlineSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, StrikethroughSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, InlineCodeSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, ForegroundColorSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, AbsoluteSizeSpan::class.java)
                .filter { s.getSpanStart(it) >= lineStart && s.getSpanEnd(it) <= lineEnd }
                .forEach { s.removeSpan(it) }

            // Restore stored mention metadata if plain text still matches (Req 19.2, 19.3)
            val currentPlainText = s.toString()
            val keysToRemove = mutableListOf<String>()
            for ((key, stored) in storedMentionMetadata) {
                val mentionRange = stored.originalRange
                // Verify range is still valid within the line
                if (mentionRange.first < lineStart || mentionRange.last > lineEnd ||
                    mentionRange.last > currentPlainText.length) {
                    keysToRemove.add(key)
                    continue
                }
                val textAtRange = currentPlainText.substring(mentionRange.first, mentionRange.last)
                if (textAtRange == stored.displayName) {
                    // Text unchanged — restore mention span (Req 19.2)
                    s.setSpan(
                        MentionSpan(stored.uid, stored.displayName),
                        mentionRange.first, mentionRange.last,
                        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                    )
                }
                // Whether restored or discarded, remove from stored metadata
                keysToRemove.add(key)
            }
            for (key in keysToRemove) {
                storedMentionMetadata.remove(key)
            }

            // Reset pending styles so toolbar reflects clean state (Req 16.2)
            // CRITICAL: remove "codeBlock" from pendingStyles so emitActiveStyles
            // reports codeBlock=false and the JS toolbar icon deactivates.
            pendingStyles.remove("codeBlock")
            pendingStyles.remove("bold")
            pendingStyles.remove("italic")
            pendingStyles.remove("underline")
            pendingStyles.remove("strikethrough")
            pendingStyles.remove("code")
            explicitlyOffStyles.clear()
            pendingStylesInsertPos = -1
        } else {
            // Activating code block — extract and store mention metadata before stripping (Req 19.1)
            s.getSpans(lineStart, lineEnd, MentionSpan::class.java).forEach { span ->
                val spanStart = s.getSpanStart(span)
                val spanEnd = s.getSpanEnd(span)
                val range = spanStart until spanEnd
                storedMentionMetadata[rangeKey(range)] = StoredMention(
                    displayName = span.displayName,
                    uid = span.uid,
                    originalRange = range
                )
            }
            // Remove mention spans — convert to plain text display names (Req 7.2)
            s.getSpans(lineStart, lineEnd, MentionSpan::class.java)
                .forEach { s.removeSpan(it) }

            // Remove all inline styles (Req 7.1, 7.3)
            s.getSpans(lineStart, lineEnd, StyleSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, UnderlineSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, StrikethroughSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, InlineCodeSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, ForegroundColorSpan::class.java)
                .forEach { s.removeSpan(it) }
            // Consumer colour is a bare CharacterStyle, so the ForegroundColorSpan sweep above does
            // NOT catch it. Without this the span merely sits under the code block's own colour and
            // paints again the moment the block is toggled off — iOS drops it for good, and a code
            // block is destructive to every other inline style here too.
            s.getSpans(lineStart, lineEnd, ExternalForegroundColorSpan::class.java)
                .forEach { s.removeSpan(it) }
            s.getSpans(lineStart, lineEnd, ExternalBackgroundColorSpan::class.java)
                .forEach { s.removeSpan(it) }
            pendingExternalColor = null
            pendingExternalBackgroundColor = null
            pendingStyles.remove("externalColor")
            pendingStyles.remove("externalBackgroundColor")
            s.getSpans(lineStart, lineEnd, AbsoluteSizeSpan::class.java)
                .filter { s.getSpanStart(it) >= lineStart && s.getSpanEnd(it) <= lineEnd }
                .forEach { s.removeSpan(it) }

            // Apply code block styling: monospace + bordered container
            s.setSpan(TypefaceSpan("monospace"), lineStart, lineEnd, Spanned.SPAN_EXCLUSIVE_INCLUSIVE)
            s.setSpan(CodeBlockBorderSpan(density), lineStart, lineEnd, Spanned.SPAN_EXCLUSIVE_INCLUSIVE)
            // Apply dark-mode-aware text color for readability
            val cbTextColor = if (isDarkMode()) Color.parseColor("#E0E0E0") else Color.parseColor("#333333")
            s.setSpan(ForegroundColorSpan(cbTextColor), lineStart, lineEnd, Spanned.SPAN_EXCLUSIVE_INCLUSIVE)
        }
        setSelection(lineStart, lineEnd)
        isInternalChange = false
        invalidate()
        applyListIndentation()
        updateCodeBlockEdgePadding()
        sendContentChangeWithDelta()
        saveToUndoStack()
        updateContentSize()
        // Update toolbar to reflect clean inline state after deselection (Req 16.2)
        updateToolbarButtonStates()
        emitActiveStyles()
    }
    fun toggleHighlight(color: String?) = onHighlightClick()
    fun setHeading() = onHeadingClick()
    fun toggleBulletList() = onBulletListClick()
    fun toggleNumberedList() = applyNumberedList()
    fun setQuote() = onQuoteClick()
    fun setChecklist() = onChecklistClick()
    fun setParagraph() {
        // Remove all block-level formatting from current line
        val (lineStart, lineEnd) = getLineRange()
        val currentText = text?.toString() ?: return
        val lineText = currentText.substring(lineStart, lineEnd)
        val cleanLine = removeExistingPrefix(lineText)

        isInternalChange = true
        text?.replace(lineStart, lineEnd, cleanLine)
        isInternalChange = false
        sendContentChange()
    }

    fun toggleChecklistItem() {
        val (lineStart, lineEnd) = getLineRange()
        val currentText = text?.toString() ?: return
        val lineText = currentText.substring(lineStart, lineEnd)
        val editable = text ?: return

        isInternalChange = true
        when {
            lineText.startsWith("☐ ") -> {
                editable.replace(lineStart, lineStart + 1, "☑")
            }
            lineText.startsWith("☑ ") -> {
                editable.replace(lineStart, lineStart + 1, "☐")
            }
        }
        isInternalChange = false
        sendContentChange()
    }

    // ==================== Ref Methods ====================

    fun focusEditor() {
        requestFocus()
        val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager
        imm.showSoftInput(this, android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT)
    }

    fun blurEditor() {
        clearFocus()
        val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager
        imm.hideSoftInputFromWindow(windowToken, 0)
    }

    fun clearContent() {
        isInternalChange = true
        setText("")
        pendingStyles.clear()
        explicitlyOffStyles.clear()
        isInternalChange = false
        updateCodeBlockEdgePadding()
        updatePlaceholderVisibility()
        sendContentChange()
        emitActiveStyles()
        updateToolbarButtonStates()
    }

    // ==================== New Props ====================

    fun setSelectionRange(start: Int, end: Int) {
        // Map clean coordinates (no \u200B) to raw Editable positions
        val rawText = text?.toString() ?: ""
        val cleanToRaw = mutableListOf<Int>()
        for ((rawIdx, ch) in rawText.withIndex()) {
            if (ch != '\u200B') {
                cleanToRaw.add(rawIdx)
            }
        }
        cleanToRaw.add(rawText.length)

        val rawStart = if (start in 0 until cleanToRaw.size) cleanToRaw[start] else rawText.length
        val rawEnd = if (end in 0 until cleanToRaw.size) cleanToRaw[end] else rawText.length
        val clampedStart = rawStart.coerceIn(0, rawText.length)
        val clampedEnd = rawEnd.coerceIn(clampedStart, rawText.length)
        setSelection(clampedStart, clampedEnd)
    }

    fun setTextStyle(fontSize: Float?, color: String?, fontFamily: String?) {
        fontSize?.let { textSize = it }
        color?.let {
            try {
                setTextColor(Color.parseColor(it))
            } catch (e: Exception) {
                // Invalid color, ignore
            }
        }
        fontFamily?.let {
            typeface = Typeface.create(it, Typeface.NORMAL)
        }
    }

    fun setPlaceholderTextColor(color: String) {
        try {
            setHintTextColor(Color.parseColor(color))
        } catch (e: Exception) {
            // Invalid color, ignore
        }
    }

    fun setTextContent(newText: String, force: Boolean = false) {
        val currentText = text?.toString() ?: ""
        if (currentText == newText) return
        // Skip stale prop updates while user is actively typing.
        // Force=true bypasses this (used by imperative setText command for mentions/clear).
        if (!force) {
            val timeSinceLastEdit = System.currentTimeMillis() - lastUserEditTime
            if (timeSinceLastEdit < 200) return
        }
        isInternalChange = true

        // For force updates (mentions, etc.), do a targeted replacement that preserves
        // spans on unchanged regions (e.g. code block, inline code).
        // Uses prefix + suffix matching with overlap guard to find the minimal changed region.
        val editable = text
        if (editable != null && force) {
            // The incoming newText is in "clean" coordinates (zero-width spaces stripped),
            // matching what JS sees via onContentChange. Diff against the cleaned version
            // of the current text, then map the replacement range back to raw positions
            // so spans on unchanged regions (code block, inline code) are preserved.
            val cleanChars = mutableListOf<Char>()
            val cleanToRaw = mutableListOf<Int>()  // cleanToRaw[i] = raw index of clean char i
            for ((rawIdx, ch) in currentText.withIndex()) {
                if (ch != '\u200B') {
                    cleanToRaw.add(rawIdx)
                    cleanChars.add(ch)
                }
            }
            // Sentinel: cleanToRaw[cleanChars.size] = currentText.length (for end-of-string)
            cleanToRaw.add(currentText.length)

            val cleanLen = cleanChars.size
            val newLen = newText.length
            val minLen = minOf(cleanLen, newLen)

            // Find common prefix (in clean coordinates)
            var prefixLen = 0
            while (prefixLen < minLen && cleanChars[prefixLen] == newText[prefixLen]) prefixLen++

            // Find common suffix, but never overlap with the prefix
            var suffixLen = 0
            val maxSuffix = minLen - prefixLen
            while (suffixLen < maxSuffix &&
                cleanChars[cleanLen - 1 - suffixLen] == newText[newLen - 1 - suffixLen]) {
                suffixLen++
            }

            // Map clean-coordinate range back to raw-coordinate range
            val rawReplaceStart = cleanToRaw[prefixLen]
            val rawReplaceEnd = if (cleanLen - suffixLen < cleanToRaw.size)
                cleanToRaw[cleanLen - suffixLen] else currentText.length
            val replacement = newText.substring(prefixLen, newLen - suffixLen)

            editable.replace(rawReplaceStart, rawReplaceEnd, replacement)
            val newPosition = (rawReplaceStart + replacement.length).coerceIn(0, editable.length)
            setSelection(newPosition)
        } else {
            val currentSelection = selectionStart
            setText(newText)
            val newPosition = currentSelection.coerceIn(0, newText.length)
            setSelection(newPosition)
        }

        isInternalChange = false

        // Emit updated content (with correct block types) so JS state stays in sync.
        // The TextWatcher skips this because isInternalChange was true during the edit.
        sendContentChange()
    }

    /// Applies visual mention styling (bold purple text + background pill) to the given ranges.
    /// Called from JS after mention insertion so the native editor matches the message bubble look.
    fun setMentionRanges(ranges: List<Pair<Int, Int>>) {
        val spannable = text as? android.text.Spannable ?: return
        val textLength = spannable.length

        // Build clean-to-raw index mapping.
        // JS sends ranges in "clean" coordinates (zero-width spaces stripped),
        // but the Editable contains \u200B placeholders.
        val rawText = spannable.toString()
        val cleanToRaw = mutableListOf<Int>()
        for ((rawIdx, ch) in rawText.withIndex()) {
            if (ch != '\u200B') {
                cleanToRaw.add(rawIdx)
            }
        }
        cleanToRaw.add(rawText.length) // sentinel for end-of-string

        // Clear existing mention styling — remove spans only on ranges that had MentionSpan
        // to avoid clearing user-applied bold or code block backgrounds.
        val oldMentionSpans = spannable.getSpans(0, textLength, MentionSpan::class.java)
        for (ms in oldMentionSpans) {
            val msStart = spannable.getSpanStart(ms)
            val msEnd = spannable.getSpanEnd(ms)
            // Remove bold StyleSpans that overlap this mention range
            spannable.getSpans(msStart, msEnd, android.text.style.StyleSpan::class.java)
                .filter { it.style == android.graphics.Typeface.BOLD }
                .forEach { spannable.removeSpan(it) }
            // Remove ForegroundColorSpan and BackgroundColorSpan on this mention range.
            // Consumer-applied colours are sibling types, not subclasses, so they are invisible
            // to these sweeps by construction — no filter needed.
            spannable.getSpans(msStart, msEnd, android.text.style.ForegroundColorSpan::class.java)
                .forEach { spannable.removeSpan(it) }
            spannable.getSpans(msStart, msEnd, android.text.style.BackgroundColorSpan::class.java)
                .forEach { spannable.removeSpan(it) }
            spannable.removeSpan(ms)
        }

        for ((cleanStart, cleanEnd) in ranges) {
            if (cleanStart < 0 || cleanEnd <= cleanStart) continue
            if (cleanStart >= cleanToRaw.size || cleanEnd >= cleanToRaw.size) continue

            val start = cleanToRaw[cleanStart]
            val end = cleanToRaw[cleanEnd]
            if (start >= end || end > textLength) continue

            // Skip if inside a code block — mentions in code blocks are plain monospace (Req 19.1)
            if (spannable.getSpans(start, end, CodeBlockBorderSpan::class.java).isNotEmpty()) continue

            val displayName = spannable.subSequence(start, end).toString()

            // Add MentionSpan marker (used by nonMentionRanges to skip formatting)
            spannable.setSpan(
                MentionSpan(displayName, displayName),
                start, end,
                android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
            )

            // Bold
            spannable.setSpan(
                android.text.style.StyleSpan(android.graphics.Typeface.BOLD),
                start, end,
                android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
            )

            // Purple text color (#6852D6)
            spannable.setSpan(
                android.text.style.ForegroundColorSpan(android.graphics.Color.parseColor("#6852D6")),
                start, end,
                android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
            )

            // Light purple background (rgba(104, 82, 214, 0.15))
            spannable.setSpan(
                android.text.style.BackgroundColorSpan(android.graphics.Color.argb(38, 104, 82, 214)),
                start, end,
                android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
            )
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        hideToolbar()
        toolbarPopup = null
    }
}
