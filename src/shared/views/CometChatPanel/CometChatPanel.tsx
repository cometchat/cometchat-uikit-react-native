import { View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useContext } from 'react'
import { PanelStyle, PanelStyleInterface } from './PanelStyle'
import { CometChatContext } from '../../CometChatContext';
import { CloseIcon } from './resources';

export interface CometChatPanelInterface {
    title: string,
    hideCloseButton?: boolean,
    style?: PanelStyleInterface,
    textContent: string,
    onClose: () => void
}

export const CometChatPanel = (props: CometChatPanelInterface) => {
    const { hideCloseButton, style, textContent, title, onClose } = props;

    const { theme } = useContext(CometChatContext);

    const {
        backgroundColor, border, borderRadius, closeIconTint,
        textColor, textFont, titleColor, titleFont
    } = new PanelStyle({
        closeIconTint: theme.palette.getAccent(),
        border: { borderWidth: 1, borderColor: theme.palette.getPrimary() },
        titleFont: theme.typography.title1,
        titleColor: theme.palette.getAccent(),
        textColor: theme.palette.getAccent600(),
        textFont: theme.typography.text1,
        backgroundColor: theme.palette.getPrimary40(),
        ...style,
    })

    const _onClose = () => {
        onClose && onClose();
    }

    return (
        <View style={[{ backgroundColor: backgroundColor, borderRadius, padding: 10 }, { ...border }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                <Text style={[titleFont, { color: titleColor }]}>{title}</Text>
                {!hideCloseButton && <TouchableOpacity onPress={_onClose}>
                    <Image style={{ width: 20, height: 20, tintColor: closeIconTint }} source={CloseIcon} />
                </TouchableOpacity>}
            </View>
            <Text style={[textFont, { color: textColor }]}>
                {textContent}
            </Text>
        </View>
    )
}