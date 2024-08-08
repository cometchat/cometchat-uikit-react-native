import {
  GroupMemberScope,
  GroupMemberOptionConstants,
  UserStatusConstants,
  GroupMemberOptionBan,
  GroupMemberOptionKick,
  GroupOptionConstants,
} from '../../constants/UIKitConstants';

import { CometChatDetailsOption, CometChatOptions, CometChatDetailsTemplate } from '../../modals';
import { localize } from '../../resources/CometChatLocalize';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { ICONS } from "./resources";
import { CometChatTheme } from '../../resources/CometChatTheme';

export const getDefaultDetailsTemplate = (loggedInUser: CometChat.User, user: CometChat.User | null = null, group: CometChat.Group | null = null, theme: CometChatTheme = new CometChatTheme({})) : Array<CometChatDetailsTemplate> => {
  if (user){
    return [getSecondaryDetailsTemplate(loggedInUser, user, group, theme) ?? {} as CometChatDetailsTemplate];
  } else if (group){
    return [
      getPrimaryDetailsTemplate(loggedInUser, user, group, theme) ?? {} as CometChatDetailsTemplate,
      getSecondaryDetailsTemplate(loggedInUser, user, group, theme) ?? {} as CometChatDetailsTemplate,
    ];
  } else {
    return [];
  }
};

const getBlockUnblockUserOption = (user: CometChat.User, theme: CometChatTheme = new CometChatTheme({})) => {
  if (user.getBlockedByMe()){
    return {
      id: UserStatusConstants.blocked,
      title: localize('UNBLOCK_USER'),
      Tail: () => null,
      titleStyle: { color: theme?.palette?.getError() ?? 'red' },
    } as unknown as CometChatDetailsOption;
  } else {
    return {
      id: UserStatusConstants.unblocked,
      title: localize('BLOCK_USER'),
      Tail: () => null,
      titleStyle: { color: theme?.palette?.getError() ?? 'red' },
    } as unknown as CometChatDetailsOption;
  }
};

const getPrimaryDetailsTemplate = (loggedInUser: CometChat.User, user: CometChat.User | null = null, group: CometChat.Group | null = null, theme: CometChatTheme = new CometChatTheme({})): CometChatDetailsTemplate | null => {
  if (user) {
    return null;
  } else if(group){
    return {
      id: 'primary',
      options: [
        getViewMembersOption(),
        getAddMembersOption(),
        getBannedMemberOption(),
      ].filter((template: CometChatDetailsOption) => {
        let scope = group?.getScope() ? group?.getScope() : GroupMemberScope.participant;
        let key = group.getOwner() == loggedInUser?.getUid() ? GroupMemberScope.owner : scope;
        return template && _allowedGroupDetailsOptions[key][template?.id as string]
      }),
    } as CometChatDetailsTemplate;
  } else {
    return null;
  }
};

const getSecondaryDetailsTemplate = (loggedInUser: CometChat.User, user: CometChat.User | null = null, group: CometChat.Group | null = null, theme: CometChatTheme = new CometChatTheme({})): CometChatDetailsTemplate | null => {
  if (user){
    return {
      id: 'userDetails',
      options: [getBlockUnblockUserOption(user, theme)],
    } as CometChatDetailsTemplate;
  } else if(group){
    return {
      id: 'secondary',
      options: [
        getLeaveGroupOption(theme),
        getDeleteGroupOption(theme),
      ].filter((template: CometChatDetailsOption) => {
        let scope = group?.getScope() ? group?.getScope() : GroupMemberScope.participant;
        let key = group.getOwner() == loggedInUser?.getUid() ? GroupMemberScope.owner : scope;
        return _allowedGroupDetailsOptions[key][template.id as string];
      }),
      title: 'MORE',
    } as CometChatDetailsTemplate;
  } else {
    return null;
  }
  
};

const getViewMembersOption = () => {
  return {
    id: GroupOptionConstants.viewMembers,
    title: localize('VIEW_MEMBERS'),
  } as CometChatDetailsOption;
};

const getAddMembersOption = () => {
  return {
    id: GroupOptionConstants.addMembers,
    title: localize('ADD_MEMBERS'),
  } as CometChatDetailsOption;
};

const getBannedMemberOption = () => {
  return {
    id: GroupOptionConstants.bannedMembers,
    title: localize('BANNED_MEMBERS'),
  } as CometChatDetailsOption;
};

const getLeaveGroupOption = (theme: CometChatTheme = new CometChatTheme({})) => {
  return {
    id: GroupOptionConstants.leave,
    title: localize('LEAVE_GROUP'),
    Tail: () => null,
    titleStyle: { color: theme?.palette?.getError() ?? 'red' },
  } as unknown as CometChatDetailsOption;
};

const getDeleteGroupOption = (theme: CometChatTheme = new CometChatTheme({})) => {
  return {
    id: GroupOptionConstants.delete,
    title: localize('DELETE_AND_EXIT'),
    Tail: () => null,
    titleStyle: { color: theme?.palette?.getError() ?? 'red' },
  } as unknown as CometChatDetailsOption;
};

export const getCometChatDetailsTemplate = (
  props: CometChatDetailsTemplate
) => {
  return props;
};

export const getDefaultGroupMemberOptions = (group: CometChat.Group | any, groupMember: CometChat.GroupMember | any, theme: CometChatTheme) => {
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

var _allowedGroupMemberOptions: any = new Map();

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

const _allowedGroupDetailsOptions: { [key: string]: { [key: string]: boolean } } = {
  [GroupMemberScope.participant]: {
    [GroupOptionConstants.leave]: true,
    [GroupOptionConstants.bannedMembers]: false,
    [GroupOptionConstants.viewMembers]: true,
    [GroupOptionConstants.addMembers]: false,
    [GroupOptionConstants.delete]: false,
  },
  [GroupMemberScope.moderator]: {
    [GroupOptionConstants.leave]: true,
    [GroupOptionConstants.bannedMembers]: true,
    [GroupOptionConstants.viewMembers]: true,
    [GroupOptionConstants.addMembers]: false,
    [GroupOptionConstants.delete]: false,
  },
  [GroupMemberScope.admin]: {
    [GroupOptionConstants.leave]: true,
    [GroupOptionConstants.bannedMembers]: true,
    [GroupOptionConstants.viewMembers]: true,
    [GroupOptionConstants.addMembers]: true,
    [GroupOptionConstants.delete]: false,
  },
  [GroupMemberScope.owner]: {
    [GroupOptionConstants.leave]: true,
    [GroupOptionConstants.bannedMembers]: true,
    [GroupOptionConstants.viewMembers]: true,
    [GroupOptionConstants.addMembers]: true,
    [GroupOptionConstants.delete]: true,
  },
};