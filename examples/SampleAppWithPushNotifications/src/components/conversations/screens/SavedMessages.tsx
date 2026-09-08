import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatSavedMessages } from '@cometchat/chat-uikit-react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { SafeAreaView } from 'react-native';
import { SCREEN_CONSTANTS } from '../../../utils/AppConstants';

/**
 * The user-level Saved Messages screen (ENG-37789).
 *
 * Reached from the conversations side menu, NOT from a conversation header — a save
 * is per-user and cross-conversation, so it belongs in app chrome.
 */
const SavedMessages = () => {
  const navigation = useNavigation<any>();

  // Same stack reset SearchMessages and PinnedMessages use: [BottomTabNavigator →
  // target]. A fresh route instance is what makes the jump reliable — goToMessageId
  // is only read on mount.
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
   * Jump to the tapped message — the same path search and the pinned panel take, so
   * all three land in CometChatMessageList's goToMessageId → getMessagesAroundId →
   * scrollToMessage.
   *
   * Unlike the pinned panel, this list spans every conversation, so the target has
   * to be resolved to a real User/Group first: the Messages screen expects SDK
   * entities, and a bare `{uid}` literal would render an empty header and never
   * build a request.
   */
  const onItemPress = useCallback(
    async (message: CometChat.BaseMessage, source: { receiverType: string; receiverId: string } | null) => {
      if (!source) return;

      let user: CometChat.User | undefined;
      let group: CometChat.Group | undefined;
      try {
        if (source.receiverType === 'group') {
          group = await CometChat.getGroup(source.receiverId);
        } else {
          user = await CometChat.getUser(source.receiverId);
        }
      } catch (e) {
        console.error('Failed to resolve the saved message source', e);
        return;
      }

      // A saved message can be a thread reply (design doc Q9), and those live in the
      // thread view rather than the main list.
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
    [navigateToMessage]
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <CometChatSavedMessages
        onBack={() => navigation.goBack()}
        onItemPress={onItemPress}
      />
    </SafeAreaView>
  );
};

export default SavedMessages;
