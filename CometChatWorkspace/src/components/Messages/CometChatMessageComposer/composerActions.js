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
import { CometChatContext } from '../../../utils/CometChatContext';

export default class ComposerActions extends Component {
  sheetRef = React.createRef(null);
  static contextType = CometChatContext;
  constructor(props) {
    super(props);
    this.state = {
      restrictions: null,
      snapPoints: null,
    };
  }
  componentDidUpdate(prevProps) {
    if (!prevProps.visible && this.props.visible) {
      this.sheetRef?.current?.snapTo(0);
    }
  }

  componentDidMount() {
    this.checkRestrictions();
  }
  checkRestrictions = async () => {
    let isPollsEnabled = await this.context.FeatureRestriction.isPollsEnabled();
    let isStickersEnabled =
      await this.context.FeatureRestriction.isStickersEnabled();
    let isFilesEnabled = await this.context.FeatureRestriction.isFilesEnabled();
    let isPhotosVideosEnabled =
      await this.context.FeatureRestriction.isPhotosVideosEnabled();
    let height = 0;
    if (isPollsEnabled) {
      height++;
    }
    if (isStickersEnabled) {
      height++;
    }
    if (isFilesEnabled) {
      height++;
    }
    if (isPhotosVideosEnabled) {
      height += 4;
    }
    this.setState({
      restrictions: {
        isPollsEnabled,
        isStickersEnabled,
        isFilesEnabled,
        isPhotosVideosEnabled,
      },
      snapPoints: [height * 60 * heightRatio, 0],
    });
  };

