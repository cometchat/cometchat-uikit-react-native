import { StyleSheet } from 'react-native';
import { heightRatio, widthRatio } from '../../../utils/consts';

export default StyleSheet.create({
  nameStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '27%',
    marginRight: 15,
  },
  roleStyle: {
    // width: 150 * widthRatio,
    width: '30%',
    fontSize: 13,
  },
  rowStyle: {
    flexDirection: 'row',
    // borderWidth: 1,
    paddingVertical: 7 * heightRatio,
    paddingLeft: 15 * widthRatio,
    paddingRight: 20 * widthRatio,
    alignItems: 'center',
    justifyContent: 'space-between',
    // borderStyle: 'solid',
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
    marginRight: 6 * widthRatio,
  },
  imageStyle: {
    width: 20,
    height: 20,
  },
});
