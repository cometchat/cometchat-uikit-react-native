import { BaseStyle, FontStyleInterface, BorderStyleInterface } from "../shared";
import { Card } from "./CardView";

export interface AIConfigurations {
    "smart-replies"?: { enabled: boolean, configuration?: any},
    "conversation-starter"?: { enabled: boolean, configuration?: any}
  }
  export interface ICard {
    smartReply?: Card,
    conversationStarter?: Card
  }
  
  export class AIButtonsStyle extends BaseStyle {
    repliesTextFont?:FontStyleInterface;
    repliesTextBorder?:BorderStyleInterface;
    repliesTextBorderRadius?:string;
    repliesTextColor?:string;
    repliesTextBackgroundColor?:string;
    emptyStateTextFont?: FontStyleInterface;
    emptyStateTextColor?: string;
    loadingStateTextFont?: FontStyleInterface;
    loadingStateTextColor?: string;
    loadingIconTint?:string;
    emptyIconTint?:string;
    errorIconTint?:string;
    errorStateTextFont?: FontStyleInterface;
    errorStateTextColor?:string;
    constructor(props: Partial<AIButtonsStyle>) {
      super({...props})
      Object.assign(this, props);
    }
  }


  export enum State {
    loading = "loading",
    error = "error",
    empty = "empty",
  }