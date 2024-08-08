import React from "react";
import { Modal, Text, View, Image, Platform } from "react-native";
//@ts-ignore
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatMessageTemplate } from "../shared/modals";
import { localize } from "../shared/resources/CometChatLocalize";
import { DataSourceDecorator } from "../shared/framework/DataSourceDecorator";
import { DataSource } from "../shared/framework/DataSource";
import { CometChatTheme } from "../shared/resources/CometChatTheme";
import { CallingConfiguration } from "./CallingConfiguration";
import { CallContstatnts, MessageCategoryConstants, MessageOptionConstants, MessageTypeConstants } from "../shared/constants/UIKitConstants";
import { CometChatCallBubble } from "./CometChatCallBubble";
import { AudioIcon } from "./resources";
import { VideoIcon } from "./resources";
import { CometChatCallButtons } from "./CometChatCallButtons";
import { CometChatOngoingCall } from "./CometChatOngoingCall";
import { CallingPackage } from "./CallingPackage";
import { CallUtils } from "./CallUtils";
import { ChatConfigurator, CometChatUIEventHandler } from "../shared";
import { CallUIEvents } from "./CallEvents";
import { permissionUtil } from "../shared/utils/PermissionUtil";
import { AdditionalBubbleStylingParams } from "../shared/base/Types";

const CometChatCalls = CallingPackage.CometChatCalls;

export class CallingExtensionDecorator extends DataSourceDecorator {

    configuration!: CallingConfiguration;
    loggedInUser!: CometChat.User;

    constructor(props: { dataSource: DataSource, configuration: CallingConfiguration }) {
        super(props.dataSource);
        CometChat.getLoggedinUser()
            .then((user: any) => {
                this.loggedInUser = user;
            })
            .catch((err: any) => {
                console.log("unable to get logged in user.");
            })
        if (props.configuration) {
            this.configuration = props.configuration;
        }
    }

    getId(): string {
        return "call";
    }

    isDeletedMessage(message: CometChat.BaseMessage): boolean {
        return message.getDeletedBy() != null;
    }

    getAllMessageTypes() {
        let types: string[] = super.getAllMessageTypes();
        types.push(CallContstatnts.audioCall);
        types.push(CallContstatnts.videoCall);
        types.push(MessageTypeConstants.meeting);
        return types;
    }

    getAllMessageCategories() {
        let categories = super.getAllMessageCategories();
        categories.push(MessageCategoryConstants.call);
        categories.push(MessageCategoryConstants.custom);
        return categories;
    }

    UserCallBubbleView = ({ message, theme }: any) => {
        if (this.isDeletedMessage(message))
            return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);

