import React from 'react';
import { FlatList, View } from 'react-native';
import { SelectedAttachment } from '../../modals/SelectedAttachment';
import { CometChatAttachmentPreviewItem } from './CometChatAttachmentPreviewItem';
import { useTheme } from '../../../theme';
import { useCompTheme } from '../../../theme/hook';
import { CometChatTheme } from '../../../theme/type';
import { deepMerge } from '../../helper/helperFunctions';

export interface CometChatAttachmentPreviewProps {
  attachments: SelectedAttachment[];
  onRemove: (fileId: string) => void;
  onRetry: (fileId: string) => void;
  /** Custom styles for the attachment preview, overriding theme styles. */
  style?: CometChatTheme["attachmentPreviewStyles"];
}

function useAggregatePercent(attachments: SelectedAttachment[]): number {
  const totalBytes = attachments.reduce((s, a) => s + (a.file.size || 0), 0);
  if (totalBytes === 0) return 0;
  const loadedBytes = attachments.reduce(
    (s, a) => s + ((a.uploadProgress / 100) * (a.file.size || 0)),
    0
  );
  return Math.min(100, Math.round((loadedBytes / totalBytes) * 100));
}

export const CometChatAttachmentPreview = ({
  attachments,
  onRemove,
  onRetry,
  style,
}: CometChatAttachmentPreviewProps) => {
  const theme = useTheme();
  const compTheme = useCompTheme();
  const s = deepMerge(
    theme.attachmentPreviewStyles ?? {},
    compTheme.attachmentPreviewStyles ?? {},
    style ?? {}
  );
  const aggregatePercent = useAggregatePercent(attachments);
  const allDone = attachments.every(
    a => a.uploadState === 'COMPLETED' || a.uploadState === 'FAILED' || a.uploadState === 'REJECTED'
  );

  if (attachments.length === 0) {
    return null;
  }

  return (
    <View style={s.containerStyle}>
      <FlatList
        horizontal
        data={attachments}
        keyExtractor={(item) => item.fileId}
        renderItem={({ item }) => (
          <CometChatAttachmentPreviewItem
            attachment={item}
            onRemove={onRemove}
            onRetry={onRetry}
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.spacing.s2 }}
      />
      {/* §5.4 — byte-weighted aggregate bar; hidden once all files resolve */}
      {!allDone && (
        <View
          style={{
            height: theme.spacing.spacing.s0_5,
            marginHorizontal: theme.spacing.spacing.s2,
            marginBottom: theme.spacing.spacing.s1,
            borderRadius: theme.spacing.spacing.s0_5,
            backgroundColor: theme.color.neutral200,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: theme.spacing.spacing.s0_5,
              width: `${aggregatePercent}%`,
              backgroundColor: theme.color.primary,
              borderRadius: theme.spacing.spacing.s0_5,
            }}
          />
        </View>
      )}
    </View>
  );
};
