import React, { useContext } from "react";
import { View } from "react-native";
import { CometChatContext } from "../../CometChatContext";
import { CometChatContextType, BaseStyleInterface } from "../../base";
import { MessageBubbleAlignmentType } from "../../constants/UIKitConstants";
import { MessageBubbleStyle } from "./MessageBubbleStyle";

export interface CometChatMessageBubbleInterface {
    id: string,
    LeadingView?: () => JSX.Element,
    HeaderView?: () => JSX.Element,
    ReplyView?: () => JSX.Element,
    BottomView?: () => JSX.Element,
    ContentView?: () => JSX.Element,
    ThreadView?: () => JSX.Element,
    FooterView?: () => JSX.Element,
    alignment?: MessageBubbleAlignmentType,
    style?: BaseStyleInterface,
}

export const CometChatMessageBubble = ({
    HeaderView,
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
                height, width, flexDirection: "row",
            }}>
                {
                    LeadingView && <LeadingView />
                }
                <View style={{marginStart: 4, maxWidth: "75%"}}>
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
                            BottomView && <BottomView />
                        }
                        {
                            ThreadView && <ThreadView />
                        }
                    </View>
                    {
                        FooterView && <FooterView />
                    }
                </View>
            </View>

        </View>
    )
}

CometChatMessageBubble.defaultProps = {
    alignment: "left"
}