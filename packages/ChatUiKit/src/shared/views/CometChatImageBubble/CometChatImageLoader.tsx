import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  View,
  StyleSheet,
  Platform,
  ImageSourcePropType,
  ImageStyle,
  ViewStyle,
} from "react-native";
import { ImageViewerModal } from "../CometChatImageViewerModal";
import { CommonUtils } from "../../utils/CommonUtils";

/**
 * Props for the CometChatImageLoader component.
 */
export interface CometChatImageLoaderPropType {
  /**
   * Image URL passed as an object with a `uri` property.
   * Example: `{ uri: "dummyUrl" }`
   */
  imageUrl: ImageSourcePropType;
  /**
   * Thumbnail image URL.
   *
   * @type {ImageSourcePropType}
   * @description Thumbnail image to display while the full image loads.
   */
  thumbnailUrl?: ImageSourcePropType;
  /**
   * Placeholder image to display while loading.
   */
  placeHolderImage?: ImageSourcePropType;
  /**
   * Custom callback function to execute when the image is pressed.
   */
  onPress?: Function;
  /**
   * Custom style for the image.
   */
  style?: ImageStyle;
  /**
   * Resize mode for the image.
   *
   * @default "cover"
   */
  imageResizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
  /**
   * Size of the activity indicator.
   */
  activityIndicatorSize: number;
  /**
   * Custom style for the view containing the activity indicator.
   */
  activityIndicatorViewStyle: ViewStyle;
}

/**
 * CometChatImageLoader is a component that displays an image with an activity indicator
 * until the image is loaded. It supports thumbnail prefetching and opens an image viewer
 * modal on a quick tap.
 *
 *  Props for the component.
 *  The rendered image loader component.
 */
export const CometChatImageLoader = (props: CometChatImageLoaderPropType) => {
  const {
    thumbnailUrl,
    imageUrl,
    style,
    imageResizeMode,
    activityIndicatorSize,
    activityIndicatorViewStyle,
  } = props;

  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [imageSource, setImageSource] = useState<ImageSourcePropType>();
  const isUpgraded = useRef(false);

  // Ref to record touch press time for detecting quick taps
  const pressTime = useRef<number | null>(0);

  /**
   * Handles the touch start event.
   */
  const handleTouchStart = () => {
    pressTime.current = Date.now();
  };

  /**
   * Handles the touch end event and opens the image viewer if tap duration is short.
   */
  const handleTouchEnd = () => {
    if (pressTime.current === null && Platform.OS === "ios") return;
    const endTime = Date.now();
    const pressDuration = endTime - pressTime.current!;
    if (pressDuration < 500) {
      setIsVisible(true);
    }
  };

  /**
   * Handles the touch move event. On iOS, cancels the tap detection.
   */
  const onTouchMove = () => {
    if (Platform.OS === "ios") {
      pressTime.current = null;
    }
  };

  useEffect(() => {
    isUpgraded.current = false;
    // Show thumbnail quickly as placeholder, then upgrade to full-resolution image
    if (thumbnailUrl && typeof thumbnailUrl === "object" && "uri" in thumbnailUrl) {
      // Start with thumbnail for fast display
      CommonUtils.prefetchThumbnail(thumbnailUrl.uri!).then((success: any) => {
        if (success && !isUpgraded.current) {
          setImageSource(thumbnailUrl);
        }
      });

      // Prefetch the full-resolution image and upgrade once ready
      if (imageUrl && typeof imageUrl === "object" && "uri" in imageUrl && imageUrl.uri) {
        CommonUtils.prefetchThumbnail(imageUrl.uri!).then((success: any) => {
          if (success) {
            isUpgraded.current = true;
            setImageSource(imageUrl);
          }
        });
      }
    } else {
      setImageSource(imageUrl); // No thumbnail available, use full image directly
    }
  }, [thumbnailUrl, imageUrl]);

  return (
    <>
      {isVisible && (
        <ImageViewerModal
          imageUrl={imageUrl}
          isVisible={isVisible}
          onClose={() => {
            setIsVisible(false);
          }}
        />
      )}
      <View
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={onTouchMove}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        style={{
          position: "relative",
          justifyContent: "center",
          alignItems: "center",
          height: style?.height,
          width: style?.width,
          minWidth: style?.minWidth,
        }}
      >
        {/* Render the image. It is initially hidden until loaded. */}
        <Image
          resizeMode={imageResizeMode || "cover"}
          resizeMethod="scale"
          source={imageSource}
          style={[styles.image, style]}
          onLoad={() => setIsLoaded(true)}
        />
        {/* Render the activity indicator until the image is loaded */}
        {!isLoaded && (
          <ActivityIndicator
            size={activityIndicatorSize || "large"}
            style={[styles.loader, activityIndicatorViewStyle]}
          />
        )}
      </View>
    </>
  );
};

// Default styles for the component
const styles = StyleSheet.create({
  container: {
    position: "relative", // Use relative positioning for the container
    justifyContent: "center",
    alignItems: "center",
  },
  loader: {
    position: "absolute", // Keep the loader centered over the image
    zIndex: 1, // Ensure it is rendered above the image until the image loads
  },
  image: {
    position: "absolute", // The image remains fixed in place while loading
  },
});