import { SuggestionItem } from "../../views";
import {
  CallListener,
  CallUIEventListener,
  ConversationListener,
  ConversationUIEventListener,
  GroupListener,
  GroupUIEventListener,
  MessageListener,
  MessageUIEventListener,
  PanelListener,
  UserListener,
  UserUIEventListener,
  UIEventListener,
  UIListener,
} from "./Listener";

export class CometChatUIEventHandler {
  private static userHandlers?: UserListener[] = [];
  private static uiHandlers?: UIListener[] = [];
  private static messageHandlers?: MessageListener[] = [];
  private static conversationHandlers?: ConversationListener[] = [];
  private static groupHandlers?: GroupListener[] = [];
  private static callHandlers?: CallListener[] = [];
  private static panelHandlers?: PanelListener[] = [];

  constructor() {}

  static emitPanelEvent(name: string, param: object) {
    CometChatUIEventHandler.panelHandlers?.map((listener) => {
      switch (name) {
        case listener._eventListener?.ccHidePanel?.name:
          listener._eventListener?.ccHidePanel?.(param);
          break;
        case listener._eventListener?.ccShowPanel?.name:
          listener._eventListener?.ccShowPanel?.(param);
          break;
      }
    });
  }

  static emitCallEvent(name: string, param: object) {
    CometChatUIEventHandler.callHandlers?.map((listener) => {
      switch (name) {
        case listener._eventListener?.ccIncomingCallReceived?.name:
          listener._eventListener?.ccIncomingCallReceived?.(param);
          break;
        case listener._eventListener?.ccOutgoingCallAccepted?.name:
          listener._eventListener?.ccOutgoingCallAccepted?.(param);
          break;
        case listener._eventListener?.ccOutgoingCallRejected?.name:
          listener._eventListener?.ccOutgoingCallRejected?.(param);
          break;
        case listener._eventListener?.ccIncomingCallCancelled?.name:
          listener._eventListener?.ccIncomingCallCancelled?.(param);
          break;
        case listener._eventListener?.ccOutgoingCall?.name:
          listener._eventListener?.ccOutgoingCall?.(param);
          break;
        case listener._eventListener?.ccCallAccepted?.name:
          listener._eventListener?.ccCallAccepted?.(param);
          break;
        case listener._eventListener?.ccCallRejected?.name:
          listener._eventListener?.ccCallRejected?.(param);
          break;
        case listener._eventListener?.ccCallEnded?.name:
          listener._eventListener?.ccCallEnded?.(param);
          break;
        case listener._eventListener?.ccOutgoingCallCancelled?.name:
          listener._eventListener?.ccOutgoingCallCancelled?.(param);
          break;
        case listener._eventListener?.ccCallInitiated?.name:
          listener._eventListener?.ccCallInitiated?.(param);
          break;
        case listener._eventListener?.ccShowOngoingCall?.name:
          listener._eventListener?.ccShowOngoingCall?.(param);
          break;
        case listener._eventListener?.ccCallFailed?.name:
          listener._eventListener?.ccCallFailed?.(param);
          break;
      }
    });
  }

  static addCallListener(name: string, callHandler: CallUIEventListener) {
    try {
      CometChatUIEventHandler.callHandlers = CometChatUIEventHandler.callHandlers?.filter(
        (listener) => {
          return listener._name != name;
        }
      );
      CometChatUIEventHandler.callHandlers = [
        ...(CometChatUIEventHandler.callHandlers ? CometChatUIEventHandler.callHandlers : []),
        new CallListener(name, callHandler),
      ];
    } catch (err) {
      console.log("addCallListener", err);
    }
  }

  static removeCallListener(name: string) {
    try {
      CometChatUIEventHandler.callHandlers = CometChatUIEventHandler.callHandlers?.filter(
        (listener) => {
          return listener._name !== name;
        }
      );
    } catch (err) {
      console.log("removeCallListener", err);
    }
  }

