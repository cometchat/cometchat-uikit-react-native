let __listenerIdCounter = 0;
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Keyboard } from "react-native";
import {
  ColorValue,
  Dimensions,
  ImageSourcePropType,
  ImageStyle,
  InteractionManager,
  KeyboardAvoidingView,
  KeyboardAvoidingViewProps,
  Modal,
  NativeModules,
  Platform,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedbackProps,
  View,
  ViewStyle,
} from "react-native";
import { startStreamingForRunId, stopStreamingForRunId, streamingState$ } from "../shared/services/stream-message.service";
import {
  CometChatActionSheet,
  CometChatBottomSheet,
  CometChatMentionsFormatter,
  CometChatMessageInput,
  CometChatMessagePreview,
  CometChatSuggestionList,
  CometChatTextFormatter,
  CometChatUIKit,
  CometChatUrlsFormatter,
  SuggestionItem,
} from "../shared";
import { Style } from "./styles";
//@ts-ignore
import { CheckPropertyExists } from "../shared/helper/functions";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { ChatConfigurator, CometChatSoundManager } from "../shared";
import { commonVars } from "../shared/base/vars";
import {
  ConversationOptionConstants,
  DISABLED_BUTTON_OPACITY,
  MentionsTargetElement,
  MentionsVisibility,
  MessageTypeConstants,
  ReceiverTypeConstants,
  ViewAlignment,
} from "../shared/constants/UIKitConstants";
import { MessageEvents } from "../shared/events";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { CometChatMessageEvents } from "../shared/events/CometChatMessageEvents";
import { CometChatMessageComposerAction, DeepPartial } from "../shared/helper/types";
import { Icon } from "../shared/icons/Icon";
import { CometChatSendButtonView } from "../shared/views/CometChatSendButtonView/CometChatSendButtonView";
import {
  getUnixTimestampInMilliseconds,
  messageStatus,
} from "../shared/utils/CometChatMessageHelper";
import { CommonUtils } from "../shared/utils/CommonUtils";
import { isCursorWithinMentionRange, getMentionRangeAtCursor } from "../shared/utils/MentionUtils";
import { permissionUtil } from "../shared/utils/PermissionUtil";
import { CometChatMediaRecorder } from "../shared/views/CometChatMediaRecorder";
import { useTheme } from "../theme";
import { ICONS } from "./resources";
import { CometChatTheme } from "../theme/type";
import { deepMerge } from "../shared/helper/helperFunctions";
import { JSX } from "react";
import { useCometChatTranslation } from "../shared/resources/CometChatLocalizeNew";
// Multiple Attachment Support — U8
// §5.0 — canonical DD name (CometChatAttachmentPreview is the back-compat alias)
import { CometChatAttachmentTray } from "../shared/views/CometChatAttachmentPreview";
import { CometChatMediaViewer } from "../shared/views/CometChatMediaViewer";
import { SelectedAttachment, toAttachmentFile } from "../shared/modals/SelectedAttachment";
import { UploadQueueService } from "../shared/services/UploadQueueService";
import { openMultiFileChooser } from "../shared/utils/openMultiFileChooser";
import { getFileUploadLimits, clampToServer, acceptPickedAttachments, toastAttachmentRejection } from "../shared/utils/attachmentLimits";
import { partitionAttachmentsByKind, AttachmentKindGroup } from "../shared/utils/partitionAttachmentsByKind";
import { attachmentCountLabel } from "../shared/utils/conversationUtils";
import { CometChatComposerErrorBanner } from "../shared/views/CometChatComposerErrorBanner";

type MentionOverlap = {
  key: string;
  value: SuggestionItem;
  start: number;
  end: number;
};

const { FileManager, CommonUtil } = NativeModules;

const uiEventListenerShow = "uiEvent_show_" + Date.now() + "_" + (++__listenerIdCounter);
const uiEventListenerHide = "uiEvent_hide_" + Date.now() + "_" + (++__listenerIdCounter);

