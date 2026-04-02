import React, { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo } from 'react';
import {
  Animated,
  View,
  TextInput,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
  KeyboardAvoidingViewProps,
  KeyboardAvoidingView,
  Modal,
  Platform,
  NativeModules,
  Text,
  Image,
  Dimensions,
  ImageSourcePropType,
  ImageStyle,
  InteractionManager,
  Keyboard,
  ColorValue,
  TouchableWithoutFeedbackProps,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { JSX } from 'react';
import RichTextEditor, {
  type RichTextEditorRef,
  type ContentChangeEvent,
  type ActiveStylesState,
} from '../CometChatRichTextEditor';

/**
 * Link tap event data emitted by the native editor when a user taps an existing link.
 * Matches the LinkTapEventData interface from the rich text editor bridge source.
 */
interface LinkTapEventData {
  url: string;
  text: string;
  location: number;
  length: number;
}
import { Style } from './styles';
import {
  calculateInputHeight,
  resolveEffectiveMaxHeight,
  getIconAlignment,
  DEFAULT_MIN_HEIGHT,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_PADDING_VERTICAL,
} from './heightUtils';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { startStreamingForRunId, stopStreamingForRunId, streamingState$ } from '../shared/services/stream-message.service';
import {
  CometChatSoundManager,
  CometChatMentionsFormatter,
  CometChatUrlsFormatter,
  CometChatTextFormatter,
  ChatConfigurator,
  CometChatUIKit,
  CometChatBottomSheet,
  CometChatActionSheet,
  CometChatMediaRecorder,
  CometChatMessagePreview,
  CometChatSuggestionList,
  SuggestionItem,
  useCometChatTranslation,
  CometChatUIEvents,
  CometChatInlineAudioRecorder,
} from '../shared';
import { useTheme } from '../theme';
import { CometChatTheme } from '../theme/type';
import { deepMerge } from '../shared/helper/helperFunctions';
import { CometChatMessageComposerAction, DeepPartial } from '../shared/helper/types';
import {
  isAgenticUser as checkIsAgenticUser,
  setQuotedMessageSafe,
  deriveHideButton,
  deriveDisableFeature,
  ReplyMessageState,
  parseMentionKey,
  calcDeletionRange,
  collectOverlappingMentions,
  shiftRemainingMentionKeys,
  MentionOverlap,
} from '../shared/helper/composerHelpers';
import { Icon } from '../shared/icons/Icon';
import { CometChatSendButtonView } from '../shared/views/CometChatSendButtonView/CometChatSendButtonView';
import { CometChatLinkConfirmPopup } from '../shared/views/CometChatLinkConfirmPopup';
import {
  getUnixTimestampInMilliseconds,
  messageStatus,
} from '../shared/utils/CometChatMessageHelper';
import { MessageTypeConstants, ReceiverTypeConstants, ConversationOptionConstants, MentionsVisibility, MentionsTargetElement, ViewAlignment, EnterKeyBehavior } from '../shared/constants/UIKitConstants';
import { MessageEvents } from '../shared/events';
import { CometChatUIEventHandler } from '../shared/events/CometChatUIEventHandler/CometChatUIEventHandler';
import { CometChatMessageEvents } from '../shared/events/CometChatMessageEvents';
import { ICONS } from './resources';
import { CommonUtils } from '../shared/utils/CommonUtils';
import { isCursorWithinMentionRange, getMentionRangeAtCursor } from '../shared/utils/MentionUtils';
import { stripMarkdown } from '../shared/utils/MarkdownUtils';
import { commonVars } from '../shared/base/vars';
import { permissionUtil } from '../shared/utils/PermissionUtil';
import { CheckPropertyExists } from '../shared/helper/functions';
import { CometChatStickerKeyboard } from '../extensions/Stickers/CometChatStickerKeyboard';
import { ExtensionTypeConstants } from '../extensions/ExtensionConstants';

const { FileManager, CommonUtil } = NativeModules;

// Listener IDs at module scope (v5 pattern)
const editMessageListenerID = "editMessageListener_" + new Date().getTime();
const replyMessageListenerID = "replyMessageListener_" + new Date().getTime();
const uiEventListenerID = "uiEventListener_" + new Date().getTime();
const uiEventListenerShowID = "uiEventListenerShow_" + new Date().getTime();
const uiEventListenerHideID = "uiEventListenerHide_" + new Date().getTime();

// Mic/sticker animation constants (hoisted to module level)
const MIC_ANIM_DURATION = 150;
const MIC_SLIDE_DISTANCE = 40;

// URL detection regex for paste-over-selection link creation (hoisted to module level)
// Note: paste-URL-over-selection is handled natively in iOS/Android editors

/**
 * Styles for the custom rich text formatting toolbar.
 * Note: theme-dependent values (colors) are applied inline at render time.
 * Layout values use static constants since they don't vary by theme.
 */
const richTextToolbarStyles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    width: 1,
    height: 20,
    marginHorizontal: 4,
  },
});

/**
 * Toolbar item configuration for the rich text formatting toolbar.
 * Items with type 'separator' render a vertical divider.
 * Items with type 'button' render a tappable icon.
 */
type ToolbarSeparator = { type: 'separator' };
type ToolbarButton = {
  type: 'button';
  key: string;
  icon: any;
  iconName?: string;
  isActive?: (styles: ActiveStylesState) => boolean;
  onPress: (
    inputRef: React.RefObject<any>,
    selectionPosition: { start: number; end: number },
    inputTextRef: React.RefObject<string>,
    setLinkText: (t: string) => void,
    setLinkUrl: (u: string) => void,
    setShowLinkModal: (v: boolean) => void,
  ) => void;
};
type ToolbarItem = ToolbarSeparator | ToolbarButton;

const richTextToolbarItems: ToolbarItem[] = [
  { type: 'button', key: 'bold', icon: null, iconName: 'format-bold', isActive: (s) => s.bold, onPress: (ref) => ref.current?.toggleBold() },
  { type: 'button', key: 'italic', icon: null, iconName: 'format-italic', isActive: (s) => s.italic, onPress: (ref) => ref.current?.toggleItalic() },
  { type: 'button', key: 'underline', icon: null, iconName: 'format-underlined', isActive: (s) => s.underline, onPress: (ref) => ref.current?.toggleUnderline() },
  { type: 'button', key: 'strikethrough', icon: null, iconName: 'format-strikethrough', isActive: (s) => s.strikethrough, onPress: (ref) => ref.current?.toggleStrikethrough() },
  { type: 'separator' },
  {
    type: 'button', key: 'link', icon: null, iconName: 'link',
    onPress: (_ref, selectionPosition, inputTextRef, setLinkText, setLinkUrl, setShowLinkModal) => {
      const { start, end } = selectionPosition;
      const currentText = inputTextRef.current || '';
      const selectedText = start !== end ? currentText.substring(start, end) : '';
      setLinkText(selectedText);
      setLinkUrl('');
      setShowLinkModal(true);
    },
  },
  { type: 'button', key: 'ordered-list', icon: null, iconName: 'format-list-numbered', isActive: (s) => s.blockType === 'numbered' || s.blockType === 'quoteNumbered', onPress: (ref) => ref.current?.setNumberedList() },
  { type: 'button', key: 'unordered-list', icon: null, iconName: 'format-list-bulleted', isActive: (s) => s.blockType === 'bullet' || s.blockType === 'quoteBullet', onPress: (ref) => ref.current?.setBulletList() },
  { type: 'separator' },
  { type: 'button', key: 'blockquote', icon: null, iconName: 'format-quote', isActive: (s) => s.blockType === 'quote' || s.blockType === 'quoteBullet' || s.blockType === 'quoteNumbered', onPress: (ref) => ref.current?.setQuote() },
  { type: 'button', key: 'inline-code', icon: null, iconName: 'code', isActive: (s) => s.code, onPress: (ref) => ref.current?.toggleCode() },
  { type: 'button', key: 'code-block', icon: null, iconName: 'code-blocks', onPress: (ref) => ref.current?.toggleCodeBlock() },
];

/**
 * ActionSheetBoard component for displaying attachment options (v5 pattern)
 */
const ActionSheetBoard = (props: any) => {
  const { shouldShow = false, onClose = () => {}, options = [], sheetRef, style } = props;
  return (
    <CometChatBottomSheet
      style={{ maxHeight: Dimensions.get("window").height * 0.49 }}
      ref={sheetRef}
      onClose={onClose}
      isOpen={shouldShow}
    >
      <CometChatActionSheet actions={options} style={style} />
    </CometChatBottomSheet>
  );
};

/**
 * RecordAudio component for voice recording (v5 pattern)
 */
const RecordAudio = (props: any) => {
  const {
    shouldShow = false,
    onClose = () => {},
    cometChatBottomSheetStyle = {},
    sheetRef,
    onPause = () => {},
    onPlay = () => {},
    onSend = (_recordedFile: string) => {},
    onStop = (_recordedFile: string) => {},
    onStart = () => {},
    mediaRecorderStyle,
  } = props;
  return (
    <CometChatBottomSheet
      ref={sheetRef}
      onClose={onClose}
      style={cometChatBottomSheetStyle}
      isOpen={shouldShow}
    >
      <CometChatMediaRecorder
        onClose={onClose}
        onPause={onPause}
        onPlay={onPlay}
        onSend={onSend}
        onStop={onStop}
        onStart={onStart}
        style={mediaRecorderStyle}
      />
    </CometChatBottomSheet>
  );
};

/**
 * MessagePreviewTray component for displaying edit/reply message preview (v5 pattern)
 */
const MessagePreviewTray = (props: any) => {
  const { shouldShow = false, text = '', onClose = () => {}, title = '' } = props;
  if (!shouldShow) return null;
  return (
    <CometChatMessagePreview
      messagePreviewTitle={title}
      messagePreviewSubtitle={stripMarkdown(text)}
      onCloseClick={onClose}
    />
  );
};

/**
 * AttachIconButton component for attachment button (v5 pattern)
 */
const AttachIconButton = (props: {
  onPress: TouchableWithoutFeedbackProps["onPress"];
  icon: ImageSourcePropType | JSX.Element;
  iconStyle: ImageStyle;
}) => {
  return (
    <TouchableOpacity onPress={props.onPress}>
      <Icon
        name='add-circle'
        icon={props.icon}
        color={props.iconStyle.tintColor}
        height={props.iconStyle.height}
        width={props.iconStyle.width}
        imageStyle={props.iconStyle}
      />
    </TouchableOpacity>
  );
};

/**
 * EmojiButton component for SingleLineTextComposer.
 * A custom emoji/sticker button with proper styling (no extra padding).
 * Opens the sticker keyboard panel when pressed.
 */
interface EmojiButtonProps {
  user?: CometChat.User;
  group?: CometChat.Group;
  composerIdMap: Map<string, any>;
  replyToMessage?: CometChat.BaseMessage;
  closeReplyPreview?: () => void;
  editorRef?: React.RefObject<RichTextEditorRef | null>;
}

const EmojiButton = ({ user, group, composerIdMap, replyToMessage, closeReplyPreview, editorRef }: EmojiButtonProps) => {
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [keyboardOpen, setKeyboardOpen] = React.useState(false);
  const theme = useTheme();
  const loggedInUser = React.useRef<CometChat.User | null>(null);
  const uiListenerIdRef = React.useRef<string>(`emoji_button_${Date.now()}`);
  
  // Use refs to store reply message info to avoid stale closures
  const replyToMessageRef = React.useRef(replyToMessage);
  const closeReplyPreviewRef = React.useRef(closeReplyPreview);

  // Update refs when props change
  React.useEffect(() => {
    replyToMessageRef.current = replyToMessage;
    closeReplyPreviewRef.current = closeReplyPreview;
  }, [replyToMessage, closeReplyPreview]);

  // Fetch logged-in user
  React.useEffect(() => {
    CometChat.getLoggedinUser().then((u: CometChat.User | null) => {
      if (u) loggedInUser.current = u;
    });
  }, []);

  // Keyboard event handling
  const keyboardShowEvent = Platform.select({
    ios: "keyboardWillShow",
    android: "keyboardDidShow",
  }) as any;

  const keyboardHideEvent = Platform.select({
    ios: "keyboardWillHide",
    android: "keyboardDidHide",
  }) as any;

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(keyboardShowEvent, () => {
      setKeyboardOpen(true);
      if (isPanelOpen) {
        closePanel();
      }
    });

    const keyboardDidHideListener = Keyboard.addListener(keyboardHideEvent, () => {
      setKeyboardOpen(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [isPanelOpen, keyboardShowEvent, keyboardHideEvent]);

  // Send sticker message
  const sendCustomMessage = React.useCallback((sticker: any) => {
    let receiverId = user?.getUid() || group?.getGuid();
    let receiverType = user
      ? CometChat.RECEIVER_TYPE.USER
      : group
        ? CometChat.RECEIVER_TYPE.GROUP
        : undefined;

    if (!receiverType) return;

    let customType = ExtensionTypeConstants.sticker;
    let parentId = composerIdMap?.get("parentMessageId") || undefined;
    let customMessage = new CometChat.CustomMessage(
      receiverId,
      receiverType,
      customType,
      sticker
    );

    customMessage.setCategory(CometChat.CATEGORY_CUSTOM as CometChat.MessageCategory);
    customMessage.setParentMessageId(parentId);
    customMessage.setMuid(String(getUnixTimestampInMilliseconds()));
    customMessage.setSender(loggedInUser.current!);
    if (user || group) {
      customMessage.setReceiver((user || group)!);
    }
    customMessage.shouldUpdateConversation(true);
    customMessage.setMetadata({ incrementUnreadCount: true });

    // Set quoted message if replying
    const currentReplyMessage = replyToMessageRef.current;
    if (currentReplyMessage) {
      customMessage.setQuotedMessage(currentReplyMessage);
      customMessage.setQuotedMessageId(currentReplyMessage.getId());
    }

    // Close reply preview
    const currentClosePreview = closeReplyPreviewRef.current;
    if (currentClosePreview) {
      currentClosePreview();
    }

    CometChatUIKit.sendCustomMessage(customMessage)
      .then((res: CometChat.BaseMessage) => {
        if (currentReplyMessage) {
          CometChatMessageEvents.emit(CometChatMessageEvents.ccReplyToMessage, {
            message: res,
            status: messageStatus.success,
          });
        }
      })
      .catch((err: any) => {
        console.error("Failed to send sticker:", err);
      });
  }, [user, group, composerIdMap]);

  const openPanel = React.useCallback(() => {
    Keyboard.dismiss();
    editorRef?.current?.blur();
    setIsPanelOpen(true);
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.showPanel, {
      alignment: ViewAlignment.composerBottom,
      child: () => <CometChatStickerKeyboard onPress={sendCustomMessage} />,
      panelId: "sticker",
    });
  }, [sendCustomMessage, editorRef]);

  const closePanel = React.useCallback(() => {
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.hidePanel, {
      alignment: ViewAlignment.composerBottom,
      child: () => null,
      panelId: "sticker",
    });
    setIsPanelOpen(false);
  }, []);

  const togglePanel = React.useCallback(() => {
    if (isPanelOpen) {
      closePanel();
    } else {
      if (keyboardOpen) {
        Keyboard.dismiss();
        setTimeout(() => {
          openPanel();
        }, 200);
      } else {
        openPanel();
      }
    }
  }, [isPanelOpen, keyboardOpen, openPanel, closePanel]);

  // Listen to global UI events
  React.useEffect(() => {
    const id = uiListenerIdRef.current;
    CometChatUIEventHandler.addUIListener(id, {
      hidePanel: (payload: any) => {
        if (isPanelOpen) {
          if (!payload || payload?.panelId === "sticker" || payload?.alignment === ViewAlignment.composerBottom) {
            setIsPanelOpen(false);
          }
        }
      },
      showPanel: (payload: any) => {
        if (payload?.panelId === "sticker") {
          setIsPanelOpen(true);
        }
      },
    });
    return () => {
      CometChatUIEventHandler.removeUIListener(id);
    };
  }, [isPanelOpen]);

  return (
    <TouchableOpacity
      onPress={togglePanel}
      style={Style.iconButton}
      accessibilityHint='Opens the sticker panel'
    >
      <Icon
        name={isPanelOpen ? "sticker-fill" : "sticker"}
        width={24}
        height={24}
        color={isPanelOpen ? theme.color.primary : theme.color.iconSecondary}
      />
    </TouchableOpacity>
  );
};

/**
 * Style interface for CometChatSingleLineMessageComposer.
 * This is a type alias for backward compatibility with v4 patterns.
 * In v5, styles are defined using DeepPartial<CometChatTheme["messageComposerStyles"]>.
 */
export type SingleLineMessageComposerStyleInterface = DeepPartial<CometChatTheme["messageComposerStyles"]>;

/**
 * Props interface for the CometChatSingleLineMessageComposer component (v5 pattern)
 * 
 * This interface matches CometChatMessageComposerInterface for full API compatibility.
 */
export interface CometChatCompactMessageComposerInterface {
  /**
   * Message composer identifier.
   * @type {string | number}
   */
  id?: string | number;

  /**
   * CometChat SDK's user object.
   * @type {CometChat.User}
   */
  user?: CometChat.User;

  /**
   * CometChat SDK's group object.
   * @type {CometChat.Group}
   */
  group?: CometChat.Group;

  /**
   * Initial text value for the input.
   * @type {string}
   */
  text?: string;

  /**
   * Placeholder text for the input.
   * @type {string}
   */
  placeHolderText?: string;

  /**
   * Callback triggered when the input text changes.
   * @param {string} text - The updated text.
   */
  onChangeText?: (text: string) => void;

  /**
   * Flag to turn off sound for outgoing messages.
   * @type {boolean}
   */
  disableSoundForOutgoingMessages?: boolean;

  /**
   * Flag to turn off sound for messages (alias for disableSoundForOutgoingMessages).
   * @type {boolean}
   */
  disableSoundForMessages?: boolean;

  /**
   * Custom audio sound to be played while sending messages.
   * @type {*}
   */
  customSoundForOutgoingMessage?: any;

