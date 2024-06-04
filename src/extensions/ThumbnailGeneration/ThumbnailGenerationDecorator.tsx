import { DataSource, DataSourceDecorator } from '../../shared/framework';
// @ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { ExtensionConstants } from '../ExtensionConstants';
import { getExtentionData } from '../ExtensionModerator';
// import { ThumbnailGenerationConfigurationInterface } from './ThumbnailGenerationConfiguration';
import {
  CometChatImageBubble,
  CometChatVideoBubble,
  ImageBubbleStyleInterface,
  VideoBubbleStyleInterface,
} from '../../shared/views';
// @ts-ignore
import React from 'react';
import { CometChatTheme } from '../../shared/resources/CometChatTheme';
import { ThumbnailGenerationConfigurationInterface } from './ThumbnailGenerationExtension';
import { Empty } from './resources';

export class ThumbnailGenerationExtensionDecorator extends DataSourceDecorator {
  thumbnailGenerationConfiguration?: ThumbnailGenerationConfigurationInterface;

  // loggedInUser: CometChat.User;

  constructor(
    dataSource: DataSource,
    thumbnailGenerationConfiguration?: ThumbnailGenerationConfigurationInterface
  ) {
    super(dataSource);
    if (thumbnailGenerationConfiguration != undefined) {
      this.thumbnailGenerationConfiguration = thumbnailGenerationConfiguration;
    }
  }

  getId(): string {
    return 'ThumbnailGeneration';
  }

  checkThumbnail(message) {
    let image: { uri: string } = { uri: null };
    let thumbnailData = getExtentionData(
      message,
      ExtensionConstants.thumbnailGeneration
    );
    if (thumbnailData == undefined) {
      image = message.getType() === "image" ? message?.data?.url : Empty;  //default image for type video
    } else {
      let attachmentData = thumbnailData['attachments'];
      if (attachmentData.length == 1) {
        let dataObj = attachmentData[0];

        if (!dataObj['error']) {
          let imageLink = dataObj?.['data']?.['thumbnails']?.['url_small'];
          image = imageLink ? { uri: dataObj['data']['thumbnails']['url_small'] } : Empty; //if imageLink is empty or does not exist then load default image
        } else {
          image = Empty; //default image
        }
      }
    }
    return image;
  }

  getVideoMessageBubble(
    videoUrl: string,
    thumbnailUrl: string,
    message: CometChat.MediaMessage,
    theme: CometChatTheme,
    videoBubbleStyle: VideoBubbleStyleInterface
  ) {
    const image = this.checkThumbnail(message);
    return (
      <CometChatVideoBubble
        videoUrl={videoUrl}
        thumbnailUrl={image}
        style={{
          height: 200,
          width: 200,
          backgroundColor: theme?.palette?.getBackgroundColor() ?? '#fff',
          playIconBackgroundColor:
            theme?.palette?.getAccent500() ?? 'rgba(20,20,20,0.4)',
          playIconTint: theme?.palette?.getBackgroundColor() ?? '#fff',
          ...videoBubbleStyle,
          ...(this.thumbnailGenerationConfiguration?.videoBubbleStyle
            ? this.thumbnailGenerationConfiguration.videoBubbleStyle
            : {}),
        }}
      />
    );
  }

  getImageMessageBubble(
    imageUrl: string,
    caption: string,
    style: ImageBubbleStyleInterface,
    message: CometChat.MediaMessage,
    theme
  ): JSX.Element {
    const image = this.checkThumbnail(message);
    return (
      <CometChatImageBubble
        imageUrl={{ uri: imageUrl } ?? image}
        thumbnailUrl={{ uri: message?.['data']?.['url'] }}
        style={{
          height: 200,
          width: 200,
          backgroundColor: theme?.palette?.getBackgroundColor() ?? '#fff',
          ...style,
        }}
      />
    );
  }
}
