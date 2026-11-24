import { CometChat } from "@cometchat/chat-sdk-react-native";
import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { useTheme } from "../../../theme";
import { useCompTheme } from "../../../theme/hook";
import { deepMerge } from "../../helper/helperFunctions";
import { usePresenceHidden } from "../../offline/usePresenceHidden";
import { StatusIndicatorStyles } from "./styles";

/**
 * Props for the CometChatStatusIndicator component.
 */
export interface CometChatStatusIndicatorInterface {
  /**
   * The status type to be displayed. Can be one of:
   * "online", "offline", "private", "protected", or "public".
   */
  type?: "online" | "offline" | "private" | "protected" | "public" |  "password" | null;
  /**
   * Custom styles for the status indicator.
   */
  style?: Partial<StatusIndicatorStyles>;
}

/**
 * CometChatStatusIndicator is a component used for indicating the status of a user or group.
 * It displays the online/offline or custom status of the user/group using a predefined symbol or style.
 *
 * @author CometChat
 */

export const CometChatStatusIndicator = ({
  type = "offline",
  style,
}: CometChatStatusIndicatorInterface) => {
  const theme = useTheme();
  const compTheme = useCompTheme();
  // Offline ON, SDK not connected: no presence anywhere (groups' private / protected badges stay).
  const presenceHidden = usePresenceHidden();
  const statusIndicatorStyles = useMemo(() => {
    return deepMerge(theme.statusIndicatorStyle, compTheme.statusIndicatorStyle ?? {}, style ?? {});
  }, [theme, compTheme, style]);

  if (type === CometChat.USER_STATUS.ONLINE) {
    if (presenceHidden) return null;
    return (
      <View
        style={[ statusIndicatorStyles.containerStyleOnline]}
      />
    );
  }
  if (type === CometChat.GROUP_TYPE.PRIVATE) {
    return (
      <View
        style={[ statusIndicatorStyles.containerStylePrivate]}
      >
        <Image
          style={[statusIndicatorStyles.imageStylePrivate]}
          source={require("./private.png")}
        />
      </View>
    );
  }
  if (type === CometChat.GROUP_TYPE.PROTECTED) {
    return (
      <View
        style={[
          statusIndicatorStyles.containerStyleProtected,
        ]}
      >
        <Image
          style={[ statusIndicatorStyles.imageStyleProtected]}
          source={require("./protected.png")}
        />
      </View>
    );
  }
  return null;
};