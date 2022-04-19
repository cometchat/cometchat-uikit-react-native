import { StyleSheet } from 'react-native';
import { widthRatio } from '../../../utils/consts';
import theme from '../../../resources/theme';

export default StyleSheet.create({
  mainWrapper: {
    width: '70%',
    flexShrink: 1,
    backgroundColor: theme.color.blue,
    borderRadius: 8,
    padding: 10,
    alignSelf: 'flex-end',
  },
  container: {
    marginBottom: 16,
    marginRight: 8,
  },
  nameContainer: { width: '100%' },

  imageContainer: { flexDirection: 'row', alignItems: 'center' },
  imageStyle: { marginRight: 10 },
  textStyle: {
    color: '#fff',
    fontSize: 15,
    width: '80%',
  },
  buttonStyle: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
});
