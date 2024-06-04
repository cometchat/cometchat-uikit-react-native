import { AIConversationStarterStyle } from './AIConversationStarterStyle';
import { AIBaseConfiguration } from '../AIBaseConfiguration';
export class AIConversationStarterConfiguration extends AIBaseConfiguration {
  conversationStarterStyle?: AIConversationStarterStyle;
  customView?: (response: Object) => Promise<Object>;
  constructor(props: Partial<AIConversationStarterConfiguration>) {
    super({})
    Object.assign(this, props);
  }

}