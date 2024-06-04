import { ImageType } from '../shared';
import {
  CometChatJoinProtectedGroupInterface,
  JoinProtectedGroupStyleInterface,
} from './CometChatJoinProtectedGroup';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';

export interface JoinProtectedGroupConfigurationInterface
  extends Omit<
    CometChatJoinProtectedGroupInterface,
    'group' | 'description' | 'title' | 'hasError' | 'errorText'
  > {}
export class JoinProtectedGroupConfiguration {
  closeIcon?: ImageType;
  joinIcon?: ImageType;
  onBack?: () => void;
  onError?: (error: CometChat.CometChatException) => void;
  joinProtectedGroupStyle?: JoinProtectedGroupStyleInterface;
  onJoinClick?: (group: CometChat.Group, password: string) => void;
  passwordPlaceholderText?: string;

  constructor(props: JoinProtectedGroupConfigurationInterface) {
    if (props)
      for (const [key, value] of Object.entries(props)) {
        this[key] = value;
      }
  }
}
