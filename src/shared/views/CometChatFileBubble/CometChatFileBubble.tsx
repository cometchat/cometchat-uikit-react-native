import React, { useContext, useRef } from "react";
import { View, Image, NativeModules, Text, Platform } from "react-native";
import { downloadIcon, fileIcon } from "./resources";
import { CometChatContext } from "../../CometChatContext"
import { FileBubbleStyle, FileBubbleStyleInterface } from "./FileBubbleStyle";
import { Style } from "./style";
import { CometChatContextType, ImageType } from "../../base/Types";

const { FileManager } = NativeModules;

export interface CometChatFileBubbleInterface {
    /**
     * url of file
     */
    fileUrl: string,
    /**
     * file title
     */
    title: string,
    /**
     * description for file
     */
    subtitle?: string,
    /**
     * style object of type FileBubbleStyle
     */
    style?: FileBubbleStyleInterface,
    /**
     * file icon
     */
    icon?: ImageType
}

export const CometChatFileBubble = ({
    fileUrl,
    title,
    icon,
    style,
    subtitle
}: CometChatFileBubbleInterface) => {

    const { theme } = useContext<CometChatContextType>(CometChatContext);

    const _style = new FileBubbleStyle({
        backgroundColor: theme?.palette.getBackgroundColor(),
        iconTint: theme?.palette.getPrimary(),
        subtitleColor: theme?.palette.getAccent600(),
        titleColor: theme?.palette.getAccent(),
        titleFont: theme?.typography.title1,
        subtitleFont: theme?.typography.title2,
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

    const [processing, setProcessing] = React.useState(false);

    const downloadFile = () => {
        if (processing) return;

        if(!fileUrl) return;
        
        setProcessing(true);
        FileManager.checkAndDownload(fileUrl, getFileName(), async (storedFilePath) => {
            console.log(storedFilePath);
            setProcessing(false);
        });
    }

    const downloadAndOpen = () => {
        if (processing) return;

        if(!fileUrl) return;

        setProcessing(true);
        FileManager.openFile(fileUrl, getFileName(), async (isOpened: string) => {
            console.log(isOpened);
            setProcessing(false);
        });
    }

    const getFileName = () => {
        return (fileUrl.substring(fileUrl.lastIndexOf("/") + 1, fileUrl.length)).replace(" ", "_");
    }

    const wrapperPressTime = useRef(0);
    let viewProps = Platform.OS === "ios" ? {
        onTouchStart: () => {
            wrapperPressTime.current = Date.now();
        },
        onTouchMove: () => {
            wrapperPressTime.current = null
        },
        onTouchEnd: () => {
            if (wrapperPressTime.current === null) return;
            const endTime = Date.now();
            const pressDuration = endTime - wrapperPressTime.current;
            if (pressDuration < 500) {
                downloadAndOpen();
            }
        }
    } : {};

    const pressTimeOnAndroid = useRef(0);

    let viewPropsForAndroid = Platform.OS === "android" ? {
        onTouchStart: () => {
            pressTimeOnAndroid.current = Date.now();
        },
        // onTouchMove: () => {
        //     pressTimeOnAndroid.current = null
        // },
        onTouchEnd: () => {
            // if (pressTimeOnAndroid.current === null) return;
            const endTime = Date.now();
            const pressDuration = endTime - pressTimeOnAndroid.current;
            if (pressDuration < 500) {
                downloadAndOpen();
            }
        }
    } : {};

    const shouldDownload = () => {
        if (Platform.OS === "android") {
            if (pressTimeOnAndroid.current === null) return;
            const endTime = Date.now();
            const pressDuration = endTime - pressTimeOnAndroid.current;
            if (pressDuration < 500) {
                downloadFile();
            }
        }
    }

    return (
        <View {...viewProps} style={[Style.container, { backgroundColor, borderWidth: border.borderWidth, borderColor: border.borderColor, borderRadius, height, width }]}>
            <View {...viewPropsForAndroid} style={Style.messageInfoStyle}>
                {
                    title && <Text
                        numberOfLines={1}
                        ellipsizeMode={"tail"}
                        style={[Style.titleStyle, { fontFamily: titleFont.fontFamily, fontSize: titleFont.fontSize, color: titleColor }]}
                    >
                        {title}
                    </Text>
                }
                {
                    subtitle && <Text
                        numberOfLines={1}
                        ellipsizeMode={"tail"}
                        style={[Style.subtitleStyle, { fontFamily: subtitleFont.fontFamily, fontSize: subtitleFont.fontSize, color: subtitleColor }]}
                    >
                        {subtitle}
                    </Text>
                }
            </View>
            <View {...viewPropsForAndroid} onTouchEnd={shouldDownload} style={Style.downloadImage}>
                <Image source={icon || (Platform.OS === "ios" ? fileIcon : downloadIcon)} style={[Style.imageStyle, { tintColor: iconTint }]} />
            </View>
        </View>
    )
}

CometChatFileBubble.defaltProps = {
    fileUrl: "",
    title: "",
    subtitle: "",
    style: new FileBubbleStyle({}),
    icon: Platform.OS === "ios" ? fileIcon : downloadIcon
}