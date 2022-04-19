/* eslint-disable react/jsx-fragments */
/* eslint-disable react/no-did-update-set-state */
import React from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  TextInput,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import {
  CometChatContextProvider,
  CometChatContext,
} from '../../../utils/CometChatContext';
import Icon from 'react-native-vector-icons/Ionicons';

import { CometChatManager } from '../../../utils/controller';

import { UserListManager } from './controller';
import CometChatUserListItem from '../CometChatUserListItem';
import style from './styles';
import theme from '../../../resources/theme';
import { logger } from '../../../utils/common';
import * as enums from '../../../utils/enums';
import { CometChat } from '@cometchat-pro/react-native-chat';
import DropDownAlert from '../../Shared/DropDownAlert';
class CometChatUserList extends React.PureComponent {
  static contextType = CometChatContext;

  timeout;

  friendsOnly = false;

  decoratorMessage = 'Loading...';

  constructor(props) {
    super(props);

    this.state = {
      userList: [],
      selectedUser: null,
      textInputValue: '',
      textInputFocused: false,
      showSmallHeader: false,
      restrictions: null,
    };
    this.userListRef = React.createRef();
    this.textInputRef = React.createRef(null);
    this.theme = { ...theme, ...this.props.theme };
    this.currentLetter = '';
  }

  componentDidMount() {
    this.checkRestrictions();
    try {
      if (Object.prototype.hasOwnProperty.call(this.props, 'friendsOnly')) {
        this.friendsOnly = this.props.friendsOnly;
      }

      this.navListener = this.props.navigation.addListener('focus', () => {
        this.decoratorMessage = 'Loading...';
        if (this.UserListManager) {
          this.UserListManager.removeListeners();
        }
        this.setState({ userList: [] });
        this.UserListManager = new UserListManager();
        this.UserListManager.initializeUsersRequest()
          .then((response) => {
            this.getUsers();
            this.UserListManager.attachListeners(this.userUpdated);
          })
          .catch((error) => {
            console.log(error);
          });
      });
    } catch (error) {
      logger(error);
    }
  }

  checkRestrictions = async () => {
    let context = this.contextProviderRef.state;
    let isUserSearchEnabled = await context.FeatureRestriction.isUserSearchEnabled();
    this.setState({ restrictions: { isUserSearchEnabled } });
  };

