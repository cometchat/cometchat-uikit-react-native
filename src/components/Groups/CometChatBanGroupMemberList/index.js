/* eslint-disable react/static-property-placement */
/* eslint-disable react/jsx-fragments */
import React from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { View, Text, FlatList, Modal, Dimensions, TouchableOpacity } from 'react-native';
import BottomSheet from 'reanimated-bottom-sheet';

import { CometChatBanGroupMemberListItem } from '../index';
import GroupDetailContext from '../CometChatGroupDetails/context';

import style from './styles';

import theme from '../../../resources/theme';

export default class CometChatBanGroupMemberList extends React.Component {
  static contextType = GroupDetailContext;

  constructor(props) {
    super(props);

    this.decoratorMessage = 'Loading...';

    this.state = {};
    this.theme = { ...theme, ...props.theme };
    this.sheetRef = React.createRef(null);
  }

  unbanMember = (memberToUnBan) => {
    const group = this.context;

    const { guid } = group.item;
    CometChat.unbanGroupMember(guid, memberToUnBan.uid)
      .then((response) => {
        if (response) {
          this.props.actionGenerated('unbanGroupMembers', [memberToUnBan]);
        }
      })
      .catch(() => {});
  };

  updateMembers = (action, member) => {
    switch (action) {
      case 'unban':
        this.unbanMember(member);
        break;
      default:
        break;
    }
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
        <Text style={style.contactHeaderTitleStyle}>Banned Members</Text>
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
    const membersList = [...group.bannedmemberlist];
    if (!membersList.length) {
      this.decoratorMessage = 'No banned members';
    }
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
                        style={{}}>
                        <Text style={style.contactHeaderTitleStyle}>
                          Banned Members
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          this.sheetRef.current.snapTo(1);
                          this.props.close();
                        }}
                        style={{ }}>
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
                            widgetsettings={this.props.widgetsettings}
                            actionGenerated={this.updateMembers}
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
