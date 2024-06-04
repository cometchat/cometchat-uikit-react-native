import React from 'react';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 15 },
  textInput: {
    marginTop: 32,
    padding: 8,
    borderBottomWidth: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    marginTop: 10,
  },
  errorContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    marginTop: 25,
    borderRadius: 5,
  },
  errorImageContainer: {
    padding: 8,
    borderRadius: 100,
  },
  errorImage: {
    height: 24,
    width: 24,
    resizeMode: 'contain',
  },
  errorTextTitle: {
    marginStart: 8,
  },
  errorTextContainer: { flex: 1 },
  errorText: {
    marginStart: 8,
  },
  tabView: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
  },
});
