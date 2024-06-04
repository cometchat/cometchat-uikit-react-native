import { BaseStyle,FontStyle } from "../../../shared/base";
/**
 * @class EmojiKeyboardStyle
 * @param {String} sectionHeaderFont
 * @param {String} sectionHeaderColor
 * @param {String} categoryIconTint
 * @param {String} selectedCategoryIconTint
 */

class EmojiKeyboardStyle extends BaseStyle {
  sectionHeaderFont: FontStyle;
  sectionHeaderColor: string;
  categoryIconTint: string;
  selectedCategoryIconTint: string;
  categoryBackground: string;
  constructor({
    sectionHeaderFont = {},
    sectionHeaderColor = "",
    categoryIconTint = "",
    selectedCategoryIconTint = "",
    categoryBackground = "",

    width = "100%",
    height = 330,
    backgroundColor = "",
    // border = 0,
    borderRadius = 8,
  }) {
    super({
      width,
      height,
      backgroundColor,
      // border,
      borderRadius,
    });

    this.sectionHeaderFont = new FontStyle(sectionHeaderFont ?? {});
    this.sectionHeaderColor = sectionHeaderColor;
    this.categoryIconTint = categoryIconTint;
    this.selectedCategoryIconTint = selectedCategoryIconTint;
    this.categoryBackground = categoryBackground;
  }
}
export { EmojiKeyboardStyle };
