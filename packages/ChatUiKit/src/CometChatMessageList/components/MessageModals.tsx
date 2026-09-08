import React from 'react';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { Icon } from '../../shared/icons/Icon';
import { CometChatConfirmDialog, CometChatReportDialog } from '../../shared/views';
import { CometChatTheme } from '../../theme/type';

interface MessageModalsProps {
  showDeleteModal: boolean;
  showReportDialog: boolean;
  /**
   * The pending unpin/unsave, or null when nothing is awaiting confirmation.
   * Pin and save deliberately have no dialog — see requestPinSaveAction.
   */
  pinSaveConfirm: { message: CometChat.BaseMessage; action: 'unpin' | 'unsave' } | null;
  deleteItem: React.MutableRefObject<CometChat.BaseMessage | undefined>;
  reportedMessageRef: React.MutableRefObject<CometChat.BaseMessage | null>;
  theme: CometChatTheme;
  hideFlagRemarkField?: boolean;
  t: (key: string) => string;
  onDeleteCancel: () => void;
  onDeleteConfirm: (message: CometChat.BaseMessage) => void;
  onReportCancel: () => void;
  onReportSubmit: (payload: any) => void;
  onPinSaveCancel: () => void;
  onPinSaveConfirm: () => void;
}

export const MessageModals: React.FC<MessageModalsProps> = ({
  showDeleteModal,
  showReportDialog,
  pinSaveConfirm,
  deleteItem,
  reportedMessageRef,
  theme,
  hideFlagRemarkField,
  t,
  onDeleteCancel,
  onDeleteConfirm,
  onReportCancel,
  onReportSubmit,
  onPinSaveCancel,
  onPinSaveConfirm,
}) => {
  const isUnpin = pinSaveConfirm?.action === 'unpin';
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

      {/* Unpin/unsave only. Both are removals with no on-screen undo, which is the
          whole reason they ask and their additive counterparts do not. */}
      <CometChatConfirmDialog
        titleText={isUnpin ? t('UNPIN_MESSAGE_TITLE') : t('UNSAVE_MESSAGE_TITLE')}
        icon={
          <Icon
            name={isUnpin ? 'keep-off' : 'unsave'}
            size={theme.spacing.spacing.s12}
            color={theme.color.error}
          />
        }
        cancelButtonText={t('CANCEL')}
        confirmButtonText={isUnpin ? t('UNPIN') : t('UNSAVE')}
        messageText={isUnpin ? t('UNPIN_MESSAGE_CONFIRM') : t('UNSAVE_MESSAGE_CONFIRM')}
        isOpen={pinSaveConfirm != null}
        onCancel={onPinSaveCancel}
        onConfirm={onPinSaveConfirm}
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
