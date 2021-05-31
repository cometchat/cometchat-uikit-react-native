import { StyleSheet, Platform } from 'react-native';
import {
  heightRatio,
  widthRatio,
  deviceHeight,
  deviceWidth,
} from '../../../utils/consts';

export default StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  mainContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16 * widthRatio,
    borderRadius: 15,
    position: 'relative',
    width: '100%',
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
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
    alignItems: 'center',
    flex: 1,
    padding: 10,
  },
  imageStyles: {
    width: '90%',
    height: '50%',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
