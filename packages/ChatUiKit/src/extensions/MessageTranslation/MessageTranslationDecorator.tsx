import { ChatConfigurator, DataSource, DataSourceDecorator } from "../../shared/framework";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatMessageOption } from "../../shared/modals";
import { ExtensionConstants, ExtensionURLs } from "../ExtensionConstants";
import React, { JSX } from "react";
import {
  CometChatMentionsFormatter,
  CometChatTextFormatter,
  CometChatUIKit,
  CometChatUrlsFormatter,
  getCurrentLanguage,
  MentionTextStyle,
} from "../../shared";
import { AdditionalParams, MessageBubbleAlignmentType } from "../../shared/base/Types";
import {
  MentionsTargetElement,
  MessageOptionConstants,
} from "../../shared/constants/UIKitConstants";
import { CometChatUIEvents, MessageEvents } from "../../shared/events";
import { CometChatUIEventHandler } from "../../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { messageStatus } from "../../shared/utils/CometChatMessageHelper";
import { CommonUtils } from "../../shared/utils/CommonUtils";
import { MessageTranslationBubble } from "./MessageTranslationBubble";
import { CometChatTheme } from "../../theme/type";
import { Icon } from "../../shared/icons/Icon";
import { MentionContext } from "../../shared/framework/MessageDataSource";
import { DeepPartial } from "../../shared/helper/types";
import { getCometChatTranslation } from "../../shared/resources/CometChatLocalizeNew/LocalizationManager"

const t = getCometChatTranslation();

/**
 * Decorator class for handling message translation in the chat application.
 */
export class MessageTranslationExtensionDecorator extends DataSourceDecorator {
  translatedMessage: any = {};

  /**
   * Creates an instance of MessageTranslationExtensionDecorator.
   *
   * @param {DataSource} dataSource - The data source to be decorated.
   */
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  /**
   * Returns the unique ID for this extension.
   *
   * @returns {string} The ID string "MessageTranslation".
   */
  getId(): string {
    return "MessageTranslation";
  }

