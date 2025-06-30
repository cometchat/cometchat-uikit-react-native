import React, {useContext} from 'react';
import {CometChatDetails} from '@cometchat/chat-uikit-react-native';
import {UserContext} from '../../../UserContext';
import {CometChat} from '@cometchat/chat-sdk-react-native';

export const GroupDetails = (props: any) => {
  let group: CometChat.Group = new CometChat.Group('supergroup');
  group.setName("Comic Heros' Hangout");
  group.setType('public');
  group.setScope('admin');
  group.setCreatedAt(Date.now());
  group.setMembersCount(8);
  group.setJoinedAt(Date.now() + '');
  group.setHasJoined(true);
  group.setOwner('superhero1');
  group.setUpdatedAt(Date.now());
  group.setIcon(
    'https://data-us.cometchat.io/assets/images/avatars/supergroup.png',
  );

  return (
    <CometChatDetails group={group} onBack={() => props.navigation.goBack()} />
  );
};
