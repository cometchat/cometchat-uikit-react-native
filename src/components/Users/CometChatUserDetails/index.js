import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, Modal } from 'react-native';
import theme from '../../../resources/theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CometChatSharedMedia } from '../../Shared';
import style from './styles';
import BottomSheet from 'reanimated-bottom-sheet';

export default class CometChatUserDetails extends React.Component {
  constructor(props) {
    super(props);

    this.ViewTheme = { ...theme, ...this.props.theme };
    this.sheetRef = React.createRef(null);
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.open && this.props.open) {
      this.sheetRef.current.snapTo(0);
    }
  }

  render() {
    let blockUserText;

    if (this.props.item && this.props.item.blockedByMe) {
      blockUserText = (
        <TouchableOpacity
          onPress={() => {
            this.props.actionGenerated('unblockUser');
          }}>
          <Text style={[style.itemLinkStyle, { color: this.ViewTheme.color.red }]}>
            Unblock User
          </Text>
        </TouchableOpacity>
      );
    } else {
      blockUserText = (
        <TouchableOpacity
          onPress={() => {
            this.props.actionGenerated('blockUser');
          }}>
          <Text style={[style.itemLinkStyle, { color: this.ViewTheme.color.red }]}>Block User</Text>
        </TouchableOpacity>
      );
    }

    let blockUserView = (
      <View style={{ width: '100%' }}>
        <Text style={[style.sectionHeaderStyle, { color: this.ViewTheme.color.secondary }]}>
          Options
        </Text>
        <View style={{ width: '100%', marginVertical: 6 }}>{blockUserText}</View>
      </View>
    );

    let sharedmediaView = (
      <CometChatSharedMedia
        theme={this.props.theme}
        containerHeight={50}
        item={this.props.item}
        type={this.props.type}
        widgetsettings={this.props.widgetsettings}
      />
    );

    if (
      Object.prototype.hasOwnProperty.call(this.props, 'widgetsettings') &&
      this.props.widgetsettings &&
      Object.prototype.hasOwnProperty.call(this.props.widgetsettings, 'main')
    ) {
      // if block_user is disabled in chatwidget
      if (
        Object.prototype.hasOwnProperty.call(this.props.widgetsettings.main, 'block_user') &&
        this.props.widgetsettings.main.block_user === false
      ) {
        blockUserView = null;
      }

      // if view_shared_media is disabled in chatwidget
      if (
        Object.prototype.hasOwnProperty.call(this.props.widgetsettings.main, 'view_shared_media') &&
        this.props.widgetsettings.main.view_shared_media === false
      ) {
        sharedmediaView = null;
      }
    }

    return (
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
                  <View
                    style={[
                      style.headerStyle,
                      { borderColor: this.ViewTheme.borderColor.primary },
                    ]}>
                    <TouchableOpacity
                      style={style.headerCloseStyle}
                      onPress={() => this.props.actionGenerated('closeDetail')}>
                      <Icon
                        name="keyboard-arrow-left"
                        size={24}
                        color="#000000"
                        style={{ marginRight: 5 }}
                      />
                    </TouchableOpacity>
                    <Text style={style.headerTitleStyle}>Details</Text>
                  </View>
                  <View style={{ padding: 16, flex: 1, flexGrow: 1 }}>
                    {blockUserView}
                    {sharedmediaView}
                  </View>
                </View>
              );
            }}
            onCloseEnd={() => {
              this.props.actionGenerated('closeDetail');
            }}
          />
        </View>
      </Modal>
    );
  }
}
