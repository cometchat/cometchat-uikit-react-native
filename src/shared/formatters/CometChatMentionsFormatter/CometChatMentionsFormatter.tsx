import React from 'react';
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatTextFormatter } from "../CometChatTextFormatter";
import { MentionTextStyle } from "./MentionTextStyle";
import { Text } from "react-native";
import { CometChatUIEventHandler, CometChatUIEvents } from '../../events';
import { localize } from '../../resources';
import { SuggestionItem } from '../../views/CometChatSuggestionList';
import { CometChatUIKit } from '../../CometChatUiKit';
import { MentionsType, MentionsVisibility } from '../../constants/UIKitConstants';

/**
 * Represents the CometChatMentionsFormatter class.
 * This class extends the CometChatTextFormatter class and provides methods for handling mentions in text.
 * @extends CometChatTextFormatter
 */
export class CometChatMentionsFormatter extends CometChatTextFormatter {

  /**
   * List of users for mentions.
   */
  protected SuggestionItems: Array<SuggestionItem> = [];

  /**
   * List of searched data.
   */
  protected searchData: Array<SuggestionItem> = [];

  /**
   * Stores the formatting style for mentions.
   */
  private mentionsStyle: MentionTextStyle = {};

  /**
   * The message object in context.
   */
  protected messageObject: CometChat.BaseMessage = undefined;

  /**
   * Default search request object to fetch users or group members.
  */
  private searchRequest: CometChat.UsersRequest | CometChat.GroupMembersRequest;

  /**
   * Custom request object to fetch users or group members.
  */
  private customRequest: CometChat.UsersRequestBuilder | CometChat.GroupMembersRequestBuilder;

  /**
   * Limit of unique users to be added in the composer.
  */
  protected limit: number = 10;

  /**
   * visibleIn property to determine where the mentions should be visible.
   * @type {MentionsVisibility}
   * @default MentionsVisibility.both
   */
  protected visibleIn: MentionsVisibility = MentionsVisibility.both;

  /**
   * type property to determine the type of mention list.
   * @type {MentionsType}
   * @default MentionsType.usersAndGroupMembers
   */
  protected type: MentionsType = MentionsType.usersAndGroupMembers;

  /**
  * Initializes a new CometChatMentionsFormatter.
  * @param {CometChat.User} loggedInUser - The user who is currently logged in.
  */
  constructor(loggedInUser?: CometChat.User) {
    super();
    this.regexPattern = /<@uid:(.*?)>/g;
    this.trackCharacter = '@';
    this.loggedInUser = loggedInUser;
  }


  /**
  * Sets the message object.
  *
  * @param {CometChat.BaseMessage} messageObject - The message object to be set.
  */
  setMessage(messageObject: CometChat.BaseMessage) {
    this.messageObject = messageObject;

    let mentionedUsers = (messageObject?.getMentionedUsers && messageObject?.getMentionedUsers()) || [];
    let cometchatUIUserArray: Array<SuggestionItem> = this.convertCCUsersToSuggestionsItem(mentionedUsers);;

    this.setSuggestionItems(cometchatUIUserArray);

  }

  handlePreMessageSend(message: CometChat.TextMessage): CometChat.TextMessage {
    let CCUsers = this.getSuggestionItems().map(item => {
      let user = new CometChat.User(item.id);
      user.setAvatar(item?.leadingIconUrl);
      user.setName(item?.name);
      return user;
    });
    message.setMentionedUsers(CCUsers);
    return message;
  }

  handleComposerPreview(message: CometChat.TextMessage): void {
    let users = this.convertCCUsersToSuggestionsItem(message.getMentionedUsers());
    this.setSuggestionItems(users);
  }

  private convertCCUsersToSuggestionsItem(users: CometChat.User[]) {
    return users.map((item: CometChat.User) => {
      return new SuggestionItem({
        id: item?.getUid(),
        name: item?.getName(),
        promptText: "@" + item?.getName(),
        trackingCharacter: "@",
        underlyingText: `<@uid:${item?.getUid()}>`,
        leadingIconUrl: item?.getAvatar(),
        hideLeadingIcon: false
      })
    });
  }

  /**
   * Sets the search request builder.
   * @param requestBuilder - The request builder to set.
  */
  setSearchRequestBuilder(requestBuilder: CometChat.UsersRequestBuilder | CometChat.GroupMembersRequestBuilder) {
    this.customRequest = requestBuilder;
  }

