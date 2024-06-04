import { CometChat } from '@cometchat/chat-sdk-react-native';
import {
  CALL_BUSY,
  CALL_CANCELLED,
  CALL_ENDED,
  CALL_INITIATED,
  CALL_ONGOING,
  CALL_REJECTED,
  CALL_UNANSWERED,
} from '../shared/constants/UIKitConstants';
import { localize } from '../shared/resources/CometChatLocalize';

export class CallUtils {
  private static isInitiator(
    initiator: CometChat.User,
    loggedInUser: CometChat.User
  ): boolean {
    return initiator.getUid() == loggedInUser.getUid();
  }

  static getCallStatus(
    message: CometChat.BaseMessage,
    loggedInUser: CometChat.User
  ): string {
    if (!(message instanceof CometChat.Call)) return '';
    let call = message as CometChat.Call;
    let callMessageText = '';
    let initiator = call.getCallInitiator();
    switch (call.getStatus()) {
      case CALL_INITIATED:
        if (this.isInitiator(initiator, loggedInUser)) {
            callMessageText = `${localize('OUTGOING_CALL')}`;
        } else {
            callMessageText = `${localize('INCOMING_CALL')}`;
        }
        break;
      case CALL_ONGOING:
        callMessageText = `${localize('CALL_ACCEPTED')}`;
        break;
      case CALL_ENDED:
        callMessageText = `${localize('CALL_ENDED')}`;
        break;
      case CALL_UNANSWERED:
        if (this.isInitiator(initiator, loggedInUser)) {
          callMessageText = `${localize('CALL_UNANSWERED')}`;
        } else {
          callMessageText = `${localize('CALL_MISSED')}`;
        }
        break;
      case CALL_CANCELLED:
        if (this.isInitiator(initiator, loggedInUser)) {
          callMessageText = `${localize('CALL_CANCELLED')}`;
        } else {
          callMessageText = `${localize('CALL_MISSED')}`;
        }
        break;
      case CALL_REJECTED:
      case CALL_BUSY:
        if (this.isInitiator(initiator, loggedInUser)) {
          callMessageText = `${localize('CALL_REJECTED')}`;
        } else {
          callMessageText = `${localize('CALL_MISSED')}`;
        }
        break;
    }
    if (callMessageText == undefined || callMessageText == "undefined")
        console.log(message, loggedInUser);
        
    return callMessageText;
  }
}
