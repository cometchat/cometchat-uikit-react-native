import { AISmartRepliesStyle } from './AISmartRepliesStyle';
import { AIBaseConfiguration } from '../AIBaseConfiguration';
import { CardStyle } from '../CardViewStyle';
export class AISmartRepliesConfiguration extends AIBaseConfiguration {
    customView?:(response:Object,closeBottomsheet?:()=>void) => Promise<Object>;
    smartRepliesStyle?:AISmartRepliesStyle;
    listItemStyle?:CardStyle;
    constructor(props: Partial<AISmartRepliesConfiguration>) {
      super({});
      Object.assign(this, props);
    }
  }