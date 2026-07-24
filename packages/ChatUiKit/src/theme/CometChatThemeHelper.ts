import { deepMerge } from "../shared/helper/helperFunctions";
import { DeepPartial } from "../shared/helper/types";
import { defaultColorDark, defaultSpacing } from "./default";
import { defaultColorLight } from "./default/color/light";
import { CometChatTheme } from "./type";

export enum Brightness {
  LIGHT = 0,
  DARK = 1,
}

enum Colors {
  BLACK = "#000000",
  WHITE = "#FFFFFF",
}

export class CometChatThemeHelper {
  /**
   * Returns a list of color blending percentages based on the brightness setting.
   *
   * @param brightness - The brightness mode to determine the blending percentages.
   *                      Use `Brightness.LIGHT` for light mode and `Brightness.DARK` for dark mode.
   * @returns An array of blending percentages. For light mode, it provides percentages closer to white;
   *          for dark mode, it provides percentages closer to black.
   *
   * @example
   * ```typescript
   * const lightPercentages = getBlendColorsPercentage(Brightness.LIGHT);
   * console.log(lightPercentages); // Output: [0.96, 0.88, 0.77, 0.66, 0.55, 0.44, 0.33, 0.22, 0.11, 0.11]
   * ```
   */
  public static getBlendColorsPercentage(brightness: Brightness): { [key: number]: number } {
    return brightness === Brightness.LIGHT
      ? {
          50: 0.96,
          100: 0.88,
          200: 0.77,
          300: 0.66,
          400: 0.55,
          500: 0.44,
          600: 0.33,
          700: 0.22,
          800: 0.11,
          900: 0.11,
        }
      : {
          50: 0.8,
          100: 0.72,
          200: 0.64,
          300: 0.56,
          400: 0.48,
          500: 0.4,
          600: 0.32,
          700: 0.24,
          800: 0.16,
          900: 0.08,
        };
  }

