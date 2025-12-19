import React, { useCallback, useMemo } from "react";
import { Image, ImageSourcePropType, Text, View } from "react-native";
import { useCompTheme, useTheme } from "../../../theme/hook";
import { CometChatTheme } from "../../../theme/type";
import { deepMerge } from "../../helper/helperFunctions";

/**
 * Properties for the CometChatAvatar component.
 */
interface CometChatAvatarProps {
  /**
   * The image source for the avatar.
   * Can be a remote URI string, an object with a URI property, or a local require() number.
   */
  image?: ImageSourcePropType;
  /**
   * The name to display if no valid image is provided.
   */
  name: string;
  /**
   * Custom style for the avatar component, overriding theme styles.
   */
  style?: CometChatTheme["avatarStyle"];
}

/**
 * A functional component that renders a user's avatar.
 *
 * Props for the avatar.
 * The rendered avatar view.
 */
export const CometChatAvatar = (props: CometChatAvatarProps) => {
  const theme = useTheme();
  const compTheme = useCompTheme();

  const { image, name, style = {} } = props;

  // Merges theme styles with component styles and custom styles.
  const avatarStyle = useMemo(() => {
    return deepMerge(theme.avatarStyle, compTheme.avatarStyle ?? {}, style);
  }, [theme.avatarStyle, style, compTheme.avatarStyle]);

  // Returns an Image view if a valid image is provided, otherwise a text view with initials.
  const getImageView = useCallback(() => {
    const imageSource = typeof image === "string" ? { uri: image } : image;
    if (
      (typeof imageSource === "object" &&
        "uri" in imageSource &&
        typeof imageSource.uri === "string") ||
      typeof imageSource === "number"
    ) {
      return <Image source={imageSource} style={[avatarStyle.imageStyle]} />;
    }
    const initials = [...(name || "")].slice(0, 2).join("").toUpperCase();
    
    return (
      <Text 
        style={[avatarStyle.textStyle]}
        adjustsFontSizeToFit={true}
        numberOfLines={1}
      >
        {initials}
      </Text>
    );
  }, [image, name, avatarStyle.imageStyle, avatarStyle.textStyle]);

  return <View style={[avatarStyle.containerStyle]}>{getImageView()}</View>;
};
