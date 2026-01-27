import React from 'react';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { Icon } from '../../shared/icons/Icon';
import { CometChatConfirmDialog, CometChatReportDialog } from '../../shared/views';
import { CometChatTheme } from '../../theme/type';

interface MessageModalsProps {
  showDeleteModal: boolean;
  showReportDialog: boolean;
  deleteItem: React.MutableRefObject<CometChat.BaseMessage | undefined>;
  reportedMessageRef: React.MutableRefObject<CometChat.BaseMessage | null>;
  theme: CometChatTheme;
  hideFlagRemarkField?: boolean;
  t: (key: string) => string;
  onDeleteCancel: () => void;
  onDeleteConfirm: (message: CometChat.BaseMessage) => void;
  onReportCancel: () => void;
  onReportSubmit: (payload: any) => void;
}

export const MessageModals: React.FC<MessageModalsProps> = ({
  showDeleteModal,
  showReportDialog,
  deleteItem,
  reportedMessageRef,
  theme,
  hideFlagRemarkField,
  t,
  onDeleteCancel,
  onDeleteConfirm,
  onReportCancel,
  onReportSubmit,
}) => {
  return (
    <>
      <CometChatConfirmDialog
        titleText={t('DELETE_THIS_MESSAGE')}
        icon={<Icon name="delete" size={theme.spacing.spacing.s12} color={theme.color.error} />}
        cancelButtonText={t('CANCEL')}
        confirmButtonText={t('DELETE')}
        messageText={t('DELETE_MESSAGE_CONFIRM')}
        isOpen={showDeleteModal}
        onCancel={onDeleteCancel}
        onConfirm={() => {
          if (deleteItem.current) {
            onDeleteConfirm(deleteItem.current);
          }
        }}
      />

      <CometChatReportDialog
        isOpen={showReportDialog}
        message={reportedMessageRef.current || undefined}
        onCancel={onReportCancel}
        hideFlagRemarkField={hideFlagRemarkField}
        onReport={onReportSubmit}
      />
    </>
  );
};
