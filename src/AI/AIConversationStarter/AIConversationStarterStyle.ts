import { AIButtonsStyle } from "../utils";

export class AIConversationStarterStyle extends AIButtonsStyle {
    constructor(props: Partial<AIButtonsStyle>) {
      super({...props})
      Object.assign(this, props);
    }
  }