import React, { useCallback, useEffect, useReducer, useRef, useState, useMemo } from 'react';
import { View, TextInput, TouchableOpacity, Text, Image, ImageBackground, FlatList, ImageSourcePropType } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import {
  CometChatAvatar,
  CometChatStatusIndicator,
  CometChatBadge,
  CometChatDate,
  useTheme
} from '@cometchat/chat-uikit-react-native';
import { Icon } from '../shared/icons/Icon';
import { GroupTypeConstants, ReceiverTypeConstants, MessageCategoryConstants, MessageTypeConstants } from '@cometchat/chat-uikit-react-native/src/shared/constants/UIKitConstants';
import { CometChatSearchScope, CometChatSearchFilter, States } from './SearchConstants';
import { Skeleton } from './Skeleton';
import { SearchStyle, getSearchStyleLight, getSearchStyleDark } from './style';
import { deepMerge } from '../shared/helper/helperFunctions';
import { DeepPartial } from '../shared/helper/types';
import { getCometChatTranslation } from '../shared/resources/CometChatLocalizeNew/LocalizationManager';
import { CommonUtils } from '../shared/utils/CommonUtils';
import { ExtensionConstants } from '../extensions/ExtensionConstants';
import { getExtensionData } from '../extensions/ExtensionModerator';


// ERROR HANDLER 
function useCometChatErrorHandler(onError?: (error: CometChat.CometChatException) => void) {
  return useCallback(
    (error: any, source?: string) => {
      console.error(`CometChat Error${source ? ` in ${source}` : ''}:`, error);

      if (onError && error instanceof CometChat.CometChatException) {
        onError(error);
      }
    },
    [onError]
  );
}

// SEARCH UTILITIES
function hasValidConversationSearchCriteria(searchKeyword: string, filters: CometChatSearchFilter[]): boolean {
  if (searchKeyword && searchKeyword.trim() !== "") {
    return true;
  }

  const validFilters = [
    CometChatSearchFilter.Unread,
    CometChatSearchFilter.Groups,
    CometChatSearchFilter.Conversations
  ];

  if (filters.length === 0) {
    return false;
  }

  return filters.every(filter => validFilters.includes(filter));
}

function hasValidMessageSearchCriteria(searchKeyword: string, filters: CometChatSearchFilter[]): boolean {
  if (searchKeyword && searchKeyword.trim() !== "") {
    return true;
  }

  const validMessageFilters = [
    CometChatSearchFilter.Photos,
    CometChatSearchFilter.Videos,
    CometChatSearchFilter.Documents,
    CometChatSearchFilter.Audio,
    CometChatSearchFilter.Links
  ];

  if (filters.length === 0) {
    return false;
  }

  return filters.some(filter => validMessageFilters.includes(filter));
}

interface SearchState {
  searchText: string;
  conversations: CometChat.Conversation[];
  messages: CometChat.BaseMessage[];
  fetchState: States;
  activeFilters: CometChatSearchFilter[];
}

type SearchAction =
  | { type: "setSearchText"; searchText: string }
  | { type: "setResults"; conversations?: CometChat.Conversation[]; messages?: CometChat.BaseMessage[] }
  | { type: "clearResults" }
  | { type: "setFetchState"; fetchState: States }
  | { type: "setActiveFilter"; filterId: CometChatSearchFilter }
  | { type: "resetActiveFilters" };

const initialState: SearchState = {
  searchText: "",
  conversations: [],
  messages: [],
  fetchState: States.loaded,
  activeFilters: [],
};

function searchStateReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "setSearchText":
      return { ...state, searchText: action.searchText };

    case "setResults":
      return {
        ...state,
        conversations: action.conversations ?? state.conversations,
        messages: action.messages ?? state.messages,
        fetchState: States.loaded,
      };

    case "clearResults":
      return { ...state, conversations: [], messages: [] };

    case "setFetchState":
      return { ...state, fetchState: action.fetchState };

    case "setActiveFilter": {
      const newActiveFilters = [...state.activeFilters];
      const filterIndex = newActiveFilters.findIndex(f => f === action.filterId);

      // Define filter pairs
      const filterPairs = {
        conversationPair: [CometChatSearchFilter.Unread, CometChatSearchFilter.Groups],
        photosVideosPair: [CometChatSearchFilter.Photos, CometChatSearchFilter.Videos],
        audioDocumentsPair: [CometChatSearchFilter.Audio, CometChatSearchFilter.Documents],
        linkStandalone: [CometChatSearchFilter.Links]
      };

      if (filterIndex >= 0) {
        // If filter is already active, remove it
        newActiveFilters.splice(filterIndex, 1);
      } else {
        // Clear incompatible filters before adding new one

        // If selecting Links (standalone), clear all other filters
        if (action.filterId === CometChatSearchFilter.Links) {
          newActiveFilters.length = 0; // Clear all filters
        }
        // If selecting conversation pair filter, clear other pairs
        else if (filterPairs.conversationPair.includes(action.filterId)) {
          // Remove all non-conversation filters
          const filtersToRemove = [
            ...filterPairs.photosVideosPair,
            ...filterPairs.audioDocumentsPair,
            ...filterPairs.linkStandalone
          ];
          filtersToRemove.forEach(filter => {
            const idx = newActiveFilters.findIndex(f => f === filter);
            if (idx >= 0) newActiveFilters.splice(idx, 1);
          });
        }
        // If selecting photos/videos pair filter, clear other pairs
        else if (filterPairs.photosVideosPair.includes(action.filterId)) {
          const filtersToRemove = [
            ...filterPairs.conversationPair,
            ...filterPairs.audioDocumentsPair,
            ...filterPairs.linkStandalone
          ];
          filtersToRemove.forEach(filter => {
            const idx = newActiveFilters.findIndex(f => f === filter);
            if (idx >= 0) newActiveFilters.splice(idx, 1);
          });
        }
        // If selecting audio/documents pair filter, clear other pairs
        else if (filterPairs.audioDocumentsPair.includes(action.filterId)) {
          const filtersToRemove = [
            ...filterPairs.conversationPair,
            ...filterPairs.photosVideosPair,
            ...filterPairs.linkStandalone
          ];
          filtersToRemove.forEach(filter => {
            const idx = newActiveFilters.findIndex(f => f === filter);
            if (idx >= 0) newActiveFilters.splice(idx, 1);
          });
        }

        newActiveFilters.push(action.filterId);
      }

      return { ...state, activeFilters: newActiveFilters };
    }

    case "resetActiveFilters":
      return { ...state, activeFilters: [] };

    default:
      return state;
  }
}

/**
 * Props for the CometChatSearch component
 */
interface CometChatSearchProps {
  /**
   * Callback triggered when the back button is clicked
   * Use this to handle navigation when user clicks the back button
   */
  onBack?: () => void;

  /**
   * Whether to hide the back button
   */
  hideBackButton?: boolean;

  /**
   * Callback triggered when a conversation is clicked in search results
   * @param conversation - The conversation that was clicked
   * @param searchKeyword - The keyword that was used in the search
   */
  onConversationClicked?: (conversation: CometChat.Conversation, searchKeyword?: string) => void;

  /**
   * Callback triggered when a message is clicked in search results
   * @param message - The message that was clicked
   * @param searchKeyword - The keyword that was used in the search
   */
  onMessageClicked?: (message: CometChat.BaseMessage, searchKeyword?: string) => void;

  /**
   * Array of search filters to display in the filter bar
   */
  searchFilters?: Array<CometChatSearchFilter>;

  /**
   * Filter that should be active by default when the component loads
   */
  initialSearchFilter?: CometChatSearchFilter;

  /**
   * Scopes to search in (Conversations, Messages, or both)
   */
  searchIn?: Array<CometChatSearchScope>;

  /**
   * Request builder for conversations search
   */
  conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder;

  /**
   * Request builder for messages search
   */
  messagesRequestBuilder?: CometChat.MessagesRequestBuilder;

  /**
   * Custom error handler for search operations
   */
  onError?: (error: CometChat.CometChatException) => void;

  /**
   * User ID to search within specific user's messages
   */
  uid?: string;

  /**
   * Group ID to search within specific group's messages
   */
  guid?: string;

  /**
   * Search placeholder text
   */
  searchPlaceholder?: string;

  /**
   * Custom styles for the component
   */
  style?: DeepPartial<SearchStyle>;

  /**
   * Custom loading view component that will be shown during search operations
   */
  loadingView?: () => React.ReactElement;

  /**
   * Custom empty state view component that will be shown when no results are found
   */
  emptyView?: () => React.ReactElement;

  /**
   * Custom error state view component that will be shown when search fails
   */
  errorView?: () => React.ReactElement;

