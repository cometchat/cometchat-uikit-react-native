import { StyleSheet } from 'react-native';
import { BorderStyle, CometChatTheme } from '../shared';
import { CardStyle, CardViewStyle } from './CardViewStyle';
import { AIButtonsStyle } from './utils';
import { AISmartRepliesStyle } from './AISmartReplies/AISmartRepliesStyle';

export function viewContainerStyle(style:CardViewStyle) {
  return {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 8,
    width: '100%',
    // height: '100%',
  };
}

export function defaultViewStyle(style:CardViewStyle) {
  return {
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  };
}



export function errorLabelStyle(style:CardViewStyle, aiStyles?:AISmartRepliesStyle) {
  return {
    ...aiStyles?.errorStateTextFont || style?.errorStateTextFont,
    color:  aiStyles?.errorStateTextColor ||  style?.errorStateTextColor,
  };
}

export function emptyLabelStyle(style:CardViewStyle, aiStyles?:AISmartRepliesStyle) {
  return {
    ...aiStyles?.emptyStateTextFont || style?.emptyStateTextFont,
    color:  aiStyles?.emptyStateTextColor ||  style?.emptyStateTextColor,
  };
}



export function tabButtonStyle(style:CardViewStyle) {
  return {
    alignItems: 'center',
    opacity: 1,
    cursor: 'pointer',
    height: style?.height,
    width: style?.width,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    padding: 8,
    ...style?.border,
    borderRadius: style?.borderRadius,
    backgroundColor: style?.backgroundColor,
  };
}

export function getPopoverStyle(style:CardViewStyle) {
  return StyleSheet.create({
    height: style?.height ||  'auto',
    // flex: 1,
    width: style?.width || '100%',
    backgroundColor: style.backgroundColor,
    ...style.border,
    borderRadius: style.borderRadius,
    flexDirection: 'column',
    alignItems: 'center',
   
  });
}
export function getloadingStateStyle(theme, configStyles?:CardViewStyle, AIStyle?:AISmartRepliesStyle){
  let fontFamily = AIStyle?.loadingStateTextFont ||  configStyles?.loadingStateTextFont || theme?.typography?.title2;

  return StyleSheet.create({
  
    ...fontFamily,
    color:  AIStyle?.loadingStateTextColor || configStyles?.loadingStateTextColor || theme?.palette?.getAccent700(),
  
});
}
export function getCardViewStyle(theme:CometChatTheme, style:CardViewStyle,AiStyles?:AISmartRepliesStyle) {
  const defaultStyle = StyleSheet.create({
      tintColor: theme?.palette?.getAccent600(),
      emptyStateTextColor: theme?.palette?.getAccent600(),
      errorStateTextColor: theme?.palette?.getAccent600(),
      emptyStateTextFont: theme?.typography?.title2,
      errorStateTextFont: theme?.typography?.title2,
      loadingStateTextColor: theme?.palette?.getAccent600(),
      loadingIconTint: theme?.palette?.getAccent600(),
      loadingStateTextFont: theme?.typography?.title2,
      errorIconTint: theme?.palette?.getAccent(),
      emptyIconTint: theme?.palette?.getAccent600(),
      backgroundColor:  theme?.palette?.getBackgroundColor(),
      border: {},
      borderRadius: 8,
      width: "100%",
      buttonTintColor: theme?.palette?.getAccent600(),
    
  });

  return StyleSheet.flatten([defaultStyle,style,AiStyles]);
}

export const containerStyle = StyleSheet.create({
  
    overflow: 'hidden',
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-start',
   alignItems: "center",
    flexDirection: 'column',
  
});

export const contentContainerStyle = StyleSheet.create({

   alignItems: 'flex-start',
    width: '100%' ,
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    padding: 8,
   
   height:'auto',

});



export function getRepliesStyle(theme, configStyles,cardStyle?:CardStyle) {
  let fontFamily = configStyles?.repliesTextFont || cardStyle?.repliesTextFont || theme?.typography?.text3;
  return StyleSheet.create({
  
      ...fontFamily,
      color: configStyles?.repliesTextColor || cardStyle?.repliesTextColor ||  theme?.palette?.getAccent(),
      backgroundColor: 'transparent',
      textAlign: 'left',
    
  });
}

export function getRepliesWrapperStyle(theme:CometChatTheme, configStyles:AIButtonsStyle,cardStyle?:CardStyle) {
  
  return StyleSheet.create({
  
      flexDirection: 'row',
      padding: 8,
      marginVertical: 4,
      backgroundColor: configStyles?.repliesTextBackgroundColor || cardStyle?.repliesTextBackgroundColor ||  theme?.palette?.getBackgroundColor(),
       ...configStyles?.repliesTextBorder || cardStyle?.repliesTextBorder || {borderBottomWidth:1,borderStyle:"solid",borderBottomColor:theme?.palette.getAccent200()},
      
      
      borderRadius: configStyles?.repliesTextBorderRadius || cardStyle?.repliesTextBorderRadius || 8,
      boxSizing: 'border-box',
      cursor: 'pointer',
   
  });
}

export function getButtonStyles(theme:CometChatTheme, style:AISmartRepliesStyle, cardStyle?:CardStyle) {
  let fontFamily = style?.buttonTextFont || cardStyle?.buttonTextFont || theme?.typography?.text1;
  return StyleSheet.create({
     paddingHorizontal: 8,
     justifyContent:"center",
     alignItems:"flex-start",
       ...style?.buttonBorder || cardStyle?.buttonBorder,
      backgroundColor: style?.buttonBackgroundColor ||  cardStyle?.buttonBackgroundColor  || theme?.palette?.getBackgroundColor(),
     ...fontFamily,
      color: style?.buttonTextColor ||   cardStyle?.buttonTextColor  || theme?.palette?.getAccent(),
      marginBottom: 8,
      height:style?.buttonHeight ||  cardStyle?.buttonHeight,
      width:style?.buttonWidth ||  cardStyle?.buttonWidth  || "100%"
  });
}
