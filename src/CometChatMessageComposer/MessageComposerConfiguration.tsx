import React from 'react';
import { ImageType } from '../shared';
import {
  CometChatMessageComposerInterface,
  MessageComposerStyleInterface,
} from './CometChatMessageComposer';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { MediaRecorderStyle } from '../shared/views/CometChatMediaRecorder';
export interface MessageComposerConfigurationInterface
  extends Omit<
    CometChatMessageComposerInterface,
    | 'id'
    | 'user'
    | 'group'
    | 'disableSoundForMessages'
    | 'customSoundForMessage'
    | 'disableTypingEvents'
    | 'placeHolderText'
    | 'parentMessageId'
  > {}
export class MessageComposerConfiguration {
  attachmentIcon?: ImageType;
  attachmentOptions?: any;
  auxiliaryButtonsAlignment?: 'left' | 'right';
  AuxiliaryButtonView?: (
    {
      user,
      group,
      composerId,
    }: {
      user?: CometChat.User;
      group?: CometChat.Group;
      composerId: string | number;
    }) => JSX.Element;
  FooterView?: React.FC;
  HeaderView?: React.FC;
  hideLiveReaction?: boolean;
  liveReactionIcon?: ImageType;
  maxHeight?: number;
  messageComposerStyle?: MessageComposerStyleInterface;
  hideVoiceRecording?: boolean;
  voiceRecordingIconURL?: string;
  mediaRecorderStyle?: MediaRecorderStyle;
  pauseIconUrl?: ImageType;
  playIconUrl?: ImageType;
  recordIconUrl?: ImageType;
  deleteIconUrl?: ImageType;
  stopIconUrl?: ImageType;
  submitIconUrl?: ImageType;
  onChangeText?: (text: string) => void;
  onError?: (error: CometChat.CometChatException) => void;
  onSendButtonPress?: (message: CometChat.BaseMessage) => void;
  SecondaryButtonView?: (
    {
      user,
      group,
      composerId,
    }: {
      user?: CometChat.User;
      group?: CometChat.Group;
      composerId: string | number;
    }) => JSX.Element;
  SendButtonView?: (
    {
      user,
      group,
      composerId,
    }: {
      user?: CometChat.User;
      group?: CometChat.Group;
      composerId: string | number;
    }) => JSX.Element;
  text?: string;
  constructor(props: MessageComposerConfigurationInterface) {
    if (props)
      for (const [key, value] of Object.entries(props)) {
        this[key] = value;
      }
  }
}
