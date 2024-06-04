import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    height: 1,
    marginLeft: 20,
    marginRight: 20,
    width: 150,
  },
  track: {
    backgroundColor: '#333',
    height: 1,
    marginLeft: 7,
  },
  fill: {
    backgroundColor: '#FFF',
    height: 1,
  },
  handle: {
    position: 'absolute',
    marginTop: -24,
    marginLeft: -24,
    padding: 16,
  },
  icon: {
    marginLeft: 7,
  },
});
