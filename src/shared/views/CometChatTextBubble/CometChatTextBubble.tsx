import React, {useContext} from "react";
import { View, Text, Linking, StyleProp, ViewStyle } from "react-native";
import { CometChatContextType } from "../../base/Types";
import { CometChatContext } from "../../CometChatContext";
import { emailPattern, phoneNumPattern, urlPattern } from "../../constants/UIKitConstants";
import { TextBubbleStyle, TextBubbleStyleInterface } from "./TextBubbleStyle";

const Link = ({ text, url, style }) => {
    return <Text style={{...style, textDecorationLine: "underline"}} onPress={() => {
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
                console.log({url});
                console.log("Error:", err);
            })
    }} >{text}</Text>
}

const getPatternGroup = (str: string):{phone?: string, email?: string, url?: string} => {
    let result = {};
    if (str.match(phoneNumPattern))
        result['phone'] = str;
    if (str.match(emailPattern))
        result['email'] = str;
    if (str.match(urlPattern))
        result['url'] = str;
    return result;
}

export const FormatTextForLinks = ({str, style}) => {
    let res = str.matchAll(phoneNumPattern + "|" + emailPattern + "|" + urlPattern);
    for (let resPart of res) {
        let { email, phone } = getPatternGroup(resPart[0]);
        let pre: string, post:string;
        pre = str.substring(0, resPart.index);
        post = str.substring(resPart.index + resPart[0].length);
        let urlLink = "";
        if (email)
            urlLink = "mailto:";
        if (phone)
            urlLink = "tel:";
        return (
            <Text style={{...style.textFont, color: style.textColor}}>
                <Text>
                    {pre}
                </Text>
                <Link text={resPart[0]} url={urlLink + resPart[0].trim()} style={{...style.linkTextFont, color: style.linkTextColor}} />
                <FormatTextForLinks str={post} style={style} />
            </Text>
        )
    }

    return <Text style={{...style.textFont, color: style.textColor}}>{str}</Text>;
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
}

export const CometChatTextBubble = (props: CometChatTextBubbleInterface) => {
    
    const {theme} = useContext<CometChatContextType>(CometChatContext);

    const _style = new TextBubbleStyle({
        backgroundColor: theme?.palette.getBackgroundColor(),
        textColor: theme?.palette.getAccent(),
        textFont: theme?.typography.body,
        linkTextFont: theme?.typography.body,
        ...props.style
    });

    const {
        backgroundColor,
        border,
        borderRadius,
        textColor,
        textFont,
        linkTextColor,
        linkTextFont,
        height,
        width
    } = _style;

    const {
        text,
        textContainerStyle
    } = props;

    return <View style={[
        {
            alignSelf: "flex-start",
        },
        {
            backgroundColor,  borderRadius, maxHeight: height, maxWidth: width,
            overflow: "hidden", padding: 8,
        },
            border,
            textContainerStyle
        ]}>
        <FormatTextForLinks str={text} style={{textColor, textFont, linkTextColor, linkTextFont}} />
    
    </View>
}

CometChatTextBubble.defaultProps = {
    text: ""
}