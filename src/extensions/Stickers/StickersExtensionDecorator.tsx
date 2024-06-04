import React, { useEffect, useRef, useState } from "react";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatMessageTemplate } from "../../shared/modals";
import { localize } from "../../shared/resources";
import { CometChatBottomSheet} from "../../shared/views";
import { ChatConfigurator, DataSource, DataSourceDecorator } from "../../shared/framework";
import { CometChatTheme } from "../../shared/resources/CometChatTheme";
import { MessageBubbleAlignmentType, MessageCategoryConstants } from "../../shared/constants/UIKitConstants";
import { ExtensionTypeConstants } from "../ExtensionConstants";
import { Image, TouchableOpacity } from "react-native";
import { CometChatStickerBubble } from "./StickersBubble";
import { StickerConfigurationInterface } from "./StickerConfiguration";
import { StickerIcon } from "./resources";
import { CometChatStickerKeyboard } from "./CometChatStickerKeyboard";
import { CometChatUIKit } from "../../shared/CometChatUiKit/CometChatUIKit";

export class StickersExtensionDecorator extends DataSourceDecorator {

  configuration: StickerConfigurationInterface

  constructor(props: { dataSource: DataSource, configration?: StickerConfigurationInterface }) {
    super(props.dataSource);
    this.configuration = props.configration;
  }

  isDeletedMessage(message: CometChat.BaseMessage): boolean {
    return message.getDeletedBy() != null;
  }

  getAllMessageTemplates(theme: CometChatTheme): CometChatMessageTemplate[] {
    let templates = super.getAllMessageTemplates(theme);
    templates.push(
      new CometChatMessageTemplate({
        type: ExtensionTypeConstants.sticker,
        category: MessageCategoryConstants.custom,
        ContentView: (message: CometChat.CustomMessage, _alignment: MessageBubbleAlignmentType) => {
          if (this.isDeletedMessage(message)) {
            return ChatConfigurator.dataSource.getDeleteMessageBubble(message, theme);
          } else {
            return this.getStickerBubble(message, _alignment);
          }
        },
        options: (loggedInuser, message, group) => {
          return ChatConfigurator.dataSource.getMessageOptions(loggedInuser, message, group);
        }
      })
    );
    return templates;
  }

  getStickerBubble(message: CometChat.CustomMessage, alignment: MessageBubbleAlignmentType) {
    let url = message?.['data']?.['customData']?.['stickerUrl'];
    return <CometChatStickerBubble
      url={url}
      name=""
      style={{
        backgroundColor: alignment == "left" ? "red" : "blue",
        ...this.configuration?.style
      }}
    />;
  }

  getAuxiliaryOptions(user: CometChat.User, group: CometChat.Group, id?: Map<string, any>) {

    const [showKeyboard, setShowKeyboard] = useState(false);
    const loggedInUser = useRef(null);

    useEffect(() => {
      CometChat.getLoggedinUser().then(u => loggedInUser.current = u);
    },[]);

    const sendCustomMessage = (sticker) => {
      let receiverId = user?.getUid() || group?.getGuid();
      let receiverType = user ? CometChat.RECEIVER_TYPE.USER : group ? CometChat.RECEIVER_TYPE.GROUP : undefined;
      let customType = ExtensionTypeConstants.sticker;
      let customData = sticker;
      let parentId = id?.get('parentMessageId') || undefined;
      let customMessage: CometChat.CustomMessage = new CometChat.CustomMessage(
        receiverId,
        receiverType,
        customType,
        customData
        );
      customMessage.setCategory(CometChat.CATEGORY_CUSTOM as CometChat.MessageCategory);
      customMessage.setParentMessageId(parentId);
      customMessage.setMuid(new Date().getTime().toString());
      customMessage.setSender(loggedInUser.current);
      customMessage.setReceiver(user || group);
      CometChatUIKit.sendCustomMessage(customMessage).then((res) => null).catch(err => null);
    }

    let views:JSX.Element[] = super.getAuxiliaryOptions(user,group,id)
    views.push(<TouchableOpacity onPress={() => {
      setShowKeyboard(true);
    }} style={{justifyContent: "center"}}>
      <Image
        source={StickerIcon}
        style={{ height: 24, width: 24 }}
      />
      {
        <CometChatBottomSheet
          isOpen={showKeyboard}
          onClose={() => setShowKeyboard(false)}
        >
          <CometChatStickerKeyboard onPress={(sticker) => {
            sendCustomMessage(sticker);
            setShowKeyboard(false);
          }} />
        </CometChatBottomSheet>
      }
    </TouchableOpacity>)
    return views 
  }

  getAllMessageCategories(): string[] {
    var categoryList: string[] = super.getAllMessageCategories();
    if (!categoryList.includes(MessageCategoryConstants.custom)) {
      categoryList.push(MessageCategoryConstants.custom);
    }
    return categoryList;
  }


  getAllMessageTypes(): string[] {
    var messagesTypes: string[] = super.getAllMessageTypes();
    messagesTypes.push(ExtensionTypeConstants.sticker);
    return messagesTypes;
  }

  getId(): string {
    return "stickerExtention";
  }

  getLastConversationMessage(conversation: CometChat.Conversation): string {
    const message = conversation['lastMessage'];
    if (message != null &&
      message.type == ExtensionTypeConstants.sticker &&
      message.category == MessageCategoryConstants.custom) {
      return localize("CUSTOM_MESSAGE_STICKER");
    } else {
      return super.getLastConversationMessage(conversation);
    }
  }
}
