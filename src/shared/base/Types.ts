import { ImageURISource } from "react-native";
import { CometChatTheme } from "../resources/CometChatTheme";

export type ImageType = ImageURISource // {uri: string} | number;

export type SelectionMode = "none" | "single" | "multiple";

export type MessageReceipt = 'SENT' | 'DELIVERED' | 'READ' | 'ERROR' | 'WAIT';

export type DatePattern = 'timeFormat' | 'dayDateFormat' | 'dayDateTimeFormat';

export type ConversationType = "both" | "users" | "groups";

export type CometChatContextType = {
    theme: CometChatTheme,
    changeThemeMode?: (mode: "light" | "dark") => void,
    changeLocalise?: (language: string) => void,
    applyTheme: (theme: CometChatTheme) => void,
};

export type CometChatTabAlignment = "top" | "bottom";