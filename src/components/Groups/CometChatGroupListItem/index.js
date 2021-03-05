import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { CometChatAvatar } from '../../Shared';
import style from './styles';
import theme from '../../../resources/theme';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import FoundationIcon from 'react-native-vector-icons/Foundation';
import { CometChat } from '@cometchat-pro/react-native-chat';

const CometChatGroupListItem = (props) => {
  const viewTheme = { ...theme, ...props.theme };
  let groupTypeIcon = null;
  if (props.group.type === CometChat.GROUP_TYPE.PRIVATE) {
    groupTypeIcon = (
      <Icon name="lock" size={20} color={viewTheme.color.helpText} />
    );
  } else if (props.group.type === CometChat.GROUP_TYPE.PASSWORD) {
    groupTypeIcon = (
      <FoundationIcon
        name="shield"
        size={22}
        color={viewTheme.color.helpText}
      />
    );
  }

  return (
    <TouchableOpacity
      style={style.listItem}
      onPress={() => props.clickHandler(props.group)}>
      <View style={style.avatarStyle}>
        <CometChatAvatar
          image={{ uri: props.group.icon }}
          cornerRadius={25}
          borderColor={viewTheme.color.secondary}
          borderWidth={0}
          name={props.group.name}
        />
      </View>
      <View
        style={[
          { borderBottomColor: viewTheme.borderColor.primary },
          style.groupDetailsContainer,
        ]}>
        <View style={style.fullFlex}>
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
export default CometChatGroupListItem;