  /**
   * Custom audio sound for messages (alias for customSoundForOutgoingMessage).
   * @type {*}
   */
  customSoundForMessage?: any;

  /**
   * Flag to disable typing events.
   * @type {boolean}
   */
  disableTypingEvents?: boolean;

  /**
   * Initial text to be displayed in the composer.
   * @type {string}
   */
  initialComposertext?: string;

  /**
   * Renders a preview section at the top of the composer.
   */
  HeaderView?: ({ user, group }: { user?: CometChat.User; group?: CometChat.Group }) => JSX.Element;

  /**
   * Renders a footer section at the bottom of the composer.
   */
  FooterView?: ({ user, group }: { user?: CometChat.User; group?: CometChat.Group }) => JSX.Element;

  /**
   * Callback triggered when the input text changes (alias for onChangeText).
   * @param {string} text - The updated text.
   */
  onTextChange?: (text: string) => void;

  /**
   * Returns the attachment options for the composer.
   */
  attachmentOptions?: ({
    user,
    group,
    composerId,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
    composerId: Map<any, any>;
  }) => CometChatMessageComposerAction[];

  /**
   * Replaces the default Auxiliary Button.
   */
  AuxiliaryButtonView?: ({
    user,
    group,
    composerId,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
    composerId: string | number;
  }) => JSX.Element;

  /**
   * Replaces the default Secondary Button (attachment button).
   */
  SecondaryButtonView?: ({
    user,
    group,
    composerId,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
    composerId: string | number;
  }) => JSX.Element;

  /**
   * Replaces the default Send Button.
   */
  SendButtonView?: ({
    user,
    group,
    composerId,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
    composerId: string | number;
  }) => JSX.Element;

  /**
   * Message id required for threaded messages.
   * @type {string | number}
   */
  parentMessageId?: string | number;

  /**
   * Custom styles for the message composer component.
   */
  style?: DeepPartial<CometChatTheme["messageComposerStyles"]>;

  /**
   * Custom styles for the message composer (alias for style).
   */
  messageComposerStyle?: DeepPartial<CometChatTheme["messageComposerStyles"]>;

  /**
   * Custom styles for the input field.
   */
  inputStyle?: StyleProp<TextStyle>;

  /**
   * Custom styles for the send button.
   */
  sendButtonStyle?: StyleProp<ViewStyle>;

  /**
   * Custom icon for the send button.
   */
  sendButtonIcon?: ImageSourcePropType;

  /**
   * Flag to hide the voice recording button.
   * @type {boolean}
   */
  hideVoiceRecordingButton?: boolean;

  /**
   * Flag to hide voice recording (alias for hideVoiceRecordingButton).
   * @type {boolean}
   */
  hideVoiceRecording?: boolean;

  /**
   * Custom icon URL for voice recording.
   */
  voiceRecordingIconURL?: ImageSourcePropType;

  /**
   * Custom styles for the media recorder.
   */
  mediaRecorderStyle?: any;

  /**
   * Custom pause icon URL for media recorder.
   */
  pauseIconUrl?: ImageSourcePropType;

  /**
   * Custom play icon URL for media recorder.
   */
  playIconUrl?: ImageSourcePropType;

  /**
   * Custom record icon URL for media recorder.
   */
  recordIconUrl?: ImageSourcePropType;

  /**
   * Custom delete icon URL for media recorder.
   */
  deleteIconUrl?: ImageSourcePropType;

  /**
   * Custom stop icon URL for media recorder.
   */
  stopIconUrl?: ImageSourcePropType;

  /**
   * Custom submit icon URL for media recorder.
   */
  submitIconUrl?: ImageSourcePropType;

  /**
   * Callback triggered when voice recording starts.
   */
  onVoiceRecordingStart?: () => void;

  /**
   * Callback triggered when voice recording ends.
   * @param {string} recordedFile - The path to the recorded file.
   */
  onVoiceRecordingEnd?: (recordedFile: string) => void;

  /**
   * Callback triggered when the send button is pressed.
   * @param {CometChat.BaseMessage} message - The base message object.
   */
  onSendButtonPress?: (message: CometChat.BaseMessage) => void;

  /**
   * Callback triggered when an error occurs.
   * @param {CometChat.CometChatException} error - The error object.
   */
  onError?: (error: CometChat.CometChatException) => void;

  /**
   * Override properties for the KeyboardAvoidingView.
   */
  keyboardAvoidingViewProps?: KeyboardAvoidingViewProps;

  /**
   * Collection of text formatter classes to apply custom formatting.
   */
  textFormatters?: Array<
    CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter
  >;

  /**
   * Flag to disable mention functionality.
   */
  disableMentions?: boolean;

  /**
   * Flag to disable the special group mention (@all / @channel etc.).
   * @default false
   */
  disableMentionAll?: boolean;

  /**
   * Custom alias label for the group-wide mention.
   * @default "all"
   */
  mentionAllLabel?: string;

  /**
   * Controls image quality when taking pictures from the camera.
   * @default 20
   */
  imageQuality?: number;

  /**
   * If true, hides the camera option from the attachment options.
   */
  hideCameraOption?: boolean;

  /**
   * If true, hides the image attachment option from the attachment options.
   */
  hideImageAttachmentOption?: boolean;

  /**
   * If true, hides the video attachment option from the attachment options.
   */
  hideVideoAttachmentOption?: boolean;

  /**
   * If true, hides the audio attachment option from the attachment options.
   */
  hideAudioAttachmentOption?: boolean;

  /**
   * If true, hides the file/document attachment option from the attachment options.
   */
  hideFileAttachmentOption?: boolean;

  /**
   * If true, hides the polls option from the attachment options.
   */
  hidePollsAttachmentOption?: boolean;

  /**
   * If true, hides the collaborative document option.
   */
  hideCollaborativeDocumentOption?: boolean;

  /**
   * If true, hides the collaborative whiteboard option.
   */
  hideCollaborativeWhiteboardOption?: boolean;

  /**
   * If true, hides the entire attachment button from the composer.
   */
  hideAttachmentButton?: boolean;

  /**
   * Custom icon for the attachment button.
   */
  attachmentIcon?: ImageSourcePropType;

  /**
   * Callback triggered when the attachment button is clicked.
   */
  onAttachmentClick?: () => void;

  /**
   * If true, hides the stickers button from the composer.
   */
  hideStickersButton?: boolean;

  /**
   * If true, hides the send button from the composer.
   */
  hideSendButton?: boolean;

  /**
   * If true, hides all auxiliary buttons.
   */
  hideAuxiliaryButtons?: boolean;

  /**
   * If true, hides the auxiliary button (alias for hideAuxiliaryButtons).
   */
  hideAuxiliaryButton?: boolean;

  /**
   * Additional attachment options to append to defaults.
   */
  addAttachmentOptions?: ({
    user,
    group,
    composerId,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
    composerId: Map<any, any>;
  }) => CometChatMessageComposerAction[];

  /**
   * Determines the alignment of auxiliary buttons.
   * @default "left"
   */
  auxiliaryButtonsAlignment?: "left" | "right";

  /**
   * Determines the alignment of auxiliary buttons (deprecated alias).
   * @default "right"
   */
  auxiliaryButtonAlignment?: "left" | "right";

  /**
   * Custom send button view for AI agents (only applies to @agentic users)
   */
  AgentSendButtonView?: React.ComponentType<{
    isButtonDisabled: boolean;
    composerRef: any;
  }>;

  // ============================================
  // Auto-Expand Configuration Props (SingleLineTextComposer specific)
  // ============================================

  /**
   * Maximum number of lines before scrolling is enabled.
   * @default 5
   */
  maxLines?: number;

  /**
   * Enable rich text formatting toolbar (bold, italic, underline, strikethrough, code).
   * When true, an inline toolbar is shown above the text input.
   * When false, the editor behaves like a plain TextInput.
   * @default true
   */
  enableRichTextEditor?: boolean;

  /**
   * Hides all rich text formatting options.
   * When true, the toolbar is always visible by default (no toggle needed).
   * @default false
   */
  hideRichTextFormattingOptions?: boolean;

  /**
   * Behavior when Enter key is pressed (Android only — iOS always inserts new line).
   * @default EnterKeyBehavior.NewLine
   * @platform Android
   */
  enterKeyBehavior?: EnterKeyBehavior;

  /**
   * Show Bold/Italic/Underline/Strikethrough in the text selection context menu.
   * When true, formatting options appear in the native text selection popup.
   * @default true
   */
  showTextSelectionMenuItems?: boolean;

  /**
   * Maximum number of mentions allowed per message.
   * @default 10
   */
  maxMentionLimit?: number;

  /**
   * Callback triggered when mention limit is reached.
   */
  onMentionLimitReached?: () => void;

  /**
   * Minimum height for the input in pixels.
   * @default 40
   */
  minInputHeight?: number;

  /**
   * Maximum height for the input in pixels.
   */
  maxInputHeight?: number;
}

/**
 * Helper component for icon buttons (v5 pattern)
 */
const IconButton = (props: {
  icon?: ImageSourcePropType | JSX.Element;
  name?: string;
  onClick: () => void;
  buttonStyle?: StyleProp<ViewStyle>;
  iconStyle?: ImageStyle;
  disable?: boolean;
  tintColor?: ColorValue;
  testID?: string;
}) => {
  const { icon, name, onClick, buttonStyle, iconStyle, disable, tintColor, testID } = props;
  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={disable ? 1 : 0.7}
      onPress={disable ? undefined : onClick}
      style={[Style.imageButtonBase, buttonStyle]}
    >
      <Icon
        name={name as any}
        icon={icon}
        color={tintColor}
        height={iconStyle?.height || 24}
        width={iconStyle?.width || 24}
        imageStyle={iconStyle}
      />
    </TouchableOpacity>
  );
};

/**
 * CometChatSingleLineMessageComposer - A compact, single-line text input component
 * for composing and sending text messages.
 * 
 * This component is API-compatible with CometChatMessageComposer, allowing
 * developers to easily swap between the two based on their UI requirements.
 * 
 * Key differences from CometChatMessageComposer:
 * - Single-line input (no multiline support)
 * - Text-only messaging (no attachments, voice recording, etc.)
 * - Compact UI suitable for inline messaging scenarios
 * 
 * @example
 * // Basic usage
 * <CometChatSingleLineMessageComposer user={user} />
 * 
 * @example
 * // With custom auxiliary buttons
 * <CometChatSingleLineMessageComposer
 *   user={user}
 *   AuxiliaryButtonView={() => <MyCustomButtons />}
 *   auxiliaryButtonsAlignment="right"
 * />
 */
