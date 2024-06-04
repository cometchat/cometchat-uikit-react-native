import React, { useEffect, useRef, useState } from 'react'
import { View, TouchableOpacity, Image, Text, FlatList, SectionList } from 'react-native'
import { CometChat } from '@cometchat/chat-sdk-react-native'
import { AvatarStyle, AvatarStyleInterface, CometChatContext, CometChatDetailsTemplate, CometChatListItem, ImageType, ListItemStyle, ListItemStyleInterface, localize } from '../../shared'
import { AvatarConfigurationInterface } from '../../shared/views/CometChatAvatar/AvatarConfiguration'
import { StatusIndicatorStyle, StatusIndicatorStyleInterface } from '../../shared/views/CometChatStatusIndicator/StatusIndicatorStyle'
import { CometChatCallButtonConfigurationInterface, CometChatCallButtons } from '../CometChatCallButtons'
import { Style } from './style'
import { CloseIcon } from './resources'
import { useContext } from 'react'
import { CallDetailsStyle } from './CallDetailsStyle'
import { CallDetailsStyleInterface } from './CallDetailsStyle'
import { CallingDetailsUtils } from '../CallingDetailsUtils'
import { PASSWORD_GROUP_COLOR, PRIVATE_GROUP_COLOR } from '../../shared/constants/UIKitConstants'

interface CometChatCallDetailsInterface {
  /**
   * Pass CometChat.Call object. This parameter is required
   */
  call: CometChat.Call,
  /**
   * title sets the string in top navigation bar.
   */
  title?: string,
  /**
   * toggle visibility of close button
   */
  showCloseButton?: boolean,
  /**
   * This will change the close button icon
   */
  closeButtonIconImage?: ImageType,
  /**
   * toggle the profile view
   */
  hideProfile?: boolean,
  /**
   * customize the subtitle view as per your need.
   */
  SubtitleView?: (props: { user?: CometChat.User, group?: CometChat.Group }) => JSX.Element,
  /**
   * Pass the custom profile view here.
   */
  CustomProfileView?: (props: { user?: CometChat.User }) => JSX.Element,
  /**
   * List of templates tobe shown
   */
  data?: (props: { message: CometChat.BaseMessage, user?: CometChat.User, group?: CometChat.Group }) => CometChatDetailsTemplate[],
  /**
   * toggle user presence
   */
  disableUsersPresence?: boolean,
  /**
   * call back for error
   */
  onError?: (e: CometChat.CometChatException) => void,
  /**
   * custom functionality on back press
   */
  onBack?: () => void,
  /**
   * Style object for Avatar
   */
  avatarStyle?: AvatarStyleInterface,
  /**
   * Style object for StatusIndicator
   */
  statusIndicatorStyle?: StatusIndicatorStyleInterface,
  /**
   * Style object for ListItem
   */
  listItemStyle?: ListItemStyleInterface,
  /**
   * Style object for CallDetails
   */
  callDetailsStyle?: CallDetailsStyleInterface,
}

const listenerId = "userListener_" + new Date().getTime();

