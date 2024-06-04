import { StyleSheet } from 'react-native';

export const Styles = StyleSheet.create({
  wrapperStyle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  greyWrapperStyle: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
  },
  containerStyle: {
    flex: 1,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
    paddingHorizontal: 5,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
  },
  lineContainerStyle: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lineStyle: {
    width: 50,
    height: 4,
    borderRadius: 2,
    marginTop: 18,
    marginBottom: 30,
  },
  outerContentStyle: {
    flex: -1,
  },
  innerContentStyle: {
    flex: -1,
    marginBottom: 25,
  },
});