  static emitMessageEvent(name: string, param: object) {
    CometChatUIEventHandler.messageHandlers?.map((listener) => {
      switch (name) {
        case listener._eventListener?.ccMessageDeleted?.name:
          listener._eventListener?.ccMessageDeleted?.(param);
          break;
        case listener._eventListener?.ccMessageEdited?.name:
          listener._eventListener?.ccMessageEdited?.(param);
          break;
        case listener._eventListener?.ccMessageRead?.name:
          listener._eventListener?.ccMessageRead?.(param);
          break;
        case listener._eventListener?.ccMessageSent?.name:
          listener._eventListener?.ccMessageSent?.(param);
          break;
        case listener._eventListener?.ccMessageDelivered?.name:
          listener._eventListener?.ccMessageSent?.(param);
          break;
        case listener._eventListener?.ccActiveChatChanged?.name:
          listener._eventListener?.ccActiveChatChanged?.(param);
          break;
        case listener._eventListener?.onTextMessageReceived?.name:
          listener._eventListener?.onTextMessageReceived?.(param);
          break;
        case listener._eventListener?.onMediaMessageReceived?.name:
          listener._eventListener?.onMediaMessageReceived?.(param);
          break;
        case listener._eventListener?.onCustomMessageReceived?.name:
          listener._eventListener?.onCustomMessageReceived?.(param);
          break;
        case listener._eventListener?.onTypingStarted?.name:
          listener._eventListener?.onTypingStarted?.(param);
          break;
        case listener._eventListener?.onTypingEnded?.name:
          listener._eventListener?.onTypingEnded?.(param);
          break;
        case listener._eventListener?.onMessagesDelivered?.name:
          listener._eventListener?.onMessagesDelivered?.(param);
          break;
        case listener._eventListener?.onMessagesRead?.name:
          listener._eventListener?.onMessagesRead?.(param);
          break;
        case listener._eventListener?.onMessageEdited?.name:
          listener._eventListener?.onMessageEdited?.(param);
          break;
        case listener._eventListener?.onMessageDeleted?.name:
          listener._eventListener?.onMessageDeleted?.(param);
          break;
        case listener._eventListener?.onTransientMessageReceived?.name:
          listener._eventListener?.onTransientMessageReceived?.(param);
          break;
        case listener._eventListener?.onFormMessageReceived?.name:
          listener._eventListener?.onFormMessageReceived?.(param);
          break;
        case listener._eventListener?.onCardMessageReceived?.name:
          listener._eventListener?.onCardMessageReceived?.(param);
          break;
        case listener._eventListener?.onSchedulerMessageReceived?.name:
          listener._eventListener?.onSchedulerMessageReceived?.(param);
          break;
        case listener._eventListener?.onCustomInteractiveMessageReceived?.name:
          listener._eventListener?.onCustomInteractiveMessageReceived?.(param);
          break;
        case listener._eventListener?.onInteractionGoalCompleted?.name:
          listener._eventListener?.onInteractionGoalCompleted?.(param);
          break;
        case listener._eventListener?.onMessageReactionRemoved?.name:
          listener._eventListener?.onMessageReactionRemoved?.(param);
          break;
        case listener._eventListener?.onMessageReactionAdded?.name:
          listener._eventListener?.onMessageReactionAdded?.(param);
          break;
        case listener._eventListener?.onMessagesDeliveredToAll?.name:
          listener._eventListener?.onMessagesDeliveredToAll?.(param);
          break;
        case listener._eventListener?.onMessagesReadByAll?.name:
          listener._eventListener?.onMessagesReadByAll?.(param);
          break;
        case listener._eventListener?.onAIAssistantMessageReceived?.name:
          listener._eventListener?.onAIAssistantMessageReceived?.(param);
          break;
        case listener._eventListener?.onMessageModerated?.name:
          listener._eventListener?.onMessageModerated?.(param);
          break;
      }
    });
  }

