import React, { useContext } from "react";
import { View } from "react-native";
import { CometChatContext } from "../../CometChatContext";
import { CometChatContextType, BaseStyleInterface } from "../../base";
import { MessageBubbleStyle } from "./MessageBubbleStyle";
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
    LeadingView?: () => JSX.Element,
    /**
     * The header view of the message bubble.
     * @type () => JSX.Element
     */
    HeaderView?: () => JSX.Element,
    /**
     * The status info view of the message bubble.
     * @type () => JSX.Element
     */
    StatusInfoView?: () => JSX.Element,
    /**
     * The reply view of the message bubble.
     * @type () => JSX.Element
     */
    ReplyView?: () => JSX.Element,
    /**
     * The bottom view of the message bubble.
     * @type () => JSX.Element
     */
    BottomView?: () => JSX.Element,
    /**
     * The content view of the message bubble.
     * @type () => JSX.Element
     */
    ContentView?: () => JSX.Element,
    /**
     * The thread view of the message bubble.
     * @type () => JSX.Element
     */
    ThreadView?: () => JSX.Element,
    /**
     * The footer view of the message bubble.
     * @type () => JSX.Element
     */
    FooterView?: () => JSX.Element,
    /**
     * The alignment of the message bubble.
     * @type MessageBubbleAlignmentType
     */
    alignment?: MessageBubbleAlignmentType,
    /**
     * The style of the message bubble.
     * @type BaseStyleInterface
     */
    style?: BaseStyleInterface,
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
    alignment,
    id,
    style
}: CometChatMessageBubbleInterface) => {

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
        width
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
            }}>
                {
                    LeadingView && <LeadingView />
                }
                <View style={{marginStart: 4, width, maxWidth: "80%"}}>
                    {
                        HeaderView && <HeaderView />
                    }
                    {
                        ReplyView && <ReplyView />
                    }
                    <View style={{ ...border, borderRadius, backgroundColor}}>
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

CometChatMessageBubble.defaultProps = {
    alignment: "left"
}