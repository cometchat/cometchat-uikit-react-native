import { StyleSheet } from "react-native";

export const Styles = StyleSheet.create({
    editPreviewContainerStyle: (style, theme) => {
        return {
            position: "absolute",
            top: -60,
            alignSelf: "center",
            borderRadius: 5,
            paddingLeft: 10,
            marginTop: 0,
            marginLeft: 0,
            marginBottom: 5,
            marginRight: 0,
            width: style?.width,
            height: style?.height,
            zIndex: 12,
            borderLeftColor: style?.border?.borderColor || theme?.palette?.getAccent100(),
            borderLeftWidth: style?.border?.borderWidth,
            borderLeftStyle: style?.border?.borderStyle,
            backgroundColor: style?.backgroundColor || theme?.palette?.getBackgroundColor(),
        };
    },
    previewHeadingStyle: () => {
        return {
            marginBottom: 5,
            paddingTop: 5
        };
    },
    previewTitleStyle: (style, theme) => {
        return {
            ...style?.messagePreviewTitleFont,
            ...theme?.typography?.caption1,
            color: style?.messagePreviewTitleColor || theme?.palette?.getAccent(),
            letterSpacing: .5,
        };
    },
    previewSubTitleStyle: (style, theme) => {
        return {
            ...style?.messagePreviewSubtitleFont,
            ...theme?.typography?.subtitle2,
            color: style?.messagePreviewSubtitleColor || theme?.palette?.getAccent600(),
            letterSpacing: .5,
            marginBottom: 5,
        };
    },
    previewCloseStyle: () => {
        return {
            position: "absolute",
            top: 5,
            right: 5,
            width: 16,
            height: 16,
        };
    },
    previewCloseIconStyle: (style, theme) => {
        return {
            width: 16,
            height: 16,
            tintColor: style?.closeIconTint || theme?.palette?.getAccent500(),
        };
    },
    leftBar: (style, theme) => {
        return {
            position: "absolute",
            height: "100%",
            width: 3,
            backgroundColor: "lightgrey",
        }
    }
});