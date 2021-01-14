import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  messageWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'flex-end',
    justifyContent: 'space-between',
    maxWidth: '65%',
    borderRadius: 10,
  },
  messageImgWrapperStyle: {
    alignSelf: 'flex-end',
    width: '100%',
    height: 200,
    flexShrink: 0,
  },
  messageImg: {
    borderRadius: 8,
    height: '100%',
  },
  messageInfoWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
