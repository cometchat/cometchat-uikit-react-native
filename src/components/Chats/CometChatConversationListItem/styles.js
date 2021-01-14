import { StyleSheet } from 'react-native';
import { widthRatio } from '../../../utils/consts';

export default StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxHeight: 62,
    paddingHorizontal: 20,
  },
  avatarStyle: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 44,
    height: 44,
    marginRight: 15 * widthRatio,
    justifyContent: 'center',
    borderWidth: 1,
  },
  itemDetailsContainer: {
    height: '100%',
    borderBottomWidth: 0.5,
    flex: 1,
    paddingBottom: 15,
    paddingTop: 15,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  itemLastMsgTimeStyle: {
    fontSize: 14,
    fontWeight: '200',
    maxWidth: '100%',
    marginLeft: 2,
  },
  itemNameStyle: {
    fontSize: 18,
    fontWeight: '600',
    width: '100%',
  },
  itemMsgStyle: {
    width: '80%',
  },
  itemRowStyle: {
    width: '20%',
    alignItems: 'center',
  },
  itemLastMsgStyle: {
    marginBottom: 2,
  },
  itemThumbnailStyle: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: 44,
    height: 44,
    backgroundColor: 'rgba(51,153,255,0.25)',
    borderRadius: 25,
  },
});
