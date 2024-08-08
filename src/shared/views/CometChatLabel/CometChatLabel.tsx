import React from "react";
import { View, Text, TextStyle } from 'react-native'
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
        <View style={{ padding: 10, paddingBottom: 12 }}>
            <Text style={[labelFont, { color: labelColor }] as TextStyle}>{text}</Text>
        </View>
    )
};

export default CometChatLabel