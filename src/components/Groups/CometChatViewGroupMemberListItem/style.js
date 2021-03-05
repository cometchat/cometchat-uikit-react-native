import { StyleSheet } from 'react-native';
import { deviceWidth, heightRatio, widthRatio } from '../../../utils/consts';

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
    width: 44,
    height: 44,
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
  pickerItemStyle: { fontSize: 14 },
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
  actionText: { fontSize: 10, textAlign: 'center' },
  changeContainer: { flex: 1, flexDirection: 'row' },
  nameText: {
    width: 0.2 * deviceWidth,
  },
});
