import React from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { Hooks } from "./hooks";
import { Styles } from "./style";
import { localize } from "../../../shared/resources/CometChatLocalize";
import { CometChatTheme } from "../../../shared/resources/CometChatTheme";
import { ExtensionConstants } from "../../ExtensionConstants";
import { CometChat } from "@cometchat/chat-sdk-react-native";

export interface CometChatStickerKeyboardInterface {
  loadingText?: string,
  theme?: CometChatTheme,
  onPress?: (item: CometChat.CustomMessage) => void,
  emptyText?: string,
  errorText?: string,
}

/**
 *
 * CometChatStickerKeyboard is a component that fetches stickers from Stickers extension
 * and displays it.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */

export const CometChatStickerKeyboard = (props: CometChatStickerKeyboardInterface) => {
  const [stickerList, setStickerList] = React.useState([]);
  const [stickerSet, setStickerSet] = React.useState(null);
  const [activeStickerList, setActiveStickerList] = React.useState([]);
  const [activeStickerSetName, setActiveStickerSetName] = React.useState();
  const [decoratorMessage, setDecoratorMessage] = React.useState(
    props?.loadingText || localize("LOADING")
  );

  const theme = new CometChatTheme(props?.theme || {});
  const sendStickerMessage = (stickerItem) => {
    props?.onPress(stickerItem);
  };

  const onStickerSetClicked = (sectionItem) => {
    setActiveStickerList(stickerSet[sectionItem]);
    setActiveStickerSetName(sectionItem);
  };

  const getStickerList = () => {
    let activeStickers = [];
    if (activeStickerList && activeStickerList?.length) {
      const stickerList = [...activeStickerList];
      activeStickers = stickerList.map((stickerItem, key) => {
        return (
          <TouchableOpacity
            key={key}
            style={Styles.stickerItemStyle}
            onPress={sendStickerMessage.bind(this, stickerItem)}
          >
            <Image
              source={{ uri: stickerItem?.stickerUrl }}
              style={Styles.stickerImageStyle}
            />
          </TouchableOpacity>
        );
      });
    }

    return activeStickers;
  };

  const getStickerCategory = () => {
    let sectionItems = null;
    if (stickerSet && Object.keys(stickerSet).length) {
      sectionItems = Object.keys(stickerSet).map((sectionItem, key) => {
        const stickerSetThumbnail =
          stickerSet[sectionItem][0][ExtensionConstants.stickerUrl];
        return (
          <TouchableOpacity
            key={key}
            style={Styles.sectionListItemStyle}
            onPress={onStickerSetClicked.bind(this, sectionItem)}
          >
            <Image
              source={{ uri: stickerSetThumbnail }}
              style={Styles.stickerCategoryImageStyle}
            />
          </TouchableOpacity>
        );
      });
    }
    return sectionItems;
  };

  const getDecoratorMessage = () => {
    let messageContainer = null;
    if (activeStickerList?.length === 0) {
      messageContainer = (
        <View style={Styles.stickerMsgStyle}>
          <Text
            style={Styles.stickerMsgTxtStyle}
          >
            {decoratorMessage}
          </Text>
        </View>
      );
    }
    return messageContainer;
  };

  Hooks(
    props,
    stickerList,
    stickerSet,
    activeStickerSetName,
    setStickerList,
    setStickerSet,
    setActiveStickerList,
    setActiveStickerSetName,
    setDecoratorMessage,
    decoratorMessage,
  );

  return (
    <View
      style={Styles.stickerWrapperStyle}
    >
      {activeStickerList?.length > 0 ?
        <ScrollView
          style={Styles.stickerSectionListStyle}
          horizontal
        >
          {getStickerCategory()}
        </ScrollView>
        : getDecoratorMessage()}
      <ScrollView contentContainerStyle={Styles.stickerListStyle}>
        {getStickerList()}
      </ScrollView>
    </View>
  );
};

// Specifies the default values for props:
CometChatStickerKeyboard.defaultProps = {
  emptyText: localize("NO_STICKERS_FOUND"),
  errorText: localize("SOMETHING_WRONG"),
  loadingText: localize("LOADING"),
  style: {
    width: "100%",
    height: Dimensions.get("screen").height * 0.5,
    borderRadius: 8,
  },
};