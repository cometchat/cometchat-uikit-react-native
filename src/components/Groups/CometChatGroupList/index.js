/* eslint-disable no-param-reassign */
/* eslint-disable radix */
/* eslint-disable react/no-did-update-set-state */
import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { CometChatManager } from '../../../utils/controller';
import * as enums from '../../../utils/enums';
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
  Dimensions,
  Alert,
  FlatList,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import { heightRatio, widthRatio } from '../../../utils/consts';
import BottomSheet from 'reanimated-bottom-sheet';

class CometChatGroupList extends React.Component {
  timeout;

  passwordScreen = null;

  loggedInUser = null;

  decoratorMessage = 'Loading...';

  addIcon = (<Icon2 name="edit" size={24} color={theme.color.blue} />);

  creategroup = this.addIcon;

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
    this.groupListRef = React.createRef(null); /// //group list
    this.theme = { ...theme, ...this.props.theme };

    this.textInputRef = React.createRef(null);
  }

  componentDidMount() {
    this.navListener = this.props.navigation.addListener('focus', () => {
      this.decoratorMessage = 'Loading...';
      if (this.GroupListManager) {
        this.GroupListManager.removeListeners();
      }
      this.setState({ grouplist: [] });
      this.GroupListManager = new GroupListManager();
      this.getGroups(); /// /you are getting groups here.
      this.GroupListManager.attachListeners(this.groupUpdated);
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.textInputFocused !== this.state.textInputFocused) {
      this.textInputRef.current.focus();
    }

    const previousItem = JSON.stringify(prevProps.item);
    const currentItem = JSON.stringify(this.props.item);

    // if different group is selected
    if (previousItem !== currentItem) {
      if (Object.keys(this.props.item).length === 0) {
        // this.groupListRef.scrollTop = 0;
        this.setState({ selectedGroup: {} });
      } else {
        const grouplist = [...this.state.grouplist];

        // search for user
        const groupKey = grouplist.findIndex((g) => g.guid === this.props.item.guid);
        if (groupKey > -1) {
          const groupObj = { ...grouplist[groupKey] };
          this.setState({ selectedGroup: groupObj });
        }
      }
    }

    if (prevProps.groupToLeave && prevProps.groupToLeave.guid !== this.props.groupToLeave.guid) {
      const groups = [...this.state.grouplist];
      const groupKey = groups.findIndex((member) => member.guid === this.props.groupToLeave.guid);

      if (groupKey > -1) {
        const { groupToLeave } = this.props;
        const groupObj = { ...groups[groupKey] };
        const membersCount = parseInt(groupToLeave.membersCount) - 1;

        const newgroupObj = { ...groupObj, membersCount, hasJoined: false };

        groups.splice(groupKey, 1, newgroupObj);
        this.setState({ grouplist: groups });
      }
    }

    if (prevProps.groupToDelete && prevProps.groupToDelete.guid !== this.props.groupToDelete.guid) {
      const groups = [...this.state.grouplist];
      const groupKey = groups.findIndex((member) => member.guid === this.props.groupToDelete.guid);
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
          (prevProps.groupToUpdate.membersCount !== this.props.groupToUpdate.membersCount ||
            prevProps.groupToUpdate.scope !== this.props.groupToUpdate.scope)))
    ) {
      const groups = [...this.state.grouplist];
      const { groupToUpdate } = this.props;

      const groupKey = groups.findIndex((group) => group.guid === groupToUpdate.guid);
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
  }

  componentWillUnmount() {
    this.GroupListManager = null;
  }

  setAvatar = (group) => {
    if (Object.prototype.hasOwnProperty.call(group, 'icon') === false) {
      // finction for adding image.
      // const guid = group.guid;
      // const char = group.name.charAt(0).toUpperCase();
      // for dummy.                   ////dummy /////svg avatar here.
    }
    return group;
  };

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

  updateMemberAdded = (group, options) => {
    const grouplist = [...this.state.grouplist];

    // search for group
    const groupKey = grouplist.findIndex((g) => g.guid === group.guid);

    if (groupKey > -1) {
      const groupObj = { ...grouplist[groupKey] };

      const membersCount = parseInt(group.membersCount);

      let scope = Object.prototype.hasOwnProperty.call(group, 'scope') ? group.scope : '';
      let hasJoined = Object.prototype.hasOwnProperty.call(group, 'hasJoined')
        ? group.hasJoined
        : false;

      if (options && this.loggedInUser.uid === options.user.uid) {
        scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
        hasJoined = true;
      }

      const newgroupObj = {
        ...groupObj,
        membersCount,
        scope,
        hasJoined,
      };

      grouplist.splice(groupKey, 1, newgroupObj);
      this.setState({ grouplist });
    } else {
      const groupObj = { ...group };

      let scope = Object.prototype.hasOwnProperty.call(groupObj, 'scope') ? groupObj.scope : {};
      let hasJoined = Object.prototype.hasOwnProperty.call(groupObj, 'hasJoined')
        ? groupObj.hasJoined
        : false;
      const membersCount = parseInt(groupObj.membersCount);
      this.setAvatar(groupObj);
      if (options && this.loggedInUser.uid === options.user.uid) {
        scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
        hasJoined = true;
      }

      const newgroupObj = {
        ...groupObj,
        membersCount,
        scope,
        hasJoined,
      };

      const groupList = [newgroupObj, ...this.state.grouplist];
      this.setState({ grouplist: groupList });
    }
  };

  updateMemberJoined = (group, options) => {
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

      const newgroupObj = { ...groupObj, membersCount, scope };

      grouplist.splice(groupKey, 1, newgroupObj);
      this.setState({ grouplist });
    }
  };

  updateMemberChanged = (group, options) => {
    const grouplist = [...this.state.grouplist];

    // search for group
    const groupKey = grouplist.findIndex((g) => g.guid === group.guid);

    if (groupKey > -1) {
      const groupObj = { ...grouplist[groupKey] };
      if (options && this.loggedInUser.uid === options.user.uid) {
        const newgroupObj = { ...groupObj, scope: options.scope };

        grouplist.splice(groupKey, 1, newgroupObj);
        this.setState({ grouplist });
      }
    }
  };

  // handleScroll = (e) => {
  //   const bottom =
  //     Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) === Math.round(e.currentTarget.clientHeight);
  //   if (bottom) this.getGroups();
  // }

  joinGroup = (passcode) => {
    if (passcode !== null) {
      /// coded here   ************
      CometChat.joinGroup(this.state.guid, this.state.groupType, passcode)
        .then((response) => {
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
            this.props.onItemClick(newGroupObj, 'group');
            this.setState({ showPasswordScreen: false });
          }
        })
        .catch((error) => {
          if (error.code === 'ERR_WRONG_GROUP_PASS') Alert.alert(error.message);
        });
    }
  };

  handleClick = (group) => {
    /// //////////////////handleclick ehereeee
    if (!this.props.onItemClick) return;
    if (group.hasJoined === false) {
      if (
        Object.prototype.hasOwnProperty.call(this.props, 'widgetsettings') &&
        this.props.widgetsettings &&
        Object.prototype.hasOwnProperty.call(this.props.widgetsettings, 'main') &&
        Object.prototype.hasOwnProperty.call(
          this.props.widgetsettings.main,
          'join_or_leave_groups'
        ) &&
        this.props.widgetsettings.main.join_or_leave_groups === false
      ) {
        // console.log("Group joining disabled in widget settings");
        return false;
      }

      // let password = null;
      if (group.type === CometChat.GROUP_TYPE.PASSWORD) {
        // password = prompt('Enter your password');
        this.setState({ showPasswordScreen: true, guid: group.guid, groupType: group.type });
      }
      if (group.type === CometChat.GROUP_TYPE.PUBLIC) {
        CometChat.joinGroup(group.guid, group.type, "")
        .then((response) => {
          const groups = [...this.state.grouplist];

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

            this.props.onItemClick(newGroupObj, 'group');
          }
        })
        .catch(() => {
          // console.log('Group joining failed with exception:', error);
        });
      }
    } else {
      this.setState({ selectedGroup: group });
      this.props.onItemClick(group, 'group');
    }
  };

  handleMenuClose = () => {
    if (!this.props.actionGenerated) {
      return false;
    }
    this.props.actionGenerated('closeMenuClicked');
  };

  searchGroup = (e) => {
    /// //search grouppppp here
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
      }
    );
  };

  endReached = () => {
    this.getGroups();
  };

  markMessagesRead = (message) => {
    if (!(message.getReadAt() || message.getReadByMeAt())) {
      if (message.getReceiverType() === 'user') {
        CometChat.markAsRead(
          message.getId().toString(),
          message.getSender().getUid(),
          message.getReceiverType()
        );
      } else {
        CometChat.markAsRead(
          message.getId().toString(),
          message.getReceiverId(),
          message.getReceiverType()
        );
      }
    }
  };

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

            groupList.map((group) => (group = this.setAvatar(group))); /// ////setavatar in get groups here
            this.setState({
              grouplist: [...this.state.grouplist, ...groupList],
            });
          })
          .catch(() => {
            this.decoratorMessage = 'Error';
            // console.error('[CometChatGroupList] getGroups fetchNextGroups error', error);
          });
      })
      .catch(() => {
        this.decoratorMessage = 'Error';
        // console.log('[CometChatGroupList] getUsers getLoggedInUser error', error);
      });
  };

  createGroupHandler = (flag) => {
    this.setState({ createGroup: flag });
  };

  updateMemberRemoved = (group, options) => {
    const grouplist = [...this.state.grouplist];

    // search for group
    const groupKey = grouplist.findIndex((g) => g.guid === group.guid);

    if (groupKey > -1) {
      if (options && this.loggedInUser.uid === options.user.uid) {
        const groupObj = { ...grouplist[groupKey] };

        const newgroupObj = { ...groupObj, ...group };

        grouplist.splice(groupKey, 1, newgroupObj);
        this.setState({ grouplist });
      } else {
        const groupObj = { ...grouplist[groupKey] };
        const membersCount = parseInt(group.membersCount);

        const newgroupObj = { ...groupObj, membersCount };

        grouplist.splice(groupKey, 1, newgroupObj);
        this.setState({ grouplist });
      }
    }
  };

  createGroupActionHandler = (action, group) => {
    if (action === 'groupCreated') {
      this.setAvatar(group);
      const groupList = [group, ...this.state.grouplist];

      this.handleClick(group);
      this.setState({ grouplist: groupList, createGroup: false });
    }
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

  ListHeaderComponent = () => {
    return (
      <View style={[styles.groupHeaderStyle]}>
        <View style={styles.headingContainer}>
          <Text style={styles.groupHeaderTitleStyle}>Groups</Text>
          <TouchableOpacity
            onPress={() => this.createGroupHandler(true)}
            style={{ borderRadius: 20 }}>
            {this.creategroup}
          </TouchableOpacity>
        </View>
        <TouchableWithoutFeedback onPress={() => this.textInputRef.current.focus()}>
          <View
            style={[
              styles.groupSearchStyle,
              {
                backgroundColor: `${this.theme.backgroundColor.grey}`,
              },
            ]}>
            {/* <Image source={searchIcon} style={{ height: 14, width: 14 }} /> */}
            <Icon name="search" size={15} color={this.theme.color.textInputPlaceholder} />
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
        <Modal transparent animated animationType="fade" visible={this.state.showPasswordScreen}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <BottomSheet
              snapPoints={[Dimensions.get('window').height - 350 * heightRatio, 0]}
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
                    <View
                      style={{
                        backgroundColor: 'white',
                        height: Dimensions.get('window').height + 200,
                        borderRadius: 40,
                      }}>
                      <View
                        style={{ marginTop: 20 * heightRatio, paddingHorizontal: 15 * widthRatio }}>
                        <View style={{ alignSelf: 'flex-start' }}>
                          <TouchableOpacity
                            style={{ alignItems: 'center', justifyContent: 'center' }}
                            onPress={() => {
                              this.setState({ showPasswordScreen: false });
                            }}>
                            <Text
                              style={{
                                color: this.theme.backgroundColor.blue,
                                fontSize: 15 * heightRatio,
                              }}>
                              Close
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <Text
                          style={{
                            alignSelf: 'center',
                            paddingTop: 50 * heightRatio,
                            fontSize: 18 * heightRatio,
                            fontWeight: '600',
                          }}>
                          Password Required!
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            borderWidth: 1,
                            borderColor: this.theme.backgroundColor.primary,
                            marginTop: 50 * heightRatio,
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: 300 * widthRatio,
                            alignSelf: 'center',
                          }}>
                          <TextInput
                            placeholder="Enter password!"
                            secureTextEntry
                            style={{
                              width: 260 * widthRatio,
                              // height: 30 * heightRatio,
                              fontSize: 16 * heightRatio,
                            }}
                            autoCompleteType="off"
                            placeholderTextColor={this.theme.color.textInputPlaceholder}
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
                            style={{
                              width: 30 * widthRatio,
                              height: 30 * heightRatio,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                            <Icon
                              name="enter-outline"
                              style={{ fontSize: 22 * heightRatio }}
                              color={this.theme.backgroundColor.blue}
                            />
                          </TouchableOpacity>
                        </View>
                        <View style={{ marginTop: 35 * heightRatio, alignSelf: 'center' }}>
                          <TouchableOpacity
                            onPress={() => {
                              this.joinGroup(this.state.passwordFeedback);
                            }}
                            style={{
                              backgroundColor: this.theme.backgroundColor.blue,
                              borderWidth: 1,
                              paddingVertical: 8 * heightRatio,
                              paddingHorizontal: 15,
                              borderRadius: 5,
                              borderColor: this.theme.backgroundColor.primary,
                            }}>
                            <Text style={{ fontSize: 18 * heightRatio, color: 'white' }}>Next</Text>
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
        </Modal>
      );
    }
    if (
      Object.prototype.hasOwnProperty.call(this.props, 'config') &&
      this.props.config &&
      Object.prototype.hasOwnProperty.call(this.props, 'group-create') &&
      this.props.config['group-create'] === false
    ) {
      this.creategroup = null;
    }

    if (
      Object.prototype.hasOwnProperty.call(this.props, 'widgetsettings') &&
      this.props.widgetsettings &&
      Object.prototype.hasOwnProperty.call(this.props.widgetsettings, 'main') &&
      Object.prototype.hasOwnProperty.call(this.props.widgetsettings.main, 'create_groups') &&
      this.props.widgetsettings.main.create_groups === false
    ) {
      this.creategroup = null;
    }

    // let closeBtn = (
    // <TouchableOpacity style={styles.groupHeaderCloseStyle} onPress={this.handleMenuClose}><Text>navigateIcon</Text></TouchableOpacity>);
    // if (!Object.prototype.hasOwnProperty.call(this.props,"enableCloseMenu") || (Object.prototype.hasOwnProperty.call(this.props,"enableCloseMenu") && this.props.enableCloseMenu === 0)) {
    //   closeBtn = null;
    // }

    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.groupWrapperStyle}>
          <SafeAreaView style={{flex:1}}>
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
              ItemSeparatorComponent={this.itemSeparatorComponent}
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
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    );
  }
}

export default CometChatGroupList;