  takePhoto = async (mediaType = 'photo') => {
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

      if (
        Platform.OS === 'ios' ||
        granted === PermissionsAndroid.RESULTS.GRANTED
      ) {
        launchCamera(
          {
            mediaType,
            includeBase64: false,
            cameraType: 'back',
          },
          (response) => {
            this.sheetRef?.current?.snapTo(1);
            this.props.close();
            if (response.didCancel) {
              return null;
            }
            let type = null;
            let name = null;
            if (Platform.OS === 'ios' && response.assets[0].fileName !== undefined) {
              name = response.assets[0].fileName;
              type = response.assets[0].type;
            } else {
              type = response.assets[0].type;
              name = 'Camera_001.jpeg';
            }
            if (mediaType == 'video') {
              type = 'video/quicktime';
              name = 'Camera_002.mov';
            }
            const file = {
              name:
                Platform.OS === 'android' && mediaType != 'video'
                  ? response.assets[0].fileName
                  : name,
              type:
                Platform.OS === 'android' && mediaType != 'video'
                  ? response.assets[0].type
                  : type,
              uri:
                Platform.OS === 'android'
                  ? response.assets[0].uri
                  : response.assets[0].uri.replace('file://', ''),
            };
            this.props.sendMediaMessage(
              file,
              mediaType === 'photo'
                ? CometChat.MESSAGE_TYPE.IMAGE
                : CometChat.MESSAGE_TYPE.VIDEO,
            );
          },
        );
      }
    } catch (err) {
      this.sheetRef?.current?.snapTo(1);
      this.props.close();
    }
  };

  launchLibrary = (mediaType) => {
    try{
    launchImageLibrary(
      {
        mediaType: mediaType,
        includeBase64: false,
        cameraType: 'back',
      },
      (response) => {
        this.sheetRef?.current?.snapTo(1);
        this.props.close();
        if (response.didCancel) {
          return null;
        }
        let type = null;
        let name = null;
        if (Platform.OS === 'ios' && response.assets[0].fileName !== undefined) {
          name = response.assets[0].fileName;
          type = response.assets[0].type;
        } else {
          type = response.assets[0].type;
          name = 'Camera_001.jpeg';
        }
        if (mediaType == 'video') {
          type = 'video/quicktime';
          name = 'Camera_002.mov';
        }
        const file = {
          name:name,
          type:
            Platform.OS === 'android' && mediaType != 'video'
              ? response.assets[0].type
              : type,
          uri:
            Platform.OS === 'android'
              ? response.assets[0].uri
              : response.assets[0].uri.replace('file://', ''),
        };
        this.props.sendMediaMessage(
          file,
          mediaType === 'photo'
            ? CometChat.MESSAGE_TYPE.IMAGE
            : CometChat.MESSAGE_TYPE.VIDEO,
        );
      },
    );
    }catch (err) {
      this.sheetRef?.current?.snapTo(1);
      this.props.close();
    }
  };

  pickDocument = async () => {
    this.sheetRef?.current?.snapTo(1);
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      const file = {
        name: res[0].name,
        type: res[0].type,
        uri: res[0].uri,
      };
      this.props.sendMediaMessage(file, CometChat.MESSAGE_TYPE.FILE);
      this.sheetRef?.current?.snapTo(1);
      this.props.close();
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker, exit any dialogs or menus and move on
      } else {
        throw err;
      }
    }
  };

  TakePhotoOption = () => {
    return (
      <TouchableOpacity
        style={style.actionButtonContainer}
        onPress={() => this.takePhoto()}>
        <EvilIcon name="camera" size={24} />
        <Text style={{ fontSize: 18, marginLeft: 10, fontWeight: '500' }}>
          Take Photo
        </Text>
      </TouchableOpacity>
    );
  }
  TakeVideoOption = () => {
    return (
      <TouchableOpacity
        style={style.actionButtonContainer}
        onPress={() => this.takePhoto('video')}>
        <IonIcon name="videocam-outline" size={24} />
        <Text
          style={{
            fontSize: 18,
            marginLeft: 10,
            fontWeight: '500',
          }}>
          Take Video
        </Text>
      </TouchableOpacity>
    );
  }
  PhotoLibraryOption = () => {
    return (
      <TouchableOpacity
        style={style.actionButtonContainer}
        onPress={() => this.launchLibrary('photo')}>
        <IonIcon name="image-outline" size={24} />

        <Text
          style={{
            fontSize: 18,
            marginLeft: 10,
            fontWeight: '500',
          }}>
          Photo Library
        </Text>
      </TouchableOpacity>
    );
  }
  VideoLibraryOption = () => {
    return (
      <TouchableOpacity
        style={style.actionButtonContainer}
        onPress={() => this.launchLibrary('video')}>
        <IonIcon name="videocam-outline" size={24} />

        <Text style={{ fontSize: 18, marginLeft: 10, fontWeight: '500' }}>
          Video Library
        </Text>
      </TouchableOpacity>
    );
  }
  DocumentOption = () => {
    return (
      <TouchableOpacity
        style={style.actionButtonContainer}
        onPress={this.pickDocument}>
        <IonIcon name="ios-folder-outline" size={24} />

        <Text style={{ fontSize: 18, marginLeft: 10, fontWeight: '500' }}>
          Document
        </Text>
      </TouchableOpacity>
    );
  }

  StickerOption = () => {
    return (
      <TouchableOpacity style={style.actionButtonContainer}>
        <MCIIcon name="sticker-circle-outline" size={24} />

        <Text
          style={{ fontSize: 18, marginLeft: 10, fontWeight: '500' }}
          onPress={() => this.props.toggleStickers()}>
          Send Sticker
        </Text>
      </TouchableOpacity>
    );
  }

  CreatePollOption = () => {
    return (
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
  }

  renderContent = () => {
    return (
      <View style={style.reactionDetailsContainer}>
        {
          this.state.restrictions?.isPhotosVideosEnabled && 
          <>
          {this.TakePhotoOption()}
          {this.TakeVideoOption()}
          {this.PhotoLibraryOption()}
          {this.VideoLibraryOption()}
          </>
        }
        { this.state.restrictions?.isFilesEnabled && this.DocumentOption() }
        { this.state.restrictions?.isStickersEnabled && this.StickerOption() }
        { this.state.restrictions?.isPollsEnabled && this.CreatePollOption() }
      </View>
    );
  };

  renderHeader = () => <View style={style.header} />;

  render() {
    const { visible, close } = this.props;
    return (
      <Modal transparent animated animationType="fade" visible={visible}
          onRequestClose={() => { 
            this.sheetRef?.current?.snapTo(1);
            this.props.close()
          }}>
        <View style={style.bottomSheetContainer}>
          <TouchableWithoutFeedback
            onPress={() => {
              this.sheetRef?.current?.snapTo(1);
              this.props.close();
            }}>
            <View style={style.fullFlex}>
                <BottomSheet
                  ref={this.sheetRef}
                  snapPoints={this.state.snapPoints || 0}
                  borderRadius={30}
                  initialSnap={1}
                  enabledInnerScrolling={false}
                  enabledContentTapInteraction
                  overdragResistanceFactor={10}
                  renderContent={this.renderContent}
                  renderHeader={this.renderHeader}
                />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    );
  }
}
