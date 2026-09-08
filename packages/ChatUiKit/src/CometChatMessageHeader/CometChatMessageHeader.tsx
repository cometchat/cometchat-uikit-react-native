let __listenerIdCounter = 0;
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
import {
  isThreadSubscribed,
  stampThreadSubscribed,
  ThreadSubscriptionConfig,
  toggleThreadSubscription,
} from "../shared/utils/ThreadSubscriptionHelper";
import { useToast } from "../shared/helper/useToast";
import { skipNextAgentAutoLoad } from "../CometChatMessageList/CometChatMessageList";

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
   * The thread's root message. Set this when the header sits above a thread — it is what
   * turns the header into a thread header, and it is the message the follow control acts on.
   *
   * @type {CometChat.BaseMessage}
   */
  parentMessage?: CometChat.BaseMessage;
  /**
   * Toggle visibility for the follow/unfollow control in the header's top bar.
   *
   * §6.2 names this flag on each platform's thread header; on this platform, as on Flutter,
   * the landed design places the bell in the message header's top bar, so the same
   * cross-platform name lives here. One concept, one name, per-platform placement.
   *
   * The control renders only when `parentMessage` is set AND the feature gate
   * (`ThreadSubscriptionConfig.setEnabled`) is on — which is off by default, so an
   * integrator opts in. `false` hides it even when both of those hold.
   *
   * CometChatThreadHeader keeps its own identically-named flag for the replies-row control;
   * an app using this top-bar bell should switch that one off.
   *
   * @type {boolean}
   */
  threadSubscriptionVisibility?: boolean;
  /**
   * Called after the subscription for this thread changes, including the optimistic flip
   * and any revert.
   */
  onThreadSubscriptionChange?: (subscribed: boolean) => void;
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
  /**
   * When true, adds "Conversation Summary" as an item inside the ⋮ options menu.
   */
  showConversationSummaryButton?: boolean;
  /**
   * Called when the user taps "Conversation Summary" in the options menu.
   */
  onConversationSummaryPress?: () => void;
  /**
   * When true, adds "Pinned Messages" as an item inside the ⋮ options menu (§6.3).
   * The kit owns the label and icon so copy stays localised and consistent across
   * integrators, rather than each app hand-rolling the entry via `options`.
   */
  showPinnedMessagesButton?: boolean;
  /**
   * Called when the user taps "Pinned Messages". The host opens
   * CometChatPinnedMessages for this conversation.
   */
  onPinnedMessagesPress?: () => void;
};

interface Translations {
  lastSeen: string;
  minutesAgo: (minutes: number) => string;
  hoursAgo: (hours: number) => string;
}

