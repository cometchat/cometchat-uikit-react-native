import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { JSX } from "react";
import { Modal, View } from "react-native";
import { ChatConfigurator } from "../shared/framework/ChatConfigurator";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { CometChatUIKit } from "../shared/CometChatUiKit/CometChatUIKit";
import { AdditionalAuxiliaryHeaderOptionsParams, AdditionalParams } from "../shared/base/Types";
import {
  CallContstatnts,
  MessageCategoryConstants,
  MessageTypeConstants,
} from "../shared/constants/UIKitConstants";
import { DataSource } from "../shared/framework/DataSource";
import { DataSourceDecorator } from "../shared/framework/DataSourceDecorator";
import { CometChatMessageTemplate } from "../shared/modals";
import { getCometChatTranslation, getCurrentLanguage } from "../shared/resources/CometChatLocalizeNew/LocalizationManager";
import { permissionUtil } from "../shared/utils/PermissionUtil";
import { CallUIEvents } from "./CallEvents";
import { CallingConfiguration } from "./CallingConfiguration";
import { CallingPackage } from "./CallingPackage";
import { CallUtils } from "./CallUtils";
import { CometChatMeetCallBubble } from "./CometChatCallBubble";
import { CometChatCallButtons } from "./CometChatCallButtons";
import { CometChatOngoingCall } from "./CometChatOngoingCall";
import { Icon } from "../shared/icons/Icon";
import { CometChatCallActionBubble } from "./CometChatCallBubble/CometChatCallBubble";
import { CometChatTheme } from "../theme/type";
import { LocalizedDateHelper, localizedDateHelperInstance } from "../shared/helper/LocalizedDateHelper";

const CometChatCalls = CallingPackage.CometChatCalls;
const t = getCometChatTranslation();

/**
 * CallingExtensionDecorator extends the DataSourceDecorator to add calling-specific
 * configurations and templates.
 *
 * @class CallingExtensionDecorator
 * @extends {DataSourceDecorator}
 */
export class CallingExtensionDecorator extends DataSourceDecorator {
  /**
   * Optional calling configuration.
   */
  configuration?: CallingConfiguration;
  /**
   * The logged in CometChat user.
   */
  loggedInUser!: CometChat.User;

  /**
   * Creates an instance of CallingExtensionDecorator.
   *
   * @param {object} props - The properties object.
   * @param {DataSource} props.dataSource - The original data source.
   * @param {CallingConfiguration} [props.configuration] - Optional calling configuration.
   */
  constructor(props: { dataSource: DataSource; configuration?: CallingConfiguration }) {
    super(props.dataSource);
    CometChat.getLoggedinUser()
      .then((user: CometChat.User | null) => {
        this.loggedInUser = user!;
      })
      .catch((err: CometChat.CometChatException) => {
        console.log("unable to get logged in user.");
      });
    if (props.configuration) {
      this.configuration = props.configuration;
    }
  }

  /**
   * Returns a unique identifier for this decorator.
   *
   * @returns {string} The identifier.
   */
  getId(): string {
    return "call";
  }

  /**
   * Determines whether a message is deleted.
   *
   * @param {CometChat.BaseMessage} message - The message to check.
   * @returns {boolean} True if the message is deleted; otherwise false.
   */
  isDeletedMessage(message: CometChat.BaseMessage): boolean {
    return message.getDeletedBy() != null;
  }

  /**
   * Retrieves all supported message types including call types.
   *
   * @returns An array of message type strings.
   */
  getAllMessageTypes() {
    let types: string[] = super.getAllMessageTypes();
    types.push(CallContstatnts.audioCall);
    types.push(CallContstatnts.videoCall);
    types.push(MessageTypeConstants.meeting);
    return types;
  }

  /**
   * Retrieves all supported message categories including call-related categories.
   *
   * @returns An array of message category strings.
   */
  getAllMessageCategories() {
    let categories = super.getAllMessageCategories();
    categories.push(MessageCategoryConstants.call);
    categories.push(MessageCategoryConstants.custom);
    return categories;
  }

