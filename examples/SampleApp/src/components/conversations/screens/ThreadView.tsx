import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Platform,
} from 'react-native';
import {
  RouteProp,
  useRoute,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import {
  CometChatThreadHeader,
  CometChatMessageList,
  CometChatMessageComposer,
  useCometChatTranslation,
  CometChatUIKit,
  ChatConfigurator,
  CometChatUIEventHandler,
  CometChatUIEvents,
} from '@cometchat/chat-uikit-react-native';
import { Icon } from '@cometchat/chat-uikit-react-native';
import { useTheme } from '@cometchat/chat-uikit-react-native';
import { RootStackParamList } from '../../../navigation/types';
import ArrowBack from '../../../assets/icons/ArrowBack';
import { StackNavigationProp } from '@react-navigation/stack';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CommonUtils } from '../../../utils/CommonUtils';
import { useConfig } from '../../../config/store';


type ThreadViewRouteProp = RouteProp<RootStackParamList, 'ThreadView'>;
type ThreadViewNavProp = StackNavigationProp<RootStackParamList>;

const ThreadView = () => {
  const { params } = useRoute<ThreadViewRouteProp>();
  const navigation = useNavigation<ThreadViewNavProp>(); // <-- added navigation
  const { goBack } = navigation;
  const theme = useTheme();
  const { message, user, group } = params || {};
  const { t } = useCometChatTranslation();
  const messageDeliveryAndReadReceipts = useConfig(
      (state) => state.settings.chatFeatures.coreMessagingExperience.messageDeliveryAndReadReceipts
  );
  const hideReactionOption = useConfig(
      (state) => state.settings.chatFeatures.deeperUserEngagement.reactions
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
  const mentions = useConfig(
      (state) => state.settings.chatFeatures.deeperUserEngagement.mentions
  );
  const voiceNotes = useConfig(
      (state) => state.settings.chatFeatures.deeperUserEngagement.voiceNotes
  );
  const stickers = useConfig(
      (state) => state.settings.chatFeatures.deeperUserEngagement.stickers
  );
  const sendPrivateMessageToGroupMembers = useConfig(
      (state) => state.settings.chatFeatures.privateMessagingWithinGroups.sendPrivateMessageToGroupMembers
  );

  const loggedInUser = useRef<CometChat.User>(
    CometChatUIKit.loggedInUser!,
  ).current;

  const [localUser, setLocalUser] = useState<CometChat.User | undefined>(
    params?.user,
  );

  // keep listener ids unique
  const userListenerId = 'thread_user_' + new Date().getTime();

  // Fetch latest user on mount (if user present)
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        if (params?.user) {
          const uid = params.user.getUid();
          const fresh = await CometChat.getUser(uid);
          if (mounted) setLocalUser(CommonUtils.clone(fresh));
        }
      } catch (err) {
        console.error('Error fetching user in ThreadView:', err);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [params?.user]);

  // add UI listeners for block/unblock to update localUser
  useEffect(() => {
    CometChatUIEventHandler.addUserListener(userListenerId, {
      ccUserBlocked: (payload: { user: CometChat.User }) => {
        setLocalUser(CommonUtils.clone(payload.user));
      },
      ccUserUnBlocked: (payload: { user: CometChat.User }) => {
        setLocalUser(CommonUtils.clone(payload.user));
      },
    });

    return () => {
      CometChatUIEventHandler.removeUserListener(userListenerId);
    };
  }, []);

  useEffect(() => {
    CometChatUIEventHandler.emitUIEvent?.(CometChatUIEvents.hidePanel, {
      alignment: 'composerBottom',
      child: () => null,
      panelId: 'sticker',
    });
  }, []);

// B) Ensure back also asks to close (already using goBack())
const handleBack = useCallback(() => {
  CometChatUIEventHandler.emitUIEvent?.(CometChatUIEvents.hidePanel, {
    alignment: 'composerBottom',
    child: () => null,
    panelId: 'sticker',
  });
  navigation.goBack();
  return true;
}, [navigation]);

  useFocusEffect(
    useCallback(() => {
      // Android hardware back -> just pop
      const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);

      // iOS gesture/back button -> let default POP happen, but run side-effects
      const unsub = navigation.addListener('beforeRemove', e => {
        const type = e?.data?.action?.type;
        if (type === 'GO_BACK' || type === 'POP') {
          // IMPORTANT: do NOT e.preventDefault()
          CometChatUIEventHandler.emitUIEvent?.(CometChatUIEvents.hidePanel, {
            alignment: 'composerBottom',
            child: () => null,
            panelId: 'sticker',
          });
        }
      });

      return () => {
        sub.remove();
        unsub();
      };
    }, [navigation, handleBack]),
  );

  // Header back
  <TouchableOpacity onPress={handleBack}>…</TouchableOpacity>;

  // Keep gesture enabled
  useLayoutEffect(() => {
    navigation.setOptions?.({ gestureEnabled: true } as any);
  }, [navigation]);
  
  const unblock = async (userToUnblock: CometChat.User) => {
    try {
      const uid = userToUnblock.getUid();
      const response = await CometChat.unblockUsers([uid]);
      if (response) {
        const fresh = await CometChat.getUser(uid);
        setLocalUser(CommonUtils.clone(fresh));
        CometChatUIEventHandler.emitUserEvent(
          CometChatUIEvents.ccUserUnBlocked,
          {
            user: fresh,
          },
        );
      }
    } catch (error) {
      console.error('Error unblocking user from ThreadView:', error);
    }
  };

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

  const threadHeaderMentionsFormatter = useMemo(
    () => getMentionsTap(),
    [getMentionsTap],
  );

  return (
    <View style={{ backgroundColor: theme.color.background1, flex: 1 }}>
      {/* Custom Header */}
      <View style={styles.headerStyle}>
        <TouchableOpacity style={styles.iconStyle} onPress={handleBack}>
          <Icon
            icon={
              <ArrowBack
                color={theme.color.iconPrimary}
                height={24}
                width={24}
              />
            }
          />
        </TouchableOpacity>
        <View style={styles.textStyle}>
          <Text
            style={[
              theme.typography.heading1.bold,
              { color: theme.color.textPrimary },
            ]}
          >
            {t('THREAD')}
          </Text>
          <Text
            style={[
              theme.typography.caption1.regular,
              {
                color: theme.color.textSecondary,
                maxWidth: '90%',
              },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {user ? user?.getName() : group?.getName()}
          </Text>
        </View>
      </View>

      {/* Thread Header */}
      <CometChatThreadHeader
        parentMessage={message}
        receiptsVisibility={messageDeliveryAndReadReceipts}
        textFormatters={[threadHeaderMentionsFormatter]}
      />

      {/* Threaded Message List */}
      <View style={{ flex: 1 }}>
        <CometChatMessageList
          user={user}
          group={group}
          parentMessageId={message.getId().toString()}
          textFormatters={[getMentionsTap()]}
          receiptsVisibility={messageDeliveryAndReadReceipts}
          hideReactionOption={!hideReactionOption}
          hideMessagePrivatelyOption={!sendPrivateMessageToGroupMembers}
          goToMessageId={params?.highlightMessageId}
        />
      </View>

      {/* Message Composer for Thread */}
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
          user={localUser}
          group={group}
          parentMessageId={message.getId()}
          onError={(error: any) => console.error('Composer Error:', error)}
          keyboardAvoidingViewProps={
            Platform.OS === 'android' ? {} : { behavior: 'padding' }
          }
          hideImageAttachmentOption={!photosSharing}
          hideVideoAttachmentOption={!videoSharing}
          hideAudioAttachmentOption={!audioSharing}
          hideFileAttachmentOption={!fileSharing}
          hideCameraOption={!photosSharing}
          disableMentions={!mentions}
          hideVoiceRecordingButton={!voiceNotes}
          hideStickersButton={!stickers}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerStyle: {
    paddingVertical: 10,
    paddingLeft: 10,
    flexDirection: 'row',
  },
  iconStyle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textStyle: {
    paddingLeft: 10,
    alignItems: 'flex-start',
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

export default ThreadView;
