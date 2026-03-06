import React, { useLayoutEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
  TouchableOpacity,
  LayoutChangeEvent,
  TextLayoutEvent,
} from "react-native";
import {
  CometChatMentionsFormatter,
  CometChatTextFormatter,
  CometChatUrlsFormatter,
} from "../../formatters";
import { useCometChatTranslation } from "../../resources/CometChatLocalizeNew";
import { t } from "../../resources/CometChatLocalizeNew/LocalizationManager";

export interface CometChatTextBubbleInterface {
  /*** text to be shown */
  text?: string;
  textStyle?: StyleProp<TextStyle>;
  /** text container style */
  textContainerStyle?: StyleProp<ViewStyle>;
  textFormatters?: Array<
    CometChatMentionsFormatter | CometChatUrlsFormatter | CometChatTextFormatter
  >;
  /** number of lines to collapse to (default 4) */
  collapseLines?: number;
  /** style for the toggle container */
  toggleContainerStyle?: StyleProp<ViewStyle>;
  /** style for the toggle text */
  toggleTextStyle?: StyleProp<TextStyle>;
}

export const CometChatTextBubble = (props: CometChatTextBubbleInterface) => {
  const { textContainerStyle } = props;

  return (
    <View style={textContainerStyle}>
      <CometChatTextBubbleText {...props} />
    </View>
  );
};

/**
 * CometChatTextBubbleText
 *
 * - measure by actual container width (onLayout) so both iOS and Android measure correctly
 * - robust measurement cache keyed by text+width so we don't re-measure unnecessarily
 */
export const CometChatTextBubbleText = (
  props: Omit<CometChatTextBubbleInterface, "textContainerStyle">
) => {
  const { t } = useCometChatTranslation();
  const {
    text = "",
    textFormatters,
    textStyle,
    collapseLines = 4,
    toggleContainerStyle,
    toggleTextStyle,
  } = props;

  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncatable, setIsTruncatable] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [measurementComplete, setMeasurementComplete] = useState(false);

  // Refs to track state without causing re-renders
  const measuredCacheRef = useRef<Record<string, boolean>>({});
  const lastTextRef = useRef<string>(text);

  // Compute formatted text synchronously - no state update needed
  const formattedText = useMemo(() => {
    let finalText = text;
    if (textFormatters && textFormatters.length) {
      for (let i = 0; i < textFormatters.length; i++) {
        finalText = textFormatters[i].getFormattedText(finalText);
      }
    }
    return finalText as string;
  }, [text, textFormatters]);

  // Reset state only when text actually changes
  useLayoutEffect(() => {
    if (lastTextRef.current !== text) {
      lastTextRef.current = text;
      setIsExpanded(false);
      setIsTruncatable(false);
      setMeasurementComplete(false);
    }
  }, [text]);

  // Handler to capture container width - use functional update to avoid dependency
  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w > 0) {
      setContainerWidth(prev => prev === w ? prev : w);
    }
  }, []);

  // Called when hidden text is laid out
  const onMeasuredTextLayout = useCallback((e: TextLayoutEvent) => {
    const key = `${formattedText}::${containerWidth ?? 0}`;

    // Skip if already measured
    if (measuredCacheRef.current[key]) {
      if (!measurementComplete) {
        setMeasurementComplete(true);
      }
      return;
    }

    const lines = e.nativeEvent.lines;
    const isNowTruncatable = !!(lines && lines.length > collapseLines);

    measuredCacheRef.current[key] = true;
    setIsTruncatable(isNowTruncatable);
    setMeasurementComplete(true);
  }, [formattedText, containerWidth, collapseLines, measurementComplete]);

  const toggle = useCallback(() => setIsExpanded(v => !v), []);

  const hiddenTextKey = `${formattedText}::${containerWidth ?? 0}`;
  const needsMeasurement = containerWidth !== null && !measuredCacheRef.current[hiddenTextKey];

  return (
    <View onLayout={onContainerLayout}>
      {/* Hidden measurement text - only render if we need to measure */}
      {needsMeasurement && (
        <Text
          key={hiddenTextKey}
          style={[
            { position: "absolute", left: 0, top: -10000, width: containerWidth!, opacity: 0 },
            textStyle as any,
          ]}
          onTextLayout={onMeasuredTextLayout}
          accessible={false}
          importantForAccessibility='no-hide-descendants'
        >
          {formattedText}
        </Text>
      )}

      {/* Visible text */}
      <Text
        style={textStyle}
        numberOfLines={isExpanded ? undefined : collapseLines}
        ellipsizeMode='tail'
      >
        {formattedText}
      </Text>

      {/* Toggle - only show after measurement is complete to prevent flicker */}
      {measurementComplete && isTruncatable && (
        <View style={[{ alignItems: "flex-end", marginTop: 6 }, toggleContainerStyle]}>
          <TouchableOpacity onPress={toggle} accessibilityRole='button'>
            <Text style={[{ alignSelf: "flex-end" }, textStyle, toggleTextStyle]}>
              {isExpanded ? t("SHOW_LESS") : t("READ_MORE")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
export default CometChatTextBubble;
