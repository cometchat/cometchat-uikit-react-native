import React, {useContext} from 'react';
import {
  ChatConfigurator,
  CometChatContext,
  CometChatContextType,
  CometChatMessageInformation,
  CometChatMessageTemplate,
} from '@cometchat/chat-uikit-react-native';
import {CometChat} from '@cometchat/chat-sdk-react-native';

const MessageInformation = (props: any) => {
  const {theme} = useContext<CometChatContextType>(CometChatContext);

  let _sender: CometChat.User = new CometChat.User('superhero1');
  _sender.setName('Kevin');
  _sender.setUid('UID233');
  _sender.setAvatar(
    'https://data-us.cometchat.io/assets/images/avatars/spiderman.png',
  );
  _sender.setRole('test');
  _sender.setStatus('online');
  _sender.setStatusMessage('This is now status');

  let _receiver: CometChat.User = new CometChat.User('superhero1');
  _receiver.setName('IronMan');
  _receiver.setUid('superhero1');
  _receiver.setAvatar(
    'https://data-us.cometchat.io/assets/images/avatars/ironman.png',
  );
  _receiver.setRole('test');
  _receiver.setStatus('online');
  _receiver.setStatusMessage('This is now status');

  let _message: CometChat.TextMessage = new CometChat.TextMessage(
    'superhero1',
    "Sorry, I didn't say anything. I was just clearing my throat. How's it going, Spiderman?",
    'user',
  );
  _message.setReadAt(1687112043);
  _message.setSentAt(1687111674);
  _message.setDeliveredAt(1687112043);
  _message.setType('text');
  _message.setReceiver(_receiver);
  _message.setSender(_sender);

  let templates: CometChatMessageTemplate | undefined =
    ChatConfigurator.dataSource.getTextMessageTemplate(theme) ?? undefined;

  return (
    <CometChatMessageInformation
      message={_message}
      template={templates}
      onBack={props.navigation.goBack}
    />
  );
};

export default MessageInformation;
