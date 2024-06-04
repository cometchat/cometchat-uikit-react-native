import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatUIEventHandler } from "../events/CometChatUIEventHandler/CometChatUIEventHandler";
import { CometChatConversationEvents, CometChatGroupsEvents, CometChatUIEvents, MessageEvents } from "../events";

export class CometChatUIKitHelper {
    //---------- Message Events ----------
    static onMessageSent(message: CometChat.BaseMessage, status: string): void {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageSent, { message, status });
    }

    static onMessageEdited(message: CometChat.BaseMessage, status: string): void {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageEdited, { message, status });
    }

    static onMessageDeleted(message: CometChat.BaseMessage): void {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageDeleted, { message });
    }

    static onMessageRead(message: CometChat.BaseMessage): void {
        CometChatUIEventHandler.emitMessageEvent(MessageEvents.ccMessageRead, { message });
    }

    //---------- User Events ----------
    static onUserBlocked(user: CometChat.User): void {
        CometChatUIEventHandler.emitUserEvent(CometChatUIEvents.ccUserBlocked, { user });
    }

    static onUserUnblocked(user: CometChat.User): void {
        CometChatUIEventHandler.emitUserEvent(CometChatUIEvents.ccUserUnBlocked, { user });
    }

    //---------- Group Events ----------
    static onGroupCreated(group: CometChat.Group): void {
        CometChatUIEventHandler.emitGroupEvent(CometChatGroupsEvents.ccGroupCreated, { group });
    }

    static onGroupDeleted(group: CometChat.Group): void {
        CometChatUIEventHandler.emitGroupEvent(CometChatGroupsEvents.ccGroupDeleted, { group });
    }

    static onGroupLeft(message: CometChat.Action, leftUser: CometChat.User, leftGroup: CometChat.Group): void {
        CometChatUIEventHandler.emitGroupEvent(CometChatUIEvents.ccGroupLeft, { message, leftUser, leftGroup });
    }

    static onGroupMemberScopeChanged(
        message: CometChat.Action,
        updatedUser: CometChat.User,
        scopeChangedTo: string,
        scopeChangedFrom: string,
        group: CometChat.Group
    ): void {
        CometChatUIEventHandler.emitGroupEvent(CometChatGroupsEvents.ccGroupMemberScopeChanged, {
            message,
            updatedUser,
            scopeChangedTo,
            scopeChangedFrom,
            group
        });
    }

    static onGroupMemberBanned(
        message: CometChat.Action,
        bannedUser: CometChat.User,
        bannedBy: CometChat.User,
        bannedFrom: CometChat.Group
    ): void {
        CometChatUIEventHandler.emitGroupEvent(CometChatGroupsEvents.ccGroupMemberBanned, { message, bannedUser, bannedBy, group: bannedFrom });
    }

    static onGroupMemberKicked(
        message: CometChat.Action,
        kickedUser: CometChat.User,
        kickedBy: CometChat.User,
        kickedFrom: CometChat.Group
    ): void {
        CometChatUIEventHandler.emitGroupEvent(CometChatGroupsEvents.ccGroupMemberKicked, { message, kickedUser, kickedBy, group: kickedFrom });
    }

    static onGroupMemberUnbanned(
        message: CometChat.Action,
        unbannedUser: CometChat.User,
        unbannedBy: CometChat.User,
        unbannedFrom: CometChat.Group
    ): void {
        CometChatUIEventHandler.emitGroupEvent(CometChatUIEvents.ccGroupMemberUnBanned, { message, unbannedUser, unbannedBy, unbannedFrom });
    }

    static onGroupMemberJoined(joinedUser: CometChat.User, joinedGroup: CometChat.Group): void {
        CometChatUIEventHandler.emitGroupEvent(CometChatUIEvents.ccGroupMemberJoined, { joinedUser, joinedGroup });
    }

    static onGroupMemberAdded(
        messages: CometChat.Action[],
        usersAdded: CometChat.User[],
        groupAddedIn: CometChat.Group,
        addedBy: CometChat.User
    ): void {
        CometChatUIEventHandler.emitGroupEvent(CometChatUIEvents.ccGroupMemberAdded, { messages, usersAdded, usersAddedIn: groupAddedIn, addedBy });
    }

    static onOwnershipChanged(group: CometChat.Group, newOwner: CometChat.GroupMember): void {
        CometChatUIEventHandler.emitGroupEvent(CometChatUIEvents.ccOwnershipChanged, { group, newOwner });
    }

    //---------- Conversation Events ----------
    static onConversationDeleted(conversation: CometChat.Conversation): void {
        CometChatUIEventHandler.emitConversationEvent(CometChatConversationEvents.ccConversationDeleted, { conversation });
    }

    // // // not sure RN need this.
    //     //---------- CometChat UI Events ----------
    //     ///[showPanel] used to reveal a panel above message composer
    //     static showPanel(
    //         Map<String, dynamic>? id, alignment align, WidgetBuilder child) {
    //     CometChatUIEvents.showPanel(id, align, child);
    // }

    // ///[hidePanel] used to hide the panel above message composer
    // static hidePanel(Map<String, dynamic> ? id, alignment align) {
    //     CometChatUIEvents.hidePanel(id, align);
}
