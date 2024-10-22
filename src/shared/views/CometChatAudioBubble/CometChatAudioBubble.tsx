import React, { useRef, useEffect, useContext } from "react";
import { View, Text, Image, NativeModules, ActivityIndicator, NativeEventEmitter, Platform, ViewProps, TextStyle } from "react-native";
import { CometChatContext } from "../../CometChatContext";
import { CometChatContextType, ImageType } from "../../base/Types";
import { AudioBubbleStyle, AudioBubbleStyleInterface } from "./AudioBubbleStyle";
import { defaultPauseIcon, defaultPlayIcon, } from "./resources";
import { Style } from "./style";

const { SoundPlayer } = NativeModules;
const eventEmitter = new NativeEventEmitter(SoundPlayer);
let listener: any;
export interface CometChatAudioBubbleInterface {
    /**
     * url of audio
     */
    audioUrl: string
    /**
     * title of audio
     */
    title: string
    /**
     * subtitle of audio
     */
    subtitle?: string
    /**
     * custom icon for play
     */
    playIcon?: ImageType
    /**
     * custom icon for pause
     */
    pauseIcon?: ImageType
    /**
     * pass function to handle custom play/pause logic.
     * one parameters will be received audioUrl
     */
    onPress?: Function
    /**
     * style object of type AudioBubbleStyleInterface
     */
    style?: AudioBubbleStyleInterface
}

export const CometChatAudioBubble = ({
    audioUrl,
    onPress,
    playIcon,
    pauseIcon,
    style,
    subtitle,
    title
}: CometChatAudioBubbleInterface) => {

    const { theme } = useContext<CometChatContextType>(CometChatContext);

    const callCount = useRef(0);
    const timerId = useRef<any>(null);
    const threshold = 10; 
    const timeframe = 1000; 

    const _style = new AudioBubbleStyle({
        backgroundColor: theme?.palette.getBackgroundColor(),
        iconTint: theme?.palette.getPrimary(),
        subtitleColor: theme?.palette.getAccent400(),
        subtitleFont: theme?.typography.subtitle2,
        titleColor: theme?.palette.getAccent(),
        titleFont: theme?.typography.title2,
        ...style
    });

    const {
        iconTint,
        subtitleColor,
        subtitleFont,
        titleColor,
        titleFont,
        backgroundColor,
        border,
        borderRadius,
        height,
        width
    } = _style;

    const [status, setStatus] = React.useState<"playing" | "paused" | "loading">("paused");

    useEffect(() => {
        listener = eventEmitter.addListener("soundPlayStatus", (data) => {
            if (audioUrl == data.url) {
                setStatus("paused")
            }
        });

        return () => {
            listener.remove();
        }
    }, []);

    const playPauseAudio = () => {
        if (onPress) {
            onPress(audioUrl);
            return;
        }

        if (status == "playing") {
            SoundPlayer.pause((s: string) => {
                try {
                    let json = JSON.parse(s);
                    if (json['success'] == true) {
                        setStatus("paused");
                    }
                } catch (ex) {
                    console.log(ex);
                };
            });
            return;
        }
        if (audioUrl) {
            setStatus("loading");
            SoundPlayer.play(audioUrl, (s: string) => {
                try {
                    let json = JSON.parse(s);
                    if (json['success'] == true) {
                        setStatus("playing");
                    }
                } catch (ex) { }
            });
        }
    }

    React.useEffect(() => {
        return () => {
            SoundPlayer.pause((s: any) => {
                console.log(s);
            });
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
            playPauseAudio();
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


    return (
        <View style={[Style.container, { backgroundColor, ...border, borderRadius, height, width } as ViewProps]}>
            {
                status == "loading" ?
                    <ActivityIndicator style={Style.imageStyle} color={iconTint} size={"small"} /> :
                    <View
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={onTouchMove}
                    >
                        <Image
                            source={
                                status == "playing" ?
                                    pauseIcon || defaultPauseIcon :
                                    playIcon || defaultPlayIcon
                            }
                            style={[Style.imageStyle, { tintColor: iconTint }]}
                        />
                    </View>
            }
            <View style={{ flex: 1 }}>
                <Text
                    style={[Style.titleStyle, { ...titleFont, color: titleColor }] as TextStyle}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                >
                    {title}
                </Text>
                {
                    subtitle &&
                    <Text style={[Style.subtitleStyle, { ...subtitleFont, color: subtitleColor }]}>
                        {subtitle}
                    </Text>
                }
            </View>
        </View>
    )
}