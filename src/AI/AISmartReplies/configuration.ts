import  {CometChat} from '@cometchat/chat-sdk-react-native'
import { AISmartRepliesStyle } from './AISmartRepliesStyle';
import { loadingIcon, errorIcon, emptyIcon } from '../resources';
export class AISmartRepliesConfiguration {
    onClick?:(user?:CometChat.User,group?:CometChat.Group)=>Promise<Object>;
    smartRepliesStyle?:AISmartRepliesStyle;
    customView?:(response:Object,closeBottomsheet?:()=>void) => Promise<Object>;
    ErrorStateView?: (e?: CometChat.CometChatException) => JSX.Element;
    EmptyStateView?: () => JSX.Element;
    LoadingStateView?: () => JSX.Element;
    loadingIconURL?:string = loadingIcon;
    errorIconURL?:string = errorIcon;
    emptyIconURL?:string = emptyIcon;
    constructor(props: Partial<AISmartRepliesConfiguration>) {
      Object.assign(this, props);
    }
  }