import React, { useLayoutEffect, useEffect, useState, useRef, useCallback, useMemo, JSX } from "react";
import {
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
  TouchableOpacity,
  LayoutChangeEvent,
  TextLayoutEvent,
  Platform,
} from "react-native";
import {
  CometChatMentionsFormatter,
  CometChatTextFormatter,
  CometChatUrlsFormatter,
} from "../../formatters";
import { useCometChatTranslation } from "../../resources/CometChatLocalizeNew";

// Pre-allocated style for view-based content wrapper (blockquotes, lists).
const VIEW_BASED_WRAPPER_STYLE = { flexShrink: 1 as const };

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
 * Recursively apply textStyle to all Text elements within a tree.
 * Needed for View-based content (blockquotes, lists) where Text nodes
 * can be nested multiple levels deep inside View wrappers.
 */
function applyTextStyleDeep(
  el: React.ReactElement<any>,
  textStyle: StyleProp<TextStyle> | undefined
): React.ReactElement<any> {
  if (el.type === Text) {
    return React.cloneElement(el, {
      style: [textStyle, el.props?.style],
    });
  }
  if (el.type === View && el.props.children) {
    const newChildren = React.Children.map(el.props.children, (child) => {
      if (!React.isValidElement(child)) return child;
      return applyTextStyleDeep(child as React.ReactElement<any>, textStyle);
    });
    return React.cloneElement(el, {}, newChildren);
  }
  return el;
}

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
  // Result can be string or JSX.Element (when rich text formatter produces View-based content)
  const formattedText = useMemo(() => {
    let finalText: string | JSX.Element | null = text;
    if (textFormatters && textFormatters.length) {
      for (let i = 0; i < textFormatters.length; i++) {
        finalText = textFormatters[i].getFormattedText(finalText);
      }
    }
    return finalText as string | JSX.Element;
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

  // Android fallback: onTextLayout doesn't fire reliably for short texts.
  // If measurement hasn't completed after 100ms, force it to resolve.
  useEffect(() => {
    if (Platform.OS === 'android' && !measurementComplete && containerWidth != null) {
      const timeout = setTimeout(() => {
        if (!measurementComplete) {
          setMeasurementComplete(true);
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [text, containerWidth, measurementComplete]);

  // Handler to capture container width - use functional update to avoid dependency
  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w > 0) {
      setContainerWidth(prev => prev === w ? prev : w);
    }
  }, []);

  // Called when hidden text is laid out
  // Use original text for the measurement key (formattedText may be JSX)
  const onMeasuredTextLayout = useCallback((e: TextLayoutEvent) => {
    const key = `${text}::${containerWidth ?? 0}`;

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
  }, [text, containerWidth, collapseLines, measurementComplete]);

  const toggle = useCallback(() => setIsExpanded(v => !v), []);

  // Use original text for keys (formattedText may be JSX and can't be stringified)
  const hiddenTextKey = `${text}::${containerWidth ?? 0}`;

  // Check if formattedText is a View-based element (e.g. blockquote with View wrapper).
  // View elements cannot be nested inside Text, so render them directly.
  const isViewBased = React.isValidElement(formattedText) &&
    (formattedText as React.ReactElement<any>).type === View;

  // For View-based content, count children to determine truncatability and slice when collapsed.
  // This avoids pixel-based clipping that cuts through the middle of list items.
  const viewChildren = useMemo(() => {
    if (!isViewBased) return null;
    const children = React.Children.toArray(
      (formattedText as React.ReactElement<any>).props.children
    ).filter(React.isValidElement) as React.ReactElement<any>[];
    return children;
  }, [isViewBased, formattedText]);

  const viewChildCount = viewChildren?.length ?? 0;
  const isViewTruncatable = isViewBased && viewChildCount > collapseLines;

  // Memoize styled children to avoid re-running applyTextStyleDeep on every render/toggle
  const styledViewChildren = useMemo(() => {
    if (!viewChildren) return null;
    return viewChildren.map((child) => {
      if (!React.isValidElement(child)) return child;
      return applyTextStyleDeep(child as React.ReactElement<any>, textStyle);
    });
  }, [viewChildren, textStyle]);

  // Only measure string content via onTextLayout — View-based uses child count instead
  const needsMeasurement = containerWidth !== null && !isViewBased && !measuredCacheRef.current[hiddenTextKey];

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

      {/* Visible text — View-based content (blockquotes, lists) rendered directly */}
      {isViewBased && styledViewChildren ? (
        <View style={VIEW_BASED_WRAPPER_STYLE}>
          {isExpanded || !isViewTruncatable ? styledViewChildren : styledViewChildren.slice(0, collapseLines)}
        </View>
      ) : (
        <Text
          style={textStyle}
          numberOfLines={isExpanded ? undefined : collapseLines}
          ellipsizeMode='tail'
        >
          {formattedText}
        </Text>
      )}

      {/* Toggle - only show after measurement is complete to prevent flicker */}
      {((measurementComplete && isTruncatable) || isViewTruncatable) && (
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
