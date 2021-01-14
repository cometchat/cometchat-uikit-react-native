import { StyleSheet } from 'react-native';
import { heightRatio, widthRatio } from '../../../../utils/consts';

export default StyleSheet.create({
  previewWrapperStyle: {
    width: '100%',
  },
  previewOptionStyle: {
    marginHorizontal: 6,
    backgroundColor: 'white',
    paddingHorizontal: 10 * widthRatio,
    paddingVertical: 8 * heightRatio,
    borderRadius: 18,
    marginVertical: 8,
    shadowColor: '#141414',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});
