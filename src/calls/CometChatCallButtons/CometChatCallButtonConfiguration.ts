import { CometChat } from "@cometchat/chat-sdk-react-native";
import { ImageType } from "../../shared";
import { CallButtonStyleInterface } from "./CallButtonStyle";

export interface CometChatCallButtonConfigurationInterface {
    voiceIconImage?: ImageType,
    videoIconImage?: ImageType,
    hideVideoCall?: boolean,
    hideVoiceCall?: boolean,
    onVoiceCallPress?: (param:{user?: CometChat.User, group?: CometChat.Group}) => void,
    onVideoCallPress?: (param:{user?: CometChat.User, group?: CometChat.Group}) => void,
    callButtonStyle: CallButtonStyleInterface,
}

export default class CometChatCallButtonConfiguration implements CometChatCallButtonConfigurationInterface{
    voiceIconImage?: ImageType;
    videoIconImage?: ImageType;
    hideVideoCall?: boolean;
    hideVoiceCall?: boolean;
    onVoiceCallPress?: (param: { user?: CometChat.User; group?: CometChat.Group; }) => void;
    onVideoCallPress?: (param: { user?: CometChat.User; group?: CometChat.Group; }) => void;
    callButtonStyle: CallButtonStyleInterface;

    constructor({
        callButtonStyle,
        onVideoCallPress,
        onVoiceCallPress,
        videoIconImage,
        voiceIconImage,
        hideVideoCall,
        hideVoiceCall
    }: CometChatCallButtonConfigurationInterface) {
        this.callButtonStyle = callButtonStyle;
        this.onVideoCallPress = onVideoCallPress;
        this.onVoiceCallPress = onVoiceCallPress;
        this.videoIconImage = videoIconImage;
        this.voiceIconImage = voiceIconImage;
        this.hideVideoCall = hideVideoCall;
        this.hideVoiceCall = hideVoiceCall;
    }
}