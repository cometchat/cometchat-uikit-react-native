import { CometChat } from "@cometchat/chat-sdk-react-native";
import {
  refreshPinSaveFeatures,
  resetPinSaveFeatures,
  resolvePinSaveFeatures,
} from "../utils/PinSaveFeatureGates";
import { Platform } from "react-native";
import { CallingExtension } from "../../calls/CallingExtension";
import { CallingPackage } from "../../calls/CallingPackage";
import { CollaborativeDocumentExtension } from "../../extensions/CollaborativeDocument/CollaborativeDocumentExtension";
import { CollaborativeWhiteboardExtension } from "../../extensions/CollaborativeWhiteboard/CollaborativeWhiteboardExtension";
import { LinkPreviewExtension } from "../../extensions/LinkPreview";
import { MessageTranslationExtension } from "../../extensions/MessageTranslation";
import { PollsExtension } from "../../extensions/Polls/PollsExtension";
import { StickersExtension } from "../../extensions/Stickers";
import { ThumbnailGenerationExtension } from "../../extensions/ThumbnailGeneration";
import { ListenerInitializer } from "../events/ListenerInitializer";
import { ChatConfigurator, ExtensionsDataSource } from "../framework";
import { CometChatSoundManager } from "../resources";
import { getUnixTimestampInMilliseconds, messageStatus } from "../utils/CometChatMessageHelper";
import { permissionUtil } from "../utils/PermissionUtil";
import { CometChatUIKitHelper } from "./CometChatUIKitHelper";
import { UIKitSettings } from "./UIKitSettings";

export class CometChatUIKit {
  static uiKitSettings: UIKitSettings;
  static loggedInUser: null | CometChat.User = null;
  /**
   * Raw settings captured on the initFromSettings() (ai-agent) path; routes the
   * Calls SDK through CometChatCalls.initFromSettings() too. Null on plain init().
   */
  static callsInitSettings: CometChat.CometChatSettings | null = null;
  static conversationUpdateSettings: CometChat.ConversationUpdateSettings =
    new CometChat.ConversationUpdateSettings();
  private static loginListenerID: string = ``;
  private static isLoginListenerAttached: boolean = false;
  static init(uiKitSettings: UIKitSettings) {
    //perform sdk init taking values from uiKitSettings
    CometChatUIKit.uiKitSettings = {
      ...uiKitSettings,
    };
    // Plain init(): clear any ai-agent settings so the Calls SDK uses plain init().
    CometChatUIKit.callsInitSettings = null;
    var appSetting = new CometChat.AppSettingsBuilder()
      .autoEstablishSocketConnection(uiKitSettings.autoEstablishSocketConnection)
      .overrideAdminHost(uiKitSettings?.overrideAdminHost || "")
      .overrideClientHost(uiKitSettings?.overrideClientHost || "")
      .setRegion(uiKitSettings.region);

    appSetting.subscriptionType = uiKitSettings.subscriptionType || "";

    if (
      appSetting.subscriptionType === "ROLES" &&
      Array.isArray(uiKitSettings.roles) &&
      uiKitSettings.roles.length > 0
    ) {
      appSetting.roles = uiKitSettings.roles;
    }

    CometChatUIKit.attachListener();

    return CometChat.init(uiKitSettings.appId, appSetting.build()).then(
      async() => {
        CometChat.setSource("uikit-v5", Platform.OS, "react-native");
        ListenerInitializer.attachListeners();
        try {
          const user = await CometChat.getLoggedinUser();
          CometChatUIKit.setLoggedInUser(user);
          if (user) {
            this.enableExtensions();
          }
          const conversationUpdateSettings = await CometChat.getConversationUpdateSettings();
          CometChatUIKit.setConversationUpdateSettings(conversationUpdateSettings);
          permissionUtil.init().then((res) => {
            if (res !== true) {
              console.warn("[IOS] Permission initialization failed.");
            }
          });
        } catch (error) {
          CometChatUIKit.setLoggedInUser(null);
          console.warn("[CometChatUIKit] Failed to restore session:", error);
        }
      },
      (error: any) => {
        console.error("[CometChatUIKit] SDK initialization failed:", error);
        throw error;
      }
    );
  }

