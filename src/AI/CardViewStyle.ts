import { BaseStyle, BorderStyleInterface, FontStyleInterface } from "../shared";

export class CardViewStyle  extends BaseStyle{
    emptyStateTextFont?: FontStyleInterface;
    emptyStateTextColor?: string = "#bcbcbc";
    errorStateTextFont?: FontStyleInterface;
    errorStateTextColor?: string = "#bcbcbc";
    loadingStateTextFont?: FontStyleInterface;
    loadingStateTextColor?: string = "#bcbcbc";
    loadingIconTint?: string = "#bcbcbc";
    errorIconTint?: string = "#bcbcbc";
    emptyIconTint?: string = "#bcbcbc";
    boxShadow?:string;
      constructor(props: Partial<CardViewStyle>) {
          super({})
          Object.assign(this, props);
        }
  }

  export class CardStyle  extends BaseStyle{
    buttonTextColor?:string;
    buttonTextFont?:FontStyleInterface;
    buttonBorder?:BorderStyleInterface;
    buttonBorderRadius?:string;
    buttonHeight?:string;
    buttonWidth?:string;
    buttonBackgroundColor?:string;
    repliesTextFont?:FontStyleInterface;
    repliesTextBorder?:BorderStyleInterface;
    repliesTextBorderRadius?:string;
    repliesTextColor?:string;
    repliesTextBackgroundColor?:string;
      constructor(props: Partial<CardViewStyle>) {
          super({})
          Object.assign(this, props);
        }
  }