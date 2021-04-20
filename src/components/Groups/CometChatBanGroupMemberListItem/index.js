import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { TouchableOpacity, Text, View, Image } from 'react-native';
import { CometChatUserPresence, CometChatAvatar } from '../../Shared';
import style from './styles';
import theme from '../../../resources/theme';
import unban from './resources/block.png';

export default (props) => {
  const viewTheme = { ...theme, ...props.theme };

  const roles = {};
  roles[CometChat.GROUP_MEMBER_SCOPE.ADMIN] = 'Administrator';
  roles[CometChat.GROUP_MEMBER_SCOPE.MODERATOR] = 'Moderator';
  roles[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT] = 'Participant';
  const { name } = props.member;
  const scope = roles[props.member.scope];
  let showUnBan = true;

  // if the loggedin user is moderator, don't allow unban of banned moderators or administrators
  if (
    props.item.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR &&
    (props.member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN ||
      props.member.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR)
  ) {
    showUnBan = false;
  }

  // if the loggedin user is administrator, don't allow unban of banned administrators
  if (
    props.item.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN &&
    props.member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN
  ) {
    if (props.item.owner !== props.loggedInUser.uid) {
      showUnBan = false;
    }
  }
  return (
    <View
      style={[style.rowStyle, { borderColor: viewTheme.borderColor.primary }]}>
      <View style={[style.nameStyle]}>
        <View style={style.avatarStyle}>
          <CometChatAvatar
            image={{ uri: props.member.avatar }}
            name={props.member.name}
            cornerRadius={22}
            borderColor={props.theme.color.secondary}
            borderWidth={0}
          />
          <CometChatUserPresence
            status={props.member.status}
            cornerRadius={18}
            borderColor={viewTheme.color.white}
            borderWidth={2}
          />
        </View>
        <Text
          numberOfLines={1}
          style={{ fontSize: 16, color: props.theme.color.primary }}>
          {name}
        </Text>
      </View>
      <Text numberOfLines={1} style={style.roleStyle}>
        {scope}
      </Text>
      <View style={{}}>
        {showUnBan ? (
          <TouchableOpacity
            onPress={() => props.actionGenerated('unban', props.member)}
            style={style.imageContainer}>
            <Image source={unban} alt="Unban" style={style.imageStyle} />
            <Text style={style.unbanText}>Unban</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};
