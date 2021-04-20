import React from 'react';
import {
  Text,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import IonIcon from 'react-native-vector-icons/Ionicons';
import MCIIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './styles';
import * as actions from '../../../utils/actions';
import * as enums from '../../../utils/enums';
import { CometChat } from '@cometchat-pro/react-native-chat';

const actionIconSize = 26;

export default (props) => {
  let threadedChats = (
    <TouchableOpacity
      style={styles.action}
      onPress={() =>
        props.actionGenerated(actions.VIEW_MESSAGE_THREAD, props.message)
      }>
      <FeatherIcon name="message-circle" size={actionIconSize} />
      <Text style={styles.actionsText}>Start Thread</Text>
    </TouchableOpacity>
  );

  // if threaded messages need to be disabled
  if (
    props.message.category === CometChat.CATEGORY_CUSTOM ||
    props.message.parentMessageId
  ) {
    threadedChats = null;
  }

  let deleteMessage = (
    <TouchableOpacity
      style={styles.action}
      onPress={() =>
        props.actionGenerated(actions.DELETE_MESSAGE, props.message)
      }>
      <IonIcon name="ios-trash-outline" size={actionIconSize} color="red" />
      <Text style={styles.actionsText}>Delete message</Text>
    </TouchableOpacity>
  );

  // if deleting messages need to be disabled
  if (props.message.messageFrom === 'receiver') {
    deleteMessage = null;
  }
  let editMessage = (
    <TouchableOpacity
      style={styles.action}
      onPress={() =>
        props.actionGenerated(actions.EDIT_MESSAGE, props.message)
      }>
      <MCIIcon name="square-edit-outline" size={actionIconSize} />
      <Text style={styles.actionsText}>Edit message</Text>
    </TouchableOpacity>
  );

  // if editing messages need to be disabled
  if (
    props.message.messageFrom === enums.MESSAGE_FROM_RECEIVER ||
    props.message.type !== CometChat.MESSAGE_TYPE.TEXT
  ) {
    editMessage = null;
  }
  if (!threadedChats && !editMessage && !deleteMessage) {
    props.actionGenerated(actions.CLOSE_MESSAGE_ACTIONS);
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
