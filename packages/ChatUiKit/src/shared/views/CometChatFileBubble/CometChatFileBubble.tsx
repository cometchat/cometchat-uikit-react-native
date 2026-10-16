import React, { JSX, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  EmitterSubscription,
  ImageSourcePropType,
  ImageStyle,
  NativeEventEmitter,
  NativeModules,
  NativeSyntheticEvent,
  NativeTouchEvent,
  Platform,
  Text,
  TextStyle,
  View,
} from "react-native";
import { Icon } from "../../icons/Icon";
import { useTheme } from "../../../theme";
import { getFileTypeIcon } from "../../constants/UIKitConstants";

const { FileManager } = NativeModules;
const eventEmitter = new NativeEventEmitter(FileManager);

/**
 * Props for the CometChatFileBubble component.
 */
export interface CometChatFileBubbleInterface {
  /**
   * URL of the file to be displayed/downloaded.
   */
  fileUrl: string;
  /**
   * Title of the file.
   */
  title: string;
  /**
   * Subtitle or description for the file.
   */
  subtitle?: string;
  /**
   * Custom style for the title text.
   */
  titleStyle?: TextStyle;
  /**
   * Custom style for the subtitle text.
   */
  subtitleStyle?: TextStyle;
  /**
   * Custom icon for download. Can be an image source or a JSX element.
   */
  downloadIcon?: ImageSourcePropType | JSX.Element;
  /**
   * Custom style for the download icon.
   */
  downloadIconStyle?: ImageStyle;
}

/**
 * CometChatFileBubble is a component that displays a file bubble with title,
 * subtitle and an icon indicating the file type. It handles file download,
 * existence check and opening of the file.
 *
 *  Props for the component.
 *  The rendered file bubble.
 */
export const CometChatFileBubble = ({
  fileUrl,
  title,
  titleStyle,
  subtitleStyle,
  subtitle,
  downloadIcon,
  downloadIconStyle,
}: CometChatFileBubbleInterface) => {
  const [processing, setProcessing] = React.useState(false);
  const [fileExists, setFileExists] = React.useState(false); // State to track if the file exists
  const theme = useTheme();
  let listener: EmitterSubscription;

  // Android-specific download identifier
  const downloadIdRef = useRef(0);
  // Flag to indicate if file should be opened after downloading
  const openFileAfterDownloading = useRef(false);

  useEffect(() => {
    checkFileExists();

    if (Platform.OS == "android") {
      listener = eventEmitter.addListener(
        "downloadComplete",
        (event) => {
          const data = event as { downloadId: number };
          if (data.downloadId && downloadIdRef.current && data.downloadId == downloadIdRef.current) {
            setProcessing(false);
            setFileExists(true);
            if (openFileAfterDownloading.current) {
              openFile();
              openFileAfterDownloading.current = false;
            }
          }
        }
      );
    }
    return () => {
      if (Platform.OS == "android") {
        listener.remove();
      }
    };
  }, [fileUrl]);

  /**
   * Checks if the file exists locally.
   *
   * If true, download and open the file if it doesn't exist.
   */
  const checkFileExists = async (downloadAndOpenFile = false) => {
    if (!fileUrl) return;

    const fileName = getFileName();
    setProcessing(true);
    FileManager.doesFileExist(fileName, (result: string) => {
      setProcessing(false);
      if (JSON.parse(result).exists) {
        setFileExists(true);
        if (downloadAndOpenFile) {
          openFile();
          openFileAfterDownloading.current = false;
        }
      } else {
        if (downloadAndOpenFile) {
          openFileAfterDownloading.current = true;
          downloadFile();
        }
      }
    });
  };

  /**
   * Initiates the file download if it is not already processed or exists.
   */
  const downloadFile = () => {
    if (processing || fileExists) return; // Do not process if file already exists

    if (!fileUrl) return;

    setProcessing(true);
    FileManager.checkAndDownload(fileUrl, getFileName(), (result: string) => {
      if (Platform.OS == "ios") {
        let parsedResult = JSON.parse(result);
        if (parsedResult.success == true) {
          setProcessing(false);
          setFileExists(true);
        }
        if (openFileAfterDownloading.current) {
          openFile();
          openFileAfterDownloading.current = false;
        }
      } else if (Platform.OS == "android") {
        downloadIdRef.current = JSON.parse(result).downloadId;
      }
    });
  };

  /**
   * Opens the file using the FileManager.
   */
  const openFile = () => {
    if (processing) return;
    if (!fileUrl) return;

    setProcessing(true);
    FileManager.openFile(fileUrl, getFileName(), (isOpened: string) => {
      setProcessing(false);
    });
  };

  /**
   * Extracts the file name from the file URL.
   *
   * The file name.
   */
  const getFileName = () => {
    return fileUrl.substring(fileUrl.lastIndexOf("/") + 1).replace(" ", "_");
  };

  // Touch handling for iOS
  const wrapperPressTime = useRef<number | null>(0);
  const viewProps = useMemo(() => {
    return Platform.OS === "ios"
      ? {
          onTouchStart: () => {
            wrapperPressTime.current = Date.now();
          },
          onTouchMove: () => {
            wrapperPressTime.current = null;
          },
          onTouchEnd: () => {
            if (wrapperPressTime.current === null) return;
            const endTime = Date.now();
            const pressDuration = endTime - wrapperPressTime.current;
            if (pressDuration < 500) {
              checkFileExists(true);
            }
          },
        }
      : {};
  }, []);

  // Touch handling for Android
  const pressTimeOnAndroid = useRef(0);
  const viewPropsForAndroid = useMemo(() => {
    return Platform.OS === "android"
      ? {
          onTouchStart: () => {
            pressTimeOnAndroid.current = Date.now();
          },
          onTouchEnd: () => {
            const endTime = Date.now();
            const pressDuration = endTime - pressTimeOnAndroid.current;
            if (pressDuration < 500) {
              checkFileExists(true);
            }
          },
        }
      : {};
  }, []);

  /**
   * Handler to download the file when the download icon is pressed.
   *
   * @param {NativeSyntheticEvent<NativeTouchEvent>} e - The touch event.
   */
  const shouldDownload = (e: NativeSyntheticEvent<NativeTouchEvent>) => {
    e.stopPropagation();
    setProcessing(true);
    downloadFile();
  };

  return (
    <View {...viewProps} style={{ flexDirection: "row", gap: 8 }}>
      <View {...viewPropsForAndroid} style={{ height: 32, width: 32 }}>
        <Icon name={getFileTypeIcon(title)} size={32}></Icon>
      </View>
      <View
        {...viewPropsForAndroid}
        style={{ flexDirection: "column", flexGrow: 1, flexShrink: 1 }}
      >
        {title && (
          <Text numberOfLines={1} ellipsizeMode={"tail"} style={[titleStyle]}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text numberOfLines={1} ellipsizeMode={"tail"} style={subtitleStyle}>
            {subtitle}
          </Text>
        )}
      </View>
      {processing && !fileExists && (
        <ActivityIndicator color={downloadIconStyle?.tintColor} />
      )}
    </View>
  );
};