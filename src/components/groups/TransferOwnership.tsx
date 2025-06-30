import React from 'react'
import { CometChatTransferOwnership } from '@cometchat/chat-uikit-react-native'
import { CometChat } from '@cometchat/chat-sdk-react-native'

export const TransferOwnership = (props: any) => {

  let group: CometChat.Group = new CometChat.Group('supergroup_123456');
  group.setName("Comic Heros' Hangout");
  group.setType('public');
  group.setScope('admin');
  group.setCreatedAt(Date.now());
  group.setMembersCount(8);
  group.setJoinedAt(Date.now() + '');
  group.setHasJoined(true);
  group.setOwner('app_system');
  group.setUpdatedAt(Date.now());
  group.setIcon(
    'https://data-us.cometchat.io/assets/images/avatars/supergroup.png',
  );

  return <CometChatTransferOwnership
    group={group}
    onBack={() => props.navigation.goBack()}
  />
}
