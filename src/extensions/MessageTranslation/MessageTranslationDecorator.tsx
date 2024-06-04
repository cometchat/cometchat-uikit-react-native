import { DataSource, DataSourceDecorator } from '../../shared/framework';
// @ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { ExtensionConstants, ExtensionURLs } from '../ExtensionConstants';
import {
  CometChatLocalize,
  localize,
} from '../../shared/resources/CometChatLocalize';
import { CometChatMessageOption } from "../../shared/modals";
// @ts-ignore
import React from 'react';
import { CometChatTheme } from '../../shared/resources/CometChatTheme';
import {
  MessageBubbleAlignmentType,
  MessageOptionConstants,
} from '../../shared/constants/UIKitConstants';
import { MessageTranslationBubble } from './MessageTranslationBubble';
import { MessageTranslationConfigurationInterface } from './MessageTranslationExtension';
import { CometChatUIEventHandler } from '../../shared/events/CometChatUIEventHandler/CometChatUIEventHandler';
import { CometChatUIEvents, MessageEvents } from '../../shared/events';
import { messageStatus } from '../../shared/utils/CometChatMessageHelper';
import { ICONS } from './resources';
export class MessageTranslationExtensionDecorator extends DataSourceDecorator {
  messageTranslationConfiguration?: MessageTranslationConfigurationInterface;

  translatedMessage = {};
  constructor(
    dataSource: DataSource,
    messageTranslationConfiguration?: MessageTranslationConfigurationInterface
  ) {
    super(dataSource);
    if (messageTranslationConfiguration != undefined) {
      this.messageTranslationConfiguration = messageTranslationConfiguration;
    }
  }

  getId(): string {
    return 'MessageTranslation';
  }

  getTextMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group: CometChat.Group
  ): CometChatMessageOption[] {
    let optionsList: CometChatMessageOption[] = super.getTextMessageOptions(
      loggedInUser,
      messageObject,
      group
    );
    optionsList.push(this.getTranslateOption(messageObject));
    return optionsList;
  }

  getTranslateOption(messageObject): CometChatMessageOption {
    return {
      id: MessageOptionConstants.translateMessage,
      title: localize('TRANSLATE_MESSAGE'),
      icon: ICONS.TRANSLATE,
      onPress: () => {
        this.translateMessage(messageObject);
      },
    };
  }

  getSetMetaData = (messageObj, messageTranslation) => {
    let metaData = messageObj.getMetadata();
    if (!metaData) {
      metaData = {};
    }
    if (metaData && !metaData['@injected']) {
      metaData = {
        ...metaData,
        '@injected': { extensions: { translate: {} } },
      };
    }
    if (
      metaData &&
      metaData['@injected'] &&
      metaData['@injected']['extensions']
    ) {
      let tempData = metaData['@injected']['extensions'];
      tempData = {
        ...metaData,
        '@injected': {
          ...metaData['@injected'],
          extensions: {
            ...metaData['@injected']['extensions'],
            translate: { [messageObj.id]: messageTranslation },
          },
        },
      };
      metaData = tempData;
    }

    if (
      metaData &&
      metaData['@injected'] &&
      metaData['@injected']['extensions']['translate']
    ) {
      let tempMetaData = {};
      let translateData = metaData['@injected']['extensions']['translate'];

      if (translateData) {
        translateData = {
          ...translateData,
          [messageObj.id]: messageTranslation,
        };
      } else {
        translateData[messageObj.id] = {
          [messageObj.id]: messageTranslation,
        };
      }
      tempMetaData = {
        ...metaData['@injected']['extensions']['translate'],
        ...translateData,
      };

      metaData['@injected']['extensions']['translate'] = tempMetaData;
    }

    messageObj.setMetadata(metaData);
    return {
      msg: messageObj,
      metaData: metaData['@injected']['extensions']['translate'],
    };
  };
  translateMessage = (message) => {
    const messageId = message.id;
    const messageText = message.text;
    let translateToLanguage = CometChatLocalize.getLocale();
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.ccToggleBottomSheet, {
      isBottomSheetVisible: false,
    });
    CometChat.callExtension(
      ExtensionConstants.messageTranslation,
      'POST',
      ExtensionURLs.translate,
      {
        msgId: messageId,
        text: messageText,
        languages: [translateToLanguage],
      }
    )
      .then((result) => {
        if (
          result?.hasOwnProperty('translations') &&
          result['translations']['length']
        ) {
          const messageTranslation = result['translations'][0];
          let translatedMsg = this.getSetMetaData(
            message,
            messageTranslation['message_translated']
          );
          if (translatedMsg) {
            if (translatedMsg.metaData?.translate)
              this.translatedMessage = translatedMsg?.metaData?.translate;
          } else
            this.translatedMessage = {
              [message.id]: `${messageTranslation['message_translated']}`,
            };

          CometChatUIEventHandler.emitMessageEvent(
            MessageEvents.ccMessageEdited,
            {
              message: translatedMsg.msg,
              status: messageStatus.success,
            }
          );
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  getTextMessageBubble(
    messageText: string,
    message: CometChat.TextMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme
  ): JSX.Element {
    let tempTranslatedMsg = {};
    let translatedMetaData = message.getMetadata();
    if (
      translatedMetaData &&
      translatedMetaData['@injected'] &&
      translatedMetaData['@injected']['extensions'] &&
      translatedMetaData['@injected']['extensions']['translate']
    ) {
      tempTranslatedMsg =
        translatedMetaData['@injected']['extensions']['translate'];
    }

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
              : ''
          }
          text={messageText}
          alignment={alignment}
          {...this.messageTranslationConfiguration}
        />
      );
    }
    return super.getTextMessageBubble(messageText, message, alignment, theme);
  }
}
