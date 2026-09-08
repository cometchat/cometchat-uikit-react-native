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
      // NO adjustsFontSizeToFit (ENG-38886).
      //
      // On iOS that prop shrinks the text to fit the Text's frame — and on the FIRST row a list
      // renders, the frame is not known yet. iOS shrinks to its minimum against that unknown,
      // never recomputes, and the initials end up a few pixels tall in the corner of the circle
      // while every later row in the same list is perfect. Measured 2026-09-04: identical
      // resolved style (20px font, 48px circle) on every row, only the first one broken.
      //
      // It was never earning its keep. Initials are at most two characters and the theme sizes
      // them for its own circle, so there is nothing to shrink in the normal case; it only ever
      // fired when a consumer shrank the container WITHOUT bringing the font down with it. That
      // is a styling mistake and it should look like one, rather than being silently papered
      // over on Android and mangled on iOS — see CometChatPinnedMessages/style.ts, which sizes
      // its own text for its 32px avatar.
      //
      // numberOfLines stays: it keeps a stray long value on one line instead of wrapping.
      <Text style={[avatarStyle.textStyle]} numberOfLines={1}>
        {initials}
      </Text>
    );
  }, [image, name, avatarStyle.imageStyle, avatarStyle.textStyle]);

  return <View style={[avatarStyle.containerStyle]}>{getImageView()}</View>;
};
