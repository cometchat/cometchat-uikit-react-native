import { StyleSheet } from 'react-native';
import { widthRatio } from '../../../utils/consts';

export default StyleSheet.create({
  messageWrapperStyle: {
    flexDirection: 'row',
    backgroundColor: '#f2f3f4',
    marginBottom: 8,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    maxWidth: '81%',
    borderRadius: 12,
  },
  containerStyle: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  msgTimestampStyle: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    // display: 'inline-block',
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
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
