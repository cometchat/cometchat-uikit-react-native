import { StyleSheet } from 'react-native';
import { widthRatio } from '../../../utils/consts';

export default StyleSheet.create({
  container: { marginBottom: 16 },
  messageContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  senderNameContainer: { marginBottom: 5 },
  audioContainer: { width: '81%' },
  audioControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  messageWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f3f4',
    marginBottom: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 18 * widthRatio,
    paddingVertical: 5,
    maxWidth: '100%',
    borderRadius: 30,
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
  timeStampContainer: { flexDirection: 'row', alignItems: 'center' },
  timeStampText: { color: 'black', alignSelf: 'center', fontSize: 15 },
  audioThumbStyle: {
    height: 15,
    width: 15,
    backgroundColor: 'black',
  },
  audioSliderStyle: {
    width: 60,
    alignSelf: 'center',
  },
});
