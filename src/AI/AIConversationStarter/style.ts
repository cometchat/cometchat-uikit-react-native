import { BorderStyle, CometChatTheme } from "../../shared";
import { AIConversationStarterStyle } from "../utils";
import { CardViewStyle } from "../CardViewStyle";
import { StyleSheet } from 'react-native';

export function getCardViewStyle(theme:CometChatTheme, style:AIConversationStarterStyle) {
    const defaultStyle:AIConversationStarterStyle = StyleSheet.create({
        emptyStateTextColor: theme?.palette?.getAccent600(),
        loadingStateTextColor: theme?.palette?.getAccent600(),
        errorStateTextColor: theme?.palette?.getAccent600(),
        emptyStateTextFont: theme?.typography?.title2,
        errorStateTextFont: theme?.typography?.title2,
        loadingStateTextFont: theme?.typography?.title2,
        backgroundColor: theme?.palette?.getBackgroundColor(),
        loadingIconTint: theme?.palette?.getAccent600(),
        errorIconTint: theme?.palette?.getAccent600(),
        emptyIconTint: theme?.palette?.getAccent600(),
        border: {},
        borderRadius: 8,
        height: 130,
        width: "100%",      
    });
  
    return StyleSheet.flatten([defaultStyle, style]);
  }
  export function getRepliesStyle(theme, configStyles) {
    let fontFamily = configStyles?.repliesTextFont || theme?.typography?.text3;
    return StyleSheet.create({
    
        ...fontFamily,
        color: configStyles?.repliesTextColor || theme?.palette?.getAccent700(),
        backgroundColor: theme?.palette?.getBackgroundColor(),
        textAlign: 'left',
      
    });
  }

  export function getloadingStateStyle(theme, configStyles:AIConversationStarterStyle){
    let fontFamily = configStyles?.loadingStateTextFont|| theme?.typography?.title2;

    return StyleSheet.create({
    
      ...fontFamily,
      color: configStyles?.loadingStateTextColor || theme?.palette?.getAccent700(),
    
  });
  }
  export function errorLabelStyle(style:CardViewStyle) {
    return {
      ...style?.errorStateTextFont,
      color: style?.errorStateTextColor,
    };
  }
  
  export function emptyLabelStyle(style:CardViewStyle) {
    return {
      ...style?.emptyStateTextFont,
      color: style?.emptyStateTextColor,
    };
  }
  
  export function getRepliesWrapperStyle(theme:CometChatTheme, configStyles:AIConversationStarterStyle) {
    
    return StyleSheet.create({
    
        flexDirection: 'row',
        padding: 8,
        margin:4,
        backgroundColor: configStyles?.repliesTextBackgroundColor || theme?.palette?.getBackgroundColor(),
         ...new BorderStyle({borderWidth:1,borderStyle:"solid",borderColor:theme?.palette.getAccent200()}),
        borderRadius: configStyles?.repliesTextBorderRadius || 8,
        boxSizing: 'border-box',
        cursor: 'pointer',
     
    });
  }