import React from 'react'
import { CometChatDetails } from '@cometchat/chat-uikit-react-native'
import { CometChat } from '@cometchat/chat-sdk-react-native'

export const Details = (props: any) => {

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
        <CometChatDetails user={user} onBack={() => props.navigation.goBack()} />
    )
}