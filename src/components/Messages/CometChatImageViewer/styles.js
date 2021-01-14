import { StyleSheet, Platform } from 'react-native';
import { heightRatio, widthRatio } from '../../../utils/consts';

export default StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  mainContainer: {
    marginVertical: Platform.OS === 'ios' ? 50 : 65,
    backgroundColor: 'white',
    marginHorizontal: 16 * widthRatio,
    borderRadius: 15,
    alignItems: 'center',
    position: 'relative',
  },
  crossImgContainer: {
    right: 15 * widthRatio,
    top: 40 * heightRatio,
    position: 'absolute',
    height: 25 * heightRatio,
    width: 25 * heightRatio,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12.5 * heightRatio,
  },
  crossImg: {
    height: 20,
    resizeMode: 'contain',
  },
});
