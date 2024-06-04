import { DataSource, DataSourceDecorator } from '../../shared/framework';
// @ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { ReceiverTypeConstants } from '../../shared/constants/UIKitConstants';
import { ViewAlignment } from '../../shared/constants/UIKitConstants';
import { ExtensionConstants } from '../ExtensionConstants';
import { getExtentionData } from '../ExtensionModerator';
// @ts-ignore
import React from 'react';
// @ts-ignore
import { CometChatUIEvents, MessageEvents } from '../../shared/events';
import { SmartRepliesView } from './SmartRepliesView';
import {
  getUnixTimestamp,
} from '../../shared/utils/CometChatMessageHelper';
import { CometChatUIEventHandler } from '../../shared/events/CometChatUIEventHandler/CometChatUIEventHandler';
import { CometChatUIKit } from '../../shared/CometChatUiKit/CometChatUIKit';
import { SmartRepliesConfigurationInterface } from './SmartRepliesExtension';

export class SmartRepliesDecorator extends DataSourceDecorator {
  smartRepliesConfiguration?: SmartRepliesConfigurationInterface;

  loggedInUser: CometChat.User;

  constructor(
    dataSource: DataSource,
    smartRepliesConfiguration?: SmartRepliesConfigurationInterface
  ) {
    super(dataSource);
    if (smartRepliesConfiguration != undefined) {
      this.smartRepliesConfiguration = smartRepliesConfiguration;
    }

    CometChat.getLoggedinUser()
      .then((u) => {
        this.loggedInUser = u;
      })
      .catch((err) => console.log(err));

    CometChatUIEventHandler.addMessageListener(
      MessageEvents.ccActiveChatChanged,
      {
        ccActiveChatChanged: ({message}) => {
          if(message && message['sender']?.['uid'] != this.loggedInUser.getUid())
            this.getReplies(message);
        },
        onTextMessageReceived: (textMessage) => {
          this.getReplies(textMessage);
        },
      }
    );
  }

  isDeletedMessage(message: CometChat.BaseMessage): boolean {
    return message.getDeletedBy() != null;
  }

  getId(): string {
    return 'SmartReply';
  }

  getReplies(message) {
    const smartReplyData = getExtentionData(
      message,
      ExtensionConstants.smartReply
    );
    let options = [];
    if (
      smartReplyData &&
      Object.keys(smartReplyData).length &&
      !smartReplyData.hasOwnProperty('error')
    ) {
      options.push(smartReplyData['reply_positive']);
      options.push(smartReplyData['reply_neutral']);
      options.push(smartReplyData['reply_negative']);
    }
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.showPanel, {
      alignment: ViewAlignment.messageListBottom,
      child: () => (
        <SmartRepliesView
          replies={options}
          onClose={this.onCloseRepliesPannel}
          onClick={(smartReply) => {
            this.handleSendMessage(message, smartReply);
          }}
          {...this.smartRepliesConfiguration}
        />
      ),
    });
  }

  handleSendMessage = (message, smartReply) => {
    let chatWithId = '';
    let chatWith;
    if (!smartReply.trim().length) {
      return;
    }
    if (typeof message !== 'object') return;
    if (message?.receiverType === ReceiverTypeConstants.user) {
      chatWithId = message?.sender?.uid;
      chatWith = ReceiverTypeConstants.user;
    } else {
      chatWithId = message?.receiverId;
      chatWith = ReceiverTypeConstants.group;
    }
    let textMessage = new CometChat.TextMessage(
      chatWithId,
      smartReply,
      chatWith
    );
    textMessage.setParentMessageId(message.getParentMessageId());
    textMessage.setSender(this.loggedInUser);
    textMessage.setText(smartReply);
    textMessage.setSentAt(getUnixTimestamp());
    textMessage.setMuid(String(getUnixTimestamp()));

    CometChatUIKit.sendTextMessage(textMessage)
      .then(() => {})
      .catch(() => {})
  };

  onCloseRepliesPannel = () => {
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.hidePanel, {
      alignment: ViewAlignment.messageListBottom,
    });
  };
}
