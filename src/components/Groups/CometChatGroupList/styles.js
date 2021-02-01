import { StyleSheet } from 'react-native';
import { widthRatio, heightRatio } from '../../../utils/consts';

export default StyleSheet.create({
  groupWrapperStyle: {
    flex:1,
    backgroundColor: 'white',
  },
  headingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupHeaderStyle: {
    paddingBottom: 12 * heightRatio,
    // paddingHorizontal: 10,
    position: 'relative',
    paddingHorizontal: 22 * widthRatio,
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
    padding: 4 * heightRatio,
    marginTop: 10 * heightRatio,
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

    // elevation: 2,
  },
  contactSearchInputStyle: {
    flex: 1,
    paddingVertical: 4 * heightRatio,
    marginHorizontal: 8 * widthRatio,
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
    padding:5*heightRatio
  },
  itemSeperatorStyle: {
    borderBottomWidth: 1,
    width: '85%',
    alignSelf: 'flex-end',
    paddingHorizontal: 12 * widthRatio,
  },
  headerContainer: {
    alignItems: 'center',
    height: 32 * heightRatio,
    width: '100%',
    justifyContent: 'center',
  },
});
