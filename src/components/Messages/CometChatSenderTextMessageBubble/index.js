import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Linking,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import theme from '../../../resources/theme';
import Autolink from 'react-native-autolink';
import CometChatThreadedMessageReplyCount from '../CometChatThreadedMessageReplyCount';
import CometChatReadReceipt from '../CometChatReadReceipt';
import style from './styles';
import { CometChatMessageReactions } from '../../Messages/Extensions';

const messageFrom = 'sender';

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
export default (props) => {
  const [message, setMessage] = useState({ ...props.message, messageFrom });
  const prevMessage = usePrevious(message);
  const ViewTheme = { ...theme, ...props.theme };

  const getMessageText = () => {
    // let showVariation = true;
    // if (
    //   Object.prototype.hasOwnProperty.call(props, 'widgetsettings') &&
    //   props.widgetsettings &&
    //   Object.prototype.hasOwnProperty.call(props.widgetsettings, 'main') &&
    //   Object.prototype.hasOwnProperty.call(
    //     props.widgetsettings.main,
    //     'show_emojis_in_larger_size',
    //   ) &&
    //   props.widgetsettings.main.show_emojis_in_larger_size === false
    // ) {
    //   showVariation = false;
    // }

    return (
      <Autolink
        text={message.text}
        style={{ color: 'white', fontSize: 15 }}
        textProps={{ selectable: true }}
        linkProps={{ suppressHighlighting: true }}
        linkStyle={{ textDecorationLine: 'underline', fontSize: 15 }}
      />
    );
  };
  useEffect(() => {
    const previousMessageStr = JSON.stringify(prevMessage);
    const currentMessageStr = JSON.stringify(props.message);

    if (previousMessageStr !== currentMessageStr) {
      const newMessage = { ...props.message, messageFrom };
      setMessage(newMessage);
    }
  }, [props]);
  let messageText = getMessageText();
  if (Object.prototype.hasOwnProperty.call(message, 'metadata')) {
    const { metadata } = message;
    const injectedObject = metadata['@injected'];
    if (injectedObject && Object.prototype.hasOwnProperty.call(injectedObject, 'extensions')) {
      const extensionsObject = injectedObject.extensions;
      if (
        extensionsObject &&
        Object.prototype.hasOwnProperty.call(extensionsObject, 'link-preview')
      ) {
        const linkPreviewObject = extensionsObject['link-preview'];
        if (
          linkPreviewObject &&
          Object.prototype.hasOwnProperty.call(linkPreviewObject, 'links') &&
          linkPreviewObject.links.length
        ) {
          const linkObject = linkPreviewObject.links[0];

          const pattern = /(http:|https:)?\/\/(www\.)?(youtube.com|youtu.be)(\S+)?/;
          const linkText = linkObject.url.match(pattern) ? 'View on Youtube' : 'Visit';
          messageText = (
            <View
              style={[
                style.messagePreviewContainerStyle,
                { backgroundColor: ViewTheme.backgroundColor.white },
              ]}>
              <View style={style.messagePreviewWrapperStyle}>
                <Image
                  style={linkObject.image ? style.previewImageStyle : style.previewImageIconStyle}
                  source={{ uri: linkObject.image ? linkObject.image : linkObject.favicon }}
                  resizeMode="contain"
                />
                <View
                  style={[style.previewDataStyle, { borderColor: ViewTheme.borderColor.primary }]}>
                  {linkObject.title ? (
                    <View style={style.previewTitleStyle}>
                      <Text
                        style={{
                          fontWeight: '700',
                          color: ViewTheme.color.helpText,
                        }}>
                        {linkObject.title}
                      </Text>
                    </View>
                  ) : null}
                  {linkObject.description ? (
                    <View style={style.previewDescStyle}>
                      <Text
                        style={{
                          fontStyle: 'italic',
                          fontSize: 13,
                          color: ViewTheme.color.helpText,
                        }}>
                        {linkObject.description}
                      </Text>
                    </View>
                  ) : null}
                  <View style={style.previewTextStyle}>
                    <Autolink
                      text={message.text}
                      style={{ color: ViewTheme.color.helpText, textAlign: 'center' }}
                      textProps={{ selectable: true }}
                      linkProps={{ suppressHighlighting: true }}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={style.previewLinkStyle}
                  onPress={() => Linking.openURL(linkObject.url)}>
                  <Text style={{ color: ViewTheme.color.blue, fontWeight: '700' }}>{linkText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }
      }
    }
  }

  return (
    <View style={{ marginBottom: 16 }}>
      <TouchableWithoutFeedback
        onLongPress={() => {
          props.actionGenerated('openMessageActions', message);
        }}>
        <View style={style.messageWrapperStyle}>{messageText}</View>
      </TouchableWithoutFeedback>
      <View style={style.messageInfoWrapperStyle}>
        <CometChatThreadedMessageReplyCount theme={props.theme} {...props} message={message} />
        <CometChatReadReceipt theme={props.theme} {...props} message={message} />
      </View>
      <CometChatMessageReactions theme={props.theme} {...props} message={message} />
    </View>
  );
};