  static addMessageListener(name: string, messageHandler: MessageUIEventListener) {
    try {
      CometChatUIEventHandler.messageHandlers = CometChatUIEventHandler.messageHandlers?.filter(
        (listener) => {
          return listener._name != name;
        }
      );
      CometChatUIEventHandler.messageHandlers = [
        ...(CometChatUIEventHandler.messageHandlers ? CometChatUIEventHandler.messageHandlers : []),
        new MessageListener(name, messageHandler),
      ];
    } catch (err) {
      console.log("addMessageListener", err);
    }
  }

  static removeMessageListener(name: string) {
    try {
      CometChatUIEventHandler.messageHandlers = CometChatUIEventHandler.messageHandlers?.filter(
        (listener) => {
          return listener._name !== name;
        }
      );
    } catch (err) {
      console.log("removeMessageListener", err);
    }
  }

  static emitConversationEvent(name: string, param: object) {
    CometChatUIEventHandler.conversationHandlers?.map((listener) => {
      switch (name) {
        case listener._eventListener?.ccConversationDeleted?.name:
          listener._eventListener?.ccConversationDeleted?.(param);
          break;
          //added for markAsUnread 
        case listener._eventListener?.ccUpdateConversation?.name:
          listener._eventListener?.ccUpdateConversation?.(param);
          break;
      }
    });
  }

  static addConversationListener(name: string, conversationHandler: ConversationUIEventListener) {
    try {
      CometChatUIEventHandler.conversationHandlers =
        CometChatUIEventHandler.conversationHandlers?.filter((listener) => {
          return listener._name != name;
        });
      CometChatUIEventHandler.conversationHandlers = [
        ...(CometChatUIEventHandler.conversationHandlers
          ? CometChatUIEventHandler.conversationHandlers
          : []),
        new ConversationListener(name, conversationHandler),
      ];
    } catch (err) {
      console.log("addConversationListener", err);
    }
  }

  static removeConversationListener(name: string) {
    try {
      CometChatUIEventHandler.conversationHandlers =
        CometChatUIEventHandler.conversationHandlers?.filter((listener) => {
          return listener._name !== name;
        });
    } catch (err) {
      console.log("removeConversationListener", err);
    }
  }

  static emitGroupEvent(name: string, param: object) {
    CometChatUIEventHandler.groupHandlers?.map((listener) => {
      switch (name) {
        case listener._eventListener?.ccGroupCreated?.name:
          listener._eventListener?.ccGroupCreated?.(param);
          break;
        case listener._eventListener?.ccGroupDeleted?.name:
          listener._eventListener?.ccGroupDeleted?.(param);
          break;
        case listener._eventListener?.ccGroupLeft?.name:
          listener._eventListener?.ccGroupLeft?.(param);
          break;
        case listener._eventListener?.ccGroupMemberBanned?.name:
          listener._eventListener?.ccGroupMemberBanned?.(param);
          break;
        case listener._eventListener?.ccGroupMemberJoined?.name:
          listener._eventListener?.ccGroupMemberJoined?.(param);
          break;
        case listener._eventListener?.ccGroupMemberKicked?.name:
          listener._eventListener?.ccGroupMemberKicked?.(param);
          break;
        case listener._eventListener?.ccGroupMemberScopeChanged?.name:
          listener._eventListener?.ccGroupMemberScopeChanged?.(param);
          break;
        case listener._eventListener?.ccGroupMemberUnBanned?.name:
          listener._eventListener?.ccGroupMemberUnBanned?.(param);
          break;
        case listener._eventListener?.ccOwnershipChanged?.name:
          listener._eventListener?.ccOwnershipChanged?.(param);
          break;
        case listener._eventListener?.ccGroupMemberAdded?.name:
          listener._eventListener?.ccGroupMemberAdded?.(param);
          break;
      }
    });
  }

