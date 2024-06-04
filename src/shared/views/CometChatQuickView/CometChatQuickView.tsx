import { View, Text } from 'react-native'
import React, { useContext } from 'react'
import { QuickViewStyle, QuickViewStyleInterface } from './QuickViewStyle'
import { CometChatContextType } from '../../base'
import { CometChatContext } from '../../CometChatContext'

export interface CometChatQuickViewInterface {
    title: string,
    subtitle: string,
    closeIconUrl?: string,
    hideCloseIcon?: boolean,
    quickViewStyle?: QuickViewStyleInterface,
}
const CometChatQuickView = (props: CometChatQuickViewInterface) => {
    const { title, subtitle, closeIconUrl, hideCloseIcon, quickViewStyle } = props
    const { theme } = useContext<CometChatContextType>(CometChatContext);
    const _style = new QuickViewStyle({
        backgroundColor: theme.palette.getBackgroundColor(),
        borderRadius: 8,
        titleFont: theme.typography.text1,
        titleColor: theme.palette.getPrimary(),
        subtitlFont: theme.typography.subtitle2,
        subtitleColor: theme.palette.getAccent500(),
        leadingBarTint: theme.palette.getPrimary(),
        leadingBarWidth: 5,
        ...quickViewStyle
    })
    const {
        height,
        width,
        backgroundColor,
        border,
        borderRadius,
        titleFont,
        titleColor,
        subtitlFont,
        subtitleColor,
        leadingBarTint,
        leadingBarWidth,
    } = _style;

    return (
        <View
            style={{
                height: height,
                width: width,
                backgroundColor: backgroundColor,
                borderRadius: borderRadius,
                borderColor: border.borderColor,
                borderWidth: border.borderWidth,
                flexDirection: "row",
            }}
        >
            <View style={{
                width: leadingBarWidth, backgroundColor: leadingBarTint,
                borderTopLeftRadius: borderRadius, borderBottomLeftRadius: borderRadius
            }} />
            <View style={{ padding: 5 }}>
                <Text style={{ ...titleFont, color: titleColor, marginBottom: 5 }}>{title}</Text>
                <Text style={{ ...subtitlFont, color: subtitleColor }}>{subtitle}</Text>
            </View>
        </View>
    )
}

export default CometChatQuickView