import React, { useRef, useEffect, useContext } from "react";
import { View, Text, TouchableOpacity, Image, NativeModules, ActivityIndicator, NativeEventEmitter } from "react-native";
import { CometChatContext} from "../../CometChatContext";
import { CometChatContextType, ImageType } from "../../base/Types";
import { AudioBubbleStyle, AudioBubbleStyleInterface } from "./AudioBubbleStyle";
import { defaultPauseIcon, defaultPlayIcon, } from "./resources";
import { Style } from "./style";

const { SoundPlayer } = NativeModules;
const eventEmitter = new NativeEventEmitter(SoundPlayer);
let listener;
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
    
    const {theme} = useContext<CometChatContextType>(CometChatContext);

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
            SoundPlayer.pause((s) => {
                console.log(s);
            });
        }
    }, []);

    return (
        <View style={[Style.container, { backgroundColor, ...border, borderRadius, height, width }]}>
            {
                status == "loading" ?
                    <ActivityIndicator style={Style.imageStyle} color={iconTint} size={"small"} /> :
                    <View onTouchEnd={playPauseAudio}>
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
                    style={[Style.titleStyle, { ...titleFont, color: titleColor }]}
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