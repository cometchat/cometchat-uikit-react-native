import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  BackHandler,
  Platform,
  StatusBar,
} from 'react-native';
import {
  CometChatSearch,
  useTheme,
  useCometChatTranslation,
} from '@cometchat/chat-uikit-react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/types';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { navigate } from '../../../navigation/NavigationService';
import { SCREEN_CONSTANTS } from '../../../utils/AppConstants';

type Props = StackScreenProps<RootStackParamList, 'SearchMessages'>;

const SearchMessages: React.FC<Props> = ({ route, navigation }) => {
  const { user, group } = route.params || {};
  const theme = useTheme();
  const { t } = useCometChatTranslation();
  const insets = useSafeAreaInsets();

  const navigationRef = useRef(navigation);
  const routeRef = useRef(route);

  // Update refs when navigation/route changes
  useEffect(() => {
    navigationRef.current = navigation;
    routeRef.current = route;
  }, [navigation, route]);

  // Handle back button on Android
  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [navigation]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleConversationClicked = useCallback((conversation: CometChat.Conversation, searchKeyword?: string) => {
    // Navigate to messages screen with the selected conversation
    const conversationWith = conversation.getConversationWith();

    if (conversationWith instanceof CometChat.User) {
      navigate(SCREEN_CONSTANTS.MESSAGES, {
        user: conversationWith,
        searchKeyword,
      });
    } else if (conversationWith instanceof CometChat.Group) {
      navigate(SCREEN_CONSTANTS.MESSAGES, {
        group: conversationWith,
        searchKeyword,
      });
    }
  }, []);

  const handleMessageClicked = useCallback(async (message: CometChat.BaseMessage, searchKeyword?: string) => {
    // Navigate to messages screen and highlight the specific message
    const messageReceiver = message.getReceiver();
    const parentMessageId = message.getParentMessageId();

    let targetUser: CometChat.User | undefined;
    let targetGroup: CometChat.Group | undefined;

    if (messageReceiver instanceof CometChat.User) {
      // For user messages, determine if it's a direct message to/from the user
      const sender = message.getSender();
      const loggedInUser = await CometChat.getLoggedinUser();

      if (sender.getUid() === loggedInUser?.getUid()) {
        // Message sent by logged-in user, target is receiver
        targetUser = messageReceiver;
      } else {
        // Message received by logged-in user, target is sender
        targetUser = sender;
      }
    } else if (messageReceiver instanceof CometChat.Group) {
      targetGroup = messageReceiver;
    }

    if (parentMessageId) {
      try {
        const parentMessage = await CometChat.getMessageDetails(parentMessageId);
        if (parentMessage) {
          navigate(SCREEN_CONSTANTS.THREAD_VIEW, {
            message: parentMessage,
            user: targetUser,
            group: targetGroup,
            highlightMessageId: String(message.getId()),
          });
          return;
        }
      } catch (e) {
        console.error("Failed to fetch parent message", e);
      }
    }

    if (targetUser) {
      navigate(SCREEN_CONSTANTS.MESSAGES, {
        user: targetUser,
        messageId: String(message.getId()),
        searchKeyword,
        navigatedFromSearch: true,
      });
    } else if (targetGroup) {
      navigate(SCREEN_CONSTANTS.MESSAGES, {
        group: targetGroup,
        messageId: String(message.getId()),
        searchKeyword,
        navigatedFromSearch: true,
      });
    }
  }, []);


  // Determine placeholder text
  let searchPlaceholder = "Search";
  if (user && user.getName()) {
    searchPlaceholder = `Search in ${user.getName()}`;
  } else if (group && group.getName()) {
    searchPlaceholder = `Search in ${group.getName()}`;
  }

  return (
    <View style={[styles.container, Platform.OS === 'android' && { paddingTop: insets.top }]}>
      {Platform.OS === 'ios' && (
        <StatusBar
          barStyle={
            theme.mode === 'light' ? 'dark-content' : 'light-content'
          }
          backgroundColor={theme.color.background1}
        />
      )}

      <CometChatSearch
        onBack={handleBack}
        hideBackButton={false}
        onConversationClicked={handleConversationClicked}
        onMessageClicked={handleMessageClicked}
        uid={user?.getUid()}
        guid={group?.getGuid()}
        searchPlaceholder={searchPlaceholder}
        messagesRequestBuilder={
          new CometChat.MessagesRequestBuilder().setLimit(30)
        }
        conversationsRequestBuilder={
          new CometChat.ConversationsRequestBuilder().setLimit(30)
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SearchMessages;