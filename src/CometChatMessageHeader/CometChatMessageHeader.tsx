import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ViewStyle,
  StyleProp,
  ImageStyle,
  TextStyle,
  //@ts-ignore
} from 'react-native';
import React, { useEffect, useState, useRef, useContext } from 'react';
import { CometChatContext, CometChatListItem } from '../shared';
import { localize } from '../shared';
import { ICONS } from './resources';
import { styles } from './styles';
import { listners } from './listners';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { ImageType } from '../shared';
import { ListItemStyleInterface, AvatarStyleInterface } from '../shared';
import { StatusIndicatorStyleInterface } from '../shared/views/CometChatStatusIndicator/StatusIndicatorStyle';
import { BorderStyleInterface, FontStyleInterface } from '../shared/base';
import {
  PASSWORD_GROUP_COLOR,
  PRIVATE_GROUP_COLOR,
  UserStatusConstants,
} from '../shared/constants/UIKitConstants';
import { CometChatContextType } from '../shared/base/Types';
import { CometChatUIEventHandler } from '../shared/events/CometChatUIEventHandler/CometChatUIEventHandler';
export interface MessageHeaderStyleInterface {
  width?: string | number;
  height?: string | number;
  backgroundColor?: string;
  border?: BorderStyleInterface;
  borderRadius?: number;
  backIconTint?: string;
  onlineStatusColor?: string;
  subtitleTextColor?: string;
  subtitleTextFont?: FontStyleInterface;
  typingIndicatorTextColor?: string;
  typingIndicatorTextFont?: FontStyleInterface;
  //   privateGroupIcon;
  //   passwordGroupIcon;
}

export interface CometChatMessageHeaderInterface {
  /**
   *
   * Function which have {user}/{group} as prop and returns a JSX Element to render in place of Subtitle View
   */
  SubtitleView?: ({
    user,
    group,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
  }) => JSX.Element;
  /**
   *
   * @type {boolean}
   * To disable user presence indicator
   */
  disableUsersPresence?: boolean;
  /**
   *
   * @type {boolean}
   * To disable typing indicator
   */
  disableTyping?: boolean;
  /**
   *
   * @type {ImageType}
   * To pass custom icon for protected group
   */
  protectedGroupIcon?: ImageType;
  /**
   *
   * @type {ImageType}
   * To pass custom icon for private group
   */
  privateGroupIcon?: ImageType;
  /**
   *
   *   Function which have {user}/{group} as prop and returns a JSX Element to render in place of AppBar/Menu
   */
  AppBarOptions?: ({
    user,
    group,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
  }) => JSX.Element;
  /**
   *
   * @type {MessageHeaderStyleInterface}
   * To pass custom styling for header
   */
  style?: MessageHeaderStyleInterface;
  /**
   *
   * @type {CometChat.User}
   *   To pass user object
   */
  user?: CometChat.User;
  /**
   *
   * @type {CometChat.Group}
   *   To pass group object
   */
  group?: CometChat.Group;
  /**
   *
   * @type {ImageType}
   *  To pass custom icon for back button
   */
  backButtonIcon?: ImageType;
  /**
   *
   * @type {boolean}
   * To gide back button
   */
  hideBackIcon?: boolean;
  /**
   *
   *Function which have user/group as prop and returns a JSX Element to render in place of ListItem View
   */
  ListItemView?: ({
    user,
    group,
  }: {
    user?: CometChat.User;
    group?: CometChat.Group;
  }) => JSX.Element;
  /**
   *
   * @type {Function}
   *  Function which will trigger when user press back button
   */
  onBack?: () => void;
  /**
   *
   * @type {ListItemStyleInterface}
   * To pass custom styling for list item
   */
  listItemStyle?: ListItemStyleInterface;
  /**
   *
   * @type {AvatarStyleInterface}
   * To pass custom styling for avatar in list item
   */
  avatarStyle?: AvatarStyleInterface;
  /**
   *
   * @type {StatusIndicatorStyleInterface}
   * To pass custom styling for status indicator in list item
   */
  statusIndicatorStyle?: StatusIndicatorStyleInterface;
  /**
   *
   * @type {StyleProp<ViewStyle>}
   *  To pass custom styling for headViewContainer in list item
   */
  headViewContainerStyle?: StyleProp<ViewStyle>;
  /**
   *
   * @type {StyleProp<ViewStyle>}
   * To pass custom styling for bodyViewContainerStyle in list item
   */
  bodyViewContainerStyle?: StyleProp<ViewStyle>;
  /**
   *
   * @type {StyleProp<ViewStyle>}
   * To pass custom styling for tailViewContainerStyle in list item
   */
  tailViewContainerStyle?: StyleProp<ViewStyle>;
}


