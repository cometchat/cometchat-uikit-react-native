import React from 'react';
import {View} from 'react-native';
import {AppStyle} from '../../AppStyle';
import {CometChatMessageHeader} from '@cometchat/chat-uikit-react-native';
import {CometChat} from '@cometchat/chat-sdk-react-native';

export const MessageHeader = (props: any) => {
  let user: CometChat.User = new CometChat.User('superhero1');
  user.setName('Spiderman');
  user.setUid('superhero1');
  user.setAvatar(
    'https://data-us.cometchat.io/assets/images/avatars/spiderman.png',
  );
  user.setRole('test');
  user.setStatus('role');
  user.setStatusMessage('This is now status');
  user.setHasBlockedMe(false);
  user.setDeactivatedAt(0);
  user.setBlockedByMe(false);
  user.setLastActiveAt(1686810809);

  return (
    <View style={[AppStyle.container, {justifyContent: 'center'}]}>
      <CometChatMessageHeader
        user={user}
        onBack={() => props.navigation.goBack()}
      />
    </View>
  );
};
