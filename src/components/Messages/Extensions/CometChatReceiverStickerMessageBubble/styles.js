import { StyleSheet } from 'react-native';
import { heightRatio, widthRatio } from '../../../../utils/consts';

export default StyleSheet.create({
  messageWrapperStyle: {
    marginBottom: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 12 * widthRatio,
    paddingVertical: 8 * heightRatio,
    maxWidth: '81%',
    borderRadius: 12,
  },
  messageInfoWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    marginRight: 10 * widthRatio,
    backgroundColor: 'rgba(51,153,255,0.25)',
    borderRadius: 25,
  },
  containerStyle: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  messageImgWrapper: {
    alignSelf: 'flex-start',
    width: 128,
    height: 128,
    padding: 2,
  },
  messageContainerStyle: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingRight: 16,
    maxWidth: '65%',
    position: 'relative',
    flexDirection: 'column',
    flexShrink: 0,
  },
});
