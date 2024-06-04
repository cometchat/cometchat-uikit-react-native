import React from "react";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { DataSource, DataSourceDecorator } from "../../shared/framework";
import { LinkPreviewConfigurationInterface } from "./LinkPreviewConfiguration";
import { CometChatTheme } from "../../shared/resources/CometChatTheme";
import { MessageBubbleAlignmentType } from "../../shared/constants/UIKitConstants";
import { getExtentionData } from "../ExtensionModerator";
import { ExtensionConstants } from "../ExtensionConstants";
import { LinkPreviewBubble } from "./LinkPreviewBubble";
import { CometChatTextBubble } from "../../shared";

export class LinkPreviewExtentionDecorator extends DataSourceDecorator {
    linkPreviewConfiguration?: LinkPreviewConfigurationInterface

    constructor(dataSource: DataSource, linkPreviewConfiguration?: LinkPreviewConfigurationInterface) {
        super(dataSource);
        if (linkPreviewConfiguration) {
            this.linkPreviewConfiguration = linkPreviewConfiguration;
        }
    }

    isDeletedMessage(message: CometChat.BaseMessage): boolean {
        return message.getDeletedBy() != null;
    }

    getId(): string {
        return "LinkPreviewExtention";
    }

    getTextMessageContentView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignmentType, theme: CometChatTheme): JSX.Element {
        let linkData = getExtentionData(message, ExtensionConstants.linkPreview);
        if (!linkData || linkData.links.length == 0) {
            return super.getTextMessageContentView(message, alignment, theme);
        } else {
            const { image, favicon, title, url, description } = linkData.links[0]
            let img = image.length == 0 ? favicon : image;
            return <LinkPreviewBubble
                link={url}
                description={description}
                image={img}
                ChildView={() => super.getTextMessageBubble(
                    (message as CometChat.TextMessage).getText()
                    ,(message as CometChat.TextMessage), alignment, theme )}
                title={title}
                style={{
                    backgroundColor: "transparent",
                    titleColor: theme.palette.getAccent(),
                    titleFont: theme.typography.title2,
                    subtitleColor: theme.palette.getAccent()
                }}
            />
        }
    }
}