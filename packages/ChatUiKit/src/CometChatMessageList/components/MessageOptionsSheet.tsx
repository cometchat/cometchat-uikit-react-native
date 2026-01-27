import React from 'react';
import { View, Dimensions, Platform } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatBottomSheet } from '../../shared/views';
import { CometChatMessageInformation } from '../../CometChatMessageInformation/CometChatMessageInformation';
import { CometChatQuickReactions } from '../../shared/views/CometChatQuickReactions';
import { CometChatActionSheet } from '../../shared';
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
      style={{
        paddingHorizontal: 0,
        maxHeight: messageInfo
          ? Dimensions.get('window').height * 0.9
          : Dimensions.get('window').height * 0.52,
        minHeight: Dimensions.get('window').height * 0.5,
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
        <View style={{ flex: 1 }}>
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

          <CometChatActionSheet
            actions={showMessageOptions}
            style={mergedTheme.messageListStyles.messageOptionsStyles}
          />
        </View>
      )}
    </CometChatBottomSheet>
  );
};
