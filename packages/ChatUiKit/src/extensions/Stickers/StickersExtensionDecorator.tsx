import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { JSX, useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardEventName, Platform, TouchableOpacity, View } from "react-native";
import {
  AdditionalParams,
  CometChatMessageTemplate,
  CometChatUIEventHandler,
  CometChatUIEvents,
  MessageBubbleAlignmentType,
} from "../../shared";
import { CometChatMessageEvents } from "../../shared/events/CometChatMessageEvents";
import { messageStatus } from "../../shared/utils/CometChatMessageHelper";
import { ChatConfigurator, DataSource, DataSourceDecorator } from "../../shared/framework";
import { CometChatUIKit } from "../../shared/CometChatUiKit/CometChatUIKit";
import { MessageCategoryConstants, ViewAlignment } from "../../shared/constants/UIKitConstants";
import { Icon } from "../../shared/icons/Icon";
import { getUnixTimestampInMilliseconds } from "../../shared/utils/CometChatMessageHelper";
import { getMessagePreviewInternal } from "../../shared/utils/MessageUtils";
import { useTheme } from "../../theme";
import { CometChatTheme } from "../../theme/type";
import { ExtensionTypeConstants } from "../ExtensionConstants";
import { CometChatStickerKeyboard } from "./CometChatStickerKeyboard";
import { CometChatStickerBubble } from "./StickersBubble";
import { StickerConfigurationInterface } from "./StickerConfiguration";
import { AdditionalAuxiliaryOptionsParams } from "../../shared/base/Types";
import { getCometChatTranslation } from "../../shared/resources/CometChatLocalizeNew/LocalizationManager"

const t = getCometChatTranslation();

/**
 * StickerButton Component
 * A button that toggles a sticker panel, allowing users to send stickers as custom messages.
 * Handles keyboard interactions and panel visibility for smooth user experience.
 *
 * @param {Object} props - Component props.
 * @param {CometChat.User} props.user - User object representing the chat receiver.
 * @param {CometChat.Group} props.group - Group object representing the chat group.
 * @param {Map<string, any>} props.id - Additional metadata, like parent message ID.
 */
