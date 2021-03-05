import { StyleSheet } from 'react-native';
import { widthRatio } from '../../../utils/consts';

export default StyleSheet.create({
  messageWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f3f4',
    marginBottom: 8,
    alignSelf: 'flex-end',
    paddingHorizontal: 18 * widthRatio,
    paddingVertical: 5,
    maxWidth: '100%',
    borderRadius: 30,
  },
  messageInfoWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  container: { marginBottom: 16, alignItems: 'flex-end' },
  innerContainer: { width: '70%' },
  audioControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  audioControlTimeContainer: { flexDirection: 'row', alignItems: 'center' },
  audioControlTimeText: { color: 'black', alignSelf: 'center', fontSize: 15 },
  thumbStyle: {
    height: 15,
    width: 15,
    backgroundColor: 'black',
  },
  thumbTouchSize: { height: 15, width: 15 },
  sliderStyle: {
    width: 60,
    alignSelf: 'center',
  },
});
