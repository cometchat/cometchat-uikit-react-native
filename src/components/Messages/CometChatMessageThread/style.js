import { StyleSheet } from 'react-native';

import { heightRatio, widthRatio, deviceHeight } from '../../../utils/consts';

export default StyleSheet.create({
  wrapperStyle: {
    height: 585 * heightRatio,
  },
  fullFlex: { flex: 1 },
  separatorLine: {
    borderWidth: 0.5,
    flex: 1,
    alignSelf: 'center',
  },
  separatorContainer: {
    paddingTop: 5 * heightRatio,
    paddingBottom: 5 * heightRatio,
    justifyContent: 'center',
  },
  messageContainerStyle: { paddingHorizontal: 5 * widthRatio, flex: 1 },
  headerStyle: {
    height: 55 * heightRatio,
    justifyContent: 'center',
    borderWidth: 1,
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
    paddingTop: 5 * heightRatio,
  },
  messageSeparatorStyle: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    maxHeight: 0.2 * deviceHeight,
  },
  messageReplyStyle: {
    paddingHorizontal: 10 * widthRatio,
    fontSize: 17,
  },
});
