import { StyleSheet } from 'react-native';
import { heightRatio } from '../../../utils/consts';

export default StyleSheet.create({
  stickerMsgStyle: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: '35%',
  },
  stickerMsgTxtStyle: {
    // margin: 0,
    // height: 30,
    fontSize: 24,
    fontWeight: '600',
  },
  sectionListItemStyle: {
    height: 35,
    width: 35,
    flexShrink: 0,
    marginHorizontal: 8,
  },
  stickerItemStyle: {
    minWidth: 50,
    minHeight: 50,
    maxWidth: 70,
    maxHeight: 70,
    flexShrink: 0,
    marginRight: 20,
  },

  stickerListStyle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 20,
    paddingBottom: 10,
  },
  stickerSectionListStyle: {
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stickerWrapperStyle: {
    borderWidth: 1,
    borderRadius: 10,
    flexDirection:"column",
    height: 230 * heightRatio,
    alignItems:"flex-end"
  },
});
