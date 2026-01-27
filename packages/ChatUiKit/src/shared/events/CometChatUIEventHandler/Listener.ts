import { SuggestionItem } from "../../views";

export function isFalsy($false: any) {
  if ($false != null) {
    if (typeof $false == "string") $false = $false.trim();
    if (typeof $false == "object" && Object.keys($false).length === 0) $false = undefined;
  }
  let falsyvalues: any = ["", 0, "0", false, null, "null", undefined, "undefined"];
  return falsyvalues.includes($false);
}

type MessageUIEvents = {
  ccMessageSent?: Function;
  ccMessageEdited?: Function;
  ccMessageDeleted?: Function;
  ccMessageRead?: Function;
  ccMessageDelivered?: Function;
  ccMessageError?: Function;
  ccActiveChatChanged?: Function;
  onTextMessageReceived?: Function;
  onMediaMessageReceived?: Function;
  onCustomMessageReceived?: Function;
  onTypingStarted?: Function;
  onTypingEnded?: Function;
  onMessagesDelivered?: Function;
  onMessagesRead?: Function;
  onMessageEdited?: Function;
  onMessageDeleted?: Function;
  onTransientMessageReceived?: Function;
  onFormMessageReceived?: Function;
  onCardMessageReceived?: Function;
  onSchedulerMessageReceived?: Function;
  onCustomInteractiveMessageReceived?: Function;
  onInteractionGoalCompleted?: Function;
  onMessageReactionAdded?: Function;
  onMessageReactionRemoved?: Function;
  onMessagesDeliveredToAll?: Function;
  onMessagesReadByAll?: Function;
  onMessageModerated?: Function;
  onAIAssistantMessageReceived?: Function;
  onMessageReply?: Function;
};
export class MessageUIEventListener {
  ccMessageSent?: Function = undefined;
  ccMessageEdited?: Function = undefined;
  ccMessageDeleted?: Function = undefined;
  ccMessageRead?: Function = undefined;
  ccMessageDelivered?: Function = undefined;
  ccMessageError?: Function = undefined;
  ccActiveChatChanged?: Function = undefined;
  onTextMessageReceived?: Function = undefined;
  onMediaMessageReceived?: Function = undefined;
  onCustomMessageReceived?: Function = undefined;
  onTypingStarted?: Function = undefined;
  onTypingEnded?: Function = undefined;
  onMessagesDelivered?: Function = undefined;
  onMessagesRead?: Function = undefined;
  onMessageEdited?: Function = undefined;
  onMessageDeleted?: Function = undefined;
  onTransientMessageReceived?: Function = undefined;
  onFormMessageReceived?: Function = undefined;
  onCardMessageReceived?: Function = undefined;
  onSchedulerMessageReceived?: Function = undefined;
  onCustomInteractiveMessageReceived?: Function = undefined;
  onInteractionGoalCompleted?: Function = undefined;
  onMessageReactionAdded?: Function = undefined;
  onMessageReactionRemoved?: Function = undefined;
  onMessagesDeliveredToAll?: Function = undefined;
  onMessagesReadByAll?: Function = undefined;
  onMessageModerated?: Function = undefined;
  onAIAssistantMessageReceived?: Function = undefined;
  onMessageReply?: Function = undefined;
  constructor({
    ccMessageSent,
    ccMessageEdited,
    ccMessageDeleted,
    ccMessageRead,
    ccMessageDelivered,
    ccMessageError,
    ccActiveChatChanged,
    onTextMessageReceived,
    onMediaMessageReceived,
    onCustomMessageReceived,
    onTypingStarted,
    onTypingEnded,
    onMessagesDelivered,
    onMessagesRead,
    onMessageEdited,
    onMessageDeleted,
    onTransientMessageReceived,
    onFormMessageReceived,
    onCardMessageReceived,
    onSchedulerMessageReceived,
    onCustomInteractiveMessageReceived,
    onInteractionGoalCompleted,
    onMessageReactionAdded,
    onMessageReactionRemoved,
    onMessagesDeliveredToAll,
    onMessagesReadByAll,
    onMessageModerated,
    onAIAssistantMessageReceived,
    onMessageReply,
  }: MessageUIEvents) {
    if (!isFalsy(ccMessageError)) this.ccMessageError = ccMessageError;
    if (!isFalsy(ccMessageDelivered)) this.ccMessageDelivered = ccMessageDelivered;
    if (!isFalsy(ccMessageRead)) this.ccMessageRead = ccMessageRead;
    if (!isFalsy(ccMessageSent)) this.ccMessageSent = ccMessageSent;
    if (!isFalsy(ccMessageEdited)) this.ccMessageEdited = ccMessageEdited;
    if (!isFalsy(ccMessageDeleted)) this.ccMessageDeleted = ccMessageDeleted;
    if (!isFalsy(ccActiveChatChanged)) this.ccActiveChatChanged = ccActiveChatChanged;
    if (!isFalsy(onTextMessageReceived)) this.onTextMessageReceived = onTextMessageReceived;
    if (!isFalsy(onMediaMessageReceived)) this.onMediaMessageReceived = onMediaMessageReceived;
    if (!isFalsy(onCustomMessageReceived)) this.onCustomMessageReceived = onCustomMessageReceived;
    if (!isFalsy(onTypingStarted)) this.onTypingStarted = onTypingStarted;
    if (!isFalsy(onTypingEnded)) this.onTypingEnded = onTypingEnded;
    if (!isFalsy(onMessagesDelivered)) this.onMessagesDelivered = onMessagesDelivered;
    if (!isFalsy(onMessagesRead)) this.onMessagesRead = onMessagesRead;
    if (!isFalsy(onMessageEdited)) this.onMessageEdited = onMessageEdited;
    if (!isFalsy(onMessageDeleted)) this.onMessageDeleted = onMessageDeleted;
    if (!isFalsy(onMessageDeleted)) this.onMessageDeleted = onMessageDeleted;
    if (!isFalsy(onTransientMessageReceived))
      this.onTransientMessageReceived = onTransientMessageReceived;
    if (!isFalsy(onFormMessageReceived)) this.onFormMessageReceived = onFormMessageReceived;
    if (!isFalsy(onCardMessageReceived)) this.onCardMessageReceived = onCardMessageReceived;
    if (!isFalsy(onSchedulerMessageReceived))
      this.onSchedulerMessageReceived = onSchedulerMessageReceived;
    if (!isFalsy(onCustomInteractiveMessageReceived))
      this.onCustomInteractiveMessageReceived = onCustomInteractiveMessageReceived;
    if (!isFalsy(onInteractionGoalCompleted))
      this.onInteractionGoalCompleted = onInteractionGoalCompleted;
    if (!isFalsy(onMessageReactionAdded)) this.onMessageReactionAdded = onMessageReactionAdded;
    if (!isFalsy(onMessageReactionRemoved))
      this.onMessageReactionRemoved = onMessageReactionRemoved;
    if (!isFalsy(onMessagesDeliveredToAll))
      this.onMessagesDeliveredToAll = onMessagesDeliveredToAll;
    if (!isFalsy(onMessagesReadByAll)) this.onMessagesReadByAll = onMessagesReadByAll;
    if (!isFalsy(onAIAssistantMessageReceived)) this.onAIAssistantMessageReceived = onAIAssistantMessageReceived;
    if (!isFalsy(onMessageReply)) this.onMessageReply = onMessageReply;
    if (!isFalsy(onMessageModerated)) this.onMessageModerated = onMessageModerated;
  }
}