  private shouldLoadLocalData(searchKey?: string) {
    if (this.getUniqueUsersList().size >= this.limit) {
      let data = searchKey ? [...this.SuggestionItems].filter(item => ((item.name.toLowerCase()).includes(searchKey.trim().toLowerCase()) || (item.id.toLowerCase()).includes(searchKey.trim().toLowerCase()))) : [...this.SuggestionItems];
      this.searchData = [...data];
      this.setSearchData(this.searchData);
      return true
    }
    return false
  }

  search(searchKey: string): void {
    if (this.shouldLoadLocalData(searchKey)) return;
    let requestBuilder = this.customRequest || ((this.group && this.type === MentionsType.usersAndGroupMembers) ? new CometChat.GroupMembersRequestBuilder(this.group.getGuid()) : new CometChat.UsersRequestBuilder());

    this.searchRequest = requestBuilder.setLimit(10)
      .setSearchKeyword(searchKey)
      .build();

    this.searchData = [];
    this.fetchNext(true);
  }

  fetchNext(freshCall?: boolean): void | null {
    if (this.getUniqueUsersList().size >= this.limit) return;
    this.searchRequest?.fetchNext && this.searchRequest?.fetchNext()
      .then((users: CometChat.User[]) => {
        let structuredData = this.convertCCUsersToSuggestionsItem(users);
        this.searchData = freshCall ? [...structuredData] : [...this.searchData, ...structuredData];
        this.setSearchData(this.searchData);
      })
      .catch(err => {
        console.log("searchRequest fetchNext failed:", err);
        this.setSearchData(this.searchData);
      })
  }

