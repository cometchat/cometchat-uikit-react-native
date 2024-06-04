import React from "react";
import PropTypes from "prop-types";
import { View, Text, TouchableOpacity, Image } from "react-native";
// import { getExtentionData, ExtensionConstants, CometChatTheme } from "../../shared";
import { Styles } from "./style";
import closeIcon from "./resources/close.png";

/**
 *
 * CometChatMessagePreview
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
const CometChatMessagePreview = (props) => {
  let messageText = props?.messagePreviewSubtitle;
  const theme ={}
  // = new CometChatTheme(props?.theme || {});

  //xss extensions data
  // const xssData = getExtentionData(
  //   props?.messageObject,
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
  //   props?.messageObject,
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
  //   props?.messageObject,
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
  if (props?.closeIconURL) {
    if (typeof props?.closeIconURL === 'string' && props?.closeIconURL.length > 0) imageSource = { uri: props?.closeIconURL }
    else imageSource = closeIcon
  }

  return (
    <View style={Styles.editPreviewContainerStyle(props?.style, theme)}>
      <View style={Styles.leftBar(props?.style, theme)} />
      <View style={Styles.previewHeadingStyle()}>
        <Text style={Styles.previewTitleStyle(props?.style, theme)}>
          {props?.messagePreviewTitle}
        </Text>
        <TouchableOpacity
          style={Styles.previewCloseStyle(props?.style)}
          onPress={props?.onCloseClick}
        >
          <Image style={Styles.previewCloseIconStyle(props?.style)} source={imageSource} />
        </TouchableOpacity>
      </View>
      <Text numberOfLines={1} ellipsizeMode="tail" style={Styles.previewSubTitleStyle(props?.style, theme)}>{messageText}</Text>
    </View>
  );
};

CometChatMessagePreview.defaultProps = {
  messagePreviewTitle: "",
  messagePreviewSubtitle: "",
  closeIconURL: closeIcon,
  onCloseClick: null,
  style: {
    widht: "100%",
    height: "auto",
    border: {
      borderWidth: 3,
      borderStyle: "solid",
      borderColor: "rgba(20, 20, 20, 0.8)"
    },
    backgroundColor: "rgb(255,255,255)",
    borderRadius: 0,
    messagePreviewTitleFont: {},
    messagePreviewTitleColor: "",
    messagePreviewSubtitleColor: "",
    messagePreviewSubtitleFont: {},
    closeIconTint: "",
  },
};

CometChatMessagePreview.propTypes = {
  messagePreviewTitle: PropTypes.string,
  messagePreviewSubtitle: PropTypes.string,
  closeIconURL: PropTypes.any,
  onCloseClick: PropTypes.func,
  style: PropTypes.object,
};
export { CometChatMessagePreview };
