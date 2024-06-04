import { BaseStyle, BorderStyle } from "../../../shared/base";
/**
 * @class MessagePreviewStyle
 * @param {String} border
 * @param {String} background
 * @param {String} messagePreviewTitleFont
 * @param {String} messagePreviewTitleColor
 * @param {String} messagePreviewSubtitleColor
 * @param {String} messagePreviewSubtitleFont
 * @param {String} closeIconTint
 */

class MessagePreviewStyle extends BaseStyle {
  constructor({
    messagePreviewTitleFont = {},
    messagePreviewTitleColor = "",
    messagePreviewSubtitleColor = "",
    messagePreviewSubtitleFont = {},
    closeIconTint = "",

    width = "100%",
    height = "auto",
    backgroundColor = "",
    border = new BorderStyle({}),
    borderRadius = 0,
  }) {
    super({
      width,
      height,
      backgroundColor,
      border,
      borderRadius,
    });

    this.messagePreviewTitleFont = messagePreviewTitleFont;
    this.messagePreviewTitleColor = messagePreviewTitleColor;
    this.messagePreviewSubtitleColor = messagePreviewSubtitleColor;
    this.messagePreviewSubtitleFont = messagePreviewSubtitleFont;
    this.closeIconTint = closeIconTint;
  }
}
export { MessagePreviewStyle };
