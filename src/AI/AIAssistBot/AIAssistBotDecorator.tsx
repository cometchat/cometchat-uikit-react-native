import React from "react";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatMessageComposerActionInterface, CometChatTheme, CometChatUIEventHandler, CometChatUIEvents, DataSource, DataSourceDecorator, MessageEvents, localize } from "../../shared";
import { AIAssistBotConfiguration } from "./configuration";
import { AIOptionsStyle } from "../AIOptionsStyle";
import AIAssistBotView from "./AIAssistBotView";

export class AIAssistBotDecorator extends DataSourceDecorator {
    public configuration?: AIAssistBotConfiguration;
    public user!: CometChat.User;
    public group!: CometChat.Group;
    public bots!: CometChat.User[];
    public theme: CometChatTheme = new CometChatTheme({});
    public loggedInUser!: CometChat.User | null;
    public usersRequest: CometChat.UsersRequestBuilder;

    constructor(
        dataSource: DataSource,
        configuration?: AIAssistBotConfiguration
    ) {
        super(dataSource);
        this.configuration = configuration!;
        this.usersRequest = new CometChat.UsersRequestBuilder()
            .setLimit(30)
            .setTags(["aibot"])
            .build();
        this.fetchBots();
        setTimeout(() => {
            this.addMessageListener();
        }, 1000);
    }

    fetchBots() {
        this.usersRequest.fetchNext().then((bots) => {
            if (bots.length > 0) {
                this.bots = [...(this.bots || []), ...bots];
                if (bots.length > 0) {
                    this.fetchBots();
                }
            }
        })

    }

    override getId(): string {
        return "bots";
    }

    override getAIOptions(user: CometChat.User | null, group: CometChat.Group | null, theme: CometChatTheme, id?: any, AIOptionsStyle?: AIOptionsStyle): CometChatMessageComposerActionInterface[] {
        this.user = user!;
        this.group = group!;
        if (!id?.parentMessageId) {
            const numberOfBots = this.bots?.length;
            const titleName = numberOfBots > 1 ? localize("COMETCHAT_ASK_AI_BOT") : `${localize("COMETCHAT_ASK_BOT")} ${this.bots[0]?.getName()}`;
            const messageComposerActions: CometChatMessageComposerActionInterface[] = super.getAIOptions(user, group, theme, id, AIOptionsStyle);
            let newAction = {
                title: titleName,
                onPress: () => {
                    this.onOptionsClick(AIOptionsStyle)
                },
                id: "ai-assist-bot",
                iconURL: '',
                iconTint: '',
                titleColor: this.configuration?.style?.buttonTextColor || AIOptionsStyle.listItemTitleColor,
                titleFont: this.configuration?.style?.buttonTextFont || AIOptionsStyle.listItemTitleFont,
                background: this.configuration?.style?.backgroundColor || AIOptionsStyle.listItemBackground,
                cornerRadius: this.configuration?.style?.buttonBorderRadius || AIOptionsStyle.listItemBorderRadius,
            };
            messageComposerActions.push(newAction);
            return messageComposerActions;
        } else {
            return super.getAIOptions(user, group, theme, id, AIOptionsStyle);
        }
    }

    onOptionsClick(AIOptionsStyle) {
        if (this.bots?.length > 1) {
            this.openBotList(AIOptionsStyle);
        } else {
            this.openBotChat(this.bots[0]);
        }
    }

    openBotList(AIOptionsStyle) {
        const botList = this.bots.map((bot) => {
            return ({
                title: bot.getName(),
                onPress: () => { this.openBotChat(bot) },
                id: bot?.getUid(),
                iconURL: '',
                iconTint: '',
                titleColor: this.configuration?.style?.buttonTextColor || AIOptionsStyle.listItemTitleColor,
                titleFont: this.configuration?.style?.buttonTextFont || AIOptionsStyle.listItemTitleFont,
                background: this.configuration?.style?.backgroundColor || AIOptionsStyle.listItemBackground,
                cornerRadius: this.configuration?.style?.buttonBorderRadius || AIOptionsStyle.listItemBorderRadius,
            });
        });

        CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.ccToggleBottomSheet, {
            bots: botList
        });
    }

    openBotChat(bot) {
        CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.ccToggleBottomSheet, {
            botView: true,
            child: () => <AIAssistBotView
                bot={bot}
                closeCallback={this.closeAIOption}
                configuration={this.configuration}
                title={bot.getName()}
                onSend={this.getBotReply.bind(this)}
                sender={this.loggedInUser}
            />
        });
    }

    closeAIOption() {
        CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.ccToggleBottomSheet, {
            botView: true,
            child: () => (null)
        });
    }

    async getBotReply(question: string, bot: CometChat.User): Promise<string> {
        let configuration: any;
        const receiverId = this.group?.getGuid() || this.user?.getUid();
        const receiverType = this.group?.getGuid()
            ? CometChat.RECEIVER_TYPE.GROUP
            : CometChat.RECEIVER_TYPE.USER;

        try {
            configuration = await this.configuration.apiConfiguration(bot, this.user, this.group) || {}
        } catch (err) {
            configuration = {}
        }

        const answer = await CometChat.askBot(
            receiverId,
            receiverType,
            bot?.getUid(),
            question,
            configuration
        );
        return answer;
    }

    private addMessageListener(): void {
        CometChat.getLoggedinUser().then((user: CometChat.User | null) => {
            if (user) {
                this.loggedInUser = user;
            }
        });

        CometChatUIEventHandler.addMessageListener(
            MessageEvents.ccActiveChatChanged,
            {
                ccActiveChatChanged: (data) => {

                },
            }
        );
    }
}