import { AvatarStyleInterface } from "../../shared";
import { ButtonStyleInterface } from "../../shared/views/CometChatButton";
import { OutgoingCallStyleInterface } from "./OutgoingCallStyle";

export interface OutgoingCallInterface {
    outgoingCallStyle?:OutgoingCallStyleInterface,
    buttonStyle?: ButtonStyleInterface,
    avatarStyle?: AvatarStyleInterface,
    disableSoundForCall?: boolean,
    customSoundForCall?: string,
}

export class OutgoingCall implements OutgoingCallInterface {
    outgoingCallStyle?:OutgoingCallStyleInterface
    buttonStyle?: ButtonStyleInterface
    avatarStyle?: AvatarStyleInterface
    disableSoundForCall?: boolean
    customSoundForCall?: string

    constructor({
        avatarStyle,
        buttonStyle,
        customSoundForCall,
        disableSoundForCall,
        outgoingCallStyle,
    }:OutgoingCallInterface) {
        this.avatarStyle = avatarStyle;
        this.buttonStyle = buttonStyle;
        this.customSoundForCall = customSoundForCall;
        this.disableSoundForCall = disableSoundForCall;
        this.outgoingCallStyle = outgoingCallStyle;
    }
}