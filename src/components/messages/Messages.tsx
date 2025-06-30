import React from 'react';
import { CometChatMessages } from '@cometchat/chat-uikit-react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { NavigationProp } from '@react-navigation/native';

interface MessagesProps {
    navigation: NavigationProp<any>;
}

export const Messages = ({navigation}: MessagesProps) => {
  let user: CometChat.User = new CometChat.User();
  user.setUid('superhero1');
  user.setName('Spiderman');
  user.setRole('default');
  user.setStatus('online');
  user.setStatusMessage('This is now status');
  user.setAvatar('https://data-us.cometchat.io/assets/images/avatars/spiderman.png');
  user.setBlockedByMe(false);
  user.setDeactivatedAt(0);
  user.setHasBlockedMe(false);
  user.setLastActiveAt(1686810809);

  return (
    <CometChatMessages
      user={user}
      messageHeaderConfiguration={{
        onBack: () => navigation.goBack(),
      }}
    />
  );
};
