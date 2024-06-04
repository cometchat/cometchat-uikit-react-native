import React from 'react';
import { StyleSheet } from 'react-native';

export const AppStyle = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
  },
  heading2: {
    fontSize: 24,
    fontWeight: "bold",
    marginStart: 8
  },
  featureHeading: {
    fontSize: 22,
    fontWeight: "bold",
    alignSelf: "center",
    marginBottom: 24,
  },
  featureInfo: {
    fontWeight: "400",
    fontSize: 16,
    color: "grey",
    marginBottom: 24,
  },
  devider: {
    height: 1,
    width: "100%",
    backgroundColor: "black"
  },
  shadowEffect: {},
  storyTile: {},
  floating: {
    position: 'relative',
    height: '100%',
    width: '100%',
    zIndex: 5,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
