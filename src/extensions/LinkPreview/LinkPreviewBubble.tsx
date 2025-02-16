import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Linking, Image, Alert, Platform, TextStyle } from 'react-native'
import { LinkPreviewBubbleStyle, LinkPreviewBubbleStyleInterface } from './LInkPreviewBubbleStyle';
import { localize } from '../../shared/resources/CometChatLocalize';
import { DefaultLinkPreview } from "./resources";

export interface LinkPreviewBubbleInterface {
    ChildView?: () => JSX.Element | null,
    description?: string,
    style?: LinkPreviewBubbleStyleInterface,
    link: string,
    onPress?: () => void,
    title: string,
    image: string
}

export const LinkPreviewBubble = (props: LinkPreviewBubbleInterface) => {

    const {
        style,
        link,
        title,
        ChildView,
        image,
        onPress,
        description
    } = props;

    const _style = new LinkPreviewBubbleStyle(style || {});

    const [imageSource, setImageSource] = useState({ uri: image.startsWith("https:") ? image : `https:${image.split("http:")[1]}` });

    const callCount = useRef(0);
    const timerId = useRef<any>(null);
    const threshold = 10; 
    const timeframe = 1000; 

    const pressTime = useRef<any>(0);

    const handleTouchStart = () => {
        pressTime.current = Date.now();
    };

    const handleTouchEnd = async () => {
        if (pressTime.current === null && Platform.OS === "ios") return;
        const endTime = Date.now();
        const pressDuration = endTime - pressTime.current;
        if (pressDuration < 500) {
            onPress ? onPress() : await Linking.openURL(link) ? Linking.openURL(link) : Alert.alert(localize("SOMETHING_WRONG"))
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
        <View>

            <View
                style={{
                    backgroundColor: _style.backgroundColor,
                    borderRadius: 8,
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={onTouchMove}
            >

                <Image
                    source={imageSource}
                    style={{ height: 100, width: "100%", alignSelf: "center" }}
                    onError={(err) => {
                        setImageSource(DefaultLinkPreview)
                    }}
                />


            </View>

            <View style={{ margin: 8 }}>
                <Text
                    style={{
                        color: _style.titleColor,
                        ..._style.titleFont
                    }  as TextStyle}
                    ellipsizeMode="tail"
                >
                    {title}
                </Text>
                <Text
                    style={{
                        color: _style.subtitleColor,
                        ..._style.subtitleFont,
                    } as TextStyle}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                >
                    {description}
                </Text>
                {
                    ChildView && <ChildView />
                }
            </View>


        </View>

    )
}