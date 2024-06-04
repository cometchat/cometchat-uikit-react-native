import { Text, TextInput, View } from 'react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import Header from './Header';
import {
  BorderStyleInterface,
  CometChatConfirmDialog,
  CometChatContext,
  FontStyleInterface,
  ImageType,
  localize,
} from '../shared';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatGroupsEvents } from '../shared/events';
import { styles } from './style';
import { CometChatContextType } from '../shared/base/Types';
import { CometChatUIEventHandler } from '../shared/events/CometChatUIEventHandler/CometChatUIEventHandler';

export interface JoinProtectedGroupStyleInterface {
  closeIconTint?: string;
  joinIconTint?: string;
  inputBorderColor?: string;
  titleStyle?: FontStyleInterface;
  descriptionTextStyle?: FontStyleInterface;
  errorTextStyle?: FontStyleInterface;
  passwordInputTextStyle?: FontStyleInterface;
  passwordPlaceholderStyle?: FontStyleInterface;
  width?: string | number;
  height?: string | number;
  background?: string;
  border?: BorderStyleInterface;
  borderRadius?: number;
}
export interface CometChatJoinProtectedGroupInterface {
  /**
   *
   *
   * @type {CometChat.Group}
   * @description CometChat SDK’s group object
   */
  group: CometChat.Group;
  /**
   *
   *
   * @type {string}
   * @description Title of the component
   */
  title?: string;
  /**
   *
   *
   * @type {ImageType}
   * @description Icon of the join icon
   */
  joinIcon?: ImageType;
  /**
   *
   *
   * @type {ImageType}
   * @description Icon of the close icon
   */
  closeIcon?: ImageType;
  /**
   *
   *
   * @type {string}
   * @description Text to appear in the input when no value is set
   */
  passwordPlaceholderText?: string;
  /**
   *
   *
   * @type {string}
   * @description Description of the component
   */
  description?: string;
  /**
   *
   * @type {(group: CometChat.Group, password: string) => void}
   * @description Function triggered when user clicks on the join button
   */
  onJoinClick?: ({
    group,
    password,
  }: {
    group: CometChat.Group;
    password: string;
  }) => void;
  /**
   *
   *
   * @type {boolean}
   * @description Whether the component has error
   */
  hasError?: boolean;
  /**
   *
   *
   * @type {string}
   * @description CometChatJoinProtectedGroupInterface
   */
  errorText?: string;
  /**
   *
   *
   * @description Text to be displayed when an error has occured
   */
  onError?: (error: CometChat.CometChatException) => void;
  /**
   *
   *
   * @description function triggered when user clicks on the back icon/button
   */
  onBack?: () => void;
  /**
   *
   *
   * @type {JoinProtectedGroupStyleInterface}
   * @description Styling properties of the component
   */
  joinProtectedGroupStyle?: JoinProtectedGroupStyleInterface;
}
export const CometChatJoinProtectedGroup = (
  props: CometChatJoinProtectedGroupInterface
) => {
  const { theme } = useContext<CometChatContextType>(CometChatContext);
  const {
    group,
    title = localize("PROTECTED_GROUP"),
    joinIcon,
    closeIcon,
    passwordPlaceholderText = localize("GROUP_PASSWORD"),
    description,
    onJoinClick,
    hasError,
    errorText,
    onError,
    onBack,
    joinProtectedGroupStyle,
  } = props;
  const [password, setPassword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const loggedUserRef = useRef(null);
  const showError = (message) => {
    if (hasError) {
      setModalVisible(true);
      setErrorMessage(errorText ?? message);
    }
  };
  const joinGroup = () => {
    if (!password) {
      showError(localize('WRONG_PASSWORD'));
      return;
    }

    let guid = group?.['guid'];
    let type = group?.['type'];

    CometChat.joinGroup(guid, type, password)
      .then((response) => {
        setPassword('');
        onBack && onBack();
        group['membersCount'] = group['membersCount'] + 1;
        CometChatUIEventHandler.emitGroupEvent(
          CometChatGroupsEvents.ccGroupMemberJoined,
          {
            joinedUser: loggedUserRef.current,
            joinedGroup: group,
          }
        );
      })
      .catch((error: CometChat.CometChatException) => {
        onError && onError(error);
      });
  };

  useEffect(() => {
    CometChat.getLoggedinUser().then(
      (loggedUser: CometChat.User) => {
        loggedUserRef.current = loggedUser;
      },
      (error: CometChat.CometChatException) => {
        onError && onError(error);
      }
    );
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          width: joinProtectedGroupStyle.width ?? 'auto',
          height: joinProtectedGroupStyle.height ?? 'auto',
          backgroundColor:
            joinProtectedGroupStyle.background ??
            theme.palette.getBackgroundColor(),
          borderRadius: joinProtectedGroupStyle.borderRadius ?? 0,
        },
        joinProtectedGroupStyle.border ?? {},
      ]}
    >
      <CometChatConfirmDialog
        isOpen={modalVisible}
        title={localize('INCORRECT_PASSWORD')}
        confirmButtonText={'Ok'}
        cancelButtonText={''}
        messageText={errorMessage}
        onConfirm={() => setModalVisible(false)}
        style={{
          messageTextStyle: joinProtectedGroupStyle.errorTextStyle,
          titleTextStyle: joinProtectedGroupStyle.errorTextStyle,
        }}
      />
      <Header
        title={title}
        joinIcon={joinIcon}
        closeIcon={closeIcon}
        titleStyle={[
          joinProtectedGroupStyle.titleStyle ?? theme.typography.heading,
          { color: theme.palette.getAccent() },
        ]}
        joinIconTint={
          joinProtectedGroupStyle.joinIconTint ?? theme.palette.getPrimary()
        }
        closeIconTint={
          joinProtectedGroupStyle.closeIconTint ?? theme.palette.getPrimary()
        }
        onSubmit={
          onJoinClick ? () => onJoinClick({ group, password }) : joinGroup
        }
        onCancel={onBack}
      />
      <Text
        style={[
          joinProtectedGroupStyle.descriptionTextStyle ??
            theme.typography.subtitle1,
          { color: theme.palette.getAccent() },
        ]}
      >
        {description ?? `Enter password to access ${group?.['name']} Group.`}
      </Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder={passwordPlaceholderText}
        placeholderTextColor={theme.palette.getAccent600()}
        style={[
          styles.textInput,
          {
            borderBottomColor:
              joinProtectedGroupStyle.inputBorderColor ??
              theme.palette.getAccent200(),
            color: theme.palette.getAccent(),
          },
          password.length > 0
            ? joinProtectedGroupStyle.passwordPlaceholderStyle ??
              theme.typography.body
            : joinProtectedGroupStyle.passwordInputTextStyle ??
              theme.typography.body,
        ]}
      />
    </View>
  );
};
CometChatJoinProtectedGroup.defaultProps = {
  hasError: true,
  joinProtectedGroupStyle: {},
};
