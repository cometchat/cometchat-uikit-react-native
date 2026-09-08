import React, { Component, ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../theme';

export interface CometChatConversationStarterProps {
  getConversationStarters: () => Promise<string[]>;
  onSuggestionClicked?: (reply: string) => void;
}

// No 'error' member: a failure is indistinguishable from 'nothing to suggest', and both
// render null. See the catch below for why an error must never reach the screen.
type State = 'loading' | 'loaded' | 'empty';

/**
 * Is this rejection "your plan does not include AI", rather than something a retry could fix?
 *
 * Matched on the code first; the message is a fallback because the same refusal reaches
 * different SDK surfaces with the code sometimes nested on the response rather than the
 * exception.
 */
export const isFeatureUnavailable = (error: any): boolean => {
  try {
    const code = error?.code ?? error?.error?.code ?? '';
    if (code === 'ERR_FEATURE_NOT_ACCESSIBLE') return true;
    const message = String(error?.message ?? error?.error?.message ?? '');
    return /feature is not available|upgrade your plan/i.test(message);
  } catch {
    return false;
  }
};

const CometChatConversationStarter: React.FC<CometChatConversationStarterProps> = ({
  getConversationStarters,
  onSuggestionClicked,
}) => {
  const theme = useTheme();
  const [state, setState] = useState<State>('loading');
  const [starters, setStarters] = useState<string[]>([]);
  const shimmer = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();

    getConversationStarters()
      .then((res) => {
        if (res && res.length > 0) {
          setStarters(res);
          setState('loaded');
        } else {
          setState('empty');
        }
      })
      .catch((error: any) => {
        // Starters are SUGGESTIONS. They are not the conversation, and nothing about the
        // conversation depends on them, so a failure here must never put anything on screen —
        // it renders nothing and the chat is left exactly as it would have been.
        //
        // It used to render "Could not load conversation starters. Please try again.", which was
        // wrong twice over: on an app without the AI add-on the call returns the same 403 for
        // ever, so the retry is a instruction that can never be satisfied; and because this view
        // stood in for the whole empty state, that one line was the only thing on an empty
        // conversation — it read as "the chat failed to load".
        //
        // Logged rather than swallowed, so a genuine outage is still diagnosable from the
        // console. The two cases are logged differently on purpose: a missing add-on is expected
        // and should not look like a defect to an integrator reading their logs.
        if (isFeatureUnavailable(error)) {
          console.warn(
            '[CometChatConversationStarter] AI conversation starters are not enabled for this app; ' +
              'no starters will be shown. This is a plan setting, not an error.'
          );
        } else {
          console.error('[CometChatConversationStarter] Failed to load conversation starters', error);
        }
        setState('empty');
      })
      .finally(() => loop.stop());

    return () => loop.stop();
  }, []);

  const s = styles(theme);

  if (state === 'loading') {
    return (
      <View style={s.container}>
        {[120, 90, 150].map((w, i) => (
          <Animated.View key={i} style={[s.shimmerChip, { width: w, opacity: shimmer }]} />
        ))}
      </View>
    );
  }

  if (state === 'empty') {
    return null;
  }

  return (
    <View style={s.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {starters.map((starter, i) => (
          <TouchableOpacity
            key={i}
            style={s.chip}
            onPress={() => onSuggestionClicked?.(starter)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={starter}
          >
            <Text style={s.chipText} numberOfLines={2}>{starter}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    scrollContent: {
      gap: 8,
      paddingRight: 8,
    },
    shimmerChip: {
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.color.background4,
      marginRight: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.color.primary,
      backgroundColor: theme.color.background1,
      maxWidth: 240,
    },
    chipText: {
      color: theme.color.primary,
      fontSize: theme.typography.body.regular.fontSize,
      fontFamily: theme.typography.body.regular.fontFamily,
    },
  });

/**
 * A crash in the suggestions must never take the conversation with it.
 *
 * The promise path is already handled — a rejected fetch logs and renders nothing. This covers
 * the other half: an exception thrown while RENDERING. React unmounts the nearest tree when a
 * render throws, and this component is mounted INSIDE the message list, so without a boundary a
 * fault in an optional AI add-on would blank the whole conversation. That is the wrong failure
 * for a feature whose entire job is to suggest an opening line.
 *
 * Renders null on failure, exactly like having no suggestions, so the chat is left as if the
 * feature were not enabled at all.
 */
class ConversationStarterBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error(
      '[CometChatConversationStarter] Suggestions crashed and were dropped; the conversation is unaffected',
      error
    );
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Exported already wrapped, so every call site is protected by construction rather than by each
 * one remembering to add a boundary.
 */
const SafeCometChatConversationStarter: React.FC<CometChatConversationStarterProps> = (props) => (
  <ConversationStarterBoundary>
    <CometChatConversationStarter {...props} />
  </ConversationStarterBoundary>
);

export default SafeCometChatConversationStarter;