  /**
   * Custom view component for conversation items (both unread and group conversations)
   * @param conversation - The conversation object to render
   * @param searchKeyword - The search keyword used
   */
  conversationItemView?: (conversation: CometChat.Conversation, searchKeyword?: string) => React.ReactElement;

  /**
   * Custom view component for text message items
   * @param message - The text message object to render
   * @param searchKeyword - The search keyword used
   */
  textMessageItemView?: (message: CometChat.BaseMessage, searchKeyword?: string) => React.ReactElement;

  /**
   * Custom view component for image message items
   * @param message - The image message object to render
   * @param searchKeyword - The search keyword used
   */
  imageMessageItemView?: (message: CometChat.BaseMessage, searchKeyword?: string) => React.ReactElement;

  /**
   * Custom view component for audio message items
   * @param message - The audio message object to render
   * @param searchKeyword - The search keyword used
   */
  audioMessageItemView?: (message: CometChat.BaseMessage, searchKeyword?: string) => React.ReactElement;

  /**
   * Custom view component for video message items
   * @param message - The video message object to render
   * @param searchKeyword - The search keyword used
   */
  videoMessageItemView?: (message: CometChat.BaseMessage, searchKeyword?: string) => React.ReactElement;

  /**
   * Custom view component for document/file message items
   * @param message - The document message object to render
   * @param searchKeyword - The search keyword used
   */
  documentMessageItemView?: (message: CometChat.BaseMessage, searchKeyword?: string) => React.ReactElement;

  /**
   * Custom view component for link message items (text messages with link previews)
   * @param message - The link message object to render
   * @param searchKeyword - The search keyword used
   */
  linkMessageItemView?: (message: CometChat.BaseMessage, searchKeyword?: string) => React.ReactElement;
}
const t = getCometChatTranslation();

interface LinkPreviewImageProps {
  uri: string;
  mergedStyles: any;
  theme: any;
}

const LinkPreviewImage: React.FC<LinkPreviewImageProps> = ({ uri, mergedStyles, theme }) => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <View style={mergedStyles.messageItemStyle?.iconContainerStyle}>
        <Icon
          name='link-fill'
          size={48}
          height={48}
          width={48}
          color={theme.color.iconSecondary}
        />
      </View>
    );
  }

  return (
    <View style={mergedStyles.messageItemStyle?.iconContainerStyle}>
      <Image
        source={{ uri }}
        style={mergedStyles.messageItemStyle?.linkPreviewImageStyle}
        resizeMode="cover"
        onError={() => setImageError(true)}
      />
    </View>
  );
};

// Helper function to check for extension-generated thumbnails
const checkThumbnail = (message: CometChat.MediaMessage): { uri: string } => {
  let image: { uri: string } = { uri: "" };
  const thumbnailData = getExtensionData(message, ExtensionConstants.thumbnailGeneration);

  if (thumbnailData == undefined) {
    // Fallback to attachment thumbnail for videos
    if (message.getType() === "video") {
      const attachment = message.getAttachment();
      const thumbnailUrl = attachment && ((attachment as any).thumbnail || (attachment as any).url);
      image = thumbnailUrl ? { uri: thumbnailUrl } : image;
    }
  } else {
    // Extension-generated thumbnail exists
    const attachmentData = thumbnailData["attachments"];
    if (attachmentData && attachmentData.length) {
      const dataObj = attachmentData[0];
      if (!dataObj["error"]) {
        const imageLink = dataObj?.["data"]?.["thumbnails"]?.["url_small"];
        if (imageLink) {
          image = { uri: dataObj["data"]["thumbnails"]["url_small"] };
        }
      }
    }
  }

  return image;
};

interface VideoThumbnailProps {
  thumbnailUrl: ImageSourcePropType;
  mergedStyles: any;
}