export const CometChatCompactMessageComposer = React.forwardRef(
  (props: CometChatCompactMessageComposerInterface, ref) => {
    const theme = useTheme();
    const { t } = useCometChatTranslation();

    const {
      id,
      user,
      group,
      text,
      placeHolderText,
      onChangeText,
      style,
      messageComposerStyle, // API compatibility
      inputStyle,
      sendButtonStyle,
      sendButtonIcon,
      SendButtonView,
      onSendButtonPress,
      AuxiliaryButtonView,
      SecondaryButtonView,
      auxiliaryButtonsAlignment,
      auxiliaryButtonAlignment, // deprecated alias
      hideAuxiliaryButton,
      hideAuxiliaryButtons,
      hideAttachmentButton: propHideAttachmentButton,
      hideStickersButton: propHideStickersButton,
      hideSendButton,
      HeaderView,
      FooterView,
      parentMessageId,
      disableTypingEvents: propDisableTypingEvents,
      disableMentions: propDisableMentions,
      disableSoundForMessages = true,
      customSoundForMessage,
      textFormatters,
      onError,
      keyboardAvoidingViewProps,
      // Attachment props
      attachmentIcon,
      attachmentOptions,
      onAttachmentClick,
      imageQuality = 20,
      // Additional attachment options
      addAttachmentOptions,
      // Individual hide options for attachments
      hideCameraOption,
      hideImageAttachmentOption,
      hideVideoAttachmentOption,
      hideAudioAttachmentOption,
      hideFileAttachmentOption,
      hidePollsAttachmentOption,
      hideCollaborativeDocumentOption,
      hideCollaborativeWhiteboardOption,
      // Voice recording props
      hideVoiceRecording: propHideVoiceRecording,
      voiceRecordingIconURL,
      mediaRecorderStyle,
      pauseIconUrl,
      playIconUrl,
      recordIconUrl,
      deleteIconUrl,
      stopIconUrl,
      submitIconUrl,
      onVoiceRecordingStart,
      onVoiceRecordingEnd,
      // Auto-expand configuration props
      maxLines,
      minInputHeight,
      maxInputHeight,
      // Rich text formatting prop
      enableRichTextEditor = true,
      hideRichTextFormattingOptions = false,
      enterKeyBehavior = EnterKeyBehavior.NewLine,
      showTextSelectionMenuItems = true,
      maxMentionLimit = 10,
      onMentionLimitReached,
      // Agentic user props
      AgentSendButtonView,
      // Initial text prop
      initialComposertext,
      // Mention configuration props
      disableMentionAll = false,
      mentionAllLabel = "all",
    } = props;

    // Auto-expand is always enabled (internal behavior)
    const autoExpand = true;

    // ============================================
    // Agentic User Support
    // ============================================

    /**
     * Helper function to check if the current user is an agentic user.
     * Agentic users have the role '@agentic' and require special handling:
     * - Auto-hide certain buttons (attachment, stickers, voice recording)
     * - Disable typing events and mentions
     * - Apply send button delay
     * - Track parent message ID for threaded conversations
     * 
     * @returns {boolean} True if user has role '@agentic'
     */
    const isAgenticUser = useCallback((): boolean => {
      return checkIsAgenticUser(user);
    }, [user]);

    /**
     * Derived state variables for automatic button hiding for agentic users.
     * When user is agentic, these buttons are automatically hidden regardless of prop values.
     * Uses shared helper function for consistency with CometChatMessageComposer.
     */
    const isAgentic = isAgenticUser();
    const hideAttachmentButton = deriveHideButton(isAgentic, propHideAttachmentButton);
    const hideStickersButton = deriveHideButton(isAgentic, propHideStickersButton);
    const hideVoiceRecordingButton = deriveHideButton(isAgentic, propHideVoiceRecording);

    /**
     * Derived state variables for disabling typing events and mentions for agentic users.
     * When user is agentic, these features are automatically disabled.
     * Uses shared helper function for consistency with CometChatMessageComposer.
     */
    const disableTypingEvents = deriveDisableFeature(isAgentic, propDisableTypingEvents);
    const disableMentions = deriveDisableFeature(isAgentic, propDisableMentions);

    // Resolve alignment (support both prop names)
    const resolvedAlignment = auxiliaryButtonsAlignment || auxiliaryButtonAlignment || 'right';

    // Merge styles using deepMerge (support both style and messageComposerStyle)
    // For agentic users, hide the divider line
    const mergedComposerStyle = useMemo(() => {
      const propStyle = style || messageComposerStyle || {};
      const mergedStyle = deepMerge(theme.messageComposerStyles || {}, propStyle);
      
      // Hide divider for agentic users (matching CometChatMessageComposer behavior)
      if (isAgentic) {
        return {
          ...mergedStyle,
          messageInputStyles: {
            ...mergedStyle.messageInputStyles,
            dividerStyle: {
              display: 'none' as const
            }
          }
        };
      }
      return mergedStyle;
    }, [theme.messageComposerStyles, style, messageComposerStyle, isAgentic]);

    // Use merged style throughout the component
    const resolvedStyle = mergedComposerStyle;

    /**
     * inputTextRef: holds the current text value without triggering re-renders.
     * Updated on every keystroke from onContentChange.
     * inputText state is only updated for programmatic changes (mentions, clear, edit)
     * to push text to native via the text prop.
     */
    const inputTextRef = React.useRef(initialComposertext ?? text ?? '');
    const [inputText, setInputText] = React.useState(initialComposertext ?? text ?? '');

    /**
     * Flag to skip the next onContentChange after a programmatic text update.
     * Prevents handleTextChange from processing the echo of our own setText.
     */
    const skipNextContentChange = React.useRef(false);

    /**
     * Timestamp until which onSelectionChange events should be ignored.
     * After programmatic setText (e.g. mention insertion), the native side
     * fires multiple selection change events that reset cursor to 0.
     * We ignore all selection events for a short window after setText.
     */
    const ignoreSelectionUntil = React.useRef(0);

    /**
     * Stores the latest blocks from the RichTextEditor's onContentChange.
     * Used to convert structured formatting data to markdown when sending.
     */
    const blocksRef = React.useRef<any[]>([]);

    /**
     * Structured blocks to load into the native editor when entering edit mode.
     * Parsed from the original message's markdown via markdownToBlocks.
     * Passed as the `initialContent` prop so the editor displays WYSIWYG formatting.
     * Reset to undefined when edit mode is exited or input is cleared.
     */
    const [editContentBlocks, setEditContentBlocks] = React.useState<any[] | undefined>(undefined);

    const [isVisible, setIsVisible] = React.useState(false);
    const [CustomView, setCustomView] = React.useState<React.ReactNode>(null);
    const [CustomViewHeader, setCustomViewHeader] = React.useState<React.FC | React.ReactNode>(null);
    const [CustomViewFooter, setCustomViewFooter] = React.useState<React.FC | React.ReactNode>(null);
    const [kbOffset, setKbOffset] = React.useState(59);
    const [showActionSheet, setShowActionSheet] = React.useState(false);
    const [actionSheetItems, setActionSheetItems] = React.useState<CometChatMessageComposerAction[]>([]);
    const [showInlineRecorder, setShowInlineRecorder] = React.useState(false);

    // Mic/sticker animation: single Animated.Value drives mic slide + fade
    // 0 = idle (mic visible), 1 = typing (mic hidden)
    const micAnimValue = React.useRef(new Animated.Value(0)).current;
    const [messagePreview, setMessagePreview] = React.useState<{ message: any; mode: string } | null>(null);
    const [showMentionList, setShowMentionList] = React.useState(false);
    const [mentionsSearchData, setMentionsSearchData] = React.useState<Array<SuggestionItem>>([]);
    const [suggestionListLoader, setSuggestionListLoader] = React.useState(false);
    const [selectionPosition, setSelectionPosition] = React.useState<{ start: number; end: number }>({ start: 0, end: 0 });

    // Active formatting styles state — tracks which styles are active at the cursor position
    const [activeStyles, setActiveStyles] = React.useState<ActiveStylesState>({
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      code: false,
      codeBlock: false,
      highlight: false,
      blockType: 'paragraph',
      alignment: 'left',
    });
    // Ref mirror of activeStyles — always current (no render-cycle delay).
    // Used by shouldOpenList so the mention popup isn't blocked by stale state
    // after exiting a code block.
    const activeStylesRef = React.useRef<ActiveStylesState>(activeStyles);

    // Link modal state (Slack-style: prefills selected text)
    const [showLinkModal, setShowLinkModal] = React.useState(false);
    const [linkText, setLinkText] = React.useState('');
    const [linkUrl, setLinkUrl] = React.useState('');

    // Link tap dialog state (edit/remove existing links)
    const [linkTapData, setLinkTapData] = React.useState<{
      url: string; text: string; location: number; length: number;
    } | null>(null);
    const [linkEditMode, setLinkEditMode] = React.useState(false);
    const [editLinkUrl, setEditLinkUrl] = React.useState('');
    const [editLinkText, setEditLinkText] = React.useState('');

    // Track which code button is active (inline code vs code block)
    const [codeBlockActive, setCodeBlockActive] = React.useState(false);

    // Focus tracking for floating toolbar visibility
    const [isFocused, setIsFocused] = React.useState(false);


    /**
     * Tracks links inserted via the JS modal.
     * Maps link display text to URL. Used at send time to wrap
     * matching text with [text](url) markdown as a fallback
     * in case the native editor's blocks data is stale.
     */
    const pendingLinksRef = React.useRef<Map<string, string>>(new Map());

    /**
     * Handles link tap events from the native editor.
     * Opens the link tap dialog with the tapped link's metadata.
     */
    const onLinkTap = useCallback((data: LinkTapEventData) => {
      setLinkTapData(data);
      setLinkEditMode(false);
      setEditLinkUrl(data.url);
      setEditLinkText(data.text);
    }, []);

    /**
     * Sets input text programmatically — used for mentions, clear, edit message.
     * Updates React state (for UI like send button) and pushes to native
     * via imperative setText command (force=true bypasses typing guard).
     * The text prop is NOT used (removed from JSX to prevent cursor jumping).
     */
    const setInputTextProgrammatic = React.useCallback((newText: string) => {
      inputTextRef.current = newText;
      skipNextContentChange.current = true;
      setInputText(newText);
      inputRef.current?.setText?.(newText);
    }, []);

    // ============================================
    // Warning Message Support
    // ============================================

    /**
     * State for tracking warning message (e.g., mention limit reached).
     * When set, displays a warning in the CustomViewHeader area.
     */
    const [warningMessage, setWarningMessage] = React.useState<string>('');

    // ============================================
    // Reply Message Support
    // ============================================

    /**
     * State for tracking reply message.
     * When set, displays a reply preview and attaches the quoted message to sent messages.
     */
    const [replyMessage, setReplyMessage] = React.useState<ReplyMessageState | null>(null);

    /**
     * Ref to hold current replyMessage value to avoid stale closures in callbacks.
     * This is necessary because attachment handlers and other callbacks may capture
     * stale state values.
     */
    const replyMessageRef = React.useRef(replyMessage);

    /**
     * Callback to close the reply preview.
     * Clears the reply message state and hides the preview.
     */
    const closeReplyPreview = useCallback(() => {
      setReplyMessage(null);
    }, []);

    // ============================================
    // Agentic User State Management
    // ============================================

    /**
     * State for tracking send button delay for agentic users.
     * When true, the send button is disabled for 1 second after sending.
     */
    const [isSendButtonDisabledForDelay, setIsSendButtonDisabledForDelay] = React.useState(false);

    /**
     * State for tracking streaming status for agentic users.
     * Used to show/hide the stop button during AI response streaming.
     */
    const [isStreaming, setIsStreaming] = React.useState(false);
    const [showStopButton, setShowStopButton] = React.useState(false);

    // ============================================
    // Auto-Expand Height State Management
    // ============================================

    /**
     * Resolve the effective min and max heights for auto-expand mode.
     * Uses props, style overrides, or defaults in that order of precedence.
     */
    const resolvedMinHeight = minInputHeight ?? DEFAULT_MIN_HEIGHT;
    const resolvedLineHeight = DEFAULT_LINE_HEIGHT;
    const resolvedMaxHeight = resolveEffectiveMaxHeight({
      maxLines,
      maxHeight: maxInputHeight,
      lineHeight: resolvedLineHeight,
      paddingVertical: DEFAULT_PADDING_VERTICAL,
    });

    /**
     * State for tracking the current input height.
     * Initialized to minHeight (single-line height).
     * Only used when autoExpand is true.
     *
     */
    const [inputHeight, setInputHeight] = React.useState<number>(resolvedMinHeight);

    /**
     * State for tracking whether the input is expanded beyond single-line height.
     * Used for icon alignment and other UI adjustments.
     *
     */
    const [isExpanded, setIsExpanded] = React.useState<boolean>(false);

    // ============================================
    // Debouncing for Height Updates
    // ============================================

    /**
     * Debounce delay in milliseconds.
     * 16ms corresponds to one frame at 60fps, ensuring smooth updates
     * while preventing excessive re-renders during rapid typing.
     *
     */
    const DEBOUNCE_DELAY_MS = 16;

    /**
     * Ref to track pending height update timeout.
     * Used to debounce rapid content size changes and prevent flickering.
     *
     */
    const pendingHeightUpdateRef = React.useRef<NodeJS.Timeout | null>(null);

    /**
     * Ref to store the latest pending height value.
     * This ensures that only the final height value within the debounce
     * window is applied to state (debounce idempotence).
     *
     */
    const pendingHeightValueRef = React.useRef<number | null>(null);

    /**
     * Cleanup pending height update timeout on unmount.
     * Prevents memory leaks and state updates on unmounted component.
     *
     */
    useEffect(() => {
      return () => {
        if (pendingHeightUpdateRef.current) {
          clearTimeout(pendingHeightUpdateRef.current);
          pendingHeightUpdateRef.current = null;
        }
      };
    }, []);

    /**
     * Apply the debounced height update to state.
     * Only updates if the new height differs from current height.
     *
     * @param newHeight - The new height value to apply
     *
     */
    const applyHeightUpdate = useCallback((newHeight: number) => {
      // Only update state if height has changed
      if (newHeight !== inputHeight) {
        setInputHeight(newHeight);

        // Update expanded state based on whether height exceeds minHeight
        const newIsExpanded = newHeight > resolvedMinHeight;
        if (newIsExpanded !== isExpanded) {
          setIsExpanded(newIsExpanded);
        }
      }
    }, [inputHeight, isExpanded, resolvedMinHeight]);

    /**
     * Handle content size changes from the TextInput.
     * Uses debouncing to prevent flickering during rapid content changes.
     * Calculates the new height using utility functions and updates state
     * only when the height actually changes.
     *
     * This handler supports both expansion (when text is added) and contraction
     * (when text is deleted). When text is deleted and content height decreases,
     * the input height shrinks accordingly, returning to minHeight when the
     * content fits within a single line.
     *
     * @param event - The content size change event from TextInput
     *
     */
    const handleContentSizeChange = useCallback((event: { nativeEvent: { contentSize: { width: number; height: number } } }) => {
      if (!autoExpand) {
        return;
      }

      const { height: contentHeight } = event.nativeEvent.contentSize;

      // Calculate the new height using the utility function
      const newHeight = calculateInputHeight(contentHeight, resolvedMinHeight, resolvedMaxHeight);

      // Store the latest pending height value
      pendingHeightValueRef.current = newHeight;

      // Clear any existing pending update
      if (pendingHeightUpdateRef.current) {
        clearTimeout(pendingHeightUpdateRef.current);
      }

      // Schedule debounced height update
      pendingHeightUpdateRef.current = setTimeout(() => {
        // Apply the latest pending height value
        if (pendingHeightValueRef.current !== null) {
          applyHeightUpdate(pendingHeightValueRef.current);
          pendingHeightValueRef.current = null;
        }
        pendingHeightUpdateRef.current = null;
      }, DEBOUNCE_DELAY_MS);
    }, [autoExpand, resolvedMinHeight, resolvedMaxHeight, applyHeightUpdate]);

    // Refs (v5 pattern: use React.useRef)
    const loggedInUser = React.useRef<CometChat.User | null>(null);
    const chatWith = React.useRef<string>('');
    const chatWithId = React.useRef<string>('');
    const inputRef = React.useRef<RichTextEditorRef>(null);
    const isTyping = React.useRef<NodeJS.Timeout | null>(null);
    const allFormatters = React.useRef<Map<string, CometChatTextFormatter | CometChatMentionsFormatter>>(new Map());
    const bottomSheetRef = React.useRef<any>(null);
    const mentionMap = React.useRef<Map<string, SuggestionItem>>(new Map());
    const trackingCharacters = React.useRef<string[]>([]);
    const activeCharacter = React.useRef<string>('');
    const searchStringRef = React.useRef<string>('');
    // Initialize plainTextInputRef with initialComposertext if provided
    const plainTextInputRef = React.useRef<string>(initialComposertext ?? '');

    /**
     * Syncs mention ranges from mentionMap to the native editor for visual styling.
     * Converts mentionMap keys ("start_end") into [{start, end}] and dispatches
     * the setMentionRanges command so the native side can apply bold purple + background.
     */
    const syncMentionRanges = React.useCallback(() => {
      const ranges: Array<{ start: number; end: number }> = [];
      mentionMap.current.forEach((_value, key) => {
        const parts = key.split('_');
        const start = parseInt(parts[0], 10);
        const end = parseInt(parts[1], 10);
        if (!isNaN(start) && !isNaN(end)) {
          ranges.push({ start, end });
        }
      });
      inputRef.current?.setMentionRanges?.(ranges);
    }, []);

    /**
     * Ref for tracking send button delay timer for agentic users.
     * Used to clear the timer on unmount to prevent memory leaks.
     */
    const sendButtonDelayTimer = React.useRef<NodeJS.Timeout | null>(null);

    /**
     * Ref for tracking parent message ID for agentic users.
     * After first message sent to agentic user without parentMessageId prop,
     * stores the message ID for subsequent messages.
     */
    const parentMessageIdRef = React.useRef<number | null>(null);

    // Handle platform-specific keyboard offset (iOS safe area insets)
    useLayoutEffect(() => {
      if (Platform.OS === 'ios') {
        if (Number.isInteger(commonVars.safeAreaInsets.top)) {
          setKbOffset(commonVars.safeAreaInsets.top ?? 59);
          return;
        }
        CommonUtil?.getSafeAreaInsets?.().then((res: { top: number; bottom: number }) => {
          if (Number.isInteger(res.top)) {
            commonVars.safeAreaInsets.top = res.top;
            commonVars.safeAreaInsets.bottom = res.bottom;
            setKbOffset(res.top);
          }
        }).catch(() => {
          // Fallback to default offset if native module fails
        });
      }
    }, []);

    // Get logged in user
    useEffect(() => {
      CometChat.getLoggedinUser()
        .then((u: CometChat.User | null) => {
          if (u) {
            loggedInUser.current = u;
          }
        })
        .catch((error: CometChat.CometChatException) => {
          onError?.(error);
        });
    }, []);

    /**
     * Subscribe to streaming state observable for agentic users.
     * Updates isStreaming state when streaming status changes.
     * Hides stop button when streaming ends.
     */
    useEffect(() => {
      const sub = streamingState$.subscribe((streaming) => {
        setIsStreaming(streaming);
        if (!streaming) setShowStopButton(false);
      });
      return () => sub.unsubscribe();
    }, []);

    /**
     * Cleanup effect for send button delay timer.
     * Clears the timer on unmount to prevent memory leaks.
     */
    useEffect(() => {
      return () => {
        if (sendButtonDelayTimer.current) {
          clearTimeout(sendButtonDelayTimer.current);
          sendButtonDelayTimer.current = null;
        }
      };
    }, []);

    /**
     * Keep replyMessageRef in sync with replyMessage state.
     * This ensures callbacks always have access to the current reply message value.
     */
    useEffect(() => {
      replyMessageRef.current = replyMessage;
    }, [replyMessage]);

    // Configure receiver from user prop
    useEffect(() => {
      if (user) {
        chatWith.current = ReceiverTypeConstants.user;
        chatWithId.current = user.getUid();
      }
    }, [user]);

    // Configure receiver from group prop
    useEffect(() => {
      if (group) {
        chatWith.current = ReceiverTypeConstants.group;
        chatWithId.current = group.getGuid();
      }
    }, [group]);

    // Initialize text formatters
    useEffect(() => {
      let _formatter = [...(textFormatters || [])];

      // Add default mentions formatter if not disabled
      if (!disableMentions) {
        const mentionsFormatter = ChatConfigurator.getDataSource().getMentionsFormatter();
        if (CometChatUIKit.loggedInUser) {
          mentionsFormatter.setLoggedInUser(CometChatUIKit.loggedInUser);
        }
        mentionsFormatter.setContext?.("composer");
        if (resolvedStyle?.mentionsStyle) {
          mentionsFormatter.setMentionsStyle(
            resolvedStyle.mentionsStyle as CometChatTheme["mentionsStyle"]
          );
        }
        // Set target element for mentions (matching MessageComposer pattern)
        mentionsFormatter.setTargetElement?.(MentionsTargetElement.textinput);
        
        // Configure mention all settings
        if (mentionAllLabel) {
          mentionsFormatter.setMentionAllLabel(mentionAllLabel);
        }
        mentionsFormatter.setDisableMentionAll(disableMentionAll);
        
        if (user) {
          mentionsFormatter.setUser(user);
        }
        if (group) {
          mentionsFormatter.setGroup(group);
        }
        _formatter.unshift(mentionsFormatter);
      }

      _formatter.forEach((formatter) => {
        if (id !== undefined) {
          formatter.setComposerId(id);
        }
        if (user) {
          formatter.setUser(user);
        }
        if (group) {
          formatter.setGroup(group);
        }
        
        // Get tracking character for this formatter
        const trackingChar = formatter.getTrackingCharacter?.();
        
        // Clone and store formatter using tracking character as key (matching MessageComposer pattern)
        const newFormatter = CommonUtils.clone(formatter);
        if (trackingChar) {
          allFormatters.current.set(trackingChar, newFormatter);
          
          // Set up tracking characters for mention detection
          if (!trackingCharacters.current.includes(trackingChar)) {
            trackingCharacters.current.push(trackingChar);
          }
        }
      });
    }, []);

    // Initialize input with text prop
    useEffect(() => {
      if (text !== undefined) {
        setInputTextProgrammatic(text);
      }
    }, [text]);

    // Create composerId map for attachment options
    const composerIdMap = new Map().set('parentMessageId', parentMessageId);

    /**
     * Handle custom view click for attachment options
     */
    const handleOnClick = (CustomViewFn: any) => {
      const view = CustomViewFn(
        user,
        group,
        {
          uid: user?.getUid(),
          guid: group?.getGuid(),
          parentMessageId: parentMessageId,
        },
        {
          onClose: () => setIsVisible(false),
        }
      );
      bottomSheetRef.current?.togglePanel();
      setTimeout(() => {
        setCustomView(() => view);
        setIsVisible(true);
      }, 200);
    };

    // Initialize attachment options
    useEffect(() => {
      const defaultAttachmentOptions =
        ChatConfigurator.dataSource.getAttachmentOptions(
          theme,
          user,
          group,
          composerIdMap,
          {
            // Individual hide options
            hideCameraOption,
            hideImageAttachmentOption,
            hideVideoAttachmentOption,
            hideAudioAttachmentOption,
            hideFileAttachmentOption,
            hidePollsAttachmentOption,
            hideCollaborativeDocumentOption,
            hideCollaborativeWhiteboardOption,
            // Reply context
            replyToMessage: replyMessage?.message,
            closeReplyPreview,
          }
        );
      
      setActionSheetItems(() =>
        attachmentOptions && typeof attachmentOptions === 'function'
          ? attachmentOptions({ user, group, composerId: composerIdMap })?.map((item) => {
              if (typeof item.CustomView === 'function')
                return {
                  ...item,
                  onPress: () => handleOnClick(item.CustomView),
                };
              if (typeof item.onPress === 'function')
                return {
                  ...item,
                  onPress: () => {
                    setShowActionSheet(false);
                    item.onPress?.(user, group);
                  },
                };
              return {
                ...item,
                onPress: () => fileInputHandler(item.id ?? ''),
              };
            })
          : [
              // Default attachment options
              ...defaultAttachmentOptions.map((item) => {
                if (typeof item.CustomView === 'function')
                  return {
                    ...item,
                    onPress: () => handleOnClick(item.CustomView),
                  };
                if (typeof item.onPress === 'function')
                  return {
                    ...item,
                    onPress: () => {
                      setShowActionSheet(false);
                      item.onPress(user, group);
                    },
                  };
                return {
                  ...item,
                  onPress: () => fileInputHandler(item.id),
                };
              }),
              // Additional attachment options
              ...(addAttachmentOptions && typeof addAttachmentOptions === 'function'
                ? addAttachmentOptions({ user, group, composerId: composerIdMap })?.map((item) => {
                    if (typeof item.CustomView === 'function')
                      return {
                        ...item,
                        onPress: () => handleOnClick(item.CustomView),
                      };
                    if (typeof item.onPress === 'function')
                      return {
                        ...item,
                        onPress: () => {
                          setShowActionSheet(false);
                          item.onPress?.(user, group);
                        },
                      };
                    return {
                      ...item,
                      onPress: () => fileInputHandler(item.id ?? ''),
                    };
                  })
                : []),
            ]
      );
    }, [
      user,
      group,
      id,
      parentMessageId,
      hideCameraOption,
      hideImageAttachmentOption,
      hideVideoAttachmentOption,
      hideAudioAttachmentOption,
      hideFileAttachmentOption,
      hidePollsAttachmentOption,
      hideCollaborativeDocumentOption,
      hideCollaborativeWhiteboardOption,
      addAttachmentOptions,
      replyMessage,
      closeReplyPreview,
    ]);

    /**
     * Handle panel show/hide events
     * Updates CustomViewHeader and CustomViewFooter based on alignment
     *
     */
    const handlePanel = useCallback((item: { child?: React.FC | React.ReactNode; alignment?: string }) => {
      if (item.child) {
        if (item.alignment === ViewAlignment.composerTop) {
          // Handle both FC and ReactNode types
          const childContent = typeof item.child === 'function' 
            ? React.createElement(item.child as React.FC) 
            : item.child;
          setCustomViewHeader(childContent);
        } else if (item.alignment === ViewAlignment.composerBottom) {
          const childContent = typeof item.child === 'function' 
            ? React.createElement(item.child as React.FC) 
            : item.child;
          setCustomViewFooter(childContent);
        }
      } else {
        if (item.alignment === ViewAlignment.composerTop) {
          setCustomViewHeader(null);
        } else if (item.alignment === ViewAlignment.composerBottom) {
          setCustomViewFooter(null);
        }
      }
    }, []);

    // Add edit message event listener
    useEffect(() => {
      CometChatUIEventHandler.addMessageListener(editMessageListenerID, {
        ccMessageEdited: (item: { message: any; status: string }) => previewMessage(item),
      });

      return () => {
        CometChatUIEventHandler.removeMessageListener(editMessageListenerID);
      };
    }, []);

    /**
     * Add reply message event listener.
     * Subscribes to ccReplyToMessage events to display reply preview.
     */
    useEffect(() => {
      CometChatMessageEvents.addListener(
        CometChatMessageEvents.ccReplyToMessage,
        replyMessageListenerID,
        (data: any) => {
          if (data.status === messageStatus.inprogress) {
            previewReplyMessage(data.message);
          }
        }
      );

      return () => {
        CometChatMessageEvents.removeListener(
          CometChatMessageEvents.ccReplyToMessage,
          replyMessageListenerID
        );
      };
    }, []);

    // Add UI event listener for suggestion data, bottom sheet toggle, and compose message
    useEffect(() => {
      CometChatUIEventHandler.addUIListener(uiEventListenerID, {
        // Handle suggestion data for mentions
        ccSuggestionData(item: { id: string | number; data: Array<SuggestionItem> }) {
          if (activeCharacter.current && id === item?.id) {
            // Check if mention limit warning should be shown (matching MessageComposer pattern)
            const warningView = getMentionLimitView();
            if (warningView) {
              return;
            }
            setMentionsSearchData(item?.data);
            setSuggestionListLoader(false);
          }
        },
        // Handle bottom sheet toggle events (for custom views)
        ccToggleBottomSheet: (item: { botView?: boolean; child?: React.FC | React.ReactNode }) => {
          if (item?.botView) {
            // Handle botView for custom views - convert FC to ReactNode if needed
            const childContent = typeof item.child === 'function' 
              ? React.createElement(item.child as React.FC) 
              : (item.child || null);
            setCustomView(childContent);
            return;
          }
          // Toggle bottom sheet visibility
          setIsVisible(false);
          bottomSheetRef.current?.togglePanel();
        },
        // Handle compose message events (for AI smart replies, etc.)
        ccComposeMessage: (textData: { text?: string }) => {
          setIsVisible(false);
          bottomSheetRef.current?.togglePanel();
          
          // Update input with received text
          if (textData?.text !== undefined) {
            plainTextInputRef.current = textData.text;
            setInputTextProgrammatic(textData.text);
            onChangeText?.(textData.text);
          }
        },
      });

      return () => {
        CometChatUIEventHandler.removeUIListener(uiEventListenerID);
      };
    }, [id]);

    // Handle panel hide events — always clear the content to avoid
    // a stale separator line when hidePanel passes child: () => null
    // (a truthy function that renders nothing).
    const handleHidePanel = useCallback((item: { child?: React.FC | React.ReactNode; alignment?: string }) => {
      if (item.alignment === ViewAlignment.composerTop) {
        setCustomViewHeader(null);
      } else if (item.alignment === ViewAlignment.composerBottom) {
        setCustomViewFooter(null);
      }
    }, []);

    // Add panel show/hide listeners
    useEffect(() => {
      CometChatUIEventHandler.addUIListener(uiEventListenerShowID, {
        showPanel: (item: { child?: React.FC; alignment?: string }) => handlePanel(item),
      });
      CometChatUIEventHandler.addUIListener(uiEventListenerHideID, {
        hidePanel: (item: { child?: React.FC; alignment?: string }) => handleHidePanel(item),
      });

      return () => {
        CometChatUIEventHandler.removeUIListener(uiEventListenerShowID);
        CometChatUIEventHandler.removeUIListener(uiEventListenerHideID);
      };
    }, []);

    /**
     * Camera callback handler for processing captured images
     */
    const cameraCallback = async (cameraImage: any) => {
      if (CheckPropertyExists(cameraImage, 'error')) {
        return;
      }
      const { name, uri, type } = cameraImage;
      const file = {
        name,
        type,
        uri,
      };
      sendMediaMessage(
        chatWithId.current,
        file,
        MessageTypeConstants.image,
        chatWith.current
      );
    };

    /**
     * File input handler for different file types
     * Handles image, video, audio, file, and takePhoto options
     */
    const fileInputHandler = async (fileType: string) => {
      if (fileType === MessageTypeConstants.takePhoto) {
        if (!(await permissionUtil.startResourceBasedTask(['camera']))) {
          return;
        }
        let quality = imageQuality;
        if (isNaN(imageQuality) || imageQuality < 1 || imageQuality > 100) {
          quality = 20;
        }
        if (Platform.OS === 'android') {
          FileManager.openCamera(
            fileType,
            Math.round(quality),
            cameraCallback
          );
        } else {
          FileManager.openCamera(
            fileType,
            cameraCallback
          );
        }
      } else if (Platform.OS === 'ios' && fileType === MessageTypeConstants.video) {
        NativeModules.VideoPickerModule.pickVideo((file: any) => {
          if (file.uri) {
            sendMediaMessage(
              chatWithId.current,
              file,
              MessageTypeConstants.video,
              chatWith.current
            );
          }
        });
      } else {
        FileManager.openFileChooser(fileType, async (fileInfo: any) => {
          if (CheckPropertyExists(fileInfo, 'error')) {
            return;
          }
          const { name, uri, type } = fileInfo;
          const file = {
            name,
            type,
            uri,
          };
          sendMediaMessage(
            chatWithId.current,
            file,
            fileType,
            chatWith.current
          );
        });
      }
    };

    /**
     * Send media message (image, video, audio, file)
     * Includes reply message support for quoted messages.
     */
    const sendMediaMessage = (
      receiverId: string,
      messageInput: { name: string; type: string; uri: string },
      messageType: string,
      receiverType: string
    ) => {
      setShowActionSheet(false);

      // Capture current reply message using ref to avoid stale closures
      const currentReplyMessage = replyMessageRef.current;
      const replyMessageId = currentReplyMessage?.message?.getId?.() ?? null;
      
      const mediaMessage = new CometChat.MediaMessage(
        receiverId,
        messageInput,
        messageType,
        receiverType
      );

      mediaMessage.setSender(loggedInUser.current!);
      mediaMessage.setReceiver((user || group)!);
      mediaMessage.setType(messageType);
      mediaMessage.setMuid(String(getUnixTimestampInMilliseconds()));
      mediaMessage.setData({
        type: messageType,
        category: CometChat.CATEGORY_MESSAGE,
        name: messageInput.name,
        file: messageInput,
        url: messageInput.uri,
        sender: loggedInUser.current,
      });
      
      if (parentMessageId) {
        mediaMessage.setParentMessageId(parentMessageId as number);
      }

      /**
       * Handle reply message - set quoted message for media replies.
       * Uses shared helper for consistency with CometChatMessageComposer.
       */
      if (replyMessageId && currentReplyMessage?.message) {
        setQuotedMessageSafe(mediaMessage, currentReplyMessage.message, replyMessageId);
      }

      // Create local message for immediate UI feedback
      const localMessage = new CometChat.MediaMessage(
        receiverId,
        messageInput,
        messageType,
        receiverType
      );

      localMessage.setSender(loggedInUser.current!);
      localMessage.setReceiver((user || group)!);
      localMessage.setType(messageType);
      localMessage.setMuid(String(getUnixTimestampInMilliseconds()));
      localMessage.setData({
        type: messageType,
        category: CometChat.CATEGORY_MESSAGE,
        name: messageInput.name,
        file: messageInput,
        url: messageInput.uri,
        sender: loggedInUser.current,
        attachments: [messageInput],
      });
      
      if (parentMessageId) {
        localMessage.setParentMessageId(parentMessageId as number);
      }

      // Set quoted message on local message for UI feedback
      if (replyMessageId && currentReplyMessage?.message) {
        setQuotedMessageSafe(localMessage, currentReplyMessage.message, replyMessageId);
        (localMessage as any).quotedMessage = currentReplyMessage.message;
      }

      // Clear reply preview after preparing message
      setReplyMessage(null);

      // Emit in-progress event
      CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, {
        message: localMessage,
        status: messageStatus.inprogress,
      });

      // Play sound if enabled
      if (!disableSoundForMessages) {
        playAudio();
      }

      // Send message via SDK
      CometChat.sendMediaMessage(mediaMessage)
        .then((message: CometChat.BaseMessage) => {
          CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, {
            message: message,
            status: messageStatus.success,
          });
        })
        .catch((error: CometChat.CometChatException) => {
          onError?.(error);
          (localMessage as any).data.metaData = { error: true };
          CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, {
            message: localMessage,
            status: messageStatus.error,
          });
        });
    };

    /**
     * Play outgoing message sound
     */
    const playAudio = () => {
      if (customSoundForMessage) {
        CometChatSoundManager.play(
          CometChatSoundManager.SoundOutput.outgoingMessage,
          customSoundForMessage
        );
      } else {
        CometChatSoundManager.play(
          CometChatSoundManager.SoundOutput.outgoingMessage
        );
      }
    };

    /**
     * Send recorded audio as a media message
     * Called when voice recording is completed and submitted
     */
    const _sendRecordedAudio = (recordedFile: string) => {
      // Invoke the onVoiceRecordingEnd callback if provided
      onVoiceRecordingEnd?.(recordedFile);
      
      const fileObj = {
        name: 'audio-recording' + recordedFile.split('/audio-recording')[1],
        type: 'audio/mp4',
        uri: recordedFile,
      };
      
      sendMediaMessage(
        chatWithId.current,
        fileObj,
        MessageTypeConstants.audio,
        chatWith.current
      );
    };

    /**
     * Handle inline audio recorder submit.
     * Sends the recorded audio file and hides the inline recorder.
     */
    const handleInlineRecorderSubmit = useCallback((recordedFile: string) => {
      const fileObj = {
        name: 'audio-recording' + recordedFile.split('/audio-recording')[1],
        type: 'audio/mp4',
        uri: recordedFile,
      };
      sendMediaMessage(chatWithId.current, fileObj, MessageTypeConstants.audio, chatWith.current);
      setShowInlineRecorder(false);
    }, []);

    /**
     * Handle inline audio recorder cancel.
     * Hides the inline recorder without sending.
     */
    const handleInlineRecorderCancel = useCallback(() => {
      setShowInlineRecorder(false);
    }, []);

    /**
     * Handle voice recording start
     * Called when recording begins
     */
    const handleVoiceRecordingStart = () => {
      onVoiceRecordingStart?.();
    };

    /**
     * Clear the input field.
     * When autoExpand is enabled, also resets the height to minHeight.
     * This ensures the input returns to its collapsed state when cleared.
     *
     */
    const clearInputBox = useCallback(() => {
      setInputTextProgrammatic('');
      plainTextInputRef.current = '';
      blocksRef.current = [];
      pendingLinksRef.current.clear();
      setEditContentBlocks(undefined);
      // Clear the RichTextEditor content
      inputRef.current?.clear();
      
      // When autoExpand is enabled, reset height to minHeight
      // This handles the edge case of clearing all text
      if (autoExpand) {
        setInputHeight(resolvedMinHeight);
        setIsExpanded(false);
      }
    }, [autoExpand, resolvedMinHeight]);

    /**
     * Start typing indicator
     */
    const startTyping = useCallback(() => {
      if (disableTypingEvents) {
        return;
      }

      // Check if user is blocked
      if (user && (user.getBlockedByMe() || user.getHasBlockedMe())) {
        return;
      }

      if (isTyping.current) {
        clearTimeout(isTyping.current);
        isTyping.current = null;
      } else {
        const typingNotification = new CometChat.TypingIndicator(
          chatWithId.current,
          chatWith.current
        );
        CometChat.startTyping(typingNotification);
      }

      isTyping.current = setTimeout(() => {
        // End typing inline to avoid circular dependency
        if (disableTypingEvents) {
          return;
        }
        if (isTyping.current) {
          clearTimeout(isTyping.current);
          isTyping.current = null;
        }
        const typingNotification = new CometChat.TypingIndicator(
          chatWithId.current,
          chatWith.current
        );
        CometChat.endTyping(typingNotification);
      }, 500);
    }, [disableTypingEvents, user]);

    /**
     * End typing indicator
     */
    const endTyping = useCallback(() => {
      if (disableTypingEvents) {
        return;
      }

      if (isTyping.current) {
        clearTimeout(isTyping.current);
        isTyping.current = null;
      }

      const typingNotification = new CometChat.TypingIndicator(
        chatWithId.current,
        chatWith.current
      );
      CometChat.endTyping(typingNotification);
    }, [disableTypingEvents]);

    /**
     * Check if cursor is within a mention range
     */
    /**
     * Escape special regex characters
     */
    const escapeRegExp = (string: string): string => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    /**
     * Extract text from cursor position to find search string
     */
    const extractTextFromCursor = (inputText: string, cursorPosition: number): string => {
      const leftText = inputText.substring(0, cursorPosition);
      const escapedPrefixes = trackingCharacters.current.map(escapeRegExp).join('|');
      const pattern = new RegExp(`(${escapedPrefixes})([\\w\\s]*)$`);
      const match = leftText.match(pattern);
      
      if (match) {
        return match[2] || '';
      }
      return '';
    };

    /**
     * Check if mention list should be opened.
     * Suppressed when cursor is inside a code block or inline code span
     * (Req 12.1, 12.2, 12.3).
     */
    const shouldOpenList = (
      selection: { start: number; end: number },
      searchString: string,
      tracker: string
    ): boolean => {
      if (disableMentions) return false;
      // Suppress mention picker inside code or code block contexts.
      // Read from ref to avoid stale closure after code block exit.
      const styles = activeStylesRef.current;
      if (styles.code || styles.codeBlock) return false;
      
      return (
        selection.start === selection.end &&
        !isCursorWithinMentionRange(mentionMap.current, selection.start - searchString.length) &&
        trackingCharacters.current.includes(tracker) &&
        (searchString === ''
          ? (plainTextInputRef.current[selection.start - 2]?.length === 1 &&
              plainTextInputRef.current[selection.start - 2]?.trim()?.length === 0) ||
            plainTextInputRef.current[selection.start - 2] === undefined
          : true) &&
        (plainTextInputRef.current[selection.start - 1]?.length === 1 &&
        plainTextInputRef.current[selection.start - 1]?.trim()?.length === 0
          ? searchString.length > 0
          : true)
      );
    };

    /**
     * Open mention list based on cursor position
     */
    let openListTimeoutId: NodeJS.Timeout | null = null;
    const openList = (selection: { start: number; end: number }) => {
      if (disableMentions) return;
      
      if (openListTimeoutId) {
        clearTimeout(openListTimeoutId);
      }
      
      openListTimeoutId = setTimeout(() => {
        const searchString = extractTextFromCursor(plainTextInputRef.current, selection.start);
        const tracker = searchString
          ? plainTextInputRef.current[selection.start - (searchString.length + 1)]
          : plainTextInputRef.current[selection.start - 1];

        if (shouldOpenList(selection, searchString, tracker)) {
          activeCharacter.current = tracker;
          searchStringRef.current = searchString;
          setShowMentionList(true);
          setSuggestionListLoader(true);

          const formatter = allFormatters.current.get(tracker);
          if (formatter instanceof CometChatMentionsFormatter) {
            const shouldShowMentionList =
              formatter.getVisibleIn() === MentionsVisibility.both ||
              (formatter.getVisibleIn() === MentionsVisibility.usersConversationOnly && user) ||
              (formatter.getVisibleIn() === MentionsVisibility.groupsConversationOnly && group);
            if (shouldShowMentionList) {
              formatter.search(searchString);
            }
          } else if (formatter) {
            formatter.search(searchString);
          }
        } else {
          activeCharacter.current = '';
          searchStringRef.current = '';
          setShowMentionList(false);
          setMentionsSearchData([]);
        }
      }, 100);
    };

    /**
     * Remove overlapping mentions from text and map.
     * Tracks total shift for position adjustment and updates formatter suggestion items.
     * Clears warning message if below mention limit.
     * 
     * @param text - The original text
     * @param overlaps - Array of overlapping mentions to remove
     * @param map - The mention map to update
     * @returns Object with newText and totalShift
     */
    const removeMentionsFromTextAndMap = (
      text: string,
      overlaps: MentionOverlap[],
      map: Map<string, SuggestionItem>
    ): { newText: string; totalShift: number } => {
      let adjustment = 0;
      let newText = text;

      overlaps.forEach(({ key, value, start, end }) => {
        const adjStart = start + adjustment;
        const adjEnd = end + adjustment;

        newText = newText.slice(0, adjStart) + newText.slice(adjEnd);
        map.delete(key);
        adjustment -= adjEnd - adjStart;

        // Keep formatter in sync
        if (value.id && !ifIdExists(value.id, map)) {
          const trackingChar = value.trackingCharacter;
          if (trackingChar) {
            const fmt = allFormatters.current.get(trackingChar);
            if (fmt instanceof CometChatMentionsFormatter) {
              const users = fmt.getSuggestionItems().filter((u: SuggestionItem) => u.id !== value.id);
              fmt.setSuggestionItems(users);
              if (!getMentionLimitView(fmt)) setWarningMessage('');
            }
          }
        }
      });

      return { newText, totalShift: adjustment };
    };

    /**
     * Main helper to handle mention deletion.
     * Orchestrates mention deletion using helper functions.
     * Returns true if mentions were deleted, false otherwise.
     * Updates cursor position after deletion.
     * 
     * @param oldText - The text before deletion
     * @param newText - The text after deletion (from TextInput)
     * @returns True if mentions were deleted and handled, false otherwise
     */
    const deleteMentionHelper = (oldText: string, newText: string): boolean => {
      const deletionLen = oldText.length - newText.length;
      const range = calcDeletionRange(selectionPosition, deletionLen);

      // Verify the deletion actually happened at the calculated range.
      // Block-type toggles (list/blockquote) remove prefixes at line starts,
      // not at the cursor position. If the calculated range doesn't match
      // the actual deletion, skip mention deletion to avoid false positives.
      const expectedAfterDeletion = oldText.substring(0, range.start) + oldText.substring(range.end);
      if (expectedAfterDeletion !== newText) return false;

      const deletionMentionMap = new Map(mentionMap.current);
      const overlaps = collectOverlappingMentions(range, deletionMentionMap);

      if (overlaps.length === 0) return false;

      const { newText: finalText, totalShift } = removeMentionsFromTextAndMap(
        oldText,
        overlaps,
        deletionMentionMap
      );

      shiftRemainingMentionKeys(deletionMentionMap, range.start, totalShift);

      plainTextInputRef.current = finalText;
      setInputTextProgrammatic(finalText);
      onChangeText?.(finalText);
      mentionMap.current = deletionMentionMap;

      // Update cursor position to the start of the first deleted mention
      const firstStart = overlaps[0].start;
      ignoreSelectionUntil.current = Date.now() + 500;
      InteractionManager.runAfterInteractions(() => {
        inputRef.current?.setSelection?.(firstStart);
        setSelectionPosition({ start: firstStart, end: firstStart });
        syncMentionRanges();
      });

      return true;
    };

    /**
     * Handle text input change
     * Tracks cursor position and updates mention map positions.
     * Checks for deletion and calls deleteMentionHelper before normal processing.
     */
    const handleTextChange = (newText: string) => {
      const oldText = plainTextInputRef.current;

      // Check if this is a deletion - call deleteMentionHelper before normal processing
      if (oldText.length > newText.length) {
        const handled = deleteMentionHelper(oldText, newText);
        if (handled) {
          // Mention deletion was handled, skip normal processing
          startTyping();
          return;
        }
      }

      const removing = plainTextInputRef.current.length > newText.length;
      const adding = plainTextInputRef.current.length < newText.length;
      const textDiff = newText.length - plainTextInputRef.current.length;
      const notAtLast = (selectionPosition.start + textDiff) < newText.length;

      // Update plain text input ref
      plainTextInputRef.current = newText;
      
      inputTextRef.current = newText;
      setInputText(newText);
      onChangeText?.(newText);
      startTyping();

      // Update mention map positions based on text changes
      let decr = 0;
      const newMentionMap = new Map(mentionMap.current);

      mentionMap.current.forEach((value, key) => {
        const position = {
          start: parseInt(key.split('_')[0]),
          end: parseInt(key.split('_')[1]),
        };

        // Runs when cursor before the mention and before the last position
        if (
          notAtLast &&
          (selectionPosition.start - 1 <= position.start ||
            selectionPosition.start - textDiff <= position.start)
        ) {
          if (removing) {
            decr = selectionPosition.end - selectionPosition.start - textDiff;
            position.start = position.start - decr;
            position.end = position.end - decr;
          } else if (adding) {
            decr = selectionPosition.end - selectionPosition.start + textDiff;
            position.start = position.start + decr;
            position.end = position.end + decr;
          }
          if (removing || adding) {
            const newKey = `${position.start}_${position.end}`;
            if (position.start >= 0) {
              newMentionMap.set(newKey, value);
            }
            newMentionMap.delete(key);
          }
        }

        // Code to delete mention from hashmap if it's been modified
        const expectedMentionPos = plainTextInputRef.current.substring(position.start, position.end);

        if (expectedMentionPos !== value.promptText) {
          const newKey = `${position.start}_${position.end}`;
          newMentionMap.delete(newKey);

          // Try to recover the mention by searching for its promptText in the new text.
          // This handles block-type toggles (list/blockquote) where prefixes
          // shift text positions but the mention text is still present.
          const promptText = value.promptText || '';
          let recovered = false;
          if (promptText) {
            // Search near the expected position first, then fall back to full text
            const searchFrom = Math.max(0, position.start - 20);
            let localIdx = plainTextInputRef.current.indexOf(promptText, searchFrom);
            // Fallback: if not found near expected position, search from beginning
            if (localIdx === -1 && searchFrom > 0) {
              localIdx = plainTextInputRef.current.indexOf(promptText, 0);
            }
            while (localIdx !== -1) {
              const recoveredKey = `${localIdx}_${localIdx + promptText.length}`;
              if (!newMentionMap.has(recoveredKey)) {
                newMentionMap.set(recoveredKey, value);
                recovered = true;
                break;
              }
              localIdx = plainTextInputRef.current.indexOf(promptText, localIdx + 1);
            }
          }

          // Mention text truly gone — remove from formatters
          if (!recovered && value.id && !ifIdExists(value.id, newMentionMap)) {
            const trackingChar = value.trackingCharacter;
            if (trackingChar) {
              const targetedFormatter = allFormatters.current.get(trackingChar);
              if (targetedFormatter) {
                const existingCCUsers = [...targetedFormatter.getSuggestionItems()];
                const userPosition = existingCCUsers.findIndex(
                  (item: SuggestionItem) => item.id === value.id
                );
                if (userPosition !== -1) {
                  existingCCUsers.splice(userPosition, 1);
                  (targetedFormatter as CometChatMentionsFormatter).setSuggestionItems(existingCCUsers);
                  if (!getMentionLimitView(targetedFormatter as CometChatMentionsFormatter)) {
                    setWarningMessage('');
                  }
                }
              }
            }
          }
        }
      });

      mentionMap.current = newMentionMap;
      // Sync mention visual styling after text change shifts mention positions
      syncMentionRanges();
    };

    /**
     * Handle selection change for mention tracking
     */
    const handleSelectionChange = (event: { nativeEvent: { selection: { start: number; end: number } } }) => {
      const { selection } = event.nativeEvent;

      if (Date.now() < ignoreSelectionUntil.current) {
        return;
      }

      const cursorPos = selection.start;
      const mentionRange = getMentionRangeAtCursor(mentionMap.current, cursorPos);

      if (mentionRange) {
        const distanceToStart = cursorPos - mentionRange.start;
        const distanceToEnd = mentionRange.end - cursorPos;
        let targetPosition: number;
        if (distanceToStart <= distanceToEnd) {
          targetPosition = mentionRange.start;
        } else {
          targetPosition = mentionRange.end;
        }
        if (targetPosition !== cursorPos) {
          InteractionManager.runAfterInteractions(() => {
            inputRef.current?.setSelection?.(targetPosition);
            setSelectionPosition({ start: targetPosition, end: targetPosition });
          });
          return;
        }
      }

      setSelectionPosition(selection);
      openList(selection);
    };

    /**
     * Insert mention at specific position in the mention map
     */
    const insertMentionAt = (
      map: Map<string, SuggestionItem>,
      insertAt: number,
      key: string,
      value: SuggestionItem
    ): Map<string, SuggestionItem> => {
      const mentionsArray = Array.from(map);
      mentionsArray.splice(insertAt, 0, [key, value]);
      return new Map(mentionsArray);
    };

    /**
     * Check if an ID exists in the mention map
     */
    const ifIdExists = (id: string, hashmap: Map<string, SuggestionItem>): boolean => {
      for (const [, value] of hashmap) {
        if (value.id === id) {
          return true;
        }
      }
      return false;
    };

    /**
     * Handle mention selection from suggestion list
     */
    const onMentionPress = (item: SuggestionItem) => {
      // Enforce maxMentionLimit — prevent inserting if limit reached
      if (mentionMap.current.size >= maxMentionLimit) {
        onMentionLimitReached?.();
        setShowMentionList(false);
        setMentionsSearchData([]);
        return;
      }

      setShowMentionList(false);
      setMentionsSearchData([]);

      const promptText = item.promptText || '';
      const notAtLast = selectionPosition.start < plainTextInputRef.current.length;
      const textDiff =
        plainTextInputRef.current.length +
        promptText.length -
        searchStringRef.current.length -
        plainTextInputRef.current.length;

      let incr = 0;
      let mentionPos = 0;

      const newMentionMap = new Map(mentionMap.current);

      const targetedFormatter = allFormatters.current.get(activeCharacter.current);

      if (targetedFormatter) {
        const existingCCUsers = [...targetedFormatter.getSuggestionItems()];
        const userAlreadyExists = existingCCUsers.find(
          (existingUser: SuggestionItem) => existingUser.id === item.id
        );
        if (!userAlreadyExists) {
          const cometchatUIUserArray: Array<SuggestionItem> = [...existingCCUsers];
          cometchatUIUserArray.push(item);
          (targetedFormatter as CometChatMentionsFormatter).setSuggestionItems(cometchatUIUserArray);
        }
      }

      mentionMap.current.forEach((value, key) => {
        const position = {
          start: parseInt(key.split('_')[0]),
          end: parseInt(key.split('_')[1]),
        };

        if (!(selectionPosition.start <= position.start)) {
          mentionPos += 1;
        }

        // Delete mention from hashmap if cursor is within it
        if (
          position.end === selectionPosition.end ||
          (selectionPosition.start > position.start && selectionPosition.end <= position.end)
        ) {
          const newKey = `${position.start}_${position.end}`;
          newMentionMap.delete(newKey);
          mentionPos -= 1;
        }

        if (notAtLast && selectionPosition.start - 1 <= position.start) {
          incr = selectionPosition.end - selectionPosition.start + textDiff;
          const newKey = `${position.start + incr}_${position.end + incr}`;
          newMentionMap.set(newKey, value);
          newMentionMap.delete(key);
        }
      });
      mentionMap.current = newMentionMap;

      // Update the input text with the mention
      const updatedPlainTextInput = `${plainTextInputRef.current.substring(
        0,
        selectionPosition.start - (1 + searchStringRef.current.length)
      )}${promptText + ' '}${plainTextInputRef.current.substring(
        selectionPosition.end,
        plainTextInputRef.current.length
      )}`;
      plainTextInputRef.current = updatedPlainTextInput;

      const key =
        selectionPosition.start -
        (1 + searchStringRef.current.length) +
        '_' +
        (selectionPosition.start - (searchStringRef.current.length + 1) + promptText.length);

      const updatedMap = insertMentionAt(mentionMap.current, mentionPos, key, {
        ...item,
        trackingCharacter: activeCharacter.current,
      });
      mentionMap.current = updatedMap;

      // Calculate cursor position after the mention + space
      const newCursorPosition =
        selectionPosition.start -
        (searchStringRef.current.length + 1) +
        (promptText.length) +
        1; // +1 for the space after mention

      // Update the input text state — ignore native selection events for 500ms
      ignoreSelectionUntil.current = Date.now() + 500;
      setInputTextProgrammatic(updatedPlainTextInput);

      // Set cursor position and sync mention styling to native editor
      setTimeout(() => {
        inputRef.current?.setSelection?.(newCursorPosition);
        // Update our tracking state without triggering a re-render to native
        setSelectionPosition({ start: newCursorPosition, end: newCursorPosition });
        // Apply mention visual styling (bold purple + background pill) in native editor
        syncMentionRanges();
      }, 100);
    };

    /**
     * Handle end reached for suggestion list pagination
     */
    const onSuggestionListEndReached = () => {
      // Pagination can be implemented here if needed
    };

    /**
     * Get mention limit warning view
     * Displays a warning when the mention limit is reached.
     * Also sets the warningMessage state for display in CustomViewHeader.
     * 
     * @param targettedFormatterParam - Optional formatter to check (defaults to active formatter)
     * @returns boolean - true if warning should be shown, false otherwise
     */
    const getMentionLimitView = (targettedFormatterParam?: CometChatMentionsFormatter): boolean => {
      const targetedFormatter = allFormatters.current.get(activeCharacter.current) ?? targettedFormatterParam;
      
      if (!(targetedFormatter instanceof CometChatMentionsFormatter)) {
        return false;
      }
      
      let shouldWarn = false;
      let limit: number | undefined;
      
      // Check if formatter has limit capabilities
      if (targetedFormatter.getLimit && targetedFormatter.getLimit()) {
        limit = targetedFormatter.getLimit();
        if (targetedFormatter.getUniqueUsersList && targetedFormatter.getUniqueUsersList()?.size >= limit) {
          shouldWarn = true;
        }
      }
      
      if (!shouldWarn) {
        setWarningMessage('');
        return false;
      }
      
      const errorString = targetedFormatter.getErrorString
        ? targetedFormatter.getErrorString()
        : `${t('MENTION_UPTO')} ${limit} ${limit === 1 ? t('TIME') : t('TIMES')} ${t('AT_A_TIME')}.`;
      
      setWarningMessage(errorString);
      return true;
    };

    /**
     * Render mention limit warning view in suggestion list
     * Uses the warningMessage state set by getMentionLimitView
     */
    const renderMentionLimitWarning = () => {
      if (!warningMessage) return null;
      
      return (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: 5,
            paddingLeft: 5,
            borderTopWidth: 1,
            borderTopColor: theme.color.borderDefault,
          }}
        >
          <Icon
            name="info-fill"
            color={theme.color.error}
            height={20}
            width={20}
          />
          <Text
            style={{
              marginLeft: 5,
              color: theme.color.textSecondary,
              ...theme.typography.caption1.regular,
            }}
          >
            {warningMessage}
          </Text>
        </View>
      );
    };

    /**
     * Convert mentions to underlying text format for sending
     * Iterates through mentionMap and replaces prompt text with underlying text
     */
    const getRegexString = (str: string): string => {
      // Get an array of the entries in the map using the spread operator
      const entries = [...mentionMap.current.entries()].reverse();

      let uidInput = str;

      // Iterate over the array in reverse order
      entries.forEach(([key, value]) => {
        const [start, end] = key.split('_').map(Number);

        const pre = uidInput.substring(0, start);
        const post = uidInput.substring(end);

        uidInput = pre + value.underlyingText + post;
      });

      return uidInput;
    };

    /**
     * Replace mention display names with underlying tokens in the given text.
     * Uses name-based indexOf (not position-based splicing) because markdown
     * syntax added by blocksToMarkdown shifts character positions.
     * Entries are sorted left-to-right so indexOf finds the correct occurrence
     * when the same display name appears multiple times.
     */
    const replaceMentionsWithTokens = (text: string): string => {
      if (mentionMap.current.size === 0) return text;
      const entries = [...mentionMap.current.entries()].sort((a, b) => {
        return parseInt(a[0].split('_')[0]) - parseInt(b[0].split('_')[0]);
      });
      let result = text;
      let offset = 0;
      for (const [, value] of entries) {
        const displayName = value.promptText || '';
        const underlying = value.underlyingText || '';
        if (!displayName || !underlying) continue;
        const idx = result.indexOf(displayName, offset);
        if (idx === -1) continue;
        result = result.substring(0, idx) + underlying + result.substring(idx + displayName.length);
        offset = idx + underlying.length;
      }
      return result;
    };

    /**
     * Preview message for edit mode
     * Called when an edit message event is received
     * Populates the input with the original message text
     */
    const previewMessage = ({ message, status }: { message: any; status: string }) => {
      if (status === messageStatus.inprogress) {
        // Populate formatter SuggestionItems from the message's mentioned users.
        // Only handleComposerPreview is needed — getFormattedText returns JSX
        // which is unused here since we feed plain text to markdownToBlocks.
        allFormatters.current.forEach((formatter: CometChatTextFormatter | CometChatMentionsFormatter) => {
          formatter.handleComposerPreview?.(message);
        });

        // Resolve mention tokens (<@uid:...>, <@all:...>) to display names
        // and build mentionMap so the native editor can apply mention styling.
        const rawText = message?.text ?? '';
        const mentionFormatter = allFormatters.current.get('@');
        let resolvedText = rawText;
        const newMentionMap = new Map<string, SuggestionItem>();

        if (mentionFormatter instanceof CometChatMentionsFormatter) {
          const suggestionItems = mentionFormatter.getSuggestionItems();
          const itemLookup = new Map<string, SuggestionItem>();
          for (const item of suggestionItems) {
            itemLookup.set(item.id, item);
          }

          // Single-pass: collect matches, build resolved text via array join
          const mentionRegex = /<@(?:uid|all):(.*?)>/g;
          let match: RegExpExecArray | null;
          const segments: string[] = [];
          let lastIndex = 0;
          const mentionPositions: Array<{ start: number; length: number; item: SuggestionItem }> = [];
          let resolvedLength = 0;

          while ((match = mentionRegex.exec(rawText)) !== null) {
            // Append text before this match
            const before = rawText.substring(lastIndex, match.index);
            segments.push(before);
            resolvedLength += before.length;

            const item = itemLookup.get(match[1]);
            const displayText = item?.promptText ?? `@${match[1]}`;
            segments.push(displayText);

            if (item) {
              mentionPositions.push({ start: resolvedLength, length: displayText.length, item });
            }
            resolvedLength += displayText.length;
            lastIndex = match.index + match[0].length;
          }
          // Append trailing text
          segments.push(rawText.substring(lastIndex));
          resolvedText = segments.join('');

          // Build mentionMap from collected positions
          for (const mp of mentionPositions) {
            const key = `${mp.start}_${mp.start + mp.length}`;
            newMentionMap.set(key, new SuggestionItem({
              ...mp.item,
              trackingCharacter: '@',
            }));
          }
        }

        mentionMap.current = newMentionMap;

        // Set the message preview state with resolved text (display names, not tokens)
        setMessagePreview({
          message: { ...message, text: resolvedText },
          mode: ConversationOptionConstants.edit,
        });

        // Parse markdown into structured blocks and load into the native editor
        const blocks = markdownToBlocks(resolvedText);
        inputTextRef.current = resolvedText;
        plainTextInputRef.current = resolvedText;
        blocksRef.current = blocks;

        // Do NOT call setInputText here — that would push text via the React
        // text prop, which races with setContent and can strip formatting or
        // trigger handleTextChange that corrupts mentionMap. Instead, update
        // only the refs and the inputText state silently after setContent loads.

        // Load structured blocks into the native editor.
        setTimeout(() => {
          inputRef.current?.setContent?.(blocks);
          inputRef.current?.focus();
          // Update inputText state AFTER setContent so the text prop doesn't
          // race with attributed text. The native editor already has the content.
          setInputText(resolvedText);
          // Apply mention styling after native editor finishes processing setContent
          setTimeout(syncMentionRanges, 100);
        }, 100);
      }
    };

    /**
     * Preview message for reply mode.
     * Called when a ccReplyToMessage event is received.
     * Clears any active edit preview before showing the reply preview.
     */
    const previewReplyMessage = (message: any) => {
      // Clear edit preview if it exists
      if (messagePreview) {
        setMessagePreview(null);
        mentionMap.current = new Map();
        plainTextInputRef.current = '';
        syncMentionRanges();
      }

      // Set the reply message state
      setReplyMessage({
        message: message,
        mode: ConversationOptionConstants.reply,
      });

      // Focus input after setting preview
      try {
        inputRef.current?.focus();
      } catch (error) {
        // Ignore focus errors
      }
    };

    /**
     * Expose ref methods for programmatic control.
     * Allows parent components to:
     * - Trigger edit mode programmatically
     * - Send text messages
     * - Get current input text
     * - Clear the input field
     * - Reset streaming state
     */
    useImperativeHandle(ref, () => ({
      previewMessageForEdit: previewMessage,
      sendTextMessage,
      getText: () => plainTextInputRef.current,
      clear: () => {
        clearInputBox();
        inputRef.current?.clear();
      },
      // Rich text formatting methods — exposed so developers can build custom toolbars.
      // These call the same native methods as the built-in inline toolbar.
      // Use these when enableRichTextEditor={false} and you want to provide your own UI controls.

      /** Toggles bold formatting on the current selection or at the cursor position. */
      toggleBold: () => inputRef.current?.toggleBold(),
      /** Toggles italic formatting on the current selection or at the cursor position. */
      toggleItalic: () => inputRef.current?.toggleItalic(),
      /** Toggles underline formatting on the current selection or at the cursor position. */
      toggleUnderline: () => inputRef.current?.toggleUnderline(),
      /** Toggles strikethrough formatting on the current selection or at the cursor position. */
      toggleStrikethrough: () => inputRef.current?.toggleStrikethrough(),
      /** Toggles inline code formatting on the current selection or at the cursor position. */
      toggleCode: () => inputRef.current?.toggleCode(),
      /** Toggles text highlight/background color on the current selection. Pass an optional hex color string. */
      toggleHighlight: (color?: string) => inputRef.current?.toggleHighlight(color),
      /** Converts the current line/block to a heading (toggles between heading and paragraph). */
      setHeading: () => inputRef.current?.setHeading(),
      /** Converts the current line/block to a bullet (unordered) list item. */
      setBulletList: () => inputRef.current?.setBulletList(),
      /** Converts the current line/block to a numbered (ordered) list item. */
      setNumberedList: () => inputRef.current?.setNumberedList(),
      /** Converts the current line/block to a blockquote. */
      setQuote: () => inputRef.current?.setQuote(),
      /** Converts the current line/block to a checklist item with a toggleable checkbox. */
      setChecklist: () => inputRef.current?.setChecklist(),
      /** Resets the current line/block back to a normal paragraph. */
      setParagraph: () => inputRef.current?.setParagraph(),
      /** Inserts a hyperlink at the current selection. Wraps selected text or inserts new link text. */
      insertLink: (url: string, text: string) => inputRef.current?.insertLink(url, text),
      /** Undoes the last editing action. */
      undo: () => inputRef.current?.undo(),
      /** Redoes the last undone editing action. */
      redo: () => inputRef.current?.redo(),
      /** Removes all inline formatting (bold, italic, underline, etc.) from the current selection. */
      clearFormatting: () => inputRef.current?.clearFormatting(),
      /** Increases the indentation level of the current line/block (for lists and quotes). */
      indent: () => inputRef.current?.indent(),
      /** Decreases the indentation level of the current line/block. */
      outdent: () => inputRef.current?.outdent(),
      /** Sets text alignment for the current line/block: 'left', 'center', or 'right'. */
      setAlignment: (alignment: 'left' | 'center' | 'right') => inputRef.current?.setAlignment(alignment),
      /** Programmatically focuses the editor (opens keyboard). */
      focus: () => inputRef.current?.focus(),
      /** Programmatically blurs the editor (dismisses keyboard). */
      blur: () => inputRef.current?.blur(),
      /**
       * Reset streaming state and stop any active streaming.
       * Resets showStopButton and isStreaming to false.
       * Calls stopStreamingForRunId() with error handling.
       */
      resetStreaming: () => {
        setShowStopButton(false);
        setIsStreaming(false);
        try {
          stopStreamingForRunId();
        } catch (error) {
          // Silently handle streaming stop errors
          // The UI state is already reset
        }
      },
    }));

    /**
     * Update CustomViewHeader when warningMessage changes.
     * Displays an info icon and warning text when mention limit is reached.
     * Clears the header when warning is cleared.
     */
    useLayoutEffect(() => {
      if (warningMessage) {
        setCustomViewHeader(
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: theme.spacing?.padding?.p2 || 8,
              borderRadius: resolvedStyle?.containerStyle?.borderRadius as number || 8,
              backgroundColor: resolvedStyle?.containerStyle?.backgroundColor as string || theme.color.background1,
              borderColor: resolvedStyle?.containerStyle?.borderColor as string,
              borderWidth: resolvedStyle?.containerStyle?.borderWidth as number,
              marginBottom: 2,
            }}
          >
            <Icon name='info-fill' color={theme.color.error} height={16} width={16} />
            <Text
              style={{
                marginLeft: 5,
                color: theme.color.error,
                ...theme.typography.caption1.regular,
              }}
            >
              {warningMessage}
            </Text>
          </View>
        );
        return;
      }
      setCustomViewHeader(null);
    }, [warningMessage, theme, resolvedStyle]);

    /**
     * Parse a markdown string into the block format expected by the native
     * editor's setContent(blocks:) / initialContentJson.
     *
     * This is the inverse of blocksToMarkdown. It handles:
     *   - Code blocks (``` ... ```) → { type: "codeBlock", text, styles: [] }
     *   - Blockquotes (> ...)      → { type: "quote", text, styles: [] }
     *   - Bullet lists (- ...)     → { type: "bullet", text, styles }
     *   - Numbered lists (1. ...)  → { type: "numbered", text, styles }
     *   - Inline styles (bold **, italic _, underline <u></u>, strikethrough ~~, code `)
     *     → { type: "paragraph", text, styles: [{style, start, end}] }
     */
    const markdownToBlocks = (markdown: string): any[] => {
      if (!markdown) return [];

      /**
       * Parse inline markdown styles from a line of text.
       * Returns the plain text and an array of style spans.
       * Supports nested styles (e.g. **<u>bold underline</u>**).
       */
      const parseInlineStyles = (line: string): { text: string; styles: any[] } => {
        const styles: any[] = [];
        let plain = '';

        // Helper: recursively parse inner content and offset style positions
        const parseNested = (content: string, offset: number): string => {
          const inner = parseInlineStyles(content);
          for (const s of inner.styles) {
            styles.push({ style: s.style, start: s.start + offset, end: s.end + offset });
          }
          return inner.text;
        };

        let i = 0;
        while (i < line.length) {
          // Markdown link: [text](url)
          if (line[i] === '[') {
            const closeBracket = line.indexOf('](', i + 1);
            if (closeBracket !== -1) {
              const closeParen = line.indexOf(')', closeBracket + 2);
              if (closeParen !== -1) {
                const start = plain.length;
                const linkText = line.substring(i + 1, closeBracket);
                const linkUrl = line.substring(closeBracket + 2, closeParen);
                plain += linkText;
                styles.push({ style: 'link', start, end: plain.length, url: linkUrl });
                i = closeParen + 1;
                continue;
              }
            }
          }

          // Triple-backtick inline code block: ```...```
          if (line[i] === '`' && line[i + 1] === '`' && line[i + 2] === '`') {
            const closeIdx = line.indexOf('```', i + 3);
            if (closeIdx !== -1) {
              const start = plain.length;
              const content = line.substring(i + 3, closeIdx);
              plain += content;
              styles.push({ style: 'code', start, end: plain.length });
              i = closeIdx + 3;
              continue;
            }
          }

          // Inline code: `...` (no nesting inside code)
          if (line[i] === '`') {
            const closeIdx = line.indexOf('`', i + 1);
            if (closeIdx !== -1) {
              const start = plain.length;
              const content = line.substring(i + 1, closeIdx);
              plain += content;
              styles.push({ style: 'code', start, end: plain.length });
              i = closeIdx + 1;
              continue;
            }
          }

          // Bold: **...**
          if (line[i] === '*' && line[i + 1] === '*') {
            const closeIdx = line.indexOf('**', i + 2);
            if (closeIdx !== -1) {
              const start = plain.length;
              const content = line.substring(i + 2, closeIdx);
              const innerText = parseNested(content, start);
              plain += innerText;
              styles.push({ style: 'bold', start, end: plain.length });
              i = closeIdx + 2;
              continue;
            }
          }

          // Strikethrough: ~~...~~
          if (line[i] === '~' && line[i + 1] === '~') {
            const closeIdx = line.indexOf('~~', i + 2);
            if (closeIdx !== -1) {
              const start = plain.length;
              const content = line.substring(i + 2, closeIdx);
              const innerText = parseNested(content, start);
              plain += innerText;
              styles.push({ style: 'strikethrough', start, end: plain.length });
              i = closeIdx + 2;
              continue;
            }
          }

          // Underline: <u>text</u> (HTML tag, case-insensitive)
          if (line[i] === '<' && line.substring(i, i + 3).toLowerCase() === '<u>') {
            const closeIdx = line.toLowerCase().indexOf('</u>', i + 3);
            if (closeIdx !== -1) {
              const start = plain.length;
              const content = line.substring(i + 3, closeIdx);
              const innerText = parseNested(content, start);
              plain += innerText;
              styles.push({ style: 'underline', start, end: plain.length });
              i = closeIdx + 4;
              continue;
            }
          }

          // Italic: _..._
          if (line[i] === '_') {
            const closeIdx = line.indexOf('_', i + 1);
            if (closeIdx !== -1) {
              const start = plain.length;
              const content = line.substring(i + 1, closeIdx);
              const innerText = parseNested(content, start);
              plain += innerText;
              styles.push({ style: 'italic', start, end: plain.length });
              i = closeIdx + 1;
              continue;
            }
          }

          // Plain character
          plain += line[i];
          i++;
        }

        return { text: plain, styles };
      };

      const lines = markdown.split('\n');
      const blocks: any[] = [];
      let i = 0;

      while (i < lines.length) {
        const line = lines[i];

        // Code block fence: ```
        if (line.trimEnd() === '```' || line.startsWith('```')) {
          const afterOpen = line.substring(3);
          const firstClose = afterOpen.indexOf('```');

          if (firstClose > 0) {
            // Has closing ``` on the same line
            const afterFirstBlock = afterOpen.substring(firstClose + 3).trim();
            if (afterFirstBlock.length === 0) {
              // Single ```content``` on this line — treat as one code block
              const content = afterOpen.substring(0, firstClose);
              blocks.push({ type: 'codeBlock', text: content, styles: [] });
              i++;
              continue;
            } else {
              // Multiple ```...``` or mixed content — treat as paragraph with inline code styles
              const { text, styles } = parseInlineStyles(line);
              blocks.push({ type: 'paragraph', text, styles });
              i++;
              continue;
            }
          }

          // Standalone ``` or ```langId — multi-line fenced code block
          i++;
          const codeLines: string[] = [];
          while (i < lines.length && lines[i].trimEnd() !== '```') {
            codeLines.push(lines[i]);
            i++;
          }
          // Each code line becomes its own codeBlock block (matching native editor format)
          if (codeLines.length === 0) {
            blocks.push({ type: 'codeBlock', text: '', styles: [] });
          } else {
            for (const cl of codeLines) {
              blocks.push({ type: 'codeBlock', text: cl, styles: [] });
            }
          }
          // Skip closing fence
          if (i < lines.length) i++;
          continue;
        }

        // Blockquote + bullet: > - ...
        if (line.startsWith('> - ')) {
          const content = line.substring(4);
          const { text, styles } = parseInlineStyles(content);
          blocks.push({ type: 'quoteBullet', text, styles });
          i++;
          continue;
        }

        // Blockquote + numbered: > 1. ...
        if (/^> \d+\.\s/.test(line)) {
          const content = line.replace(/^> \d+\.\s/, '');
          const { text, styles } = parseInlineStyles(content);
          blocks.push({ type: 'quoteNumbered', text, styles });
          i++;
          continue;
        }

        // Blockquote: > ...
        if (line.startsWith('> ')) {
          const content = line.substring(2);
          const { text, styles } = parseInlineStyles(content);
          blocks.push({ type: 'quote', text, styles });
          i++;
          continue;
        }

        // Bullet list: - ...
        if (line.startsWith('- ')) {
          const content = line.substring(2);
          const { text, styles } = parseInlineStyles(content);
          blocks.push({ type: 'bullet', text, styles });
          i++;
          continue;
        }

        // Numbered list: 1. ... (any digit prefix)
        if (/^\d+\.\s/.test(line)) {
          const content = line.replace(/^\d+\.\s/, '');
          const { text, styles } = parseInlineStyles(content);
          blocks.push({ type: 'numbered', text, styles });
          i++;
          continue;
        }

        // Heading: # ...
        if (line.startsWith('# ')) {
          const content = line.substring(2);
          const { text, styles } = parseInlineStyles(content);
          blocks.push({ type: 'heading', text, styles });
          i++;
          continue;
        }

        // Default: paragraph with inline styles
        const { text, styles } = parseInlineStyles(line);
        blocks.push({ type: 'paragraph', text, styles });
        i++;
      }

      return blocks;
    };

    /**
     * Convert RichTextEditor blocks to markdown string.
     * Handles overlapping style ranges (e.g. bold+italic+underline on same text).
     */
    const blocksToMarkdown = (blocks: any[]): string => {
      if (!blocks || blocks.length === 0) return '';

      // Marker map for each style type — open/close pairs
      // Most markers are symmetric (same open and close), but underline uses HTML tags.
      const markerMap: Record<string, { open: string; close: string }> = {
        bold: { open: '**', close: '**' },
        italic: { open: '_', close: '_' },
        underline: { open: '<u>', close: '</u>' },
        strikethrough: { open: '~~', close: '~~' },
        code: { open: '`', close: '`' },
      };

      // Order matters: outer markers wrap inner ones
      const styleOrder = ['bold', 'underline', 'strikethrough', 'italic', 'code'];

      const applyInlineStyles = (text: string, styles: any[]): string => {
        if (!styles || styles.length === 0 || !text) return text;

        // Build mention ranges by finding mention promptText within this block's text.
        // This is more robust than position-based mapping because mentionMap positions
        // are based on plain text (with list prefixes) while block text has prefixes stripped.
        const mentionRanges: Array<[number, number]> = [];
        mentionMap.current.forEach((value, _key) => {
          const pt = value.promptText || '';
          if (pt) {
            let searchFrom = 0;
            // Find all occurrences of this mention's promptText in the block text
            while (searchFrom < text.length) {
              const idx = text.indexOf(pt, searchFrom);
              if (idx === -1) break;
              mentionRanges.push([idx, idx + pt.length]);
              searchFrom = idx + pt.length;
            }
          }
        });

        // Split styles around mention ranges so mentions stay clean.
        const filteredStyles: any[] = [];
        for (const s of styles) {
          if (s.style === 'link' || mentionRanges.length === 0) {
            filteredStyles.push(s);
            continue;
          }
          const sStart = Math.max(0, s.start);
          const sEnd = Math.min(text.length, s.end);
          // Collect non-mention sub-ranges of this style
          let cursor = sStart;
          // Sort mention ranges for consistent processing
          const sorted = [...mentionRanges].sort((a, b) => a[0] - b[0]);
          for (const [mStart, mEnd] of sorted) {
            if (mStart >= sEnd || mEnd <= sStart) continue; // no overlap
            // Add the part before the mention
            if (cursor < mStart) {
              filteredStyles.push({ ...s, start: cursor, end: mStart });
            }
            cursor = Math.max(cursor, mEnd);
          }
          // Add the part after the last mention
          if (cursor < sEnd) {
            filteredStyles.push({ ...s, start: cursor, end: sEnd });
          }
        }

        // Collect all boundary positions where style sets change
        const boundaries = new Set<number>();
        boundaries.add(0);
        boundaries.add(text.length);
        for (const s of filteredStyles) {
          boundaries.add(Math.max(0, s.start));
          boundaries.add(Math.min(text.length, s.end));
        }
        const sorted = Array.from(boundaries).sort((a, b) => a - b);

        // Build segments with their active style sets
        const segActiveStyles: string[][] = [];
        const segTexts: string[] = [];
        const segLinkUrls: string[] = [];
        for (let i = 0; i < sorted.length - 1; i++) {
          const segStart = sorted[i];
          const segEnd = sorted[i + 1];
          const segment = text.substring(segStart, segEnd);
          if (segment.length === 0) continue;

          const active: string[] = [];
          let linkUrl = '';
          for (const s of filteredStyles) {
            const sStart = Math.max(0, s.start);
            const sEnd = Math.min(text.length, s.end);
            if (sStart <= segStart && sEnd >= segEnd) {
              if (s.style === 'link' && s.url) {
                linkUrl = s.url;
              } else if (markerMap[s.style] !== undefined && !active.includes(s.style)) {
                active.push(s.style);
              }
            }
          }
          segActiveStyles.push(active);
          segTexts.push(segment);
          segLinkUrls.push(linkUrl);
        }

        if (segTexts.length === 0) return text;

        // Build markdown with properly nested markers.
        // We maintain a stack of currently open styles. Between segments,
        // we close styles that are ending (popping from stack) and open
        // styles that are starting (pushing onto stack). This ensures
        // markers are always properly nested.
        let result = '';
        let openStack: string[] = []; // styles currently open, in nesting order

        for (let i = 0; i < segTexts.length; i++) {
          const curr = segActiveStyles[i];
          // Determine which styles in styleOrder should be active
          const desired = styleOrder.filter(s => curr.includes(s));

          // Close styles that are open but not desired (pop from top of stack)
          // We must close in reverse stack order (innermost first)
          const toClose: string[] = [];
          const toReopen: string[] = [];
          // Find styles to close: anything in openStack not in desired
          // But we may need to close styles above them too (and reopen)
          const newStack: string[] = [];
          for (const s of openStack) {
            if (desired.includes(s)) {
              newStack.push(s);
            }
          }
          // Close everything from top of stack down to what we need
          // Then reopen what should stay
          if (openStack.length > 0) {
            // Find the deepest style that needs to close
            let closeFrom = -1;
            for (let j = openStack.length - 1; j >= 0; j--) {
              if (!desired.includes(openStack[j])) {
                closeFrom = j;
                break;
              }
            }
            if (closeFrom >= 0) {
              // Close everything from top down to closeFrom
              for (let j = openStack.length - 1; j >= closeFrom; j--) {
                result += markerMap[openStack[j]].close;
                if (desired.includes(openStack[j])) {
                  toReopen.push(openStack[j]);
                }
              }
              openStack = openStack.slice(0, closeFrom);
              // Reopen styles that should stay (in their original order)
              for (const s of toReopen.reverse()) {
                result += markerMap[s].open;
                openStack.push(s);
              }
            }
          }

          // Open new styles that are desired but not yet open
          for (const s of desired) {
            if (!openStack.includes(s)) {
              result += markerMap[s].open;
              openStack.push(s);
            }
          }

          // Add segment text (with link wrapping if needed)
          if (segLinkUrls[i]) {
            result += `[${segTexts[i]}](${segLinkUrls[i]})`;
          } else {
            result += segTexts[i];
          }
        }

        // Close all remaining open styles (innermost first)
        for (let j = openStack.length - 1; j >= 0; j--) {
          result += markerMap[openStack[j]].close;
        }

        return result;
      };

      // Strip trailing empty list items (bullet/numbered) so "1. text\n2. " sends as "1. text"
      let blockCount = blocks.length;
      while (blockCount > 0) {
        const last = blocks[blockCount - 1];
        if ((last.type === 'bullet' || last.type === 'numbered' || last.type === 'quoteBullet' || last.type === 'quoteNumbered') && !(last.text || '').trim()) {
          blockCount--;
        } else {
          break;
        }
      }

      const lines: string[] = [];
      let inCodeBlock = false;
      let orderedCounter = 0;
      for (let i = 0; i < blockCount; i++) {
        const block = blocks[i];
        const text = block.text || '';
        const styles: any[] = block.styles || [];
        const blockType = block.type || 'paragraph';

        if (blockType === 'codeBlock') {
          if (!inCodeBlock) {
            // Check if this is a single-line code block (no consecutive codeBlock after it)
            const nextBlock = i + 1 < blocks.length ? blocks[i + 1] : null;
            if (!nextBlock || (nextBlock.type || 'paragraph') !== 'codeBlock') {
              // Single-line: emit ```content``` (no newlines)
              lines.push(`\`\`\`${text}\`\`\``);
              orderedCounter = 0;
              continue;
            }
            // Multi-line: use fenced format
            lines.push('```');
            inCodeBlock = true;
          }
          // Code block lines use raw text (no inline style markers)
          lines.push(text);
        } else {
          // Close code block fence if we were inside one
          if (inCodeBlock) {
            lines.push('```');
            inCodeBlock = false;
          }

          const styledText = applyInlineStyles(text, styles);

          switch (blockType) {
            case 'bullet':
            case 'quoteBullet':
              // Bullet lines don't reset the counter (Slack behavior)
              lines.push(blockType === 'quoteBullet' ? `> - ${styledText}` : `- ${styledText}`);
              break;
            case 'numbered':
              orderedCounter++;
              lines.push(`${orderedCounter}. ${styledText}`);
              break;
            case 'quoteNumbered':
              orderedCounter++;
              lines.push(`> ${orderedCounter}. ${styledText}`);
              break;
            case 'quote': lines.push(`> ${styledText}`); break;
            case 'heading': lines.push(`# ${styledText}`); break;
            default:
              orderedCounter = 0;
              lines.push(styledText);
              break;
          }
        }
      }
      // Close any trailing code block fence
      if (inCodeBlock) {
        lines.push('```');
      }

      return lines.join('\n');
    };

    /**
     * Send text message
     * Includes agentic user support for:
     * - Parent message ID tracking
     * - Send button delay
     * - Streaming start
     * - Reply message support
     */
    const sendTextMessage = () => {
      const trimmedText = inputText.trim();

      if (trimmedText.length === 0) {
        return;
      }

      // Check if in edit mode - call editMessage instead
      if (messagePreview !== null) {
        editMessage(messagePreview.message);
        return;
      }

      // Capture current reply message before clearing (for quoted message)
      const currentReplyMessage = replyMessage;
      const replyMessageId = currentReplyMessage?.message?.getId?.() ?? null;

      // Convert blocks to markdown if rich text is enabled, otherwise use plain text
      let textToSend = enableRichTextEditor && blocksRef.current.length > 0
        ? blocksToMarkdown(blocksRef.current)
        : trimmedText;
      // Apply pending links: replace link display text with [text](url) markdown
      if (pendingLinksRef.current.size > 0) {
        pendingLinksRef.current.forEach((url, displayText) => {
          // Only replace if the text isn't already wrapped in markdown link syntax
          const escaped = displayText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const alreadyLinked = new RegExp(`\\[${escaped}\\]\\(`);
          if (!alreadyLinked.test(textToSend)) {
            // Use a function replacement to avoid $ special patterns in replacement string
            textToSend = textToSend.replace(displayText, () => `[${displayText}](${url})`);
          }
        });
        pendingLinksRef.current.clear();
      }

      // Process mentions to underlying text format before sending.
      // Mention map positions are based on plain text (plainTextInputRef),
      // but blocksToMarkdown adds markdown syntax (```, `, **, etc.) that
      // shifts character positions. So when mentions exist, do a name-based
      // find-and-replace on the markdown text instead of position-based splicing.
      let processedText: string;
      if (mentionMap.current.size > 0) {
        processedText = replaceMentionsWithTokens(textToSend);
      } else {
        processedText = getRegexString(textToSend);
      }

      let textMessage = new CometChat.TextMessage(
        chatWithId.current,
        processedText,
        chatWith.current
      );

      textMessage.setSender(loggedInUser.current!);
      textMessage.setReceiver((user || group)!);
      textMessage.setMuid(String(getUnixTimestampInMilliseconds()));

      // Handle parent message ID for threaded messages
      // For agentic users, use tracked parent message ID if no prop provided
      if (parentMessageId) {
        textMessage.setParentMessageId(parentMessageId as number);
      } else if (isAgenticUser() && parentMessageIdRef.current) {
        textMessage.setParentMessageId(parentMessageIdRef.current);
      }

      /**
       * Handle reply message - set quoted message for replies.
       * Uses shared helper for consistency with CometChatMessageComposer.
       */
      if (replyMessageId && currentReplyMessage?.message) {
        setQuotedMessageSafe(textMessage, currentReplyMessage.message, replyMessageId);
      }

      // Process text through formatters
      allFormatters.current.forEach((formatter) => {
        textMessage = formatter.handlePreMessageSend(textMessage);
      });

      clearInputBox();
      // Clear mention map after sending
      mentionMap.current = new Map();
      endTyping();

      /**
       * Clear reply preview after preparing message.
       */
      setReplyMessage(null);

      // If custom send handler is provided, use it
      if (onSendButtonPress) {
        onSendButtonPress(textMessage);
        return;
      }

      // Emit in-progress event
      CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, {
        message: textMessage,
        status: messageStatus.inprogress,
      });

      // Play sound if enabled
      if (!disableSoundForMessages) {
        playAudio();
      }

      /**
       * Enable 1-second delay for agentic users after sending.
       * This prevents rapid-fire messages to AI agents.
       */
      if (isAgenticUser()) {
        setIsSendButtonDisabledForDelay(true);
        if (sendButtonDelayTimer.current) {
          clearTimeout(sendButtonDelayTimer.current);
        }
        sendButtonDelayTimer.current = setTimeout(() => {
          setIsSendButtonDisabledForDelay(false);
        }, 1000);
      }

      // Send message via SDK
      CometChat.sendMessage(textMessage)
        .then((message: CometChat.BaseMessage) => {
          /**
           * For agentic users without parentMessageId prop:
           * - Store the message ID as parent for subsequent messages
           * - Start streaming for the message
           */
          if (isAgenticUser() && !parentMessageId && message?.getId) {
            const messageId = typeof message.getId() === 'string' 
              ? Number(message.getId()) 
              : message.getId();
            
            // Store parent message ID for subsequent messages
            if (!isNaN(messageId) && !parentMessageIdRef.current) {
              parentMessageIdRef.current = messageId;
            }
            
            // Start streaming for agentic user messages
            if (messageId && !isNaN(messageId)) {
              startStreamingForRunId(String(messageId));
            }
          }

          CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, {
            message: message,
            status: messageStatus.success,
          });
        })
        .catch((error: CometChat.CometChatException) => {
          onError?.(error);
          (textMessage as any).data.metaData = { error: true };
          CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, {
            message: textMessage,
            status: messageStatus.error,
          });
        });
    };

    /**
     * Edit an existing message
     * Called when in edit mode and user submits the edited text
     */
    const editMessage = (originalMessage: any) => {
      endTyping();

      // Convert blocks to markdown and replace mention display names with tokens
      const trimmedText = inputText.trim();
      let textToSend = enableRichTextEditor && blocksRef.current.length > 0
        ? blocksToMarkdown(blocksRef.current)
        : trimmedText;
      textToSend = replaceMentionsWithTokens(textToSend);

      // Create new text message with edited content
      const textMessage = new CometChat.TextMessage(
        chatWithId.current,
        textToSend,
        chatWith.current
      );

      // Set the message ID from the original message
      textMessage.setId(originalMessage.id);

      if (parentMessageId) {
        textMessage.setParentMessageId(parentMessageId as number);
      }

      // Clear input and preview
      clearInputBox();
      setMessagePreview(null);

      // If custom send handler is provided, use it
      if (onSendButtonPress) {
        onSendButtonPress(textMessage);
        return;
      }

      // Play sound if enabled
      if (!disableSoundForMessages) {
        playAudio();
      }

      // Edit message via SDK
      CometChat.editMessage(textMessage)
        .then((editedMessage: CometChat.BaseMessage) => {
          CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageEdited, {
            message: editedMessage,
            status: messageStatus.success,
          });
        })
        .catch((error: CometChat.CometChatException) => {
          onError?.(error);
        });
    };

    /**
     * Check if the text has actual user content beyond formatting markers.
     * When a user taps bullet, numbered list, blockquote, or applies inline
     * formatting without typing content, the editor inserts markers but no
     * real content — send should stay disabled.
     *
     * Handles: empty code block fences, empty inline format markers
     * (** **, _ _, <u></u>, ~~ ~~, ` `), nested empty formatting,
     * and block prefixes (• , N. , ▎ ).
     */
    const hasActualContent = (text: string): boolean => {
      let stripped = text;
      // Remove code block fences and keep only inner content
      stripped = stripped.replace(/```[\s\S]*?```/g, (m) => m.slice(3, -3));
      // Remove inline format markers (keep inner content)
      stripped = stripped.replace(/\*\*(.+?)\*\*/g, '$1');
      stripped = stripped.replace(/<u>(.+?)<\/u>/gi, '$1');
      stripped = stripped.replace(/~~(.+?)~~/g, '$1');
      stripped = stripped.replace(/`(.+?)`/g, '$1');
      stripped = stripped.replace(/(?<![a-zA-Z0-9])_(.+?)_(?![a-zA-Z0-9])/g, '$1');
      // Remove empty inline format markers (no content between delimiters)
      stripped = stripped.replace(/\*\*\s*\*\*/g, '');
      stripped = stripped.replace(/<u>\s*<\/u>/gi, '');
      stripped = stripped.replace(/~~\s*~~/g, '');
      stripped = stripped.replace(/`\s*`/g, '');
      stripped = stripped.replace(/(?<![a-zA-Z0-9])_\s*_(?![a-zA-Z0-9])/g, '');
      // Remove block prefixes (bullet, numbered list, blockquote, and combinations)
      stripped = stripped
        .split('\n')
        .map(line => line.replace(/^(>\s)?(-\s|•\s|‧\s|▎\s|\d+\.\s)+/, '').trim())
        .join('');
      return stripped.length > 0;
    };

    /**
     * Mic button slide/fade animation effect.
     * Triggers forward animation (slide out + fade) when text appears,
     * and reverse animation (slide in + fade in) when text is cleared.
     * Rapid toggling is handled by Animated API cancellation — calling
     * .start() on a new animation cancels the previous one.
     */
    const hasContent = hasActualContent(inputText);
    useEffect(() => {
      if (hideVoiceRecordingButton) return;

      Animated.timing(micAnimValue, {
        toValue: hasContent ? 1 : 0,
        duration: MIC_ANIM_DURATION,
        useNativeDriver: true,
      }).start();
    }, [hasContent, hideVoiceRecordingButton]);

    /**
     * Check if send button should be disabled.
     * For agentic users, also considers:
     * - Streaming state (disabled while AI is responding)
     * - Send button delay (disabled for 1 second after sending)
     */
    const isSendDisabled = isStreaming || !hasActualContent(inputText) || isSendButtonDisabledForDelay;

    /**
     * Get send button tint color based on state
     */
    const getSendButtonTint = () => {
      if (isSendDisabled) {
        return theme.color.iconSecondary;
      }
      return resolvedStyle?.sendIconStyle?.tintColor || theme.color.primary;
    };

    /**
     * Get attachment icon tint color
     */
    const getAttachmentIconTint = () => {
      return resolvedStyle?.attachmentIconStyle?.tintColor || theme.color.iconSecondary;
    };

    /**
     * Render secondary button (left side, for API compatibility)
     * By default, shows the attachment button (📎) which opens the attachment action sheet.
     * For agentic users, the attachment button is automatically hidden.
     */
    const renderSecondaryButton = () => {
      // Hide attachment button for agentic users
      if (hideAttachmentButton) {
        return null;
      }

      if (SecondaryButtonView) {
        return (
          <SecondaryButtonView
            user={user}
            group={group}
            composerId={id || 'single-line-composer'}
          />
        );
      }

      // Default attachment button - opens action sheet
      const handleAttachmentClick = () => {
        if (onAttachmentClick) {
          onAttachmentClick();
        }
        setShowActionSheet(true);
      };

      // Always show attachment button by default (per requirements doc)
      // The button opens the attachment action sheet with default options from ChatConfigurator
      // Use SVG icon name for proper tintColor support
      return (
        <IconButton
          name={attachmentIcon ? undefined : 'add-circle'}
          icon={attachmentIcon}
          onClick={handleAttachmentClick}
          buttonStyle={Style.iconButton}
          iconStyle={Style.icon}
          tintColor={getAttachmentIconTint()}
        />
      );
    };

    /**
     * Render auxiliary button
     * Uses custom EmojiButton component with proper styling (no extra padding).
     * For agentic users, auxiliary buttons are automatically hidden.
     * When placed on the right (next to mic), slides/fades with the same animation as the mic button.
     */
    const renderAuxiliaryButton = () => {
      // Hide auxiliary buttons if prop is set
      if (hideAuxiliaryButton || hideAuxiliaryButtons) {
        return null;
      }

      // Hide stickers button if prop is set
      if (hideStickersButton) {
        return null;
      }

      // For agentic users, hide default auxiliary buttons (but allow custom ones)
      if (isAgenticUser() && !AuxiliaryButtonView) {
        return null;
      }

      let content: JSX.Element;

      // If custom AuxiliaryButtonView is provided, use it
      if (AuxiliaryButtonView) {
        content = (
          <AuxiliaryButtonView
            user={user}
            group={group}
            composerId={id || 'single-line-composer'}
          />
        );
      } else {
        // Use custom EmojiButton with proper styling (no extra padding)
        content = (
          <EmojiButton
            user={user}
            group={group}
            composerIdMap={composerIdMap}
            replyToMessage={replyMessage?.message}
            closeReplyPreview={closeReplyPreview}
            editorRef={inputRef}
          />
        );
      }

      // No animation needed for sticker — it naturally shifts via flexbox
      // when the mic button's layout collapses
      return content;
    };

    /**
     * Default agent send button view component.
     * Uses CometChatSendButtonView for agentic users with streaming support.
     */
    const DefaultAgentSendButtonView = useCallback(
      ({ isButtonDisabled, composerRef }: { isButtonDisabled: boolean; composerRef: any }) => (
        <CometChatSendButtonView
          isButtonDisabled={isButtonDisabled}
          composerRef={composerRef}
          isStreaming={isStreaming}
          showStopButton={showStopButton}
          setShowStopButton={setShowStopButton}
        />
      ),
      [isStreaming, showStopButton]
    );

    /**
     * Render send button
     * Always shows send button with disabled/enabled states based on input content.
     * When input is empty, send button is disabled with inactive tint color.
     * When input has text, send button is enabled with active tint color.
     * For agentic users, renders the agent send button with streaming support.
     */
    const renderSendButton = () => {
      if (hideSendButton) {
        return null;
      }

      // For agentic users, use the agent send button view
      if (isAgenticUser()) {
        const disabled = isStreaming || inputText.trim().length === 0 || (messagePreview !== null) || isSendButtonDisabledForDelay;
        const SendButtonComponent = AgentSendButtonView || DefaultAgentSendButtonView;
        
        // Create a ref-like object that matches what CometChatSendButtonView expects
        const composerRef = {
          current: {
            sendTextMessage: () => {
              if (!disabled) {
                sendTextMessage();
              }
            }
          }
        };
        
        return <SendButtonComponent isButtonDisabled={disabled} composerRef={composerRef} />;
      }

      if (SendButtonView) {
        return (
          <SendButtonView
            user={user}
            group={group}
            composerId={id || 'single-line-composer'}
          />
        );
      }

      // Always show send button with disabled/enabled state based on input content
      // Figma spec: 32×32 circle, primary bg when active, background4 when disabled
      const sendIconSize = theme.spacing.spacing.s5;
      const sendIconColor = isSendDisabled
        ? (theme.color.iconSecondary as string)
        : (theme.color.primaryButtonIcon as string);
      return (
        <TouchableOpacity
          testID="send-button"
          onPress={sendTextMessage}
          disabled={isSendDisabled}
          style={[{
            width: theme.spacing.spacing.s8,
            height: theme.spacing.spacing.s8,
            borderRadius: theme.spacing.spacing.s15,
            padding: theme.spacing.padding.p1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: isSendDisabled
              ? (theme.color.background4 as string)
              : (theme.color.primary as string),
          }, sendButtonStyle]}
        >
          {sendButtonIcon ? (
            <Icon
              icon={sendButtonIcon}
              width={sendIconSize}
              height={sendIconSize}
              color={sendIconColor}
            />
          ) : (
            <Icon
              name="send-fill"
              width={sendIconSize}
              height={sendIconSize}
              color={sendIconColor}
            />
          )}
        </TouchableOpacity>
      );
    };

    /**
     * Render voice recording button with slide/fade animation.
     * Shows/hides based on hideVoiceRecordingButton (derived from prop or agentic user status).
     * For agentic users, voice recording is automatically hidden.
     * The button slides right (translateX 0→30) and fades out (opacity 1→0) when text is entered,
     * and reverses when text is cleared. Layout collapses to width:0 after animation completes.
     */
    const RecordAudioButtonView = () => {
      // Preserve guard: hideVoiceRecordingButton or agentic returns null before wrapper
      if (hideVoiceRecordingButton) {
        return null;
      }
      // Hide voice recording button when inline recorder is active
      if (showInlineRecorder) {
        return null;
      }
      // Animated wrapper: translateX slides right, opacity fades out
      return (
        <Animated.View
          pointerEvents={hasContent ? 'none' : 'auto'}
          style={{
            opacity: micAnimValue.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [{ translateX: micAnimValue.interpolate({ inputRange: [0, 1], outputRange: [0, MIC_SLIDE_DISTANCE] }) }],
          }}
        >
          <IconButton
            name={voiceRecordingIconURL ? undefined : 'mic'}
            icon={voiceRecordingIconURL}
            onClick={() => {
              // Show inline recorder
              setTimeout(() => setShowInlineRecorder(true), 50);
            }}
            buttonStyle={Style.iconButton}
            iconStyle={Style.icon}
            tintColor={getAttachmentIconTint()}
          />
        </Animated.View>
      );
    };

    // Container styles - outer wrapper with padding (matches MessageComposer)
    const wrapperStyle: StyleProp<ViewStyle> = [
      Style.wrapper,
      {
        backgroundColor: resolvedStyle?.containerStyle?.backgroundColor || theme.color.background3,
      },
    ];

    // Inner container styles with border (matches MessageComposer: messageInputStyles.containerStyle)
    const containerStyle: StyleProp<ViewStyle> = [
      Style.container,
      resolvedStyle?.containerStyle,
      {
        backgroundColor: resolvedStyle?.messageInputStyles?.containerStyle?.backgroundColor || theme.color.background1,
        borderColor: resolvedStyle?.messageInputStyles?.containerStyle?.borderColor || theme.color.borderDefault,
      },
    ];

    // Input styles - use messageInputStyles from v5 theme
    const textInputStyle: StyleProp<TextStyle> = [
      Style.textInput,
      resolvedStyle?.messageInputStyles?.textStyle,
      {
        color: resolvedStyle?.messageInputStyles?.textStyle?.color || theme.color.textPrimary,
        // Apply dynamic height when autoExpand is enabled
        ...(autoExpand ? { height: inputHeight } : {}),
      },
      inputStyle,
    ];

    // Separator style (matches Figma: Seprator)
    const separatorStyle: StyleProp<ViewStyle> = [
      Style.separator,
      resolvedStyle?.messageInputStyles?.dividerStyle,
    ];

    return (
      <>
        {/* Modal for custom views */}
        <Modal
          animationType="slide"
          visible={isVisible}
          onRequestClose={() => {
            setIsVisible(false);
          }}
          presentationStyle="pageSheet"
        >
          {CustomView && CustomView}
        </Modal>
        
        {/* KeyboardAvoidingView wrapper */}
        <KeyboardAvoidingView
          key={id}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.select({ ios: kbOffset })}
          {...keyboardAvoidingViewProps}
        >
          {/* Outer wrapper with padding (matches Figma: Message Composer) */}
          <View style={wrapperStyle}>
            {/* Inner container with border (matches Figma: Base_Message Composer) */}
            <View style={containerStyle}>
              {/* Action Sheet for attachments */}
              <ActionSheetBoard
                sheetRef={bottomSheetRef}
                options={actionSheetItems}
                shouldShow={showActionSheet}
                onClose={() => setShowActionSheet(false)}
                style={resolvedStyle?.attachmentOptionsStyles}
              />
              
              {/* Voice Recording - removed bottom sheet, using inline recorder instead */}
              
              {HeaderView ? (
                <HeaderView />
              ) : CustomViewHeader ? (
                typeof CustomViewHeader === 'function' ? (
                  <CustomViewHeader />
                ) : (
                  CustomViewHeader
                )
              ) : null}
              
              {/* Mention Suggestion List */}
              {showMentionList && plainTextInputRef.current.length > 0 && mentionsSearchData.length > 0 && (
                <View
                  style={[
                    theme.mentionsListStyle.containerStyle,
                    // Keep height stable to reduce flicker when list data loads/empties
                    { maxHeight: Dimensions.get('window').height * (messagePreview ? 0.2 : (Platform.OS === 'ios' ? 0.15 : 0.22)) },
                  ]}
                >
                  <CometChatSuggestionList
                    data={mentionsSearchData}
                    listStyle={theme.mentionsListStyle}
                    onPress={onMentionPress}
                    onEndReached={onSuggestionListEndReached}
                    loading={suggestionListLoader}
                  />
                  {renderMentionLimitWarning()}
                </View>
              )}
              
              {/* Message Preview Tray for Edit Mode */}
              <MessagePreviewTray
                shouldShow={messagePreview !== null}
                text={typeof messagePreview?.message?.text === 'string' ? messagePreview.message.text : ''}
                title={t('EDIT_MESSAGE')}
                onClose={() => {
                  setMessagePreview(null);
                  clearInputBox();
                }}
              />
              
              {replyMessage && replyMessage.message && (
                <CometChatMessagePreview
                  message={replyMessage.message}
                  showCloseIcon={true}
                  closeIconURL={ICONS.CLOSE}
                  onCloseClick={closeReplyPreview}
                  titleStyle={{ color: theme.color.textHighlight as string }}
                  style={{
                    borderRadius: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: theme.color.borderHighlight as string,
                    margin: theme.spacing?.padding?.p1 || 4,
                  }}
                />
              )}
              
              {/* Conditional: Show inline recorder OR input row */}
              {showInlineRecorder ? (
                <CometChatInlineAudioRecorder
                  onSubmit={handleInlineRecorderSubmit}
                  onCancel={handleInlineRecorderCancel}
                  style={(resolvedStyle as any)?.inlineAudioRecorderStyle}
                />
              ) : (
                <>
                {/* Top Field - Input row with icons (matches Figma: Top Field) */}
                <View
                  style={[
                    Style.inputRow,
                    isExpanded && { alignItems: 'flex-end' as const },
                  ]}
                >
                  {/* Left icons container - dynamic alignment based on expansion state */}
                  <View style={[
                    Style.leftIconsContainer,
                    isExpanded && { alignItems: 'flex-end' as const }
                  ]}>
                    {/* Secondary button (attachment) */}
                    {renderSecondaryButton()}
                  </View>
                  
                  {/* Auxiliary button on left if alignment is 'left' */}
                  {resolvedAlignment === 'left' && renderAuxiliaryButton()}
                  
                  {/* Rich Text Editor - replaces TextInput with same styling */}
                  <View
                    style={{ flex: 1, maxHeight: resolvedMaxHeight, overflow: 'hidden' }}
                    {...(Platform.OS === 'web' ? {
                      onKeyDown: (e: any) => {
                        // Tab key inserts indentation on web (Req 3.1); no-op on native (Req 3.2)
                        if (e.key === 'Tab') {
                          e.preventDefault();
                          inputRef.current?.setText?.(inputText + '\t');
                        }
                      },
                    } : {})}
                  >
                    <RichTextEditor
                      ref={inputRef}
                      testID="rich-text-editor"
                      initialContent={editContentBlocks}
                      style={{
                        backgroundColor: 'transparent',
                      }}
                      onContentChange={(event: ContentChangeEvent) => {
                        const newText = event.nativeEvent.text;
                        // Store blocks for markdown conversion when sending.
                        // The RichTextEditor wrapper already parses blocksJson into blocks,
                        // so event.nativeEvent.blocks is always populated.
                        if (event.nativeEvent.blocks && event.nativeEvent.blocks.length > 0) {
                          blocksRef.current = event.nativeEvent.blocks;
                        }
                        if (skipNextContentChange.current) {
                          skipNextContentChange.current = false;
                          plainTextInputRef.current = newText;
                          inputTextRef.current = newText;
                          return;
                        }

                        handleTextChange(newText);
                      }}
                      onSelectionChange={(event: any) => {
                        const { start, end } = event.nativeEvent;
                        handleSelectionChange({ nativeEvent: { selection: { start, end } } });
                      }}
                      onActiveStylesChange={(styles: ActiveStylesState) => {
                        activeStylesRef.current = styles;
                        setActiveStyles(styles);
                        // Sync codeBlockActive from native codeBlock field
                        setCodeBlockActive(!!styles.codeBlock);
                      }}
                      onSizeChange={(height: number) => {
                        if (autoExpand) {
                          // Snap to resolvedMinHeight when height is within 2px of it
                          // to prevent sub-pixel layout drift between initial empty state
                          // and post-clear empty state on iOS (UITextView.sizeThatFits
                          // returns slightly different values for these two states)
                          const snapped = Math.abs(height - resolvedMinHeight) <= 2 ? resolvedMinHeight : height;
                          const clamped = Math.max(resolvedMinHeight, Math.min(snapped, resolvedMaxHeight));
                          setInputHeight(clamped);
                          const newIsExpanded = clamped > resolvedMinHeight;
                          if (newIsExpanded !== isExpanded) {
                            setIsExpanded(newIsExpanded);
                          }
                        }
                      }}
                      onFocus={() => {
                        setIsFocused(true);
                        startTyping();
                      }}
                      onBlur={() => {
                        setIsFocused(false);
                        endTyping();
                      }}
                      placeholder={placeHolderText || (isAgenticUser() ? t('ASK_ANYTHING') : t('ENTER_YOUR_MESSAGE_HERE'))}
                      placeholderTextColor={resolvedStyle?.messageInputStyles?.placeHolderTextColor as string || theme.color.textTertiary as string}
                      variant="plain"
                      showToolbar={false}
                      maxHeight={resolvedMaxHeight}
                      numberOfLines={maxLines ?? 5}
                      textStyle={{
                        fontSize: (resolvedStyle?.messageInputStyles?.textStyle as any)?.fontSize ?? 14,
                        color: (resolvedStyle?.messageInputStyles?.textStyle?.color || theme.color.textPrimary) as string,
                        fontFamily: (resolvedStyle?.messageInputStyles?.textStyle as any)?.fontFamily,
                      }}
                      codeBackgroundColor={theme.color.neutral200 as string}
                      codeBorderColor={theme.color.neutral300 as string}
                      codeTextColor={(theme.mode === 'dark' ? theme.color.extendedPrimary900 : theme.color.primary) as string}
                      codeFontSize={theme.typography.caption1.regular.fontSize as number}
                      onLinkTap={onLinkTap}
                      enterKeyBehavior={enterKeyBehavior as string}
                      showTextSelectionMenuItems={showTextSelectionMenuItems}
                      onSendRequest={() => {
                        if (!isSendDisabled) {
                          sendTextMessage();
                        }
                      }}
                    />
                  </View>
                  
                  {/* Right icons container - dynamic alignment based on expansion state */}
                  <View style={[
                    Style.rightIconsContainer,
                    isExpanded && { alignItems: 'flex-end' as const }
                  ]}>
                    {/* Auxiliary button (stickers/emoji) on right — slides right with mic */}
                    {resolvedAlignment === 'right' && !hideVoiceRecordingButton && (
                      <Animated.View style={{
                        transform: [{ translateX: micAnimValue.interpolate({ inputRange: [0, 1], outputRange: [0, MIC_SLIDE_DISTANCE] }) }],
                      }}>
                        {renderAuxiliaryButton()}
                      </Animated.View>
                    )}
                    {resolvedAlignment === 'right' && hideVoiceRecordingButton && renderAuxiliaryButton()}
                    
                    {/* Voice recording button - matches Figma design */}
                    {!hideVoiceRecordingButton && !isAgenticUser() && <RecordAudioButtonView />}
                    
                    {/* Send button */}
                    {renderSendButton()}
                  </View>
                </View>

                {/* Rich text toolbar — shown below input row */}
                {enableRichTextEditor && !hideRichTextFormattingOptions && (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: theme.spacing.padding.p2,
                    paddingVertical: 6,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: theme.color.borderLight as string,
                  }}>
                    <ScrollView
                      testID="toolbar-scrollview"
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ alignItems: 'center', gap: 2 }}
                    >
                      {richTextToolbarItems.map((item, index) => {
                        if (item.type === 'separator') {
                          return <View key={`sep-${index}`} style={[richTextToolbarStyles.separator, { backgroundColor: theme.color.borderLight as string }]} />;
                        }
                        // Slack-style: disable inline format buttons inside code blocks;
                        // block-level buttons (lists, quote, code-block) stay enabled.
                        const codeBlockAllowedKeys = ['ordered-list', 'unordered-list', 'blockquote', 'code-block'];
                        const isDisabled = codeBlockActive && !codeBlockAllowedKeys.includes(item.key);
                        let isActive = item.isActive?.(activeStyles) ?? false;
                        // Distinguish inline code vs code block highlighting
                        if (item.key === 'inline-code') {
                          isActive = activeStyles.code && !codeBlockActive;
                        } else if (item.key === 'code-block') {
                          isActive = codeBlockActive;
                        }
                        const iconColor = isDisabled
                          ? theme.color.iconSecondary
                          : isActive ? theme.color.iconPrimary : theme.color.iconSecondary;
                        return (
                          <TouchableOpacity
                            key={item.key}
                            testID={`toolbar-${item.key}`}
                            accessibilityValue={{ text: isActive ? 'on' : 'off' }}
                            disabled={isDisabled}
                            style={[richTextToolbarStyles.btn, isActive && { backgroundColor: theme.color.background4 as string }, isDisabled && { opacity: 0.3 }]}
                            onPress={() => {
                              if (item.key === 'inline-code') {
                                setCodeBlockActive(false);
                              }
                              // Code-block active state is driven by native
                              // onActiveStylesChange — don't eagerly set it here
                              // since the button is a toggle.
                              item.onPress(inputRef, selectionPosition, inputTextRef, setLinkText, setLinkUrl, setShowLinkModal);
                            }}
                          >
                            <Icon
                              name={item.iconName as any}
                              width={theme.spacing.spacing.s6}
                              height={theme.spacing.spacing.s6}
                              color={iconColor}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
                </>
              )}
              
              {/* Separator line - only show when there's footer content (matches Figma: Seprator) */}
              {(FooterView || CustomViewFooter) && <View style={separatorStyle} />}
              
              {FooterView ? (
                <FooterView />
              ) : CustomViewFooter ? (
                typeof CustomViewFooter === 'function' ? (
                  <CustomViewFooter />
                ) : (
                  CustomViewFooter
                )
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Link insertion popup (reuses CometChatLinkConfirmPopup in insert mode) */}
        <CometChatLinkConfirmPopup
          visible={showLinkModal}
          url=""
          initialEditText={linkText}
          initialEditUrl={linkUrl}
          insertMode
          onDismiss={() => setShowLinkModal(false)}
          onEdit={(newUrl, newText) => {
            inputRef.current?.insertLink(newUrl, newText);
            pendingLinksRef.current.set(newText, newUrl);
            setShowLinkModal(false);
          }}
          onRemove={() => setShowLinkModal(false)}
        />

        {/* Link tap edit/remove dialog (shown when user taps an existing link) */}
        <CometChatLinkConfirmPopup
          visible={linkTapData !== null}
          url={linkTapData?.url ?? ''}
          initialEditUrl={editLinkUrl}
          initialEditText={editLinkText}
          onDismiss={() => {
            setLinkTapData(null);
            setLinkEditMode(false);
            inputRef.current?.focus();
          }}
          onEdit={(newUrl, newText) => {
            if (linkTapData) {
              (inputRef.current as any)?.updateLink(
                linkTapData.location,
                linkTapData.length,
                newUrl,
                newText,
              );
            }
            setLinkTapData(null);
            setLinkEditMode(false);
          }}
          onRemove={() => {
            if (linkTapData) {
              (inputRef.current as any)?.removeLink(linkTapData.location, linkTapData.length);
            }
            setLinkTapData(null);
            setLinkEditMode(false);
          }}
        />
      </>
    );
  }
);