  /**
   * File-based init for AI agent skills.
   * Calls CometChat.initFromSettings(settings) which writes
   * integrationSource = "ai-agent" to persistent storage.
   */
  static initFromSettings(settings: CometChat.CometChatSettings) {
    // Extract authKey from credentials (UIKit uses this for login — SDK ignores it)
    const authKey = settings.credentials?.authKey;

    // Extract UIKit-specific settings
    const subscribePresence =
      (settings.uiKit as { subscribePresenceForAllUsers?: boolean })
        ?.subscribePresenceForAllUsers ?? true;

    // Store internally so login/createUser/updateUser keep working
    CometChatUIKit.uiKitSettings = {
      appId: settings.appId,
      region: settings.region,
      authKey,
      subscriptionType: subscribePresence
        ? CometChat.AppSettings.SUBSCRIPTION_TYPE_ALL_USERS as UIKitSettings["subscriptionType"]
        : undefined,
    };

    // Capture raw settings so the Calls SDK routes through initFromSettings (ai-agent).
    CometChatUIKit.callsInitSettings = settings;

    CometChatUIKit.attachListener();

    // CRITICAL: Call initFromSettings — NOT init(). Only initFromSettings writes "ai-agent".
    return CometChat.initFromSettings(settings).then(
      async () => {
        CometChat.setSource("uikit-v5", Platform.OS, "react-native");
        ListenerInitializer.attachListeners();
        await CometChat.getLoggedinUser()
          .then((user: any) => {
            CometChatUIKit.setLoggedInUser(user);
            if (user) {
              this.enableExtensions();
            }
            CometChat.getConversationUpdateSettings().then(
              (conversationUpdateSettings: CometChat.ConversationUpdateSettings) => {
                CometChatUIKit.setConversationUpdateSettings(conversationUpdateSettings);
              }
            );
            permissionUtil.init().then((res) => {
              if (res !== true) {
                console.warn("[IOS] Permission initialization failed.");
              }
            });
          })
          .catch((error: any) => {
            // CometChatUIKit.setLoggedInUser(null);
          });
      },
      (error: any) => {
        // console.log("Initialization failed with error:", error);
      }
    );
  }

  static defaultExtensions: ExtensionsDataSource[] = [
    new StickersExtension(),
    new CollaborativeWhiteboardExtension(),
    new CollaborativeDocumentExtension(),
    new MessageTranslationExtension(),
    new ThumbnailGenerationExtension(),
    new LinkPreviewExtension(),
    new PollsExtension(),
  ];

  private static attachListener() {
    if (CometChatUIKit.isLoginListenerAttached) {
      CometChatUIKit.removeListener();
      CometChatUIKit.isLoginListenerAttached = false;
      CometChatUIKit.loginListenerID = ``;
    }

    CometChatUIKit.loginListenerID = `__CometChatLoginListener__`;
    CometChat.addLoginListener(
      CometChatUIKit.loginListenerID,
      new CometChat.LoginListener({
        onLoggedIn: (user: CometChat.User) => {
          CometChatUIKit.setLoggedInUser(user);
          CometChat.getConversationUpdateSettings().then(
            (conversationUpdateSettings: CometChat.ConversationUpdateSettings) => {
              CometChatUIKit.setConversationUpdateSettings(conversationUpdateSettings);
            }
          );
          // Pin / Save / Pin-conversation are app settings, not integrator preferences, so the
          // KIT asks for them rather than leaving every integrator to remember. Login is the
          // first point the settings cache is populated. Fire-and-forget: the flags default to
          // off and both read sites are long-press paths, so nothing renders against a
          // half-resolved answer.
          void resolvePinSaveFeatures();
        },
        onLoggedOut: () => {
          CometChatUIKit.removeLoggedInUser();
          // Flags are per-app and the next login may be a different app entirely.
          resetPinSaveFeatures();
        },
      })
    );

    // Re-fetch conversation update settings on every websocket reconnection
    // This ensures dashboard setting changes are picked up without requiring a metro reload
    CometChat.addConnectionListener(
      "__CometChatUIKit_ConnectionListener__",
      new CometChat.ConnectionListener({
        onConnected: () => {
          CometChat.getConversationUpdateSettings().then(
            (conversationUpdateSettings: CometChat.ConversationUpdateSettings) => {
              CometChatUIKit.setConversationUpdateSettings(conversationUpdateSettings);
            }
          ).catch(() => {
            // Silently ignore — will retry on next reconnection
          });
          // Same reason the line above re-fetches: a flag flipped in the dashboard should reach
          // a running app on the next reconnection rather than waiting for a restart.
          void refreshPinSaveFeatures();
        },
        inConnecting: () => {},
        onDisconnected: () => {},
      })
    );

    CometChatUIKit.isLoginListenerAttached = true;
  }

