import React from 'react';
import { StyleSheet } from 'react-native';

export const Style = StyleSheet.create({
  headerStyle: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingBottom: 10,
  },
  titleStyle: {
    lineHeight: 22,
  },
  layoutBtnStyle: {
    height: 24,
    width: 24,
    resizeMode: 'contain',
  },
  gridItemContainer: {
    flex: 1 / 2,
    height: 70,
    justifyContent: 'center',
    margin: 4,
  },
  gridBtnStyle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
    height: 54,
    alignItems: 'center',
  },
  listItemImageStyle: {
    margin: 4,
    width: 25,
    resizeMode: 'contain',
  },
  listContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  listTitleStyle: {
    textAlignVertical: 'center',
    marginStart: 8,
  },
});
