//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native'

export const USER_ONLINE_STATUS = 'online'
export const NO_USERS_FOUND = "no_users_found";
export const NO_DATA_FOUND = "no_data_found";
export const SOMETHING_WRONG = "something_wrong";
export const LOADING = "loading";
export const NO_GROUPS_FOUND = "no_groups_found";
export const ON_USER_ITEM_CLICK = 'onItemClick';
export const ON_USER_ERROR = 'onUserError';
export const ON_USER_BLOCK = 'onUserBlock';
export const ON_USER_UNBLOCK = 'onUserUnBlock';
export const USERS_CLICK_LISTENER_ID = 'clicklistener2';
export const USERS = 'Users';
export const SEARCH = 'Search';

export const CALL_INITIATED = CometChat.CALL_STATUS.INITIATED;
export const CALL_ONGOING = CometChat.CALL_STATUS.ONGOING;
export const CALL_REJECTED = CometChat.CALL_STATUS.REJECTED;
export const CALL_CANCELLED = CometChat.CALL_STATUS.CANCELLED;
export const CALL_BUSY = CometChat.CALL_STATUS.BUSY;
export const CALL_UNANSWERED = CometChat.CALL_STATUS.UNANSWERED;
export const CALL_ENDED = CometChat.CALL_STATUS.ENDED;

export const ON_INCOMING_CALL_RECEIVED = "onIncomingCallReceived";
export const ON_INCOMING_CALL_CANCELLED = "onIncomingCallCancelled";
export const ON_CUSTOM_MESSAGE_RECEIVED = "onCustomMessageReceived"
export const ON_MEDIA_MESSAGE_REVEIVED = "onMediaMessageReceived"
export const ON_MESSAGE_DELETED = "onMessageDeleted"
export const ON_MESSAGE_DELIVERED = "ON_MESSAGE_DELIVERED"
export const ON_MESSAGE_EDITED = "messageEdited"
export const ON_MESSAGE_READ = "messageRead"
export const ON_MESSAGE_RECEIVED = "ON_MESSAGE_RECEIVED"
export const ON_TEXT_MESSAGE_RECEIVED = "onTextMessageReceived"
export const ON_TRANSIENT_MESSAGE_RECEIVED = "ON_TRANSIENT_MESSAGE_RECEIVED"
export const ON_TYPING_ENDED = "onTypingEnded"
export const ON_TYPING_STARTED = "onTypingStarted"
export const ON_USER_OFFLIE = "onUserOffline"
export const ON_USER_ONLINE = "onUserOnline"
export const ON_GROUP_MEMBER_ADDED_TO_GROUP = "onGroupMemberAddedToGroup"
export const ON_GROUP_MEMBER_BANNED = "onGroupMemberBanned"
export const ON_GROUP_MEMBER_JOINED = "onGroupMemberJoined"
export const ON_GROUP_MEMBER_KICKED = "onGroupMemberKicked"
export const ON_GROUP_MEMBER_LEFT = "onGroupMemberLeft"
export const ON_GROUP_MEMBER_SCOPE_CHANGED = "onGroupMemberScopeChanged"
export const ON_GROUP_MEMBER_UNBANNED = "onGroupMemberUnbanned"
export const ON_CONVERSATION_ITEM_CLICK = "onConversationItemClicked"

export const PRIVATE_GROUP_COLOR = "rgb(0, 200, 111)";
export const PASSWORD_GROUP_COLOR = "rgb(247, 165, 0)";

const wordBoundary = {
	start: `(?:^|:|;|'|"|,|{|}|\\.|\\s|\\!|\\?|\\(|\\)|\\[|\\]|\\*)`,
	end: `(?=$|:|;|'|"|,|{|}|\\.|\\s|\\!|\\?|\\(|\\)|\\[|\\]|\\*)`,
  };

export const emailPattern =
    wordBoundary.start +
    `[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}` +
    wordBoundary.end

export const urlPattern =
    wordBoundary.start +
    `((https?://|www\\.|pic\\.)[-\\w;/?:@&=+$\\|\\_.!~*\\|'()\\[\\]%#,☺]+[\\w/#](\\(\\))?)` +
    wordBoundary.end

export const phoneNumPattern =
    wordBoundary.start +
    `(?:\\+?(\\d{1,3}))?([-. (]*(\\d{3})[-. )]*)?((\\d{3})[-. ]*(\\d{2,4})(?:[-.x ]*(\\d+))?)` +
    wordBoundary.end


export const MetadataConstants = {
  liveReaction: "live_reaction",
  file: "file",
  extensions: {
    thumbnailGeneration: "thumbnail-generation",
    polls: "polls",
    document: "document",
    whiteboard: "whiteboard",
    xssFilter: "xss-filter",
    dataMasking: "data-masking",
    profanityFilter: "profanity-filter",
    reactions: "reactions",
    linkPreview: "link-preview",
  },
};

