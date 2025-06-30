import React from 'react';
import {CometChatBannedMembers} from '@cometchat/chat-uikit-react-native';
import {CometChat} from '@cometchat/chat-sdk-react-native';

export const BannedMembers = (props: any) => {
  let group: CometChat.Group = new CometChat.Group('123456');
  group.setName('test group');
  group.setType('public');
  group.setScope('admin');
  group.setCreatedAt(Date.now());
  group.setMembersCount(4);
  group.setJoinedAt(Date.now() + '');
  group.setHasJoined(true);
  group.setOwner('app_system');
  group.setUpdatedAt(Date.now());

  return (
    <CometChatBannedMembers
      group={group}
      onBack={() => props.navigation.goBack()}
    />
  );
};
