import React, { useContext, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  NativeModules,
  Platform,
  KeyboardAvoidingView,
  Modal,
  KeyboardAvoidingViewProps,
  Dimensions,
  Text,
} from 'react-native';
import { Style } from './styles';
import {
  localize,
  CometChatLiveReactions,
  CometChatBottomSheet,
  CometChatMessagePreview,
  MessagePreviewStyle,
  CometChatActionSheet,
  ActionSheetStyles,
  CometChatContext,
  CometChatMentionsFormatter,
  CometChatUrlsFormatter,
  CometChatTextFormatter,
  MentionTextStyle,
  CometChatSuggestionList,
  SuggestionItem,
  CometChatUIKit,
} from '../shared';

import { CheckPropertyExists } from '../shared/helper/functions';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';

import {
  getUnixTimestamp,
  getUnixTimestampInMilliseconds,
  messageStatus,
} from '../shared/utils/CometChatMessageHelper';
import { CometChatSoundManager, ChatConfigurator } from '../shared';
import {
  ConversationOptionConstants,
  MentionsVisibility,
  MessageTypeConstants,
  MetadataConstants,
  ReceiverTypeConstants,
  ViewAlignment,
} from '../shared/constants/UIKitConstants';
import { ICONS } from './resources';
import { CometChatMessageInput } from '../shared';
import {
  BaseStyle,
  BorderStyleInterface,
  FontStyleInterface,
} from '../shared/base';
import { ImageType } from '../shared';
import { MessageEvents } from '../shared/events';
import { CometChatContextType } from '../shared/base/Types';
import { CometChatUIEventHandler } from '../shared/events/CometChatUIEventHandler/CometChatUIEventHandler';
import { CometChatMessageComposerActionInterface } from '../shared/helper/types';
import { CometChatMediaRecorder, MediaRecorderStyle } from '../shared/views/CometChatMediaRecorder';
import { AIOptionsStyle } from '../AI/AIOptionsStyle';
import { CommonUtils } from '../shared/utils/CommonUtils';
import { permissionUtil } from '../shared/utils/PermissionUtil';
import { commonVars } from '../shared/base/vars';
const { FileManager, CommonUtil } = NativeModules;

const uiEventListenerShow = 'uiEvent_show_' + new Date().getTime();
const uiEventListenerHide = 'uiEvent_hide_' + new Date().getTime();

const MessagePreviewTray = (props: any) => {
  const { shouldShow = false, text = '', onClose = () => { } } = props;
  return shouldShow ? (
    <CometChatMessagePreview
      style={new MessagePreviewStyle({ width: '95%', backgroundColor: "white" })}
      messagePreviewTitle={localize('EDIT_MESSAGE')}
      messagePreviewSubtitle={text}
      closeIconURL={ICONS.CLOSE}
      onCloseClick={onClose}
    />
  ) : null;
};

const ImageButton = (props: any) => {
  const { image, onClick, buttonStyle, imageStyle, disable } = props;
  return (
    <TouchableOpacity activeOpacity={disable ? 1 : undefined} onPress={disable ? () => { } : onClick} style={buttonStyle}>
      <Image source={image} style={[{ height: 24, width: 24 }, imageStyle]} />
    </TouchableOpacity>
  );
};

const AttachIconButton = (props: any) => {
  const { icon, show = false, onClick = () => { }, style, theme } = props;
  if (show) {
    return (
      <ImageButton
        image={icon}
        imageStyle={[Style.imageStyle, style]}
        onClick={onClick}
      />
    );
  } else {
    return <View style={[Style.imageStyle, style]} />;
  }
};

const EmojiBoard = (props: any) => {
  const {
    shouldShow = false,
    onClose = () => { },
    emojiSelection = (emoji?: any) => { },
    ...otherProps
  } = props;
  return shouldShow ? (
    <CometChatBottomSheet onClose={onClose}>
      {/* <CometChatEmojiKeyboard onClick={emojiSelection} {...otherProps} /> */}
    </CometChatBottomSheet>
  ) : null;
};

const ActionSheetBoard = (props: any) => {
  const {
    shouldShow = false,
    onClose = () => { },
    options = [],
    cometChatBottomSheetStyle = {},
    sheetRef,
    ...otherProps
  } = props;
  return shouldShow ? (
    <CometChatBottomSheet
      ref={sheetRef}
      onClose={onClose}
      style={cometChatBottomSheetStyle}
    >
      <CometChatActionSheet
        actions={options}
        {...otherProps}
        onPress={props.onClick}
      />
    </CometChatBottomSheet>
  ) : null;
};

const RecordAudio = (props: any) => {
  const {
    shouldShow = false,
    onClose = () => { },
    options = [],
    cometChatBottomSheetStyle = {},
    sheetRef,
    onPause = () => { },
    onPlay = () => { },
    onSend = (recordedFile: String) => { },
    onStop = (recordedFile: String) => { },
    onStart = () => { },
    mediaRecorderStyle,
    pauseIconUrl,
    playIconUrl,
    recordIconUrl,
    deleteIconUrl,
    stopIconUrl,
    submitIconUrl,
    ...otherProps
  } = props;
  return shouldShow ? (
    <CometChatBottomSheet
      ref={sheetRef}
      onClose={onClose}
      style={cometChatBottomSheetStyle}
    >
      <CometChatMediaRecorder
        onClose={onClose}
        onPause={onPause}
        onPlay={onPlay}
        onSend={onSend}
        onStop={onStop}
        onStart={onStart}
        mediaRecorderStyle={mediaRecorderStyle}
        pauseIconUrl={pauseIconUrl}
        playIconUrl={playIconUrl}
        recordIconUrl={recordIconUrl}
        deleteIconUrl={deleteIconUrl}
        stopIconUrl={stopIconUrl}
        submitIconUrl={submitIconUrl}
      />
    </CometChatBottomSheet>
  ) : null;
}

const AIOptions = (props: any) => {
  const {
    aiStyle,
    shouldShow = false,
    onClose = () => { },
    cometChatBottomSheetStyle = { backgroundColor: aiStyle.backgroundColor, paddingHorizontal: 0 },
    sheetRef,
    aiOptions,
    ...otherProps
  } = props;

  return shouldShow ? (
    <CometChatBottomSheet
      ref={sheetRef}
      onClose={onClose}
      style={cometChatBottomSheetStyle}
    >

      <CometChatActionSheet
        actions={aiOptions}
        style={{ ...aiStyle, paddingHorizontal: 0 }}
        {...otherProps}
        onPress={props.onClick}
        hideHeader={true}
      />
    </CometChatBottomSheet>
  ) : null;
}

