import React, { useContext } from 'react'
import { View, Text } from 'react-native'
import { ImageType } from '../../base'
import { CometChatCardStyle, CometChatCardStyleInterface } from './CometChatCardStyle'
import { CometChatContext } from '../../CometChatContext'
import { AvatarStyleInterface, CometChatAvatar } from '../CometChatAvatar'
import { Style } from './style'

export interface CometChatCardInterface {
  id?: string,
  avatarUrl?: ImageType,
  avatarName?: string,
  title?: string,
  SubtitleView?: () => JSX.Element,
  BottomView?: () => JSX.Element,
  style?: CometChatCardStyleInterface,
  avatarStyle?: AvatarStyleInterface,
}

export const CometChatCard = (props: CometChatCardInterface) => {
  const {
    BottomView,
    SubtitleView,
    avatarName,
    avatarUrl,
    id,
    style,
    title,
    avatarStyle
  } = props;

  const { theme } = useContext(CometChatContext);

  const {
    backgroundColor,
    border,
    borderRadius,
    height,
    titleColor,
    titleFont,
    width,
  } = new CometChatCardStyle({
    backgroundColor: theme.palette.getBackgroundColor(),
    titleColor: theme.palette.getAccent(),
    titleFont: theme.typography.heading,
    ...style
  });

  return (
    <View key={id} style={[
      Style.container,
      { height, width, backgroundColor, borderRadius, paddingBottom: 32 },
      border
    ]}>
      <View style={{alignItems: "center"}}>
        <Text style={[{ color: titleColor, marginBottom: 8 }, titleFont]}>{title}</Text>
        {
          SubtitleView && <SubtitleView />
        }
      </View>
      <CometChatAvatar
        image={avatarUrl}
        name={avatarName}
        style={{
          height: 300,
          width: 300,
          borderRadius: 150,
          nameTextFont: {fontSize: 48},
          ...avatarStyle
        }}
      />
      {
        BottomView && <BottomView />
      }
    </View>
  )
}