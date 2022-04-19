import { StyleSheet } from 'react-native';
import { heightRatio, widthRatio, deviceHeight } from '../../../utils/consts';
import theme from '../../../resources/theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  itemLinkStyle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  sectionHeaderStyle: {
    margin: 0,
    width: '100%',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 20,
    textTransform: 'uppercase',
  },
  optionsContainer: { padding: 16, flex: 1, flexGrow: 1 },
  blockContainer: { width: '100%' },
  blockText: {
    width: '100%',
    marginVertical: 6,
    paddingBottom: 8,
  },
  headerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 19 * heightRatio,
    paddingHorizontal: 16 * widthRatio,
    borderBottomWidth: 1,
  },
  headerTitleStyle: {
    fontWeight: '700',
    fontSize: 20,
  },
  reactionDetailsContainer: {
    backgroundColor: 'white',
    paddingVertical: 20,
    borderRadius: 20,
    flex: 1,
    minHeight: deviceHeight,
  },
  avatarStyle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(51,153,255,0.25)',
  },
  userName: {
    fontSize: 18 * heightRatio,
    color: theme.color.primary,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 14,
    color: theme.color.blue,
  },
  userDetailContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetail: {
    paddingLeft: 8,
    justifyContent: 'center',
    height: 48,
    width: '100%',
  },
});
