import React from 'react';
import { StyleSheet, View } from 'react-native';
import Video from 'react-native-video';
import { SelectedAttachment } from '../../modals/SelectedAttachment';

interface StagedVideoDurationProbeProps {
  attachments: SelectedAttachment[];
  /** Called once per video with its duration in whole seconds (0 if it couldn't be read). */
  onDuration: (fileId: string, durationSeconds: number) => void;
}

/**
 * Off-screen probe that reads each staged VIDEO's duration ONCE (via react-native-video's `onLoad`)
 * and reports it back, so it can be stored on the model and written into the message metadata at
 * send time (the receiver's bubble then shows the duration chip without downloading the video).
 *
 * It mounts a hidden, muted, paused `<Video>` ONLY for videos that don't have a duration yet, and
 * self-unmounts the moment a duration (or 0 on failure) is recorded — so there's no playback, no
 * audio, no visual output, and nothing left mounted during list scroll. This keeps duration reading
 * a one-time staging concern, never a render-time one.
 */
export function StagedVideoDurationProbe({ attachments, onDuration }: StagedVideoDurationProbeProps) {
  // Video AND audio: react-native-video reads both (mp3/aac included) via onLoad, one independent
  // player per file — unlike the shared native SoundPlayer, so several audios don't race to 00:00.
  const pending = attachments.filter(
    a => (a.file.type.startsWith('video/') || a.file.type.startsWith('audio/')) && a.durationSeconds == null
  );
  if (pending.length === 0) return null;

  return (
    <View style={styles.hidden} pointerEvents="none">
      {pending.map(a => (
        <Video
          key={a.fileId}
          source={{ uri: a.file.uri }}
          paused
          muted
          // onLoad → real duration; onError → 0 so we don't re-probe forever (chip just omits).
          onLoad={(data: { duration?: number }) =>
            onDuration(a.fileId, Math.max(0, Math.round(data?.duration ?? 0)))
          }
          onError={() => onDuration(a.fileId, 0)}
          style={styles.hiddenVideo}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: { width: 0, height: 0, overflow: 'hidden' },
  hiddenVideo: { width: 0, height: 0 },
});
