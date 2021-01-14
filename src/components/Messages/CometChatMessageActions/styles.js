import { StyleSheet } from 'react-native';
import theme from '../../../resources/theme';
import { widthRatio } from '../../../utils/consts';

export default StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  actionsContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 30,
    borderRadius: 20,
    minHeight: 650,
  },
  actionsText: { fontSize: 20, marginLeft: 10 },
  action: { paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  header: {
    width: '10%',
    height: 5,
    borderRadius: 10,
    marginBottom: 10,
    alignSelf: 'center',
    backgroundColor: theme.color.darkSecondary,
  },
  avatarStyle: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 36,
    height: 36,
    marginRight: 15 * widthRatio,
  },
});
