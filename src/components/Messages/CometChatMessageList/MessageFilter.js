import * as enums from '../../../utils/enums';
import { CometChat } from '@cometchat-pro/react-native-chat';
export default class MessageFilter {
  categories = {};

  types = null;

  constructor() {
    this.categories = {
      [CometChat.CATEGORY_MESSAGE]: CometChat.CATEGORY_MESSAGE,
      [CometChat.CATEGORY_CUSTOM]: CometChat.CATEGORY_CUSTOM,
      [CometChat.CATEGORY_ACTION]: CometChat.CATEGORY_ACTION,
      [CometChat.CATEGORY_CALL]: CometChat.CATEGORY_CALL,
    };

    this.types = {
      [CometChat.MESSAGE_TYPE.TEXT]: CometChat.MESSAGE_TYPE.TEXT,
      [CometChat.MESSAGE_TYPE.IMAGE]: CometChat.MESSAGE_TYPE.IMAGE,
      [CometChat.MESSAGE_TYPE.VIDEO]: CometChat.MESSAGE_TYPE.VIDEO,
      [CometChat.MESSAGE_TYPE.AUDIO]: CometChat.MESSAGE_TYPE.AUDIO,
      [CometChat.MESSAGE_TYPE.FILE]: CometChat.MESSAGE_TYPE.FILE,
      [enums.CUSTOM_TYPE_POLL]: enums.CUSTOM_TYPE_POLL,
      [enums.CUSTOM_TYPE_STICKER]: enums.CUSTOM_TYPE_STICKER,
      [enums.ACTION_TYPE_GROUPMEMBER]: enums.ACTION_TYPE_GROUPMEMBER,
      [CometChat.CALL_TYPE.AUDIO]: CometChat.CALL_TYPE.AUDIO,
      [CometChat.CALL_TYPE.VIDEO]: CometChat.CALL_TYPE.VIDEO,
      [enums.CUSTOM_TYPE_MEETING]: enums.CUSTOM_TYPE_MEETING,
    };
  }

  getCategories = () => {
    return Object.keys(this.categories);
  };

  getTypes = () => {
    return Object.keys(this.types);
  };
}
