import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatUIEventHandler, CometChatUIEvents } from "../events";
import { SuggestionItem } from "../views/CometChatSuggestionList";

/**
 * CometChatTextFormatter
 * Abstract class for text formatter.
 */
export abstract class CometChatTextFormatter {
  /**
   * The regex patterns to find specific text pattern in the user input text.
   */
  protected regexPattern = /(@w+)/g;

  /**
   * List of users for suggestion item.
   */
  protected SuggestionItems: Array<SuggestionItem> = [];

  /**
   * The message object in context.
   */
  protected messageObject: CometChat.BaseMessage;

  /**
   * List of searched data.
   */
  protected searchData: Array<SuggestionItem> = [];

  /**
   * The user in context.
   */
  protected user: CometChat.User;

  /**
   * The group in context.
   */
  protected group: CometChat.Group;

  /**
   * The composer ID.
   */
  protected composerId: string | number;

  /**
   * The formatter id.
  */
  protected id: string | number;

  /**
   * The character to track once typed in the text input field.
   */
  protected trackCharacter: string = '#';

  /**
   * The user who is currently logged in.
   */
  protected loggedInUser?: CometChat.User;

  /**
   * Sets the regex patterns to match.
   * @param regexPattern - The regex patterns.
   */
  setRegexPatterns(regexPattern: RegExp) {
    this.regexPattern = regexPattern;
  }

  /**
   * Gets the regex pattern for matching text.
   * @returns The regex pattern.
   */
  getRegexPattern = (): RegExp => {
    return this.regexPattern;
  }

  /**
   * Gets the composer ID.
   * @returns The composer ID.
   */
  getComposerId = (): string | number => {
    return this.composerId;
  }

  /**
   * Gets the formatter ID.
   * @returns The formatter ID.
   */
  getId = (): string | number => {
    return this.id;
  }

  /**
   * Sets the tracking character.
   * @param trackCharacter - The character to track.
   */
  setTrackingCharacter(trackCharacter: string) {
    this.trackCharacter = trackCharacter;
  }

  /**
   * Sets the composer ID.
   * @param composerId - The composer ID.
   */
  setComposerId(composerId: string | number) {
    this.composerId = composerId;
  }

  /**
   * Sets the formatter ID.
   * @param id - The formatter ID.
   */
  setId(id: string | number) {
    this.id = id;
  }

  /**
   * Search function used to call an API with searched text.
   * @param searchKey - The search key.
   */
  search(searchKey: string) { }

  /**
   * Sets the search data.
   * @param data - The search data.
   */
  setSearchData(data: Array<SuggestionItem>) {
    this.searchData = [...data];
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.ccSuggestionData, { id: this.composerId, data: [...this.searchData] });
  }

  /**
   * Sets the message object.
   * @param messageObject - The message object to be set.
   */
  setMessage(messageObject: CometChat.BaseMessage) {
    this.messageObject = messageObject;
  }

  /**
   * Retrieves the message object.
   * @returns The current message object.
   */
  getMessage() {
    return this.messageObject;
  }

  /**
   * Fetches the next set of data.
  */
  fetchNext() { }

  /**
   * Sets the user.
   * @param user - The user to set.
   */
  setUser(user: CometChat.User) {
    this.user = user;
  }

  /**
   * Retrieves the user.
   * @returns The current user.
   */
  getUser(): CometChat.User {
    return this.user;
  }

  /**
   * Sets the group.
   * @param group - The group to set.
   */
  setGroup(group: CometChat.Group) {
    this.group = group;
  }

  /**
   * Retrieves the group.
   * @returns The current group.
   */
  getGroup(): CometChat.Group {
    return this.group;
  }

  /**
   * Retrieves the currently logged in user.
   * @returns The currently logged in user.
   */
  getLoggedInUser() {
    return this.loggedInUser;
  }

  /**
   * Sets the currently logged in user.
   * @param loggedInUser - The user to set as currently logged in.
   */
  setLoggedInUser(loggedInUser: CometChat.User) {
    this.loggedInUser = loggedInUser;
  }

  /**
   * If the input text is provided, it returns the formatted text. Otherwise, it edits the text using the current cursor position.
   * @param inputText - The text to format.
   * @returns The formatted text.
   */
  getFormattedText(inputText: string | null | JSX.Element): string | null | JSX.Element {
    if (!inputText) {
      return "";
    }

    return inputText;
  };

  /**
   * Handles the message before sending it.
   * @param message - The message to handle.
   * @returns The message after handling.
   */
  handlePreMessageSend(message: CometChat.TextMessage): CometChat.TextMessage {
    return message;
  };

  /**
   * Handles the message before editing it.
   * @param message - The message to handle.
   * @returns The message after handling.
   */
  handleComposerPreview(message: CometChat.TextMessage) { }

  /**
   * Gets the tracking character.
   * @returns The tracking character.
   */
  getTrackingCharacter() {
    return this.trackCharacter;
  }

  /**
   * Retrieves the suggestion items.
   * @returns The current suggestion items.
   */
  getSuggestionItems(): Array<SuggestionItem> {
    return this.SuggestionItems;
  }

  /**
   * Sets the suggestion items.
   * @param SuggestionItems - The suggestion items to be set.
   */
  setSuggestionItems(SuggestionItems: Array<SuggestionItem>) {
    this.SuggestionItems = SuggestionItems;
  }

}
