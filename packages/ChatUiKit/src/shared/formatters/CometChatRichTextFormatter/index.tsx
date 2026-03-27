import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { JSX } from "react";
import { Text, TextStyle, ViewStyle, Platform, Linking, View } from "react-native";
import { CometChatTextFormatter } from "../CometChatTextFormatter";

/**
 * Style configuration for rich text formatting
 */
export interface RichTextStyle {
  boldStyle?: TextStyle;
  italicStyle?: TextStyle;
  underlineStyle?: TextStyle;
  strikethroughStyle?: TextStyle;
  inlineCodeStyle?: TextStyle;
  inlineCodeContainerStyle?: TextStyle;
  codeBlockStyle?: TextStyle;
  codeBlockContainerStyle?: ViewStyle;
  blockquoteContainerStyle?: ViewStyle;
  blockquoteBarStyle?: ViewStyle;
  bulletListStyle?: TextStyle;
  orderedListStyle?: TextStyle;
  linkStyle?: TextStyle;
}

// Pre-compiled regex patterns — avoids recompilation on every call
const ORDERED_LIST_REGEX = /^(\d+)\.(?:\s(.*))?$/;
const ORDERED_LIST_DETECT_REGEX = /^\d+\.(\s|$)/;
const LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/;
const URL_PROTOCOL_REGEX = /^(https?|mailto|tel):/i;
// Patterns for detecting list items inside blockquote content (ENG-31998)
const QUOTE_BULLET_REGEX = /^- (.*)$/;
const QUOTE_ORDERED_REGEX = /^(\d+)\.\s(.*)$/;
// Mention pattern — used to exclude mention UIDs from markdown marker detection
const MENTION_PATTERN_REGEX = /<@(?:uid|all):[^>]*>/g;

// Pre-allocated style objects — avoids creating new objects on every render
const LIST_ROW_STYLE = { flexDirection: 'row' as const, flexShrink: 1 as const };
const BULLET_MARKER_STYLE = { width: 18 };
const ORDERED_MARKER_STYLE = { width: 24 };
const LIST_CONTENT_STYLE = { flexShrink: 1, flexGrow: 1 };
const BQ_TEXT_ROW_STYLE = { flexDirection: 'row' as const, flexShrink: 1 as const };

// Blockquote container styles — matches Figma spec (node 14736:1573987)
// Rounded container with semi-transparent white bg, thick left bar, content area.
// The bubble itself sizes to the text content; the blockquote fills the bubble width.
const BQ_CONTAINER_STYLE = {
  flexDirection: 'row' as const,
  alignItems: 'stretch' as const,
  backgroundColor: 'rgba(255,255,255,0.2)',
  borderRadius: 8,
  overflow: 'hidden' as const,
};
// Thick rounded vertical bar on the left — Figma "Border" element (node 14736:1573988)
const BQ_BAR_STYLE = {
  width: 4,
  backgroundColor: 'rgba(255,255,255,0.6)',
  borderRadius: 2,
  marginVertical: 4,
  marginLeft: 4,
};
const BQ_CONTENT_STYLE = {
  flexShrink: 1 as const,
  paddingHorizontal: 8,
  paddingVertical: 4,
};



/** Check if a line is a bullet list item (- prefix) */
function isBulletLine(l: string): boolean {
  const trimmed = l.trim();
  return trimmed.startsWith("- ") || trimmed === "-" || l.startsWith("- ");
}

const defaultRichTextStyle: RichTextStyle = {
  boldStyle: { fontWeight: "700" },
  // React Native Fabric (New Architecture, RN 0.76+) has a known bug on iOS where
  // fontStyle: "italic" is ignored when a custom fontFamily (e.g. "Inter") is set
  // on a parent <Text>. The workaround is to override fontFamily on the italic
  // child with the iOS system font (".AppleSystemUIFont"), which allows fontStyle
  // to work correctly. The visual difference between Inter italic and SF Pro italic
  // at body size (14px) is minimal.
  // See: https://github.com/facebook/react-native/issues/46090
  italicStyle: Platform.OS === "ios"
    ? { fontFamily: ".AppleSystemUIFont", fontStyle: "italic" }
    : { fontStyle: "italic" },
  underlineStyle: { textDecorationLine: "underline" },
  strikethroughStyle: { textDecorationLine: "line-through" },
  inlineCodeStyle: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 16.8,
    color: "#6852D6",
  },
  inlineCodeContainerStyle: {
    backgroundColor: "#F5F5F5",
    borderRadius: 2,
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
  codeBlockStyle: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 13,
    color: "#141414",
  },
  codeBlockContainerStyle: {
    backgroundColor: "#FAFAFA",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    padding: 12,
  },
  blockquoteContainerStyle: {},
  blockquoteBarStyle: {},
  bulletListStyle: {},
  orderedListStyle: {},
};

