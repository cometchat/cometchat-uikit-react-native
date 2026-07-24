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

export interface CometChatSmartRepliesProps {
  getSmartReplies: () => Promise<string[]>;
  onSuggestionClicked?: (reply: string) => void;
  closeCallback?: () => void;
}

type State = 'loading' | 'loaded' | 'empty' | 'error';

const CometChatSmartReplies: React.FC<CometChatSmartRepliesProps> = ({
  getSmartReplies,
  onSuggestionClicked,
  closeCallback,
}) => {
  const theme = useTheme();
  const { t } = useCometChatTranslation();
  const [state, setState] = useState<State>('loading');
  const [replies, setReplies] = useState<string[]>([]);
  const shimmer = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();

    getSmartReplies()
      .then((res) => {
        if (res && res.length > 0) {
          setReplies(res);
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

  const renderBody = () => {
    if (state === 'loading') {
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
          {[80, 110, 70].map((w, i) => (
            <Animated.View key={i} style={[s.shimmerChip, { width: w, opacity: shimmer }]} />
          ))}
        </ScrollView>
      );
    }
    if (state === 'error') {
      return <Text style={s.stateText}>{t('ai_smart_replies_error')}</Text>;
    }
    if (state === 'empty') {
      return <Text style={s.stateText}>{t('ai_smart_replies_empty')}</Text>;
    }
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {replies.map((reply, i) => (
          <TouchableOpacity
            key={i}
            style={s.chip}
            onPress={() => onSuggestionClicked?.(reply)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={reply}
          >
            <Text style={s.chipText}>{reply}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={s.wrapper}>
      <View style={s.header}>
        <Text style={s.title}>{t('ai_smart_replies_title')}</Text>
        <TouchableOpacity
          onPress={closeCallback}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('CLOSE')}
        >
          <Text style={s.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={s.body}>{renderBody()}</View>
    </View>
  );
};

const styles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: theme.color.background1,
      borderTopWidth: 1,
      borderTopColor: theme.color.borderDefault,
      paddingBottom: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 6,
    },
    title: {
      color: theme.color.textSecondary,
      fontSize: theme.typography.caption1.regular.fontSize,
      fontFamily: theme.typography.caption1.medium?.fontFamily || theme.typography.caption1.regular.fontFamily,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    closeIcon: {
      color: theme.color.textSecondary,
      fontSize: 14,
    },
    body: {
      paddingBottom: 8,
    },
    scrollContent: {
      paddingHorizontal: 12,
      gap: 8,
    },
    shimmerChip: {
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.color.background4,
      marginRight: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: theme.color.borderDefault,
      backgroundColor: theme.color.background2,
    },
    chipText: {
      color: theme.color.textPrimary,
      fontSize: theme.typography.body.regular.fontSize,
      fontFamily: theme.typography.body.regular.fontFamily,
    },
    stateText: {
      color: theme.color.textSecondary,
      fontSize: theme.typography.caption1.regular.fontSize,
      fontFamily: theme.typography.caption1.regular.fontFamily,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
  });

export default CometChatSmartReplies;
