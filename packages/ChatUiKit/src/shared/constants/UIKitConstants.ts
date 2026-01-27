import { CometChat } from "@cometchat/chat-sdk-react-native";

export const USER_ONLINE_STATUS = "online";
export const NO_USERS_FOUND = "no_users_found";
export const NO_DATA_FOUND = "no_data_found";
export const SOMETHING_WRONG = "something_wrong";
export const LOADING = "loading";
export const NO_GROUPS_FOUND = "no_groups_found";
export const ON_USER_ITEM_CLICK = "onItemClick";
export const ON_USER_ERROR = "onUserError";
export const ON_USER_BLOCK = "onUserBlock";
export const ON_USER_UNBLOCK = "onUserUnBlock";
export const USERS_CLICK_LISTENER_ID = "clicklistener2";
export const USERS = "Users";
export const SEARCH = "Search";

export const CALL_INITIATED = CometChat.CALL_STATUS.INITIATED;
export const CALL_ONGOING = CometChat.CALL_STATUS.ONGOING;
export const CALL_REJECTED = CometChat.CALL_STATUS.REJECTED;
export const CALL_CANCELLED = CometChat.CALL_STATUS.CANCELLED;
export const CALL_BUSY = CometChat.CALL_STATUS.BUSY;
export const CALL_UNANSWERED = CometChat.CALL_STATUS.UNANSWERED;
export const CALL_ENDED = CometChat.CALL_STATUS.ENDED;

export const ON_INCOMING_CALL_RECEIVED = "onIncomingCallReceived";
export const ON_INCOMING_CALL_CANCELLED = "onIncomingCallCancelled";
export const ON_CUSTOM_MESSAGE_RECEIVED = "onCustomMessageReceived";
export const ON_MEDIA_MESSAGE_REVEIVED = "onMediaMessageReceived";
export const ON_MESSAGE_DELETED = "onMessageDeleted";
export const ON_MESSAGE_DELIVERED = "ON_MESSAGE_DELIVERED";
export const ON_MESSAGE_EDITED = "messageEdited";
export const ON_MESSAGE_READ = "messageRead";
export const ON_MESSAGE_RECEIVED = "ON_MESSAGE_RECEIVED";
export const ON_TEXT_MESSAGE_RECEIVED = "onTextMessageReceived";
export const ON_TRANSIENT_MESSAGE_RECEIVED = "ON_TRANSIENT_MESSAGE_RECEIVED";
export const ON_TYPING_ENDED = "onTypingEnded";
export const ON_TYPING_STARTED = "onTypingStarted";
export const ON_USER_OFFLIE = "onUserOffline";
export const ON_USER_ONLINE = "onUserOnline";
export const ON_GROUP_MEMBER_ADDED_TO_GROUP = "onGroupMemberAddedToGroup";
export const ON_GROUP_MEMBER_BANNED = "onGroupMemberBanned";
export const ON_GROUP_MEMBER_JOINED = "onGroupMemberJoined";
export const ON_GROUP_MEMBER_KICKED = "onGroupMemberKicked";
export const ON_GROUP_MEMBER_LEFT = "onGroupMemberLeft";
export const ON_GROUP_MEMBER_SCOPE_CHANGED = "onGroupMemberScopeChanged";
export const ON_GROUP_MEMBER_UNBANNED = "onGroupMemberUnbanned";
export const ON_CONVERSATION_ITEM_CLICK = "onConversationItemClicked";

export const PRIVATE_GROUP_COLOR = "rgb(0, 200, 111)";
export const PASSWORD_GROUP_COLOR = "rgb(247, 165, 0)";

export const IMAGE_PREFETCH_MAX_ATTEMPTS = 5;
export const IMAGE_PREFETCH_TIMEOUT = 800;

const wordBoundary = {
  start: `(?:^|:|;|'|"|,|{|}|\\.|\\s|\\!|\\?|\\(|\\)|\\[|\\]|\\*)`,
  end: `(?=$|:|;|'|"|,|{|}|\\.|\\s|\\!|\\?|\\(|\\)|\\[|\\]|\\*)`,
};

export const emailPattern =
  wordBoundary.start + `[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}` + wordBoundary.end;

