import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { View, Image, NativeModules, Platform, NativeEventEmitter, EmitterSubscription, ViewProps, ImageStyle } from "react-native";
import { ImageType } from "../../base";
import { ImageBubbleStyle, ImageBubbleStyleInterface } from "./ImageBubbleStyle";
import { ImageViewerModal } from "../CometChatImageViewerModal";
import { ICONS } from "./assets";
import { isHttpUrl } from "../../utils/NetworkUtils";
import { IMAGE_PREFETCH_MAX_ATTEMPTS } from "../../constants/UIKitConstants";

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
    const [downloaded, setDownloaded] = useState<number>(0); //downloaded - 0(not downloaded), 1(download failed), 2(downloaded)
    const [isVisible, setIsVisible] = useState(false);
    const url = useRef("");
    const attemptCount = useRef<number>(0);
  
    const timer = useRef<any>(null);


    const callCount = useRef(0);
    const timerId = useRef<any>(null);
    const threshold = 10; 
    const timeframe = 1000; 

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
            FileManager.openFile(url.current, getFileName(url.current), (s: any) => { }) :
            ImageManager.openImage(url.current, (s: any) => { });
    }

    useEffect(() => {
        if (typeof imageUrl == "object") {
            url.current = imageUrl.uri as string;
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

    const pressTime = useRef<any>(0);

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
        if (Platform.OS === 'ios') {
            callCount.current += 1;
    
            if (callCount.current >= threshold) {
                callCount.current = 0; // Reset the count after reaching the threshold
                pressTime.current = null;
            }
    
            if (timerId.current) {
              clearTimeout(timerId.current);
            }
            
            timerId.current = setTimeout(() => {
                callCount.current = 0;
            }, timeframe);
        }
    };

    const prefetchImage = (): Promise<any> => {
        return new Promise((resolve, reject) => {
            if (timer.current) {
                clearTimeout(timer.current); // Ensure previous timeout is cleared
            }
            Image.prefetch(thumbnailUrl?.uri! ?? imageUrl?.uri!)
                .then((res) => {
                    clearTimeout(timer.current);
                    resolve(res);
                })
                .catch((err: any) => {
                    if (attemptCount.current < IMAGE_PREFETCH_MAX_ATTEMPTS) {
                        attemptCount.current += 1
                        timer.current = setTimeout(() => {
                            prefetchImage()
                                .then((res) => resolve(res))
                                .catch((error: any) => reject(error));
                        }, 800);
                    } else {
                        reject(new Error(`Failed to download image after ${IMAGE_PREFETCH_MAX_ATTEMPTS} attempts`));
                    }
                });
        });
    };
    

    useLayoutEffect(() => {
        if(isHttpUrl(thumbnailUrl?.uri ?? imageUrl?.uri)) {
            prefetchImage().then((res) => {
                setDownloaded(2);
            }).catch((error: any) => {
                setDownloaded(1);
            })
        } else {
            setDownloaded(2);
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
                } as ViewProps}
            >
                {
                    downloaded === 0 ?
                        <View>
                            <Image
                                resizeMode={"contain"}
                                source={ICONS.Spinner}
                                style={{
                                    height: 20,
                                    width: 20,
                                    backgroundColor,
                                }}
                            />
                        </View>
                    :
                        downloaded === 1 ?
                        <View>
                            <Image
                                resizeMode={"contain"}
                                source={ICONS.Default_image}
                                style={{
                                    height,
                                    width,
                                    backgroundColor,
                                } as ImageStyle}
                            />
                        </View>
                    :
                        <Image
                            resizeMode={resizeMode || "cover"}
                            source={thumbnailUrl ? getImage(thumbnailUrl) : getImage(imageUrl!)} 
                            style={{
                                height,
                                width,
                                aspectRatio,
                                backgroundColor,
                                borderRadius,
                                ...border
                            } as ImageStyle}
                        />
                }
              
            </View>
        </>
    )
}