/* eslint-disable react/no-did-update-set-state */
/* eslint-disable react/no-unused-state */
import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, Modal } from 'react-native';
import theme from '../../../resources/theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CometChatSharedMedia } from '../../Shared';
import style from './styles';
import BottomSheet from 'reanimated-bottom-sheet';
import { CometChat } from '@cometchat-pro/react-native-chat';
import GroupDetailContext from './context';
import { GroupDetailManager } from './controller';
import { CometChatManager } from '../../../utils/controller';
import * as enums from '../../../utils/enums';
import * as actions from '../../../utils/actions';
import {
  CometChatAddGroupMemberList,
  CometChatViewGroupMemberList,
  CometChatBanGroupMemberList,
} from '../index';
import { deviceHeight } from '../../../utils/consts';
import { logger } from '../../../utils/common';
import DropDownAlert from '../../Shared/DropDownAlert';

const ADD_MEMBER = 'addMember';
const VIEW_MEMBER = 'viewMember';
const BAN_MEMBER = 'banMember';

export default class CometChatGroupDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
      memberList: [],
      bannedMemberList: [],
      administratorsList: [],
      moderatorsList: [],
      viewMember: false,
      addMember: false,
      banMember: false,
      addAdministrator: false,
      addModerator: false,
    };

    this.viewTheme = { ...theme, ...this.props.theme };
    this.sheetRef = React.createRef(null);
  }

  componentDidMount() {
    this.setState({
      memberList: [],
      administratorsList: [],
      moderatorsList: [],
      bannedMemberList: [],
    });

    const { guid } = this.props.item;
    this.GroupDetailManager = new GroupDetailManager(guid);
    this.getGroupMembers();
    this.getBannedGroupMembers();
    this.GroupDetailManager.attachListeners(this.groupUpdated);
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.open && this.props.open) {
      this.sheetRef.current.snapTo(0);

      const { guid } = this.props.item;
      if (this.GroupDetailManager) {
        this.GroupDetailManager.removeListeners();
      }
      this.GroupDetailManager = new GroupDetailManager(guid);

      this.setState({
        memberList: [],
        administratorsList: [],
        moderatorsList: [],
        bannedMemberList: [],
      });
      this.getGroupMembers();
      this.getBannedGroupMembers();
      this.GroupDetailManager.attachListeners(this.groupUpdated);
    }
  }

  componentWillUnmount() {
    this.GroupDetailManager.removeListeners();
    this.GroupDetailManager = null;
  }

  /**
   * updates the group based on the key.
   * @param key: type enums
   * @param message: message object
   * @param options: options for user.
   * @param actionBy: object, defines the action taken by which user.
   */

  groupUpdated = (key, message, group, options, actionBy) => {
    try {
      const { guid } = this.props.item;
      if (guid !== group.guid) {
        return false;
      }

      switch (key) {
        case enums.USER_ONLINE:
        case enums.USER_OFFLINE:
          this.groupMemberUpdated(options.user);
          break;
        case enums.GROUP_MEMBER_ADDED:
        case enums.GROUP_MEMBER_JOINED:
          {
            const member = options.user;
            const updatedMember = {
              ...member,
              scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
            };
            if (this.props.loggedInUser.uid !== updatedMember.uid) {
              this.addParticipants([updatedMember], false);
            }
          }
          break;
        case enums.GROUP_MEMBER_LEFT:
        case enums.GROUP_MEMBER_KICKED:
          {
            const member = options.user;
            if (this.props.loggedInUser.uid !== member.uid) {
              this.removeParticipants(member, false);
            }
          }
          break;
        case enums.GROUP_MEMBER_BANNED:
          {
            const member = options.user;
            if (this.props.loggedInUser.uid !== actionBy.uid) {
              this.banMembers([member], false);
              this.removeParticipants(member, false);
            }
          }
          break;
        case enums.GROUP_MEMBER_UNBANNED:
          {
            const member = options.user;
            if (this.props.loggedInUser.uid !== actionBy.uid) {
              this.unbanMembers([member], false);
            }
          }
          break;
        case enums.GROUP_MEMBER_SCOPE_CHANGED:
          {
            const member = options.user;
            const updatedMember = { ...member, scope: options.scope };
            this.updateParticipants(updatedMember, false);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * updates the memberList and bannedMemberList based on updation of userObject.
   * @param member
   */

  groupMemberUpdated = (member) => {
    try {
      const memberList = [...this.state.memberList];
      // search for user
      const memberKey = memberList.findIndex((m) => m.uid === member.uid);
      // if found in the list, update user object
      if (memberKey > -1) {
        const memberObj = memberList[memberKey];
        const newMemberObj = { ...memberObj, ...member };
        memberList.splice(memberKey, 1, newMemberObj);

        this.setState({ memberList });
      }

      const bannedMemberList = [...this.state.bannedMemberList];
      // search for user
      const bannedMemberKey = bannedMemberList.findIndex(
        (m) => m.uid === member.uid,
      );
      // if found in the list, update user object
      if (bannedMemberKey > -1) {
        const bannedMemberObj = bannedMemberList[bannedMemberKey];
        const newBannedMemberObj = { ...bannedMemberObj, ...member };
        bannedMemberList.splice(bannedMemberKey, 1, newBannedMemberObj);

        this.setState({ bannedMemberList });
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * fetches the group members and provides with their scopes
   * @param
   */

  getGroupMembers = () => {
    const administratorsList = [];
    const moderatorsList = [];
    new CometChatManager()
      .getLoggedInUser()
      .then((user) => {
        this.loggedInUser = user;
        this.GroupDetailManager.fetchNextGroupMembers()
          .then((groupMembers) => {
            groupMembers.forEach((member) => {
              if (member.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
                administratorsList.push(member);
              }

              if (member.scope === CometChat.GROUP_MEMBER_SCOPE.MODERATOR) {
                moderatorsList.push(member);
              }
            });
            this.setState({
              memberList: [...this.state.memberList, ...groupMembers],
              administratorsList: [
                ...this.state.administratorsList,
                ...administratorsList,
              ],
              moderatorsList: [...this.state.moderatorsList, ...moderatorsList],
            });
          })
          .catch((error) => {
            logger(
              '[CometChatGroupDetails] getGroupMembers fetchNextGroupMembers error',
              error,
            );
            const errorCode = error?.message || 'ERROR';
            this.dropDownAlertRef?.showMessage('error', errorCode);
          });
      })
      .catch((error) => {
        logger(
          '[CometChatGroupDetails] getGroupMembers getLoggedInUser error',
          error,
        );
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
      });
  };

  /**
   * fetches the members who are banned.
   * @param
   */

  getBannedGroupMembers = () => {
    if (this.props.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
      return false;
    }

    new CometChatManager()
      .getLoggedInUser()
      .then(() => {
        this.GroupDetailManager.fetchNextBannedGroupMembers()
          .then((bannedMembers) => {
            this.setState({
              bannedMemberList: [
                ...this.state.bannedMemberList,
                ...bannedMembers,
              ],
            });
          })
          .catch((error) => {
            logger(
              '[CometChatGroupDetails] getGroupMembers fetchNextGroupMembers error',
              error,
            );
            const errorCode = error?.message || 'ERROR';
            this.dropDownAlertRef?.showMessage('error', errorCode);
          });
      })
      .catch((error) => {
        logger(
          '[CometChatGroupDetails] getGroupMembers getLoggedInUser error',
          error,
        );
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
      });
  };

  /**
   * handles the deletion of the group.
   * @param
   */

  deleteGroup = () => {
    const item = { ...this.props.item };
    const { guid } = item;
    CometChat.deleteGroup(guid)
      .then((response) => {
        if (response) {
          this.dropDownAlertRef?.showMessage(
            'success',
            'Group deleted Successfully',
          );
          this.props.actionGenerated(actions.GROUP_DELETED, item);
        } else {
          this.dropDownAlertRef?.showMessage('error', 'Failed to delete group');
        }
      })
      .catch((error) => {
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
        logger('Group delete failed with exception:', error);
      });
  };

  /**
   * allows the logged in user to leave the group
   * @param
   */

  leaveGroup = () => {
    try {
      const item = { ...this.props.item };
      const { guid } = item;
      CometChat.leaveGroup(guid)
        .then((response) => {
          if (response) {
            this.dropDownAlertRef?.showMessage(
              'success',
              'Group left successfully',
            );
            this.props.actionGenerated(actions.LEFT_GROUP, item);
          } else {
            this.dropDownAlertRef?.showMessage(
              'error',
              'Failed to leave group',
            );
          }
        })
        .catch((error) => {
          logger('Group leaving failed with exception:', error);

          const errorCode = error?.message || 'ERROR';
          this.dropDownAlertRef?.showMessage('error', errorCode);
        });
    } catch (error) {
      const errorCode = error?.message || 'ERROR';
      this.dropDownAlertRef?.showMessage('error', errorCode);
      logger(error);
    }
  };

  /**
   * handles the action to be taken and provide required screen.
   * @param action
   * @param flag
   */

  clickHandler = (action, flag) => {
    switch (action) {
      case VIEW_MEMBER:
        this.setState({ viewMember: flag });
        break;
      case ADD_MEMBER:
        this.setState({ addMember: flag });
        break;
      case BAN_MEMBER:
        this.setState({ banMember: flag });
        break;
      default:
        break;
    }
  };

  /**
   * handles the various actions for the members of the group
   * @param action
   * @param member
   */

  membersActionHandler = (action, members) => {
    switch (action) {
      case actions.BAN_GROUP_MEMBERS:
        this.banMembers([members]);
        break;
      case actions.UNBAN_GROUP_MEMBERS:
        this.unbanMembers(members);
        break;
      case actions.ADD_GROUP_PARTICIPANTS:
        this.addParticipants(members);
        break;
      case actions.REMOVE_GROUP_PARTICIPANTS:
        this.removeParticipants(members);
        break;
      case actions.UPDATE_GROUP_PARTICIPANTS:
        this.updateParticipants(members);
        break;
      case actions.FETCH_GROUP_MEMBERS:
        this.getGroupMembers();
        break;
      case actions.FETCH_BANNED_MEMBERS:
        this.getBannedGroupMembers();
        break;
      default:
        break;
    }
  };

  /**
   * handles the banning of members
   * @param members
   * @param triggerUpdate
   */

  banMembers = (members, triggerUpdate = true) => {
    try {
      const newMembersList = this.state.memberList.filter((bannedmember) => {
        const found = members.find((member) => bannedmember.uid === member.uid);
        if (found) {
          return false;
        }
        return true;
      });

      this.setState({
        bannedMemberList: [...this.state.bannedMemberList, ...members],
        memberList: newMembersList,
      });

      if (triggerUpdate) {
        this.props.actionGenerated(actions.MEMBER_BANNED, members);
        this.props.actionGenerated(
          actions.MEMBERS_UPDATED,
          this.props.item,
          newMembersList.length,
        );
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handles the unbanning of members from the group.
   * @param members
   * @param triggerUpdate
   */

  unbanMembers = (members, triggerUpdate = true) => {
    try {
      const bannedMembers = [...this.state.bannedMemberList];
      const unbannedMembers = [];

      const filteredBannedMembers = bannedMembers.filter((bannedmember) => {
        const found = members.find((member) => bannedmember.uid === member.uid);
        if (found) {
          unbannedMembers.push(found);
          return false;
        }
        return true;
      });

      this.setState({
        bannedMemberList: [...filteredBannedMembers],
      });

      if (triggerUpdate) {
        this.props.actionGenerated(actions.MEMBER_UNBANNED, unbannedMembers);
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handles the addition of participants
   * @param members
   * @param triggerUpdate
   */

  addParticipants = (members, triggerUpdate = true) => {
    try {
      const memberList = [...this.state.memberList, ...members];

      this.setState({
        memberList,
      });
      if (triggerUpdate) {
        this.props.actionGenerated(actions.MEMBERS_ADDED, members);
        this.props.actionGenerated(
          actions.MEMBERS_UPDATED,
          this.props.item,
          memberList.length,
        );
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handles the removing of participants from the group.
   * @param member
   * @param triggerUpdate
   */

  removeParticipants = (member, triggerUpdate = true) => {
    try {
      const groupmembers = [...this.state.memberList];
      const filteredMembers = groupmembers.filter((groupmember) => {
        if (groupmember.uid === member.uid) {
          return false;
        }
        return true;
      });

      this.setState({ memberList: filteredMembers });
      if (triggerUpdate) {
        this.props.actionGenerated(actions.MEMBERS_REMOVED, [member]);
        this.props.actionGenerated(
          actions.MEMBERS_UPDATED,
          this.props.item,
          filteredMembers.length,
        );
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handles the updation of members when their scope is changed.
   * @param updatedMember: member object
   * @param triggerUpdate
   */

  updateParticipants = (updatedMember, triggerUpdate = true) => {
    try {
      const memberList = [...this.state.memberList];

      const memberKey = memberList.findIndex(
        (member) => member.uid === updatedMember.uid,
      );
      if (memberKey > -1) {
        const memberObj = memberList[memberKey];
        const newMemberObj = {
          ...memberObj,
          ...updatedMember,
          scope: updatedMember.scope,
        };

        memberList.splice(memberKey, 1, newMemberObj);

        if (triggerUpdate) {
          this.props.actionGenerated(actions.MEMBER_SCOPE_CHANGED, [
            newMemberObj,
          ]);
        }
        this.setState({ memberList });
      }
    } catch (error) {
      logger(error);
    }
  };

  render() {
    let viewMembersBtn = (
      <TouchableOpacity
        onPress={() => {
          this.clickHandler(VIEW_MEMBER, true);
        }}>
        <Text
          style={[
            style.itemLinkStyle,
            { color: this.viewTheme.color.primary },
          ]}>
          View members
        </Text>
      </TouchableOpacity>
    );
    let addMembersBtn = null;
    let deleteGroupBtn = null;
    let bannedMembersBtn = null;
    if (this.props.item.scope === CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
      addMembersBtn = (
        <TouchableOpacity
          onPress={() => {
            this.clickHandler(ADD_MEMBER, true);
          }}>
          <Text
            style={[
              style.itemLinkStyle,
              { color: this.viewTheme.color.primary },
            ]}>
            Add members
          </Text>
        </TouchableOpacity>
      );

      deleteGroupBtn = (
        <TouchableOpacity
          onPress={() => {
            this.deleteGroup();
          }}>
          <Text
            style={[style.itemLinkStyle, { color: this.viewTheme.color.red }]}>
            Delete and exit
          </Text>
        </TouchableOpacity>
      );
    }

    if (this.props.item.scope !== CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
      bannedMembersBtn = (
        <TouchableOpacity
          onPress={() => {
            this.clickHandler(BAN_MEMBER, true);
          }}>
          <Text
            style={[
              style.itemLinkStyle,
              { color: this.viewTheme.color.primary },
            ]}>
            Banned members
          </Text>
        </TouchableOpacity>
      );
    }
    let leaveGroupBtn = null;
    if (this.props.item.scope !== CometChat.GROUP_MEMBER_SCOPE.ADMIN) {
      leaveGroupBtn = (
        <TouchableOpacity
          onPress={() => {
            this.leaveGroup();
          }}>
          <Text
            style={[
              style.itemLinkStyle,
              { color: this.viewTheme.color.primary },
            ]}>
            Leave group
          </Text>
        </TouchableOpacity>
      );
    }

    let sharedMediaView = (
      <CometChatSharedMedia
        theme={this.props.theme}
        item={this.props.item}
        type={this.props.type}
        lang={this.props.lang}
        containerHeight="225px"
        showMessage={(type, message) => {
          this.dropDownAlertRef?.showMessage(type, message);
        }}
      />
    );

    let members = (
      <View style={style.fullWidth}>
        <Text style={[style.sectionHeaderStyle]}>Members</Text>
        <View style={style.listItemContainer}>
          {viewMembersBtn}
          {addMembersBtn}
          {bannedMembersBtn}
        </View>
      </View>
    );

    let options = (
      <View style={style.fullWidth}>
        <Text
          style={[style.sectionHeaderStyle, { color: theme.color.helpText }]}>
          Options
        </Text>
        <View style={style.listItemContainer}>
          {leaveGroupBtn}
          {deleteGroupBtn}
        </View>
      </View>
    );

    if (
      viewMembersBtn === null &&
      addMembersBtn === null &&
      bannedMembersBtn === null
    ) {
      members = null;
    }

    if (leaveGroupBtn === null && deleteGroupBtn === null) {
      options = null;
    }

    let viewMembers = null;
    if (this.state.viewMember) {
      viewMembers = (
        <CometChatViewGroupMemberList
          theme={this.props.theme}
          item={this.props.item}
          open={this.state.viewMember}
          close={() => this.clickHandler(VIEW_MEMBER, false)}
          actionGenerated={this.membersActionHandler}
          loggedInUser={this.loggedInUser}
        />
      );
    }

    let addMembers = null;
    if (this.state.addMember) {
      addMembers = (
        <CometChatAddGroupMemberList
          theme={this.props.theme}
          item={this.props.item}
          open={this.state.addMember}
          close={() => this.clickHandler(ADD_MEMBER, false)}
          actionGenerated={this.membersActionHandler}
        />
      );
    }

    let bannedMembers = null;
    if (this.state.banMember) {
      bannedMembers = (
        <CometChatBanGroupMemberList
          theme={this.props.theme}
          item={this.props.item}
          open={this.state.banMember}
          close={() => this.clickHandler(BAN_MEMBER, false)}
          actionGenerated={this.membersActionHandler}
          loggedInUser={this.loggedInUser}
        />
      );
    }

    return (
      <Modal
        transparent
        animated
        animationType="fade"
        visible={this.props.open}>
        <View style={style.container}>
          <BottomSheet
            ref={this.sheetRef}
            snapPoints={[deviceHeight - 80, 0]}
            borderRadius={30}
            initialSnap={0}
            enabledInnerScrolling={false}
            enabledContentTapInteraction
            overdragResistanceFactor={10}
            renderContent={() => {
              return (
                <View style={style.reactionDetailsContainer}>
                  <GroupDetailContext.Provider
                    value={{
                      memberList: this.state.memberList,
                      bannedMemberList: this.state.bannedMemberList,
                      administratorsList: this.state.administratorsList,
                      moderatorsList: this.state.moderatorsList,
                      loggedinuser: this.loggedInUser,
                      item: this.props.item,
                    }}>
                    <View
                      style={[
                        style.headerStyle,
                        { borderColor: this.viewTheme.borderColor.primary },
                      ]}>
                      <TouchableOpacity
                        style={style.headerCloseStyle}
                        onPress={() =>
                          this.props.actionGenerated(actions.CLOSE_DETAIL)
                        }>
                        <Icon
                          name="keyboard-arrow-left"
                          size={24}
                          color="#000000"
                          style={style.closeIcon}
                        />
                      </TouchableOpacity>
                      <Text style={style.headerTitleStyle}>Details</Text>
                    </View>
                    <View style={style.detailContainer}>
                      {members}
                      {options}
                      {sharedMediaView}
                    </View>
                    {viewMembers}
                    {addMembers}
                    {bannedMembers}
                  </GroupDetailContext.Provider>
                </View>
              );
            }}
            onCloseEnd={() => {
              this.props.actionGenerated(actions.CLOSE_DETAIL);
            }}
          />
        </View>
        <DropDownAlert ref={(ref) => (this.dropDownAlertRef = ref)} />
      </Modal>
    );
  }
}
