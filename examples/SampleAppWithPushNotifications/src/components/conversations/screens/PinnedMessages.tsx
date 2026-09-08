import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatPinnedMessages } from '@cometchat/chat-uikit-react-native';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { SafeAreaView } from 'react-native';
import { SCREEN_CONSTANTS } from '../../../utils/AppConstants';

/**
 * Per-conversation pinned messages (ENG-37789), opened from the chat-header ⋮.
 *
 * Conversation-scoped, so it takes the same user/group the Messages screen was
 * opened with rather than resolving anything itself.
 */
const PinnedMessages = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, group } = (route.params ?? {}) as {
    user?: CometChat.User;
    group?: CometChat.Group;
  };

  // Same stack reset SearchMessages uses: [BottomTabNavigator → target]. A fresh
  // route instance is what makes the jump reliable — navigating to the Messages
  // screen already sitting under this panel would have to merge params into a
  // mounted screen, and goToMessageId is only read on mount.
  const navigateToMessage = useCallback(
    (screenName: string, params: Record<string, any>) => {
      navigation.dispatch((state: any) => {
        const firstRoute = state.routes[0];
        return CommonActions.reset({
          ...state,
          routes: [firstRoute, { name: screenName, params }],
          index: 1,
        });
      });
    },
    [navigation]
  );

  /**
   * Jump to the tapped message — the same path search takes, so both land in
   * CometChatMessageList's goToMessageId → getMessagesAroundId → scrollToMessage.
   *
   * A pinned message can be a thread reply (design doc Q9), and those live in the
   * thread view rather than the main list, so route on parentMessageId first.
   */
  const onItemPress = useCallback(
    async (message: CometChat.BaseMessage) => {
      const parentMessageId = message.getParentMessageId();

      if (parentMessageId) {
        try {
          const parentMessage = await CometChat.getMessageDetails(parentMessageId);
          if (parentMessage) {
            navigateToMessage(SCREEN_CONSTANTS.THREAD_VIEW, {
              message: parentMessage,
              user,
              group,
              highlightMessageId: String(message.getId()),
            });
            return;
          }
        } catch (e) {
          console.error('Failed to fetch parent message', e);
        }
      }

      navigateToMessage(SCREEN_CONSTANTS.MESSAGES, {
        user,
        group,
        messageId: String(message.getId()),
        navigatedFromSearch: true,
      });
    },
    [navigateToMessage, user, group]
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <CometChatPinnedMessages
        user={user}
        group={group}
        onBack={() => navigation.goBack()}
        onItemPress={onItemPress}
      />
    </SafeAreaView>
  );
};

export default PinnedMessages;