const AttachIconButton = (props: {
  onPress: TouchableWithoutFeedbackProps["onPress"];
  icon: ImageSourcePropType | JSX.Element;
  iconStyle: ImageStyle;
}) => {
  return (
    <TouchableOpacity testID="CometChatComposer.attach" onPress={props.onPress}>
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

const ActionSheetBoard = (props: any) => {
  const { shouldShow = false, onClose = () => {}, onDismiss, options = [], sheetRef, style } = props;
  return (
    <CometChatBottomSheet
      style={{ maxHeight: Dimensions.get("window").height * 0.49 }}
      ref={sheetRef}
      onClose={onClose}
      onDismiss={onDismiss}
      isOpen={shouldShow}
      doNotOccupyEntireHeight
    >
      <CometChatActionSheet actions={options} style={style} />
    </CometChatBottomSheet>
  );
};

const RecordAudio = (props: any) => {
  const {
    shouldShow = false,
    onClose = () => {},
    options = [],
    cometChatBottomSheetStyle = {},
    sheetRef,
    onPause = () => {},
    onPlay = () => {},
    onSend = (recordedFile: String) => {},
    onStop = (recordedFile: String) => {},
    onStart = () => {},
    mediaRecorderStyle,
    ...otherProps
  } = props;
  return (
    <CometChatBottomSheet
      ref={sheetRef}
      onClose={onClose}
      style={cometChatBottomSheetStyle}
      isOpen={shouldShow}
      doNotOccupyEntireHeight
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

type Enumerate<N extends number, Acc extends number[] = []> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;

type IntRange<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>;

/**
 * Properties for the CometChat message composer component.
 */
export interface CometChatMessageComposerInterface {
  /**
   * Message composer identifier.
   *
   * @type {string | number}
   */
  id?: string | number;

  /**
   * CometChat SDK's user object.
   *
   * @type {CometChat.User}
   */
  user?: CometChat.User;

  /**
   * CometChat SDK's group object.
   *
   * @type {CometChat.Group}
   */
  group?: CometChat.Group;

  /**
   * Flag to turn off sound for outgoing messages.
   *
   * @type {boolean}
   */
  disableSoundForOutgoingMessages?: boolean;

  /**
   * Custom audio sound to be played while sending messages.
   *
   * @type {*}
   */
  customSoundForOutgoingMessage?: any;

  /**
   * Flag to disable typing events.
   *
   * @type {boolean}
   */
  disableTypingEvents?: boolean;

  /**
   * Initial text to be displayed in the composer.
   *
   * @type {string}
   */
  initialComposertext?: string;

  /**
   * Renders a preview section at the top of the composer.
   *
   * @param {Object} props - The component properties.
   * @param {CometChat.User} [props.user] - The user object.
   * @param {CometChat.Group} [props.group] - The group object.
   * @returns {JSX.Element} The header view element.
   */
  HeaderView?: ({ user, group }: { user?: CometChat.User; group?: CometChat.Group }) => JSX.Element;

  /**
   * Callback triggered when the input text changes.
   *
   * @param {string} text - The updated text.
   */
  onTextChange?: (text: string) => void;

  /**
   * Returns the attachment options for the composer.
   *
   * @param {Object} props - The function properties.
   * @param {CometChat.User} [props.user] - The user object.
   * @param {CometChat.Group} [props.group] - The group object.
   * @param {Map<any, any>} props.composerId - The composer identifier as a Map.
   * @returns {CometChatMessageComposerAction[]} An array of composer actions.
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
   *
   * @param {Object} props - The function properties.
   * @param {CometChat.User} [props.user] - The user object.
   * @param {CometChat.Group} [props.group] - The group object.
   * @param {string | number} props.composerId - The composer identifier.
   * @returns {JSX.Element} A custom auxiliary button component.
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
   * Replaces the default Send Button.
   *
   * @param {Object} props - The function properties.
   * @param {CometChat.User} [props.user] - The user object.
   * @param {CometChat.Group} [props.group] - The group object.
   * @param {string | number} props.composerId - The composer identifier.
   * @returns {JSX.Element} A custom send button component.
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
   *
   * @type {string | number}
   */
  parentMessageId?: string | number;

  /**
   * Custom styles for the message composer component.
   */
  style?: DeepPartial<CometChatTheme["messageComposerStyles"]>;

  /**
   * Flag to hide the voice recording button.
   *
   * @type {boolean}
   */
  hideVoiceRecordingButton?: boolean;

  /**
   * Callback triggered when the send button is pressed.
   *
   * @param {CometChat.BaseMessage} message - The base message object.
   */
  onSendButtonPress?: (message: CometChat.BaseMessage) => void;

  /**
   * Callback triggered when an error occurs.
   *
   * @param {CometChat.CometChatException} error - The error object.
   */
  onError?: (error: CometChat.CometChatException) => void;

  /**
   * Override properties for the KeyboardAvoidingView.
   */
  keyboardAvoidingViewProps?: KeyboardAvoidingViewProps;

  /**
   * Collection of text formatter classes to apply custom formatting.
   *
   * @type {Array<CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter>}
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
   * When true, the alias suggestion will not appear.
   * @default false
   */
  disableMentionAll?: boolean;

  /**
   * Custom alias label for the group-wide mention.
   * Rendered as @Alias in composer and bubbles.
   * Internally stored as <@all:Alias>.
   * @default "all"
   */
  mentionAllLabel?: string;

  /**
   * Controls image quality when taking pictures from the camera.
   * A value of 100 means no compression.
   *
   * @default 20
   * @type {IntRange<1, 100>}
   */
  imageQuality?: IntRange<1, 100>;

  /**
   * Enables the multiple-attachment workflow (staging tray + multi-upload; a send
   * fans out into one message per kind). When `false`, attachments use the legacy
   * single-select, send-immediately path (one picker → one message, no tray).
   * @default true
   */
  enableMultipleAttachments?: boolean;

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
   * If true, hides the collaborative document option (e.g., shared document editing).
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
   * If true, hides the stickers button from the composer.
   */
  hideStickersButton?: boolean;

  /**
   * If true, hides the send button from the composer.
   */
  hideSendButton?: boolean;

  /**
   * If true, hides all auxiliary buttons (such as voice input, GIFs, or other plugin buttons).
   */
  hideAuxiliaryButtons?: boolean;
  /**
   * Returns the attachment options for the composer.
   *
   * @param {Object} props - The function properties.
   * @param {CometChat.User} [props.user] - The user object.
   * @param {CometChat.Group} [props.group] - The group object.
   * @param {Map<any, any>} props.composerId - The composer identifier as a Map.
   * @returns {CometChatMessageComposerAction[]} An array of composer actions.
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
   * Determines the alignment of auxiliary buttons (e.g., sticker button).
   * Can be either "left" or "right".
   *
   * @default "left"
   */
  auxiliaryButtonsAlignment?: "left" | "right";
  /**
   * Custom send button view for AI agents (only applies to @agentic users)
   */
  AgentSendButtonView?: React.ComponentType<{
    isButtonDisabled: boolean;
    composerRef: any;
  }>;
}

export const CometChatMessageComposer = React.forwardRef(
  (props: CometChatMessageComposerInterface, ref) => {
    const editMessageListenerID = "editMessageListener_" + Date.now() + "_" + (++__listenerIdCounter);
    const replyMessageListenerID = "replyMessageListener_" + Date.now() + "_" + (++__listenerIdCounter);
    const UiEventListenerID = "UiEventListener_" + Date.now() + "_" + (++__listenerIdCounter);

    const theme = useTheme();
    const {t} = useCometChatTranslation()
    // Attachment error/info messages show as a red banner just above the tray (rendered below).
    const [attachmentBannerMessage, setAttachmentBannerMessage] = React.useState<string | null>(null);
    const [attachmentBannerHeight, setAttachmentBannerHeight] = React.useState(0);
    const attachmentBannerTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const showToast = useCallback((message: string) => {
      setAttachmentBannerMessage(message);
      if (attachmentBannerTimer.current) clearTimeout(attachmentBannerTimer.current);
      attachmentBannerTimer.current = setTimeout(() => setAttachmentBannerMessage(null), 4000);
    }, []);
    useEffect(() => () => { if (attachmentBannerTimer.current) clearTimeout(attachmentBannerTimer.current); }, []);
    const {
      id,
      user,
      group,
      disableSoundForOutgoingMessages = true,
      customSoundForOutgoingMessage,
      disableTypingEvents: propDisableTypingEvents,
      initialComposertext,
      HeaderView,
      onTextChange,
      attachmentOptions,
      AuxiliaryButtonView,
      SendButtonView,
      parentMessageId,
      style = {},
      onSendButtonPress,
      onError,
      hideVoiceRecordingButton: propHideVoiceRecordingButton,
      keyboardAvoidingViewProps,
      textFormatters,
      disableMentions: propDisableMentions,
      disableMentionAll = false,
      mentionAllLabel = "all",
      imageQuality = 20,
      hideCameraOption = false,
      hideImageAttachmentOption = false,
      hideVideoAttachmentOption = false,
      hideAudioAttachmentOption = false,
      hideFileAttachmentOption = false,
      hidePollsAttachmentOption = false,
      hideCollaborativeDocumentOption = false,
      hideCollaborativeWhiteboardOption = false,
      hideAttachmentButton: propHideAttachmentButton = false,
      hideStickersButton: propHideStickersButton = false,
      hideSendButton = false,
      hideAuxiliaryButtons = false,
      addAttachmentOptions,
      auxiliaryButtonsAlignment = "left",
      AgentSendButtonView,
      // §1 — false → legacy single-select, send-immediately attachments (no tray/fan-out).
      enableMultipleAttachments = true,
    } = props;

    // Helper function to check if user is agentic
    const isAgenticUser = useCallback(() => {
      return user?.getRole?.() === '@agentic';
    }, [user]);

    // Apply automatic hiding for @agentic users
    const disableTypingEvents = isAgenticUser() ? true : propDisableTypingEvents;
    const disableMentions = isAgenticUser() ? true : propDisableMentions;
    const hideAttachmentButton = isAgenticUser() ? true : propHideAttachmentButton;
    const hideStickersButton = isAgenticUser() ? true : propHideStickersButton;
    const hideVoiceRecordingButton = isAgenticUser() ? true : propHideVoiceRecordingButton;

    const composerIdMap = new Map().set("parentMessageId", parentMessageId);
    const parentMessageIdRef = useRef<string | null>(null);

    const mergedComposerStyle: CometChatTheme["messageComposerStyles"] = useMemo(() => {
      const mergedStyle = deepMerge(theme.messageComposerStyles, style);
      if (isAgenticUser()) {
        return {
          ...mergedStyle,
          messageInputStyles: {
            ...mergedStyle.messageInputStyles,
            dividerStyle: {
              display: 'none'
            }
          }
        };
      }
      return mergedStyle;
    }, [theme, style, isAgenticUser]);



    const loggedInUser = React.useRef<any>({});
    const chatWith = React.useRef<any>(null);
    const chatWithId = React.useRef<any>(null);
    const messageInputRef = React.useRef<any>(null);
    const chatRef = React.useRef<any>(chatWith);
    const inputValueRef = React.useRef<any>(null);
    const plainTextInput = React.useRef<string>(initialComposertext || "");
    let mentionMap = React.useRef<Map<string, SuggestionItem>>(new Map());
    let trackingCharacters = React.useRef<string[]>([]);
    let allFormatters = React.useRef<
      Map<string, CometChatTextFormatter | CometChatMentionsFormatter>
    >(new Map());
    let activeCharacter = React.useRef("");
    let searchStringRef = React.useRef("");

    const [selectionPosition, setSelectionPosition] = React.useState<any>({});
    const [inputMessage, setInputMessage] = React.useState<string | JSX.Element>(
      initialComposertext || ""
    );
    const [isStreaming, setIsStreaming] = React.useState(false);

    useEffect(() => {
      const sub = streamingState$.subscribe((streaming) => {
        setIsStreaming(streaming);
        if (!streaming) setShowStopButton(false);
      });
      return () => sub.unsubscribe();
    }, []);
    const [showActionSheet, setShowActionSheet] = React.useState(false);
    const [showRecordAudio, setShowRecordAudio] = React.useState(false);
    const [actionSheetItems, setActionSheetItems] = React.useState<any[]>([]);
    // iOS: holds a picker launch that must wait until the action sheet's modal has
    // fully dismissed — UIKit can't present the picker while the modal is dismissing.
    // Fired from the sheet's onDismiss. Unused on Android (picker launches inline).
    const pendingAttachmentActionRef = React.useRef<(() => void) | null>(null);
    const [messagePreview, setMessagePreview] = React.useState<any>();
    const [replyMessage, setReplyMessage] = React.useState<any>();
    // Ref to hold current replyMessage value to avoid stale closures in attachment handlers
    const replyMessageRef = React.useRef(replyMessage);
    const [CustomView, setCustomView] = React.useState(null);
    const [CustomViewHeader, setCustomViewHeader] = React.useState<React.FC | React.ReactNode>(
      null
    );
    const [CustomViewFooter, setCustomViewFooter] = React.useState<React.FC | React.ReactNode>();
    const [isVisible, setIsVisible] = React.useState(false);
    const [kbOffset, setKbOffset] = React.useState(59);
    const [showMentionList, setShowMentionList] = React.useState(false);
    const [mentionsSearchData, setMentionsSearchData] = React.useState<Array<SuggestionItem>>([]);
    const [suggestionListLoader, setSuggestionListLoader] = React.useState(false);
    const [warningMessage, setWarningMessage] = React.useState("");
    const [originalText, setOriginalText] = React.useState<string>("");
    const [hasEdited, setHasEdited] = React.useState<boolean>(false);
    const [selectedAttachments, setSelectedAttachments] = React.useState<SelectedAttachment[]>([]);
    // Live mirror of the staged count — the picker/paste handlers can be invoked from
    // memoized closures that captured an older count, so read the CURRENT tray size from
    // this ref when enforcing the count limit (avoids letting picks slip past the max).
    const selectedAttachmentsRef = React.useRef<SelectedAttachment[]>([]);
    React.useEffect(() => {
      selectedAttachmentsRef.current = selectedAttachments;
    }, [selectedAttachments]);

    const [trayViewerVisible, setTrayViewerVisible] = React.useState(false);
    const [trayViewerIndex, setTrayViewerIndex] = React.useState(0);
    const [plainText, setPlainText] = React.useState(initialComposertext ?? "");
    const bottomSheetRef = React.useRef<any>(null);
    const [showStopButton, setShowStopButton] = React.useState(false);
    const [isSendButtonDisabledForDelay, setIsSendButtonDisabledForDelay] = React.useState(false);
    const sendButtonDelayTimer = React.useRef<NodeJS.Timeout | null>(null);

    const closeReplyPreview = useCallback(() => {
      setReplyMessage(null);
    }, []);

    // Reset streaming state when component mounts 
    const defaultAuxiliaryButtonOptions = useMemo(() => {
      if (hideAuxiliaryButtons) return [];
      return ChatConfigurator.getDataSource().getAuxiliaryOptions(user, group, composerIdMap, {
        stickerIcon: mergedComposerStyle.stickerIcon as ImageSourcePropType | JSX.Element,
        stickerIconStyle: mergedComposerStyle.stickerIconStyle as {
          active: ImageStyle;
          inactive: ImageStyle;
        },
        hideStickersButton,
        replyToMessage: replyMessage?.message,
        closeReplyPreview,
      });
    }, [mergedComposerStyle, hideStickersButton, hideAuxiliaryButtons, replyMessage, closeReplyPreview]);

    // Multi-attachment: one UploadQueueService per composer mount
    const uploadQueue = useMemo(
      () =>
        new UploadQueueService({
          onProgress: (fileId, percent) => {
            setSelectedAttachments(prev =>
              prev.map(a =>
                a.fileId === fileId ? { ...a, uploadState: 'UPLOADING', uploadProgress: percent } : a
              )
            );
          },
          onFileComplete: (fileId, attachment) => {
            setSelectedAttachments(prev =>
              prev.map(a =>
                a.fileId === fileId
                  ? { ...a, uploadState: 'COMPLETED', uploadProgress: 100, uploadedAttachment: attachment }
                  : a
              )
            );
          },
          onFileFailed: (fileId, error) => {
            // Retryable network/server failure — show ⚠ tap-to-retry affordance
            setSelectedAttachments(prev =>
              prev.map(a =>
                a.fileId === fileId ? { ...a, uploadState: 'FAILED', errorKey: 'UPLOAD_FAILED', rawError: error } : a
              )
            );
          },
          onFileRejected: (fileId, error) => {
            // Store the SDK error code; the user sees WHY by tapping the errored tile (no auto-toast,
            // so several rejections can't spam). See handleTrayTilePress → toastAttachmentRejection.
            const code = error?.code ?? (error as any)?.getCode?.();
            setSelectedAttachments(prev =>
              prev.map(a =>
                a.fileId === fileId ? { ...a, uploadState: 'REJECTED', errorKey: 'ATTACHMENT_UPLOAD_UNAVAILABLE', errorCode: code, rawError: error } : a
              )
            );
          },
          onAllComplete: () => {
            // Send is driven by the send button, not by this callback.
          },
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    const updateAttachment = useCallback(
      (fileId: string, patch: Partial<SelectedAttachment>) => {
        setSelectedAttachments(prev =>
          prev.map(a => (a.fileId === fileId ? { ...a, ...patch } : a))
        );
      },
      []
    );

    const handlePickFiles = useCallback(
      async (pickerType: 'media' | 'document' | 'camera' | 'audio') => {
        // Live staged count (ref), not the possibly-stale closure value.
        const existingCount = selectedAttachmentsRef.current.length;
        // Server-authoritative upload limits (file.count.max / per-file file.size.max),
        // clamped tighten-only against any developer override (§5.1 / §6.1).
        const serverLimits = await getFileUploadLimits();
        const maxCount = clampToServer(undefined, serverLimits.fileCountMax);

        // Always open the picker (even at capacity) so the button never feels broken. Enforcement is
        // on selection: acceptPickedAttachments rejects the whole over-limit pick + shows the toast.
        const picked = await openMultiFileChooser(pickerType, existingCount, maxCount);
        if (picked.length === 0) return;

        // §6.3 — over the count limit → reject the whole pick (see acceptPickedAttachments). Per-file
        // SIZE is enforced by the SDK (ERR_FILE_SIZE_EXCEEDED → onFileRejected), not here.
        const accepted = acceptPickedAttachments(picked, { maxCount, existingCount }, { showToast, t });
        if (accepted.length === 0) return;

        const newAttachments: SelectedAttachment[] = accepted.map(f => ({
          fileId: '_' + Math.random().toString(36).substr(2, 9),
          file: toAttachmentFile(f),
          uploadState: 'NONE',
          uploadProgress: 0,
        }));

        setSelectedAttachments(prev => {
          const next = [...prev, ...newAttachments];
          // Mirror the ref SYNCHRONOUSLY so a quick second pick reads the exact count (not the stale
          // post-render useEffect value). Otherwise existingCount under-counts, the pick gate lets too
          // many through, and the shared SDK upload group overflows file.count.max → ERR_FILE_COUNT_EXCEEDED
          // even though the tray shows fewer than the limit.
          selectedAttachmentsRef.current = next;
          return next;
        });
        // Pass the target conversation so the SDK can hand receiver/receiverType to the server for
        // RBAC/SBAC presign authorization. Read the refs fresh here (uploadQueue is memoized at mount,
        // the refs are not) — constructor-time capture would be stale.
        newAttachments.forEach(a =>
          uploadQueue.enqueue(a, { receiver: chatWithId.current, receiverType: chatWith.current })
        );
      },
      [selectedAttachments, uploadQueue]
    );

    const handleRemoveAttachment = useCallback(
      (fileId: string) => {
        uploadQueue.dequeue(fileId);
        setSelectedAttachments(prev => {
          const next = prev.filter(a => a.fileId !== fileId);
          selectedAttachmentsRef.current = next;   // keep the ref exact for the next pick's count gate
          return next;
        });
      },
      [uploadQueue]
    );

    const handleRetryAttachment = useCallback(
      (fileId: string) => {
        const attachment = selectedAttachments.find(a => a.fileId === fileId);
        if (!attachment) return;
        updateAttachment(fileId, { uploadState: 'NONE', uploadProgress: 0, errorKey: undefined });
        uploadQueue.retry(fileId, { ...attachment, uploadState: 'NONE', uploadProgress: 0 });
      },
      [selectedAttachments, updateAttachment, uploadQueue]
    );

    // §8.2 — staged-attachment media items for tray preview viewer (local URIs)
    const trayMediaItems = React.useMemo(() => {
      return selectedAttachments
        .filter(a => a.file.type.startsWith('image/') || a.file.type.startsWith('video/'))
        .map(a => ({
          getUrl: () => a.file.uri,
          getMimeType: () => a.file.type,
          getName: () => a.file.name,
          getSize: () => a.file.size || 0,
        } as unknown as CometChat.Attachment));
    }, [selectedAttachments]);

    const handleTrayTilePress = useCallback((fileId: string) => {
      const att = selectedAttachments.find(a => a.fileId === fileId);
      if (!att) return;
      // DEBUG — dump the real SDK error for a tapped errored tile.
      // Rejected tile → tap reveals WHY it failed (size, etc.) as a toast.
      if (att.uploadState === 'REJECTED') {
        toastAttachmentRejection(att, { showToast, t });
        return;
      }
      const mediaOnly = selectedAttachments.filter(
        a => a.file.type.startsWith('image/') || a.file.type.startsWith('video/')
      );
      const idx = mediaOnly.findIndex(a => a.fileId === fileId);
      if (idx < 0) return;
      setTrayViewerIndex(idx);
      setTrayViewerVisible(true);
    }, [selectedAttachments, showToast, t]);

    useEffect(() => {
      setShowStopButton(false);
      setIsStreaming(false);

      // Cleanup function to clear the delay timer on unmount
      return () => {
        if (sendButtonDelayTimer.current) {
          clearTimeout(sendButtonDelayTimer.current);
        }
        uploadQueue.cancelAll();
      };
    }, []);

    useLayoutEffect(() => {
      if (Platform.OS === "ios") {
        if (Number.isInteger(commonVars.safeAreaInsets.top)) {
          setKbOffset(commonVars.safeAreaInsets.top ?? 0);
          return;
        }
        CommonUtil.getSafeAreaInsets().then((res: any) => {
          if (Number.isInteger(res.top)) {
            commonVars.safeAreaInsets.top = res.top;
            commonVars.safeAreaInsets.bottom = res.bottom;
            setKbOffset(res.top);
          }
        });
      }
    }, []);

    const isTyping = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Event callback
     */
    React.useImperativeHandle(ref, () => ({
      previewMessageForEdit: previewMessage,
      sendTextMessage,
      getText: () => messageInputRef.current?.getText?.() ?? "",
      setText: (text: string) => {
        plainTextInput.current = text;
        setPlainText(text);
        messageInputRef.current?.setNativeProps?.({ text });
      },
      clear: () => messageInputRef.current?.clear?.(),
      resetStreaming: () => {
        setShowStopButton(false);
        setIsStreaming(false);
        try {
          stopStreamingForRunId();
        } catch (error) {
          // console.log(error); // Removed debug log
        }
      }
    }));

    useLayoutEffect(() => {
      if (warningMessage) {
        setCustomViewHeader(
          <View
            style={
              {
                flexDirection: "row",
                alignItems: "center",
                padding: theme.spacing.padding.p2,
                borderRadius: mergedComposerStyle?.containerStyle?.borderRadius,
                backgroundColor: mergedComposerStyle?.containerStyle?.backgroundColor,
                borderColor: mergedComposerStyle?.containerStyle?.borderColor,
                borderWidth: mergedComposerStyle?.containerStyle?.borderWidth,
                marginBottom: 2,
              } as ViewStyle
            }
          >
            <Icon name='info-fill' color={theme.color.error}></Icon>
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
    }, [warningMessage, theme]);

    // Keep replyMessageRef in sync with replyMessage state
    useEffect(() => {
      replyMessageRef.current = replyMessage;
    }, [replyMessage]);

    const previewMessage = ({ message, status }: any) => {
      if (status === messageStatus.inprogress) {
        // Don't clear reply preview here - it needs to remain available for sendMediaMessage
        // The reply preview will be cleared after successful send in sendMediaMessage (line 1127)

        // Media messages carry their editable text in the caption, not `.text`.
        const editSourceText =
          typeof message?.getCaption === "function"
            ? (message.getCaption() ?? "")
            : (message?.text ?? "");
        let textComponents = editSourceText;

        let rawText = editSourceText;

        let users: any = {};
        let regexes: Array<RegExp> = [];

        allFormatters.current.forEach((formatter: CometChatTextFormatter, key) => {
          formatter.handleComposerPreview(message);
          if (!regexes.includes(formatter.getRegexPattern())) {
            regexes.push(formatter.getRegexPattern());
          }
          let suggestionUsers = formatter.getSuggestionItems();
          suggestionUsers.forEach((item) => (users[item.underlyingText] = item));
          let resp = formatter.getFormattedText(textComponents);
          if (formatter instanceof CometChatMentionsFormatter) {
            getMentionLimitView(formatter);
          }

          textComponents = resp;
        });

        let edits: any = [];

        regexes.forEach((regex) => {
          let match: any;
          while ((match = regex.exec(rawText)) !== null) {
            const user = users[match[0]];
            if (user) {
              edits.push({
                startIndex: match.index,
                endIndex: regex.lastIndex,
                replacement: user.promptText,
                user,
              });
            }
          }
        });

        // Sort edits by startIndex to apply them in order
        edits.sort((a: any, b: any) => a.startIndex - b.startIndex);

        plainTextInput.current = getPlainString(editSourceText, edits) ?? "";
        setPlainText(plainTextInput.current);
        setOriginalText(plainTextInput.current.trim());
        setHasEdited(false);
        const hashMap = new Map();
        let offset = 0; // Tracks shift in position due to replacements

        edits.forEach((edit: any) => {
          const adjustedStartIndex = edit.startIndex + offset;
          rawText =
            rawText.substring(0, adjustedStartIndex) +
            edit.replacement +
            rawText.substring(edit.endIndex);
          offset += edit.replacement.length - (edit.endIndex - edit.startIndex);
          const rangeKey = `${adjustedStartIndex}_${adjustedStartIndex + edit.replacement.length}`;
          hashMap.set(rangeKey, edit.user);
        });

        mentionMap.current = hashMap;
        setMessagePreview({
          message: message,
          mode: ConversationOptionConstants.edit,
        });

        inputValueRef.current = textComponents ?? "";
        setInputMessage(textComponents ?? "");
        messageInputRef.current.focus();
      }
    };

    const previewReplyMessage = (message: any) => {
      // Clear edit preview if it exists
      if (messagePreview) {
        setMessagePreview(null);
        mentionMap.current = new Map();
        plainTextInput.current = "";
        setOriginalText("");
      }

      setReplyMessage({
        message: message,
        mode: ConversationOptionConstants.reply,
      });

      try {
        messageInputRef.current?.focus();
      } catch (error) {
        // console.log(error); // Removed debug log
      }
    };

    const cameraCallback = async (cameraImage: any) => {
      if (CheckPropertyExists(cameraImage, "error")) {
        return;
      }
      const { name, uri, type } = cameraImage;
      let file = {
        name,
        type,
        uri,
      };
      sendMediaMessage(chatWithId.current, file, MessageTypeConstants.image, chatWith.current);
    };

    // The actual picker presentation. Split out from fileInputHandler so it can be
    // launched inline (Android) or deferred to the sheet's onDismiss (iOS).
    const launchPicker = async (fileType: string) => {
      // §1 — MULTI (default): route image/video/file/camera through the staging tray.
      if (enableMultipleAttachments) {
        if (
          fileType === MessageTypeConstants.image ||
          fileType === MessageTypeConstants.video
        ) {
          await handlePickFiles('media');
          return;
        }
        if (fileType === MessageTypeConstants.file) {
          await handlePickFiles('document');
          return;
        }
        if (fileType === MessageTypeConstants.audio) {
          await handlePickFiles('audio');
          return;
        }
        if (fileType === MessageTypeConstants.takePhoto) {
          if (!(await permissionUtil.startResourceBasedTask(["camera"]))) {
            return;
          }
          await handlePickFiles('camera');
          return;
        }
      }

      // §1 — LEGACY single-select, send-immediately (flag=false, or audio/other types):
      // one picker → one MediaMessage, no tray/multi-upload.
      if (fileType === MessageTypeConstants.takePhoto) {
        if (!(await permissionUtil.startResourceBasedTask(["camera"]))) return;
        const onCapture = (result: any) => {
          if (result && !CheckPropertyExists(result, "error") && result.uri) {
            sendMediaMessage(chatWithId.current, { name: result.name, type: result.type, uri: result.uri }, MessageTypeConstants.image, chatWith.current);
          }
        };
        if (Platform.OS === "ios") FileManager.openCamera("image", onCapture);
        else FileManager.openCamera("image", 50, onCapture);
        return;
      }
      if (Platform.OS === "ios" && fileType === MessageTypeConstants.video) {
        NativeModules.VideoPickerModule.pickVideo((file: any) => {
          if (file.uri)
            sendMediaMessage(
              chatWithId.current,
              file,
              MessageTypeConstants.video,
              chatWith.current
            );
        });
      } else
        FileManager.openFileChooser(fileType, async (fileInfo: any) => {
          if (CheckPropertyExists(fileInfo, "error")) {
            return;
          }
          let { name, uri, type } = fileInfo;
          let file = {
            name,
            type,
            uri,
          };
          sendMediaMessage(chatWithId.current, file, fileType, chatWith.current);
        });
    };

    const fileInputHandler = (fileType: string) => {
      // Always close the attachment sheet first.
      // iOS: UIKit can't present the picker while the sheet's modal is still
      // dismissing, so stash the launch and fire it from the modal's onDismiss
      // (see the ActionSheetBoard below). Android has no such restriction, so launch
      // immediately as the sheet closes.
      if (Platform.OS === "ios") {
        pendingAttachmentActionRef.current = () => {
          void launchPicker(fileType);
        };
        setShowActionSheet(false);
        return;
      }
      setShowActionSheet(false);
      void launchPicker(fileType);
    };

    const playAudio = () => {
      if (customSoundForOutgoingMessage) {
        CometChatSoundManager.play(
          CometChatSoundManager.SoundOutput.outgoingMessage,
          customSoundForOutgoingMessage
        );
      } else {
        CometChatSoundManager.play(CometChatSoundManager.SoundOutput.outgoingMessage);
      }
    };

    const sendMultiAttachmentMediaMessage = useCallback(() => {
      // Guard: never ship a partial batch. If any staged tile errored (FAILED/REJECTED), block
      // the send until the user removes it (the send button is also disabled in this state).
      if (selectedAttachmentsRef.current.some(a => a.uploadState === 'FAILED' || a.uploadState === 'REJECTED')) {
        return;
      }
      const completed = uploadQueue.completedAttachments;
      if (completed.length === 0) return;

      // Prefer the SDK's upload batch id (DD §5.3) as the message batchId; captured BEFORE cancelAll
      // releases the request. Fall back to a client timestamp id when the SDK doesn't expose one.
      const sdkBatchId = uploadQueue.batchId;

      // Release the SDK upload group + clear the queue's completed set so the NEXT pick starts a FRESH
      // group. Without this the already-sent attachments linger in `completed` and get re-included in
      // the next send (e.g. send 3 images, then add 1 → the next send ships all 4).
      uploadQueue.cancelAll();

      // §7 — FAN OUT: partition the completed tiles by kind and send ONE MediaMessage per
      // non-empty kind (Images → Videos → Files; picker audio → file), all sharing one
      // batchId. Each message gets its own muid; the caption goes on the LAST message only.
      const groups = partitionAttachmentsByKind(completed);
      if (groups.length === 0) return;

      const batchId = sdkBatchId ?? String(getUnixTimestampInMilliseconds());
      // §8.4 — total attachments across the whole batch, so the conversation-list preview can
      // aggregate ("N attachments") from just the last fanned-out message it receives.
      const batchTotalCount = groups.reduce((sum, g) => sum + g.attachments.length, 0);
      const caption = plainTextInput.current.trim();
      const currentReplyMessage = replyMessageRef.current;
      const replyMessageId = currentReplyMessage?.message?.getId?.() ?? null;

      // ENG-36991 — clear the swipe-to-reply preview UP-FRONT (the quote is captured above), so a
      // throw anywhere in the fan-out/teardown below can't leave the reply preview stuck on a real
      // device (it worked on the emulator, not on device). The reset block below is now redundant.
      setReplyMessage(null);
      replyMessageRef.current = null;

      // Fresh MediaMessage for a group — used for both the optimistic echo and the send.
      const buildMessage = (group: AttachmentKindGroup, index: number, muid: string) => {
        const m = new CometChat.MediaMessage(chatWithId.current, null, group.type, chatWith.current);
        m.setSender(loggedInUser.current);
        m.setMuid(muid);
        // setAttachments() writes data.attachments (validateMessage + FormData read there).
        m.setAttachments(group.attachments);
        // §7/§8.3a batch contract — lets the message list group the fanned-out messages.
        m.setMetadata({ batchId, batchIndex: index, batchSize: groups.length, batchTotalCount });
        if (index === groups.length - 1 && caption) m.setCaption(caption); // caption on LAST only
        if (parentMessageId) m.setParentMessageId(parentMessageId as number); // thread parent on ALL
        // Quoted reply on the FIRST message of the batch only — otherwise every fanned-out bubble
        // shows the "replying to X" quote. (Thread parentMessageId above stays on all.)
        if (replyMessageId && currentReplyMessage?.message && index === 0) {
          if (typeof m.setQuotedMessage === 'function') m.setQuotedMessage(currentReplyMessage.message);
          if (typeof m.setQuotedMessageId === 'function') m.setQuotedMessageId(replyMessageId);
          (m as any).quotedMessage = currentReplyMessage.message;
          (m as any).quotedMessageId = replyMessageId;
        }
        return m;
      };

      groups.forEach((group, index) => {
        const muid = `${batchId}_${index}`;
        const localMessage = buildMessage(group, index, muid);

        // Optimistic (in-progress) bubble for this kind's message, keyed by its muid.
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, {
          message: localMessage,
          status: messageStatus.inprogress,
        });

        // §7/§12.1 — independent per-message send: one kind can fail while others deliver.
        const outgoing = buildMessage(group, index, muid);
        CometChat.sendMediaMessage(outgoing)
          .then((msg: any) => {
            CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, {
              message: msg,
              status: messageStatus.success,
            });
            if (replyMessageId) {
              CometChatMessageEvents.emit(CometChatMessageEvents.ccReplyToMessage, {
                message: msg,
                status: messageStatus.success,
              });
            }
          })
          .catch((error: any) => {
            // Preserve the batch metadata; just flag this message's optimistic echo as failed.
            const currentData = localMessage.getData() || {};
            localMessage.setData({ ...currentData, metaData: { error: true } });
            const md = (localMessage.getMetadata?.() as Record<string, unknown>) || {};
            localMessage.setMetadata({ ...md, error: true });
            CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, {
              message: localMessage,
              status: messageStatus.error,
            });
            onError && onError(error);
          });
      });

      // Clear composer state immediately
      setSelectedAttachments([]);
      selectedAttachmentsRef.current = [];   // keep the ref exact so a pick right after send isn't gated on a stale count
      plainTextInput.current = '';
      inputValueRef.current = '';
      setPlainText('');
      setInputMessage('');
      setReplyMessage(null);

      if (!disableSoundForOutgoingMessages) {
        if (customSoundForOutgoingMessage) {
          CometChatSoundManager.play(
            CometChatSoundManager.SoundOutput.outgoingMessage,
            customSoundForOutgoingMessage
          );
        } else {
          CometChatSoundManager.play(CometChatSoundManager.SoundOutput.outgoingMessage);
        }
      }
    }, [
      uploadQueue,
      chatWithId,
      chatWith,
      loggedInUser,
      parentMessageId,
      replyMessageRef,
      disableSoundForOutgoingMessages,
      customSoundForOutgoingMessage,
      onError,
    ]);

    const clearInputBox = () => {
      inputValueRef.current = "";
      setPlainText("");
      setHasEdited(false);
      setInputMessage("");
      setWarningMessage("");
      setReplyMessage(null);
    };

    const clearEditPreview = () => {
      inputValueRef.current = "";
      setPlainText("");
      setHasEdited(false);
      setInputMessage("");
      setWarningMessage("");
    };

    const sendTextMessage = () => {
      setShowStopButton(true);

      //ignore sending new message
      if (messagePreview != null) {
        editMessage(messagePreview.message);
        return;
      }

      if (Platform.OS === "ios" && messageInputRef.current) {
        InteractionManager.runAfterInteractions(() => {
          let textToProcess = plainTextInput.current;
          if (typeof inputMessage === 'string' && inputMessage.trim().length > 0) {
            textToProcess = inputMessage;
          }

          processAndSendMessage(textToProcess);
        });
        return; // Exit early, processAndSendMessage will handle sending
      }

      // For non-iOS platforms, proceed normally
      processAndSendMessage(plainTextInput.current);
    };

    const processAndSendMessage = (textToProcess: string) => {
      let finalTextInput = getRegexString(textToProcess);
      let trimmedTextInput = finalTextInput.trim();

      if (trimmedTextInput.trim().length === 0) {
        return;
      }
      const currentReplyMessage = replyMessage;
      const replyMessageId = currentReplyMessage?.message?.getId?.() ?? null;

      let textMessage = new CometChat.TextMessage(
        chatWithId.current,
        trimmedTextInput,
        chatWith.current
      );

      textMessage.setSender(loggedInUser.current);
      textMessage.setReceiver(chatWith.current);
      textMessage.setText(trimmedTextInput);
      textMessage.setMuid(String(getUnixTimestampInMilliseconds()));

      // Handle parent message ID for threaded messages
      if (parentMessageId) {
        textMessage.setParentMessageId(parentMessageId as number);
      } else if (isAgenticUser() && parentMessageIdRef.current) {
        textMessage.setParentMessageId(Number(parentMessageIdRef.current));
      }

      // Handle reply message - set quoted message for replies
      if (replyMessageId && currentReplyMessage?.message) {
        try {
          // Use only the SDK's built-in quoted message functionality
          if (typeof textMessage.setQuotedMessage === 'function') {
            textMessage.setQuotedMessage(currentReplyMessage.message);
          }
          if (typeof textMessage.setQuotedMessageId === 'function') {
            textMessage.setQuotedMessageId(replyMessageId);
          }
        } catch (error) {
          // console.log(error); // Removed debug log
        }
      }

      allFormatters.current.forEach((item) => {
        textMessage = item.handlePreMessageSend(textMessage);
      });

      setMentionsSearchData([]);
      plainTextInput.current = "";

      // Clear input and reply message immediately for better UX
      inputValueRef.current = "";
      setPlainText("");
      setHasEdited(false);
      setInputMessage("");
      setWarningMessage("");
      setReplyMessage(null);

      // Clear the TextInput on iOS to remove auto-corrected text
      if (Platform.OS === "ios" && messageInputRef.current) {
        InteractionManager.runAfterInteractions(() => {
          try {
            messageInputRef.current?.setNativeProps?.({ text: "" });
            messageInputRef.current?.clear?.();
          } catch (error) {
            // Ignore errors when clearing
          }
        });
      }

      if (onSendButtonPress) {
        onSendButtonPress(textMessage);
        return;
      }

      CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, {
        message: textMessage,
        status: messageStatus.inprogress,
      });

      if (!disableSoundForOutgoingMessages) playAudio();

      // Enable 1-second delay for agentic users
      if (isAgenticUser()) {
        setIsSendButtonDisabledForDelay(true);
        if (sendButtonDelayTimer.current) {
          clearTimeout(sendButtonDelayTimer.current);
        }
        sendButtonDelayTimer.current = setTimeout(() => {
          setIsSendButtonDisabledForDelay(false);
        }, 1000);
      }

      CometChat.sendMessage(textMessage)
        .then((message: any) => {
          if (isAgenticUser() && !parentMessageId && message?.getId) {
            const messageId = typeof message.getId() === 'string' ? Number(message.getId()) : message.getId();
            if (!isNaN(messageId) && !parentMessageIdRef.current) {
              parentMessageIdRef.current = messageId;
            }
            if (messageId && !isNaN(messageId)) {
              startStreamingForRunId(String(messageId));
            }
          }

          CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, {
            message: message,
            status: messageStatus.success,
          });
        })
        .catch((error: any) => {
          onError && onError(error);
          textMessage.setMetadata({ error: true });
          CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, {
            message: textMessage,
            status: messageStatus.error,
          });
        });
    };

    /** edit message */
    const editMessage = (message: any) => {
      endTyping(null, null);

      let finalTextInput = getRegexString(plainTextInput.current);

      let messageText = finalTextInput.trim();

      // Media caption edit — keep the media (attachments) and update only the caption.
      // Mirrors the text path (fresh minimal message) so we don't PUT stale receipt/entity fields.
      const isMediaEdit =
        typeof message?.getCaption === "function" &&
        typeof message?.setCaption === "function";

      let outgoing: any;
      if (isMediaEdit) {
        // Same approach as the text edit below: build a FRESH message rather than reusing the one
        // the server sent us (which carries stale metadata + the prior moderation verdict). A clean
        // payload is re-moderated by the server just like a fresh send. Attachments are carried over
        // so the media survives the caption edit.
        const mediaMessage = new CometChat.MediaMessage(
          chatWithId.current,
          undefined as any,
          message.getType(),
          chatWith.current
        );
        mediaMessage.setId(message.getId ? message.getId() : message.id);
        const existingAttachments = message.getAttachments?.() ?? [];
        if (existingAttachments.length) mediaMessage.setAttachments(existingAttachments);
        mediaMessage.setCaption(messageText);
        parentMessageId && mediaMessage.setParentMessageId(parentMessageId as number);
        outgoing = mediaMessage;
      } else {
        let textMessage = new CometChat.TextMessage(
          chatWithId.current,
          messageText,
          chatWith.current
        );
        textMessage.setId(message.id);
        parentMessageId && textMessage.setParentMessageId(parentMessageId as number);
        outgoing = textMessage;
      }

      inputValueRef.current = "";
      clearInputBox();
      messageInputRef.current.textContent = "";

      setMessagePreview(null);

      if (onSendButtonPress) {
        onSendButtonPress(outgoing);
        return;
      }

      if (!disableSoundForOutgoingMessages) playAudio();

      CometChat.editMessage(outgoing)
        .then((editedMessage: any) => {
          inputValueRef.current = "";
          setInputMessage("");
          CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageEdited, {
            message: editedMessage,
            status: messageStatus.success,
          });
        })
        .catch((error: any) => {
          onError && onError(error);
        });
    };

    /** send media message */
    const sendMediaMessage = (
      receiverId?: any,
      messageInput?: any,
      messageType?: any,
      receiverType?: any,
      extraMetadata?: Record<string, any>
    ) => {
      setShowActionSheet(false);
      let mediaMessage = new CometChat.MediaMessage(
        receiverId,
        messageInput,
        messageType,
        receiverType
      );

      // The optimistic echo (localMessage) and the message actually sent
      // (mediaMessage) MUST share ONE muid. CometChatMessageList reconciles the
      // in-progress bubble with the delivered message via messageEdited(), which
      // matches by muid — and when no match is found it does nothing, so the
      // delivered message is dropped and the optimistic bubble is orphaned (no
      // echo until a refetch). Two independent getUnixTimestampInMilliseconds()
      // calls can land in different milliseconds, so they must not be used
      // separately here. This mirrors the working multi-attachment path.
      const sharedMuid = String(getUnixTimestampInMilliseconds());
      mediaMessage.setSender(loggedInUser.current);
      mediaMessage.setReceiver(receiverType);
      mediaMessage.setType(messageType);
      mediaMessage.setMuid(sharedMuid);
      mediaMessage.setData({
        type: messageType,
        category: CometChat.CATEGORY_MESSAGE,
        name: messageInput["name"],
        file: messageInput,
        url: messageInput["uri"],
        sender: loggedInUser.current,
      });
      // setMetadata MUST run AFTER setData: the SDK stores metadata inside `data`, and setData
      // replaces `data` wholesale — tagging before it would be wiped from the server payload
      // (e.g. audioType:"voice_note" would never round-trip, so recorded audio shows the wrong bubble).
      if (extraMetadata) {
        mediaMessage.setMetadata({ ...(mediaMessage.getMetadata() || {}), ...extraMetadata });
      }
      // Use ref to get current replyMessage value (avoids stale closure)
      const currentReplyMessage = replyMessageRef.current;
      const replyMessageId = currentReplyMessage?.message?.getId?.() ?? null;
      if (replyMessageId) {
        if (currentReplyMessage?.message) {
          if (typeof mediaMessage.setQuotedMessage === 'function') {
            mediaMessage.setQuotedMessage(currentReplyMessage.message);
          }
          if (typeof mediaMessage.setQuotedMessageId === 'function') {
            mediaMessage.setQuotedMessageId(replyMessageId);
          }
          // Store full message object directly on the message (not in metadata)
          (mediaMessage as any).quotedMessage = currentReplyMessage.message;
          (mediaMessage as any).quotedMessageId = replyMessageId;

          // Don't store in metadata - it exceeds size limit and SDK handles it
        }
      } else if (parentMessageId) {
        mediaMessage.setParentMessageId(parentMessageId as number);
      }

      let localMessage = new CometChat.MediaMessage(
        receiverId,
        messageInput,
        messageType,
        receiverType
      );

      localMessage.setSender(loggedInUser.current);
      localMessage.setReceiver(receiverType);
      localMessage.setType(messageType);
      // Same muid as the sent mediaMessage above — see note there. This is what
      // lets messageEdited() replace this optimistic bubble with the delivered one.
      localMessage.setMuid(sharedMuid);
      localMessage.setData({
        type: messageType,
        category: CometChat.CATEGORY_MESSAGE,
        name: messageInput["name"],
        file: messageInput,
        url: messageInput["uri"],
        sender: loggedInUser.current,
      });
      if (replyMessageId) {
        if (currentReplyMessage?.message) {
          if (typeof localMessage.setQuotedMessage === 'function') {
            localMessage.setQuotedMessage(currentReplyMessage.message);
          }
          if (typeof localMessage.setQuotedMessageId === 'function') {
            localMessage.setQuotedMessageId(replyMessageId);
          }
          (localMessage as any).quotedMessage = currentReplyMessage.message;
          (localMessage as any).quotedMessageId = replyMessageId;
          const currentMetadata = localMessage.getMetadata() || {};
          localMessage.setMetadata({
            ...currentMetadata,
            quotedMessage: currentReplyMessage.message,
            quotedMessageId: replyMessageId
          });
        }
      } else if (parentMessageId) {
        localMessage.setParentMessageId(parentMessageId as number);
      }
      localMessage.setData({
        type: messageType,
        category: CometChat.CATEGORY_MESSAGE,
        name: messageInput["name"],
        file: messageInput,
        url: messageInput["uri"],
        sender: loggedInUser.current,
        attachments: [messageInput],
        entities: {
          sender: {
            entity: loggedInUser.current,
          },
        },
      });
      // setMetadata AFTER the final setData (SDK stores metadata inside `data`, which setData
      // replaces) so the optimistic bubble carries the tag and matches the sent message.
      if (extraMetadata) {
        localMessage.setMetadata({ ...(localMessage.getMetadata() || {}), ...extraMetadata });
      }

      CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, {
        message: localMessage,
        status: messageStatus.inprogress,
      });

      if (!disableSoundForOutgoingMessages) playAudio();
      CometChat.sendMediaMessage(mediaMessage)
        .then((message: any) => {
          CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, {
            message: message,
            status: messageStatus.success,
          });
          if (replyMessageId) {
            CometChatMessageEvents.emit(CometChatMessageEvents.ccReplyToMessage, {
              message: message,
              status: messageStatus.success,
            });
          }
          setReplyMessage(null);
          setWarningMessage("");
          setShowRecordAudio(false);
        })
        .catch((error: any) => {
          setShowRecordAudio(false);
          if (error?.code === "ERR_PERMISSION_DENIED") {
            onError && onError(error);
            // Set error in data.metaData where the message list receipt logic checks
            const currentData = localMessage.getData() || {};
            localMessage.setData({ ...currentData, metaData: { error: true } });
            localMessage.setMetadata({ error: true });
            CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, {
              message: localMessage,
              status: messageStatus.error,
            });
            setReplyMessage(null);
            return;
          }
          onError && onError(error);
          // Set error in data.metaData where the message list receipt logic checks
          const currentData = localMessage.getData() || {};
          localMessage.setData({ ...currentData, metaData: { error: true } });
          localMessage.setMetadata({ error: true });
          CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, {
            message: localMessage,
            status: messageStatus.error,
          });
          setReplyMessage(null);
        });
    };

    const startTyping = (endTypingTimeout?: any, typingMetadata?: any) => {
      //if typing is disabled
      if (disableTypingEvents) {
        return false;
      }

      //if typing is in progress, clear the previous timeout and set new timeout
      if (isTyping.current) {
        clearTimeout(isTyping.current);
        isTyping.current = null;
      } else {
        let metadata = typingMetadata || undefined;

        let typingNotification = new CometChat.TypingIndicator(
          chatWithId.current,
          chatWith.current,
          metadata
        );
        CometChat.startTyping(typingNotification);
      }

      let typingInterval = endTypingTimeout || 500;
      isTyping.current = setTimeout(() => {
        endTyping(null, typingMetadata);
      }, typingInterval);
      return false;
    };

    const endTyping = (event: any, typingMetadata: any) => {
      if (event) {
        event.persist();
      }

      if (disableTypingEvents) {
        return false;
      }

      let metadata = typingMetadata || undefined;

      let typingNotification = new CometChat.TypingIndicator(
        chatWithId.current,
        chatWith.current,
        metadata
      );
      CometChat.endTyping(typingNotification);

      clearTimeout(isTyping.current!);
      isTyping.current = null;
      return false;
    };

    const SecondaryButtonViewElem = useMemo(() => {
      if (hideAttachmentButton || !actionSheetItems.length) return <></>;
      // Always open the action sheet (even at capacity) so the button never feels broken; an over-limit
      // pick is rejected on selection (acceptPickedAttachments + count toast).
      const attachBtn = (
        <AttachIconButton
          onPress={() => {
            Keyboard.dismiss();
            setTimeout(() => setShowActionSheet(true), 50);
          }}
          icon={mergedComposerStyle.attachmentIcon as JSX.Element | ImageSourcePropType}
          iconStyle={mergedComposerStyle.attachmentIconStyle as ImageStyle}
        />
      );
      // Edit mode: attachments are disabled (greyed, non-interactive) — only Send and Sticker stay active.
      return messagePreview ? <View pointerEvents="none" style={{ opacity: DISABLED_BUTTON_OPACITY }}>{attachBtn}</View> : attachBtn;
    }, [mergedComposerStyle, actionSheetItems, hideAttachmentButton, messagePreview]);

    const RecordAudioButtonView = ({
      icon,
      iconStyle,
    }: {
      icon: JSX.Element | ImageSourcePropType;
      iconStyle?: ImageStyle;
    }) => {
      return (
        <TouchableOpacity
          onPress={() => {
            Keyboard.dismiss();
            setTimeout(() => setShowRecordAudio(true), 50);
          }}
        >
          <Icon
            name='mic'
            height={24}
            width={24}
            icon={icon}
            color={iconStyle?.tintColor ?? theme.color.iconSecondary}
            imageStyle={iconStyle}
          />
        </TouchableOpacity>
      );
    };

    const voiceRecoringButtonElem = useMemo(() => {
      const isAgenticUser = user?.getRole?.() === '@agentic';

      if (hideVoiceRecordingButton || isAgenticUser) return undefined;
      // Once attachments are staged, hide the mic — Send takes over (matches the compact composer).
      if (selectedAttachments.length > 0) return undefined;
      const micBtn = (
        <RecordAudioButtonView
          icon={mergedComposerStyle.voiceRecordingIcon as ImageSourcePropType | JSX.Element}
          iconStyle={mergedComposerStyle.voiceRecordingIconStyle as ImageStyle}
        />
      );
      // Edit mode: voice recording is disabled — only Send and Sticker stay active.
      return messagePreview ? <View pointerEvents="none" style={{ opacity: DISABLED_BUTTON_OPACITY }}>{micBtn}</View> : micBtn;
    }, [hideVoiceRecordingButton, mergedComposerStyle, user, messagePreview, selectedAttachments.length]);

    const AuxiliaryButtonViewElem = useCallback(() => {
      const isAgenticUser = user?.getRole?.() === '@agentic';

      if (AuxiliaryButtonView)
        return <AuxiliaryButtonView user={user} group={group} composerId={id!} />;

      if (isAgenticUser) {
        return <></>;
      }

      if (defaultAuxiliaryButtonOptions) {
        // Edit mode: keep only the Sticker button active; disable (grey + non-interactive) the rest.
        const items = messagePreview
          ? (defaultAuxiliaryButtonOptions as any[]).map((el, idx) =>
              el?.key === "sticker-button"
                ? el
                : (
                  <View
                    key={el?.key ?? `aux-${idx}`}
                    pointerEvents="none"
                    style={{ opacity: DISABLED_BUTTON_OPACITY }}
                  >
                    {el}
                  </View>
                )
            )
          : defaultAuxiliaryButtonOptions;
        return (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.spacing.s2,
            }}
          >
            {items}
          </View>
        );
      }

      return <></>;
    }, [defaultAuxiliaryButtonOptions, user, AuxiliaryButtonView, group, id, theme, messagePreview]);

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

    const SendButtonViewElem = useCallback(() => {
      if (hideSendButton) return <></>;

      const isAgenticUserCheck = isAgenticUser();

      if (isAgenticUserCheck) {
        const hasPendingUploadsAgentic = selectedAttachments.some(
          a => a.uploadState === 'NONE' || a.uploadState === 'UPLOADING'
        );
        // Errored (FAILED/REJECTED) tiles block send until the user removes them — no partial batch.
        const hasErroredUploadsAgentic = selectedAttachments.some(
          a => a.uploadState === 'FAILED' || a.uploadState === 'REJECTED'
        );
        const disabled =
          isStreaming ||
          (plainTextInput.current.trim().length === 0 && selectedAttachments.length === 0) ||
          (messagePreview && !hasEdited) ||
          isSendButtonDisabledForDelay ||
          hasPendingUploadsAgentic ||
          hasErroredUploadsAgentic;
        const SendButtonComponent =  DefaultAgentSendButtonView;
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

      if (SendButtonView) return <SendButtonView user={user} group={group} composerId={id!} />;
      const hasPendingUploads = selectedAttachments.some(
        a => a.uploadState === 'NONE' || a.uploadState === 'UPLOADING'
      );
      // Errored (FAILED/REJECTED) tiles block send until the user removes them — no partial batch.
      const hasErroredUploads = selectedAttachments.some(
        a => a.uploadState === 'FAILED' || a.uploadState === 'REJECTED'
      );
      const disabled =
        isStreaming ||
        (plainText.trim().length === 0 && selectedAttachments.length === 0) ||
        (messagePreview && !hasEdited) ||
        hasPendingUploads ||
        hasErroredUploads;
      const handleSendPress = selectedAttachments.length > 0
        ? sendMultiAttachmentMediaMessage
        : sendTextMessage;
      return (
        <TouchableOpacity
          onPress={handleSendPress}
          style={[
            {
              borderRadius: theme.spacing.radius.max,
              padding: 4,
              backgroundColor: disabled ? theme.color.background4 : theme.color.fabButtonBackground,
            },
            mergedComposerStyle.sendIconContainerStyle as ViewStyle,
          ]}
          disabled={disabled}
        >
          <Icon
            name='send-fill'
            icon={mergedComposerStyle.sendIcon as ImageSourcePropType | JSX.Element}
            color={
              (mergedComposerStyle.sendIconStyle?.tintColor ??
                theme.color.fabButtonIcon) as ColorValue
            }
            imageStyle={mergedComposerStyle.sendIconStyle as ImageStyle}
            height={24}
            width={24}
          />
        </TouchableOpacity>
      );
    }, [mergedComposerStyle, inputMessage, plainText, messagePreview, hasEdited, isStreaming, DefaultAgentSendButtonView, user, isAgenticUser, sendTextMessage, sendMultiAttachmentMediaMessage, hideSendButton, SendButtonView, isSendButtonDisabledForDelay, selectedAttachments]);

    //fetch logged in user
    useEffect(() => {
      CometChat.getLoggedinUser().then((user) => (loggedInUser.current = user));
      let _formatter = [...(textFormatters || [])];

      if (!disableMentions) {
        let mentionsFormatter = ChatConfigurator.getDataSource().getMentionsFormatter();
        mentionsFormatter.setLoggedInUser(CometChatUIKit.loggedInUser);
        mentionsFormatter.setContext("composer");
        mentionsFormatter.setMentionsStyle(
          mergedComposerStyle.mentionsStyle as CometChatTheme["mentionsStyle"]
        );
        mentionsFormatter.setTargetElement(MentionsTargetElement.textinput);

        if (mentionAllLabel) mentionsFormatter.setMentionAllLabel(mentionAllLabel);
        mentionsFormatter.setDisableMentionAll(disableMentionAll);

        if (user) mentionsFormatter.setUser(user);
        if (group) mentionsFormatter.setGroup(group);

        _formatter.unshift(mentionsFormatter);
      }

      _formatter.forEach((formatter) => {
        formatter.setComposerId(id!);
        if (user) formatter.setUser(user);
        if (group) formatter.setGroup(group);
        let trackingCharacter = formatter.getTrackingCharacter();
        trackingCharacters.current.push(trackingCharacter);

        let newFormatter = CommonUtils.clone(formatter);
        allFormatters.current.set(trackingCharacter, newFormatter);
      });
    }, []);

    useEffect(() => {
      const newChatWithId = user?.getUid()
        ? user.getUid()
        : group?.getGuid()
        ? group.getGuid()
        : chatWithId.current;

      // Conversation switch guard: if the receiver IDENTITY changed, drop any staged / in-flight
      // attachments so they can't be sent to the new receiver (wrong-destination leak). Compare the
      // uid/guid — NOT the user/group object refs — so a parent re-render that passes fresh objects
      // for the SAME conversation doesn't wipe a tray the user is mid-staging. Skip the first
      // assignment (chatWithId.current === null → nothing staged yet).
      if (chatWithId.current != null && chatWithId.current !== newChatWithId) {
        uploadQueue.cancelAll();
        setSelectedAttachments([]);
        selectedAttachmentsRef.current = [];
      }

      //update receiver user
      if (user && user.getUid()) {
        chatRef.current = {
          chatWith: ReceiverTypeConstants.user,
          chatWithId: user.getUid(),
        };
        chatWith.current = ReceiverTypeConstants.user;
        chatWithId.current = user.getUid();
      } else if (group && group.getGuid()) {
        chatRef.current = {
          chatWith: ReceiverTypeConstants.group,
          chatWithId: group.getGuid(),
        };
        chatWith.current = ReceiverTypeConstants.group;
        chatWithId.current = group.getGuid();
      }
    }, [user, group, chatRef]);

    const handleOnClick = (CustomView: any) => {
      let view = CustomView(
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
      setShowActionSheet(false);
      setTimeout(() => {
        setCustomView(() => view);
        setIsVisible(true);
      }, 200);
    };

    useEffect(() => {
      const defaultAttachmentOptions = ChatConfigurator.dataSource.getAttachmentOptions(
        theme,
        user,
        group,
        composerIdMap,
        {
          hideCameraOption,
          hideImageAttachmentOption,
          hideVideoAttachmentOption,
          hideAudioAttachmentOption,
          hideFileAttachmentOption,
          hidePollsAttachmentOption,
          hideCollaborativeDocumentOption,
          hideCollaborativeWhiteboardOption,
          replyToMessage: replyMessage?.message,
          closeReplyPreview: () => setReplyMessage(null),
        }
      );
      setActionSheetItems(() =>
        attachmentOptions && typeof attachmentOptions === "function"
          ? attachmentOptions({ user, group, composerId: composerIdMap })?.map((item) => {
            if (typeof item.CustomView === "function")
              return {
                ...item,
                onPress: () => handleOnClick(item.CustomView),
              };
            if (typeof item.onPress == "function")
              return {
                ...item,
                onPress: () => {
                  setShowActionSheet(false);
                  item.onPress?.(user, group);
                },
              };
            return {
              ...item,
              onPress: () => fileInputHandler(item.id),
            };
          })
          : [
            ...defaultAttachmentOptions.map((item: any) => {
              if (typeof item.CustomView === "function")
                return {
                  ...item,
                  onPress: () => handleOnClick(item.CustomView),
                };
              if (typeof item.onPress === "function")
                return {
                  ...item,
                  onPress: () => {
                    setShowActionSheet(false);
                    item.onPress?.(user, group);
                  },
                };
              return {
                ...item,
                onPress: () => fileInputHandler(item.id),
              };
            }),
            ...(addAttachmentOptions && typeof addAttachmentOptions === "function"
              ? addAttachmentOptions({ user, group, composerId: composerIdMap })?.map((item) => {
                if (typeof item.CustomView === "function")
                  return {
                    ...item,
                    onPress: () => handleOnClick(item.CustomView),
                  };
                if (typeof item.onPress == "function")
                  return {
                    ...item,
                    onPress: () => {
                      setShowActionSheet(false);
                      item.onPress?.(user, group);
                    },
                  };
                return {
                  ...item,
                  onPress: () => fileInputHandler(item.id),
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
    ]);

    useEffect(() => {
      CometChatUIEventHandler.addMessageListener(editMessageListenerID, {
        ccMessageEdited: (item: any) => {
          const incomingParentId = item?.message?.getParentMessageId?.() ?? null;
          const myParentId = parentMessageId ?? null;

          if (incomingParentId === myParentId) {
            previewMessage(item);
          }
        },
      });
      CometChatMessageEvents.addListener(
        CometChatMessageEvents.ccReplyToMessage,
        replyMessageListenerID,
        (data: any) => {
          if (data.status === messageStatus.inprogress) {
            previewReplyMessage(data.message);
          } else if (data.status === messageStatus.success) {
          }
        }
      );
      CometChatUIEventHandler.addUIListener(UiEventListenerID, {
        ccToggleBottomSheet: (item) => {
          if (item?.bots) {
            // let newAiOptions = _getAIOptions(item.bots);
            // setAIOptionItems(newAiOptions);
            // setShowAIOptions(true);
            return;
          } else if (item?.botView) {
            setCustomView(() => item.child);
            return;
          }
          setIsVisible(false);
          bottomSheetRef.current?.togglePanel();
        },
        ccComposeMessage: (text) => {
          setIsVisible(false);
          bottomSheetRef.current?.togglePanel();

          inputValueRef.current = text?.text;
          setInputMessage(text?.text);
          plainTextInput.current = text?.text || "";
          setPlainText(text?.text || "");
        },
        ccSuggestionData(item: { id: string | number; data: Array<SuggestionItem> }) {
          if (activeCharacter.current && id === item?.id) {
            const warningView = getMentionLimitView();
            if (warningView) {
              return;
            }
            setMentionsSearchData(item?.data);
            setSuggestionListLoader(false);
          }
        },
      });
      return () => {
        CometChatUIEventHandler.removeMessageListener(editMessageListenerID);
        CometChatMessageEvents.removeListener(CometChatMessageEvents.ccReplyToMessage, replyMessageListenerID);
        CometChatUIEventHandler.removeUIListener(UiEventListenerID);
      };
    }, []);

    const handlePannel = (item: any) => {
      if (item.child) {
        if (item.alignment === ViewAlignment.composerTop) setCustomViewHeader(() => item.child);
        else if (item.alignment === ViewAlignment.composerBottom)
          setCustomViewFooter(() => item.child);
      } else {
        if (item.alignment === ViewAlignment.composerTop) setCustomViewHeader(null);
        else if (item.alignment === ViewAlignment.composerBottom) setCustomViewFooter(undefined);
      }
    };
    useEffect(() => {
      CometChatUIEventHandler.addUIListener(uiEventListenerShow, {
        showPanel: (item) => handlePannel(item),
      });
      CometChatUIEventHandler.addUIListener(uiEventListenerHide, {
        hidePanel: (item) => handlePannel(item),
      });
      return () => {
        CometChatUIEventHandler.removeUIListener(uiEventListenerShow);
        CometChatUIEventHandler.removeUIListener(uiEventListenerHide);
      };
    }, []);

    const buildRecordedAudioFileName = (recordedFile: string): string => ((recordedFile || "").split(/[?#]/)[0]?.split("/").pop() || `audio-recording-${Date.now()}.m4a`).replace(/^audio-merged/, "audio-recording");

    const _sendRecordedAudio = (recordedFile: String) => {
      let fileObj = {
        name: buildRecordedAudioFileName(String(recordedFile)),
        type: "audio/mp4",
        uri: recordedFile,
      };
      // §8.1a — tag recorded audio as a voice note so it renders in the WAVEFORM bubble
      // (CometChatAudioBubble), distinct from picked/shared audio files which use the
      // headphone+filename bubble. Always tagged (independent of enableMultipleAttachments).
      const voiceNoteMeta = { audioType: "voice_note" }; // always tag → recorded audio is ALWAYS the waveform bubble
      sendMediaMessage(chatWithId.current, fileObj, MessageTypeConstants.audio, chatWith.current, voiceNoteMeta);
    };

    function shouldOpenList(
      selection: {
        start: number;
        end: number;
      },
      searchString: string,
      tracker: string
    ) {
      return (
        selection.start === selection.end &&
        !isCursorWithinMentionRange(mentionMap.current, selection.start - searchString.length) &&
        trackingCharacters.current.includes(tracker) &&
        (searchString === ""
          ? (plainTextInput.current[selection.start - 2]?.length === 1 &&
            plainTextInput.current[selection.start - 2]?.trim()?.length === 0) ||
          plainTextInput.current[selection.start - 2] === undefined
          : true) &&
        (plainTextInput.current[selection.start - 1]?.length === 1 &&
          plainTextInput.current[selection.start - 1]?.trim()?.length === 0
          ? searchString.length > 0
          : true)
      );
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    const openList = (selection: { start: number; end: number }) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        let searchString = extractTextFromCursor(plainTextInput.current, selection.start);
        let tracker = searchString
          ? plainTextInput.current[selection.start - (searchString.length + 1)]
          : plainTextInput.current[selection.start - 1];

        if (shouldOpenList(selection, searchString, tracker)) {
          activeCharacter.current = tracker;
          searchStringRef.current = searchString;
          // Show the suggestion list immediately (even while data is loading) to avoid layout jumps
          setShowMentionList(true);
          setSuggestionListLoader(true);

          let formatter = allFormatters.current.get(tracker);
          if (formatter instanceof CometChatMentionsFormatter) {
            let shouldShowMentionList =
              formatter.getVisibleIn() === MentionsVisibility.both ||
              (formatter.getVisibleIn() === MentionsVisibility.usersConversationOnly && user) ||
              (formatter.getVisibleIn() === MentionsVisibility.groupsConversationOnly && group);
            if (shouldShowMentionList) {
              formatter?.search(searchString);
            }
          } else {
            formatter?.search(searchString);
          }
        } else {
          activeCharacter.current = "";
          searchStringRef.current = "";
          setShowMentionList(false);
          setMentionsSearchData([]);
          setSuggestionListLoader(false);
        }
      }, 100);
    };

    const getRegexString = (str: string) => {
      // Get an array of the entries in the map using the spread operator
      const entries = [...mentionMap.current.entries()].reverse();

      let uidInput = str;

      // Iterate over the array in reverse order
      entries.forEach(([key, value]) => {
        let [start, end] = key.split("_").map(Number);

        let pre = uidInput.substring(0, start);
        let post = uidInput.substring(end);

        uidInput = pre + value.underlyingText + post;
      });

      return uidInput;
    };

    const getPlainString = (
      str: string,
      edits: Array<{
        endIndex: number;
        replacement: string;
        startIndex: number;
        user: SuggestionItem;
      }>
    ) => {
      // Get an array of the entries in the map using the spread operator
      const entries = [...edits].reverse();

      let _plainString = str;

      // Iterate over the array in reverse order
      entries.forEach(({ endIndex, replacement, startIndex, user }) => {
        let pre = _plainString.substring(0, startIndex);
        let post = _plainString.substring(endIndex);

        _plainString = pre + replacement + post;
      });

      return _plainString;
    };

    const parseMentionKey = (key: string): { start: number; end: number } | undefined => {
      const [startStr, endStr] = key.split("_");
      const start = Number(startStr);
      const end = Number(endStr);

      const isValid = Number.isFinite(start) && Number.isFinite(end);

      if (typeof __DEV__ !== "undefined" && __DEV__ && !isValid) {
        throw new Error(`Invalid mention key: "${key}" (expected "start_end")`);
      }

      return isValid ? { start, end } : undefined;
    };

    const calcDeletionRange = (
      selection: { start: number; end: number },
      deletionLength: number
    ) => {
      return selection.start === selection.end
        ? {
          start: Math.max(0, selection.start - deletionLength),
          end: selection.start,
        }
        : { start: selection.start, end: selection.end };
    };

    const collectOverlappingMentions = (
      range: { start: number; end: number },
      mentionMap: Map<string, SuggestionItem>
    ): MentionOverlap[] => {
      const overlaps: MentionOverlap[] = [];

      mentionMap.forEach((value, key) => {
        const mentionRange = parseMentionKey(key);
        if (!mentionRange) return;

        const { start, end } = mentionRange;

        // compare against the *deletion* range, not the mention itself
        if (range.start < end && range.end > start) {
          overlaps.push({ key, value, start, end });
        }
      });

      overlaps.sort((a, b) => a.start - b.start);
      return overlaps;
    };

    const removeMentionsFromTextAndMap = (
      text: string,
      overlaps: MentionOverlap[],
      map: Map<string, SuggestionItem>
    ) => {
      let adjustment = 0;
      let newText = text;

      overlaps.forEach(({ key, value, start, end }) => {
        const adjStart = start + adjustment;
        const adjEnd = end + adjustment;

        newText = newText.slice(0, adjStart) + newText.slice(adjEnd);
        map.delete(key);
        adjustment -= adjEnd - adjStart;

        // keep formatter in sync
        if (!ifIdExists(value.id, map)) {
          const fmt = allFormatters.current.get(value.trackingCharacter!);
          if (fmt instanceof CometChatMentionsFormatter) {
            const users = fmt.getSuggestionItems().filter((u) => u.id !== value.id);
            fmt.setSuggestionItems(users);
            if (!getMentionLimitView(fmt)) setWarningMessage("");
          }
        }
      });

      return { newText, totalShift: adjustment };
    };

    const shiftRemainingMentionKeys = (
      map: Map<string, SuggestionItem>,
      shiftStart: number,
      delta: number
    ) => {
      if (delta === 0) return;
      const shifted = new Map<string, SuggestionItem>();

      map.forEach((val, key) => {
        const range = parseMentionKey(key);
        if (!range) {
          // key was malformed → skip or handle as you wish
          return;
        }

        const { start, end } = range;
        if (start > shiftStart) {
          shifted.set(`${start + delta}_${end + delta}`, val);
        } else {
          shifted.set(key, val);
        }
      });

      map.clear();
      shifted.forEach((v, k) => map.set(k, v));
    };

    const deleteMentionHelper = (oldText: string, newText: string) => {
      const deletionLen = oldText.length - newText.length;
      const range = calcDeletionRange(selectionPosition, deletionLen);

      const deletionMentionMap = new Map(mentionMap.current);
      const overlaps = collectOverlappingMentions(range, deletionMentionMap);

      if (overlaps.length === 0) return false;

      const { newText: finalText, totalShift } = removeMentionsFromTextAndMap(
        oldText,
        overlaps,
        deletionMentionMap
      );

      shiftRemainingMentionKeys(deletionMentionMap, range.start, totalShift);

      plainTextInput.current = finalText;
      setPlainText(finalText);
      onTextChange?.(finalText);
      mentionMap.current = deletionMentionMap;

      const firstStart = overlaps[0].start;
      InteractionManager.runAfterInteractions(() => {
        messageInputRef.current?.setNativeProps({
          selection: { start: firstStart, end: firstStart },
        });
      });

      setFormattedInputMessage();
      return true;
    };

    const textChangeHandler = (txt: string) => {
      if (messagePreview) {
        setHasEdited(txt.trim() !== originalText.trim());
      }

      const oldText = plainTextInput.current ?? "";
      const newText = txt;

      startTyping();

      // Check if this is a deletion
      if (oldText.length > newText.length) {
        const handled = deleteMentionHelper(oldText, newText);
        if (handled) return;
      }

      // Existing handling for non-deletion cases
      const removing = (plainTextInput.current?.length ?? 0) > txt.length;
      const adding = plainTextInput.current?.length < txt.length;
      const textDiff = txt.length - (plainTextInput.current?.length ?? 0);
      const notAtLast = selectionPosition.start + textDiff < txt.length;

      let decr = 0;

      plainTextInput.current = newText;
      setPlainText(newText);

      const newMentionMap: Map<string, SuggestionItem> = new Map(mentionMap.current);

      mentionMap.current.forEach((value, key) => {
        const range = parseMentionKey(key);
        if (!range) {
          // key was malformed → skip or handle as you wish
          return;
        }

        const { start, end } = range;
        let position = { start, end };

        if (
          notAtLast &&
          (selectionPosition.start - 1 <= position.start ||
            selectionPosition.start - textDiff <= position.start)
        ) {
          if (removing) {
            decr = selectionPosition.end - selectionPosition.start - textDiff;
            position.start -= decr;
            position.end -= decr;
          } else if (adding) {
            decr = selectionPosition.end - selectionPosition.start + textDiff;
            position.start += decr;
            position.end += decr;
          }
          if (removing || adding) {
            const newKey = `${position.start}_${position.end}`;
            if (position.start >= 0) newMentionMap.set(newKey, value);
            newMentionMap.delete(key);
          }
        }

        /* delete mention that was edited/over-typed */
        const expected = plainTextInput.current?.substring(position.start, position.end);
        if (expected !== value.promptText) {
          newMentionMap.delete(`${position.start}_${position.end}`);

          if (!ifIdExists(value.id, newMentionMap)) {
            const targetedFormatter = allFormatters.current.get(value.trackingCharacter!);
            if (!targetedFormatter) return;
            const users = [...targetedFormatter.getSuggestionItems()];
            const idx = users.findIndex((u) => u.id === value.id);
            if (idx !== -1) users.splice(idx, 1);

            if (targetedFormatter instanceof CometChatMentionsFormatter) {
              targetedFormatter.setSuggestionItems(users);
              const warn = getMentionLimitView(targetedFormatter);
              if (!warn) setWarningMessage("");
            }
          }
        }
      });

      mentionMap.current = newMentionMap;
      onTextChange?.(plainTextInput.current);
      setFormattedInputMessage();
    };

    const onMentionPress = (item: SuggestionItem) => {
      setShowMentionList(false);
      setMentionsSearchData([]);

      let notAtLast = selectionPosition.start < (plainTextInput.current?.length ?? 0);

      let textDiff =
        (plainTextInput.current?.length ?? 0) +
        (item.promptText?.length ?? 0) -
        searchStringRef.current.length -
        (plainTextInput.current?.length ?? 0);

      let incr = 0;
      let mentionPos = 0;

      let newMentionMap = new Map(mentionMap.current);

      let targetedFormatter = allFormatters.current.get(activeCharacter.current);
      if (!targetedFormatter) return;
      let existingCCUsers = [...targetedFormatter.getSuggestionItems()];
      let userAlreadyExists = existingCCUsers.find(
        (existingUser: SuggestionItem) => existingUser.id === item.id
      );
      if (!userAlreadyExists) {
        let cometchatUIUserArray: Array<SuggestionItem> = [...existingCCUsers];
        cometchatUIUserArray.push(item);
        (targetedFormatter as CometChatMentionsFormatter).setSuggestionItems(cometchatUIUserArray);
      }
      mentionMap.current.forEach((value, key) => {
        let position = { start: parseInt(key.split("_")[0]), end: parseInt(key.split("_")[1]) };

        if (!(selectionPosition.start <= position.start)) {
          mentionPos += 1;
        }

        if (
          position.end === selectionPosition.end ||
          (selectionPosition.start > position.start && selectionPosition.end <= position.end)
        ) {
          let newKey = `${position.start}_${position.end}`;
          newMentionMap.delete(newKey);
          mentionPos -= 1;
        }

        if (notAtLast && selectionPosition.start - 1 <= position.start) {
          incr = selectionPosition.end - selectionPosition.start + textDiff;
          let newKey = `${position.start + incr}_${position.end + incr}`;
          newMentionMap.set(newKey, value);
          newMentionMap.delete(key);
        }
      });
      mentionMap.current = newMentionMap;

      // When updating the input text, just get the latest plain text input and replace the selected text with the new mention
      const updatedPlainTextInput = `${plainTextInput.current?.substring(
        0,
        selectionPosition.start - (1 + searchStringRef.current.length)
      )}${item.promptText + " "}${plainTextInput.current?.substring(
        selectionPosition.end,
        plainTextInput.current?.length
      )}`;
      plainTextInput.current = updatedPlainTextInput;

      let key =
        selectionPosition.start -
        (1 + searchStringRef.current.length) +
        "_" +
        (selectionPosition.start -
          (searchStringRef.current.length + 1) +
          (item.promptText?.length ?? 0));

      let updatedMap = insertMentionAt(mentionMap.current, mentionPos, key, {
        ...item,
        trackingCharacter: activeCharacter.current,
      });
      mentionMap.current = updatedMap;
      
      // Calculate cursor position after the mention + space
      // Add 1 to account for the space character added after the mention
      const newCursorPosition =
        selectionPosition.start -
        (searchStringRef.current.length + 1) +
        (item.promptText?.length ?? 0) +
        1; // +1 for the space after mention
      
      // On iOS, use InteractionManager to ensure selection is applied after UI updates
      if (Platform.OS === "ios") {
        InteractionManager.runAfterInteractions(() => {
          setSelectionPosition({
            start: newCursorPosition,
            end: newCursorPosition,
          });
        });
      } else {
        setSelectionPosition({
          start: newCursorPosition,
          end: newCursorPosition,
        });
      }
      setFormattedInputMessage();
    };

    const setFormattedInputMessage = () => {
      let textComponents: any = getRegexString(plainTextInput.current);

      allFormatters.current.forEach((formatter: CometChatTextFormatter, key) => {
        let resp = formatter.getFormattedText(textComponents);
        textComponents = resp;
      });

      inputValueRef.current = textComponents;
      setInputMessage(textComponents);
    };

    function escapeRegExp(string: string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function extractTextFromCursor(inputText: string, cursorPosition: number) {
      const leftText = inputText.substring(0, cursorPosition);

      // Escape the mentionPrefixes to safely use them in a regex pattern
      const escapedPrefixes = trackingCharacters.current.map(escapeRegExp).join("|");

      // Build a dynamic regex pattern that matches any of the mention prefixes.
      // This pattern will match a prefix followed by any combination of word characters
      // and spaces, including a trailing space.
      const mentionRegex = new RegExp(
        `(?:^|\\s)(${escapedPrefixes})([^${escapedPrefixes}\\s][^${escapedPrefixes}]*)$`
      );
      const match = leftText.match(mentionRegex);

      // If a match is found, return the first capturing group, which is the username
      return (match && substringUpToNthSpace(match[2], 4)) || "";
    }

    function substringUpToNthSpace(str: string, n: number) {
      // Split the string by spaces, slice to the (n-1) elements, and then rejoin with spaces
      return str.split(" ", n).join(" ");
    }

    const insertMentionAt = (
      mentionMap: Map<string, SuggestionItem>,
      insertAt: number,
      key: string,
      value: SuggestionItem
    ): Map<string, SuggestionItem> => {
      // Convert the hashmap to an array of [key, value] pairs
      let mentionsArray = Array.from(mentionMap);

      // Insert the new mention into the array at the calculated index
      mentionsArray.splice(insertAt, 0, [key, value]);

      return new Map(mentionsArray);
    };

    /**
     * Function to check if the id exists in the mentionMap
     */
    const ifIdExists = (id: string, hashmap: Map<string, SuggestionItem>) => {
      let exists = false;
      hashmap.forEach((value, key) => {
        if (value.id === id) {
          exists = true;
        }
      });
      return exists;
    };

    const onSuggestionListEndReached = () => {
      let targetedFormatter = allFormatters.current.get(activeCharacter.current);
      if (!targetedFormatter) return;
      let fetchingNext = targetedFormatter.fetchNext();
      fetchingNext !== null && setSuggestionListLoader(true);
    };

    const getMentionLimitView = (targettedFormatterParam?: CometChatMentionsFormatter) => {
      let targetedFormatter =
        allFormatters.current.get(activeCharacter.current) ?? targettedFormatterParam;
      if (!(targetedFormatter instanceof CometChatMentionsFormatter)) {
        return false;
      }
      let shouldWarn;
      let limit;
      if (targetedFormatter?.getLimit && targetedFormatter?.getLimit()) {
        limit = targetedFormatter?.getLimit();
        if (
          targetedFormatter.getUniqueUsersList &&
          targetedFormatter.getUniqueUsersList()?.size >= limit
        ) {
          shouldWarn = true;
        }
      }
      if (!shouldWarn) {
        setWarningMessage("");
        return false;
      }
      setWarningMessage(
        targetedFormatter?.getErrorString
          ? targetedFormatter?.getErrorString()
          : `${t("MENTION_UPTO")} ${limit} ${
              limit === 1 ? t("TIME") : t("TIMES")
          } ${t("AT_A_TIME")}.`
      );
      return true;
    };

    return (
      <>
        {/* {!isVisible && typeof CustomView === "function" && <CustomView />} TODOM */}
        <Modal
          transparent={true}
          // animationType='slide'
          visible={isVisible}
          onRequestClose={() => {
            setIsVisible(false);
          }}
        >
          {CustomView && CustomView}
        </Modal>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.select({ ios: kbOffset })}
          {...keyboardAvoidingViewProps}
        >
          <View
            style={[
              Style.container,
              {
                paddingTop: CustomViewHeader ? theme.spacing.padding.p0 : theme.spacing.padding.p2,
                paddingHorizontal: theme.spacing.padding.p2,
              },
              {
                backgroundColor: theme.messageListStyles.containerStyle.backgroundColor,
              },
              mergedComposerStyle.containerStyle as ViewStyle,
            ]}
          >
            {/* Error banner floats ABOVE the composer, over the message list. */}
            <View
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                if (h > 0 && h !== attachmentBannerHeight) setAttachmentBannerHeight(h);
              }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                // Sit fully ABOVE the composer with a gap: top = -(measured banner height + gap), so it
                // clears the composer regardless of text length. Hidden until measured (avoids a flash).
                top: -(attachmentBannerHeight + theme.spacing.spacing.s3),
                paddingHorizontal: theme.spacing.padding.p2, // match the composer's side inset
                opacity: attachmentBannerHeight > 0 ? 1 : 0,
              }}
              pointerEvents="box-none"
            >
              <CometChatComposerErrorBanner
                message={attachmentBannerMessage}
                onDismiss={() => setAttachmentBannerMessage(null)}
              />
            </View>
            <ActionSheetBoard
              sheetRef={bottomSheetRef}
              options={actionSheetItems}
              shouldShow={showActionSheet}
              onClose={() => setShowActionSheet(false)}
              // iOS: launch the deferred picker only after the sheet's modal has
              // fully dismissed, so UIKit isn't asked to present while dismissing.
              onDismiss={() => {
                const action = pendingAttachmentActionRef.current;
                pendingAttachmentActionRef.current = null;
                action?.();
              }}
              style={mergedComposerStyle.attachmentOptionsStyles}
            />

            <RecordAudio
              sheetRef={bottomSheetRef}
              options={actionSheetItems}
              shouldShow={showRecordAudio}
              onClose={() => {
                setShowRecordAudio(false);
              }}
              cometChatBottomSheetStyle={{
                maxHeight: Dimensions.get("window").height * 0.4,
              }}
              onSend={_sendRecordedAudio}
              mediaRecorderStyle={mergedComposerStyle.mediaRecorderStyle}
            />

            {showMentionList && (plainTextInput.current?.length ?? 0) > 0 && mentionsSearchData.length > 0 && (
              <View
                style={[
                  theme.mentionsListStyle.containerStyle,
                  // Keep height stable to reduce flicker when list data loads/empties
                  { maxHeight: Dimensions.get("window").height * (messagePreview ? 0.2 : (Platform.OS === "ios" ? 0.15 : 0.22)) },
                ]}
              >
                <CometChatSuggestionList
                  data={mentionsSearchData}
                  listStyle={theme.mentionsListStyle}
                  onPress={onMentionPress}
                  onEndReached={onSuggestionListEndReached}
                  loading={suggestionListLoader}
                />
              </View>
            )}

            <View
              style={[
                {
                  flexDirection: "column",
                  // Give this "above-input" area the composer surface when there's an edit/reply
                  // preview, with NO bottom edge so it joins the input below into ONE continuous,
                  // bordered composer surface. (The attachment tray now uses a matching surface
                  // BELOW the input instead.)
                  ...(messagePreview || replyMessage ? {
                    backgroundColor: theme.color.background1,
                    // radius.r2 + borderDefault + (s0_5 / 2) width — the SAME tokens the input's
                    // messageInputStyles.containerStyle uses, so the tray joins it seamlessly.
                    borderTopRightRadius: theme.spacing.radius.r2,
                    borderTopLeftRadius: theme.spacing.radius.r2,
                    paddingHorizontal: theme.spacing.padding.p1,
                    borderWidth: theme.spacing.spacing.s0_5 / 2,
                    borderColor: theme.color.borderDefault,
                    borderBottomWidth: 0,
                  } : {}),
                },
              ]}
            >
              {HeaderView
                ? HeaderView({ user, group })
                : CustomViewHeader &&
                (typeof CustomViewHeader === "function" ? (
                  <CustomViewHeader /> // Invoke CustomViewHeader if it's a functional component
                ) : (
                  CustomViewHeader // Render it directly if it's a React node
                ))}
              {messagePreview && (
                <CometChatMessagePreview
                  messagePreviewTitle={t("EDIT_MESSAGE")}
                  message={messagePreview?.message}
                  // Editing a media caption: caption text is the editable subtitle; a muted overline
                  // (media-type icon + attachment count) restores the context the hidden thumbnail gave.
                  {...(typeof messagePreview?.message?.getCaption === "function"
                    ? {
                        messagePreviewSubtitle:
                          messagePreview.message.getCaption() ?? "",
                        hideSubtitleIcon: true,
                        overlineText: attachmentCountLabel(messagePreview.message.getType?.(), messagePreview.message.getAttachments?.()?.length ?? 1),
                      }
                    : {})}
                  showCloseIcon={true}
                  closeIconURL={ICONS.CLOSE}
                  onCloseClick={() => {
                    setMessagePreview(null);
                    clearEditPreview();
                    mentionMap.current = new Map();
                    plainTextInput.current = "";
                    setOriginalText("");
                  }}
                  style={{
                    borderRadius: 8,
                    borderWidth: 0,
                    borderLeftWidth: 3,
                    borderLeftColor: theme.color.borderHighlight,
                    margin:theme.spacing.padding.p1,
                  }}
                />
              )}
              {replyMessage && replyMessage.message && (
                <CometChatMessagePreview
                  message={replyMessage.message}
                  showCloseIcon={true}
                  closeIconURL={ICONS.CLOSE}
                  onCloseClick={() => {
                    setReplyMessage(null);
                  }}
                  titleStyle={{ color: theme.color.textHighlight }}
                  style={{
                    borderRadius: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: theme.color.borderHighlight,
                    margin:theme.spacing.padding.p1,
                  }}
                />
              )}
            </View>
            {trayMediaItems.length > 0 && (
              <CometChatMediaViewer
                mediaItems={trayMediaItems}
                startIndex={trayViewerIndex}
                visible={trayViewerVisible}
                onClose={() => setTrayViewerVisible(false)}
              />
            )}
            <CometChatMessageInput
              messageInputRef={messageInputRef}
              text={inputMessage as string}
              placeHolderText={isAgenticUser()? t("ASK_ANYTHING") : t("ENTER_YOUR_MESSAGE_HERE")}
              style={{
                ...mergedComposerStyle.messageInputStyles,
                containerStyle: {
                  ...mergedComposerStyle.messageInputStyles?.containerStyle,
                  // Square the TOP for previews above (edit/reply) and the BOTTOM for the tray below,
                  // so the input joins whichever surface is attached into one continuous composer.
                  ...(messagePreview || replyMessage ? {
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                  } : {}),
                  ...(selectedAttachments.length > 0 ? {
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    // No bottom edge either — the tray surface below closes the box, so input + tray
                    // read as one seamless container (like the single-line composer), not two pieces.
                    borderBottomWidth: 0,
                  } : {}),
                },
              }}
              onSelectionChange={({ nativeEvent: { selection } }) => {
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
                      // Move the cursor IMPERATIVELY — the input is uncontrolled (the `selection`
                      // prop was removed). A controlled `selection` prop re-fires onSelectionChange
                      // on every re-render, which hard-freezes iOS once the attachment tray adds
                      // layout churn. This mirrors the compact composer's proven approach.
                      messageInputRef.current?.setSelection?.(targetPosition, targetPosition);
                      setSelectionPosition({ start: targetPosition, end: targetPosition });
                    });
                    return;
                  }
                }

                setSelectionPosition(selection);
                openList(selection);
              }}
              onChangeText={textChangeHandler}
              VoiceRecordingButtonView={voiceRecoringButtonElem}
              SecondaryButtonView={SecondaryButtonViewElem}
              AuxiliaryButtonView={AuxiliaryButtonViewElem()}
              PrimaryButtonView={SendButtonViewElem}
              auxiliaryButtonAlignment={auxiliaryButtonsAlignment}
            />
            {/* Staged attachment tray — BELOW the input, on a matching composer surface with NO top
                edge so it joins the input above into ONE continuous box (mirrors the above-input
                surface, just bottom-rounded instead of top-rounded — same tokens). */}
            {selectedAttachments.length > 0 && (
              <View
                style={{
                  backgroundColor: theme.color.background1,
                  borderBottomRightRadius: theme.spacing.radius.r2,
                  borderBottomLeftRadius: theme.spacing.radius.r2,
                  paddingHorizontal: theme.spacing.padding.p1,
                  borderWidth: theme.spacing.spacing.s0_5 / 2,
                  borderColor: theme.color.borderDefault,
                  borderTopWidth: 0,
                }}
              >
                <CometChatAttachmentTray
                  attachments={selectedAttachments}
                  onRemove={handleRemoveAttachment}
                  onRetry={handleRetryAttachment}
                  onPressTile={handleTrayTilePress}
                />
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
        {CustomViewFooter ? (
          // If CustomViewFooter is a function component (React.FC)
          typeof CustomViewFooter === "function" ? (
            <CustomViewFooter /> // Invoke the function component
          ) : (
            CustomViewFooter // Render it directly if it's a React node (JSX or element)
          )
        ) : null}
      </>
    );
  }
);

