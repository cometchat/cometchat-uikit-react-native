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
    return initiator.getUid() == loggedInUser?.getUid();
  }

  static getCallStatus(
    message: CometChat.BaseMessage,
    loggedInUser: CometChat.User
  ): string {
    try {
      // if (!(message instanceof CometChat.Call)) return '';
      let call = message as CometChat.Call;
      let callMessageText = '';
      let initiator = (call?.getCallInitiator && call?.getCallInitiator()) || call.getInitiator();
      switch (call.getStatus()) {
        case CALL_INITIATED:
          if (this.isInitiator(initiator, loggedInUser)) {
            callMessageText = `${localize(`OUTGOING_CALL`)}`;
          } else {
            callMessageText = `${localize(`INCOMING_CALL`)}`;
          }
          break;
        case CALL_ONGOING:
          callMessageText = `${localize(`ONGOING_CALL`)}`;
          break;
        case CALL_ENDED:
          if (this.isInitiator(initiator, loggedInUser)) {
            callMessageText = `${localize(`OUTGOING_CALL`)}`;
          } else {
            callMessageText = `${localize(`INCOMING_CALL`)}`;
          }
          break;
        case CALL_BUSY:
        case CALL_UNANSWERED:
          if (this.isInitiator(initiator, loggedInUser)) {
            callMessageText = `${localize('UNANSWERED_CALL')}`;
          } else {
            callMessageText = `${localize('MISSED_CALL')}`;
          }
          break;
        case CALL_CANCELLED:
          if (this.isInitiator(initiator, loggedInUser)) {
            callMessageText = `${localize('CANCELLED_CALL')}`;
          } else {
            callMessageText = `${localize('MISSED_CALL')}`;
          }
          break;
        case CALL_REJECTED:
          if (this.isInitiator(initiator, loggedInUser)) {
            callMessageText = `${localize('REJECTED_CALL')}`;
          } else {
            callMessageText = `${localize('MISSED_CALL')}`;
          }
          break;
      }
      if (callMessageText == undefined || callMessageText == "undefined")
        console.log(message, loggedInUser);

      return callMessageText;
    } catch (e) {
      console.log("__CATCH", e)
      return "";
    }
  }

  static isMissedCall(call: CometChat.Call, loggedInUser: CometChat.User) {
    const callStatus: any = call.getStatus();
    if (this.isInitiator(call.getInitiator(), loggedInUser)) {
      return callStatus === CALL_UNANSWERED;
    } else {
      return [
        CALL_BUSY,
        CALL_UNANSWERED,
        CALL_REJECTED,
        CALL_CANCELLED,
      ].includes(callStatus);
    }
  }

  static convertMinutesToHoursMinutesSeconds(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    const seconds = Math.floor((minutes - Math.floor(minutes)) * 60);
    let hoursString = "";
    let minutesString = "";
    let secondsString = "";
    if (hours > 0) {
      hoursString = `${hours}h`;
    }
    if (remainingMinutes > 0) {
      minutesString = `${remainingMinutes}m`;
    }
    if (seconds >= 0) {
      secondsString = `${seconds}s`;
    }
    return hoursString ? `${hoursString} ${minutesString} ${secondsString}` : minutesString ? `${minutesString} ${secondsString}` : secondsString;
  }
  static convertSecondsToHoursMinutesSeconds(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor((seconds % 3600) % 60);
    let hoursString = "";
    let minutesString = "";
    let secondsString = "";
    if (hours > 0) {
      hoursString = `${hours}h`;
    }
    if (remainingMinutes > 0) {
      minutesString = `${remainingMinutes}m`;
    }
    if (remainingSeconds >= 0) {
      secondsString = `${remainingSeconds}s`;
    }
    return hoursString ? `${hoursString} ${minutesString} ${secondsString}` : minutesString ? `${minutesString} ${secondsString}` : secondsString;
  }

}
