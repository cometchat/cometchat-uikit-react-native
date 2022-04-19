import { StyleSheet } from 'react-native';
import theme from '../../../resources/theme';
export default StyleSheet.create({
  containerStyle: {
    flexDirection: 'row',
    marginTop: 5,
  },
  msgTimestampStyle: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.color.helpText,

    textTransform: 'uppercase',
  },
  tickImageStyle: {
    marginLeft: 3,
    width: 14,
    height: 10,
  },
});
