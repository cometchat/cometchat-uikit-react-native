import { StyleSheet, Dimensions } from 'react-native';

import { calc } from '../../../utils/consts';

export default StyleSheet.create({
  reactionDetailsContainer: {
    backgroundColor: 'white',
    paddingVertical: 20,
    borderRadius: 20,
    minHeight: Dimensions.get('window').height,
  },
  contactWrapperStyle: {
    height: '100%',
    backgroundColor: 'white',
  },
  contactHeaderStyle: {
    paddingBottom: 14,
    // paddingHorizontal: 10,
    position: 'relative',
    paddingHorizontal: 25,
  },
  contactHeaderCloseStyle: {
    height: 24,
    width: '33%',
  },
  contactHeaderTitleStyle: {
    margin: 0,
    fontWeight: '700',
    textAlign: 'left',
    fontSize: 28,
  },
  contactSearchStyle: {
    padding: 4,
    marginTop: 10,
    flexDirection: 'row',
    position: 'relative',
    alignItems: 'center',
    width: '100%',
    borderWidth: 0,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,

    elevation: 2,
  },
  contactSearchInputStyle: {
    flex: 1,
    paddingVertical: 4,
    marginHorizontal: 8,
    fontSize: 15,
  },
  contactMsgStyle: {
    overflow: 'hidden',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactMsgTxtStyle: {
    margin: 0,
    height: 30,
    fontSize: 24,
    fontWeight: '600',
  },
  contactListStyle: {
    height: calc(),
    margin: 0,
    padding: 0,
  },
  contactAlphabetStyle: {
    padding: 0,
    paddingVertical: 8,
    backgroundColor: 'white',
    width: '100%',
    paddingHorizontal: 15,
  },
  contactAlphabetTextStyle: {
    fontSize: 18,
    opacity: 0.4,
  },
  itemSeperatorStyle: {
    borderBottomWidth: 1,
    width: '85%',
    alignSelf: 'flex-end',
    paddingHorizontal: 15,
  },
  headerContainer: {
    alignItems: 'center',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  addBtnStyle: {
    borderRadius: 10,
    padding: 10,
    paddingHorizontal: 15,
  },
  addBtnTxtStyle: {
    fontSize: 14,
    fontWeight: '500',
  },
});
