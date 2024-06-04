import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import {
  FontStyleInterface,
  ImageType,
} from '../../shared/base';
import { CometChatSoundManager } from "../../shared/resources";
import { CometChatContext } from "../../shared/CometChatContext";
import { ICONS } from './resources';

export interface SmartRepliesInterface {
  customOutgoingMessageSound?: any;
  enableSoundForMessages?: boolean;
  onClose?: () => void;
  replies?: any[];
  style?: {
    textBackground?: string;
    textFont?: FontStyleInterface;
    textColor?: string;
    backgroundColor?: string;
    iconTint?: string;
  };
  onClick?: (option) => void;
  closeIcon?: ImageType;
}
const SmartRepliesView = (props: SmartRepliesInterface) => {
  const {
    customOutgoingMessageSound,
    enableSoundForMessages,
    onClose,
    replies,
    style,
    onClick,
    closeIcon,
  } = props;
  const { theme } = useContext(CometChatContext);

  /**
   * Play Outgoing Audio sound on send
   */
  const playOutgoingAudio = () => {
    if (enableSoundForMessages) {
      if (customOutgoingMessageSound) {
        CometChatSoundManager.play(
          CometChatSoundManager.SoundOutput.outgoingMessage,
          customOutgoingMessageSound
        );
      } else {
        CometChatSoundManager.play(
          CometChatSoundManager.SoundOutput.outgoingMessage
        );
      }
    }
  };

  /**
   *
   * @param {*} smartReply
   * performs send Message Function
   */

  /**
   *
   * @returns Single smart reply option
   */
  const CometChatSmartReplyOptions = () => {
    if (replies && replies.length) {
      return replies.map((option) => {
        return (
          <TouchableOpacity
            onPress={() => {
              playOutgoingAudio();
              onClick(option);
            }}
            style={[
              Styles.buttonWrapperStyle,
              {
                shadowColor: theme?.palette?.getAccent(),
                shadowOffset: {
                  width: 0,
                  height: 1,
                },
                shadowOpacity: 0.22,
                shadowRadius: 2.22,
                elevation: 3,
              },
            ]}
            key={option}
          >
            <View
              style={[
                Styles.previewOptionStyle,
                {
                  backgroundColor:
                    style?.textBackground ||
                    theme?.palette?.getBackgroundColor(),
                  borderWidth: 0.2,
                  borderColor: theme?.palette?.getAccent100(),
                },
              ]}
            >
              <Text
                style={[
                  style?.textFont || theme?.typography?.subtitle1,
                  {
                    color: style?.textColor || theme?.palette?.getAccent(),
                  },
                ]}
              >
                {option}
              </Text>
            </View>
          </TouchableOpacity>
        );
      });
    }
    return null;
  };

  /**
   *
   * @returns items to be rendered
   */
  const renderItems = () => {
    if (replies?.length) {
      return (
        <View
          style={[
            Styles.previewWrapperStyle,
            {
              backgroundColor:
                style?.backgroundColor || theme?.palette?.getBackgroundColor(),
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              justifyContent: 'center',
              alignItems: 'center',
              height: 50,
            }}
          >
            {CometChatSmartReplyOptions()}
          </ScrollView>

          <TouchableOpacity onPress={onClose ? onClose : () => {}}>
            <Image
              source={closeIcon ?? ICONS.CLOSE}
              style={[
                Styles.previewCloseStyle,
                {
                  tintColor: style?.iconTint || theme?.palette?.getAccent600(),
                },
              ]}
            />
          </TouchableOpacity>
        </View>
      );
    } else {
      return null;
    }
  };

  return renderItems();
};

const Styles = StyleSheet.create({
  previewWrapperStyle: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 10,
  },
  previewHeadingStyle: {
    alignSelf: 'flex-start',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  previewCloseStyle: {
    width: 16,
    height: 16,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  buttonWrapperStyle: {
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.51,
    shadowRadius: 13.16,
    elevation: 3,
    marginHorizontal: 4,
    borderRadius: 50,
  },
  previewOptionStyle: {
    padding: 10,
    marginVertical: 0,
    borderRadius: 20,
    textAlign: 'center',
  },
});
SmartRepliesView.defaultProps = {
  customOutgoingMessageSound: null,
  enableSoundForMessages: false,
  style: {},
  replies: [],
};
export { SmartRepliesView };
