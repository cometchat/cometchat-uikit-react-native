import {CometChat} from '@cometchat/chat-sdk-react-native'
import { emptyIcon, errorIcon, loadingIcon } from "./resources";
export class AIBaseConfiguration {
    apiConfiguration?: (user?: CometChat.User, group?: CometChat.Group) => Promise<Object>;
    ErrorStateView?: (e?: CometChat.CometChatException) => JSX.Element;
    EmptyStateView?: () => JSX.Element;
    LoadingStateView?: () => JSX.Element;
    loadingIconURL?:string = loadingIcon;
    errorIconURL?:string = errorIcon;
    emptyIconURL?:string = emptyIcon;
    constructor(props: Partial<AIBaseConfiguration>) {
      Object.assign(this, props);
    }
  }