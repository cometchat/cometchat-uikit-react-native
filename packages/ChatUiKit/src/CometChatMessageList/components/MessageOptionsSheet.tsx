import React from 'react';
import { View, Dimensions, Platform } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatBottomSheet } from '../../shared/views';
import { CometChatMessageInformation } from '../../CometChatMessageInformation/CometChatMessageInformation';
import { CometChatQuickReactions } from '../../shared/views/CometChatQuickReactions';
import { CometChatActionSheet } from '../../shared';
import { MessageQuickActions, partitionQuickActions } from './MessageQuickActions';
import { CometChatTheme } from '../../theme/type';
import { CometChatMessageTemplate } from '../../shared/modals/CometChatMessageTemplate';
import { getModerationStatus } from '../../shared/utils/MessageUtils';

interface MessageOptionsSheetProps {
  bottomSheetRef: React.RefObject<any>;
  isOpen: boolean;
  showMessageOptions: any[];
  ExtensionsComponent: React.JSX.Element | null;
  messageInfo: boolean;
  infoObject: React.MutableRefObject<CometChat.BaseMessage | null | undefined>;
  selectedMessage: CometChat.BaseMessage | null;
  hideReactionOption: boolean;
  quickReactionList?: [string, string?, string?, string?, string?];
  templatesMap: Map<string, CometChatMessageTemplate>;
  mergedTheme: CometChatTheme;
  deleteItem: React.MutableRefObject<CometChat.BaseMessage | undefined>;
  pendingReportRef: React.MutableRefObject<boolean>;
  onClose: () => void;
  onDismiss?: () => void;
  onReactionPress: (emoji: string, message?: CometChat.BaseMessage) => void;
  onAddReactionPress?: () => void;
  setShowDeleteModal: (show: boolean) => void;
  setShowReportDialog: (show: boolean) => void;
  setShowMessageOptions: (options: any[]) => void;
  setExtensionsComponent: (component: React.JSX.Element | null) => void;
  setMessageInfo: (show: boolean) => void;
  setShowEmojiKeyboard: (show: boolean) => void;
}

export const MessageOptionsSheet: React.FC<MessageOptionsSheetProps> = ({
  bottomSheetRef,
  isOpen,
  showMessageOptions,
  ExtensionsComponent,
  messageInfo,
  infoObject,
  selectedMessage,
  hideReactionOption,
  quickReactionList,
  templatesMap,
  mergedTheme,
  deleteItem,
  pendingReportRef,
  onClose,
  onDismiss,
  onReactionPress,
  onAddReactionPress,
  setShowDeleteModal,
  setShowReportDialog,
  setShowMessageOptions,
  setMessageInfo,
  setShowEmojiKeyboard,
}) => {
  const quickActions = partitionQuickActions(showMessageOptions);

  return (
    <CometChatBottomSheet
      ref={bottomSheetRef}
      onClose={onClose}
      onDismiss={() => {
        // iOS: Open any deferred modals only after dismiss animation completes
        if (Platform.OS === 'ios') {
          if (deleteItem.current) {
            setShowDeleteModal(true);
          }
          if (pendingReportRef.current) {
            pendingReportRef.current = false;
            setShowReportDialog(true);
          }
        }
        onDismiss?.();
      }}
      isOpen={isOpen}
      doNotOccupyEntireHeight={!messageInfo && !ExtensionsComponent}
      style={{
        paddingHorizontal: 0,
        maxHeight: messageInfo
          ? Dimensions.get('window').height * 0.9
          : Dimensions.get('window').height * 0.52,
        ...(messageInfo || ExtensionsComponent
          ? { minHeight: Dimensions.get('window').height * 0.5 }
          : { minHeight: 50 }),
      }}
    >
      {ExtensionsComponent ? (
        ExtensionsComponent
      ) : messageInfo && infoObject.current ? (
        <CometChatMessageInformation
          message={infoObject.current}
          template={templatesMap.get(
            `${infoObject.current?.getCategory()}_${infoObject.current?.getType()}`
          )}
          onBack={() => {
            infoObject.current = null;
            setMessageInfo(false);
          }}
          style={mergedTheme?.messageListStyles?.messageInformationStyles}
        />
      ) : (
        // flexShrink rather than flex: 1 — in React Native flex: 1 never shrinks below its
        // content, so the column would keep its full height and the list could never scroll.
        <View style={{ flexShrink: 1 }}>
          {/* Show quick reactions for disapproved messages */}
          {!hideReactionOption && getModerationStatus(selectedMessage) !== 'disapproved' && (
            <CometChatQuickReactions
              quickReactions={quickReactionList}
              onReactionPress={onReactionPress}
              onAddReactionPress={
                onAddReactionPress ??
                (() => {
                  setShowMessageOptions([]);
                  setTimeout(() => {
                    setShowEmojiKeyboard(true);
                  }, 200);
                })
              }
              style={mergedTheme.quickReactionStyle}
            />
          )}

          {/* One split, two halves: promoted actions are REMOVED from the list, so nothing
              appears twice. With Pin and Save both unavailable the row is empty and every
              option — Reply included — stays in the list, leaving the sheet exactly as it was
              before this feature existed. */}
          <MessageQuickActions
            actions={quickActions.tiles}
            message={selectedMessage}
            theme={mergedTheme}
          />

          {/* The list takes whatever height the sheet has left after the rows above it, and
              scrolls within that. A fixed cap has to guess the height of those rows, and a guess
              that misses pushes the last options below the screen where they can't be reached. */}
          <View style={{ flexShrink: 1 }}>
            <CometChatActionSheet
              actions={quickActions.list}
              style={mergedTheme.messageListStyles.messageOptionsStyles}
            />
          </View>
        </View>
      )}
    </CometChatBottomSheet>
  );
};
