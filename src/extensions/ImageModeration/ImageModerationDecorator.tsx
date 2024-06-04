import { DataSource, DataSourceDecorator } from '../../shared/framework';
// @ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
// import { ImageModerationConfigurationInterface } from './ImageModerationConfiguration';
import { ImageBubbleStyleInterface } from '../../shared/views/CometChatImageBubble';
// @ts-ignore
import React from 'react';
import { CometChatTheme } from '../../shared/resources/CometChatTheme';
import { ImageModerationFilter } from './ImageModerationFilter';
import { ImageModerationConfigurationInterface } from './ImageModerationExtension';

export class ImageModerationExtensionDecorator extends DataSourceDecorator {
  imageModerationConfiguration?: ImageModerationConfigurationInterface;

  // loggedInUser: CometChat.User;

  constructor(
    dataSource: DataSource,
    imageModerationConfiguration?: ImageModerationConfigurationInterface
  ) {
    super(dataSource);
    if (imageModerationConfiguration != undefined) {
      this.imageModerationConfiguration = imageModerationConfiguration;
    }
  }

  getId(): string {
    return 'ImageModeration';
  }

  isImageMessage(
    message: CometChat.BaseMessage
  ): message is CometChat.MediaMessage {
    return (
      message.getCategory() == CometChat.CATEGORY_MESSAGE &&
      message.getType() == CometChat.MESSAGE_TYPE.IMAGE
    );
  }

  // getImageMessageContentView(
  //   message: CometChat.BaseMessage,
  //   alignment: MessageBubbleAlignmentType,
  //   theme: CometChatTheme
  // ): JSX.Element {
  //   // console.log('message', message);
  //   let attachment = message.getAttachment();

  //   return this.getImageMessageBubble(
  //     attachment.getUrl(),
  //     attachment.getName(),
  //     {},
  //     message,
  //     theme
  //   );
  // }

  getImageMessageBubble(
    imageUrl: string,
    caption: string,
    style: ImageBubbleStyleInterface,
    message: CometChat.MediaMessage,
    theme: CometChatTheme
  ): JSX.Element {
    if (this.isImageMessage(message)) {
      return (
        <ImageModerationFilter
          ChildView={super.getImageMessageBubble(
            imageUrl,
            caption,
            style,
            message,
            theme
          )}
          message={message}
          {...this.imageModerationConfiguration}
          // style={style}
        />
      );
    }
    return null;
  }
}
