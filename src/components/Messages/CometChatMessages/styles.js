import { StyleSheet } from 'react-native';
import theme from '../../../resources/theme';

export default StyleSheet.create({
  chatWrapperStyle: {
    // height: '100%',
    // width: '100%',
    flex:1,
    // position: 'relative',
    fontFamily: `${theme.fontFamily}`,
    backgroundColor: 'white',
  },
  reactionsWrapperStyle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    right: 0,
    zIndex: 2,
    justifyContent: 'flex-end',
    // alignItems: "flex-end",
  },
});

// '*': {
//   boxSizing: 'border-box',
//   fontFamily: `${theme.fontFamily}`,
// },
