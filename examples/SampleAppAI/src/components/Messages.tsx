import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
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
  CometChatAIAssistantChatHistory,
  CometChatAIAssistantTools,
  CometChatThemeProvider,
  useCometChatTranslation
} from '@cometchat/chat-uikit-react-native';
import {StackScreenProps} from '@react-navigation/stack';
import {CometChat} from '@cometchat/chat-sdk-react-native';
import {CommonUtils} from '../utils/CommonUtils';
import {useActiveChat} from '../utils/ActiveChatContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RootStackParamList} from '../navigation/types';

const {width} = Dimensions.get('window');

type Props = StackScreenProps<RootStackParamList, 'Messages'>;

const Messages: React.FC<Props> = ({route, navigation}) => {
  const {user, group, parentMessageId: routeParentMessageId} = route.params;
  const loggedInUser = useRef<CometChat.User>(
    CometChatUIKit.loggedInUser!,
  ).current;
  const theme = useTheme();
  const { t } = useCometChatTranslation();

  const themeRef = useRef(theme);
  const navigationRef = useRef(navigation);
  const routeRef = useRef(route);
  const userListenerId = 'app_messages' + new Date().getTime();
  const openmessageListenerId = 'message_' + new Date().getTime();
  const [localUser, setLocalUser] = useState<CometChat.User | undefined>(user);
  const [messageListKey, setMessageListKey] = useState(0);
  const [messageComposerKey, setMessageComposerKey] = useState(0);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Manage parentMessageId in parent component
  const [parentMessageId, setParentMessageId] = useState<string | undefined>(routeParentMessageId);
  
  const {setActiveChat} = useActiveChat();
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

  /** Active chat setup */
  useEffect(() => {
    // if it's a user chat
    if (user) {
      setActiveChat({type: 'user', id: user.getUid()});
    } else if (group) {
      setActiveChat({type: 'group', id: group.getGuid()});
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
    themeRef.current = theme;
    navigationRef.current = navigation;
    routeRef.current = route;
  }, [theme, navigation, route]);

  const toggleTab = useCallback(() => {
    // Simple toggle function without dependency on external toggleBottomTab
    return () => {};
  }, []);

  useLayoutEffect(() => {
    const cleanup = toggleTab();
    return () => {
      cleanup();
    };
  }, [toggleTab]);

  useEffect(() => {
    const backAction = () => {
      // Reset streaming state when navigating back
      if (messageComposerRef.current?.resetStreaming) {
        messageComposerRef.current.resetStreaming();
      }
      navigation.popToTop();
      return true;
    };
    // Add event listener for hardware back press
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    CometChatUIEventHandler.addUserListener(userListenerId, {
      ccUserBlocked: (item: {user: CometChat.User}) =>
        handleccUserBlocked(item),
      ccUserUnBlocked: (item: {user: CometChat.User}) =>
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

    CometChatUIEventHandler.addUIListener(openmessageListenerId, {
      openChat: ({user}) => {
        if (user != undefined) {
          navigation.push('Messages', {
            user,
          });
        }
      },
    });

    return () => {
      CometChatUIEventHandler.removeUserListener(userListenerId);
      CometChat.removeUserListener(statusListenerId);
      CometChatUIEventHandler.removeUIListener(openmessageListenerId);
    };
  }, [localUser]);

  const handleccUserBlocked = ({user}: {user: CometChat.User}) => {
    setLocalUser(CommonUtils.clone(user));
  };

  const handleccUserUnBlocked = ({user}: {user: CometChat.User}) => {
    setLocalUser(CommonUtils.clone(user));
  };

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
          onBack={() => navigation.popToTop()}
          showBackButton
          hideChatHistoryButton={false}
          hideNewChatButton={false}
          onChatHistoryButtonClick={handleChatHistoryClick}
          onNewChatButtonClick={handleNewChatClick}
        />
        <View style={styles.flexOne}>
          <CometChatMessageList
            key={messageListKey}
            user={user}
            group={group}
            parentMessageId={parentMessageId}
            aiAssistantTools={new CometChatAIAssistantTools({
              getCurrentWeather: (args: any) => console.log('Weather args', args),
            })}
            streamingSpeed={10}
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
          <View style={[styles.blockedContainer, { backgroundColor: theme.color.background3 }]}>
            <Text
              style={[
                theme.typography.button.regular,
                { color: theme.color.textSecondary, textAlign: 'center', paddingBottom: 10 },
              ]}
            >
              {t('BLOCKED_USER_DESC')}
            </Text>
            <TouchableOpacity
              onPress={() => unblock(localUser)}
              style={[styles.button, { borderColor: theme.color.borderDefault }]}
            >
              <Text style={[theme.typography.button.medium, styles.buttontext, { color: theme.color.textPrimary }]}>
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
              ...(Platform.OS === 'android' ? {} : { behavior: 'padding' }),
            }}
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
  appBarContainer: {
    flexDirection: 'row',
    marginLeft: 16,
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