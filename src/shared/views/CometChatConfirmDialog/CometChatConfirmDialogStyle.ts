import { FontStyleInterface } from "../../base";

export interface CometChatConfirmDialogStyleInterface {
  messageTextColor?: string;
  titleTextStyle?: FontStyleInterface;
  // messageTextFont?: FontStyleInterface;
  messageTextStyle?: FontStyleInterface;
  cancelBackground?: string;
  cancelButtonTextColor?: string;
  cancelButtonTextFont?: FontStyleInterface;
  confirmBackground?: string;
  confirmButtonTextColor?: string;
  confirmButtonTextFont?: FontStyleInterface;
}


export class CometChatConfirmDialogStyle implements CometChatConfirmDialogStyleInterface {
  messageTextColor?: string;
  titleTextStyle?: FontStyleInterface;
  // messageTextFont?: FontStyleInterface;
  messageTextStyle?: FontStyleInterface;
  cancelBackground?: string;
  cancelButtonTextColor?: string;
  cancelButtonTextFont?: FontStyleInterface;
  confirmBackground?: string;
  confirmButtonTextColor?: string;
  confirmButtonTextFont?: FontStyleInterface;

  constructor(props: CometChatConfirmDialogStyleInterface) {
    if (props)
      for (const [key, value] of Object.entries(props)) {
        this[key] = value;
      }
  }
}