  private static enableExtensions() {
    ChatConfigurator.init(); //re-initialize data source
    let isCallingExtensionEnabled = false;

    let extensionList: ExtensionsDataSource[] =
      this.uiKitSettings?.extensions || this.defaultExtensions;

    if (this.uiKitSettings.callingExtension) {
      this.uiKitSettings.callingExtension.enable();
    }

    if (extensionList.length > 0) {
      extensionList.forEach((extension: ExtensionsDataSource) => {
        if (extension.getExtensionId() == "calling") {
          isCallingExtensionEnabled = true;
        }
        extension?.enable();
      });
    }

    if (!CometChatUIKit.uiKitSettings.disableCalling && !isCallingExtensionEnabled) {
      if (CallingPackage.isCallingPackageInstalled) new CallingExtension().enable();
    }
  }

  static async getLoggedInUser(): Promise<CometChat.User> {
    CometChatUIKit.assertInitialized();
    let user = await CometChat.getLoggedinUser().catch((e) => Promise.reject(e));
    if (user == null) {
      throw new CometChat.CometChatException({
        code: "NOT_FOUND",
        message: "Login user not found",
      });
    } else {
      this.enableExtensions();
    }
    return user;
  }

  private static setLoggedInUser(user: CometChat.User | null) {
    this.loggedInUser = user;
  }

  private static setConversationUpdateSettings(
    conversationUpdateSettings: CometChat.ConversationUpdateSettings
  ) {
    this.conversationUpdateSettings = conversationUpdateSettings;
  }

  static getConversationUpdateSettings(): CometChat.ConversationUpdateSettings {
    return this.conversationUpdateSettings;
  }

  private static removeLoggedInUser() {
    this.loggedInUser = null;
  }

  private static removeListener() {
    if (CometChatUIKit.isLoginListenerAttached) {
      CometChat.removeLoginListener(CometChatUIKit.loginListenerID);
      CometChat.removeConnectionListener("__CometChatUIKit_ConnectionListener__");
      CometChatUIKit.isLoginListenerAttached = false;
      CometChatUIKit.loginListenerID = ``;
    }
  }

  static async login({
    uid,
    authToken,
  }: {
    uid?: string;
    authToken?: string;
  }): Promise<CometChat.User> {
    CometChatUIKit.assertInitialized();
    if (uid) {
      let user = await CometChat.login(uid, CometChatUIKit.uiKitSettings?.authKey).catch((e) =>
        Promise.reject(e)
      );
      CometChatUIKit.setLoggedInUser(user);
      CometChatUIKit.setConversationUpdateSettings(await CometChat.getConversationUpdateSettings());
      this.enableExtensions();
      return user;
    }
    if (authToken) {
      let user = await CometChat.login(authToken).catch((e) => Promise.reject(e));
      CometChatUIKit.setLoggedInUser(user);
      CometChatUIKit.setConversationUpdateSettings(await CometChat.getConversationUpdateSettings());
      this.enableExtensions();
      return user;
    }
    return Promise.reject(
      new CometChat.CometChatException({
        code: "INVALID_LOGIN_ATTEMPT",
        message: "Provide uid or authToken",
      })
    );
  }

  static logout(): Promise<Object> {
    if (!this.checkAuthSettings()) {
      return Promise.reject(this.authError());
    }

    return CometChat.logout().then(() => {
      CometChatUIKit.loggedInUser = null;
      return {};
    });
  }

  static createUser(user: CometChat.User): Promise<CometChat.User> {
    if (!this.checkAuthSettings()) {
      return Promise.reject(this.authError());
    }

    return CometChat.createUser(user, this.uiKitSettings.authKey as string);
  }

  static updateUser(user: CometChat.User): Promise<CometChat.User> {
    if (!this.checkAuthSettings()) {
      return Promise.reject(this.authError());
    }

    return CometChat.updateUser(user, this.uiKitSettings.authKey as string);
  }

  //Error handling to give better logs
  /** Pure predicate: is the UIKit configured well enough to make authenticated calls? */
  static checkAuthSettings(): boolean {
    return this.uiKitSettings != null && !!this.uiKitSettings.appId;
  }

  /** Single source of truth for the "not initialized" exception (preserves the specific code). */
  private static authError(): CometChat.CometChatException {
    if (this.uiKitSettings == null) {
      return new CometChat.CometChatException({
        code: "ERR",
        name: "Authentication null",
        message: "Populate authSettings before initializing. Call CometChatUIKit.init() first.",
      });
    }
    return new CometChat.CometChatException({
      code: "appIdErr",
      name: "APP ID null",
      message: "Populate appId in authSettings before initializing.",
    });
  }