type CallUIEvents = {
  ccIncomingCallReceived?: Function;
  ccOutgoingCallAccepted?: Function;
  ccOutgoingCallRejected?: Function;
  ccIncomingCallCancelled?: Function;
  ccOutgoingCall?: Function;
  ccCallAccepted?: Function;
  ccCallRejected?: Function;
  ccOutgoingCallCancelled?: Function;
  ccCallEnded?: Function;
  ccCallInitiated?: Function;
  ccCallFailed?: Function;
  ccShowOngoingCall?: (CometChatOngoingComponent: any) => void;
};

type PanelUIEvents = {
  ccShowPanel?: Function;
  ccHidePanel?: Function;
};

export class PanelUIEventListener {
  ccShowPanel?: Function = undefined;
  ccHidePanel?: Function = undefined;

  constructor({ ccShowPanel, ccHidePanel }: PanelUIEvents) {
    if (!isFalsy(ccShowPanel)) this.ccShowPanel = ccShowPanel;
    if (!isFalsy(ccHidePanel)) this.ccHidePanel = ccHidePanel;
  }
}
export class CallUIEventListener {
  ccIncomingCallReceived?: Function = undefined;
  ccOutgoingCallAccepted?: Function = undefined;
  ccOutgoingCallRejected?: Function = undefined;
  ccIncomingCallCancelled?: Function = undefined;
  ccOutgoingCall?: Function = undefined;
  ccCallAccepted?: Function = undefined;
  ccCallRejected?: Function = undefined;
  ccCallEnded?: Function = undefined;
  ccOutgoingCallCancelled?: Function = undefined;
  ccCallFailed?: Function = undefined;
  ccCallInitiated?: Function = undefined;
  ccShowOngoingCall?: (CometChatOngoingComponent: any) => void;

