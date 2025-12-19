import { CometChat } from '@cometchat/chat-sdk-react-native';
import {
  CallingPackage,
  CometChatListItem,
  useTheme,
  useCometChatTranslation,
  useLocalizedDate,
  LocalizedDateHelper
} from '@cometchat/chat-uikit-react-native';
import React, { JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { CallDetailHelper } from './CallDetailHelper';
import { Icon } from '@cometchat/chat-uikit-react-native';

const CometChatCalls = CallingPackage.CometChatCalls;

export const CallHistory = (props: { user?: any; group?: any }) => {
  const { user, group } = props;

  const theme = useTheme();
  const { language, t } = useCometChatTranslation();
  const { formatDate } = useLocalizedDate();

  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);

  const loggedInUser = useRef<CometChat.User | any>(null);
  const callRequestBuilderRef = useRef<any>(null);

  function setRequestBuilder() {
    callRequestBuilderRef.current;
    let builder = new CometChatCalls.CallLogRequestBuilder()
      .setLimit(30)
      .setAuthToken(loggedInUser.current?.getAuthToken() || '')
      .setCallCategory('call');
    if (user) {
      builder = builder.setUid(user?.getUid());
    } else if (group) {
      builder = builder.setGuid(group?.getGuid());
    }
    callRequestBuilderRef.current = builder.build();
  }

  const fetchCallLogHistory = () => {
    if (!callRequestBuilderRef.current || isFetchingMore) {
      return;
    }
    setIsFetchingMore(true);
    callRequestBuilderRef.current
      .fetchNext()
      .then((CallLogHistory: any) => {
        if (CallLogHistory.length > 0) {
          setList(prev => [...prev, ...CallLogHistory]);
        }
      })
      .catch((err: any) => {
        // onError && onError(err);
      })
      .finally(() => {
        setLoading(false);
        setIsFetchingMore(false);
      });
  };

  useEffect(() => {
    CometChat.getLoggedinUser()
      .then((u: any) => {
        loggedInUser.current = u;
        setRequestBuilder();
        fetchCallLogHistory();
      })
      .catch((e: any) => {
        // onError && onError(e);
        setLoading(false);
      });
  }, []);

  const _style = useMemo(() => {
    return {
      headerContainerStyle: {
        alignItems: 'flex-start',
        justifyContent: 'center',
        width: '100%',
        borderRadius: 0,
        paddingHorizontal: 0,
      },
      titleSeparatorStyle: {
        borderBottomWidth: 1,
        borderBottomColor: theme.color.borderLight,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      },
      containerStyle: {
        backgroundColor: theme.color.background1,
        flex: 1,
      },
      itemStyle: {
        containerStyle: {
          flexDirection: 'row' as const,
          marginHorizontal: theme.spacing.margin.m4,
          paddingVertical: theme.spacing.padding.p2,
          gap: theme.spacing.spacing.s3,
          flex: 1,
        },
        titleStyle: {
          color: theme.color.textPrimary,
          flex: 1,
          ...theme.typography.heading4.bold,
        },
        subtitleStyle: {
          color: theme.color.textSecondary,
          ...theme.typography.caption1.regular,
        },
        tailViewTextStyle: {
          color: theme.color.textPrimary,
          ...theme.typography.caption1.bold,
        },
        avatarStyle: {
          containerStyle: {},
          textStyle: {},
          imageStyle: {
            height: 48,
            width: 48,
          },
        },
      },
    };
  }, [theme]);

  // Updated to use proper localization
  const getFormattedInitiatedAt = useCallback((call: any) => {
    if (!call || !call.getInitiatedAt()) return '';

    // Use localizedDateHelper to format the date with proper localization
    return formatDate(
      call.getInitiatedAt() * 1000,
      LocalizedDateHelper.patterns.dayDateTimeFormat
    );
  }, [formatDate]);

  const getCallType = useCallback((call: any) => {
    return CallDetailHelper.getCallType(call);
  }, []);

  const getCallStatusIcon = useCallback((item: any): JSX.Element => {
    const CallStatusIcon = CallDetailHelper.getCallStatusDisplayIcon(
      getCallType(item).callStatus,
      theme,
    );
    return CallStatusIcon || <View />;
  }, []);

  const convertMinutesToTime = useCallback((decimalMinutes: number) => {
    const totalSeconds = Math.round(decimalMinutes * 60); // Convert to seconds
    const minutes = Math.floor(totalSeconds / 60); // Get whole minutes
    const seconds = totalSeconds % 60; // Get remaining seconds
    return `${minutes} min  ${seconds} sec`;
  }, []);

  

  // Added to get localized call status text
  const getCallStatusText = useCallback((callStatus: any) => {
    // Get translation key for this status
    const translationKeys: Record<string, string> = {
      outgoing: 'OUTGOING_CALL',
      outgoingCallEnded: 'OUTGOING_CALL',
      cancelledByMe: 'OUTGOING_CALL',
      outgoingRejected: 'OUTGOING_CALL',
      outgoingBusy: 'OUTGOING_CALL',
      unansweredByThem: 'OUTGOING_CALL',
      incoming: 'INCOMING_CALL',
      incomingCallEnded: 'INCOMING_CALL',
      cancelledByThem: 'MISSED_CALL',
      incomingRejected: 'INCOMING_CALL',
      incomingBusy: 'MISSED_CALL',
      unansweredByMe: 'MISSED_CALL',
    };

    const key = translationKeys[callStatus] || 'UNKNOWN_CALL';
    return t(key);
  }, [t]);

  const _render = ({ item, index }: any) => {
    return (
      <React.Fragment key={index}>
        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            alignItems: 'center',
          }}>
          <Icon
            icon={getCallStatusIcon(item)}
            containerStyle={{ marginLeft: theme.spacing.margin.m4 }}></Icon>
          <CometChatListItem
            id={item.sessionId}
            containerStyle={_style.itemStyle.containerStyle}
            headViewContainerStyle={{ flexDirection: 'row' }}
            trailingViewContainerStyle={{
              alignSelf: 'center',
            }}
            titleStyle={_style.itemStyle.titleStyle}
           title={CallDetailHelper.getCallStatusDisplayText(
              getCallType(item).callStatus,
            )}
            SubtitleView={
              <Text
                style={{
                  ...theme.typography.body.regular,
                  color: theme.color.textSecondary,
                }}>
                {getFormattedInitiatedAt(item)}
              </Text>
            }
            TrailingView={
              <Text style={_style.itemStyle.tailViewTextStyle}>
              {convertMinutesToTime(item.getTotalDurationInMinutes())}
              </Text>
            }
          />
        </View>
      </React.Fragment>
    );
  };

  return (
    <FlatList
      data={list}
      keyExtractor={(item, index) => item.sessionId + '_' + index}
      renderItem={_render}
      onEndReached={fetchCallLogHistory}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        loading ? (
          <View
            style={{
              flex: 1,
              height: 300,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color={theme.color.primary} />
          </View>
        ) : null
      }
    />
  );
};
