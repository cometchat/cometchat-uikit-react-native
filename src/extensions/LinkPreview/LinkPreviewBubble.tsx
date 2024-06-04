import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Linking, Image, Alert, Platform } from 'react-native'
import { LinkPreviewBubbleStyle, LinkPreviewBubbleStyleInterface } from './LInkPreviewBubbleStyle';
import { localize } from '../../shared/resources/CometChatLocalize';
import { DefaultLinkPreview } from "./resources";

export interface LinkPreviewBubbleInterface {
    ChildView?: () => JSX.Element,
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

    const _style = new LinkPreviewBubbleStyle(style);

    const [imageSource, setImageSource] = useState({ uri: image.startsWith("https:") ? image : `https:${image.split("http:")[1]}` });


    const pressTime = useRef(0);

    const handleTouchStart = () => {
        pressTime.current = Date.now();
    };

    const handleTouchEnd = () => {
        if (pressTime.current === null && Platform.OS === "ios") return;
        const endTime = Date.now();
        const pressDuration = endTime - pressTime.current;
        if (pressDuration < 500) {
            onPress ? onPress() : (Linking.canOpenURL(link) && Linking.openURL(link)) || Alert.alert(localize("SOMETHING_WRONG"))
        }
    };

    const onTouchMove = () => {
        if (Platform.OS === "ios") {
            pressTime.current = null;
        }
    }


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
                    }}
                    ellipsizeMode="tail"
                >
                    {title}
                </Text>
                <Text
                    style={{
                        color: _style.subtitleColor,
                        ..._style.subtitleFont,
                    }}
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