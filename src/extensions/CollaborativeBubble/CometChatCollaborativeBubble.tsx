// @ts-ignore
import React from 'react';
// @ts-ignore
import { View, Image, Text, NativeModules } from 'react-native';
import whiteboard from "./resources/whiteboard.png";
import { Styles } from "./styles";
import { CollaborativeBubbleStyle } from "./CollaborativeBubbleStyle"; 
import { ImageType } from "../../shared";
import { CollaborativeBubbleStyleInterface } from './CollaborativeBubbleStyle';

const WebView = NativeModules['WebViewManager'];

interface CollaborativeBubbleProps {
      /**
     * text displayed in bubble title
     */
      title: string,
      /**
       * icon displayed in trailing position
       */
      icon?: ImageType,
      /**
       * subtitle string displayed after title
       */
      subTitle?: string,
      /**
       * button text
       */
      buttonText?: string,

      /**
       * URL to open collaborative document
       */
      url: string,
      /**
       * style object of class CollaborativeBubbleStyleInterface.
       */
      style?: CollaborativeBubbleStyleInterface ,

      onPress?: Function
  }


export const CometChatCollaborativeBubble = (props: CollaborativeBubbleProps) => {


    const openLink = () => {

         if (props.url != "")
         if(props.onPress!=undefined){
            props.onPress(props.url)    
        } else {
            console.log("opening uRL , ", props.url);
            WebView.openUrl(props.url);
        }
           
    }

    const getIcon = () => {
        if (props.icon) {
            if (typeof props.icon == 'number')
                return props.icon
            if (typeof props.icon == 'string')
                return {uri: props.icon}
        }
        return whiteboard
    }

    const getButtonText = () => {
        if (props.buttonText && props.buttonText.trim().length > 0) {
            return props.buttonText;
        }
        return "";
    }

    const {style} = props;

    return (
        <View style={Styles(style).containerStyle}>
            <View style={Styles(style).rowStyle}>
                <View style={{ flex: 1 }}>
                    <Text numberOfLines={2} ellipsizeMode={"tail"} style={Styles(style).titleStyle}>{props.title}</Text>
                    <Text numberOfLines={2} ellipsizeMode={"tail"} style={Styles(style).subtitleStyle}>{props.subTitle}</Text>
                </View>
                <View style={Styles(style).imageContainerStyle}>
                    <Image source={getIcon()} style={Styles(style).imageStyle} />
                </View>
            </View>
            <View style={Styles(style).dividerStyle} />
            <View style={Styles(style).buttonViewStyle}>
                <Text onPress={openLink} style={Styles(style).linkStyle}>{getButtonText()}</Text>
            </View>
        </View>
    );
}

CometChatCollaborativeBubble.defaultProps = {
    title: "",
    subTitle: "",
    buttonText: "",
    icon: undefined,
    whiteboardURL: "",
    loggedInUser: undefined,
    style: new CollaborativeBubbleStyle({}),
}