/** CometChatMessageHeader renders the header for a conversation. */
export const CometChatMessageHeader = (props: CometChatMessageHeaderInterface) => {
  const userStatusListenerId = "user_status_" + Date.now() + "_" + (++__listenerIdCounter);
  const msgTypingListenerId = "message_typing_" + Date.now() + "_" + (++__listenerIdCounter);
  const groupListenerId = "head_group_" + Date.now() + "_" + (++__listenerIdCounter);
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
    parentMessage,
    threadSubscriptionVisibility = true,
    onThreadSubscriptionChange,
    hideNewChatButton = false,
    hideChatHistoryButton = false,
    onNewChatButtonClick,
    onChatHistoryButtonClick,
    options,
    showConversationSummaryButton = false,
    onConversationSummaryPress,
    showPinnedMessagesButton = false,
    onPinnedMessagesPress,
  } = props;

  const [groupObj, setGroupObj] = useState(group);
  const [userObj, setUserObj] = useState<CometChat.User | undefined>(user);
  const [userStatus, setUserStatus] = useState(user && user.getStatus ? user.getStatus() : "");
  const [typingText, setTypingText] = useState("");
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ pageX: 0, pageY: 0 });
  const receiverTypeRef = useRef(
    user ? CometChat.RECEIVER_TYPE.USER : group ? CometChat.RECEIVER_TYPE.GROUP : null
  );

  // ── Thread subscription (§6.2) ───────────────────────────────────────────────
  // Only a header sitting above a thread has anything to follow, and the gate is off until
  // the integrator opts in. Both must hold before the control exists at all.
  const showThreadSubscription =
    !!parentMessage && ThreadSubscriptionConfig.isEnabled() && threadSubscriptionVisibility;
  // The state lives on the message now, so this reads the message, not an id.
  const [threadSubscribed, setThreadSubscribed] = useState<boolean>(() =>
    parentMessage ? isThreadSubscribed(parentMessage) : false
  );
  const { showToast, ToastElement } = useToast();
  const threadListenerId = useRef(
    "header_thread_" + Date.now() + "_" + (++__listenerIdCounter)
  ).current;

  useEffect(() => {
    if (!parentMessage) return;
    // Re-seed whenever the parent OBJECT changes: a re-fetch produces a new object carrying
    // the server's answer, and a fetched flag always wins over anything mirrored locally.
    setThreadSubscribed(isThreadSubscribed(parentMessage));
    CometChatUIEventHandler.addMessageListener(threadListenerId, {
      // Keep this an INLINE arrow on this exact property. emitMessageEvent dispatches by
      // comparing the emitted name against the handler's Function.name, which JS infers from
      // the property key — hoisting this into a named function elsewhere renames it and the
      // event stops arriving, silently.
      ccThreadSubscriptionChanged: ({ parentMessageId, subscribed }: any) => {
        if (Number(parentMessageId) !== Number(parentMessage.getId())) return;
        // Both halves matter: re-render, AND write the flag back onto the object we hold, so
        // a remount or a direct read does not resurrect the pre-flip value.
        stampThreadSubscribed(parentMessage, !!subscribed);
        setThreadSubscribed(!!subscribed);
        onThreadSubscriptionChange?.(!!subscribed);
      },
    });
    return () => CometChatUIEventHandler.removeMessageListener(threadListenerId);
  }, [parentMessage]);

  const onThreadSubscriptionPress = useCallback(() => {
    if (!parentMessage) return;
    // The helper owns the debounce, the in-flight guard, the optimistic emit and the revert.
    toggleThreadSubscription(parentMessage).then(
      (subscribed: boolean) => {
        // Both transitions are confirmed. The unsubscribe copy must not promise
        // permanence: replying or being mentioned re-subscribes.
        showToast(
          t(
            subscribed
              ? "THREAD_SUBSCRIPTION_SUBSCRIBED_TOAST"
              : "THREAD_SUBSCRIPTION_UNSUBSCRIBED_TOAST"
          )
        );
      },
      () => showToast(t("THREAD_SUBSCRIPTION_FAILED"))
    );
  }, [parentMessage, showToast, t]);

  const ThreadSubscriptionButton = useCallback(
    () => (
      <TouchableOpacity
        testID='MessageHeader.followToggle'
        onPress={onThreadSubscriptionPress}
        accessibilityRole='button'
        // State-labelled, NOT action-labelled: the header says what IS, the action sheet
        // says what a tap DOES (§6.5).
        accessibilityLabel={
          threadSubscribed
            ? t("THREAD_SUBSCRIPTION_SUBSCRIBED")
            : t("THREAD_SUBSCRIPTION_SUBSCRIBE")
        }
        accessibilityState={{ selected: threadSubscribed }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View
          testID={
            threadSubscribed
              ? "MessageHeader.bell.following"
              : "MessageHeader.bell.notFollowing"
          }
          // Fixed width: the two glyphs are 19pt and 22pt wide, so without it the control
          // shifts sideways on every toggle.
          style={{ width: 22, alignItems: "center" }}
        >
          <Icon
            name={threadSubscribed ? "thread-follow" : "thread-unfollow"}
            color={threadSubscribed ? theme.color.primary : theme.color.iconSecondary}
            height={23}
            width={threadSubscribed ? 19 : 22}
          />
        </View>
      </TouchableOpacity>
    ),
    [threadSubscribed, onThreadSubscriptionPress, t, theme]
  );

  // Helper function to check if user is agentic
  const isAgenticUser = useCallback(() => {
    return userObj?.getRole?.() === '@agentic';
  }, [userObj]);

  // Build menu items following CometChat pattern
  const buildMenuItems = useCallback((): MenuItemInterface[] => {
    const items: MenuItemInterface[] = options ? [...options({ user: userObj, group: groupObj })] : [];
    // Appended, not early-returned: the original wrote `return [...]` inside the
    // summary branch, which meant any item added after it could never appear
    // whenever summary was enabled.
    if (showPinnedMessagesButton && onPinnedMessagesPress) {
      items.push({
        text: t('PINNED_MESSAGES') ?? 'Pinned Messages',
        onPress: onPinnedMessagesPress,
        icon: <Icon name="keep" width={20} height={20} color={theme.color.iconSecondary} />,
      });
    }
    if (showConversationSummaryButton && onConversationSummaryPress) {
      items.push({
        text: t('ai_conversation_summary_title'),
        onPress: onConversationSummaryPress,
        icon: <Icon name="ai-conversation-summary" width={20} height={20} color={theme.color.iconSecondary} />,
      });
    }
    return items;
  }, [options, userObj, groupObj, isAgenticUser, showConversationSummaryButton, onConversationSummaryPress, showPinnedMessagesButton, onPinnedMessagesPress, theme, t]);

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
      <TouchableOpacity
        testID='MessageHeader.back'
        style={[messageHeaderStyles.backButtonStyle]}
        onPress={onBack}
      >
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
            name={userObj?.getName() ?? groupObj?.getName() ?? ""}
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
        const count = groupObj.getMembersCount?.() ?? groupObj?.["membersCount"];
        if (count != null) {
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
        status === "typing" ? `${typist.getSender()?.getName()}: ${t("IS_TYPING")}` : ""
      );
    } else if (
      receiverTypeRef.current === CometChat.RECEIVER_TYPE.USER &&
      receiverTypeRef.current === typist.getReceiverType() &&
      userObj?.getUid() === typist.getSender()?.getUid() &&
      !(userObj.getBlockedByMe() || userObj.getHasBlockedMe())
    ) {
      setTypingText(status === "typing" ? t("TYPING") : "");
    }
  };

  const handleGroupListener = (groupDetails: CometChat.Group) => {
    if (groupDetails?.getGuid() === groupObj?.getGuid() && groupDetails.getMembersCount() != null) {
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
      skipNextAgentAutoLoad();
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
              {showThreadSubscription && (
                <View style={{ marginLeft: theme.spacing.padding.p4 }}>
                  <ThreadSubscriptionButton />
                </View>
              )}
              {TrailingView && !isAgenticUser() && (
                <View style={{ marginLeft: theme.spacing.padding.p4 }}>
                  {TrailingView({ user: userObj, group })}
                </View>
              )}
              {menuItems.length > 0 && (
                <TouchableOpacity
                testID='MessageHeader.optionsMenu'
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

      {/* Ungated on purpose. `showToast` only sets state — this is the ONLY thing that
          renders it, so gating the two on different conditions means a toast that fires
          into nothing. The element is null unless a message is pending anyway, so an
          unconditional mount costs a null render and removes a whole class of
          "the toast never appeared" bug. */}
      {ToastElement}
    </>
  );
};
