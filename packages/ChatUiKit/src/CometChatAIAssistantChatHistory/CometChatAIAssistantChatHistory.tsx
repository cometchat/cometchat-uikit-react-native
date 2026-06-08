import React, { useState, useRef, useCallback, useEffect, useMemo, JSX } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  GestureResponderEvent,
} from 'react-native';
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { useTheme } from "../theme";
import { Icon } from "../shared/icons/Icon";
import { deepMerge } from "../shared/helper/helperFunctions";
import { DeepPartial } from "../shared/helper/types";
import { ChatHistoryStyle, getChatHistoryStyleLight } from "./style";
import { Skeleton } from "./Skeleton";
import { CometChatTooltipMenu } from "../shared/views/CometChatTooltipMenu";
import { CometChatConfirmDialog } from "../shared/views/CometChatConfirmDialog";
import Delete from "../shared/icons/components/delete";
import { useCometChatTranslation } from "../shared/resources/CometChatLocalizeNew";
import { skipNextAgentAutoLoad } from "../CometChatMessageList/CometChatMessageList";


interface CometChatAIAssistantChatHistoryProps {
  /**
   * A `CometChat.User` object representing the participant of the chat whose message history is displayed.
   */
  user?: CometChat.User;

  /**
   * A `CometChat.Group` object representing the group whose message history is displayed.
   */
  group?: CometChat.Group;

  /**
   * Callback function triggered when an error occurs during message fetching.
   */
  onError?: ((error: CometChat.CometChatException) => void) | null;

  /**
   * Callback function triggered when clicked on closeIcon button
   */
  onClose?: (() => void) | undefined;

  /**
   * Callback function triggered when clicked on a message
   */
  onMessageClicked?: ((message: CometChat.BaseMessage) => void) | undefined;

  /**
   * Callback when agent new chat button is clicked 
   */
  onNewChatButtonClick?: () => void;

  /**
   * Custom styling for the chat history component.
   */
  style?: DeepPartial<ChatHistoryStyle>;
  /**
   * Custom loading state view component
   */
  LoadingStateView?: () => JSX.Element;
}

enum States {
  loading = "loading",
  loaded = "loaded", 
  empty = "empty",
  error = "error"
}

interface GroupedMessage {
  title: string;
  data: CometChat.TextMessage[];
}

