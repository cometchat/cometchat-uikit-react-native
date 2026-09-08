import type { StyleProp, ViewStyle } from 'react-native';

// New interfaces for CometChat integration
export interface Selection {
  start: number;
  end: number;
}

export interface TextStyle {
  fontSize?: number;
  color?: string;
  fontFamily?: string;
}

export interface StyleRange {
  style: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'link' | 'code' | 'highlight' | 'textColor';
  start: number;
  end: number;
  url?: string;
  highlightColor?: string;
  /** `#rrggbb` for a `textColor` range — the wire format's only value-carrying style. */
  color?: string;
}

export type BlockType = 'paragraph' | 'bullet' | 'numbered' | 'heading' | 'quote' | 'checklist';
export type TextAlignment = 'left' | 'center' | 'right';
export type EditorVariant = 'outlined' | 'flat' | 'plain';

export interface Block {
  type: BlockType;
  text: string;
  styles: StyleRange[];
  alignment?: TextAlignment;
  checked?: boolean;
  indentLevel?: number;
}

export interface ContentChangeEvent {
  nativeEvent: {
    text: string;
    blocks: Block[];
    delta?: ContentDelta;
  };
}

export type DeltaType = 'insert' | 'delete' | 'format' | 'replace';

export interface ContentDelta {
  type: DeltaType;
  position: number;
  length?: number;
  text?: string;
  blockIndex?: number;
  style?: string;
}

export interface SelectionChangeEvent {
  nativeEvent: {
    start: number;
    end: number;
  };
}

export type ToolbarOption =
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'underline'
  | 'code'
  | 'highlight'
  | 'heading'
  | 'bullet'
  | 'numbered'
  | 'quote'
  | 'checklist'
  | 'link'
  | 'undo'
  | 'redo'
  | 'clearFormatting'
  | 'indent'
  | 'outdent'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight';

export const DEFAULT_TOOLBAR_OPTIONS: ToolbarOption[] = [
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'code',
  'highlight',
  'heading',
  'bullet',
  'numbered',
  'quote',
  'checklist',
  'link',
  'undo',
  'redo',
  'clearFormatting',
  'indent',
  'outdent',
  'alignLeft',
  'alignCenter',
  'alignRight',
];

export interface RichTextEditorProps {
  style?: StyleProp<ViewStyle>;
  placeholder?: string;
  initialContent?: Block[];
  readOnly?: boolean;
  maxHeight?: number;
  numberOfLines?: number;
  showToolbar?: boolean;
  toolbarOptions?: ToolbarOption[];
  variant?: EditorVariant;
  toolbarMode?: 'floating' | 'inline';
  // New props for CometChat integration
  selection?: Selection;
  textStyle?: TextStyle;
  placeholderTextColor?: string;
  text?: string;
  onContentChange?: (event: ContentChangeEvent) => void;
  onSelectionChange?: (event: SelectionChangeEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

/** Inline style a consumer formatter can apply to the composer selection. */
export type InlineStyleKey = 'color' | 'backgroundColor';

export interface RichTextEditorRef {
  setContent: (blocks: Block[]) => void;
  getText: () => Promise<string>;
  getBlocks: () => Promise<Block[]>;
  clear: () => void;
  focus: () => void;
  blur: () => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  toggleStrikethrough: () => void;
  toggleCode: () => void;
  toggleCodeBlock: () => void;
  toggleHighlight: (color?: string) => void;
  setHeading: () => void;
  setBulletList: () => void;
  setNumberedList: () => void;
  setQuote: () => void;
  setChecklist: () => void;
  setParagraph: () => void;
  insertLink: (url: string, text: string) => void;
  undo: () => void;
  redo: () => void;
  clearFormatting: () => void;
  indent: () => void;
  outdent: () => void;
  setAlignment: (alignment: TextAlignment) => void;
  toggleChecklistItem: () => void;
  setText: (text: string) => void;
  setSelection: (start: number, end?: number) => void;
  setMentionRanges: (ranges: Array<{ start: number; end: number }>) => void;
  removeLink: (location: number, length: number) => void;
  updateLink: (location: number, length: number, newUrl: string, newText: string) => void;
  /**
   * Applies an arbitrary inline style to the current selection, skipping mentions.
   * `value` is any React Native colour string (`'#FF0000'`, `'red'`, `'rgba(…)'`).
   * Styles compose — an existing bold/italic on the range is left alone.
   */
  applyInlineStyle: (key: InlineStyleKey, value: string) => void;
  /** Removes a style previously applied with `applyInlineStyle` from the current selection. */
  removeInlineStyle: (key: InlineStyleKey) => void;
  /**
   * Mention ranges in the composer's plain-text coordinates, as of the last content change.
   * Use it to leave mentions untouched when computing ranges to format.
   */
  getMentionRanges: () => Array<{ start: number; end: number }>;
}
