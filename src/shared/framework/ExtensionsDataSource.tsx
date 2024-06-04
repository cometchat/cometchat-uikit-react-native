import { CometChat } from "@cometchat/chat-sdk-react-native";

abstract class ExtensionsDataSource {
    abstract addExtension(): void;
    abstract getExtensionId(): string;

    enable(): void {
        CometChat.isExtensionEnabled(this.getExtensionId()).then(
          (enabled: Boolean) => {
            if (enabled) this.addExtension();
          }
        );
      }
}

export { ExtensionsDataSource };

// export interface ExtensionsDataSource {
//     enable()
// }