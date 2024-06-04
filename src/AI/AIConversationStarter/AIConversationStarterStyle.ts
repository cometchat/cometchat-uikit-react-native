import { AIBaseStyle } from "../AIBaseStyle";

export class AIConversationStarterStyle extends AIBaseStyle {
  repliesTextFont?: string;
  repliesTextBorder?: string;
  repliesTextBorderRadius?: string;
  repliesTextColor?: string;
  repliesTextBackground?: string;
  constructor(props: Partial<AIConversationStarterStyle>) {
      super({});
      Object.assign(this, props);
  }
}