        const callStatus = CallUtils.getCallStatus(message, this.loggedInUser);
        return <View style={{ justifyContent: "space-around", alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignSelf: "center", borderWidth: 1, borderStyle: "dotted", borderRadius: 8, padding: 4, borderColor: callStatus === localize('MISSED_CALL') ? theme.palette.getError() : undefined }}>
                <Image source={message['type'] == "audio" ? AudioIcon : VideoIcon} style={{ height: 16, width: 16, alignSelf: "center", tintColor: callStatus === localize('MISSED_CALL') ? theme.palette.getError() : undefined }} />
                <Text style={{ color: callStatus === localize('MISSED_CALL') ? theme.palette.getError() : theme.palette.getAccent(), marginStart: 8 }}>
                    {
                        callStatus
                    }
                </Text>
            </View>
        </View>
    }

    getUserAudioCallTemplate = (theme: CometChatTheme) => {
        return new CometChatMessageTemplate({
            category: MessageCategoryConstants.call,
            type: MessageTypeConstants.audio,
            BubbleView: (message) => {
                return this.UserCallBubbleView({
                    message,
                    theme
                })
            }
        });
    }

    getUserVideoCallTemplates = (theme: CometChatTheme) => {
        return new CometChatMessageTemplate({
            category: MessageCategoryConstants.call,
            type: MessageTypeConstants.video,
            BubbleView: (message) => {
                return this.UserCallBubbleView({
                    message,
                    theme
                })
            }
        });
    }

    GroupCallBubbleView = (props: { message: CometChat.BaseMessage | any, theme: CometChatTheme, alignment?: string }) => {
        const { message, theme, alignment } = props;

        if (this.isDeletedMessage(message))
            return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);

        return (
            <View>
                <CometChatCallBubble
                    buttonText={localize("JOIN")}
                    title={alignment == "right" ? localize("YOU_INITIATED_GROUP_CALL") : `${message['sender']['name'].trim()} ${localize("INITIATED_GROUP_CALL")}`}
                    icon={VideoIcon}
                    onClick={() => this.startDirectCall(message['customData']['sessionId'], theme)}
                    style={{
                        backgroundColor: alignment == "left" ? "transparent" : theme.palette.getPrimary(),
                        titleColor: alignment == "left" ? theme.palette.getAccent() : theme.palette.getSecondary(),
                        iconTint: alignment == "left" ? theme.palette.getSecondary() : theme.palette.getSecondary(),
                        buttonBackgroundColor: alignment == "left" ? theme.palette.getBackgroundColor() : theme.palette.getSecondary(),
                        buttonTextColor: alignment == "left" ? theme.palette.getPrimary() : theme.palette.getPrimary(),
                    }}
                />
            </View>
        )
    }

    async startDirectCall(sessionId: string, theme?: CometChatTheme) {
        if (!(await permissionUtil.startResourceBasedTask(["mic", "camera"]))) {
            return;
        }
        const callSettingsBuilder = new CometChatCalls.CallSettingsBuilder()
            .setCallEventListener(
                new CometChatCalls.OngoingCallListener({
                    onCallEndButtonPressed: () => {
                        CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccShowOngoingCall, {
                            child: null,
                        })
                    },
                    onError: (error: any) => {
                        CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccShowOngoingCall, {
                            child: null,
                        })
                    }
                })
            );

        const ongoingCallScreen = (
            <Modal>
                <CometChatOngoingCall
                    sessionID={sessionId}
                    callSettingsBuilder={callSettingsBuilder}
                    onError={(e) => {
                        CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccShowOngoingCall, {
                            child: null,
                        });
                    }}
                />
            </Modal>
        );
        CometChatUIEventHandler.emitCallEvent(CallUIEvents.ccShowOngoingCall, {
            child: ongoingCallScreen,
        });
    }

    getAuxiliaryHeaderAppbarOptions(user: any, group: any, theme: CometChatTheme) {
        return <View>
            <CometChatCallButtons
                user={user}
                group={group}
                videoCallIconText=""
                voiceCallIconText=""
                callButtonStyle={{
                    buttonPadding: 10,
                    backgroundColor: "transparent",
                    voiceCallIconTint: theme?.palette.getPrimary(),
                    videoCallIconTint: theme?.palette.getPrimary(),
                }}
            />
        </View>
    }

    getGroupCallTemplate = (theme: CometChatTheme) => {
        return new CometChatMessageTemplate({
            category: MessageCategoryConstants.custom,
            type: MessageTypeConstants.meeting,
            ContentView: (message, alignment) => this.GroupCallBubbleView({ message, alignment, theme }),
            options: (loggedInUser, messageObject, group) => {
                return super.getCommonOptions(loggedInUser, messageObject, (group as CometChat.Group));
            },
        })
    }

    getAllMessageTemplates(theme: CometChatTheme, additionalParams?: AdditionalBubbleStylingParams): CometChatMessageTemplate[] {
        let templates = super.getAllMessageTemplates(theme, additionalParams);
        templates.push(
            this.getUserAudioCallTemplate(theme),
            this.getUserVideoCallTemplates(theme),
            this.getGroupCallTemplate(theme),
        );
        return templates;
    }

    getLastConversationMessage(conversation: CometChat.Conversation): string {
        if (conversation.getLastMessage()['category'] != "call")
            return super.getLastConversationMessage(conversation);
        let lastMesssageString = "";
        if (conversation.getLastMessage()['type'] == "audio")
            lastMesssageString = localize("AUDIO_CALL");
        if (conversation.getLastMessage()['type'] == "video")
            lastMesssageString = localize("VIDEO_CALL");
        return lastMesssageString;
    }
}