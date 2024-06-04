//@ts-ignore
import { StyleSheet } from 'react-native';

export const Styles = (props) =>
  StyleSheet.create({
    containerStyle: {
      backgroundColor: props.backgroundColor || 'transparent',
      maxHeight: props.height || 114,
      width: props.width || 228,
      padding: 8,
    },
    rowStyle: {
        flexDirection: 'row',
    },

    titleStyle: {
        opacity: 1,
        color: props.titleColor || 'rgba(20,20,20,1)',
        ...(props.titleFont || {
          fontFamily: undefined,
          fontSize: 15,
          fontWeight: '500',
        }),
        fontStyle: 'normal',
        letterSpacing: -0.1,
        textAlign: 'left',
        lineHeight: 20,
    },

    subtitleStyle: {
        opacity: 1,
        color: props.subTitleColor || 'rgba(20,20,20,0.58)',
        ...(props.subTitleFont || {
          fontFamily: undefined,
          fontSize: 13,
          fontWeight: '400',
        }),
        fontStyle: 'normal',
        letterSpacing: -0.1,
        textAlign: 'left',
        lineHeight: 18,
    },

    imageContainerStyle:{
        padding: 8,
    },

    imageStyle: {
        opacity: 1,
        tintColor: props.iconTint || 'rgba(20, 20, 20, 0.69)',
        height: 24,
        width: 24,
    },

    buttonViewStyle: {
        justifyContent: 'center',
        alignItems: 'center',
        margin: 8,
        backgroundColor: props.buttonBackgroundColor || 'rgba(20, 20, 20, 0.04)',
    },

    dividerStyle: {
        height: 1,
        backgroundColor: props.dividerTint || 'rgba(20, 20, 20, 0.1)',
    },

    linkStyle: {
        opacity: 1,
        color: props.buttonTextColor || 'rgba(51,153,255,1)',
        ...(props.buttonTextFont || {
          fontFamily: undefined,
          fontSize: 17,
          fontWeight: '500',
        }),
        fontStyle: 'normal',
        letterSpacing: -0.1,
        textAlign: 'center',
        lineHeight: 22,
    },
  });
