import React from "react";
import { View, Text, Image } from "react-native";
import { CometChat } from "@cometchat/chat-sdk-react-native"
import { CometChatCallLogDetailsTemplate, CometChatDate, CometChatListItem, CometChatTheme, localize } from "../shared"
import { CometChatCallButtons } from "./CometChatCallButtons";
import { CallUtils } from "./CallUtils";
import { NextArrowIcon } from "./resources";

export class CallingDetailsUtils {

    static getDefaultDetailsTemplates(callLog: any, loggedInUser: CometChat.User, theme: CometChatTheme): Array<CometChatCallLogDetailsTemplate> {

        return [
            this.getPrimaryDetailsTemplate(callLog, loggedInUser, theme)
        ]
    }

    static getPrimaryDetailsTemplate(callLog: any, loggedInUser: CometChat.User, theme: CometChatTheme): CometChatCallLogDetailsTemplate {

        let user = callLog?.getReceiverType() == "user" ? loggedInUser?.getUid() === callLog?.getInitiator()?.getUid() ? callLog.getReceiver() : callLog?.getInitiator() : undefined
        let group = callLog?.getReceiverType() == "group" ? loggedInUser?.getUid() === callLog?.getInitiator()?.getUid() ? callLog.getReceiver() : callLog?.getInitiator() : undefined


        function subtitleView(): JSX.Element {
            return (
                <View style={{ padding: 10 }}>
                    <CometChatDate
                        timeStamp={callLog['initiatedAt'] * 1000}
                        pattern={"dayDateFormat"}
                        style={{ textColor: theme.palette.getAccent(), textFont: theme.typography.title2 }}
                    />
                    <View style={{ marginTop: 2, flexDirection: "row", justifyContent: "space-between" }}>
                        <View style={{ flexDirection: "row" }}>
                            <CometChatDate timeStamp={callLog['initiatedAt'] * 1000} pattern={'timeFormat'} style={{ textColor: theme.palette.getAccent600(), textFont: theme.typography.subtitle1 }} />
                            <Text style={[{ marginHorizontal: 10, color: theme.palette.getAccent() }, theme.typography.subtitle1]}>
                                {
                                    CallUtils.getCallStatus(callLog as CometChat.Call, loggedInUser)
                                }
                            </Text>
                        </View>
                        <Text style={[{ marginHorizontal: 10, color: theme.palette.getAccent() }, theme.typography.subtitle1]}>{CallUtils.convertMinutesToHoursMinutesSeconds(callLog['totalDurationInMinutes'])}</Text>
                    </View>
                </View>
            )
        }

        let options = [{
            id: 'lastCall',
            CustomView: () => (
                <View style={{ marginHorizontal: 10, marginVertical: 20 }}>
                    <CometChatListItem
                        id={user ? user['uid'] : group ? group['guid'] : undefined}
                        SubtitleView={() => subtitleView()}
                        listItemStyle={{ backgroundColor: theme.palette.getAccent100(), borderRadius: 10 }}
                    />
                </View>
            )
        }
        ];

        user && options.unshift({
            id: "controls",
            CustomView: () => <View
                style={{ marginHorizontal: 2 }}
            >
                <CometChatCallButtons
                    group={group}
                    user={user}
                    callButtonStyle={{
                        width: "100%"
                    }}
                />
            </View>
        });

        return {
            id: "callControls",
            hideItemSeparator: true,
            hideSectionSeparator: true,
            options: [...options]
        }
    }

    static getSecondaryDetailsTemplate(callLog: any, loggedInUser: CometChat.User, theme: CometChatTheme): CometChatCallLogDetailsTemplate {
        let options = [{
            title: localize("CALL_HISTORY"),
            id: 'history',
            CustomView: () => (
                <View style={{ marginHorizontal: 10, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, overflow: "hidden", borderTopWidth: .5, borderColor: theme.palette.getAccent400() }}>
                    <CometChatListItem
                        id={'history'}
                        SubtitleView={() => (
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10 }}>
                                <Text style={[{ color: theme.palette.getAccent() }, theme.typography.title2]}>{localize("CALL_HISTORY")}</Text>
                                <Image source={NextArrowIcon} style={{ height: 16, width: 16, alignSelf: "center", tintColor: theme.palette.getPrimary() }} />
                            </View>
                        )}
                        listItemStyle={{ backgroundColor: theme.palette.getAccent100(), height: 50 }}
                    />
                </View>
            )
        }];

        let recordingObj = {
            title: localize("RECORDINGS"),
            id: 'recordings',
            CustomView: () => (
                <View style={{ marginHorizontal: 10, overflow: "hidden", borderTopWidth: .5, borderColor: theme.palette.getAccent400() }}>
                    <CometChatListItem
                        id={'recordings'}
                        SubtitleView={() => (
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10 }}>
                                <Text style={[{ color: theme.palette.getAccent() }, theme.typography.title2]}>{localize("RECORDINGS")}</Text>
                                <View style={{ flexDirection: "row" }}>
                                    <Text style={[{ color: theme.palette.getAccent(), marginRight: 5 }, theme.typography.title2]}>{callLog?.recordings?.length}</Text>
                                    <Image source={NextArrowIcon} style={{ height: 16, width: 16, alignSelf: "center", tintColor: theme.palette.getPrimary() }} />
                                </View>
                            </View>
                        )}
                        listItemStyle={{ backgroundColor: theme.palette.getAccent100(), height: 50 }}
                    />
                </View>
            )
        }
        callLog?.recordings?.length && options.unshift(recordingObj);

        let participantsObj = {
            title: localize("PARTICIPANTS"),
            id: 'participants',
            CustomView: () => (
                <View style={{ marginHorizontal: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10, overflow: "hidden" }}>
                    <CometChatListItem
                        id={'participants'}
                        SubtitleView={() => (
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10 }}>
                                <Text style={[{ color: theme.palette.getAccent() }, theme.typography.title2]}>{localize("PARTICIPANTS")}</Text>
                                <View style={{ flexDirection: "row" }}>
                                    <Text style={[{ color: theme.palette.getAccent(), marginRight: 5 }, theme.typography.title2]}>{callLog?.participants?.length}</Text>
                                    <Image source={NextArrowIcon} style={{ height: 16, width: 16, alignSelf: "center", tintColor: theme.palette.getPrimary() }} />
                                </View>
                            </View>
                        )}
                        listItemStyle={{ backgroundColor: theme.palette.getAccent100(), height: 50 }}
                    />
                </View>
            )
        }
        options.unshift(participantsObj);

        return {
            id: "callInfo",
            hideItemSeparator: true,
            hideSectionSeparator: true,
            options: [...options]
        };
    }
}