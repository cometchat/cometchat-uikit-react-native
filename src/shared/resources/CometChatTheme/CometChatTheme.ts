import { Palette } from './Palette';
import { Typography } from './Typography';

/**
 *
 * CometChatTheme is a component useful to add style to different components.
 * This component returns an JSON object of Palette and Typography
 *
 * @version 1.0.0
 * @author CometChat
 * @class CometChatTheme
 * @param {Object} palette
 * @param {Object} typography
 */

class CometChatTheme {
  palette: Palette
  typography: Typography

  constructor({ 
    palette = new Palette({}), 
    typography = new Typography({}) }) {
      this.palette = new Palette(palette);
      this.typography = new Typography(typography);
  }
}

export { CometChatTheme, Palette, Typography };
