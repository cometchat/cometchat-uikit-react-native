import React, { useContext } from "react";
import { Image } from "react-native";
import { StickerStyle, StickerStyleInterface } from "./StickerStyle";
import { CometChatContext } from "../../shared/CometChatContext";

export interface CometChatStickerBubbleProps {
    /**
     * image url pass as {uri: "dummyUrl"}
     */
    url: string,
    /**
     * place holder image
     */
    name?: string,
    /**
     * style object of type ImageBubbleStyleInterface
     */
    style?: StickerStyleInterface
}

export const CometChatStickerBubble = (props: CometChatStickerBubbleProps) => {
    const {
        url,
        style
    } = props;

    const { theme } = useContext(CometChatContext);

    const {
        backgroundColor,
        border,
        borderRadius,
        height,
        width
    } = new StickerStyle({
        height: 200,
        width: 200,
        backgroundColor: theme.palette.getBackgroundColor(),
        ...style
    });

    return (
        <Image
            resizeMode={"cover"}
            source={{ uri: url }}
            style={{
                height, width,
                borderRadius,
                borderWidth: border.borderWidth,
                borderColor: border.borderColor
            }}
        />
    )
}