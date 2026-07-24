import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../theme';
import { useCometChatTranslation } from '../../resources/CometChatLocalizeNew';

export interface CometChatConversationStarterProps {
  getConversationStarters: () => Promise<string[]>;
  onSuggestionClicked?: (reply: string) => void;
}

type State = 'loading' | 'loaded' | 'empty' | 'error';

const CometChatConversationStarter: React.FC<CometChatConversationStarterProps> = ({
  getConversationStarters,
  onSuggestionClicked,
}) => {
  const theme = useTheme();
  const { t } = useCometChatTranslation();
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
      .catch(() => setState('error'))
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

  if (state === 'error') {
    return (
      <View style={s.container}>
        <Text style={s.stateText}>{t('ai_conversation_starter_error')}</Text>
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
    stateText: {
      color: theme.color.textSecondary,
      fontSize: theme.typography.caption1.regular.fontSize,
      fontFamily: theme.typography.caption1.regular.fontFamily,
      paddingHorizontal: 4,
    },
  });

export default CometChatConversationStarter;
