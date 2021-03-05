import { StyleSheet } from 'react-native';
import theme from '../../../resources/theme';
import { deviceHeight } from '../../../utils/consts';

export default StyleSheet.create({
  fullFlex: { flex: 1 },
  bottomSheetOuterContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  chatWrapperStyle: {
    flex: 1,
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
  },
  bottomSheetInnerContainer: {
    backgroundColor: 'white',
    height: deviceHeight - 80,
  },
});
