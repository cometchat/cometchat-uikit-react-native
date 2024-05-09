import {StyleSheet} from 'react-native';

import {Dimensions} from 'react-native';

const dheight = Dimensions.get('window').height;
const dwidth = Dimensions.get('window').width;

export const heightRatio = dheight / 667;
export const widthRatio = dwidth / 375;
export const calc = () => {
  return dheight - 100 * heightRatio;
};
export const calcWidth = (width) => {
  return dwidth - width * widthRatio;
};

export default StyleSheet.create({
  wrapperStyle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  titleStyle: {
    textAlign: 'center',
    color: 'rgb(67, 171, 255)',
    fontSize: 14 * heightRatio,
    width: '100%',
    paddingTop: 0,
    paddingBottom: 16 * heightRatio,
    paddingHorizontal: 10,
  },
  subTitleStyle: {
    textAlign: 'center',
    color: '#AAA',
    width: '100%',
    paddingTop: 0,
    paddingBottom: 16 * heightRatio,
    paddingHorizontal: 10,
    fontSize: 12 * heightRatio,
  },
  helpTextStyle: {
    fontSize: 12 * heightRatio,
    textAlign: 'center',
    width: '100%',
    color: '#333',
    paddingTop: 0,
    paddingBottom: 16 * heightRatio,
  },
  componentStyle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    width: '100%',
  },
  boxStyle: {
    // marginTop: 10 * heightRatio,
    // marginBottom: 10 * heightRatio,
    marginRight: 20 * widthRatio,
    marginLeft: 20 * widthRatio,
    padding: 10 * widthRatio,
    paddingVertical: 15 * widthRatio,
    //boxShadow: "0 0 10px #bbb",
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 300 * widthRatio,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5.84,
    // elevation: 5,
  },
  boxContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapperStyle: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8 * heightRatio,
  },
  thumbnailWrapperStyle: {
    width: 34 * widthRatio,
    height: 34 * heightRatio,
  },
  componentTitleStyle: {
    width: '100%',
    // alignSelf: 'center',
    paddingBottom: 8 * widthRatio,
    fontSize: 18 * heightRatio,
    fontWeight: '600',
    paddingLeft: 10 * widthRatio,
  },
  descWrapperStyle: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    paddingBottom: 16 * heightRatio,
    borderBottomColor: '#ddd',
  },
  linkContainer: {
    //width:260*widthRatio,
    alignItems: 'center',
  },
  linkWrapperStyle: {
    borderTopWidth: 0.3 * widthRatio,
    borderTopColor: '#e8e8e8',
    //borderTop: "0.3px solid #e8e8e8",
    padding: 10 * widthRatio,
  },
  linkStyle: {
    color: 'rgb(67, 171, 255)!important',
    fontWeight: '600',
    fontSize: 12 * heightRatio,
  },
  logoutBtn: {
    // outline: "none",
    backgroundColor: '#333',
    borderRadius: 10,
    color: 'white',
    paddingTop: 8 * heightRatio,
    paddingBottom: 8 * heightRatio,
    paddingLeft: 22 * widthRatio,
    paddingRight: 22 * widthRatio,
    marginTop: 15,
  },
  btnText: {
    color: 'white',
  },
  descTextColor: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    color: 'red',
  },
});
