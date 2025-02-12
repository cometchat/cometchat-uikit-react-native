import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  Image,
  FlatList,
  TextProps,
  TextStyle,
  ViewProps,
  //@ts-ignore
} from 'react-native';
import { CometChatAvatar } from '../../views/CometChatAvatar';
import { CometChatStatusIndicator } from '../../views/CometChatStatusIndicator';
import { CometChatContext } from '../../CometChatContext';
//@ts-ignore
import SwipeRow from '../../helper/SwipeRow';
import { ListItemStyle } from './ListItemStyle';
import { Style } from './style';
import { ImageType } from '../../base';
import { AvatarStyleInterface } from '../CometChatAvatar/AvatarStyle';
import { CometChatOptions } from '../../modals';
import { CometChatContextType } from '../../base/Types';
import { anyObject } from '../../utils';

/**
 *
 * This component used to display list Item.
 */

export interface CometChatListItemInterface {
  id: string | number;
  avatarURL?: ImageType;
  avatarName?: string;
  avatarStyle?: AvatarStyleInterface;
  statusIndicatorColor?: string;
  statusIndicatorIcon?: ImageType;
  statusIndicatorStyle?: StyleProp<ViewStyle>;
  title?: string;
  SubtitleView?: React.FC | null;
  options?: () => CometChatOptions[];
  TailView?: React.FC | null;
  hideSeparator?: boolean;
  separatorColor?: string;
  listItemStyle?: ListItemStyle;
  onPress?: Function;
  onLongPress?: Function;
  headViewContainerStyle?: StyleProp<ViewStyle>;
  tailViewContainerStyle?: StyleProp<ViewStyle>;
  bodyViewContainerStyle?: StyleProp<ViewStyle>;
  activeSwipeRows?: anyObject;
  rowOpens?: (id: string | number) => void;
}
export const CometChatListItem = (props: CometChatListItemInterface) => {
  //state for translateX
  const [translate, setTranslate] = useState(0);
  const { theme } = useContext<CometChatContextType>(CometChatContext);

  const {
    id,
    avatarURL,
    avatarName,
    avatarStyle,
    statusIndicatorColor,
    statusIndicatorIcon,
    statusIndicatorStyle,
    title,
    SubtitleView,
    options,
    TailView,
    separatorColor,
    headViewContainerStyle,
    tailViewContainerStyle,
    bodyViewContainerStyle,
    onPress,
    onLongPress,
    rowOpens,
    listItemStyle: listItemStyleProp = new ListItemStyle({}),
    hideSeparator = true,
    activeSwipeRows = {},
  } = props;

  const swipeRowRef = useRef<any>(null);
  const listItemStyle = new ListItemStyle({
    backgroundColor: theme.palette.getBackgroundColor(),
    titleColor: theme.palette.getAccent(),
    titleFont: theme.typography.name,
    ...listItemStyleProp,
  });

  const [swipeRowOptions, setSwipeRowOptions] = useState<any[]>([]);
  let cancelClick = false;

  useEffect(() => {
    if (options) {
      let rowOptions = options();
      if (rowOptions) setSwipeRowOptions(rowOptions);
    }
  }, [options]);
  /**
   * Component to be display the user status
   */
  const PresenceView = () => {
    return (
      <CometChatStatusIndicator
        backgroundImage={statusIndicatorIcon}
        style={{
          ...Style.defaultStatusStyle,
          ...(statusIndicatorStyle ? (statusIndicatorStyle as object) : {}),
        }}
        backgroundColor={statusIndicatorColor ? statusIndicatorColor : ''}
      />
    );
  };

  /**
   * Component to be display the avatar
   */
  const AvatarView = () => {
    return (
      <View style={[Style.avatarViewStyle, headViewContainerStyle ?? {}]}>
        <CometChatAvatar
          style={avatarStyle}
          image={avatarURL}
          name={avatarName}
        />
        {(statusIndicatorIcon || statusIndicatorColor?.length !== 0) && (
          <PresenceView />
        )}
      </View>
    );
  };

  /**
   * Component to be display the Title
   */
  const TitleView = () => {
    return (
      <View>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={
            [
              Style.titleTextStyle,
              {
                color: listItemStyle.titleColor,
              },
              listItemStyle.titleFont,
            ] as StyleProp<TextStyle>
          }
        >
          {title?.trim()}
        </Text>
      </View>
    );
  };

  /**
   * CallBack Function when user click on the option
   */
  const clickHandler = () => {
    !cancelClick && onPress && typeof onPress == 'function' && onPress(id);
  };

  /**
   * CallBack Function when user longPress on the option
   */
  const longPressHandler = () => {
    !cancelClick &&
      onLongPress &&
      typeof onLongPress == 'function' &&
      onLongPress(id);
  };

  const onLayout = (event: { nativeEvent: { layout: { width: any } } }) => {
    const { width } = event.nativeEvent.layout;
    setTranslate(width);
  };

  const rowOpened = () => {
    if (activeSwipeRows) activeSwipeRows[id] = swipeRowRef;
    rowOpens && rowOpens(id);
    cancelClick = true;
  };

  const rowClosed = () => {
    cancelClick = false;
  };

  /**
   * Component to be display the Tail section
   */
  const TailViewFc = useCallback(() => {
    return (
      <View style={[Style.tailViewStyle, tailViewContainerStyle ?? {}]}>
        {Boolean(TailView) && typeof TailView === 'function' && <TailView />}
      </View>
    );
  }, [tailViewContainerStyle, tailViewContainerStyle, TailView]);

  /**
   * Component to be display the Options in list after swipe
   */
  const OptionsListItem = ({ item }: any) => {
    return (
      <TouchableOpacity
        onPress={() => item.onPress(id)}
        style={[
          Style.rightActionButtonStyle,
          {
            backgroundColor: item?.backgroundColor ?? theme.palette.getError(),
          },
        ]}
      >
        <View style={Style.optionButtonViewStyle}>
          <Image
            style={[
              Style.optionButtonImageStyle,
              { tintColor: item.iconTint || '' },
            ]}
            resizeMode="contain"
            source={
              typeof item.icon === 'string' ? { uri: item.icon } : item.icon
            }
          />
          {Boolean(item.title) && item.title.length > 0 && (
            <Text
              style={[
                Style.optionTitleStyle,
                item.titleStyle ?? theme.typography.text1,
              ]}
            >
              {item.title}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  let ListComponent: any =
    (onPress && typeof onPress == 'function') ||
    (onLongPress && typeof onLongPress == 'function')
      ? TouchableOpacity
      : View;
  let listComponentProps =
    (onPress && typeof onPress == 'function') ||
    (onLongPress && typeof onLongPress == 'function')
      ? {
          activeOpacity: 1,
          onPress: clickHandler,
          onLongPress: longPressHandler,
        }
      : {};

  let WrapperComponent = swipeRowOptions.length ? SwipeRow : React.Fragment;
  let wrapperComponentProps = swipeRowOptions.length
    ? {
        ref: swipeRowRef,
        key: id,
        onRowDidOpen: rowOpened,
        onRowDidClose: rowClosed,
        disableRightSwipe: true,
        disableLeftSwipe: !swipeRowOptions.length,
        rightOpenValue: 0 - translate,
      }
    : {};

  return (
    <WrapperComponent {...wrapperComponentProps}>
      <View
        style={
          [
            Style.optionStyle,
            {
              height: listItemStyle.height ?? 50,
            },
          ] as ViewProps
        }
      >
        <View onLayout={onLayout} style={Style.optionStyleContainer}>
          {swipeRowOptions.length !== 0 && (
            <FlatList
              horizontal
              data={swipeRowOptions.slice(0, 3)}
              renderItem={OptionsListItem}
              keyExtractor={(_, i) => _.id ?? i}
            />
          )}
        </View>
      </View>
      <ListComponent
        {...listComponentProps}
        style={[
          Style.container,
          {
            backgroundColor: listItemStyle.backgroundColor,
            borderRadius: listItemStyle?.borderRadius ?? 0,
            borderWidth: listItemStyle?.border?.borderWidth ?? 0,
            borderColor: listItemStyle?.border?.borderColor ?? 'black',
            borderStyle: listItemStyle?.border?.borderStyle ?? 'solid',
            height: listItemStyle?.height ?? 72,
          },
        ]}
      >
        {Boolean(avatarURL || avatarName) && <AvatarView />}
        <View
          style={[
            Style.rightContainerStyle,
            {
              borderBottomWidth: hideSeparator ? 0 : 1,
              borderBottomColor: separatorColor || undefined,
            },
          ]}
        >
          <View style={[Style.middleViewStyle, bodyViewContainerStyle ?? {}]}>
            {Boolean(title) && <TitleView />}
            {Boolean(SubtitleView) && typeof SubtitleView === 'function' && (
              <SubtitleView />
            )}
          </View>
          {Boolean(TailView) && <TailViewFc />}
        </View>
      </ListComponent>
    </WrapperComponent>
  );
};
