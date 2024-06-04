import React, { useContext, memo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { CometChatContextType } from "../../base";
import { CometChatContext } from "../../CometChatContext";
import { TimeSlotSelectorStyles, styles } from "./styles";
import { ICONS } from "../../assets/images";
import { addMinutes, convert24to12 } from "../../utils/SchedulerUtils";

export interface CometChatTimeSlotSelectorInterface {
  style: TimeSlotSelectorStyles;
  duration: number;
  timeZone: string;
  slotSelected: string;
  timeFormat: "12Hr" | "24Hr";
  slots: string[];
  onSelection: (from: string, to: string) => void;
}
export const CometChatTimeSlotSelector = memo(
  (props: CometChatTimeSlotSelectorInterface) => {
    const { theme } = useContext<CometChatContextType>(CometChatContext);
    const {
      slots,
      onSelection,
      duration,
      timeZone,
      style,
      slotSelected,
      timeFormat = "12Hr",
    } = props;

    const TimeSlot = ({ time }) => {
      return (
        <TouchableOpacity
          key={time}
          style={[
            styles.timeSlotContainer,
            slotSelected === time
              ? {
                  backgroundColor:
                    style?.selectedSlotBackgroundColor ??
                    theme.palette.getPrimary(),
                }
              : {
                  backgroundColor:
                    style?.slotBackgroundColor ??
                    theme.palette.getBackgroundColor(),
                },
          ]}
          onPress={() => {
            onSelection &&
              onSelection(
                `${time.replace(":", "")}`,
                addMinutes(time, duration)
              );
          }}
        >
          <Text
            style={[
              theme.typography.subtitle3,
              style?.slotTextFont ?? {},
              { color: style?.slotTextColor ?? theme.palette.getAccent800() },
            ]}
          >
            {timeFormat === "12Hr" ? convert24to12(time) : time}
          </Text>
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.container}>
        <Text
          style={[
            theme.typography.text1,
            {
              color: theme.palette.getAccent800(),
              marginLeft: 10,
              marginBottom: 5,
            },
          ]}
        >
          Select a Time
        </Text>
        <View style={styles.secContainer}>
          {slots?.map((item) => {
            return <TimeSlot time={item} />;
          })}
        </View>
        <Text
          style={[
            theme.typography.subtitle2,
            {
              color: theme.palette.getAccent900(),
              marginLeft: 10,
              paddingVertical: 10,
              alignSelf: "flex-end",
              paddingHorizontal: 10,
            },
          ]}
        >
          <Image
            source={ICONS.EARTH}
            style={[
              styles.earthIcon,
              { tintColor: theme.palette.getAccent900() },
            ]}
          />{" "}
          {timeZone}
        </Text>
      </View>
    );
  }
);
