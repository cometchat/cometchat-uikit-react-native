import { StyleSheet } from 'react-native';
import { heightRatio, widthRatio } from '../../../../utils/consts';

export default StyleSheet.create({
  messageWrapperStyle: {
    backgroundColor: '#39f',
    marginBottom: 8,
    alignSelf: 'flex-end',
    paddingHorizontal: 12 * widthRatio,
    paddingVertical: 8 * heightRatio,
    maxWidth: '65%',
    borderRadius: 12,
  },
  messageInfoWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pollPercentStyle: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    height: '100%',
    position: 'absolute',
    zIndex: 1,
  },
  answerWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 2,
    width: '100%',
  },
  pollAnswerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderRadius: 8,
    marginTop: 10,
  },
});
