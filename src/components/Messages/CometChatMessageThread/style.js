import { Dimensions, StyleSheet } from 'react-native';

import { heightRatio, widthRatio } from '../../../utils/consts';

export default StyleSheet.create({
  wrapperStyle: {
    height: 585 * heightRatio,
  },
  headerStyle: {
    height: 55 * heightRatio,
    justifyContent: 'center',
  },
  headerWrapperStyle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCloseStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 35,
  },
  headerDetailStyle: {
    alignItems: 'center',
    height: '100%',
    width: '65%',
    paddingVertical: 10,
  },
  headerTitleStyle: {
    fontSize: 22,
    fontWeight: '600',
  },
  headerNameStyle: {
    fontSize: 17,
  },
  parentMessageStyle: {
    height: 120 * heightRatio,
    justifyContent: 'center',
  },
  messageSeparatorStyle: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    maxHeight: 0.2 * Dimensions.get('window').height,
  },
  messageReplyStyle: {
    paddingHorizontal: 10 * widthRatio,
    fontSize: 17,
  },
});