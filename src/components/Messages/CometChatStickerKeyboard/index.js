/* eslint-disable react/jsx-fragments */
import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import theme from '../../../resources/theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import style from './styles';
import { CometChat } from '@cometchat-pro/react-native-chat';
import * as actions from '../../../utils/actions';

class CometChatStickerKeyboard extends React.PureComponent {
  constructor(props) {
    super(props);

    this.decoratorMessage = 'Loading...';
    this.viewTheme = { ...theme, ...this.props.theme };
    this.state = {
      stickerSet: {},
      activeStickerList: [],
    };
  }

  componentDidMount() {
    this.getStickers();
  }

  /**
   * Handler to fetch stickers via CometChat.callExtension('stickers', 'GET', 'v1/fetch', null)
   * @param
   */
  getStickers = () => {
    CometChat.callExtension('stickers', 'GET', 'v1/fetch', null)
      .then((stickers) => {
        // Stickers received
        let activeStickerSet = null;
        const customStickers = Object.prototype.hasOwnProperty.call(
          stickers,
          'customStickers',
        )
          ? stickers.customStickers
          : [];
        const defaultStickers = Object.prototype.hasOwnProperty.call(
          stickers,
          'defaultStickers',
        )
          ? stickers.defaultStickers
          : [];

        defaultStickers.sort((a, b) => {
          return a.stickerSetOrder - b.stickerSetOrder;
        });

        customStickers.sort((a, b) => {
          return a.stickerSetOrder - b.stickerSetOrder;
        });

        const stickerList = [...defaultStickers, ...customStickers];
        if (stickerList.length === 0) {
          this.decoratorMessage = 'No stickers found';
        }

        const stickerSet = stickerList.reduce((r, sticker, index) => {
          const { stickerSetName } = sticker;
          const k = r;
          if (index === 0) {
            activeStickerSet = stickerSetName;
          }

          k[stickerSetName] = [...(k[stickerSetName] || []), { ...sticker }];

          return k;
        }, {});
        let activeStickerList = [];
        if (Object.keys(stickerSet).length) {
          Object.keys(stickerSet).forEach((key) => {
            stickerSet[key].sort((a, b) => {
              return a.stickerOrder - b.stickerOrder;
            });
          });

          activeStickerList = stickerSet[activeStickerSet];
        }

        this.setState({
          stickerSet: stickerSet,
          activeStickerList: activeStickerList,
        });
      })
      .catch(() => {
        // Some error occurred
        this.decoratorMessage = 'No stickers found';

        this.setState({ activeStickerList: [], stickerSet: {} });
      });
  };

  /**
   * Handler for sending stickers to users.
   * @param stickerItem: object stickerItem
   */

  sendStickerMessage = (stickerItem) => {
    this.props.actionGenerated(actions.SEND_STICKER, stickerItem);
  };

  onStickerSetClicked = (sectionItem) => {
    this.setState({ activeStickerList: [] }, () => {
      const stickerSet = { ...this.state.stickerSet };
      const activeStickerList = stickerSet[sectionItem];
      this.setState({
        activeStickerList: activeStickerList,
      });
    });
  };

  render() {
    let messageContainer = null;
    if (this.state.activeStickerList.length === 0) {
      messageContainer = (
        <View style={style.stickerMsgStyle}>
          <Text
            style={[
              style.stickerMsgTxtStyle,
              { color: this.viewTheme.color.secondary },
            ]}>
            {this.decoratorMessage}
          </Text>
        </View>
      );
    }

    let stickers = null;
    if (Object.keys(this.state.stickerSet).length) {
      const sectionItems = Object.keys(this.state.stickerSet).map(
        (sectionItem, key) => {
          const stickerSetThumbnail = this.state.stickerSet[sectionItem][0]
            .stickerUrl;
          return (
            <TouchableOpacity
              key={key}
              style={style.sectionListItemStyle}
              onPress={() => this.onStickerSetClicked(sectionItem)}>
              <Image
                source={{ uri: stickerSetThumbnail }}
                alt={sectionItem}
                style={style.stickerHeaderImageStyle}
              />
            </TouchableOpacity>
          );
        },
      );

      let activeStickerList = [];
      if (this.state.activeStickerList.length) {
        const stickerList = [...this.state.activeStickerList];
        activeStickerList = stickerList.map((stickerItem, key) => {
          return (
            <TouchableOpacity
              key={key}
              style={style.stickerItemStyle}
              onPress={() => this.sendStickerMessage(stickerItem)}>
              <Image
                source={{ uri: stickerItem.stickerUrl }}
                alt={stickerItem.stickerName}
                style={style.stickerImageStyle}
              />
            </TouchableOpacity>
          );
        });
      }

      stickers = (
        <>
          <ScrollView bounces={false}>
            <View style={style.stickerListStyle}>{activeStickerList}</View>
          </ScrollView>

          <View
            style={[
              style.stickerSectionListStyle,
              {
                borderTopColor: this.viewTheme.borderColor.primary,
                backgroundColor: this.viewTheme.backgroundColor.silver,
              },
            ]}>
            <ScrollView
              style={{ paddingVertical: 10 }}
              horizontal
              bounces={false}
              showsHorizontalScrollIndicator={false}>
              {sectionItems}
            </ScrollView>
          </View>
        </>
      );
    }

    return (
      <View
        style={[
          style.stickerWrapperStyle,
          {
            borderColor: this.viewTheme.borderColor.primary,
            backgroundColor: this.viewTheme.backgroundColor.grey,
          },
        ]}>
        <TouchableOpacity
          style={{
            paddingRight: 5,
            paddingTop: 5,
          }}
          onPress={() => this.props.actionGenerated(actions.CLOSE_STICKER)}>
          <Icon
            style={style.closeIcon}
            name="close"
            size={20}
            color="#000000"
          />
        </TouchableOpacity>
        {messageContainer}
        {stickers}
      </View>
    );
  }
}

export default CometChatStickerKeyboard;
