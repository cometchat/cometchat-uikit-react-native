
import { BorderStyle, FontStyle } from "../../shared";
import { AIBaseStyle } from "../AIBaseStyle";

export class AIConversationSummaryStyle extends AIBaseStyle {
    titleFont?: FontStyle;
    titleColor?: string = "";
    textFont?: FontStyle;
    textColor?: string = "";
    buttonTextColor?: string = "";
    buttonTextFont?: FontStyle;
	buttonBackground?: string  = "";
	buttonBorderRadius?: number;
	buttonBorder?: BorderStyle;
    closeIconTint?: string = "";
    constructor(props: Partial<AIConversationSummaryStyle>) {
        super({});
        Object.assign(this, props);
    }
}
