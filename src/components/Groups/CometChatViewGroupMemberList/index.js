/* eslint-disable react/jsx-fragments */
/* eslint-disable react/no-unused-state */
/* eslint-disable react/static-property-placement */
import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import DropDownAlert from '../../Shared/DropDownAlert';
import { View, Text, FlatList, Modal, TouchableOpacity } from 'react-native';
import BottomSheet from 'reanimated-bottom-sheet';

import { CometChatViewGroupMemberListItem } from '../index';
import GroupDetailContext from '../CometChatGroupDetails/context';
import _ from 'lodash';
import style from './styles';

import theme from '../../../resources/theme';
import { deviceHeight } from '../../../utils/consts';
import * as actions from '../../../utils/actions';
import { logger } from '../../../utils/common';

export default class CometChatViewGroupMemberList extends React.Component {
  static contextType = GroupDetailContext;

  constructor(props) {
    super(props);

    this.decoratorMessage = 'Loading...';

    this.state = {
      membersToBan: [],
      membersToUnBan: [],
    };
    this.theme = { ...theme, ...props.theme };
    this.sheetRef = React.createRef(null);
  }

  /**
   * update members of the group based on action.
   * @param action: action name
   * @param member: member object
   * @param scope: scope object
   */

  updateMembers = (action, member, scope) => {
    switch (action) {
      case actions.BAN:
        this.banMember(member);
        break;
      case actions.KICK:
        this.kickMember(member);
        break;
      case actions.CHANGE_SCOPE:
        this.changeScope(member, scope);
        break;
      default:
        break;
    }
  };

  /**
   * handler for banning of members in group
   * @param memberToBan: memberToBan object
   */

  banMember = (memberToBan) => {
    try {
      const { guid } = this.props.item;
      CometChat.banGroupMember(guid, memberToBan.uid)
        .then((response) => {
          if (response) {
            this.dropDownAlertRef?.showMessage(
              'success',
              'Group member banned',
            );
            this.props.actionGenerated(actions.BAN_GROUP_MEMBERS, memberToBan);
          } else {
            this.dropDownAlertRef?.showMessage(
              'error',
              'Failed to ban group member',
            );
          }
        })
        .catch((error) => {
          const errorCode = error?.message || 'ERROR';
          this.dropDownAlertRef?.showMessage('error', errorCode);
          logger('banGroupMember failed with error: ', error);
        });
    } catch (error) {
      logger(error);
    }
  };

  /**
   * handler for kicking of member from group
   * @param memberToKick: memberToKick object
   */
  kickMember = (memberToKick) => {
    try {
      const { guid } = this.props.item;
      CometChat.kickGroupMember(guid, memberToKick.uid)
        .then((response) => {
          if (response) {
            this.dropDownAlertRef?.showMessage(
              'success',
              'Group member kicked',
            );
            this.props.actionGenerated(
              actions.REMOVE_GROUP_PARTICIPANTS,
              memberToKick,
            );
          } else {
            this.dropDownAlertRef?.showMessage(
              'error',
              'Failed to kick group member',
            );
          }
        })
        .catch((error) => {
          const errorCode = error?.message || 'ERROR';
          this.dropDownAlertRef?.showMessage('error', errorCode);
          logger('kickGroupMember failed with error: ', error);
        });
    } catch (error) {
      const errorCode = error?.message || 'ERROR';
      this.dropDownAlertRef?.showMessage('error', errorCode);
      logger(error);
    }
  };

  /**
   * handler for changing of scope of members in the group.
   * @param member: member object
   * @param scope: scope object
   */

  changeScope = (member, scope) => {
    try {
      const { guid } = this.props.item;

      CometChat.updateGroupMemberScope(guid, member.uid, scope)
        .then((response) => {
          if (response) {
            this.dropDownAlertRef?.showMessage(
              'success',
              'Group member scope changed',
            );
            const updatedMember = { ...member, scope };
            this.props.actionGenerated(
              actions.UPDATE_GROUP_PARTICIPANTS,
              updatedMember,
            );
          } else {
            this.dropDownAlertRef?.showMessage(
              'error',
              'Failed to change scope of group member',
            );
          }
        })
        .catch((error) => {
          const errorCode = error?.message || 'ERROR';
          this.dropDownAlertRef?.showMessage('error', errorCode);
          logger('updateGroupMemberScope failed with error: ', error);
        });
    } catch (error) {
      const errorCode = error?.message || 'ERROR';
      this.dropDownAlertRef?.showMessage('error', errorCode);
      logger(error);
    }
  };

  /**
   * handler for the heading when scroll(event) is implemeted
   * @param
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

  listHeaderComponent = () => {
    return (
      <View style={[style.contactHeaderStyle]}>
        <Text style={style.contactHeaderTitleStyle}>Group Members</Text>
      </View>
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

  endReached = () => {
    this.props.actionGenerated(actions.FETCH_GROUP_MEMBERS);
  };

  render() {
    const group = this.context;
    const membersList = _.uniqBy([...group.memberList], 'uid');

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
                      <View style={style.headerContainerStyle}>
                        <Text style={style.contactHeaderTitleStyle}>
                          Group Members
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
                    <View style={style.listContainer}>
                      <FlatList
                        data={membersList}
                        renderItem={({ item, index }) => {
                          return (
                            <CometChatViewGroupMemberListItem
                              theme={this.props.theme}
                              key={index}
                              member={item}
                              item={this.props.item}
                              lang={this.props.lang}
                              actionGenerated={this.updateMembers}
                              loggedInUser={this.props.loggedInUser}
                            />
                          );
                        }}
                        ListEmptyComponent={this.listEmptyContainer}
                        // ItemSeparatorComponent={this.itemSeparatorComponent}
                        onScroll={this.handleScroll}
                        onEndReached={this.endReached}
                        contentContainerStyle={{ flexGrow: 1 }}
                        onEndReachedThreshold={0.3}
                        showsVerticalScrollIndicator={false}
                      />
                    </View>
                  </View>
                );
              }}
              onCloseEnd={() => {
                this.props.close();
              }}
            />
          </View>
        </Modal>
        <DropDownAlert ref={(ref) => (this.dropDownAlertRef = ref)} />
      </React.Fragment>
    );
  }
}
