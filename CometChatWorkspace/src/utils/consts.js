import { Dimensions } from 'react-native';

export const deviceHeight = Dimensions.get('window').height;
export const deviceWidth = Dimensions.get('window').width;

export const heightRatio = deviceHeight / 667;
export const widthRatio = deviceWidth / 375;
export const calc = (x = 100) => {
  return deviceHeight - x * heightRatio;
};
