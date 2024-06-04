import { BaseStyle, BaseStyleInterface, BorderStyle, FontStyle,  FontStyleInterface } from "../../../shared/base";

export interface StickerKeyboardStyleInterface extends BaseStyleInterface {
  categoryBackground?: string;
  emptyTextFont?: FontStyleInterface;
  emptyTextColor?: string;
  errorTextFont?: FontStyleInterface;
  errorTextColor?: string;
  loadingTextFont?: FontStyleInterface;
  loadingTextColor?: string;
}

export class StickerKeyboardStyle extends BaseStyle {
  categoryBackground: string;
  emptyTextFont: FontStyleInterface;
  emptyTextColor: string;
  errorTextFont: FontStyleInterface;
  errorTextColor: string;
  loadingTextFont: FontStyleInterface;
  loadingTextColor: string;

  constructor({
    categoryBackground = "",
    emptyTextFont = new FontStyle({}),
    emptyTextColor = "",
    errorTextFont = new FontStyle({}),
    errorTextColor = "",
    loadingTextFont = new FontStyle({}),
    loadingTextColor = "",
    width = "100%",
    height = "auto",
    backgroundColor = "",
    border = new BorderStyle({}),
    borderRadius = 8,
  }: StickerKeyboardStyleInterface) {
    super({
      width,
      height,
      backgroundColor,
      border,
      borderRadius,
    });

    this.categoryBackground = categoryBackground;
    this.emptyTextFont = new FontStyle(emptyTextFont ?? {});
    this.emptyTextColor = emptyTextColor;
    this.errorTextFont = new FontStyle(errorTextFont ?? {});
    this.errorTextColor = errorTextColor;
    this.loadingTextFont = new FontStyle(loadingTextFont ?? {});
    this.loadingTextColor = loadingTextColor;
  }
}
