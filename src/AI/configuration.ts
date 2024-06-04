import { CardStyle, CardViewStyle } from "./CardViewStyle";
import {CometChat} from '@cometchat/chat-sdk-react-native'
import { emptyIcon, errorIcon, loadingIcon } from "./resources";
export class AIEnablerConfiguration {
    listStyle?: CardViewStyle;
    listItemStyle?:CardStyle;
    buttonIconURL?: string = "";
    ErrorStateView?: (e?: CometChat.CometChatException) => JSX.Element;
    EmptyStateView?: () => JSX.Element;
    LoadingStateView?: () => JSX.Element;
    loadingIconURL?:string = loadingIcon;
    errorIconURL?:string = errorIcon;
    emptyIconURL?:string = emptyIcon;
    constructor(props: Partial<AIEnablerConfiguration>) {
      Object.assign(this, props);
    }
  }