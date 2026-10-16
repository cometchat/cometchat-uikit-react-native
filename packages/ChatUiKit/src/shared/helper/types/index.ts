import { CometChat } from "@cometchat/chat-sdk-react-native";
import {
  ColorValue,
  DimensionValue,
  ImageSourcePropType,
  ImageStyle,
  ImageURISource,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import { Typography } from "../../../theme/default";
import { ActionItemInterface } from "../../views";
import { JSX } from "react";

export type ImageType = ImageURISource;

export type CometChatMessageComposerAction = ActionItemInterface & {
  id?: any;
  title?: string;
  icon?: JSX.Element | ImageSourcePropType;
  CustomView?: (
    user: CometChat.User,
    group: CometChat.Group,
    id: string | number,
    props: object
  ) => JSX.Element;
  onPress?: (user?: CometChat.User, group?: CometChat.Group) => void;
  style?: Partial<{
    containerStyle: ViewStyle;
    iconStyle: ImageStyle;
    iconContainerStyle: ViewStyle;
    titleStyle: TextStyle;
  }>;
};

type DoNotPartial =
  | TextStyle
  | ViewStyle
  | ImageURISource
  | ImageStyle
  // StyleProp is a recursive alias (ReadonlyArray<StyleProp<T>>); mapping over it never terminates
  | StyleProp<TextStyle>
  | StyleProp<ViewStyle>
  | StyleProp<ImageStyle>
  | ColorValue
  | DimensionValue
  | ImageSourcePropType
  | JSX.Element;
export type DeepPartial<T> = T extends object
  ? T extends Typography
    ? {
        [P in keyof T]?: DeepPartial<T[P]>;
      }
    : T extends DoNotPartial
    ? T
    : {
        [P in keyof T]?: DeepPartial<T[P]>;
      }
  : T;

export type ValueOf<T> = T[keyof T];

export type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];
