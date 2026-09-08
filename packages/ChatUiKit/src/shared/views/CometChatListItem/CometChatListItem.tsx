import React, { ReactNode, useCallback, useState } from "react";
import {
  GestureResponderEvent,
  ImageSourcePropType,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../../theme";
import { CometChatTheme } from "../../../theme/type";
import { Icon } from "../../icons/Icon";
import { CometChatAvatar } from "../CometChatAvatar";
import {
  CometChatStatusIndicator,
  CometChatStatusIndicatorInterface,
} from "../CometChatStatusIndicator";
import { Style } from "./style";
import { DeepPartial } from "../../helper/types";

export interface CometChatListItemInterface {
  /** Forwarded to the row's root node so a caller can address a specific row. */
  testID?: string;
  /**
   * Unique identifier for the list item.
   */
  id: string | number;
  /**
   * URL for the avatar image.
   */
  avatarURL?: ImageSourcePropType;
  /**
   * Fallback name for the avatar if image is not available.
   */
  avatarName?: string;
  /**
   * Custom style for the avatar.
   */
  avatarStyle?: CometChatTheme["avatarStyle"];
  /**
   * Title text to display.
   */
  title?: string;
  /**
   * Custom style for the title text.
   */
  titleStyle?: StyleProp<TextStyle>;
  /**
   * Custom style for the item container.
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Specifies the type for the status indicator.
   */
  statusIndicatorType?: CometChatStatusIndicatorInterface["type"] | null;
  /**
   * Custom node to display at the beginning of the item.
   */
  LeadingView?: ReactNode;
  /**
   * Custom node to display as the title view.
   */
  TitleView?: ReactNode;
  /**
   * Custom node to display as the subtitle view.
   */
  SubtitleView?: ReactNode;
  /**
   * Custom node to display at the end of the item.
   */
  TrailingView?: ReactNode;
  /**
   * Color for the separator.
   */
  separatorColor?: string;
  /**
   * Callback function triggered on item press.
   */
  onPress?: Function;
  /**
   * Callback function triggered on item long press.
   */
  onLongPress?: Function;
  /**
   * Indicates if the item is selectable.
   */
  shouldSelect?: boolean;
  /**
   * Custom style for the container of the left (head) view.
   */
  headViewContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Custom style for the container of the trailing view.
   */
  trailingViewContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Custom style for the container wrapping title and subtitle.
   */
  titleSubtitleContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Indicates if the item is selected.
   */
  selected?: boolean;
  statusIndicatorStyle?: DeepPartial<CometChatTheme['statusIndicatorStyle']>
}

/**
 * CometChatListItem renders a single item in the list.
 * It displays an avatar with an optional status indicator, title, subtitle, and trailing view.
 *
 * @param {CometChatListItemInterface} props - Props for the list item.
 * @returns {JSX.Element} The rendered list item.
 */
export const CometChatListItem = React.memo((props: CometChatListItemInterface) => {
  const [translate, setTranslate] = useState(0);
  const theme = useTheme();

  const {
    testID,
    id,
    avatarURL,
    avatarName,
    title,
    LeadingView,
    SubtitleView,
    TrailingView,
    headViewContainerStyle,
    trailingViewContainerStyle,
    titleSubtitleContainerStyle,
    onPress,
    onLongPress,
    statusIndicatorType,
    titleStyle,
    containerStyle,
    avatarStyle,
    selected = false,
    shouldSelect,
    TitleView,
    statusIndicatorStyle
  } = props;

  let cancelClick = false;

  const CheckBoxView = useCallback(() => {
    return (
      <>
        {shouldSelect && (
          <View
            style={{
              width: 24,
              height: 24,
              borderWidth: 1.6,
              borderColor: theme.color.borderDefault,
              backgroundColor: selected ? theme.color.primary : theme.color.background1,
              borderRadius: 5,
              marginRight: 12,
              justifyContent: "center",
              alignItems: "center",
              zIndex: 2,
            }}
          >
            {selected && (
              <Icon
                name='list-item-check'
                size={16}
                height={16}
                width={16}
                color={theme.color.iconWhite}
              />
            )}
          </View>
        )}
      </>
    );
  }, [selected, shouldSelect]);

  /**
   * Renders the title view.
   *
   *  The title view.
   */
  const getTitleView = () => {
    if (TitleView) return TitleView;
    return (
      <Text numberOfLines={1} ellipsizeMode='tail' style={titleStyle}>
        {title}
      </Text>
    );
  };

  /**
   * Handles the press event on the list item.
   */
  const clickHandler = () => {
    if (!cancelClick) {
      if (onPress && typeof onPress === "function") {
        onPress(id);
      }
    }
  };

  /**
   * Handles the long press event on the list item.
   *
   * @param {GestureResponderEvent} e - The long press event.
   */
  const longPressHandler = useCallback(
    (e: GestureResponderEvent) => {
      if (!cancelClick) {
        if (onLongPress && typeof onLongPress === "function") {
          onLongPress(id, e);
        }
      }
    },
    [onLongPress, id]
  );

  /**
   * Renders the trailing view of the list item.
   *
   * @returns {JSX.Element | null} The trailing view if provided.
   */
  const getTrailingView = () => {
    if (TrailingView)
      return (
        <View style={[Style.tailViewStyle, trailingViewContainerStyle ?? {}]}>{TrailingView}</View>
      );
    return null;
  };

  let ListComponent =
    (onPress && typeof onPress === "function") || (onLongPress && typeof onLongPress === "function")
      ? TouchableOpacity
      : View;
  let listComponentProps =
    (onPress && typeof onPress === "function") || (onLongPress && typeof onLongPress === "function")
      ? {
          activeOpacity: 1,
          onPress: clickHandler,
          onLongPress: longPressHandler,
        }
      : {};

  const getLeadingView = useCallback(() => {
    return (
      <View style={[{ flexDirection: "row", alignItems: "center" }, headViewContainerStyle]}>
        <CheckBoxView />
        {LeadingView ? (
          LeadingView
        ) : avatarURL || avatarName ? (
          <>
            <CometChatAvatar image={avatarURL} name={avatarName!} style={avatarStyle} />
            <CometChatStatusIndicator type={statusIndicatorType} style={statusIndicatorStyle} />
          </>
        ) : null}
      </View>
    );
  }, [
    avatarURL,
    avatarName,
    statusIndicatorType,
    avatarStyle,
    headViewContainerStyle,
    theme,
    selected,
    shouldSelect,
    statusIndicatorStyle
  ]);

  return (
    <ListComponent
      {...listComponentProps}
      testID={testID}
      style={[containerStyle, selected && { backgroundColor: theme.color.background4 }]}
    >
      {getLeadingView()}
      <View style={[Style.rightContainerStyle]}>
        <View
          style={[
            Style.middleViewStyle,
            { padding: 0, paddingLeft: 0 },
            titleSubtitleContainerStyle ?? {},
          ]}
        >
          {getTitleView()}
          {SubtitleView}
        </View>
        {getTrailingView()}
      </View>
    </ListComponent>
  );
});