const StickerButton = ({ user, group, id, stickerIconStyle, stickerIcon, replyToMessage, closeReplyPreview }: any) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false); // Tracks sticker panel visibility state.
  const [keyboardOpen, setKeyboardOpen] = useState(false); // Tracks if the system keyboard is open.
  const loggedInUser = useRef<CometChat.User | null>(null); // Stores the currently logged-in user.
  const theme = useTheme(); // Retrieves theme configurations for styling.
  const uiListenerIdRef = useRef<string>(`sticker_button_${Date.now()}`);
  
  // Use refs to store reply message info to avoid stale closures
  const replyToMessageRef = useRef(replyToMessage);
  const closeReplyPreviewRef = useRef(closeReplyPreview);

  // Update refs when props change
  useEffect(() => {
    replyToMessageRef.current = replyToMessage;
    closeReplyPreviewRef.current = closeReplyPreview;
  }, [replyToMessage, closeReplyPreview]);


  /**
   * Fetches the logged-in user and sets it to `loggedInUser` ref.
   */
  useEffect(() => {
    CometChat.getLoggedinUser().then((u) => (loggedInUser.current = u));
  }, []);

  /**
   * Platform-specific keyboard event names for show and hide events.
   */
  const keyboardShowEvent = Platform.select({
    ios: "keyboardWillShow",
    android: "keyboardDidShow",
  }) as KeyboardEventName;

  const keyboardHideEvent = Platform.select({
    ios: "keyboardWillHide",
    android: "keyboardDidHide",
  }) as KeyboardEventName;

  /**
   * Keyboard event listeners to update keyboard state.
   * Automatically closes the sticker panel when the keyboard appears.
   */
  useEffect(() => {
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

  /**
   * Sends a custom sticker message to the receiver (user or group).
   *
   * @param {Object} sticker - Sticker object containing sticker details.
   */
  const sendCustomMessage = (sticker: any) => {
    // Determine receiver details.
    let receiverId = user?.getUid() || group?.getGuid();
    let receiverType = user
      ? CometChat.RECEIVER_TYPE.USER
      : group
        ? CometChat.RECEIVER_TYPE.GROUP
        : undefined;

    if (!receiverType) {
      console.error("Receiver type is undefined.");
      return;
    }

    // Prepare the custom sticker message.
    let customType = ExtensionTypeConstants.sticker;
    let customData = sticker;
    let parentId = id?.get("parentMessageId") || undefined;
    let customMessage = new CometChat.CustomMessage(
      receiverId,
      receiverType,
      customType,
      customData
    );

    // Configure message metadata and properties.
    customMessage.setCategory(CometChat.CATEGORY_CUSTOM as CometChat.MessageCategory);
    customMessage.setParentMessageId(parentId);
    customMessage.setMuid(String(getUnixTimestampInMilliseconds()));
    customMessage.setSender(loggedInUser.current);
    customMessage.setReceiver(user || group);
    customMessage.shouldUpdateConversation(true);
    customMessage.setMetadata({ incrementUnreadCount: true });

    // Set quoted message if replying - use ref to get current value
    const currentReplyMessage = replyToMessageRef.current;
    if (currentReplyMessage) {
      customMessage.setQuotedMessage(currentReplyMessage);
      customMessage.setQuotedMessageId(currentReplyMessage.getId());
    }

    // Close reply preview immediately after triggering send
    const currentClosePreview = closeReplyPreviewRef.current;
    if (currentClosePreview) {
      currentClosePreview();
    }

    // Send the custom message using CometChatUIKit.
    CometChatUIKit.sendCustomMessage(customMessage)
      .then((res) => {
        // Emit reply event if this was a reply
        if (currentReplyMessage) {
          CometChatMessageEvents.emit(CometChatMessageEvents.ccReplyToMessage, {
            message: res,
            status: messageStatus.success,
          });
        }
      })
      .catch((err) => {
        console.error("Failed to send sticker:", err);
      });
  };

  /**
   * Opens the sticker panel.
   */
  const OpenPanel = useCallback(() => {
    setIsPanelOpen(true);
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.showPanel, {
      alignment: ViewAlignment.composerBottom,
      child: () => <CometChatStickerKeyboard onPress={sendCustomMessage} />, // Render the sticker keyboard.
      panelId: "sticker", // tag panel so we can identify related events
    });
  }, []);

  /**
   * Closes the sticker panel.
   */
  const closePanel = useCallback(() => {
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.hidePanel, {
      alignment: ViewAlignment.composerBottom,
      child: () => null, // Hide the panel content.
      panelId: "sticker",
    });
    setIsPanelOpen(false);
  }, []);

  /**
   * Toggles the sticker panel visibility.
   * Handles interactions with the keyboard for a smooth user experience.
   */
  const togglePanel = useCallback(() => {
    if (isPanelOpen) {
      closePanel();
    } else {
      if (keyboardOpen) {
        Keyboard.dismiss(); // Close the keyboard first.
        setTimeout(() => {
          OpenPanel(); // Open the sticker panel after a small delay.
        }, 200);
      } else {
        OpenPanel(); // Open the panel directly if the keyboard isn't open.
      }
    }
  }, [isPanelOpen, keyboardOpen, OpenPanel, closePanel]);

  /**
   * Listen to global UI events so external navigation / programmatic panel hides
   * correctly update the local button highlight state.
   */
  useEffect(() => {
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
      key={"sticker"}
      onPress={togglePanel}
      style={{ justifyContent: "center", alignItems: "center", padding: 10 }}
      accessibilityLabel='Sticker Button'
      accessibilityHint='Opens the sticker panel'
    >
      <Icon
        name='sticker-fill'
        width={24}
        height={24}
        imageStyle={stickerIconStyle}
        icon={!isPanelOpen ? stickerIcon?.inactive : stickerIcon?.active}
        //color={!isPanelOpen ? theme.color.iconSecondary : theme.color.primary}
        color={
          !isPanelOpen
            ? (stickerIconStyle.inactive.tintColor ?? theme.color.iconSecondary)
            : theme.color.primary
        }
      />
    </TouchableOpacity>
  );
};

/**
 * StickersExtensionDecorator Class
 * Extends the DataSourceDecorator to add support for sticker messages.
 * Defines sticker message templates, auxiliary options, and category/type handling.
 */
export class StickersExtensionDecorator extends DataSourceDecorator {
  configuration: StickerConfigurationInterface;

  constructor(props: { dataSource: DataSource; configration?: StickerConfigurationInterface }) {
    super(props.dataSource);
    this.configuration = props.configration ?? {}; // Load configuration if provided.
  }

  /**
   * Checks if the message is deleted.
   * @param {CometChat.BaseMessage} message - The message to check.
   * @returns {boolean} - True if the message is deleted, otherwise false.
   */
  isDeletedMessage(message: CometChat.BaseMessage): boolean {
    return message.getDeletedBy() != null;
  }