  constructor({
    ccIncomingCallReceived,
    ccOutgoingCallAccepted,
    ccOutgoingCallRejected,
    ccIncomingCallCancelled,
    ccOutgoingCall,
    ccCallAccepted,
    ccCallRejected,
    ccCallEnded,
    ccOutgoingCallCancelled,
    ccCallFailed,
    ccCallInitiated,
    ccShowOngoingCall,
  }: CallUIEvents) {
    if (!isFalsy(ccCallFailed)) this.ccCallFailed = ccCallFailed;
    if (!isFalsy(ccCallInitiated)) this.ccCallInitiated = ccCallInitiated;
    if (!isFalsy(ccOutgoingCall)) this.ccOutgoingCall = ccOutgoingCall;
    if (!isFalsy(ccCallAccepted)) this.ccCallAccepted = ccCallAccepted;
    if (!isFalsy(ccCallRejected)) this.ccCallRejected = ccCallRejected;
    if (!isFalsy(ccCallEnded)) this.ccCallEnded = ccCallEnded;
    if (!isFalsy(ccOutgoingCallCancelled)) this.ccOutgoingCallCancelled = ccOutgoingCallCancelled;
    if (!isFalsy(ccIncomingCallReceived)) this.ccIncomingCallReceived = ccIncomingCallReceived;
    if (!isFalsy(ccOutgoingCallAccepted)) this.ccOutgoingCallAccepted = ccOutgoingCallAccepted;
    if (!isFalsy(ccOutgoingCallRejected)) this.ccOutgoingCallRejected = ccOutgoingCallRejected;
    if (!isFalsy(ccIncomingCallCancelled)) this.ccIncomingCallCancelled = ccIncomingCallCancelled;
    if (!isFalsy(ccShowOngoingCall)) this.ccShowOngoingCall = ccShowOngoingCall;
  }
}

type UserUIEvents = {
  ccUserBlocked?: Function;
  ccUserUnBlocked?: Function;
};

export class UserUIEventListener {
  ccUserBlocked?: Function;
  ccUserUnBlocked?: Function;
  constructor({ ccUserBlocked, ccUserUnBlocked }: UserUIEvents) {
    if (!isFalsy(ccUserUnBlocked)) this.ccUserUnBlocked = ccUserUnBlocked;
    if (!isFalsy(ccUserBlocked)) this.ccUserBlocked = ccUserBlocked;
  }
}

