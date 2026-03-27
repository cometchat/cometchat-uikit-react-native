import type { ViewProps, HostComponent } from 'react-native';
import { requireNativeComponent } from 'react-native';

type Double = number;
type Int32 = number;
type DirectEventHandler<T> = (event: { nativeEvent: T }) => void;

// New prop types for CometChat integration
type SelectionProp = Readonly<{
  start: Int32;
  end: Int32;
}>;

type TextStyleProp = Readonly<{
  fontSize?: Double;
  color?: string;
  fontFamily?: string;
}>;

export type StyleRange = Readonly<{
  style: string;
  start: Int32;
  end: Int32;
  url?: string;
  highlightColor?: string;
}>;

export type Block = Readonly<{
  type: string;
  text: string;
  styles: ReadonlyArray<StyleRange>;
  alignment?: string;
  checked?: boolean;
  indentLevel?: Int32;
}>;

type ContentChangeEventData = Readonly<{
  text: string;
  blocksJson: string;
}>;

type SelectionChangeEventData = Readonly<{
  start: Int32;
  end: Int32;
}>;

type SizeChangeEventData = Readonly<{
  height: Double;
}>;

type ActiveStylesEventData = Readonly<{
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
  codeBlock: boolean;
  highlight: boolean;
  blockType: string;
  alignment: string;
}>;

type LinkTapEventData = Readonly<{
  url: string;
  text: string;
  location: Int32;
  length: Int32;
}>;

export interface NativeProps extends ViewProps {
  placeholder?: string;
  editable?: boolean;
  maxHeight?: Double;
  numberOfLines?: Int32;
  showToolbar?: boolean;
  toolbarOptions?: ReadonlyArray<string>;
  variant?: string;
  initialContentJson?: string;
  toolbarMode?: string;
  enterKeyBehavior?: string;

  // New props for CometChat integration
  selection?: SelectionProp;
  textStyle?: TextStyleProp;
  placeholderTextColor?: string;
  text?: string;
  showTextSelectionMenuItems?: boolean;
  codeBackgroundColor?: string;
  codeBorderColor?: string;
  codeTextColor?: string;
  codeFontSize?: Double;

  onContentChange?: DirectEventHandler<ContentChangeEventData>;
  onSelectionChange?: DirectEventHandler<SelectionChangeEventData>;
  onEditorFocus?: DirectEventHandler<Readonly<{}>>;
  onEditorBlur?: DirectEventHandler<Readonly<{}>>;
  onSizeChange?: DirectEventHandler<SizeChangeEventData>;
  onActiveStylesChange?: DirectEventHandler<ActiveStylesEventData>;
  onLinkTap?: DirectEventHandler<LinkTapEventData>;
  onSendRequest?: DirectEventHandler<Readonly<{}>>;
}

export default requireNativeComponent<NativeProps>(
  'RichTextEditorView',
) as HostComponent<NativeProps>;
