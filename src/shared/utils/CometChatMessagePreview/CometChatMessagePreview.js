import React from "react";
import PropTypes from "prop-types";
import { View, Text, TouchableOpacity, Image } from "react-native";
// import { getExtentionData, ExtensionConstants, CometChatTheme } from "../../shared";
import { Styles } from "./style";
import closeIcon from "./resources/close.png";
import { MessagePreviewStyle } from "./MessagePreviewStyle";

/**
 *
 * CometChatMessagePreview
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
const CometChatMessagePreview = ({
  messagePreviewTitle = "",
  messagePreviewSubtitle = "",
  closeIconURL = closeIcon,
  onCloseClick = null,
  style = new MessagePreviewStyle({
    width: "100%",
    height: "auto",
    border: {
      borderWidth: 3,
      borderStyle: "solid",
      borderColor: "rgba(20, 20, 20, 0.8)",
    },
    backgroundColor: "rgb(255,255,255)",
    borderRadius: 0,
    messagePreviewTitleFont: {},
    messagePreviewTitleColor: "",
    messagePreviewSubtitleColor: "",
    messagePreviewSubtitleFont: {},
    closeIconTint: "",
  }),
}) => {
  let messageText = messagePreviewSubtitle;
  const theme ={}
  // = new CometChatTheme(theme || {});

  //xss extensions data
  // const xssData = getExtentionData(
  //   messageObject,
  //   ExtensionConstants.xssFilter
  // );
  // if (
  //   xssData?.hasOwnProperty(ExtensionConstants.sanitizedText) &&
  //   xssData?.hasOwnProperty(ExtensionConstants.hasXSS) &&
  //   xssData?.hasXSS === ExtensionConstants.yes
  // ) {
  //   messageText = xssData.sanitized_text;
  // }

  //datamasking extensions data
  // const maskedData = getExtentionData(
  //   messageObject,
  //   ExtensionConstants.dataMasking
  // );
  // if (
  //   maskedData?.hasOwnProperty(ExtensionConstants.data) &&
  //   maskedData?.data.hasOwnProperty(ExtensionConstants.sensitiveData) &&
  //   maskedData?.data.hasOwnProperty(ExtensionConstants.messageMasked) &&
  //   maskedData?.data.sensitive_data === ExtensionConstants.yes
  // ) {
  //   messageText = maskedData?.data.message_masked;
  // }

  //profanity extensions data
  // const profaneData = getExtentionData(
  //   messageObject,
  //   ExtensionConstants.profanityFilter
  // );
  // if (
  //   profaneData?.hasOwnProperty(ExtensionConstants.profanity) &&
  //   profaneData?.hasOwnProperty(ExtensionConstants.messageClean) &&
  //   profaneData?.profanity === ExtensionConstants.yes
  // ) {
  //   messageText = profaneData?.message_clean;
  // }

  let imageSource
  if (closeIconURL) {
    if (typeof closeIconURL === 'string' && closeIconURL.length > 0) imageSource = { uri: closeIconURL }
    else imageSource = closeIcon
  }

  return (
    <View style={Styles.editPreviewContainerStyle(style, theme)}>
      <View style={Styles.leftBar(style, theme)} />
      <View style={Styles.previewHeadingStyle()}>
        <Text style={Styles.previewTitleStyle(style, theme)}>
          {messagePreviewTitle}
        </Text>
        <TouchableOpacity
          style={Styles.previewCloseStyle(style)}
          onPress={onCloseClick}
        >
          <Image style={Styles.previewCloseIconStyle(style)} source={imageSource} />
        </TouchableOpacity>
      </View>
      <Text numberOfLines={1} ellipsizeMode="tail" style={Styles.previewSubTitleStyle(style, theme)}>{messageText}</Text>
    </View>
  );
};

export { CometChatMessagePreview };
