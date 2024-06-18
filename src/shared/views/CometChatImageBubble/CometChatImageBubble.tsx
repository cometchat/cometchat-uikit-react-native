import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { View, Image, NativeModules, Platform, NativeEventEmitter, EmitterSubscription } from "react-native";
import { ImageType } from "../../base";
import { ImageBubbleStyle, ImageBubbleStyleInterface } from "./ImageBubbleStyle";
import { ImageViewerModal } from "../CometChatImageViewerModal";
import { ICONS } from "./assets";
import { isHttpUrl } from "../../utils/NetworkUtils";

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
    const [downloaded, setDownloaded] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
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

    const pressTime = useRef(0);

    const handleTouchStart = () => {
        pressTime.current = Date.now();
    };

    const handleTouchEnd = () => {
        if (pressTime.current === null && Platform.OS === "ios") return;
        const endTime = Date.now();
        const pressDuration = endTime - pressTime.current;
        if (pressDuration < 500) {
            setIsVisible(true)
        }
    };

    const onTouchMove = () => {
        if (Platform.OS === "ios") {
            pressTime.current = null;
        }
    }

    useLayoutEffect(() => {
        if(isHttpUrl(thumbnailUrl?.uri ?? imageUrl?.uri)) {
            Image.prefetch(thumbnailUrl?.uri ?? imageUrl?.uri).then((res) => {
              setDownloaded(res);
            });
        } else {
            setDownloaded(true);
        }
    }, []);

    function getImage(imageUrl: ImageType) {
        if (typeof imageUrl === "object" && imageUrl.uri) {
            return { uri: imageUrl.uri };
        }
        return imageUrl;
    }

    return (
        <>
            {
                isVisible &&
                <ImageViewerModal imageUrl={imageUrl} isVisible={isVisible} onClose={()=>{
                    setIsVisible(false)
                }}/>
            }
            <View
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={onTouchMove}
                style={{
                    justifyContent:'center',
                    alignItems: 'center',
                    height, 
                    width
                }}
            >
                {
                    !downloaded 
                    ? <View>
                            <Image
                                resizeMode={"contain"}
                                source={getImage(placeHolderImage) || ICONS.Spinner} 
                                style={{
                                    height: 20,
                                    width: 20,
                                    backgroundColor,
                                }}
                            />
                        </View>
                    : <Image
                            resizeMode={resizeMode || "cover"}
                            loadingIndicatorSource={getImage(placeHolderImage) || ICONS.Spinner}
                            source={getImage(thumbnailUrl) || getImage(imageUrl)} 
                            style={{
                                height,
                                width,
                                aspectRatio,
                                backgroundColor,
                                borderRadius,
                                ...border
                            }}
                        />
                }
              
            </View>
        </>
    )
}