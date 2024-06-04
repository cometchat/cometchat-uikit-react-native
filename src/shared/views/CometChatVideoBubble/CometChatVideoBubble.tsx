import React, {useContext, useEffect, useState} from "react";
import { View, Image, ImageBackground, NativeModules, Platform, NativeEventEmitter, EmitterSubscription } from "react-native";
import { CometChatContext } from "../../CometChatContext";
import { ImageType } from "../../base/Types";
import { VideoBubbleStyle, VideoBubbleStyleInterface } from "./VideoBubbleStyle";
import { defaultPlayIcon } from "./resources";
import { Style } from "./style";
import { CometChatContextType } from "../../base/Types";

const { VideoManager, FileManager } = NativeModules;
const eventEmitter = new NativeEventEmitter(FileManager);
let statusListener: EmitterSubscription;
export interface CometChatVideoBubbleInterface {
    /**
     * url for video
     */
    videoUrl: string,
    /**
     * thumbnail url for bubble
     */
    thumbnailUrl?: ImageType,
    /**
     * placeholder image
     */
    placeholderImage?: ImageType,
    /**
     * style object of type VideoBubbleStyleInterface
     */
    style?: VideoBubbleStyleInterface,
    /**
     * custom play icon
     */
    playIcon?: ImageType,
    /**
     * callback function to be executed when play button clicked.
     * function will receive an videoUrl as parameter.
     */
    onPress?: Function
}

export const CometChatVideoBubble = (props: CometChatVideoBubbleInterface) => {
    const {
        videoUrl,
        thumbnailUrl,
        placeholderImage,
        style,
        playIcon,
        onPress,
    } = props;

    const {theme} = useContext<CometChatContextType>(CometChatContext);
    const [isOpening, setOpening] = useState(false);

    const _style = new VideoBubbleStyle({
        backgroundColor: theme?.palette.getBackgroundColor(),
        playIconTint: theme?.palette.getSecondary(),
        ...style
    });

    const {
        height,
        width,
        backgroundColor,
        border,
        borderRadius,
        playIconTint,
        playIconBackgroundColor
    } = _style;


    const getFileName = (url) => {
        return (url.substring(url.lastIndexOf("/") + 1, url.length)).replace(" ","_");
    }

    const playVideo = () => {
        if (isOpening) {
            return;
        }

        if (onPress) {
            onPress(videoUrl);
            return;
        }

        Platform.OS == 'ios' ?
            FileManager.openFile(videoUrl, getFileName(videoUrl), (s) => {}) :
            VideoManager.openVideo(videoUrl, (s) => {});

    }

    useEffect(() => {
        statusListener = eventEmitter.addListener("status", (data) => {
            if (data['url'] == videoUrl && data['state'] == "downloading") {
                setOpening(true);
            }
            if (data['url'] == videoUrl && data['state'] == "opening") {
                setOpening(false);
            }
        });

        return () => {
            statusListener.remove();
        }
    }, []);

    return (
        <ImageBackground source={thumbnailUrl || placeholderImage} resizeMode={"contain"} style={{ backgroundColor, ...border, borderRadius, height, width }}>
            <View onTouchEnd={playVideo} style={[Style.playIconPosition, { backgroundColor: playIconBackgroundColor, borderRadius }]}>
                <Image source={playIcon || defaultPlayIcon} style={{ tintColor: playIconTint }} />
            </View>
        </ImageBackground>
    )
}