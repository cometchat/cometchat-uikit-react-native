import React, { useContext } from 'react';
import { Text, View, TouchableOpacity, Modal, TextStyle } from 'react-native';
import { Style } from './style';
import { FontStyleInterface } from '../../base';
import { CometChatContext } from '../../CometChatContext';
import { CometChatContextType } from '../../base/Types';
import { CometChatConfirmDialogStyleInterface } from './CometChatConfirmDialogStyle';


export interface CometChatConfirmDialogInterface {
  onConfirm?: Function;
  onCancel?: Function;
  isOpen?: boolean;
  style?: CometChatConfirmDialogStyleInterface;
  title?: string;
  messageText?: string;
  cancelButtonText?: string;
  confirmButtonText?: string;
}
export const CometChatConfirmDialog = (
  props: CometChatConfirmDialogInterface
) => {
  const { theme } = useContext<CometChatContextType>(CometChatContext);
  const {
    onConfirm,
    onCancel,
    isOpen,
    style,
    title,
    messageText,
    cancelButtonText,
    confirmButtonText,
  } = props;
  const onClick = (option) => {
    if (option === 'confirm') {
      onConfirm();
    }
    if (option === 'cancel') {
      onCancel();
    }
  };

  return (
    <Modal transparent={true} visible={isOpen}>
      <View style={Style.container}>
        <View
          style={[
            Style.viewStyle,
            {
              backgroundColor: theme.palette.getBackgroundColor(),
            },
          ]}
        >
          <Text
            style={[
              Style.titleTextStyle,
              { color: style?.messageTextColor ?? theme.palette.getAccent() },
              style?.titleTextStyle ?? theme.typography.text1,
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              Style.messageTextStyle,
              {
                color: style?.messageTextColor ?? theme.palette.getAccent700(),
              },
              style?.messageTextStyle ?? theme.typography.subtitle1,
            ]}
          >
            {messageText}
          </Text>
          <View style={Style.buttonViewStyle}>
            <TouchableOpacity
              onPress={() => onClick('cancel')}
              style={[
                Style.cancelButtonStyle,
                {
                  backgroundColor: style?.cancelBackground ?? '',
                },
              ]}
            >
              <Text
                style={[
                  Style.cancelButtonTextStyle,
                  {
                    color:
                      style?.cancelButtonTextColor ??
                      theme.palette.getPrimary(),
                  },
                  style?.cancelButtonTextFont ?? theme.typography.text2,
                ]}
              >
                {cancelButtonText.toUpperCase()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onClick('confirm')}
              style={[
                Style.confirmButtonStyle,
                {
                  backgroundColor: style?.confirmBackground ?? '',
                },
              ]}
            >
              <Text
                style={[
                  Style.confirmButtonTextStyle,
                  {
                    color:
                      style?.confirmButtonTextColor ??
                      theme.palette.getPrimary(),
                  },
                  style?.confirmButtonTextFont ?? theme.typography.text2,
                ]}
              >
                {confirmButtonText.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

CometChatConfirmDialog.defaultProps = {
  isOpen: false,
  title: '',
  confirmButtonText: 'Delete',
  cancelButtonText: 'Cancel',
  messageText: 'Are you sure?',
  onConfirm: () => {},
  onCancel: () => {},
  style: {},
};

