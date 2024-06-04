import React from 'react';
import { StyleSheet } from 'react-native';

export const Style = StyleSheet.create({
  container: {
    borderRadius: 8,
    paddingTop: 8,
    marginTop: 10,
  },
  padding: {
    paddingStart: 8,
    paddingEnd: 8,
  },
  buttonContainerStyle: {
    justifyContent: 'space-between',
  },
  rowDirection: {
    flexDirection: 'row',
  },
  imageStyle: {
    margin: 8,
  },
  liveReactionBtnStyle: {
    height: 24,
    width: 24,
    resizeMode: 'stretch',
  },
  liveReactionStyle: {
    alignItems: 'flex-end',
  },
});
