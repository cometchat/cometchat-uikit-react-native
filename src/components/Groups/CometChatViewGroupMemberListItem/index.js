import React, { useState } from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { CometChatUserPresence, CometChatAvatar } from '../../Shared';
import { View, Text, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import Icon from 'react-native-vector-icons/MaterialIcons';
import * as actions from '../../../utils/actions';
import style from './style';

export default (props) => {
  const [showChangeScope, toggleChange] = useState(false);
  const [scope, setScope] = useState(props.member.scope);

  /**
   * Update member scope
   * @param
   */
  const updateMemberScope = () => {
    toggleChange(false);
    if (props.member.scope !== scope) {
      props.actionGenerated(actions.CHANGE_SCOPE, props.member, scope);
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

  // scope changeHandler for setScope.

  let { name } = props.member;
  let receivedScope = (
    <Text style={style.memberScopeText}>{roles[props.member.scope]}</Text>
  );
  let changeScope = null;
  let ban = banIcon;
  let kick = kickIcon;

  if (showChangeScope) {
    changeScope = (
      <View style={style.changeScopeContainer}>
        <Picker
          style={style.fullFlex}
          itemStyle={style.pickerItemStyle}
          onValueChange={(value) => {
            setScope(value);
          }}
          selectedValue={scope}>
          <Picker.Item
            style={style.picketItemDetail}
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
        <View style={style.doneContainer}>{doneIcon}</View>
      </View>
    );

    if (
      props.item.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR &&
      props.member.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT
    ) {
      changeScope = (
        <View style={style.changeScopeContainer}>
          <Picker
            style={style.fullFlex}
            itemStyle={style.pickerItemStyle}
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
          <View style={style.doneContainer}>{doneIcon}</View>
        </View>
      );
    }
  } else if (props.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
    changeScope = receivedScope;
  } else {
    changeScope = (
      <View style={style.changeScopeContainer2}>
        {receivedScope}
        <TouchableOpacity onPress={() => toggleChange(true)}>
          {scopeIcon}
          {scopeIcon ? <Text style={style.editText}>Edit</Text> : null}
        </TouchableOpacity>
      </View>
    );
  }

  // disable change scope, kick, ban of group owner
  if (props.item.owner === props.member.uid) {
    receivedScope = <Text style={style.ownerText}>Owner</Text>;
    changeScope = receivedScope;
    ban = null;
    kick = null;
  }

  if (props.loggedInUser.uid === props.member.uid) {
    name = 'You';
    changeScope = receivedScope;
    ban = null;
    kick = null;
  }

  // if the logged in user is moderator, don't allow to change scope, ban, kick group moderators or administrators
  if (
    props.item.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR &&
    (props.member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN ||
      props.member.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR)
  ) {
    changeScope = receivedScope;
    ban = null;
    kick = null;
  }

  // if the logged in user is administrator but not group owner, don't allow to change scope, ban, kick group administrators
  if (
    props.item.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN &&
    props.item.owner !== props.loggedInUser.uid &&
    props.member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN
  ) {
    changeScope = receivedScope;
    ban = null;
    kick = null;
  }

  let editAccess = null;
  // if the logged in user is participant, don't show change scope, ban, kick group members
  if (props.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
    editAccess = null;
  } else {
    editAccess = (
      <View style={style.editAccessContainer}>
        <TouchableOpacity
          onPress={() => {
            props.actionGenerated(actions.BAN, props.member);
          }}>
          {ban}
          {ban ? <Text style={style.actionText}>Ban</Text> : null}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            props.actionGenerated(actions.KICK, props.member);
          }}>
          {kick}
          {kick ? <Text style={style.actionText}>Kick</Text> : null}
        </TouchableOpacity>
      </View>
    );
  }
  const userPresence = (
    <CometChatUserPresence
      status={props.member.status}
      cornerRadius={50}
      borderColor={'#fff'}
      borderWidth={2}
    />
  );

  return (
    <View style={style.container}>
      <View style={style.innerContainer}>
        <View style={style.avatarContainer}>
          <CometChatAvatar
            image={{ uri: props.member.avatar }}
            name={props.member.name}
            cornerRadius={22}
            borderColor={props.theme.color.secondary}
            borderWidth={0}
          />
          {userPresence}
        </View>
        <Text numberOfLines={1} style={style.nameText}>
          {name}
        </Text>
      </View>
      <View style={style.changeContainer}>
        {changeScope}
        {editAccess}
      </View>
    </View>
  );
};
