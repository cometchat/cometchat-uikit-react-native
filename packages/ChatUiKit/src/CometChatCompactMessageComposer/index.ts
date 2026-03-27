import {
  CometChatCompactMessageComposer,
  CometChatCompactMessageComposerInterface,
  SingleLineMessageComposerStyleInterface,
} from './CometChatCompactMessageComposer';
import {
  SingleLineMessageComposerConfiguration,
  SingleLineMessageComposerConfigurationInterface,
  SingleLineMessageComposerDefaults,
  SingleLineMessageComposerStyleDefaults,
  SingleLineMessageComposerLayoutDefaults,
  getThemeStyleDefaults,
} from './SingleLineTextComposerConfiguration';
import {
  calculateInputHeight,
  calculateMaxHeightFromLines,
  getIconAlignment,
  DEFAULT_MIN_HEIGHT,
  DEFAULT_MAX_HEIGHT,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_MAX_LINES,
  DEFAULT_PADDING_VERTICAL,
} from './heightUtils';
import {
  Style,
  MIN_INPUT_HEIGHT,
  SingleLineComposerStyle,
  getSingleLineComposerStyle,
} from './styles';

export {
  CometChatCompactMessageComposer,
  SingleLineMessageComposerConfiguration,
  SingleLineMessageComposerConfigurationInterface,
  CometChatCompactMessageComposerInterface,
  SingleLineMessageComposerStyleInterface,
  // Default values exports
  SingleLineMessageComposerDefaults,
  SingleLineMessageComposerStyleDefaults,
  SingleLineMessageComposerLayoutDefaults,
  getThemeStyleDefaults,
  // Height calculation utilities
  calculateInputHeight,
  calculateMaxHeightFromLines,
  getIconAlignment,
  DEFAULT_MIN_HEIGHT,
  DEFAULT_MAX_HEIGHT,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_MAX_LINES,
  DEFAULT_PADDING_VERTICAL,
  // Style exports
  Style,
  MIN_INPUT_HEIGHT,
  SingleLineComposerStyle,
  getSingleLineComposerStyle,
};
