import { StyleSheet } from 'react-native';

export const Style = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
  },
  viewStyle: {
    borderRadius: 8,
    paddingStart: 24,
    paddingTop: 14,
    paddingEnd: 24,
    paddingBottom: 14,
    shadowColor: 'rgba(0,0,0,0.2)',
    elevation: 4,
    opacity: 1,
  },
  titleTextStyle: {
    opacity: 1,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.08,
  },
  messageTextStyle: {
    opacity: 1,
    fontSize: 16,
    fontWeight: '400',
    fontStyle: 'normal',
    textAlign: 'left',
    letterSpacing: -0.08,
  },
  buttonViewStyle: {
    justifyContent: 'flex-end',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  cancelButtonStyle: {
    padding: 8,
  },
  confirmButtonStyle: {
    padding: 8,
  },
  confirmButtonTextStyle: {
    opacity: 1,
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'normal',
    letterSpacing: 0,
    textAlign: 'right',
    lineHeight: 20,
  },
  cancelButtonTextStyle: {
    opacity: 1,
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'normal',
    letterSpacing: 0,
    textAlign: 'right',
    lineHeight: 20,
  },
});
