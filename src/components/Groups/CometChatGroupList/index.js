/* eslint-disable no-param-reassign */
/* eslint-disable radix */
/* eslint-disable react/no-did-update-set-state */
import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { CometChatManager } from '../../../utils/controller';
import * as enums from '../../../utils/enums';
import * as actions from '../../../utils/actions';
import DropDownAlert from '../../Shared/DropDownAlert';
import { GroupListManager } from './controller';

import { CometChatCreateGroup, CometChatGroupListItem } from '../index';

import theme from '../../../resources/theme';

import styles from './styles';

import {
  View,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
  Alert,
  FlatList,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import { deviceHeight, heightRatio } from '../../../utils/consts';
import BottomSheet from 'reanimated-bottom-sheet';
import { logger } from '../../../utils/common';

class CometChatGroupList extends React.Component {
  timeout;

  passwordScreen = null;

  loggedInUser = null;

  decoratorMessage = 'Loading...';

  addIcon = (<Icon2 name="edit" size={24} color={theme.color.blue} />);

  createGroup = this.addIcon;

  constructor(props) {
    super(props);

    this.state = {
      grouplist: [],
      createGroup: false,
      selectedGroup: null,
      textInputValue: '',
      textInputFocused: false,
      showPasswordScreen: false,
      guid: null,
      groupType: null,
      passwordFeedback: null,
    };
    this.groupListRef = React.createRef(null); //group list
    this.theme = { ...theme, ...this.props.theme };

    this.textInputRef = React.createRef(null);
  }

  componentDidMount() {
    try {
      this.navListener = this.props.navigation.addListener('focus', () => {
        this.decoratorMessage = 'Loading...';
        if (this.GroupListManager) {
          this.GroupListManager.removeListeners();
        }
        this.setState({ grouplist: [] });
        this.GroupListManager = new GroupListManager();
        this.getGroups(); //you are getting groups here.
        this.GroupListManager.attachListeners(this.groupUpdated);
      });
    } catch (error) {
      logger(error);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    try {
      if (prevState.textInputFocused !== this.state.textInputFocused) {
        this.textInputRef.current.focus();
      }

      const previousItem = JSON.stringify(prevProps.item);
      const currentItem = JSON.stringify(this.props.item);

      // if different group is selected
      if (previousItem !== currentItem) {
        if (Object.keys(this.props.item).length === 0) {
          this.setState({ selectedGroup: {} });
        } else {
          const grouplist = [...this.state.grouplist];

          // search for user
          const groupKey = grouplist.findIndex(
            (g) => g.guid === this.props.item.guid,
          );
          if (groupKey > -1) {
            const groupObj = { ...grouplist[groupKey] };
            this.setState({ selectedGroup: groupObj });
          }
        }
      }

      if (
        prevProps.groupToLeave &&
        prevProps.groupToLeave.guid !== this.props.groupToLeave.guid
      ) {
        const groups = [...this.state.grouplist];
        const groupKey = groups.findIndex(
          (member) => member.guid === this.props.groupToLeave.guid,
        );

        if (groupKey > -1) {
          const { groupToLeave } = this.props;
          const groupObj = { ...groups[groupKey] };
          const membersCount = parseInt(groupToLeave.membersCount) - 1;

          const newGroupObj = { ...groupObj, membersCount, hasJoined: false };

          groups.splice(groupKey, 1, newGroupObj);
          this.setState({ grouplist: groups });
        }
      }

      if (
        prevProps.groupToDelete &&
        prevProps.groupToDelete.guid !== this.props.groupToDelete.guid
      ) {
        const groups = [...this.state.grouplist];
        const groupKey = groups.findIndex(
          (member) => member.guid === this.props.groupToDelete.guid,
        );
        if (groupKey > -1) {
          groups.splice(groupKey, 1);
          this.setState({ grouplist: groups });
          if (groups.length === 0) {
            this.decoratorMessage = 'No groups found';
          }
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
        const groups = [...this.state.grouplist];
        const { groupToUpdate } = this.props;

        const groupKey = groups.findIndex(
          (group) => group.guid === groupToUpdate.guid,
        );
        if (groupKey > -1) {
          const groupObj = groups[groupKey];
          const newGroupObj = {
            ...groupObj,
            ...groupToUpdate,
            scope: groupToUpdate.scope,
            membersCount: groupToUpdate.membersCount,
          };

          groups.splice(groupKey, 1, newGroupObj);
          this.setState({ grouplist: groups });
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  componentWillUnmount() {
    this.GroupListManager = null;
  }

  /**
   * handles the updation of groups based on key
   * @param key: type enums
   * @param message: message object
   * @param group: specifies the group to be updated.
   * @param options:options for the group.
   */
  groupUpdated = (key, message, group, options) => {
    switch (key) {
      case enums.GROUP_MEMBER_SCOPE_CHANGED:
        this.updateMemberChanged(group, options);
        break;
      case enums.GROUP_MEMBER_KICKED:
      case enums.GROUP_MEMBER_BANNED:
      case enums.GROUP_MEMBER_LEFT:
        this.updateMemberRemoved(group, options);
        break;
      case enums.GROUP_MEMBER_ADDED:
        this.updateMemberAdded(group, options);
        break;
      case enums.GROUP_MEMBER_JOINED:
        this.updateMemberJoined(group, options);
        break;
      default:
        break;
    }
  };

  /**
   * checks for the group and updates the fields when a member is added in the group and updates the groupList.
   * @param group: group object
   * @param options
   */

  updateMemberAdded = (group, options) => {
    try {
      const grouplist = [...this.state.grouplist];

      // search for group
      const groupKey = grouplist.findIndex((g) => g.guid === group.guid);

      if (groupKey > -1) {
        const groupObj = { ...grouplist[groupKey] };

        const membersCount = parseInt(group.membersCount);

        let scope = Object.prototype.hasOwnProperty.call(group, 'scope')
          ? group.scope
          : '';
        let hasJoined = Object.prototype.hasOwnProperty.call(group, 'hasJoined')
          ? group.hasJoined
          : false;

        if (options && this.loggedInUser.uid === options.user.uid) {
          scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
          hasJoined = true;
        }

        const newGroupObj = {
          ...groupObj,
          membersCount,
          scope,
          hasJoined,
        };

        grouplist.splice(groupKey, 1, newGroupObj);
        this.setState({ grouplist });
      } else {
        const groupObj = { ...group };

        let scope = Object.prototype.hasOwnProperty.call(groupObj, 'scope')
          ? groupObj.scope
          : {};
        let hasJoined = Object.prototype.hasOwnProperty.call(
          groupObj,
          'hasJoined',
        )
          ? groupObj.hasJoined
          : false;
        const membersCount = parseInt(groupObj.membersCount);
        if (options && this.loggedInUser.uid === options.user.uid) {
          scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
          hasJoined = true;
        }

        const newGroupObj = {
          ...groupObj,
          membersCount,
          scope,
          hasJoined,
        };

        const groupList = [newGroupObj, ...this.state.grouplist];
        this.setState({ grouplist: groupList });
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handles the updation of group when a member joins the group.Scope is set to participant by default.
   * @param group: group object
   * @param options
   */

  updateMemberJoined = (group, options) => {
    try {
      const grouplist = [...this.state.grouplist];

      // search for group
      const groupKey = grouplist.findIndex((g) => g.guid === group.guid);

      if (groupKey > -1) {
        const groupObj = { ...grouplist[groupKey] };

        let { scope } = groupObj;
        const membersCount = parseInt(group.membersCount);

        if (options && this.loggedInUser.uid === options.user.uid) {
          scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
        }

        const newGroupObj = { ...groupObj, membersCount, scope };

        grouplist.splice(groupKey, 1, newGroupObj);
        this.setState({ grouplist });
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handles the updation of group when the scope of member is changed.
   * @param group
   * @param options
   */

  updateMemberChanged = (group, options) => {
    try {
      const grouplist = [...this.state.grouplist];

      // search for group
      const groupKey = grouplist.findIndex((g) => g.guid === group.guid);

      if (groupKey > -1) {
        const groupObj = { ...grouplist[groupKey] };
        if (options && this.loggedInUser.uid === options.user.uid) {
          const newGroupObj = { ...groupObj, scope: options.scope };

          grouplist.splice(groupKey, 1, newGroupObj);
          this.setState({ grouplist });
        }
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handles the joining of a group by the participant if the requirements are met i.e if the passcode entered matches the protected group's set passcode.
   * @param passcode
   */

  joinGroup = (passcode) => {
    if (passcode !== null) {
      CometChat.joinGroup(this.state.guid, this.state.groupType, passcode)
        .then((response) => {
          if (typeof response === 'object') {
            this.dropDownAlertModelRef?.showMessage(
              'success',
              'Group joined Successfully',
            );
          } else {
            this.dropDownAlertModelRef?.showMessage(
              'error',
              'Failed to join group',
            );
            return;
          }
          const groups = [...this.state.grouplist];
          const groupKey = groups.findIndex((g) => g.guid === this.state.guid);
          if (groupKey > -1) {
            const groupObj = groups[groupKey];
            const newGroupObj = {
              ...groupObj,
              ...response,
              scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
            };
            groups.splice(groupKey, 1, newGroupObj);
            this.setState({ grouplist: groups, selectedGroup: newGroupObj });
            this.props.onItemClick(newGroupObj, CometChat.RECEIVER_TYPE.GROUP);
            this.setState({ showPasswordScreen: false });
          }
        })
        .catch((error) => {
          const errorCode = error?.message || 'ERROR';
          this.dropDownAlertModelRef?.showMessage('error', errorCode);
        });
    }
  };

  /**
   * handles what to display when a specific group item from groupList is clicked
   * @param group: group object
   */

  handleClick = (group) => {
    //handle click here
    if (!this.props.onItemClick) return;
    if (group.hasJoined === false) {
      if (group.type === CometChat.GROUP_TYPE.PASSWORD) {
        this.setState({
          showPasswordScreen: true,
          guid: group.guid,
          groupType: group.type,
        });
      }
      if (group.type === CometChat.GROUP_TYPE.PUBLIC) {
        CometChat.joinGroup(group.guid, group.type, '')
          .then((response) => {
            const groups = [...this.state.grouplist];
            if (typeof response === 'object') {
              this.dropDownAlertRef?.showMessage(
                'success',
                'Group Joined Successfully',
              );
            } else {
              this.dropDownAlertRef?.showMessage(
                'error',
                'Failed to join group',
              );
            }
            const groupKey = groups.findIndex((g) => g.guid === group.guid);
            if (groupKey > -1) {
              const groupObj = groups[groupKey];
              const newGroupObj = {
                ...groupObj,
                ...response,
                scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
              };

              groups.splice(groupKey, 1, newGroupObj);
              this.setState({ grouplist: groups, selectedGroup: newGroupObj });

              this.props.onItemClick(
                newGroupObj,
                CometChat.RECEIVER_TYPE.GROUP,
              );
            }
          })
          .catch((error) => {
            const errorCode = error?.message || 'ERROR';
            this.dropDownAlertRef?.showMessage('error', errorCode);
            logger('Group joining failed with exception:', error);
          });
      }
    } else {
      this.setState({ selectedGroup: group });
      this.props.onItemClick(group, CometChat.RECEIVER_TYPE.GROUP);
    }
  };

  /**
   * handles the searching of groups and fetching based on the updation in TextInput(Search box).
   * @param e: textInput's value
   */
  searchGroup = (e) => {
    //search group here
    this.setState(
      {
        textInputValue: e,
      },

      () => {
        if (this.timeout) {
          clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(() => {
          this.GroupListManager = new GroupListManager(e);
          this.setState({ grouplist: [] }, () => this.getGroups());
        }, 500);
      },
    );
  };

  endReached = () => {
    this.getGroups();
  };

  /**
   * handles the updation in group when messages are seen by the members.
   * @param
   */

  markMessagesRead = (message) => {
    if (!(message.getReadAt() || message.getReadByMeAt())) {
      if (message.getReceiverType() === CometChat.RECEIVER_TYPE.USER) {
        CometChat.markAsRead(
          message.getId().toString(),
          message.getSender().getUid(),
          message.getReceiverType(),
        );
      } else {
        CometChat.markAsRead(
          message.getId().toString(),
          message.getReceiverId(),
          message.getReceiverType(),
        );
      }
    }
  };

  /**
   * fetches the groups and updates the groupList.
   * @param
   */

  getGroups = () => {
    new CometChatManager()
      .getLoggedInUser()
      .then((user) => {
        this.loggedInUser = user;
        this.GroupListManager.fetchNextGroups()
          .then((groupList) => {
            if (groupList.length === 0) {
              this.decoratorMessage = 'No groups found';
            }
            this.setState({
              grouplist: [...this.state.grouplist, ...groupList],
            });
          })
          .catch((error) => {
            const errorCode = error?.message || 'ERROR';
            this.dropDownAlertRef?.showMessage('error', errorCode);
            this.decoratorMessage = 'Error';
            logger(
              '[CometChatGroupList] getGroups fetchNextGroups error',
              error,
            );
          });
      })
      .catch((error) => {
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
        this.decoratorMessage = 'Error';
        logger('[CometChatGroupList] getUsers getLoggedInUser error', error);
      });
  };

  /**
   * sets the createGroup state in order to display the modal for groupCreation.
   * @param
   */

  createGroupHandler = (flag) => {
    this.setState({ createGroup: flag });
  };

  /**
   * updates the fields when the member is removed from the group based on updation of groupObj and setting newGroupObj.
   * @param group: group object
   * @param options
   */

  updateMemberRemoved = (group, options) => {
    try {
      const grouplist = [...this.state.grouplist];

      // search for group
      const groupKey = grouplist.findIndex((g) => g.guid === group.guid);

      if (groupKey > -1) {
        if (options && this.loggedInUser.uid === options.user.uid) {
          const groupObj = { ...grouplist[groupKey] };

          const newGroupObj = { ...groupObj, ...group };

          grouplist.splice(groupKey, 1, newGroupObj);
          this.setState({ grouplist });
        } else {
          const groupObj = { ...grouplist[groupKey] };
          const membersCount = parseInt(group.membersCount);

          const newGroupObj = { ...groupObj, membersCount };

          grouplist.splice(groupKey, 1, newGroupObj);
          this.setState({ grouplist });
        }
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * updates the groupList if new group is created and closes the modal for creating Group.
   * @param action
   * @param group
   */

  createGroupActionHandler = (action, group) => {
    if (action === actions.GROUP_CREATED) {
      const groupList = [group, ...this.state.grouplist];

      this.handleClick(group);
      this.setState({ grouplist: groupList, createGroup: false });
    }
  };

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

  itemSeparatorComponent = ({ leadingItem }) => {
    if (leadingItem.header) {
      return null;
    }
    return (
      <View
        style={[
          styles.itemSeparatorStyle,
          {
            borderBottomColor: this.theme.borderColor.primary,
          },
        ]}
      />
    );
  };

  /**
   * handles how the header is to be shown when scroll(event) is performed.
   * @param nativeEvent
   */

  handleScroll = ({ nativeEvent }) => {
    try {
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
    } catch (error) {
      logger(error);
    }
  };

  ListHeaderComponent = () => {
    return (
      <View style={[styles.groupHeaderStyle]}>
        <View style={styles.headingContainer}>
          <Text style={styles.groupHeaderTitleStyle}>Groups</Text>
          <TouchableOpacity
            onPress={() => this.createGroupHandler(true)}
            style={{ borderRadius: 20 }}>
            {this.createGroup}
          </TouchableOpacity>
        </View>
        <TouchableWithoutFeedback
          onPress={() => this.textInputRef.current.focus()}>
          <View
            style={[
              styles.groupSearchStyle,
              {
                backgroundColor: `${this.theme.backgroundColor.grey}`,
              },
            ]}>
            <Icon name="search" size={18} color={this.theme.color.grey} />
            <TextInput
              ref={this.textInputRef}
              value={this.state.textInputValue}
              autoCompleteType="off"
              placeholder="Search"
              placeholderTextColor={this.theme.color.textInputPlaceholder}
              onChangeText={this.searchGroup}
              clearButtonMode="always"
              numberOfLines={1}
              style={[
                styles.contactSearchInputStyle,
                {
                  color: `${this.theme.color.primary}`,
                },
              ]}
            />
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  };

  render() {
    let passwordScreen = null;
    if (this.state.showPasswordScreen) {
      passwordScreen = (
        <Modal
          transparent
          animated
          animationType="fade"
          visible={this.state.showPasswordScreen}>
          <View style={styles.passwordScreenContainer}>
            <BottomSheet
              snapPoints={[deviceHeight - 350 * heightRatio, 0]}
              borderRadius={30}
              initialSnap={0}
              enabledInnerScrolling={false}
              enabledContentTapInteraction={false}
              overdragResistanceFactor={10}
              renderContent={() => {
                return (
                  <TouchableWithoutFeedback
                    onPress={() => {
                      Keyboard.dismiss();
                    }}>
                    <View style={styles.passwordScreenMainContainer}>
                      <View style={styles.passwordScreenInnerContainer}>
                        <View style={styles.closeContainer}>
                          <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => {
                              this.setState({ showPasswordScreen: false });
                            }}>
                            <Text
                              style={[
                                styles.closeText,
                                {
                                  color: this.theme.backgroundColor.blue,
                                },
                              ]}>
                              Close
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.passwordScreenHeader}>
                          Password Required!
                        </Text>
                        <View
                          style={[
                            styles.detailsContainer,
                            {
                              borderColor: this.theme.backgroundColor.primary,
                            },
                          ]}>
                          <TextInput
                            placeholder="Enter password!"
                            secureTextEntry
                            style={styles.passwordInput}
                            autoCompleteType="off"
                            placeholderTextColor={
                              this.theme.color.textInputPlaceholder
                            }
                            onSubmitEditing={(e) => {
                              this.joinGroup(e.nativeEvent.text);
                            }}
                            onChangeText={(feedback) => {
                              this.setState({ passwordFeedback: feedback });
                            }}
                            numberOfLines={1}
                          />
                          <TouchableOpacity
                            onPress={() => {
                              this.joinGroup(this.state.passwordFeedback);
                            }}
                            style={styles.enterBtn}>
                            <Icon
                              name="enter-outline"
                              style={{ fontSize: 22 * heightRatio }}
                              color={this.theme.backgroundColor.blue}
                            />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.nextBtnContainer}>
                          <TouchableOpacity
                            onPress={() => {
                              this.joinGroup(this.state.passwordFeedback);
                            }}
                            style={[
                              styles.nextBtn,
                              {
                                backgroundColor: this.theme.backgroundColor
                                  .blue,
                                borderColor: this.theme.backgroundColor.primary,
                              },
                            ]}>
                            <Text style={styles.nextText}>Next</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                );
              }}
              onCloseEnd={() => {
                this.setState({ showPasswordScreen: false });
              }}
            />
          </View>
          <DropDownAlert ref={(ref) => (this.dropDownAlertModelRef = ref)} />
        </Modal>
      );
    }
    if (
      Object.prototype.hasOwnProperty.call(this.props, 'config') &&
      this.props.config &&
      Object.prototype.hasOwnProperty.call(this.props, 'group-create') &&
      this.props.config['group-create'] === false
    ) {
      this.createGroup = null;
    }

    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.groupWrapperStyle}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.headerContainer}>
              <Text
                style={{
                  fontSize: 18,
                  display: this.state.showSmallHeader ? 'flex' : 'none',
                }}
              />
            </View>
            {this.ListHeaderComponent()}
            <FlatList
              data={this.state.grouplist}
              contentContainerStyle={{ flexGrow: 1 }}
              scrollEnabled
              renderItem={({ item }) => {
                return (
                  <CometChatGroupListItem
                    theme={this.theme}
                    group={item}
                    selectedGroup={this.state.selectedGroup}
                    clickHandler={this.handleClick}
                  />
                );
              }}
              ListEmptyComponent={this.listEmptyContainer}
              onScroll={this.handleScroll}
              onEndReached={this.endReached}
              onEndReachedThreshold={0.3}
              showsVerticalScrollIndicator={false}
            />
            <CometChatCreateGroup
              theme={this.theme}
              open={this.state.createGroup}
              close={() => this.createGroupHandler(false)}
              actionGenerated={this.createGroupActionHandler}
            />
            {passwordScreen}
          </SafeAreaView>
          <DropDownAlert ref={(ref) => (this.dropDownAlertRef = ref)} />
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    );
  }
}

export default CometChatGroupList;
