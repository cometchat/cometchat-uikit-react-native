import { CometChatTheme } from '../../../theme/type';

export const getAttachmentPreviewStyle = (
  color: CometChatTheme['color'],
  spacing: CometChatTheme['spacing']
) => ({
  container: {
    paddingVertical: spacing.padding.p2,
    borderTopWidth: 1,
    borderTopColor: color.neutral200,
    backgroundColor: color.background1,
  },
  itemContainer: {
    width: 72,
    height: 72,
    borderRadius: spacing.radius.r2,
    margin: spacing.margin.m1,
    overflow: 'hidden' as const,
    backgroundColor: color.neutral200,
  },
  removeButton: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
});
