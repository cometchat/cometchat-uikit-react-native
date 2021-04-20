import { StyleSheet, Platform, Dimensions } from 'react-native';
import theme from '../../../resources/theme';

export default StyleSheet.create({
  mainContainer: {
    bottom: Platform.OS == 'ios' ? '80%' : '85%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    elevation: 100,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    zIndex: 1000,
  },
  iconContainer: {
    width: '10%',
    height: '10%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContainer: {
    justifyContent: 'center',
    minHeight: '10%',
  },
  textContainer: {
    width: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  iconsStyle: {
    width: '90%',
    aspectRatio: 1,
  },
  textStyle: {
    fontSize: 14,
    // fontFamily: theme.fontFamily,
    textAlign: 'center',
    color: theme.color.white,
  },
});
