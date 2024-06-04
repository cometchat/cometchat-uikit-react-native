import { BaseStyle, FontStyle } from "../shared";

export class AIOptionsStyle extends BaseStyle {
    listItemBackground?: string;
    listItemTitleFont?: FontStyle;
    listItemTitleColor?: string;
    listItemBorderRadius?: number;
    listItemBorder?: string;
	optionsSeparatorTint?: string;
    constructor(props: Partial<AIOptionsStyle>) {
        super({});
        Object.assign(this, props);
    }
}
