import { BaseStyle, FontStyle } from "../../base";
import { ButtonStyleInterface } from "../CometChatButton";
import { CheckBoxStyleInterface } from "../CometChatCheckBox/CheckBoxStyle";
import { DropDownStyleInterface } from "../CometChatDropDown/DropDownStyle";
import { LabelStyleInterface } from "../CometChatLabel/LabelStyle";
import { QuickViewStyleInterface } from "../CometChatQuickView/QuickViewStyle";
import { RadioButtonStyleInterface } from "../CometChatRadioButton/RadioButtonStyle";
import { SingleSelectStyleInterface } from "../CometChatSingleSelect/SingleStyle";
import { TextInputStyleInterface } from "../CometChatTextInput/TextInputStyle";

export interface FormBubbleStyleInterface extends BaseStyle {
    titleFont?: FontStyle;
    titleColor?: string;
    wrapperBackground?: string;
    wrapperBorderRadius?: number;
    wrapperPadding?: number;
    goalCompletionTextFont?: FontStyle;
    goalCompletionTextColor?: string;
    textInputStyle?: TextInputStyleInterface;
    quickViewStyle?: QuickViewStyleInterface;
    radioButtonStyle?: RadioButtonStyleInterface;
    checkboxStyle?: CheckBoxStyleInterface;
    dropdownStyle?: DropDownStyleInterface;
    labelStyle?: LabelStyleInterface;
    buttonStyle?: ButtonStyleInterface;
    singleSelectStyle?: SingleSelectStyleInterface;
}

export class FormBubbleStyle extends BaseStyle {
    titleFont?: FontStyle;
    titleColor?: string;
    wrapperBackground?: string;
    wrapperBorderRadius?: number;
    wrapperPadding?: number;
    goalCompletionTextFont?: FontStyle;
    goalCompletionTextColor?: string;
    textInputStyle?: TextInputStyleInterface;
    quickViewStyle?: QuickViewStyleInterface;
    radioButtonStyle?: RadioButtonStyleInterface;
    checkboxStyle?: CheckBoxStyleInterface;
    dropdownStyle?: DropDownStyleInterface;
    labelStyle?: LabelStyleInterface;
    buttonStyle?: ButtonStyleInterface;
    singleSelectStyle?: SingleSelectStyleInterface;

    constructor({
        height = "auto",
        width = "auto",
        backgroundColor,
        border,
        borderRadius,
        titleFont,
        titleColor,
        wrapperBackground,
        wrapperBorderRadius,
        wrapperPadding,
        goalCompletionTextFont,
        goalCompletionTextColor,
        textInputStyle,
        quickViewStyle,
        radioButtonStyle,
        checkboxStyle,
        dropdownStyle,
        labelStyle,
        buttonStyle,
        singleSelectStyle,
    }: FormBubbleStyleInterface) {
        super({
            backgroundColor,
            border,
            borderRadius,
            height,
            width
        });
        this.titleFont = titleFont;
        this.titleColor = titleColor;
        this.wrapperBackground = wrapperBackground;
        this.wrapperBorderRadius = wrapperBorderRadius;
        this.wrapperPadding = wrapperPadding;
        this.goalCompletionTextFont = goalCompletionTextFont;
        this.goalCompletionTextColor = goalCompletionTextColor;
        this.textInputStyle = textInputStyle;
        this.quickViewStyle = quickViewStyle;
        this.radioButtonStyle = radioButtonStyle;
        this.checkboxStyle = checkboxStyle;
        this.dropdownStyle = dropdownStyle;
        this.labelStyle = labelStyle;
        this.buttonStyle = buttonStyle;
        this.singleSelectStyle = singleSelectStyle;
    }
}