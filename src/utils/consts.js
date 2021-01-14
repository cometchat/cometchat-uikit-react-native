import { Dimensions } from 'react-native';

const dheight = Dimensions.get('window').height;
const dwidth = Dimensions.get('window').width;

export const heightRatio = dheight / 667;
export const widthRatio = dwidth / 375;
export const calc = (x = 100) => {
  return dheight - x * heightRatio;
};
