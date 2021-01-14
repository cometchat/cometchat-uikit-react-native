import React from 'react';
import {
  View,
  Text,
  Linking,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { CometChatManager } from '../../../utils/controller';
import { SharedMediaManager } from './controller';
import { CometChatImageViewer } from '../../Messages';
import theme from '../../../resources/theme';
import _ from 'lodash';
import * as enums from '../../../utils/enums';
import styles from './styles';
import VideoPlayer from 'react-native-video-controls';

import Icon from 'react-native-vector-icons/FontAwesome5';

import { heightRatio } from '../../../utils/consts';

export default class CometChatSharedMedia extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      messagetype: 'image',
      messageList: [],
      imageView: false,
      activeMessage: {},
    };

    this.messageContainer = React.createRef();
  }

  componentDidMount() {
    this.SharedMediaManager = new SharedMediaManager(
      this.props.item,
      this.props.type,
      this.state.messagetype,
    );
    this.getMessages();
    this.SharedMediaManager.attachListeners(this.messageUpdated);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.messagetype !== this.state.messagetype) {
      this.SharedMediaManager = null;
      this.SharedMediaManager = new SharedMediaManager(
        this.props.item,
        this.props.type,
        this.state.messagetype,
      );
      this.getMessages();
      this.SharedMediaManager.attachListeners(this.messageUpdated);
    }
  }

  componentWillUnmount() {
    this.SharedMediaManager.removeListeners();
    this.SharedMediaManager = null;
  }

  messageUpdated = (key, message) => {
    switch (key) {
      case enums.MESSAGE_DELETED:
        this.messageDeleted(message);
        break;
      case enums.MEDIA_MESSAGE_RECEIVED:
        this.messageReceived(message);
        break;
      default:
        break;
    }
  };

  messageDeleted = (deletedMessage) => {
    const messageType = deletedMessage.data.type;
    if (
      this.props.type === 'group' &&
      deletedMessage.getReceiverType() === 'group' &&
      deletedMessage.getReceiver().guid === this.props.item.guid &&
      messageType === this.state.messagetype
    ) {
      const messageList = [...this.state.messageList];
      const filteredMessages = messageList.filter(
        (message) => message.id !== deletedMessage.id,
      );
      this.setState({ messageList: filteredMessages });
    }
  };

  messageReceived = (message) => {
    const messageType = message.data.type;
    if (
      this.props.type === 'group' &&
      message.getReceiverType() === 'group' &&
      message.getReceiver().guid === this.props.item.guid &&
      messageType === this.state.messagetype
    ) {
      let messages = [...this.state.messageList];
      messages = messages.concat(message);
      this.setState({ messageList: messages });
    }
  };

  getMessages = () => {
    new CometChatManager()
      .getLoggedInUser()
      .then((user) => {
        this.loggedInUser = user;

        this.SharedMediaManager.fetchPreviousMessages()
          .then((messages) => {
            let messageList = [...messages, ...this.state.messageList];
            messageList = _.uniqBy(messageList, 'id');

            this.setState({ messageList });

            // if (scrollToBottom) {
            //   this.scrollToBottom();
            // }
          })
          .catch(() => {
            // TODO: Handle the erros in contact list.
            // console.error('[CometChatSharedMedia] getMessages fetchPrevious error', error);
          });
      })
      .catch(() => {
        // console.log('[CometChatSharedMedia] getMessages getLoggedInUser error', error);
      });
  };

  scrollToBottom = () => {
    if (this.messageContainer) {
      this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }
  };

  handleScroll = (e) => {
    const top = Math.round(e.currentTarget.scrollTop) === 0;
    if (top && this.state.messageList.length) {
      this.getMessages();
    }
  };

  mediaClickHandler = (type) => {
    this.setState({ messagetype: type, messageList: [] });
  };

  getActiveType = () => {
    if (this.state.messagetype === 'image') {
      return 'Photos';
    }
    if (this.state.messagetype === 'file') {
      return 'Docs';
    }
    return 'Videos';
  };

  showImageView = (message) => {
    this.setState({ imageView: true, activeMessage: message });
  };

  hideImageView = () => {
    this.setState({ imageView: false });
  };

  emptyListComponent = () => {
    return (
      <View style={styles.emptyComponentContainerStyle}>
        <Text
          style={
            styles.emptyComponentStyle
          }>{`No ${this.getActiveType()}`}</Text>
      </View>
    );
  };

  render() {
    const currentTheme = { ...theme, ...this.props.theme };
    const { messagetype, messageList, imageView, activeMessage } = this.state;

    const bgColor = currentTheme.backgroundColor.lightGrey;

    const template = (message) => {
      if (messagetype === 'image' && message.data.url) {
        return (
          <TouchableOpacity
            style={[
              styles.itemStyle,
              {
                backgroundColor: bgColor,
              },
            ]}
            onPress={() => {
              this.showImageView(message);
            }}>
            <FastImage
              source={{ uri: message.data.url }}
              style={styles.imageStyle}
              resizeMode={FastImage.resizeMode.contain}
            />
          </TouchableOpacity>
        );
      }
      if (messagetype === 'video' && message.data.url) {
        return (
          <View style={[styles.videoStyle]}>
            <VideoPlayer
              source={{ uri: message.data.url }}
              navigator={this.props.navigator}
              disableBack
              disableSeekbar
              disableFullscreen
              disableVolume
              style={[
                {
                  height: '100%',
                  width: '100%',
                  borderRadius: 12,
                },
              ]}
              paused
              resizeMode="contain"
            />
          </View>
        );
      }
      if (messagetype === 'file' && message.data.attachments) {
        return (
          <TouchableOpacity
            style={[styles.fileItemStyle, { backgroundColor: bgColor }]}
            onPress={() => Linking.openURL(message.data.attachments[0].url)}>
            <Icon name="file-alt" size={44} color="rgba(0,0,0,0.5)" />
            <Text
              style={[
                styles.fileStyle,
                { color: `${currentTheme.color.primary}` },
              ]}>
              {message.data.attachments[0].name}
            </Text>
          </TouchableOpacity>
        );
      }
    };
    const messages = [...messageList];
    return (
      <View style={[styles.sectionStyle, {}]}>
        <CometChatImageViewer
          open={imageView}
          close={this.hideImageView}
          message={activeMessage}
        />
        <Text
          style={[
            styles.sectionHeaderStyle,
            {
              color: `${currentTheme.color.secondary}`,
            },
          ]}>
          Shared Media
        </Text>
        <View style={[styles.sectionContentStyle]}>
          <View style={styles.mediaBtnStyle}>
            <TouchableOpacity
              onPress={() => this.mediaClickHandler('image')}
              style={[
                messagetype === 'image'
                  ? styles.activeButtonStyle
                  : styles.buttonStyle,
              ]}>
              <Text style={styles.buttonTextStyle}>Photos</Text>
            </TouchableOpacity>
            {messagetype === 'file' ? <View style={styles.seperator} /> : null}
            <TouchableOpacity
              onPress={() => this.mediaClickHandler('video')}
              style={
                messagetype === 'video'
                  ? styles.activeButtonStyle
                  : styles.buttonStyle
              }>
              <Text style={styles.buttonTextStyle}>Videos</Text>
            </TouchableOpacity>
            {messagetype === 'image' ? <View style={styles.seperator} /> : null}
            <TouchableOpacity
              onPress={() => this.mediaClickHandler('file')}
              style={[
                messagetype === 'file'
                  ? styles.activeButtonStyle
                  : styles.buttonStyle,
              ]}>
              <Text style={styles.buttonTextStyle}>Docs</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={messages}
            extraData={messagetype}
            renderItem={({ item }) => {
              return template(item);
            }}
            style={{
              height: Dimensions.get('window').height - 280 * heightRatio,
            }}
            columnWrapperStyle={styles.mediaItemColumnStyle}
            contentContainerStyle={styles.mediaItemStyle}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            ListEmptyComponent={this.emptyListComponent}
            onEndReached={this.getMessages}
          />
        </View>
      </View>
    );
  }
}
