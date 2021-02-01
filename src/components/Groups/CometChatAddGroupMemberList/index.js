/* eslint-disable react/no-unused-state */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
/* eslint-disable react/jsx-fragments */
/* eslint-disable react/static-property-placement */
import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { CometChatManager } from '../../../utils/controller';
import { AddMembersManager } from './controller';

import {
  View,
  Text,
  TouchableWithoutFeedback,
  TextInput,
  FlatList,
  Modal,
  Dimensions,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native';
import BottomSheet from 'reanimated-bottom-sheet';

import { CometChatAddGroupMemberListItem } from '../index';
import Icon from 'react-native-vector-icons/Ionicons';

import GroupDetailContext from '../CometChatGroupDetails/context';

import style from './styles';

import theme from '../../../resources/theme';

class CometChatAddGroupMemberList extends React.Component {
  static contextType = GroupDetailContext;

  decoratorMessage = 'Loading...';

  constructor(props) {
    super(props);
    this.state = {
      userlist: [],
      textInputFocused: false,
      membersToAdd: [],
      filteredlist: [],
      textInputValue: '',
    };
    this.sheetRef = React.createRef(null);
    this.textInputRef = React.createRef(null);
    this.theme = { ...theme, ...this.props.theme };
  }

  componentDidMount() {
    if (this.props?.friendsOnly) {
      this.friendsOnly = this.props.friendsOnly;
    }

    this.AddMembersManager = new AddMembersManager(this.friendsOnly);
    this.getUsers();
    this.AddMembersManager.attachListeners(this.userUpdated);
  }

  componentDidUpdate() {
    if (this.state.textInputFocused) {
      this.textInputRef.current.focus();
    }
  }

  componentWillUnmount() {
    this.AddMembersManager.removeListeners();
    this.AddMembersManager = null;
  }

  userUpdated = (user) => {
    const userlist = [...this.state.userlist];

    // search for user
    const userKey = userlist.findIndex((u) => u.uid === user.uid);

    // if found in the list, update user object
    if (userKey > -1) {
      const userObj = userlist[userKey]; // {...userlist[userKey]};
      const newUserObj = { ...userObj, ...user };
      userlist.splice(userKey, 1, newUserObj);

      this.setState({ userlist });
    }
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

  searchUsers = (val) => {
    this.setState(
      { textInputValue: val },

      () => {
        if (this.timeout) {
          clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(() => {
          this.AddMembersManager = new AddMembersManager(this.friendsOnly, val);
          this.setState(
            { userlist: [], membersToAdd: [], membersToRemove: [], filteredlist: [] },
            () => this.getUsers()
          );
        }, 500);
      }
    );
  };

  getUsers = () => {
    new CometChatManager()
      .getLoggedInUser()
      .then(() => {
        this.AddMembersManager.fetchNextUsers()
          .then((userList) => {
            const filteredUserList = userList.filter((user) => {
              const found = this.context.memberlist.find((member) => user.uid === member.uid);
              const foundbanned = this.context.bannedmemberlist.find(
                (member) => user.uid === member.uid
              );
              if (found || foundbanned) {
                return false;
              }
              return true;
            });

            if (filteredUserList.length === 0) {
              this.decoratorMessage = 'No users found';
            }

            this.setState({
              userlist: [...this.state.userlist, ...userList],
              filteredlist: [...this.state.filteredlist, ...filteredUserList],
            });
          })
          .catch(() => {
            this.decoratorMessage = 'Error';
            // console.error("[CometChatAddGroupMemberList] getUsers fetchNext error", error);
          });
      })
      .catch(() => {
        this.decoratorMessage = 'Error';
        // console.log("[CometChatAddGroupMemberList] getUsers getLoggedInUser error", error);
      });
  };

  membersUpdated = (user, userState) => {
    if (userState) {
      const members = [...this.state.membersToAdd];
      members.push(user);
      this.setState({ membersToAdd: [...members] });
    } else {
      const membersToAdd = [...this.state.membersToAdd];
      const IndexFound = membersToAdd.findIndex((member) => member.uid === user.uid);
      if (IndexFound > -1) {
        membersToAdd.splice(IndexFound, 1);
        this.setState({ membersToAdd: [...membersToAdd] });
      }
    }
  };

  updateMembers = () => {
    const group = this.context;

    const { guid } = this.props.item;
    const membersList = [];

    this.state.membersToAdd.forEach((newmember) => {
      // if a selected member is already part of the member list, don't add
      const IndexFound = group.memberlist.findIndex((member) => member.uid === newmember.uid);
      if (IndexFound === -1) {
        const newMember = new CometChat.GroupMember(
          newmember.uid,
          CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT
        );
        membersList.push(newMember);

        newmember.type = 'add';
      }
    });

    if (membersList.length) {
      const membersToAdd = [];
      this.props.close();
      CometChat.addMembersToGroup(guid, membersList, [])
        .then((response) => {
          if (Object.keys(response).length) {
            for (const member in response) {
              if (response[member] === 'success') {
                const found = this.state.userlist.find((user) => user.uid === member);
                found.scope = CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT;
                membersToAdd.push(found);
              }
            }
            this.props.actionGenerated('addGroupParticipants', membersToAdd);
          }
        })
        .catch(() => {
          // console.log('addMembersToGroup failed with exception:', error);
        });
    }
  };

  listHeaderComponent = () => {
    return (
      <View style={[style.contactHeaderStyle]}>
        <Text style={style.contactHeaderTitleStyle}>Add Members</Text>
        
      </View>
    );
  };

  listEmptyContainer = () => {
    return (
      <View style={style.contactMsgStyle}>
        <Text
          style={[
            style.contactMsgTxtStyle,
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
          style.itemSeperatorStyle,
          {
            borderBottomColor: this.theme.borderColor.primary,
          },
        ]}
      />
    );
  };

  endReached = () => {
    this.getUsers();
  };

  render() {
    const group = this.context;

    let currentLetter = '';
    const filteredUserList = [...this.state.filteredlist];

    return (
      <React.Fragment>
        <Modal
          transparent
          animated
          animationType="fade"
          visible={this.props.open}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <BottomSheet
              ref={this.sheetRef}
              snapPoints={[Dimensions.get('window').height - 90, 0]}
              borderRadius={30}
              initialSnap={0}
              enabledInnerScrolling={false}
              enabledContentTapInteraction
              overdragResistanceFactor={10}
              renderContent={() => {
                return (
                  <View style={style.reactionDetailsContainer}>
                    <View style={style.headerContainer}>
                      <View style={{}}>
                        <Text style={style.contactHeaderTitleStyle}>
                          Add Members
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          this.sheetRef.current.snapTo(1);
                          this.props.close();
                        }}
                        style={{}}>
                        <Text style={{ color: this.theme.color.blue }}>
                          Close
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableWithoutFeedback
                      onPress={() => this.textInputRef.current.focus()}>
                      <View
                        style={[
                          style.contactSearchStyle,
                          {
                            backgroundColor: `${this.theme.backgroundColor.grey}`,
                          },
                        ]}>
                        <Icon
                          name="search"
                          size={15}
                          color={this.theme.color.textInputPlaceholder}
                        />
                        <TextInput
                          ref={this.textInputRef}
                          autoCompleteType="off"
                          value={this.state.textInputValue}
                          placeholder="Search"
                          placeholderTextColor={
                            this.theme.color.textInputPlaceholder
                          }
                          onChangeText={this.searchUsers}
                          onFocus={() => {
                            this.setState({ textInputFocused: true });
                          }}
                          onBlur={() => {
                            this.setState({ textInputFocused: false });
                          }}
                          clearButtonMode="always"
                          numberOfLines={1}
                          style={[
                            style.contactSearchInputStyle,
                            {
                              color: `${this.theme.color.primary}`,
                            },
                          ]}
                        />
                      </View>
                    </TouchableWithoutFeedback>
                    <FlatList
                      data={filteredUserList}
                      renderItem={({ item }) => {
                        const chr = item.name[0].toUpperCase();
                        let firstLetter = null;
                        if (chr !== currentLetter) {
                          currentLetter = chr;
                          firstLetter = currentLetter;
                        }

                        return (
                          <React.Fragment key={item.uid}>
                            <CometChatAddGroupMemberListItem
                              theme={this.theme}
                              firstLetter={firstLetter}
                              loggedinuser={group.loggedinuser}
                              user={item}
                              members={group.memberlist}
                              changed={this.membersUpdated}
                              widgetsettings={this.props.widgetsettings}
                            />
                          </React.Fragment>
                        );
                      }}
                      // ListHeaderComponent={this.listHeaderComponent}
                      ListEmptyComponent={this.listEmptyContainer}
                      ItemSeparatorComponent={this.itemSeparatorComponent}
                      onScroll={this.handleScroll}
                      onEndReached={this.endReached}
                      onEndReachedThreshold={0.3}
                      showsVerticalScrollIndicator={false}
                    />
                    <TouchableOpacity
                      style={[
                        style.addBtnStyle,
                        {
                          backgroundColor: this.theme.backgroundColor.blue,
                          alignSelf: 'center',
                        },
                      ]}
                      onPress={this.updateMembers}>
                      <Text
                        style={[
                          style.addBtnTxtStyle,
                          {
                            color: `${this.theme.color.white}`,
                          },
                        ]}>
                        Add
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
              onCloseEnd={() => {
                this.props.close();
              }}
            />
            </View>
        </Modal>
      </React.Fragment>
    );
  }
}

export default CometChatAddGroupMemberList;
