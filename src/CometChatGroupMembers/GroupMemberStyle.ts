import { AvatarStyleInterface, BaseStyle, BaseStyleInterface, BorderStyle, BorderStyleInterface, FontStyle, FontStyleInterface, ListItemStyleInterface } from "../shared";
import { StatusIndicatorStyleInterface } from "../shared/views/CometChatStatusIndicator/StatusIndicatorStyle";

export interface GroupMembersStyleInterface extends BaseStyleInterface {
    titleFont?: FontStyleInterface,
    titleColor?: string,
    backIconTint?: string,
    searchBorder?: BorderStyleInterface,
    searchBorderRadius?: number,
    searchBackgroundColor?: string,
    searchTextFont?: FontStyleInterface,
    searchTextColor?: string,
    searchIconTint?: string,
    onlineStatusColor?: string,
    separatorColor?: string,
    loadingIconTint?: string,
    emptyTextColor?: string,
    emptyTextFont?: FontStyleInterface,
    errorTextColor?: string,
    errorTextFont?: FontStyleInterface,
}

export class GroupMembersStyle extends BaseStyle {
    titleFont: FontStyleInterface
    titleColor: string
    backIconTint: string
    searchBorder: BorderStyleInterface
    searchBorderRadius: number
    searchBackgroundColor: string
    searchTextFont: FontStyleInterface
    searchTextColor: string
    searchIconTint: string
    onlineStatusColor: string
    separatorColor: string
    loadingIconTint: string
    emptyTextColor: string
    emptyTextFont: FontStyleInterface
    errorTextColor: string
    errorTextFont: FontStyleInterface
    avatarStyle: AvatarStyleInterface;
    listItemStyle: ListItemStyleInterface;
    statusIndicatorStyle: StatusIndicatorStyleInterface;

    constructor({
        width = "100%",
        height = "100%",
        backgroundColor = "rgb(255,255,255)",
        border = new BorderStyle({}),
        borderRadius = 0, 
        titleFont = new FontStyle({fontSize: 20, fontWeight: "500"}),
        titleColor = "rgba(20,20,20,0.9)",
        backIconTint = "rgb(51, 153, 255)",
        searchBorder = new BorderStyle({borderColor: "rgba(20, 20, 20, 0.04)"}),
        searchBorderRadius = 8,
        searchBackgroundColor = "rgba(20, 20, 20, 0.04)",
        searchTextFont = new FontStyle({fontSize: 17, fontWeight: "400"}),
        searchTextColor = "rgba(20,20,20,0.6)",
        searchIconTint = "rgba(20,20,20,0.4)",
        onlineStatusColor = "rgb(0,200,11)",
        separatorColor = "rgba(20,20,20,0.06)",
        loadingIconTint = "rgba(20,20,20,0.59)",
        emptyTextColor = "rgba(20,20,20,0.3)",
        emptyTextFont = new FontStyle({fontSize: 20, fontWeight: "500"}),
        errorTextColor = "rgb(255,59,48)",
        errorTextFont = new FontStyle({fontSize: 20, fontWeight: "400"}),
    }: GroupMembersStyleInterface) {
        super({
            height,
            backgroundColor,
            border,
            borderRadius,
            width
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
        this.onlineStatusColor = onlineStatusColor;
        this.separatorColor = separatorColor;
        this.loadingIconTint = loadingIconTint;
        this.emptyTextColor = emptyTextColor;
        this.emptyTextFont = emptyTextFont;
        this.errorTextColor = errorTextColor;
        this.errorTextFont = errorTextFont;
    }
}