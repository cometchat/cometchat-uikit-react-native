import { CometChat } from '@cometchat-pro/react-native-chat';

import * as enums from '../../../utils/enums';

export class messageAlertManager {
  msgListenerId = 'incoming_message_' + new Date().getTime();

  attachListeners(callback) {
    CometChat.addMessageListener(
      this.msgListenerId,
      new CometChat.MessageListener({
        onCustomMessageReceived: (customMessage) => {
          if (customMessage.type == enums.CUSTOM_TYPE_MEETING) {
            callback(enums.CUSTOM_MESSAGE_RECEIVED, customMessage);
          }
        },
      }),
    );
  }

  removeListeners() {
    CometChat.removeMessageListener(this.msgListenerId);
  }
}
