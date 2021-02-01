/* eslint-disable react/jsx-fragments */
/* eslint-disable react/no-unused-state */
/* eslint-disable react/static-property-placement */
import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { View, Text, FlatList, Modal, Dimensions, TouchableOpacity } from 'react-native';
import BottomSheet from 'reanimated-bottom-sheet';

import { CometChatViewGroupMemberListItem } from '../index';
import GroupDetailContext from '../CometChatGroupDetails/context';
import _ from 'lodash';
import style from './styles';

import theme from '../../../resources/theme';

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

  updateMembers = (action, member, scope) => {
    switch (action) {
      case 'ban':
        this.banMember(member);
        break;
      case 'kick':
        this.kickMember(member);
        break;
      case 'changescope':
        this.changeScope(member, scope);
        break;
      default:
        break;
    }
  };

  banMember = (memberToBan) => {
    const { guid } = this.props.item;
    CometChat.banGroupMember(guid, memberToBan.uid)
      .then((response) => {
        if (response) {
          // console.log('banGroupMember success with response: ', response);
          this.props.actionGenerated('banGroupMembers', memberToBan);
        }
      })
      .catch(() => {
        // console.log('banGroupMember failed with error: ', error);
      });
  };

  kickMember = (memberToKick) => {
    const { guid } = this.props.item;
    CometChat.kickGroupMember(guid, memberToKick.uid)
      .then((response) => {
        if (response) {
          // console.log('kickGroupMember success with response: ', response);
          this.props.actionGenerated('removeGroupParticipants', memberToKick);
        }
      })
      .catch(() => {
        // console.log('kickGroupMember failed with error: ', error);
      });
  };

  changeScope = (member, scope) => {
    const { guid } = this.props.item;

    CometChat.updateGroupMemberScope(guid, member.uid, scope)
      .then((response) => {
        if (response) {
          // console.log('updateGroupMemberScope success with response: ', response);
          const updatedMember = { ...member, scope };
          this.props.actionGenerated('updateGroupParticipants', updatedMember);
        }
      })
      .catch(() => {
        // console.log('updateGroupMemberScope failed with error: ', error);
      });
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
    this.props.actionGenerated('fetchGroupMembers');
  };

  render() {
    const group = this.context;
    const membersList = _.uniqBy([...group.memberlist],'uid');

    return (
      <React.Fragment>
        <Modal transparent animated animationType="fade" visible={this.props.open}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <BottomSheet
              ref={this.sheetRef}
              snapPoints={[Dimensions.get('window').height - 80, 0]}
              borderRadius={30}
              initialSnap={0}
              enabledInnerScrolling={false}
              enabledContentTapInteraction
              overdragResistanceFactor={10}
              renderContent={() => {
                return (
                  <View style={style.reactionDetailsContainer}>
                    <View style={style.headerContainer}>
                      <View
                        style={{
                          // width: Dimensions.get('window').width - 60,
                          justifyContent: 'center',
                          alignItems: 'center',
                          // paddingLeft: 60,
                        }}>
                        <Text style={style.contactHeaderTitleStyle}>
                          Group Members
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          this.sheetRef.current.snapTo(1);
                          this.props.close();
                        }}
                        style={{  }}>
                        <Text style={{ color: this.theme.color.blue }}>
                          Close
                        </Text>
                      </TouchableOpacity>
                    </View>
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
                            widgetsettings={this.props.widgetsettings}
                            actionGenerated={this.updateMembers}
                            loggedInUser={this.props.loggedInUser}
                          />
                        );
                      }}
                      // ListHeaderComponent={this.listHeaderComponent}
                      ListEmptyComponent={this.listEmptyContainer}
                      ItemSeparatorComponent={this.itemSeparatorComponent}
                      onScroll={this.handleScroll}
                      onEndReached={this.endReached}
                      onEndReachedThreshold={0.3}
                      contentContainerStyle={{
                        paddingBottom: 0.09 * Dimensions.get('window').height,
                      }}
                      style={{
                        height:
                          Dimensions.get('window').height -
                          0.25 * Dimensions.get('window').height,
                      }}
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
        </Modal>
      </React.Fragment>
    );
  }
}
