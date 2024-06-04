import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';
import {
  FontStyleInterface,
  ImageType,
} from '../../shared/base';
import { localize } from "../../shared/resources/CometChatLocalize";
import { CometChatConfirmDialog } from "../../shared/views";
import { ExtensionConstants } from '../ExtensionConstants';
import { getExtentionData } from '../ExtensionModerator';
import { ICONS } from './resources';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';

export interface ImageModerationFilterInterface {
  message?: CometChat.BaseMessage;
  ChildView: any;
  warningText?: string;
  style?: {
    warningTextStyle?: FontStyleInterface;
    warningImageStyle?: StyleProp<ImageStyle>;
    warningImageTint?: string;
    filterColor?: string;
  };
  warningImage?: ImageType;
}
export const ImageModerationFilter = (
  props: ImageModerationFilterInterface
) => {
  const { message, ChildView, warningText, style, warningImage } = props;
  const [hideUnSafe, setHideUnSafe] = useState(true);
  const [showConfirm, setShowConfirm] = useState({
    show: false,
    title: '',
    confirmButtonText: '',
    onConfirm: () => {},
    onCancel: () => {},
    cancelButtonText: '',
    messageText: '',
  });

  const enableUnSafe = () => {
    setShowConfirm({
      title: localize('UNSAFE_CONTENT'),
      messageText: localize('UNSAFE_CONFIRMATION'),
      confirmButtonText: localize('YES'),
      cancelButtonText: localize('NO'),
      show: true,
      onConfirm: () => {
        setShowConfirm((prev) => ({ ...prev, show: false }));
        setHideUnSafe(false);
      },
      onCancel: () => {
        setShowConfirm((prev) => ({ ...prev, show: false }));
      },
    });
  };
  const CheckModeration = () => {
    let imagemoderation = getExtentionData(
      message,
      ExtensionConstants.imageModeration
    );
    if (imagemoderation?.unsafe == 'yes' && hideUnSafe) {
      return (
        <TouchableOpacity
          style={[
            styles.overlayContainer,
            {
              backgroundColor: style?.filterColor ?? 'rgba(0,0,0,0.9)',
            },
          ]}
          onPress={enableUnSafe}
        >
          <Image
            source={warningImage ?? ICONS.UNSAFE}
            style={[
              styles.unsafeImage,
              { tintColor: style?.warningImageTint ?? '' },
              style?.warningImageStyle,
            ]}
          />
          <Text style={[styles.unsafeText, style?.warningTextStyle]}>
            {warningText ?? localize('UNSAFE_CONTENT')}
          </Text>
        </TouchableOpacity>
      );
    }
    return ChildView;
  };

  return (
    <View style={styles.container}>
      <CheckModeration />
      <CometChatConfirmDialog
        isOpen={showConfirm.show}
        title={showConfirm.title}
        confirmButtonText={showConfirm.confirmButtonText}
        onConfirm={showConfirm.onConfirm}
        onCancel={showConfirm.onCancel}
        messageText={showConfirm.messageText}
        cancelButtonText={showConfirm.cancelButtonText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 200,
    width: 200,
  },
  imageStyle: {
    height: '100%',
    width: '100%',
    borderRadius: 10,
  },
  overlayContainer: {
    height: '100%',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  unsafeImage: {
    height: 44,
    width: 38,
  },
  unsafeText: {
    color: 'rgba(255, 255, 255, 0.58)',
    alignSelf: 'center',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});
