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

import { incomingOtherMessageAlert } from '../../../resources/audio';
import { validateWidgetSettings } from '../../../utils/common';
import {
  View,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';

class CometChatConversationList extends React.Component {
  loggedInUser = null;

  decoratorMessage = 'Loading...';

  constructor(props) {
    super(props);

    this.state = {
      conversationlist: [],
      // onItemClick: null,
      selectedConversation: undefined,
      showSmallHeader: false,
    };
    this.chatListRef = React.createRef();
    this.theme = { ...theme, ...this.props.theme };
    this.audio = new Sound(incomingOtherMessageAlert);
  }

  componentDidMount() {
    this.navListener = this.props.navigation.addListener('focus', () => {
      this.decoratorMessage = 'Loading...';
      if(this.ConversationListManager){
        this.ConversationListManager.removeListeners();
      }
      this.setState({conversationlist:[]})
      this.ConversationListManager = new ConversationListManager();
      this.getConversations();
      this.ConversationListManager.attachListeners(this.conversationUpdated);
    });
  }

  componentDidUpdate(prevProps) {
    const previousItem = JSON.stringify(prevProps.item);
    const currentItem = JSON.stringify(this.props.item);

    // if different conversation is selected
    if (previousItem !== currentItem) {
      if (Object.keys(this.props.item).length === 0) {
        this.chatListRef.scrollTop = 0;
        this.setState({ selectedConversation: {} });
      } else {
        const conversationlist = [...this.state.conversationlist];
        const conversationObj = conversationlist.find((c) => {
          if (
            (c.conversationType === this.props.type &&
              this.props.type === 'user' &&
              c.conversationWith.uid === this.props.item.uid) ||
            (c.conversationType === this.props.type &&
              this.props.type === 'group' &&
              c.conversationWith.guid === this.props.item.guid)
          ) {
            return c;
          }

          return false;
        });

        if (conversationObj) {
          const conversationKey = conversationlist.indexOf(conversationObj);
          const newConversationObj = {
            ...conversationObj,
            unreadMessageCount: 0,
          };

          conversationlist.splice(conversationKey, 1, newConversationObj);
          this.setState({
            conversationlist,
            selectedConversation: newConversationObj,
          });
        }
      }
    }

    // if user is blocked/unblocked, update conversationlist in state
    if (
      prevProps.item &&
      Object.keys(prevProps.item).length &&
      prevProps.item.uid === this.props.item.uid &&
      prevProps.item.blockedByMe !== this.props.item.blockedByMe
    ) {
      const conversationlist = [...this.state.conversationlist];

      // search for user
      const convKey = conversationlist.findIndex(
        (c) => c.conversationType === 'user' && c.conversationWith.uid === this.props.item.uid
      );
      if (convKey > -1) {
        conversationlist.splice(convKey, 1);

        this.setState({ conversationlist });
      }
    }

    if (
      prevProps.groupToUpdate &&
      (prevProps.groupToUpdate.guid !== this.props.groupToUpdate.guid ||
        (prevProps.groupToUpdate.guid === this.props.groupToUpdate.guid &&
          (prevProps.groupToUpdate.membersCount !== this.props.groupToUpdate.membersCount ||
            prevProps.groupToUpdate.scope !== this.props.groupToUpdate.scope)))
    ) {
      const conversationlist = [...this.state.conversationlist];
      const { groupToUpdate } = this.props;

      const convKey = conversationlist.findIndex(
        (c) => c.conversationType === 'group' && c.conversationWith.guid === groupToUpdate.guid
      );
      if (convKey > -1) {
        const convObj = conversationlist[convKey];

        const convWithObj = { ...convObj.conversationWith };

        const newConvWithObj = {
          ...convWithObj,
          scope: groupToUpdate.scope,
          membersCount: groupToUpdate.membersCount,
        };
        const newConvObj = { ...convObj, conversationWith: newConvWithObj };

        conversationlist.splice(convKey, 1, newConvObj);
        this.setState({ conversationlist });
      }
    }

    if (prevProps.messageToMarkRead !== this.props.messageToMarkRead) {
      const message = this.props.messageToMarkRead;
      this.makeConversation(message)
        .then((response) => {
          const { conversationKey, conversationObj, conversationList } = response;

          if (conversationKey > -1) {
            const unreadMessageCount = this.makeUnreadMessageCount(conversationObj, 'decrement');
            const lastMessageObj = this.makeLastMessage(message, conversationObj);

            const newConversationObj = {
              ...conversationObj,
              lastMessage: lastMessageObj,
              unreadMessageCount,
            };
            conversationList.splice(conversationKey, 1);
            conversationList.unshift(newConversationObj);
            this.setState({ conversationlist: conversationList });
          }
        })
        .catch(() => {
          // console.log('This is an error in converting message to conversation', error);
        });
    }

    if (prevProps.lastMessage !== this.props.lastMessage) {
      const { lastMessage } = this.props;
      const conversationList = [...this.state.conversationlist];
      const conversationKey = conversationList.findIndex(
        (c) => c.conversationId === lastMessage.conversationId
      );

      if (conversationKey > -1) {
        const conversationObj = conversationList[conversationKey];
        const newConversationObj = { ...conversationObj, lastMessage };

        conversationList.splice(conversationKey, 1);
        conversationList.unshift(newConversationObj);
        this.setState({ conversationlist: conversationList });
      }
    }

    if (prevProps.groupToDelete && prevProps.groupToDelete.guid !== this.props.groupToDelete.guid) {
      let conversationList = [...this.state.conversationlist];
      const groupKey = conversationList.findIndex((member) => member.conversationWith.guid === this.props.groupToDelete.guid);
      if (groupKey > -1) {
        conversationList.splice(groupKey, 1);
        this.setState({ conversationlist: conversationList });
        if (conversationList.length === 0) {
          this.decoratorMessage = 'No chats found';
        }
      }
    }
  }

  componentWillUnmount() {
    if(this.ConversationListManager){
      this.ConversationListManager.removeListeners();
    }
    this.ConversationListManager = null;
    if (this.navListener) this.navListener();
  }

  setAvatar = (conversation) => {
    if (conversation.conversationType === 'user' && !conversation.conversationWith.avatar) {
      // const uid = conversation.conversationWith.uid;
      // const char = conversation.conversationWith.name.charAt(0).toUpperCase();
      // return SvgAvatar.getAvatar(uid, char);
    } else if (conversation.conversationType === 'group' && !conversation.conversationWith.icon) {
      // const guid = conversation.conversationWith.guid;
      // const char = conversation.conversationWith.name.charAt(0).toUpperCase();
      // return SvgAvatar.getAvatar(guid, char)
    }
  };

  conversationUpdated = (key, item, message, options,actionBy) => {
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
        if (this.loggedInUser.uid!==actionBy.uid)
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
  };

  updateUser = (user) => {
    const conversationlist = [...this.state.conversationlist];
    const conversationKey = conversationlist.findIndex(
      (conversationObj) =>
        conversationObj.conversationType === 'user' &&
        conversationObj.conversationWith.uid === user.uid
    );

    if (conversationKey > -1) {
      const conversationObj = { ...conversationlist[conversationKey] };
      const conversationWithObj = {
        ...conversationObj.conversationWith,
        status: user.getStatus(),
      };

      const newConversationObj = {
        ...conversationObj,
        conversationWith: conversationWithObj,
      };
      conversationlist.splice(conversationKey, 1, newConversationObj);
      this.setState({ conversationlist });
    }
  };

  playAudio = (message) => {
    // if audio sound is disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, 'enable_sound_for_messages') === false) {
      return false;
    }

    if (
      message.category === enums.CATEGORY_ACTION &&
      message.type === enums.ACTION_TYPE_GROUPMEMBER &&
      validateWidgetSettings(this.props.widgetsettings, 'hide_join_leave_notifications') === true
    ) {
      return false;
    }

    if (this.state.playingAudio) {
      return false;
    }
    this.setState({ playingAudio: true }, () => {
      this.audio.setCurrentTime(0);
      this.audio.play(() => {
        this.setState({ playingAudio: false });
      });
    });
  };

  makeConversation = (message) => {
    const promise = new Promise((resolve, reject) => {
      CometChat.CometChatHelper.getConversationFromMessage(message)
        .then((conversation) => {
          const conversationList = [...this.state.conversationlist];
          const conversationKey = conversationList.findIndex(
            (c) => c.conversationId === conversation.conversationId
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

  makeUnreadMessageCount = (conversation = {}, operator) => {
    if (Object.keys(conversation).length === 0) {
      return 1;
    }

    let unreadMessageCount = parseInt(conversation.unreadMessageCount);
    // if (
    //   this.state.selectedConversation &&
    //   this.state.selectedConversation.conversationId === conversation.conversationId
    // ) {
    //   unreadMessageCount = 0;
    // } else 
    // if (
    //   (Object.prototype.hasOwnProperty.call(this.props, 'item') &&
    //     Object.prototype.hasOwnProperty.call(this.props.item, 'guid') &&
    //     Object.prototype.hasOwnProperty.call(conversation.conversationWith, 'guid') &&
    //     this.props.item.guid === conversation.conversationWith.guid) ||
    //   (Object.prototype.hasOwnProperty.call(this.props, 'item') &&
    //     Object.prototype.hasOwnProperty.call(this.props.item, 'uid') &&
    //     Object.prototype.hasOwnProperty.call(conversation.conversationWith, 'uid') &&
    //     this.props.item.uid === conversation.conversationWith.uid)
    // ) {
    //   unreadMessageCount = 0;
    // } else
     if (operator && operator === 'decrement') {
       unreadMessageCount = unreadMessageCount ? unreadMessageCount - 1 : 0;
    } else {
      unreadMessageCount += 1;
    }

    return unreadMessageCount;
  };

  makeLastMessage = (message) => {
    const newMessage = { ...message };
    return newMessage;
  };

  updateConversation = (message, notification = true) => {
    this.makeConversation(message)
      .then((response) => {
        const { conversationKey, conversationObj, conversationList } = response;

        if (conversationKey > -1) {
          const unreadMessageCount = this.makeUnreadMessageCount(conversationList[conversationKey]);
          const lastMessageObj = this.makeLastMessage(message, conversationObj);

          const newConversationObj = {
            ...conversationObj,
            lastMessage: lastMessageObj,
            unreadMessageCount,
          };
          conversationList.splice(conversationKey, 1);
          conversationList.unshift(newConversationObj);
          this.setState({ conversationlist: conversationList });

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
          this.setState({ conversationlist: conversationList });

          if (notification) {
            this.playAudio(message);
          }
        }
      })
      .catch(() => {
        // console.log('This is an error in converting message to conversation', error);
      });
  };

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
            this.setState({ conversationlist: conversationList });
          }
        }
      })
      .catch(() => {
        // console.log('This is an error in converting message to conversation', error);
      });
  };

  updateGroupMemberAdded = (message, options) => {
    this.makeConversation(message)
      .then((response) => {
        const { conversationKey, conversationObj, conversationList } = response;

        if (conversationKey > -1) {
          const unreadMessageCount = this.makeUnreadMessageCount(conversationObj);
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
          this.setState({ conversationlist: conversationList });
          this.playAudio(message);
        } else if (options && this.loggedInUser.uid === options.user.uid) {
          const avatar = this.setAvatar(conversationObj);

          const unreadMessageCount = this.makeUnreadMessageCount();
          const lastMessageObj = this.makeLastMessage(message);

          const conversationWithObj = { ...conversationObj.conversationWith };
          const membersCount = parseInt(conversationWithObj.membersCount) + 1;
          const scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
          const { hasJoined } = options;

          const newConversationWithObj = {
            ...conversationWithObj,
            icon: avatar,
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
          this.setState({ conversationlist: conversationList });
          this.playAudio(message);
        }
      })
      .catch(() => {
        // console.log('This is an error in converting message to conversation', error);
      });
  };

  updateGroupMemberRemoved = (message, options) => {
    this.makeConversation(message)
      .then((response) => {
        const { conversationKey, conversationObj, conversationList } = response;

        if (conversationKey > -1) {
          if (options && this.loggedInUser.uid === options.user.uid) {
            conversationList.splice(conversationKey, 1);
            this.setState({ conversationlist: conversationList });
          } else {
            const unreadMessageCount = this.makeUnreadMessageCount(conversationObj);
            const lastMessageObj = this.makeLastMessage(message, conversationObj);

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
            this.setState({ conversationlist: conversationList });
            this.playAudio(message);
          }
        }
      })
      .catch(() => {
        // console.log('This is an error in converting message to conversation', error);
      });
  };

  updateGroupMemberScopeChanged = (message, options) => {
    this.makeConversation(message)
      .then((response) => {
        const { conversationKey, conversationObj, conversationList } = response;

        if (conversationKey > -1) {
          const unreadMessageCount = this.makeUnreadMessageCount(conversationObj);
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
          this.setState({ conversationlist: conversationList });
          this.playAudio(message);
        }
      })
      .catch(() => {
        // console.log('This is an error in converting message to conversation', error);
      });
  };

  updateGroupMemberChanged = (message, options, operator) => {
    this.makeConversation(message)
      .then((response) => {
        const { conversationKey, conversationObj, conversationList } = response;
        if (conversationKey > -1) {
          if (options && this.loggedInUser.uid !== options.user.uid) {
            const unreadMessageCount = this.makeUnreadMessageCount(conversationObj);
            const lastMessageObj = this.makeLastMessage(message, conversationObj);

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
            this.setState({ conversationlist: conversationList });
            this.playAudio(message);
          }
        }
      })
      .catch(() => {
        // console.log('This is an error in converting message to conversation', error);
      });
  };

  // handleScroll = (e) => {

  //   const bottom =
  //     Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) === Math.round(e.currentTarget.clientHeight);
  //   if (bottom) this.getConversations();
  // }

  // updating unread message count to zero

  handleClick = (conversation) => {
    if (!this.props.onItemClick) return;

    this.props.onItemClick(conversation.conversationWith, conversation.conversationType);
  };

  handleMenuClose = () => {
    if (!this.props.actionGenerated) {
      return false;
    }

    this.props.actionGenerated('closeMenuClicked');
  };

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

            conversationList.forEach((conversation) => {
              if (
                conversation.conversationType === 'user' &&
                !conversation.conversationWith.avatar
              ) {
                conversation.conversationWith.avatar = this.setAvatar(conversation);
              } else if (
                conversation.conversationType === 'group' &&
                !conversation.conversationWith.icon
              ) {
                conversation.conversationWith.icon = this.setAvatar(conversation);
              }

              // if (
              //   Object.prototype.hasOwnProperty.call(this.props, 'type') &&
              //   Object.prototype.hasOwnProperty.call(this.props, 'item') &&
              //   this.props.type === conversation.conversationType
              // ) {
              //   if (
              //     (conversation.conversationType === 'user' &&
              //       this.props.item.uid === conversation.conversationWith.uid) ||
              //     (conversation.conversationType === 'group' &&
              //       this.props.item.guid === conversation.conversationWith.guid)
              //   ) {
              //     conversation.unreadMessageCount = 0;
              //   }
              // }
            });
            this.setState({
              conversationlist: [...this.state.conversationlist, ...conversationList],
            });
          })
          .catch(() => {
            this.decoratorMessage = 'Error';
            // console.error('[CometChatConversationList] getConversations fetchNext error', error);
          });
      })
      .catch(() => {
        this.decoratorMessage = 'Error';
        // console.log('[CometChatConversationList] getConversations getLoggedInUser error', error);
      });
  };

  ListHeaderComponent = () => {
    /// //list header avatar here.
    return (
      <View style={[styles.conversationHeaderStyle]}>
        <View style={styles.headingContainer}>
          <Text style={styles.conversationHeaderTitleStyle}>Chats</Text>
        </View>
        {/* <View
          style={[
            {
              borderBottomColor: this.theme.borderColor.primary,
              borderBottomWidth: 1,
              paddingBottom: 20,
            },
          ]}
        /> */}
      </View>
    );
  };

  listEmptyContainer = () => {
    /// for loading purposes....
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

  endReached = () => {
    this.getConversations();
  };

  render() {
    return (
      <SafeAreaView style={{ backgroundColor: 'white' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.conversationWrapperStyle}>
          <View style={styles.headerContainer}>
            {/* <Text
              style={{
                fontSize: 18,
                display: this.state.showSmallHeader ? 'flex' : 'none',
              }}>
              Chats
            </Text> */}
          </View>
          {this.ListHeaderComponent()}
          <FlatList
            data={this.state.conversationlist}
            renderItem={({ item }) => {
              return (
                <CometChatConversationListItem
                  theme={this.theme}
                  config={this.props.config}
                  // conversationKey={key}
                  conversation={item}
                  selectedConversation={this.state.selectedConversation}
                  loggedInUser={this.loggedInUser}
                  handleClick={this.handleClick}
                />
              );
            }}
            ListEmptyComponent={this.listEmptyContainer}
            // ListHeaderComponent={this.ListHeaderComponent}
            ItemSeparatorComponent={this.itemSeparatorComponent}
            onScroll={this.handleScroll}
            onEndReached={this.endReached}
            onEndReachedThreshold={0.3}
            showsVerticalScrollIndicator={false}
            scrollEnabled
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
}
export default CometChatConversationList;
