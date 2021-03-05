import React, { Component } from 'react';
import {
  TouchableWithoutFeedback,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
} from 'react-native';

import IonIcon from 'react-native-vector-icons/Ionicons';
import EvilIcon from 'react-native-vector-icons/EvilIcons';
import MCIIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomSheet from 'reanimated-bottom-sheet';
import style from './styles';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { heightRatio } from '../../../utils/consts';

export default class ComposerActions extends Component {
  sheetRef = React.createRef(null);

  componentDidUpdate(prevProps) {
    if (!prevProps.visible && this.props.visible) {
      this.sheetRef.current.snapTo(0);
    }
  }

  takePhoto = async () => {
    try {
      let granted = null;
      if (Platform.OS === 'android') {
        granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'CometChat Camera Permission',
            message: 'CometChat needs access to your camera ',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
      }
      this.sheetRef.current.snapTo(1);
      this.props.close();
      if (
        Platform.OS === 'ios' ||
        granted === PermissionsAndroid.RESULTS.GRANTED
      ) {
        launchCamera(
          {
            includeBase64: false,
          },
          (response) => {
            if (response.didCancel) {
              return null;
            }
            let type = null;
            let name = null;
            if (Platform.OS === 'ios' && response.fileName !== undefined) {
              name = response.fileName;
            } else {
              type = response.type;
              name = 'Camera_001.jpeg';
            }
            const file = {
              name: Platform.OS === 'android' ? response.fileName : name,
              type: Platform.OS === 'android' ? response.type : type,
              uri:
                Platform.OS === 'android'
                  ? response.uri
                  : response.uri.replace('file://', ''),
            };
            this.props.sendMediaMessage(file, CometChat.MESSAGE_TYPE.IMAGE);
          },
        );
      }
    } catch (err) {
      this.sheetRef.current.snapTo(1);
      this.props.close();
    }
  };

  launchLibrary = (type) => {
    launchImageLibrary(
      {
        mediaType: type,
        includeBase64: false,
        maxHeight: 200,
        maxWidth: 200,
        videoQuality: 'medium',
      },
      (response) => {
        if (response.didCancel) {
          return null;
        }
        let name = null;
        if (response.fileName !== undefined) {
          name = response.fileName;
        } else {
          name = type === 'photo' ? 'Camera_001.jpeg' : 'Camera_001.mov';
        }
        const file = {
          name,
          type: response.type || 'video/quicktime',
          uri:
            Platform.OS === 'android'
              ? response.uri
              : response.uri.replace('file://', ''),
        };
        this.props.sendMediaMessage(
          file,
          type === 'photo'
            ? CometChat.MESSAGE_TYPE.IMAGE
            : CometChat.MESSAGE_TYPE.VIDEO,
        );
        this.sheetRef.current.snapTo(1);
        this.props.close();
      },
    );
  };

  pickDocument = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      const file = {
        name: res.name,
        type: res.type,
        uri: res.uri,
      };
      this.props.sendMediaMessage(file, CometChat.MESSAGE_TYPE.FILE);
      this.sheetRef.current.snapTo(1);
      this.props.close();
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker, exit any dialogs or menus and move on
      } else {
        throw err;
      }
    }
  };

  renderContent = () => {
    let takePhotoBtn = (
      <TouchableOpacity
        style={style.actionButtonContainer}
        onPress={() => this.takePhoto()}>
        <EvilIcon name="camera" size={28} />
        <Text style={{ fontSize: 18, marginLeft: 10, fontWeight: '500' }}>
          Take Photo
        </Text>
      </TouchableOpacity>
    );
    let avp = (
      <TouchableOpacity
        style={style.actionButtonContainer}
        onPress={() => this.launchLibrary('photo')}>
        <IonIcon name="image-outline" size={24} />

        <Text style={{ fontSize: 18, marginLeft: 10, fontWeight: '500' }}>
          Photo Library
        </Text>
      </TouchableOpacity>
    );
    let vp = (
      <TouchableOpacity
        style={style.actionButtonContainer}
        onPress={() => this.launchLibrary('video')}>
        <IonIcon name="videocam-outline" size={24} />

        <Text style={{ fontSize: 18, marginLeft: 10, fontWeight: '500' }}>
          Video Library
        </Text>
      </TouchableOpacity>
    );
    let docs = (
      <TouchableOpacity
        style={style.actionButtonContainer}
        onPress={this.pickDocument}>
        <IonIcon name="ios-folder-outline" size={24} />

        <Text style={{ fontSize: 18, marginLeft: 10, fontWeight: '500' }}>
          Document
        </Text>
      </TouchableOpacity>
    );

    let stickerBtn = (
      <TouchableOpacity style={style.actionButtonContainer}>
        <MCIIcon name="sticker-circle-outline" size={24} />

        <Text
          style={{ fontSize: 18, marginLeft: 10, fontWeight: '500' }}
          onPress={() => this.props.toggleStickers()}>
          Send Sticker
        </Text>
      </TouchableOpacity>
    );

    let createPollBtn = (
      <TouchableOpacity
        style={style.actionButtonContainer}
        onPress={() => {
          this.props.toggleCreatePoll();
        }}>
        <MCIIcon name="comment-plus-outline" size={24} />

        <Text style={{ fontSize: 18, marginLeft: 10, fontWeight: '500' }}>
          Create Poll
        </Text>
      </TouchableOpacity>
    );

    return (
      <View style={style.reactionDetailsContainer}>
        {takePhotoBtn}
        {avp}
        {vp}
        {docs}
        {stickerBtn}
        {createPollBtn}
      </View>
    );
  };

  renderHeader = () => <View style={style.header} />;

  render() {
    const { visible, close } = this.props;
    return (
      <Modal transparent animated animationType="fade" visible={visible}>
        <View style={style.bottomSheetContainer}>
          <TouchableWithoutFeedback
            onPress={() => {
              this.sheetRef.current.snapTo(1);
              this.props.close();
            }}>
            <View style={style.fullFlex}>
              <BottomSheet
                ref={this.sheetRef}
                snapPoints={[356 * heightRatio, 0]}
                borderRadius={30}
                initialSnap={1}
                enabledInnerScrolling={false}
                enabledContentTapInteraction
                overdragResistanceFactor={10}
                renderContent={this.renderContent}
                renderHeader={this.renderHeader}
                onCloseEnd={() => {
                  close();
                }}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    );
  }
}
