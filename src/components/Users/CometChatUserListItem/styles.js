import { StyleSheet } from 'react-native';
import { widthRatio } from '../../../utils/consts';
import theme from '../../../resources/theme';
export default StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  avatarStyle: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(51,153,255,0.25)',
    marginRight: 15 * widthRatio,
  },
  userNameStyle: {
    width: '100%',
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '600',
    maxWidth: '80%',
    color: theme.color.primary,
  },
});
