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
import Icon from 'react-native-vector-icons/Ionicons';

import { CometChatManager } from '../../../utils/controller';

import { UserListManager } from './controller';
import { CometChatUserListItem } from '../index';
import style from './styles';
import theme from '../../../resources/theme';

class CometChatUserList extends React.PureComponent {
  timeout;

  friendsOnly = false;

  decoratorMessage = 'Loading...';

  constructor(props) {
    super(props);

    this.state = {
      userlist: [],
      selectedUser: null,
      textInputValue: '',
      textInputFocused: false,
      showSmallHeader: false,
    };
    this.userListRef = React.createRef();
    this.textInputRef = React.createRef(null);
    this.theme = { ...theme, ...this.props.theme };
    this.currentLetter = '';
  }

  componentDidMount() {
    if (Object.prototype.hasOwnProperty.call(this.props, 'friendsOnly')) {
      this.friendsOnly = this.props.friendsOnly;
    }

    // if (
    //   Object.prototype.hasOwnProperty.call(this.props, 'widgetsettings') &&
    //   this.props.widgetsettings &&
    //   Object.prototype.hasOwnProperty.call(this.props.widgetsettings, 'sidebar') &&
    //   Object.prototype.hasOwnProperty.call(this.props.widgetsettings.sidebar, 'user_listing')
    // ) {
    //   switch (this.props.widgetsettings.sidebar.user_listing) {
    //     case 'friends':
    //       this.friendsOnly = true;
    //       break;
    //     default:
    //       break;
    //   }
    // }

    

    this.navListener = this.props.navigation.addListener('focus', () => {
      this.decoratorMessage = 'Loading...';
      if (this.UserListManager) {
        this.UserListManager.removeListeners();
      }
      this.setState({ userlist: [] });
      this.UserListManager = new UserListManager(this.friendsOnly);
      this.getUsers();
      this.UserListManager.attachListeners(this.userUpdated);
    });
  }

  componentDidUpdate(prevProps) {
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
        const userlist = [...this.state.userlist];

        // search for user
        const userKey = userlist.findIndex(
          (u) => u.uid === this.props.item.uid,
        );
        if (userKey > -1) {
          const userObj = { ...userlist[userKey] };
          this.setState({ selectedUser: userObj });
        }
      }
    }

    // if user is blocked/unblocked, update userlist in state
    if (
      prevProps.item &&
      Object.keys(prevProps.item).length &&
      prevProps.item.uid === this.props.item.uid &&
      prevProps.item.blockedByMe !== this.props.item.blockedByMe
    ) {
      const userlist = [...this.state.userlist];

      // search for user
      const userKey = userlist.findIndex((u) => u.uid === this.props.item.uid);
      if (userKey > -1) {
        const userObj = { ...userlist[userKey] };
        const newUserObj = {
          ...userObj,
          blockedByMe: this.props.item.blockedByMe,
        };
        userlist.splice(userKey, 1, newUserObj);

        this.setState({ userlist });
      }
    }
  }

  componentWillUnmount() {
    this.UserListManager.removeListeners();
    this.UserListManager = null;
  }

  userUpdated = (user) => {
    const userlist = [...this.state.userlist];

    // search for user
    const userKey = userlist.findIndex((u) => u.uid === user.uid);

    // if found in the list, update user object
    if (userKey > -1) {
      const userObj = { ...userlist[userKey] };
      const newUserObj = { ...userObj, ...user };
      userlist.splice(userKey, 1, newUserObj);

      this.setState({ userlist });
    }
  };

  endReached = () => {
    this.getUsers();
  };

  handleClick = (user) => {
    if (!this.props.onItemClick) return;

    // this.setState({selectedUser: {...user}});
    this.props.onItemClick(user, 'user');
  };

  // handleMenuClose = () => {
  //   if (!this.props.actionGenerated) {
  //     return false;
  //   }

  //   this.props.actionGenerated('closeMenuClicked');
  // };

  searchUsers = (val) => {
    this.setState(
      { textInputValue: val },

      () => {
        if (this.timeout) {
          clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(() => {
          this.UserListManager = new UserListManager(this.friendsOnly, val);
          this.setState({ userlist: [] }, () => this.getUsers());
        }, 500);
      },
    );
  };

  getUsers = () => {
    new CometChatManager()
      .getLoggedInUser()
      .then(() => {
        this.UserListManager.fetchNextUsers()
          .then((userList) => {
            if (userList.length === 0) {
              this.decoratorMessage = 'No users found';
            }
            this.setState({ userlist: [...this.state.userlist, ...userList] });
          })
          .catch(() => {
            this.decoratorMessage = 'Error';
            // console.error('[CometChatUserList] getUsers fetchNext error', error);
          });
      })
      .catch(() => {
        this.decoratorMessage = 'Error';
        // console.log('[CometChatUserList] getUsers getLoggedInUser error', error);
      });
  };

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
        widgetsettings={this.props.widgetsettings}
        clickeHandler={this.handleClick}
      />
    );
  };

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

  itemSeparatorComponent = ({ leadingItem }) => {
    if (leadingItem.header) {
      return null;
    }
    return (
      <View
        style={[
          style.itemSeperatorStyle,
          {
            borderBottomColor: this.theme.borderColor.primary,
          },
        ]}
      />
    );
  };

  listHeaderComponent = () => {
    return (
      <View style={[style.contactHeaderStyle]}>
        <Text style={style.contactHeaderTitleStyle}>Users</Text>
        <TouchableWithoutFeedback
          onPress={() => this.textInputRef.current.focus()}>
          <View
            style={[
              style.contactSearchStyle,
              {
                backgroundColor: `${this.theme.backgroundColor.grey}`,
              },
            ]}>
            <Icon
              name="search"
              size={15}
              color={this.theme.color.textInputPlaceholder}
            />
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
      </View>
    );
  };

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
    const userList = [...this.state.userlist];
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
    // let closeBtn = (
    //   <TouchableOpacity onPress={this.handleMenuClose} >
    //     <Image source={navigateIcon} style={style.contactHeaderCloseStyle}></Image>
    //   </TouchableOpacity>
    // );
    // if (
    //   !Object.prototype.hasOwnProperty.call('enableCloseMenu') ||
    //   (Object.prototype.hasOwnProperty.call('enableCloseMenu') && this.props.enableCloseMenu === 0)
    // ) {
    //   closeBtn = null;
    // }

    return (
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={style.contactWrapperStyle}>
          <View style={style.headerContainer}>
            {/* <Text
              style={{
                fontSize: 18,
                display: this.state.showSmallHeader ? 'flex' : 'none',
              }}>
              Users
            </Text> */}
          </View>
          {this.listHeaderComponent()}
          <FlatList
            data={userListWithHeaders}
            renderItem={this.renderUserView}
            // ListHeaderComponent={this.listHeaderComponent}
            ListEmptyComponent={this.listEmptyContainer}
            ItemSeparatorComponent={this.itemSeparatorComponent}
            stickyHeaderIndices={
              Platform.OS === 'android' ? null : headerIndices
            }
            onScroll={this.handleScroll}
            onEndReached={this.endReached}
            onEndReachedThreshold={0.3}
            showsVerticalScrollIndicator={false}
          />
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    );
  }
}

export default CometChatUserList;
