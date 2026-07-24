import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeEventEmitter,
  NativeModules,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatTheme } from '../../../theme/type';
import { deepMerge } from '../../helper/helperFunctions';
import { useCompTheme } from '../../../theme/hook';
import { Icon } from '../../icons/Icon';
import { getFileTypeIcon, ATTACHMENT_COLLAPSED_LIMIT } from '../../constants/UIKitConstants';
import { useCometChatTranslation } from '../../resources/CometChatLocalizeNew';
import { groupAttachments } from '../../utils/groupAttachments';
import { CometChatUIKit } from '../../CometChatUiKit';
import { CometChatCaptionText } from '../CometChatCaptionText';

const { FileManager } = NativeModules;
const fileEventEmitter = new NativeEventEmitter(FileManager);

// ---------------------------------------------------------------------------
// Design doc §8.6 — the "FilesBubble": renders a single-kind file message
// (all non-media file attachments, after the §7 fan-out) as a downloadable
// card-list. A SINGLE file renders as a plain row; MULTIPLE files (a collection)
// each get their own lighter, rounded card — the SAME treatment as the audio
// collection bubble (CometChatAudiosBubble): extendedPrimary800/neutral100 card,
// radius.r3, padding.p3, margin.m2 gap. (Renders what was the files section of the
// now-retired multi-section gallery bubble.)
// ---------------------------------------------------------------------------

type DownloadState = 'IDLE' | 'DOWNLOADING' | 'DONE' | 'FAILED';

