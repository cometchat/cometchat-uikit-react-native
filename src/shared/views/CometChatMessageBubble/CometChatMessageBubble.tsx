import React, { useContext } from "react";
import { View, ViewProps } from "react-native";
import { CometChatContext } from "../../CometChatContext";
import { CometChatContextType, BaseStyleInterface } from "../../base";
import { MessageBubbleStyle, MessageBubbleStyleInterface } from "./MessageBubbleStyle";
import { memo } from "react";
import { MessageBubbleAlignmentType } from "../../base/Types";

export interface CometChatMessageBubbleInterface {
    /**
     * The id of the message bubble.
     * @type string
     */
    id: string,
    /**
     * The leading view of the message bubble.
     * @type () => JSX.Element
     */
    LeadingView?: () => JSX.Element | null,
    /**
     * The header view of the message bubble.
     * @type () => JSX.Element
     */
    HeaderView?: () => JSX.Element | null,
    /**
     * The status info view of the message bubble.
     * @type () => JSX.Element
     */
    StatusInfoView?: () => JSX.Element | null,
    /**
     * The reply view of the message bubble.
     * @type () => JSX.Element
     */
    ReplyView?: () => JSX.Element | null,
    /**
     * The bottom view of the message bubble.
     * @type () => JSX.Element
     */
    BottomView?: () => JSX.Element | null,
    /**
     * The content view of the message bubble.
     * @type () => JSX.Element
     */
    ContentView?: () => JSX.Element | null,
    /**
     * The thread view of the message bubble.
     * @type () => JSX.Element
     */
    ThreadView?: () => JSX.Element | null,
    /**
     * The footer view of the message bubble.
     * @type () => JSX.Element
     */
    FooterView?: () => JSX.Element | null,
    /**
     * The alignment of the message bubble.
     * @type MessageBubbleAlignmentType
     */
    alignment?: MessageBubbleAlignmentType,
    /**
     * The style of the message bubble.
     * @type BaseStyleInterface
     */
    style?: MessageBubbleStyleInterface,
}

export const CometChatMessageBubble = memo(({
    HeaderView,
    StatusInfoView,
    ReplyView,
    ContentView,
    FooterView,
    LeadingView,
    BottomView,
    ThreadView,
    alignment = 'left',
    id,
    style
}: CometChatMessageBubbleInterface ) => {

    const {theme} = useContext<CometChatContextType>(CometChatContext);

    const _style = new MessageBubbleStyle({
        backgroundColor: theme?.palette.getAccent100(),
        ...style
    });

    const {
        backgroundColor,
        border,
        borderRadius,
        height,
        width,
        alignSelf
    } = _style;

    return (
        <View key={id} style={{
            width: "100%",
            alignItems: alignment == "right" ?
                "flex-end" :
                alignment == "left" ?
                    "flex-start" :
                    alignment
        }}>
            <View style={{
                height, flexDirection: "row",
            } as ViewProps}>
                {
                    LeadingView && <LeadingView />
                }
                <View style={{marginStart: 4, width, maxWidth: "80%"} as ViewProps}>
                    {
                        HeaderView && <HeaderView />
                    }
                    {
                        ReplyView && <ReplyView />
                    }
                    <View style={{
                            ...border,
                            borderRadius,
                            backgroundColor,
                            ...(alignSelf && { alignSelf })
                        } as ViewProps} >
                        {
                            ContentView && <ContentView />
                        }
                        {
                            StatusInfoView && <StatusInfoView />
                        }
                        {
                            BottomView && <BottomView />
                        }
                    </View>
                    {
                        FooterView && <FooterView />
                    }
                    {
                        ThreadView && <ThreadView />
                    }
                </View>
            </View>

        </View>
    )
})