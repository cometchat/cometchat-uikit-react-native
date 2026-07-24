package com.reactnativecometchatuikit

import android.graphics.Color
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

@ReactModule(name = RichTextEditorViewManager.NAME)
class RichTextEditorViewManager : SimpleViewManager<LinearLayout>() {

    companion object {
        const val NAME = "RichTextEditorView"
        const val COMMAND_FOCUS = "focus"
        const val COMMAND_BLUR = "blur"
        const val COMMAND_CLEAR = "clear"
        const val COMMAND_TOGGLE_BOLD = "toggleBold"
        const val COMMAND_TOGGLE_ITALIC = "toggleItalic"
        const val COMMAND_TOGGLE_UNDERLINE = "toggleUnderline"
        const val COMMAND_TOGGLE_STRIKETHROUGH = "toggleStrikethrough"
        const val COMMAND_TOGGLE_CODE = "toggleCode"
        const val COMMAND_TOGGLE_CODE_BLOCK = "toggleCodeBlock"
        const val COMMAND_TOGGLE_HIGHLIGHT = "toggleHighlight"
        const val COMMAND_SET_HEADING = "setHeading"
        const val COMMAND_SET_BULLET_LIST = "setBulletList"
        const val COMMAND_SET_NUMBERED_LIST = "setNumberedList"
        const val COMMAND_SET_QUOTE = "setQuote"
        const val COMMAND_SET_CHECKLIST = "setChecklist"
        const val COMMAND_SET_PARAGRAPH = "setParagraph"
        const val COMMAND_INSERT_LINK = "insertLink"
        const val COMMAND_UNDO = "undo"
        const val COMMAND_REDO = "redo"
        const val COMMAND_CLEAR_FORMATTING = "clearFormatting"
        const val COMMAND_INDENT = "indent"
        const val COMMAND_OUTDENT = "outdent"
        const val COMMAND_ALIGN_LEFT = "alignLeft"
        const val COMMAND_ALIGN_CENTER = "alignCenter"
        const val COMMAND_ALIGN_RIGHT = "alignRight"
        const val COMMAND_TOGGLE_CHECKLIST_ITEM = "toggleChecklistItem"
        const val COMMAND_SET_TEXT = "setText"
        const val COMMAND_SET_SELECTION = "setSelection"
        const val COMMAND_SET_CONTENT = "setContent"
        const val COMMAND_SET_MENTION_RANGES = "setMentionRanges"
        const val COMMAND_REMOVE_LINK = "removeLink"
        const val COMMAND_UPDATE_LINK = "updateLink"

        private const val TAG_EDITOR = "editor"
    }

    override fun getName(): String = NAME

    override fun createViewInstance(reactContext: ThemedReactContext): LinearLayout {
        val container = LinearLayout(reactContext).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }

