import React from "react";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import AIConversationSummaryView from "./AIConversationSummaryView";
import { CometChatMessageComposerActionInterface, CometChatTheme, CometChatUIEventHandler, CometChatUIEvents, DataSource, DataSourceDecorator, MessageEvents, localize } from "../../shared";
import { MessageStatusConstants, ReceiverTypeConstants, ViewAlignment } from "../../shared/constants/UIKitConstants";
import { AIConversationSummaryConfiguration } from "./configuration";
import { AIOptionsStyle } from "../AIOptionsStyle";

export class AIConversationSummaryDecorator extends DataSourceDecorator {
  public configuration?: AIConversationSummaryConfiguration;
  public newDataSource!: DataSource;
  public currentMessage: CometChat.BaseMessage | null = null;
  public unreadMessageCount: number = 0;
  public loggedInUser!: CometChat.User | null;
  public user!: CometChat.User;
  public group!: CometChat.Group;
  public theme: CometChatTheme = new CometChatTheme({});
  private LISTENER_ID: string = "aiconversationsummary__listener";

  constructor(
    dataSource: DataSource,
    configuration?: AIConversationSummaryConfiguration
  ) {
    super(dataSource);
    this.newDataSource = dataSource;
    this.configuration = configuration!;
    setTimeout(() => {
      this.addMessageListener();
    }, 1000);
  }

  override getId(): string {
    return "aiconversationsummary";
  }

  editReply(reply: string) {
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.ccComposeMessage, { text: reply });
    this.closePanel();
  }

  closePanel = () => {
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.hidePanel, {
      alignment: ViewAlignment.composerTop,
      child: () => (null),
    });
  };

  closeIfMessageReceived(message: CometChat.BaseMessage) {
    if (message?.getReceiverId() === this.loggedInUser?.getUid()) {
      this.closePanel();
    }
  }

  getConversationSummary = (theme?: CometChatTheme): Promise<string> => {
    this.theme = theme ?? new CometChatTheme({});
    return new Promise(async (resolve, reject) => {
      try {
        let receiverId: string = this.user
          ? this.user?.getUid()
          : this.group?.getGuid();
        let receiverType: string = this.user
          ? ReceiverTypeConstants.user
          : ReceiverTypeConstants.group;
        let configuration;
        if (this.configuration?.apiConfiguration) {
          configuration = await this.configuration?.apiConfiguration(
            this.user,
            this.group
          );
        }
        const response = await CometChat.getConversationSummary(
          receiverId,
          receiverType,
          configuration ? configuration : {}
        );
        return resolve(response);
      } catch (e) {
        reject(e);
      }
    });
  };

  private loadConversationSummary(): void {
    this.onClose();
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.showPanel, {
      alignment: ViewAlignment.messageListBottom,
      child: () => (
        <AIConversationSummaryView configuration={this.configuration} getConversationSummaryCallback={this.getConversationSummary}
          theme={this.theme} editReplyCallback={this.editReply} onPanelClose={this.onClose} />
      ),
    });
  }

  private onClose = () => {
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.hidePanel, {
      alignment: ViewAlignment.messageListBottom,
      child: () => (null),
    });
  }

  override getAIOptions(user: CometChat.User | null, group: CometChat.Group | null, theme: CometChatTheme, id?: any, AIOptionsStyle?: AIOptionsStyle): CometChatMessageComposerActionInterface[] {
    this.user = user!;
    this.group = group!;
    if (!id?.parentMessageId) {
      const messageComposerActions: CometChatMessageComposerActionInterface[] = super.getAIOptions(user, group, theme, id, AIOptionsStyle);
      let newAction = {
        title: localize("GENERATE_SUMMARY"),
        onPress: () => { this.loadConversationSummary() },
        id: "ai-conversation-summary",
        iconURL: '',
        iconTint: '',
        titleColor: this.configuration?.conversationSummaryStyle?.buttonTextColor || AIOptionsStyle.listItemTitleColor,
        titleFont: this.configuration?.conversationSummaryStyle?.buttonTextFont || AIOptionsStyle.listItemTitleFont,
        background: this.configuration?.conversationSummaryStyle?.backgroundColor || AIOptionsStyle.listItemBackground,
        cornerRadius: this.configuration?.conversationSummaryStyle?.buttonBorderRadius || AIOptionsStyle.listItemBorderRadius,
      };
      messageComposerActions.push(newAction);
      return messageComposerActions;
    } else {
      return super.getAIOptions(user, group, theme, id, AIOptionsStyle);
    }
  }

  private addMessageListener(): void {
    CometChat.getLoggedinUser().then((user: CometChat.User | null) => {
      if (user) {
        this.loggedInUser = user;
      }
    });

    CometChatUIEventHandler.addMessageListener(this.LISTENER_ID, {
      onTextMessageReceived: (message: CometChat.TextMessage) => {
        this.closeIfMessageReceived(message);
      },
      onCustomMessageReceived: (message: CometChat.CustomMessage) => {
        this.closeIfMessageReceived(message);
      },
      onMediaMessageReceived: (message: CometChat.MediaMessage) => {
        this.closeIfMessageReceived(message);
      },
      onFormMessageReceived: (formMessage) => {
        this.closeIfMessageReceived(formMessage)
      },
      onCardMessageReceived: (cardMessage) => {
        this.closeIfMessageReceived(cardMessage)
      },
      onCustomInteractiveMessageReceived: (customInteractiveMessage) => {
        this.closeIfMessageReceived(customInteractiveMessage)
      }
    });

    CometChatUIEventHandler.addMessageListener(
      MessageEvents.ccActiveChatChanged,
      {
        ccActiveChatChanged: (data) => {
          this.currentMessage = data.message!;
          this.user = data.user!;
          this.group = data.group!;
          this.unreadMessageCount = data.unreadMessageCount ?? 0;
          if (this.unreadMessageCount >= (this.configuration?.unreadMessageThreshold ?? 30)) {
            this.loadConversationSummary();
          }
        },
        ccMessageSent: ({ message, status }) => {
          if (status == MessageStatusConstants.success && message?.sender?.uid == this.loggedInUser?.uid) {
            this.closePanel();
            this.currentMessage = null;
            this.unreadMessageCount = 0;
          }
        }
      }
    );

  }
}