  /**
   * Renders the call bubble view for one-to-one call messages.
   *
   * @param {object} param0 - The props object.
   * @param {any} param0.message - The call message.
   * @param {CometChatTheme} param0.theme - The theme.
   * @returns {JSX.Element|null} The rendered call bubble view.
   */
  UserCallBubbleView = ({ message, theme }: { message: any; theme: CometChatTheme }) => {
    if (this.isDeletedMessage(message)) return null;
    const callStatus = CallUtils.getCallStatus(message, this.loggedInUser);

    return (
      <CometChatCallActionBubble
        titleText={callStatus.callMessageText}
        style={theme?.messageListStyles.callActionBubbleStyles}
        icon={
          <Icon
            name={callStatus.selectedIcon}
            height={
              callStatus.callMessageText === t("MISSED_CALL")
                ? theme.messageListStyles?.callActionBubbleStyles?.missedCallIconStyle?.height ?? 16
                : theme.messageListStyles?.callActionBubbleStyles?.iconStyle?.height ?? 16
            }
            width={
              callStatus.callMessageText === t("MISSED_CALL")
                ? theme.messageListStyles?.callActionBubbleStyles?.missedCallIconStyle?.width ?? 16
                : theme.messageListStyles?.callActionBubbleStyles?.iconStyle?.width ?? 16
            }
            color={
              callStatus.callMessageText === t("MISSED_CALL")
                ? theme.messageListStyles?.callActionBubbleStyles?.missedCallIconStyle?.tintColor
                : theme.messageListStyles?.callActionBubbleStyles?.iconStyle?.tintColor
            }
            imageStyle={
              callStatus.callMessageText === t("MISSED_CALL")
                ? theme.messageListStyles?.callActionBubbleStyles?.missedCallIconStyle
                : theme.messageListStyles?.callActionBubbleStyles?.iconStyle
            }
            containerStyle={
              callStatus.callMessageText === t("MISSED_CALL")
                ? theme.messageListStyles?.callActionBubbleStyles?.missedCallIconContainerStyle
                : theme.messageListStyles?.callActionBubbleStyles?.iconContainerStyle
            }
          />
        }
      />
    );
  };

  /**
   * Returns the audio call message template for one-to-one chats.
   *
   * @param {CometChatTheme} theme - The theme to use for the template.
   * @returns {CometChatMessageTemplate} The audio call message template.
   */
  getUserAudioCallTemplate = (theme: CometChatTheme) => {
    return new CometChatMessageTemplate({
      category: MessageCategoryConstants.call,
      type: MessageTypeConstants.audio,
      BubbleView: (message) => {
        return this.UserCallBubbleView({
          message,
          theme,
        });
      },
    });
  };

  /**
   * Returns the video call message template for one-to-one chats.
   *
   * @param {CometChatTheme} theme - The theme to use for the template.
   * @returns {CometChatMessageTemplate} The video call message template.
   */
  getUserVideoCallTemplates = (theme: CometChatTheme) => {
    return new CometChatMessageTemplate({
      category: MessageCategoryConstants.call,
      type: MessageTypeConstants.video,
      BubbleView: (message) => {
        return this.UserCallBubbleView({
          message,
          theme,
        });
      },
    });
  };

  /**
   * Renders the group call bubble view.
   *
   * @param {object} props - The props for the group call bubble view.
   * @param {CometChat.CustomMessage} props.message - The call message.
   * @param {CometChatTheme} props.theme - The theme.
   * @param {string} props.alignment - Alignment for the bubble.
   * @returns {JSX.Element} The rendered group call bubble view.
   */
  GroupCallBubbleView = (props: {
    message: CometChat.CustomMessage;
    theme: CometChatTheme;
    alignment: string;
  }) => {
    let loggedInUser = CometChatUIKit.loggedInUser;
    const { message, theme, alignment } = props;

    if (this.isDeletedMessage(message))
      return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);