  componentDidUpdate(prevProps) {
    try {
      if (this.state.textInputFocused) {
        this.textInputRef.current.focus();
      }
      const previousItem = JSON.stringify(prevProps.item);
      const currentItem = JSON.stringify(this.props.item);

      if (previousItem !== currentItem) {
        if (Object.keys(this.props.item).length === 0) {
          this.userListRef.scrollTop = 0;
          this.setState({ selectedUser: {} });
        } else {
          const userList = [...this.state.userList];

          // search for user
          const userKey = userList.findIndex(
            (u) => u.uid === this.props.item.uid,
          );
          if (userKey > -1) {
            const userObj = { ...userList[userKey] };
            this.setState({ selectedUser: userObj });
          }
        }
      }

      // if user is blocked/unblocked, update userList in state
      if (
        prevProps.item &&
        Object.keys(prevProps.item).length &&
        prevProps.item.uid === this.props.item.uid &&
        prevProps.item.blockedByMe !== this.props.item.blockedByMe
      ) {
        const userList = [...this.state.userList];

        // search for user
        const userKey = userList.findIndex(
          (u) => u.uid === this.props.item.uid,
        );
        if (userKey > -1) {
          const userObj = { ...userList[userKey] };
          const newUserObj = {
            ...userObj,
            blockedByMe: this.props.item.blockedByMe,
          };
          userList.splice(userKey, 1, newUserObj);

          this.setState({ userList });
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  componentWillUnmount() {
    try {
      this.UserListManager.removeListeners();
      this.UserListManager = null;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Handle user updated from listener
   * @param user: user object
   */
  userUpdated = (user) => {
    try {
      const userList = [...this.state.userList];

      // search for user
      const userKey = userList.findIndex((u) => u.uid === user.uid);

      // if found in the list, update user object
      if (userKey > -1) {
        const userObj = { ...userList[userKey] };
        const newUserObj = { ...userObj, ...user };
        userList.splice(userKey, 1, newUserObj);

        this.setState({ userList });
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Handle on end reached of the list
   * @param
   */
  endReached = () => {
    this.getUsers();
  };

  /**
   * Handle click on the list item
   * @param
   */
  handleClick = (user) => {
    if (!this.props.onItemClick) return;
    this.props.onItemClick(user, CometChat.RECEIVER_TYPE.USER);
  };

  /**
   * Retrieve user from user list while searching
   * @param
   */
  searchUsers = (val) => {
    this.setState(
      { textInputValue: val },

      () => {
        if (this.timeout) {
          clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(() => {
          this.UserListManager = new UserListManager(val);
          this.setState({ userList: [] }, () => this.getUsers());
        }, 500);
      },
    );
  };

  /**
   * Retrieve user list from sdk acc to logged in user
   * @param
   */
  getUsers = () => {
    new CometChatManager()
      .getLoggedInUser()
      .then(() => {
        this.UserListManager.fetchNextUsers()
          .then((userList) => {
            if (userList.length === 0) {
              this.decoratorMessage = 'No users found';
            }
            this.setState({ userList: [...this.state.userList, ...userList] });
          })
          .catch((error) => {
            const errorCode = error?.message || 'ERROR';
            this.dropDownAlertRef?.showMessage('error', errorCode);
            this.decoratorMessage = 'Error';
            logger('[CometChatUserList] getUsers fetchNext error', error);
          });
      })
      .catch((error) => {
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
        this.decoratorMessage = 'Error';
        logger('[CometChatUserList] getUsers getLoggedInUser error', error);
      });
  };

  /**
   * Component for flatList item
   * @param
   * if item - sticky header
   * @returns Component with ContactAlphabet
   * if item - user
   * @returns UserListComponent
   */
  renderUserView = ({ item, index }) => {
    if (item.header) {
      const headerLetter = item.value;
      return (
        <View style={style.contactAlphabetStyle} key={index}>
          <Text style={style.contactAlphabetTextStyle}>{headerLetter}</Text>
        </View>
      );
    }

    const user = item.value;
    return (
      <CometChatUserListItem
        theme={this.theme}
        user={user}
        selectedUser={this.state.selectedUser}
        clickHandler={this.handleClick}
      />
    );
  };

  /**
   * Return component for empty user list
   * @param
   */
  listEmptyContainer = () => {
    return (
      <View style={style.contactMsgStyle}>
        <Text
          style={[
            style.contactMsgTxtStyle,
            {
              color: `${this.theme.color.secondary}`,
            },
          ]}>
          {this.decoratorMessage}
        </Text>
      </View>
    );
  };

  /**
   * Return separator component
   * @param
   */
  itemSeparatorComponent = ({ leadingItem }) => {
    if (leadingItem.header) {
      return null;
    }
    return (
      <View
        style={[
          style.itemSeparatorStyle,
          {
            borderBottomColor: this.theme.borderColor.primary,
          },
        ]}
      />
    );
  };

  /**
   * Return header component with text input for search
   * @param
   */
  listHeaderComponent = () => {
    return (
      <View style={[style.contactHeaderStyle]}>
        <Text style={style.contactHeaderTitleStyle}>Users</Text>
        {this.state.restrictions?.isUserSearchEnabled ? (
          <TouchableWithoutFeedback
            onPress={() => this.textInputRef.current.focus()}>
            <View
              style={[
                style.contactSearchStyle,
                {
                  backgroundColor: `${this.theme.backgroundColor.grey}`,
                },
              ]}>
              <Icon name="search" size={18} color={this.theme.color.helpText} />
              <TextInput
                ref={this.textInputRef}
                autoCompleteType="off"
                value={this.state.textInputValue}
                placeholder="Search"
                placeholderTextColor={this.theme.color.textInputPlaceholder}
                onChangeText={this.searchUsers}
                onFocus={() => {
                  this.setState({ textInputFocused: true });
                }}
                onBlur={() => {
                  this.setState({ textInputFocused: false });
                }}
                clearButtonMode="always"
                numberOfLines={1}
                style={[
                  style.contactSearchInputStyle,
                  {
                    color: `${this.theme.color.primary}`,
                  },
                ]}
              />
            </View>
          </TouchableWithoutFeedback>
        ) : null}
      </View>
    );
  };

  /**
   * Check scroll value to enable small headers
   * @param
   */
  handleScroll = ({ nativeEvent }) => {
    if (nativeEvent.contentOffset.y > 35 && !this.state.showSmallHeader) {
      this.setState({
        showSmallHeader: true,
      });
    }
    if (nativeEvent.contentOffset.y <= 35 && this.state.showSmallHeader) {
      this.setState({
        showSmallHeader: false,
      });
    }
  };

  render() {
    const userList = [...this.state.userList];
    const userListWithHeaders = [];
    let headerIndices = [0];
    if (userList.length) {
      headerIndices = [];
      userList.forEach((user) => {
        const chr = user.name[0].toUpperCase();
        if (chr !== this.currentLetter) {
          this.currentLetter = chr;
          if (!this.state.textInputValue) {
            headerIndices.push(userListWithHeaders.length);
            userListWithHeaders.push({
              value: this.currentLetter,
              header: true,
            });
          }
          userListWithHeaders.push({ value: user, header: false });
        } else {
          userListWithHeaders.push({ value: user, header: false });
        }
      });
    }

    return (
      <CometChatContextProvider ref={(el) => (this.contextProviderRef = el)}>
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
          }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={style.contactWrapperStyle}>
            <View style={style.headerContainer}></View>
            {this.listHeaderComponent()}
            <FlatList
              data={userListWithHeaders}
              renderItem={this.renderUserView}
              contentContainerStyle={{ flexGrow: 1 }}
              ListEmptyComponent={this.listEmptyContainer}
              ItemSeparatorComponent={this.itemSeparatorComponent}
              keyExtractor={(item, index) => item.uid + '_' + index}
              stickyHeaderIndices={
                Platform.OS === 'android' ? null : headerIndices
              }
              onScroll={this.handleScroll}
              onEndReached={this.endReached}
              onEndReachedThreshold={0.3}
              showsVerticalScrollIndicator={false}
            />
            <DropDownAlert ref={(ref) => (this.dropDownAlertRef = ref)} />
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </CometChatContextProvider>
    );
  }
}

export default CometChatUserList;
