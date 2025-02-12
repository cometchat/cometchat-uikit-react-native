import { Platform } from "react-native";
//@ts-ignore
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { UIKitSettings } from "./UIKitSettings";
import { CometChatUIKitHelper } from "./CometChatUIKitHelper";
import { getUnixTimestampInMilliseconds, messageStatus } from "../utils/CometChatMessageHelper";
import { CallingExtension } from "../../calls/CallingExtension";
import { CallingPackage } from "../../calls/CallingPackage";
import { StickersExtension } from "../../extensions/Stickers";
import { CollaborativeWhiteboardExtension } from "../../extensions/CollaborativeWhiteboard/CollaborativeWhiteboardExtension";
import { LinkPreviewExtention } from "../../extensions/LinkPreview";
import { CollaborativeDocumentExtension } from "../../extensions/CollaborativeDocument/CollaborativeDocumentExtension";
import { PollsExtension } from "../../extensions/Polls/PollsExtension";
import { SmartRepliesExtension } from "../../extensions/SmartReplies";
import { ChatConfigurator, ExtensionsDataSource } from "../framework";
import { ImageModerationExtension } from "../../extensions/ImageModeration";
import { MessageTranslationExtension } from "../../extensions/MessageTranslation";
import { TextModerationExtension } from "../../extensions/TextModeration";
import { ThumbnailGenerationExtension } from "../../extensions/ThumbnailGeneration";
import { CometChatSoundManager } from "../utils";
import { CometChatLocalize } from "../resources";
import { CardMessage, CustomInteractiveMessage, FormMessage, SchedulerMessage } from "../modals/InteractiveData";
import { ListenerInitializer } from "../events/ListenerInitializer";
import { AIConversationStarterExtension } from "../../AI/AIConversationStarter/AIConversationStarter";
import { AIExtensionDataSource } from "../../AI/AIExtensionDataSource";
import { AISmartRepliesExtension } from "../../AI/AISmartReplies/AISmartReplies";
import { AIConversationSummaryExtension } from "../../AI/AIConversationSummary/AIConversationSummaryExtension";
import { AIAssistBotExtension } from "../../AI/AIAssistBot/AIAssistBotExtension";
import { permissionUtil } from "../utils/PermissionUtil";
import { AtLeastOne } from "../base/Types";

export class CometChatUIKit {
    static uiKitSettings: UIKitSettings;
    static aiFeatures: AIExtensionDataSource[]
    static loggedInUser: CometChat.User | null;
    static conversationUpdateSettings : CometChat.ConversationUpdateSettings = new CometChat.ConversationUpdateSettings();
    private static loginListenerID: string = ``;
    private static isLoginListenerAttached: boolean = false;
    static init(uiKitSettings: UIKitSettings) {

        //perform sdk init taking values from uiKitSettings
        CometChatUIKit.uiKitSettings = {
            ...uiKitSettings
        };
        var appSetting = new CometChat.AppSettingsBuilder()
            .autoEstablishSocketConnection(uiKitSettings.autoEstablishSocketConnection)
            .overrideAdminHost(uiKitSettings?.overrideAdminHost || '')
            .overrideClientHost(uiKitSettings?.overrideClientHost || '')
            .setRegion(uiKitSettings.region)


        appSetting.subscriptionType = uiKitSettings.subscriptionType || '';

        if (appSetting.subscriptionType === "ROLES" && Array.isArray(uiKitSettings.roles) && uiKitSettings.roles.length > 0) {
            appSetting.roles = uiKitSettings.roles;
        }

        CometChatUIKit.attachListener();

        return CometChat.init(uiKitSettings.appId, appSetting.build()).then(
            () => {
                CometChat.setSource("uikit-v4", Platform.OS, "react-native")
                ListenerInitializer.attachListeners();

                CometChat.getLoggedinUser()
                    .then((user: any) => {
                        console.log("setting logged in user", user);
                        CometChatUIKit.setLoggedInUser(user);
                        if (user) {
                            this.enableExtensions();
                        }
                        CometChat.getConversationUpdateSettings()
                        .then((conversationUpdateSettings: CometChat.ConversationUpdateSettings) => {
                            CometChatUIKit.setConversationUpdateSettings(conversationUpdateSettings);
                        })
                    })
                    .catch((error: any) => {
                        // CometChatUIKit.setLoggedInUser(null);
                    })
                permissionUtil.init().then(res => {
                    if (res !== true) {
                        console.warn("[IOS] Permission initialization failed.");
                    }
                })
            }, (error: any) => {
                // console.log("Initialization failed with error:", error);
            }
        );
    }

