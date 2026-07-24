import React, { memo, useState, useCallback, useMemo, JSX } from "react";
import { View, StyleSheet } from "react-native";
import { BubbleStyles } from "../../../theme/type";
import { MessageBubbleAlignmentType } from "../../base/Types";

/**
 * Props for the CometChatMessageBubble component.
 */
export interface CometChatMessageBubbleInterface {
  /**
   * The unique identifier of the message bubble.
   *
   * @type {string}
   */
  id: string;
  /**
   * The leading view of the message bubble.
   *
   * @type {JSX.Element | null}
   */
  LeadingView?: JSX.Element | null;
  /**
   * The header view of the message bubble.
   *
   * @type {JSX.Element | null}
   */
  HeaderView?: JSX.Element | null;
  /**
   * The status info view of the message bubble.
   *
   * @type {JSX.Element | null}
   */
  StatusInfoView?: JSX.Element | null;
  /**
   * The reply view of the message bubble.
   *
   * @type {JSX.Element | null}
   */
  ReplyView?: JSX.Element | null;
  /**
   * The bottom view of the message bubble.
   *
   * @type {JSX.Element | null}
   */
  BottomView?: JSX.Element | null;
  /**
   * The content view of the message bubble.
   *
   * @type {JSX.Element | null}
   */
  ContentView?: JSX.Element | null;
  /**
   * The thread view of the message bubble.
   *
   * @type {JSX.Element | null}
   */
  ThreadView?: JSX.Element | null;
  /**
   * The footer view of the message bubble. Can be a JSX element or a function returning a JSX element.
   *
   * @type {JSX.Element | ((params: { maxContentWidth: number }) => JSX.Element) | null}
   */
  FooterView?: JSX.Element | ((params: { maxContentWidth: number }) => JSX.Element) | null;
  /**
   * The alignment of the message bubble.
   *
   * @type {MessageBubbleAlignmentType}
   */
  alignment?: MessageBubbleAlignmentType;
  /**
   * Custom styles for the message bubble.
   *
   * @type {BubbleStyles}
   */
  style?: BubbleStyles;
}

/**
 * CometChatMessageBubble renders a customizable message bubble with optional header, content, footer,
 * and additional views such as leading, bottom, and thread views. The component adjusts its alignment
 * based on the provided `alignment` prop.
 *
 * @param {CometChatMessageBubbleInterface} props - Props for configuring the message bubble.
 * @returns {JSX.Element} The rendered message bubble.
 */
export const CometChatMessageBubble = memo(
  ({
    HeaderView,
    StatusInfoView,
    ReplyView,
    ContentView,
    FooterView,
    LeadingView,
    BottomView,
    ThreadView,
    alignment,
    id,
    style,
  }: CometChatMessageBubbleInterface) => {
    const [_width, setWidth] = useState<number | undefined>();

    /**
     * Handles layout changes by updating the component's width.
     *
     * @param {any} event - The layout event.
     */
    const handleLayout = useCallback(
      (event: any) => {
        const { width: newWidth } = event.nativeEvent.layout;
        // Update width only if it has changed
        if (newWidth !== _width) {
          setWidth(newWidth);
        }
      },
      [_width]
    );

    const alignItems = useMemo(() => {
      return alignment === "right" ? "flex-end" : alignment === "left" ? "flex-start" : alignment;
    }, [alignment]);

    return (
      <View
        style={{
          width: "100%",
          alignItems: alignItems,
        }}
      >
        <View style={styles.row}>
          {LeadingView && LeadingView}
          <View style={styles.reactionWrap}>
            {HeaderView && HeaderView}
            <View style={{ ...style?.containerStyle, overflow: 'hidden', padding: 0, paddingHorizontal: 0, paddingVertical: 0, paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }} onLayout={handleLayout}>
              {ReplyView && ReplyView}
              <View style={{
                padding: style?.containerStyle?.padding,
                paddingHorizontal: style?.containerStyle?.paddingHorizontal,
                paddingVertical: style?.containerStyle?.paddingVertical,
                paddingTop: style?.containerStyle?.paddingTop,
                paddingBottom: style?.containerStyle?.paddingBottom,
                paddingLeft: style?.containerStyle?.paddingLeft,
                paddingRight: style?.containerStyle?.paddingRight
              }}>
                {ContentView && ContentView}
                {StatusInfoView && StatusInfoView}
                {BottomView && BottomView}
              </View>
            </View>
            {_width && (
              <View style={{ maxWidth: _width }}>
                {FooterView
                  ? typeof FooterView === "function"
                    ? FooterView({ maxContentWidth: _width }) // Call function if FooterView is a function
                    : FooterView // Render JSX element directly
                  : null}
              </View>
            )}
            {ThreadView && ThreadView}
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  reactionWrap: {
    marginStart: 4,
    maxWidth: "80%",
  },
});
