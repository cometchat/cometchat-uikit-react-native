import { StyleSheet } from "react-native";
import { FontStyleInterface } from "../../base";
export interface TimeSlotSelectorStyles {
  titleFont?: FontStyleInterface;
  titleColor?: string;
  // BaseStyle;
  slotTextFont?: FontStyleInterface;
  slotTextColor?: string;
  slotBackgroundColor?: string;
  selectedSlotBackgroundColor?: string;
  selectedSlotTextColor?: string;
}
export const styles = StyleSheet.create({
  container: { flex: 1, paddingVertical: 5, paddingHorizontal: 5 },
  secContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  earthIcon: { height: 15, width: 15 },
  timeSlotContainer: {
    height: 32,
    width: (300 - 40) / 3,
    marginVertical: 5,
    marginHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
  },
});
