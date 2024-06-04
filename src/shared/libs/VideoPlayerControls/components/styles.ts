import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  column: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vignette: {
    resizeMode: 'stretch',
  },
  control: {
    padding: 16,
    opacity: 0.6,
  },
  text: {
    backgroundColor: 'transparent',
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
  },
  seekBarContainer: {
    width: '100%',
  },
});
