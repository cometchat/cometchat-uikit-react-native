import React, { useState, useContext, useEffect } from 'react';
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
import { CometChatContext } from '../../../utils/CometChatContext';

const actionIconSize = 26;

export default (props) => {
  const [restrictions, setRestrictions] = useState(null);
  const context = useContext(CometChatContext);
  useEffect(() => {
    checkRestrictions();
  }, []);

  const checkRestrictions = async () => {
    let enableEditMessage =
      await context.FeatureRestriction.isEditMessageEnabled();
    let enableThreadedChats =
      await context.FeatureRestriction.isThreadedMessagesEnabled();
    let enableDeleteMessage =
      await context.FeatureRestriction.isDeleteMessageEnabled();
    let enableDeleteMessageForModerator =
      await context.FeatureRestriction.isDeleteMemberMessageEnabled();
    let enableMessageInPrivate =
      await context.FeatureRestriction.isMessageInPrivateEnabled();

    if (
      !enableEditMessage &&
      !enableThreadedChats &&
      !enableDeleteMessage &&
      !enableDeleteMessageForModerator &&
      !enableMessageInPrivate
    ) {
      props.actionGenerated(actions.CLOSE_MESSAGE_ACTIONS);
    }
    setRestrictions({
      enableEditMessage,
      enableThreadedChats,
      enableDeleteMessage,
      enableDeleteMessageForModerator,
      enableMessageInPrivate,
    });
  };

  let sendMessage = null;
  if (
    props.message.messageFrom === enums.MESSAGE_FROM_RECEIVER &&
    props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP &&
    restrictions?.enableMessageInPrivate
  ) {
    sendMessage = (
      <TouchableOpacity
        style={styles.action}
        onPress={() =>
          props.actionGenerated(actions.SEND_MESSAGE, props.message)
        }>
        <FeatherIcon name="message-circle" size={actionIconSize} />
        <Text style={styles.actionsText}>Send Message Privately</Text>
      </TouchableOpacity>
    );
  }
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
    props.message.parentMessageId ||
    !restrictions?.enableThreadedChats
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

  if (
    props.message.messageFrom === enums.MESSAGE_FROM_RECEIVER &&
    (props.type == CometChat.RECEIVER_TYPE.GROUP
      ? props.item.scope == CometChat.GROUP_MEMBER_SCOPE.MODERATOR ||
        props.item.scope == CometChat.GROUP_MEMBER_SCOPE.ADMIN
        ? !restrictions?.enableDeleteMessageForModerator
        : true
      : true)
  ) {
    deleteMessage = null;
  }
  if (
    props.type == CometChat.RECEIVER_TYPE.USER &&
    !restrictions?.enableDeleteMessage
  ) {
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
    props.message.type !== CometChat.MESSAGE_TYPE.TEXT ||
    !restrictions?.enableEditMessage
  ) {
    editMessage = null;
  }

  return (
    <TouchableWithoutFeedback onPress={() => {}}>
      <View style={styles.actionsContainer}>
        {sendMessage}
        {threadedChats}
        {editMessage}
        {deleteMessage}
      </View>
    </TouchableWithoutFeedback>
  );
};
