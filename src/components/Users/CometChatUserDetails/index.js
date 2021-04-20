import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, Modal } from 'react-native';
import theme from '../../../resources/theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CometChatSharedMedia } from '../../Shared';
import style from './styles';
import BottomSheet from 'reanimated-bottom-sheet';
import * as actions from '../../../utils/actions';
import { deviceHeight } from '../../../utils/consts';
import DropDownAlert from '../../Shared/DropDownAlert';

export default class CometChatUserDetails extends React.Component {
  constructor(props) {
    super(props);

    this.viewTheme = { ...theme, ...this.props.theme };
    this.sheetRef = React.createRef(null);
  }

  /**
   * Update bottom sheet to 0th snap point if prop received as open
   */
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
            this.props.actionGenerated(actions.UNBLOCK_USER);
          }}>
          <Text
            style={[style.itemLinkStyle, { color: this.viewTheme.color.red }]}>
            Unblock User
          </Text>
        </TouchableOpacity>
      );
    } else {
      blockUserText = (
        <TouchableOpacity
          onPress={() => {
            this.props.actionGenerated(actions.BLOCK_USER);
          }}>
          <Text
            style={[style.itemLinkStyle, { color: this.viewTheme.color.red }]}>
            Block User
          </Text>
        </TouchableOpacity>
      );
    }

    let blockUserView = (
      <View style={style.blockContainer}>
        <Text
          style={[
            style.sectionHeaderStyle,
            { color: this.viewTheme.color.secondary },
          ]}>
          Options
        </Text>
        <View style={style.blockText}>{blockUserText}</View>
      </View>
    );

    let sharedMediaView = (
      <CometChatSharedMedia
        theme={this.props.theme}
        containerHeight={50}
        showMessage={(type, message) => {
          this.dropDownAlertRef?.showMessage(type, message);
        }}
        item={this.props.item}
        type={this.props.type}
      />
    );

    return (
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
                  <View
                    style={[
                      style.headerStyle,
                      { borderColor: this.viewTheme.borderColor.primary },
                    ]}>
                    <TouchableOpacity
                      style={style.headerCloseStyle}
                      onPress={() =>
                        this.props.actionGenerated(actions.CLOSE_DETAIL)
                      }>
                      <Icon
                        name="keyboard-arrow-left"
                        size={24}
                        color="#000000"
                        style={{ marginRight: 5 }}
                      />
                    </TouchableOpacity>
                    <Text style={style.headerTitleStyle}>Details</Text>
                  </View>
                  <View style={style.optionsContainer}>
                    {blockUserView}
                    {sharedMediaView}
                  </View>
                </View>
              );
            }}
            onCloseEnd={() => {
              this.props.actionGenerated(actions.CLOSE_DETAIL);
            }}
          />
        </View>
        <DropDownAlert ref={(ref) => (this.dropDownAlertRef = ref)} />
      </Modal>
    );
  }
}
