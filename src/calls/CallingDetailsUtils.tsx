import React from "react";
import { CometChat } from "@cometchat/chat-sdk-react-native"
import { CometChatDetailsTemplate } from "../shared"
import { CometChatCallButtons } from "./CometChatCallButtons";

export class CallingDetailsUtils {

    static getDefaultDetailsTemplates(message: CometChat.BaseMessage, loggedInUser: CometChat.User, user?: CometChat.User, group?: CometChat.Group): Array<CometChatDetailsTemplate> {
        return [
            this.getPrimaryDetailsTemplate(message, loggedInUser, user, group)
        ]
    }

    static getPrimaryDetailsTemplate(message: CometChat.BaseMessage, loggedInUser: CometChat.User, user?: CometChat.User, group?: CometChat.Group): CometChatDetailsTemplate {
        return {
            id: "callControls",
            hideItemSeparator: true,
            hideSectionSeparator: true,
            options: [
                {
                    id: "controls",
                    CustomView: () => <CometChatCallButtons
                        group={group}
                        user={user}
                    />
                }
            ]
        }
    }

    static getSecondaryDetailsTemplate(message: CometChat.BaseMessage, loggedInUser: CometChat.User, user?: CometChat.User, group?: CometChat.Group): CometChatDetailsTemplate {
        return {
            id: "callInfo",
            hideItemSeparator: true,
            hideSectionSeparator: true,
            options: []
        };
    }
}