import { TextStyle } from 'react-native';
import { ImageType } from '../base';

export interface CometChatCallLogDetailsOption {
  id?: string | number;
  ///[title] passes title to option
  title?: string;
  ///to pass icon url
  icon?: ImageType;
  ///[titleStyle] styling property for [title]
  titleStyle?: TextStyle;
  backgroundColor?: string;
  iconTint?: string;
  ///to pass custom view to options
  CustomView?: () => JSX.Element;
  /// to pass tail component for detail option
  Tail?:() => JSX.Element;
  ///to pass height for details
  height?: number;
  ///[onClick] call function which takes 3 parameter , and one of user or group is populated at a time
  onClick?: (callLog: any) => void;
}

