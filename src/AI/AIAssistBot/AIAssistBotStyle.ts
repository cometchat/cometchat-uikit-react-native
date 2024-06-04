import { FontStyle } from "../../shared";
import { AIBaseStyle } from "../AIBaseStyle";

export class AIAssistBotStyle extends AIBaseStyle {
    titleFont?: FontStyle;
    titleColor?: string = "";
    subtitleFont: FontStyle;
    subtitleColor: string;
    closeIconTint?: string = "";
    sendIconTint?: string = "";
    buttonTextColor?: string  = "";
    buttonTextFont?: FontStyle;
    buttonBackground?: string  = "";
    buttonBorderRadius?: number;

    constructor(props: Partial<AIAssistBotStyle>) {
        super({});
        Object.assign(this, props);
    }
}

class AITextMessageBubbleStyle extends AIBaseStyle {
	textFont?: string = "";
	textColor?: string = "";
    constructor(props: Partial<AITextMessageBubbleStyle>) {
        super({});
        Object.assign(this, props);
    }
}

export class AIBotMessageBubbleStyle extends AITextMessageBubbleStyle {
    constructor(props: Partial<AIBotMessageBubbleStyle>) {
        super({});
        Object.assign(this, props);
    }
}

export class AISenderMessageBubbleStyle extends AITextMessageBubbleStyle {
    constructor(props: Partial<AISenderMessageBubbleStyle>) {
        super({});
        Object.assign(this, props);
    }
}