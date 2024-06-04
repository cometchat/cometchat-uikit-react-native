//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { FontStyleInterface, ImageType } from '../base';

export type CometChatMessageOption = {
  id: string;
  title: string;
  icon?: ImageType;
  packageName?: string;
  iconTint?: string;
  titleStyle?: FontStyleInterface;
  CustomView?: (message: CometChat.BaseMessage) => JSX.Element;
  onPress?: (message: CometChat.BaseMessage) => void;
};
