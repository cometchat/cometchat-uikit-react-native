import {CometChat} from '@cometchat/chat-sdk-react-native';
import {
  useTheme,
  CometChatAvatar,
  CometChatCallButtons,
  useCometChatTranslation,
} from '@cometchat/chat-uikit-react-native';
import {
  GroupTypeConstants,
  UserStatusConstants,
} from '@cometchat/chat-uikit-react-native/src/shared/constants/UIKitConstants';
import {CometChatCompThemeProvider} from '@cometchat/chat-uikit-react-native/src/theme/provider';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Text, View} from 'react-native';
import { useConfig } from '../../config/store';
export type CallLogDetailHeaderInterface = {
  user?: CometChat.User;
  /**
   *
   * @type {CometChat.Group}
   *   To pass group object
   */
  group?: CometChat.Group;
};

export const CallLogDetailHeader = (props: CallLogDetailHeaderInterface) => {
  const theme = useTheme();
  const {t}= useCometChatTranslation()
  const {user, group} = props;

  const [groupObj, setGroupObj] = useState(group);
  const [userStatus, setUserStatus] = useState(
    user &&
      !(user.getBlockedByMe() || user.getHasBlockedMe()) &&
      user?.getStatus
      ? user?.getStatus()
      : '',
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
  const receiverTypeRef = useRef(
    user
      ? CometChat.RECEIVER_TYPE.USER
      : group
        ? CometChat.RECEIVER_TYPE.GROUP
        : null,
  );

  useEffect(() => {
    setGroupObj(group);
  }, [group]);

  useEffect(() => {
    setUserStatus(
      user && !(user.getBlockedByMe() || user.getHasBlockedMe())
        ? user?.getStatus()
        : '',
    );
  }, [user]);

  const messageHeaderStyles = useMemo(() => {
    return theme.messageHeaderStyles;
  }, [theme.messageHeaderStyles]);

  const statusIndicatorType = useMemo(() => {
    if (groupObj?.getType() === GroupTypeConstants.password) {
      return 'protected';
    } else if (groupObj?.getType() === GroupTypeConstants.private) {
      return 'private';
    } else if (userStatus === 'online') {
      return 'online';
    }
    return '';
  }, [userStatus, groupObj]);

  const AvatarWithStatusView = useCallback(() => {
    return (
      <View>
        <CometChatAvatar
          image={
            user
              ? user.getAvatar()
                ? {uri: user.getAvatar()}
                : undefined
              : groupObj
                ? groupObj.getIcon()
                  ? {uri: groupObj.getIcon()}
                  : undefined
                : undefined
          }
          name={user?.getName() || groupObj?.getName() || ''}
        />
      </View>
    );
  }, [user, groupObj, statusIndicatorType]);

  const SubtitleViewFnc = () => {
    const statusTytle =
      receiverTypeRef.current === CometChat.RECEIVER_TYPE.GROUP &&
      (groupObj?.['membersCount'] || groupObj?.['membersCount'] === 0)
        ? `${groupObj['membersCount']} ${t('MEMBERS')}`
        : receiverTypeRef.current === CometChat.RECEIVER_TYPE.USER
          ? userStatus === UserStatusConstants.online
            ? t('ONLINE')
            : userStatus === UserStatusConstants.offline
              ? t('OFFLINE')
              : ''
          : '';

    if(!statusTytle) return <></>;
    return (
      <Text
        style={{
          ...theme.typography.caption1.regular,
          color: theme.color.textSecondary,
        }}>
        {statusTytle}
      </Text>
    );
  };

  return (
    <CometChatCompThemeProvider
      theme={{
        callButtonStyles: messageHeaderStyles.callButtonStyle,
        avatarStyle: messageHeaderStyles.avatarStyle,
        statusIndicatorStyle: messageHeaderStyles.statusIndicatorStyle,
      }}>
      <View
        style={{
          paddingVertical: theme.spacing.padding.p5,
          paddingHorizontal: theme.spacing.padding.p4,
          backgroundColor: theme.color.background1,
          flexDirection: 'row',
          gap: theme.spacing.padding.p3,
          alignItems: 'center',
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: theme.color.borderLight,
        }}>
        <AvatarWithStatusView />
        <View style={{flex: 1}}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              ...theme.typography.heading4.medium,
              color: theme.color.textPrimary,
            }}>
            {user ? user.getName() : groupObj ? groupObj.getName() : ''}
          </Text>
          {<SubtitleViewFnc />}
        </View>
        <View style={{marginLeft: 'auto'}}>
          <CometChatCallButtons
            user={user}
            group={group}
            hideVoiceCallButton={
              (user && !oneOnOneVoiceCalling) || (group && !groupVoiceConference)
            }
            hideVideoCallButton={
              (user && !oneOnOneVideoCalling) || (group && !groupVideoConference)
            }
            style={{
              containerStyle: {
                gap: 10,
              },
              audioCallButtonIconStyle: {
                height: 24,
                width: 24,
                tintColor: theme.color.iconHighlight,
              },
              videoCallButtonIconStyle: {
                height: 24,
                width: 24,
                tintColor: theme.color.iconHighlight,
              },
              audioCallButtonIconContainerStyle: {
                height: 40,
                width: 64,
                paddingVertical: theme.spacing.padding.p2,
                paddingHorizontal: theme.spacing.padding.p5,
                borderWidth: 1,
                borderRadius: theme.spacing.radius.r2,
                borderColor: theme.color.borderDefault,
              },
              videoCallButtonIconContainerStyle: {
                height: 40,
                width: 64,
                paddingVertical: theme.spacing.padding.p2,
                paddingHorizontal: theme.spacing.padding.p5,
                borderWidth: 1,
                borderRadius: theme.spacing.radius.r2,
                borderColor: theme.color.borderDefault,
              },
            }}
          />
        </View>
      </View>
    </CometChatCompThemeProvider>
  );
};
