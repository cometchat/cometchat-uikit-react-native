/**
 * CometChatMediaViewer — §8.2.1
 *
 * Unified fullscreen pager for image + video attachments.
 * Each page renders by mimeType:
 *   - image/* → zoomable image
 *   - video/* → inline react-native-video player
 *
 * Audio and file attachments are NOT pages here — they are handled at the tile level.
 * Contract: `mediaItems` should contain only image/* and video/* attachments.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  NativeModules,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import Video from 'react-native-video';
import { Icon } from '../../icons/Icon';
import { useTheme } from '../../../theme';
import { useCometChatTranslation } from '../../resources/CometChatLocalizeNew';
import { clampIndex, isImageMime, isVideoMime, nextIndexForSwipe } from './mediaViewerUtils';

/** Default: an item is previewable if it's an image or a video. A per-kind bubble (ImagesBubble /
 *  VideosBubble) overrides this so anything outside its own kind renders the "No preview" page. */
const defaultCanPreview = (att: CometChat.Attachment): boolean => {
  const m = att.getMimeType?.() ?? '';
  return isImageMime(m) || isVideoMime(m);
};

export interface CometChatMediaViewerProps {
  /** Attachments to page through. May include non-previewable items → "No preview available" page. */
  mediaItems: CometChat.Attachment[];
  /** Zero-based index of the item to open on. */
  startIndex: number;
  visible: boolean;
  onClose: () => void;
  /** Optional: the parent message (used for sender/timestamp in header). */
  message?: CometChat.BaseMessage;
  /** Which items get a real preview; the rest show the "No preview available" page. Defaults to
   *  image-or-video. VideosBubble passes video-only, ImagesBubble image-only. */
  canPreview?: (att: CometChat.Attachment) => boolean;
}

type DownloadState = 'IDLE' | 'DOWNLOADING' | 'DONE' | 'FAILED';

const { FileManager } = NativeModules;
const { width: SCREEN_W } = Dimensions.get('window');

function formatFileSize(bytes: number): string {
  if (!(bytes > 0)) return '';   // undefined / 0 / NaN → show nothing (not "undefined B")
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
}


