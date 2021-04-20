import { Dimensions, StyleSheet } from 'react-native';
import { heightRatio, widthRatio } from '../../../utils/consts';
import theme from '../../../resources/theme';
export default StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  itemLinkStyle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    marginVertical: 4,
    color: theme.color.primary,
  },
  fullWidth: { width: '100%' },
  listItemContainer: { width: '100%', marginVertical: 6 },
  sectionHeaderStyle: {
    margin: 0,
    width: '100%',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 20,
    textTransform: 'uppercase',
    color: theme.color.helpText,
  },
  headerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 19 * heightRatio,
    paddingHorizontal: 16 * widthRatio,
    borderBottomWidth: 1,
  },
  closeIcon: { marginRight: 5 },
  detailContainer: { padding: 16 },
  headerTitleStyle: {
    fontWeight: '700',
    fontSize: 20,
  },
  reactionDetailsContainer: {
    backgroundColor: 'white',
    paddingVertical: 20,
    borderRadius: 20,
    flex: 1,
    overflow: 'hidden',
    minHeight: Dimensions.get('window').height - 80,
  },
});
