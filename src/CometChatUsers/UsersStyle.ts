import { BaseStyle, BaseStyleInterface, BorderStyle, BorderStyleInterface, FontStyle, FontStyleInterface, ImageType } from "../shared";
import { localize } from "../shared";

export interface UsersStyleInterface extends BaseStyleInterface {
    titleFont?: FontStyleInterface;
    titleColor?: string;
    backIconTint?: string;
    searchBorder?: BorderStyleInterface;
    searchBorderRadius?: number;
    searchBackgroundColor?: string;
    searchTextFont?: FontStyleInterface;
    searchTextColor?: string;
    searchIconTint?: string;
    searchPlaceHolderTextColor?: string
    separatorColor?: string;
    loadingIconTint?: string;
    emptyTextColor?: string;
    emptyTextFont?: FontStyleInterface;
    errorTextColor?: string;
    errorTextFont?: FontStyleInterface;
    subtitleTextColor?: string;
    subtitleTextFont?: FontStyleInterface;
}

/**
 * @class UsersStyle
 * @description UsersStyle class is used for defining the UsersStyle template.
 */
export class UsersStyle extends BaseStyle {
    titleFont: FontStyleInterface;
    titleColor: string;
    backIconTint: string;
    searchBorder: BorderStyleInterface;
    searchBorderRadius: number;
    searchBackgroundColor: string;
    searchTextFont: FontStyleInterface;
    searchTextColor: string;
    searchIconTint: string;
    searchPlaceHolderTextColor: string;
    separatorColor: string;
    loadingIconTint: string;
    emptyTextColor: string;
    emptyTextFont: FontStyleInterface;
    errorTextColor: string;
    errorTextFont: FontStyleInterface;
    subtitleTextColor: string;
    subtitleTextFont: FontStyleInterface;

    constructor(props: UsersStyleInterface) {
        const {
            width = "100%",
            height = "100%",
            border = new BorderStyle({ borderWidth: 0 }),
            borderRadius = 0,
            backgroundColor = "white",
            titleFont = new FontStyle({ fontSize: 17 }),
            titleColor = '#141414',
            backIconTint = "black",
            searchBorder = new BorderStyle({}),
            searchBorderRadius = 50,
            searchBackgroundColor = "rgba(20, 20, 20, 0.04)",
            searchTextFont = new FontStyle({ fontSize: 17 }),
            searchTextColor = "rgba(20,20,20,0.58)",
            searchIconTint = "rgba(20,20,20,0.4)",
            searchPlaceHolderTextColor = "rgba(20,20,20,0.58)",
            separatorColor = "rgba(20, 20, 20, 0.1)",
            loadingIconTint = "rgba(20,20,20, 0.7)",
            emptyTextColor = "rgb(255, 59, 48)",
            emptyTextFont = new FontStyle({ fontSize: 20 }),
            errorTextColor = "rgb(255, 59, 48)",
            errorTextFont = new FontStyle({ fontSize: 20 }),
            subtitleTextColor = "rgba(20, 20, 20, 0.58)",
            subtitleTextFont = new FontStyle({ fontSize: 16 }),
        } = props;
        super({
            width,
            height,
            backgroundColor,
            border,
            borderRadius
        });
        this.titleFont = titleFont;
        this.titleColor = titleColor;
        this.backIconTint = backIconTint;
        this.searchBorder = searchBorder;
        this.searchBorderRadius = searchBorderRadius;
        this.searchBackgroundColor = searchBackgroundColor;
        this.searchTextFont = searchTextFont;
        this.searchTextColor = searchTextColor;
        this.searchIconTint = searchIconTint;
        this.searchPlaceHolderTextColor = searchPlaceHolderTextColor;
        this.separatorColor = separatorColor;
        this.loadingIconTint = loadingIconTint;
        this.emptyTextColor = emptyTextColor;
        this.emptyTextFont = emptyTextFont;
        this.errorTextColor = errorTextColor;
        this.errorTextFont = errorTextFont;
        this.subtitleTextColor = subtitleTextColor;
        this.subtitleTextFont = subtitleTextFont;
    }
}