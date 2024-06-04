import {
  GroupMemberScope,
  GroupMemberOptionConstants,
  UserStatusConstants,
  GroupMemberOptionBan,
  GroupMemberOptionKick,
} from '../../constants/UIKitConstants';

import { CometChatDetailsOption, CometChatOptions, CometChatDetailsTemplate } from '../../modals';
import { localize } from '../../resources/CometChatLocalize';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { ICONS } from "./resources";
import { CometChatTheme } from '../../resources/CometChatTheme';
export const getDefaultDetailsTemplate = ({ loggedInUser, user, group, theme }) => {
  if (user) return [getSecondaryDetailsTemplate({ loggedInUser, user, group, theme })];
  return [
    getPrimaryDetailsTemplate({ loggedInUser, user, group, theme }),
    getSecondaryDetailsTemplate({ loggedInUser, user, group, theme }),
  ];
};

const validateDetailOptions = ({ loggedInUser, group, optionId }) => {
  if (optionId === GroupMemberOptionConstants.view) return true;
  let isValid = validateGroupMemberOptions(
    loggedInUser.uid === group.owner
      ? GroupMemberScope.owner
      : group.scope,
    group.scope,
    optionId
  );
  return isValid;
};

const getBlockUnblockUserOption = ({ user, theme }) => {
  if (user.blockedByMe)
    return getCometChatDetailsOption({
      id: UserStatusConstants.blocked,
      title: localize('UNBLOCK_USER'),
      Tail: () => null,
      titleStyle: { color: theme?.palette?.getError() ?? 'red' },
    });
  return getCometChatDetailsOption({
    id: UserStatusConstants.unblocked,
    title: localize('BLOCK_USER'),
    Tail: () => null,
    titleStyle: { color: theme?.palette?.getError() ?? 'red' },
  });
};

const getPrimaryDetailsTemplate = ({ loggedInUser, user, group, theme }) => {
  if (user) return null;
  return getCometChatDetailsTemplate({
    id: 'primary',
    options: [
      getViewMembersOption(),
      getAddMembersOption(),
      getBannedMemberOption(),
    ].filter((item) =>
      validateDetailOptions({ loggedInUser, group, optionId: item.id })
    ),
  });
};
const getSecondaryDetailsTemplate = ({ loggedInUser, user, group, theme }) => {
  if (user)
    return getCometChatDetailsTemplate({
      id: 'userDetails',
      options: [getBlockUnblockUserOption({ user, theme })],
    });
  return getCometChatDetailsTemplate({
    id: 'secondary',
    options: [
      getLeaveGroupOption({ theme }),
      getDeleteGroupOption({ theme }),
    ].filter((item) =>
      validateDetailOptions({ loggedInUser, group, optionId: item.id })
    ),
    title: 'MORE',
  });
};

const getViewMembersOption = () => {
  return getCometChatDetailsOption({
    id: GroupMemberOptionConstants.view,
    title: localize('VIEW_MEMBERS'),
  });
};

const getAddMembersOption = () => {
  return getCometChatDetailsOption({
    id: GroupMemberOptionConstants.addMembers,
    title: localize('ADD_MEMBERS'),
  });
};

const getBannedMemberOption = () => {
  return getCometChatDetailsOption({
    id: GroupMemberOptionConstants.ban,
    title: localize('BANNED_MEMBERS'),
  });
};

const getLeaveGroupOption = ({ theme }) => {
  return getCometChatDetailsOption({
    id: GroupMemberOptionConstants.leave,
    title: localize('LEAVE_GROUP'),
    Tail: () => null,
    titleStyle: { color: theme?.palette?.getError() ?? 'red' },
  });
};
const getDeleteGroupOption = ({ theme }) => {
  return getCometChatDetailsOption({
    id: GroupMemberOptionConstants.deleteGroup,
    title: localize('DELETE_AND_EXIT'),
    Tail: () => null,
    titleStyle: { color: theme?.palette?.getError() ?? 'red' },
  });
};
export const getCometChatDetailsTemplate = (
  props: CometChatDetailsTemplate
) => {
  return props;
};

export const getDefaultGroupMemberOptions = (group: CometChat.Group, groupMember: CometChat.GroupMember, theme: CometChatTheme) => {
  let arr: CometChatOptions[] = [];
  if (validateGroupMemberOptions(group['scope'], groupMember['scope'], GroupMemberOptionBan))
    arr.push({
      icon: ICONS.banIcon,
      backgroundColor: "rgb(255, 201, 0)",
      id: GroupMemberOptionConstants.ban,
      iconTint: theme?.palette.getSecondary(),
    });
  if (validateGroupMemberOptions(group['scope'], groupMember['scope'], GroupMemberOptionKick))
    arr.push(
      {
        icon: ICONS.kickIcon,
        backgroundColor: theme?.palette.getError(),
        id: GroupMemberOptionConstants.kick,
        iconTint: theme?.palette?.getSecondary(),
      })
  return arr;
}

export const getCometChatDetailsOption = (props: CometChatDetailsOption) => {
  return props;
};

