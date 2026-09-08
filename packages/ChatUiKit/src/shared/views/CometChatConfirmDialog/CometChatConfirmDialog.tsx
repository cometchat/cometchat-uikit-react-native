import React, { JSX } from "react";
import {
  ImageSourcePropType,
  ImageStyle,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../../theme";
import { Icon } from "../../icons/Icon";

/**
 * Props for the CometChatConfirmDialog component.
 */
export interface CometChatConfirmDialogInterface {
  /**
   * Callback invoked when the confirm action is triggered.
   */
  onConfirm?: () => void;
  /**
   * Callback invoked when the cancel action is triggered.
   */
  onCancel?: () => void;
  /**
   * Callback invoked when the dialog is dismissed (iOS specific).
   */
  onDismiss?: () => void;
  /**
   * Flag to determine if the dialog is visible.
   */
  isOpen?: boolean;
  /**
   * Custom style for the container view.
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Icon to be displayed. Can be an image source or a JSX element.
   */
  icon?: ImageSourcePropType | JSX.Element;
  /**
   * Custom style for the icon image.
   */
  iconImageStyle?: StyleProp<ImageStyle>;
  /**
   * Custom style for the icon container.
   */
  iconContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Custom style for the title text.
   */
  titleTextStyle?: StyleProp<TextStyle>;
  /**
   * Custom style for the message text.
   */
  messageTextStyle?: StyleProp<TextStyle>;
  /**
   * Custom style for the cancel button container.
   */
  cancelButtonStyle?: StyleProp<ViewStyle>;
  /**
   * Custom style for the confirm button container.
   */
  confirmButtonStyle?: StyleProp<ViewStyle>;
  /**
   * Custom style for the cancel button text.
   */
  cancelButtonTextStyle?: StyleProp<TextStyle>;
  /**
   * Custom style for the confirm button text.
   */
  confirmButtonTextStyle?: StyleProp<TextStyle>;
  /**
   * The title text of the dialog.
   */
  titleText?: string;
  /**
   * The message text of the dialog.
   */
  messageText?: string;
  /**
   * The text to display on the cancel button.
   */
  cancelButtonText?: string;
  /**
   * The text to display on the confirm button.
   */
  confirmButtonText?: string;
}

/**
 * CometChatConfirmDialog is a modal dialog component that displays a confirmation prompt.
 * It is typically used to confirm actions such as deletion.
 *
 * Props for the confirm dialog component.
 * The rendered confirmation dialog.
 */
export const CometChatConfirmDialog = (props: CometChatConfirmDialogInterface) => {
  const {
    onConfirm,
    onCancel,
    onDismiss = () => null,
    isOpen,
    icon,
    containerStyle = {},
    iconImageStyle = {},
    iconContainerStyle = {},
    titleTextStyle = {},
    messageTextStyle = {},
    cancelButtonStyle = {},
    confirmButtonStyle = {},
    cancelButtonTextStyle = {},
    confirmButtonTextStyle = {},
    titleText = "",
    messageText = "",
    cancelButtonText = "Cancel",
    confirmButtonText = "Delete",
  } = props;

  const theme = useTheme();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isOpen}
      onRequestClose={onCancel}
      onDismiss={onDismiss}
    >
      <Pressable onPress={onCancel} style={styles.wrapper}>
        <View style={[theme.confirmDialogStyles.containerStyle, containerStyle]}>
          {icon && (
            <View style={[theme.confirmDialogStyles.iconContainerStyle, iconContainerStyle]}>
              <Icon
                icon={icon}
                imageStyle={[theme.confirmDialogStyles.iconImageStyle, iconImageStyle]}
              />
            </View>
          )}
          {titleText && (
            <Text style={[theme.confirmDialogStyles.titleTextStyle, titleTextStyle]}>
              {titleText}
            </Text>
          )}
          {messageText && (
            <Text style={[theme.confirmDialogStyles.messageTextStyle, messageTextStyle]}>
              {messageText}
            </Text>
          )}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              testID='ConfirmDialog.cancel'
              style={[theme.confirmDialogStyles.cancelButtonStyle, cancelButtonStyle]}
              onPress={(e) => {
                e.stopPropagation();
                onCancel?.();
              }}
            >
              <Text numberOfLines={1} style={[theme.confirmDialogStyles.cancelButtonTextStyle, cancelButtonTextStyle]}>
                {cancelButtonText}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID='ConfirmDialog.confirm'
              style={[theme.confirmDialogStyles.confirmButtonStyle, confirmButtonStyle]}
              onPress={(e) => {
                e.stopPropagation();
                onConfirm?.();
              }}
            >
              <Text numberOfLines={1} style={[theme.confirmDialogStyles.confirmButtonTextStyle, confirmButtonTextStyle]}>
                {confirmButtonText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#141414CC",
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 8,
  },
});