type UIEvents = {
  showPanel?: (item: any) => void;
  hidePanel?: (item: any) => void;
  ccToggleBottomSheet?: (item: any) => void;
  openChat?: (item: any) => void;
  ccComposeMessage?: (item: any) => void;
  // ccMentionClick?:(item)=>void,
  ccSuggestionData?: (item: { id: string | number; data: Array<SuggestionItem> }) => void;
};
export class UIEventListener {
  showPanel?: (item: any) => void;
  hidePanel?: (item: any) => void;
  ccToggleBottomSheet?: (item: any) => void;
  openChat?: (item: any) => void;
  ccComposeMessage?: (item: any) => void;
  // ccMentionClick?:(item)=>void;
  ccSuggestionData?: (item: { id: string | number; data: Array<SuggestionItem> }) => void;
  constructor({
    showPanel,
    hidePanel,
    ccToggleBottomSheet,
    openChat,
    ccComposeMessage,
    // ccMentionClick,
    ccSuggestionData,
  }: UIEvents) {
    if (!isFalsy(hidePanel)) this.hidePanel = hidePanel;
    if (!isFalsy(showPanel)) this.showPanel = showPanel;
    if (!isFalsy(openChat)) this.openChat = openChat;
    if (!isFalsy(ccToggleBottomSheet)) this.ccToggleBottomSheet = ccToggleBottomSheet;
    if (!isFalsy(ccComposeMessage)) this.ccComposeMessage = ccComposeMessage;
    // if (!isFalsy(ccMentionClick)) this.ccMentionClick = ccMentionClick;
    if (!isFalsy(ccSuggestionData)) this.ccSuggestionData = ccSuggestionData;
  }
}
export class GroupUIEventListener {
  ccGroupCreated?: Function;
  ccGroupMemberKicked?: Function;
  ccGroupLeft?: Function;
  ccGroupMemberBanned?: Function;
  ccGroupDeleted?: Function;
  ccOwnershipChanged?: Function;
  ccGroupMemberScopeChanged?: Function;
  ccGroupMemberUnBanned?: Function;
  ccGroupMemberJoined?: Function;
  ccGroupMemberAdded?: Function;
  ccGropuMemberleft?: Function;

  constructor({
    ccGroupCreated,
    ccGroupMemberKicked,
    ccGroupLeft,
    ccGroupMemberBanned,
    ccGroupDeleted,
    ccOwnershipChanged,
    ccGroupMemberScopeChanged,
    ccGroupMemberUnBanned,
    ccGroupMemberJoined,
    ccGroupMemberAdded,
    ccGropuMemberleft,
  }: any) {
    if (!isFalsy(ccGropuMemberleft)) this.ccGropuMemberleft = ccGropuMemberleft;

    if (!isFalsy(ccGroupMemberAdded)) this.ccGroupMemberAdded = ccGroupMemberAdded;

    if (!isFalsy(ccGroupMemberJoined)) this.ccGroupMemberJoined = ccGroupMemberJoined;

    if (!isFalsy(ccGroupCreated)) this.ccGroupCreated = ccGroupCreated;

    if (!isFalsy(ccGroupMemberKicked)) this.ccGroupMemberKicked = ccGroupMemberKicked;

    if (!isFalsy(ccGroupMemberBanned)) this.ccGroupMemberBanned = ccGroupMemberBanned;

    if (!isFalsy(ccGroupLeft)) this.ccGroupLeft = ccGroupLeft;

    if (!isFalsy(ccGroupDeleted)) this.ccGroupDeleted = ccGroupDeleted;

    if (!isFalsy(ccOwnershipChanged)) this.ccOwnershipChanged = ccOwnershipChanged;

    if (!isFalsy(ccGroupMemberScopeChanged))
      this.ccGroupMemberScopeChanged = ccGroupMemberScopeChanged;

    if (!isFalsy(ccGroupMemberUnBanned)) this.ccGroupMemberUnBanned = ccGroupMemberUnBanned;
  }
}

export class UserCallUIEventListener {
  ccYouLeft?: Function;
  ccYouJoined?: Function;
  ccUserJoined?: Function;
  ccUserLeft?: Function;
  ccUserListUpdated?: Function;
  ccAudioModesUpdated?: Function;
  ccCallEnded?: Function;
  ccError?: Function;
  constructor({
    ccYouLeft,
    ccYouJoined,
    ccUserJoined,
    ccUserLeft,
    ccUserListUpdated,
    ccAudioModesUpdated,
    ccCallEnded,
    ccError,
  }: any) {
    if (!isFalsy(ccYouLeft)) this.ccYouLeft = ccYouLeft;
    if (!isFalsy(ccYouJoined)) this.ccYouJoined = ccYouJoined;
    if (!isFalsy(ccUserJoined)) this.ccUserJoined = ccUserJoined;
    if (!isFalsy(ccUserLeft)) this.ccUserLeft = ccUserLeft;
    if (!isFalsy(ccUserListUpdated)) this.ccUserListUpdated = ccUserListUpdated;
    if (!isFalsy(ccAudioModesUpdated)) this.ccAudioModesUpdated = ccAudioModesUpdated;
    if (!isFalsy(ccCallEnded)) this.ccCallEnded = ccCallEnded;
    if (!isFalsy(ccError)) this.ccError = ccError;
  }
}

