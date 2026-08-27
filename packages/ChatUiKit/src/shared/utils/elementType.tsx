import { Text, View } from "react-native";

/**
 * Identity checks for react-native's `View` / `Text` that survive a wrapped JSX runtime.
 *
 * We ship raw `.tsx`, so the *consumer's* babel compiles our source. A build that
 * substitutes the JSX runtime — NativeWind (`react-native-css-interop`) being the common
 * case — swaps every element's type for an equivalent wrapper (`CssInterop.View`). A bare
 * `element.type === View` then silently returns false, and rich-text bubbles lose their
 * colour and truncation (ENG-38093).
 *
 * The fix is to stop assuming what a `View` element looks like and ask the runtime that is
 * actually in effect. Because these probes are compiled by the same pipeline as the code
 * whose elements we inspect, they resolve to whatever identity that pipeline produces.
 *
 * The probes must be written as JSX. `React.createElement` is deliberately NOT equivalent:
 * css-interop wraps only the JSX runtime and re-exports `createElement` untouched, so
 * building the probe that way would capture the unwrapped identity and defeat the purpose.
 *
 * With no wrapper present these constants are simply `View` / `Text`, so the checks behave
 * exactly as the original strict comparison did — no behaviour change for consumers who
 * don't transform our JSX.
 */
const RUNTIME_VIEW = (<View />).type;
const RUNTIME_TEXT = (<Text />).type;

/**
 * True when `el` is a react-native `View` element.
 *
 * The `=== View` arm is a fallback for elements built outside our own compilation unit —
 * e.g. a consumer's custom `CometChatTextFormatter` returning a plain `<View>` tree.
 */
export const isViewElement = (el: any): boolean =>
  el?.type === RUNTIME_VIEW || el?.type === View;

/** True when `el` is a react-native `Text` element. Mirrors {@link isViewElement}. */
export const isTextElement = (el: any): boolean =>
  el?.type === RUNTIME_TEXT || el?.type === Text;
