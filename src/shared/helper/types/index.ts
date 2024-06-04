//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { FontStyleInterface } from '../../base';
import { ImageURISource } from 'react-native';

export type ImageType = ImageURISource;

export interface CometChatMessageComposerActionInterface {
  id?: any;
  title?: string;
  iconUrl?: ImageType;
  iconTint?: string;
  iconBackground?: string;
  titleFont?: FontStyleInterface;
  titleColor?: string;
  titleAppearance?: any;
  background?: string;
  cornerRadius?: number;
  CustomView?: (
    user: CometChat.User,
    group: CometChat.Group,
    id: string | number,
    props: object
  ) => JSX.Element;
  onPress?: Function;
}
