import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { JSX } from "react";
import { AdditionalParams, MessageBubbleAlignmentType } from "../../shared/base/Types";
import { DataSource, DataSourceDecorator } from "../../shared/framework";
import { BubbleStyles, CometChatTheme } from "../../theme/type";
import { ExtensionConstants } from "../ExtensionConstants";
import { getExtensionData } from "../ExtensionModerator";
import { LinkPreviewBubble } from "./LinkPreviewBubble";
import { CometChatUIKit } from "../../shared";
import { DeepPartial } from "../../shared/helper/types";

/**
 * Extension decorator for rendering link preview messages.
 */
export class LinkPreviewExtensionDecorator extends DataSourceDecorator {
  /**
   * Creates an instance of LinkPreviewExtensionDecorator.
   *
   * @param dataSource - The data source instance to decorate.
   */
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  /**
   * Checks if the given message has been deleted.
   *
   * @param message - The message to check.
   * @returns True if the message is deleted, otherwise false.
   */
  isDeletedMessage(message: CometChat.BaseMessage): boolean {
    return message.getDeletedBy() != null;
  }

  /**
   * Returns the unique ID for this extension.
   *
   * @returns The extension ID as a string.
   */
  getId(): string {
    return "LinkPreviewExtension";
  }

  /**
   * Returns the content view for text messages.
   * If the message contains link preview data, it returns a LinkPreviewBubble,
   * otherwise it falls back to the super implementation.
   *
   * @param message - The text message.
   * @param alignment - The alignment for the message bubble.
   * @param theme - The current theme.
   * @param additionalParams - (Optional) Additional parameters.
   * @returns A JSX.Element representing the message content view.
   */
  getTextMessageContentView(
    message: CometChat.TextMessage,
    alignment: MessageBubbleAlignmentType,
    theme: CometChatTheme,
    additionalParams?: AdditionalParams
  ): JSX.Element {
    const loggedInUser = CometChatUIKit.loggedInUser;
    const linkData = getExtensionData(message, ExtensionConstants.linkPreview);

    if (!linkData || linkData.links.length === 0) {
      return super.getTextMessageContentView(message, alignment, theme, additionalParams);
    } else {
      const _style: DeepPartial<BubbleStyles["linkPreviewBubbleStyles"]> =
        message.getSender().getUid() === loggedInUser!.getUid()
          ? theme.messageListStyles?.outgoingMessageBubbleStyles?.linkPreviewBubbleStyles
          : theme.messageListStyles?.incomingMessageBubbleStyles?.linkPreviewBubbleStyles;
      const { image, favicon, title, url, description } = linkData.links[0];
      const img = image.length === 0 || image === favicon ? "" : image;
      return (
        <LinkPreviewBubble
          link={url}
          description={description}
          image={img}
          favicon={favicon}
          ChildView={() =>
            super.getTextMessageBubble(
              (message as CometChat.TextMessage).getText(),
              message as CometChat.TextMessage,
              alignment,
              theme,
              additionalParams
            )
          }
          title={title}
          style={_style as CometChatTheme["linkPreviewBubbleStyles"]}
        />
      );
    }
  }
}
