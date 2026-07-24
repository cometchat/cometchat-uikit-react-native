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

export interface CometChatConversationSummaryProps {
  getConversationSummary: () => Promise<string>;
  closeCallback?: () => void;
}

type State = 'loading' | 'loaded' | 'empty' | 'error';

const CometChatConversationSummary: React.FC<CometChatConversationSummaryProps> = ({
  getConversationSummary,
  closeCallback,
}) => {
  const theme = useTheme();
  const { t } = useCometChatTranslation();
  const [state, setState] = useState<State>('loading');
  const [summary, setSummary] = useState('');
  const shimmer = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();

    getConversationSummary()
      .then((res) => {
        if (res) {
          setSummary(res);
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
        <View style={s.shimmerContainer}>
          {[200, 160, 220, 140].map((w, i) => (
            <Animated.View key={i} style={[s.shimmerLine, { width: w, opacity: shimmer }]} />
          ))}
        </View>
      );
    }
    if (state === 'error') {
      return <Text style={s.stateText}>{t('ai_conversation_summary_error')}</Text>;
    }
    if (state === 'empty') {
      return <Text style={s.stateText}>{t('ai_conversation_summary_empty')}</Text>;
    }
    return (
      <ScrollView showsVerticalScrollIndicator={false} style={s.summaryScroll}>
        <Text style={s.summaryText}>{summary}</Text>
      </ScrollView>
    );
  };

  return (
    <View style={s.wrapper}>
      <View style={s.header}>
        <Text style={s.title}>{t('ai_conversation_summary_title')}</Text>
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
      backgroundColor: theme.color.background2,
      borderRadius: 12,
      marginHorizontal: 12,
      marginVertical: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.color.borderDefault,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.color.borderLight,
    },
    title: {
      color: theme.color.textPrimary,
      fontSize: theme.typography.body.medium?.fontSize || theme.typography.body.regular.fontSize,
      fontFamily: theme.typography.body.medium?.fontFamily || theme.typography.body.regular.fontFamily,
    },
    closeIcon: {
      color: theme.color.textSecondary,
      fontSize: 14,
    },
    body: {
      padding: 16,
      maxHeight: 200,
    },
    shimmerContainer: {
      gap: 10,
    },
    shimmerLine: {
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.color.background4,
    },
    summaryScroll: {
      flexGrow: 0,
    },
    summaryText: {
      color: theme.color.textPrimary,
      fontSize: theme.typography.body.regular.fontSize,
      fontFamily: theme.typography.body.regular.fontFamily,
      lineHeight: 22,
    },
    stateText: {
      color: theme.color.textSecondary,
      fontSize: theme.typography.body.regular.fontSize,
      fontFamily: theme.typography.body.regular.fontFamily,
    },
  });

export default CometChatConversationSummary;
