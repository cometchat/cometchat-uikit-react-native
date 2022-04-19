import { StyleSheet } from 'react-native';
import { heightRatio, widthRatio } from '../../../utils/consts';
import theme from '../../../resources/theme';
export default StyleSheet.create({
  nameStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '27%',
    marginRight: 15,
  },
  roleStyle: {
    width: '30%',
    fontSize: 16,
    color: theme.color.helpText,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  unbanText: { fontSize: 12, textAlign: 'center', color: theme.color.primary },
  rowStyle: {
    flexDirection: 'row',
    paddingVertical: 7 * heightRatio,
    paddingLeft: 15 * widthRatio,
    paddingRight: 20 * widthRatio,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    fontSize: 14,
  },
  avatarStyle: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: 'rgba(51,153,255,0.25)',
    marginRight: 6 * widthRatio,
  },
  imageStyle: {
    width: 20,
    height: 20,
  },
});