  /** Throws the right exception when unconfigured. Works in sync (caught) and async methods. */
  private static assertInitialized(): void {
    if (!this.checkAuthSettings()) {
      throw this.authError();
    }
  }

  //---------- Helper methods to send messages ----------
  ///[sendCustomMessage] used to send a custom message
  static sendCustomMessage(
    message: CometChat.CustomMessage
  ): Promise<CometChat.CustomMessage | CometChat.BaseMessage> {
    return new Promise((resolve, reject) => {
      if (!message.getMuid()) {
        message.setMuid(String(getUnixTimestampInMilliseconds()));
      }

      if (!message.getSender() && this.loggedInUser) {
        message.setSender(this.loggedInUser);
      }

      CometChatUIKitHelper.onMessageSent(message, messageStatus.inprogress);
      CometChat.sendCustomMessage(message)
        .then((customMessage: any) => {
          CometChatUIKitHelper.onMessageSent(customMessage, messageStatus.success);
          resolve(customMessage);
        })
        .catch((err: any) => {
          let msg: any = message;
          if (msg.data)
            msg.data.metaData = { ...(msg.data.metaData ? msg.data.metaData : {}), error: true };
          CometChatUIKitHelper.onMessageSent(msg, messageStatus.error);
          reject(err);
        });
    });
  }

  ///[sendMediaMessage] used to send a media message
  static sendMediaMessage(
    message: CometChat.MediaMessage
  ): Promise<CometChat.MediaMessage | CometChat.BaseMessage> {
    return new Promise((resolve, reject) => {
      if (!message.getMuid()) {
        message.setMuid(String(getUnixTimestampInMilliseconds()));
      }

      if (!message.getSender() && this.loggedInUser) {
        message.setSender(this.loggedInUser);
      }

      let hasAttachment;
      try {
        hasAttachment = message.getAttachment();
      } catch (error) {
        console.log("no attachment found");
      }
      if (hasAttachment == undefined) {
        let file = message["files"][0];
        if (file == undefined) {
          reject(
            new CometChat.CometChatException({
              code: "Invalid Media message object",
              message: "file object not found.",
            })
          );
        }

        let attachmentObject: CometChat.Attachment = new CometChat.Attachment(file);
        attachmentObject.setName(file["name"]);
        attachmentObject.setExtension((file["name"].lastIndexOf(".") + 1).toString());
        attachmentObject.setMimeType(file["type"]);
        attachmentObject.setSize(0);
        attachmentObject.setUrl(file["uri"]);
        message.setAttachment(attachmentObject);
      }

      CometChatUIKitHelper.onMessageSent(message, messageStatus.inprogress);
      CometChat.sendMediaMessage(message)
        .then((mediaMessage: any) => {
          CometChatUIKitHelper.onMessageSent(mediaMessage, messageStatus.success);
          resolve(mediaMessage);
        })
        .catch((err: any) => {
          let msg: any = message;
          if (msg.data)
            msg.data.metaData = { ...(msg.data.metaData ? msg.data.metaData : {}), error: true };
          CometChatUIKitHelper.onMessageSent(msg, messageStatus.error);
          reject(err);
        });
    });
  }

  ///[sendTextMessage] used to send a text message
  static sendTextMessage(
    message: CometChat.TextMessage
  ): Promise<CometChat.TextMessage | CometChat.BaseMessage> {
    return new Promise((resolve, reject) => {
      if (!message?.getMuid()) {
        message.setMuid(String(getUnixTimestampInMilliseconds()));
      }

      if (!message?.getSender() && this.loggedInUser) {
        message.setSender(this.loggedInUser);
      }

      CometChatUIKitHelper.onMessageSent(message, messageStatus.inprogress);
      CometChat.sendMessage(message)
        .then((textMessage: any) => {
          CometChatUIKitHelper.onMessageSent(textMessage, messageStatus.success);
          resolve(textMessage);
        })
        .catch((err: any) => {
          let msg: any = message;
          if (msg.data)
            msg.data.metaData = { ...(msg.data.metaData ? msg.data.metaData : {}), error: true };
          CometChatUIKitHelper.onMessageSent(msg, messageStatus.error);
          reject(err);
        });
    });
  }

  static getDataSource() {
    return ChatConfigurator.getDataSource();
  }

  static SoundManager: typeof CometChatSoundManager = CometChatSoundManager;
}
