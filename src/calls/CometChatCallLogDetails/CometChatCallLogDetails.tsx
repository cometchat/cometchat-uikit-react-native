import React, { useEffect, useRef, useState } from 'react'
import { View, TouchableOpacity, Image, Text, SectionList } from 'react-native'
import { CometChat } from '@cometchat/chat-sdk-react-native'
import { AvatarStyle, AvatarStyleInterface, CometChatAvatar, CometChatContext, CometChatDetailsTemplate, ImageType, localize } from '../../shared'
import { Style } from './style'
import { CloseIcon } from './resources'
import { useContext } from 'react'
import { CallLogDetailsStyle, CallLogDetailsStyleInterface } from './CallLogDetailsStyle'
import { CallingDetailsUtils } from '../CallingDetailsUtils'
import { CometChatParticipants } from '../CometChatCallLogParticipants/CometChatCallLogParticipants'
import { CometChatRecordings } from '../CometChatCallLogRecordings/CometChatCallLogRecordings'
import { CallLogHistoryConfiguration, CometChatCallLogHistory } from '../CometChatCallLogHistory'
import { CallLogParticipantsConfiguration } from '../CometChatCallLogParticipants'
import { CallLogRecordingsConfiguration } from '../CometChatCallLogRecordings/CallLogRecordingsConfiguration'

const listenerId = "userListener_" + new Date().getTime();
const SCREEN = {
  DETAILS: "details",
  PARTICIPANTS: "participants",
  RECORDINGS: "recordings",
  HISTORY: "history",
}
export interface CometChatCallLogDetailsConfigurationInterface {
  /**
 * Pass CometChatCalls.CallUser || CometChatCalls.CallGroup object. This parameter is required
 */
  call: any,
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
   * Pass the custom profile view here.
   */
  CustomProfileView?: (props: { user?: CometChat.User }) => JSX.Element,
  /**
   * List of templates tobe shown
   */
  data?: (props: { message: CometChat.BaseMessage, user?: CometChat.User, group?: CometChat.Group }) => CometChatDetailsTemplate[],
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
   * Style object for CallLogDetails
   */
  callLogDetailsStyle?: CallLogDetailsStyleInterface,
  /**
   * Configuration for call history.
   */
  callLogHistoryConfiguration?: CallLogHistoryConfiguration;
  /**
   * Configuration for call log participants.
   */
  callLogParticipantsConfiguration?: CallLogParticipantsConfiguration;
  /**
   * Configuration for call log recordings.
   */
  callLogRecordingsConfiguration?: CallLogRecordingsConfiguration;
}

