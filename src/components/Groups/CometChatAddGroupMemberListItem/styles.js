import { StyleSheet } from 'react-native';
import { heightRatio, widthRatio } from '../../../utils/consts';

export default StyleSheet.create({
  nameStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginRight: 15,
  },
  rowStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7 * heightRatio,
    paddingLeft: 15 * widthRatio,
    paddingRight: 20 * widthRatio,
    justifyContent: 'space-between',
    width: '100%',
    fontSize: 14,
  },
  avatarStyle: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(51,153,255,0.25)',
    marginRight: 15 * widthRatio,
  },
  imageStyle: {
    width: 20,
    height: 20,
  },
});
