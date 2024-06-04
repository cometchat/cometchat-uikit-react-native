//@ts-ignore
import {
  View,
  TextInput,
  TextStyle,
  StyleProp,
  ViewStyle,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from 'react-native';
import React, { RefObject, useContext } from 'react';
import { styles } from './styles';
import { FontStyleInterface } from '../../base';
import { localize } from '../../resources/CometChatLocalize';
import { CometChatContext } from '../../CometChatContext';
import { CometChatContextType } from '../../base/Types';

export interface CometChatMessageInputStyleInterface {
  baseStyle?: StyleProp<ViewStyle>;
  inputBackground?: string;
  dividerTint?: string;
  textFont?: FontStyleInterface;
  textColor?: string;
  placeholderTextColor?: string;
  placeholderTextFont?: FontStyleInterface;
}
export interface CometChatMessageInputInterface {
  /**
   *
   *
   * @type {string}
   * @description text for the input
   */
  text?: string;
  /**
   *
   *
   * @type {string}
   * @description placeholder text
   */
  placeHolderText?: string;
  /**
   *
   *
   * @description callback when input state changes
   */
  onChangeText?: (arg0: string) => void;
  /**
   *
   *
   * @type {CometChatMessageInputStyleInterface}
   * @description custom styles for CometChatMessageInput
   */
  style?: CometChatMessageInputStyleInterface;
  /**
   *
   *
   * @type {number}
   * @description max height for the input
   */
  maxHeight?: number;
  /**
   *
   *
   * @type {React.FC}
   * @description React component for Secondary button
   */
  SecondaryButtonView?: React.FC;
  /**
   *
   *
   * @type {React.FC}
   * @description React component for Auxiliary button
   */
  AuxiliaryButtonView?: React.FC;
  /**
   *
   *
   * @type {('left' | 'right')}
   * @description Placement for Auxiliary button
   */
  auxiliaryButtonAlignment?: 'left' | 'right';
  /**
   *
   *
   * @type {React.FC}
   * @description React component for Primary button
   */
  PrimaryButtonView?: React.FC;
  /**
   *
   *
   * @description callback for onSelectionChange
   */
  onSelectionChange?: (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>
  ) => void;
  /**
   *
   *
   * @type {RefObject<any>}
   * @description ref of {TextInput}
   */
  messageInputRef?: RefObject<any>;
}
export const CometChatMessageInput = (
  props: CometChatMessageInputInterface
) => {
  const { theme } = useContext<CometChatContextType>(CometChatContext);
  const {
    text,
    placeHolderText,
    onChangeText,
    style,
    maxHeight,
    SecondaryButtonView,
    AuxiliaryButtonView,
    auxiliaryButtonAlignment,
    PrimaryButtonView,
    onSelectionChange,
    messageInputRef
  } = props;

  return (
    <View style={{ backgroundColor: 'transparent' }}>
      <TextInput
        ref={messageInputRef}
        style={[
          styles.textInput,
          {
            backgroundColor: style.inputBackground ?? 'transparent',
            color: style.textColor ?? theme.palette.getAccent(),
            maxHeight: maxHeight ?? 25 * 3,
          },
          text.length
            ? style.textFont ?? theme.typography.body
            : style.placeholderTextFont ?? theme.typography.body,
        ]}
        onChangeText={onChangeText}
        value={text}
        placeholderTextColor={
          style.placeholderTextColor
            ? style.placeholderTextColor
            : theme.palette.getAccent600()
        }
        multiline
        textAlignVertical="top"
        placeholder={placeHolderText}
        onSelectionChange={onSelectionChange}
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 6,
          borderTopWidth: 1,
          borderTopColor: style.dividerTint
            ? style.dividerTint
            : theme.palette.getAccent200(),
        }}
      >
        <View style={{ flexDirection: 'row' }}>
          {SecondaryButtonView && <SecondaryButtonView />}
          {auxiliaryButtonAlignment === 'left' && AuxiliaryButtonView && (
            <AuxiliaryButtonView />
          )}
        </View>
        <View style={{ flexDirection: 'row' }}>
          {auxiliaryButtonAlignment === 'right' && AuxiliaryButtonView && (
            <AuxiliaryButtonView />
          )}
          {PrimaryButtonView && <PrimaryButtonView />}
        </View>
      </View>
    </View>
  );
};

CometChatMessageInput.defaultProps = {
  placeHolderText: localize('ENTER_YOUR_MESSAGE_HERE'),
  auxiliaryButtonAlignment: 'right',
  style: {},
  text: '',
};
