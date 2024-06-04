import { StyleSheet } from "react-native";
import { BorderStyleInterface, FontStyle } from "../../base";

export interface DatePickerStyleInterface {
  titleFont?: FontStyle;
  titleColor?: string;
  border?: BorderStyleInterface;
}
export const styles = StyleSheet.create({
  dateContainerView: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderRadius: 5,
  },
});