export function validateGroupMemberOptions(
  loggedInUserScope: string,
  memberScope: string,
  optionId: string
) {
  let options = _allowedGroupMemberOptions[loggedInUserScope + memberScope];
  if (options && optionId) return options[optionId];
  if (options && !optionId) return options;
  return undefined;
}

var _allowedGroupMemberOptions = new Map();

//participant
_allowedGroupMemberOptions[
  GroupMemberScope.participant + GroupMemberScope.participant
] = {
  kick: false,
  ban: false,
  unban: false,
  changeScope: [],
  addMembers: false,
  deleteGroup: false,
  leave: true,
};
_allowedGroupMemberOptions[
  GroupMemberScope.participant + GroupMemberScope.moderator
] = {
  kick: false,
  ban: false,
  unban: false,
  changeScope: [],
  addMembers: false,
  deleteGroup: false,
  leave: true,
};
_allowedGroupMemberOptions[
  GroupMemberScope.participant + GroupMemberScope.admin
] = {
  kick: false,
  ban: false,
  unban: false,
  changeScope: [],
  addMembers: false,
  deleteGroup: false,
  leave: true,
};
_allowedGroupMemberOptions[
  GroupMemberScope.participant + GroupMemberScope.owner
] = {
  kick: false,
  ban: false,
  unban: false,
  changeScope: [],
  addMembers: false,
  deleteGroup: false,
  leave: true,
};

//moderator
_allowedGroupMemberOptions[
  GroupMemberScope.moderator + GroupMemberScope.participant
] = {
  kick: true,
  ban: true,
  unban: true,
  changeScope: [GroupMemberScope.moderator, GroupMemberScope.participant],
  addMembers: false,
  deleteGroup: false,
  leave: true,
};
_allowedGroupMemberOptions[
  GroupMemberScope.moderator + GroupMemberScope.moderator
] = {
  kick: false,
  ban: false,
  unban: true,
  changeScope: [GroupMemberScope.moderator, GroupMemberScope.participant],
  addMembers: false,
  deleteGroup: false,
  leave: true,
};
_allowedGroupMemberOptions[
  GroupMemberScope.moderator + GroupMemberScope.admin
] = {
  kick: false,
  ban: false,
  unban: true,
  changeScope: [],
  addMembers: false,
  deleteGroup: false,
  leave: true,
};
_allowedGroupMemberOptions[
  GroupMemberScope.moderator + GroupMemberScope.owner
] = {
  kick: false,
  ban: false,
  unban: true,
  changeScope: [],
  addMembers: false,
  deleteGroup: false,
  leave: true,
};

//admin
_allowedGroupMemberOptions[
  GroupMemberScope.admin + GroupMemberScope.participant
] = {
  kick: true,
  ban: true,
  unban: true,
  changeScope: [
    GroupMemberScope.admin,
    GroupMemberScope.moderator,
    GroupMemberScope.participant,
  ],
  addMembers: true,
  deleteGroup: false,
  leave: true,
};
_allowedGroupMemberOptions[
  GroupMemberScope.admin + GroupMemberScope.moderator
] = {
  kick: true,
  ban: true,
  unban: true,
  changeScope: [
    GroupMemberScope.admin,
    GroupMemberScope.moderator,
    GroupMemberScope.participant,
  ],
  addMembers: true,
  deleteGroup: false,
  leave: true,
};
_allowedGroupMemberOptions[GroupMemberScope.admin + GroupMemberScope.admin] = {
  kick: false,
  ban: false,
  unban: true,
  changeScope: [
    GroupMemberScope.admin,
    GroupMemberScope.moderator,
    GroupMemberScope.participant,
  ],
  addMembers: true,
  deleteGroup: false,
  leave: true,
};
_allowedGroupMemberOptions[GroupMemberScope.admin + GroupMemberScope.owner] = {
  kick: false,
  ban: false,
  unban: true,
  changeScope: [],
  addMembers: true,
  deleteGroup: false,
  leave: true,
};

//owner
_allowedGroupMemberOptions[
  GroupMemberScope.owner + GroupMemberScope.participant
] = {
  kick: true,
  ban: true,
  unban: true,
  changeScope: [
    GroupMemberScope.admin,
    GroupMemberScope.moderator,
    GroupMemberScope.participant,
  ],
  addMembers: true,
  deleteGroup: true,
  leave: true,
  transferOwnership: true,
};
_allowedGroupMemberOptions[
  GroupMemberScope.owner + GroupMemberScope.moderator
] = {
  kick: true,
  ban: true,
  unban: true,
  changeScope: [
    GroupMemberScope.admin,
    GroupMemberScope.moderator,
    GroupMemberScope.participant,
  ],
  addMembers: true,
  deleteGroup: true,
  leave: true,
  transferOwnership: true,
};
_allowedGroupMemberOptions[GroupMemberScope.owner + GroupMemberScope.admin] = {
  kick: true,
  ban: true,
  unban: true,
  changeScope: [
    GroupMemberScope.admin,
    GroupMemberScope.moderator,
    GroupMemberScope.participant,
  ],
  addMembers: true,
  deleteGroup: true,
  leave: true,
  transferOwnership: true,
};
