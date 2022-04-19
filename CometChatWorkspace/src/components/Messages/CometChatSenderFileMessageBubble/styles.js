import { StyleSheet } from 'react-native';
import { widthRatio } from '../../../utils/consts';

export default StyleSheet.create({
  container: { marginBottom: 16, marginRight: 8 },
  messageWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3399FF',
    marginBottom: 4,
    alignSelf: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 12 * widthRatio,
    paddingVertical: 8,
    maxWidth: '65%',
    borderRadius: 10,
  },
  messageInfoWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  messageDetailContainer: { flex: 1, marginRight: 4 },
  messageTextStyle: { color: 'white', fontSize: 15, textAlign: 'justify' },
});
