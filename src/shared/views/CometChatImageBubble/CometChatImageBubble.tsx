import React, { useEffect, useRef, useState } from "react";
import { View, Image, NativeModules, Platform, NativeEventEmitter, EmitterSubscription } from "react-native";
import { ImageType } from "../../base";
import { ImageBubbleStyle, ImageBubbleStyleInterface } from "./ImageBubbleStyle";

const { FileManager, ImageManager } = NativeModules;
const eventEmitter = new NativeEventEmitter(FileManager);
let statusListener: EmitterSubscription;
export interface CometChatImageBubbleInterface {
    /**
     * image url pass as {uri: "dummyUrl"}
     */
    imageUrl: ImageType,
    /**
     *
     *
     * @type {ImageType}
     * @description thumbnail image
     */
    thumbnailUrl?: ImageType
    /**
     * place holder image
     */
    placeHolderImage?: ImageType,
    /**
     * custom logic on touch of image
     */
    onPress?: Function,
    /**
     * style object of type ImageBubbleStyleInterface
     */
    style?: ImageBubbleStyleInterface
    /**
     * resizeMode of image
     * @default "cover"
     */
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center'
}

export const CometChatImageBubble = (props: CometChatImageBubbleInterface) => {
    const {
        thumbnailUrl,
        imageUrl,
        onPress,
        placeHolderImage,
        style,
        resizeMode,
    } = props;

    const _style = new ImageBubbleStyle(style || {});
    const [isOpening, setOpening] = useState(false);
    const url = useRef("");

    const {
        backgroundColor,
        border,
        borderRadius,
        height,
        width,
        aspectRatio
    } = _style

    const getFileName = (url: string) => {
        return (url.substring(url.lastIndexOf("/") + 1));
    }

    const openImage = () => {
        if (isOpening) {
            return;
        }

        if (onPress) {
            onPress(imageUrl)
        }

        Platform.OS == 'ios' ?
            FileManager.openFile(url.current, getFileName(url.current), (s) => { }) :
            ImageManager.openImage(url.current, s => { });
    }

    useEffect(() => {
        if (typeof imageUrl == "object") {
            url.current = imageUrl.uri;
        }
        statusListener = eventEmitter.addListener("status", (data) => {
            if (data['url'] == url.current && data['state'] == "downloading") {
                setOpening(true);
            }
            if (data['url'] == url.current && data['state'] == "opening") {
                setOpening(false);
            }
        });

        return () => {
            statusListener.remove();
        }
    }, []);

    return (
        <View onTouchEnd={openImage}>
            <Image
                resizeMode={resizeMode || (Platform.OS == "android" ? "cover" : "contain")}
                loadingIndicatorSource={placeHolderImage}
                source={thumbnailUrl ?? imageUrl} style={{
                    height, width,
                    aspectRatio,
                    backgroundColor,
                    borderRadius,
                    ...border
                }}
            />
        </View>
    )
}