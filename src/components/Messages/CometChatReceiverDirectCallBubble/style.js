import { StyleSheet } from 'react-native';
import { widthRatio } from '../../../utils/consts';
import theme from '../../../resources/theme';

export default StyleSheet.create({
  marginBottom: 16,
  mainContainer: { flexDirection: 'row' },
  mainWrapper: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 36,
    height: 36,
    marginRight: 10 * widthRatio,
    backgroundColor: 'rgba(51,153,255,0.25)',
    borderRadius: 25,
    marginTop: 30,
  },
  nameContainer: { width: '100%' },
  messageContainer: {
    width: '70%',
    flexShrink: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 15,
    alignSelf: 'flex-start',
  },
  imageContainer: { flexDirection: 'row', alignItems: 'center' },
  imageStyle: { marginRight: 10 },
  textStyle: {
    fontSize: 16,
    width: '80%',
    color: theme.color.primary,
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
