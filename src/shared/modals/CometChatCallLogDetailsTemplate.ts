import { TextStyle } from 'react-native';
import { FontStyleInterface } from '../base';
import { CometChatCallLogDetailsOption } from './CometChatCallLogDetailsOptions';

export interface CometChatCallLogDetailsTemplate {
  id?: string | number;
  title?: string;
  titleColor?: string;
  titleFont?: FontStyleInterface;
  titleStyle?: TextStyle;
  sectionSeparatorColor?: string;
  itemSeparatorColor?: string;
  hideSectionSeparator?: boolean;
  hideItemSeparator?: boolean;
  options?: CometChatCallLogDetailsOption[];
}