import React, { useContext } from 'react';
// @ts-ignore
import { View, Image, Text } from 'react-native';
import { ICONS } from './resources';
import { AvatarStyle, AvatarStyleInterface } from './AvatarStyle';
import { Styles } from './styles';
import { ImageType } from '../../base';
import { CometChatContextType } from '../../base/Types';
import { CometChatContext } from '../../CometChatContext';

/**
 * CometChatAvatar is a component useful for displaying image of user/group
 * This component displays the image or text of user/group
 *
 * @Version 1.0.0
 * @author CometChat
 *
 */

interface CometChatAvatarProps {
  image?: ImageType;
  name: string;
  style?: AvatarStyleInterface;
}

export const CometChatAvatar = (props: CometChatAvatarProps) => {
  const {theme} = useContext<CometChatContextType>(CometChatContext);

  const defaultStyleProps = new AvatarStyle({
    backgroundColor : theme.palette.getAccent400(),
    nameTextColor : theme.palette.getAccent800(),
    nameTextFont : theme.typography.body,
  });
  
  const { image, name } = props;

  const style = {
    ...defaultStyleProps,
    ...props.style,
    border: { ...defaultStyleProps.border, ...props.style?.border },
    nameTextFont: {
      ...defaultStyleProps.nameTextFont,
      ...props.style?.nameTextFont,
    },
    outerView: { ...defaultStyleProps.outerView, ...props.style?.outerView },
  };

  const getImageView = () => {
    if (!image && name) {
      return (
        <Text
          style={[
            Styles.textStyle,
            {
              borderRadius: style.borderRadius,
              color: style.nameTextColor,
            },
            style.nameTextFont ?? {},
          ]}
        >
          {name.length >= 2 ? name.substring(0, 2).toUpperCase() : name}
        </Text>
      );
    } else {
      let imageSource: any;
      if (image) {
        if (typeof image === 'string')
          if ((image as string)?.length > 0) imageSource = { uri: image };
          else imageSource = ICONS.DEFAULT;
        else imageSource = image;
      }
      return (
        <Image
          source={imageSource}
          style={[
            Styles.avatarStyle,
            {
              borderRadius: style.borderRadius,
              backgroundColor: style.backgroundColor,
              borderWidth: style.border?.borderWidth,
            },
          ]}
        />
      );
    }
  };

  return (
    <View
      style={[
        Styles.containerStyle,
        {
          height: style.height,
          width: style.width,
          backgroundColor: style.backgroundColor,
          borderRadius: style.borderRadius,
        },
        style.border ?? {},
      ]}
    >
      <View
        style={[
          Styles.outerViewStyle,
          {
            height: style.height,
            width: style.width,
            borderRadius: style.borderRadius,
            margin: style.outerViewSpacing,
          },
          style.outerView ?? {},
        ]}
      />
      {getImageView()}
    </View>
  );
};

CometChatAvatar.defaultProps = {
  image: '',
  name: '',
  style: new AvatarStyle({}),
};