export const GroupOptionConstants = {
	leave: "leave",
	delete: "delete",
	viewMembers: "viewMembers",
	addMembers: "addMembers",
	bannedMembers: "bannedMembers",
	voiceCall: "voiceCall",
	videoCall: "videoCall",
	viewInformation: "viewInformation",
};

export const GroupMemberOptionConstants = {
	joined: "joined",
	left: "left",
	added: "added",
	kick: "kick",
	ban: "ban",
	unban: "unban",
	changeScope: "changeScope",
	view:'viewMember',
	addMembers: 'addMembers',
	deleteGroup: 'deleteGroup',
	leave: 'leave',
	transferOwnership: 'transferOwnership',
};

export const UserOptionConstants = {
	blockUnblock: "blockUnblock",
	viewProfile: "viewProfile",
	voiceCall: "voiceCall",
	videoCall: "videoCall",
	viewInformation: "viewInformation",
};

export const ConversationOptionConstants = {
	delete: "delete",
	edit: "edit",
};

export const ConversationTypeConstants = {
	users: "users",
	groups: "groups",
	both: "both",
};

export const GroupTypeConstants = {
	private: CometChat.GROUP_TYPE.PRIVATE,
	password: CometChat.GROUP_TYPE.PASSWORD,
	public: CometChat.GROUP_TYPE.PUBLIC,
};

export const GroupMemberScope = {
	admin: CometChat.GROUP_MEMBER_SCOPE.ADMIN,
	moderator: CometChat.GROUP_MEMBER_SCOPE.MODERATOR,
	participant: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
	owner: "owner"
};

export const GroupMemberOptionKick = "kick";
export const GroupMemberOptionBan = "ban";
export const GroupMemberOptionUnban = "unban";
export const GroupMemberOptionChangeScope: string[] = [
	GroupMemberScope.admin,
	GroupMemberScope.moderator,
	GroupMemberScope.participant,
];

export const ONE_SECOND_IN_MS = 1000;

export const PATTERN = [
  1 * ONE_SECOND_IN_MS,
  2 * ONE_SECOND_IN_MS,
  3 * ONE_SECOND_IN_MS
];

export const CallContstatnts = {
	audioCall: CometChat.CALL_TYPE.AUDIO,
	videoCall: CometChat.CALL_TYPE.VIDEO,
	ongoing: CometChat.CALL_STATUS.ONGOING,
	missed: CometChat.CALL_STATUS.UNANSWERED,
	ended: CometChat.CALL_STATUS.ENDED,
	cancelled: CometChat.CALL_STATUS.CANCELLED,
	busy: CometChat.CALL_STATUS.BUSY,
	rejected: CometChat.CALL_STATUS.REJECTED,
}

export const CallTypeConstants = {
	audio: CometChat.CALL_TYPE.AUDIO,
	video: CometChat.CALL_TYPE.VIDEO
}

export const MessageCategoryConstants = {
	message: CometChat.CATEGORY_MESSAGE,
	custom: CometChat.CATEGORY_CUSTOM,
	action: CometChat.CATEGORY_ACTION,
	call: CometChat.CATEGORY_CALL,
};

export const DefaultActionSheetItems = {
	takeAPhoto:  "takeAPhoto",
	photoAndVideoLibrary: "photoAndVideoLibrary",
	document: "photoAndVideoLibrary",
	poll: "poll",
	sticker: "sticker",
	collaborative_whiteboard: "collaborative_whiteboard",
	collaborative_document: "collaborative_document"
}


export const MessageTypeConstants = {
  text: CometChat.MESSAGE_TYPE.TEXT,
  file: CometChat.MESSAGE_TYPE.FILE,
  image: CometChat.MESSAGE_TYPE.IMAGE,
  takePhoto: 'takePhoto',
  audio: CometChat.MESSAGE_TYPE.AUDIO,
  video: CometChat.MESSAGE_TYPE.VIDEO,
  groupMember: CometChat.ACTION_TYPE.TYPE_GROUP_MEMBER,
  messageEdited: CometChat.ACTION_TYPE.MESSAGE_EDITED,
  messageDeleted: CometChat.ACTION_TYPE.MESSSAGE_DELETED,
  poll: "extension_poll",
  sticker: "extension_sticker",
  document: "extension_document",
  whiteboard: "extension_whiteboard",
  meeting: "meeting",
  location: "location",
  groupActions:"groupActions"
};

export const ReceiverTypeConstants = {
  user: CometChat.RECEIVER_TYPE.USER,
  group: CometChat.RECEIVER_TYPE.GROUP,
};

export const UserStatusConstants = {
	online: CometChat.USER_STATUS.ONLINE,
	offline: CometChat.USER_STATUS.ONLINE,
	blocked: 'blocked',
	unblocked: 'unblocked',
};

