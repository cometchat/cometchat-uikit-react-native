import { DataSource, DataSourceDecorator } from '../../shared/framework';
// @ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import {
  MessageBubbleAlignmentType,
  MetadataConstants,
  MessageCategoryConstants,
} from '../../shared/constants/UIKitConstants';
import { CometChatTheme } from '../../shared/resources/CometChatTheme';
import { ExtensionTypeConstants } from '../ExtensionConstants';
import { getExtentionData } from '../ExtensionModerator';
import { PollsConfigurationInterface } from './PollsConfigurations';
import { localize } from '../../shared/resources/CometChatLocalize';
import { CometChatMessageComposerActionInterface } from '../../shared/helper/types';
import { CometChatMessageTemplate } from '../../shared/modals';
import { ChatConfigurator } from '../../shared/framework';
// @ts-ignore
import React from 'react';
// @ts-ignore
import { View, Text } from 'react-native';
import { ICONS as ICONS2 } from './resources';
import { CometChatCreatePoll } from './Polls';
import { PollsBubble } from './PollsBubble';

export class PollsExtensionDecorator extends DataSourceDecorator {
  pollsConfiguration?: PollsConfigurationInterface;

  loggedInUser: CometChat.User;

  constructor(
    dataSource: DataSource,
    pollsConfiguration?: PollsConfigurationInterface
  ) {
    super(dataSource);
    if (pollsConfiguration != undefined) {
      this.pollsConfiguration = pollsConfiguration;
    }

    CometChat.getLoggedinUser()
      .then((u) => {
        this.loggedInUser = u;
      })
      .catch((err) => console.log(err));
  }

  isDeletedMessage(message: CometChat.BaseMessage): boolean {
    return message.getDeletedBy() != null;
  }

  getId(): string {
    return 'Polls';
  }

  getLastConversationMessage(conversation: CometChat.Conversation): string {
    if (conversation['lastMessage'] == undefined) {
      return '';
    }

    if (
      conversation['lastMessage']['type'] == ExtensionTypeConstants.extensionPoll &&
      conversation['lastMessage']['category'] == MessageCategoryConstants.custom
    ) {
      return localize('CUSTOM_MESSAGE_POLL');
    } else {
      return super.getLastConversationMessage(conversation);
    }
  }

  getAllMessageCategories(): string[] {
    var categoryList: string[] = super.getAllMessageCategories();
    if (!categoryList.includes(MessageCategoryConstants.custom)) {
      categoryList.push(MessageCategoryConstants.custom);
    }
    return categoryList;
  }

  getAllMessageTypes(): string[] {
    var messagesTypes: string[] = super.getAllMessageTypes();
    messagesTypes.push(ExtensionTypeConstants.extensionPoll);

    return messagesTypes;
  }

  getAttachmentOptions(
    user?: any,
    group?: any,
    composerId?: any
  ): CometChatMessageComposerActionInterface[] {
    let attachmentOptions: CometChatMessageComposerActionInterface[] =
      super.getAttachmentOptions(user, group, composerId);
      if(composerId == undefined || (composerId as Map<any, any>).get("parentMessageId") == undefined)
        attachmentOptions.push({
          id: 'polls',
          title: 'Polls',
          iconUrl: ICONS2.DOCUMENT,
          CustomView: (user, group, _id, pollsProps) => {
            return (
              <CometChatCreatePoll
                user={user}
                group={group}
                {...pollsProps}
                {...this.pollsConfiguration}
              />
            );
          },
        });
    return attachmentOptions;
  }

  getAllMessageTemplates(theme: CometChatTheme): CometChatMessageTemplate[] {
    let templateList: CometChatMessageTemplate[] = super.getAllMessageTemplates(
      theme
    );

    templateList.push(
      new CometChatMessageTemplate({
        type: ExtensionTypeConstants.extensionPoll,
        category: MessageCategoryConstants.custom,
        ContentView: (
          message: CometChat.BaseMessage,
          _alignment: MessageBubbleAlignmentType
        ) => {
          if (this.isDeletedMessage(message)) {
            return ChatConfigurator.dataSource.getDeleteMessageBubble(
              message,
              theme
            );
          } else {
            return this.getPollBubble(message, _alignment);
          }
        },
        options: (loggedInUser, messageObject, group) =>
          ChatConfigurator.dataSource.getMessageOptions(
            loggedInUser,
            messageObject,
            group
          ),
      })
    );

    return templateList;
  }

  getPollBubble(
    message: CometChat.BaseMessage,
    _alignment: MessageBubbleAlignmentType
  ) {
    if (message && this.loggedInUser) {
      const metaData = getExtentionData(
        message,
        MetadataConstants.extensions?.polls
      );

      return (
        <PollsBubble
          pollQuestion={message['customData']?.['question']}
          options={message['customData']?.['options']}
          pollId={message['customData']?.['id']}
          loggedInUser={this.loggedInUser}
          // choosePoll
          senderUid={message['sender']?.['uid']}
          metadata={metaData}
          {...(this.pollsConfiguration?.pollsBubbleStyle
            ? this.pollsConfiguration.pollsBubbleStyle
            : {})}
        />
      );
    }

    return <View></View>;
  }
}
