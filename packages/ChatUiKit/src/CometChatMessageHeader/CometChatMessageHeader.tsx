import React, { JSX, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ChatConfigurator, getLastSeenTime } from "../shared";
import { listners } from "./listners";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { GroupTypeConstants, UserStatusConstants } from "../shared/constants/UIKitConstants";
import { CometChatUIEventHandler } from "../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { CometChatUIEvents } from "../shared/events/CometChatUIEvents";
import { deepMerge } from "../shared/helper/helperFunctions";
import { Icon } from "../shared/icons/Icon";
import { CometChatAvatar } from "../shared/views/CometChatAvatar";
import { CometChatStatusIndicator } from "../shared/views/CometChatStatusIndicator";
import { useTheme } from "../theme";
import { MessageHeaderStyle } from "./styles";
import { CommonUtils } from "../shared/utils/CommonUtils";
import { DeepPartial } from "../shared/helper/types";
import { useCometChatTranslation } from "../shared/resources/CometChatLocalizeNew";
import { CometChatAIAssistantChatHistory } from "../CometChatAIAssistantChatHistory/CometChatAIAssistantChatHistory";
import { CometChatTooltipMenu, MenuItemInterface } from "../shared/views/CometChatTooltipMenu";

export type CometChatMessageHeaderInterface = {
  /**
   * Custom item view. Receives { user, group }.
   */
  ItemView?: ({ user, group }: { user?: CometChat.User; group?: CometChat.Group }) => JSX.Element;
  /**
   * Custom leading view. Receives { user, group }.
   */
  LeadingView?: ({
    user,
    group,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
  }) => JSX.Element;
  /**
   * Custom title view. Receives { user, group }.
   */
  TitleView?: ({ user, group }: { user?: CometChat.User; group?: CometChat.Group }) => JSX.Element;
  /**
   * Custom subtitle view. Receives { user, group }.
   */
  SubtitleView?: ({
    user,
    group,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
  }) => JSX.Element;
  /**
   * Custom trailing view. Receives { user, group }.
   */
  TrailingView?: ({
    user,
    group,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
  }) => JSX.Element;
  /**
   * Custom auxiliary button view. Receives { user, group }.
   */
  AuxiliaryButtonView?: ({
    user,
    group,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
  }) => JSX.Element;
  /**
   * User object.
   */
  user?: CometChat.User;
  /**
   * Group object.
   */
  group?: CometChat.Group;
  /**
   * Hide the back button.
   */
  showBackButton?: boolean;
  /**
   * Callback when back button is pressed.
   */
  onBack?: () => void;
  /**
   * Custom styles.
   */
  style?: DeepPartial<MessageHeaderStyle>;
  /**
   * Error callback.
   */
  onError?: (error: CometChat.CometChatException) => void;
  /**
   * toggle visibilty of voice call button.
   */
  hideVoiceCallButton?: boolean;
  /**
   * toggle visibilty of video call button.
   */
  hideVideoCallButton?: boolean;
  /**
   * toggle visibilty of user status.
   */
  usersStatusVisibility?: boolean;
  /**
   * Flag to hide the new chat button for AI agents (only applies to @agentic users)
   */
  hideNewChatButton?: boolean;
  /**
   * Flag to hide the chat history button for AI agents (only applies to @agentic users)
   */
  hideChatHistoryButton?: boolean;
  /**
   * Callback when agent new chat button is clicked (only applies to @agentic users)
   */
  onNewChatButtonClick?: () => void;
  /**
   * Callback when agent chat history button is clicked (only applies to @agentic users)
   */
  onChatHistoryButtonClick?: () => void;
  /**
   * A function to **replace** the default menu items entirely.
   */
  options?: ({ user, group }: { user?: CometChat.User; group?: CometChat.Group }) => MenuItemInterface[];
};

interface Translations {
  lastSeen: string;
  minutesAgo: (minutes: number) => string;
  hoursAgo: (hours: number) => string;
}

