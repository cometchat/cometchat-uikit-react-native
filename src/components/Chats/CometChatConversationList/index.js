/* eslint-disable no-param-reassign */
/* eslint-disable react/no-did-update-set-state */
/* eslint-disable radix */
import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { CometChatManager } from '../../../utils/controller';
import { ConversationListManager } from './controller';
import * as enums from '../../../utils/enums';
import { CometChatConversationListItem } from '../index';
import theme from '../../../resources/theme';
import styles from './styles';
import Sound from 'react-native-sound';
import DropDownAlert from '../../Shared/DropDownAlert';
import { incomingOtherMessageAlert } from '../../../resources/audio';
import {
  View,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { logger } from '../../../utils/common';

class CometChatConversationList extends React.Component {
  loggedInUser = null;

  decoratorMessage = 'Loading...';

  constructor(props) {
    super(props);

    this.state = {
      conversationList: [],
      selectedConversation: undefined,
      showSmallHeader: false,
    };
    this.chatListRef = React.createRef();
    this.theme = { ...theme, ...this.props.theme };
    this.audio = new Sound(incomingOtherMessageAlert);
  }

  componentDidMount() {
    try {
      this.navListener = this.props.navigation.addListener('focus', () => {
        this.decoratorMessage = 'Loading...';
        if (this.ConversationListManager) {
          this.ConversationListManager.removeListeners();
        }
        this.setState({ conversationList: [] });
        this.ConversationListManager = new ConversationListManager();
        this.getConversations();
        this.ConversationListManager.attachListeners(this.conversationUpdated);
      });
    } catch (error) {
      logger(error);
    }
  }

  componentDidUpdate(prevProps) {
    try {
      const previousItem = JSON.stringify(prevProps.item);
      const currentItem = JSON.stringify(this.props.item);

      // if different conversation is selected
      if (previousItem !== currentItem) {
        if (Object.keys(this.props.item).length === 0) {
          this.chatListRef.scrollTop = 0;
          this.setState({ selectedConversation: {} });
        } else {
          const conversationList = [...this.state.conversationList];
          const conversationObj = conversationList.find((c) => {
            if (
              (c.conversationType === this.props.type &&
                this.props.type === 'user' &&
                c.conversationWith.uid === this.props.item.uid) ||
              (c.conversationType === this.props.type &&
                this.props.type === CometChat.ACTION_TYPE.TYPE_GROUP &&
                c.conversationWith.guid === this.props.item.guid)
            ) {
              return c;
            }

            return false;
          });

          if (conversationObj) {
            const conversationKey = conversationList.indexOf(conversationObj);
            const newConversationObj = {
              ...conversationObj,
              unreadMessageCount: 0,
            };

            conversationList.splice(conversationKey, 1, newConversationObj);
            this.setState({
              conversationList,
              selectedConversation: newConversationObj,
            });
          }
        }
      }

      // if user is blocked/unblocked, update conversationList in state
      if (
        prevProps.item &&
        Object.keys(prevProps.item).length &&
        prevProps.item.uid === this.props.item.uid &&
        prevProps.item.blockedByMe !== this.props.item.blockedByMe
      ) {
        const conversationList = [...this.state.conversationList];

        // search for user
        const convKey = conversationList.findIndex(
          (c) =>
            c.conversationType === 'user' &&
            c.conversationWith.uid === this.props.item.uid,
        );
        if (convKey > -1) {
          conversationList.splice(convKey, 1);

          this.setState({ conversationList });
        }
      }

      if (
        prevProps.groupToUpdate &&
        (prevProps.groupToUpdate.guid !== this.props.groupToUpdate.guid ||
          (prevProps.groupToUpdate.guid === this.props.groupToUpdate.guid &&
            (prevProps.groupToUpdate.membersCount !==
              this.props.groupToUpdate.membersCount ||
              prevProps.groupToUpdate.scope !==
                this.props.groupToUpdate.scope)))
      ) {
        const conversationList = [...this.state.conversationList];
        const { groupToUpdate } = this.props;

        const convKey = conversationList.findIndex(
          (c) =>
            c.conversationType === 'group' &&
            c.conversationWith.guid === groupToUpdate.guid,
        );
        if (convKey > -1) {
          const convObj = conversationList[convKey];

          const convWithObj = { ...convObj.conversationWith };

          const newConvWithObj = {
            ...convWithObj,
            scope: groupToUpdate.scope,
            membersCount: groupToUpdate.membersCount,
          };
          const newConvObj = { ...convObj, conversationWith: newConvWithObj };

          conversationList.splice(convKey, 1, newConvObj);
          this.setState({ conversationList });
        }
      }

      if (prevProps.messageToMarkRead !== this.props.messageToMarkRead) {
        const message = this.props.messageToMarkRead;
        this.makeConversation(message)
          .then((response) => {
            const {
              conversationKey,
              conversationObj,
              conversationList,
            } = response;

            if (conversationKey > -1) {
              const unreadMessageCount = this.makeUnreadMessageCount(
                conversationObj,
                'decrement',
              );
              const lastMessageObj = this.makeLastMessage(
                message,
                conversationObj,
              );

              const newConversationObj = {
                ...conversationObj,
                lastMessage: lastMessageObj,
                unreadMessageCount,
              };
              conversationList.splice(conversationKey, 1);
              conversationList.unshift(newConversationObj);
              this.setState({ conversationList: conversationList });
            }
          })
          .catch((error) => {
            const errorCode = error?.message || 'ERROR';
            this.dropDownAlertRef?.showMessage('error', errorCode);
            logger(
              'This is an error in converting message to conversation',
              error,
            );
          });
      }

      if (prevProps.lastMessage !== this.props.lastMessage) {
        const { lastMessage } = this.props;
        const conversationList = [...this.state.conversationList];
        const conversationKey = conversationList.findIndex(
          (c) => c.conversationId === lastMessage.conversationId,
        );

        if (conversationKey > -1) {
          const conversationObj = conversationList[conversationKey];
          const newConversationObj = { ...conversationObj, lastMessage };

          conversationList.splice(conversationKey, 1);
          conversationList.unshift(newConversationObj);
          this.setState({ conversationList: conversationList });
        }
      }

      if (
        prevProps.groupToDelete &&
        prevProps.groupToDelete.guid !== this.props.groupToDelete.guid
      ) {
        let conversationList = [...this.state.conversationList];
        const groupKey = conversationList.findIndex(
          (member) =>
            member.conversationWith.guid === this.props.groupToDelete.guid,
        );
        if (groupKey > -1) {
          conversationList.splice(groupKey, 1);
          this.setState({ conversationList: conversationList });
          if (conversationList.length === 0) {
            this.decoratorMessage = 'No chats found';
          }
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  componentWillUnmount() {
    try {
      if (this.ConversationListManager) {
        this.ConversationListManager.removeListeners();
      }
      this.ConversationListManager = null;
      if (this.navListener) this.navListener();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Handles live updates from server using listeners
   * @param key:action
   * @param item:object related to Users
   * @param message:object related to Messages
   * @param options: extra data
   * @param actionBy: user object of action taker
   */
  conversationUpdated = (key, item, message, options, actionBy) => {
    try {
      switch (key) {
        case enums.USER_ONLINE:
        case enums.USER_OFFLINE:
          this.updateUser(item);
          break;
        case enums.TEXT_MESSAGE_RECEIVED:
        case enums.MEDIA_MESSAGE_RECEIVED:
        case enums.CUSTOM_MESSAGE_RECEIVED:
          this.updateConversation(message);
          break;
        case enums.MESSAGE_EDITED:
        case enums.MESSAGE_DELETED:
          this.conversationEditedDeleted(message);
          break;
        case enums.INCOMING_CALL_RECEIVED:
        case enums.INCOMING_CALL_CANCELLED:
          this.updateConversation(message, false);
          break;
        case enums.GROUP_MEMBER_ADDED:
          if (this.loggedInUser.uid !== actionBy.uid)
            this.updateGroupMemberAdded(message, options);
          break;
        case enums.GROUP_MEMBER_KICKED:
        case enums.GROUP_MEMBER_BANNED:
        case enums.GROUP_MEMBER_LEFT:
          this.updateGroupMemberRemoved(message, options);
          break;
        case enums.GROUP_MEMBER_SCOPE_CHANGED:
          this.updateGroupMemberScopeChanged(message, options);
          break;
        case enums.GROUP_MEMBER_JOINED:
          this.updateGroupMemberChanged(message, options, 'increment');
          break;
        case enums.GROUP_MEMBER_UNBANNED:
          this.updateGroupMemberChanged(message, options, '');
          break;
        default:
          break;
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handle update user details in existing conversation object
   * @param user:User Object
   */
  updateUser = (user) => {
    try {
      const conversationList = [...this.state.conversationList];
      const conversationKey = conversationList.findIndex(
        (conversationObj) =>
          conversationObj.conversationType === 'user' &&
          conversationObj.conversationWith.uid === user.uid,
      );

      if (conversationKey > -1) {
        const conversationObj = { ...conversationList[conversationKey] };
        const conversationWithObj = {
          ...conversationObj.conversationWith,
          status: user.getStatus(),
        };

        const newConversationObj = {
          ...conversationObj,
          conversationWith: conversationWithObj,
        };
        conversationList.splice(conversationKey, 1, newConversationObj);
        this.setState({ conversationList });
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Play audio alert
   * @param
   */
  playAudio = () => {
    try {
      if (this.state.playingAudio) {
        return false;
      }
      this.setState({ playingAudio: true }, () => {
        this.audio.setCurrentTime(0);
        this.audio.play(() => {
          this.setState({ playingAudio: false });
        });
      });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Retrieve conversation object from message
   * @param message : message object
   */
  makeConversation = (message) => {
    const promise = new Promise((resolve, reject) => {
      CometChat.CometChatHelper.getConversationFromMessage(message)
        .then((conversation) => {
          const conversationList = [...this.state.conversationList];
          const conversationKey = conversationList.findIndex(
            (c) => c.conversationId === conversation.conversationId,
          );
          let conversationObj = { ...conversation };
          if (conversationKey > -1) {
            conversationObj = { ...conversationList[conversationKey] };
          }

          resolve({
            conversationKey,
            conversationObj,
            conversationList,
          });
        })
        .catch((error) => reject(error));
    });

    return promise;
  };

  /**
   * Retrieve unread message count from conversation
   * @param conversation : conversation object
   * @param operator : extra option to handle decrease in unread message count
   */
  makeUnreadMessageCount = (conversation = {}, operator) => {
    try {
      if (Object.keys(conversation).length === 0) {
        return 1;
      }

      let unreadMessageCount = parseInt(conversation.unreadMessageCount);
      if (operator && operator === 'decrement') {
        unreadMessageCount = unreadMessageCount ? unreadMessageCount - 1 : 0;
      } else {
        unreadMessageCount += 1;
      }

      return unreadMessageCount;
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Retrieve message data
   * @param
   */
  makeLastMessage = (message) => {
    const newMessage = { ...message };
    return newMessage;
  };

  /**
   * Handle updating conversation object on any message
   * @param message: message object
   * @param notification: boolean to play audio alert @default : true
   */
  updateConversation = (message, notification = true) => {
    this.makeConversation(message)
      .then((response) => {
        const { conversationKey, conversationObj, conversationList } = response;

        if (conversationKey > -1) {
          const unreadMessageCount = this.makeUnreadMessageCount(
            conversationList[conversationKey],
          );
          const lastMessageObj = this.makeLastMessage(message, conversationObj);

          const newConversationObj = {
            ...conversationObj,
            lastMessage: lastMessageObj,
            unreadMessageCount,
          };
          conversationList.splice(conversationKey, 1);
          conversationList.unshift(newConversationObj);
          this.setState({ conversationList: conversationList });

          if (notification) {
            this.playAudio(message);
          }
        } else {
          const unreadMessageCount = this.makeUnreadMessageCount();
          const lastMessageObj = this.makeLastMessage(message);

          const newConversationObj = {
            ...conversationObj,
            lastMessage: lastMessageObj,
            unreadMessageCount,
          };
          conversationList.unshift(newConversationObj);
          this.setState({ conversationList: conversationList });

          if (notification) {
            this.playAudio(message);
          }
        }
      })
      .catch((error) => {
        logger('This is an error in converting message to conversation', error);
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
      });
  };

  /**
   * Handle editing/deleting conversation object
   * @param message: message object
   */
  conversationEditedDeleted = (message) => {
    this.makeConversation(message)
      .then((response) => {
        const { conversationKey, conversationObj, conversationList } = response;

        if (conversationKey > -1) {
          const lastMessageObj = conversationObj.lastMessage;

          if (lastMessageObj.id === message.id) {
            const newLastMessageObj = { ...lastMessageObj, ...message };
            const newConversationObj = {
              ...conversationObj,
              lastMessage: newLastMessageObj,
            };
            conversationList.splice(conversationKey, 1, newConversationObj);
            this.setState({ conversationList: conversationList });
          }
        }
      })
      .catch((error) => {
        logger('This is an error in converting message to conversation', error);
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
      });
  };

  /**
   * Handle updating group member in existing conversation objects
   * @param message: message object
   * @param options: contains user object for user added to group
   */
  updateGroupMemberAdded = (message, options) => {
    this.makeConversation(message)
      .then((response) => {
        const { conversationKey, conversationObj, conversationList } = response;

        if (conversationKey > -1) {
          const unreadMessageCount = this.makeUnreadMessageCount(
            conversationObj,
          );
          const lastMessageObj = this.makeLastMessage(message, conversationObj);

          const conversationWithObj = { ...conversationObj.conversationWith };
          const membersCount = parseInt(conversationWithObj.membersCount) + 1;
          const newConversationWithObj = {
            ...conversationWithObj,
            membersCount,
          };

          const newConversationObj = {
            ...conversationObj,
            conversationWith: newConversationWithObj,
            lastMessage: lastMessageObj,
            unreadMessageCount,
          };
          conversationList.splice(conversationKey, 1);
          conversationList.unshift(newConversationObj);
          this.setState({ conversationList: conversationList });
          this.playAudio(message);
        } else if (options && this.loggedInUser.uid === options.user.uid) {
          const unreadMessageCount = this.makeUnreadMessageCount();
          const lastMessageObj = this.makeLastMessage(message);

          const conversationWithObj = { ...conversationObj.conversationWith };
          const membersCount = parseInt(conversationWithObj.membersCount) + 1;
          const scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
          const { hasJoined } = options;

          const newConversationWithObj = {
            ...conversationWithObj,
            membersCount,
            scope,
            hasJoined,
          };
          const newConversationObj = {
            ...conversationObj,
            conversationWith: newConversationWithObj,
            lastMessage: lastMessageObj,
            unreadMessageCount,
          };
          conversationList.unshift(newConversationObj);
          this.setState({ conversationList: conversationList });
          this.playAudio(message);
        }
      })
      .catch((error) => {
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
        logger('This is an error in converting message to conversation', error);
      });
  };

  /**
   * Handle removing group member in existing conversation objects
   * @param message: message object
   * @param options: contains user object for user removed from group
   */
  updateGroupMemberRemoved = (message, options) => {
    this.makeConversation(message)
      .then((response) => {
        const { conversationKey, conversationObj, conversationList } = response;

        if (conversationKey > -1) {
          if (options && this.loggedInUser.uid === options.user.uid) {
            conversationList.splice(conversationKey, 1);
            this.setState({ conversationList: conversationList });
          } else {
            const unreadMessageCount = this.makeUnreadMessageCount(
              conversationObj,
            );
            const lastMessageObj = this.makeLastMessage(
              message,
              conversationObj,
            );

            const conversationWithObj = { ...conversationObj.conversationWith };
            const membersCount = parseInt(conversationWithObj.membersCount) - 1;
            const newConversationWithObj = {
              ...conversationWithObj,
              membersCount,
            };

            const newConversationObj = {
              ...conversationObj,
              conversationWith: newConversationWithObj,
              lastMessage: lastMessageObj,
              unreadMessageCount,
            };
            conversationList.splice(conversationKey, 1);
            conversationList.unshift(newConversationObj);
            this.setState({ conversationList: conversationList });
            this.playAudio(message);
          }
        }
      })
      .catch((error) => {
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
        logger('This is an error in converting message to conversation', error);
      });
  };

  /**
   * Handle updating group member scope in existing conversation objects
   * @param message: message object
   * @param options: contains user object for user whose scope is changed to group
   */
  updateGroupMemberScopeChanged = (message, options) => {
    this.makeConversation(message)
      .then((response) => {
        const { conversationKey, conversationObj, conversationList } = response;

        if (conversationKey > -1) {
          const unreadMessageCount = this.makeUnreadMessageCount(
            conversationObj,
          );
          const lastMessageObj = this.makeLastMessage(message, conversationObj);

          const conversationWithObj = { ...conversationObj.conversationWith };
          const membersCount = parseInt(conversationWithObj.membersCount);
          let { scope } = conversationWithObj;

          if (options && this.loggedInUser.uid === options.user.uid) {
            scope = options.scope;
          }

          const newConversationWithObj = {
            ...conversationWithObj,
            membersCount,
            scope,
          };
          const newConversationObj = {
            ...conversationObj,
            conversationWith: newConversationWithObj,
            lastMessage: lastMessageObj,
            unreadMessageCount,
          };
          conversationList.splice(conversationKey, 1);
          conversationList.unshift(newConversationObj);
          this.setState({ conversationList: conversationList });
          this.playAudio(message);
        }
      })
      .catch((error) => {
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
        logger('This is an error in converting message to conversation', error);
      });
  };

  /**
   * Handle updating group members in existing conversation objects on member joined/unbanned
   * @param message: message object
   * @param options: contains user object for user added to group
   * @param operator: for incrementing member count
   */
  updateGroupMemberChanged = (message, options, operator) => {
    this.makeConversation(message)
      .then((response) => {
        const { conversationKey, conversationObj, conversationList } = response;
        if (conversationKey > -1) {
          if (options && this.loggedInUser.uid !== options.user.uid) {
            const unreadMessageCount = this.makeUnreadMessageCount(
              conversationObj,
            );
            const lastMessageObj = this.makeLastMessage(
              message,
              conversationObj,
            );

            const conversationWithObj = { ...conversationObj.conversationWith };
            let membersCount = parseInt(conversationWithObj.membersCount);
            if (operator === 'increment') {
              membersCount += 1;
            }

            const newConversationWithObj = {
              ...conversationWithObj,
              membersCount,
            };
            const newConversationObj = {
              ...conversationObj,
              conversationWith: newConversationWithObj,
              lastMessage: lastMessageObj,
              unreadMessageCount,
            };
            conversationList.splice(conversationKey, 1);
            conversationList.unshift(newConversationObj);
            this.setState({ conversationList: conversationList });
            this.playAudio(message);
          }
        }
      })
      .catch((error) => {
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
        logger('This is an error in converting message to conversation', error);
      });
  };

  /**
   * Handle clicking on list item
   * @param conversation: conversation object of the item clicked
   */
  handleClick = (conversation) => {
    try {
      if (!this.props.onItemClick) return;

      this.props.onItemClick(
        conversation.conversationWith,
        conversation.conversationType,
      );
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Retrieve conversation list according to the logged in user
   * @param
   */
  getConversations = () => {
    new CometChatManager()
      .getLoggedInUser()
      .then((user) => {
        this.loggedInUser = user;
        this.ConversationListManager.fetchNextConversation()
          .then((conversationList) => {
            if (conversationList.length === 0) {
              this.decoratorMessage = 'No chats found';
            }
            this.setState({
              conversationList: [
                ...this.state.conversationList,
                ...conversationList,
              ],
            });
          })
          .catch((error) => {
            this.decoratorMessage = 'Error';
            const errorCode = error?.message || 'ERROR';
            this.dropDownAlertRef?.showMessage('error', errorCode);
            logger(
              '[CometChatConversationList] getConversations fetchNext error',
              error,
            );
          });
      })
      .catch((error) => {
        this.decoratorMessage = 'Error';
        logger(
          '[CometChatConversationList] getConversations getLoggedInUser error',
          error,
        );
      });
  };

  /**
   * header component for conversation list
   * @param
   */
  listHeaderComponent = () => {
    //list header avatar here.
    return (
      <View style={[styles.conversationHeaderStyle]}>
        <View style={styles.headingContainer}>
          <Text style={styles.conversationHeaderTitleStyle}>Chats</Text>
        </View>
      </View>
    );
  };

  /**
   * component to show if conversation list length is 0
   * @param
   */
  listEmptyContainer = () => {
    // for loading purposes....
    return (
      <View style={styles.contactMsgStyle}>
        <Text
          style={[
            styles.contactMsgTxtStyle,
            {
              color: `${this.theme.color.secondary}`,
            },
          ]}>
          {this.decoratorMessage}
        </Text>
      </View>
    );
  };

  /**
   * component for separating 2 conversation list items
   * @param
   */
  itemSeparatorComponent = ({ leadingItem }) => {
    if (leadingItem.header) {
      return null;
    }
    return (
      <View
        style={[
          styles.itemSeperatorStyle,
          {
            borderBottomColor: this.theme.borderColor.primary,
          },
        ]}
      />
    );
  };

  /**
   * check if scroll reached a particular point to handle headers
   * @param
   */
  handleScroll = ({ nativeEvent }) => {
    if (nativeEvent.contentOffset.y > 35 && !this.state.showSmallHeader) {
      this.setState({
        showSmallHeader: true,
      });
    }
    if (nativeEvent.contentOffset.y <= 35 && this.state.showSmallHeader) {
      this.setState({
        showSmallHeader: false,
      });
    }
  };

  /**
   * Handle end reached of conversation list
   * @param
   */
  endReached = () => {
    this.getConversations();
  };

  render() {
    return (
      <SafeAreaView style={{ backgroundColor: 'white' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.conversationWrapperStyle}>
          <View style={styles.headerContainer}></View>
          {this.listHeaderComponent()}
          <FlatList
            contentContainerStyle={styles.flexGrow1}
            data={this.state.conversationList}
            renderItem={({ item }) => {
              return (
                <CometChatConversationListItem
                  theme={this.theme}
                  config={this.props.config}
                  conversation={item}
                  selectedConversation={this.state.selectedConversation}
                  loggedInUser={this.loggedInUser}
                  handleClick={this.handleClick}
                />
              );
            }}
            ListEmptyComponent={this.listEmptyContainer}
            onScroll={this.handleScroll}
            onEndReached={this.endReached}
            onEndReachedThreshold={0.3}
            showsVerticalScrollIndicator={false}
            scrollEnabled
          />
        </KeyboardAvoidingView>
        <DropDownAlert ref={(ref) => (this.dropDownAlertRef = ref)} />
      </SafeAreaView>
    );
  }
}
export default CometChatConversationList;