  setSearchData(data: Array<SuggestionItem>) {
    this.searchData = [...data];
    CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.ccSuggestionData, { id: this.composerId, data: [...this.searchData] });
  }

  /**
   * Sets the limit of unique users to be added in the composer.
  */
  setLimit(limit: number) {
    this.limit = limit;
  }

  /**
   * Retrieves the limit of unique users to be added in the composer.
  */
  getLimit() {
    return this.limit;
  }

  /**
   * Retrieves the unique users list.
   */
  getUniqueUsersList(): Set<number | string> {
    // A Set to store unique user IDs
    const uniqueUserIds: Set<number | string> = new Set();

    // Populate the Set with user IDs from the existing user list
    this.SuggestionItems.forEach(user => uniqueUserIds.add(user.id));

    return uniqueUserIds;
  }

  /**
  * Retrieves the message object.
  *
  * @returns {CometChat.BaseMessage} - The current message object.
  */
  getMessage(): CometChat.BaseMessage {
    return this.messageObject;
  }

  /**
  * Sets the regex pattern for matching text.
  *
  * @param {<RegExp>} regexPattern - Regex patterns.
  */
  setRegexPattern = (regexPattern: RegExp) => {
    this.regexPattern = regexPattern;
  }

  /**
  * Gets the regex pattern for matching text.
  */
  getRegexPattern = () => {
    return this.regexPattern;
  }

  /**
  * Retrieves the SuggestionItems.
  *
  * @returns {Array<SuggestionItem>} - The current SuggestionItems.
  */
  getSuggestionItems(): Array<SuggestionItem> {
    return this.SuggestionItems;
  }

  /**
  * Sets the SuggestionItems.
  *
  * @param {Array<SuggestionItem>} SuggestionItems - The SuggestionItems to be set.
  */
  setSuggestionItems(SuggestionItems: Array<SuggestionItem>) {
    this.SuggestionItems = [...SuggestionItems];
  }

  /**
  * Retrieves the mentions style.
  *
  * @returns {MentionTextStyle} - The current mentions style.
  */
  getMentionsStyle(): MentionTextStyle {
    return this.mentionsStyle;
  }

  /**
  * Sets the mentions style.
  *
  * @param {MentionTextStyle} mentionsStyle - The mentions style to be set.
  */
  setMentionsStyle(mentionsStyle: MentionTextStyle) {
    this.mentionsStyle = { ...mentionsStyle };
  }

  getFormattedText(inputText: string | null | JSX.Element): string | JSX.Element {
    if (!inputText) {
      return "";
    }
    let formattedText = this.addMentionsView(inputText);
    return formattedText;
  }

  temp: Function;

  setOnMentionClick(callBack: (message: CometChat.BaseMessage, uid: string) => void) {
    // callBack(this.messageObject, "uid");
    this.temp = callBack;
  }

  /**
   * Emits the event for mention click.
   * @param {any} event - The event object.
   * @param {string} uid - The user id.
  */
  private onMentionClick = (event: any, uid: string) => {
    if (this.temp) {
      this.temp(this.messageObject, uid);
      return;
    }

    // let obj = { uid, trackCharacter: this.trackCharacter };
    // CometChatUIEventHandler.emitUIEvent(CometChatUIEvents.ccMentionClick, {
    //   item: {
    //     body: {
    //       CometChatUserGroupMembersObject: obj,
    //       message: this.messageObject ?? null,
    //       id: uid,
    //     },
    //     // event,
    //     source: "mentions", //add through enum
    //   }
    // });
  }

  /**
  * This function adds the mention view to the input text.
  * 
  * @param {string} inputText - The input text where the view needs to be added.
  * @returns {string} - The modified input text.
  */
  protected addMentionsView(inputText: string | JSX.Element) {
    if (typeof inputText === 'string') {
      let mentions: JSX.Element[] = [];

      if (this.SuggestionItems) {

        const userRegistry: { [key: string]: string } = {};
        for (let i = 0; i < this.SuggestionItems?.length; i++) {
          const userUid = this.SuggestionItems[i].id;
          const userName = this.SuggestionItems[i].promptText;
          userRegistry[userUid] = userName;
        }

        // Define the regex pattern
        const regex = this.getRegexPattern();

        // Break the string into segments split by the regex
        let match;
        let lastIndex = 0;
        let segments = [];

        while ((match = regex.exec(inputText)) !== null) {

          // Add preceding non-UID segment, if any
          if (match.index > lastIndex) {
            segments.push(inputText.slice(lastIndex, match.index));
          }

          // Add UID segment
          segments.push(match[1]);

          // Update lastIndex
          lastIndex = match.index + match[0].length;
        }

        // Append trailing non-UID segment, if any
        if (lastIndex < inputText.length) {
          segments.push(inputText.slice(lastIndex));
        }

        // Now create an array of JSX elements from the segments
        const elements = segments.map((segment, index) => {
          // Check if segment is a UID
          if (userRegistry.hasOwnProperty(segment)) {

            let _loggedInUser = this.loggedInUser || CometChatUIKit.loggedInUser;

            let textStyle = (_loggedInUser?.getUid() == segment) ? this.mentionsStyle.loggedInUserTextStyle : this.mentionsStyle.textStyle;
            let onPressProp = this.temp ? { onPress: (event: any) => this.onMentionClick(event, segment) } : {};

            return (
              <Text
                suppressHighlighting={true}
                key={index}
                {...onPressProp}
                style={{ ...textStyle }}>{userRegistry[segment]}</Text>
            );
          } else {
            return <Text key={index}>{segment}</Text>;
          }
        });

        if (elements.length > 0)
          return <Text>{elements.map(item => item)}</Text>
      }
      return inputText;

    } else if (React.isValidElement(inputText)) {
      // inputText is a React element
      if (inputText.props.children) {
        // If the React element have children, we map over these children
        // and call addMentionsView recursively for each child.
        return React.cloneElement(inputText, {
          children: React.Children.map(inputText.props.children, child => {
            return this.addMentionsView(child);
          }),
        });
      } else {
        // If the React element does not have children, return it as is
        return inputText;
      }
    } else {
      throw new Error(`Unsupported inputText type: ${typeof inputText}`);
    }
  }

  /**
   * Sets the type of mention list.
   * @param type - The type of mention list.
   */
  setType(type: MentionsType) {
    this.type = type;
  }

  /**
   * Sets the visibleIn property to determine where the mentions should be visible.
   * @param visibleIn - The visibleIn property to set.
   */
  setVisibleIn(visibleIn: MentionsVisibility) {
    this.visibleIn = visibleIn;
  }

  /**
   * Retrieves the visibleIn property to determine where the mentions should be visible.
   */
  getVisibleIn() {
    return this.visibleIn;
  }

  /**
   * Retrieves the type of mention list.
   */
  getType() {
    return this.type;
  }

  getErrorString() {
    return (`${localize("MENTION_UPTO")} ${this.limit} ${this.limit === 1 ? localize("TIME") : localize("TIMES")} ${localize("AT_A_TIME")}.`);
  }

}
