import { StyleSheet } from 'react-native';
import { widthRatio } from '../../../utils/consts';
import theme from '../../../resources/theme';
export default StyleSheet.create({
  fullFlex: { flex: 1 },
  listItem: {
    flexDirection: 'row',
    width: '100%',
    maxHeight: 64,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  avatarStyle: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 40,
    height: 40,
    marginRight: 10,
    justifyContent: 'center',
    backgroundColor: 'rgba(51,153,255,0.25)',
    borderRadius: 25,
  },
  groupDetailsContainer: {
    borderBottomWidth: 1,
    flex: 1,
    paddingBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  memberCountStyle: {
    fontSize: 12,
    fontWeight: '200',
    maxWidth: '80%',
    color: theme.color.helpText,
  },

  groupNameStyle: {
    fontSize: 16,
    fontWeight: '600',
    maxWidth: '80%',
    color: theme.color.primary,
  },
});
