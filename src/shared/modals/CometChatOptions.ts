import { FontStyleInterface, ImageType } from '../base';

type CometChatOptionTitleStyle = FontStyleInterface & { color?: string };

export interface CometChatOptions {
  id: string;
  title?: string;
  icon?: ImageType;
  titleStyle?: CometChatOptionTitleStyle;
  backgroundColor?: string;
  iconTint?: string;
  onPress?: Function;
}
