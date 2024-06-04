import { ImageType } from '../shared';
import {
  CometChatCreateGroupInterface,
  CreateGroupStyleInterface,
} from './CometChatCreateGroup';
//@ts-ignore
import { CometChat } from '@cometchat/chat-sdk-react-native';

export interface CreateGroupConfigurationInterface
  extends Omit<
    CometChatCreateGroupInterface,
    | 'passwordPlaceholderText'
    | 'namePlaceholderText'
    | 'title'
    | 'disableCloseButton'
  > {}
export class CreateGroupConfiguration {
  closeIcon?: ImageType;
  createGroupStyle?: CreateGroupStyleInterface;
  createIcon?: ImageType;
  onBack?: () => void;
  onCreatePress?: (
    groupName: string,
    groupType: string,
    password: string
  ) => void;
  onError?: (error: CometChat.CometChatException) => void;

  constructor(props: CreateGroupConfigurationInterface) {
    if (props)
      for (const [key, value] of Object.entries(props)) {
        this[key] = value;
      }
  }
}