  /**
   * Converts a hexadecimal color code to its RGB components.
   *
   * @param hex - The color code in hexadecimal format (e.g., "#FF0000" for red).
   * @returns An object containing the red, green, and blue components of the color.
   *
   * @example
   * ```typescript
   * const rgb = hexToRgb("#FF0000");
   * console.log(rgb); // Output: { r: 255, g: 0, b: 0 }
   * ```
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    let r = 0,
      g = 0,
      b = 0;
    // 3 digits
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    }
    // 6 digits
    else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    return { r, g, b };
  }

  /**
   * Converts RGB color components to a hexadecimal color code.
   *
   * @param r - The red component of the color (0-255).
   * @param g - The green component of the color (0-255).
   * @param b - The blue component of the color (0-255).
   * @returns The color code in hexadecimal format.
   *
   * @example
   * ```typescript
   * const hex = rgbToHex(255, 0, 0);
   * console.log(hex); // Output: "#FF0000"
   * ```
   */
  private static rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  }

  /**
   * Blends two colors together based on a specified percentage.
   *
   * @param baseColor - The base color in hexadecimal format (e.g., "#FF0000" for red).
   * @param blendColor - The color to blend with the base color, also in hexadecimal format.
   * @param percentage - The percentage of the `blendColor` to blend with the `baseColor`.
   *                      It should be a value between 0 and 1, where 0 means only the `baseColor` is used and
   *                      1 means only the `blendColor` is used.
   * @returns The resulting blended color in hexadecimal format.
   *
   * @example
   * ```typescript
   * const brightness: Brightness = Brightness.LIGHT;
   * const blendColorsPercentage = CometChatThemeHelper.getBlendColorsPercentage(brightness);
   * const blendedColor = CometChatThemeHelper.blendColors("#6852D6", "#FFFFFF", blendColorsPercentage[0]);
   * ```
   */
  private static blendColors(baseColor: string, blendColor: string, percentage: number): string {
    const { r: rBase, g: gBase, b: bBase } = this.hexToRgb(baseColor);
    const { r: rBlend, g: gBlend, b: bBlend } = this.hexToRgb(blendColor);

    const r = Math.round(rBase * (1 - percentage) + rBlend * percentage);
    const g = Math.round(gBase * (1 - percentage) + gBlend * percentage);
    const b = Math.round(bBase * (1 - percentage) + bBlend * percentage);

    return this.rgbToHex(r, g, b);
  }

  public static updateColors(color: Partial<CometChatTheme["color"]>, mode: Brightness) {
    if (mode == Brightness.LIGHT) {
      return CometChatThemeHelper.updateOtherColors(
        CometChatThemeHelper.updateExtendedColorsForLightTheme(
          color,
          CometChatThemeHelper.getBlendColorsPercentage(mode)
        ),
        defaultColorLight
      );
    }
    return CometChatThemeHelper.updateOtherColors(
      CometChatThemeHelper.updateExtendedColorsForDarkTheme(
        color,
        CometChatThemeHelper.getBlendColorsPercentage(mode)
      ),
      defaultColorDark
    );
  }

  private static updateOtherColors(
    color: Partial<CometChatTheme["color"]>,
    defaultColor: Partial<CometChatTheme["color"]>
  ) {
    color.neutral50 = color.neutral50 ?? defaultColor.neutral50;
    color.neutral100 = color.neutral100 ?? defaultColor.neutral100;
    color.neutral200 = color.neutral200 ?? defaultColor.neutral200;
    color.neutral300 = color.neutral300 ?? defaultColor.neutral300;
    color.neutral400 = color.neutral400 ?? defaultColor.neutral400;
    color.neutral500 = color.neutral500 ?? defaultColor.neutral500;
    color.neutral600 = color.neutral600 ?? defaultColor.neutral600;
    color.neutral700 = color.neutral700 ?? defaultColor.neutral700;
    color.neutral800 = color.neutral800 ?? defaultColor.neutral800;
    color.neutral900 = color.neutral900 ?? defaultColor.neutral900;

    color.staticBlack = color.staticBlack ?? defaultColor.staticBlack;
    color.staticWhite = color.staticWhite ?? defaultColor.staticWhite;

    color.info = color.info ?? defaultColor.info;
    color.warning = color.warning ?? defaultColor.warning;
    color.success = color.success ?? defaultColor.success;
    color.error = color.error ?? defaultColor.error;

    /***background colors***/
    color.background1 = color.background1 === undefined ? color.neutral50 : color.background1;
    color.background2 = color.background2 === undefined ? color.neutral100 : color.background2;
    color.background3 = color.background3 === undefined ? color.neutral200 : color.background3;
    color.background4 = color.background4 === undefined ? color.neutral300 : color.background4;

    /***border colors***/
    color.borderLight = color.borderLight === undefined ? color.neutral200 : color.borderLight;
    color.borderDefault =
      color.borderDefault === undefined ? color.neutral300 : color.borderDefault;
    color.borderDark = color.borderDark === undefined ? color.neutral400 : color.borderDark;
    color.borderHighlight =
      color.borderHighlight === undefined ? color.primary : color.borderHighlight;

    /***text colors***/
    color.textPrimary = color.textPrimary === undefined ? color.neutral900 : color.textPrimary;
    color.textSecondary =
      color.textSecondary === undefined ? color.neutral600 : color.textSecondary;
    color.textTertiary = color.textTertiary === undefined ? color.neutral500 : color.textTertiary;
    color.textDisabled = color.textDisabled === undefined ? color.neutral400 : color.textDisabled;
    color.textWhite = color.textWhite === undefined ? color.neutral50 : color.textWhite;
    color.textHighlight = color.textHighlight === undefined ? color.primary : color.textHighlight;

    /***icon colors***/
    color.iconPrimary = color.iconPrimary === undefined ? color.neutral900 : color.iconPrimary;
    color.iconSecondary =
      color.iconSecondary === undefined ? color.neutral500 : color.iconSecondary;
    color.iconTertiary = color.iconTertiary === undefined ? color.neutral400 : color.iconTertiary;
    color.iconWhite = color.iconWhite === undefined ? color.neutral50 : color.iconWhite;
    color.iconHighlight = color.iconHighlight === undefined ? color.primary : color.iconHighlight;

    /***button colors***/
    color.primaryButtonBackground =
      color.primaryButtonBackground === undefined ? color.primary : color.primaryButtonBackground;
    color.primaryButtonIcon =
      color.primaryButtonIcon === undefined ? color.staticWhite : color.primaryButtonIcon;
    color.primaryButtonText =
      color.primaryButtonText === undefined ? color.staticWhite : color.primaryButtonText;
    color.secondaryButtonBackground =
      color.secondaryButtonBackground === undefined
        ? color.neutral900
        : color.secondaryButtonBackground;
    color.secondaryButtonIcon =
      color.secondaryButtonIcon === undefined ? color.neutral900 : color.secondaryButtonIcon;
    color.secondaryButtonText =
      color.secondaryButtonText === undefined ? color.neutral900 : color.secondaryButtonText;

    /***other colors***/
    color.linkBackground = color.linkBackground === undefined ? color.info : color.linkBackground;
    color.fabButtonBackground =
      color.fabButtonBackground === undefined ? color.primary : color.fabButtonBackground;
    color.fabButtonIcon =
      color.fabButtonIcon === undefined ? color.staticWhite : color.fabButtonIcon;

    color.whiteHover = color.whiteHover === undefined ? color.neutral100 : color.whiteHover;
    color.whitePressed = color.whitePressed === undefined ? color.neutral300 : color.whitePressed;

    /***send bubble colors***/
    color.sendBubbleBackground =
      color.sendBubbleBackground === undefined ? color.primary : color.sendBubbleBackground;
    color.sendBubbleText =
      color.sendBubbleText === undefined ? color.staticWhite : color.sendBubbleText;
    color.sendBubbleTextHighlight =
      color.sendBubbleTextHighlight === undefined
        ? color.staticWhite
        : color.sendBubbleTextHighlight;
    color.sendBubbleLink =
      color.sendBubbleLink === undefined ? color.staticWhite : color.sendBubbleLink;
    color.sendBubbleTimestamp =
      color.sendBubbleTimestamp === undefined ? color.staticWhite : color.sendBubbleTimestamp;
    color.sendBubbleIcon =
      color.sendBubbleIcon === undefined ? color.staticWhite : color.sendBubbleIcon;

    /***receive bubble colors***/
    color.receiveBubbleBackground =
      color.receiveBubbleBackground === undefined
        ? color.neutral300
        : color.receiveBubbleBackground;
    color.receiveBubbleText =
      color.receiveBubbleText === undefined ? color.neutral900 : color.receiveBubbleText;
    color.receiveBubbleTextHighlight =
      color.receiveBubbleTextHighlight === undefined
        ? color.primary
        : color.receiveBubbleTextHighlight;
    color.receiveBubbleLink =
      color.receiveBubbleLink === undefined ? color.info : color.receiveBubbleLink;
    color.receiveBubbleTimestamp =
      color.receiveBubbleTimestamp === undefined ? color.neutral600 : color.receiveBubbleTimestamp;
    color.receiveBubbleIcon =
      color.receiveBubbleIcon === undefined ? color.primary : color.receiveBubbleIcon;

    color.previewInlineCodeBackground =
      color.previewInlineCodeBackground === undefined ? defaultColor.previewInlineCodeBackground : color.previewInlineCodeBackground;

    color.previewCodeBlockBackground =
      color.previewCodeBlockBackground === undefined ? defaultColor.previewCodeBlockBackground : color.previewCodeBlockBackground;

    color.previewCodeBlockBorder =
      color.previewCodeBlockBorder === undefined ? defaultColor.previewCodeBlockBorder : color.previewCodeBlockBorder;

    // Media overlays — so a custom (partial) theme still gets the dark scrims for media/attachments.
    color.mediaScrim = color.mediaScrim === undefined ? defaultColor.mediaScrim : color.mediaScrim;
    color.mediaOverlay = color.mediaOverlay === undefined ? defaultColor.mediaOverlay : color.mediaOverlay;
    color.mediaDurationChip =
      color.mediaDurationChip === undefined ? defaultColor.mediaDurationChip : color.mediaDurationChip;
    color.mediaErrorOverlay =
      color.mediaErrorOverlay === undefined ? defaultColor.mediaErrorOverlay : color.mediaErrorOverlay;

    return color;
  }

  private static updateExtendedColorsForLightTheme(
    color: Partial<CometChatTheme["color"]>,
    blendColorsPercentage: { [key: number]: number }
  ) {
    color.primary = color.primary ?? defaultColorLight.primary;
    color.extendedPrimary50 =
      color.extendedPrimary50 === undefined
        ? CometChatThemeHelper.blendColors(
            color.primary as string,
            Colors.WHITE,
            blendColorsPercentage[50]
          )
        : color.extendedPrimary50;
    for (let i = 100; i < 900; i += 100) {
      // Ensure the blend percentage is defined in your blendColorsPercentage object
      const percentage = blendColorsPercentage[i] || 0; // Default to 0 if not defined
      color[`extendedPrimary${i}` as keyof typeof color] =
        color[`extendedPrimary${i}` as keyof typeof color] === undefined
          ? CometChatThemeHelper.blendColors(color.primary as string, Colors.WHITE, percentage)
          : color[`extendedPrimary${i}` as keyof typeof color];

      color.extendedPrimary900 =
        color.extendedPrimary900 === undefined
          ? CometChatThemeHelper.blendColors(
              color.primary as string,
              Colors.BLACK,
              blendColorsPercentage[900]
            )
          : color.extendedPrimary900;
    }
    return color;
  }

  private static updateExtendedColorsForDarkTheme(
    color: Partial<CometChatTheme["color"]>,
    blendColorsPercentage: { [key: number]: number }
  ) {
    color.primary = color.primary ?? defaultColorDark.primary;
    color.extendedPrimary50 =
      color.extendedPrimary50 === undefined
        ? CometChatThemeHelper.blendColors(
            color.primary as string,
            Colors.BLACK,
            blendColorsPercentage[50]
          )
        : color.extendedPrimary50;
    for (let i = 100; i < 900; i += 100) {
      // Ensure the blend percentage is defined in your blendColorsPercentage object
      const percentage = blendColorsPercentage[i] || 0; // Default to 0 if not defined
      color[`extendedPrimary${i}` as keyof typeof color] =
        color[`extendedPrimary${i}` as keyof typeof color] === undefined
          ? CometChatThemeHelper.blendColors(color.primary as string, Colors.BLACK, percentage)
          : color[`extendedPrimary${i}` as keyof typeof color];
      color.extendedPrimary900 =
        color.extendedPrimary900 === undefined
          ? CometChatThemeHelper.blendColors(
              color.primary as string,
              Colors.WHITE,
              blendColorsPercentage[900]
            )
          : color.extendedPrimary900;
    }
    return color;
  }

  public static updateSpacing(
    spacing: DeepPartial<CometChatTheme["spacing"]>
  ): CometChatTheme["spacing"] {
    if (!spacing.spacing) {
      spacing.spacing = {} as any;
    }

    spacing.spacing!.s0 =
      spacing.spacing!.s0 !== undefined ? spacing.spacing?.s0 : defaultSpacing.spacing?.s0;
    spacing.spacing!.s1 =
      spacing.spacing!.s1 !== undefined ? spacing.spacing?.s1 : defaultSpacing.spacing?.s1;
    spacing.spacing!.s2 =
      spacing.spacing!.s2 !== undefined ? spacing.spacing?.s2 : defaultSpacing.spacing?.s2;
    spacing.spacing!.s3 =
      spacing.spacing!.s3 !== undefined ? spacing.spacing?.s3 : defaultSpacing.spacing?.s3;
    spacing.spacing!.s4 =
      spacing.spacing!.s4 !== undefined ? spacing.spacing?.s4 : defaultSpacing.spacing?.s4;
    spacing.spacing!.s5 =
      spacing.spacing!.s5 !== undefined ? spacing.spacing?.s5 : defaultSpacing.spacing?.s5;
    spacing.spacing!.s6 =
      spacing.spacing!.s6 !== undefined ? spacing.spacing?.s6 : defaultSpacing.spacing?.s6;
    spacing.spacing!.s7 =
      spacing.spacing!.s7 !== undefined ? spacing.spacing?.s7 : defaultSpacing.spacing?.s7;
    spacing.spacing!.s8 =
      spacing.spacing!.s8 !== undefined ? spacing.spacing?.s8 : defaultSpacing.spacing?.s8;
    spacing.spacing!.s9 =
      spacing.spacing!.s9 !== undefined ? spacing.spacing?.s9 : defaultSpacing.spacing?.s9;
    spacing.spacing!.s10 =
      spacing.spacing!.s10 !== undefined ? spacing.spacing?.s10 : defaultSpacing.spacing?.s10;
    spacing.spacing!.s11 =
      spacing.spacing!.s11 !== undefined ? spacing.spacing?.s11 : defaultSpacing.spacing?.s11;
    spacing.spacing!.s12 =
      spacing.spacing!.s12 !== undefined ? spacing.spacing?.s12 : defaultSpacing.spacing?.s12;
    spacing.spacing!.s13 =
      spacing.spacing!.s13 !== undefined ? spacing.spacing?.s13 : defaultSpacing.spacing?.s13;
    spacing.spacing!.s14 =
      spacing.spacing!.s14 !== undefined ? spacing.spacing?.s14 : defaultSpacing.spacing?.s14;
    spacing.spacing!.s15 =
      spacing.spacing!.s15 !== undefined ? spacing.spacing?.s15 : defaultSpacing.spacing?.s15;
    spacing.spacing!.s16 =
      spacing.spacing!.s16 !== undefined ? spacing.spacing?.s16 : defaultSpacing.spacing?.s16;
    spacing.spacing!.s17 =
      spacing.spacing!.s17 !== undefined ? spacing.spacing?.s17 : defaultSpacing.spacing?.s17;
    spacing.spacing!.s18 =
      spacing.spacing!.s18 !== undefined ? spacing.spacing?.s18 : defaultSpacing.spacing?.s18;
    spacing.spacing!.s19 =
      spacing.spacing!.s19 !== undefined ? spacing.spacing?.s19 : defaultSpacing.spacing?.s19;
    spacing.spacing!.s20 =
      spacing.spacing!.s20 !== undefined ? spacing.spacing?.s20 : defaultSpacing.spacing?.s20;
    spacing.spacing!.max =
      spacing.spacing!.max !== undefined ? spacing.spacing?.max : defaultSpacing.spacing?.max;

    if (!spacing.padding) {
      spacing.padding = {} as any;
    }
    if (!spacing.margin) {
      spacing.margin = {} as any;
    }
    if (!spacing.radius) {
      spacing.radius = {} as any;
    }
    /**padding**/
    Object.keys(defaultSpacing.padding).forEach((key) => {
      const k = key as string;
      const paddingKey = k as keyof typeof spacing.padding;
      const spacingKey = k.replace("p", "s") as keyof typeof spacing.spacing;

      spacing.padding![paddingKey] =
        spacing.padding![paddingKey] === undefined
          ? spacing.spacing![spacingKey]
          : spacing.padding![paddingKey];
    });

    /**margin**/
    Object.keys(defaultSpacing.margin).forEach((key) => {
      const k = key as string;
      const marginKey = k as keyof typeof spacing.margin;
      const spacingKey = k.replace("m", "s") as keyof typeof spacing.spacing;

      spacing.margin![marginKey] = (
        spacing.margin?.[marginKey] === undefined
          ? spacing.spacing?.[spacingKey]
          : spacing.margin?.[marginKey]
      )!;
    });

    /**radius**/
    Object.keys(defaultSpacing.radius).forEach((key) => {
      const k = key as string;
      const radiusKey = k as keyof typeof spacing.radius;
      const spacingKey = k.replace("r", "s") as keyof typeof spacing.spacing;

      spacing.radius![radiusKey] =
        (spacing.radius?.[radiusKey] === undefined
          ? spacing.spacing?.[spacingKey]
          : spacing.radius?.[radiusKey])!;
    });

    return spacing as CometChatTheme["spacing"];
  }
}
