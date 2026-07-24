import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  ImageStyle,
  LayoutChangeEvent,
  NativeEventEmitter,
  NativeModules,
  PanResponder,
  Platform,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatTheme } from '../../../theme/type';
import { Icon } from '../../icons/Icon';
import { CometChatUIKit } from '../../CometChatUiKit';
import { audioPlaybackCoordinator } from '../../utils/audioPlaybackCoordinator';
import { deepMerge } from '../../helper/helperFunctions';
import { useCompTheme } from '../../../theme/hook';
import { CometChatCaptionText } from '../CometChatCaptionText';
import { useCometChatTranslation } from '../../resources/CometChatLocalizeNew';
import { ATTACHMENT_COLLAPSED_LIMIT } from '../../constants/UIKitConstants';

const { SoundPlayer, FileManager } = NativeModules;
const soundEvents = new NativeEventEmitter(SoundPlayer);

// ---------------------------------------------------------------------------
// Design doc §8.1a — the "AudiosBubble": a player for a SHARED / picked audio file
// (no metadata.audioType). Renders a circular play/pause control, the file name, a
// draggable seek bar, elapsed/total time (00:00/00:32), and a download button (single,
// or a stack for several). RECORDED voice notes (metadata.audioType === "voice_note")
// use the waveform bubble instead (CometChatVoiceNoteBubble, built on the existing
// CometChatAudioBubble). Playback + seek use the native SoundPlayer module; download
// reuses FileManager.checkAndDownload like the file/media bubbles.
// ---------------------------------------------------------------------------