const LiveReaction = (props: any) => {
  const { show = false, reaction } = props;
  if (show) {
    return <CometChatLiveReactions reaction={reaction} />;
  }
  return null;
};

let recordedTime = 0, timerIntervalId = null;

export interface MessageComposerStyleInterface extends BaseStyle {
  attachIconTint?: string;
  sendIconTint?: string;
  inputBackground?: string;
  inputBorder?: BorderStyleInterface;
  dividerTint?: string;
  textFont?: FontStyleInterface;
  textColor?: string;
  placeholderTextColor?: string;
  placeholderTextFont?: FontStyleInterface;

  actionSheetSeparatorTint?: string;
  actionSheetTitleColor?: string;
  actionSheetTitleFont?: FontStyleInterface;
  actionSheetLayoutModeIconTint?: string;
  actionSheetCancelButtonIconTint?: string;
}
type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>

type IntRange<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>

export interface CometChatMessageComposerInterface {
  /**
   *
   *
   * @type {(string | number)}
   * @description Message composer identifier
   */
  id?: string | number;
  /**
   *
   *
   * @type {CometChat.User}
   * @description CometChat SDK’s user object
   */
  user?: CometChat.User;
  /**
   *
   *
   * @type {CometChat.Group}
   * @description CometChat SDK’s group object
   */
  group?: CometChat.Group;
  /**
   *
   *
   * @type {boolean}
   * @description Turn off sound for outgoing messages
   */
  disableSoundForMessages?: boolean;
  /**
   *
   *
   * @type {*}
   * @description Custom audio sound to be played while sending messages
   */
  customSoundForMessage?: any;
  /**
   *
   *
   * @type {boolean}
   * @description Disable typing events
   */
  disableTypingEvents?: boolean;
  /**
   *
   *
   * @type {string}
   * @description CometChatMessageComposerInterface
   */
  text?: string;
  /**
   *
   *
   * @type {string}
   * @description Text shown in the composer when the input message is empty
   */
  placeHolderText?: string;
  /**
   *
   *
   * @type {React.FC}
   * @description Preview section at the top of the composer
   */
  HeaderView?: React.FC;
  /**
   *
   *
   * @type {React.FC}
   * @description Preview section at the bottom of the composer
   */
  FooterView?: React.FC;
  /**
   *
   *
   * @description onChange event triggered when the input changes
   */
  onChangeText?: (text: string) => void;
  /**
   *
   *
   * @type {number}
   * @description Threshold value when reached, input will not expand further, causing it to scroll
   */
  maxHeight?: number;
  /**
   *
   *
   * @type {ImageType}
   * @description Attachment Icon
   */
  attachmentIcon?: ImageType;
  /**
   *
   *
   * @type {*}
   * @description CometChatMessageComposerInterface
   */
  attachmentOptions?: ({
    user,
    group,
    composerId,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
    composerId: Map<any, any>;
  }) => CometChatMessageComposerActionInterface[];

