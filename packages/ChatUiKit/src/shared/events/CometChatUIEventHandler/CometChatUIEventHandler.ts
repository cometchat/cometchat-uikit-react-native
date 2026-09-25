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

  private static dispatch(
    handlers: ReadonlyArray<{ _eventListener?: object }> | undefined,
    name: string,
    param: object
  ) {
    // Never dispatch to an inherited built-in ("constructor", "toString", "__proto__", …).
    if (name in Object.prototype) return;

    handlers?.forEach(({ _eventListener }) => {
      const listener = _eventListener as Record<string, unknown> | undefined;
      const handler = listener?.[name];
      // .call keeps the receiver, so a method handler's `this` is its own listener object.
      if (typeof handler === "function") (handler as (p: object) => void).call(listener, param);
    });
  }

  static emitPanelEvent(name: string, param: object) {
    CometChatUIEventHandler.dispatch(CometChatUIEventHandler.panelHandlers, name, param);
  }

  static emitCallEvent(name: string, param: object) {
    CometChatUIEventHandler.dispatch(CometChatUIEventHandler.callHandlers, name, param);
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
    CometChatUIEventHandler.dispatch(CometChatUIEventHandler.messageHandlers, name, param);
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
    CometChatUIEventHandler.dispatch(CometChatUIEventHandler.conversationHandlers, name, param);
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
    CometChatUIEventHandler.dispatch(CometChatUIEventHandler.groupHandlers, name, param);
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
    CometChatUIEventHandler.dispatch(CometChatUIEventHandler.userHandlers, name, param);
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
    CometChatUIEventHandler.dispatch(CometChatUIEventHandler.uiHandlers, name, param);
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
      CometChatUIEventHandler.uiHandlers = CometChatUIEventHandler.uiHandlers?.filter(
        (listener) => {
          return listener._name !== name;
        }
      );
    } catch (err) {
      console.log("removeUIListener", err);
    }
  }
}
