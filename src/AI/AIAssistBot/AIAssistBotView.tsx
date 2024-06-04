import React, { useContext, useState, useEffect, useCallback } from 'react'
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { View, Text, TextInput, Dimensions, TouchableOpacity, Image, FlatList } from 'react-native'
import { AIAssistBotConfiguration } from './configuration';
import { CometChatBottomSheet, CometChatContext, CometChatContextType, CometChatDate, CometChatListItem, CometChatReceipt, CometChatTextBubble, CometChatTheme, localize } from '../../shared';
import { CloseIcon } from './resources';
import { ICONS } from '../../shared/framework/resources';
import { ICONS as MessageIcons } from '../../shared/assets/images';
import { getUnixTimestamp } from '../../shared/utils/CometChatMessageHelper';
import { CometChatMessageBubble } from '../../shared/views/CometChatMessageBubble';
import { MessageBubbleAlignmentType, ReceiverTypeConstants } from '../../shared/constants/UIKitConstants';
import { AIBotMessageBubbleStyle, AISenderMessageBubbleStyle } from './AIAssistBotStyle';

interface AIAssistBotViewProps {
    title: string;
    configuration: AIAssistBotConfiguration;
    closeCallback: () => void,
    bot: CometChat.User,
    sender: CometChat.User,
    onSend: (question: string, bot: CometChat.User) => Promise<any>
}