    const isSentByMe = message.getSender()?.getUid() === loggedInUser?.getUid();

    const _style = isSentByMe
      ? theme.messageListStyles.outgoingMessageBubbleStyles?.meetCallBubbleStyles
      : theme.messageListStyles.incomingMessageBubbleStyles?.meetCallBubbleStyles;

    const sentAt = message?.getSentAt() ? message.getSentAt() * 1000 : Date.now();
    const customData = message.getCustomData() as any;
    const callType = (message.getCustomData() as any).callType;

    // Extract session ID with cross-platform compatibility
    const sessionId = customData.sessionId || customData.sessionID;

    const BubbleIcon = (() => {
      if (isSentByMe) {
        if (callType === "audio") {
          return <Icon name='outgoing-audio-fill' color={_style?.iconStyle?.tintColor} />;
        }
        return <Icon name='outgoing-video-fill' color={_style?.iconStyle?.tintColor} />;
      } else {
        if (callType === "audio") {
          return <Icon name='incoming-audio-fill' color={_style?.iconStyle?.tintColor} />;
        }
        return <Icon name='incoming-video-fill' color={_style?.iconStyle?.tintColor} />;
      }
    })();

    return (
      <View>
        <CometChatMeetCallBubble
          buttonText={t("JOIN")}
          titleText={callType === "audio" ? t("AUDIO_CALL") : t("VIDEO_CALL")}
          icon={BubbleIcon}
          onClick={() =>
            this.startDirectCall(
              sessionId,
              message,
              theme,
              callType
            )
          }
          style={_style ?? {}}
          subTitleText={
            localizedDateHelperInstance.getFormattedDate(sentAt, LocalizedDateHelper.patterns.callBubble, getCurrentLanguage())
          }
        />
      </View>
    );
  };

  /**
   * Initiates a direct call by checking permissions and showing the ongoing call screen.
   *
   * @param  sessionId - The call session ID.
   * @param  message - The call message.
   * @param  [theme] - The theme.
   * @param  [callType] - The type of call (audio/video).
   * @returns 
   */
  async startDirectCall(
    sessionId: string,
    message: CometChat.BaseMessage,
    theme?: CometChatTheme,
    callType?: string
  ) {
    // Validate session ID
    if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
      console.error('[CallingExtensionDecorator] Invalid session ID provided:', sessionId);
      return;
    }
    
    // Request only the necessary permissions based on call type.
    try {
      const resources: ("mic" | "camera")[] = callType === "audio" ? ["mic"] : ["mic", "camera"];
      const allowed = await permissionUtil.startResourceBasedTask(resources);
      if (!allowed) {
        console.warn(
          `[CallingExtensionDecorator] Permission check failed for resources: ${resources.join(",")}. Aborting join.`
        );
        return;
      }
    } catch (e) {
      console.error("[CallingExtensionDecorator] Unexpected error while requesting permissions", e);
      return;
    }
    
    const callSettingsBuilder = (
      this.configuration?.groupCallSettingsBuilder
        ? this.configuration?.groupCallSettingsBuilder(
            undefined,
            message.getReceiver() as CometChat.Group,
            callType === "audio"
          )
        : new CometChatCalls.CallSettingsBuilder().setIsAudioOnlyCall(callType === "audio")
    ).setCallEventListener(
      new CometChatCalls.OngoingCallListener({
        onCallEndButtonPressed: () => {
          CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccShowOngoingCall, {
            child: null,
          });
        },
        onError: (error: CometChat.CometChatException) => {
          console.error("[CallingExtensionDecorator] OngoingCallListener onError while joining", error);
          CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccShowOngoingCall, {
            child: null,
          });
        },
      })
    );

    const ongoingCallScreen = (
      <Modal>
        <CometChatOngoingCall
          sessionID={sessionId}
          callSettingsBuilder={callSettingsBuilder}
          onError={(e) => {
            console.error("[CallingExtensionDecorator] CometChatOngoingCall onError for session", sessionId, e);
            CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccShowOngoingCall, {
              child: null,
            });
          }}
        />
      </Modal>
    );
    CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccShowOngoingCall, {
      child: ongoingCallScreen,
    });
  }

  /**
   * Renders the call buttons in the auxiliary header app bar.
   *
   * @param  [user] - The user for one-to-one chats.
   * @param  [group] - The group for group chats.
   * @param  [additionalParams] - Additional parameters.
   * @returns The rendered call buttons or null if conditions are not met.
   */
  getAuxiliaryHeaderAppbarOptions(
    user?: CometChat.User,
    group?: CometChat.Group,
    additionalAuxiliaryHeaderOptionsParams?: AdditionalAuxiliaryHeaderOptionsParams
  ) {
    // For one-to-one chats: if a user exists and is blocked, don't render the call buttons.
    if (user && !group && user.getBlockedByMe()) {
      return null;
    }

    return (
      <View>
        <CometChatCallButtons
          user={user}
          group={group}
          {...this.configuration?.callButtonsConfiguration}
          style={additionalAuxiliaryHeaderOptionsParams?.callButtonStyle}
          hideVoiceCallButton={additionalAuxiliaryHeaderOptionsParams?.hideVoiceCallButton}
          hideVideoCallButton={additionalAuxiliaryHeaderOptionsParams?.hideVideoCallButton}
        />
      </View>
    );
  }

  /**
   * Returns the group call template to render group call messages.
   *
   * @param {CometChatTheme} theme - The theme.
   * @returns {CometChatMessageTemplate} The group call message template.
   */
  getGroupCallTemplate = (theme: CometChatTheme) => {
    return new CometChatMessageTemplate({
      category: MessageCategoryConstants.custom,
      type: MessageTypeConstants.meeting,
      ContentView: (message, alignment) =>
        this.GroupCallBubbleView({ message: message as CometChat.CustomMessage, alignment, theme }),
      StatusInfoView: (message, alignment) => {
        if (message.getDeletedAt()) {
          return null;
        }
        return <></>;
      },
      // Pass theme explicitly so common options (e.g. Message Privately) validate group context correctly.
      options: (loggedInUser, messageObject, _theme, group) => {
        return super.getCommonOptions(loggedInUser, messageObject, _theme, group);
      },
    });
  };

  /**
   * Retrieves all message templates including call-related templates.
   *
   * @param {CometChatTheme} theme - The theme.
   * @param {AdditionalParams} [additionalParams] - Additional parameters.
   * @returns {CometChatMessageTemplate[]} An array of message templates.
   */
  getAllMessageTemplates(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate[] {
    let templates = super.getAllMessageTemplates(theme, additionalParams);
    templates.push(
      this.getUserAudioCallTemplate(theme),
      this.getUserVideoCallTemplates(theme),
      this.getGroupCallTemplate(theme)
    );
    return templates;
  }

  /**
   * Retrieves the last conversation message for display in the conversation list.
   *
   * @param {CometChat.Conversation} conversation - The conversation object.
   * @param {CometChatTheme} [theme] - The theme.
   * @returns {string | JSX.Element} The last conversation message.
   */
  getLastConversationMessage(conversation: CometChat.Conversation, theme?: CometChatTheme): string | JSX.Element {
    if (conversation.getLastMessage()["category"] != "call")
      return super.getLastConversationMessage(conversation, theme);
    let lastMesssageString = "";
    if (conversation.getLastMessage()["type"] == "audio")
      lastMesssageString = t("AUDIO_CALL");
    if (conversation.getLastMessage()["type"] == "video")
      lastMesssageString = t("VIDEO_CALL");
    return lastMesssageString;
  }
}
