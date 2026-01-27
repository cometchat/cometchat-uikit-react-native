import React, { JSX, useCallback, useRef, useState } from "react";
import {
  Alert,
  DimensionValue,
  Image,
  LayoutChangeEvent,
  Linking,
  Platform,
  Text,
  View,
} from "react-native";
import { DefaultLinkPreview } from "./resources";
import { useTheme } from "../../theme";
import { CometChatTheme } from "../../theme/type";
import { useCometChatTranslation } from "../../shared/resources/CometChatLocalizeNew";

/**
 * Props for the LinkPreviewBubble component.
 */
export interface LinkPreviewBubbleInterface {
  /** Custom child view to render below the preview */
  ChildView?: () => JSX.Element;
  /** Description text to display */
  description?: string;
  /** Custom style object for the bubble */
  style?: {
    /** Custom body style */
    bodyStyle?: (CometChatTheme["linkPreviewBubbleStyles"] & {})["bodyStyle"];
    /** Custom header image style */
    headerImageStyle?: (CometChatTheme["linkPreviewBubbleStyles"] & {})["headerImageStyle"];
    /** Custom header image container style */
    headerImageContainerStyle?: (CometChatTheme["linkPreviewBubbleStyles"] & {})["headerImageContainerStyle"];
  };
  /** URL of the link to preview */
  link: string;
  /** Callback when the preview is pressed */
  onPress?: () => void;
  /** Title text to display */
  title: string;
  /** Image URL for the preview header */
  image: string;
  /** Favicon URL to display */
  favicon: string;
}

/**
 * LinkPreviewBubble component displays a preview of a link with image, title, description, and favicon.
 *
 * @param props - LinkPreviewBubbleInterface properties.
 * @returns A JSX.Element rendering the link preview bubble.
 */
export const LinkPreviewBubble = (props: LinkPreviewBubbleInterface) => {
  const { style, link, title, ChildView, image, onPress, description, favicon } = props;
  const theme = useTheme();
  const {t}=useCometChatTranslation()

  const _style = style;

  const [imageSource, setImageSource] = useState({
    uri: image.startsWith("https:") ? image : `https:${image.split("http:")[1]}`,
  });

  const [imageHeight, setImageHeight] = useState<DimensionValue>();
  const [imageWidth, setImageWidth] = useState<DimensionValue>();

  const [faviconSource, setFaviconSource] = useState({
    uri: favicon.startsWith("https:") ? favicon : `https:${favicon.split("http:")[1]}`,
  });

  const [faviconError, setFaviconError] = useState(false);

  const pressTime = useRef<number | null>(0);

  /**
   * Records the time when the touch starts.
   */
  const handleTouchStart = () => {
    pressTime.current = Date.now();
  };

  /**
   * Handles the touch end event. If the press duration is less than 500ms, it triggers the onPress callback or opens the link.
   */
  const handleTouchEnd = async () => {
    const endTime = Date.now();
    const pressDuration = endTime - (pressTime.current ?? 0);
    if (pressDuration < 500) {
      if (onPress) {
        onPress();
      } else {
        const opened = await Linking.openURL(link);
        if (!opened) {
          Alert.alert(t("SOMETHING_WRONG"));
        }
      }
    }
  };

  /**
   * Handles the touch move event. For iOS, it cancels the press action.
   */
  const onTouchMove = () => {
    if (Platform.OS === "ios") {
      pressTime.current = null;
    }
  };

  /**
   * Callback for layout changes of the container.
   * Sets the image width and height based on the container size.
   *
   * @param event - The layout change event.
   */
  const onLayoutHandler = useCallback(
    (event: LayoutChangeEvent) => {
      if (imageHeight && imageWidth) {
        return;
      }
      const containerWidth = event.nativeEvent.layout.width;
      Image.getSize(
        image,
        (width: number, height: number) => {
          setImageHeight(height);
          if (typeof style?.headerImageContainerStyle?.maxHeight === "number") {
            setImageHeight(
              height < style?.headerImageContainerStyle?.maxHeight
                ? height
                : style?.headerImageContainerStyle.maxHeight
            );
          }
          setImageWidth(width < containerWidth ? width : containerWidth);
        },
        (error: any) => {
          console.log(error);
        }
      );
    },
    [image, imageHeight, imageWidth, style]
  );

  return (
    <View 
      onLayout={onLayoutHandler}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={onTouchMove}
    >
      <View
        style={style?.headerImageContainerStyle}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={onTouchMove}
      >
        <Image
          source={imageSource}
          style={[{ height: imageHeight, width: imageWidth }, style?.headerImageStyle]}
          onError={(err) => {
            setImageSource(DefaultLinkPreview);
          }}
        />
      </View>

      <View style={style?.bodyStyle?.containerStyle}>
        <View style={{ flexDirection: "row" }}>
          <View style={style?.bodyStyle?.titleContainerStyle}>
            <Text style={style?.bodyStyle?.titleStyle} ellipsizeMode='tail'>
              {title}
            </Text>
          </View>

          {!faviconError && (
            <View style={style?.bodyStyle?.faviconContainerStyle}>
              <Image
                source={faviconSource}
                style={style?.bodyStyle?.faviconStyle}
                onError={(err) => {
                  setFaviconError(true);
                }}
              />
            </View>
          )}
        </View>
        <View style={style?.bodyStyle?.subtitleContainerStyle}>
          <Text style={style?.bodyStyle?.subtitleTitle} numberOfLines={2} ellipsizeMode='tail'>
            {description}
          </Text>
          <Text style={style?.bodyStyle?.subtitleTitle} numberOfLines={2} ellipsizeMode='tail'>
            {link}
          </Text>
        </View>
      </View>
      <View
        style={{
          paddingVertical: theme.spacing.padding.p3,
          paddingHorizontal: style?.bodyStyle?.containerStyle.padding,
          flexShrink: 0,
        }}
      >
        {ChildView && <ChildView />}
      </View>
    </View>
  );
};
