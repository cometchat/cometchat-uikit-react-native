import { StyleSheet } from 'react-native';
import { widthRatio } from '../../../utils/consts';

export default StyleSheet.create({
  messageWrapperStyle: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    maxWidth: '81%',
    borderRadius: 10,
  },
  container: { marginBottom: 16, marginLeft: 4 },
  mainContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  senderNameContainer: { marginBottom: 5 },
  containerStyle: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  msgTimestampStyle: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  avatarStyle: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 36,
    height: 36,
    marginRight: 8,
    backgroundColor: 'rgba(51,153,255,0.25)',
    borderRadius: 25,
    marginTop: 30,
  },
  messageImgWrapperStyle: {
    width: '100%',
    height: 200,
    flexShrink: 0,
  },
  messageImg: {
    borderRadius: 8,
    width: '100%',
    height: '100%',
  },
  messageInfoWrapperStyle: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
});
