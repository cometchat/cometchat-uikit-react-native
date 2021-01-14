import React from 'react';
import { Text, View, TouchableHighlight } from 'react-native';
import { CometChatUserPresence, CometChatAvatar } from '../../Shared';

import style from './styles';
import theme from '../../../resources/theme';

export default (props) => {
  const ViewTheme = { ...theme, ...props.theme };

  return (
    <TouchableHighlight
      onPress={() => props.clickeHandler(props.user)}
      underlayColor={ViewTheme.backgroundColor.listUnderlayColor}>
      <View style={style.listItem}>
        <View style={[style.avatarStyle, { borderRadius: 22 }]}>
          <CometChatAvatar
            image={{ uri: props.user.avatar }}
            cornerRadius={22}
            borderColor={ViewTheme.color.secondary}
            borderWidth={0}
            name={props.user.name}
          />
          <CometChatUserPresence
            widgetsettings={props.widgetsettings}
            status={props.user.status}
            cornerRadius={18}
            borderColor={ViewTheme.color.darkSecondary}
            borderWidth={1}
          />
        </View>
        <View
          style={{
            width: '100%',
            //  borderBottomColor: ViewTheme.borderColor.primary,
            //         borderBottomWidth: 1,
            // paddingBottom: 10,
            justifyContent: 'center',
          }}>
          <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '600', maxWidth: '80%' }}>
            {props.user.name}
          </Text>
        </View>
      </View>
    </TouchableHighlight>
  );
};
