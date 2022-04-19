import { StyleSheet } from 'react-native';
import { heightRatio, widthRatio } from '../../../../utils/consts';

export default StyleSheet.create({
  container: { marginBottom: 16 },
  innerContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  messageWrapperStyle: {
    backgroundColor: '#f8f8f8',
    alignSelf: 'flex-start',
    paddingHorizontal: 12 * widthRatio,
    paddingVertical: 8 * heightRatio,
    maxWidth: '81%',
    borderRadius: 12,
  },
  answerWrapperWidthText: { fontWeight: 'bold', fontSize: 13 },
  answerWrapperItemText: { fontSize: 14, width: '70%', textAlign: 'right' },
  messageInfoWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
});
