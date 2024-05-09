import {StyleSheet, Dimensions} from 'react-native';

const dHeight = Dimensions.get('window').height;
const dWidth = Dimensions.get('window').width;

export const heightRatio = dHeight / 667;
export const widthRatio = dWidth / 375;
export const calc = () => {
  return dHeight - 100 * heightRatio;
};
export const calcWidth = (width) => {
  return dWidth - width * widthRatio;
};

export default StyleSheet.create({
  wrapperStyle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorStyle: {
    fontSize: 12 * heightRatio,
    color: 'red',
    width: '100%',
    textAlign: 'center',
  },
  loaderContainer: {
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
    position: 'absolute',
    zIndex: 999,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleStyle: {
    fontSize: 32 * heightRatio,
    color: '#2da7ff',
    width: '100%',
    textAlign: 'center',
    fontWeight: '500',
    //borderColor:"white",
    paddingBottom: 16 * heightRatio,
  },
  subtitleStyle: {
    width: '100%',
    fontSize: 12 * heightRatio,
    textAlign: 'center',
    marginTop: 8 * heightRatio,
  },
  userContainerStyle: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10 * heightRatio,
  },
  userWrapperStyle: {
    width: 150 * widthRatio,
    marginLeft: 10 * widthRatio,
    marginRight: 10 * widthRatio,
    marginTop: 10 * heightRatio,
    marginBottom: 10 * heightRatio,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 10,
    color: 'white',
    paddingTop: 6 * heightRatio,
    paddingRight: 10 * widthRatio,
    paddingLeft: 10 * widthRatio,
    paddingBottom: 6 * heightRatio,
  },
  thumbnailWrapperStyle: {
    width: 34 * widthRatio,
    height: 34 * heightRatio,
    justifyContent: 'center',
  },
  uidWrapperStyle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  inputWrapperStyle: {
    paddingTop: 10 * heightRatio,
    paddingBottom: 10 * heightRatio,
    paddingLeft: 20 * widthRatio,
    paddingRight: 20 * widthRatio,

    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    marginTop: 10 * heightRatio,
    marginBottom: 10 * heightRatio,
    marginLeft: 24 * widthRatio,
    marginRight: 24 * widthRatio,
    paddingTop: 8 * heightRatio,
    paddingBottom: 8 * heightRatio,
    paddingLeft: 10 * widthRatio,
    paddingRight: 10 * widthRatio,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#bbb',
  },
  loginBtn: {
    backgroundColor: '#333',
    borderRadius: 10,
    color: 'white',
    paddingTop: 8 * heightRatio,
    paddingBottom: 8 * heightRatio,
    paddingLeft: 22 * widthRatio,
    paddingRight: 22 * widthRatio,
  },
  btnText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12 * heightRatio,
  },
});