    static defaultExtensions: ExtensionsDataSource[] = [
        new StickersExtension(),
        new SmartRepliesExtension(),
        new CollaborativeWhiteboardExtension(),
        new CollaborativeDocumentExtension(),
        new MessageTranslationExtension(),
        new TextModerationExtension(),
        new ThumbnailGenerationExtension(),
        new LinkPreviewExtention(),
        new PollsExtension(),
        new ImageModerationExtension()
    ]

    static defaultAIFeatures: AIExtensionDataSource[] = [
        new AISmartRepliesExtension(),
        new AIConversationStarterExtension(),
        new AIConversationSummaryExtension(),
        new AIAssistBotExtension()
    ]

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
                    CometChat.getConversationUpdateSettings()
                    .then((conversationUpdateSettings: CometChat.ConversationUpdateSettings) => {
                        CometChatUIKit.setConversationUpdateSettings(conversationUpdateSettings);
                    })
                },
                onLoggedOut: () => {
                    CometChatUIKit.removeLoggedInUser();
                },
            })
        );
        CometChatUIKit.isLoginListenerAttached = true;

    }

    private static enableExtensions() {
        ChatConfigurator.init(); //re-initialize data source

        if (!CometChatUIKit.uiKitSettings.disableCalling) {
            if (CallingPackage.isCallingPackageInstalled)
                new CallingExtension().enable();
        }
        let extensionList: ExtensionsDataSource[] = this.uiKitSettings?.extensions || this.defaultExtensions;
        let aiFeaturesList: AIExtensionDataSource[] = this.uiKitSettings?.aiFeatures || this.defaultAIFeatures;

        if (extensionList.length > 0) {
            extensionList.forEach((extension: ExtensionsDataSource) => {
                extension?.enable();
            });
        }
        if (aiFeaturesList.length > 0) {
            aiFeaturesList.forEach((aiFeatures: AIExtensionDataSource) => {
                aiFeatures.enable();
            })
        }


    }

    static async getLoggedInUser(): Promise<CometChat.User> {
        if (CometChatUIKit.checkAuthSettings(Promise.reject)) null
        let user = await CometChat.getLoggedinUser().catch((e: any) => Promise.reject(e))
        if (user == null) {
            throw (new CometChat.CometChatException({ code: "NOT_FOUND", message: "Login user not found" }));
        } else {
            this.enableExtensions()
        }
        return user;
    }

    private static setLoggedInUser(user: CometChat.User | null) {
        this.loggedInUser = user;
    }

    private static setConversationUpdateSettings(conversationUpdateSettings: CometChat.ConversationUpdateSettings) {
        this.conversationUpdateSettings = conversationUpdateSettings;
    }

    static getConversationUpdateSettings(): CometChat.ConversationUpdateSettings {
        return this.conversationUpdateSettings
    }

    private static removeLoggedInUser() {
        this.loggedInUser = null;
    }

    private static removeListener() {
        if (CometChatUIKit.isLoginListenerAttached) {
            CometChat.removeLoginListener(CometChatUIKit.loginListenerID);
            CometChatUIKit.isLoginListenerAttached = false;
            CometChatUIKit.loginListenerID = ``;
        }
    }

    static async login({ uid, authToken }: AtLeastOne<{ uid: string, authToken: string }>): Promise<CometChat.User> {
        if (CometChatUIKit.checkAuthSettings(Promise.reject)) null
        if (uid || authToken) {
            let user = uid 
                ? await CometChat.login(uid, CometChatUIKit.uiKitSettings?.authKey).catch((e: any) => Promise.reject(e))
                : await CometChat.login(authToken).catch((e: any) => Promise.reject(e));
            CometChatUIKit.setLoggedInUser(user);
            CometChatUIKit.setConversationUpdateSettings(await CometChat.getConversationUpdateSettings());
            this.enableExtensions()
            return user;
        }
        return Promise.reject(new CometChat.CometChatException({ code: "INVALID_LOGIN_ATTEMPT", message: "Provide uid or authToken" }));
    }

    static logout(): Promise<Object> {
        if (this.checkAuthSettings(Promise.reject)) { }

        return CometChat.logout();
    }

    static createUser(
        user: CometChat.User): Promise<CometChat.User> {

        if (this.checkAuthSettings(Promise.reject)) { }

        return CometChat.createUser(user, this.uiKitSettings.authKey as string)
    }

    static updateUser(user: CometChat.User): Promise<CometChat.User> {
        if (this.checkAuthSettings(Promise.reject)) { }

        return CometChat.updateUser(user, this.uiKitSettings.authKey as string);
    }

    //Error handling to give better logs
    static checkAuthSettings(onError: (e: CometChat.CometChatException) => void): boolean {
        if (this.uiKitSettings == null) {
            if (onError != null) {
                onError(new CometChat.CometChatException({
                    code: "ERR", name: "Authentication null",
                    message: "Populate authSettings before initializing"
                }));
            }
            return false;
        }

        if (!this.uiKitSettings?.appId) {
            if (onError != null) {
                onError(new CometChat.CometChatException({
                    code: "appIdErr", name: "APP ID null",
                    message: "Populate appId in authSettings before initializing"
                }));
            }
            return false;
        }
        return true;
    }

    //---------- Helper methods to send messages ----------
    ///[sendCustomMessage] used to send a custom message
    static sendCustomMessage(message: CometChat.CustomMessage): Promise<CometChat.CustomMessage | CometChat.BaseMessage> {
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
                    let msg: any = message
                    if (msg.data)
                        msg.data.metaData = { ...(msg.data.metaData ? msg.data.metaData : {}), error: true }
                    CometChatUIKitHelper.onMessageSent(msg, messageStatus.error);
                    reject(err);
                });
        });
    }

    ///[sendMediaMessage] used to send a media message
    static sendMediaMessage(message: CometChat.MediaMessage): Promise<CometChat.MediaMessage | CometChat.BaseMessage> {
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
                let file = message['files'][0];
                if (file == undefined) {
                    reject(new CometChat.CometChatException({
                        code: "Invalid Media message object",
                        message: "file object not found."
                    }));
                }

                let attachmentObject: CometChat.Attachment = new CometChat.Attachment(file);
                attachmentObject.setName(file['name']);
                attachmentObject.setExtension((file['name'].lastIndexOf('.') + 1).toString());
                attachmentObject.setMimeType(file['type']);
                attachmentObject.setSize(0);
                attachmentObject.setUrl(file['uri']);
                message.setAttachment(attachmentObject);
            }

            CometChatUIKitHelper.onMessageSent(message, messageStatus.inprogress);
            CometChat.sendMediaMessage(message)
                .then((mediaMessage: any) => {
                    CometChatUIKitHelper.onMessageSent(mediaMessage, messageStatus.success);
                    resolve(mediaMessage);
                })
                .catch((err: any) => {
                    let msg: any = message
                    if (msg.data)
                        msg.data.metaData = { ...(msg.data.metaData ? msg.data.metaData : {}), error: true }
                    CometChatUIKitHelper.onMessageSent(msg, messageStatus.error);
                    reject(err);
                });
        });
    }

    ///[sendTextMessage] used to send a text message
    static sendTextMessage(message: CometChat.TextMessage): Promise<CometChat.TextMessage | CometChat.BaseMessage> {
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
                    let msg: any = message
                    if (msg.data)
                        msg.data.metaData = { ...(msg.data.metaData ? msg.data.metaData : {}), error: true }
                    CometChatUIKitHelper.onMessageSent(msg, messageStatus.error);
                    reject(err);
                });
        });
    }


    /**
   * Sends a Scheduler message and emits events based on the message status.
   * @param message - The Scheduler message to be sent.
   * @param disableLocalEvents - A boolean indicating whether to disable local events or not. Default value is false.
   */
    static sendSchedulerMessage(message: SchedulerMessage, disableLocalEvents: boolean = false): Promise<CometChat.TextMessage | CometChat.BaseMessage> {
        return new Promise((resolve, reject) => {

            if (!message.getMuid()) {
                message.setMuid(String(getUnixTimestampInMilliseconds()));
            }

            if (!message.getSender() && this.loggedInUser) {
                message.setSender(this.loggedInUser);
            }
            if (!disableLocalEvents) {
                CometChatUIKitHelper.onMessageSent(message, messageStatus.inprogress);
            }

            CometChat.sendInteractiveMessage(message as unknown as CometChat.InteractiveMessage)
                .then((message: CometChat.BaseMessage) => {
                    if (!disableLocalEvents) {
                        CometChatUIKitHelper.onMessageSent(message, messageStatus.success);
                    }
                    resolve(message);
                })
                .catch((error: CometChat.CometChatException) => {
                    console.log("error while sending message", { error })
                    message.setMetadata({ error });
                    // if (!disableLocalEvents) {
                    //     CometChatUIKitHelper.onMessageSent(message, messageStatus.error);
                    // }
                    reject(error);
                });
        });
    }

    /**
   * Sends a FormMessage message and emits events based on the message status.
   * @param message - The FormMessage message to be sent.
   * @param disableLocalEvents - A boolean indicating whether to disable local events or not. Default value is false.
   */
    static sendFormMessage(message: FormMessage, disableLocalEvents: boolean = false): Promise<CometChat.TextMessage | CometChat.BaseMessage> {
        return new Promise((resolve, reject) => {

            if (!message.getMuid()) {
                message.setMuid(String(getUnixTimestampInMilliseconds()));
            }

            if (!message.getSender() && this.loggedInUser) {
                message.setSender(this.loggedInUser);
            }

            if (!disableLocalEvents) {
                CometChatUIKitHelper.onMessageSent(message, messageStatus.inprogress);
            }

            CometChat.sendInteractiveMessage(message)
                .then((message: CometChat.BaseMessage) => {
                    console.log("message sent successfully", message.getSentAt())
                    if (!disableLocalEvents) {
                        CometChatUIKitHelper.onMessageSent(message, messageStatus.success);
                    }
                    resolve(message);
                })
                .catch((error: CometChat.CometChatException) => {
                    console.log("error while sending message", { error })
                    message.setMetadata({ error });
                    // if (!disableLocalEvents) {
                    //     CometChatUIKitHelper.onMessageSent(message, messageStatus.error);
                    // }
                    reject(error);
                });
        });
    }

    /**
   * Sends a Card message and emits events based on the message status.
   * @param message - The Card message to be sent.
   * @param disableLocalEvents - A boolean indicating whether to disable local events or not. Default value is false.
   */
    static sendCardMessage(message: CardMessage, disableLocalEvents: boolean = false): Promise<CometChat.TextMessage | CometChat.BaseMessage> {
        return new Promise((resolve, reject) => {

            if (!message.getMuid()) {
                message.setMuid(String(getUnixTimestampInMilliseconds()));
            }

            if (!message.getSender() && this.loggedInUser) {
                message.setSender(this.loggedInUser);
            }
            if (!disableLocalEvents) {
                CometChatUIKitHelper.onMessageSent(message, messageStatus.inprogress);
            }
            console.log("message", JSON.stringify(message));

            CometChat.sendInteractiveMessage(message)
                .then((message: CometChat.BaseMessage) => {
                    console.log("message sent successfully", message.getSentAt())
                    if (!disableLocalEvents) {
                        CometChatUIKitHelper.onMessageSent(message, messageStatus.success);
                    }
                    resolve(message);
                })
                .catch((error: CometChat.CometChatException) => {
                    console.log("error while sending message", { error })
                    message.setMetadata({ error });
                    // if (!disableLocalEvents) {
                    //     CometChatUIKitHelper.onMessageSent(message, messageStatus.error);
                    // }
                    reject(error);
                });
        });
    }

    /**
   * Sends a Custom Interactive message and emits events based on the message status.
   * @param message - The Custom Interactive message to be sent.
   * @param disableLocalEvents - A boolean indicating whether to disable local events or not. Default value is false.
   */
    static sendCustomInteractiveMessage(message: CustomInteractiveMessage, disableLocalEvents: boolean = false): Promise<CometChat.TextMessage | CometChat.BaseMessage> {
        return new Promise((resolve, reject) => {

            if (!message.getMuid()) {
                message.setMuid(String(getUnixTimestampInMilliseconds()));
            }

            if (!message.getSender() && this.loggedInUser) {
                message.setSender(this.loggedInUser);
            }

            if (!disableLocalEvents) {
                CometChatUIKitHelper.onMessageSent(message, messageStatus.inprogress);
            }

            CometChat.sendInteractiveMessage(message)
                .then((message: CometChat.BaseMessage) => {
                    console.log("message sent successfully", message.getSentAt())
                    if (!disableLocalEvents) {
                        CometChatUIKitHelper.onMessageSent(message, messageStatus.success);
                    }
                    resolve(message);
                })
                .catch((error: CometChat.CometChatException) => {
                    console.log("error while sending message", { error })
                    message.setMetadata({ error });
                    // if (!disableLocalEvents) {
                    //     CometChatUIKitHelper.onMessageSent(message, messageStatus.error);
                    // }
                    reject(error);
                });
        });
    }

    static getDataSource() {
        return ChatConfigurator.getDataSource();
    }

    static SoundManager: typeof CometChatSoundManager = CometChatSoundManager;
    static Localize: typeof CometChatLocalize = CometChatLocalize;
}