export const CometChatMediaViewer = ({
  mediaItems,
  startIndex,
  visible,
  onClose,
  message,
  canPreview = defaultCanPreview,
}: CometChatMediaViewerProps) => {
  const { t } = useCometChatTranslation();
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(() => clampIndex(startIndex, mediaItems.length));
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [downloadState, setDownloadState] = useState<DownloadState>('IDLE');

  // Ref so PanResponder closure always reads the latest index without re-creation
  const currentIndexRef = useRef(clampIndex(startIndex, mediaItems.length));

  // Sync startIndex when viewer reopens on a different item (clamped so out-of-range can't blank the page)
  useEffect(() => {
    if (visible) {
      const clamped = clampIndex(startIndex, mediaItems.length);
      currentIndexRef.current = clamped;
      setCurrentIndex(clamped);
      setMediaLoaded(false);
      setMediaError(false);
      setDownloadState('IDLE');
      setIsBuffering(false);
    }
  }, [visible, startIndex, mediaItems.length]);

  const current = mediaItems[currentIndex];
  // A per-kind bubble marks off-kind attachments (e.g. a .jpg inside a VIDEO message) as not
  // previewable → they render the "No preview available" page instead of the image/video.
  const previewable = current ? canPreview(current) : false;
  const isVideo = previewable && current ? isVideoMime(current.getMimeType?.() ?? '') : false;

  const mediaItemsRef = useRef(mediaItems);
  // Keep the ref in sync outside render (not during it) so the PanResponder closure reads the latest list.
  useEffect(() => {
    mediaItemsRef.current = mediaItems;
  }, [mediaItems]);

  const goTo = (idx: number) => {
    const clamped = clampIndex(idx, mediaItemsRef.current.length);
    currentIndexRef.current = clamped;
    setCurrentIndex(clamped);
    setMediaLoaded(false);
    setMediaError(false);
    setDownloadState('IDLE');
    setIsBuffering(false);
  };

  const panResponder = useRef(
    PanResponder.create({
      // Swipe-to-page only on IMAGE pages. On video pages the native controls own all gestures
      // (scrubbing is horizontal too), so we don't hijack them — page via the on-screen arrows (B3).
      onMoveShouldSetPanResponder: (_, gs) => {
        const it = mediaItemsRef.current[currentIndexRef.current];
        const onVideo = it ? isVideoMime(it.getMimeType?.() ?? '') : false;
        return !onVideo && Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        const idx = currentIndexRef.current;
        const next = nextIndexForSwipe(gs.dx, idx, mediaItemsRef.current.length);
        if (next !== idx) goTo(next);
      },
    })
  ).current;

  const handleDownload = () => {
    if (!current || downloadState === 'DOWNLOADING' || downloadState === 'DONE') return;
    setDownloadState('DOWNLOADING');
    FileManager?.checkAndDownload(current.getUrl(), current.getName(), (result: string) => {
      try {
        const parsed = JSON.parse(result);
        setDownloadState(parsed.success ? 'DONE' : 'FAILED');
      } catch {
        setDownloadState('FAILED');
      }
    });
  };

  if (!current) return null;

  const shortName =
    current.getName().length > 22
      ? `${current.getName().substring(0, 19)}…`
      : current.getName();

  const counterLabel = `${currentIndex + 1} / ${mediaItems.length}`;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View testID="media-viewer" style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            testID="media-viewer.close"
            onPress={onClose}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="Close viewer"
          >
            <Icon name="arrow-back-fill" color="#fff" height={22} width={22} />
          </TouchableOpacity>

          <View style={styles.headerMeta}>
            <Text style={styles.headerTitle} numberOfLines={1}>{shortName}</Text>
            <Text style={styles.headerSubtitle}>
              {[formatFileSize(current.getSize()), mediaItems.length > 1 ? counterLabel : ''].filter(Boolean).join('  •  ')}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleDownload}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="Download"
            disabled={downloadState === 'DOWNLOADING'}
          >
            {downloadState === 'DOWNLOADING' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : downloadState === 'DONE' ? (
              <Text style={styles.doneCheck}>{'✓'}</Text>
            ) : (
              <Icon name="download-fill" color="#fff" height={20} width={20} />
            )}
          </TouchableOpacity>
        </View>

        {/* Media area — swipeable */}
        <View style={styles.mediaArea} {...panResponder.panHandlers}>
          {previewable && !mediaLoaded && !mediaError && (
            <ActivityIndicator
              color="#fff"
              size="large"
              style={StyleSheet.absoluteFill}
            />
          )}

          {!previewable ? (
            // "No preview available" — an attachment outside this bubble's kind (e.g. an image inside
            // a video message). Only a download is offered, like Google Drive's unsupported preview.
            <View style={styles.noPreviewBox}>
              <View style={styles.noPreviewIconCircle}>
                <Icon name="unknown-file-type" height={56} width={56} />
              </View>
              <Text style={styles.noPreviewTitle}>
                {t('NO_PREVIEW_AVAILABLE') || 'No preview available'}
              </Text>
              <Text style={styles.noPreviewSubtitle}>
                {t('FILE_TYPE_NOT_SUPPORTED_PREVIEW') || "This file type isn't supported for preview."}
              </Text>
              <TouchableOpacity
                testID="media-viewer.no-preview-download"
                onPress={handleDownload}
                disabled={downloadState === 'DOWNLOADING'}
                style={[styles.downloadBtn, { backgroundColor: theme.color.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Download"
              >
                {downloadState === 'DOWNLOADING' ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Icon
                    name={downloadState === 'DONE' ? 'check-fill' : 'download-fill'}
                    color="#fff"
                    height={20}
                    width={20}
                  />
                )}
                <Text style={styles.downloadBtnText}>
                  {downloadState === 'DONE'
                    ? t('DOWNLOADED') || 'Downloaded'
                    : t('DOWNLOAD') || 'Download'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : mediaError ? (
            <View style={styles.errorBox}>
              <Icon name="error-fill" color="#fff" height={40} width={40} />
              <Text style={styles.errorText}>
                {t('SOMETHING_WRONG') ?? 'Something went wrong. Please try again.'}
              </Text>
            </View>
          ) : isVideo ? (
            // Native controls own play/pause/scrub — no custom tap-to-pause overlay, which would
            // fight the control taps (B3).
            <View style={styles.videoWrapper}>
              <Video
                source={{ uri: current.getUrl() }}
                controls={true}
                // The <Modal> keeps its children mounted when hidden, so without this the video would
                // keep playing (audio too) after the viewer closes. Pause whenever the viewer isn't visible.
                paused={!visible}
                resizeMode="contain"
                onLoad={() => { setMediaLoaded(true); setIsBuffering(false); }}
                onLoadStart={() => setIsBuffering(true)}
                onBuffer={({ isBuffering: b }) => setIsBuffering(b)}
                onError={e => {
                  console.warn('[CometChatMediaViewer] video error', e);
                  setMediaError(true);
                  setMediaLoaded(true);
                  setIsBuffering(false);
                }}
                style={styles.fullMedia}
              />
              {isBuffering && (
                <ActivityIndicator
                  color="#fff"
                  size="large"
                  style={StyleSheet.absoluteFill}
                />
              )}
            </View>
          ) : (
            <Image
              source={{ uri: current.getUrl() }}
              style={styles.fullMedia}
              resizeMode="contain"
              onLoad={() => setMediaLoaded(true)}
              onError={() => { setMediaError(true); setMediaLoaded(true); }}
            />
          )}
        </View>

        {/* Prev / Next arrows */}
        {currentIndex > 0 && (
          <TouchableOpacity
            style={[styles.navArrow, styles.navLeft]}
            onPress={() => goTo(currentIndex - 1)}
            accessibilityRole="button"
            accessibilityLabel="Previous"
          >
            <Icon name="arrow-back-fill" color="#fff" height={24} width={24} />
          </TouchableOpacity>
        )}
        {currentIndex < mediaItems.length - 1 && (
          <TouchableOpacity
            style={[styles.navArrow, styles.navRight]}
            onPress={() => goTo(currentIndex + 1)}
            accessibilityRole="button"
            accessibilityLabel="Next"
          >
            <Icon name="arrow-forward-fill" color="#fff" height={24} width={24} />
          </TouchableOpacity>
        )}

        {/* Footer — page dots */}
        {mediaItems.length > 1 && (
          <View style={styles.footer}>
            <View style={styles.dotsRow}>
              {mediaItems.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === currentIndex ? styles.dotActive : undefined]}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 52 : 28,
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  headerBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMeta: { flex: 1, marginHorizontal: 4 },
  headerTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerSubtitle: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
  doneCheck: { color: '#fff', fontSize: 18 },
  mediaArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 100 : 80,
    marginBottom: 60,
  },
  videoWrapper: { flex: 1, width: SCREEN_W },
  fullMedia: { width: SCREEN_W, flex: 1 },
  errorBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  errorText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center' },
  noPreviewBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  noPreviewIconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  noPreviewTitle: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  noPreviewSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 15, textAlign: 'center' },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
  },
  downloadBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  navArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 22,
    zIndex: 20,
  },
  navLeft: { left: 8 },
  navRight: { right: 8 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dotsRow: { flexDirection: 'row', gap: 6, paddingVertical: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { backgroundColor: '#fff' },
});
