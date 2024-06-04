import React from 'react';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  msgBubbleContainer: {
    maxHeight: '30%',
    height: 'auto',
    // width: '100%',
    paddingHorizontal: 15,
    marginVertical: 10,
  },
  actionViewContainer: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 10,
  },
  actionIcon: {
    height: 25,
    width: 25,
  },
  composerContainer: { marginHorizontal: 15, marginBottom: 10 },
});
