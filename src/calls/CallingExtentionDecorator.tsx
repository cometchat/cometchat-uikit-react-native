import React, { useEffect, useRef, useState } from "react";
import { Modal, Text, View, Image } from "react-native";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatMessageTemplate } from "../shared/modals";
import { localize } from "../shared/resources/CometChatLocalize";
import { DataSource, DataSourceDecorator } from "../shared/framework";
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

const CometChatCalls = CallingPackage.CometChatCalls;

export class CallingExtensionDecorator extends DataSourceDecorator {

    configuration: CallingConfiguration;
    loggedInUser: CometChat.User;

    constructor(props: { dataSource: DataSource, configuration: CallingConfiguration }) {
        super(props.dataSource);
        CometChat.getLoggedinUser()
        .then(user => {
            this.loggedInUser = user;
        })
        .catch(err => {
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

    UserCallBubbleView = ({ message, theme }) => {
        if (this.isDeletedMessage(message))
            return null;
        return <View style={{ justifyContent: "space-around", alignItems: "center" }}>
            <View style={{flexDirection: "row", alignSelf: "center", borderWidth: 1, borderStyle: "dotted", borderRadius: 8, padding: 4}}>
            <Image source={message['type'] == "audio" ? AudioIcon : VideoIcon} style={{height: 16, width: 16, alignSelf: "center"}} />
            <Text style={{ color: theme.palette.getAccent(), marginStart: 8 }}>
                {
                    CallUtils.getCallStatus(message, this.loggedInUser)
                }
            </Text>
            </View>
        </View>
    }

    getUserAudioCallTemplate = (theme) => {
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
    
    getUserVideoCallTemplates = (theme) => {
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

    GroupCallBubbleView = (props: { message: CometChat.BaseMessage, theme: CometChatTheme, alignment: string }) => {
        const { message, theme, alignment } = props;

        const [joinCall, setJoinCall] = useState(false);
        const callListener = useRef(undefined);

        if (this.isDeletedMessage(message))
            return null
        useEffect(() => {
            callListener.current = new CometChatCalls.OngoingCallListener({
                onCallEnded: () => {
                    setJoinCall(false);
                },
                onCallEndButtonPressed: () => {
                  setJoinCall(false);
              },
            })
        }, []);
        return (
            <View>
                <CometChatCallBubble
                    buttonText={localize("JOIN")}
                    title={alignment == "right" ? localize("YOU_INITIATED_GROUP_CALL") : `${message['sender']['name']} ${localize("INITIATED_GROUP_CALL")}`}
                    icon={VideoIcon}
                    onClick={() => setJoinCall(true)}
                    style={{
                        backgroundColor: alignment == "left" ? "transparent" : theme.palette.getPrimary(),
                        titleColor: alignment == "left" ? theme.palette.getAccent() : theme.palette.getSecondary(),
                        iconTint: alignment == "left" ? theme.palette.getSecondary() : theme.palette.getSecondary(),
                        buttonBackgroundColor: alignment == "left" ? theme.palette.getBackgroundColor() : theme.palette.getSecondary(),
                        buttonTextColor: alignment == "left" ? theme.palette.getPrimary() : theme.palette.getPrimary(),
                    }}
                />
                {
                    joinCall &&
                    <Modal>
                        <CometChatOngoingCall
                            sessionID={message['customData']['sessionId']}
                            callSettingsBuilder={
                                new CometChatCalls.CallSettingsBuilder()
                                    .setCallEventListener(callListener.current)
                            }
                            onError={(e) => {
                                setJoinCall(false);
                            }}
                        />
                    </Modal>
                }
            </View>
        )
    }

    getAuxiliaryHeaderAppbarOptions(user, group, theme: CometChatTheme) {
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

    getGroupCallTemplate = (theme) => {
        return new CometChatMessageTemplate({
            category: MessageCategoryConstants.custom,
            type: MessageTypeConstants.meeting,
            ContentView: (message, alignment) => this.GroupCallBubbleView({ message, alignment, theme }),
            options: (loggedInUser, messageObject, group) => {
                let commonOptions = super.getCommonOptions(loggedInUser, messageObject, group)
                return commonOptions.filter(option => option.id == MessageOptionConstants.deleteMessage)
            },
        })
    }

    getAllMessageTemplates(theme: CometChatTheme): CometChatMessageTemplate[] {
        let templates = super.getAllMessageTemplates(theme);
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