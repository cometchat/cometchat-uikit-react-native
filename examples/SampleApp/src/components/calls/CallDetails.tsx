import React, {
  JSX,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {View, TouchableOpacity, Text, TextStyle, ViewStyle} from 'react-native';
import {CometChat} from '@cometchat/chat-sdk-react-native';
import {
  CometChatListItem,
  useCometChatTranslation,
  useTheme,
  useLocalizedDate,
  LocalizedDateHelper
} from '@cometchat/chat-uikit-react-native';
import {CallHistory} from './CallHistory';
import {CallLogDetailHeader} from './CallLogDetailHeader';
import {Icon} from '@cometchat/chat-uikit-react-native';
import {CallParticipants} from './CallParticipants';
import {CallDetailHelper, CallStatus} from './CallDetailHelper';
import {CallRecordings} from './CallRecordings';
import {StackScreenProps} from '@react-navigation/stack';
import {ICONS} from '@cometchat/chat-uikit-react-native/src/shared/icons/icon-mapping';
import {RootStackParamList} from '../../navigation/types';


const listenerId = 'userListener_' + new Date().getTime();
const TABS = {
  DETAILS: 'Details',
  PARTICIPANTS: 'Participants',
  RECORDINGS: 'Recordings',
  HISTORY: 'History',
};

type Props = StackScreenProps<RootStackParamList, 'CallDetails'>;

export const CallDetails: React.FC<Props> = ({route, navigation}) => {
  const {call} = route.params;

  const theme = useTheme();
  const {t, language} = useCometChatTranslation()
  const {formatDate}= useLocalizedDate()
  const [group, setGroup] = useState<CometChat.Group | null>(null);
  const [user, setUser] = useState<CometChat.User | null>(null);
  const loggedInUser = useRef<CometChat.User | any>(null);
  const [selectedTab, setSelectedTab] = useState(TABS.PARTICIPANTS);
  const [tabStyle, setTableStyle] = useState<{
    containerStyle: ViewStyle;
    itemStyle: ViewStyle;
    selectedItemStyle: ViewStyle;
    itemEmojiStyle: TextStyle;
    selectedItemEmojiStyle: TextStyle;
    itemTextStyle: TextStyle;
    selectedItemTextStyle: TextStyle;
  }>();
  const BackIcon = ICONS['arrow-back'];
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log('CALL RECEIVER: ', call);
    CometChat.getLoggedinUser().then((loggedUser: CometChat.User | any) => {
      loggedInUser.current = loggedUser;
      let user =
        call?.getReceiverType() == 'user'
          ? loggedInUser.current?.getUid() === call?.getInitiator()?.getUid()
            ? call.getReceiver()
            : call?.getInitiator()
          : undefined;
      let group =
        call?.getReceiverType() == 'group'
          ? loggedInUser.current?.getUid() === call?.getInitiator()?.getUid()
            ? call.getReceiver()
            : call?.getInitiator()
          : undefined;
      if (user) {
        CometChat.getUser(user.getUid()).then((userObject: CometChat.User) => {
          setUser(userObject);
        });
        return;
      }

      CometChat.getGroup(group.getGuid()).then(
        (groupObject: CometChat.Group) => {
          setGroup(groupObject);
        },
      );
    });
  }, [call]);

  useEffect(() => {
    CometChat.addUserListener(
      listenerId,
      new CometChat.UserListener({
        onUserOnline: (userDetails: any) => {
          if (user?.getUid() === userDetails?.getUid()) {
            setUser(userDetails);
          }
        },
        onUserOffline: (userDetails: any) => {
          if (user?.getUid() === userDetails?.getUid()) {
            setUser(userDetails);
          }
        },
      }),
    );
    return () => {
      CometChat.removeUserListener(listenerId);
    };
  }, [user]);

  useEffect(() => {
    setTableStyle({
      containerStyle: {
        //flex: 1,
        backgroundColor: theme.color.background1,
        flexDirection: 'row',
        //justifyContent: 'space-evenly', // ✅ Ensures even spacing
        alignItems: 'center', // Optional, ensures vertical alignment
        width: '100%', // ✅ Ensures full width for proper spacing
        borderBottomWidth: 1,
        borderColor: theme.color.borderDefault,
        justifyContent: 'space-evenly',
      },
      itemStyle: {
        // paddingHorizontal: theme.spacing.padding.p4,
        paddingVertical: theme.spacing.padding.p2,
        flexDirection: 'row',
        borderBottomWidth: theme.spacing.spacing.s0_5,
        borderBottomColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      },
      selectedItemStyle: {
        // paddingHorizontal: theme.spacing.padding.p4,
        paddingVertical: theme.spacing.padding.p2,
        flexDirection: 'row',
        borderBottomWidth: theme.spacing.spacing.s0_5,
        borderBottomColor: theme.color.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      },
      itemEmojiStyle: {
        color: theme.color.textSecondary,
        borderColor: 'transparent',
        ...theme.typography.body.medium,
      },
      selectedItemEmojiStyle: {
        color: theme.color.textSecondary,
        borderColor: 'transparent',
        ...theme.typography.body.medium,
      },
      itemTextStyle: {
        color: theme.color.textSecondary,
        marginLeft: theme.spacing.margin.m1,
        ...theme.typography.body.medium,
      },
      selectedItemTextStyle: {
        color: theme.color.primary,
        marginLeft: theme.spacing.margin.m1,
        ...theme.typography.body.medium,
      },
    });
  }, [theme]);

  const getUserToFetchHistory = useCallback(() => {
    if (call?.getInitiator().getUid() === loggedInUser.current.getUid()) {
      return call?.getReceiver();
    }
    call?.getInitiator();
  }, [call]);

 
  const callTypeAndStatus = useMemo(
    (): {
      type: 'incoming' | 'outgoing';
      callStatus: CallStatus;
    } => CallDetailHelper.getCallType(call),
    [call],
  );

  /** Busy call toast: only when attempting a call and target is busy */
  useEffect(() => {
    const callListener = new CometChat.CallListener({
      onOutgoingCallRejected: (rejectedCall: any) => {
        try {
          const status = rejectedCall?.getStatus?.() || rejectedCall?.status;
          if (
            status &&
            status.toLowerCase() === CometChat.CALL_STATUS.BUSY.toLowerCase()
          ) {
            setToastMessage(t('CALL_BUSY'));
            setTimeout(() => setToastMessage(null), 3000);
          }
        } catch {}
      },
    });
    CometChat.addCallListener(listenerId, callListener);
    return () => {
      CometChat.removeCallListener(listenerId);
    };
  }, [t]);

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
        backgroundColor: theme.color.background2,
        flex: 1,
      },
      itemStyle: {
        containerStyle: {
          flexDirection: 'row' as const,
          paddingRight: theme.spacing.padding.p4,
          paddingLeft: theme.spacing.padding.p2,
          paddingVertical: theme.spacing.padding.p2,
          gap: theme.spacing.spacing.s3,
          flex: 1,
        },
        titleStyle: {
          color: theme.color.textPrimary,
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

  const convertMinutesToTime = useCallback((decimalMinutes: number) => {
    const totalSeconds = Math.round(decimalMinutes * 60); // Convert to seconds
    const minutes = Math.floor(totalSeconds / 60); // Get whole minutes
    const seconds = totalSeconds % 60; // Get remaining seconds
    return `${minutes} min  ${seconds} sec`;
  }, []);

  const getFormattedInitiatedAt = useCallback(() => {
    if (!call || !call.getInitiatedAt()) return '';

    return formatDate(
      call.getInitiatedAt() * 1000,
      LocalizedDateHelper.patterns.dayDateTimeFormat
    );
  }, [call]);

  const callStatusDisplayString = useMemo(() => {
    return CallDetailHelper.getCallStatusDisplayText(
      callTypeAndStatus.callStatus,
    );
  }, [callTypeAndStatus]);

  const CallStatusIcon = useMemo<JSX.Element | undefined>(
    () =>
      CallDetailHelper.getCallStatusDisplayIcon(
        callTypeAndStatus.callStatus,
        theme,
      ),
    [callTypeAndStatus, theme],
  );

  /** Local toast view component (shows only when toastMessage set; auto hides after 3s from effect) */
  const ToastView = () => {
    if (!toastMessage) return null;
    return (
      <View
        style={{
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 24,
          backgroundColor: 'rgba(255,59,48,0.10)',
          paddingVertical: theme.spacing.padding.p1,
          paddingHorizontal: theme.spacing.padding.p2,
          marginBottom: theme.spacing.margin.m3,
          maxWidth: '80%',
        }}>
        <Icon name="info" color={theme.color.error} size={18} />
        <Text
          style={[
            theme.typography.caption1.bold,
            {color: theme.color.error, marginLeft: theme.spacing.margin.m1},
          ]}
          accessibilityRole="alert">
          {toastMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: theme.color.background1}}>
      <View style={{flex: 1, paddingBottom: theme.spacing.padding.p3}}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: theme.spacing.padding.p2,
            paddingVertical: theme.spacing.padding.p2,
            paddingHorizontal: theme.spacing.padding.p5,
            minHeight: 64,
          }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon
              imageStyle={{
                height: 24,
                width: 24,
                tintColor: theme.color.iconPrimary,
              }}
              icon={
                <BackIcon
                  height={24}
                  width={24}
                  color={theme.color.iconPrimary}></BackIcon>
              }
            />
          </TouchableOpacity>
          <Text
            style={{
              color: theme.color.textPrimary,
              ...theme.typography.heading1.bold,
              paddingTop: 35 - (35 * 0.75),
            }}>
            {t('CALL_DETAILS')}
          </Text>
        </View>

        {(user || group) && (
          <View style={{flexDirection: 'column'}}>
            <CallLogDetailHeader
              {...(user && {user})}
              {...(group && {group})}></CallLogDetailHeader>
            <View
              style={{
                flexDirection: 'row',
                width: '100%',
                alignItems: 'center',
                backgroundColor: theme.color.background2,
              }}>
              <Icon
                icon={CallStatusIcon}
                containerStyle={{marginLeft: theme.spacing.margin.m4}}></Icon>
              <CometChatListItem
                id={call.sessionId}
                avatarStyle={_style.itemStyle.avatarStyle}
                containerStyle={_style.itemStyle.containerStyle}
                headViewContainerStyle={{flexDirection: 'row'}}
                titleStyle={_style.itemStyle.titleStyle}
                title={callStatusDisplayString}
                trailingViewContainerStyle={{
                  alignSelf: 'center',
                }}
                SubtitleView={
                  <Text style={_style.itemStyle.subtitleStyle}>
                    {getFormattedInitiatedAt()}
                  </Text>
                }
                TrailingView={
                  <Text style={_style.itemStyle.tailViewTextStyle}>
                    {convertMinutesToTime(call.getTotalDurationInMinutes())}
                  </Text>
                }
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                borderBottomWidth: 1,
                borderColor: theme.color.borderDefault,
                justifyContent: 'space-evenly',
                paddingHorizontal: 0,
              }}>
              {[
                { key: TABS.PARTICIPANTS, title: t('PARTICIPANT') },
                { key: TABS.RECORDINGS, title: t('RECORDING') },
                { key: TABS.HISTORY, title: t('HISTORY') }
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={
                    selectedTab === tab.key
                      ? tabStyle!.selectedItemStyle
                      : tabStyle!.itemStyle
                  }
                  onPress={() => setSelectedTab(tab.key)}>
                  <Text
                    style={
                      selectedTab === tab.key
                        ? tabStyle!.selectedItemTextStyle
                        : tabStyle!.itemTextStyle
                    }>
                    {tab.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedTab === TABS.PARTICIPANTS && (
              <CallParticipants
                call={call}
                data={call?.getParticipants()}></CallParticipants>
            )}
            {selectedTab === TABS.HISTORY && (
              <CallHistory user={getUserToFetchHistory()}></CallHistory>
            )}
            {selectedTab === TABS.RECORDINGS &&
              call.getRecordings()?.length && (
                <CallRecordings call={call}></CallRecordings>
              )}
          </View>
        )}
      </View>
      <View style={{width: '100%', paddingBottom: theme.spacing.padding.p3}}>
        <ToastView />
      </View>
    </View>
  );
};

