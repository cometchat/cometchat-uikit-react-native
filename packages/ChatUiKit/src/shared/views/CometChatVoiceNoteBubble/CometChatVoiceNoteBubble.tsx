import React from 'react';
import { View } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatTheme } from '../../../theme/type';
import { groupAttachments } from '../../utils/groupAttachments';
import { CometChatUIKit } from '../../CometChatUiKit';
import { CometChatAudioBubble } from '../CometChatAudioBubble';
import { CometChatCaptionText } from '../CometChatCaptionText';
import { deepMerge } from '../../helper/helperFunctions';
import { useCompTheme } from '../../../theme/hook';

// ---------------------------------------------------------------------------
// Design doc §8.1a — the "VoiceNoteBubble": renders a RECORDED voice-note message
// (metadata.audioType === "voice_note") with the WAVEFORM player — reusing the
// existing single-audio primitive (CometChatAudioBubble) unchanged, one per item.
// Voice notes are normally a single recording; a stack is rendered if there were
// several. Shared/picked audio FILES use CometChatAudiosBubble (headphone+filename)
// instead. Tap → play inline; audio is never part of the fullscreen pager (§8.2).
// ---------------------------------------------------------------------------

export interface CometChatVoiceNoteBubbleProps {
  message: CometChat.MediaMessage;
  theme: CometChatTheme;
  /** Per-instance style overrides (same pattern as the other bubbles). */
  style?: CometChatTheme["voiceNoteBubbleStyles"];
}

/**
 * Renders a recorded voice-note message as the waveform player (CometChatAudioBubble),
 * with a caption on the message.
 */
export function CometChatVoiceNoteBubble({
  message,
  theme,
  style,
}: CometChatVoiceNoteBubbleProps) {
  const compTheme = useCompTheme();
  const s = deepMerge(theme.voiceNoteBubbleStyles ?? {}, compTheme.voiceNoteBubbleStyles ?? {}, style ?? {});
  const { audioAttachments } = groupAttachments(message);
  const caption = message.getCaption() ?? '';
  const isSentByMe = message.getSender()?.getUid() === CometChatUIKit.loggedInUser?.getUid();

  if (audioAttachments.length === 0) return null;

  return (
    <View style={[{ width: '100%' }, s.containerStyle]}>
      {audioAttachments.map((att, i) => (
        <CometChatAudioBubble
          key={att.getUrl() ?? String(i)}
          audioUrl={att.getUrl()}
          playViewContainerStyle={s.playViewContainerStyle}
          playIconStyle={s.playIconStyle}
          playIconContainerStyle={s.playIconContainerStyle}
          waveStyle={s.waveStyle}
          waveContainerStyle={s.waveContainerStyle}
          playProgressTextStyle={s.playProgressTextStyle}
        />
      ))}
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
