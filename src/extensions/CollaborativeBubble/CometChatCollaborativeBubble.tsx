// @ts-ignore
import React from 'react';
// @ts-ignore
import { View, Image, Text, NativeModules } from 'react-native';
//@ts-ignore
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

    const {
        title= "",
        subTitle= "",
        buttonText= "",
        icon= undefined,
        style= new CollaborativeBubbleStyle({}),
        url= undefined,
        onPress
    } = props;


    const openLink = () => {

         if (url != "")
         if(onPress!=undefined){
            onPress(url)    
        } else {
            console.log("opening uRL , ", url);
            WebView.openUrl(url);
        }
           
    }

    const getIcon = () => {
        if (icon) {
            if (typeof icon == 'number')
                return icon
            if (typeof icon == 'string')
                return {uri: icon}
        }
        return whiteboard
    }

    const getButtonText = () => {
        if (buttonText && buttonText.trim().length > 0) {
            return buttonText;
        }
        return "";
    }


    return (
        <View style={Styles(style).containerStyle}>
            <View style={Styles(style).rowStyle}>
                <View style={{ flex: 1 }}>
                    <Text numberOfLines={2} ellipsizeMode={"tail"} style={Styles(style).titleStyle}>{title}</Text>
                    <Text numberOfLines={2} ellipsizeMode={"tail"} style={Styles(style).subtitleStyle}>{subTitle}</Text>
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