  /**
   * Gets the text message options for a given message.
   *
   * @param {CometChat.User} loggedInUser - The currently logged in user.
   * @param {CometChat.BaseMessage} messageObject - The message object.
   * @param {CometChatTheme} theme - The current theme settings.
   * @param {CometChat.Group} group - The group to which the message belongs.
   *
   * @returns {CometChatMessageOption[]} An array of message options including the translate option.
   */
  getTextMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme,
    group?: CometChat.Group,
    additionalParams?: AdditionalParams
  ): CometChatMessageOption[] {
    // Retrieve default text message options from the decorated data source.
    let optionsList: CometChatMessageOption[] = super.getTextMessageOptions(
      loggedInUser,
      messageObject,
      theme,
      group,
      additionalParams
    );
    // Add the translate option to the options list.
    !additionalParams?.hideTranslateMessageOption &&
      optionsList.push(this.getTranslateOption(messageObject, theme));
    return optionsList;
  }

  /**
   * Constructs the translation option for a message.
   *
   * @param {CometChat.BaseMessage} messageObject - The message object to be translated.
   * @param {CometChatTheme} theme - The current theme settings.
   *
   * @returns {CometChatMessageOption} A message option object for translation.
   */
  getTranslateOption(
    messageObject: CometChat.BaseMessage,
    theme: CometChatTheme
  ): CometChatMessageOption {
    return {
      id: MessageOptionConstants.translateMessage,
      title: t("TRANSLATE"),
      icon: (
        <Icon
          name='translate'
          color={
            theme.messageListStyles?.messageOptionsStyles?.optionsItemStyle?.iconStyle?.tintColor
          }
          height={
            theme.messageListStyles?.messageOptionsStyles?.optionsItemStyle?.iconStyle?.height
          }
          width={theme.messageListStyles?.messageOptionsStyles?.optionsItemStyle?.iconStyle?.width}
          containerStyle={
            theme.messageListStyles?.messageOptionsStyles?.optionsItemStyle?.iconContainerStyle
          }
        ></Icon>
      ),
      onPress: () => {
        // Invoke translation when the option is pressed.
        this.translateMessage(messageObject as CometChat.TextMessage);
      },
    };
  }

  /**
   * Updates the metadata of a message with translation information.
   *
   * @param {CometChat.TextMessage} messageObj - The text message object.
   * @param {any} messageTranslation - The translated text for the message.
   *
   * @returns {object} An object containing the updated message and translation metadata.
   */
  getSetMetaData = (messageObj: CometChat.TextMessage, messageTranslation: any) => {
    let metaData: any = messageObj.getMetadata();
    if (!metaData) {
      metaData = {};
    }
    // Inject the translate extension if not already present.
    if (metaData && !metaData["@injected"]) {
      metaData = {
        ...metaData,
        "@injected": { extensions: { translate: {} } },
      };
    }
    if (metaData && metaData["@injected"] && metaData["@injected"]["extensions"]) {
      let tempData = metaData["@injected"]["extensions"];
      tempData = {
        ...metaData,
        "@injected": {
          ...metaData["@injected"],
          extensions: {
            ...metaData["@injected"]["extensions"],
            translate: { [messageObj.getId()]: messageTranslation },
          },
        },
      };
      metaData = tempData;
    }

    if (metaData && metaData["@injected"] && metaData["@injected"]["extensions"]["translate"]) {
      let tempMetaData = {};
      let translateData = metaData["@injected"]["extensions"]["translate"];

      if (translateData) {
        translateData = {
          ...translateData,
          [messageObj.getId()]: messageTranslation,
        };
      } else {
        translateData[messageObj.getId()] = {
          [messageObj.getId()]: messageTranslation,
        };
      }
      tempMetaData = {
        ...metaData["@injected"]["extensions"]["translate"],
        ...translateData,
      };

      metaData["@injected"]["extensions"]["translate"] = tempMetaData;
    }

    // Update the message metadata.
    messageObj.setMetadata(metaData);
    return {
      msg: messageObj,
      metaData: metaData["@injected"]["extensions"]["translate"],
    };
  };

  /**
   * Translates a given text message by calling the translation extension.
   *
   * @param {CometChat.TextMessage} message - The text message to be translated.
   */
  translateMessage = (message: CometChat.TextMessage) => {
    const language = getCurrentLanguage()
    const messageId = message.getId();
    const messageText = message.getText();
    // Get the target language for translation.
    let translateToLanguage = language

    // Hide the bottom sheet (if visible).
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.ccToggleBottomSheet, {
      isBottomSheetVisible: false,
    });

    // Modify the text to avoid translating specific tags.
    let tempText = messageText.replace(
      /<@uid:[a-zA-Z0-9]+>/g,
      (match) => `<span translate='no'>${match}</span>`
    );

    // Call the translation extension endpoint.
    CometChat.callExtension(
      ExtensionConstants.messageTranslation,
      "POST",
      ExtensionURLs.translate,
      {
        msgId: messageId,
        text: tempText,
        languages: [translateToLanguage],
      }
    )
      .then((result: any) => {
        if (result?.hasOwnProperty("translations") && result["translations"]["length"]) {
          let messageTranslation = result["translations"][0];
          // Replace span tags to restore original formatting.
          messageTranslation["message_translated"] = messageTranslation[
            "message_translated"
          ].replace(
            /<span translate='no'>(<@uid:[a-zA-Z0-9]+>)<\/span>/g,
            (_: any, match: any) => match
          );
          // Update message metadata with translation.
          const translatedMsg = this.getSetMetaData(
            message,
            messageTranslation["message_translated"]
          );
          if (translatedMsg) {
            if (translatedMsg.metaData?.translate)
              this.translatedMessage = translatedMsg?.metaData?.translate;
          } else {
            this.translatedMessage = {
              [message.getId()]: `${messageTranslation["message_translated"]}`,
            };
          }
          // Emit an event indicating the message has been edited.
          CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageEdited, {
            message: translatedMsg.msg,
            status: messageStatus.success,
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  /**
   * Returns the text message bubble component.
   *
   * This method renders a MessageTranslationBubble if the message has been translated;
   * otherwise, it falls back to the default text message bubble.
   *
   * @param {string} messageText - The original text of the message.
   * @param {CometChat.TextMessage} message - The message object.
   * @param {MessageBubbleAlignmentType} alignment - The alignment of the message bubble.
   * @param {CometChatTheme} theme - The current theme settings.
   * @param {AdditionalParams} [additionalParams] - Additional parameters for rendering.
   *
   * @returns {JSX.Element} The text message bubble component.
   */
  getTextMessageBubble(
    messageText: string,
    message: CometChat.TextMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): JSX.Element {
    let tempTranslatedMsg: any = {};
    let translatedMetaData: any = message.getMetadata();

    // Check if translation metadata exists in the message.
    if (
      translatedMetaData &&
      translatedMetaData["@injected"] &&
      translatedMetaData["@injected"]["extensions"] &&
      translatedMetaData["@injected"]["extensions"]["translate"]
    ) {
      tempTranslatedMsg = translatedMetaData["@injected"]["extensions"]["translate"];
    }

    let loggedInUser = CometChatUIKit.loggedInUser;
    let mentionedUsers = message.getMentionedUsers();
    let textFormatters = [...(additionalParams?.textFormatters || [])];

    // Determine if the message was sent by the logged-in user.
    const isMessageSentByLoggedInUser = message.getSender()?.getUid() === loggedInUser?.getUid();

    // Select the appropriate style based on the sender.
    const _style: Partial<CometChatTheme["textBubbleStyles"]> = isMessageSentByLoggedInUser
      ? (theme.messageListStyles.outgoingMessageBubbleStyles
          .textBubbleStyles as CometChatTheme["textBubbleStyles"])
      : (theme.messageListStyles.incomingMessageBubbleStyles
          .textBubbleStyles as CometChatTheme["textBubbleStyles"]);

    // Create URL formatter and set properties.
    let linksTextFormatter = ChatConfigurator.getDataSource().getUrlsFormatter(loggedInUser);
    let mentionsTextFormatter = ChatConfigurator.getDataSource().getMentionsFormatter(
      loggedInUser,
      theme
    );
    linksTextFormatter.setMessage(message);
    linksTextFormatter.setId("ccDefaultUrlsFormatterId");
    linksTextFormatter.setStyle({ linkTextColor: theme.color.receiveBubbleLink });
    if (isMessageSentByLoggedInUser) {
      linksTextFormatter.setStyle({ linkTextColor: theme.color.sendBubbleText });
    }
    mentionsTextFormatter.setContext(isMessageSentByLoggedInUser ? MentionContext.Outgoing : MentionContext.Incoming);

    // Configure mentions formatter if mentioned users are present.
    if (!additionalParams?.disableMentions && mentionedUsers && mentionedUsers.length) {
      mentionsTextFormatter.setLoggedInUser(loggedInUser);
      mentionsTextFormatter.setMessage(message);
      mentionsTextFormatter.setId("ccDefaultMentionFormatterId");
    }

    let finalFormatters: CometChatTextFormatter[] = [];
    let urlFormatterExists = false;
    let mentionsFormatterExists = false;

    // Process the provided text formatters.
    for (const formatter of textFormatters) {
      if (formatter instanceof CometChatUrlsFormatter) {
        urlFormatterExists = true;
      }
      if (formatter instanceof CometChatMentionsFormatter) {
        mentionsFormatterExists = true;
        formatter.setMessage(message);
        formatter.setTargetElement(MentionsTargetElement.textbubble);
        formatter.setLoggedInUser(CometChatUIKit.loggedInUser);
        formatter.setContext(isMessageSentByLoggedInUser ? "outgoing" : "incoming");
      }
      formatter.setMessage(message);
      finalFormatters.push(CommonUtils.clone(formatter));
      if (urlFormatterExists && mentionsFormatterExists) {
        break;
      }
    }

    // Ensure URL formatter is present.
    if (!urlFormatterExists) {
      finalFormatters.push(linksTextFormatter);
    }
    // Ensure mentions formatter is present.
    if (!mentionsFormatterExists) {
      finalFormatters.push(mentionsTextFormatter);
    }

    // If a translation exists for the message, render the MessageTranslationBubble.
    if (
      (tempTranslatedMsg && tempTranslatedMsg[message.getId()]) ||
      (this.translatedMessage && this.translatedMessage[message.getId()])
    ) {
      return (
        <MessageTranslationBubble
          translatedText={
            tempTranslatedMsg
              ? tempTranslatedMsg[message.getId()]
              : this.translatedMessage[message.getId()]
                ? this.translatedMessage[message.getId()]
                : ""
          }
          textStyle={_style?.textStyle}
          textContainerStyle={_style?.textContainerStyle}
          translatedTextStyle={_style?.translatedTextStyle}
          translatedTextContainerStyle={_style?.translatedTextContainerStyle}
          text={messageText}
          alignment={alignment}
          textFormatters={finalFormatters}
          translatedTextDividerStyle={_style?.translatedTextDividerStyle}
        />
      );
    }
    // Otherwise, return the default text message bubble from the decorated data source.
    return super.getTextMessageBubble(messageText, message, alignment, theme, additionalParams);
  }
}
