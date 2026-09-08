import React, { forwardRef, useImperativeHandle, useRef, useCallback, useState } from 'react';
import { StyleSheet, UIManager, findNodeHandle, processColor } from 'react-native';
import type {
  Block,
  TextAlignment,
  ContentChangeEvent,
  SelectionChangeEvent,
  RichTextEditorProps,
  RichTextEditorRef,
  InlineStyleKey,
} from './types';
import RichTextEditorViewNative from './RichTextEditorViewNativeComponent';

// Command constants
const COMMANDS = {
  focus: 'focus',
  blur: 'blur',
  clear: 'clear',
  toggleBold: 'toggleBold',
  toggleItalic: 'toggleItalic',
  toggleUnderline: 'toggleUnderline',
  toggleStrikethrough: 'toggleStrikethrough',
  toggleCode: 'toggleCode',
  toggleCodeBlock: 'toggleCodeBlock',
  toggleHighlight: 'toggleHighlight',
  setHeading: 'setHeading',
  setBulletList: 'setBulletList',
  setNumberedList: 'setNumberedList',
  setQuote: 'setQuote',
  setChecklist: 'setChecklist',
  setParagraph: 'setParagraph',
  insertLink: 'insertLink',
  undo: 'undo',
  redo: 'redo',
  clearFormatting: 'clearFormatting',
  indent: 'indent',
  outdent: 'outdent',
  alignLeft: 'alignLeft',
  alignCenter: 'alignCenter',
  alignRight: 'alignRight',
  toggleChecklistItem: 'toggleChecklistItem',
  setText: 'setText',
  setSelection: 'setSelection',
  setContent: 'setContent',
  setMentionRanges: 'setMentionRanges',
  removeLink: 'removeLink',
  updateLink: 'updateLink',
  applyInlineStyle: 'applyInlineStyle',
  removeInlineStyle: 'removeInlineStyle',
} as const;

// Helper to dispatch commands to native view
const dispatchCommand = (
  ref: React.RefObject<any>,
  command: string,
  args: any[] = []
) => {
  const viewTag = findNodeHandle(ref.current);
  if (viewTag != null) {
    UIManager.dispatchViewManagerCommand(viewTag, command, args);
  }
};

interface SizeChangeEvent {
  nativeEvent: {
    height: number;
  };
}

export interface ActiveStylesState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
  codeBlock: boolean;
  highlight: boolean;
  blockType: string;
  alignment: string;
}

interface ActiveStylesChangeEvent {
  nativeEvent: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    code: boolean;
    codeBlock: boolean;
    highlight: boolean;
    blockType: string;
    alignment: string;
  };
}

export interface LinkTapEventData {
  url: string;
  text: string;
  location: number;
  length: number;
}

interface LinkTapEvent {
  nativeEvent: LinkTapEventData;
}

/** A single image/file pasted into the editor (extracted to a temp file by native). */
export interface PasteMediaItem {
  uri: string;
  mimeType: string;
  name: string;
  size: number;
}
interface PasteMediaEvent {
  nativeEvent: { items: PasteMediaItem[] };
}

