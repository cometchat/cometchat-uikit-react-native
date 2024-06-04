import React from 'react';
// @ts-ignore
import { Image, View, StyleProp, ViewStyle } from 'react-native';
import { Styles } from './styles';
import { StatusIndicatorStyle } from './StatusIndicatorStyle';
import { ImageType } from '../../base';

/**
 *
 * CometChatStatusIndicator is a component useful for indicating the status of user/group
 * This component displays the online/offline status of user/group
 *
 * @Version 1.0.0
 * @author CometChat
 *
 */
export interface CometChatStatusIndicatorInterface {
  backgroundImage?: ImageType;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
}

export const CometChatStatusIndicator = (
  props: CometChatStatusIndicatorInterface
) => {
  const { backgroundImage, backgroundColor } = props;

  const defaultStyleProps = new StatusIndicatorStyle({});
  const style = {
    ...defaultStyleProps,
    ...(props.style as object),
    ...(backgroundColor ? { backgroundColor } : {}),
  };

  const getView = () => {
    if (backgroundImage) {
      let source: any;
      if (typeof backgroundImage === 'string')
        source = { uri: backgroundImage };
      else source = backgroundImage;
      return (
        <View style={[Styles.getStyle, style]}>
          <Image
            style={[
              Styles.imageStyles,
              {
                height: style?.height,
                width: style?.width,
              },
            ]}
            source={source}
          />
        </View>
      );
    } else return <View style={[Styles.getStyle, style]} />;
  };

  return getView();
};

CometChatStatusIndicator.defaultProps = {
  backgroundImage: '',
  style: new StatusIndicatorStyle({}),
};
