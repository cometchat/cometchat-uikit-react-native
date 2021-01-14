import { StyleSheet } from 'react-native';
import { widthRatio } from '../../../utils/consts';

export default StyleSheet.create({
  messageWrapperStyle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f3f4', // #f2f3f4
    marginBottom: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 18 * widthRatio,
    paddingVertical: 5,
    maxWidth: '87.5%',
    borderRadius: 12,
  },
  messageInfoWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderRadius: 12,
  },
});