        val editor = RichTextEditorView(reactContext)
        editor.tag = TAG_EDITOR
        editor.containerView = container
        editor.layoutParams = LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            1f
        )
        container.addView(editor)

        return container
    }

    /** Track showToolbar prop value for proper inline toolbar visibility */
    private val showToolbarState = mutableMapOf<Int, Boolean>()

    /** Helper to find the editor child inside the container */
    private fun getEditor(container: LinearLayout): RichTextEditorView? {
        for (i in 0 until container.childCount) {
            val child = container.getChildAt(i)
            if (child.tag == TAG_EDITOR && child is RichTextEditorView) {
                return child
            }
        }
        return null
    }

    override fun getCommandsMap(): Map<String, Int> {
        return mapOf(
            COMMAND_FOCUS to 1,
            COMMAND_BLUR to 2,
            COMMAND_CLEAR to 3,
            COMMAND_TOGGLE_BOLD to 4,
            COMMAND_TOGGLE_ITALIC to 5,
            COMMAND_TOGGLE_UNDERLINE to 6,
            COMMAND_TOGGLE_STRIKETHROUGH to 7,
            COMMAND_TOGGLE_CODE to 8,
            COMMAND_TOGGLE_CODE_BLOCK to 28,
            COMMAND_TOGGLE_HIGHLIGHT to 9,
            COMMAND_SET_HEADING to 10,
            COMMAND_SET_BULLET_LIST to 11,
            COMMAND_SET_NUMBERED_LIST to 12,
            COMMAND_SET_QUOTE to 13,
            COMMAND_SET_CHECKLIST to 14,
            COMMAND_SET_PARAGRAPH to 15,
            COMMAND_INSERT_LINK to 16,
            COMMAND_UNDO to 17,
            COMMAND_REDO to 18,
            COMMAND_CLEAR_FORMATTING to 19,
            COMMAND_INDENT to 20,
            COMMAND_OUTDENT to 21,
            COMMAND_ALIGN_LEFT to 22,
            COMMAND_ALIGN_CENTER to 23,
            COMMAND_ALIGN_RIGHT to 24,
            COMMAND_TOGGLE_CHECKLIST_ITEM to 25,
            COMMAND_SET_TEXT to 26,
            COMMAND_SET_SELECTION to 27,
            COMMAND_SET_CONTENT to 29,
            COMMAND_SET_MENTION_RANGES to 30,
            COMMAND_REMOVE_LINK to 31,
            COMMAND_UPDATE_LINK to 32
        )
    }

    override fun receiveCommand(container: LinearLayout, commandId: String, args: ReadableArray?) {
        val view = getEditor(container) ?: return
        when (commandId) {
            COMMAND_FOCUS -> view.focusEditor()
            COMMAND_BLUR -> view.blurEditor()
            COMMAND_CLEAR -> view.clearContent()
            else -> {
                if (!view.hasFocus()) {
                    view.requestFocus()
                }
                when (commandId) {
                    COMMAND_TOGGLE_BOLD -> view.onBoldClick()
                    COMMAND_TOGGLE_ITALIC -> view.onItalicClick()
                    COMMAND_TOGGLE_UNDERLINE -> view.onUnderlineClick()
                    COMMAND_TOGGLE_STRIKETHROUGH -> view.onStrikethroughClick()
                    COMMAND_TOGGLE_CODE -> view.onCodeClick()
                    COMMAND_TOGGLE_CODE_BLOCK -> view.toggleCodeBlock()
                    COMMAND_TOGGLE_HIGHLIGHT -> view.onHighlightClick()
                    COMMAND_SET_HEADING -> view.onHeadingClick()
                    COMMAND_SET_BULLET_LIST -> view.onBulletListClick()
                    COMMAND_SET_NUMBERED_LIST -> view.onNumberedListClick()
                    COMMAND_SET_QUOTE -> view.onQuoteClick()
                    COMMAND_SET_CHECKLIST -> view.onChecklistClick()
                    COMMAND_SET_PARAGRAPH -> { }
                    COMMAND_INSERT_LINK -> {
                        val url = args?.getString(0) ?: ""
                        val linkText = args?.getString(1) ?: ""
                        if (url.isNotEmpty() && linkText.isNotEmpty()) {
                            view.insertLink(url, linkText)
                        }
                    }
                    COMMAND_UNDO -> view.onUndoClick()
                    COMMAND_REDO -> view.onRedoClick()
                    COMMAND_CLEAR_FORMATTING -> view.onClearFormattingClick()
                    COMMAND_INDENT -> view.onIndentClick()
                    COMMAND_OUTDENT -> view.onOutdentClick()
                    COMMAND_ALIGN_LEFT -> view.onAlignLeftClick()
                    COMMAND_ALIGN_CENTER -> view.onAlignCenterClick()
                    COMMAND_ALIGN_RIGHT -> view.onAlignRightClick()
                    COMMAND_TOGGLE_CHECKLIST_ITEM -> view.onChecklistClick()
                    COMMAND_SET_TEXT -> {
                        val text = args?.getString(0) ?: ""
                        view.setTextContent(text, force = true)
                    }
                    COMMAND_SET_SELECTION -> {
                        val start = args?.getInt(0) ?: 0
                        val end = args?.getInt(1) ?: start
                        view.setSelectionRange(start, end)
                    }
                    COMMAND_SET_CONTENT -> {
                        val blocksArray = args?.getArray(0)
                        if (blocksArray != null) {
                            val blocksList = mutableListOf<Map<String, Any>>()
                            for (i in 0 until blocksArray.size()) {
                                val block = blocksArray.getMap(i) ?: continue
                                val blockMap = mutableMapOf<String, Any>()
                                blockMap["text"] = block.getString("text") ?: ""
                                blockMap["type"] = block.getString("type") ?: "paragraph"
                                val stylesList = mutableListOf<Map<String, Any>>()
                                val styles = block.getArray("styles")
                                if (styles != null) {
                                    for (j in 0 until styles.size()) {
                                        val style = styles.getMap(j) ?: continue
                                        val styleMap = mutableMapOf<String, Any>()
                                        val styleName = style.getString("style") ?: ""
                                        styleMap["style"] = styleName
                                        styleMap["start"] = style.getInt("start")
                                        styleMap["end"] = style.getInt("end")
                                        // Preserve url for link styles
                                        if (styleName == "link" && style.hasKey("url")) {
                                            styleMap["url"] = style.getString("url") ?: ""
                                        }
                                        stylesList.add(styleMap)
                                    }
                                }
                                blockMap["styles"] = stylesList
                                blocksList.add(blockMap)
                            }
                            view.setContent(blocksList)
                        }
                    }
                    COMMAND_SET_MENTION_RANGES -> {
                        val rangesArray = args?.getArray(0)
                        if (rangesArray != null) {
                            val ranges = mutableListOf<Pair<Int, Int>>()
                            for (i in 0 until rangesArray.size()) {
                                val rangeMap = rangesArray.getMap(i) ?: continue
                                val start = rangeMap.getInt("start")
                                val end = rangeMap.getInt("end")
                                ranges.add(Pair(start, end))
                            }
                            view.setMentionRanges(ranges)
                        }
                    }
                    COMMAND_REMOVE_LINK -> {
                        val location = args?.getInt(0) ?: return
                        val length = args?.getInt(1) ?: return
                        view.removeLink(location, length)
                    }
                    COMMAND_UPDATE_LINK -> {
                        val location = args?.getInt(0) ?: return
                        val length = args?.getInt(1) ?: return
                        val newUrl = args?.getString(2) ?: return
                        val newText = args?.getString(3) ?: return
                        view.updateLink(location, length, newUrl, newText)
                    }
                }
            }
        }
    }

    @ReactProp(name = "toolbarMode")
    fun setToolbarMode(container: LinearLayout, mode: String?) {
        val editor = getEditor(container) ?: return
        val isInline = mode == "inline"

        if (isInline) {
            editor.setShowToolbar(false)
        } else {
            editor.setShowToolbar(true)
        }
    }

    @ReactProp(name = "placeholder")
    fun setPlaceholder(container: LinearLayout, placeholder: String?) {
        try {
            getEditor(container)?.setPlaceholderText(placeholder ?: "")
        } catch (e: Exception) { e.printStackTrace() }
    }

    @ReactProp(name = "editable")
    fun setEditable(container: LinearLayout, editable: Boolean) {
        try {
            getEditor(container)?.setEditable(editable)
        } catch (e: Exception) { e.printStackTrace() }
    }

    @ReactProp(name = "maxHeight")
    fun setMaxHeight(container: LinearLayout, maxHeight: Double) {
        try {
            getEditor(container)?.setMaxHeightValue(maxHeight.toInt())
        } catch (e: Exception) { e.printStackTrace() }
    }

    @ReactProp(name = "numberOfLines")
    fun setNumberOfLines(container: LinearLayout, numberOfLines: Int) {
        try {
            getEditor(container)?.setNumberOfLinesValue(numberOfLines)
        } catch (e: Exception) { e.printStackTrace() }
    }

    @ReactProp(name = "showToolbar")
    fun setShowToolbar(container: LinearLayout, showToolbar: Boolean) {
        try {
            showToolbarState[container.id] = showToolbar
            val editor = getEditor(container) ?: return
            editor.setShowToolbar(showToolbar)
        } catch (e: Exception) { e.printStackTrace() }
    }

    @ReactProp(name = "toolbarOptions")
    fun setToolbarOptions(container: LinearLayout, toolbarOptions: ReadableArray?) {
        try {
            val options = if (toolbarOptions != null) {
                val list = mutableListOf<String>()
                for (i in 0 until toolbarOptions.size()) {
                    toolbarOptions.getString(i)?.let { list.add(it) }
                }
                list
            } else null
            getEditor(container)?.setToolbarOptions(options)
        } catch (e: Exception) { e.printStackTrace() }
    }

    @ReactProp(name = "variant")
    fun setVariant(container: LinearLayout, variant: String?) {
        try {
            getEditor(container)?.setVariant(variant ?: "outlined")
        } catch (e: Exception) { e.printStackTrace() }
    }

    @ReactProp(name = "initialContentJson")
    fun setInitialContentJson(container: LinearLayout, initialContentJson: String?) {
        if (initialContentJson.isNullOrEmpty()) return
        try {
            val editor = getEditor(container) ?: return
            val json = org.json.JSONArray(initialContentJson)
            val blocksList = mutableListOf<Map<String, Any>>()
            for (i in 0 until json.length()) {
                val block = json.getJSONObject(i)
                val blockMap = mutableMapOf<String, Any>()
                blockMap["text"] = block.optString("text", "")
                blockMap["type"] = block.optString("type", "paragraph")
                val stylesList = mutableListOf<Map<String, Any>>()
                val styles = block.optJSONArray("styles")
                if (styles != null) {
                    for (j in 0 until styles.length()) {
                        val style = styles.getJSONObject(j)
                        val styleMap = mutableMapOf<String, Any>()
                        val styleName = style.optString("style", "")
                        styleMap["style"] = styleName
                        styleMap["start"] = style.optInt("start", 0)
                        styleMap["end"] = style.optInt("end", 0)
                        // Preserve url for link styles
                        if (styleName == "link" && style.has("url")) {
                            styleMap["url"] = style.optString("url", "")
                        }
                        stylesList.add(styleMap)
                    }
                }
                blockMap["styles"] = stylesList
                blocksList.add(blockMap)
            }
            editor.post { editor.setContent(blocksList) }
        } catch (e: Exception) { e.printStackTrace() }
    }

    @ReactProp(name = "selection")
    fun setSelection(container: LinearLayout, selection: ReadableMap?) {
        try {
            selection?.let {
                val start = it.getInt("start")
                val end = it.getInt("end")
                getEditor(container)?.setSelectionRange(start, end)
            }
        } catch (e: Exception) { e.printStackTrace() }
    }

    @ReactProp(name = "textStyle")
    fun setTextStyle(container: LinearLayout, textStyle: ReadableMap?) {
        try {
            textStyle?.let {
                val fontSize = if (it.hasKey("fontSize")) it.getDouble("fontSize").toFloat() else null
                val color = if (it.hasKey("color")) it.getString("color") else null
                val fontFamily = if (it.hasKey("fontFamily")) it.getString("fontFamily") else null
                getEditor(container)?.setTextStyle(fontSize, color, fontFamily)
            }
        } catch (e: Exception) { e.printStackTrace() }
    }

    @ReactProp(name = "placeholderTextColor")
    fun setPlaceholderTextColor(container: LinearLayout, color: String?) {
        try {
            color?.let { getEditor(container)?.setPlaceholderTextColor(it) }
        } catch (e: Exception) { e.printStackTrace() }
    }

    @ReactProp(name = "text")
    fun setText(container: LinearLayout, text: String?) {
        try {
            if (text != null) {
                getEditor(container)?.setTextContent(text)
            }
        } catch (e: Exception) { e.printStackTrace() }
    }

    @ReactProp(name = "codeBackgroundColor")
    fun setCodeBackgroundColor(container: LinearLayout, color: String?) {
        try {
            val editor = getEditor(container) ?: return
            editor.inlineCodeBackgroundColor = color?.let {
                try { Color.parseColor(it) } catch (e: Exception) { null }
            }
            editor.invalidate()
        } catch (e: Exception) { e.printStackTrace() }
    }

    @ReactProp(name = "codeBorderColor")
    fun setCodeBorderColor(container: LinearLayout, color: String?) {
        try {
            val editor = getEditor(container) ?: return
            editor.inlineCodeBorderColor = color?.let {
                try { Color.parseColor(it) } catch (e: Exception) { null }
            }
            editor.invalidate()
        } catch (e: Exception) { e.printStackTrace() }
    }

    @ReactProp(name = "codeTextColor")
    fun setCodeTextColor(container: LinearLayout, color: String?) {
        try {
            val editor = getEditor(container) ?: return
            editor.inlineCodeTextColor = color?.let {
                try { Color.parseColor(it) } catch (e: Exception) { null }
            }
        } catch (e: Exception) { e.printStackTrace() }
    }

    @ReactProp(name = "codeFontSize")
    fun setCodeFontSize(container: LinearLayout, size: Double) {
        try {
            val editor = getEditor(container) ?: return
            editor.inlineCodeFontSize = if (size > 0) size.toFloat() else null
        } catch (e: Exception) { e.printStackTrace() }
    }

    @ReactProp(name = "enterKeyBehavior")
    fun setEnterKeyBehavior(container: LinearLayout, behavior: String?) {
        try {
            getEditor(container)?.enterKeyBehavior = behavior ?: "newLine"
        } catch (e: Exception) { e.printStackTrace() }
    }

    @ReactProp(name = "showTextSelectionMenuItems", defaultBoolean = true)
    fun setShowTextSelectionMenuItems(container: LinearLayout, show: Boolean) {
        try {
            getEditor(container)?.showTextSelectionMenuItems = show
        } catch (e: Exception) { e.printStackTrace() }
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
        return mutableMapOf(
            "topContentChange" to mapOf("registrationName" to "onContentChange"),
            "topSelectionChange" to mapOf("registrationName" to "onSelectionChange"),
            "topEditorFocus" to mapOf("registrationName" to "onEditorFocus"),
            "topEditorBlur" to mapOf("registrationName" to "onEditorBlur"),
            "topSizeChange" to mapOf("registrationName" to "onSizeChange"),
            "topActiveStylesChange" to mapOf("registrationName" to "onActiveStylesChange"),
            "topLinkTap" to mapOf("registrationName" to "onLinkTap"),
            "topSendRequest" to mapOf("registrationName" to "onSendRequest"),
            "topPasteMedia" to mapOf("registrationName" to "onPasteMedia")
        )
    }
}
