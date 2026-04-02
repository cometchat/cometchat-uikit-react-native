import { CometChat } from "@cometchat/chat-sdk-react-native";
import {
  CALL_BUSY,
  CALL_CANCELLED,
  CALL_ENDED,
  CALL_INITIATED,
  CALL_ONGOING,
  CALL_REJECTED,
  CALL_UNANSWERED,
} from "../shared/constants/UIKitConstants";
import { getCometChatTranslation } from "../shared/resources/CometChatLocalizeNew/LocalizationManager";
import { IconName } from "../shared/icons/Icon";
const t = getCometChatTranslation()
export class CallUtils {
  /**
   * Checks if the given initiator is the same as the logged in user.
   *
   * @param initiator - The call initiator.
   * @param loggedInUser - The logged in user.
   * @returns True if the initiator is the logged in user.
   */
  private static isInitiator(initiator: CometChat.User, loggedInUser: CometChat.User): boolean {
    return initiator.getUid() == loggedInUser?.getUid();
  }

  /**
   * Retrieves the call status along with an appropriate icon.
   *
   * @param message - The call message.
   * @param loggedInUser - The logged in user.
   * @returns An object containing callMessageText and selectedIcon.
   */
  static getCallStatus(
    message: CometChat.BaseMessage,
    loggedInUser: CometChat.User
  ): {
    callMessageText: string;
    selectedIcon: IconName;
  } {
    try {
      // if (!(message instanceof CometChat.Call)) return '';
      let call = message as CometChat.Call;
      let callMessageText = "";
      let selectedIcon: IconName = "" as any;
      let initiator =
        (call?.getCallInitiator && call?.getCallInitiator()) || (call as any).getInitiator();
      switch (call.getStatus()) {
        case CALL_INITIATED:
          if (this.isInitiator(initiator, loggedInUser)) {
            callMessageText = `${t(`OUTGOING_CALL`)}`;
            selectedIcon = call["type"] === "audio" ? "outgoing-audio" : "outgoing-video";
          } else {
            callMessageText = `${t(`INCOMING_CALL`)}`;
            selectedIcon = call["type"] === "audio" ? "incoming-audio" : "incoming-video";
          }
          break;
        case CALL_ONGOING:
          callMessageText = `${t(`CALL_ACCEPTED`)}`;
          selectedIcon = call["type"] === "audio" ? "call" : "video-call";
          break;
        case CALL_ENDED:
          callMessageText = `${t(`CALL_ENDED`)}`;
          selectedIcon = call["type"] === "audio" ? "call" : "video-call";
          break;
        case CALL_UNANSWERED:
          if (this.isInitiator(initiator, loggedInUser)) {
            callMessageText = `${t("UNANSWERED_CALL")}`;
            selectedIcon = call["type"] === "audio" ? "call" : "video-call";
          } else {
            callMessageText = `${t("MISSED_CALL")}`;
            selectedIcon = call["type"] === "audio" ? "phone-missed" : "missed-video-call";
          }
          break;
        case CALL_CANCELLED:
          if (this.isInitiator(initiator, loggedInUser)) {
            callMessageText = `${t("CANCELLED_CALL")}`;
            selectedIcon = call["type"] === "audio" ? "call" : "video-call";
          } else {
            callMessageText = `${t("MISSED_CALL")}`;
            selectedIcon = call["type"] === "audio" ? "phone-missed" : "missed-video-call";
          }
          break;
        case CALL_REJECTED:
          if (this.isInitiator(initiator, loggedInUser)) {
            callMessageText = `${t("CALL_REJECTED")}`;
            selectedIcon = call["type"] === "audio" ? "call" : "video-call";
          } else {
            callMessageText = `${t("CALL_REJECTED")}`;
            selectedIcon = call["type"] === "audio" ? "call" : "video-call";
          }
          break;
        case CALL_BUSY:
          if (this.isInitiator(initiator, loggedInUser)) {
            callMessageText = `${t("CALL_BUSY")}`;
            selectedIcon = call["type"] === "audio" ? "call" : "video-call";
          } else {
            callMessageText = `${t("MISSED_CALL")}`;
            selectedIcon = call["type"] === "audio" ? "phone-missed" : "missed-video-call";
          }
          break;
      }
      if (callMessageText == undefined || callMessageText == "undefined")
        console.log(message, loggedInUser);

      return { callMessageText, selectedIcon };
    } catch (e) {
      console.log("__CATCH", e);
      return { callMessageText: "", selectedIcon: "" as any };
    }
  }

  /**
   * Determines if the given call is a missed call.
   *
   * @param call - The call object.
   * @param loggedInUser - The logged in user.
   * @returns True if it's a missed call.
   */
  static isMissedCall(call: CometChat.Call, loggedInUser: CometChat.User): boolean {
    const callStatus: any = call.getStatus();
    const iAmInitiator = this.isInitiator((call as any)?.getInitiator(), loggedInUser);

    if (iAmInitiator) {
      return callStatus === CALL_UNANSWERED;
    }

    // Incoming calls: treat BUSY and REJECTED as missed as well
    return [CALL_UNANSWERED, CALL_CANCELLED, CALL_BUSY, CALL_REJECTED].includes(callStatus);
  }

  /**
   * Returns a call status string for displaying in call logs.
   *
   * @param call - The call object.
   * @param loggedInUser - The logged in user.
   * @returns "outgoing", "incoming", or "missed".
   */
  static getCallStatusForCallLogs(
    call: CometChat.Call,
    loggedInUser: CometChat.User
  ): "outgoing" | "incoming" | "missed" {
    const callStatus: any = call.getStatus();
    if (this.isInitiator((call as any)?.getInitiator(), loggedInUser)) {
      return "outgoing";
    } else {
      if (this.isMissedCall(call, loggedInUser)) {
        return "missed";
      }
      return "incoming";
    }
  }

  /**
   * Converts minutes to a formatted string (hours, minutes, seconds).
   *
   * @param minutes - The time in minutes.
   * @returns A formatted string.
   */
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
    return hoursString
      ? `${hoursString} ${minutesString} ${secondsString}`
      : minutesString
        ? `${minutesString} ${secondsString}`
        : secondsString;
  }

  /**
   * Converts seconds to a formatted string (hours, minutes, seconds).
   *
   * @param seconds - The time in seconds.
   * @returns A formatted string.
   */
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
    return hoursString
      ? `${hoursString} ${minutesString} ${secondsString}`
      : minutesString
        ? `${minutesString} ${secondsString}`
        : secondsString;
  }
}
