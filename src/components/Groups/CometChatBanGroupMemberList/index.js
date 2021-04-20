/* eslint-disable react/static-property-placement */
/* eslint-disable react/jsx-fragments */
import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { View, Text, FlatList, Modal, TouchableOpacity } from 'react-native';
import BottomSheet from 'reanimated-bottom-sheet';
import DropDownAlert from '../../Shared/DropDownAlert';

import { CometChatBanGroupMemberListItem } from '../index';
import GroupDetailContext from '../CometChatGroupDetails/context';

import style from './styles';

import theme from '../../../resources/theme';
import * as actions from '../../../utils/actions';
import { deviceHeight } from '../../../utils/consts';
import { logger } from '../../../utils/common';

export default class CometChatBanGroupMemberList extends React.Component {
  static contextType = GroupDetailContext;

  constructor(props) {
    super(props);

    this.decoratorMessage = 'Loading...';

    this.state = {};
    this.theme = { ...theme, ...props.theme };
    this.sheetRef = React.createRef(null);
  }

  /**
   *handles the unbanning of a member from the group
   * @param memberToUnBan: memberToUnBan object
   */

  unbanMember = (memberToUnBan) => {
    const group = this.context;

    const { guid } = group.item;
    CometChat.unbanGroupMember(guid, memberToUnBan.uid)
      .then((response) => {
        if (response) {
          this.dropDownAlertRef?.showMessage(
            'success',
            'Group member unbanned',
          );
          this.props.actionGenerated(actions.UNBAN_GROUP_MEMBERS, [
            memberToUnBan,
          ]);
        } else {
          this.dropDownAlertRef?.showMessage(
            'error',
            'Failed to unban group member ',
          );
        }
      })
      .catch((error) => {
        const errorCode = error?.message || 'ERROR';
        this.dropDownAlertRef?.showMessage('error', errorCode);
      });
  };

  /**
   * handles the unbanning of member if the arg. action matches the required case via unbanMember()
   * @param action: actions object
   * @param member: member object
   */

  updateMembers = (action, member) => {
    switch (action) {
      case actions.UNBAN:
        this.unbanMember(member);
        break;
      default:
        break;
    }
  };

  /**
   * handles how the header should be shown when scroll(event) is performed.
   * @param nativeEvent
   */

  handleScroll = ({ nativeEvent }) => {
    try {
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
    } catch (error) {
      logger(error);
    }
  };

  /**
   * The header component for flatlist(for memberList).
   * @param
   */

  listHeaderComponent = () => {
    return (
      <View style={[style.contactHeaderStyle]}>
        <Text style={style.contactHeaderTitleStyle}>Banned Members</Text>
      </View>
    );
  };

  /**
   * handles what needs to be displayed when the list is empty i.e decorator message.
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
   * provides the component to be displayed between each membersList item.
   * @param leadingItem
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

  endReached = () => {
    this.props.actionGenerated(actions.FETCH_GROUP_MEMBERS);
  };

  render() {
    const group = this.context;
    const membersList = [...group.bannedMemberList];
    if (!membersList.length) {
      this.decoratorMessage = 'No banned members';
    }
    return (
      <React.Fragment>
        <Modal
          transparent
          animated
          animationType="fade"
          visible={this.props.open}>
          <View style={style.container}>
            <BottomSheet
              ref={this.sheetRef}
              snapPoints={[deviceHeight - 80, 0]}
              borderRadius={30}
              initialSnap={0}
              enabledInnerScrolling={false}
              enabledContentTapInteraction
              overdragResistanceFactor={10}
              renderContent={() => {
                return (
                  <View style={style.reactionDetailsContainer}>
                    <View style={style.headerContainer}>
                      <View style={{}}>
                        <Text style={style.contactHeaderTitleStyle}>
                          Banned Members
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          this.sheetRef.current.snapTo(1);
                          this.props.close();
                        }}
                        style={{}}>
                        <Text style={{ color: this.theme.color.blue }}>
                          Close
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={membersList}
                      renderItem={({ item, index }) => {
                        return (
                          <CometChatBanGroupMemberListItem
                            theme={this.props.theme}
                            key={index}
                            member={item}
                            item={this.props.item}
                            loggedInUser={this.props.loggedInUser}
                            lang={this.props.lang}
                            actionGenerated={this.updateMembers}
                          />
                        );
                      }}
                      ListEmptyComponent={this.listEmptyContainer}
                      ItemSeparatorComponent={this.itemSeparatorComponent}
                      onScroll={this.handleScroll}
                      onEndReached={this.endReached}
                      onEndReachedThreshold={0.3}
                      contentContainerStyle={style.contentContainerStyle}
                      style={style.listStyle}
                      showsVerticalScrollIndicator={false}
                    />
                  </View>
                );
              }}
              onCloseEnd={() => {
                this.props.close();
              }}
            />
          </View>
          <DropDownAlert ref={(ref) => (this.dropDownAlertRef = ref)} />
        </Modal>
      </React.Fragment>
    );
  }
}