const VideoThumbnail = React.memo(({ thumbnailUrl, mergedStyles, }: VideoThumbnailProps) => {

    const [imageSource, setImageSource] = useState<ImageSourcePropType>(thumbnailUrl);

    useEffect(() => {
      if (thumbnailUrl && typeof thumbnailUrl === "object" && "uri" in thumbnailUrl) {
        CommonUtils.prefetchThumbnail((thumbnailUrl as any).uri).then((success) => {
          if (success) {
            // console.log("success", thumbnailUrl);
            setImageSource(thumbnailUrl);

          }
        }).catch((error) => {
          console.log("error", error);
        });
      }
    }, [thumbnailUrl]);

    return (
      <View
        style={mergedStyles.messageItemStyle?.previewContainerStyle}
        renderToHardwareTextureAndroid={true}
        shouldRasterizeIOS={true}
      >
        <ImageBackground
          source={imageSource}
          style={mergedStyles.messageItemStyle?.previewVideoStyle}
          resizeMode="cover"
          progressiveRenderingEnabled={true}
          fadeDuration={0}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={mergedStyles.messageItemStyle?.videoPlayIconStyle}>
              <Icon
                name='play-arrow'
                size={16}
                height={16}
                width={16}
                color="white"
              />
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  },

  /** Custom comparison function */
  (prev, next) => {
    const prevUri = (prev.thumbnailUrl as any)?.uri;
    const nextUri = (next.thumbnailUrl as any)?.uri;

    return prevUri === nextUri;
  }
);

// Memoized Conversation Item Component
interface ConversationItemProps {
  conversation: CometChat.Conversation;
  searchText: string;
  onPress: (conversation: CometChat.Conversation, searchText: string) => void;
  mergedStyles: any;
  theme: any;
  conversationItemView?: (conversation: CometChat.Conversation, searchKeyword?: string) => React.ReactElement;
}

const ConversationItem = React.memo<ConversationItemProps>((
  { conversation, searchText, onPress, mergedStyles, theme, conversationItemView }
) => {
  const getStatusIndicator = () => {
    const withObj = conversation.getConversationWith();

    if (withObj instanceof CometChat.Group) {
      if (withObj.getType() === GroupTypeConstants.password) return "password";
      if (withObj.getType() === GroupTypeConstants.private) return "private";
    } else if (withObj instanceof CometChat.User) {
      if (withObj.getStatus() === 'online' && !withObj.getHasBlockedMe() && !withObj.getBlockedByMe()) {
        return "online";
      }
      return "offline";
    }
    return undefined;
  };

  const renderLeadingView = () => {
    const withObj = conversation.getConversationWith();
    const avatarURL = withObj instanceof CometChat.User ? withObj.getAvatar() : withObj.getIcon();
    const name = withObj.getName();

    return (
      <View style={{ position: 'relative' }}>
        <View style={{ height: 48, width: 48 }}>
          <CometChatAvatar
            image={{ uri: avatarURL }}
            name={name}
          />
          <View style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
          }}>
            <CometChatStatusIndicator
              type={getStatusIndicator()}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderTrailingView = () => {
    const timestamp = conversation.getLastMessage()?.getSentAt();
    if (!timestamp) return null;

    return (
      <View style={mergedStyles.conversationItemStyle?.trailingContainerStyle}>
        <CometChatDate
          timeStamp={timestamp * 1000}
          pattern={"conversationDate"}
        />
        <CometChatBadge
          count={conversation.getUnreadMessageCount()}
        />
      </View>
    );
  };

  const formatMentionsInText = (rawText: any, message?: CometChat.BaseMessage) => {
    if (typeof rawText !== 'string') return rawText;

    let text = rawText.replace(/<@all:(.*?)>/g, '@$1');

    try {
      const mentionedUsers: CometChat.User[] = (message && (message).getMentionedUsers && (message).getMentionedUsers()) || [];
      if (mentionedUsers && mentionedUsers.length > 0) {
        mentionedUsers.forEach((u: CometChat.User) => {
          const uid = u.getUid();
          const name = u.getName();
          if (uid && name) {
            const uidRegex = new RegExp(`<@uid:${uid}>`, 'g');
            text = text.replace(uidRegex, `@${name}`);
          }
        });
      }
    } catch (e) {
      console.log(e)
    }

    return text;
  };

  if (conversationItemView) {
    return (
      <TouchableOpacity onPress={() => onPress(conversation, searchText)}>
        {conversationItemView(conversation, searchText)}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={mergedStyles.conversationItemStyle?.containerStyle}
      onPress={() => onPress(conversation, searchText)}
    >
      {renderLeadingView()}
      <View style={mergedStyles.conversationItemStyle?.contentStyle}>
        <Text style={mergedStyles.conversationItemStyle?.titleStyle} numberOfLines={1}>
          {conversation.getConversationWith().getName()}
        </Text>
        <Text style={mergedStyles.conversationItemStyle?.subtitleStyle} numberOfLines={2}>
          {formatMentionsInText((conversation.getLastMessage())?.getText?.(), conversation.getLastMessage())}
        </Text>
      </View>
      {renderTrailingView()}
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Only re-render if conversation ID or search text changes
  return prevProps.conversation.getConversationId() === nextProps.conversation.getConversationId() &&
    prevProps.searchText === nextProps.searchText;
});

ConversationItem.displayName = 'ConversationItem';

/**
 * CometChatSearch component for searching conversations and messages in CometChat
 */
export const CometChatSearch: React.FC<CometChatSearchProps> = ({
  onBack = () => { },
  hideBackButton = false,
  onConversationClicked,
  onMessageClicked,
  searchFilters = [
    CometChatSearchFilter.Unread,
    CometChatSearchFilter.Groups,
    CometChatSearchFilter.Photos,
    CometChatSearchFilter.Videos,
    CometChatSearchFilter.Links,
    CometChatSearchFilter.Documents,
    CometChatSearchFilter.Audio
  ],
  initialSearchFilter,
  searchIn = [],
  conversationsRequestBuilder,
  messagesRequestBuilder,
  onError,
  uid,
  guid,
  searchPlaceholder = t("SEARCH_PLACEHOLDER") || "Search...",
  style,
  loadingView,
  emptyView,
  errorView,
  conversationItemView,
  textMessageItemView,
  imageMessageItemView,
  audioMessageItemView,
  videoMessageItemView,
  documentMessageItemView,
  linkMessageItemView
}) => {
  const [searchState, dispatch] = useReducer(searchStateReducer, initialState);
  const [searchValue, setSearchValue] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);

  const theme = useTheme();
  const errorHandler = useCometChatErrorHandler(onError);
  const timeoutIdRef = useRef<any | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  // Merge theme styles with provided style overrides
  const mergedStyles = useMemo(() => {
    const baseStyles = getSearchStyleLight(theme.color, theme.spacing, theme.typography);
    return deepMerge(baseStyles, style ?? {});
  }, [theme, style]);

  // Initialize active filters with initial filter if provided
  useEffect(() => {
    if (searchState.activeFilters.length === 0 && initialSearchFilter) {
      dispatch({ type: "setActiveFilter", filterId: initialSearchFilter });
    }
  }, [initialSearchFilter, searchState.activeFilters.length]);

  // Get logged in user
  useEffect(() => {
    const getLoggedInUser = async () => {
      try {
        const user = await CometChat.getLoggedinUser();
        setLoggedInUser(user);
      } catch (error) {
        errorHandler(error as CometChat.CometChatException, "getLoggedInUser");
      }
    };

    getLoggedInUser();
  }, [errorHandler]);

  // Handle search input changes with debouncing
  const handleSearch = useCallback((text: string) => {
    setSearchValue(text);
    const newSearchText = text.trim();

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    timeoutIdRef.current = setTimeout(() => {
      dispatch({ type: "setSearchText", searchText: newSearchText });
      timeoutIdRef.current = null;
    }, 500);
  }, []);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchValue("");
    dispatch({ type: "setSearchText", searchText: "" });
    dispatch({ type: "clearResults" });
  }, []);

  // Toggle filter
  const toggleFilter = useCallback((filterId: CometChatSearchFilter) => {
    dispatch({ type: "setActiveFilter", filterId });
  }, []);

  // Auto-focus the search input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  const renderHeader = () => (
    <View style={[mergedStyles.headerStyle]}>
      {!hideBackButton && (
        <TouchableOpacity
          style={[mergedStyles.backButtonStyle]}
          onPress={onBack}
        >
          <Icon
            name='arrow-back'
            imageStyle={mergedStyles.backButtonIconStyle}
            color={mergedStyles?.backButtonIconStyle?.tintColor}
          />
        </TouchableOpacity>
      )}
      <View style={[mergedStyles.searchContainerStyle]}>
        <View style={[mergedStyles.searchInputContainerStyle]}>
          <TextInput
            ref={searchInputRef}
            style={[mergedStyles.searchInputStyle]}
            value={searchValue}
            onChangeText={handleSearch}
            placeholder={searchPlaceholder}
            placeholderTextColor={theme.color.textTertiary}
          />

          <TouchableOpacity
            style={[mergedStyles.clearButtonStyle]}
            onPress={handleClearSearch}
            accessibilityLabel="Clear search"
          >
            <Icon
              name='close'
              imageStyle={mergedStyles.clearButtonIconStyle}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const getVisibleFilters = useCallback(() => {
    const conversationFilters = [
      CometChatSearchFilter.Conversations,
      CometChatSearchFilter.Unread,
      CometChatSearchFilter.Groups
    ];

    const messageFilters = [
      CometChatSearchFilter.Messages,
      CometChatSearchFilter.Photos,
      CometChatSearchFilter.Videos,
      CometChatSearchFilter.Documents,
      CometChatSearchFilter.Audio,
      CometChatSearchFilter.Links
    ];

    // Define filter pairs
    const filterPairs = {
      conversationPair: [CometChatSearchFilter.Unread, CometChatSearchFilter.Groups],
      photosVideosPair: [CometChatSearchFilter.Photos, CometChatSearchFilter.Videos],
      audioDocumentsPair: [CometChatSearchFilter.Audio, CometChatSearchFilter.Documents],
      linkStandalone: [CometChatSearchFilter.Links]
    };

    // If searchIn is empty, search in both conversations and messages
    const effectiveSearchIn = searchIn.length === 0
      ? [CometChatSearchScope.Conversations, CometChatSearchScope.Messages]
      : searchIn;

    let availableFilters: CometChatSearchFilter[] = [];

    // Add filters based on searchIn scope
    if (effectiveSearchIn.includes(CometChatSearchScope.Conversations)) {
      availableFilters.push(...conversationFilters);
    }
    if (effectiveSearchIn.includes(CometChatSearchScope.Messages)) {
      availableFilters.push(...messageFilters);
    }

    // Filter the searchFilters prop to only include available filters
    let filteredAvailableFilters = searchFilters.filter(filter => availableFilters.includes(filter));

    // Filter out conversation filters if uid or guid is present
    if (uid || guid) {
      filteredAvailableFilters = filteredAvailableFilters.filter(filter => !conversationFilters.includes(filter));
    }

    // If no filters are selected, return filtered available filters
    if (searchState.activeFilters.length === 0) {
      return filteredAvailableFilters;
    }

    // Handle pairing logic
    const activeFilters = searchState.activeFilters;

    // Check which pair is active
    const hasConversationPair = activeFilters.some(filter => filterPairs.conversationPair.includes(filter));
    const hasPhotosVideosPair = activeFilters.some(filter => filterPairs.photosVideosPair.includes(filter));
    const hasAudioDocumentsPair = activeFilters.some(filter => filterPairs.audioDocumentsPair.includes(filter));
    const hasLinkStandalone = activeFilters.includes(CometChatSearchFilter.Links);

    // If conversation pair is active, show only conversation filters
    if (hasConversationPair && effectiveSearchIn.includes(CometChatSearchScope.Conversations) && !uid && !guid) {
      return filterPairs.conversationPair.filter(filter => filteredAvailableFilters.includes(filter));
    }

    // If photos/videos pair is active, show only photos and videos
    if (hasPhotosVideosPair) {
      return filterPairs.photosVideosPair.filter(filter => filteredAvailableFilters.includes(filter));
    }

    // If audio/documents pair is active, show only audio and documents
    if (hasAudioDocumentsPair) {
      return filterPairs.audioDocumentsPair.filter(filter => filteredAvailableFilters.includes(filter));
    }

    // If links is active (standalone), show only links
    if (hasLinkStandalone) {
      return filterPairs.linkStandalone.filter(filter => filteredAvailableFilters.includes(filter));
    }

    // Fallback: return filtered available filters
    return filteredAvailableFilters;
  }, [searchState.activeFilters, searchFilters, searchIn, uid, guid]);

  const getFilterText = (filterId: CometChatSearchFilter): string => {
    const filterTextMap = {
      [CometChatSearchFilter.Audio]: t("SEARCH_FILTER_AUDIO") || "Audio",
      [CometChatSearchFilter.Conversations]: t("SEARCH_FILTER_CONVERSATIONS") || "Conversations",
      [CometChatSearchFilter.Documents]: t("SEARCH_FILTER_DOCUMENTS") || "Documents",
      [CometChatSearchFilter.Groups]: t("SEARCH_FILTER_GROUPS") || "Groups",
      [CometChatSearchFilter.Links]: t("SEARCH_FILTER_LINKS") || "Links",
      [CometChatSearchFilter.Messages]: t("SEARCH_FILTER_MESSAGES") || "Messages",
      [CometChatSearchFilter.Photos]: t("SEARCH_FILTER_PHOTOS") || "Photos",
      [CometChatSearchFilter.Unread]: t("SEARCH_FILTER_UNREAD") || "Unread",
      [CometChatSearchFilter.Videos]: t("SEARCH_FILTER_VIDEOS") || "Videos",
    };
    return filterTextMap[filterId] || "";
  };

  const getFilterIcon = (filterId: CometChatSearchFilter) => {
    const filterIconMap = {
      [CometChatSearchFilter.Audio]: "mic-fill" as const,
      [CometChatSearchFilter.Documents]: "documents" as const,
      [CometChatSearchFilter.Groups]: "group" as const,
      [CometChatSearchFilter.Links]: "link" as const,
      [CometChatSearchFilter.Messages]: "chat" as const,
      [CometChatSearchFilter.Photos]: "photo" as const,
      [CometChatSearchFilter.Unread]: "unread" as const,
      [CometChatSearchFilter.Videos]: "videocam" as const,
      [CometChatSearchFilter.Conversations]: "chat" as const,
    };
    return filterIconMap[filterId];
  };

  const renderFilters = () => {
    const visibleFilters = getVisibleFilters();

    if (visibleFilters.length === 0) {
      return null;
    }

    return (
      <View style={[mergedStyles.filtersContainerStyle]}>
        <View style={mergedStyles.filtersContentStyle}>
          {visibleFilters.map((filterId) => {
            const isActive = searchState.activeFilters.includes(filterId);
            const iconName = getFilterIcon(filterId);
            return (
              <TouchableOpacity
                key={filterId}
                style={[
                  mergedStyles.filterButtonStyle,
                  isActive && mergedStyles.filterButtonActiveStyle
                ]}
                onPress={() => toggleFilter(filterId)}
              >
                <View style={mergedStyles.filterButtonContentStyle}>
                  {iconName && (
                    <Icon
                      name={iconName}
                      imageStyle={[
                        mergedStyles.filterButtonIconStyle,
                        isActive && mergedStyles.filterButtonIconActiveStyle
                      ]}
                      width={16}
                      height={16}
                    />
                  )}
                  <Text style={[
                    mergedStyles.filterButtonTextStyle,
                    isActive && mergedStyles.filterButtonTextActiveStyle
                  ]}>
                    {getFilterText(filterId)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // ============================================================================
  // CONVERSATIONS SEARCH LOGIC (moved from useCometChatSearchConversationsList.ts)
  // ============================================================================
  const [conversationState, setConversationState] = useState({
    conversationList: [] as CometChat.Conversation[],
    fetchState: States.loaded,
    hasMoreResults: false,
  });

  const conversationRequestRef = useRef<CometChat.ConversationsRequest | null>(null);
  const lastConversationSearchKeyword = useRef<string>(searchState.searchText);
  const lastConversationActiveFilters = useRef<CometChatSearchFilter[]>(searchState.activeFilters);
  const isConversationMoreResultsLoading = useRef<boolean>(false);

  // ============================================================================
  // MESSAGES SEARCH LOGIC (moved from useCometChatSearchMessagesList.ts)
  // ============================================================================
  const [messageState, setMessageState] = useState({
    messageList: [] as CometChat.BaseMessage[],
    fetchState: States.loaded,
    hasMoreResults: false,
  });

  const messageRequestRef = useRef<CometChat.MessagesRequest | null>(null);
  const lastMessageSearchKeyword = useRef<string>(searchState.searchText);
  const lastMessageActiveFilters = useRef<CometChatSearchFilter[]>(searchState.activeFilters);
  const isMessageMoreResultsLoading = useRef<boolean>(false);

  // ============================================================================
  // CONVERSATION SEARCH FUNCTIONS
  // ============================================================================
  const buildConversationsRequest = useCallback(() => {
    let builder = conversationsRequestBuilder
      ? Object.assign(Object.create(Object.getPrototypeOf(conversationsRequestBuilder)), conversationsRequestBuilder)
      : new CometChat.ConversationsRequestBuilder();

    if (searchState.searchText && searchState.searchText.trim() !== "") {
      builder = builder.setSearchKeyword(searchState.searchText);
    }

    const limit = (guid || uid || searchState.activeFilters.length > 0) ? 30 : 3;
    builder = builder.setLimit(limit);

    // Apply filters - both can be active simultaneously for unread group conversations
    if (searchState.activeFilters.includes(CometChatSearchFilter.Unread)) {
      builder = builder.setUnread(true);
    }

    if (searchState.activeFilters.includes(CometChatSearchFilter.Groups)) {
      builder = builder.setConversationType(ReceiverTypeConstants.group);
    }

    return builder.build();
  }, [conversationsRequestBuilder, searchState.searchText, searchState.activeFilters, guid, uid]);

  const loadMoreConversations = useCallback(async () => {
    if (isConversationMoreResultsLoading.current || !conversationRequestRef.current || !conversationState.hasMoreResults) {
      return;
    }

    try {
      isConversationMoreResultsLoading.current = true;
      const moreConversations = await conversationRequestRef.current.fetchNext();

      if (moreConversations.length > 0) {
        setConversationState(prev => ({
          ...prev,
          conversationList: [...prev.conversationList, ...moreConversations],
          hasMoreResults: moreConversations.length === 3 || moreConversations.length === 30 // Check if more results might be available
        }));
      } else {
        setConversationState(prev => ({
          ...prev,
          hasMoreResults: false
        }));
      }
    } catch (error) {
      errorHandler(error, "loadMoreConversations");
    } finally {
      isConversationMoreResultsLoading.current = false;
    }
  }, [errorHandler, conversationState.hasMoreResults]);

  const searchConversations = useCallback(async () => {
    try {
      setConversationState(prev => ({ ...prev, fetchState: States.loading }));

      if (!hasValidConversationSearchCriteria(searchState.searchText, searchState.activeFilters)) {
        setConversationState(prev => ({
          ...prev,
          conversationList: [],
          fetchState: States.loaded,
          hasMoreResults: false
        }));
        return;
      }

      conversationRequestRef.current = buildConversationsRequest();
      const conversations = await conversationRequestRef.current!.fetchNext();

      if (conversations.length > 0) {
        const limit = (guid || uid || searchState.activeFilters.length > 0) ? 30 : 3;
        setConversationState({
          conversationList: conversations,
          fetchState: States.loaded,
          hasMoreResults: conversations.length >= limit,
        });
      } else {
        setConversationState({
          conversationList: [],
          fetchState: States.loaded,
          hasMoreResults: false,
        });
      }
    } catch (error) {
      errorHandler(error, "searchConversations");
      setConversationState(prev => ({ ...prev, fetchState: States.error }));
    }
  }, [searchState.searchText, searchState.activeFilters, buildConversationsRequest, guid, uid, errorHandler]);

  // ============================================================================
  // MESSAGE SEARCH FUNCTIONS
  // ============================================================================
  const buildMessagesRequest = useCallback(() => {
    let builder = messagesRequestBuilder
      ? Object.assign(Object.create(Object.getPrototypeOf(messagesRequestBuilder)), messagesRequestBuilder)
      : new CometChat.MessagesRequestBuilder();

    builder = builder.hideDeletedMessages(true);
    const limit = (guid || uid || searchState.activeFilters.length > 0) ? 30 : 3;

    if (!messagesRequestBuilder) {
      builder = builder
        .setCategories([MessageCategoryConstants.message, MessageCategoryConstants.custom])
        .setTypes([MessageTypeConstants.text, MessageTypeConstants.image, MessageTypeConstants.video, MessageTypeConstants.audio, MessageTypeConstants.file])
        .setLimit(limit);
    }

    if (searchState.searchText && searchState.searchText.trim() !== "") {
      builder = builder.setSearchKeyword(searchState.searchText);
    }

    if (uid) {
      builder = builder.setUID(uid);
    } else if (guid) {
      builder = builder.setGUID(guid);
    }

    if (searchState.activeFilters && searchState.activeFilters.length > 0) {
      if (searchState.activeFilters.includes(CometChatSearchFilter.Links)) {
        builder = builder.hasLinks(true);
      }

      const attachmentTypeMap = {
        [CometChatSearchFilter.Photos]: CometChat.AttachmentType.IMAGE,
        [CometChatSearchFilter.Videos]: CometChat.AttachmentType.VIDEO,
        [CometChatSearchFilter.Documents]: CometChat.AttachmentType.FILE,
        [CometChatSearchFilter.Audio]: CometChat.AttachmentType.AUDIO,
      };

      // Collect all attachment types for active filters
      const activeAttachmentTypes: CometChat.AttachmentType[] = [];
      for (const [filter, attachmentType] of Object.entries(attachmentTypeMap)) {
        if (searchState.activeFilters.includes(filter as CometChatSearchFilter)) {
          activeAttachmentTypes.push(attachmentType);
        }
      }

      // Set all active attachment types (supports multiple types for paired filters)
      if (activeAttachmentTypes.length > 0) {
        builder = builder.setAttachmentTypes(activeAttachmentTypes);
      }
    }

    return builder.build();
  }, [messagesRequestBuilder, searchState.activeFilters, searchState.searchText, uid, guid]);

  const loadMoreMessages = useCallback(async () => {
    if (isMessageMoreResultsLoading.current || !messageRequestRef.current || !messageState.hasMoreResults) {
      return;
    }

    try {
      isMessageMoreResultsLoading.current = true;
      const moreMessages = await messageRequestRef.current.fetchPrevious();

      if (moreMessages.length > 0) {
        
        const filteredMoreMessages = moreMessages.filter(msg => {
          const isDeleted = (msg as any).getDeletedAt && (msg as any).getDeletedAt() > 0;
          const isActionMessage = msg.getCategory() === MessageCategoryConstants.action;
          return !isDeleted && !isActionMessage;
        });
        
        setMessageState(prev => ({
          ...prev,
          messageList: [...prev.messageList, ...filteredMoreMessages],
          hasMoreResults: moreMessages.length === 3 || moreMessages.length === 30 // Check if more results might be available
        }));
      } else {
        setMessageState(prev => ({
          ...prev,
          hasMoreResults: false
        }));
      }
    } catch (error) {
      errorHandler(error, "loadMoreMessages");
    } finally {
      isMessageMoreResultsLoading.current = false;
    }
  }, [errorHandler, messageState.hasMoreResults]);

  const searchMessages = useCallback(async () => {
    try {
      setMessageState(prev => ({ ...prev, fetchState: States.loading }));

      if (!hasValidMessageSearchCriteria(searchState.searchText, searchState.activeFilters)) {
        setMessageState(prev => ({
          ...prev,
          messageList: [],
          fetchState: States.loaded,
          hasMoreResults: false
        }));
        return;
      }

      messageRequestRef.current = buildMessagesRequest();
      const messages = await messageRequestRef.current!.fetchPrevious();

      if (messages.length > 0) {
        const reversedList = messages.reverse();
        
        const filteredMessages = reversedList.filter(msg => {
          const isDeleted = (msg as any).getDeletedAt && (msg as any).getDeletedAt() > 0;
          const isActionMessage = msg.getCategory() === MessageCategoryConstants.action;
          return !isDeleted && !isActionMessage;
        });
        
        const limit = (guid || uid || searchState.activeFilters.length > 0) ? 30 : 3;
        setMessageState({
          messageList: filteredMessages,
          fetchState: States.loaded,
          hasMoreResults: messages.length >= limit,
        });
      } else {
        setMessageState({
          messageList: [],
          fetchState: States.loaded,
          hasMoreResults: false,
        });
      }
    } catch (error) {
      errorHandler(error, "searchMessages");
      setMessageState(prev => ({ ...prev, fetchState: States.error }));
    }
  }, [searchState.searchText, searchState.activeFilters, buildMessagesRequest, guid, uid, errorHandler]);

  // ============================================================================
  // SEARCH EFFECTS - Trigger searches when search text or filters change
  // ============================================================================
  useEffect(() => {
    const hasKeywordChanged = searchState.searchText !== lastConversationSearchKeyword.current;
    const haveFiltersChanged = JSON.stringify(searchState.activeFilters) !== JSON.stringify(lastConversationActiveFilters.current);

    if (hasKeywordChanged || haveFiltersChanged) {
      lastConversationSearchKeyword.current = searchState.searchText;
      lastConversationActiveFilters.current = [...searchState.activeFilters];
      searchConversations();
    }
  }, [searchState.searchText, searchState.activeFilters, searchConversations]);

  useEffect(() => {
    const hasKeywordChanged = searchState.searchText !== lastMessageSearchKeyword.current;
    const haveFiltersChanged = JSON.stringify(searchState.activeFilters) !== JSON.stringify(lastMessageActiveFilters.current);

    if (hasKeywordChanged || haveFiltersChanged) {
      lastMessageSearchKeyword.current = searchState.searchText;
      lastMessageActiveFilters.current = [...searchState.activeFilters];
      searchMessages();
    }
  }, [searchState.searchText, searchState.activeFilters, searchMessages]);

  const shouldRenderConversations = useCallback(() => {
    // If searchIn is empty, search in both conversations and messages
    const effectiveSearchIn = searchIn.length === 0
      ? [CometChatSearchScope.Conversations, CometChatSearchScope.Messages]
      : searchIn;

    // Don't render conversations if searchIn doesn't include conversations scope
    if (!effectiveSearchIn.includes(CometChatSearchScope.Conversations)) {
      return false;
    }

    // Don't render conversations if uid or guid is present (searching within specific user/group)
    if (uid || guid) {
      return false;
    }

    // Define conversation filters
    const conversationFilters = [CometChatSearchFilter.Unread, CometChatSearchFilter.Groups];

    if (searchState.searchText && searchState.searchText.trim() !== "" && searchState.activeFilters.length === 0) {
      return true;
    }

    if (searchState.activeFilters.length > 0) {
      return searchState.activeFilters.some(filter => conversationFilters.includes(filter));
    }

    return false;
  }, [searchState.activeFilters, searchState.searchText, uid, guid, searchIn]);

  const shouldRenderMessages = useCallback(() => {
    // If searchIn is empty, search in both conversations and messages
    const effectiveSearchIn = searchIn.length === 0
      ? [CometChatSearchScope.Conversations, CometChatSearchScope.Messages]
      : searchIn;

    // Don't render messages if searchIn doesn't include messages scope
    if (!effectiveSearchIn.includes(CometChatSearchScope.Messages)) {
      return false;
    }

    // Always render messages if uid or guid is present (searching within specific user/group)
    if (uid || guid) {
      return true;
    }

    // Define message filters
    const messageFilters = [
      CometChatSearchFilter.Photos,
      CometChatSearchFilter.Videos,
      CometChatSearchFilter.Documents,
      CometChatSearchFilter.Audio,
      CometChatSearchFilter.Links
    ];

    // Define conversation filters
    const conversationFilters = [CometChatSearchFilter.Unread, CometChatSearchFilter.Groups];

    if (searchState.searchText && searchState.searchText.trim() !== "" && searchState.activeFilters.length === 0) {
      return true;
    }

    if (searchState.activeFilters.length > 0) {
      // Show messages if any message filter is selected and no conversation filter is selected
      return searchState.activeFilters.some(filter => messageFilters.includes(filter)) &&
        !searchState.activeFilters.some(filter => conversationFilters.includes(filter));
    }

    return false;
  }, [searchState.activeFilters, searchState.searchText, uid, guid, searchIn]);

  // Handle scroll-based fetching for messages
  const handleScrollEnd = useCallback((event: any) => {
    if (!shouldRenderMessages() || !messageState.hasMoreResults) return;

    const contentOffsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;

    if (contentOffsetY + layoutHeight >= contentHeight - 10) {
      loadMoreMessages();
    }
  }, [shouldRenderMessages, messageState.hasMoreResults, loadMoreMessages]);

  // Get status indicator for conversation
  const getStatusIndicator = (conv: CometChat.Conversation) => {
    const withObj = conv.getConversationWith();

    if (withObj instanceof CometChat.Group) {
      if (withObj.getType() === GroupTypeConstants.password) return "password";
      if (withObj.getType() === GroupTypeConstants.private) return "private";
    } else if (withObj instanceof CometChat.User) {
      if (withObj.getStatus() === 'online' && !withObj.getHasBlockedMe() && !withObj.getBlockedByMe()) {
        return "online";
      }
      return "offline";
    }
    return undefined;
  };

  // Render conversation avatar
  const renderConversationLeadingView = (conversation: CometChat.Conversation) => {
    const withObj = conversation.getConversationWith();
    const avatarURL = withObj instanceof CometChat.User ? withObj.getAvatar() : withObj.getIcon();
    const name = withObj.getName();

    return (
      <View style={{ position: 'relative' }}>
        <View style={{ height: 48, width: 48 }}>
          <CometChatAvatar
            image={{ uri: avatarURL }}
            name={name}
          />
          <View style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
          }}>
            <CometChatStatusIndicator
              type={getStatusIndicator(conversation)}
            />
          </View>
        </View>
      </View>
    );
  };

  // Render conversation trailing view (date and badge)
  const renderConversationTrailingView = (conversation: CometChat.Conversation) => {
    const timestamp = conversation.getLastMessage()?.getSentAt();
    if (!timestamp) return null;

    return (
      <View style={mergedStyles.conversationItemStyle?.trailingContainerStyle}>
        <CometChatDate
          timeStamp={timestamp * 1000}
          pattern={"conversationDate"}
        />
        <CometChatBadge
          count={conversation.getUnreadMessageCount()}
        />
      </View>
    );
  };

  // Get file type icon based on file extension
  const getFileTypeIcon = (fileName: string): 'audio-file-type' | 'image-file-type' | 'video-file-type' | 'pdf-file-type' | 'presentation-file-type' | 'spreadsheet-file-type' | 'text-file-type' | 'zip-file-type' | 'document-file-type' | 'unknown-file-type' => {
    if (!fileName) return 'unknown-file-type';

    const extension = fileName.toLowerCase().split('.').pop() || '';

    // Audio files
    if (['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'].includes(extension)) {
      return 'audio-file-type';
    }

    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
      return 'image-file-type';
    }

    // Video files
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
      return 'video-file-type';
    }

    // PDF files
    if (extension === 'pdf') {
      return 'pdf-file-type';
    }

    // Presentation files
    if (['ppt', 'pptx', 'key'].includes(extension)) {
      return 'presentation-file-type';
    }

    // Spreadsheet files
    if (['xls', 'xlsx', 'csv', 'numbers'].includes(extension)) {
      return 'spreadsheet-file-type';
    }

    // Text/Document files
    if (['txt', 'rtf', 'doc', 'docx', 'pages'].includes(extension)) {
      return 'text-file-type';
    }

    // ZIP/Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return 'zip-file-type';
    }

    // Default document type for other files
    return 'document-file-type';
  };

  // Format mentions in raw message text: convert <@all:alias> to @alias
  // and <@uid:UID> to @Name when message provides mentioned users
  const formatMentionsInText = (rawText: any, message?: CometChat.BaseMessage) => {
    if (typeof rawText !== 'string') return rawText;

    let text = rawText.replace(/<@all:(.*?)>/g, '@$1');

    try {
      const mentionedUsers: CometChat.User[] = (message && (message).getMentionedUsers && (message).getMentionedUsers()) || [];
      if (mentionedUsers && mentionedUsers.length > 0) {
        mentionedUsers.forEach((u: CometChat.User) => {
          const uid = u.getUid();
          const name = u.getName();
          if (uid && name) {
            const uidRegex = new RegExp(`<@uid:${uid}>`, 'g');
            text = text.replace(uidRegex, `@${name}`);
          }
        });
      }
    } catch (e) {
      console.log(e)
    }

    return text;
  };

  // Render message leading view (for audio/file icons)
  const renderMessageLeadingView = (message: CometChat.BaseMessage) => {
    const messageType = message.getType();

    switch (messageType) {
      case 'audio': {
        return (
          <View style={mergedStyles.messageItemStyle?.iconContainerStyle}>
            <View style={[mergedStyles.messageItemStyle?.audioPreviewStyle, {
              backgroundColor: theme.color.primary,
              borderRadius: 1000,
              justifyContent: 'center',
              alignItems: 'center',
              height: 32,
              width: 32,
            }]}>
              <Icon
                name='play-arrow-fill'
                size={theme.spacing.spacing.s7}
                height={32}
                width={32}
                color={theme.color.staticWhite}
              />
            </View>
          </View>
        );
      }

      case 'file': {
        const fileMessage = message as CometChat.MediaMessage;
        const attachment = fileMessage.getAttachment();
        const fileName = attachment?.getName?.() || '';
        const fileTypeIcon = getFileTypeIcon(fileName);

        return (
          <View style={mergedStyles.messageItemStyle?.iconContainerStyle}>
            <Icon
              name={fileTypeIcon}
              size={48}
              height={48}
              width={48}
              color={theme.color.iconSecondary}
            />
          </View>
        );
      }

      case 'text': {
        // Check if this is a text message with link metadata (link preview)
        const textMessage = message as CometChat.TextMessage;
        const metadata = textMessage.getMetadata();
        const linkPreview = metadata && (metadata as any)['@injected'] && (metadata as any)['@injected']['extensions'] && (metadata as any)['@injected']['extensions']['link-preview'];

        if (linkPreview && linkPreview.links && linkPreview.links.length > 0) {
          const firstLink = linkPreview.links[0];
          const thumbnailUrl = firstLink.image || firstLink.favicon;

          if (thumbnailUrl) {
            return (
              <LinkPreviewImage
                uri={thumbnailUrl}
                mergedStyles={mergedStyles}
                theme={theme}
              />
            );
          } else {
            // Fallback to link icon if no thumbnail
            return (
              <View style={mergedStyles.messageItemStyle?.iconContainerStyle}>
                <Icon
                  name='link-fill'
                  size={48}
                  height={48}
                  width={48}
                  color={theme.color.iconSecondary}
                />
              </View>
            );
          }
        }
        return null;
      }

      default:
        return null;
    }
  };

  // Render message trailing view (content preview or date)
  const renderMessageTrailingView = (message: CometChat.BaseMessage) => {
    const timestamp = message.getSentAt();
    if (!timestamp) return null;

    const messageType = message.getType();

    // Handle different message types
    switch (messageType) {
      case 'image': {
        const imageMessage = message as CometChat.MediaMessage;
        const attachment = imageMessage.getAttachment();
        const imageUrl = attachment && (attachment as any).url;
        if (imageUrl) {
          return (
            <View style={mergedStyles.messageItemStyle?.previewContainerStyle}>
              <Image
                source={{ uri: imageUrl }}
                style={mergedStyles.messageItemStyle?.previewImageStyle}
                resizeMode="cover"
                progressiveRenderingEnabled={true}
                fadeDuration={0}
              />
            </View>
          );
        }
        break;
      }

      case 'video': {
        const videoMessage = message as CometChat.MediaMessage;
        const thumbnailImage = checkThumbnail(videoMessage);
        
        if (thumbnailImage.uri) {
          return (
            <VideoThumbnail
              thumbnailUrl={thumbnailImage}
              mergedStyles={mergedStyles}
            />
          );
        }
        break;
      }



      default:
        // For text messages and other types, show timestamp
        return (
          <View style={mergedStyles.messageItemStyle?.trailingContainerStyle}>
            <CometChatDate
              timeStamp={timestamp * 1000}
              pattern={"dayDateFormat"}
            />
          </View>
        );
    }

    // Fallback to timestamp
    return (
      <View style={mergedStyles.messageItemStyle?.trailingContainerStyle}>
        <CometChatDate
          timeStamp={timestamp * 1000}
          pattern={"dayDateFormat"}
        />
      </View>
    );
  };

  // Memoized trailing view component
  const MemoizedTrailingView = React.memo(({ message }: { message: CometChat.BaseMessage }) =>
    renderMessageTrailingView(message),
    (prev, next) => prev.message.getId() === next.message.getId()
  );

  // Render conversations section
  const renderConversationsSection = () => {
    const { conversationList, fetchState } = conversationState;

    if (fetchState === States.loading && conversationList.length === 0) {
      return loadingView ? loadingView() : <Skeleton />;
    }

    if (fetchState === States.empty || conversationList.length === 0) {
      return null; // Don't show empty conversations section
    }

    if (fetchState === States.error) {
      if (errorView) {
        return errorView();
      }

      return (
        <View style={[mergedStyles.errorStateStyle?.containerStyle]}>
          <Icon
            name="empty-search"
            size={120}
            height={120}
            width={120}
            imageStyle={mergedStyles.errorStateStyle?.iconStyle}
            containerStyle={mergedStyles.errorStateStyle?.iconContainerStyle}
          />
          <Text style={[mergedStyles.errorStateStyle?.titleStyle]}>
            {t("SEARCH_ERROR_LOADING_CONVERSATIONS") || "Error Loading Conversations"}
          </Text>
          <Text style={[mergedStyles.errorStateStyle?.subtitleStyle]}>
            {t("SEARCH_TRY_AGAIN") || "Please try again later"}
          </Text>
        </View>
      );
    }

    return (
      <View>
        <Text style={mergedStyles.sectionTitleStyle}>{t("CHATS") || "Chats"}</Text>
        <FlatList
          data={conversationList}
          keyExtractor={(item) => item.getConversationId()}
          scrollEnabled={false}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
          renderItem={({ item: conversation }) => {
            // Use custom conversation item view if provided
            if (conversationItemView) {
              return (
                <TouchableOpacity
                  onPress={() => onConversationClicked?.(conversation, searchState.searchText)}
                >
                  {conversationItemView(conversation, searchState.searchText)}
                </TouchableOpacity>
              );
            }

            // Default conversation item rendering
            return (
              <TouchableOpacity
                style={mergedStyles.conversationItemStyle?.containerStyle}
                onPress={() => onConversationClicked?.(conversation, searchState.searchText)}
              >
                {renderConversationLeadingView(conversation)}
                <View style={mergedStyles.conversationItemStyle?.contentStyle}>
                  <Text style={mergedStyles.conversationItemStyle?.titleStyle} numberOfLines={1}>
                    {conversation.getConversationWith().getName()}
                  </Text>
                  <Text style={mergedStyles.conversationItemStyle?.subtitleStyle} numberOfLines={2}>
                      {formatMentionsInText((conversation.getLastMessage())?.getText?.(), conversation.getLastMessage())}
                  </Text>
                </View>
                {renderConversationTrailingView(conversation)}
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            conversationState.hasMoreResults ? (
              <TouchableOpacity
                style={mergedStyles.seeMoreButtonStyle}
                onPress={loadMoreConversations}
                disabled={isConversationMoreResultsLoading.current}
              >
                <Text style={mergedStyles.seeMoreTextStyle}>
                  {isConversationMoreResultsLoading.current ? t("SEARCH_LOADING") || 'Loading...' : t("SEARCH_SEE_MORE") || 'See More'}
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      </View>
    );
  };

  // Helper to format date for headers
  const getDateHeaderDate = useCallback((timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, []);

  // Render messages section
  const renderMessagesSection = () => {
    const { messageList, fetchState } = messageState;

    if (fetchState === States.loading && messageList.length === 0) {
      return loadingView ? loadingView() : <Skeleton />;
    }

    if (fetchState === States.empty || messageList.length === 0) {
      return null; // Don't show empty messages section
    }

    if (fetchState === States.error) {
      if (errorView) {
        return errorView();
      }

      return (
        <View style={[mergedStyles.errorStateStyle?.containerStyle]}>
          <Icon
            name="empty-search"
            size={120}
            height={120}
            width={120}
            imageStyle={mergedStyles.errorStateStyle?.iconStyle}
            containerStyle={mergedStyles.errorStateStyle?.iconContainerStyle}
          />
          <Text style={[mergedStyles.errorStateStyle?.titleStyle]}>
            {t("SEARCH_ERROR_LOADING_MESSAGES") || "Error Loading M essages"}
          </Text>
          <Text style={[mergedStyles.errorStateStyle?.subtitleStyle]}>
            {t("SEARCH_TRY_AGAIN") || "Please try again later"}
          </Text>
        </View>
      );
    }

    return (
      <View>
        <Text style={mergedStyles.sectionTitleStyle}>{t("MESSAGES") || "Messages"}</Text>
        <FlatList
          data={messageList}
          keyExtractor={(item, index) => `${item.getId()}-${index}`}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
          renderItem={({ item: message, index }) => {
            const messageType = message.getType();

            // Date header logic for media items
            let dateHeader: React.ReactNode = null;
            if (['image', 'video'].includes(messageType)) {
              const sentAt = message.getSentAt();
              const currentDateStr = getDateHeaderDate(sentAt);
              const prevMessage = index > 0 ? messageList[index - 1] : null;
              const prevDateStr = prevMessage ? getDateHeaderDate(prevMessage.getSentAt()) : null;

              if (currentDateStr !== prevDateStr) {
                dateHeader = (
                  <CometChatDate
                    timeStamp={sentAt * 1000}
                    customDateString={currentDateStr}
                    style={{
                      textStyle: mergedStyles.sectionTitleStyle
                    }}
                  />
                );
              }
            }

            // Check if message is a text message with link preview
            const isLinkMessage = messageType === 'text' && (() => {
              const textMessage = message as CometChat.TextMessage;
              const metadata = textMessage.getMetadata();
              return metadata && (metadata as any)['@injected'] && (metadata as any)['@injected']['extensions'] && (metadata as any)['@injected']['extensions']['link-preview'];
            })();

            // Determine which custom view to use based on message type
            let customView: (() => React.ReactElement) | undefined;

            if (isLinkMessage && linkMessageItemView) {
              customView = () => linkMessageItemView(message, searchState.searchText);
            } else if (messageType === 'text' && textMessageItemView) {
              customView = () => textMessageItemView(message, searchState.searchText);
            } else if (messageType === 'image' && imageMessageItemView) {
              customView = () => imageMessageItemView(message, searchState.searchText);
            } else if (messageType === 'video' && videoMessageItemView) {
              customView = () => videoMessageItemView(message, searchState.searchText);
            } else if (messageType === 'audio' && audioMessageItemView) {
              customView = () => audioMessageItemView(message, searchState.searchText);
            } else if (messageType === 'file' && documentMessageItemView) {
              customView = () => documentMessageItemView(message, searchState.searchText);
            }

            // Use custom view if available
            if (customView) {
              return (
                <View>
                  {dateHeader}
                  <TouchableOpacity
                    onPress={() => onMessageClicked?.(message, searchState.searchText)}
                  >
                    {customView()}
                  </TouchableOpacity>
                </View>
              );
            }

            // Default message item rendering
            return (
              <View>
                {dateHeader}
                <TouchableOpacity
                  style={mergedStyles.messageItemStyle?.containerStyle}
                  onPress={() => onMessageClicked?.(message, searchState.searchText)}
                >
                  {renderMessageLeadingView(message)}
                  <View style={[
                    mergedStyles.messageItemStyle?.contentStyle,
                    (message.getType() === 'image' || message.getType() === 'video') && mergedStyles.messageItemStyle?.textContainerStyle
                  ]}>
                    <Text style={mergedStyles.messageItemStyle?.titleStyle} numberOfLines={1}>
                      {message.getSender().getName()}
                    </Text>
                    <Text style={mergedStyles.messageItemStyle?.subtitleStyle} numberOfLines={2}>
                      {(() => {
                        const messageType = message.getType();

                        // For media messages (image, video, file, audio), show file name
                        if (['image', 'video', 'file', 'audio'].includes(messageType)) {
                          const mediaMessage = message as CometChat.MediaMessage;
                          const attachment = mediaMessage.getAttachment?.();
                          return attachment?.getName?.() || messageType;
                        }

                        // For text messages, show the text content
                        if (messageType === 'text') {
                          const raw = (message as CometChat.TextMessage).getText?.();
                          const formatted = formatMentionsInText(raw, message);
                          return formatted || messageType || 'Message';
                        }

                        // For custom messages, try to localize the type
                        const customTypeKey = `CUSTOM_MESSAGE_${messageType.toUpperCase()}`;
                        const localizedType = t(customTypeKey);
                        
                        // If localization exists and is different from key, use it
                        if (localizedType && localizedType !== customTypeKey) {
                          return localizedType;
                        }
                        
                        // Handle specific extension types mapping to existing keys
                        if (messageType === 'extension_poll') return t("CUSTOM_MESSAGE_POLL") || "Poll";
                        if (messageType === 'extension_sticker') return t("CUSTOM_MESSAGE_STICKER") || "Sticker";
                        if (messageType === 'extension_whiteboard') return t("CUSTOM_MESSAGE_WHITEBOARD") || "Whiteboard";
                        if (messageType === 'extension_document') return t("CUSTOM_MESSAGE_DOCUMENT") || "Document";
                        if (messageType === 'meeting') return t("meeting") || "Meeting";

                        return messageType || 'Message';
                      })()}
                    </Text>
                  </View>
                  <MemoizedTrailingView message={message} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>
    );
  };

  const renderResults = () => {
    const conversationsRendered = shouldRenderConversations();
    const messagesRendered = shouldRenderMessages();

    // Initial empty state - no search text and no filters
    if ((!searchState.searchText || searchState.searchText.trim() === "") && searchState.activeFilters.length === 0) {
      if (emptyView) {
        return emptyView();
      }

      return (
        <View style={[mergedStyles.emptyStateStyle?.containerStyle]}>
          <Icon
            name="empty-search"
            size={120}
            height={120}
            width={120}
            imageStyle={mergedStyles.emptyStateStyle?.iconStyle}
            containerStyle={mergedStyles.emptyStateStyle?.iconContainerStyle}
          />
          <Text style={[mergedStyles.emptyStateStyle?.titleStyle]}>
            {t("SEARCH_NO_RESULTS_TITLE") || "No Results"}
          </Text>
          <Text style={[mergedStyles.emptyStateStyle?.subtitleStyle]}>
            {t("SEARCH_NO_RESULTS_SUBTITLE") || "Start typing to search for messages and conversations"}
          </Text>
        </View>
      );
    }

    // Show loading shimmer if we have search/filters active and both sections are loading
    if ((searchState.searchText.trim() !== "" || searchState.activeFilters.length > 0) &&
      (conversationState.fetchState === States.loading || messageState.fetchState === States.loading) &&
      conversationState.conversationList.length === 0 &&
      messageState.messageList.length === 0) {
      return loadingView ? loadingView() : <Skeleton />;
    }

    // Check if we have search text or filters but no actual results
    if ((searchState.searchText.trim() !== "" || searchState.activeFilters.length > 0) &&
      conversationState.conversationList.length === 0 &&
      messageState.messageList.length === 0 &&
      conversationState.fetchState !== States.loading &&
      messageState.fetchState !== States.loading &&
      conversationState.fetchState !== States.error &&
      messageState.fetchState !== States.error) {
      // No results found state
      if (emptyView) {
        return emptyView();
      }

      return (
        <View style={[mergedStyles.emptyStateStyle?.containerStyle]}>
          <Icon
            name="empty-search"
            size={120}
            height={120}
            width={120}
            imageStyle={mergedStyles.emptyStateStyle?.iconStyle}
            containerStyle={mergedStyles.emptyStateStyle?.iconContainerStyle}
          />
          <Text style={[mergedStyles.emptyStateStyle?.titleStyle]}>
            {t("SEARCH_NO_RESULTS_FOUND_TITLE") || "No Results Found"}
          </Text>
          <Text style={[mergedStyles.emptyStateStyle?.subtitleStyle]}>
            {t("SEARCH_NO_RESULTS_FOUND_SUBTITLE") || "We couldn't find any matches. Please try a different search keyword."}
          </Text>
        </View>
      );
    }

    // Show search results with actual item lists - USING SINGLE FLATLIST FOR VIRTUALIZATION
    // Create combined data array with section headers
    type ListItem = 
      | { type: 'conversation-header' }
      | { type: 'conversation'; data: CometChat.Conversation }
      | { type: 'conversation-footer' }
      | { type: 'message-header' }
      | { type: 'message'; data: CometChat.BaseMessage; index: number }
      | { type: 'message-footer' };

    const combinedData: ListItem[] = [];

    // Add conversations section if needed
    if (conversationsRendered && conversationState.conversationList.length > 0) {
      combinedData.push({ type: 'conversation-header' });
      conversationState.conversationList.forEach(conv => {
        combinedData.push({ type: 'conversation', data: conv });
      });
      if (conversationState.hasMoreResults) {
        combinedData.push({ type: 'conversation-footer' });
      }
    }

    // Add messages section if needed
    if (messagesRendered && messageState.messageList.length > 0) {
      combinedData.push({ type: 'message-header' });
      messageState.messageList.forEach((msg, index) => {
        combinedData.push({ type: 'message', data: msg, index });
      });
    }

    const keyExtractor = (item: ListItem, index: number) => {
      if (item.type === 'conversation') {
        return `conversation-${item.data.getConversationId()}`;
      } else if (item.type === 'message') {
        return `message-${item.data.getId()}-${index}`;
      }
      return `${item.type}-${index}`;
    };

    const renderCombinedItem = ({ item }: { item: ListItem }) => {
      switch (item.type) {
        case 'conversation-header':
          return <Text style={mergedStyles.sectionTitleStyle}>{t("CHATS") || "Chats"}</Text>;
        
        case 'conversation':
          return (
            <ConversationItem
              conversation={item.data}
              searchText={searchState.searchText}
              onPress={onConversationClicked || (() => {})}
              mergedStyles={mergedStyles}
              theme={theme}
              conversationItemView={conversationItemView}
            />
          );
        
        case 'conversation-footer':
          return (
            <TouchableOpacity
              style={mergedStyles.seeMoreButtonStyle}
              onPress={loadMoreConversations}
              disabled={isConversationMoreResultsLoading.current}
            >
              <Text style={mergedStyles.seeMoreTextStyle}>
                {isConversationMoreResultsLoading.current ? t("SEARCH_LOADING") || 'Loading...' : t("SEARCH_SEE_MORE") || 'See More'}
              </Text>
            </TouchableOpacity>
          );
        
        case 'message-header':
          return <Text style={mergedStyles.sectionTitleStyle}>{t("MESSAGES") || "Messages"}</Text>;
        
        case 'message': {
          const message = item.data;
          const messageIndex = item.index;
          const messageType = message.getType();

          // Date header logic for media items
          let dateHeader: React.ReactNode = null;
          if (['image', 'video'].includes(messageType)) {
            const sentAt = message.getSentAt();
            const currentDateStr = getDateHeaderDate(sentAt);
            const prevItem = messageIndex > 0 ? messageState.messageList[messageIndex - 1] : null;
            const prevDateStr = prevItem ? getDateHeaderDate(prevItem.getSentAt()) : null;

            if (currentDateStr !== prevDateStr) {
              dateHeader = (
                <CometChatDate
                  timeStamp={sentAt * 1000}
                  customDateString={currentDateStr}
                  style={{
                    textStyle: mergedStyles.sectionTitleStyle
                  }}
                />
              );
            }
          }

          // Check if message is a text message with link preview
          const isLinkMessage = messageType === 'text' && (() => {
            const textMessage = message as CometChat.TextMessage;
            const metadata = textMessage.getMetadata();
            return metadata && (metadata as any)['@injected'] && (metadata as any)['@injected']['extensions'] && (metadata as any)['@injected']['extensions']['link-preview'];
          })();

          // Determine which custom view to use based on message type
          let customView: (() => React.ReactElement) | undefined;

          if (isLinkMessage && linkMessageItemView) {
            customView = () => linkMessageItemView(message, searchState.searchText);
          } else if (messageType === 'text' && textMessageItemView) {
            customView = () => textMessageItemView(message, searchState.searchText);
          } else if (messageType === 'image' && imageMessageItemView) {
            customView = () => imageMessageItemView(message, searchState.searchText);
          } else if (messageType === 'video' && videoMessageItemView) {
            customView = () => videoMessageItemView(message, searchState.searchText);
          } else if (messageType === 'audio' && audioMessageItemView) {
            customView = () => audioMessageItemView(message, searchState.searchText);
          } else if (messageType === 'file' && documentMessageItemView) {
            customView = () => documentMessageItemView(message, searchState.searchText);
          }

          // Use custom view if available
          if (customView) {
            return (
              <View>
                {dateHeader}
                <TouchableOpacity
                  onPress={() => onMessageClicked?.(message, searchState.searchText)}
                >
                  {customView()}
                </TouchableOpacity>
              </View>
            );
          }

          // Default message item rendering
          return (
            <View>
              {dateHeader}
              <TouchableOpacity
                style={mergedStyles.messageItemStyle?.containerStyle}
                onPress={() => onMessageClicked?.(message, searchState.searchText)}
              >
                {renderMessageLeadingView(message)}
                <View style={[
                  mergedStyles.messageItemStyle?.contentStyle,
                  (message.getType() === 'image' || message.getType() === 'video') && mergedStyles.messageItemStyle?.textContainerStyle
                ]}>
                  <Text style={mergedStyles.messageItemStyle?.titleStyle} numberOfLines={1}>
                    {message.getSender().getName()}
                  </Text>
                  <Text style={mergedStyles.messageItemStyle?.subtitleStyle} numberOfLines={2}>
                    {(() => {
                      const msgType = message.getType();

                      // For media messages (image, video, file, audio), show file name
                      if (['image', 'video', 'file', 'audio'].includes(msgType)) {
                        const mediaMessage = message as CometChat.MediaMessage;
                        const attachment = mediaMessage.getAttachment?.();
                        return attachment?.getName?.() || msgType;
                      }

                      // For text messages, show the text content
                      if (msgType === 'text') {
                        const raw = (message as CometChat.TextMessage).getText?.();
                        const formatted = formatMentionsInText(raw, message);
                        return formatted || msgType || 'Message';
                      }

                      // For custom messages, try to localize the type
                      const customTypeKey = `CUSTOM_MESSAGE_${msgType.toUpperCase()}`;
                      const localizedType = t(customTypeKey);
                      
                      // If localization exists and is different from key, use it
                      if (localizedType && localizedType !== customTypeKey) {
                        return localizedType;
                      }
                      
                      // Handle specific extension types mapping to existing keys
                      if (msgType === 'extension_poll') return t("CUSTOM_MESSAGE_POLL") || "Poll";
                      if (msgType === 'extension_sticker') return t("CUSTOM_MESSAGE_STICKER") || "Sticker";
                      if (msgType === 'extension_whiteboard') return t("CUSTOM_MESSAGE_WHITEBOARD") || "Whiteboard";
                      if (msgType === 'extension_document') return t("CUSTOM_MESSAGE_DOCUMENT") || "Document";
                      if (msgType === 'meeting') return t("meeting") || "Meeting";

                      return msgType || 'Message';
                    })()}
                  </Text>
                </View>
                <MemoizedTrailingView message={message} />
              </TouchableOpacity>
            </View>
          );
        }
        
        default:
          return null;
      }
    };

    return (
      <FlatList
        data={combinedData}
        keyExtractor={keyExtractor}
        renderItem={renderCombinedItem}
        style={[mergedStyles.resultsContainerStyle]}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.padding.p4 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={100}
        onEndReached={() => {
          // Load more messages if we're at the end and messages section is visible
          if (messagesRendered && messageState.hasMoreResults) {
            loadMoreMessages();
          }
        }}
        onEndReachedThreshold={0.5}
      />
    );
  };

  return (
    <View style={[mergedStyles.containerStyle]}>
      {renderHeader()}
      {renderFilters()}
      {renderResults()}
    </View>
  );
};

export default CometChatSearch;