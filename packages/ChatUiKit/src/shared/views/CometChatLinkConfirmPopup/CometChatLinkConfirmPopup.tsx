import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../theme";
import { useCometChatTranslation } from "../../resources/CometChatLocalizeNew";
import {
  getLinkConfirmPopupStyleLight,
  getLinkConfirmPopupStyleDark,
} from "./style";

export interface CometChatLinkConfirmPopupInterface {
  /** Whether the popup is visible */
  visible: boolean;
  /** The URL of the tapped link */
  url: string;
  /** Initial display text for edit mode */
  initialEditText?: string;
  /** Initial URL for edit mode */
  initialEditUrl?: string;
  /** When true, opens directly in edit mode with "Insert Link" title.
   *  The confirm view (Edit/Remove) is skipped entirely. */
  insertMode?: boolean;
  /** Called when the popup is dismissed (backdrop press or cancel) */
  onDismiss: () => void;
  /** Called when the user saves an edited link */
  onEdit: (newUrl: string, newText: string) => void;
  /** Called when the user removes the link */
  onRemove: () => void;
}

export const CometChatLinkConfirmPopup = (props: CometChatLinkConfirmPopupInterface) => {
  const {
    visible,
    url,
    initialEditText = "",
    initialEditUrl = "",
    insertMode = false,
    onDismiss,
    onEdit,
    onRemove,
  } = props;

  const theme = useTheme();
  const { t } = useCometChatTranslation();
  const styles = useMemo(
    () =>
      theme.mode === "dark"
        ? getLinkConfirmPopupStyleDark(theme.color, theme.spacing, theme.typography)
        : getLinkConfirmPopupStyleLight(theme.color, theme.spacing, theme.typography),
    [theme]
  );

  const [editMode, setEditMode] = useState(false);
  const [editUrl, setEditUrl] = useState(initialEditUrl || url);
  const [editText, setEditText] = useState(initialEditText);

  // Sync state when popup opens with new data
  useEffect(() => {
    if (visible) {
      setEditMode(insertMode);
      setEditUrl(initialEditUrl || url);
      setEditText(initialEditText);
    }
  }, [visible, url, initialEditUrl, initialEditText, insertMode]);

  const handleDismiss = () => {
    setEditMode(false);
    onDismiss();
  };

  const handleSave = () => {
    if (editUrl.trim()) {
      onEdit(editUrl.trim(), editText.trim() || editUrl.trim());
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <TouchableOpacity
        style={styles.overlayStyle}
        activeOpacity={1}
        onPress={handleDismiss}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.containerStyle}
        >
          {editMode ? (
            <>
              <Text style={styles.titleTextStyle}>
                {insertMode ? t("INSERT_LINK") : t("EDIT_LINK")}
              </Text>
              <TextInput
                testID="link-tap-edit-text-input"
                accessibilityLabel="link-tap-edit-text-input"
                placeholder={t("LINK_TEXT")}
                placeholderTextColor={theme.color.textTertiary as string}
                value={editText}
                onChangeText={setEditText}
                style={styles.inputStyle}
                autoFocus
              />
              <TextInput
                testID="link-tap-edit-url-input"
                accessibilityLabel="link-tap-edit-url-input"
                placeholder={t("URL")}
                placeholderTextColor={theme.color.textTertiary as string}
                value={editUrl}
                onChangeText={setEditUrl}
                style={styles.inputStyle}
                keyboardType="url"
                autoCapitalize="none"
              />
              <View style={styles.buttonRowStyle}>
                <TouchableOpacity
                  testID="link-tap-edit-cancel"
                  style={styles.cancelButtonStyle}
                  onPress={handleDismiss}
                >
                  <Text style={styles.cancelButtonTextStyle}>{ t("CANCEL") }</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="link-tap-edit-confirm"
                  disabled={!editUrl.trim()}
                  style={[
                    styles.confirmButtonStyle,
                    !editUrl.trim() && { opacity: 0.4 },
                  ]}
                  onPress={handleSave}
                >
                  <Text style={styles.confirmButtonTextStyle}>
                    {insertMode ? t("INSERT") : t("SAVE")}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.confirmSectionStyle}>
                <Text style={styles.titleTextStyle}>{ t("LINK") }</Text>
                <Text
                  testID="link-tap-url-display"
                  style={styles.urlTextStyle}
                  numberOfLines={2}
                >
                  {url}
                </Text>
              </View>
              <View
                style={[styles.buttonRowStyle, styles.confirmSectionDividerStyle]}
              >
                <TouchableOpacity
                  testID="link-tap-edit"
                  style={styles.cancelButtonStyle}
                  onPress={() => setEditMode(true)}
                >
                  <Text style={styles.cancelButtonTextStyle}>{ t("EDIT") }</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="link-tap-remove"
                  style={styles.removeButtonStyle}
                  onPress={onRemove}
                >
                  <Text style={styles.removeButtonTextStyle}>{ t("REMOVE") }</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};
