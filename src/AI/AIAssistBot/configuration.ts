import { CometChat } from '@cometchat/chat-sdk-react-native'
import { AIAssistBotStyle, AIBotMessageBubbleStyle, AISenderMessageBubbleStyle } from './AIAssistBotStyle';
import { ICONS } from '../../shared/assets/images';
import { AvatarStyle, CometChatMessageInputStyleInterface } from '../../shared';

export class AIAssistBotConfiguration {
    apiConfiguration?: (bot: CometChat.User, user?: CometChat.User, group?: CometChat.Group) => Promise<Object>;
    title: (bot: CometChat.User) => string;
    botFirstMessageText: (bot: CometChat.User) => string;
    closeIconURL: string;
    sendIconURL: string;
    botMessageBubbleStyle: AIBotMessageBubbleStyle;
    senderMessageBubbleStyle: AISenderMessageBubbleStyle;
    avatarStyle?: AvatarStyle;
    messageInputStyle?: CometChatMessageInputStyleInterface;
    style: AIAssistBotStyle;
    loadingIconURL?: string = ICONS.WAITING;
    errorIconURL?: string = ICONS.ERROR_TICK;
    constructor(props: Partial<AIAssistBotConfiguration>) {
        Object.assign(this, props);
    }
}
