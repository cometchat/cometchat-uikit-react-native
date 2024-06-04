import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Linking, Image, Alert } from 'react-native'
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

    return (
        <TouchableOpacity style={{
            backgroundColor: _style.backgroundColor,
            borderRadius: 8,
        }}
            onPress={() => onPress ? onPress() : (Linking.canOpenURL(link) && Linking.openURL(link)) || Alert.alert(localize("SOMETHING_WRONG"))}
        >
            <Image
                source={imageSource }
                style={{ height: 100, width: "100%", alignSelf: "center" }}
                onError={(err) => {
                    setImageSource(DefaultLinkPreview)
                }}
            />
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
        </TouchableOpacity>
    )
}