import React from 'react';
import { Text, View, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import IonIcon from 'react-native-vector-icons/Ionicons';
import MCIIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './styles';
import { validateWidgetSettings } from '../../../utils/common';
import { CometChat } from '@cometchat-pro/react-native-chat';

const actionIconSize = 26;

export default (props) => {
  let threadedChats = (
    <TouchableOpacity
      style={styles.action}
      onPress={() => props.actionGenerated('viewMessageThread', props.message)}>
      <FeatherIcon name="message-circle" size={actionIconSize} />
      <Text style={styles.actionsText}>Start Thread</Text>
    </TouchableOpacity>
  );

  // if threaded messages are disabled in chat widget
  if (
    validateWidgetSettings(props.widgetconfig, 'threaded-chats') === false ||
    validateWidgetSettings(props.widgetsettings, 'enable_threaded_replies') === false ||
    props.message.category === 'custom' ||
    props.message.parentMessageId
  ) {
    threadedChats = null;
  }

  // TODO: Complete this functionality
  // let replyChats = (
  //   <TouchableOpacity
  //     style={styles.action}
  //     onPress={() => props.actionGenerated('viewMessageThread', props.message)}>
  //     <FeatherIcon name="message-circle" size={actionIconSize} />
  //     <Text style={styles.actionsText}>Start Thread</Text>
  //   </TouchableOpacity>
  // );

  // // if threaded messages are disabled in chat widget
  // if (
  //   validateWidgetSettings(props.widgetconfig, 'threaded-chats') === false ||
  //   validateWidgetSettings(props.widgetsettings, 'enable_threaded_replies') === false ||
  //   props.message.category === 'custom' ||
  //   props.message.parentMessageId
  // ) {
  //   replyChats = null;
  // }

  let deleteMessage = (
    <TouchableOpacity
      style={styles.action}
      onPress={() => props.actionGenerated('deleteMessage', props.message)}>
      <IonIcon name="ios-trash-outline" size={actionIconSize} color="red" />
      <Text style={styles.actionsText}>Delete message</Text>
    </TouchableOpacity>
  );

  // if deleting messages are disabled in chat widget
  if (
    validateWidgetSettings(props.widgetsettings, 'enable_deleting_messages') === false ||
    props.message.messageFrom === 'receiver'
  ) {
    deleteMessage = null;
  }

  let editMessage = (
    <TouchableOpacity
      style={styles.action}
      onPress={() => props.actionGenerated('editMessage', props.message)}>
      <MCIIcon name="square-edit-outline" size={actionIconSize} />
      <Text style={styles.actionsText}>Edit message</Text>
    </TouchableOpacity>
  );

  // if editing messages are disabled in chat widget
  if (
    validateWidgetSettings(props.widgetsettings, 'enable_editing_messages') === false ||
    props.message.messageFrom === 'receiver' ||
    props.message.type !== CometChat.MESSAGE_TYPE.TEXT
  ) {
    editMessage = null;
  }

  if (!threadedChats && !editMessage && !deleteMessage) {
    props.actionGenerated('closeMessageActions');
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={() => {}}>
      <View style={styles.actionsContainer}>
        {threadedChats}
        {editMessage}
        {deleteMessage}
      </View>
    </TouchableWithoutFeedback>
  );
};