export const MessageOptionConstants = {
	editMessage: "editMessage",
	deleteMessage: "deleteMessage",
	replyMessage: "replyMessage",
	replyInThread: "replyInThread",
	translateMessage: "translateMessage",
	reactToMessage: "reactToMessage",
	messageInformation: "messageInfo",
	copyMessage: "copyMessage",
	shareMessage: "shareMessage",
	// forwardMessage: "forwardMessage",
	sendMessagePrivately: "sendMessagePrivately",
	replyMessagePrivately: "replyMessagePrivately",
};

export const CometChatMessageTypes = Object.freeze({
	text: CometChat.MESSAGE_TYPE.TEXT,
	file: CometChat.MESSAGE_TYPE.FILE,
	image: CometChat.MESSAGE_TYPE.IMAGE,
	audio: CometChat.MESSAGE_TYPE.AUDIO,
	video: CometChat.MESSAGE_TYPE.VIDEO,
});

export const CometChatCustomMessageTypes = Object.freeze({
	poll: "extension_poll",
	sticker: "extension_sticker",
	document: "extension_document",
	whiteboard: "extension_whiteboard",
	meeting: "meeting",
	location: "location",
});

export const MessageOptionForConstants = {
	sender: "sender",
	receiver: "receiver",
	both: "both",
};
export const ViewAlignment = {
	composerTop: "composerTop",
	composerBottom: "composerBottom",
	messageListTop: "messageListTop",
	messageListBottom: "messageListBottom"
}
export type MessageListAlignmentType = "standard" | "leftAligned"

export type MessageBubbleAlignmentType = "left" | "right" | "center"

export type MessageTimeAlignmentType = "top" | "bottom"

export const MessageStatusConstants = Object.freeze({
	inprogress: "inprogress",
	success: "success",
});

export const GroupsConstants = {
	MESSAGE_: "message_",
	GROUP_MEMBERS: "members",
	GROUP_MEMBER: "member",

	GROUP_: "group_",
	ENTER_GROUP_NAME: "Name",
	CREATING_MESSSAGE: "Creating...",
	GROUP_PASSWORD_BLANK: "Group password cannot be blank",
	PARTICIPANT: "Participant",
	PUBLIC: "Public",
	PRIVATE: "Private",

	CREATE_GROUP: "Create Group",
	GROUP_LIST_: "grouplist_",
	GROUPS: "Groups",
	GUID: "guid",
	VIEW_MESSAGE_THREAD: "viewMessageThread",
	CLOSE_THREAD_CLICKED: "closeThreadClicked",
	CLOSE_FULL_SCREEN_IMAGE: "closeFullScreenImage",
	VIEW_ACTUAL_IMAGE: "viewActualImage",
	ACTION_TYPE_GROUPMEMBER: "groupMember",
	EDIT: "edit",
	DELETE: "delete",
	MENU_CLICKED: "menuClicked",
	PUBLIC_GROUP: "public",
	PRIVATE_GROUP: "private",
	PROTECTED_GROUP: "protected",
	MEMBER_SCOPE_CHANGED: "memberScopeChanged",
	MEMBERS_ADDED: "membersAdded",
	MEMBER_UNBANNED: "memberUnbanned",
	MEMBERS_UPDATED: "membersUpdated",
	MEMBER_UPDATED: "memberUpdated",
	GROUP_UPDATED: "groupUpdated",
	LEFT_GROUP: "leftGroup",
	DELETE_GROUP: "groupDeleted",
	BREAKPOINT_MIN_WIDTH: "320",
	BREAKPOINT_MAX_WIDTH: "767",
	UID: "uid",
	SEARCH: "Search",
	GROUP_TO_UPDATE: "groupToUpdate",
	SCOPE: "scope",
	GROUP_TO_DELETE: "groupToDelete",
	MEMBERS_COUNT: "membersCount",
	NO_GROUPS_FOUND: "No groups found",
	LOADING_MESSSAGE: "Loading...",
	ERROR: "error",
	GROUP_MEMBER_KICKED: "onGroupMemberKicked",
	HAS_JOINED: "hasJoined",
	CLOSE_CREATE_GROUP_VIEW: "closeCreateGroupView",
	GROUP_CREATED: "groupCreated",
	GROUP_MEMBER_SCOPE_CHANGED: "onGroupMemberScopeChanged",
	GROUP_MEMBER_BANNED: "onGroupMemberBanned",
	GROUP_MEMBER_UNBANNED: "onGroupMemberUnbanned",
	GROUP_MEMBER_ADDED: "onMemberAddedToGroup",
	GROUP_MEMBER_LEFT: "onGroupMemberLeft",
	GROUP_MEMBER_JOINED: "onGroupMemberJoined",
};

export const ComponentIds = {
	ADD_MEMBERS: 'AddMembers',
	VIEW_MEMBERS: 'ViewMembers',
	BANNED_MEMBERS: 'BannedMembers',
	TRANSFER_OWNERSHIP: 'TransferOwnership'
}