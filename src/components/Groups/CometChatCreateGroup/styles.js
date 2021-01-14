import { StyleSheet } from 'react-native';
import { widthRatio, heightRatio } from '../../../utils/consts';

export default StyleSheet.create({
  groupWrapperStyle: {
    height: '100%',
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8 * heightRatio,
  },
  modalCloseStyle: {
    alignSelf: 'flex-start',
    fontSize: 22 * heightRatio,
  },
  modalWrapperStyle: {
    borderColor: 'pink',
  },
  modalBodyStyle: {
    paddingLeft: 22 * widthRatio,
    paddingRight: 22 * widthRatio,
    paddingTop: 20 * heightRatio,
    paddingBottom: 20 * heightRatio,
    height: '100%',
    width: '100%',
    borderColor: 'blue',
  },
  modalTableStyle: {
    width: '100%',
    height: '90%',
    borderColor: 'orange',
  },
  tableCaptionStyle: {
    fontSize: 20 * heightRatio,
    marginBottom: 15 * heightRatio,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  tableBodyStyle: {
    borderColor: 'green',
    height: '90%',
  },
  tableErrorStyle: {
    fontSize: 12 * heightRatio,
    color: 'red',
    textAlign: 'center',
    marginBottom: 6 * heightRatio,
  },
  inputStyle: {
    width: '90%',
    borderWidth: 1,
    borderRadius: 8,
    paddingTop: 6 * heightRatio,
    paddingRight: 8 * widthRatio,
    paddingBottom: 6 * heightRatio,
    paddingLeft: 12 * widthRatio,
    marginLeft: 20,
    fontSize: 13 * heightRatio,
    marginTop: 10 * heightRatio,
    marginBottom: 10 * heightRatio,
  },
  inputPickerStyle: {
    borderRadius: 8,
    width: '88%',
    alignSelf: 'center',
  },
  groupButtonWrapper: {
    width: 80 * widthRatio,
    height: 36 * heightRatio,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:50*heightRatio,
  },
  btnText: {
    fontSize: 14 * heightRatio,
  },
});