function formatFileSize(bytes?: number): string {
  // Missing/invalid size (e.g. an attachment reconstructed without a size field) → no label,
  // so the row shows just the extension instead of "undefined B".
  if (typeof bytes !== 'number' || !isFinite(bytes) || bytes <= 0) return '';
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${Math.round(bytes / 1_024)} KB`;
  return `${bytes} B`;
}

function getExtension(name: string): string {
  return (name.split('.').pop() ?? '').toUpperCase();
}

export interface CometChatFilesBubbleProps {
  message: CometChat.MediaMessage;
  theme: CometChatTheme;
  /** Per-instance style overrides (applied over the tokenized defaults) — same pattern as the
   *  other bubbles (e.g. CometChatAudioBubble / CometChatFileBubble). */
  style?: CometChatTheme["filesBubbleStyles"];
}

/**
 * Renders a single-kind file message (all files, after the §7 fan-out) as a
 * vertical list of downloadable rows, with a caption on the message. One file =
 * plain row; two or more = one lighter card per file (matches the audio bubble).
 */
export function CometChatFilesBubble({
  message,
  theme,
  style,
}: CometChatFilesBubbleProps) {
  const { t } = useCometChatTranslation();
  const compTheme = useCompTheme();
  const mergedStyle = deepMerge(
    theme.filesBubbleStyles ?? {},
    compTheme.filesBubbleStyles ?? {},
    style ?? {}
  );
  const [expanded, setExpanded] = useState(false);
  const [downloadStates, setDownloadStates] = useState<Record<string, DownloadState>>({});
  // Android's DownloadManager is async — map each downloadId to the file to OPEN once its
  // `downloadComplete` event fires (iOS resolves synchronously in the checkAndDownload callback).
  const pendingOpensRef = useRef<Record<string, { url: string; name: string; key: string }>>({});
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = fileEventEmitter.addListener('downloadComplete', (data: { downloadId: number }) => {
      const pending = pendingOpensRef.current[String(data?.downloadId)];
      if (pending) {
        FileManager?.openFile?.(pending.url, pending.name, () => {});
        setDownloadStates(prev => ({ ...prev, [pending.key]: 'DONE' }));
        delete pendingOpensRef.current[String(data.downloadId)];
      }
    });
    return () => sub.remove();
  }, []);

  // A `file`-type message can carry media attachments too: web sends a MIXED batch as ONE `file`
  // message (video + image + docs together) instead of fanning out per kind the way this app does.
  // Its intent is a file/download LIST of every attachment — so recombine all of groupAttachments'
  // kind-split groups here. Using only `fileAttachments` would silently drop the video/image and
  // render an empty bubble. (App-native `file` messages carry only real files, so this is a no-op
  // for them.)
  const { mediaAttachments, audioAttachments, fileAttachments } = groupAttachments(message);
  const files = [...mediaAttachments, ...audioAttachments, ...fileAttachments];
  const caption = message.getCaption() ?? '';
  const isSentByMe = message.getSender()?.getUid() === CometChatUIKit.loggedInUser?.getUid();

  if (files.length === 0) return null;

  // 2+ files → each file sits in its own lighter card (like the audio collection); a single file
  // stays a plain row on the message bubble.
  const isCollection = files.length > 1;
  const visibleFiles =
    expanded || files.length <= ATTACHMENT_COLLAPSED_LIMIT
      ? files
      : files.slice(0, ATTACHMENT_COLLAPSED_LIMIT);

  const hiddenCount = files.length - ATTACHMENT_COLLAPSED_LIMIT;
  const showExpandButton = files.length > ATTACHMENT_COLLAPSED_LIMIT;

  const handleDownload = (file: CometChat.Attachment) => {
    const url = file.getUrl();
    const name = file.getName();
    const key = url;
    if ((downloadStates[key] ?? 'IDLE') === 'DOWNLOADING') return;

    // Tap = OPEN the document (mirror CometChatFileBubble — the multi bubble previously only
    // downloaded and never opened, so multi-doc messages "didn't open" after sending). If a local
    // copy already exists, open it immediately; otherwise download first, then open on completion.
    FileManager?.doesFileExist?.(name, (existResult: string) => {
      let exists = false;
      try { exists = !!JSON.parse(existResult)?.exists; } catch {}
      if (exists) {
        FileManager?.openFile?.(url, name, () => {});
        setDownloadStates(prev => ({ ...prev, [key]: 'DONE' }));
        return;
      }

      setDownloadStates(prev => ({ ...prev, [key]: 'DOWNLOADING' }));
      FileManager?.checkAndDownload?.(url, name, (result: string) => {
        try {
          const parsed = JSON.parse(result);
          if (Platform.OS === 'ios') {
            // iOS resolves the download in this callback — open on success.
            if (parsed.success) {
              FileManager?.openFile?.(url, name, () => {});
              setDownloadStates(prev => ({ ...prev, [key]: 'DONE' }));
            } else {
              setDownloadStates(prev => ({ ...prev, [key]: 'FAILED' }));
            }
          } else if (parsed.downloadId != null) {
            // Android: DownloadManager is async — the downloadComplete listener opens it.
            pendingOpensRef.current[String(parsed.downloadId)] = { url, name, key };
          } else {
            setDownloadStates(prev => ({ ...prev, [key]: 'FAILED' }));
          }
        } catch {
          setDownloadStates(prev => ({ ...prev, [key]: 'FAILED' }));
        }
      });
    });
  };

  const S = theme.spacing;
  const textColor = isSentByMe ? theme.color.sendBubbleText : theme.color.receiveBubbleText;
  const subtextColor = isSentByMe ? theme.color.sendBubbleTimestamp : theme.color.receiveBubbleTimestamp;
  // Card surface: a lighter purple on the sent (purple) bubble; on received, a shade DARKER than the
  // grey bubble (neutral400 vs the neutral300 bubble) so cards read as grey-on-lighter — not the
  // near-white (lighter-than-bubble) cards, which inverted the design.
  const cardBg = isSentByMe ? theme.color.extendedPrimary800 : theme.color.neutral400;
  // Accent for the download icon + "Show more": white on the sent (purple) bubble, primary on received.
  const accentColor = isSentByMe ? theme.color.staticWhite : theme.color.primary;

  return (
    // Size to content like the AudiosBubble (no fixed minWidth floor) so the message-bubble wrapper's
    // horizontal padding stays symmetric — a screen-% floor could exceed the wrapper's content area and
    // push the cards past the right padding, making L/R padding look uneven.
    <View testID="bubble-file" style={[{ width: '100%' }, mergedStyle.containerStyle]}>
      {visibleFiles.map((file, index) => {
        const key = file.getUrl();
        const dlState = downloadStates[key] ?? 'IDLE';
        const ext = getExtension(file.getName());
        // Join only the parts we actually have → "1.2 MB • PDF", "PDF", or "" — never "undefined B".
        const sizeLabel = [formatFileSize(file.getSize()), ext].filter(Boolean).join(' • ');

        const row = (
          <TouchableOpacity
            onPress={() => handleDownload(file)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: S.spacing.s2,
              // In collection mode the card supplies the padding (p3); a single row pads itself.
              ...(isCollection
                ? null
                : { paddingVertical: S.padding.p3, paddingHorizontal: S.padding.p3 }),
            }}
            accessibilityRole="button"
            accessibilityLabel={`Download ${file.getName()}`}
          >
            {/* Colored file type icon */}
            <Icon name={getFileTypeIcon(file.getName())} size={S.spacing.s8} />

            {/* Name + size•ext. minWidth:0 lets the Texts truncate cleanly inside the flex row instead
                of forcing the row wider / wrapping (Android). */}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                ellipsizeMode="middle"
                style={[{ ...theme.typography.body.medium, color: textColor }, mergedStyle.fileNameStyle]}
              >
                {file.getName()}
              </Text>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[{ ...theme.typography.caption1.regular, color: subtextColor, marginTop: S.margin.m0_5 }, mergedStyle.fileSizeTextStyle]}
              >
                {sizeLabel}
              </Text>
              {dlState === 'FAILED' && (
                <Text
                  style={{ ...theme.typography.caption2.regular, color: theme.color.error, marginTop: S.margin.m0_5 }}
                >
                  {t('DOWNLOAD_FAILED') ?? 'Download failed'}
                </Text>
              )}
            </View>

            {/* Download state indicator. flex-end (not center) so the icon sits flush against the card's
                right padding — matching the file icon flush against the left padding → symmetric L/R. */}
            <View style={{ width: S.spacing.s6, alignItems: 'flex-end' }}>
              {dlState === 'DOWNLOADING' ? (
                <ActivityIndicator
                  size="small"
                  color={isSentByMe ? theme.color.staticWhite : theme.color.primary}
                />
              ) : dlState === 'DONE' ? (
                <Icon name="check-fill" size={S.spacing.s5} color={theme.color.primary} />
              ) : (
                <Icon name="download" size={S.spacing.s5} color={accentColor as string} imageStyle={mergedStyle.downloadIconStyle} />
              )}
            </View>
          </TouchableOpacity>
        );

        // 2+ files → wrap each row in its own lighter card, with a gap between cards (and before
        // the expand button). Single file → plain row, no card.
        if (isCollection) {
          const notLastCard = index < visibleFiles.length - 1 || showExpandButton;
          return (
            <View
              key={key}
              style={[{
                backgroundColor: cardBg,
                borderRadius: S.radius.r3,
                padding: S.padding.p3,
                marginBottom: notLastCard ? S.margin.m2 : 0,
              }, mergedStyle.cardStyle]}
            >
              {row}
            </View>
          );
        }
        return <View key={key}>{row}</View>;
      })}

      {/* Expand / Collapse — a filled button matching the file cards: "⌄ Show N more" / "⌃ Show less",
          chevron first, on the card surface. */}
      {showExpandButton && (
        <TouchableOpacity
          testID="file-list-expand"
          onPress={() => setExpanded(e => !e)}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: S.spacing.s1,
            backgroundColor: cardBg,
            borderRadius: S.radius.r3,
            paddingVertical: S.padding.p3,
            paddingHorizontal: S.padding.p3,
          }}
          accessibilityRole="button"
        >
          <Icon
            name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={S.spacing.s5}
            color={accentColor as string}
          />
          <Text style={[{ ...theme.typography.body.medium, color: accentColor }, mergedStyle.expandButtonTextStyle]}>
            {expanded
              ? (t('FILE_LIST_SHOW_LESS') ?? 'Show less')
              : (t('FILE_LIST_SHOW_MORE') ?? `Show ${hiddenCount} more`).replace('{count}', String(hiddenCount))}
          </Text>
        </TouchableOpacity>
      )}

      {/* §7 — caption rides on the (last) message of the batch */}
      {Boolean(caption) && (
        <CometChatCaptionText
          message={message}
          caption={caption}
          theme={theme}
          containerStyle={{
            paddingHorizontal: S.padding.p3,
            paddingTop: S.padding.p2,
            paddingBottom: S.padding.p1,
          }}
          textStyle={[{
            ...theme.typography.body.regular,
            color: textColor,
          }, mergedStyle.captionStyle]}
        />
      )}
    </View>
  );
}
