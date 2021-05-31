import { StyleSheet } from 'react-native';
import { heightRatio, widthRatio } from '../../../utils/consts';
import theme from '../../../resources/theme';
export default StyleSheet.create({
  nameStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginRight: 15,
  },
  userName: { fontSize: 16, color: theme.color.primary },
  rowStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7 * heightRatio,
    paddingLeft: 15 * widthRatio,
    paddingRight: 20 * widthRatio,
    justifyContent: 'space-between',
    width: '100%',
    height: 64,
    fontSize: 14,
  },
  avatarStyle: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: 'rgba(51,153,255,0.25)',
    marginRight: 15 * widthRatio,
  },
  imageStyle: {
    width: 20,
    height: 20,
  },
});
