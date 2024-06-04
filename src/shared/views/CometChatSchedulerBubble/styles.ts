import { StyleSheet } from "react-native";
import { BorderStyleInterface, FontStyleInterface } from "../../base";
import { AvatarStyleInterface } from "../CometChatAvatar";
import { ButtonStyleInterface } from "../CometChatButton";
import { TimeSlotSelectorStyles } from "../CometChatTimeSlotSelector/styles";
import { QuickViewStyleInterface } from "../CometChatQuickView/QuickViewStyle";
export interface SchedulerBubbleStyles {
  // width,
  // height,
  border?: BorderStyleInterface;
  backgroundColor?: string;
  avatarStyle?: AvatarStyleInterface;
  suggestedTimeTextFont?: FontStyleInterface;
  suggestedTimeTextColor?: string;
  suggestedTimeBackground?: string;
  suggestedTimeBorder?: BorderStyleInterface;
  // dateSelectorStyle;
  timeSlotSelectorStyle?: TimeSlotSelectorStyles;
  submitButtonStyle?: ButtonStyleInterface;
  titleTextFont?: FontStyleInterface;
  quickViewStyle?: QuickViewStyleInterface;
  titleTextColor?: string;
  summaryTextFont?: FontStyleInterface;
  summaryTextColor?: string;
  goalCompletionTextColor?: string;
  goalCompletionTextFont?: FontStyleInterface;
}
export const styles = StyleSheet.create({
  mainContainer: {
    borderWidth: 0.69,
    borderColor: "rgba(212, 213, 215, 1)",
    borderRadius: 10,
  },
  quickAvatarContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 213, 215, 1)",
  },
  avatarCont: { height: 48, width: 48, border: { borderWidth: 0 } },
  quickContTimeContainer: { paddingHorizontal: 20, paddingTop: 6 },
  quickContMore: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 15,
    justifyContent: "center",
  },
  timeBoxContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderWidth: 0.69,
    borderRadius: 8,
    marginTop: 10,
  },
  calendarBackArrow: { height: 18, width: 18 },
  calendarAvatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 213, 215, 1)",
  },
  calendarSelectDayContainer: { paddingLeft: 10, paddingTop: 10 },
  calendarTimeZoneContainer: {
    paddingTop: 5,
    paddingBottom: 10,
    alignItems: "flex-end",
    paddingRight: 10,
  },
  lodingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  noTimeSlotTextContainer: {
    justifyContent: "center",
    paddingLeft: 10,
    flex: 1,
    alignItems: "center",
    height: 250,
  },
  noTimeSlotImage: { height: 30, width: 30, marginBottom: 20 },
  scheduleSecContainer: { paddingHorizontal: 10, paddingTop: 15 },
  scheduleTimeContainer: { flexDirection: "row", paddingRight: 15 },
  scheduleTimeZoneCont: {
    flexDirection: "row",
    alignItems: "center",
  },
  scheduleErrorCont: {
    width: "100%",
    paddingBottom: 10,
  },
});
