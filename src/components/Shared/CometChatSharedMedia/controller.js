import { CometChat } from '@cometchat-pro/react-native-chat';

import * as enums from '../../../utils/enums';

export class SharedMediaManager {
  mediaMessageListenerId = `shared_media_${new Date().getTime()}`;

  mediaMessageRequest = null;

  constructor(item, type, messageType) {
    if (type === CometChat.RECEIVER_TYPE.USER) {
      this.mediaMessageRequest = new CometChat.MessagesRequestBuilder()
        .setUID(item.uid)
        .setLimit(10)
        .setCategory(CometChat.CATEGORY_MESSAGE)
        .setType(messageType)
        .build();
    } else {
      this.mediaMessageRequest = new CometChat.MessagesRequestBuilder()
        .setGUID(item.guid)
        .setLimit(10)
        .setCategory(CometChat.CATEGORY_MESSAGE)
        .setType(messageType)
        .build();
    }
  }

  fetchPreviousMessages() {
    return this.mediaMessageRequest.fetchPrevious();
  }

  attachListeners(callback) {
    CometChat.addMessageListener(
      this.msgListenerId,
      new CometChat.MessageListener({
        onMediaMessageReceived: (mediaMessage) => {
          callback(enums.MEDIA_MESSAGE_RECEIVED, mediaMessage);
        },
        onMessageDeleted: (deletedMessage) => {
          callback(enums.MESSAGE_DELETED, deletedMessage);
        },
      }),
    );
  }

  removeListeners() {
    CometChat.removeMessageListener(this.mediaMessageListenerId);
  }
}