const CometChatCallDetails = (props: CometChatCallDetailsInterface) => {

  const {
    onBack,
    onError,
    CustomProfileView,
    SubtitleView,
    data,
    disableUsersPresence,
    hideProfile,
    call,
    closeButtonIconImage,
    showCloseButton = true,
    title = localize("CALL_DETAILS"),
    avatarStyle,
    callDetailsStyle,
    listItemStyle,
    statusIndicatorStyle,
  } = props;

  const { theme } = useContext(CometChatContext);
  const [tempates, setTemplates] = useState([]);
  const [group, setGroup] = useState(undefined);
  const [user, setUser] = useState(undefined);
  const [error, setError] = useState(undefined);
  const loggedInUser = useRef(null);

  const _avatarStyle = new AvatarStyle({
    nameTextColor: theme.palette.getAccent(),
    backgroundColor: theme.palette.getBackgroundColor(),
    nameTextFont: theme.typography.heading,
    ...avatarStyle
  });

  const _listStyle = new ListItemStyle({
    backgroundColor: theme.palette.getBackgroundColor(),
    titleColor: theme.palette.getAccent(),
    titleFont: theme.typography.body,
    ...listItemStyle
  });

  const _statusStyle = new StatusIndicatorStyle({
    ...statusIndicatorStyle
  });

  const _callDetailsStyle = new CallDetailsStyle({
    backIconTint: theme.palette.getPrimary(),
    titleColor: theme.palette.getAccent(),
    titleFont: theme.typography.heading,
    closeIconTint: theme.palette.getPrimary(),
    backgroundColor: theme.palette.getBackgroundColor(),
    ...callDetailsStyle
  });

  useEffect(() => {
    CometChat.getLoggedinUser().then(
      (loggedUser: CometChat.User) => {
        let tmpList: CometChatDetailsTemplate[];
        loggedInUser.current = loggedUser;
        let user = call?.getReceiverType() == "user" ? call.getReceiver() as CometChat.User : undefined
        let group = call?.getReceiverType() == "group" ? call['receiver'] as CometChat.Group : undefined
        if (data) {
          tmpList = data({ message: call, user, group });
        } else {
          tmpList = CallingDetailsUtils.getDefaultDetailsTemplates(call, loggedUser, user, group)
        }
        setTemplates(tmpList.map(item => {
          item['data'] = item.options;
          return item;
        }))
        setUser(user);
        setGroup(group);
      },
      (error: CometChat.CometChatException) => {
        setError(localize("SOMETHING_WRONG"));
        onError && onError(error);
      }
    );
    CometChat.addUserListener(
      listenerId,
      new CometChat.UserListener({
        onUserOnline: (user) => {
          setUser(user);
        },
        onUserOffline: (user) => {
          setUser(user);
        },
      })
    );
    return () => {
      CometChat.removeUserListener(listenerId);
    }
  }, []);

  const getStatusColor = () => {
    if (disableUsersPresence)
      return "transparent";
    if (user && user['status'] == "online")
      return theme.palette.getSuccess();
    if (group) {
      if (group['type'] == "password")
        return PASSWORD_GROUP_COLOR;
      if (group['type'] == "private")
        return PRIVATE_GROUP_COLOR;
    }
    return "transparent";
  }

  const subtitleView = () => {
    if (SubtitleView)
      return <SubtitleView group={group} user={user} />
    return <Text style={{ color: theme.palette.getAccent() }}>
      {
        user ?
          user['status'] :
          group ?
            `${group['membersCount']} ${localize("MEMBERS")}`
            :
            undefined
      }
    </Text>
  }

  const _render = ({ item }) => {
    return item.CustomView && item.CustomView()
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.palette.getBackgroundColor() }}>
      {
        !hideProfile &&
        <View style={[Style.row, { height: 60, alignItems: "center" }]}>
          {
            CustomProfileView && <CustomProfileView user={user} />
          }
          {
            showCloseButton &&
            <TouchableOpacity onPress={onBack}>
              <Image style={[Style.imageStyle, { tintColor: _callDetailsStyle.backIconTint }]} source={closeButtonIconImage || CloseIcon} />
            </TouchableOpacity>
          }
          <Text style={[theme.typography.heading, Style.heading, { color: theme.palette.getAccent() }]}>{title}</Text>
        </View>
      }
      {
        error &&
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <Text style={{color: theme.palette.getError()}}>{error}</Text>
        </View> ||
        <>
          <CometChatListItem
            id={user ? user['uid'] : group ? group['guid'] : undefined}
            statusIndicatorColor={getStatusColor()}
            avatarURL={user && user['avatar'] ? { uri: user['avatar'] } : group && group['icon'] ? { uri: group['icon'] } : undefined}
            SubtitleView={() => subtitleView()}
            avatarName={user ? user['name'] : group ? group['name'] : undefined}
            title={user ? user['name'] : group ? group['name'] : undefined}
            avatarStyle={_avatarStyle}
            statusIndicatorStyle={_statusStyle}
            listItemStyle={_listStyle}
          />
          <SectionList
            sections={tempates}
            keyExtractor={(item, index) => item + index}
            renderItem={_render}
            renderSectionHeader={({ section }) => {
              const { title, titleColor, titleFont, titleStyle } = section;
              if (!title)
                return null;

              return (
                <Text
                  style={[
                    { color: titleColor ?? theme.palette.getAccent500() },
                    titleFont ? titleFont : theme.typography.text2,
                    titleStyle ? titleStyle : {},
                  ]}
                >
                  {title}
                </Text>
              );
            }}
          />
        </>
      }
    </View>
  )
}