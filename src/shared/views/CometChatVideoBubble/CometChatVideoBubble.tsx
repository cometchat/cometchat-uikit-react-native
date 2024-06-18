import React, { useContext, useEffect, useState, useRef } from "react";
import { View, Image, ImageBackground, NativeModules, Platform, NativeEventEmitter, EmitterSubscription, ActivityIndicator, StyleSheet, ImageSourcePropType } from "react-native";
import { CometChatContext } from "../../CometChatContext";
import { ImageType } from "../../base/Types";
import { VideoBubbleStyle, VideoBubbleStyleInterface } from "./VideoBubbleStyle";
import { defaultPlayIcon, defaultThumbnail } from "./resources";
import { Style } from "./style";
import { CometChatContextType } from "../../base/Types";
import { CometChatVideoPlayer } from "../CometChatVideoPlayer";

const { FileManager } = NativeModules;
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
    /**
     * custom player play icon
     */
    playerPlayIcon?: ImageSourcePropType
    /**
     * custom player pause icon
     */
    playerPauseIcon?: ImageSourcePropType
    /**
     * custom player back icon
     */
    playerBackIcon?: ImageSourcePropType
    /**
     * custom player volume icon
     */
    playerVolumeIcon?: ImageSourcePropType

}

export const CometChatVideoBubble = (props: CometChatVideoBubbleInterface) => {
    const {
        videoUrl,
        thumbnailUrl,
        placeholderImage,
        style,
        playIcon,
        onPress,
        playerPlayIcon,
        playerPauseIcon,
        playerBackIcon,
        playerVolumeIcon,
    } = props;

    const { theme } = useContext<CometChatContextType>(CometChatContext);
    const [isOpening, setOpening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isVideoPlayerVisible, setIsVideoPlayerVisible] = useState(false);

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
        return (url.substring(url.lastIndexOf("/") + 1, url.length)).replace(" ", "_");
    }

    const playVideo = () => {
        if (isOpening) {
            return;
        }

        if (onPress) {
            onPress(videoUrl);
            return;
        }

        if (!videoUrl) return;
        setIsLoading(true)
        setIsVideoPlayerVisible(true)
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

    const pressTime = useRef(0);

    const handleTouchStart = () => {
        pressTime.current = Date.now();
    };

    const handleTouchEnd = () => {
        if (pressTime.current === null && Platform.OS === "ios") return;
        const endTime = Date.now();
        const pressDuration = endTime - pressTime.current;
        if (pressDuration < 500) {
            playVideo();
        }
    };

    const onTouchMove = () => {
        if (Platform.OS === "ios") {
            pressTime.current = null;
        }
    }

    function getImage(imageUrl: ImageType) {
        if (typeof imageUrl === "object" && imageUrl.uri) {
            return { uri: imageUrl.uri };
        }
        return imageUrl;
    }

    return (
        <>
            <CometChatVideoPlayer
                videoUri={videoUrl}
                isVisible={isVideoPlayerVisible}
                onClose={() => {
                    setIsLoading(false)
                    setIsVideoPlayerVisible(false)
                }}
                onLoad={() => setIsLoading(false)}
                loadingIconColor={style.playerLoadingIconColor}
                playIcon={playerPlayIcon}
                playIconColor={style.playerPlayIconColor}
                pauseIcon={playerPauseIcon}
                pauseIconColor={style.playerPauseIconColor}
                backIcon={playerBackIcon}
                backIconColor={style.playerBackIconColor}
                volumeIcon={playerVolumeIcon}
                volumeIconColor={style.playerVolumeIconColor}
            />
            <ImageBackground source={getImage(thumbnailUrl) || getImage(placeholderImage) || defaultThumbnail} resizeMode={"cover"} style={{ backgroundColor, ...border, borderRadius, height, width, overflow: "hidden" }}>
                <View
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={onTouchMove}
                    style={[Style.playIconPosition, { backgroundColor: playIconBackgroundColor, borderRadius }]}>
                    {isLoading ? <ActivityIndicator size={"small"} color={playIconTint} />
                        : <Image source={playIcon || defaultPlayIcon} style={{ tintColor: playIconTint }} />
                    }
                </View>
            </ImageBackground>
        </>
    )
}