export const urlPattern =
  `((https?://|www\\.|pic\\.)[-\\w;/?:@&=+$\\|\\_.!~*\\|'()\\[\\]%#,☺]+[\\w/#](\\(\\))?)` +
  wordBoundary.end;

export const phoneNumPattern =
  wordBoundary.start +
  `(?:\\+?(\\d{1,3}))?([-. (]*(\\d{3})[-. )]*)?((\\d{3})[-. ]*(\\d{2,4})(?:[-.x ]*(\\d+))?)` +
  wordBoundary.end;

export const MetadataConstants = {
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

export const GroupMemberOptionConstants = {
  joined: "joined",
  left: "left",
  added: "added",
  kick: "kick",
  ban: "ban",
  unban: "unban",
  changeScope: "changeScope",
  view: "viewMember",
  deleteGroup: "deleteGroup",
  leave: "leave",
};

export const ConversationOptionConstants = {
  delete: "delete",
  edit: "edit",
  reply: "reply",
};

export const ConversationTypeConstants = {
  user: "user",
  group: "group",
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
  owner: "owner",
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

export const PATTERN = [1 * ONE_SECOND_IN_MS, 2 * ONE_SECOND_IN_MS, 3 * ONE_SECOND_IN_MS];

export const CallContstatnts = {
  audioCall: CometChat.CALL_TYPE.AUDIO,
  videoCall: CometChat.CALL_TYPE.VIDEO,
  ongoing: CometChat.CALL_STATUS.ONGOING,
  missed: CometChat.CALL_STATUS.UNANSWERED,
  ended: CometChat.CALL_STATUS.ENDED,
  cancelled: CometChat.CALL_STATUS.CANCELLED,
  busy: CometChat.CALL_STATUS.BUSY,
  rejected: CometChat.CALL_STATUS.REJECTED,
};

export const CallTypeConstants = {
  audio: CometChat.CALL_TYPE.AUDIO,
  video: CometChat.CALL_TYPE.VIDEO,
};

export const MessageCategoryConstants = {
  message: CometChat.CATEGORY_MESSAGE,
  custom: CometChat.CATEGORY_CUSTOM,
  action: CometChat.CATEGORY_ACTION,
  call: CometChat.CATEGORY_CALL,
  interactive: CometChat.CATEGORY_INTERACTIVE,
  agentic: CometChat.CATEGORY_AGENTIC,
  stream: "stream_message",
};

export const DefaultActionSheetItems = {
  takeAPhoto: "takeAPhoto",
  photoAndVideoLibrary: "photoAndVideoLibrary",
  document: "photoAndVideoLibrary",
  poll: "poll",
  sticker: "sticker",
  collaborative_whiteboard: "collaborative_whiteboard",
  collaborative_document: "collaborative_document",
};

export const MessageTypeConstants = {
  text: CometChat.MESSAGE_TYPE.TEXT,
  file: CometChat.MESSAGE_TYPE.FILE,
  image: CometChat.MESSAGE_TYPE.IMAGE,
  takePhoto: "takePhoto",
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
  scheduler: "scheduler",
  location: "location",
  groupActions: "groupActions",
  form: "form",
  card: "card",
  customInteractive: "customInteractive",
  assistant: CometChat.MESSAGE_TYPE.ASSISTANT,
  toolArguments: CometChat.MESSAGE_TYPE.TOOL_ARGUMENTS,
  toolResults: CometChat.MESSAGE_TYPE.TOOL_RESULT,
};

export const streamMessageTypes = {
  run_started: CometChat.AI_ASSISTANT_EVENTS.RUN_STARTED,
  text_message_start: CometChat.AI_ASSISTANT_EVENTS.TEXT_MESSAGE_START,
  text_message_content: CometChat.AI_ASSISTANT_EVENTS.TEXT_MESSAGE_CONTENT,
  text_message_end: CometChat.AI_ASSISTANT_EVENTS.TEXT_MESSAGE_END,
  run_finished: CometChat.AI_ASSISTANT_EVENTS.RUN_FINISHED,
  tool_call_start: CometChat.AI_ASSISTANT_EVENTS.TOOL_CALL_STARTED,
  tool_call_end: CometChat.AI_ASSISTANT_EVENTS.TOOL_CALL_ENDED,
  tool_call_args: CometChat.AI_ASSISTANT_EVENTS.TOOL_CALL_ARGUMENT,
  tool_call_result: CometChat.AI_ASSISTANT_EVENTS.TOOL_CALL_RESULT
}

export const ReceiverTypeConstants = {
  user: CometChat.RECEIVER_TYPE.USER,
  group: CometChat.RECEIVER_TYPE.GROUP,
};

export const UserStatusConstants = {
  online: CometChat.USER_STATUS.ONLINE,
  offline: CometChat.USER_STATUS.OFFLINE,
  blocked: "blocked",
  unblocked: "unblocked",
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
  reportMessage: "reportMessage",
  markAsUnread: "markAsUnread",
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
  messageListBottom: "messageListBottom",
};

export const MessageStatusConstants = Object.freeze({
  inprogress: "inprogress",
  success: "success",
  error: "error",
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

export enum ElementType {
  label = "label",
  text = "textInput",
  dropdown = "dropdown",
  checkbox = "checkbox",
  dateTime = "dateTime",
  radio = "radio",
  button = "button",
  singleSelect = "singleSelect",
}

export enum ButtonAction {
  apiAction = "apiAction",
  urlNavigation = "urlNavigation",
  custom = "custom",
}

export enum HTTPSRequestMethods {
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
}

export enum goalType {
  allOf = CometChat.GoalType.ALL_OF,
  anyOf = CometChat.GoalType.ANY_OF,
  anyAction = CometChat.GoalType.ANY_ACTION,
  none = CometChat.GoalType.NONE,
}

export enum MessageReceipt {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  ERROR = "ERROR",
  WAIT = "WAIT",
}

export enum MentionsType {
  users,
  usersAndGroupMembers,
}

export enum MentionsVisibility {
  both,
  usersConversationOnly,
  groupsConversationOnly,
}

const FILE_EXTENSION = {
  doc: "document-file-type",
  docx: "document-file-type",
  md: "document-file-type",
  csv: "spreadsheet-file-type",
  xls: "spreadsheet-file-type",
  xlsx: "spreadsheet-file-type",
  ods: "spreadsheet-file-type",
  jpg: "image-file-type",
  jpeg: "image-file-type",
  png: "image-file-type",
  gif: "image-file-type",
  bmp: "image-file-type",
  svg: "image-file-type",
  webp: "image-file-type",
  tiff: "image-file-type",
  psd: "image-file-type",
  mp3: "audio-file-type",
  wav: "audio-file-type",
  ogg: "audio-file-type",
  flac: "audio-file-type",
  aac: "audio-file-type",
  wma: "audio-file-type",
  aiff: "audio-file-type",
  mp4: "video-file-type",
  avi: "video-file-type",
  mov: "video-file-type",
  mkv: "video-file-type",
  flv: "video-file-type",
  wmv: "video-file-type",
  webm: "video-file-type",
  mpg: "video-file-type",
  mpeg: "video-file-type",
  "3gp": "video-file-type",
  pdf: "pdf-file-type",
  ps: "pdf-file-type",
  zip: "zip-file-type",
  rar: "zip-file-type",
  "7z": "zip-file-type",
  ppt: "presentation-file-type",
  pptx: "presentation-file-type",
  odp: "presentation-file-type",
  key: "presentation-file-type",
  txt: "text-file-type",
  wps: "text-file-type",
  rtf: "text-file-type",
  odt: "text-file-type",
  tex: "text-file-type",
  log: "text-file-type",
  unknown: "unknown-file-type",
} as const;

type FileExtensionKey = keyof typeof FILE_EXTENSION;

export const getFileTypeIcon = (fileName: string) => {
  const fileExtension: string | undefined = fileName.split(".").pop()?.toLowerCase();

  if (!fileExtension) {
    return "unknown-file-type";
  }

  type FileExtensionKey = keyof typeof FILE_EXTENSION;
  return FILE_EXTENSION[fileExtension as FileExtensionKey] || "unknown-file-type";
};

export enum MentionsTargetElement {
  textinput,
  textbubble,
  conversation,
}