/** CometChatMessageHeader renders the header for a conversation. */
export const CometChatMessageHeader = (props: CometChatMessageHeaderInterface) => {
  const userStatusListenerId = "user_status_" + new Date().getTime();
  const msgTypingListenerId = "message_typing_" + new Date().getTime();
  const groupListenerId = "head_group_" + new Date().getTime();
  const theme = useTheme();
  const { t } = useCometChatTranslation();

  const {
    TitleView,
    SubtitleView = null,
    AuxiliaryButtonView,
    user,
    group,
    showBackButton = false,
    onBack,
    style = {},
    ItemView,
    LeadingView,
    TrailingView,
    onError,
    hideVoiceCallButton = false,
    hideVideoCallButton = false,
    usersStatusVisibility = true,
    hideNewChatButton = false,
    hideChatHistoryButton = false,
    onNewChatButtonClick,
    onChatHistoryButtonClick,
    options,
  } = props;

  const [groupObj, setGroupObj] = useState(group);
  const [userObj, setUserObj] = useState<CometChat.User | undefined>(user);
  const [userStatus, setUserStatus] = useState(user && user.getStatus ? user.getStatus() : "");
  const [typingText, setTypingText] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ pageX: 0, pageY: 0 });
  const receiverTypeRef = useRef(
    user ? CometChat.RECEIVER_TYPE.USER : group ? CometChat.RECEIVER_TYPE.GROUP : null
  );

  // Helper function to check if user is agentic
  const isAgenticUser = useCallback(() => {
    return userObj?.getRole?.() === '@agentic';
  }, [userObj]);

  // Build menu items following CometChat pattern
  const buildMenuItems = useCallback((): MenuItemInterface[] => {
    if (options) return options({ user: userObj, group: groupObj });
    
    return [];
  }, [options, userObj, groupObj, isAgenticUser]);

  // Handle option selection
  const handleOptionSelect = useCallback((item: MenuItemInterface) => {
    setShowOptionsMenu(false);
    if (item.onPress) {
      item.onPress();
    }
  }, []);


  useEffect(() => {
    setGroupObj(group);
  }, [group]);

  useEffect(() => {
    setUserStatus(userObj ? userObj.getStatus() : "");
  }, [userObj]);

  const messageHeaderStyles = useMemo(() => {
    return deepMerge(theme.messageHeaderStyles, style);
  }, [theme.messageHeaderStyles, style]);

  const translations: Translations = {
    lastSeen: "Last seen",
    minutesAgo: (minutes: number) => `${minutes} minute${minutes === 1 ? "" : "s"} ago`,
    hoursAgo: (hours: number) => `${hours} hour${hours === 1 ? "" : "s"} ago`,
  };

  /**
   * Renders the back button.
   */
  const BackButton = useCallback(
    () => (
      <TouchableOpacity style={[messageHeaderStyles.backButtonStyle]} onPress={onBack}>
        <Icon
          name='arrow-back-fill'
          size={messageHeaderStyles.backButtonIconStyle.width}
          height={messageHeaderStyles.backButtonIconStyle.height}
          width={messageHeaderStyles.backButtonIconStyle.width}
          color={messageHeaderStyles.backButtonIconStyle.tintColor}
          icon={messageHeaderStyles.backButtonIcon}
          imageStyle={messageHeaderStyles.backButtonIconStyle}
        />
      </TouchableOpacity>
    ),
    [onBack, messageHeaderStyles]
  );

  const statusIndicatorType = useMemo(() => {
    if (groupObj?.getType() === GroupTypeConstants.password) return "password";
    if (groupObj?.getType() === GroupTypeConstants.private) return "private";
    if (userStatus === "online") return "online";
    return "offline";
  }, [userStatus, groupObj]);

  /**
   * Renders the avatar with a status indicator.
   */
  const AvatarWithStatusView = useCallback(() => {
    try {
      return (
        <View>
          <CometChatAvatar
            style={messageHeaderStyles.avatarStyle}
            image={
              userObj
                ? userObj.getAvatar()
                  ? { uri: userObj.getAvatar() }
                  : undefined
                : groupObj
                  ? groupObj.getIcon()
                    ? { uri: groupObj.getIcon() }
                    : undefined
                  : undefined
            }
            name={(userObj?.getName() ?? groupObj?.getName())!}
          />
        </View>
      );
    } catch (e) {
      errorHandler(e);
      return <></>;
    }
  }, [userObj, groupObj, statusIndicatorType, messageHeaderStyles]);

  /**
   * Renders subtitle view content.
   */
  const SubtitleViewFnc = useCallback(() => {
    try {
      if (typingText !== "")
        return (
          <Text
            numberOfLines={1}
            ellipsizeMode='tail'
            style={[messageHeaderStyles.typingIndicatorTextStyle]}
          >
            {typingText}
          </Text>
        );
      let subtitle = "";

      if (groupObj) {
        const count = groupObj?.["membersCount"];
        if (count || count === 0) {
          subtitle = `${count} ${t(count === 1 ? "MEMBER" : "MEMBERS")}`;
        }
      }

      if (
        userObj &&
        !(userObj.getBlockedByMe() || userObj.getHasBlockedMe()) &&
        usersStatusVisibility &&
        userStatus
      ) {
        subtitle =
          userStatus === UserStatusConstants.online
            ? t("ONLINE")
            : getLastSeenTime(userObj.getLastActiveAt()); // Updated to use getLastSeenTime function
      }

      if (subtitle) {
        return <Text style={[messageHeaderStyles.subtitleTextStyle]}>{subtitle}</Text>;
      }

      return <></>;
    } catch (error) {
      errorHandler(error);
      return <></>;
    }
  }, [userObj, groupObj, messageHeaderStyles, usersStatusVisibility, userStatus]);

  /**
   * Error handler to call onError with a proper CometChatException.
   */
  const errorHandler = (error: any) => {
    if (error instanceof CometChat.CometChatException) {
      onError && onError(error);
    } else if (error instanceof Error) {
      onError &&
        onError(
          new CometChat.CometChatException({
            code: "ERR_SYSTEM",
            details: error.stack,
            message: error.message,
          })
        );
    }
  };

  const handleUserStatus = (userDetails: CometChat.User) => {
    if (userDetails.getUid() === userObj?.getUid()) {
      setUserObj(userDetails); 
      setUserStatus(userDetails.getStatus());
    }
  };

  const msgTypingIndicator = (typist: CometChat.TypingIndicator, status: string) => {
    if (
      receiverTypeRef.current === CometChat.RECEIVER_TYPE.GROUP &&
      receiverTypeRef.current === typist.getReceiverType() &&
      groupObj?.getGuid() === typist.getReceiverId()
    ) {
      setTypingText(
        status === "typing" ? `${typist.getSender().getName()}: ${t("IS_TYPING")}` : ""
      );
    } else if (
      receiverTypeRef.current === CometChat.RECEIVER_TYPE.USER &&
      receiverTypeRef.current === typist.getReceiverType() &&
      userObj?.getUid() === typist.getSender().getUid() &&
      !(userObj.getBlockedByMe() || userObj.getHasBlockedMe())
    ) {
      setTypingText(status === "typing" ? t("TYPING") : "");
    }
  };

  const handleGroupListener = (groupDetails: CometChat.Group) => {
    if (groupDetails?.getGuid() === groupObj?.getGuid() && groupDetails.getMembersCount()) {
      setGroupObj(CommonUtils.clone(groupDetails));
    }
  };

  useEffect(() => {
    try {
      if (userObj) {
        listners.addListener.userListener({ userStatusListenerId, handleUserStatus });
        receiverTypeRef.current = CometChat.RECEIVER_TYPE.USER;

        CometChatUIEventHandler.addUserListener(userStatusListenerId, {
          ccUserBlocked: (item: { user: CometChat.User }) => handleccUserBlocked(item),
          ccUserUnBlocked: (item: { user: CometChat.User }) => handleccUserUnBlocked(item),
        });
      }
      if (groupObj) {
        listners.addListener.groupListener({ groupListenerId, handleGroupListener });
        receiverTypeRef.current = CometChat.RECEIVER_TYPE.GROUP;
      }
      listners.addListener.messageListener({ msgTypingListenerId, msgTypingIndicator });
    } catch (error) {
      errorHandler(error);
    }
    return () => {
      try {
        if (groupObj) listners.removeListner.removeGroupListener({ groupListenerId });
        if (userObj) {
          listners.removeListner.removeUserListener({ userStatusListenerId });
          CometChatUIEventHandler.removeUserListener(userStatusListenerId);
        }
        listners.removeListner.removeMessageListener({ msgTypingListenerId });
      } catch (cleanupError) {
        errorHandler(cleanupError);
      }
    };
  }, [userObj]);

  const handleccUserBlocked = ({ user: blockedUser }: { user: CometChat.User }) => {
    if (userObj && userObj.getUid() === blockedUser.getUid()) {
      const tempUser = CommonUtils.clone(userObj);
      tempUser.setBlockedByMe(true);
      setUserObj(tempUser);
    }
  };

  const handleccUserUnBlocked = ({ user: unBlockedUser }: { user: CometChat.User }) => {
    if (userObj && userObj.getUid() === unBlockedUser.getUid()) {
      setUserObj(unBlockedUser);
    }
  };

  const handleGroupMemberKicked = ({ kickedFrom }: { kickedFrom: CometChat.Group }) => {
    setGroupObj(CommonUtils.clone(kickedFrom));
  };
  const handleGroupMemberBanned = ({ kickedFrom }: { kickedFrom: CometChat.Group }) => {
    setGroupObj(CommonUtils.clone(kickedFrom));
  };
  const handleGroupMemberAdded = ({ userAddedIn }: { userAddedIn: CometChat.Group }) => {
    setGroupObj(CommonUtils.clone(userAddedIn));
  };
  const handleOwnershipChanged = ({ group }: { group: CometChat.Group }) => {
    setGroupObj(CommonUtils.clone(group));
  };

  useEffect(() => {
    try {
      CometChatUIEventHandler.addGroupListener(groupListenerId, {
        ccGroupMemberKicked: (item: any) => handleGroupMemberKicked(item),
        ccGroupMemberBanned: (item: any) => handleGroupMemberBanned(item),
        ccGroupMemberAdded: (item: any) => handleGroupMemberAdded(item),
        ccOwnershipChanged: (item: any) => handleOwnershipChanged(item),
      });
    } catch (e) {
      errorHandler(e);
    }
    return () => {
      try {
        CometChatUIEventHandler.removeGroupListener(groupListenerId);
      } catch (e) {
        errorHandler(e);
      }
    };
  }, []);

  /**
   * Renders AI agent auxiliary buttons (new chat, history, close)
   */
  const renderAgentAuxiliaryView = () => {
    const iconSecondary = theme.color.iconSecondary;

    const handleNewChat = () => {
      if (onNewChatButtonClick) {
        onNewChatButtonClick();
      }
    };

    const handleChatHistory = () => {
      if (onChatHistoryButtonClick) {
        onChatHistoryButtonClick();
      }
    };

    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {!hideNewChatButton && (
          <TouchableOpacity
            style={{
              borderRadius: 12,
              padding: 8,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
            onPress={handleNewChat}
          >
            <Icon name="ai-new-chat" width={24} height={24} color={iconSecondary} />
          </TouchableOpacity>
        )}

        {!hideChatHistoryButton && (
          <TouchableOpacity
            style={{
              borderRadius: 12,
              padding: 8,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
            onPress={handleChatHistory}
          >
            <Icon name="ai-chat-history" width={24} height={24} color={iconSecondary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const menuItems = buildMenuItems();

  return (
    <>
      {ItemView ? (
        ItemView({ user: userObj, group })
      ) : (
        <View style={[messageHeaderStyles.containerStyle]}>
          {showBackButton === true && <BackButton />}
          {LeadingView ? LeadingView({ user: userObj, group }) : <AvatarWithStatusView />}
          <View style={{ flex: 1, justifyContent: "center" }}>
            {TitleView ? (
              TitleView({ user: userObj, group })
            ) : (
              <Text
                numberOfLines={1}
                ellipsizeMode='tail'
                style={[messageHeaderStyles.titleTextStyle]}
              >
                {userObj ? userObj.getName() : groupObj ? groupObj.getName() : ""}
              </Text>
            )}
            {SubtitleView ? SubtitleView({ user: userObj, group }) : <SubtitleViewFnc />}
          </View>
          <View style={{ 
            flex: isAgenticUser() ? 0 : 1, 
            flexDirection: "row",
            alignItems: "center"
          }}>
            <View style={{ marginLeft: "auto", flexDirection: "row" }}>
                {(() => {
                  const isAgenticUser = userObj?.getRole?.() === '@agentic';
                  
                  if (isAgenticUser && !AuxiliaryButtonView) {
                    return renderAgentAuxiliaryView();
                  }
                  
                  return AuxiliaryButtonView
                    ? AuxiliaryButtonView({ user: userObj, group })
                    : ChatConfigurator.getDataSource().getAuxiliaryHeaderAppbarOptions(userObj, group, {
                        callButtonStyle: messageHeaderStyles.callButtonStyle,
                        hideVideoCallButton,
                        hideVoiceCallButton,
                      });
                })()}
              {TrailingView && !isAgenticUser() && (
                <View style={{ marginLeft: theme.spacing.padding.p4 }}>
                  {TrailingView({ user: userObj, group })}
                </View>
              )}
              {menuItems.length > 0 && (
                <TouchableOpacity
                style={{ marginLeft: theme.spacing.padding.p2 }}
                  onPress={(e) => {
                    if (e.nativeEvent) {
                      setTooltipPosition({
                        pageX: e.nativeEvent.pageX || 200,
                        pageY: e.nativeEvent.pageY || 100,
                      });
                    }
                    setShowOptionsMenu(true);
                  }}
                >
                  <Icon
                    name="more-vert"
                    width={24}
                    height={24}
                    color={messageHeaderStyles.backButtonIconStyle.tintColor}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {menuItems.length > 0 && (
        <CometChatTooltipMenu
          visible={showOptionsMenu}
          onClose={() => setShowOptionsMenu(false)}
          event={{
            nativeEvent: tooltipPosition,
          }}
          menuItems={menuItems.map((item) => ({
            text: item.text,
            onPress: () => {
              handleOptionSelect(item);
            },
            icon: item.icon,
            textStyle: item.textStyle,
          }))}
        />
      )}
    </>
  );
};
