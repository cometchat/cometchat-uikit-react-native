import { View, Text, NativeModules } from 'react-native'
import React, { useEffect, useContext } from 'react'
import { APIAction, ButtonElement, CardMessage, URLNavigationAction } from '../../modals/InteractiveData'
import { CometChatImageBubble } from '../CometChatImageBubble';
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { CometChatContextType } from '../../base';
import { CometChatContext } from '../../CometChatContext';
import { CometChatButton } from '../CometChatButton';
import { ButtonAction, HTTPSRequestMethods } from '../../constants/UIKitConstants';
import { CometChatNetworkUtils } from '../../utils/NetworkUtils';
import { CardBubbleStyle, CardBubbleStyleInterface } from './CardBubbleStyle';

const WebView = NativeModules['WebViewManager'];
export interface CometChatCardBubbleInterface {
  message: CardMessage,  // Expect JSON object
  style?: CardBubbleStyleInterface,
  onSubmitClick?: (data: any) => void
}

export const CometChatCardBubble = (props: CometChatCardBubbleInterface) => {
  const {
    message, onSubmitClick, style
  } = props;

  const { theme } = useContext<CometChatContextType>(CometChatContext);
  const [loggedInUser, setLoggedInUser] = React.useState<CometChat.User>(null);

  const [interactedElements, setInteractedElements] = React.useState<CometChat.Interaction[]>([]);

  const _style = new CardBubbleStyle({
    backgroundColor: theme.palette.getBackgroundColor(),
    borderRadius: 5,
    padding: 5,
    imageStyle: {
      aspectRatio: 16 / 9,
      width: "100%",
      borderRadius: 5,
    },
    imageResizeMode: 'cover',
    buttonStyle: {
      backgroundColor: theme.palette.getBackgroundColor(),
      border: { borderWidth: 0 },
      textColor: theme.palette.getPrimary(),
      textFont: { fontSize: 14 },
      height: 35,
      borderRadius: 0,
    },
    textColor: theme.palette.getAccent600(),
    ...style,
  });

  const {
    backgroundColor,
    borderRadius,
    buttonStyle,
    imageResizeMode,
    imageStyle,
    padding,
    textColor,
    textFont,
  } = _style;

  useEffect(() => {
    CometChat.getLoggedinUser()
      .then(u => {
        setLoggedInUser(u);
      })
      .catch(e => {
        console.log("Error while getting loggedInUser");
        setLoggedInUser(null);
      });
    setInteractedElements(message.getInteractions() || []);
  }, []);

  const _renderButton = (data: ButtonElement, isSubmitElement?: boolean) => {
    function onClick() {
      _handleButtonClick(data.getAction(), data.getElementId(), isSubmitElement);
    }

    function isDisabled() {
      let isSender = message.getSender()?.getUid() == loggedInUser?.['uid'];

      let allowInteraction = isSender ? message?.["data"]?.["allowSenderInteraction"] : true;

      let disableAfterInteracted: boolean;
      if (data.getDisableAfterInteracted()) {
        disableAfterInteracted = interactedElements?.some(
          (element) => element.getElementId() === data.getElementId()
        );
      }
      return (disableAfterInteracted || !allowInteraction);
    }

    return (
      <View style={{ borderTopWidth: 1, borderTopColor: theme.palette.getAccent100(), opacity: isDisabled() ? .7 : 1 }}>
        <CometChatButton
          onPress={isDisabled() ? () => { } : onClick}
          text={data.getButtonText()}
          style={{...buttonStyle, textColor: isDisabled() ? theme.palette.getAccent600() : buttonStyle.textColor }}
        />
      </View>
    );
  }

  function markAsInteracted(elementId: string) {
    CometChat.markAsInteracted(message?.getId(), elementId).then(
      (response) => {
        const interaction = new CometChat.Interaction(
          elementId,
          new Date().getTime()
        );
        let clonedInteractedElements = [...interactedElements];
        clonedInteractedElements.push(interaction);
        setInteractedElements(clonedInteractedElements);
      }
    )
      .catch((error) => {
        console.log("error while markAsInteracted", error);
      });
  }

  function _handleButtonClick(action: ButtonElement["action"], elementId: string, isSubmitElement?: boolean) {
    if (isSubmitElement && onSubmitClick) {
      onSubmitClick((action as APIAction).getPayload())
      return;
    }
    switch (action.getActionType()) {
      case ButtonAction.apiAction:
        CometChatNetworkUtils.fetcher({
          url: (action as APIAction).getURL(),
          method: (action as APIAction).getMethod() || HTTPSRequestMethods.POST,
          body: { ...action.getPayload(), cometchatSenderUid: loggedInUser?.['uid'] || "" },
          headers: (action as APIAction).getHeaders(),
        })
          .then((response) => {
            if (response.status === 200) {
              markAsInteracted(elementId);
            }
          })
          .catch((error) => {
            console.log("CometChatNetworkUtils.fetcher error", error);
          });
        break;
      case ButtonAction.urlNavigation:
        const url = (action as URLNavigationAction)?.getURL();
        WebView.openUrl(url);
        markAsInteracted(elementId);
        break;
      case ButtonAction.custom:
        markAsInteracted(elementId);
        break;
      default:
        break;
    }
  }

  return (
    <View style={{ padding: 5 }}>
      <View style={{ backgroundColor, borderRadius, padding }}>
        {Boolean(message.getImageUrl()) &&
          <CometChatImageBubble
            imageUrl={{ uri: message.getImageUrl() }}
            thumbnailUrl={{ uri: message.getImageUrl() }}
            style={imageStyle}
            resizeMode={imageResizeMode}
          />
        }
        <Text style={[textFont, { marginVertical: 10, color: textColor }]}>{message.getText()}</Text>
      </View>
      {(message.getCardActions())?.map((action, index) => <React.Fragment key={index}>{_renderButton(action)}</React.Fragment>)}
    </View>
  )
}
