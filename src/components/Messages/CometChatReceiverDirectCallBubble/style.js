import { StyleSheet } from 'react-native';
import { widthRatio } from '../../../utils/consts';
import theme from '../../../resources/theme';

export default StyleSheet.create({
  mainContainer: { flexDirection: 'row', alignItems: 'center' },
  mainWrapper: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 36,
    height: 36,
    marginRight: 10 * widthRatio,
    backgroundColor: 'rgba(51,153,255,0.25)',
    borderRadius: 25,
  },
  nameContainer: { width: '100%' },
  messageContainer: {
    width: '70%',
    flexShrink: 1,
    backgroundColor: theme.color.secondary,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  imageContainer: { flexDirection: 'row', alignItems: 'center' },
  imageStyle: { marginRight: 10 },
  textStyle: {
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