export const CometChatMessageHeader = (
  props: CometChatMessageHeaderInterface
) => {
  const { theme } = useContext<CometChatContextType>(CometChatContext);
  const userStatusListenerId = 'user_status_' + new Date().getTime();
  const msgTypingListenerId = 'message_typing_' + new Date().getTime();
  const groupListenerId = 'head_group_' + new Date().getTime();
  const ccGroupMemberKickedId = 'ccGroupMemberKicked_' + new Date().getTime();
  const ccGroupMemberBannedId = 'ccGroupMemberBanned_' + new Date().getTime();
  const ccGroupMemberAddedId = 'ccGroupMemberAdded_' + new Date().getTime();
  const ccOwnershipChangedId = 'ccOwnershipChanged_' + new Date().getTime();

  const {
    SubtitleView,
    disableUsersPresence,
    disableTyping,
    protectedGroupIcon,
    privateGroupIcon,
    AppBarOptions,
    style,
    user,
    group,
    backButtonIcon,
    hideBackIcon,
    ListItemView,
    onBack,
    listItemStyle,
    avatarStyle,
    statusIndicatorStyle,
    headViewContainerStyle,
    bodyViewContainerStyle,
    tailViewContainerStyle,
  } = props;

  const [groupObj, setGroupObj] = useState(group);
  const [userStatus, setUserStatus] = useState(user ? user.getStatus() : '');
  const [groupMemberCount, setGroupMemberCount] = useState(
    group ? group.getMembersCount() : 0
  );
  const [typingText, setTypingText] = useState('');

  const receiverTypeRef = useRef(
    user
      ? CometChat.RECEIVER_TYPE.USER
      : group
      ? CometChat.RECEIVER_TYPE.GROUP
      : null
  );

  useEffect(() => {
    setGroupObj(group);
  }, [group]);

  useEffect(() => {
    setUserStatus(user ? user.getStatus() : '');
  },[user]);

  const BackButton = () => {
    return (
      <TouchableOpacity style={styles.backButtonStyle} onPress={onBack}>
        <Image
          source={
            typeof backButtonIcon == 'string'
              ? { uri: backButtonIcon }
              : typeof backButtonIcon == 'object' ||
                typeof backButtonIcon == 'number'
              ? backButtonIcon
              : ICONS.BACK
          }
          style={[
            styles.backButtonIconStyle,
            { tintColor: style.backIconTint ?? theme.palette.getPrimary() },
          ]}
        />
      </TouchableOpacity>
    );
  };

  const SubtitleViewFnc = () => {
    if (!disableTyping && typingText !== '')
      return (
        <Text
          style={[
            {
              color:
                style.typingIndicatorTextColor ?? theme.palette.getAccent600(),
            },
            style.typingIndicatorTextFont ?? theme.typography.text1,
          ]}
        >
          {typingText}
        </Text>
      );
    if (disableUsersPresence) return null;
    return (
      <Text
        style={[
          { color: style.subtitleTextColor ?? theme.palette.getAccent600() },
          style.subtitleTextFont ?? theme.typography.text1,
        ]}
      >
        {receiverTypeRef.current === CometChat.RECEIVER_TYPE.GROUP &&
        (groupObj['membersCount'] || groupObj['membersCount'] === 0)
          ? `${groupObj['membersCount']} ${localize('MEMBERS')}`
          : receiverTypeRef.current === CometChat.RECEIVER_TYPE.USER
          ? userStatus === UserStatusConstants.online
            ? localize('ONLINE')
            : localize('OFFLINE')
          : ''}
      </Text>
    );
  };

  const handleUserStatus = (userDetails) => {
    if (userDetails.uid === user.getUid()) setUserStatus(userDetails.status);
  };

  const msgTypingIndicator = (typist, status) => {
    if (
      receiverTypeRef.current === CometChat.RECEIVER_TYPE.GROUP &&
      receiverTypeRef.current === typist.receiverType &&
      groupObj?.getGuid() === typist.receiverId
    ) {
      setTypingText(
        status === 'typing'
          ? `${typist.sender.name} ${localize('IS_TYPING')}`
          : ''
      );
    } else if (
      receiverTypeRef.current === CometChat.RECEIVER_TYPE.USER &&
      receiverTypeRef.current === typist.receiverType &&
      user?.getUid() === typist.sender.uid
    ) {
      setTypingText(status === 'typing' ? localize('TYPING') : '');
    }
  };

  const handleGroupListener = (groupDetails) => {
    if (groupDetails?.guid === groupObj.getGuid() && groupDetails.membersCount) {
      setGroupMemberCount(parseInt(groupDetails.membersCount));
    }
  };

  useEffect(() => {
    if (user) {
      listners.addListener.userListener({
        userStatusListenerId,
        handleUserStatus,
      });
      receiverTypeRef.current = CometChat.RECEIVER_TYPE.USER;
    }
    if (groupObj) {
      listners.addListener.groupListener({
        groupListenerId,
        handleGroupListener,
      });
      receiverTypeRef.current = CometChat.RECEIVER_TYPE.GROUP;
    }
    listners.addListener.messageListener({
      msgTypingListenerId,
      msgTypingIndicator,
    });

    return () => {
      if (groupObj)
        listners.removeListner.removeGroupListener({ groupListenerId });
      if (user) {
        listners.removeListner.removeUserListener({ userStatusListenerId });
      }
      listners.removeListner.removeMessageListener({ msgTypingListenerId });
    };
  }, []);

  const handleGroupMemberKicked = ({
    message,
    kickedMember,
    kickedBy,
    kickedFrom,
  }) => {
    setGroupObj(kickedFrom);
  };
  const handleGroupMemberBanned = ({
    message,
    kickedUser,
    kickedBy,
    kickedFrom,
  }) => {
    setGroupObj(kickedFrom);
  };
  const handleGroupMemberAdded = ({
    addedBy,
    message,
    usersAdded,
    userAddedIn,
  }) => {
    setGroupObj(userAddedIn);
  };
  const handleOwnershipChanged = ({ group, newOwner, message }) => {
    setGroupObj(group);
  };

  useEffect(() => {
    CometChatUIEventHandler.addGroupListener(groupListenerId, {
      ccGroupMemberKicked: (item) => handleGroupMemberKicked(item),
      ccGroupMemberBanned: (item) => handleGroupMemberBanned(item),
      ccGroupMemberAdded: (item) => handleGroupMemberAdded(item),
      ccOwnershipChanged: (item) => handleOwnershipChanged(item),
    });
    return () => {
      CometChatUIEventHandler.removeGroupListener(groupListenerId);
    };
  }, []);

  return (
    <View
      style={[
        { flexDirection: 'row' },
        {
          width: style.width ?? 'auto',
          height: style.height ?? 'auto',
          backgroundColor:
            style.backgroundColor ?? theme.palette.getBackgroundColor(),
          borderRadius: style.borderRadius ?? 0,
        },
        style.border ?? {},
      ]}
    >
      {!hideBackIcon && <BackButton />}
      <View style={{ flex: 1 }}>
        {ListItemView ? (
          <ListItemView />
        ) : (
          <CometChatListItem
            id={user ? user.getUid() : groupObj ? groupObj.getGuid() : undefined}
            title={user ? user.getName() : groupObj ? groupObj.getName() : ''}
            avatarName={user ? user.getName() : groupObj ? groupObj.getName() : ''}
            avatarURL={user ? user.getAvatar() ? {uri: user.getAvatar()}: undefined : groupObj ? groupObj.getIcon() ? {uri: groupObj.getIcon()} : undefined : undefined }
            SubtitleView={
              SubtitleView
                ? () => (
                    <SubtitleView
                      {...(user
                        ? { user }
                        : groupObj
                        ? { group: groupObj }
                        : {})}
                    />
                  )
                : SubtitleViewFnc
            }
            bodyViewContainerStyle={{
              marginLeft: 8,
              ...(bodyViewContainerStyle as ViewStyle),
            }}
            listItemStyle={{
              titleFont: { fontWeight: '700' },
              backgroundColor: style.backgroundColor,
              ...listItemStyle,
            }}
            statusIndicatorColor={
              disableUsersPresence
                ? 'transparent'
                : user && user.getStatus() === "online"
                ? style.onlineStatusColor || theme.palette.getSuccess()
                : 'transparent'
            }
            statusIndicatorStyle={
              groupObj
                ? {
                    height: 15,
                    width: 15,
                    backgroundColor:
                      groupObj.getType() === CometChat.GROUP_TYPE.PASSWORD
                        ? PASSWORD_GROUP_COLOR // Note: Need to add this in palette
                        : groupObj.getType() === CometChat.GROUP_TYPE.PRIVATE
                        ? PRIVATE_GROUP_COLOR // Note: Need to add this in palette
                        : '',
                    borderRadius: 15,
                    ...statusIndicatorStyle,
                  }
                : { ...statusIndicatorStyle }
            }
            statusIndicatorIcon={
              groupObj
                ? groupObj.getType() === CometChat.GROUP_TYPE.PASSWORD
                  ? protectedGroupIcon
                    ? protectedGroupIcon
                    : ICONS.PROTECTED
                  : groupObj.getType() === CometChat.GROUP_TYPE.PRIVATE
                  ? privateGroupIcon
                    ? privateGroupIcon
                      ? privateGroupIcon
                      : ICONS.PRIVATE
                    : null
                  : null
                : null
            }
            TailView={
              AppBarOptions
                ? () => (
                    <AppBarOptions
                      {...(user
                        ? { user }
                        : groupObj
                        ? { group: groupObj }
                        : {})}
                    />
                  )
                : null
            }
            headViewContainerStyle={headViewContainerStyle}
            tailViewContainerStyle={tailViewContainerStyle}
            avatarStyle={avatarStyle}
          />
        )}
      </View>
    </View>
  );
};

CometChatMessageHeader.defaultProps = {
  user: null,
  group: null,
  style: {},
};
