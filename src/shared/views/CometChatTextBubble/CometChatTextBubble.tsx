import React, { useContext, useEffect, useState } from "react";
import { View, Text, Linking, StyleProp, ViewStyle, ViewProps, TextStyle } from "react-native";
import { CometChatContextType } from "../../base/Types";
import { CometChatContext } from "../../CometChatContext";
import { emailPattern, phoneNumPattern, urlPattern } from "../../constants/UIKitConstants";
import { TextBubbleStyle, TextBubbleStyleInterface } from "./TextBubbleStyle";
import { CometChatMentionsFormatter, CometChatTextFormatter, CometChatUrlsFormatter } from "../../formatters";
import { anyObject } from "../../utils";

const Link = ({ text, url, style }: any) => {
    return <Text style={{ ...style, textDecorationLine: "underline" }} onPress={() => {
        let finalUrl = url.startsWith("http") ? url : `http://${url}`
        Linking.canOpenURL(finalUrl)
            .then(res => {
                if (res) {
                    Linking.openURL(finalUrl);
                    return;
                }
                console.log("Can not open link", finalUrl);
            })
            .catch(err => {
                console.log({ url });
                console.log("Error:", err);
            })
    }} >{text}</Text>
}

const getPatternGroup = (str: string): { phone?: string, email?: string, url?: string } => {
    let result: anyObject = {};
    if (str.match(phoneNumPattern))
        result['phone'] = str;
    if (str.match(emailPattern))
        result['email'] = str;
    if (str.match(urlPattern))
        result['url'] = str;
    return result;
}

export interface CometChatTextBubbleInterface {
    /**
     * text tobe shown
     */
    text: string,
    /**
     * style for text of type TextBubbleStyle
     */
    style?: TextBubbleStyleInterface,
    /**
     * text container style
     */
    textContainerStyle?: StyleProp<ViewStyle>
    textFormatters?: Array<CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter>;
}

export const CometChatTextBubble = (props: CometChatTextBubbleInterface) => {

    const {
        text,
        textContainerStyle,
        textFormatters
    } = props;

    const { theme } = useContext<CometChatContextType>(CometChatContext);
    const [formattedText, setFormattedText] = useState<string>();

    const _style = new TextBubbleStyle({
        backgroundColor: theme?.palette.getBackgroundColor(),
        textColor: theme?.palette.getAccent(),
        textFont: theme?.typography.body,
        ...props.style
    });

    const {
        backgroundColor,
        border,
        borderRadius,
        textColor,
        textFont,
        height,
        width
    } = _style;

    useEffect(() => {
        let finalText = text;
        if (textFormatters && textFormatters.length) {
            if (textFormatters) {
                for (let i = 0; i < textFormatters.length; i++) {
                    (finalText as string | void) = textFormatters[i].getFormattedText(finalText);
                }
            }
        }
        setFormattedText(finalText as string);
    }, [])

    return <View style={[
        {
            alignSelf: "flex-start",
        },
        {
            backgroundColor, borderRadius, maxHeight: height, maxWidth: width,
            overflow: "hidden", padding: 8, paddingBottom: 0
        },
        border,
        textContainerStyle
    ] as ViewProps}>
        <Text style={[{ color: textColor }, textFont] as TextStyle}>{formattedText}</Text>

    </View>
}

CometChatTextBubble.defaultProps = {
    text: ""
}