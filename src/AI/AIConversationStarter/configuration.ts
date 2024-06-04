import {CometChat} from '@cometchat/chat-sdk-react-native'
import { AIConversationStarterStyle } from './AIConversationStarterStyle';
import { loadingIcon, errorIcon, emptyIcon } from '../resources';
export class AIConversationStarterConfiguration {
    onLoad?:(user?:CometChat.User,group?:CometChat.Group)=>Promise<Object>;
    conversationStarterStyle?:AIConversationStarterStyle;
    customView?:(response:Object) => Promise<Object>;
    ErrorStateView?: (e?: CometChat.CometChatException) => JSX.Element;
    EmptyStateView?: () => JSX.Element;
    LoadingStateView?: () => JSX.Element;
    loadingIconURL?:string = loadingIcon;
    errorIconURL?:string = errorIcon;
    emptyIconURL?:string = emptyIcon;
    constructor(props: Partial<AIConversationStarterConfiguration>) {
      Object.assign(this, props);
    }
    
  }