  /**
   *
   *
   * @type {FunctionComponent}
   * @description function which return a JSX Element which replaces the default Secondary Button
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
   *
   *
   * @type {FunctionComponent}
   * @description Function which return a JSX Element which replaces the default Auxiliary Button
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
   *
   *
   * @type {('left' | 'right')}
   * @description Alignment for auxiliary buttons
   */
  auxiliaryButtonsAlignment?: 'left' | 'right';
  /**
   *
   *
   * @type {FunctionComponent}
   * @description Function which return a JSX Element which replaces the default Send Button
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
   *
   *
   * @type {(string | number)}
   * @description Message id required for threaded messages
   */
  parentMessageId?: string | number;
  /**
   *
   *
   * @type {boolean}
   * @description Hide the live reaction button
   */
  hideLiveReaction?: boolean;
  /**
   *
   *
   * @type {ImageType}
   * @description Live reaction Icon
   */
  liveReactionIcon?: ImageType;
  /**
   *
   *
   * @type {MessageComposerStyleInterface}
   * @description Message Composer Styles
   */
  messageComposerStyle?: MessageComposerStyleInterface;
  /**
   *
   *
   * @type {boolean}
   * @description Hide the record voice button
   */
  hideVoiceRecording?: boolean;
  /**
   *
   *
   * @type {string}
   * @description Image URL for the voice recording icon
   */
  voiceRecordingIconURL?: string;
  /**
   *
   *
   * @type {MediaRecorderStyle}
   * @description Voice Recording Styles
   */
  mediaRecorderStyle?: MediaRecorderStyle;
  /**
   *
   *
   * @type {ImageType}
   * @description Pause Icon Icon
   */
  pauseIconUrl?: ImageType;
  /**
   *
   *
   * @type {ImageType}
   * @description Play Icon Icon
   */
  playIconUrl?: ImageType;
  /**
   *
   *
   * @type {ImageType}
   * @description Record Icon Icon
   */
  recordIconUrl?: ImageType;
  /**
   *
   *
   * @type {ImageType}
   * @description Delete Icon Icon
   */
  deleteIconUrl?: ImageType;
  /**
   *
   *
   * @type {ImageType}
   * @description Stop Icon Icon
   */
  stopIconUrl?: ImageType;
  /**
   *
   *
   * @type {ImageType}
   * @description Submit Icon Icon
   */
  submitIconUrl?: ImageType;
  /**
   *
   * @type {Function}
   * @description callback(BaseMessage)→ void
   */
  onSendButtonPress?: (message: CometChat.BaseMessage) => void;
  /**
   *
   * @type {ErrorCallback}
   * @description callback(error)→ void
   */
  onError?: (error: any) => void;
  /**
  * AI Icon URL.
  */
  AIIconURL?: string;
  /**
   * AI Options Style.
   */
  aiOptionsStyle?: AIOptionsStyle;
  /**
  * To override keyboardAvoidingViewProps.
  */
  keyboardAvoidingViewProps?: KeyboardAvoidingViewProps
  /**
   * Collection of text formatter class
   * @type {Array<CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter>}
  */
  textFormatters?: Array<CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter>;
  disableMentions?: boolean;
  /*
   * To manually manage image quality taken from the camera (100 means no compression).
   * @default 20
   */
  imageQuality?: IntRange<1, 100>
}
export const CometChatMessageComposer = React.forwardRef(
  (props: CometChatMessageComposerInterface, ref) => {
    const editMessageListenerID = 'editMessageListener_' + new Date().getTime();
    const UiEventListenerID = 'UiEventListener_' + new Date().getTime();

    const { theme } = useContext<CometChatContextType>(CometChatContext);
    const {
      id,
      user,
      group,
      disableSoundForMessages,
      customSoundForMessage,
      disableTypingEvents,
      text,
      placeHolderText,
      HeaderView,
      FooterView,
      onChangeText,
      maxHeight,
      attachmentIcon,
      attachmentOptions,
      SecondaryButtonView,
      AuxiliaryButtonView,
      auxiliaryButtonsAlignment,
      SendButtonView,
      parentMessageId,
      hideLiveReaction,
      liveReactionIcon,
      messageComposerStyle,
      onSendButtonPress,
      onError,
      hideVoiceRecording,
      voiceRecordingIconURL,
      mediaRecorderStyle,
      pauseIconUrl,
      playIconUrl,
      recordIconUrl,
      deleteIconUrl,
      stopIconUrl,
      submitIconUrl,
      AIIconURL,
      aiOptionsStyle,
      keyboardAvoidingViewProps,
      textFormatters,
      disableMentions,
      imageQuality = 20
    } = props;

    const defaultAttachmentOptions =
      ChatConfigurator.dataSource.getAttachmentOptions(user, group, id);

    const composerIdMap = new Map().set('parentMessageId', parentMessageId);
    const defaultAuxiliaryButtonOptions =
      ChatConfigurator.getDataSource().getAuxiliaryOptions(
        user,
        group,
        composerIdMap,
        theme
      );

    const loggedInUser = React.useRef<any>({});
    const chatWith = React.useRef<any>(null);
    const chatWithId = React.useRef<any>(null);
    const messageInputRef = React.useRef<any>(null);
    const chatRef = React.useRef<any>(chatWith);
    const inputValueRef = React.useRef<any>(null);
    const plainTextInput = React.useRef<string>("");
    let mentionMap = React.useRef<Map<string, SuggestionItem>>(new Map());
    let trackingCharacters = React.useRef<string[]>([])
    let allFormatters = React.useRef<Map<string, CometChatTextFormatter | CometChatMentionsFormatter>>(new Map());
    let activeCharacter = React.useRef("")
    let searchStringRef = React.useRef("");

    const [selectionPosition, setSelectionPosition] = React.useState<any>({});
    const [inputMessage, setInputMessage] = React.useState<string | JSX.Element>(text || '');
    const [showReaction, setShowReaction] = React.useState(false);
    const [showEmojiboard, setShowEmojiboard] = React.useState(false);
    const [showActionSheet, setShowActionSheet] = React.useState(false);
    const [showRecordAudio, setShowRecordAudio] = React.useState(false);
    const [showAIOptions, setShowAIOptions] = React.useState(false);
    const [AIOptionItems, setAIOptionItems] = React.useState([]);
    const [rootAIOptionItems, setRootAIOptionItems] = React.useState([]);
    const [actionSheetItems, setActionSheetItems] = React.useState([]);
    const [messagePreview, setMessagePreview] = React.useState(null);
    const [CustomView, setCustomView] = React.useState(null);
    const [CustomViewHeader, setCustomViewHeader] = React.useState(null);
    const [CustomViewFooter, setCustomViewFooter] = React.useState(null);
    const [isVisible, setIsVisible] = React.useState(false);
    const [kbOffset, setKbOffset] = React.useState(59);
    const [showMentionList, setShowMentionList] = React.useState(false);
    const [mentionsSearchData, setMentionsSearchData] = React.useState<Array<SuggestionItem>>([]);
    const [suggestionListLoader, setSuggestionListLoader] = React.useState(false);

    const bottomSheetRef = React.useRef<any>(null);

    useLayoutEffect(() => {
      if (Platform.OS === "ios") {
        if (Number.isInteger(commonVars.safeAreaInsets.top)) {
          setKbOffset(commonVars.safeAreaInsets.top)
          return;
        }
        CommonUtil.getSafeAreaInsets().then(res => {
          if (Number.isInteger(res.top)) {
            commonVars.safeAreaInsets.top = res.top;
            commonVars.safeAreaInsets.bottom = res.bottom;
            setKbOffset(res.top)
          }
        })
      }
    }, []);

    const AIStyles = new AIOptionsStyle({
      //NEED TO ADD DEFAULT STYLE HERE
      backgroundColor: theme.palette.getBackgroundColor(),
      listItemBackground: theme.palette.getBackgroundColor(),
      listItemTitleFont: theme.typography.subtitle1,
      listItemTitleColor: theme.palette.getAccent(),
      listItemBorderRadius: 0,
      optionsSeparatorTint: theme.palette.getAccent200(),
      borderRadius: 0,
      ...aiOptionsStyle,
    })

    let isTyping = null;

    /**
     * Event callback
     */
    React.useImperativeHandle(ref, () => ({
      previewMessageForEdit: previewMessage,
    }));

    const previewMessage = ({ message, status }: any) => {
      if (status === messageStatus.inprogress) {

        let textComponents = message?.text;

        let rawText = message?.text;

        let users: { key: string, value: SuggestionItem } = {};
        let regexes: Array<RegExp> = [];

        allFormatters.current.forEach((formatter: CometChatTextFormatter, key) => {
          formatter.handleComposerPreview(message);
          if (!regexes.includes(formatter.getRegexPattern())) {
            regexes.push(formatter.getRegexPattern());
          }
          let suggestionUsers = formatter.getSuggestionItems();
          suggestionUsers.forEach(item => users[item.underlyingText] = item);
          let resp = formatter.getFormattedText(textComponents);
          textComponents = resp;
        })

        let edits = [];

        regexes.forEach(regex => {
          let match;
          while ((match = regex.exec(rawText)) !== null) {
            const user = users[match[0]];
            if (user) {
              edits.push({
                startIndex: match.index,
                endIndex: regex.lastIndex,
                replacement: user.promptText,
                user
              });
            }
          }
        });

        // Sort edits by startIndex to apply them in order
        edits.sort((a, b) => a.startIndex - b.startIndex);

        plainTextInput.current = getPlainString(message?.text, edits)

        const hashMap = new Map();
        let offset = 0; // Tracks shift in position due to replacements

        edits.forEach(edit => {
          const adjustedStartIndex = edit.startIndex + offset;
          rawText = rawText.substring(0, adjustedStartIndex) + edit.replacement + rawText.substring(edit.endIndex);
          offset += edit.replacement.length - (edit.endIndex - edit.startIndex);
          const rangeKey = `${adjustedStartIndex}_${adjustedStartIndex + edit.replacement.length}`;
          hashMap.set(rangeKey, edit.user);
        });

        mentionMap.current = hashMap;

        setMessagePreview({
          message: { ...message, text: textComponents },
          mode: ConversationOptionConstants.edit,
        });

        inputValueRef.current = textComponents ?? '';
        setInputMessage(textComponents ?? '');
        messageInputRef.current.focus();
      }
    };

    const cameraCallback = async (cameraImage: any) => {
      if (CheckPropertyExists(cameraImage, 'error')) {
        return;
      }
      const { name, uri, type } = cameraImage;
      let file = {
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
    }

    const fileInputHandler = async (fileType: string) => {
      if (fileType === MessageTypeConstants.takePhoto) {
        if (!(await permissionUtil.startResourceBasedTask(["camera"]))) {
          return;
        }
        let quality = imageQuality
        if (isNaN(imageQuality) || imageQuality < 1 || imageQuality > 100) {
          quality = 20
        }
        if (Platform.OS === "android") {
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
      }
      else if (Platform.OS === 'ios' && fileType === MessageTypeConstants.video) {
        NativeModules.VideoPickerModule.pickVideo(((file) => {
          if (file.uri)
            sendMediaMessage(
              chatWithId.current,
              file,
              MessageTypeConstants.video,
              chatWith.current
            );
        }))
      }
      else
        FileManager.openFileChooser(fileType, async (fileInfo: any) => {
          if (CheckPropertyExists(fileInfo, 'error')) {
            return;
          }
          let { name, uri, type } = fileInfo;
          let file = {
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
    };

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

    const liveReactionHandler = () => {
      if (hideLiveReaction) return;
      if (!showReaction) {
        setShowReaction(true);

        //send reaction event
        const data = {
          type: MetadataConstants.liveReaction,
          reaction: liveReactionIcon,
        };

        /*** send transient message */
        let transientMessage = new CometChat.TransientMessage(
          chatWithId.current,
          chatWith.current,
          data
        );

        CometChat.sendTransientMessage(transientMessage);

        setTimeout(() => {
          setShowReaction(false);
          CometChatUIEventHandler.emitMessageEvent(
            MessageEvents.ccMessageLiveReaction,
            { liveReactionIcon }
          );
        }, 1500);
      }
    };

    const clearInputBox = () => {
      inputValueRef.current = '';
      setInputMessage('');
    };

    const sendTextMessage = () => {

      //ignore sending new message
      if (messagePreview != null) {
        editMessage(messagePreview.message);
        return;
      }

      let finalTextInput = getRegexString(plainTextInput.current);

      let textMessage = new CometChat.TextMessage(
        chatWithId.current,
        finalTextInput,
        chatWith.current
      );

      textMessage.setSender(loggedInUser.current);
      textMessage.setReceiver(chatWith.current);
      textMessage.setText(finalTextInput);
      textMessage.setMuid(String(getUnixTimestampInMilliseconds()));
      textMessage.setSentAt(getUnixTimestamp());
      parentMessageId && textMessage.setParentMessageId(parentMessageId as number);

      allFormatters.current.forEach(item => {
        textMessage = item.handlePreMessageSend(textMessage);
      })

      setMentionsSearchData([]);
      plainTextInput.current = ""

      if (onSendButtonPress) {
        onSendButtonPress(textMessage);
        return;
      }

      if (finalTextInput.trim().length == 0) {
        return;
      }
      CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, {
        message: textMessage,
        status: messageStatus.inprogress,
      });

      if (!disableSoundForMessages) playAudio();
      clearInputBox();
      CometChat.sendMessage(textMessage)
        .then((message: any) => {
          CometChatUIEventHandler.emitMessageEvent(
            MessageEvents.ccMessageSent,
            {
              message: message,
              status: messageStatus.success,
            }
          );
        })
        .catch((error: any) => {
          onError && onError(error);
          textMessage.data.metaData = { error: true }
          CometChatUIEventHandler.emitMessageEvent(
            MessageEvents.ccMessageSent,
            {
              message: textMessage,
              status: messageStatus.error,
            }
          );
          clearInputBox();
        });
    };

    /** edit message */
    const editMessage = (message: any) => {
      endTyping(null, null);

      let finalTextInput = getRegexString(plainTextInput.current);

      let messageText = finalTextInput.trim();
      let textMessage = new CometChat.TextMessage(
        chatWithId.current,
        messageText,
        chatWith.current
      );
      textMessage.setId(message.id);
      parentMessageId && textMessage.setParentMessageId(parentMessageId as number);

      inputValueRef.current = '';
      setInputMessage('');
      messageInputRef.current.textContent = '';

      if (!disableSoundForMessages) playAudio();

      setMessagePreview(null);

      CometChat.editMessage(textMessage)
        .then((editedMessage: any) => {
          inputValueRef.current = '';
          setInputMessage('');
          CometChatUIEventHandler.emitMessageEvent(
            MessageEvents.ccMessageEdited,
            {
              message: editedMessage,
              status: messageStatus.success,
            }
          );
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
      receiverType?: any
    ) => {
      setShowActionSheet(false);
      let mediaMessage = new CometChat.MediaMessage(
        receiverId,
        messageInput,
        messageType,
        receiverType
      );

      mediaMessage.setSender(loggedInUser.current);
      mediaMessage.setReceiver(receiverType);
      mediaMessage.setType(messageType);
      mediaMessage['_composedAt'] = Date.now();
      mediaMessage['_id'] = '_' + Math.random().toString(36).substr(2, 9);
      mediaMessage.setId(mediaMessage['_id']);
      mediaMessage.setMuid(String(getUnixTimestampInMilliseconds()));
      mediaMessage.setSentAt(getUnixTimestamp());
      mediaMessage.setData({
        type: messageType,
        category: CometChat.CATEGORY_MESSAGE,
        name: messageInput['name'],
        file: messageInput,
        url: messageInput['uri'],
        sender: loggedInUser.current,
      });
      parentMessageId && mediaMessage.setParentMessageId(parentMessageId as number);

      let localMessage = new CometChat.MediaMessage(
        receiverId,
        messageInput,
        messageType,
        receiverType
      );

      localMessage.setSender(loggedInUser.current);
      localMessage.setReceiver(receiverType);
      localMessage.setType(messageType);
      localMessage['_composedAt'] = Date.now();
      localMessage['_id'] = '_' + Math.random().toString(36).substr(2, 9);
      localMessage.setId(localMessage['_id']);
      localMessage.setMuid(String(getUnixTimestampInMilliseconds()));
      localMessage.setSentAt(getUnixTimestamp());
      localMessage.setData({
        type: messageType,
        category: CometChat.CATEGORY_MESSAGE,
        name: messageInput['name'],
        file: messageInput,
        url: messageInput['uri'],
        sender: loggedInUser.current,
      });
      parentMessageId && localMessage.setParentMessageId(parentMessageId as number);
      localMessage.setData({
        type: messageType,
        category: CometChat.CATEGORY_MESSAGE,
        name: messageInput['name'],
        file: messageInput,
        url: messageInput['uri'],
        sender: loggedInUser.current,
        attachments: [messageInput],
      });

      CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, {
        message: localMessage,
        status: messageStatus.inprogress,
      });

      if (!disableSoundForMessages) playAudio();
      CometChat.sendMediaMessage(mediaMessage)
        .then((message: any) => {
          setTimeout(() => {
            CometChatUIEventHandler.emitMessageEvent(
              MessageEvents.ccMessageSent,
              {
                message: message,
                status: messageStatus.success,
              }
            );
            setShowRecordAudio(false);
          }, 1000);
        })
        .catch((error: any) => {
          setShowRecordAudio(false);
          onError && onError(error);
          localMessage.data.metaData = { error: true }
          CometChatUIEventHandler.emitMessageEvent(
            MessageEvents.ccMessageSent,
            {
              message: localMessage,
              status: messageStatus.error,
            }
          );
          console.log('media message sent error', error);
        });
    };

    const startTyping = (endTypingTimeout?: any, typingMetadata?: any) => {
      //if typing is disabled
      if (disableTypingEvents) {
        return false;
      }

      //if typing is in progress
      if (isTyping) {
        return false;
      }

      let typingInterval = endTypingTimeout || 5000;
      let metadata = typingMetadata || undefined;

      let typingNotification = new CometChat.TypingIndicator(
        chatWithId.current,
        chatWith.current,
        metadata
      );
      CometChat.startTyping(typingNotification);

      isTyping = setTimeout(() => {
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

      clearTimeout(isTyping);
      isTyping = null;
      return false;
    };

    // const getActionSheetStyle = () => {
    //   return new ActionSheetStyles({
    //     layoutModeIconTint:
    //       messageComposerStyle.actionSheetLayoutModeIconTint ??
    //       theme.palette.getPrimary(),
    //     titleFont:
    //       messageComposerStyle.actionSheetTitleFont ?? theme.typography.text1,
    //     titleColor:
    //       messageComposerStyle.actionSheetTitleColor ??
    //       theme.palette.getAccent800(),
    //   });
    // };

    const GetEmojiIconView = () => {
      return (
        <ImageButton
          image={ICONS.EMOJI}
          imageStyle={Style.imageStyle}
          onClick={() => setShowEmojiboard(true)}
        />
      );
    };

    const shouldShowAIOptions = () => {
      return AIOptionItems.length > 0;
    }

    const AuxiliaryButtonViewElem = () => {
      if (AuxiliaryButtonView)
        return (
          <AuxiliaryButtonView user={user} group={group} composerId={id} />
        );
      else if (defaultAuxiliaryButtonOptions)
        return <View style={{ flexDirection: "row", alignItems: "center" }}>
          {defaultAuxiliaryButtonOptions}
          {shouldShowAIOptions() && <AIOptionsButtonView />}
          {!hideVoiceRecording && <RecordAudioButtonView />}
        </View>;

      return hideVoiceRecording ? null : <RecordAudioButtonView />;
    };

    const SendButtonViewElem = () => {
      if (SendButtonView)
        return <SendButtonView user={user} group={group} composerId={id} />;
      return (
        <ImageButton
          image={ICONS.SEND}
          imageStyle={[
            Style.imageStyle,
            {
              tintColor: ((inputMessage as String).length === 0) ? theme.palette.getAccent400() :
                messageComposerStyle.sendIconTint ||
                theme.palette.getPrimary(),
            },
          ]}
          disable={((inputMessage as String).length === 0)}
          onClick={sendTextMessage}
        />
      );
    };

    const SecondaryButtonViewElem = () => {
      if (SecondaryButtonView)
        return (
          <SecondaryButtonView user={user} group={group} composerId={id} />
        );
      return (
        <AttachIconButton
          icon={attachmentIcon}
          show={true}
          onClick={() => setShowActionSheet(true)}
          style={{
            height: 23,
            width: 23,
            resizeMode: 'contain',
            tintColor: messageComposerStyle.attachIconTint
              ? messageComposerStyle.attachIconTint
              : theme.palette.getAccent(),
          }}
        />
      );
    };
    const PrimaryButtonView = () => {
      return ((inputMessage as String).length !== 0) || hideLiveReaction ? (
        <SendButtonViewElem />
      ) : (
        <View>
          <View style={Style.liveReactionStyle}>
            <LiveReaction show={showReaction} reaction={liveReactionIcon} />
          </View>
          <ImageButton
            image={liveReactionIcon}
            imageStyle={[Style.imageStyle, Style.liveReactionBtnStyle]}
            onClick={liveReactionHandler}
          />
        </View>
      );
    };

    const RecordAudioButtonView = () => {
      return <ImageButton
        image={voiceRecordingIconURL || ICONS.MICROPHONE}
        imageStyle={Style.imageStyle}
        onClick={() => setShowRecordAudio(true)}
      />
    }
    const AIOptionsButtonView = () => {
      return <ImageButton
        image={AIIconURL || ICONS.AI}
        imageStyle={Style.imageStyle}
        onClick={() => {
          setShowAIOptions(true)
          setAIOptionItems(rootAIOptionItems)
        }}
      />
    }

    //fetch logged in user
    useEffect(() => {
      CometChat.getLoggedinUser().then((user) => (loggedInUser.current = user));
      let _formatter = [...(textFormatters || [])] || [];

      if (!disableMentions) {
        let mentionsFormatter = ChatConfigurator.getDataSource().getMentionsFormatter();
        mentionsFormatter.setLoggedInUser(CometChatUIKit.loggedInUser);
        mentionsFormatter.setMentionsStyle(new MentionTextStyle({
          loggedInUserTextStyle: {
            color: theme.palette.getPrimary(),
            ...theme.typography.title2,
            fontSize: 17
          },
          textStyle: {
            color: theme.palette.getPrimary(),
            ...theme.typography.subtitle1,
            fontSize: 17
          }
        }));
        mentionsFormatter.setUser(user);
        mentionsFormatter.setGroup(group);

        _formatter.unshift(mentionsFormatter)
      }

      _formatter.forEach((formatter) => {
        formatter.setComposerId(id);
        formatter.setUser(user);
        formatter.setGroup(group);
        let trackingCharacter = formatter.getTrackingCharacter();
        trackingCharacters.current.push(trackingCharacter);

        let newFormatter = CommonUtils.clone(formatter);
        allFormatters.current.set(trackingCharacter, newFormatter);
      })
    }, []);

    useEffect(() => {
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

    const handleOnClick = (CustomView) => {
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
      setTimeout(() => {
        setCustomView(() => view);
        setIsVisible(true);
      }, 200);
    };

    useEffect(() => {
      const defaultAttachmentOptions =
        ChatConfigurator.dataSource.getAttachmentOptions(user, group, composerIdMap);
      setActionSheetItems(() =>
        attachmentOptions && typeof attachmentOptions === 'function'
          ? attachmentOptions({ user, group, composerId: composerIdMap })?.map((item) => {
            if (typeof item.CustomView === 'function')
              return {
                ...item,
                onPress: () => handleOnClick(item.CustomView),
              };
            if (typeof item.onPress == 'function')
              return {
                ...item,
                onPress: () => item.onPress(user, group),
              };
            return {
              ...item,
              onPress: () => fileInputHandler(item.id),
            };
          })
          : defaultAttachmentOptions.map((item) => {
            if (typeof item.CustomView === 'function')
              return {
                ...item,
                onPress: () => handleOnClick(item.CustomView),
              };
            if (typeof item.onPress === 'function')
              return {
                ...item,
                onPress: () => item.onPress(user, group),
              };
            return {
              ...item,
              onPress: () => fileInputHandler(item.id),
            };
          })
      );

      const aiOptions = ChatConfigurator.dataSource.getAIOptions(user, group, theme, composerIdMap, AIStyles);
      let newAiOptions = _getAIOptions(aiOptions);
      setAIOptionItems(newAiOptions);
      setRootAIOptionItems(newAiOptions);
    }, [user, group, id, parentMessageId]);

    const _getAIOptions = (options) => {
      let newOptions = [...options];
      let newAiOptions = newOptions.map((item) => {
        if (typeof item.onPress === 'function')
          return {
            ...item,
            onPress: () => {
              setShowAIOptions(false)
              item.onPress(user)
            },
          };
        return {
          ...item,
          onPress: () => { },
        };
      })
      return newAiOptions;

    }

    useEffect(() => {
      CometChatUIEventHandler.addMessageListener(editMessageListenerID, {
        ccMessageEdited: (item) => previewMessage(item),
      });
      CometChatUIEventHandler.addUIListener(UiEventListenerID, {
        ccToggleBottomSheet: (item) => {
          if (item?.bots) {
            let newAiOptions = _getAIOptions(item.bots)
            setAIOptionItems(newAiOptions);
            setShowAIOptions(true)
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
          setInputMessage(text?.text)

        },
        ccSuggestionData(item: { id: string | number, data: Array<SuggestionItem> }) {
          if (activeCharacter.current && id === item?.id) {
            setMentionsSearchData(item?.data);
            setSuggestionListLoader(false);
          }
        },
      })
      return () => {
        CometChatUIEventHandler.removeMessageListener(editMessageListenerID);
        CometChatUIEventHandler.removeUIListener(UiEventListenerID);
      }
    }, []);

    const handlePannel = (item) => {
      if (item.child) {
        if (item.alignment === ViewAlignment.composerTop)
          setCustomViewHeader(() => item.child);
        else if (item.alignment === ViewAlignment.composerBottom)
          setCustomViewFooter(() => item.child);
      } else {
        if (item.alignment === ViewAlignment.composerTop)
          setCustomViewHeader(null);
        else if (item.alignment === ViewAlignment.composerBottom)
          setCustomViewFooter(null);
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

    const _sendRecordedAudio = (recordedFile: String) => {
      let fileObj = {
        "name": "audio-recording" + recordedFile.split("/audio-recording")[1],
        "type": "audio/mp4",
        "uri": recordedFile
      }
      console.log("fileObj", fileObj);
      sendMediaMessage(
        chatWithId.current,
        fileObj,
        MessageTypeConstants.audio,
        chatWith.current
      );
      console.log("Send Audio");
    }

    function isCursorWithinMentionRange(mentionRanges, cursorPosition) {
      for (let [range, mention] of mentionRanges) {
        const [start, end] = range.split('_').map(Number);
        if (cursorPosition >= start && cursorPosition <= end) {
          return true; // Cursor is within the range of a mention
        }
      }
      return false; // No mention found at the cursor position
    }

    function shouldOpenList(selection: {
      start: number;
      end: number;
    }, searchString: string, tracker: string) {
      return (selection.start === selection.end
        && !isCursorWithinMentionRange(mentionMap.current, selection.start - searchString.length)
        && trackingCharacters.current.includes(tracker)
        && (searchString === "" ? ((plainTextInput.current[selection.start - 2]?.length === 1 && plainTextInput.current[selection.start - 2]?.trim()?.length === 0) || plainTextInput.current[selection.start - 2] === undefined) : true)
        && ((plainTextInput.current[selection.start - 1]?.length === 1 && plainTextInput.current[selection.start - 1]?.trim()?.length === 0) ? searchString.length > 0 : true)
      )
    }

    let timeoutId;
    const openList = (selection: {
      start: number;
      end: number;
    }) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        let searchString = extractTextFromCursor(plainTextInput.current, selection.start);
        let tracker = searchString ? plainTextInput.current[selection.start - (searchString.length + 1)] : plainTextInput.current[selection.start - 1];

        if (shouldOpenList(selection, searchString, tracker)) {
          activeCharacter.current = tracker;
          searchStringRef.current = searchString;
          setShowMentionList(true);

          let formatter = allFormatters.current.get(tracker);
          if (formatter instanceof CometChatMentionsFormatter) {
            let shouldShowMentionList = (formatter.getVisibleIn() === MentionsVisibility.both) || (formatter.getVisibleIn() === MentionsVisibility.usersConversationOnly && user) || (formatter.getVisibleIn() === MentionsVisibility.groupsConversationOnly && group);
            if (shouldShowMentionList) {
              formatter.search(searchString);
            }
          } else {
            formatter.search(searchString);
          }

        } else {
          activeCharacter.current = "";
          searchStringRef.current = "";
          setShowMentionList(false);
          setMentionsSearchData([]);
        }
      }, 100);
    }

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

    }

    const getPlainString = (str: string, edits: Array<{
      "endIndex": number,
      "replacement": string,
      "startIndex": number,
      "user": SuggestionItem
    }>) => {
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

    }

    const textChangeHandler = (txt: string) => {
      let removing = plainTextInput.current.length > txt.length;
      let adding = plainTextInput.current.length < txt.length;
      let textDiff = txt.length - plainTextInput.current.length;
      let notAtLast = (selectionPosition.start + textDiff) < txt.length;

      plainTextInput.current = txt;
      onChangeText && onChangeText(txt);
      startTyping();

      let decr = 0;

      let newMentionMap = new Map(mentionMap.current);

      mentionMap.current.forEach((value, key) => {
        let position = { start: parseInt(key.split("_")[0]), end: parseInt(key.split("_")[1]) };

        //Runs when cursor before the mention and before the last position

        if (notAtLast && (((selectionPosition.start - 1) <= position.start)
          || ((selectionPosition.start - textDiff) <= position.start)
        )) {
          if (removing) {
            decr = ((selectionPosition.end) - selectionPosition.start) - (textDiff);
            position = { start: position.start - decr, end: position.end - decr };
          } else if (adding) {
            decr = ((selectionPosition.end) - selectionPosition.start) + (textDiff);
            position = { start: position.start + decr, end: position.end + decr };
          }
          if (removing || adding) {
            let newKey = `${position.start}_${position.end}`;
            position.start >= 0 && newMentionMap.set(newKey, value);
            newMentionMap.delete(key);
          }
        }

        // Code to delete mention from hashmap 👇
        let expctedMentionPos = plainTextInput.current.substring(position.start, position.end);

        if (expctedMentionPos !== `${value.promptText}`) {
          let newKey = `${position.start}_${position.end}`;
          newMentionMap.delete(newKey);

          if (!ifIdExists(value.id, newMentionMap)) {
            let targetedFormatter = allFormatters.current.get(value.trackingCharacter);
            let existingCCUsers = [...targetedFormatter.getSuggestionItems()];
            let userPosition = existingCCUsers.findIndex((item: SuggestionItem) => item.id === value.id);
            if (userPosition !== -1) {
              existingCCUsers.splice(userPosition, 1);
              (targetedFormatter as CometChatMentionsFormatter).setSuggestionItems(existingCCUsers)
            }
          }

        }

      });

      mentionMap.current = newMentionMap;

      setFormattedInputMessage();

    };

    const onMentionPress = (item: SuggestionItem) => {
      setShowMentionList(false);
      setMentionsSearchData([]);

      let notAtLast = selectionPosition.start < plainTextInput.current.length;

      let textDiff = (plainTextInput.current.length + item.promptText.length - searchStringRef.current.length) - plainTextInput.current.length;

      let incr = 0;
      let mentionPos = 0;

      let newMentionMap = new Map(mentionMap.current);

      let targetedFormatter = allFormatters.current.get(activeCharacter.current);

      let existingCCUsers = [...targetedFormatter.getSuggestionItems()];
      let userAlreadyExists = existingCCUsers.find((existingUser: SuggestionItem) => existingUser.id === item.id);
      if (!userAlreadyExists) {
        let cometchatUIUserArray: Array<SuggestionItem> = [...existingCCUsers];
        cometchatUIUserArray.push(item);
        (targetedFormatter as CometChatMentionsFormatter).setSuggestionItems(cometchatUIUserArray)
      }
      mentionMap.current.forEach((value, key) => {
        let position = { start: parseInt(key.split("_")[0]), end: parseInt(key.split("_")[1]) };

        if (!(selectionPosition.start <= position.start)) {
          mentionPos += 1;
        }

        // Code to delete mention from hashmap 👇
        if (position.end === selectionPosition.end || (selectionPosition.start > position.start && selectionPosition.end <= position.end)) {
          let newKey = `${position.start}_${position.end}`;
          newMentionMap.delete(newKey);
          mentionPos -= 1
        }

        if (notAtLast && ((selectionPosition.start - 1) <= position.start)) {
          incr = (selectionPosition.end - selectionPosition.start) + (textDiff);
          let newKey = `${(position.start + incr)}_${(position.end + incr)}`;
          newMentionMap.set(newKey, value);
          newMentionMap.delete(key);
        }

      });
      mentionMap.current = newMentionMap;

      // When updating the input text, just get the latest plain text input and replace the selected text with the new mention
      const updatedPlainTextInput = `${plainTextInput.current.substring(0, (selectionPosition.start - (1 + searchStringRef.current.length)))}${item.promptText + " "}${plainTextInput.current.substring(
        (selectionPosition.end),
        plainTextInput.current.length
      )}`;
      plainTextInput.current = updatedPlainTextInput;

      let key = (selectionPosition.start - (1 + searchStringRef.current.length)) + "_" + ((selectionPosition.start - (searchStringRef.current.length + 1)) + item.promptText.length);

      let updatedMap = insertMentionAt(mentionMap.current, mentionPos, key, { ...item, trackingCharacter: activeCharacter.current });
      mentionMap.current = updatedMap;

      setFormattedInputMessage()

    }

    const setFormattedInputMessage = () => {
      let textComponents = getRegexString(plainTextInput.current);

      allFormatters.current.forEach((formatter: CometChatMentionsFormatter, key) => {
        let resp = formatter.getFormattedText(textComponents);
        textComponents = resp;
      })

      inputValueRef.current = textComponents;
      setInputMessage(textComponents);
    }

    function escapeRegExp(string: string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function extractTextFromCursor(inputText: string, cursorPosition: number) {
      const leftText = inputText.substring(0, cursorPosition);

      // Escape the mentionPrefixes to safely use them in a regex pattern
      const escapedPrefixes = trackingCharacters.current.map(escapeRegExp).join('|');

      // Build a dynamic regex pattern that matches any of the mention prefixes.
      // This pattern will match a prefix followed by any combination of word characters
      // and spaces, including a trailing space.
      const mentionRegex = new RegExp(`(?:^|\\s)(${escapedPrefixes})([^${escapedPrefixes}\\s][^${escapedPrefixes}]*)$`);
      const match = leftText.match(mentionRegex);

      // If a match is found, return the first capturing group, which is the username
      return match && substringUpToNthSpace(match[2], 4) || "";
    }

    function substringUpToNthSpace(str: string, n: number) {
      // Split the string by spaces, slice to the (n-1) elements, and then rejoin with spaces
      return str.split(' ', n).join(' ');
    }

    const insertMentionAt = (mentionMap: Map<string, SuggestionItem>, insertAt: number, key: string, value: SuggestionItem): Map<string, SuggestionItem> => {
      // Convert the hashmap to an array of [key, value] pairs
      let mentionsArray = Array.from(mentionMap);

      // Insert the new mention into the array at the calculated index
      mentionsArray.splice(insertAt, 0, [key, value]);

      return new Map(mentionsArray);

    }

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
    }

    const onSuggestionListEndReached = () => {
      let targetedFormatter = allFormatters.current.get(activeCharacter.current);
      if (!targetedFormatter) return;
      let fetchingNext = targetedFormatter.fetchNext();
      fetchingNext !== null && setSuggestionListLoader(true);
    }

    const getMentionLimitView = () => {
      let targetedFormatter = allFormatters.current.get(activeCharacter.current);
      let shouldWarn;
      let limit;
      if (targetedFormatter?.getLimit && targetedFormatter?.getLimit()) {
        limit = targetedFormatter?.getLimit();
        if (targetedFormatter.getUniqueUsersList && targetedFormatter.getUniqueUsersList()?.size >= limit) {
          shouldWarn = true;
        }
      }
      if (!shouldWarn) return null;
      let errorString = targetedFormatter?.getErrorString ? targetedFormatter?.getErrorString() : `${localize("MENTION_UPTO")} ${limit} ${limit === 1 ? localize("TIME") : localize("TIMES")} ${localize("AT_A_TIME")}.`;
      return (
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: 5,
          paddingLeft: 5,
          borderTopWidth: 1,
          borderTopColor: theme.palette.getAccent300()
        }}>
          <Image style={{
            tintColor: theme.palette.getAccent500(),
            height: 20,
            width: 20
          }} source={ICONS.INFO} />
          <Text style={{
            marginLeft: 5,
            color: theme.palette.getAccent500(),
            ...theme.typography.text1
          }}>{errorString}</Text>
        </View>
      )
    }

    return (
      <>
        {!isVisible && typeof CustomView === "function" && <CustomView />}
        <Modal
          animationType="slide"
          visible={isVisible}
          onRequestClose={() => {
            setIsVisible(false);
          }}
          presentationStyle={'pageSheet'}
        >
          {CustomView && CustomView}
        </Modal>
        <KeyboardAvoidingView
          key={id}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.select({ ios: kbOffset })}
          {...keyboardAvoidingViewProps}
        >
          <View
            style={[
              Style.container,
              {
                paddingTop: CustomViewHeader ? 0 : 8
              },
              messageComposerStyle,
            ]}
          >
            <EmojiBoard
              hideSearch={true}
              shouldShow={showEmojiboard}
              onClose={() => setShowEmojiboard(false)}
              emojiSelection={(emoji: any) => {
                let pre = plainTextInput.current.substring(0, selectionPosition.start);
                let post = plainTextInput.current.substring(
                  selectionPosition.end,
                  plainTextInput.current.length
                );
                inputValueRef.current = selectionPosition.start && selectionPosition.end ? `${pre}${emoji}${post}` : `${inputValueRef.current}${emoji}`;
                setInputMessage((prev) =>
                  selectionPosition.start && selectionPosition.end
                    ? `${pre}${emoji}${post}`
                    : `${prev}${emoji}`
                );
                setShowEmojiboard(false);
              }}
            />
            <ActionSheetBoard
              sheetRef={bottomSheetRef}
              options={actionSheetItems}
              shouldShow={showActionSheet}
              onClose={() => setShowActionSheet(false)}
              style={{
                // ...getActionSheetStyle(),
                ...(messageComposerStyle.actionSheetSeparatorTint
                  ? {
                    actionSheetSeparatorTint:
                      messageComposerStyle.actionSheetSeparatorTint,
                  }
                  : {}),
                layoutModeIconTint: messageComposerStyle.actionSheetLayoutModeIconTint,
                titleColor: messageComposerStyle.actionSheetTitleColor,
                listItemIconTint: messageComposerStyle.attachIconTint,
                listItemTitleFont: messageComposerStyle.actionSheetTitleFont
              }}
              cometChatBottomSheetStyle={
                messageComposerStyle.actionSheetCancelButtonIconTint
                  ? {
                    lineColor:
                      messageComposerStyle.actionSheetCancelButtonIconTint,
                  }
                  : {}
              }
            />
            <RecordAudio
              sheetRef={bottomSheetRef}
              options={actionSheetItems}
              shouldShow={showRecordAudio}
              onClose={() => {
                setShowRecordAudio(false)
              }}
              onSend={_sendRecordedAudio}
              cometChatBottomSheetStyle={
                messageComposerStyle.actionSheetCancelButtonIconTint
                  ? {
                    lineColor:
                      messageComposerStyle.actionSheetCancelButtonIconTint,
                  }
                  : {}
              }
              mediaRecorderStyle={mediaRecorderStyle}
              pauseIconUrl={pauseIconUrl}
              playIconUrl={playIconUrl}
              recordIconUrl={recordIconUrl}
              deleteIconUrl={deleteIconUrl}
              stopIconUrl={stopIconUrl}
              submitIconUrl={submitIconUrl}
            />
            <AIOptions
              sheetRef={bottomSheetRef}
              shouldShow={showAIOptions}
              onClose={() => {
                setShowAIOptions(false)
              }}
              aiOptions={AIOptionItems}
              aiStyle={AIStyles}
            />

            {
              (mentionsSearchData.length > 0 && plainTextInput.current.length > 0)
              && <View style={{
                borderTopWidth: 1, borderColor: theme.palette.getAccent300(),
                paddingVertical: 5, paddingHorizontal: 0,
                maxHeight: Dimensions.get("window").height * .22, justifyContent: "flex-end",
                paddingBottom: messagePreview !== null ? 60 : undefined,
                zIndex: 1
              }}>
                <CometChatSuggestionList
                  data={mentionsSearchData}
                  avatarStyle={{
                    height: 33, width: 33,
                  }}
                  listItemStyle={{
                    height: 50,
                  }}
                  separatorColor={theme.palette.getAccent100()}
                  onPress={onMentionPress}
                  onEndReached={onSuggestionListEndReached}
                  loading={suggestionListLoader}
                />
                {getMentionLimitView()}
              </View>
            }

            {HeaderView ? (
              <HeaderView />
            ) : (
              CustomViewHeader && <CustomViewHeader />
            )}
            <View>
              <MessagePreviewTray
                onClose={() => setMessagePreview(null)}
                text={messagePreview?.message?.text}
                shouldShow={messagePreview != null}
              />
            </View >
            <CometChatMessageInput
              messageInputRef={messageInputRef}
              text={inputMessage as string}
              placeHolderText={placeHolderText}
              style={messageComposerStyle}
              onSelectionChange={({ nativeEvent: { selection } }) => {
                setSelectionPosition(selection)
                openList(selection)
              }
              }
              maxHeight={maxHeight ?? null}
              onChangeText={textChangeHandler}
              SecondaryButtonView={SecondaryButtonViewElem}
              AuxiliaryButtonView={AuxiliaryButtonViewElem}
              PrimaryButtonView={PrimaryButtonView}
              auxiliaryButtonAlignment={
                auxiliaryButtonsAlignment ? auxiliaryButtonsAlignment : 'right'
              }
            />
            {FooterView ? (
              <FooterView />
            ) : (
              CustomViewFooter && <CustomViewFooter />
            )}
          </View>
        </KeyboardAvoidingView>
      </>
    );
  }
);

CometChatMessageComposer.defaultProps = {
  user: undefined,
  group: undefined,
  // style: new MessageComposerStyle({}),
  attachmentIcon: ICONS.ADD,
  liveReactionIcon: ICONS.HEART,
  hideLiveReaction: true,
  disableSoundForMessages: true,
  messageComposerStyle: {},
};