export const CometChatCallLogDetails = (props: CometChatCallLogDetailsConfigurationInterface) => {

  const {
    onBack,
    onError,
    CustomProfileView,
    data,
    hideProfile,
    call,
    closeButtonIconImage,
    showCloseButton = true,
    title = localize("CALL_DETAILS"),
    avatarStyle,
    callLogDetailsStyle,
    callLogHistoryConfiguration,
    callLogParticipantsConfiguration,
    callLogRecordingsConfiguration
  } = props;

  const { theme } = useContext(CometChatContext);
  const [tempates, setTemplates] = useState([]);
  const [group, setGroup] = useState(undefined);
  const [user, setUser] = useState(undefined);
  const [error, setError] = useState(undefined);
  const [screen, setScreen] = useState(SCREEN.DETAILS);
  const [participantsData, setParticipantsData] = useState([]);
  const [recordingsData, setRecordingsData] = useState([]);
  const [callData, setCallData] = useState(call);
  const loggedInUser = useRef(null);

  const _avatarStyle = new AvatarStyle({
    nameTextColor: theme.palette.getAccent(),
    backgroundColor: theme.palette.getBackgroundColor(),
    nameTextFont: theme.typography.heading,
    height: 100,
    width: 100,
    borderRadius: 50,
    ...avatarStyle
  });

  const _callLogDetailsStyle = new CallLogDetailsStyle({
    titleColor: theme.palette.getAccent(),
    titleFont: theme.typography.heading,
    closeIconTint: theme.palette.getPrimary(),
    backgroundColor: theme.palette.getBackgroundColor(),
    ...callLogDetailsStyle
  });

  useEffect(() => {
    CometChat.getLoggedinUser().then(
      (loggedUser: CometChat.User) => {
        let tmpList: CometChatDetailsTemplate[];
        loggedInUser.current = loggedUser;
        console.log({ callData })
        let user = callData?.getReceiverType() == "user" ? loggedInUser.current?.getUid() === callData?.getInitiator()?.getUid() ? callData.getReceiver() : callData?.getInitiator() : undefined
        let group = callData?.getReceiverType() == "group" ? loggedInUser.current?.getUid() === callData?.getInitiator()?.getUid() ? callData.getReceiver() : callData?.getInitiator() : undefined
        console.log({ user })
        if (data) {
          tmpList = data({ message: callData, user, group });
        } else {
          let detailsTemplate = CallingDetailsUtils.getDefaultDetailsTemplates(callData, loggedInUser.current, theme);
          detailsTemplate.push(CallingDetailsUtils.getSecondaryDetailsTemplate(callData, loggedInUser.current, theme));
          tmpList = [...detailsTemplate];
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
  }, [callData]);

  const _render = ({ item, onClick }) => {
    function _onPress() {
      if (onClick) {
        onClick(item);
        return;
      } else {
        if (item.id == SCREEN.PARTICIPANTS) {
          setScreen(SCREEN.PARTICIPANTS);
          setParticipantsData(callData?.getParticipants());
          return;
        } else if (item.id == SCREEN.RECORDINGS) {
          setScreen(SCREEN.RECORDINGS);
          setRecordingsData(callData?.getRecordings());
          return;
        } else if (item.id == SCREEN.HISTORY) {
          setScreen(SCREEN.HISTORY);
          return;
        }
      }
      console.log("onClicked", item)
    }
    const { CustomView } = item;
    if (item.CustomView) {
      return <TouchableOpacity activeOpacity={1} onPress={_onPress}>
        <CustomView />
      </TouchableOpacity>
    }
    return <></>;
  }

  console.log({user, group})

  return (
    <View style={{ flex: 1, backgroundColor: _callLogDetailsStyle.backgroundColor }}>
      {screen === SCREEN.DETAILS ? <>
        {
          !hideProfile &&
          <View style={[Style.row, { height: 60, alignItems: "center" }]}>
            {
              CustomProfileView && <CustomProfileView user={user} />
            }
            {
              showCloseButton &&
              <TouchableOpacity onPress={onBack}>
                <Image style={[Style.imageStyle, { tintColor: _callLogDetailsStyle.closeIconTint }]} source={closeButtonIconImage || CloseIcon} />
              </TouchableOpacity>
            }
            <Text style={[theme.typography.heading, Style.heading, { color: theme.palette.getAccent() }]}>{title}</Text>
          </View>
        }
        {
          (error &&
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <Text style={{ color: theme.palette.getError() }}>{error}</Text>
            </View>) ||
          <>
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <CometChatAvatar
                style={_avatarStyle}
                image={user && user['avatar'] ? { uri: user['avatar'] } : group ? { uri: group['icon'] || group['avatar'] } : undefined}
                name={user ? user['name'] : group ? group['name'] : undefined}
              />
              <Text style={[{ marginVertical: 10, color: _callLogDetailsStyle.titleColor }, _callLogDetailsStyle.titleFont]}>{user ? user['name'] : group ? group['name'] : undefined}</Text>
            </View>
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
      </>
        : screen === SCREEN.PARTICIPANTS ?
          <>
            <CometChatParticipants
              call={callData}
              data={participantsData}
              showBackButton={true}
              onBack={() => {
                setScreen(SCREEN.DETAILS);
                setParticipantsData([]);
              }}
              {...callLogParticipantsConfiguration}
            />
          </>
          : screen === SCREEN.RECORDINGS ?
            <>
              <CometChatRecordings
                data={recordingsData}
                showBackButton={true}
                onBack={() => {
                  setScreen(SCREEN.DETAILS);
                  setRecordingsData([]);
                }}
                {...callLogRecordingsConfiguration}
              />
            </>
            : screen === SCREEN.HISTORY ?
              <>
                <CometChatCallLogHistory
                  user={user}
                  group={group}
                  showBackButton={true}
                  onBack={() => {
                    setScreen(SCREEN.DETAILS);
                  }}
                  onItemPress={(item) => {
                    console.log("item", item)
                    setCallData(item);
                    setScreen(SCREEN.DETAILS);
                  }}
                  {...callLogHistoryConfiguration}
                />
              </>
              : null}
    </View>
  )
}