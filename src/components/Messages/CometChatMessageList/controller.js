import { CometChat } from '@cometchat-pro/react-native-chat';

import * as enums from '../../../utils/enums';
import MessageFilter from './MessageFilter';

export class MessageListManager {
  item = {};

  type = '';

  parentMessageId = null;

  messageRequest = null;

  limit = 30;

  categories = [
    CometChat.CATEGORY_MESSAGE,
    CometChat.CATEGORY_CUSTOM,
    CometChat.CATEGORY_ACTION,
    CometChat.CATEGORY_CALL,
  ];

  types = [
    CometChat.MESSAGE_TYPE.TEXT,
    CometChat.MESSAGE_TYPE.IMAGE,
    CometChat.MESSAGE_TYPE.VIDEO,
    CometChat.MESSAGE_TYPE.AUDIO,
    CometChat.MESSAGE_TYPE.FILE,
    enums.CUSTOM_TYPE_POLL,
    enums.CUSTOM_TYPE_STICKER,
    enums.ACTION_TYPE_GROUPMEMBER,
    CometChat.CALL_TYPE.AUDIO,
    CometChat.CALL_TYPE.VIDEO,
  ];

  msgListenerId = `message_${new Date().getTime()}`;

  groupListenerId = `group_${new Date().getTime()}`;

  callListenerId = `call_${new Date().getTime()}`;

  constructor(item, type, parentMessageId) {
    this.item = item;
    this.type = type;
    this.parentMessageId = parentMessageId;

    const messageFilterManager = new MessageFilter();
    const categories = messageFilterManager.getCategories();
    const types = messageFilterManager.getTypes();

    if (type === CometChat.RECEIVER_TYPE.USER) {
      if (this.parentMessageId) {
        this.messageRequest = new CometChat.MessagesRequestBuilder()
          .setUID(item.uid)
          .setParentMessageId(this.parentMessageId)
          .setCategories(categories)
          .setTypes(types)
          .setLimit(this.limit)
          .build();
      } else {
        this.messageRequest = new CometChat.MessagesRequestBuilder()
          .setUID(item.uid)
          .setCategories(categories)
          .setTypes(types)
          .hideReplies(true)
          .setLimit(this.limit)
          .build();
      }
    } else if (type === CometChat.RECEIVER_TYPE.GROUP) {
      if (this.parentMessageId) {
        this.messageRequest = new CometChat.MessagesRequestBuilder()
          .setGUID(item.guid)
          .setParentMessageId(this.parentMessageId)
          .setCategories(categories)
          .setTypes(types)
          .setLimit(this.limit)
          .build();
      } else {
        this.messageRequest = new CometChat.MessagesRequestBuilder()
          .setGUID(item.guid)
          .setCategories(categories)
          .setTypes(types)
          .hideReplies(true)
          .setLimit(this.limit)
          .build();
      }
    }
  }

  fetchPreviousMessages() {
    return this.messageRequest.fetchPrevious();
  }

  attachListeners(callback) {
    CometChat.addMessageListener(
      this.msgListenerId,
      new CometChat.MessageListener({
        onTextMessageReceived: (textMessage) => {
          callback(enums.TEXT_MESSAGE_RECEIVED, textMessage);
        },
        onMediaMessageReceived: (mediaMessage) => {
          callback(enums.MEDIA_MESSAGE_RECEIVED, mediaMessage);
        },
        onCustomMessageReceived: (customMessage) => {
          callback(enums.CUSTOM_MESSAGE_RECEIVED, customMessage);
        },
        onMessagesDelivered: (messageReceipt) => {
          callback(enums.MESSAGE_DELIVERED, messageReceipt);
        },
        onMessagesRead: (messageReceipt) => {
          callback(enums.MESSAGE_READ, messageReceipt);
        },
        onMessageDeleted: (deletedMessage) => {
          callback(enums.MESSAGE_DELETED, deletedMessage);
        },
        onMessageEdited: (editedMessage) => {
          callback(enums.MESSAGE_EDITED, editedMessage);
        },
      }),
    );

    CometChat.addGroupListener(
      this.groupListenerId,
      new CometChat.GroupListener({
        onGroupMemberScopeChanged: (
          message,
          changedUser,
          newScope,
          oldScope,
          changedGroup,
        ) => {
          callback(enums.GROUP_MEMBER_SCOPE_CHANGED, message, changedGroup, {
            user: changedUser,
            scope: newScope,
          });
        },
        onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
          callback(
            enums.GROUP_MEMBER_KICKED,
            message,
            kickedFrom,
            {
              user: kickedUser,
              hasJoined: false,
            },
            kickedBy,
          );
        },
        onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
          callback(
            enums.GROUP_MEMBER_BANNED,
            message,
            bannedFrom,
            { user: bannedUser },
            bannedBy,
          );
        },
        onGroupMemberUnbanned: (
          message,
          unbannedUser,
          unbannedBy,
          unbannedFrom,
        ) => {
          callback(
            enums.GROUP_MEMBER_UNBANNED,
            message,
            unbannedFrom,
            { user: unbannedUser },
            unbannedBy,
          );
        },
        onMemberAddedToGroup: (
          message,
          userAdded,
          userAddedBy,
          userAddedIn,
        ) => {
          callback(
            enums.GROUP_MEMBER_ADDED,
            message,
            userAddedIn,
            {
              user: userAdded,
              hasJoined: true,
            },
            userAddedBy,
          );
        },
        onGroupMemberLeft: (message, leavingUser, group) => {
          callback(enums.GROUP_MEMBER_LEFT, message, group, {
            user: leavingUser,
          });
        },
        onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
          callback(enums.GROUP_MEMBER_JOINED, message, joinedGroup, {
            user: joinedUser,
          });
        },
      }),
    );

    CometChat.addCallListener(
      this.callListenerId,
      new CometChat.CallListener({
        onIncomingCallReceived: (call) => {
          callback(enums.INCOMING_CALL_RECEIVED, call);
        },
        onIncomingCallCancelled: (call) => {
          callback(enums.INCOMING_CALL_CANCELLED, call);
        },
        onOutgoingCallAccepted: (call) => {
          callback(enums.OUTGOING_CALL_ACCEPTED, call);
        },
        onOutgoingCallRejected: (call) => {
          callback(enums.OUTGOING_CALL_REJECTED, call);
        },
      }),
    );
  }

  removeListeners() {
    CometChat.removeMessageListener(this.msgListenerId);
    CometChat.removeGroupListener(this.groupListenerId);
    CometChat.removeCallListener(this.callListenerId);
  }
}
