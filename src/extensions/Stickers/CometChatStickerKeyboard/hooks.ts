import React from "react";
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { ExtensionConstants, ExtensionURLs } from "../../ExtensionConstants";
import { CometChatUIEventHandler } from "../../../shared/events/CometChatUIEventHandler/CometChatUIEventHandler";
import { localize } from "../../../shared/resources/CometChatLocalize";
import { MessageEvents } from "../../../shared/events";

export const Hooks = (
  props,
  stickerList,
  stickerSet,
  activeStickerSetName,
  setStickerList,
  setStickerSet,
  setActiveStickerList,
  setActiveStickerSetName,
  setDecoratorMessage,
  decoratorMessage
) => {
  React.useEffect(() => {
    CometChat.callExtension(
      ExtensionConstants.stickers,
      "GET",
      ExtensionURLs.stickers,
      // ExtensionURLs.stickers,
      null
    )
      .then((stickers) => {
        // Stickers received
        const customStickers = stickers.hasOwnProperty(
          ExtensionConstants.customStickers
        )
          ? stickers[ExtensionConstants.customStickers]
          : [];
        const defaultStickers = stickers.hasOwnProperty(
          ExtensionConstants.defaultStickers
        )
          ? stickers[ExtensionConstants.defaultStickers]
          : [];

        defaultStickers.sort(function (a, b) {
          return a.stickerSetOrder - b.stickerSetOrder;
        });

        customStickers.sort(function (a, b) {
          return a.stickerSetOrder - b.stickerSetOrder;
        });

        setStickerList([...defaultStickers, ...customStickers]);

        if (stickerList?.length === 0 && !(decoratorMessage === props?.loadingText || localize("NO_STICKERS_FOUND"))) {
          setDecoratorMessage(props?.emptyText || localize("NO_STICKERS_FOUND"));
        }
      })

      .catch((error) => {
        console.log(error);
        setDecoratorMessage(props?.errorText || localize("SOMETHING_WRONG"));
        CometChatUIEventHandler.emitMessageEvent(
          MessageEvents.ccMessageError,
          error
        );
      });
  }, []);

  React.useEffect(() => {
    const stickerSet = stickerList?.reduce((r, sticker, index) => {
      const { stickerSetName } = sticker;

      if (index === 0) {
        setActiveStickerSetName(stickerSetName);
      }

      r[stickerSetName] = [...(r[stickerSetName] || []), { ...sticker }];

      return r;
    }, {});
    setStickerSet(stickerSet);
  }, [stickerList]);

  React.useEffect(() => {
    if (stickerSet && Object.keys(stickerSet).length) {
      let activeStickerList = [];
      Object.keys(stickerSet).forEach((key) => {
        stickerSet[key].sort(function (a, b) {
          return a.stickerOrder - b.stickerOrder;
        });
      });
      activeStickerList = stickerSet[activeStickerSetName];
      setActiveStickerList(activeStickerList);
    }
  }, [stickerSet]);
};