const CometChatAIAssistantChatHistory: React.FC<CometChatAIAssistantChatHistoryProps> = (props) => {
  const {
    user,
    group,
    onError,
    onClose,
    onMessageClicked,
    onNewChatButtonClick,
    style = {},
    LoadingStateView
  } = props;

  const theme = useTheme();
  const {t}=useCometChatTranslation();
  
  // Create fallback styles if theme.chatHistoryStyles doesn't exist
  const defaultStyles = useMemo(() => {
    return (theme as any).chatHistoryStyles || getChatHistoryStyleLight(theme.color, theme.spacing, theme.typography);
  }, [theme]);
  
  const mergedStyle = useMemo(() => deepMerge(defaultStyles, style ?? {}), [defaultStyles, style]);

  // State variables
  // Only show text messages in history
  const [messageList, setMessageList] = useState<CometChat.TextMessage[]>([]);
  const [listState, setListState] = useState<States>(States.loading);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Delete functionality states
  const [confirmDelete, setConfirmDelete] = useState<number | undefined>(undefined);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const longPressedMessage = useRef<CometChat.BaseMessage | undefined>(undefined);
  const tooltipPosition = useRef({
    pageX: 0,
    pageY: 0,
  });

  // Refs
  const messageListBuilderRef = useRef<CometChat.MessagesRequest | null>(null);
  const loggedInUserRef = useRef<CometChat.User | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const messagesCountRef = useRef<number>(0);

  // Error handler
  const errorHandler = useCallback((error: any, context: string) => {
    console.log(`Error in ${context}:`, error);
    if (onError) {
      onError(error);
    }
  }, [onError]);

  /**
   * Function to delete a message
   */
  const deleteMessage = useCallback((messageId: number) => {
    const messageToDelete = messageList.find(msg => msg.getId() === messageId);
    if (!messageToDelete) return;

    CometChat.deleteMessage(messageId.toString())
      .then((deletedMessage) => {
        setMessageList(prevList => {
          const newList = prevList.filter(msg => msg.getId() !== messageId);
          messagesCountRef.current = newList.length;
          if (newList.length === 0) {
            setListState(States.empty);
            // Call parent to reset agentic/parent state
            skipNextAgentAutoLoad();
            if (onNewChatButtonClick) {
              onNewChatButtonClick();
            }
          }
          return newList;
        });
      })
      .catch((error) => {
        errorHandler(error, "deleteMessage");
      });
  }, [messageList, errorHandler]);

  /**
   * Function to get formatted date label
   */
  const getDateLabel = useCallback((timestamp: number): string => {
    const messageDate = new Date(timestamp * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      // Check if it's within the last week
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      if (messageDate >= oneWeekAgo) {
        return messageDate.toLocaleDateString('en-US', { weekday: 'long' });
      } else {
        return messageDate.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric',
          year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }
    }
  }, []);

  /**
   * Function to group messages by date
   */
  const groupedMessages = useMemo((): GroupedMessage[] => {
    const groups: { [key: string]: CometChat.TextMessage[] } = {};
    
    messageList.forEach(message => {
      const label = getDateLabel(message.getSentAt());
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(message);
    });
    
    // Sort groups by date priority
    const sortOrder = ['Today', 'Yesterday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return Object.entries(groups)
      .sort(([a], [b]) => {
        const aIndex = sortOrder.indexOf(a);
        const bIndex = sortOrder.indexOf(b);
        
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        } else if (aIndex !== -1) {
          return -1;
        } else if (bIndex !== -1) {
          return 1;
        } else {
          // Both are dates, sort by most recent first
          return b.localeCompare(a);
        }
      })
      .map(([title, data]) => ({ title, data }));
  }, [messageList, getDateLabel]);

  /**
   * Function to extract text content from a message
   */
  const getMessageText = useCallback((message: CometChat.BaseMessage): string => {
    try {
      if (message instanceof CometChat.TextMessage) {
        return message.getText();
      } else if (message instanceof CometChat.MediaMessage) {
        return `${message.getType()} message`;
      } else if (message instanceof CometChat.CustomMessage) {
        // Handle assistant messages
        if (message.getType() === 'assistant' && message.getData()) {
          const data = message.getData();
          if (data.assistantMessageData?.getText) {
            return data.assistantMessageData.getText();
          } else if (data.text) {
            return data.text;
          }
        }
        return 'Custom message';
      } else if (message.getType() === 'groupMember') {
        return 'Group action message';
      } else {
        return 'Message';
      }
    } catch (error) {
      errorHandler(error, "getMessageText");
      return 'Message';
    }
  }, [errorHandler]);

  /**
   * Function to check if message can be deleted
   */
  const canDeleteMessage = useCallback((message: CometChat.BaseMessage): boolean => {
    // Only allow deletion if user is the sender, message is not deleted, and not system/group
    const isSender = message.getSender()?.getUid() === loggedInUserRef.current?.getUid();
    const isDeletableCategory = message.getCategory && message.getCategory() === 'message';
    const isNotDeleted = !message.getDeletedAt || !message.getDeletedAt();
    return isSender && isDeletableCategory && isNotDeleted;
  }, []);

  /**
   * Function to append messages to the end of the current message list
   */
  const appendMessages = useCallback(
    (messages: CometChat.BaseMessage[]) => {
      return new Promise<boolean>((resolve) => {
        try {
          // Only keep text messages with non-empty text, safely check getText
          const textMessages = messages.filter(
            m =>
              m instanceof CometChat.TextMessage &&
              typeof m.getText === "function" &&
              typeof m.getText() === "string" &&
              m.getText().trim() !== ""
          ) as CometChat.TextMessage[];
          setMessageList((prevMessageList: CometChat.TextMessage[]) => {
            const newList = [...prevMessageList, ...textMessages];
            messagesCountRef.current = newList.length;
            return newList;
          });
          resolve(true);
        } catch (error: any) {
          errorHandler(error, "appendMessages");
          resolve(false);
        }
      });
    },
    [errorHandler]
  );

  /**
   * Function to fetch previous messages
   */
  const fetchPreviousMessages = useCallback(() => {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        if (isFetchingRef.current) {
          resolve(true);
          return;
        }

        isFetchingRef.current = true;
        setIsLoadingMore(messagesCountRef.current > 0);

        if (messageListBuilderRef.current) {
          const messages = await messageListBuilderRef.current.fetchPrevious();

          if (messages.length > 0) {
            await appendMessages(messages.reverse());
            setListState(States.loaded);
          } else {
            if (messages.length == 0 && messagesCountRef.current === 0) {
              setListState(States.empty);
            } else {
              setListState(States.loaded);
            }
          }
        }

        isFetchingRef.current = false;
        setIsLoadingMore(false);
        resolve(true);
      } catch (error: any) {
        isFetchingRef.current = false;
        setIsLoadingMore(false);
        if (messagesCountRef.current <= 0) {
          setListState(States.error);
        }
        errorHandler(error, "fetchPreviousMessages");
        reject(error);
      }
    });
  }, [appendMessages, errorHandler]);

  /**
   * Callback to be executed when the list is scrolled to the end
   */
  const onEndReached = useCallback(() => {
    if (listState === States.loaded && !isFetchingRef.current) {
      fetchPreviousMessages();
    }
  }, [fetchPreviousMessages, listState]);

  /**
   * Function to render section header
   */
  const renderSectionHeader = useCallback(({ section }: { section: GroupedMessage }) => {
    return (
      <View style={mergedStyle.sectionHeaderStyle}>
        <Text style={mergedStyle.sectionHeaderTextStyle}>
          {section.title}
        </Text>
      </View>
    );
  }, [mergedStyle]);

  /**
   * Function to render message item
   */
  const renderMessageItem = useCallback(({ item: message }: { item: CometChat.TextMessage }) => {
    // Only render if message is a text message with non-empty text
    if (!(message instanceof CometChat.TextMessage)) return null;
    const messageText = getMessageText(message);
    if (
      !messageText ||
      typeof messageText !== "string" ||
      messageText.trim() === ""
    )
      return null;
    const deletable = canDeleteMessage(message);
    return (
      <TouchableOpacity 
        style={mergedStyle.messageItemStyle}
        onPress={() => {
          if (onMessageClicked) {
            onMessageClicked(message);
          }
        }}
        onLongPress={(e: GestureResponderEvent) => {
          if (deletable) {
            longPressedMessage.current = message;
            tooltipPosition.current = {
              pageX: e.nativeEvent.pageX,
              pageY: e.nativeEvent.pageY,
            };
            setTooltipVisible(true);
          }
        }}
      >
        <Text 
          style={mergedStyle.messageTextStyle}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {messageText}
        </Text>
      </TouchableOpacity>
    );
  }, [getMessageText, mergedStyle, onMessageClicked, canDeleteMessage]);


  /**
   * Initialize component and fetch logged-in user
   */
  useEffect(() => {
    CometChat.getLoggedinUser()
      .then((userObject: CometChat.User | null) => {
        if (userObject) {
          loggedInUserRef.current = userObject;
        }
      })
      .catch((error: CometChat.CometChatException) => {
        errorHandler(error, "getLoggedinUser");
      });
  }, [user, group, errorHandler]);

  /**
   * Initialize message list manager when user or group changes
   */
  useEffect(() => {
    const initializeChat = async () => {
      try {
        if (user || group) {
          // Create messages request builder with hideReplies set to true to only show parent messages
          const builder = new CometChat.MessagesRequestBuilder()
            .hideReplies(true)
            .setLimit(30)
          if (user) {
            builder.setUID(user.getUid());
          } else if (group) {
            builder.setGUID(group.getGuid());
          }

          messageListBuilderRef.current = builder.build();
          messagesCountRef.current = 0;
          setMessageList([]);
          setListState(States.loading);

          // Fetch initial messages
          if (!isFetchingRef.current) {
            isFetchingRef.current = true;
            try {
              const messages = await messageListBuilderRef.current.fetchPrevious();
              if (messages.length > 0) {
                const textMessages = messages
                  .reverse()
                  .filter(
                    m =>
                      m instanceof CometChat.TextMessage &&
                      typeof m.getText === "function" &&
                      typeof m.getText() === "string" &&
                      m.getText().trim() !== ""
                  ) as CometChat.TextMessage[];
                setMessageList(textMessages);
                messagesCountRef.current = textMessages.length;
                setListState(textMessages.length > 0 ? States.loaded : States.empty);
              } else {
                setListState(States.empty);
              }
            } catch (error) {
              setListState(States.error);
              errorHandler(error, "initial fetch");
            } finally {
              isFetchingRef.current = false;
            }
          }
        }
      } catch (error) {
        errorHandler(error, "useEffect - initialization");
      }
    };

    initializeChat();
  }, [user, group, errorHandler]);

  const getLoadingView = () => {
    if (LoadingStateView) return <LoadingStateView />;
    return (
      <Skeleton 
        style={{
          containerBackgroundColor: mergedStyle.containerStyle?.backgroundColor || theme.color.background3,
        }}
      />
    );
  };

  const getEmptyView = () => {
    return (
      <View style={mergedStyle.centerContainerStyle}>
        <Text style={mergedStyle.stateTitleStyle}>
          {t("NO_CONVERSATION_HISTORY_FOUND")}
        </Text>
        <Text style={mergedStyle.stateTextStyle}>
          {t("START_A_CHAT")}
        </Text>
      </View>
    );
  };

  const getErrorView = () => {
    return (
      <View style={mergedStyle.centerContainerStyle}>
        <Text style={[mergedStyle.stateTitleStyle, { color: theme.color.error }]}>
          {t("OOPS!")}
        </Text>
        <Text style={mergedStyle.stateTextStyle}>
          {t("LOOKS_LIKE_SOMETHING_WENT_WRONG")}
        </Text>
      </View>
    );
  };

  // const renderFooter = () => {
  //   if (isLoadingMore) {
  //     return (
  //       <View style={mergedStyle.footerLoaderStyle}>
  //         <ActivityIndicator size="small" color={theme.color.primary} />
  //       </View>
  //     );
  //   }
  //   return null;
  // };

  const keyExtractor = useCallback((item: CometChat.TextMessage, index: number) => {
    return `${item.getId()}_${item.getMuid()}_${index}`;
  }, []);

  return (
    <View style={mergedStyle.containerStyle}>
      {/* Tooltip Menu for Delete Option */}
      {/* Only show tooltip menu if the message is deletable */}
      {longPressedMessage.current && canDeleteMessage(longPressedMessage.current) && (
        <CometChatTooltipMenu
          visible={tooltipVisible}
          onClose={() => {
            setTooltipVisible(false);
          }}
          event={{
            nativeEvent: tooltipPosition.current,
          }}
          menuItems={[{
            text: "Delete",
            onPress: () => {
              setConfirmDelete(longPressedMessage.current?.getId());
              setTooltipVisible(false);
            },
            icon: (
              <Delete
                color={theme.color.error}
                height={theme.spacing.spacing.s6}
                width={theme.spacing.spacing.s6}
              />
            ),
            textStyle: { color: theme.color.error },
          }]}
        />
      )}

      {/* Confirm Delete Dialog */}
      <CometChatConfirmDialog
        titleText="Delete Message"
        icon={<Icon name='delete' size={theme.spacing.spacing.s12} color={theme.color.error} />}
        cancelButtonText="Cancel"
        confirmButtonText="Delete"
        messageText="Are you sure you want to delete this message?"
        isOpen={confirmDelete !== undefined}
        onCancel={() => setConfirmDelete(undefined)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteMessage(confirmDelete);
          }
          setConfirmDelete(undefined);
        }}
      />

      {/* Header */}
      <View style={mergedStyle.headerStyle}>
        <View style={mergedStyle.headerContentStyle}>
          <TouchableOpacity
            style={mergedStyle.closeButtonStyle}
            onPress={onClose}
          >
            <Icon name="close-fill" width={24} height={24} color={theme.color.textSecondary} />
          </TouchableOpacity>
          <Text style={mergedStyle.headerTitleStyle}>
            {t("CHAT_HISTORY")}
          </Text>
        </View>
      </View>

      {/* New Chat Button */}
      <TouchableOpacity
        style={mergedStyle.newChatButtonStyle}
        onPress={() => {
          skipNextAgentAutoLoad();
          onNewChatButtonClick?.();
        }}
      >
        <Icon name="ai-new-chat" width={24} height={24} color={theme.color.textSecondary} />
        <Text style={mergedStyle.newChatTextStyle}>
          {t("NEW_CHAT")}
        </Text>
      </TouchableOpacity>

      {/* Content */}
      {listState === States.loading ? (
        getLoadingView()
      ) : listState === States.error ? (
        getErrorView()
      ) : listState === States.empty ? (
        getEmptyView()
      ) : (
        <SectionList
          sections={groupedMessages}
          renderItem={renderMessageItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={keyExtractor}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={mergedStyle.listContainerStyle}
          stickySectionHeadersEnabled={true}
        />
      )}
    </View>
  );
};

export { CometChatAIAssistantChatHistory };