const AIAssistBotView = (props: AIAssistBotViewProps) => {
    const { height } = Dimensions.get('window');
    const { title, bot, sender, closeCallback, configuration, onSend } = props;
    const { theme } = useContext<CometChatContextType>(CometChatContext);

    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);

    const style = {
        titleColor: configuration?.style?.titleColor || theme.palette.getAccent(),
        titleFont: configuration?.style?.titleFont || theme.typography.name,
        closeIconTint: configuration?.style?.closeIconTint || theme.palette.getAccent(),
        sendIconTint: configuration?.style?.sendIconTint || question ? theme.palette.getPrimary() : theme.palette.getAccent600(),
        messageInputStyle: configuration?.messageInputStyle || {},
        subtitleColor: configuration?.style?.subtitleColor || theme.palette.getAccent500(),
        subtitleFont: configuration?.style?.subtitleFont || theme.typography.subtitle2,
        ...configuration?.style
    };

    const {
        titleColor,
        titleFont,
        closeIconTint,
        sendIconTint,
        subtitleColor,
        subtitleFont
    } = style;

    useEffect(() => {
        let botFirstMessage = "";
        if (configuration?.botFirstMessageText) {
            botFirstMessage = configuration.botFirstMessageText(bot);
        } else {
            botFirstMessage = localize("COMETCHAT_BOT_FIRST_MESSAGE");
        }

        const message = new CometChat.TextMessage(
            sender?.getUid(),
            botFirstMessage,
            ReceiverTypeConstants.user
        );
        message.setSentAt(getUnixTimestamp());
        message.setMuid(String(getUnixTimestamp()));
        message.setSender(bot);

        let newMessages = [...messages];
        newMessages.unshift(message);

        setMessages(newMessages);

    }, [])

    const onClose = () => {
        closeCallback && closeCallback()
    }

    const onChangeText = (value: string) => {
        setQuestion(value)
    }

    const onMsgSend = () => {
        if (!question) return;
        if (messages[0]?.sender?.getUid() === sender?.getUid()) return;

        let newMessages = [...messages];

        const MUID = String(getUnixTimestamp());
        const message = new CometChat.TextMessage(
            bot.getUid(),
            question,
            ReceiverTypeConstants.user
        );
        message.setSentAt(getUnixTimestamp());
        message.setMuid(MUID);
        message.setSender(sender);
        message.setStatus("WAIT");

        newMessages.unshift(message);
        setMessages(newMessages);

        onSend(question, bot)
            .then(botReply => {
                const message = new CometChat.TextMessage(
                    sender?.getUid(),
                    botReply,
                    ReceiverTypeConstants.user
                );
                message.setSentAt(getUnixTimestamp());
                message.setMuid(String(getUnixTimestamp()));
                message.setSender(bot);
                message.setStatus(undefined);

                const messageList = newMessages.map((message) => {
                    if (message.getMuid() === MUID) {
                        message.setStatus(undefined);
                    }
                    return message;
                });

                messageList.unshift(message);
                setMessages(messageList);
            })
            .catch(err => {
                const messageList = newMessages.map((message) => {
                    if (message.getMuid() === MUID) {
                        message.setStatus("ERROR");
                    }
                    return message;
                });
                setMessages(messageList);
            });

        setQuestion("")
    }

    const RenderMessageItem = ({ item, index }) => {
        const contentView = (message: any,
            theme: CometChatTheme,
            alignment: MessageBubbleAlignmentType,
            configuration: AIAssistBotConfiguration): JSX.Element => {
            let style: AIBotMessageBubbleStyle | AISenderMessageBubbleStyle = {};

            if (alignment === "right") {
                style = configuration?.senderMessageBubbleStyle || {};
            } else {
                style = configuration?.botMessageBubbleStyle || {};
            }

            const defaultStyle: any = {
                textFont: style?.textFont || theme.typography.text1,
                borderRadius: style?.borderRadius || 12,
                width: style?.width || "100%",
            };
            if (alignment === "right") {
                defaultStyle["textColor"] = style?.textColor || theme.palette.getSecondary();
                defaultStyle["backgroundColor"] = style?.backgroundColor || theme.palette.getPrimary()
            } else {
                defaultStyle["textColor"] = style?.textColor || theme.palette.getAccent();
                defaultStyle["backgroundColor"] = style?.backgroundColor || theme.palette.getSecondary()
            }

            return (
                <CometChatTextBubble
                    text={item.text}
                    style={defaultStyle}
                    textContainerStyle={defaultStyle}
                />
            )
        }
        function getBubbleAlignment(
            message: any,
            sender: CometChat.User
        ): MessageBubbleAlignmentType {
            if (message.sender?.getUid() === sender?.getUid()) {
                return "right";
            } else {
                return "left";
            }
        }
        function getMessageBubbleStyle(message: CometChat.TextMessage, theme: CometChatTheme, sender: CometChat.User, configuration: AIAssistBotConfiguration): any {
            if (message.sender?.getUid() === sender?.getUid()) {
                const style = configuration?.senderMessageBubbleStyle || {};
                return {
                    background: style.backgroundColor || theme.palette.getPrimary(),
                    borderRadius: style.borderRadius || 12,
                    border: style.border || undefined,
                }
            } else {
                const style = configuration?.botMessageBubbleStyle || {};
                if (configuration?.botMessageBubbleStyle) {
                    return configuration?.botMessageBubbleStyle;
                }
                return {
                    background: style.backgroundColor || theme.palette.getSecondary(),
                    borderRadius: style.borderRadius || 12,
                    border: style.border || undefined,
                };
            }
        };

        const getFooterView = (item: CometChat.BaseMessage, bubbleAlignment: MessageBubbleAlignmentType): JSX.Element => {

            let isSender = (item.getSender()?.getUid() || item['sender']['uid']) == (sender?.getUid() || sender['uid']);

            return <View style={[{ flexDirection: "row", justifyContent: bubbleAlignment === "right" ? "flex-end" : "flex-start" }]}>
                <CometChatDate
                    timeStamp={((item.getDeletedAt() || item.getReadAt() || item.getDeliveredAt() || item.getSentAt()) * 1000)}
                    style={{ textColor: theme?.palette?.getAccent600() }}
                    pattern={"timeFormat"}
                />
                {
                    isSender ?
                        <CometChatReceipt
                            receipt={item.getStatus()}
                            waitIcon={configuration?.loadingIconURL || MessageIcons.WAITING}
                            errorIcon={configuration?.errorIconURL || MessageIcons.ERROR_TICK}
                        /> :
                        null
                }
            </View>
        }

        return (
            <View style={{ marginBottom: 15, marginHorizontal: 2 }} key={index}>
                <CometChatMessageBubble
                    id={`${item.id}`}
                    ContentView={() => contentView(item, theme, getBubbleAlignment(item, sender), configuration)}
                    FooterView={() => getFooterView(item, getBubbleAlignment(item, sender))}
                    alignment={getBubbleAlignment(item, sender)}
                    style={getMessageBubbleStyle(item, theme, sender, configuration)}
                />
            </View>
        )
    }

    const keyExtractor = useCallback((item) => `${item.getMuid()}`, [])

    return (
        <CometChatBottomSheet
            onClose={onClose}
            style={{
                lineHeight: 15,
                borderRadius: 20
            }}
        >
                <View style={{ height: height * .5, }}>
                    <CometChatListItem
                        id={bot.getUid()}
                        title={title || bot.getName()}
                        avatarStyle={configuration?.avatarStyle}
                        avatarName={title || bot.getName()}
                        avatarURL={bot.getAvatar() ? { uri: bot.getAvatar() } : undefined}
                        SubtitleView={() => <Text style={[{ color: subtitleColor }, subtitleFont]}>{localize("COMETCHAT_ASK_BOT_SUBTITLE")}</Text>}
                        TailView={() => <TouchableOpacity onPress={onClose}>
                            <Image style={{ width: 20, height: 20, tintColor: closeIconTint }} source={configuration?.closeIconURL || CloseIcon} />
                        </TouchableOpacity>}
                        listItemStyle={{
                            titleColor, titleFont,
                        }}
                    />
                    <View style={{ flex: 1 }}>
                        <FlatList
                            inverted={true}
                            data={messages}
                            keyExtractor={keyExtractor}
                            renderItem={RenderMessageItem}
                        />
                    </View>
                    <View style={{
                        flexDirection: "row", alignItems: "center", justifyContent: "center", paddingTop: 10,
                        borderTopWidth: 1, borderColor: style?.messageInputStyle?.dividerTint || theme.palette.getAccent200()
                    }}>
                        <TextInput
                            placeholder={localize('ENTER_YOUR_MESSAGE_HERE')}
                            placeholderTextColor={style?.messageInputStyle?.placeholderTextColor}
                            value={question}
                            style={[{
                                padding: 8, flex: 1, borderWidth: 1, borderColor: theme.palette.getAccent500(), borderRadius: 20,
                                marginLeft: 10, color: style.messageInputStyle.textColor,
                            }, style.messageInputStyle.placeholderTextFont, style.messageInputStyle.textFont]}
                            onChangeText={onChangeText}
                        />
                        <TouchableOpacity activeOpacity={!question && 1} onPress={onMsgSend}>
                            <Image style={{ width: 30, height: 30, tintColor: sendIconTint, marginHorizontal: 10 }} source={configuration?.sendIconURL || ICONS.SEND} />
                        </TouchableOpacity>
                    </View>
                </View>
        </CometChatBottomSheet>
    )
}

export default AIAssistBotView