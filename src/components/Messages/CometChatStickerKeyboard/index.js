/* eslint-disable react/jsx-fragments */
import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import theme from '../../../resources/theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import style from './styles';
import { CometChat } from '@cometchat-pro/react-native-chat';

class CometChatStickerKeyboard extends React.PureComponent {
  constructor(props) {
    super(props);

    this.decoratorMessage = 'Loading...';
    this.ViewTheme = { ...theme, ...this.props.theme };
    this.state = {
      stickerset: {},
      activestickerlist: [],
    };
  }

  componentDidMount() {
    this.getStickers();
  }

  getStickers = () => {
    CometChat.callExtension('stickers', 'GET', 'v1/fetch', null)
      .then((stickers) => {
        // Stickers received
        let activeStickerSet = null;
        const customStickers = Object.prototype.hasOwnProperty.call(stickers, 'customStickers')
          ? stickers.customStickers
          : [];
        const defaultStickers = Object.prototype.hasOwnProperty.call(stickers, 'defaultStickers')
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
          stickerset: stickerSet,
          activestickerlist: activeStickerList,
        });
      })
      .catch(() => {
        // Some error occured
        this.decoratorMessage = 'No stickers found';

        this.setState({ activestickerlist: [], stickerset: {} });
      });
  };

  sendStickerMessage = (stickerItem) => {
    this.props.actionGenerated('sendSticker', stickerItem);
  };

  onStickerSetClicked = (sectionItem) => {
    this.setState({ activestickerlist: [] }, () => {
      const stickerSet = { ...this.state.stickerset };
      const activeStickerList = stickerSet[sectionItem];
      this.setState({
        activestickerlist: activeStickerList,
      });
    });
  };

  render() {
    let messageContainer = null;
    if (this.state.activestickerlist.length === 0) {
      messageContainer = (
        <View style={style.stickerMsgStyle}>
          <Text style={[style.stickerMsgTxtStyle, { color: this.ViewTheme.color.secondary }]}>
            {this.decoratorMessage}
          </Text>
        </View>
      );
    }

    let stickers = null;
    if (Object.keys(this.state.stickerset).length) {
      const sectionItems = Object.keys(this.state.stickerset).map((sectionItem, key) => {
        const stickerSetThumbnail = this.state.stickerset[sectionItem][0].stickerUrl;
        return (
          <TouchableOpacity
            key={key}
            style={style.sectionListItemStyle}
            onPress={() => this.onStickerSetClicked(sectionItem)}>
            <Image
              source={{ uri: stickerSetThumbnail }}
              alt={sectionItem}
              style={{ width: 35, height: 35 }}
            />
          </TouchableOpacity>
        );
      });

      let activeStickerList = [];
      if (this.state.activestickerlist.length) {
        const stickerList = [...this.state.activestickerlist];
        activeStickerList = stickerList.map((stickerItem, key) => {
          return (
            <TouchableOpacity
              key={key}
              style={style.stickerItemStyle}
              onPress={() => this.sendStickerMessage(stickerItem)}>
              <Image
                source={{ uri: stickerItem.stickerUrl }}
                alt={stickerItem.stickerName}
                style={{ width: 60, height: 60 }}
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
                borderTopColor: this.ViewTheme.borderColor.primary,
                backgroundColor: this.ViewTheme.backgroundColor.silver,
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
            borderColor: this.ViewTheme.borderColor.primary,
            backgroundColor: this.ViewTheme.backgroundColor.grey,
          },
        ]}>
        <TouchableOpacity
          style={{
            paddingRight: 5,
            paddingTop: 5,
          }}
          onPress={() => this.props.actionGenerated('closeSticker')}>
          <Icon
            style={{ alignSelf: 'flex-end' }}
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
