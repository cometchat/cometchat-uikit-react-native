import React, { useContext } from 'react';
import { View, TouchableOpacity, Text, Image, ActivityIndicator, ViewProps, TextStyle, ImageStyle } from "react-native";
import { ImageType } from '../../base';
import { ButtonStyle, ButtonStyleInterface } from './CometChatButtonStyle';
import { CometChatContext } from '../../CometChatContext';
import { Style } from "./style";

export interface CometChatButtonInterface {
    text?: string,
    iconUrl?: ImageType,
    style?: ButtonStyleInterface,
    onPress?: () => void,
    isLoading?: boolean,
}

export const CometChatButton = (props: CometChatButtonInterface) => {
    const {
        iconUrl,
        onPress,
        style,
        text,
        isLoading
    } = props;

    const { theme } = useContext(CometChatContext);

    const {
        backgroundColor,
        border,
        borderRadius,
        height,
        width,
        iconBackgroundColor,
        iconBorder,
        iconCornerRadius,
        iconTint,
        textColor,
        textFont,
    } = new ButtonStyle({
        backgroundColor: theme.palette.getBackgroundColor(),
        ...style
    });

    return (
        <TouchableOpacity onPress={onPress} style={[{ alignItems: "center", backgroundColor, borderRadius }, !iconUrl && {
            height, width, justifyContent: "center",
        } as ViewProps]}>
            {!isLoading ? <>
                {Boolean(iconUrl) && <View style={[Style.container, { backgroundColor: iconBackgroundColor, borderRadius: iconCornerRadius, ...border }]}>
                    <Image
                        source={iconUrl as ImageType}
                        resizeMode="contain"
                        style={{
                            height,
                            width,
                            backgroundColor: iconBackgroundColor,
                            borderRadius: iconCornerRadius,
                            tintColor: iconTint,
                            ...iconBorder,
                        } as ImageStyle} />
                </View>}
                {
                    Boolean(text) && <Text style={{
                        color: textColor,
                        ...textFont
                    } as TextStyle}>{text}</Text>
                }
            </>
                :
                <View style={{ position: "absolute", alignSelf: "center" }}>
                    <ActivityIndicator size="small" color={textColor} />
                </View>
            }
        </TouchableOpacity>
    )
}