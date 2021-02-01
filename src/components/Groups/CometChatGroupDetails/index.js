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
import {
  CometChatAddGroupMemberList,
  CometChatViewGroupMemberList,
  CometChatBanGroupMemberList,
} from '../index';
import { validateWidgetSettings } from '../../../utils/common';

export default class CometChatGroupDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
      memberlist: [],
      bannedmemberlist: [],
      administratorslist: [],
      moderatorslist: [],
      viewMember: false,
      addMember: false,
      banMember: false,
      addAdministrator: false,
      addModerator: false,
    };

    this.ViewTheme = { ...theme, ...this.props.theme };
    this.sheetRef = React.createRef(null);
  }

  componentDidMount() {
    this.setState({
      memberlist: [],
      administratorslist: [],
      moderatorslist: [],
      bannedmemberlist: [],
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
      if(this.GroupDetailManager){
        this.GroupDetailManager.removeListeners();
      }
      this.GroupDetailManager = new GroupDetailManager(guid);

      this.setState({
        memberlist: [],
        administratorslist: [],
        moderatorslist: [],
        bannedmemberlist: [],
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

  groupUpdated = (key, message, group, options, actionBy) => {
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
          // this.setAvatar(member);

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
          // this.setAvatar(member);
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
  };

  groupMemberUpdated = (member) => {
    const memberlist = [...this.state.memberlist];
    // search for user
    const memberKey = memberlist.findIndex((m) => m.uid === member.uid);
    // if found in the list, update user object
    if (memberKey > -1) {
      const memberObj = memberlist[memberKey];
      const newMemberObj = { ...memberObj, ...member };
      memberlist.splice(memberKey, 1, newMemberObj);

      this.setState({ memberlist });
    }

    const bannedmemberlist = [...this.state.bannedmemberlist];
    // search for user
    const bannedMemberKey = bannedmemberlist.findIndex(
      (m) => m.uid === member.uid,
    );
    // if found in the list, update user object
    if (bannedMemberKey > -1) {
      const bannedMemberObj = bannedmemberlist[bannedMemberKey];
      const newBannedMemberObj = { ...bannedMemberObj, ...member };
      bannedmemberlist.splice(bannedMemberKey, 1, newBannedMemberObj);

      this.setState({ bannedmemberlist });
    }
  };

  getGroupMembers = () => {
    const administratorslist = [];
    const moderatorslist = [];
    new CometChatManager()
      .getLoggedInUser()
      .then((user) => {
        this.loggedInUser = user;
        this.GroupDetailManager.fetchNextGroupMembers()
          .then((groupMembers) => {
            groupMembers.forEach((member) => {
              // this.setAvatar(member);

              if (member.scope === 'admin') {
                administratorslist.push(member);
              }

              if (member.scope === 'moderator') {
                moderatorslist.push(member);
              }
            });
            this.setState({
              memberlist: [...this.state.memberlist, ...groupMembers],
              administratorslist: [
                ...this.state.administratorslist,
                ...administratorslist,
              ],
              moderatorslist: [...this.state.moderatorslist, ...moderatorslist],
            });
          })
          .catch(() => {
            // console.error(
            //   '[CometChatGroupDetails] getGroupMembers fetchNextGroupMembers error',
            //   error
            // );
          });
      })
      .catch(() => {
        // console.log('[CometChatGroupDetails] getGroupMembers getLoggedInUser error', error);
      });
  };

  getBannedGroupMembers = () => {
    if (this.props.item.scope === CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
      return false;
    }

    new CometChatManager()
      .getLoggedInUser()
      .then(() => {
        this.GroupDetailManager.fetchNextBannedGroupMembers()
          .then((bannedMembers) => {
            // bannedMembers.forEach(member => this.setAvatar(member));

            this.setState({
              bannedmemberlist: [
                ...this.state.bannedmemberlist,
                ...bannedMembers,
              ],
            });
          })
          .catch(() => {
            // console.error(
            //   '[CometChatGroupDetails] getGroupMembers fetchNextGroupMembers error',
            //   error
            // );
          });
      })
      .catch(() => {
        // console.log('[CometChatGroupDetails] getGroupMembers getLoggedInUser error', error);
      });
  };

  deleteGroup = () => {
    const item = { ...this.props.item };
    const { guid } = item;
    CometChat.deleteGroup(guid)
      .then(() => {
        // console.log('Groups deleted successfully:', response);
        this.props.actionGenerated('groupDeleted', item);
      })
      .catch(() => {
        // console.log('Group delete failed with exception:', error);
      });
  };

  leaveGroup = () => {
    const item = { ...this.props.item };
    const { guid } = item;
    CometChat.leaveGroup(guid)
      .then(() => {
        // console.log('Group left successfully:', hasLeft);
        this.props.actionGenerated('leftGroup', item);
      })
      .catch(() => {
        // console.log('Group leaving failed with exception:', error);
      });
  };

  clickHandler = (action, flag) => {
    switch (action) {
      case 'viewmember':
        this.setState({ viewMember: flag });
        break;
      case 'addmember':
        this.setState({ addMember: flag });
        break;
      case 'banmember':
        this.setState({ banMember: flag });
        break;
      default:
        break;
    }
  };

  membersActionHandler = (action, members) => {
    switch (action) {
      case 'banGroupMembers':
        this.banMembers([members]);
        break;
      case 'unbanGroupMembers':
        this.unbanMembers(members);
        break;
      case 'addGroupParticipants':
        this.addParticipants(members);
        break;
      case 'removeGroupParticipants':
        this.removeParticipants(members);
        break;
      case 'updateGroupParticipants':
        this.updateParticipants(members);
        break;
      case 'fetchGroupMembers':
        this.getGroupMembers();
        break;
      case 'fetchBannedMembers':
        this.getBannedGroupMembers();
        break;
      default:
        break;
    }
  };

  banMembers = (members, triggerUpdate = true) => {
    const newMembersList = this.state.memberlist.filter((bannedmember) => {
      const found = members.find((member) => bannedmember.uid === member.uid);
      if (found) {
        return false;
      }
      return true;
    });

    this.setState({
      bannedmemberlist: [...this.state.bannedmemberlist, ...members],
      memberlist: newMembersList,
    });

    if (triggerUpdate) {
      this.props.actionGenerated('memberBanned', members);
      this.props.actionGenerated(
        'membersUpdated',
        this.props.item,
        newMembersList.length,
      );
    }
  };

  unbanMembers = (members, triggerUpdate = true) => {
    const bannedMembers = [...this.state.bannedmemberlist];
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
      bannedmemberlist: [...filteredBannedMembers],
    });

    if (triggerUpdate) {
      this.props.actionGenerated('memberUnbanned', unbannedMembers);
    }
  };

  addParticipants = (members, triggerUpdate = true) => {
    const memberlist = [...this.state.memberlist, ...members];

    this.setState({
      memberlist,
    });
    if (triggerUpdate) {
      this.props.actionGenerated('membersAdded', members);
      this.props.actionGenerated(
        'membersUpdated',
        this.props.item,
        memberlist.length,
      );
    }
  };

  removeParticipants = (member, triggerUpdate = true) => {
    const groupmembers = [...this.state.memberlist];
    const filteredMembers = groupmembers.filter((groupmember) => {
      if (groupmember.uid === member.uid) {
        return false;
      }
      return true;
    });

    this.setState({ memberlist: filteredMembers });
    if (triggerUpdate) {
      this.props.actionGenerated('membersRemoved', [member]);
      this.props.actionGenerated(
        'membersUpdated',
        this.props.item,
        filteredMembers.length,
      );
    }
  };

  updateParticipants = (updatedMember, triggerUpdate) => {
    const memberlist = [...this.state.memberlist];

    const memberKey = memberlist.findIndex(
      (member) => member.uid === updatedMember.uid,
    );
    if (memberKey > -1) {
      const memberObj = memberlist[memberKey];
      const newMemberObj = {
        ...memberObj,
        ...updatedMember,
        scope: updatedMember.scope,
      };

      memberlist.splice(memberKey, 1, newMemberObj);

      if (triggerUpdate) {
        this.props.actionGenerated('memberScopeChanged', [newMemberObj]);
      }
      this.setState({ memberlist });
    }
  };

  render() {
    let viewMembersBtn = (
      <TouchableOpacity
        onPress={() => {
          this.clickHandler('viewmember', true);
        }}>
        <Text
          style={[
            style.itemLinkStyle,
            { color: this.ViewTheme.color.primary },
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
            this.clickHandler('addmember', true);
          }}>
          <Text
            style={[
              style.itemLinkStyle,
              { color: this.ViewTheme.color.primary },
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
            style={[style.itemLinkStyle, { color: this.ViewTheme.color.red }]}>
            Delete and exit
          </Text>
        </TouchableOpacity>
      );
    }

    if (this.props.item.scope !== CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) {
      bannedMembersBtn = (
        <TouchableOpacity
          onPress={() => {
            this.clickHandler('banmember', true);
          }}>
          <Text
            style={[
              style.itemLinkStyle,
              { color: this.ViewTheme.color.primary },
            ]}>
            Banned members
          </Text>
        </TouchableOpacity>
      );
    }

    let leaveGroupBtn = (
      <TouchableOpacity
        onPress={() => {
          this.leaveGroup();
        }}>
        <Text
          style={[
            style.itemLinkStyle,
            { color: this.ViewTheme.color.primary },
          ]}>
          Leave group
        </Text>
      </TouchableOpacity>
    );

    let sharedmediaView = (
      <CometChatSharedMedia
        theme={this.props.theme}
        item={this.props.item}
        type={this.props.type}
        lang={this.props.lang}
        containerHeight="225px"
        widgetsettings={this.props.widgetsettings}
      />
    );

    // if viewing, kicking/banning, promoting/demoting group membersare disabled in chatwidget
    if (
      validateWidgetSettings(
        this.props.widgetsettings,
        'view_group_members',
      ) === false &&
      validateWidgetSettings(
        this.props.widgetsettings,
        'allow_kick_ban_members',
      ) === false &&
      validateWidgetSettings(
        this.props.widgetsettings,
        'allow_promote_demote_members',
      ) === false
    ) {
      viewMembersBtn = null;
    }

    // if adding group members is disabled in chatwidget
    if (
      validateWidgetSettings(this.props.widgetsettings, 'allow_add_members') ===
      false
    ) {
      addMembersBtn = null;
    }

    // if kicking/banning/unbanning group members is disabled in chatwidget
    if (
      validateWidgetSettings(
        this.props.widgetsettings,
        'allow_kick_ban_members',
      ) === false
    ) {
      bannedMembersBtn = null;
    }

    // if deleting group is disabled in chatwidget
    if (
      validateWidgetSettings(
        this.props.widgetsettings,
        'allow_delete_groups',
      ) === false
    ) {
      deleteGroupBtn = null;
    }

    // if leaving group is disabled in chatwidget
    if (
      validateWidgetSettings(
        this.props.widgetsettings,
        'join_or_leave_groups',
      ) === false
    ) {
      leaveGroupBtn = null;
    }

    // if viewing shared media group is disabled in chatwidget
    if (
      validateWidgetSettings(this.props.widgetsettings, 'view_shared_media') ===
      false
    ) {
      sharedmediaView = null;
    }

    let members = (
      <View style={{ width: '100%' }}>
        <Text
          style={[
            style.sectionHeaderStyle,
            { color: this.ViewTheme.color.secondary },
          ]}>
          Members
        </Text>
        <View style={{ width: '100%', marginVertical: 6 }}>
          {viewMembersBtn}
          {addMembersBtn}
          {bannedMembersBtn}
        </View>
      </View>
    );

    let options = (
      <View style={{ width: '100%' }}>
        <Text
          style={[
            style.sectionHeaderStyle,
            { color: this.ViewTheme.color.secondary },
          ]}>
          Options
        </Text>
        <View style={{ width: '100%', marginVertical: 6 }}>
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
          close={() => this.clickHandler('viewmember', false)}
          widgetsettings={this.props.widgetsettings}
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
          close={() => this.clickHandler('addmember', false)}
          widgetsettings={this.props.widgetsettings}
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
          close={() => this.clickHandler('banmember', false)}
          widgetsettings={this.props.widgetsettings}
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <BottomSheet
            ref={this.sheetRef}
            snapPoints={[Dimensions.get('window').height - 80, 0]}
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
                      memberlist: this.state.memberlist,
                      bannedmemberlist: this.state.bannedmemberlist,
                      administratorslist: this.state.administratorslist,
                      moderatorslist: this.state.moderatorslist,
                      loggedinuser: this.loggedInUser,
                      item: this.props.item,
                    }}>
                    <View
                      style={[
                        style.headerStyle,
                        { borderColor: this.ViewTheme.borderColor.primary },
                      ]}>
                      <TouchableOpacity
                        style={style.headerCloseStyle}
                        onPress={() =>
                          this.props.actionGenerated('closeDetail')
                        }>
                        <Icon
                          name="keyboard-arrow-left"
                          size={24}
                          color="#000000"
                          style={{ marginRight: 5 }}
                        />
                      </TouchableOpacity>
                      <Text style={style.headerTitleStyle}>Details</Text>
                    </View>
                    <View style={{ padding: 16 }}>
                      {members}
                      {options}
                      {sharedmediaView}
                    </View>
                    {viewMembers}
                    {addMembers}
                    {bannedMembers}
                  </GroupDetailContext.Provider>
                </View>
              );
            }}
            onCloseEnd={() => {
              this.props.actionGenerated('closeDetail');
            }}
          />
        </View>
      </Modal>
    );
  }
}
