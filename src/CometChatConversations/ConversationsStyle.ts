import { BaseStyle, BaseStyleInterface, BorderStyle, BorderStyleInterface, FontStyle, FontStyleInterface } from "../shared";

export interface ConversationsStyleInterface extends BaseStyleInterface {
    titleFont?: FontStyleInterface,
    titleColor?: string,
    backIconTint?: string,
    onlineStatusColor?: string,
    separatorColor?: string,
    loadingIconTint?: string,
    emptyTextColor?: string,
    emptyTextFont?: FontStyleInterface,
    errorTextColor?: string,
    errorTextFont?: FontStyleInterface,
    lastMessageTextColor?: string,
    lastMessageTextFont?: FontStyleInterface,
    typingIndictorTextColor?: string,
    typingIndictorTextFont?: FontStyleInterface,
    threadIndicatorTextFont?: FontStyleInterface,
    threadIndicatorTextColor?: string,
}

export class ConversationsStyle extends BaseStyle {
    titleFont?: FontStyleInterface
    titleColor?: string
    backIconTint?: string
    onlineStatusColor?: string
    separatorColor?: string
    loadingIconTint?: string
    emptyTextColor?: string
    emptyTextFont?: FontStyleInterface
    errorTextColor?: string
    errorTextFont?: FontStyleInterface
    lastMessageTextColor?: string
    lastMessageTextFont?: FontStyleInterface
    typingIndictorTextColor?: string
    typingIndictorTextFont?: FontStyleInterface
    threadIndicatorTextFont?: FontStyleInterface
    threadIndicatorTextColor?: string

    constructor(props: ConversationsStyleInterface) {
        const {
            width,
            height,
            backgroundColor,
            border,
            borderRadius,
            titleFont,
            titleColor,
            backIconTint,
            onlineStatusColor,
            separatorColor,
            loadingIconTint,
            emptyTextColor,
            emptyTextFont,
            errorTextColor,
            errorTextFont,
            lastMessageTextColor,
            lastMessageTextFont,
            typingIndictorTextColor,
            typingIndictorTextFont,
            threadIndicatorTextFont,
            threadIndicatorTextColor,
        } = props;
        super({
            width,
            height,
            backgroundColor,
            border,
            borderRadius,
        });
        this.titleFont = titleFont;
        this.titleColor = titleColor;
        this.backIconTint = backIconTint;
        this.onlineStatusColor = onlineStatusColor;
        this.separatorColor = separatorColor;
        this.loadingIconTint = loadingIconTint;
        this.emptyTextColor = emptyTextColor;
        this.emptyTextFont = emptyTextFont;
        this.errorTextColor = errorTextColor;
        this.errorTextFont = errorTextFont;
        this.lastMessageTextColor = lastMessageTextColor;
        this.lastMessageTextFont = lastMessageTextFont;
        this.typingIndictorTextColor = typingIndictorTextColor;
        this.typingIndictorTextFont = typingIndictorTextFont;
        this.threadIndicatorTextFont = threadIndicatorTextFont;
        this.threadIndicatorTextColor = threadIndicatorTextColor;
    }
}