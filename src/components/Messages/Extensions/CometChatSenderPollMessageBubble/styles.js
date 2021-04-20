import { StyleSheet } from 'react-native';
import { heightRatio, widthRatio } from '../../../../utils/consts';

export default StyleSheet.create({
  container: { marginBottom: 16, marginRight: 8 },
  pollQuestionText: { fontSize: 14, textAlign: 'left', color: 'white' },
  totalText: {
    fontSize: 14,
    textAlign: 'left',
    color: 'white',
    marginTop: 10,
  },
  messageWrapperStyle: {
    backgroundColor: '#39f',
    marginBottom: 8,
    alignSelf: 'flex-end',
    paddingHorizontal: 12 * widthRatio,
    paddingVertical: 8 * heightRatio,
    maxWidth: '65%',
    borderRadius: 12,
  },
  widthStyle: { marginRight: 5, fontWeight: 'bold', fontSize: 13 },
  itemTextStyle: { fontSize: 14, width: '70%', textAlign: 'right' },
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
