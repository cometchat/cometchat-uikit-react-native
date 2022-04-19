import { StyleSheet } from 'react-native';
import { widthRatio, heightRatio, deviceHeight } from '../../../utils/consts';

export default StyleSheet.create({
  groupWrapperStyle: {
    flex: 1,
    backgroundColor: 'white',
  },
  headingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupHeaderStyle: {
    paddingBottom: 16,
    position: 'relative',
    paddingHorizontal: 16,
  },
  contactHeaderCloseStyle: {
    height: 24,
    width: '33%',
  },
  groupHeaderTitleStyle: {
    margin: 0,
    fontWeight: '700',
    textAlign: 'left',
    fontSize: 28,
  },
  groupSearchStyle: {
    padding: 8,
    marginTop: 16,
    flexDirection: 'row',
    position: 'relative',
    alignItems: 'center',
    width: '100%',
    borderWidth: 0,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  contactSearchInputStyle: {
    flex: 1,
    paddingVertical: 4,
    marginHorizontal: 2,
    fontSize: 17,
  },
  contactMsgStyle: {
    overflow: 'hidden',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactMsgTxtStyle: {
    margin: 0,
    fontSize: 24,
    fontWeight: '600',
    padding: 5 * heightRatio,
  },
  itemSeparatorStyle: {
    borderBottomWidth: 1,
    width: '85%',
    alignSelf: 'flex-end',
    paddingHorizontal: 12 * widthRatio,
  },
  headerContainer: {
    alignItems: 'center',
    height: 48,
    width: '100%',
    justifyContent: 'center',
  },
  passwordScreenContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  passwordScreenMainContainer: {
    backgroundColor: 'white',
    height: deviceHeight + 200,
    borderRadius: 40,
  },
  passwordScreenInnerContainer: {
    marginTop: 20 * heightRatio,
    paddingHorizontal: 15 * widthRatio,
  },
  closeContainer: { alignSelf: 'flex-start' },
  closeBtn: { alignItems: 'center', justifyContent: 'center' },
  closeText: {
    fontSize: 15 * heightRatio,
  },
  passwordScreenHeader: {
    alignSelf: 'center',
    paddingTop: 50 * heightRatio,
    fontSize: 18 * heightRatio,
    fontWeight: '600',
  },
  detailsContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    marginTop: 50 * heightRatio,
    justifyContent: 'center',
    alignItems: 'center',
    width: 300 * widthRatio,
    alignSelf: 'center',
  },
  passwordInput: {
    width: 260 * widthRatio,
    fontSize: 16 * heightRatio,
  },
  enterBtn: {
    width: 30 * widthRatio,
    height: 30 * heightRatio,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnContainer: {
    marginTop: 35 * heightRatio,
    alignSelf: 'center',
  },
  nextBtn: {
    borderWidth: 1,
    paddingVertical: 8 * heightRatio,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  nextText: {
    fontSize: 18 * heightRatio,
    color: 'white',
  },
});