export interface RichTextEditorPropsExtended extends RichTextEditorProps {
  /** Test ID for testing frameworks (e.g. Detox, React Native Testing Library) */
  testID?: string;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  onActiveStylesChange?: (styles: ActiveStylesState) => void;
  onSizeChange?: (height: number) => void;
  onLinkTap?: (data: LinkTapEventData) => void;
  /** Callback when Enter is pressed in "sendMessage" mode (Android only) */
  onSendRequest?: () => void;
  /** Fired when the user pastes image(s)/file(s) into the editor (long-press Paste / ⌘V). */
  onPasteMedia?: (items: PasteMediaItem[]) => void;
  /** Enter key behavior: "newLine" (default) or "sendMessage" (Android only) */
  enterKeyBehavior?: string;
  /** Show Bold/Italic/Underline/Strikethrough in text selection context menu */
  showTextSelectionMenuItems?: boolean;
  /** Code block background color */
  codeBackgroundColor?: string;
  /** Code block border color */
  codeBorderColor?: string;
  /** Code block text color */
  codeTextColor?: string;
  /** Code block font size */
  codeFontSize?: number;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorPropsExtended>((props, ref) => {
  const nativeRef = useRef<React.ElementRef<typeof RichTextEditorViewNative>>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  // Latest mention ranges reported by native, in plain-text coordinates. Native owns them
  // because editing shifts them; it re-reports on every content change.
  const mentionRangesRef = useRef<Array<{ start: number; end: number }>>([]);

  const handleSizeChange = useCallback((event: SizeChangeEvent) => {
    const newHeight = event.nativeEvent?.height;
    if (newHeight && newHeight > 0) {
      setHeight(newHeight);
      props.onSizeChange?.(newHeight);
    }
  }, [props.onSizeChange]);

  useImperativeHandle(ref, () => ({
    setContent: (blocks: Block[]) => {
      dispatchCommand(nativeRef, COMMANDS.setContent, [blocks]);
    },
    getText: async (): Promise<string> => '',
    getBlocks: async (): Promise<Block[]> => [],
    clear: () => {
      dispatchCommand(nativeRef, COMMANDS.clear);
    },
    focus: () => {
      dispatchCommand(nativeRef, COMMANDS.focus);
    },
    blur: () => {
      dispatchCommand(nativeRef, COMMANDS.blur);
    },
    toggleBold: () => {
      dispatchCommand(nativeRef, COMMANDS.toggleBold);
    },
    toggleItalic: () => {
      dispatchCommand(nativeRef, COMMANDS.toggleItalic);
    },
    toggleUnderline: () => {
      dispatchCommand(nativeRef, COMMANDS.toggleUnderline);
    },
    toggleStrikethrough: () => {
      dispatchCommand(nativeRef, COMMANDS.toggleStrikethrough);
    },
    toggleCode: () => {
      dispatchCommand(nativeRef, COMMANDS.toggleCode);
    },
    toggleCodeBlock: () => {
      dispatchCommand(nativeRef, COMMANDS.toggleCodeBlock);
    },
    toggleHighlight: (_color?: string) => {
      dispatchCommand(nativeRef, COMMANDS.toggleHighlight);
    },
    setHeading: () => {
      dispatchCommand(nativeRef, COMMANDS.setHeading);
    },
    setBulletList: () => {
      dispatchCommand(nativeRef, COMMANDS.setBulletList);
    },
    setNumberedList: () => {
      dispatchCommand(nativeRef, COMMANDS.setNumberedList);
    },
    setQuote: () => {
      dispatchCommand(nativeRef, COMMANDS.setQuote);
    },
    setChecklist: () => {
      dispatchCommand(nativeRef, COMMANDS.setChecklist);
    },
    setParagraph: () => {
      dispatchCommand(nativeRef, COMMANDS.setParagraph);
    },
    insertLink: (url: string, text: string) => {
      dispatchCommand(nativeRef, COMMANDS.insertLink, [url, text]);
    },
    undo: () => {
      dispatchCommand(nativeRef, COMMANDS.undo);
    },
    redo: () => {
      dispatchCommand(nativeRef, COMMANDS.redo);
    },
    clearFormatting: () => {
      dispatchCommand(nativeRef, COMMANDS.clearFormatting);
    },
    indent: () => {
      dispatchCommand(nativeRef, COMMANDS.indent);
    },
    outdent: () => {
      dispatchCommand(nativeRef, COMMANDS.outdent);
    },
    setAlignment: (alignment: TextAlignment) => {
      switch (alignment) {
        case 'left':
          dispatchCommand(nativeRef, COMMANDS.alignLeft);
          break;
        case 'center':
          dispatchCommand(nativeRef, COMMANDS.alignCenter);
          break;
        case 'right':
          dispatchCommand(nativeRef, COMMANDS.alignRight);
          break;
      }
    },
    toggleChecklistItem: () => {
      dispatchCommand(nativeRef, COMMANDS.toggleChecklistItem);
    },
    setText: (text: string) => {
      dispatchCommand(nativeRef, COMMANDS.setText, [text]);
    },
    setSelection: (start: number, end?: number) => {
      dispatchCommand(nativeRef, COMMANDS.setSelection, [start, end ?? start]);
    },
    setMentionRanges: (ranges: Array<{ start: number; end: number }>) => {
      dispatchCommand(nativeRef, COMMANDS.setMentionRanges, [ranges]);
    },
    removeLink: (location: number, length: number) => {
      dispatchCommand(nativeRef, COMMANDS.removeLink, [location, length]);
    },
    updateLink: (location: number, length: number, newUrl: string, newText: string) => {
      dispatchCommand(nativeRef, COMMANDS.updateLink, [location, length, newUrl, newText]);
    },
    applyInlineStyle: (key: InlineStyleKey, value: string) => {
      // Let RN normalise the colour string (hex / named / rgba) into the packed int
      // both platforms already speak, instead of parsing colours natively.
      const color = processColor(value);
      if (typeof color !== 'number') return;
      dispatchCommand(nativeRef, COMMANDS.applyInlineStyle, [key, color]);
    },
    removeInlineStyle: (key: InlineStyleKey) => {
      dispatchCommand(nativeRef, COMMANDS.removeInlineStyle, [key]);
    },
    getMentionRanges: () => mentionRangesRef.current,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleContentChange = useCallback(
    (event: any) => {
      // Parse blocksJson string (codegen doesn't support nested ReadonlyArray<Object>)
      let blocks: Block[] = [];
      try {
        if (event.nativeEvent.blocksJson) {
          blocks = JSON.parse(event.nativeEvent.blocksJson);
        } else if (event.nativeEvent.blocks) {
          // Fallback for backward compatibility
          blocks = [...event.nativeEvent.blocks];
        }
      } catch {
        blocks = [];
      }

      try {
        mentionRangesRef.current = event.nativeEvent.mentionRangesJson
          ? JSON.parse(event.nativeEvent.mentionRangesJson)
          : [];
      } catch {
        mentionRangesRef.current = [];
      }

      // Convert native event to our API format
      const contentEvent: ContentChangeEvent = {
        nativeEvent: {
          text: event.nativeEvent.text,
          blocks,
          delta: event.nativeEvent.delta,
        },
      };
      props.onContentChange?.(contentEvent);
    },
    [props.onContentChange],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectionChange = useCallback(
    (event: any) => {
      const selectionEvent: SelectionChangeEvent = {
        nativeEvent: {
          start: event.nativeEvent.start,
          end: event.nativeEvent.end,
        },
      };
      props.onSelectionChange?.(selectionEvent);
    },
    [props.onSelectionChange],
  );

  const handleFocus = useCallback(() => {
    props.onFocus?.();
  }, [props.onFocus]);

  const handleBlur = useCallback(() => {
    props.onBlur?.();
  }, [props.onBlur]);

  const handleActiveStylesChange = useCallback(
    (event: ActiveStylesChangeEvent) => {
      const native = event.nativeEvent;
      const styles: ActiveStylesState = {
        bold: native.bold,
        italic: native.italic,
        underline: native.underline,
        strikethrough: native.strikethrough,
        code: native.codeBlock ? false : native.code,
        codeBlock: native.codeBlock,
        highlight: native.highlight,
        blockType: native.blockType,
        alignment: native.alignment,
      };
      props.onActiveStylesChange?.(styles);
    },
    [props.onActiveStylesChange],
  );

  const handleLinkTap = useCallback(
    (event: LinkTapEvent) => {
      props.onLinkTap?.(event.nativeEvent);
    },
    [props.onLinkTap],
  );

  const handleSendRequest = useCallback(() => {
    props.onSendRequest?.();
  }, [props.onSendRequest]);

  const handlePasteMedia = useCallback(
    // permissive event type — bridges the native direct event; shape is checked at runtime
    (event: any) => {
      const items = event?.nativeEvent?.items;
      if (Array.isArray(items) && items.length > 0) {
        props.onPasteMedia?.(items as PasteMediaItem[]);
      }
    },
    [props.onPasteMedia],
  );

  const combinedStyle = StyleSheet.flatten([props.style, height != null ? { height } : undefined]);

  return (
    <RichTextEditorViewNative
      ref={nativeRef}
      testID={props.testID}
      accessibilityLabel={props.accessibilityLabel}
      style={combinedStyle}
      placeholder={props.placeholder}
      initialContentJson={props.initialContent ? JSON.stringify(props.initialContent) : undefined}
      editable={props.readOnly !== undefined ? !props.readOnly : true}
      maxHeight={props.maxHeight}
      numberOfLines={props.numberOfLines}
      showToolbar={props.readOnly ? false : props.showToolbar ?? true}
      toolbarOptions={props.toolbarOptions}
      variant={props.variant ?? 'outlined'}
      toolbarMode={props.toolbarMode}
      selection={props.selection}
      textStyle={props.textStyle}
      placeholderTextColor={props.placeholderTextColor}
      text={props.text}
      codeBackgroundColor={props.codeBackgroundColor}
      codeBorderColor={props.codeBorderColor}
      codeTextColor={props.codeTextColor}
      codeFontSize={props.codeFontSize}
      onContentChange={handleContentChange}
      onSelectionChange={handleSelectionChange}
      onEditorFocus={handleFocus}
      onEditorBlur={handleBlur}
      onSizeChange={handleSizeChange}
      onActiveStylesChange={handleActiveStylesChange}
      onLinkTap={handleLinkTap}
      onSendRequest={handleSendRequest}
      onPasteMedia={handlePasteMedia}
      enterKeyBehavior={props.enterKeyBehavior}
      showTextSelectionMenuItems={props.showTextSelectionMenuItems ?? true}
    />
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
export { DEFAULT_TOOLBAR_OPTIONS } from './types';
export type {
  Block,
  BlockType,
  StyleRange,
  TextAlignment,
  EditorVariant,
  ContentChangeEvent,
  SelectionChangeEvent,
  RichTextEditorRef,
  RichTextEditorProps,
  ToolbarOption,
  ContentDelta,
  DeltaType,
  Selection,
  TextStyle,
  InlineStyleKey,
} from './types';
export { dispatchCommand };
