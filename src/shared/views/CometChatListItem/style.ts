import React from 'react';
//@ts-ignore
import { StyleSheet } from 'react-native';


export const Style = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
  },
  rightContainerStyle: {
    flexDirection: 'row',
    flex: 1,
  },
  avatarViewStyle: {
    margin: 4,
    justifyContent: 'center',
  },
  defaultStatusStyle: {
    position: 'absolute',
    end: 0,
    top: '60%',
  },
  middleViewStyle: {
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'center',
    paddingStart: 4,
    overflow: 'hidden',
  },

  titleTextStyle: {
    opacity: 1,

    textAlign: 'left',
  },
  tailViewStyle: {
    marginHorizontal: 6,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  optionStyle: {
    position: 'absolute',
    end: 0,
  },
  optionStyleContainer: {
    height: '100%',
  },
  rightActionButtonStyle: {
    height: '95%',
    alignSelf: 'center',
    width: 64,
    justifyContent: 'center',
  },
  optionButtonViewStyle: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonImageStyle: {
    height: 18,
    width: 18,
  },
  optionTitleStyle: { fontWeight: '500', fontSize: 17 },
});
