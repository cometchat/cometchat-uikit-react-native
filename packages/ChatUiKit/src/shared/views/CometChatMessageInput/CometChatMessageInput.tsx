import React, { JSX, RefObject } from "react";
import {
  ColorValue,
  NativeSyntheticEvent,
  TextInput,
  TextInputSelectionChangeEventData,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../../theme";
import { CometChatTheme } from "../../../theme/type";
import { CometChatUIEventHandler, CometChatUIEvents } from "../../events";
import { ViewAlignment } from "../../constants/UIKitConstants";
import { useCometChatTranslation } from "../../resources/CometChatLocalizeNew";

/**
 * Props for the CometChatMessageInput component.
 */
export interface CometChatMessageInputInterface {
  /**
   * Text for the input.
   *
   * @type {string}
   */
  text?: string;
  /**
   * Placeholder text for the input.
   *
   * @type {string}
   */
  placeHolderText?: string;
  /**
   * Callback function invoked when the input text changes.
   *
   * @param {string} newText - The new text entered.
   */
  onChangeText?: (arg0: string) => void;
  /**
   * Custom style for the message input.
   */
  style?: CometChatTheme["messageComposerStyles"]["messageInputStyles"];
  /**
   * Maximum height for the input.
   *
   * @type {number}
   */
  maxHeight?: number;
  /**
   * React component for the voice recording button.
   *
   * @type {JSX.Element}
   */
  VoiceRecordingButtonView?: JSX.Element;
  /**
   * React component for the secondary button.
   *
   * @type {JSX.Element}
   */
  SecondaryButtonView?: JSX.Element;
  /**
   * React component for the auxiliary button.
   *
   * @type {JSX.Element}
   */
  AuxiliaryButtonView?: JSX.Element;
  /**
   * Placement for the auxiliary button.
   *
   * @type {"left" | "right"}
   */
  auxiliaryButtonAlignment?: "left" | "right";
  /**
   * React component for the primary button.
   *
   * @type {React.FC}
   */
  PrimaryButtonView?: React.FC;
  /**
   * Callback for when the text selection changes.
   *
   * @param {NativeSyntheticEvent<TextInputSelectionChangeEventData>} event - The selection change event.
   */
  onSelectionChange?: (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => void;
  /**
   * Reference for the TextInput component.
   *
   * @type {RefObject<any>}
   */
  messageInputRef?: RefObject<any>;
  /**
   * Selection state for the TextInput to control cursor position.
   *
   * @type {{ start: number; end: number } | undefined}
   */
  selection?: { start: number; end: number };
}

/**
 * CometChatMessageInput renders a message input field with a divider and action buttons.
 * It supports auxiliary, secondary, and primary buttons along with search input functionality.
 *
 *   Props for the component.
 *   The rendered message input component.
 */
export const CometChatMessageInput = (props: CometChatMessageInputInterface) => {
  const theme = useTheme();
  const {t}= useCometChatTranslation()
  const {
    text = "",
    placeHolderText = t("ENTER_YOUR_MESSAGE_HERE"),
    onChangeText,
    style,
    SecondaryButtonView,
    AuxiliaryButtonView,
    auxiliaryButtonAlignment = "left",
    PrimaryButtonView,
    onSelectionChange,
    messageInputRef,
    VoiceRecordingButtonView,
    selection,
  } = props;

  return (
    <View style={style?.containerStyle as ViewStyle}>
      <TextInput
        ref={messageInputRef}
        style={style?.textStyle as TextStyle}
        onChangeText={onChangeText}
        placeholderTextColor={style?.placeHolderTextColor as ColorValue}
        multiline
        textAlignVertical='top'
        placeholder={placeHolderText}
        onSelectionChange={onSelectionChange}
        selection={selection}
        value={text}
        onFocus={() => {
          CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.hidePanel, {
            alignment: ViewAlignment.composerBottom,
            child: () => null, // Hide the panel content.
          });
        }}
      />
      <View style={style?.dividerStyle as ViewStyle} />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          borderTopColor: theme.color.background1,
          paddingHorizontal: 12,
          paddingBottom: 8,
          paddingTop: 4,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.spacing.s4 }}>
          {SecondaryButtonView}
          {VoiceRecordingButtonView}
          {auxiliaryButtonAlignment === "left" && AuxiliaryButtonView}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.spacing.s4 }}>
          {auxiliaryButtonAlignment === "right" && AuxiliaryButtonView}
          {PrimaryButtonView && <PrimaryButtonView />}
        </View>
      </View>
    </View>
  );
};
