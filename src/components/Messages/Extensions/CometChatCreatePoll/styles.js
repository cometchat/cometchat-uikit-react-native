import { StyleSheet } from 'react-native';
import { widthRatio, heightRatio } from '../../../../utils/consts';

export default StyleSheet.create({
  ModalWrapperStyle: {
    marginTop: heightRatio * 40,
    alignItems: 'flex-start',
    marginLeft: widthRatio * 20,
    marginRight: widthRatio * 20,
  },
  ModalHeader: {
    width: '100%',
    paddingBottom: heightRatio * 30,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  ModalHeadingContainer: {
    height: heightRatio * 26,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  HeadingText: {
    fontWeight: 'bold',
    fontSize: heightRatio * 22,
  },
  ModalCloseButtonContainer: {
    alignSelf: 'center',
    marginRight: widthRatio * 10,
    borderRadius: 50,
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: heightRatio * 20,
    alignSelf: 'center',
  },
  ModalCloseButton: {
    fontWeight: 'bold',
    fontSize: heightRatio * 20,
  },
  ModalErrorContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    position: 'relative',
    top: 25 * heightRatio,
  },
  ErrorText: {
    color: '#FF3B30',
    marginTop: 0,
    fontSize: 14 * heightRatio,
  },
  ModalBodyItemContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: '100%',
    height: 50 * heightRatio,

    borderColor: 'pink',
  },
  ModalBodyItem: {
    // marginLeft: 26 * widthRatio,
    alignSelf: 'center',

    width: '30%',
    alignItems: 'center',
  },
  ItemText: {
    // width: 80 * widthRatio,
    fontWeight: '500',
    fontSize: 16,
  },
  SpecificItemText: {
    fontWeight: '500',
    fontSize: 16,
  },
  WrapperForTextAndAdd: {
    height: 36 * heightRatio,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '70%', /// ////
    alignSelf: 'center',
  },
  TextInAddWrapper: {
    fontSize: 16,
    fontWeight: '500',
    width: '85%',
  },
  AddButtonContainer: {
    borderRadius: 16,
    marginRight: 3 * widthRatio,
    alignItems: 'center',
    width: '15%',
  },
  AddButton: {
    height: 28,
    width: 28,
  },
  Inputbox: {
    width: '70%',
    borderColor: 'green',
    fontSize: 16, /// //
    // height: 32,
    //  marginLeft: 25,
    alignSelf: 'center',
  },
  ModalBody: {
    width: '100%',
    borderColor: 'blue',
  },
  ModalListContainer: {
    width: '100%',
    height: heightRatio * 400,
  },
  WrapperForCreateButton: {
    height: 46 * heightRatio,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10 * heightRatio,
  },
  CreateButtonContainer: {
    backgroundColor: '#3399FF',
    height: 36 * heightRatio,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80 * widthRatio,
    borderRadius: 6,
  },
  CreateButtonText: {
    color: '#fff',
    alignSelf: 'center',
    fontSize: 16 * heightRatio,
  },
});