  static addGroupListener(name: string, groupHandler: GroupUIEventListener) {
    try {
      CometChatUIEventHandler.groupHandlers = CometChatUIEventHandler.groupHandlers?.filter(
        (listener) => {
          return listener._name != name;
        }
      );
      CometChatUIEventHandler.groupHandlers = [
        ...(CometChatUIEventHandler.groupHandlers ? CometChatUIEventHandler.groupHandlers : []),
        new GroupListener(name, groupHandler),
      ];
    } catch (err) {
      console.log("addGrouplistener", err);
    }
  }

  static removeGroupListener(name: string) {
    try {
      CometChatUIEventHandler.groupHandlers = CometChatUIEventHandler.groupHandlers?.filter(
        (listener) => {
          return listener._name !== name;
        }
      );
    } catch (err) {
      console.log("removeGroupListener", err);
    }
  }

  static emitUserEvent(name: string, param: object) {
    CometChatUIEventHandler.userHandlers?.map((listener) => {
      switch (name) {
        case listener._eventListener?.ccUserBlocked?.name:
          listener._eventListener?.ccUserBlocked?.(param);
          break;
        case listener._eventListener?.ccUserUnBlocked?.name:
          listener._eventListener?.ccUserUnBlocked?.(param);
          break;
      }
    });
  }

  static addUserListener(name: string, userHandler: UserUIEventListener) {
    try {
      CometChatUIEventHandler.userHandlers = CometChatUIEventHandler.userHandlers?.filter(
        (listener) => {
          return listener._name != name;
        }
      );
      CometChatUIEventHandler.userHandlers = [
        ...(CometChatUIEventHandler.userHandlers ? CometChatUIEventHandler.userHandlers : []),
        new UserListener(name, userHandler),
      ];
    } catch (err) {
      console.log("addUserListener", err);
    }
  }

  static removeUserListener(name: string) {
    try {
      CometChatUIEventHandler.userHandlers = CometChatUIEventHandler.userHandlers?.filter(
        (listener) => {
          return listener._name !== name;
        }
      );
    } catch (err) {
      console.log("removeUserListener", err);
    }
  }

  static emitUIEvent(name: string, param: object) {
    CometChatUIEventHandler.uiHandlers?.map((listener) => {
      switch (name) {
        case listener._eventListener?.hidePanel?.name:
          listener._eventListener?.hidePanel?.(param);
          break;
        case listener._eventListener?.showPanel?.name:
          listener._eventListener?.showPanel?.(param);
          break;
        case listener._eventListener?.openChat?.name:
          listener._eventListener?.openChat?.(param);
          break;
        case listener._eventListener?.ccToggleBottomSheet?.name:
          listener._eventListener?.ccToggleBottomSheet?.(param);
          break;
        case listener._eventListener?.ccComposeMessage?.name:
          listener._eventListener?.ccComposeMessage?.(param);
          break;
        // case listener._eventListener?.ccMentionClick?.name:
        //     listener._eventListener?.ccMentionClick(param);
        //     break;
        case listener._eventListener?.ccSuggestionData?.name:
          listener._eventListener?.ccSuggestionData?.(
            param as { id: string; data: Array<SuggestionItem> }
          );
          break;
      }
    });
  }

  static addUIListener(name: string, uiHandlers: UIEventListener) {
    try {
      CometChatUIEventHandler.uiHandlers = CometChatUIEventHandler.uiHandlers?.filter(
        (listener) => {
          return listener._name != name;
        }
      );
      CometChatUIEventHandler.uiHandlers = [
        ...(CometChatUIEventHandler.uiHandlers ? CometChatUIEventHandler.uiHandlers : []),
        new UIListener(name, uiHandlers),
      ];
    } catch (err) {
      console.log("addUserListener", err);
    }
  }

  static removeUIListener(name: string) {
    try {
      CometChatUIEventHandler.userHandlers = CometChatUIEventHandler.userHandlers?.filter(
        (listener) => {
          return listener._name !== name;
        }
      );
    } catch (err) {
      console.log("removeUserListener", err);
    }
  }
}