/**
 * CometChatRichTextFormatter
 * 
 * Parses markdown syntax in message text and renders styled React Native Text components.
 * 
 * Supported formats:
 * - Bold: **text**
 * - Italic: _text_
 * - Underline: __text__
 * - Strikethrough: ~~text~~
 * - Inline code: `text`
 * - Code blocks: ```code```
 * - Bullet lists: - item
 * - Ordered lists: 1. item
 * - Blockquotes: > text
 */
export class CometChatRichTextFormatter extends CometChatTextFormatter {
  protected style: RichTextStyle = { ...defaultRichTextStyle };

  constructor(loggedInUser?: CometChat.User) {
    super();
    this.loggedInUser = loggedInUser;
  }

  setStyle = (style: Partial<RichTextStyle>): void => {
    this.style = { ...defaultRichTextStyle, ...style };
  };

  getStyle = (): RichTextStyle => {
    return this.style;
  };

  getFormattedText(inputText: string | null | JSX.Element): string | null | JSX.Element {
    if (!inputText) return null;
    if (typeof inputText === "string") {
      if (!this.hasMarkdown(inputText)) return inputText;
      return this.renderMarkdown(inputText);
    } else if (React.isValidElement(inputText)) {
      const element = inputText as React.ReactElement<any>;
      if (element.props?.children && typeof element.props.children === "string") {
        if (!this.hasMarkdown(element.props.children)) return inputText;
        return React.cloneElement(element, {
          ...element.props,
          children: this.renderMarkdown(element.props.children),
        });
      }
      return inputText;
    }

    return inputText;
  }

