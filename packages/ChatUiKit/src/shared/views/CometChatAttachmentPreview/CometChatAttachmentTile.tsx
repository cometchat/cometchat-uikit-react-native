import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  LayoutChangeEvent,
  NativeModules,
  PanResponder,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Video from 'react-native-video';
import { useTheme } from '../../../theme';
import { CometChatTheme } from '../../../theme/type';
import { useCompTheme } from '../../../theme/hook';
import { deepMerge } from '../../helper/helperFunctions';
import { SelectedAttachment } from '../../modals/SelectedAttachment';
import { Icon } from '../../icons/Icon';
import { getFileTypeIcon } from '../../constants/UIKitConstants';

const { SoundPlayer } = NativeModules;

// One-audio-at-a-time coordinator (WhatsApp-style): when one card starts playing, every other
// card resets its UI. The native SoundPlayer already holds a single MediaPlayer, so this only
// keeps each card's play/pause state in sync with that reality — resetters must NOT call any
// SoundPlayer method (that would stop the clip that just started).
const audioPlaySubscribers = new Set<(activeFileId: string) => void>();
const announceAudioPlay = (activeFileId: string) => {
  audioPlaySubscribers.forEach((fn) => fn(activeFileId));
};

const parseJSON = (s: string): any => { try { return JSON.parse(s); } catch { return {}; } };
const fmtTime = (secs: number) => {
  const s = Math.max(0, Math.floor(secs || 0));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// Upload ring for the file-card loading state, with two distinct modes:
//   - QUEUED (indeterminate): a fixed quarter-arc that spins continuously → "waiting to upload".
//   - UPLOADING (determinate): the spin STOPS and the arc grows with the real progress %, starting
//     from the top, so the user can actually read how far along the upload is.
const UploadRing = ({ progress, indeterminate }: { progress: number; indeterminate: boolean }) => {
  const theme = useTheme();
  const RING_SIZE = theme.spacing.spacing.s7; // 28 (nearest token to 30)
  const RING_STROKE = theme.spacing.spacing.s1; // 4 (nearest token to 3)
  const r = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // Only spin while QUEUED. Once uploading starts we show real progress, so the ring must be static.
    if (!indeterminate) {
      spin.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin, indeterminate]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  // Queued → a fixed 25% arc (the spin makes it read as a loader). Uploading → the actual progress
  // fraction, held static (the -90° rotation just makes the arc start from 12 o'clock).
  const pct = indeterminate ? 0.25 : Math.min(1, Math.max(0, (progress || 0) / 100));
  return (
    <Animated.View pointerEvents="none" style={{ transform: [{ rotate: indeterminate ? rotate : '-90deg' }] }}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={r} stroke={theme.color.staticWhite} strokeOpacity={0.3} strokeWidth={RING_STROKE} fill="none" />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={r}
          stroke={theme.color.staticWhite}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
        />
      </Svg>
    </Animated.View>
  );
};

export interface CometChatAttachmentTileProps {
  attachment: SelectedAttachment;
  onRemove: (fileId: string) => void;
  onRetry: (fileId: string) => void;
  /** Called when the user taps the tile thumbnail (for image/video preview). */
  onPress?: (fileId: string) => void;
  /**
   * testID forwarded to the tile's outer container (a native View); derived ids:
   * `${testID}.remove`, `${testID}.retry`, `${testID}.uploading` (present only while uploading).
   * A `testID` on a custom component is inert unless forwarded to a native node — so we spread it
   * onto the real View/TouchableOpacity, not the component wrapper.
   */
  testID?: string;
  /**
   * Structured style overrides for the tile's variants (file card / media tile /
   * audio card), deep-merged over the theme's `attachmentTileStyles`.
   */
  style?: CometChatTheme["attachmentTileStyles"];
}

// Non-media file tiles are a wide card (icon + name + type), not a square thumbnail.
// Figma (Android): width 200, height 72 (spacing.s18), radius 12 (radius.r3), padding 12
// (padding.p3), gap 8 (spacing.s2) — those four are theme tokens now; only the fixed 200px
// card width has no matching token, so it lives in styles.fileCard.
// Media-overlay colors (error dim, video scrim, duration pill) now come from the theme:
// theme.color.mediaErrorOverlay / mediaScrim / mediaDurationChip. See theme/default/color.

// ── Audio attachment player card ────────────────────────────────────────────────
// Picked/pasted audio (audio/*) renders as a player, not the plain file card: a purple
// play/pause circle + filename + a draggable seek bar + elapsed/total time, sharing the
// LOADING (ring) and ERROR (retry/"!" glyph + "Upload failed · Retry") states of the file card.
// Playback uses the shared native SoundPlayer. ponytail: SoundPlayer holds ONE MediaPlayer, so
// only one clip plays at a time and the pre-play total-duration shows the last-prepared clip
// when several audio files are staged together — play(uri) always reloads the correct clip, so
// playback is per-card correct. Per-card native players only if simultaneous durations matter.

const AudioAttachmentCard = ({
  attachment,
  onRemove,
  onRetry,
  onPress,
  containerStyle,
  audioCardStyle,
  fileNameStyle,
  removeButtonStyle,
}: Omit<CometChatAttachmentTileProps, 'style'> & {
  containerStyle?: ViewStyle;
  audioCardStyle?: ViewStyle;
  fileNameStyle?: TextStyle;
  removeButtonStyle?: ViewStyle;
}) => {
  const theme = useTheme();
  const { fileId, file, uploadState, uploadProgress } = attachment;

  const [status, setStatus] = useState<'stopped' | 'playing' | 'paused'>('stopped');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [seekFrac, setSeekFrac] = useState(0);
  const trackWidth = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loading = uploadState === 'NONE' || uploadState === 'UPLOADING';
  const failed = uploadState === 'FAILED';
  const rejected = uploadState === 'REJECTED';
  const isError = failed || rejected;
  const showRemove = !loading;

  // PanResponder / interval callbacks capture their first-render closure — read live values
  // (loading/isError/duration) from a ref so seek + end-detection never go stale.
  const liveRef = useRef({ loading, isError, duration, status });
  liveRef.current = { loading, isError, duration, status };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = () => {
    stopPolling();
    pollRef.current = setInterval(() => {
      SoundPlayer?.getPosition?.((info: string) => {
        const pos = parseJSON(info)?.position ?? 0;
        setCurrentTime(pos);
        const d = liveRef.current.duration;
        if (d > 0 && pos >= d - 0.25) {
          stopPolling();
          setStatus('stopped');
          setCurrentTime(0);
        }
      });
    }, 250);
  };

  // Duration for the total-time display. Prefer the value the react-native-video probe already read
  // (one independent player per file) — only fall back to the shared SoundPlayer when we don't have
  // it. Prepping every audio tile on the single shared Android player made tap-to-preview flaky.
  useEffect(() => {
    if (attachment.durationSeconds && attachment.durationSeconds > 0) {
      setDuration(attachment.durationSeconds);
    } else {
      SoundPlayer?.prepareMediaPlayer?.(file.uri, (info: string) => {
        const d = parseJSON(info)?.duration;
        if (typeof d === 'number' && d > 0) setDuration(d);
      });
    }
    return () => {
      stopPolling();
      // Only release the SHARED player if THIS tile was the one using it — releasing on every tile's
      // unmount thrashes the single Android player (still stops OUR playback on unmount).
      if (liveRef.current.status === 'playing' || liveRef.current.status === 'paused') {
        SoundPlayer?.releaseMediaPlayer?.();
      }
    };
  }, [file.uri, attachment.durationSeconds]);

  // When ANOTHER card starts playing, reset this one's UI (do not touch SoundPlayer — the
  // native player is already playing the other clip).
  useEffect(() => {
    const onOtherPlay = (activeFileId: string) => {
      if (activeFileId !== fileId) {
        stopPolling();
        setStatus('stopped');
        setCurrentTime(0);
      }
    };
    audioPlaySubscribers.add(onOtherPlay);
    return () => {
      audioPlaySubscribers.delete(onOtherPlay);
    };
  }, [fileId]);

  const onToggle = () => {
    if (loading || isError) return;
    if (status === 'playing') {
      SoundPlayer?.pause?.(() => {});
      stopPolling();
      setStatus('paused');
    } else if (status === 'paused') {
      announceAudioPlay(fileId); // resuming stops any other card that's playing
      SoundPlayer?.resume?.();
      setStatus('playing');
      startPolling();
    } else {
      announceAudioPlay(fileId); // starting stops any other card that's playing
      SoundPlayer?.play?.(file.uri, (info: string) => {
        const d = parseJSON(info)?.duration;
        if (typeof d === 'number' && d > 0) setDuration(d);
      });
      setStatus('playing');
      setCurrentTime(0);
      startPolling();
    }
  };

  const seekTo = (frac: number) => {
    const clamped = Math.min(1, Math.max(0, frac));
    const secs = Math.round(clamped * liveRef.current.duration);
    SoundPlayer?.playAt?.(secs, () => {});
    setCurrentTime(secs);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () =>
        !liveRef.current.loading && !liveRef.current.isError && liveRef.current.duration > 0,
      onMoveShouldSetPanResponder: () =>
        !liveRef.current.loading && !liveRef.current.isError && liveRef.current.duration > 0,
      onPanResponderGrant: (e) => {
        setSeeking(true);
        const w = trackWidth.current || 1;
        setSeekFrac(Math.min(1, Math.max(0, e.nativeEvent.locationX / w)));
      },
      onPanResponderMove: (e) => {
        const w = trackWidth.current || 1;
        setSeekFrac(Math.min(1, Math.max(0, e.nativeEvent.locationX / w)));
      },
      onPanResponderRelease: (e) => {
        const w = trackWidth.current || 1;
        seekTo(e.nativeEvent.locationX / w);
        setSeeking(false);
      },
    })
  ).current;

  // Clamp the displayed time to the duration — a mis-read clip (e.g. an .aac whose duration reads
  // short) can make playback overshoot, and the time must never read past the total (00:03/00:01).
  const rawTime = seeking ? seekFrac * duration : currentTime;
  const dispTime = duration > 0 ? Math.min(rawTime, duration) : rawTime;
  const frac = duration > 0 ? Math.min(1, Math.max(0, dispTime / duration)) : 0;
  const fillPct = `${frac * 100}%` as const;
  const S = theme.spacing.spacing;
  const CIRCLE = S.s14;   // 56 — same play circle as the sent audio bubble (CometChatAudiosBubble)
  const TRACK_H = S.s1;   // 4  — thin seek track
  const THUMB = S.s3;     // 12 — seek thumb

  // Rejected → the whole card taps to reveal the failure reason (mirrors the file/media cards).
  const AudioCardContainer: any = rejected && onPress ? TouchableOpacity : View;
  const audioCardPressProps = rejected && onPress ? { activeOpacity: 0.7, onPress: () => onPress(fileId) } : {};

  return (
    <View style={[{ margin: theme.spacing.margin.m1 }, containerStyle]}>
      <AudioCardContainer
        {...audioCardPressProps}
        style={[styles.audioCard, {
          flexDirection: 'row',
          alignItems: 'center',
          gap: S.s3,
          // Name · seek · time packed in a column BESIDE the circle (like the sent audio bubble) so
          // the card stays compact instead of stacking three tall rows. padding.p3 = even spacing.
          minHeight: theme.spacing.spacing.s18,
          borderRadius: theme.spacing.radius.r3,
          padding: theme.spacing.padding.p3,
          backgroundColor: theme.color.background2,
          borderWidth: 1,
          borderColor: isError ? theme.color.error : theme.color.borderDefault,
        }, audioCardStyle]}
      >
        {/* Purple play/pause circle; LOADING dims it + spins the ring, ERROR shows the glyph. */}
        <TouchableOpacity
          activeOpacity={loading || isError ? 1 : 0.8}
          onPress={onToggle}
          style={{
            width: CIRCLE,
            height: CIRCLE,
            borderRadius: CIRCLE / 2,
            overflow: 'hidden',
            backgroundColor: theme.color.primary,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel={status === 'playing' ? 'Pause audio' : 'Play audio'}
        >
          <Icon
            name={status === 'playing' ? 'pause-fill' : 'play-arrow-fill'}
            size={S.s6}
            color={theme.color.staticWhite}
          />
          {loading && (
            <View
              pointerEvents="none"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.color.mediaErrorOverlay, justifyContent: 'center', alignItems: 'center' }}
            >
              <UploadRing progress={uploadProgress} indeterminate={uploadState === 'NONE'} />
            </View>
          )}
          {isError && (
            // Design: keep the play circle, dim it with a dark tint, then center a SMALL red badge with a
            // white glyph (retry / "!") on top — NOT a full red fill. Mirrors the media tile's error badge.
            <View
              pointerEvents="none"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.color.mediaErrorOverlay, justifyContent: 'center', alignItems: 'center' }}
            >
              <View style={{ width: S.s7, height: S.s7, borderRadius: S.s7 / 2, backgroundColor: theme.color.error, justifyContent: 'center', alignItems: 'center' }}>
                <Icon name={failed ? 'retry' : 'error-fill'} size={failed ? S.s4 : S.s7} color={failed ? theme.color.staticWhite : theme.color.error} />
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Filename · seek bar · elapsed/total — stacked in a column beside the circle (▶ ──●──). */}
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            ellipsizeMode="middle"
            style={[{ ...theme.typography.body.medium, color: theme.color.neutral900, marginRight: theme.spacing.margin.m4 }, fileNameStyle]}
          >
            {file.name}
          </Text>
          {isError ? (
            failed ? (
              // FAILED (transient) — whole label taps to re-upload.
              <Text
                onPress={() => onRetry(fileId)}
                suppressHighlighting
                style={{ ...theme.typography.caption2.medium, color: theme.color.error, marginTop: S.s0_5 }}
              >
                {'Tap to retry'}
              </Text>
            ) : (
              // REJECTED (server denied) — remove-only, no retry.
              <Text style={{ ...theme.typography.caption2.regular, color: theme.color.error, marginTop: S.s0_5 }}>
                {'Upload failed'}
              </Text>
            )
          ) : (
            <>
              {/* Draggable seek bar: thin track + purple fill + thumb. */}
              <View
                {...pan.panHandlers}
                onLayout={(e: LayoutChangeEvent) => {
                  trackWidth.current = e.nativeEvent.layout.width;
                }}
                style={{ height: S.s6, justifyContent: 'center', marginTop: S.s0_5 }}
              >
                <View style={{ height: TRACK_H, borderRadius: TRACK_H / 2, backgroundColor: theme.color.neutral300 }}>
                  <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: fillPct, borderRadius: TRACK_H / 2, backgroundColor: theme.color.primary }} />
                </View>
                <View
                  style={{
                    position: 'absolute',
                    // Clamp the thumb fully inside the track [0, trackWidth - THUMB] so it never
                    // spills past either end (the fill is a %, the thumb needs pixel clamping).
                    left: Math.max(0, Math.min(frac * trackWidth.current - THUMB / 2, trackWidth.current - THUMB)),
                    width: THUMB,
                    height: THUMB,
                    borderRadius: THUMB / 2,
                    backgroundColor: theme.color.staticWhite,
                    borderWidth: 1,
                    borderColor: theme.color.neutral300,
                  }}
                />
              </View>
              <Text style={{ ...theme.typography.caption1.regular, color: theme.color.neutral600, marginTop: S.s0_5 }}>
                {`${fmtTime(dispTime)}/${fmtTime(duration)}`}
              </Text>
            </>
          )}
        </View>
      </AudioCardContainer>

      {showRemove && (
        <TouchableOpacity
          onPress={() => onRemove(fileId)}
          hitSlop={{ top: theme.spacing.spacing.s2, right: theme.spacing.spacing.s2, bottom: theme.spacing.spacing.s2, left: theme.spacing.spacing.s2 }}
          style={[{
            position: 'absolute',
            top: -theme.spacing.spacing.s2,
            right: -theme.spacing.spacing.s2,
            width: theme.spacing.spacing.s6,
            height: theme.spacing.spacing.s6,
            borderRadius: theme.spacing.radius.r3,
            backgroundColor: theme.color.neutral700,
            borderWidth: 2,
            borderColor: theme.color.background1,
            justifyContent: 'center',
            alignItems: 'center',
          }, removeButtonStyle]}
          accessibilityRole="button"
          accessibilityLabel="Remove attachment"
        >
          <Text style={{ ...theme.typography.caption2.regular, color: theme.color.staticWhite }}>{'✕'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export const CometChatAttachmentTile = ({
  attachment,
  onRemove,
  onRetry,
  onPress,
  style,
  testID,
}: CometChatAttachmentTileProps) => {
  const theme = useTheme();
  const compTheme = useCompTheme();
  const s = deepMerge(
    theme.attachmentTileStyles ?? {},
    compTheme.attachmentTileStyles ?? {},
    style ?? {}
  );
  const { fileId, file, uploadState, uploadProgress } = attachment;

  // Audio (audio/*) renders as a player card (play/pause + seek + time), not the file card.
  if (file.type.startsWith('audio/')) {
    return (
      <AudioAttachmentCard
        attachment={attachment}
        onRemove={onRemove}
        onRetry={onRetry}
        onPress={onPress}
        containerStyle={s.containerStyle}
        audioCardStyle={s.audioCardStyle}
        fileNameStyle={s.fileNameStyle}
        removeButtonStyle={s.removeButtonStyle}
      />
    );
  }

  const isMedia =
    file.type.startsWith('image/') || file.type.startsWith('video/');
  // Tap opens the full-screen viewer ONLY once the media is fully uploaded (COMPLETED) — the tile
  // is not tappable while it is still uploading / queued / errored.
  const canPreview = isMedia && uploadState === 'COMPLETED';

  // Non-media files (PDF / MP3 / docs) render as a WIDE card — colored file-type icon +
  // name + type label — and stay clean: no exclamation / error overlay. Photos & videos
  // keep the square thumbnail tile below. (Failed uploads: subtle red border + tap to retry.)
  if (!isMedia) {
    const ext = (file.name.split('.').pop() || '').toUpperCase();
    const loading = uploadState === 'NONE' || uploadState === 'UPLOADING';
    const failed = uploadState === 'FAILED';       // transient (onFailure) → Retry offered
    const rejected = uploadState === 'REJECTED';    // server denied (onError) → remove-only, no Retry
    const isError = failed || rejected;
    const showRemove = !loading;                    // ✕ hidden while uploading; shown on DEFAULT + ERROR
    // Only a REJECTED card is tappable (tap → failure-reason toast); keep it a plain View otherwise so
    // the FAILED card's inner "Tap to retry" text keeps its own touch handling.
    const FileCardContainer: any = rejected && onPress ? TouchableOpacity : View;
    const fileCardPressProps = rejected && onPress ? { activeOpacity: 0.7, onPress: () => onPress(fileId) } : {};
    return (
      // Wrapper is `relative` (not clipped) so the ✕ badge can sit on the card's corner.
      <View style={[{ margin: theme.spacing.margin.m1 }, s.containerStyle]}>
        <FileCardContainer
          accessibilityLabel={file.name}
          {...fileCardPressProps}
          style={[styles.fileCard, {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.spacing.s2,
            height: theme.spacing.spacing.s18,
            borderRadius: theme.spacing.radius.r3,
            padding: theme.spacing.padding.p3,
            // Figma tokens: Background02 (#FAFAFA) + 1px BorderDefault (#E9EAEB) define the card
            // (flat, no shadow); the border turns red in the ERROR state.
            backgroundColor: theme.color.background2,
            borderWidth: 1,
            borderColor: isError ? theme.color.error : theme.color.borderDefault,
          }, s.fileCardStyle]}
        >
          {/* 48px colored file-type icon. LOADING dims it + spins the upload ring on top. */}
          <View
            style={{
              width: theme.spacing.spacing.s12,
              height: theme.spacing.spacing.s12,
              borderRadius: theme.spacing.radius.r2,
              overflow: 'hidden',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {isError ? (
              // Error/retry (matches design, image 1): red document + the SAME dark backdrop tint
              // (theme.color.mediaErrorOverlay) as the image/video/audio error tiles, with the status badge on top.
              // FAILED (retryable) → white reload; REJECTED (denied) → white "!".
              <>
                <Icon name="description-fill" size={theme.spacing.spacing.s12} color={theme.color.error} />
                <View
                  pointerEvents="none"
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.color.mediaErrorOverlay, justifyContent: 'center', alignItems: 'center' }}
                >
                  <View
                    style={{
                      width: theme.spacing.spacing.s6,
                      height: theme.spacing.spacing.s6,
                      borderRadius: theme.spacing.radius.r3,
                      backgroundColor: theme.color.error,
                      borderWidth: 2,
                      borderColor: theme.color.staticWhite,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Icon name={failed ? 'retry' : 'error-fill'} size={failed ? theme.spacing.spacing.s3 : theme.spacing.spacing.s6} color={failed ? theme.color.staticWhite : theme.color.error} />
                    {/* REJECTED → the SAME `error-fill` SVG the message-list error/retry receipt uses
                        (CometChatReceipt), so the tray error "!" matches the failed-message "!". */}
                  </View>
                </View>
              </>
            ) : (
              <>
                <Icon name={getFileTypeIcon(file.name)} size={theme.spacing.spacing.s12} />
                {loading && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: theme.color.mediaErrorOverlay,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <UploadRing progress={uploadProgress} indeterminate={uploadState === 'NONE'} />
                  </View>
                )}
              </>
            )}
          </View>

          <View style={{ flex: 1, marginRight: theme.spacing.margin.m3 }}>
            <Text
              numberOfLines={1}
              ellipsizeMode="middle"
              style={[{ ...theme.typography.body.medium, color: theme.color.neutral900 }, s.fileNameStyle]}
            >
              {file.name}
            </Text>
            {isError ? (
              failed ? (
                // FAILED (transient) — whole label taps to re-upload.
                <Text
                  onPress={() => onRetry(fileId)}
                  suppressHighlighting
                  style={{ ...theme.typography.caption2.medium, color: theme.color.error, marginTop: theme.spacing.margin.m0_5 }}
                >
                  {'Tap to retry'}
                </Text>
              ) : (
                // REJECTED (server denied) — remove-only, no retry.
                <Text style={{ ...theme.typography.caption2.regular, color: theme.color.error, marginTop: theme.spacing.margin.m0_5 }}>
                  {'Upload failed'}
                </Text>
              )
            ) : (
              Boolean(ext) && (
                <Text style={{ ...theme.typography.caption2.regular, color: theme.color.neutral600, marginTop: theme.spacing.margin.m0_5 }}>
                  {ext}
                </Text>
              )
            )}
          </View>
        </FileCardContainer>

        {/* Remove (✕) — corner badge, DEFAULT + ERROR only (hidden while uploading). */}
        {showRemove && (
          <TouchableOpacity
            onPress={() => onRemove(fileId)}
            hitSlop={{ top: theme.spacing.spacing.s2, right: theme.spacing.spacing.s2, bottom: theme.spacing.spacing.s2, left: theme.spacing.spacing.s2 }}
            style={[{
              position: 'absolute',
              top: -theme.spacing.spacing.s2,
              right: -theme.spacing.spacing.s2,
              width: theme.spacing.spacing.s6,
              height: theme.spacing.spacing.s6,
              borderRadius: theme.spacing.radius.r3,
              backgroundColor: theme.color.neutral700,
              borderWidth: 2,
              borderColor: theme.color.background1,
              justifyContent: 'center',
              alignItems: 'center',
            }, s.removeButtonStyle]}
            accessibilityRole="button"
            accessibilityLabel="Remove attachment"
          >
            <Text style={{ ...theme.typography.caption2.regular, color: theme.color.staticWhite }}>{'✕'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Media (image/video) square tile states — mirror the file/audio cards:
  //  DEFAULT  → clean thumbnail + ✕ corner badge
  //  LOADING  → dimmed + white upload ring (NONE/UPLOADING), ✕ hidden
  //  RETRY    → FAILED (transient): red border + red retry circle (tap to re-upload)
  //  ERROR    → REJECTED (denied): red border + red "!" circle, remove-only
  const loading = uploadState === 'NONE' || uploadState === 'UPLOADING';
  const failed = uploadState === 'FAILED';
  const rejected = uploadState === 'REJECTED';
  const isError = failed || rejected;
  const showRemove = !loading;

  return (
    // Wrapper is relative (not clipped) so the ✕ badge can sit on the tile's corner.
    <View testID={testID} style={[{ margin: theme.spacing.margin.m1 }, s.containerStyle]}>
      <TouchableOpacity
        testID={testID ? `${testID}.thumb` : undefined}
        // Tappable when previewable (completed media) OR rejected (tap reveals the failure reason).
        activeOpacity={(canPreview || rejected) && onPress ? 0.85 : 1}
        onPress={(canPreview || rejected) && onPress ? () => onPress(fileId) : undefined}
        style={[{
          width: theme.spacing.spacing.s18,
          height: theme.spacing.spacing.s18,
          borderRadius: theme.spacing.radius.r2,
          overflow: 'hidden',
          backgroundColor: theme.color.neutral200,
          borderWidth: isError ? 1.5 : 0,
          borderColor: theme.color.error,
        }, s.mediaTileStyle]}
      >
        {file.type.startsWith('video/') ? (
          // A local video file can't render as an <Image>, so show its FIRST FRAME via a paused,
          // muted react-native-video (no controls, never plays) as the thumbnail. The dark scrim
          // sits behind it so the tile reads as a video before the frame decodes.
          <>
            <View
              pointerEvents="none"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.color.mediaScrim }}
            />
            <Video
              source={{ uri: file.uri }}
              paused
              muted
              repeat={false}
              controls={false}
              resizeMode="cover"
              style={styles.fill}
            />
          </>
        ) : (
          <Image
            source={{ uri: file.uri }}
            style={styles.fill}
            resizeMode="cover"
          />
        )}

        {/* Video play glyph — hidden while loading / in error. */}
        {file.type.startsWith('video/') && !loading && !isError && (
          <View
            pointerEvents="none"
            style={styles.fillCenter}
          >
            <Icon name="play-arrow-fill" size={theme.spacing.spacing.s6} color={theme.color.staticWhite} />
          </View>
        )}

        {/* Duration chip — video, once uploaded, with a known duration (bottom-start pill; same
            look as the sent-message grid bubble). m:ss format. */}
        {file.type.startsWith('video/') && uploadState === 'COMPLETED' &&
          !!attachment.durationSeconds && attachment.durationSeconds > 0 && (
            <View
              pointerEvents="none"
              style={[{
                position: 'absolute',
                bottom: theme.spacing.spacing.s1,
                left: theme.spacing.spacing.s1,
                backgroundColor: theme.color.mediaDurationChip,
                borderRadius: theme.spacing.radius.r1,
                paddingHorizontal: theme.spacing.padding.p1,
                paddingVertical: theme.spacing.padding.p0_5,
              }, s.durationChipStyle]}
            >
              <Text style={{ color: theme.color.staticWhite, fontSize: 11, fontWeight: '600' }}>
                {`${Math.floor(attachment.durationSeconds / 60)}:${String(
                  Math.floor(attachment.durationSeconds % 60)
                ).padStart(2, '0')}`}
              </Text>
            </View>
          )}

        {/* LOADING — dim + white upload ring. */}
        {loading && (
          <View
            testID={testID ? `${testID}.uploading` : undefined}
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.color.mediaErrorOverlay, justifyContent: 'center', alignItems: 'center' }}
          >
            <UploadRing progress={uploadProgress} indeterminate={uploadState === 'NONE'} />
          </View>
        )}

        {/* RETRY — FAILED (transient): tap the red retry circle to re-upload. */}
        {failed && (
          <TouchableOpacity
            testID={testID ? `${testID}.retry` : undefined}
            onPress={() => onRetry(fileId)}
            activeOpacity={0.8}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.color.mediaErrorOverlay, justifyContent: 'center', alignItems: 'center' }}
            accessibilityRole="button"
            accessibilityLabel="Retry upload"
          >
            <View style={{ width: theme.spacing.spacing.s9, height: theme.spacing.spacing.s9, borderRadius: theme.spacing.radius.r5, backgroundColor: theme.color.error, justifyContent: 'center', alignItems: 'center' }}>
              <Icon name="retry" size={theme.spacing.spacing.s5} color={theme.color.staticWhite} />
            </View>
          </TouchableOpacity>
        )}

        {/* ERROR — REJECTED (denied): red "!" circle, remove-only. */}
        {rejected && (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.color.mediaErrorOverlay, justifyContent: 'center', alignItems: 'center' }}
          >
            <View style={{ width: theme.spacing.spacing.s9, height: theme.spacing.spacing.s9, borderRadius: theme.spacing.radius.r5, backgroundColor: theme.color.error, justifyContent: 'center', alignItems: 'center' }}>
              <Icon name="error-fill" size={theme.spacing.spacing.s9} color={theme.color.error} />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Remove ✕ — corner badge; DEFAULT + ERROR/RETRY (hidden while uploading). */}
      {showRemove && (
        <TouchableOpacity
          testID={testID ? `${testID}.remove` : undefined}
          onPress={() => onRemove(fileId)}
          hitSlop={{ top: theme.spacing.spacing.s2, right: theme.spacing.spacing.s2, bottom: theme.spacing.spacing.s2, left: theme.spacing.spacing.s2 }}
          style={[{
            position: 'absolute',
            top: -theme.spacing.spacing.s2,
            right: -theme.spacing.spacing.s2,
            width: theme.spacing.spacing.s6,
            height: theme.spacing.spacing.s6,
            borderRadius: theme.spacing.radius.r3,
            backgroundColor: theme.color.neutral700,
            borderWidth: 2,
            borderColor: theme.color.background1,
            justifyContent: 'center',
            alignItems: 'center',
          }, s.removeButtonStyle]}
          accessibilityRole="button"
          accessibilityLabel="Remove attachment"
        >
          <Text style={{ ...theme.typography.caption2.regular, color: theme.color.staticWhite }}>{'✕'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Backward-compat alias
export const CometChatAttachmentPreviewItem = CometChatAttachmentTile;
export type CometChatAttachmentPreviewItemProps = CometChatAttachmentTileProps;

const styles = StyleSheet.create({
  fillCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  fileCard: {
    width: 200,
  },
  audioCard: {
    width: 260,
  },
});
