import { StyleSheet } from 'react-native';
import { widthRatio } from '../../../utils/consts';

export default StyleSheet.create({
  container: { marginBottom: 16, marginLeft: 4 },
  innerContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  senderNameContainer: { marginBottom: 5 },
  messageWrapperStyle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '87.5%',
    borderRadius: 10,
  },
  messageInfoWrapperStyle: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  avatarStyle: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 36,
    height: 36,
    marginRight: 10 * widthRatio,
    backgroundColor: 'rgba(51,153,255,0.25)',
    borderRadius: 25,
    marginTop: 30,
  },
  msgTimestampStyle: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  containerStyle: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
    borderRadius: 10,
  },
});
