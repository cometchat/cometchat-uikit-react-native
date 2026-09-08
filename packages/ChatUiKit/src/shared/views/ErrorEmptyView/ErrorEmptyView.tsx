import { JSX } from "react";
import { StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";

/**
 * Props for the ErrorEmptyView component.
 */
type ErrorEmptyViewProps = {
  /**
   * The title text to display in the error/empty view.
   */
  title?: string;
  /**
   * The subtitle text to display in the error/empty view.
   */
  subTitle?: string;
  /**
   * A JSX element to display as an icon.
   */
  Icon?: JSX.Element;
  /**
   * An optional tertiary title for additional context.
   */
  tertiaryTitle?: string;
  /**
   * Custom style for the container of the error/empty view.
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Custom style for the title text.
   */
  titleStyle?: StyleProp<TextStyle>;
  /**
   * Custom style for the subtitle text.
   */
  subTitleStyle?: StyleProp<TextStyle>;
  /**
   * A custom JSX element to render for a retry action.
   */
  RetryView?: JSX.Element;
  /** Forwarded to the container so a caller can identify which state rendered. */
  testID?: string;
};


export const ErrorEmptyView = (props: ErrorEmptyViewProps) => {
  const {
    title,
    subTitle,
    tertiaryTitle = "",
    Icon = null,
    containerStyle = {},
    titleStyle = {},
    subTitleStyle = {},
    RetryView = null,
    testID,
  } = props;
  return (
    <View testID={testID} style={[containerStyle]}>
      {Icon}
      {title && <Text style={titleStyle}>{title}</Text>}
      {subTitle && <Text style={subTitleStyle}>{subTitle}</Text>}
      {tertiaryTitle && <Text style={subTitleStyle}>{tertiaryTitle}</Text>}
      {RetryView}
    </View>
  );
};