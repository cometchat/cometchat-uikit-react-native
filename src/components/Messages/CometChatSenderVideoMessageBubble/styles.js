import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { marginBottom: 16, marginRight: 8 },
  messageWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f3f4',
    marginBottom: 8,
    alignSelf: 'flex-end',
    justifyContent: 'space-between',
    maxWidth: '65%',
    borderRadius: 10,
  },
  messageVideoWrapperStyle: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    width: 220,
    height: 200,
    borderRadius: 12,
  },
  messageVideo: {
    height: '100%',
    width: '100%',
    borderRadius: 12,
  },
  messageInfoWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
