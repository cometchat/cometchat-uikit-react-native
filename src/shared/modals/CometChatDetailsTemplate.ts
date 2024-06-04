import { TextStyle } from 'react-native';
import { FontStyleInterface } from '../base';
import { CometChatDetailsOption } from './CometChatDetailsOption';

export interface CometChatDetailsTemplate {
  id?: string | number;
  title?: string;
  titleColor?: string;
  titleFont?: FontStyleInterface;
  titleStyle?: TextStyle;
  sectionSeparatorColor?: string;
  itemSeparatorColor?: string;
  hideSectionSeparator?: boolean;
  hideItemSeparator?: boolean;
  options?: CometChatDetailsOption[];
}