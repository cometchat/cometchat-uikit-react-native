import { StyleSheet, Dimensions, Platform } from 'react-native';

import { calc } from '../../../utils/consts';

export default StyleSheet.create({
  containerStyle: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  reactionDetailsContainer: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    borderRadius: 20,
    height: Dimensions.get('window').height - 90,
  },
  contactWrapperStyle: {
    height: '100%',
    backgroundColor: 'white',
  },
  contactHeaderStyle: {
    paddingBottom: 14,
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
    marginHorizontal: 15,
    marginBottom: 10,
    flexDirection: 'row',
    position: 'relative',
    alignItems: 'center',
    borderWidth: 0,
    borderRadius: 8,
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
    marginHorizontal: 10,
    fontSize: 14,
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
  itemSeparatorStyle: {
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
    width: '40%',
    alignItems: 'center',
    alignSelf: 'center',
  },
  addBtnTxtStyle: {
    fontSize: 16,
    fontWeight: '500',
  },
});
