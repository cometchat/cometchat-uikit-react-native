import { StyleSheet } from 'react-native';

import { calc } from '../../../utils/consts';

export default StyleSheet.create({
  contactWrapperStyle: {
    height: '100%',
    backgroundColor: 'white',
  },
  contactHeaderStyle: {
    paddingBottom: 14,
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
    height: 40,
    width: '100%',
    justifyContent: 'center',
  },
});
