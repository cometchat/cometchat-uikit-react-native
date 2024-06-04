import React from 'react';
import { Linking, Text } from "react-native";
import { CometChatTextFormatter } from "../CometChatTextFormatter";
import { emailPattern, phoneNumPattern, urlPattern } from "../../constants/UIKitConstants";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { FontStyle } from '../../base';

export class CometChatUrlsFormatter extends CometChatTextFormatter {

    /**
     * The message object in context.
     */
    protected messageObject!: CometChat.BaseMessage;

    protected style: {
        linkTextColor?: string,
        linkTextFont?: FontStyle,
    } = {
            linkTextColor: "blue",
            linkTextFont: new FontStyle({ fontSize: 17, fontWeight: "400" }),
        }


    constructor(loggedInUser?: CometChat.User) {
        super();
        this.loggedInUser = loggedInUser;
    }

    private Link = ({ text, url, style }) => {
        return <Text style={{
            color: style?.linkTextColor,
            ...style?.linkTextFont,
            textDecorationLine: "underline"
        }} onPress={() => {
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
                    console.log("Error:", err);
                })
        }} >{text}</Text>
    }

    setStyle = (style: { linkTextFont?: FontStyle, linkTextColor?: string }) => {
        this.style = style;
    }

    private getPatternGroup = (str: string): { phone?: string, email?: string, url?: string } => {
        let result = {};
        if (str.match(phoneNumPattern))
            result['phone'] = str;
        if (str.match(emailPattern))
            result['email'] = str;
        if (str.match(urlPattern))
            result['url'] = str;
        return result;
    }


    /**
    * Formats the input text if provided, otherwise edits the text at the cursor position.
    *
    * @param {string|null} inputText - The input text to be formatted.
    * @returns {string|void} - The formatted input text, or void if inputText is not provided.
    */
    getFormattedText(inputText: string | null | JSX.Element) {
        if (!inputText) {
            return null;
        }
        let formattedText = this.getFormatTextForLinks({ str: inputText, style: this.style });
        return formattedText;
    }

    getFormatTextForLinks = ({ str, style }) => {
        if (typeof str === "string") {
            let res = str.matchAll(phoneNumPattern + "|" + emailPattern + "|" + urlPattern);
            for (let resPart of res) {
                let { email, phone } = this.getPatternGroup(resPart[0]);
                let pre: string, post: string;
                pre = str.substring(0, resPart.index);
                post = str.substring(resPart.index + resPart[0].length);
                let urlLink = "";
                if (email)
                    urlLink = "mailto:";
                if (phone)
                    urlLink = "tel:";
                return (
                    <Text>
                        <Text>{pre} </Text>
                        {this.Link({
                            text: resPart[0].trim(), url: urlLink.trim() + resPart[0].trim(),
                            style: { ...this.style }
                        })}
                        {this.getFormatTextForLinks({
                            str: post,
                            style: style
                        })}
                    </Text>
                )
            }

            return <Text>{str}</Text>;
        } else if (React.isValidElement(str)) {
            // str is a React element
            if (str.props.children) {
                // If the React element have children, we map over these children
                // and call addMentionsSpan recursively for each child.
                return React.cloneElement(str, {
                    children: React.Children.map(str.props.children, child => {
                        return this.getFormatTextForLinks({ str: child, style: style });
                    }),
                });
            } else {
                // If the React element does not have children, return it as is
                return str;
            }
        } else {
            throw new Error(`Unsupported str type: ${typeof str}`);
        }
    }


    /**
    * Retrieves the message object.
    *
    * @returns {CometChat.BaseMessage} - The current message object.
    */
    getMessage() {
        return this.messageObject;
    }

    /**
    * Sets the message object.
    *
    * @param {CometChat.BaseMessage} messageObject - The message object to be set.
    */
    setMessage(messageObject: CometChat.BaseMessage) {
        this.messageObject = messageObject;
    }
}