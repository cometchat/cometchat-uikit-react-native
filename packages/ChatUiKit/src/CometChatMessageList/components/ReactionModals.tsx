import React from 'react';
import { Dimensions } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatBottomSheet } from '../../shared/views';
import { CometChatEmojiKeyboard } from '../../shared/views/CometChatEmojiKeyboard';
import { CometChatReactionList } from '../../shared/views/CometChatReactionList';

interface ReactionModalsProps {
  showEmojiKeyboard: boolean;
  showReactionList: boolean;
  selectedMessage: CometChat.BaseMessage | null;
  selectedEmoji: string | undefined;
  reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;
  onReactionListItemPress?: (reaction: CometChat.Reaction, message: CometChat.BaseMessage) => void;
  onEmojiSelect: (emoji: string, message: CometChat.BaseMessage) => void;
  onEmojiKeyboardClose: () => void;
  onReactionListClose: () => void;
  onReactionListEmpty: () => void;
}

export const ReactionModals: React.FC<ReactionModalsProps> = ({
  showEmojiKeyboard,
  showReactionList,
  selectedMessage,
  selectedEmoji,
  reactionsRequestBuilder,
  onReactionListItemPress,
  onEmojiSelect,
  onEmojiKeyboardClose,
  onReactionListClose,
  onReactionListEmpty,
}) => {
  return (
    <>
      <CometChatBottomSheet
        isOpen={showEmojiKeyboard}
        onClose={onEmojiKeyboardClose}
        style={{
          maxHeight: Dimensions.get('window').height * 0.49,
        }}
      >
        <CometChatEmojiKeyboard
          onClick={(item) => {
            onEmojiKeyboardClose();
            if (selectedMessage) {
              onEmojiSelect(item, selectedMessage);
            }
          }}
        />
      </CometChatBottomSheet>

      <CometChatBottomSheet
        isOpen={showReactionList}
        onClose={onReactionListClose}
        style={{
          maxHeight: Dimensions.get('window').height * 0.7,
          minHeight: Dimensions.get('window').height * 0.3,
        }}
      >
        <CometChatReactionList
          message={selectedMessage!}
          selectedReaction={selectedEmoji}
          onPress={onReactionListItemPress}
          reactionsRequestBuilder={reactionsRequestBuilder}
          onListEmpty={onReactionListEmpty}
        />
      </CometChatBottomSheet>
    </>
  );
};
