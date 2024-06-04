import React from "react";
import { BaseStyle, BaseStyleInterface, BorderStyle, BorderStyleInterface, FontStyle, FontStyleInterface } from "../shared";

export interface GroupScopeStyleInterface extends BaseStyleInterface {
    selectedOptionTextFont?: FontStyleInterface;
    selectedOptionTextColor?: string;
    selectedOptionBackgroundColor?: string;
    selectedOptionBorder?: BorderStyleInterface;
    selectedOptionBorderRadius?: number;
    arrowIconTint?: string;
    optionTextFont?: FontStyleInterface;
    optionTextColor?: string;
    optionBackgroundColor?: string;
    optionBorder?: BorderStyleInterface;
    optionBorderRadius?: number;
}

export class GroupScopeStyle extends BaseStyle {
    selectedOptionTextFont?: FontStyleInterface;
    selectedOptionTextColor?: string;
    selectedOptionBackgroundColor?: string;
    selectedOptionBorder?: BorderStyleInterface;
    selectedOptionBorderRadius?: number;
    arrowIconTint?: string;
    optionTextFont?: FontStyleInterface;
    optionTextColor?: string;
    optionBackgroundColor?: string;
    optionBorder?: BorderStyleInterface;
    optionBorderRadius?: number;

    constructor({
        width = '100%',
        height = '100%',
        backgroundColor = "rgba(0,0,0,0)",
        border = new BorderStyle({}),
        borderRadius = 8,
        selectedOptionTextFont = new FontStyle({fontWeight: "bold"}),
        selectedOptionTextColor = "#3399FF",
        selectedOptionBackgroundColor = "rgba(20,20,20,0.1)",
        selectedOptionBorder = new BorderStyle({}),
        selectedOptionBorderRadius = 0,
        arrowIconTint = "#3399FF",
        optionTextFont = new FontStyle({fontSize: 15, fontWeight: "400"}),
        optionTextColor = "#141414",
        optionBackgroundColor = "transparent",
        optionBorder = new BorderStyle({}),
        optionBorderRadius = 0,
    }: GroupScopeStyleInterface) {
        super({
            width,
            height,
            backgroundColor,
            border,
            borderRadius,
        })
        this.selectedOptionTextFont = selectedOptionTextFont;
        this.selectedOptionTextColor = selectedOptionTextColor;
        this.selectedOptionBackgroundColor = selectedOptionBackgroundColor;
        this.selectedOptionBorder = selectedOptionBorder;
        this.selectedOptionBorderRadius = selectedOptionBorderRadius;
        this.arrowIconTint = arrowIconTint;
        this.optionTextFont = optionTextFont;
        this.optionTextColor = optionTextColor;
        this.optionBackgroundColor = optionBackgroundColor;
        this.optionBorder = optionBorder;
        this.optionBorderRadius = optionBorderRadius;
    }
}