function fmt(secs: number): string {
  const s = Math.max(0, Math.floor(secs || 0));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// §8.1a — audio formats the native SoundPlayer can render. Anything else (opus, wma, amr, aiff, …) or
// an unknown extension can't be previewed/played, so it falls back to a plain file card instead of a
// broken/empty player. The native module gives no load-error signal, so we gate by extension.
const PLAYABLE_AUDIO_EXT = new Set(['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac']);
const isPlayableAudio = (att: CometChat.Attachment): boolean =>
  PLAYABLE_AUDIO_EXT.has((att.getName?.() ?? '').split('.').pop()?.toLowerCase() ?? '');

interface AudioFilePlayerProps {
  attachment: CometChat.Attachment;
  isSentByMe: boolean;
  theme: CometChatTheme;
  containerStyle?: StyleProp<ViewStyle>;
  playButtonStyle?: StyleProp<ViewStyle>;
  playIconStyle?: ImageStyle;
  fileNameStyle?: TextStyle;
  seekTrackStyle?: StyleProp<ViewStyle>;
  seekProgressStyle?: StyleProp<ViewStyle>;
  seekThumbStyle?: StyleProp<ViewStyle>;
  timeTextStyle?: TextStyle;
  downloadIconStyle?: ImageStyle;
}

const AudioFilePlayer = ({
  attachment,
  isSentByMe,
  theme,
  containerStyle,
  playButtonStyle,
  playIconStyle,
  fileNameStyle,
  seekTrackStyle,
  seekProgressStyle,
  seekThumbStyle,
  timeTextStyle,
  downloadIconStyle,
}: AudioFilePlayerProps) => {
  const url = attachment.getUrl();
  // Dimension tokens (theme spacing): CIRCLE 56 = s14, THUMB 12 = s3, TRACK_H = s2 (8) — a proper
  // seek-bar thickness (s1/4 read as a thin hairline). No raw pixel literals — everything derives
  // from the theme scale.
  const S = theme.spacing.spacing;
  const CIRCLE = S.s14;
  const THUMB = S.s3;
  const TRACK_H = S.s2;
  const [status, setStatus] = useState<'playing' | 'paused' | 'loading' | ''>('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs so the coordinator/native listeners (bound once) read live values without stale closures.
  const statusRef = useRef(status); statusRef.current = status;
  const currentTimeRef = useRef(currentTime); currentTimeRef.current = currentTime;
  // True when THIS clip was paused because another audio started — the native player has since
  // moved to that other clip, so resuming means re-playing this url from `currentTime`.
  const wasInterruptedRef = useRef(false);

  // Prefer a duration already carried in metadata; else ask the native player.
  const metaDuration = useMemo(() => {
    try {
      const meta = attachment.getMetadata?.() as Record<string, unknown> | undefined;
      const raw = meta?.duration ?? meta?.audio_duration;
      return typeof raw === 'number' && raw > 0 ? raw : 0;
    } catch {
      return 0;
    }
  }, [attachment]);

  useEffect(() => {
    if (metaDuration) {
      // Duration is already known from metadata — do NOT create the shared native player on mount.
      // Prepping every card's clip (and releasing it on unmount) thrashes the single shared Android
      // MediaPlayer, which left cards unplayable after re-entering the conversation. Create it lazily
      // on play() instead — matching how iOS already behaves.
      setDuration(metaDuration);
    } else if (url) {
      // No metadata duration → read it once via the shared player (rare now that the composer writes it).
      SoundPlayer.prepareMediaPlayer(url, (s: string) => {
        try {
          const d = JSON.parse(s)?.duration;
          if (typeof d === 'number' && d > 0) setDuration(d);
        } catch {}
      });
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Only release the SHARED player if THIS card was the one using it. Releasing on every card's
      // unmount is what thrashed the single Android player; this still stops OUR audio on unmount.
      if (statusRef.current === 'playing' || statusRef.current === 'paused') {
        SoundPlayer.releaseMediaPlayer();
      }
    };
  }, [url, metaDuration]);

  // WhatsApp-style coordination: when ANOTHER audio (recorded or shared) starts, pause THIS clip
  // in place — keep its position so it can resume from where it left off. The native player has
  // moved to the other clip, so mark it interrupted; resuming re-plays this url from currentTime.
  useEffect(() => {
    const unsub = audioPlaybackCoordinator.subscribe((activeUrl) => {
      if (activeUrl === url) return; // this bubble is the one that (re)started
      if (statusRef.current === 'playing' || statusRef.current === 'paused') {
        wasInterruptedRef.current = true;
        if (intervalRef.current) clearInterval(intervalRef.current);
        setStatus('paused'); // keep currentTime — position preserved
      }
    });
    return unsub;
  }, [url]);

  // Native fires soundPlayStatus on natural completion AND when a new play() replaces this clip.
  // If we were interrupted it's the replace-echo → ignore (keep the in-place pause); otherwise
  // it's a genuine finish → reset to idle.
  useEffect(() => {
    const sub = soundEvents.addListener('soundPlayStatus', (data: { url?: string }) => {
      if (data?.url !== url) return;
      if (wasInterruptedRef.current) return; // interrupt echo — keep the in-place pause
      setStatus('');
      setCurrentTime(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    });
    return () => sub.remove();
  }, [url]);

  const startPolling = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      SoundPlayer.getPosition((info: string) => {
        try {
          const p = JSON.parse(info)?.position;
          if (typeof p === 'number') setCurrentTime(p);
        } catch {}
      });
    }, 250);
  };

  // (Re)play this clip from `fromSeconds` (0 = start). Announces first so any other playing clip
  // pauses in place, then plays + seeks. Native success is boolean (Android) / int 1 (iOS).
  const play = (fromSeconds = 0) => {
    audioPlaybackCoordinator.announcePlay(url);
    wasInterruptedRef.current = false;
    setStatus('loading');
    SoundPlayer.play(url, (s: string) => {
      try {
        if (JSON.parse(s)?.success) {
          setStatus('playing');
          if (fromSeconds > 0) SoundPlayer.playAt(Math.floor(fromSeconds), () => {});
          startPolling();
        } else {
          setStatus('');
        }
      } catch {
        setStatus('');
      }
    });
  };

  const togglePlay = () => {
    if (status === 'playing') {
      // User pause — the native player is still ours, so a plain resume works later.
      wasInterruptedRef.current = false;
      SoundPlayer.pause((s: string) => {
        try {
          if (JSON.parse(s)?.success) {
            setStatus('paused');
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
        } catch {}
      });
      return;
    }
    if (status === 'paused') {
      if (wasInterruptedRef.current) {
        play(currentTimeRef.current); // player moved away — re-play from where we paused
      } else {
        audioPlaybackCoordinator.announcePlay(url); // resuming still stops any other clip
        SoundPlayer.resume();
        setStatus('playing');
        startPolling();
      }
      return;
    }
    if (url) play(currentTimeRef.current || 0);
  };

  // Seek to a fraction of the clip. If our clip is the current native player, seek directly;
  // otherwise (paused / interrupted / idle) re-play from the sought position.
  const seekToRatio = (ratio: number) => {
    const clamped = Math.max(0, Math.min(1, ratio));
    const seconds = Math.floor(clamped * (duration || 0));
    setCurrentTime(seconds);
    if (status === 'playing' && !wasInterruptedRef.current) {
      SoundPlayer.playAt(seconds, () => {});
      startPolling();
    } else {
      play(seconds);
    }
  };

  const ratioFromX = (x: number) => (trackWidth > 0 ? x / trackWidth : 0);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          setDragRatio(ratioFromX(e.nativeEvent.locationX));
        },
        onPanResponderMove: (e: GestureResponderEvent) => {
          setDragRatio(ratioFromX(e.nativeEvent.locationX));
        },
        onPanResponderRelease: (e: GestureResponderEvent) => {
          const r = ratioFromX(e.nativeEvent.locationX);
          setDragRatio(null);
          seekToRatio(r);
        },
        onPanResponderTerminate: () => setDragRatio(null),
      }),
    [trackWidth, duration]
  );

  const progressRatio =
    dragRatio != null
      ? dragRatio
      : duration > 0
      ? Math.min(1, currentTime / duration)
      : 0;

  // Reuse the same native download path as the file/media bubbles.
  const download = () => {
    if (!url) return;
    FileManager?.checkAndDownload?.(url, attachment.getName(), () => {});
  };

  // All colors are theme tokens (no hardcoded literals). Sent = purple bubble, received = neutral.
  // Design §8.1a — SOLID white play circle with a primary glyph on the sent card; received inverts
  // (primary circle + white glyph). Card/track fills use the extendedPrimary scale (a lighter purple
  // in light, darker in dark — either way a distinct surface); text/icons use the send/receive
  // bubble tokens, which stay legible in BOTH themes (extendedPrimary text would flip dark = illegible).
  const circleBg = isSentByMe ? theme.color.staticWhite : theme.color.primary;
  const playColor = isSentByMe ? theme.color.primary : theme.color.staticWhite;
  // Sent bubble: soft translucent-white track (theme token), not the darker extendedPrimary500.
  const trackBg = isSentByMe ? theme.color.sendBubbleTrack : theme.color.neutral500;
  const fillColor = isSentByMe ? theme.color.staticWhite : theme.color.primary;
  const nameColor = isSentByMe ? theme.color.sendBubbleText : theme.color.receiveBubbleText;
  const timeColor = isSentByMe ? theme.color.sendBubbleTimestamp : theme.color.receiveBubbleTimestamp;
  const downloadColor = isSentByMe ? theme.color.sendBubbleIcon : theme.color.receiveBubbleIcon;

  // Elapsed time to show alongside the total (00:00/00:32), tracking the drag while seeking.
  // Clamp to the duration so a mis-read clip can't show a time past the total (e.g. 00:03/00:01).
  const rawCur = dragRatio != null ? dragRatio * duration : currentTime;
  const displayCur = duration > 0 ? Math.min(rawCur, duration) : rawCur;

  const onTrackLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  return (
    // No own frame — inherits the shared audio-bubble container from the message-bubble wrapper.
    <View testID="bubble-audio" style={[{ flexDirection: 'row', alignItems: 'center', gap: S.s3 }, containerStyle]}>
      {/* Play/pause circle */}
      <TouchableOpacity
        onPress={togglePlay}
        accessibilityRole="button"
        accessibilityLabel={status === 'playing' ? 'Pause audio' : 'Play audio'}
        style={[{
          width: CIRCLE,
          height: CIRCLE,
          borderRadius: CIRCLE / 2,
          backgroundColor: circleBg,
          alignItems: 'center',
          justifyContent: 'center',
        }, playButtonStyle]}
      >
        <Icon
          name={status === 'playing' ? 'pause-fill' : 'play-arrow-fill'}
          size={S.s6}
          color={playColor as string}
          imageStyle={playIconStyle}
        />
      </TouchableOpacity>

      {/* Filename · (seek bar + download) · elapsed/total */}
      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          ellipsizeMode="middle"
          style={[{ ...theme.typography.body.medium, color: nameColor }, fileNameStyle]}
        >
          {attachment.getName()}
        </Text>

        {/* Seek track (draggable) with the download button on its right — design §8.1a */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.s2, marginTop: S.s0_5 }}>
          <View
            style={{ flex: 1, height: S.s6, justifyContent: 'center' }}
            onLayout={onTrackLayout}
            {...panResponder.panHandlers}
          >
            <View style={[{ height: TRACK_H, borderRadius: TRACK_H / 2, backgroundColor: trackBg }, seekTrackStyle]}>
              <View
                style={[{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${progressRatio * 100}%`,
                  borderRadius: TRACK_H / 2,
                  backgroundColor: fillColor,
                }, seekProgressStyle]}
              />
            </View>
            <View
              pointerEvents="none"
              style={[{
                position: 'absolute',
                // Clamp fully inside the track so the thumb never spills past the right edge.
                left: Math.max(0, Math.min(progressRatio * trackWidth - THUMB / 2, trackWidth - THUMB)),
                width: THUMB,
                height: THUMB,
                borderRadius: THUMB / 2,
                backgroundColor: fillColor,
              }, seekThumbStyle]}
            />
          </View>
          <TouchableOpacity
            onPress={download}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Download audio"
          >
            <Icon name="download-fill" size={S.s5} color={downloadColor as string} imageStyle={downloadIconStyle} />
          </TouchableOpacity>
        </View>

        <Text
          allowFontScaling={false}
          style={[{ ...theme.typography.caption2.regular, color: timeColor, marginTop: S.s0_5 }, timeTextStyle]}
        >
          {`${fmt(displayCur)}/${fmt(duration)}`}
        </Text>
      </View>
    </View>
  );
};

interface AudioFileCardProps {
  attachment: CometChat.Attachment;
  isSentByMe: boolean;
  theme: CometChatTheme;
  containerStyle?: StyleProp<ViewStyle>;
  fileNameStyle?: TextStyle;
  downloadIconStyle?: ImageStyle;
}

// Unsupported audio (a format the native player can't render) → a plain file card: the "no preview"
// icon + file name + download. No player, no seek bar, and no MIME/type label — per design §8.1a.
const AudioFileCard = ({
  attachment,
  isSentByMe,
  theme,
  containerStyle,
  fileNameStyle,
  downloadIconStyle,
}: AudioFileCardProps) => {
  const S = theme.spacing.spacing;
  const url = attachment.getUrl();
  const nameColor = isSentByMe ? theme.color.sendBubbleText : theme.color.receiveBubbleText;
  const downloadColor = isSentByMe ? theme.color.sendBubbleIcon : theme.color.receiveBubbleIcon;
  const download = () => {
    if (url) FileManager?.checkAndDownload?.(url, attachment.getName(), () => {});
  };
  return (
    <View testID="bubble-audio" style={[{ flexDirection: 'row', alignItems: 'center', gap: S.s2 }, containerStyle]}>
      {/* "No preview available" file icon (unmapped/unsupported). */}
      <Icon name="unknown-file-type" size={S.s8} />
      <Text
        numberOfLines={1}
        ellipsizeMode="middle"
        style={[{ ...theme.typography.body.medium, color: nameColor, flex: 1, minWidth: 0 }, fileNameStyle]}
      >
        {attachment.getName()}
      </Text>
      <TouchableOpacity
        onPress={download}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Download audio"
      >
        <Icon name="download-fill" size={S.s5} color={downloadColor as string} imageStyle={downloadIconStyle} />
      </TouchableOpacity>
    </View>
  );
};

export interface CometChatAudiosBubbleProps {
  message: CometChat.MediaMessage;
  theme: CometChatTheme;
  style?: CometChatTheme["audiosBubbleStyles"];
}

/**
 * Renders a shared/picked audio-file message (audio with NO metadata.audioType, after the
 * §7 fan-out) as WhatsApp-style headphone+filename player card(s), with a caption on the
 * message. Recorded voice notes use the waveform bubble (CometChatVoiceNoteBubble) instead.
 */
export function CometChatAudiosBubble({
  message,
  theme,
  style,
}: CometChatAudiosBubbleProps) {
  const compTheme = useCompTheme();
  const s = deepMerge(
    theme.audiosBubbleStyles ?? {},
    compTheme.audiosBubbleStyles ?? {},
    style ?? {}
  );
  const { t } = useCometChatTranslation();
  const [expanded, setExpanded] = useState(false);
  // An AUDIO message renders ALL its attachments; a non-playable one (unsupported audio format, or a
  // non-audio image/video/file) drops to the AudioFileCard "no preview" card below. getAttachments()
  // preserves pick order.
  const allAttachments = useMemo(
    () => (message.getAttachments?.() ?? []).filter((a) => a != null && typeof a.getUrl === 'function'),
    [message]
  );
  const caption = message.getCaption() ?? '';
  const isSentByMe = message.getSender()?.getUid() === CometChatUIKit.loggedInUser?.getUid();
  // A "collection" (2+ items) renders each in its own lighter inner card; a SINGLE item
  // sits directly on the message bubble (the bubble is its card) — per design (single vs multiple).
  const isCollection = allAttachments.length > 1;

  if (allAttachments.length === 0) return null;

  // Collapse long collections behind a "Show N more" toggle (ENG-37024).
  const visibleAudios =
    expanded || allAttachments.length <= ATTACHMENT_COLLAPSED_LIMIT
      ? allAttachments
      : allAttachments.slice(0, ATTACHMENT_COLLAPSED_LIMIT);
  const hiddenCount = allAttachments.length - ATTACHMENT_COLLAPSED_LIMIT;
  const showExpandButton = allAttachments.length > ATTACHMENT_COLLAPSED_LIMIT;
  const expandBg = isSentByMe ? theme.color.extendedPrimary800 : theme.color.neutral100;
  const expandAccent = isSentByMe ? theme.color.staticWhite : theme.color.primary;

  return (
    <View style={{ width: '100%' }}>
      {visibleAudios.map((att, i) => {
        const key = att.getUrl() ?? String(i);
        // Playable format → the player; unsupported format → a plain file card (no player / seek bar).
        const inner = isPlayableAudio(att) ? (
          <AudioFilePlayer
            attachment={att}
            isSentByMe={isSentByMe}
            theme={theme}
            containerStyle={s.containerStyle}
            playButtonStyle={s.playButtonStyle}
            playIconStyle={s.playIconStyle}
            fileNameStyle={s.fileNameStyle}
            seekTrackStyle={s.seekTrackStyle}
            seekProgressStyle={s.seekProgressStyle}
            seekThumbStyle={s.seekThumbStyle}
            timeTextStyle={s.timeTextStyle}
            downloadIconStyle={s.downloadIconStyle}
          />
        ) : (
          <AudioFileCard
            attachment={att}
            isSentByMe={isSentByMe}
            theme={theme}
            containerStyle={s.containerStyle}
            fileNameStyle={s.fileNameStyle}
            downloadIconStyle={s.downloadIconStyle}
          />
        );
        // SINGLE audio → sits directly on the message bubble (no inner card).
        if (!isCollection) {
          return <React.Fragment key={key}>{inner}</React.Fragment>;
        }
        // COLLECTION (2+) → each audio in its own lighter, rounded card, with a gap between them.
        return (
          <View
            key={key}
            style={[{
              backgroundColor: isSentByMe ? theme.color.extendedPrimary800 : theme.color.neutral100,
              borderRadius: theme.spacing.radius.r3,
              padding: theme.spacing.padding.p3,
              // keep the gap on the last visible card too when the expand button follows it
              marginBottom: i < visibleAudios.length - 1 || showExpandButton ? theme.spacing.margin.m2 : 0,
            }, s.cardStyle]}
          >
            {inner}
          </View>
        );
      })}
      {/* ENG-37024 — "Show N more" / "Show less" toggle for a long audio collection,
          matching CometChatFilesBubble (chevron first, on the card surface). */}
      {showExpandButton && (
        <TouchableOpacity
          onPress={() => setExpanded(e => !e)}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.spacing.s1,
            backgroundColor: expandBg,
            borderRadius: theme.spacing.radius.r3,
            paddingVertical: theme.spacing.padding.p3,
            paddingHorizontal: theme.spacing.padding.p3,
          }}
          accessibilityRole="button"
        >
          <Icon
            name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={theme.spacing.spacing.s5}
            color={expandAccent as string}
          />
          <Text style={[{ ...theme.typography.body.medium, color: expandAccent }, s.expandButtonTextStyle]}>
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
            paddingHorizontal: theme.spacing.padding.p3,
            paddingTop: theme.spacing.padding.p2,
            paddingBottom: theme.spacing.padding.p1,
          }}
          textStyle={[{
            ...theme.typography.body.regular,
            color: isSentByMe ? theme.color.staticWhite : theme.color.neutral900,
          }, s.captionStyle]}
        />
      )}
    </View>
  );
}
