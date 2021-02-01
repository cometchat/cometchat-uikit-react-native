import React, { useState } from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { CometChatUserPresence, CometChatAvatar } from '../../Shared';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import Icon from 'react-native-vector-icons/MaterialIcons';
import { heightRatio, widthRatio } from '../../../utils/consts';

export default (props) => {
  const [showChangeScope, toggleChange] = useState(false);
  const [scope, setScope] = useState(props.member.scope);
  const updateMemberScope = () => {
    toggleChange(false);
    if (props.member.scope !== scope) {
      props.actionGenerated('changescope', props.member, scope);
    }
  };

  const kickIcon = <Icon name="delete-outline" size={28} />;
  const banIcon = <Icon name="do-not-disturb-alt" size={28} />;
  const doneIcon = (
    <TouchableOpacity
      onPress={() => {
        updateMemberScope();
      }}>
      <Icon name="done" size={28} />
    </TouchableOpacity>
  );
  const scopeIcon = <Icon name="edit" size={26} />;

  const roles = {};
  roles[CometChat.GROUP_MEMBER_SCOPE.ADMIN] = 'Administrator';
  roles[CometChat.GROUP_MEMBER_SCOPE.MODERATOR] = 'Moderator';
  roles[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT] = 'Participant';

  // toggleChangeScope for toggleChange

  // scopechangeHandler for setScope.

  /* toggle tooltip code to be added */

  // let editClassName = false;
  let { name } = props.member;
  let receivedScope = (
    <Text style={{ flex: 1, paddingLeft: 15 * widthRatio }}>{roles[props.member.scope]}</Text>
  );
  let changescope = null;
  let ban = banIcon;
  let kick = kickIcon;

  if (showChangeScope) {
    changescope = (
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'center',
          marginRight: 12 * widthRatio,
        }}>
        <Picker
          style={{ flex: 1 }}
          itemStyle={{ fontSize: 14 }}
          onValueChange={(value) => {
            setScope(value);
          }}
          selectedValue={scope}>
          <Picker.Item
            style={{ height: 20 * heightRatio }}
            value={CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT}
            label={roles[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT]}
          />
          <Picker.Item
            value={CometChat.GROUP_MEMBER_SCOPE.MODERATOR}
            label={roles[CometChat.GROUP_MEMBER_SCOPE.MODERATOR]}
          />
          <Picker.Item
            value={CometChat.GROUP_MEMBER_SCOPE.ADMIN}
            label={roles[CometChat.GROUP_MEMBER_SCOPE.ADMIN]}
          />
        </Picker>
        <View style={{ width: 30, alignItems: 'center', justifyContent: 'center' }}>
          {doneIcon}
        </View>
        {/* {clearIcon} */}
      </View>
    );

    if (
      props.item.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR &&
      props.member.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT
    ) {
      changescope = (
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
            marginRight: 12 * widthRatio,
          }}>
          <Picker
            style={{ flex: 1 }}
            itemStyle={{ fontSize: 14 }}
            onValueChange={(value) => {
              setScope(value);
            }}
            selectedValue={scope}>
            <Picker.Item
              value={CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT}
              label={roles[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT]}
            />
            <Picker.Item
              value={CometChat.GROUP_MEMBER_SCOPE.MODERATOR}
              label={roles[CometChat.GROUP_MEMBER_SCOPE.MODERATOR]}
            />
          </Picker>
          <View style={{ width: 30, alignItems: 'center', justifyContent: 'center' }}>
            {doneIcon}
          </View>
          {/* {clearIcon} */}
        </View>
      );
    }
  } else if (props.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
    changescope = receivedScope;
  } else {
    changescope = (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          marginRight: 12 * widthRatio,
        }}>
        {receivedScope}
        <TouchableOpacity onPress={() => toggleChange(true)}>
          {scopeIcon}
          {scopeIcon ? <Text style={{ fontSize: 10, textAlign: 'center' }}>Edit</Text> : null}
        </TouchableOpacity>
      </View>
    );
  }

  // disable change scope, kick, ban of group owner
  if (props.item.owner === props.member.uid) {
    receivedScope = <Text style={{ flex: 1, paddingLeft: 15 * widthRatio }}>Owner</Text>;
    changescope = receivedScope;
    ban = null;
    kick = null;
  }

   if (props.loggedInUser.uid === props.member.uid) {
     name = 'You';
     changescope = receivedScope;
     ban = null;
     kick = null;
   }

  // if the loggedin user is moderator, don't allow to change scope, ban, kick group moderators or administrators
  if (
    props.item.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR &&
    (props.member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN ||
      props.member.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR)
  ) {
    changescope = receivedScope;
    ban = null;
    kick = null;
  }

  // if the loggedin user is administrator but not group owner, don't allow to change scope, ban, kick group administrators
  if (
    props.item.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN &&
    props.item.owner !== props.loggedInUser.uid &&
    props.member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN
  ) {
    changescope = receivedScope;
    ban = null;
    kick = null;
  }

  let editAccess = null;
  // if the loggedin user is participant, don't show change scope, ban, kick group members
  if (props.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
    editAccess = null;
    // editClassName = 'true';
  } else {
    editAccess = (
      <View
        style={{
          flexDirection: 'row',
          width: 70,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <TouchableOpacity
          onPress={() => {
            props.actionGenerated('ban', props.member);
          }}>
          {ban}
          {ban ? <Text style={{ fontSize: 10, textAlign: 'center' }}>Ban</Text> : null}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            props.actionGenerated('kick', props.member);
          }}>
          {kick}
          {kick ? <Text style={{ fontSize: 10, textAlign: 'center' }}>Kick</Text> : null}
        </TouchableOpacity>
      </View>
    );
    // Object.prototype.hasOwnProperty.call(props, 'widgetsettings')
    if (
      Object.prototype.hasOwnProperty.call(props, 'widgetsettings') &&
      props.widgetsettings &&
      Object.prototype.hasOwnProperty.call(props.widgetsettings, 'main')
    ) {
      // if kick_ban_members is disabled in chatwidget
      if (
        Object.prototype.hasOwnProperty.call(props.widgetsettings.main, 'allow_kick_ban_members') &&
        props.widgetsettings.main.allow_kick_ban_members === false
      ) {
        editAccess = null;
      }

      // if promote_demote_members is disabled in chatwidget
      if (
        Object.prototype.hasOwnProperty.call(
          props.widgetsettings.main,
          'allow_promote_demote_members'
        ) &&
        props.widgetsettings.main.allow_promote_demote_members === false
      ) {
        changescope = receivedScope;
      }
    }
  }
  const userPresence = (
    <CometChatUserPresence
      widgetsettings={props.widgetsettings}
      status={props.member.status}
      cornerRadius={50} // 50%
      borderColor={props.theme.color.darkSecondary}
      borderWidth={1}
    />
  );

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        height: 60 * heightRatio,
        overflow: 'hidden',
        paddingHorizontal: 10,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          maxWidth: 0.4 * Dimensions.get('window').width,
          overflow: 'hidden',
        }}>
        <View
          style={{
            flexWrap: 'wrap',
            flexDirection: 'row',
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(51,153,255,0.25)',
            marginRight: 6 * widthRatio,
          }}>
          <CometChatAvatar
            image={{ uri: props.member.avatar }}
            name={props.member.name}
            cornerRadius={22}
            borderColor={props.theme.color.secondary}
            borderWidth={0}
          />
          {userPresence}
        </View>
        <Text
          numberOfLines={1}
          style={{
            width: 0.2 * Dimensions.get('window').width,
          }}>
          {name}
        </Text>
      </View>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {changescope}

        {editAccess}
      </View>
    </View>
  );
};
