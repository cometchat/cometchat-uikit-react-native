import { FontStyleInterface, BorderStyleInterface } from "../../shared";
import { AIButtonsStyle } from "../utils";

export class AISmartRepliesStyle extends AIButtonsStyle {
    buttonTextColor?:string;
    buttonTextFont?:FontStyleInterface;
    buttonBorder?:BorderStyleInterface;
    buttonBorderRadius?:string;
    buttonHeight?:string;
    buttonWidth?:string;
    buttonBackgroundColor?:string;
    constructor(props: Partial<AIButtonsStyle>) {
      super({...props})
      Object.assign(this, props);
    }
  }