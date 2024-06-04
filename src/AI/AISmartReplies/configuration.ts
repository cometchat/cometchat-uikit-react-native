import { AISmartRepliesStyle } from './AISmartRepliesStyle';
import { AIBaseConfiguration } from '../AIBaseConfiguration';
export class AISmartRepliesConfiguration extends AIBaseConfiguration {
    customView?:(response:Object,closeBottomsheet?:()=>void) => Promise<Object>;
    smartRepliesStyle?:AISmartRepliesStyle;
    constructor(props: Partial<AISmartRepliesConfiguration>) {
      super({});
      Object.assign(this, props);
    }
  }