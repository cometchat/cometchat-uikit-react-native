import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { CometChatAvatar } from '../../Shared';
import style from './styles';
import theme from '../../../resources/theme';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import FoundationIcon from 'react-native-vector-icons/Foundation';

export default (props) => {
  const ViewTheme = { ...theme, ...props.theme };
  let groupTypeIcon = null;
  if (props.group.type === 'private') {
    groupTypeIcon = <Icon name="lock" size={20} color={ViewTheme.color.helpText} />;
  } else if (props.group.type === 'password') {
    groupTypeIcon = <FoundationIcon name="shield" size={22} color={ViewTheme.color.helpText} />;
  }

  return (
    <TouchableOpacity style={style.listItem} onPress={() => props.clickHandler(props.group)}>
      <View style={style.avatarStyle}>
        <CometChatAvatar
          image={{ uri: props.group.icon }}
          cornerRadius={25}
          borderColor={ViewTheme.color.secondary}
          borderWidth={0}
          name={props.group.name}
        />
      </View>
      <View
        style={[{ borderBottomColor: ViewTheme.borderColor.primary }, style.groupDetailsContainer]}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={style.groupNameStyle}>
            {props.group.name}
          </Text>
          <Text numberOfLines={1} style={style.memberCountStyle}>
            {`${props.group.membersCount} members`}
          </Text>
        </View>
        <View style={style.listItemIcon}>{groupTypeIcon}</View>
      </View>
    </TouchableOpacity>
  );
};
