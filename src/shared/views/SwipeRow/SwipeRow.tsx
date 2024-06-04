import React, { useContext, useEffect, useState } from 'react';

import { View, Text, TouchableOpacity, Image, FlatList } from 'react-native';
import { CometChatContext } from '../../CometChatContext';
import SwipeRow from '../../helper/SwipeRow';
import { Style } from './style';
import { CometChatOptions } from '../../modals';
import { CometChatContextType } from '../../base/Types';

export interface CometChatSwipeRowInterface {
  id?: string | number;

  options?: () => CometChatOptions[];
  listItemStyle?: any;
}
export const CometChatSwipeRow: React.FC<CometChatSwipeRowInterface> = (
  props
) => {
  //state for translateX
  const [translate, setTranslate] = useState(0);
  const { theme } = useContext<CometChatContextType>(CometChatContext);

  const { id, options, children } = props;

  //   const defaultlistItemStyleProps = new ListItemStyle({
  // backgroundColor: theme.palette.getBackgroundColor(),
  // titleColor: theme.palette.getAccent(),
  //   });
  const listItemStyle = {
    ...props.listItemStyle,
  };

  const [swipeRowOptions, setSwipeRowOptions] = useState([]);
  let cancelClick = false;

  useEffect(() => {
    if (options) {
      let rowOptions = options();
      if (rowOptions) setSwipeRowOptions(rowOptions);
    }
  }, []);

  const onLayout = (event: { nativeEvent: { layout: { width: any } } }) => {
    const { width } = event.nativeEvent.layout;
    setTranslate(width);
  };

  const rowOpened = () => {
    cancelClick = true;
  };

  const rowClosed = () => {
    cancelClick = false;
  };

  /**
   * Component to be display the Options in list after swipe
   */
  const OptionsListItem = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() => item.onPress(id)}
        style={[
          Style.rightActionButtonStyle,
          {
            backgroundColor: item?.backgroundColor ?? theme.palette.getError(),
            alignItems: 'center',
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
          {item.title && item.title.length && (
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

  return (
    <SwipeRow
      key={id}
      onRowDidOpen={rowOpened}
      onRowDidClose={rowClosed}
      disableRightSwipe={true}
      disableLeftSwipe={!swipeRowOptions.length}
      rightOpenValue={0 - translate}
    >
      <View
        style={[
          Style.optionStyle,
          {
            height: listItemStyle.height ?? 50,
          },
        ]}
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
      {children}
    </SwipeRow>
  );
};

CometChatSwipeRow.defaultProps = {
  listItemStyle: {},
};
