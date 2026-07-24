import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  NativeModules,
  PanResponder,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { Icon } from '../../icons/Icon';

export interface CometChatAttachmentViewerProps {
  attachments: CometChat.Attachment[];
  initialIndex: number;
  message: CometChat.BaseMessage;
  onClose: () => void;
  /** Controls Modal visibility. Defaults to true for backward compatibility. */
  visible?: boolean;
}

type DownloadState = 'IDLE' | 'DOWNLOADING' | 'DONE' | 'FAILED';

const { FileManager } = NativeModules;

function formatFileSize(bytes: number): string {
  if (!(bytes > 0)) return '';   // undefined / 0 / NaN → show nothing (not "undefined B")
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatSentAt(sentAt: number): string {
  const d = new Date(sentAt * 1000);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}

export const CometChatAttachmentViewer = ({
  attachments,
  initialIndex,
  message,
  onClose,
  visible = true,
}: CometChatAttachmentViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [downloadState, setDownloadState] = useState<DownloadState>('IDLE');

  const current = attachments[currentIndex];
  const senderName = message.getSender?.()?.getName?.() ?? '';
  const sentAtStr = message.getSentAt ? formatSentAt(message.getSentAt()) : '';

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -40) {
          setCurrentIndex(prev => Math.min(prev + 1, attachments.length - 1));
          setImageLoaded(false);
          setDownloadState('IDLE');
        } else if (gs.dx > 40) {
          setCurrentIndex(prev => Math.max(prev - 1, 0));
          setImageLoaded(false);
          setDownloadState('IDLE');
        }
      },
    })
  ).current;

  const handleDownload = () => {
    if (downloadState === 'DOWNLOADING' || downloadState === 'DONE') return;
    setDownloadState('DOWNLOADING');
    const url = current.getUrl();
    const name = current.getName();
    FileManager?.checkAndDownload(url, name, (result: string) => {
      try {
        const parsed = JSON.parse(result);
        if (parsed.success) {
          setDownloadState('DONE');
        } else {
          setDownloadState('FAILED');
        }
      } catch {
        setDownloadState('FAILED');
      }
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({ url: current.getUrl(), message: current.getName() });
    } catch {
      // share cancelled
    }
  };

  const shortName =
    current.getName().length > 20
      ? `${current.getName().substring(0, 17)}...`
      : current.getName();

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close viewer"
          >
            <Icon name="arrow-back-fill" color="#fff" height={22} width={22} />
          </TouchableOpacity>

          <View style={styles.headerMeta}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {shortName}
            </Text>
            <Text style={styles.headerSubtitle}>
              {formatFileSize(current.getSize())}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleShare}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Share"
            >
              <Icon name="share-fill" color="#fff" height={20} width={20} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDownload}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Download"
              disabled={downloadState === 'DOWNLOADING'}
            >
              {downloadState === 'DOWNLOADING' && (
                <ActivityIndicator color="#fff" size="small" />
              )}
              {downloadState === 'DONE' && (
                <Text style={styles.checkmark}>{'✓'}</Text>
              )}
              {downloadState !== 'DOWNLOADING' && downloadState !== 'DONE' && (
                <Icon name="download-fill" color="#fff" height={20} width={20} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Media area */}
        <View style={styles.mediaArea} {...panResponder.panHandlers}>
          {!imageLoaded && (
            <ActivityIndicator
              color="#fff"
              size="large"
              style={StyleSheet.absoluteFill}
            />
          )}
          <Image
            source={{ uri: current.getUrl() }}
            style={styles.image}
            resizeMode="contain"
            onLoad={() => setImageLoaded(true)}
          />
        </View>

        {/* Footer: page dots + sender + timestamp */}
        <View style={styles.footer}>
          {attachments.length > 1 && (
            <View style={styles.dotsRow}>
              {attachments.map((a, i) => (
                <View
                  key={a.getUrl()}
                  style={[
                    styles.dot,
                    i === currentIndex ? styles.dotActive : undefined,
                  ]}
                />
              ))}
            </View>
          )}
          {Boolean(senderName || sentAtStr) && (
            <Text style={styles.senderLine}>
              {senderName ? `Sent by ${senderName}` : ''}
              {senderName && sentAtStr ? ' • ' : ''}
              {sentAtStr}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMeta: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
    marginBottom: 80,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 32,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    gap: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  senderLine: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
  },
});
