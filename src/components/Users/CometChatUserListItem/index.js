import React from 'react';
import { Text, View, TouchableHighlight } from 'react-native';
import { CometChatUserPresence, CometChatAvatar } from '../../Shared';

import style from './styles';
import theme from '../../../resources/theme';

const CometChatUserListItem = (props) => {
  const viewTheme = { ...theme, ...props.theme };

  return (
    <TouchableHighlight
      onPress={() => props.clickHandler(props.user)}
      underlayColor={viewTheme.backgroundColor.listUnderlayColor}>
      <View style={style.listItem}>
        <View style={[style.avatarStyle, { borderRadius: 22 }]}>
          <CometChatAvatar
            image={{ uri: props.user.avatar }}
            cornerRadius={22}
            borderColor={viewTheme.color.secondary}
            borderWidth={0}
            name={props.user.name}
          />
          <CometChatUserPresence
            status={props.user.status}
            cornerRadius={18}
            borderColor={viewTheme.color.darkSecondary}
            borderWidth={1}
          />
        </View>
        <View style={style.userNameStyle}>
          <Text numberOfLines={1} style={style.userNameText}>
            {props.user.name}
          </Text>
        </View>
      </View>
    </TouchableHighlight>
  );
};

export default CometChatUserListItem;