type ConversationUIEvents = {
  ccConversationDeleted?: Function;
  ccUpdateConversation?: Function;
};
export class ConversationUIEventListener {
  ccConversationDeleted?: Function;
  ccUpdateConversation?: Function;
  constructor({ ccConversationDeleted, ccUpdateConversation }: ConversationUIEvents) {
    if (!isFalsy(ccConversationDeleted)) this.ccConversationDeleted = ccConversationDeleted;
    if (!isFalsy(ccUpdateConversation)) this.ccUpdateConversation = ccUpdateConversation;
  }
}

export interface EventListener {
  _name: string;
  _callback: Function;
  _eventListener?:
    | MessageUIEventListener
    | UserUIEventListener
    | UserCallUIEventListener
    | CallUIEventListener
    | GroupUIEventListener
    | ConversationUIEventListener
    | UIEventListener
    | PanelUIEventListener;
}

export class Listener implements EventListener {
  _name: string;
  _callback: Function;

  constructor(name: string, callback: Function) {
    this._name = name;
    this._callback = callback;
  }
}

export class MessageListener extends Listener implements EventListener {
  _cursor?: number;
  _eventListener: MessageUIEventListener | undefined;
  constructor(
    name: string,
    messageEventListener?: MessageUIEventListener,
    cursor?: number,
    callback?: Function
  ) {
    super(name, callback || function () {});
    this._eventListener = messageEventListener;
    if (cursor) this._cursor = cursor;
  }
}

export class ConversationListener extends Listener implements EventListener {
  _cursor?: number;
  _eventListener: ConversationUIEventListener | undefined;
  constructor(
    name: string,
    userEventHandler?: ConversationUIEventListener,
    cursor?: number,
    callback?: Function
  ) {
    super(name, callback || function () {});
    this._eventListener = userEventHandler;
    if (cursor) this._cursor = cursor;
  }
}
export class UserListener extends Listener implements EventListener {
  _cursor?: number;
  _eventListener: UserUIEventListener | undefined;
  constructor(
    name: string,
    userEventHandler?: UserUIEventListener,
    cursor?: number,
    callback?: Function
  ) {
    super(name, callback || function () {});
    this._eventListener = userEventHandler;
    if (cursor) this._cursor = cursor;
  }
}

export class UIListener extends Listener implements EventListener {
  _cursor?: number;
  _eventListener: UIEventListener | undefined;
  constructor(
    name: string,
    uiEventHandler?: UIEventListener,
    cursor?: number,
    callback?: Function
  ) {
    super(name, callback || function () {});
    this._eventListener = uiEventHandler;
    if (cursor) this._cursor = cursor;
  }
}

export class GroupListener extends Listener implements EventListener {
  _cursor?: number;
  _eventListener: GroupUIEventListener | undefined;
  constructor(
    name: string,
    groupEventHandler?: GroupUIEventListener,
    cursor?: number,
    callback?: Function
  ) {
    super(name, callback || function () {});
    this._eventListener = groupEventHandler;
    if (cursor) this._cursor = cursor;
  }
}

export class UserCallListener extends Listener implements EventListener {
  _cursor?: number;
  _eventListener: UserCallUIEventListener | undefined;
  constructor(callEventHandler?: UserCallUIEventListener, cursor?: number, callback?: Function) {
    super("callListner", callback || function () {});
    this._eventListener = callEventHandler;
  }
}

export class CallListener extends Listener implements EventListener {
  _cursor?: number;
  _eventListener: CallUIEventListener | undefined;
  constructor(
    name: string,
    callEventListner?: CallUIEventListener,
    cursor?: number,
    callback?: Function
  ) {
    super(name, callback || function () {});
    this._eventListener = callEventListner;
  }
}

export class PanelListener extends Listener implements EventListener {
  _cursor?: number;
  _eventListener: PanelUIEventListener | undefined;
  constructor(
    name: string,
    panelEventListner?: PanelUIEventListener,
    cursor?: number,
    callback?: Function
  ) {
    super(name, callback || function () {});
    this._eventListener = panelEventListner;
  }
}
