import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  heartWrap: {
    position: 'absolute',
    bottom: 30,
    backgroundColor: 'transparent',
  },
  heart: {
    width: 30,
    height: 30,
    backgroundColor: 'transparent',
  },
  heartShape: {
    width: 30,
    height: 45,
    position: 'absolute',
    top: 0,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    backgroundColor: '#de3a39',
  },
  leftHeart: {
    transform: [{ rotate: '-45deg' }],
    left: 5,
  },
  rightHeart: {
    transform: [{ rotate: '45deg' }],
    right: 5,
  },
});
