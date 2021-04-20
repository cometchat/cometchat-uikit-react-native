import { StyleSheet, Platform } from 'react-native';
import {
  heightRatio,
  widthRatio,
  deviceHeight,
  deviceWidth,
} from '../../../utils/consts';

export default StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  mainContainer: {
    marginVertical: Platform.OS === 'ios' ? 50 : 65,
    backgroundColor: 'white',
    marginHorizontal: 16 * widthRatio,
    borderRadius: 15,
    alignItems: 'center',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  bottomSheetContainer: {
    backgroundColor: 'white',
    height: deviceHeight * 0.9,
  },
  crossImgContainer: {
    alignSelf: 'flex-end',
    marginRight: 20,
    marginTop: 20,
  },
  crossImg: {
    height: 30 * heightRatio,
    width: 30 * widthRatio,
  },
  outerImageContainer: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  imageStyles: {
    width: '90%',
    height: '100%',
  },
});
