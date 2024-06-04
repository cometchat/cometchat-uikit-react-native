import React from "react";
import { View, Text } from 'react-native'
import { LabelStyle, LabelStyleInterface } from './LabelStyle';
export interface CometChatCardBubbleInterface {
    text: string,
    style?: LabelStyleInterface,
}
const CometChatLabel = (props: CometChatCardBubbleInterface) => {
    const {
        text,
        style,
    } = props;
    const _style = new LabelStyle({
        ...style,
    })
    const {
        labelColor,
        labelFont,
    } = _style;
    return (
        <View style={{ padding: 10 }}>
            <Text style={[labelFont, { color: labelColor }]}>{text}</Text>
        </View>
    )
};

export default CometChatLabel