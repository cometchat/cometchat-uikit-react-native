import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Text,
  BackHandler,
  Platform,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import {
  CometChatUIKit,
  CometChatMessageHeader,
  CometChatMessageList,
  CometChatMessageComposer,
  useTheme,
  CometChatUIEventHandler,
  CometChatUIEvents,
  ChatConfigurator,
  useCometChatTranslation,
  Icon,
  CometChatAIAssistantChatHistory,
  CometChatAIAssistantTools,
  CometChatThemeProvider,
} from '@cometchat/chat-uikit-react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/types';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CommonUtils } from '../../../utils/CommonUtils';
import {useActiveChat} from '../../../utils/ActiveChatContext';
import { useConfig } from '../../../config/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type Props = StackScreenProps<RootStackParamList, 'Messages'>;

const Messages: React.FC<Props> = ({ route, navigation }) => {
  const { 
    user, 
    group, 
    fromMention = false, 
    fromMessagePrivately = false,
    parentMessageId: routeParentMessageId,
    messageId,
    searchKeyword
  } = route.params;
  const typingIndicator = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.typingIndicator
  );
  const threadConversationAndReplies = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.threadConversationAndReplies
  );
  const photosSharing = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.photosSharing
  );
  const videoSharing = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.videoSharing
  );
  const audioSharing = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.audioSharing
  );
  const fileSharing = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.fileSharing
  );
  const editMessage = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.editMessage
  );
  const deleteMessage = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.deleteMessage
  );
  const messageDeliveryAndReadReceipts = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.messageDeliveryAndReadReceipts
  );
  const userAndFriendsPresence = useConfig(
    (state) => state.settings.chatFeatures.coreMessagingExperience.userAndFriendsPresence
  );
  const mentions = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.mentions
  );
  const reactions = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.reactions
  );
  const messageTranslation = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.messageTranslation
  );
  const polls = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.polls
  );
  const collaborativeWhiteboard = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.collaborativeWhiteboard
  );
  const collaborativeDocument = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.collaborativeDocument
  );
  const voiceNotes = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.voiceNotes
  );
  const stickers = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.stickers
  );
  const userInfo = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.userInfo
  );
  const groupInfo = useConfig(
    (state) => state.settings.chatFeatures.deeperUserEngagement.groupInfo
  );
  const sendPrivateMessageToGroupMembers = useConfig(
    (state) => state.settings.chatFeatures.privateMessagingWithinGroups.sendPrivateMessageToGroupMembers
  );
  const oneOnOneVoiceCalling = useConfig(
    (state) => state.settings.callFeatures.voiceAndVideoCalling.oneOnOneVoiceCalling
  );
  const oneOnOneVideoCalling = useConfig(
    (state) => state.settings.callFeatures.voiceAndVideoCalling.oneOnOneVideoCalling
  );
  const groupVideoConference = useConfig(
    (state) => state.settings.callFeatures.voiceAndVideoCalling.groupVideoConference
  );
  const groupVoiceConference = useConfig(
    (state) => state.settings.callFeatures.voiceAndVideoCalling.groupVoiceConference
  );

  const loggedInUser = useRef<CometChat.User>(
    CometChatUIKit.loggedInUser!,
  ).current;
  const theme = useTheme();
  const { t } = useCometChatTranslation();
  const themeRef = useRef(theme);
  const navigationRef = useRef(navigation);
  const routeRef = useRef(route);
  const userListenerId = 'app_messages' + new Date().getTime();
  // Stable listener id for the lifetime of this component (prevents multiple listeners)
  const openmessageListenerIdRef = useRef('message_' + new Date().getTime());
  const lastOpenChatRef = useRef<{ uid: string; time: number } | null>(null);
  const [localUser, setLocalUser] = useState<CometChat.User | undefined>(user);
  const [messageListKey, setMessageListKey] = useState(0);
  const [messageComposerKey, setMessageComposerKey] = useState(0);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Manage parentMessageId in parent component
  const [parentMessageId, setParentMessageId] = useState<string | undefined>(routeParentMessageId);
  
  const { setActiveChat } = useActiveChat();
  const insets = useSafeAreaInsets();
  
  // Add ref to track streaming state
  const messageComposerRef = useRef<any>(null);

  /** Animation state for drawer */
  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    if (showHistoryModal) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showHistoryModal, slideAnim]);

  /** Agentic user check */
  const isAgenticUser = useCallback((): boolean => {
    if (localUser) {
      return localUser.getRole?.() === '@agentic';
    }
    return false;
  }, [localUser]);
  const agentic = isAgenticUser();

  useEffect(() => {
    // if it’s a user chat
    if (user) {
      setActiveChat({ type: 'user', id: user.getUid() });
    } else if (group) {
      setActiveChat({ type: 'group', id: group.getGuid() });
    }

    // Cleanup on unmount => setActiveChat(null)
    return () => {
      setActiveChat(null);
      // Reset streaming state when leaving chat
      if (messageComposerRef.current?.resetStreaming) {
        messageComposerRef.current.resetStreaming();
      }
    };
  }, [user, group, setActiveChat]);

  useEffect(() => {
    const backAction = () => {
      if (fromMention || fromMessagePrivately) {
        navigation.goBack();
      } else {
        navigation.popToTop();
      }
      return true;
    };
    // Add event listener for hardware back press
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, [navigation, fromMention, fromMessagePrivately]);

  useEffect(() => {
    CometChatUIEventHandler.addUserListener(userListenerId, {
      ccUserBlocked: (item: { user: CometChat.User }) =>
        handleccUserBlocked(item),
      ccUserUnBlocked: (item: { user: CometChat.User }) =>
        handleccUserUnBlocked(item),
    });

    const statusListenerId = 'user_status_messages_' + new Date().getTime();
    if (localUser) {

      CometChat.addUserListener(
        statusListenerId,
        new CometChat.UserListener({
          onUserOnline: (onlineUser: CometChat.User) => {
            if (onlineUser.getUid() === localUser.getUid()) {
              console.log('🚀 ~ onUserOnline ~ onlineUser:', onlineUser);
              setLocalUser(onlineUser); 
            }
          },
          onUserOffline: (offlineUser: CometChat.User) => {
            console.log('🚀 ~ onUserOffline ~ offlineUser:', offlineUser);
            if (offlineUser.getUid() === localUser.getUid()) {
              setLocalUser(offlineUser); 
            }
          },
        }),
      );
    }

    // Only attach the openChat listener when we are in a group context.
    // This prevents stacking duplicate private chat screens because the group
    // screen remains mounted underneath the user chat.
    const currentListenerId = openmessageListenerIdRef.current;
    if (group) {
      CometChatUIEventHandler.addUIListener(currentListenerId, {
        openChat: ({ user: chatUser }) => {
          if (!chatUser) return;

          try {
            const uid = chatUser.getUid();

            // 1. Debounce rapid duplicate events (within 800ms for the same UID)
            const now = Date.now();
            if (
              lastOpenChatRef.current &&
              lastOpenChatRef.current.uid === uid &&
              now - lastOpenChatRef.current.time < 800
            ) {
              return; // ignore duplicate
            }

            const state = navigation.getState();
            const routes = state?.routes || [];
            const topRoute = routes[routes.length - 1];

            // If the top route already represents this user chat, skip.
            if (
              topRoute?.name === 'Messages' &&
              (topRoute as any)?.params?.user?.getUid &&
              (topRoute as any).params.user.getUid() === uid
            ) {
              return;
            }

            // If any existing route (beneath) already has this user chat, pop back to it instead of pushing another.
            const existingIndex = routes.findIndex(
              r =>
                r.name === 'Messages' &&
                (r as any)?.params?.user?.getUid &&
                (r as any).params.user.getUid() === uid,
            );
            if (existingIndex !== -1) {
              const popCount = routes.length - existingIndex - 1;
              if (popCount > 0) {
                navigation.pop(popCount);
              }
              return; // we're now at the existing user chat
            }

            lastOpenChatRef.current = { uid, time: now };
            navigation.push('Messages', { user: chatUser, fromMessagePrivately: true });
          } catch (e) {
            console.warn('openChat navigation prevented due to error', e);
          }
      },
      });
    }

    // Close sticker panel when screen loses focus
    const blurSub = navigation.addListener('blur', () => {
      CometChatUIEventHandler.emitUIEvent?.(CometChatUIEvents.hidePanel, {
        alignment: 'composerBottom',
        child: () => null,
        panelId: 'sticker',
      });
    });
    const focusSub = navigation.addListener('focus', () => {
      // Force re-mount composer so auxiliary options (StickerButton) reset correctly
      setMessageComposerKey(prev => prev + 1);
    });

    return () => {
      CometChatUIEventHandler.removeUserListener(userListenerId);
      CometChat.removeUserListener(statusListenerId);
      if (group) {
        CometChatUIEventHandler.removeUIListener(currentListenerId);
      }
      blurSub();
      focusSub();
    };
    // Listener re-attached only when group context changes
  }, [navigation, group, userListenerId]);

  const handleccUserBlocked = ({ user: blockedUser }: { user: CometChat.User }) => {
    setLocalUser(CommonUtils.clone(blockedUser));
  };

  const handleccUserUnBlocked = ({ user: unblockedUser }: { user: CometChat.User }) => {
    setLocalUser(CommonUtils.clone(unblockedUser));
  };

  /** Reset messages */
  const handleNewChatClick = useCallback(() => {
    if (messageComposerRef.current?.resetStreaming) {
      messageComposerRef.current.resetStreaming();
    }
    setParentMessageId(undefined);
    setMessageListKey(prev => prev + 1);
    setMessageComposerKey(prev => prev + 1);
    setShowHistoryModal(false);
    navigation.replace('Messages', {
      user,
      group,
    });
  }, [navigation, user, group]);

  /** Open chat history modal */
  const handleChatHistoryClick = useCallback(() => {
    setShowHistoryModal(true);
  }, []);

  /** Handle history message click */
  const handleHistoryMessageClick = useCallback(
    (message: CometChat.BaseMessage) => {
      if (messageComposerRef.current && messageComposerRef.current.stopStreaming) {
        messageComposerRef.current.stopStreaming();
      }
      setShowHistoryModal(false);
      setParentMessageId(message.getId().toString());
      setMessageListKey(prev => prev + 1);
      setMessageComposerKey(prev => prev + 1);
    },
    [],
  );

  /** Handle history error */
  const handleChatHistoryError = useCallback(
    (_error: CometChat.CometChatException) => {},
    [],
  );

  const unblock = async (userToUnblock: CometChat.User) => {
    let uid = userToUnblock.getUid();
    try {
      const response = await CometChat.unblockUsers([uid]);
      const unBlockedUser = await CometChat.getUser(uid);
      if (response) {
        setLocalUser(unBlockedUser);

        // Optionally emit an event or let the server call do the job
        CometChatUIEventHandler.emitUserEvent(
          CometChatUIEvents.ccUserUnBlocked,
          {
            user: unBlockedUser,
          },
        );
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  const options = useMemo(() => {
    return () => {
      // For agentic users, don't show any options menu
      if (agentic) {
        return [];
      }

      const menuOptions = [];

      // Add info option first
      if (group && loggedInUser) {
        menuOptions.push({
          text: 'Group Info',
          onPress: () => {
            navigation.navigate('GroupInfo', { group });
          },
          icon: <Icon name="info" width={20} height={20} color={theme.color.iconSecondary} />,
        });
      } else if (localUser && !localUser.getBlockedByMe()) {
        menuOptions.push({
          text: 'User Info',
          onPress: () => {
            navigation.navigate('UserInfo', { user: localUser });
          },
          icon: <Icon name="info" width={20} height={20} color={theme.color.iconSecondary} />,
        });
      }

      // Then add search option
      menuOptions.push({
        text: 'Search',
        onPress: () => {
          if (group) {
            navigation.navigate('SearchMessages', { group });
          } else if (localUser) {
            navigation.navigate('SearchMessages', { user: localUser });
          }
        },
        icon: <Icon name="search" width={20} height={20} color={theme.color.iconSecondary} />,
      });

      return menuOptions;
    };
  }, [navigation, group, localUser, theme, agentic, loggedInUser]);


  const getMentionsTap = useCallback(() => {
    const mentionsFormatter =
      ChatConfigurator.getDataSource().getMentionsFormatter(
        loggedInUser,
        theme,
      );
    if (user) mentionsFormatter.setUser(user);
    if (group) mentionsFormatter.setGroup(group);

    mentionsFormatter.setOnMentionClick(
      (_message: CometChat.BaseMessage, uid: string) => {
        if (uid !== loggedInUser.getUid()) {
          // Get the user by UID and navigate to Messages
          CometChat.getUser(uid)
            .then((mentionedUser: CometChat.User) => {
              navigation.push('Messages', {
                user: mentionedUser,
                fromMention: true,
              });
            })
            .catch((error: any) => {
              console.error('Error fetching mentioned user:', error);
            });
        }
      },
    );
    return mentionsFormatter;
  }, [user, group, loggedInUser, navigation, theme]);

  /** Theme override for agentic outgoing bubble */
  const providerTheme = useMemo(() => {
    const defaultOutgoingBg =
      theme?.messageListStyles?.outgoingMessageBubbleStyles?.containerStyle?.backgroundColor;
    const defaultTextColor =
      theme?.messageListStyles?.outgoingMessageBubbleStyles?.textBubbleStyles?.textStyle?.color;

    const outgoingOverride = {
      messageComposerStyles: {
        containerStyle: {
          backgroundColor: agentic
            ? theme.color.background3
            : theme?.messageComposerStyles?.containerStyle?.backgroundColor,
        },
      },
      messageListStyles: {
        outgoingMessageBubbleStyles: {
          containerStyle: {
            backgroundColor: agentic
              ? theme.color.background4
              : defaultOutgoingBg,
          },
          textBubbleStyles: {
            textStyle: {
              color: agentic
                ? theme.color.textPrimary
                : defaultTextColor,
            },
          },
          dateStyles: {
            textStyle: {
              color: agentic
                ? theme.color.textSecondary
                : defaultTextColor,
            },
          },
        },
      },
    };

    return {
      light: outgoingOverride,
      dark: outgoingOverride,
      mode: "auto" as "auto",
    };
  }, [agentic, theme]);

  return (
    <CometChatThemeProvider theme={providerTheme}>
      <View style={styles.flexOne}>
      <CometChatMessageHeader
        user={localUser}
        group={group}
        onBack={() => {
          if (fromMention || fromMessagePrivately) {
            navigation.goBack();
          } else {
            navigation.popToTop();
          }
        }}
        showBackButton={true}
        usersStatusVisibility={userAndFriendsPresence}
        hideVoiceCallButton={
          (user && !oneOnOneVoiceCalling) || (group && !groupVoiceConference)
        }
        hideVideoCallButton={
          (user && !oneOnOneVideoCalling) || (group && !groupVideoConference)
        }
        hideChatHistoryButton={false}
        hideNewChatButton={false}
        onChatHistoryButtonClick={handleChatHistoryClick}
        onNewChatButtonClick={handleNewChatClick}
        options={options}
      />
      <View style={styles.flexOne}>
        <CometChatMessageList
          key={messageListKey}
          textFormatters={[getMentionsTap()]}
          user={user}
          group={group}
          parentMessageId={parentMessageId}
          // callback signature expects (messageObject, messageBubbleView)
          onThreadRepliesPress={(messageObject, _messageBubbleView) => {
            CometChatUIEventHandler.emitUIEvent?.(
              CometChatUIEvents.hidePanel,
              {
                alignment: 'composerBottom',
                child: () => null,
              },
            );
            navigation.navigate('ThreadView', { message: messageObject, user, group });
          }}
          hideReplyInThreadOption={!threadConversationAndReplies}
          hideEditMessageOption={!editMessage}
          hideDeleteMessageOption={!deleteMessage}
          receiptsVisibility={messageDeliveryAndReadReceipts}
          hideTranslateMessageOption={!messageTranslation}
          hideReactionOption={!reactions}
          hideMessagePrivatelyOption={!sendPrivateMessageToGroupMembers}
          aiAssistantTools={new CometChatAIAssistantTools({
            getCurrentWeather: (args: any) => console.log('Weather args', args),
          })}
          streamingSpeed={10}
          goToMessageId={messageId}
          searchKeyword={searchKeyword}
        />
      </View>

      {/* Chat History Drawer */}
      {agentic && (
        <Modal visible={showHistoryModal} transparent animationType="none" onRequestClose={() => setShowHistoryModal(false)}>
          <View style={drawerStyles.backdrop}>
            <Animated.View
              style={[
                drawerStyles.drawer,
                { 
                  backgroundColor: theme.color.background1,
                  paddingTop: Platform.OS === 'ios' ? insets.top : 0,
                },
                { transform: [{ translateX: slideAnim }] },
              ]}
            >
              <CometChatAIAssistantChatHistory
                user={localUser}
                group={group}
                onClose={() => setShowHistoryModal(false)}
                onMessageClicked={handleHistoryMessageClick}
                onError={handleChatHistoryError}
                onNewChatButtonClick={handleNewChatClick}
              />
            </Animated.View>
          </View>
        </Modal>
      )}

      {localUser?.getBlockedByMe() ? (
        <View
          style={[
            styles.blockedContainer,
            { backgroundColor: theme.color.background3 },
          ]}
        >
          <Text
            style={[
              theme.typography.button.regular,
              {
                color: theme.color.textSecondary,
                textAlign: 'center',
                paddingBottom: 10,
              },
            ]}
          >
            {t('BLOCKED_USER_DESC')}
          </Text>
          <TouchableOpacity
            onPress={() => unblock(localUser)}
            style={[styles.button, { borderColor: theme.color.borderDefault }]}
          >
            <Text
              style={[
                theme.typography.button.medium,
                styles.buttontext,
                {
                  color: theme.color.textPrimary,
                },
              ]}
            >
              {t('UNBLOCK')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <CometChatMessageComposer
          key={messageComposerKey}
          ref={messageComposerRef}
          parentMessageId={parentMessageId}
          user={localUser}
          group={group}
          keyboardAvoidingViewProps={{
            ...(Platform.OS === 'android'
              ? {}
              : {
                  behavior: 'padding',
                }),
          }}
          disableTypingEvents={!typingIndicator}
          hideImageAttachmentOption={!photosSharing}
          hideVideoAttachmentOption={!videoSharing}
          hideAudioAttachmentOption={!audioSharing}
          hideFileAttachmentOption={!fileSharing}
          hideCameraOption={!photosSharing}
          disableMentions={!mentions}
          hideStickersButton={!stickers}
          hideCollaborativeDocumentOption={!collaborativeDocument}
          hideCollaborativeWhiteboardOption={!collaborativeWhiteboard}
          hidePollsAttachmentOption={!polls}
          hideVoiceRecordingButton={!voiceNotes}
        />
      )}
    </View>
    </CometChatThemeProvider>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  blockedContainer: {
    alignItems: 'center',
    height: 90,
    paddingVertical: 10,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    borderWidth: 2,
    width: '90%',
    borderRadius: 8,
  },
  buttontext: {
    paddingVertical: 5,
    textAlign: 'center',
    alignContent: 'center',
  },
  
});

const drawerStyles = StyleSheet.create({
  backdrop: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  drawer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
});

export default Messages;