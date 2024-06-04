import { View, Text, TouchableOpacity, TextInput, Image } from 'react-native';
import React, { useContext, useState } from 'react';
import Header from './Header';
import { styles } from './style';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import {
  BorderStyleInterface,
  CometChatContext,
  FontStyleInterface,
  ImageType,
  localize,
} from '../shared';
import {
  GroupTypeConstants,
  GroupsConstants,
} from '../shared/constants/UIKitConstants';
import { ICONS } from './resources';
import { CometChatGroupsEvents } from '../shared/events';
import { CometChatContextType } from '../shared/base/Types';
import { CometChatUIEventHandler } from '../shared/events/CometChatUIEventHandler/CometChatUIEventHandler';

export interface CreateGroupStyleInterface {
  titleTextStyle?: FontStyleInterface;
  closeIconTint?: string;
  createIconTint?: string;
  selectedTabColor?: string;
  tabColor?: string;
  selectedTabTextStyle?: FontStyleInterface;
  tabTextStyle?: FontStyleInterface;
  namePlaceholderTextStyle?: FontStyleInterface;
  passwordPlaceholderTextStyle?: FontStyleInterface;
  nameInputTextStyle?: FontStyleInterface;
  passwordInputTextStyle?: FontStyleInterface;
  width?: string | number;
  height?: string | number;
  background?: string;
  border?: BorderStyleInterface;
  borderRadius?: number;
}
export interface CometChatCreateGroupInterface {
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
   * @description Close icon
   */
  closeIcon?: ImageType;
  /**
   *
   *
   * @type {ImageType}
   * @description Create icon
   */
  createIcon?: ImageType;
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
   * @description Text to appear in the input when no value is set
   */
  namePlaceholderText?: string;
  /**
   *
   *
   * @type {boolean}
   * @description Whether the close button is disabled
   */
  disableCloseButton?: boolean;
  /**
   *
   * @type {(groupName:string, groupType:string, password:string) => void}
   * @description Method triggered when user clicks on the create button
   */
  onCreatePress?: (
    groupName: string,
    groupType: string,
    password: string
  ) => void;
  /**
   *
   * @type {(error: CometChat.CometChatException) => void}
   * @description Method triggered when an error is encountered in the component
   */
  onError?: (error: CometChat.CometChatException) => void;
  /**
   *
   * @type {() => void}
   * @description Method triggered when user clicks on the back button
   */
  onBack?: () => void;
  /**
   *
   *
   * @type {CreateGroupStyleInterface}
   * @description Styling properties of the component
   */
  createGroupStyle?: CreateGroupStyleInterface;
}
export const CometChatCreateGroup = (props: CometChatCreateGroupInterface) => {
  const { theme } = useContext<CometChatContextType>(CometChatContext);
  const {
    title = localize("NEW_GROUP"),
    closeIcon,
    createIcon,
    passwordPlaceholderText,
    namePlaceholderText,
    disableCloseButton,
    onCreatePress,
    onError,
    onBack,
    createGroupStyle,
  } = props;
  const [password, setPassword] = useState('');
  const [groupType, setGroupType] = React.useState(GroupTypeConstants.public);
  const [groupName, setGroupName] = React.useState('');
  const [error, setError] = React.useState('');

  const Tab = ({ name, type, onSelect, isSelected }) => {
    return (
      <TouchableOpacity
        onPress={() => onSelect(type)}
        style={[
          styles.tabView,
          isSelected
            ? {
                backgroundColor:
                  createGroupStyle.selectedTabColor ??
                  theme.palette.getPrimary(),
                borderRadius: 16,
              }
            : {},
        ]}
      >
        <Text
          style={[
            theme.typography.text1,
            isSelected
              ? {
                  color: theme.palette.getBackgroundColor(),
                  ...(createGroupStyle.selectedTabTextStyle &&
                    createGroupStyle.selectedTabTextStyle),
                }
              : {
                  color: theme.palette.getAccent600(),
                  ...(createGroupStyle.tabTextStyle &&
                    createGroupStyle.tabTextStyle),
                },
          ]}
        >
          {name}
        </Text>
      </TouchableOpacity>
    );
  };

  const validate = () => {
    if (!groupName) {
      setError(localize('GROUP_NAME_BLANK'));
      return false;
    } else if (groupName.length > 25) {
      setError(localize('GROUP_NAME_MAX'));
      return false;
    }
    if (groupType == '') {
      setError(localize('GROUP_TYPE_BLANK'));
      return false;
    }
    if (groupType === GroupTypeConstants.password) {
      if (!password) {
        setError(localize('GROUP_PASSWORD_BLANK'));
        return false;
      } else if (password.length > 16) {
        setError(localize('PASSWORD_MAX'));
        return false;
      }
    }
    return true;
  };

  const createGroup = () => {
    if (!validate()) return;

    let guid = GroupsConstants.GROUP_ + new Date().getTime();
    let name = groupName;
    let type;
    switch (groupType) {
      case GroupTypeConstants.public:
        type = GroupTypeConstants.public;
        break;
      case GroupTypeConstants.private:
        type = GroupTypeConstants.private;
        break;
      case GroupTypeConstants.password:
        type = GroupTypeConstants.password;
        break;
      default:
        break;
    }
    let group = new CometChat.Group(guid, name, type, password);
    CometChat.createGroup(group)
      .then((group) => {
        CometChatUIEventHandler.emitGroupEvent(
          CometChatGroupsEvents.ccGroupCreated,
          { group }
        );
        onBack && onBack();
      })
      .catch((error: CometChat.CometChatException) => {
        onError && onError(error);
      });
  };

  const ErrorView = () => {
    if (!error && error === '') return null;

    return (
      <View
        style={[
          styles.errorContainer,
          {
            backgroundColor: 'rgba(255, 59, 48, 0.1)', //Note add this color to palette
          },
        ]}
      >
        <View
          style={[
            styles.errorImageContainer,
            {
              backgroundColor: theme.palette.getError(),
            },
          ]}
        >
          <Image
            source={ICONS.WARNING}
            style={[
              styles.errorImage,
              { tintColor: theme.palette.getBackgroundColor() },
            ]}
          />
        </View>
        <View style={styles.errorTextContainer}>
          <Text
            style={[
              styles.errorTextTitle,
              theme.typography.body,
              { color: theme.palette.getError() },
            ]}
          >
            {error?.length > 0 ? error : localize('ERROR_GROUP_CREATE')}
          </Text>
          <Text
            style={[
              styles.errorText,
              theme.typography.body,
              { color: theme.palette.getError() },
            ]}
          >
            {localize('TRY_AGAIN_LATER')}
          </Text>
        </View>
      </View>
    );
  };
  return (
    <View
      style={[
        styles.container,
        {
          width: createGroupStyle.width ?? 'auto',
          height: createGroupStyle.height ?? 'auto',
          backgroundColor:
            createGroupStyle.background ?? theme.palette.getBackgroundColor(),
          borderRadius: createGroupStyle.borderRadius ?? 0,
        },
        createGroupStyle.border ?? {},
      ]}
    >
      <Header
        title={title}
        joinIcon={createIcon}
        closeIcon={closeIcon}
        titleStyle={[
          createGroupStyle.titleTextStyle ?? theme.typography.heading,
          { color: theme.palette.getAccent() },
        ]}
        closeIconTint={
          createGroupStyle.closeIconTint ?? theme.palette.getPrimary()
        }
        createIconTint={
          createGroupStyle.createIconTint ?? theme.palette.getPrimary()
        }
        onSubmit={
          onCreatePress
            ? () => onCreatePress(groupName, groupType, password)
            : createGroup
        }
        onCancel={disableCloseButton ? () => {} : onBack}
      />
      <View
        style={[
          styles.tabContainer,
          {
            backgroundColor:
              createGroupStyle.tabColor ?? theme.palette.getAccent100(),
          },
        ]}
      >
        <Tab
          name={'Public'}
          type={GroupTypeConstants.public}
          isSelected={groupType === GroupTypeConstants.public}
          onSelect={(type) => setGroupType(type)}
        />
        <Tab
          name={'Private'}
          type={GroupTypeConstants.private}
          isSelected={groupType === GroupTypeConstants.private}
          onSelect={(type) => setGroupType(type)}
        />
        <Tab
          name={'Protected'}
          type={GroupTypeConstants.password}
          isSelected={groupType === GroupTypeConstants.password}
          onSelect={(type) => setGroupType(type)}
        />
      </View>
      <TextInput
        value={groupName}
        onChangeText={setGroupName}
        placeholder={namePlaceholderText}
        placeholderTextColor={theme.palette.getAccent600()}
        style={[
          styles.textInput,
          {
            color: theme.palette.getAccent(),
            borderBottomColor: theme.palette.getAccent200(),
          },
          theme.typography.body,
          groupName?.length > 0
            ? createGroupStyle.namePlaceholderTextStyle
            : createGroupStyle.nameInputTextStyle,
        ]}
      />
      {groupType === GroupTypeConstants.password && (
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={passwordPlaceholderText}
          placeholderTextColor={theme.palette.getAccent600()}
          style={[
            styles.textInput,
            {
              color: theme.palette.getAccent(),
              borderBottomColor: theme.palette.getAccent200(),
            },
            theme.typography.body,
            password?.length > 0
              ? createGroupStyle.passwordPlaceholderTextStyle
              : createGroupStyle.passwordInputTextStyle,
          ]}
        />
      )}
      <ErrorView />
    </View>
  );
};

CometChatCreateGroup.defaultProps = {
  namePlaceholderText: localize('NAME'),
  passwordPlaceholderText: localize('ENTER_YOUR_PASSWORD'),
  createGroupStyle: {},
};
