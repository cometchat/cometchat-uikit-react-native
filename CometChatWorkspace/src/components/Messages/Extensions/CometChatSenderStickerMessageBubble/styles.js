import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  messageContainerStyle: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    paddingLeft: 16,
    maxWidth: '100%',
    minWidth: '100%',
    position: 'relative',
    flexDirection: 'column',
    flexShrink: 0,
    marginRight: 8,
    alignItems: 'flex-end',
  },
  messageWrapperStyle: {
    width: '100%',
    alignSelf: 'flex-end',
  },
  messageInfoWrapperStyle: {
    alignSelf: 'flex-end',
  },
  messageImgWrapper: {
    alignSelf: 'flex-end',
    width: 128,
    height: 128,
    padding: 2,
  },
});