  private hasMarkdown(text: string): boolean {
    if (!text) return false;
    // Strip mention patterns before checking — mention UIDs can contain
    // underscores, brackets, and "> " sequences that trigger false positives.
    const cleaned = text.replace(MENTION_PATTERN_REGEX, '');
    if (cleaned.indexOf("**") >= 0) return true;
    if (cleaned.indexOf("__") >= 0) return true;
    if (cleaned.indexOf("<u>") >= 0) return true;
    if (cleaned.indexOf("~~") >= 0) return true;
    if (cleaned.indexOf("`") >= 0) return true;
    if (cleaned.indexOf("_") >= 0) return true;
    if (cleaned.indexOf("[") >= 0) return true;
    if (cleaned.indexOf("- ") >= 0) return true;
    if (cleaned.indexOf("> ") >= 0) return true;
    if (cleaned.indexOf("▎ ") >= 0) return true;
    const lines = cleaned.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (ORDERED_LIST_DETECT_REGEX.test(lines[i].trim())) return true;
    }
    return false;
  }

  private renderMarkdown(text: string): JSX.Element {
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];
    let lineIndex = 0;
    let hasViewChildren = false;
    // Running counter for ordered lists — continues across bullet list interruptions (Slack behavior)
    let orderedListCounter = 0;

    while (lineIndex < lines.length) {
      const line = lines[lineIndex];
      const trimmedLine = line.trim();

      // Code blocks (```)
      if (trimmedLine.startsWith("```")) {
        // Check for single-line ```content``` (opening and closing on same line)
        const afterOpen = trimmedLine.substring(3);
        const firstClose = afterOpen.indexOf("```");
        if (firstClose > 0) {
          const afterClose = afterOpen.substring(firstClose + 3).trim();
          if (afterClose.length === 0) {
            // Standalone ```content``` — render as block-level code block (same as fenced)
            hasViewChildren = true;
            const content = afterOpen.substring(0, firstClose);
            elements.push(
              <View
                key={`code-${elements.length}`}
                style={[
                  {
                    backgroundColor: "transparent",
                    borderRadius: 4,
                    padding: 12,
                  },
                  this.style.codeBlockContainerStyle,
                ]}
              >
                <Text style={[this.style.codeBlockStyle]}>{content}</Text>
              </View>
            );
            lineIndex++;
            continue;
          }
          // Mixed content line (text + ```code``` + text) — inline rendering
          elements.push(
            <Text key={`line-${elements.length}`}>
              {this.parseInlineFormats(line)}
            </Text>
          );
          lineIndex++;
          if (lineIndex < lines.length && line.length > 0) {
            elements.push(<Text key={`nl-${elements.length}`}>{"\n"}</Text>);
          }
          continue;
        }

        // Multi-line fenced code block
        hasViewChildren = true;
        const codeLines: string[] = [];
        lineIndex++;
        while (lineIndex < lines.length && !lines[lineIndex].trim().startsWith("```")) {
          codeLines.push(lines[lineIndex]);
          lineIndex++;
        }
        if (lineIndex < lines.length) {
          lineIndex++; // Skip closing ``` only if it exists
        }
        // Render code block content as plain monospaced text — skip parseInlineFormats
        // and findLink() so URLs inside code blocks remain unformatted (Req 2.1)
        elements.push(
          <View
            key={`code-${elements.length}`}
            style={[
              {
                backgroundColor: "transparent",
                borderRadius: 4,
                padding: 12,
              },
              this.style.codeBlockContainerStyle,
            ]}
          >
            <Text
              style={[
                this.style.codeBlockStyle,
              ]}
            >
              {codeLines.join("\n")}
            </Text>
          </View>
        );
        if (lineIndex < lines.length) {
          elements.push(<Text key={`nl-${elements.length}`}>{"\n"}</Text>);
        }
        continue;
      }

      // Blockquotes (> or ▎ ) — Slack-style with vertical bar on left
      if (trimmedLine.startsWith("> ") || trimmedLine.startsWith("▎ ")) {
        hasViewChildren = true;
        // Collect consecutive blockquote lines into one block
        const quoteLines: string[] = [];
        while (lineIndex < lines.length && (lines[lineIndex].trim().startsWith("> ") || lines[lineIndex].trim().startsWith("▎ "))) {
          const ql = lines[lineIndex].trim();
          quoteLines.push(ql.startsWith("> ") ? ql.substring(2) : ql.substring(2));
          lineIndex++;
        }
        // Render blockquote content — detect list items (ENG-31998)
        const quoteContent: JSX.Element[] = [];
        let quoteOrderedCounter = 0;
        for (let i = 0; i < quoteLines.length; i++) {
          const ql = quoteLines[i];
          const bulletMatch = ql.match(QUOTE_BULLET_REGEX);
          const orderedMatch = ql.match(QUOTE_ORDERED_REGEX);
          if (bulletMatch) {
            // Bullet items inside blockquote: render with marker + flex row
            // Don't reset quoteOrderedCounter — numbering continues across bullet interruptions (Slack behavior)
            quoteContent.push(
              <View key={`ql-${i}`} style={LIST_ROW_STYLE}>
                <Text style={BULLET_MARKER_STYLE}>{"‧ "}</Text>
                <Text style={LIST_CONTENT_STYLE}>
                  {bulletMatch[1].trim() === '' ? ' ' : this.parseInlineFormats(bulletMatch[1])}
                </Text>
              </View>
            );
          } else if (orderedMatch) {
            // Numbered item inside blockquote: render with counter + flex row
            quoteOrderedCounter++;
            quoteContent.push(
              <View key={`ql-${i}`} style={LIST_ROW_STYLE}>
                <Text style={ORDERED_MARKER_STYLE}>{`${quoteOrderedCounter}. `}</Text>
                <Text style={LIST_CONTENT_STYLE}>
                  {orderedMatch[2].trim() === '' ? ' ' : this.parseInlineFormats(orderedMatch[2])}
                </Text>
              </View>
            );
          } else {
            // Plain blockquote text — inline formats supported (Req 15.3)
            // Wrap in View with flex:1 so long text wraps within blockquote bounds
            quoteOrderedCounter = 0;
            quoteContent.push(
              <View key={`ql-${i}`} style={BQ_TEXT_ROW_STYLE}>
                <Text style={LIST_CONTENT_STYLE}>
                  {this.parseInlineFormats(ql)}
                </Text>
              </View>
            );
            // No \n separator — View elements stack naturally; \n caused large
            // vertical gaps between plain text lines inside blockquotes.
          }
        }
        // Blockquote container with left bar — Figma spec (node 14736:1573987)
        // Uses style config properties for theme-aware customization (OCP)
        elements.push(
          <View
            key={`quote-${elements.length}`}
            style={[
              BQ_CONTAINER_STYLE,
              this.style.blockquoteContainerStyle,
            ]}
          >
            <View style={[BQ_BAR_STYLE, this.style.blockquoteBarStyle]} />
            <View style={BQ_CONTENT_STYLE}>
              {quoteContent}
            </View>
          </View>
        );
        // No \n separator after blockquote — same reason as bullet/ordered lists:
        // View elements stack naturally, and the whitespace-only filter in
        // flushTextGroup handles any stray newline Text nodes.
        continue;
      }

      // Bullet lists (- ) — also match empty items where trailing space is trimmed (Req 8.2)
      if (isBulletLine(line)) {
        hasViewChildren = true;
        const listItems: string[] = [];
        while (lineIndex < lines.length && isBulletLine(lines[lineIndex])) {
          const raw = lines[lineIndex];
          // Extract content after "- " prefix; handle trimmed empty items
          const trimmed = raw.trim();
          const itemText = trimmed.startsWith("- ") ? trimmed.substring(2) : "";
          listItems.push(itemText);
          lineIndex++;
        }
        for (let i = 0; i < listItems.length; i++) {
          elements.push(
            <View key={`bullet-${elements.length}`} style={LIST_ROW_STYLE}>
              <Text style={BULLET_MARKER_STYLE}>{"‧ "}</Text>
              <Text style={LIST_CONTENT_STYLE}>
                {listItems[i].trim() === '' ? ' ' : this.parseInlineFormats(listItems[i])}
              </Text>
            </View>
          );
        }
        // No \n separator — View elements stack naturally; \n caused blank lines
        // between mixed ordered/bullet list groups in the bubble renderer.
        continue;
      }

      // Ordered lists (1. ) — regex handles empty items where content is trimmed away (Req 8.2)
      const orderedMatch = trimmedLine.match(ORDERED_LIST_REGEX);
      if (orderedMatch) {
        hasViewChildren = true;
        const listItems: string[] = [];
        while (lineIndex < lines.length) {
          const itemMatch = lines[lineIndex].trim().match(ORDERED_LIST_REGEX);
          if (itemMatch) {
            listItems.push(itemMatch[2] ?? '');
            lineIndex++;
          } else {
            break;
          }
        }
        for (let i = 0; i < listItems.length; i++) {
          orderedListCounter++;
          elements.push(
            <View key={`ordered-${elements.length}`} style={LIST_ROW_STYLE}>
              <Text style={ORDERED_MARKER_STYLE}>{`${orderedListCounter}. `}</Text>
              <Text style={LIST_CONTENT_STYLE}>
                {listItems[i].trim() === '' ? ' ' : this.parseInlineFormats(listItems[i])}
              </Text>
            </View>
          );
        }
        // No \n separator — same reason as bullet lists above.
        continue;
      }

      // Regular line
      if (line.length > 0) {
        elements.push(
          <Text key={`line-${elements.length}`}>
            {this.parseInlineFormats(line)}
          </Text>
        );
      }
      lineIndex++;
      if (lineIndex < lines.length && line.length > 0) {
        elements.push(<Text key={`nl-${elements.length}`}>{"\n"}</Text>);
      }
    }

    if (elements.length === 0) return <Text key="empty">{text}</Text>;

    // If View children are present (blockquotes or inline code containers),
    // we must use a View root because View children cannot be nested inside Text.
    if (hasViewChildren) {
      // Group consecutive Text elements together, keep View elements separate
      const grouped: JSX.Element[] = [];
      let textGroup: JSX.Element[] = [];

      const flushTextGroup = () => {
        if (textGroup.length > 0) {
          // Skip groups that are only newline/whitespace Text nodes — these appear
          // between list blocks and would render as blank lines in the bubble.
          const isOnlyWhitespace = textGroup.every(el => {
            if (el.type !== Text) return false;
            const child = el.props?.children;
            return typeof child === 'string' && child.trim() === '';
          });
          if (!isOnlyWhitespace) {
            grouped.push(
              <Text key={`tg-${grouped.length}`}>{textGroup}</Text>
            );
          }
          textGroup = [];
        }
      };

      for (const el of elements) {
        if (el.type === View) {
          flushTextGroup();
          grouped.push(el);
        } else {
          textGroup.push(el);
        }
      }
      flushTextGroup();

      return <View key="root" style={{ flexDirection: 'column', flexShrink: 1 }}>{grouped}</View>;
    }

    if (elements.length === 1) return elements[0];
    return <Text key="root">{elements}</Text>;
  }

  private parseInlineFormats(text: string): JSX.Element | string {
    if (!text) return "";
    // Strip mention patterns before checking for markdown markers — mention UIDs
    // can contain underscores/brackets that would trigger false-positive parsing.
    const textWithoutMentions = text.replace(MENTION_PATTERN_REGEX, '');
    if (textWithoutMentions.indexOf("**") < 0 && textWithoutMentions.indexOf("__") < 0 && textWithoutMentions.indexOf("<u>") < 0 &&
        textWithoutMentions.indexOf("~~") < 0 && textWithoutMentions.indexOf("`") < 0 && textWithoutMentions.indexOf("_") < 0 &&
        textWithoutMentions.indexOf("[") < 0) {
      return text;
    }

    // Replace mention patterns with null-byte placeholders before parsing so
    // findItalic/findNextFormat never see underscores or brackets inside UIDs.
    // After parsing, restore the original mention strings in the output.
    const mentionSlots: string[] = [];
    const sanitized = text.replace(MENTION_PATTERN_REGEX, (match) => {
      const idx = mentionSlots.length;
      mentionSlots.push(match);
      return `\x00M${idx}\x00`;
    });

    // Restore mention placeholders in a string or JSX tree
    const restoreMentions = (node: JSX.Element | string): JSX.Element | string => {
      if (typeof node === 'string') {
        if (mentionSlots.length === 0 || node.indexOf('\x00') < 0) return node;
        return node.replace(/\x00M(\d+)\x00/g, (_, idx) => mentionSlots[Number(idx)] ?? _);
      }
      if (!React.isValidElement(node)) return node;
      const el = node as React.ReactElement<any>;
      const children = el.props.children;
      if (!children) return node;
      const restored = React.Children.map(children, (child: any) => {
        if (typeof child === 'string') return restoreMentions(child);
        if (React.isValidElement(child)) return restoreMentions(child as JSX.Element);
        return child;
      });
      return React.cloneElement(el, {}, ...(restored || []));
    };

    const elements: (JSX.Element | string)[] = [];
    let remaining = sanitized;
    let keyCounter = 0;
    let iterations = 0;
    const maxIterations = 500;

    while (remaining.length > 0 && iterations < maxIterations) {
      iterations++;
      const match = this.findNextFormat(remaining);
      if (match) {
        if (match.startIndex > 0) {
          elements.push(restoreMentions(remaining.substring(0, match.startIndex)) as string);
        }
        // Restore mentions in matched content before recursive parsing
        const restoredContent = (typeof match.content === 'string' && match.content.indexOf('\x00') >= 0)
          ? restoreMentions(match.content) as string
          : match.content;
        if (match.type === "link" && match.url) {
          // Render link as tappable blue underlined text (same as CometChatUrlsFormatter)
          const innerContent = this.parseInlineFormats(restoredContent);
          const linkUrl = match.url;
          elements.push(
            <Text
              key={`fmt-${keyCounter++}`}
              style={this.style.linkStyle || { color: "#1a73e8", textDecorationLine: "underline" }}
              onPress={() => {
                let finalUrl = linkUrl;
                if (!URL_PROTOCOL_REGEX.test(linkUrl)) {
                  finalUrl = `http://${linkUrl}`;
                }
                Linking.openURL(finalUrl).catch((err) => {
                  console.log("Error opening URL:", err);
                });
              }}
            >{innerContent}</Text>
          );
        } else if (match.type === "inlineCode") {
          const innerContent = this.parseInlineFormats(restoredContent);
          // Use a single Text element (not View) so inline code stays on the
          // same text baseline as surrounding content (mentions, plain text).
          // Text supports backgroundColor, borderRadius, and padding in RN.
          elements.push(
            <Text key={`fmt-${keyCounter++}`} style={[this.style.inlineCodeContainerStyle, this.style.inlineCodeStyle]}>{innerContent}</Text>
          );
        } else if (match.type === "codeBlock") {
          // Inline ```text``` — render identically to single-backtick inline code
          // (compact pill with background, no block-level padding).
          // Block-level code block rendering with View container is handled in renderMarkdown.
          elements.push(
            <Text
              key={`fmt-${keyCounter++}`}
              style={[this.style.inlineCodeContainerStyle, this.style.inlineCodeStyle]}
            >{restoredContent}</Text>
          );
        } else {
          const style = this.getStyleForFormat(match.type);
          const innerContent = this.parseInlineFormats(restoredContent);
          // Merge textDecorationLine with child elements so underline
          // and strikethrough can coexist (React Native child overrides parent).
          const mergedInner = this.mergeTextDecoration(innerContent, style);
          elements.push(
            <Text key={`fmt-${keyCounter++}`} style={style}>{mergedInner}</Text>
          );
        }
        remaining = remaining.substring(match.endIndex);
      } else {
        elements.push(restoreMentions(remaining) as string);
        remaining = "";
      }
    }

    if (elements.length === 0) return text;
    if (elements.length === 1 && typeof elements[0] === "string") return elements[0];
    return <Text key={`inline-${keyCounter}`}>{elements}</Text>;
  }

  private findNextFormat(text: string): { type: string; content: string; startIndex: number; endIndex: number; url?: string } | null {
    const matches: Array<{ type: string; content: string; startIndex: number; endIndex: number; url?: string }> = [];

    const codeBlockMatch = this.findPair(text, "```", "```");
    if (codeBlockMatch) matches.push({ ...codeBlockMatch, type: "codeBlock" });

    const inlineCodeMatch = this.findPair(text, "`", "`");
    if (inlineCodeMatch) {
      const isPartOfCodeBlock = codeBlockMatch && 
        inlineCodeMatch.startIndex >= codeBlockMatch.startIndex && 
        inlineCodeMatch.startIndex < codeBlockMatch.endIndex;
      if (!isPartOfCodeBlock) matches.push({ ...inlineCodeMatch, type: "inlineCode" });
    }

    const boldMatch = this.findPair(text, "**", "**");
    if (boldMatch) matches.push({ ...boldMatch, type: "bold" });

    const underlineMatch = this.findPair(text, "__", "__");
    if (underlineMatch) matches.push({ ...underlineMatch, type: "underline" });

    // HTML underline tag: <u>text</u>
    const htmlUnderlineMatch = this.findHtmlUnderline(text);
    if (htmlUnderlineMatch) matches.push({ ...htmlUnderlineMatch, type: "underline" });

    const strikeMatch = this.findPair(text, "~~", "~~");
    if (strikeMatch) matches.push({ ...strikeMatch, type: "strikethrough" });

    const italicMatch = this.findItalic(text);
    if (italicMatch) matches.push({ ...italicMatch, type: "italic" });

    const linkMatch = this.findLink(text);
    if (linkMatch) matches.push(linkMatch);

    if (matches.length === 0) return null;
    let earliest = matches[0];
    for (let i = 1; i < matches.length; i++) {
      if (matches[i].startIndex < earliest.startIndex) earliest = matches[i];
    }
    return earliest;
  }

  private findPair(text: string, openMarker: string, closeMarker: string): { content: string; startIndex: number; endIndex: number } | null {
    const openIndex = text.indexOf(openMarker);
    if (openIndex < 0) return null;
    const contentStart = openIndex + openMarker.length;
    if (contentStart >= text.length) return null;

    // Handle triple underscore: ___content___ should be parsed as __( _content_ )__
    // When looking for __ pairs and we see ___ (triple), skip the extra _ so the
    // inner _ is preserved as italic content for recursive parsing.
    if (openMarker === "__" && text.charAt(contentStart) === "_") {
      // We have ___..., look for closing ___ (triple)
      const tripleCloseIndex = text.indexOf("___", contentStart + 1);
      if (tripleCloseIndex > contentStart) {
        // Content between the outer __ markers is _innerContent_
        // which will be recursively parsed as italic
        const content = text.substring(contentStart, tripleCloseIndex + 1); // includes the inner _ on both sides
        return { content, startIndex: openIndex, endIndex: tripleCloseIndex + 3 }; // +3 for ___
      }
    }

    const closeIndex = text.indexOf(closeMarker, contentStart);
    if (closeIndex < 0 || closeIndex <= contentStart) return null;
    const content = text.substring(contentStart, closeIndex);
    if (content.length === 0) return null;
    return { content, startIndex: openIndex, endIndex: closeIndex + closeMarker.length };
  }

  private findItalic(text: string): { content: string; startIndex: number; endIndex: number } | null {
    const doublePositions = new Set<number>();
    let searchPos = 0;
    while (searchPos < text.length - 1) {
      const idx = text.indexOf("__", searchPos);
      if (idx < 0) break;
      doublePositions.add(idx);
      doublePositions.add(idx + 1);
      searchPos = idx + 2;
    }
    for (let i = 0; i < text.length; i++) {
      if (text.charAt(i) === "_" && !doublePositions.has(i)) {
        for (let j = i + 1; j < text.length; j++) {
          if (text.charAt(j) === "_" && !doublePositions.has(j)) {
            const content = text.substring(i + 1, j);
            if (content.length > 0) return { content, startIndex: i, endIndex: j + 1 };
            break;
          }
        }
      }
    }
    return null;
  }

  private findLink(text: string): { type: string; content: string; startIndex: number; endIndex: number; url?: string } | null {
    const match = LINK_REGEX.exec(text);
    if (!match) return null;
    return {
      type: "link",
      content: match[1],
      url: match[2],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    };
  }

  /** Detect <u>text</u> HTML underline tags (case-insensitive) */
  private findHtmlUnderline(text: string): { content: string; startIndex: number; endIndex: number } | null {
    const lower = text.toLowerCase();
    const openIdx = lower.indexOf("<u>");
    if (openIdx < 0) return null;
    const contentStart = openIdx + 3;
    const closeIdx = lower.indexOf("</u>", contentStart);
    if (closeIdx < 0) return null;
    const content = text.substring(contentStart, closeIdx);
    if (content.length === 0) return null;
    return { content, startIndex: openIdx, endIndex: closeIdx + 4 };
  }

  /**
   * When a parent Text has textDecorationLine (e.g. "underline") and a child
   * also has textDecorationLine (e.g. "line-through"), React Native's child
   * value overrides the parent instead of merging. This helper walks the
   * immediate children and combines the parent's decoration into any child
   * that also declares textDecorationLine, so both render correctly.
   */
  private mergeTextDecoration(
    inner: JSX.Element | string,
    parentStyle: TextStyle
  ): JSX.Element | string {
    const parentDeco = parentStyle.textDecorationLine;
    if (!parentDeco || typeof inner === "string") return inner;
    if (!React.isValidElement(inner)) return inner;

    const el = inner as React.ReactElement<any>;
    const children = React.Children.map(el.props.children, (child) => {
      if (!React.isValidElement(child)) return child;
      const childEl = child as React.ReactElement<any>;
      const childStyle = childEl.props.style;
      if (!childStyle) return child;

      // Flatten style to find textDecorationLine
      const flat = Array.isArray(childStyle)
        ? Object.assign({}, ...childStyle.filter(Boolean))
        : childStyle;
      const childDeco = flat.textDecorationLine as string | undefined;
      if (!childDeco || childDeco === parentDeco) return child;

      // Combine: e.g. "underline" + "line-through" → "underline line-through"
      const parts = new Set([...parentDeco.split(" "), ...childDeco.split(" ")]);
      parts.delete("none");
      const combined = parts.size > 0 ? Array.from(parts).join(" ") : "none";

      return React.cloneElement(childEl, {
        style: Array.isArray(childStyle)
          ? [...childStyle, { textDecorationLine: combined }]
          : { ...flat, textDecorationLine: combined },
      });
    });

    if (!children) return inner;
    return React.cloneElement(el, {}, ...children);
  }

  private getStyleForFormat(type: string): TextStyle {
      switch (type) {
        case "bold": return this.style.boldStyle || {};
        case "italic": return this.style.italicStyle || {};
        case "underline": return this.style.underlineStyle || {};
        case "strikethrough": return this.style.strikethroughStyle || {};
        case "inlineCode": return this.style.inlineCodeStyle || {};
        case "codeBlock": return this.style.codeBlockStyle || {};
        default: return {};
      }
    }

  getMessage() { return this.messageObject; }
  setMessage(messageObject: CometChat.BaseMessage) { this.messageObject = messageObject; }
}
