import { StyleSheet } from 'react-native';
import { heightRatio, widthRatio } from '../../../../utils/consts';
import theme from '../../../../resources/theme';
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
    shadowColor: theme.color.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  optionText: { fontSize: 15 },
});
