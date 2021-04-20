import { StyleSheet } from 'react-native';
import { deviceWidth, heightRatio, widthRatio } from '../../../utils/consts';
import theme from '../../../resources/theme';
export default StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 60 * heightRatio,
    overflow: 'hidden',
    paddingHorizontal: 10,
  },
  memberScopeText: { flex: 1, paddingLeft: 15 * widthRatio },
  changeScopeContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginRight: 12 * widthRatio,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 0.4 * deviceWidth,
    overflow: 'hidden',
  },
  avatarContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: 'rgba(51,153,255,0.25)',
    marginRight: 6 * widthRatio,
  },
  changeScopeContainer2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 12 * widthRatio,
  },
  fullFlex: { flex: 1 },
  pickerItemStyle: {
    fontSize: 16,
    color: theme.color.helpText,

    borderRadius: 24,
  },
  pickerItemDetail: { height: 20 * heightRatio },
  doneContainer: { width: 30, alignItems: 'center', justifyContent: 'center' },
  editText: { fontSize: 10, textAlign: 'center' },
  ownerText: { flex: 1, paddingLeft: 15 * widthRatio },
  editAccessContainer: {
    flexDirection: 'row',
    width: 70,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionText: {
    fontSize: 12,
    textAlign: 'center',
    color: theme.color.primary,

    marginHorizontal: 5,
  },
  changeContainer: { flex: 1, flexDirection: 'row', opacity: 0.6 },
  nameText: {
    width: 0.2 * deviceWidth,
    fontSize: 16,
    color: theme.color.primary,
  },
});