  /**
   * Adds sticker templates to the list of message templates.
   */
  getAllMessageTemplates(
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): CometChatMessageTemplate[] {
    let templates = super.getAllMessageTemplates(theme, additionalParams);
    templates.push(
      new CometChatMessageTemplate({
        type: ExtensionTypeConstants.sticker,
        category: MessageCategoryConstants.custom,
        ContentView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
          if (this.isDeletedMessage(message)) {
            return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);
          } else {
            return this.getStickerBubble(message as CometChat.CustomMessage, alignment, theme);
          }
        },
        ReplyView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
          const replyView = ChatConfigurator.dataSource.getReplyView?.(message, theme, additionalParams);
          return replyView || null;
        },
        options: (loggedInuser, message, theme, group) => {
          return ChatConfigurator.dataSource.getMessageOptions(
            loggedInuser,
            message,
            theme,
            group,
            additionalParams
          );
        },
        BottomView: (message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType) => {
          return ChatConfigurator.dataSource.getBottomView(message, alignment);
        },
      })
    );
    return templates;
  }

  /**
   * Renders a sticker bubble containing the sticker image.
   */
  getStickerBubble(
    message: CometChat.CustomMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme
  ) {
    let url =
      message?.["data"]?.["customData"]?.["stickerUrl"] ||
      message?.["data"]?.["customData"]?.["sticker_url"];
    let loggedInUser = CometChatUIKit.loggedInUser;
    const _style =
      message.getSender()?.getUid() === loggedInUser?.getUid()
        ? theme.messageListStyles.outgoingMessageBubbleStyles
        : theme.messageListStyles.incomingMessageBubbleStyles;
    return (
      <View style={_style.stickerBubbleStyles?.containerStyle}>
        <CometChatStickerBubble
          url={url}
          name=''
          style={{
            ...this.configuration?.style,
            ..._style.stickerBubbleStyles?.imageStyle,
          }}
        />
      </View>
    );
  }

  /**
   * Adds the sticker button to auxiliary options for message input.
   */
  getAuxiliaryOptions(
    user: CometChat.User,
    group: CometChat.Group,
    id?: Map<string, any>,
    additionalAuxiliaryParams?: AdditionalAuxiliaryOptionsParams
  ) {
    const auxiliaryOptions = super.getAuxiliaryOptions(
      user,
      group,
      id ?? new Map<string, any>(),
      additionalAuxiliaryParams
    );
    if (additionalAuxiliaryParams?.hideStickersButton) return auxiliaryOptions;
    auxiliaryOptions.push(
      <StickerButton
        key='sticker-button'
        user={user}
        group={group}
        id={id}
        stickerIcon={additionalAuxiliaryParams?.stickerIcon}
        stickerIconStyle={additionalAuxiliaryParams?.stickerIconStyle}
        replyToMessage={additionalAuxiliaryParams?.replyToMessage}
        closeReplyPreview={additionalAuxiliaryParams?.closeReplyPreview}
      />
    );
    return auxiliaryOptions;
  }

  /**
   * Ensures that "custom" is included in the list of message categories.
   */
  getAllMessageCategories(): string[] {
    var categoryList: string[] = super.getAllMessageCategories();
    if (!categoryList.includes(MessageCategoryConstants.custom)) {
      categoryList.push(MessageCategoryConstants.custom);
    }
    return categoryList;
  }

  /**
   * Adds the sticker type to the list of supported message types.
   */
  getAllMessageTypes(): string[] {
    var messagesTypes: string[] = super.getAllMessageTypes();
    messagesTypes.push(ExtensionTypeConstants.sticker);
    return messagesTypes;
  }

  /**
   * Returns a unique identifier for the sticker extension.
   */
  getId(): string {
    return "stickerExtension";
  }

  /**
   * Customizes the last conversation message preview for sticker messages.
   */
  getLastConversationMessage(
    conversation: CometChat.Conversation,
    theme?: CometChatTheme
  ): string | JSX.Element {
    const message = conversation.getLastMessage() as CometChat.BaseMessage;
    if (
      message != null &&
      message.getType() === ExtensionTypeConstants.sticker &&
      message.getCategory() === MessageCategoryConstants.custom &&
      message.getDeletedAt() === undefined
    ) {
      return getMessagePreviewInternal("sticker-fill", t("CUSTOM_MESSAGE_STICKER"), {
        theme,
      });
    } else {
      return super.getLastConversationMessage(conversation, theme);
    }
  }
}
