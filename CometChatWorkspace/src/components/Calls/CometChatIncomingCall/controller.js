import { CometChat } from '@cometchat-pro/react-native-chat';

import * as enums from '../../../utils/enums';

export class CallAlertManager {
  callListenerId = `incoming_call_${new Date().getTime()}`;

  attachListeners(callback) {
    CometChat.addCallListener(
      this.callListenerId,
      new CometChat.CallListener({
        onIncomingCallReceived: (call) => {
          callback(enums.INCOMING_CALL_RECEIVED, call);
        },
        onIncomingCallCancelled: (call) => {
          callback(enums.INCOMING_CALL_CANCELLED, call);
        },
      }),
    );
  }

  removeListeners() {
    CometChat.removeCallListener(this.callListenerId);
  }
}
