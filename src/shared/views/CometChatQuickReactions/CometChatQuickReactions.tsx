import { View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useContext } from 'react'
import { QuickReactionsStyle, QuickReactionsStyleInterface } from './QuickReactionsStyle';
import { CometChatContext } from '../../CometChatContext';
import { ICONS } from './resources';
import { ImageType } from '../../base';

export interface CometChatQuickReactionsInterface {
    quickReactions?: [string, string?, string?, string?, string?];
    style?: QuickReactionsStyleInterface,
    onReactionPress?: (emoji: string) => void;
    onAddReactionPress?: () => void;
    addReactionUrl?: ImageType;
}

export const CometChatQuickReactions = (props: CometChatQuickReactionsInterface) => {
    const { quickReactions, style, onReactionPress, onAddReactionPress, addReactionUrl } = props;
    const { theme } = useContext(CometChatContext);

    const _style = new QuickReactionsStyle({
        backgroundColor: style?.backgroundColor || theme.palette.getBackgroundColor(),
        emojiBackgroundColor: style?.emojiBackgroundColor || theme.palette.getSecondary(),
        addReactionIconTint: style?.addReactionIconTint || theme?.palette?.getAccent700(),
        borderBottomColor: style?.borderBottomColor || theme?.palette?.getAccent300(),
        ...style,
    })

    const {
        addReactionIconTint,
        backgroundColor,
        emojiBackgroundColor,
        borderBottomColor,
    } = _style;

    function getEmojis() {
        let defaultEmojis = (Array.isArray(quickReactions) && quickReactions) || ["👍", "❤️", "😂", "😢", "🙏"];
        return defaultEmojis;
    }

    return (
        <View style={{
            flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%",
            borderBottomWidth: .5, borderBottomColor: borderBottomColor,
            backgroundColor: backgroundColor, paddingHorizontal: 20, paddingVertical: 5, marginVertical: 5
        }}>
            {getEmojis().map((item, index) =>
                <TouchableOpacity key={index} style={{
                    marginRight: 10,
                    width: 45, height: 45,
                    backgroundColor: emojiBackgroundColor, borderRadius: 40,
                    alignItems: "center", justifyContent: "center"
                }} onPress={() => onReactionPress && onReactionPress(item)}>
                    <Text style={[{ fontSize: 25, color: theme?.palette?.getPrimary(), }, theme?.typography?.heading]}>{item}</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity
                onPress={() => onAddReactionPress && onAddReactionPress()}
                style={{
                    marginRight: 10,
                    width: 45, height: 45,
                    backgroundColor: emojiBackgroundColor, borderRadius: 40,
                    alignItems: "center", justifyContent: "center"
                }}
            >
                <Image
                    source={addReactionUrl || ICONS.ADDREACTION}
                    style={{
                        height: 25,
                        width: 25,
                        tintColor: addReactionIconTint,
                    }}
                />
            </TouchableOpacity>
        </View>
    )
}
